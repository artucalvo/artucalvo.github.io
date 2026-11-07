let libraryPromise;

function node(tag, className, text) {
  const item = document.createElement(tag);
  if (className) item.className = className;
  if (text !== undefined) item.textContent = text;
  return item;
}

function loadLeaflet() {
  if (libraryPromise) return libraryPromise;
  libraryPromise = Promise.all([
    new Promise((resolve, reject) => {
      const stylesheet = document.createElement('link');
      stylesheet.rel = 'stylesheet';
      stylesheet.href = new URL('vendor/leaflet/leaflet.css', import.meta.url).href;
      stylesheet.onload = resolve;
      stylesheet.onerror = () => { stylesheet.remove(); reject(new Error('No se pudo cargar el estilo del mapa.')); };
      document.head.append(stylesheet);
    }),
    new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = new URL('vendor/leaflet/leaflet.js', import.meta.url).href;
      script.onload = () => resolve(window.L);
      script.onerror = () => { script.remove(); reject(new Error('No se pudo cargar el mapa.')); };
      document.head.append(script);
    }),
  ]).then(([, library]) => library).catch(error => {
    libraryPromise = null;
    throw error;
  });
  return libraryPromise;
}

export async function createPlacesMap({ container, status, fallback, onSelect }) {
  const L = await loadLeaflet();
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const map = L.map(container, {
    scrollWheelZoom: false,
    minZoom: 4,
    maxZoom: 18,
    maxBounds: [[26, -19], [44.5, 5.5]],
    maxBoundsViscosity: 0.8,
    zoomAnimation: !reducedMotion,
    fadeAnimation: !reducedMotion,
    zoomControl: false,
  });
  const zoomControl = L.control.zoom({ position: 'topright', zoomInTitle: 'Acercar el mapa', zoomOutTitle: 'Alejar el mapa' }).addTo(map);
  // Explicit Spanish labels also cover keyboard and screen-reader navigation.
  zoomControl.getContainer().querySelectorAll('a').forEach(link => link.setAttribute('aria-label', link.title));
  const markers = L.layerGroup().addTo(map);
  map.on('popupopen', ({ popup }) => {
    const close = popup.getElement()?.querySelector('.leaflet-popup-close-button');
    close?.setAttribute('aria-label', 'Cerrar información del lugar');
    close?.setAttribute('title', 'Cerrar información del lugar');
  });
  const tiles = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors',
  });
  let groups = [];
  let selectedName = null;
  let tilesUnavailable = false;
  let hasView = false;

  function updateStatus() {
    const unlocated = groups.filter(group => !group.location).length;
    status.textContent = tilesUnavailable
      ? 'El mapa base no está disponible. Puedes consultar los lugares y las personas en la lista.'
      : unlocated
        ? `${unlocated} ${unlocated === 1 ? 'lugar pendiente' : 'lugares pendientes'} de ubicar. La lista incluye todos los registros.`
        : 'Ubicaciones de las localidades, no de domicilios. Pulsa un lugar para ver sus personas.';
  }

  function updateFallback() {
    fallback.replaceChildren();
    fallback.hidden = !tilesUnavailable;
    if (!tilesUnavailable) return;
    fallback.append(node('p', '', 'También puedes abrir cada lugar en OpenStreetMap:'));
    const links = node('div', 'map-fallback-links');
    groups.filter(group => group.location).forEach(group => {
      const link = node('a', '', group.name);
      const { latitude, longitude } = group.location;
      link.href = `https://www.openstreetmap.org/?mlat=${latitude}&mlon=${longitude}#map=13/${latitude}/${longitude}`;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      links.append(link);
    });
    fallback.append(links);
  }

  tiles.on('tileerror', () => {
    tilesUnavailable = true;
    updateStatus();
    updateFallback();
  });
  tiles.on('tileload', () => {
    if (!tilesUnavailable) return;
    tilesUnavailable = false;
    updateStatus();
    updateFallback();
  });
  tiles.addTo(map);

  function popupFor(group) {
    const popup = node('div', 'map-place-popup');
    popup.append(node('strong', 'map-popup-name', group.name));
    const { municipality, province, latitude, longitude } = group.location;
    const context = [...new Set([municipality !== group.name ? municipality : null, province].filter(Boolean))].join(' · ');
    if (context) popup.append(node('p', 'map-popup-context', context));
    const count = group.people.length;
    const select = node('button', 'map-popup-action', `Ver ${count} ${count === 1 ? 'persona' : 'personas'}`);
    select.type = 'button';
    select.addEventListener('click', () => onSelect(group));
    popup.append(select);
    const external = node('a', 'map-popup-external', 'Abrir en OpenStreetMap ↗');
    external.href = `https://www.openstreetmap.org/?mlat=${latitude}&mlon=${longitude}#map=13/${latitude}/${longitude}`;
    external.target = '_blank';
    external.rel = 'noopener noreferrer';
    popup.append(external);
    return popup;
  }

  function clusterGroups() {
    const clusters = [];
    const cells = new Map();
    for (const group of groups.filter(group => group.location)) {
      const position = L.latLng(group.location.latitude, group.location.longitude);
      const point = map.project(position, map.getZoom());
      const cellX = Math.floor(point.x / 48);
      const cellY = Math.floor(point.y / 48);
      let cluster;
      for (let x = cellX - 1; x <= cellX + 1 && !cluster; x++) {
        for (let y = cellY - 1; y <= cellY + 1 && !cluster; y++) {
          cluster = (cells.get(`${x}:${y}`) || []).find(candidate => candidate.point.distanceTo(point) < 44);
        }
      }
      if (cluster) cluster.groups.push(group);
      else {
        cluster = { groups: [group], point };
        clusters.push(cluster);
        const key = `${cellX}:${cellY}`;
        if (!cells.has(key)) cells.set(key, []);
        cells.get(key).push(cluster);
      }
    }
    return clusters;
  }

  function drawMarkers() {
    if (!hasView) return;
    markers.clearLayers();
    for (const cluster of clusterGroups()) {
      const locations = cluster.groups.map(group => [group.location.latitude, group.location.longitude]);
      const bounds = L.latLngBounds(locations);
      const multiple = cluster.groups.length > 1;
      const group = cluster.groups[0];
      const label = multiple ? `Ampliar ${cluster.groups.length} lugares` : `${group.name}: ${group.people.length} ${group.people.length === 1 ? 'persona' : 'personas'}`;
      const badge = node('span', 'map-marker-badge', multiple ? String(cluster.groups.length) : '');
      if (!multiple) {
        const pin = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        pin.setAttribute('class', 'icon');
        pin.setAttribute('aria-hidden', 'true');
        const use = document.createElementNS('http://www.w3.org/2000/svg', 'use');
        use.setAttribute('href', '#i-pin');
        pin.append(use);
        badge.append(pin);
      }
      const marker = L.marker(multiple ? bounds.getCenter() : locations[0], {
        icon: L.divIcon({ className: `family-map-marker${multiple ? ' is-cluster' : ''}${!multiple && group.name === selectedName ? ' is-selected' : ''}`, html: badge, iconSize: [40, 40], iconAnchor: [20, 20] }),
        title: label,
        keyboard: true,
      });
      marker.on('add', () => {
        const target = marker.getElement();
        target?.setAttribute('aria-label', label);
        target?.addEventListener('keydown', event => {
          if (event.key !== 'Enter' && event.key !== ' ') return;
          event.preventDefault();
          event.stopPropagation();
          marker.fire('click', { originalEvent: event });
          const popupAction = marker.getPopup()?.getElement()?.querySelector('button');
          if (popupAction) popupAction.focus();
          else if (multiple) container.focus({ preventScroll: true });
        });
      });
      if (multiple) {
        marker.on('click', () => {
          if (map.getZoom() < 18) map.fitBounds(bounds, { padding: [38, 38], maxZoom: Math.min(18, map.getZoom() + 3), animate: false });
          else {
            const choices = node('div', 'map-place-popup');
            cluster.groups.forEach(place => {
              const choice = node('button', 'map-popup-action', place.name);
              choice.type = 'button';
              choice.addEventListener('click', () => onSelect(place));
              choices.append(choice);
            });
            marker.bindPopup(choices).openPopup();
          }
        });
      } else {
        marker.bindPopup(popupFor(group), { maxWidth: 245 });
      }
      marker.addTo(markers);
      if (!multiple && group.name === selectedName) marker.openPopup();
    }
  }
  map.on('zoomend resize', drawMarkers);

  return {
    update(nextGroups, selected = null) {
      groups = nextGroups;
      selectedName = selected;
      map.invalidateSize({ pan: false });
      const located = groups.filter(group => group.location);
      if (located.length === 1) {
        const { latitude, longitude } = located[0].location;
        map.setView([latitude, longitude], 12, { animate: false });
      } else if (located.length > 1) {
        map.fitBounds(located.map(group => [group.location.latitude, group.location.longitude]), { padding: [36, 36], maxZoom: 11, animate: false });
      } else {
        map.setView([40.1, -3.6], 5, { animate: false });
      }
      hasView = true;
      drawMarkers();
      updateStatus();
      updateFallback();
    },
  };
}
