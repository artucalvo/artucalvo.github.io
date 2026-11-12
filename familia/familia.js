import { lifespan } from './lifespan.mjs';
import { collectTree, layoutTree, collectSiblings } from './tree-layout.mjs?v=5';

const $ = (selector, root = document) => root.querySelector(selector);
const SVG_NS = 'http://www.w3.org/2000/svg';
const ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const PAGE_SIZE = 40;
const recordCache = new Map();
let catalog;
let directoryPromise;
let directory;
let activeId;
let treeWidth = 640;
let treeHeight = 430;
let activeCenterY = 0;
let compactTree = matchMedia('(max-width: 600px)').matches;
let zoom = 1;
let treeRequest = 0;
let profileRequest = 0;
let indexRequest = 0;
let indexTab = 'people';
let indexFilter = null;
let resultLimit = PAGE_SIZE;
let placesMapPromise;
let placesMapRequest = 0;
const rootHistory = [];

function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function icon(name) {
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('class', 'icon');
  svg.setAttribute('aria-hidden', 'true');
  const use = document.createElementNS(SVG_NS, 'use');
  use.setAttribute('href', `#i-${name}`);
  svg.append(use);
  return svg;
}

function button(text, className, action, iconName) {
  const node = element('button', className);
  node.type = 'button';
  if (iconName) node.append(icon(iconName));
  node.append(element('span', '', text));
  node.addEventListener('click', action);
  return node;
}

function announce(message) {
  $('#announcer').textContent = message;
}

function initials(person) {
  return `${person.givenNames?.[0] || person.name[0]}${person.surnames?.[0]?.[0] || ''}`.toLocaleUpperCase('es');
}

function dateLabel(value) {
  if (!value) return '';
  if (/^\d{4}$/.test(value)) return value;
  if (/^\d{4}-\d{2}$/.test(value)) {
    return new Intl.DateTimeFormat('es', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${value}-01T12:00:00Z`));
  }
  const parsed = new Date(`${value}T12:00:00Z`);
  return Number.isNaN(parsed.getTime()) ? value : new Intl.DateTimeFormat('es', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(parsed);
}

async function readJSON(path) {
  const response = await fetch(new URL(path, import.meta.url), { cache: 'no-cache' });
  if (!response.ok) throw new Error(`No se pudo cargar ${path} (${response.status}).`);
  return response.json();
}

function getPerson(id) {
  if (!ID_PATTERN.test(id || '')) return Promise.reject(new Error('Identificador de persona no válido.'));
  if (recordCache.has(id)) {
    const cached = recordCache.get(id);
    recordCache.delete(id);
    recordCache.set(id, cached);
    return cached;
  }
  const request = readJSON(`data/people/${id}.json`).then(person => {
    if (person.id !== id || !person.name) throw new Error('La ficha no es válida.');
    return person;
  }).catch(error => {
    recordCache.delete(id);
    throw error;
  });
  recordCache.set(id, request);
  if (recordCache.size > 80) recordCache.delete(recordCache.keys().next().value);
  return request;
}

function getDirectory() {
  if (!directoryPromise) {
    directoryPromise = readJSON('data/index.json').then(value => {
      directory = value;
      return value;
    }).catch(error => {
      directoryPromise = null;
      throw error;
    });
  }
  return directoryPromise;
}

function updateURL() {
  const hash = `#${new URLSearchParams({ persona: activeId })}`;
  if (location.hash !== hash) history.pushState(null, '', hash);
}

function locationPerson() {
  const person = new URLSearchParams(location.hash.slice(1)).get('persona');
  return ID_PATTERN.test(person || '') ? person : catalog.defaultPerson;
}

function updateRootTabs() {
  document.querySelectorAll('[data-root-id]').forEach(node => {
    const active = node.dataset.rootId === activeId;
    node.classList.toggle('is-active', active);
    node.setAttribute('aria-pressed', String(active));
  });
  $('#tree-back').hidden = rootHistory.length === 0;
}

async function navigate(id, { writeURL = true, remember = true, focus = false, scrollToProfile = focus } = {}) {
  if (!ID_PATTERN.test(id || '')) return;
  if (remember && activeId && activeId !== id) {
    rootHistory.push(activeId);
    if (rootHistory.length > 30) rootHistory.shift();
  }
  activeId = id;
  updateRootTabs();
  if (writeURL) updateURL();
  await Promise.all([renderTree(), renderProfile(id, focus)]);
  // Last, because centering the tree would cancel a smooth page scroll in progress.
  if (scrollToProfile && id === activeId && matchMedia('(max-width: 850px)').matches) $('#person-panel').scrollIntoView({ block: 'start' });
}

// Pressing someone in the tree keeps the tree in view, so the centering can be seen.
function centerOnPerson(id) {
  navigate(id, { focus: true, scrollToProfile: false });
}

function personCard({ person, relation, isActive, x, y, width: ownWidth }, width) {
  const wrapper = element('div', `tree-node${isActive ? ' is-selected' : ''}`);
  wrapper.style.left = `${x}px`;
  wrapper.style.top = `${y}px`;
  wrapper.style.width = `${ownWidth || width}px`;
  const card = element('button', 'person-node');
  card.type = 'button';
  card.setAttribute('aria-label', `Ver ficha de ${person.name}${ownWidth ? `, ${relation}` : ''}`);
  card.setAttribute('aria-pressed', String(isActive));
  card.addEventListener('click', () => centerOnPerson(person.id));
  const topline = element('span', 'node-topline');
  topline.append(element('span', 'node-avatar', initials(person)));
  if (relation) topline.append(element('span', 'node-relation', relation));
  card.append(topline, element('strong', 'node-name', person.name));
  const life = lifespan(person);
  if (life) card.append(element('span', 'node-dates', life));
  const place = person.birth?.place || person.origins?.[0];
  if (place) {
    const label = element('span', 'node-place');
    label.append(icon('pin'), document.createTextNode(place));
    card.append(label);
  }
  wrapper.append(card);
  return wrapper;
}

function personCircle({ person, x, y, ownerName }, size) {
  const circle = element('button', `tree-circle${ownerName ? ' is-sibling' : ''}`, initials(person));
  circle.type = 'button';
  circle.title = ownerName ? 'Hermano/a' : person.name;
  circle.setAttribute('aria-label', `Ver ficha de ${person.name}${ownerName ? `, hermano/a de ${ownerName}` : ''}`);
  circle.style.left = `${x}px`;
  circle.style.top = `${y}px`;
  circle.style.width = `${size}px`;
  circle.style.height = `${size}px`;
  circle.addEventListener('click', () => ownerName ? navigate(person.id, { focus: true }) : centerOnPerson(person.id));
  return circle;
}

async function renderTree() {
  const request = ++treeRequest;
  const canvas = $('#tree-canvas');
  const viewport = $('#tree-viewport');
  viewport.setAttribute('aria-busy', 'true');
  try {
    const depth = Number($('#generation-depth').value);
    const tree = await collectTree(activeId, depth, getPerson);
    if (request !== treeRequest) return;
    compactTree = matchMedia('(max-width: 600px)').matches;
    const layout = layoutTree({ ...tree, depth, compact: compactTree });
    treeWidth = layout.width;
    treeHeight = layout.height;
    activeCenterY = layout.activeCenterY;
    const lines = document.createElementNS(SVG_NS, 'svg');
    lines.classList.add('tree-connections');
    lines.setAttribute('width', String(treeWidth));
    lines.setAttribute('height', String(treeHeight));
    lines.setAttribute('aria-hidden', 'true');
    for (const connection of layout.connections) {
      const path = document.createElementNS(SVG_NS, 'path');
      path.setAttribute('d', connection);
      lines.append(path);
    }
    for (const connection of layout.siblingConnections) {
      const path = document.createElementNS(SVG_NS, 'path');
      path.classList.add('sibling-connection');
      path.setAttribute('d', connection);
      lines.append(path);
    }
    const ownerNames = new Map([...tree.ancestors.map(({ person }) => person), ...tree.partners.map(({ person }) => person)].map(person => [person.id, person.name]));
    const siblingCircles = layout.siblingCircles.map(circle => ({ ...circle, ownerName: ownerNames.get(circle.ownerId) }));
    const labels = layout.siblingLabels.map(({ x, y, text }) => {
      const label = element('span', 'sibling-label', text);
      label.style.left = `${x}px`;
      label.style.top = `${y}px`;
      label.setAttribute('aria-hidden', 'true');
      return label;
    });
    canvas.replaceChildren(lines, ...layout.cards.map(card => personCard(card, layout.cardWidth)), ...layout.siblingCards.map(card => personCard(card, layout.cardWidth)), ...layout.circles.map(circle => personCircle(circle, layout.circleSize)), ...siblingCircles.map(circle => personCircle(circle, layout.circleSize)), ...labels);
    applyZoom();
    centerTree();
  } catch (error) {
    if (request !== treeRequest) return;
    canvas.replaceChildren(errorMessage('No hemos podido cargar esta rama.', renderTree));
    announce('No se ha podido cargar la rama. Puedes volver a intentarlo.');
  } finally {
    if (request === treeRequest) viewport.setAttribute('aria-busy', 'false');
  }
}

function applyZoom() {
  const viewport = $('#tree-viewport');
  $('#tree-sizer').style.width = `${treeWidth * zoom}px`;
  $('#tree-sizer').style.height = `${treeHeight * zoom}px`;
  $('#tree-canvas').style.width = `${treeWidth}px`;
  $('#tree-canvas').style.height = `${treeHeight}px`;
  $('#tree-canvas').style.transform = `scale(${zoom})`;
  $('#tree-canvas').style.left = `${Math.max(0, (viewport.clientWidth - treeWidth * zoom) / 2)}px`;
  $('#tree-canvas').style.top = `${Math.max(0, (viewport.clientHeight - treeHeight * zoom) / 2)}px`;
  $('#zoom-level').textContent = `${Math.round(zoom * 100)} %`;
  $('#zoom-out').disabled = zoom <= 0.6;
  $('#zoom-in').disabled = zoom >= 1.4;
}

// The canvas is symmetric around the active person. When a tall tree does not
// fit, the browser stops the vertical scroll at the end of the tree.
function centerTree() {
  const viewport = $('#tree-viewport');
  viewport.scrollTo({ left: (treeWidth * zoom - viewport.clientWidth) / 2, top: activeCenterY * zoom - viewport.clientHeight / 2, behavior: 'instant' });
}

function errorMessage(text, retry) {
  const box = element('div', 'error-state');
  box.append(element('p', '', text), button('Volver a intentar', 'button button-secondary retry-button', retry));
  return box;
}

async function relatedPerson(id) {
  if (!id) return null;
  return getPerson(id);
}

function relationLink(person, label) {
  const link = element('a', 'family-link');
  link.href = `#${new URLSearchParams({ persona: person.id })}`;
  const text = element('span');
  if (label) text.append(element('span', 'relation-label', label));
  text.append(element('span', 'relation-name', person.name));
  link.append(text, icon('arrow-right'));
  link.addEventListener('click', event => {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    navigate(person.id, { focus: true });
  });
  return link;
}

function addTranscription(container, text) {
  if (!text) return;
  const details = element('details', 'transcription');
  details.append(element('summary', '', 'Leer transcripción'));
  text.split(/\n{2,}/).forEach(paragraph => details.append(element('p', '', paragraph)));
  container.append(details);
}

function eventHasData(event) {
  return event && (event.date || event.place || event.note || event.spouse || event.transcription);
}

function dateLine(value) {
  const time = element('time', 'event-date', dateLabel(value));
  time.dateTime = value;
  return time;
}

function eventBlock(title, event, spouse) {
  if (!eventHasData(event)) return null;
  const section = element('section', 'event-item');
  section.append(element('span', 'event-marker'), element('h3', '', title));
  if (event.date) section.append(dateLine(event.date));
  if (event.place) section.append(element('p', 'event-place', event.place));
  if (spouse) {
    const link = relationLink(spouse, 'Cónyuge');
    link.classList.add('event-spouse');
    section.append(link);
  }
  if (event.note) section.append(element('p', 'event-note', event.note));
  addTranscription(section, event.transcription);
  return section;
}

async function renderProfile(id, focus = false) {
  const request = ++profileRequest;
  const panel = $('#person-panel');
  panel.setAttribute('aria-busy', 'true');
  try {
    const person = await getPerson(id);
    const [father, mother, ...spouses] = await Promise.all([
      relatedPerson(person.father), relatedPerson(person.mother),
      ...(person.marriages || []).map(marriage => relatedPerson(marriage.spouse)),
    ]);
    if (request !== profileRequest) return;
    const header = element('header', 'profile-header');
    const avatar = element('div', 'profile-avatar', initials(person));
    avatar.setAttribute('aria-hidden', 'true');
    const heading = element('h2', 'profile-name', person.name);
    heading.tabIndex = -1;
    header.append(avatar, heading);
    if (lifespan(person)) header.append(element('p', 'profile-years', lifespan(person)));
    panel.replaceChildren(header);
    // First, so that a job is seen without scrolling down a long card.
    if (person.occupations?.length) {
      const work = element('section', 'profile-section');
      work.append(element('h3', '', person.occupations.length > 1 ? 'Profesiones' : 'Profesión'));
      person.occupations.forEach(occupation => {
        const entry = element('div', 'occupation');
        entry.append(element('p', 'occupation-name', occupation.name));
        if (occupation.date) entry.append(dateLine(occupation.date));
        if (occupation.note) entry.append(element('p', 'event-note', occupation.note));
        work.append(entry);
      });
      panel.append(work);
    }
    if (father || mother) {
      const family = element('section', 'profile-section');
      family.append(element('h3', '', 'Sus padres'));
      if (father) family.append(relationLink(father, 'Padre'));
      if (mother) family.append(relationLink(mother, 'Madre'));
      panel.append(family);
    }
    const siblingList = collectSiblings(person, [father, mother]);
    if (siblingList.length) {
      const siblings = element('section', 'profile-section');
      siblings.append(element('h3', '', 'Hermanos y hermanas'));
      siblingList.forEach(sibling => {
        const label = !sibling.sharedParents.length ? 'Hermano/a'
          : sibling.sharedParents.length > 1 ? 'Padres en común'
          : sibling.sharedParents[0] === person.father ? 'Padre en común' : 'Madre en común';
        siblings.append(relationLink(sibling, label));
      });
      panel.append(siblings);
    }
    if (person.children?.length) {
      const descendants = element('section', 'profile-section');
      descendants.append(element('h3', '', 'Descendencia'));
      person.children.forEach(child => descendants.append(relationLink(child)));
      panel.append(descendants);
    }
    const events = element('div', 'event-timeline');
    const entries = [eventBlock('Nacimiento', person.birth), eventBlock('Bautismo', person.baptism)];
    (person.marriages || []).forEach((marriage, index) => entries.push(eventBlock('Matrimonio', marriage, spouses[index])));
    entries.push(eventBlock('Fallecimiento', person.death));
    entries.push(eventBlock('Entierro', person.burial));
    events.append(...entries.filter(Boolean));
    if (events.childElementCount) panel.append(events);
    if (person.origins?.length) {
      const origins = element('section', 'profile-section');
      origins.append(element('h3', '', person.origins.length > 1 ? 'Lugares de referencia' : 'Lugar de referencia'));
      person.origins.forEach(place => {
        const line = element('p', 'profile-place');
        line.append(icon('pin'), document.createTextNode(place));
        origins.append(line);
      });
      panel.append(origins);
    }
    if (person.observations?.length) {
      const notes = element('section', 'profile-section observations');
      notes.append(element('h3', '', 'Observaciones'));
      const list = element('ul');
      person.observations.forEach(note => list.append(element('li', '', note)));
      notes.append(list);
      panel.append(notes);
    }
    announce(`Ficha de ${person.name}`);
    if (focus) heading.focus({ preventScroll: true });
  } catch (error) {
    if (request !== profileRequest) return;
    panel.replaceChildren(errorMessage('No hemos podido cargar esta ficha.', () => renderProfile(id, focus)));
    announce('No se ha podido cargar la ficha. Puedes volver a intentarlo.');
  } finally {
    if (request === profileRequest) panel.setAttribute('aria-busy', 'false');
  }
}

function normalize(value) {
  return value.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLocaleLowerCase('es');
}

function matches(value, query) {
  const normalized = normalize(value);
  return normalize(query).split(/\s+/).every(term => normalized.includes(term));
}

function openDialog(dialog) {
  dialog.showModal();
  document.body.classList.add('dialog-open');
}

async function openIndex(tab = 'people') {
  if (!$('#index-dialog').open) openDialog($('#index-dialog'));
  setIndexTab(tab);
  $('#index-query').focus();
}

function setIndexTab(tab) {
  indexTab = tab;
  indexFilter = null;
  resultLimit = PAGE_SIZE;
  $('#index-query').value = '';
  document.querySelectorAll('[data-index-tab]').forEach(button => {
    const active = button.dataset.indexTab === tab;
    button.setAttribute('aria-selected', String(active));
    button.tabIndex = active ? 0 : -1;
  });
  $('#index-results').setAttribute('aria-labelledby', `tab-${tab}`);
  $('#places-map-panel').hidden = tab !== 'places';
  $('#index-query').placeholder = tab === 'surnames' ? 'Buscar un apellido…' : tab === 'places' ? 'Buscar un lugar…' : 'Buscar una persona…';
  renderIndex();
}

async function selectIndexGroup(group, revealResults = false) {
  indexFilter = group;
  resultLimit = PAGE_SIZE;
  $('#index-query').value = '';
  $('#index-query').placeholder = 'Buscar entre estas personas…';
  await renderIndex();
  if (revealResults) {
    const firstResult = $('#index-results .index-entry');
    firstResult?.focus();
    firstResult?.scrollIntoView({ block: 'nearest' });
  } else $('#index-query').focus();
}

async function updatePlacesMap(groups) {
  const request = ++placesMapRequest;
  const panel = $('#places-map-panel');
  panel.hidden = indexTab !== 'places';
  if (panel.hidden) return;
  const status = $('#places-map-status');
  if (!placesMapPromise) {
    status.textContent = 'Preparando el mapa de nuestros lugares…';
    placesMapPromise = import('./places-map.js').then(({ createPlacesMap }) => createPlacesMap({
      container: $('#places-map'),
      status,
      fallback: $('#places-map-fallback'),
      onSelect: group => selectIndexGroup(group, true),
    })).catch(error => {
      placesMapPromise = null;
      throw error;
    });
  }
  try {
    const map = await placesMapPromise;
    if (request !== placesMapRequest || indexTab !== 'places' || !$('#index-dialog').open) return;
    map.update(groups, indexFilter?.name || null);
  } catch (error) {
    if (request !== placesMapRequest) return;
    status.textContent = 'No se ha podido abrir el mapa. La lista de lugares sigue disponible.';
    const fallback = $('#places-map-fallback');
    fallback.hidden = false;
    fallback.replaceChildren(button('Volver a cargar el mapa', 'text-button', () => updatePlacesMap(groups)));
  }
}

function groupEntry(group) {
  const row = button('', 'index-entry', () => selectIndexGroup(group, indexTab === 'places'));
  row.replaceChildren();
  const avatar = element('span', 'entry-avatar');
  avatar.append(icon(indexTab === 'places' ? 'pin' : 'leaf'));
  const text = element('span', 'entry-content');
  text.append(element('strong', 'entry-name', group.name));
  if (indexTab === 'places') text.append(element('span', 'entry-meta', group.location ? group.location.province : 'Ubicación pendiente de confirmar'));
  row.append(avatar, text, element('span', 'entry-count', String(group.people.length)), icon('arrow-right'));
  return row;
}

function personEntry(person) {
  const row = button('', 'index-entry', () => {
    $('#index-dialog').close();
    navigate(person.id, { focus: true });
  });
  row.replaceChildren();
  const text = element('span', 'entry-content');
  text.append(element('strong', 'entry-name', person.name));
  const dates = person.lifespan || lifespan(person);
  const meta = [dates, person.places?.[0]].filter(Boolean).join(' · ');
  if (meta) text.append(element('span', 'entry-meta', meta));
  row.append(element('span', 'entry-avatar', initials(person)), text, icon('arrow-right'));
  $('.entry-avatar', row).setAttribute('aria-hidden', 'true');
  return row;
}

async function renderIndex() {
  const request = ++indexRequest;
  const results = $('#index-results');
  results.setAttribute('aria-busy', 'true');
  if (!directory) results.replaceChildren(element('p', 'loading-message', 'Abriendo el archivo…'));
  try {
    const data = await getDirectory();
    if (request !== indexRequest) return;
    const query = $('#index-query').value.trim();
    const peopleMode = indexTab === 'people' || indexFilter;
    let entries;
    if (peopleMode) {
      const ids = indexFilter ? new Set(indexFilter.people) : null;
      entries = data.people.filter(person => (!ids || ids.has(person.id)) && matches([person.name, ...(person.places || [])].join(' '), query));
    } else {
      entries = data[indexTab].filter(group => matches(group.name, query));
    }
    updatePlacesMap(indexTab === 'places' ? indexFilter ? [indexFilter] : entries : []);
    const filter = $('#index-filter');
    filter.replaceChildren();
    filter.hidden = !indexFilter;
    if (indexFilter) filter.append(button(`Todos los ${indexTab === 'places' ? 'lugares' : 'apellidos'}`, 'text-button', () => setIndexTab(indexTab), 'arrow-left'), element('strong', '', indexFilter.name));
    const noun = peopleMode ? entries.length === 1 ? 'persona' : 'personas' : indexTab === 'surnames' ? entries.length === 1 ? 'apellido' : 'apellidos' : entries.length === 1 ? 'lugar' : 'lugares';
    $('#index-count').textContent = query ? `Coincidencias: ${entries.length} ${noun}` : `${entries.length} ${noun} en el archivo`;
    const fragment = document.createDocumentFragment();
    let lastLetter = '';
    for (const entry of entries.slice(0, resultLimit)) {
      if (!peopleMode) {
        const letter = entry.name[0].toLocaleUpperCase('es');
        if (letter !== lastLetter) fragment.append(element('h3', 'index-letter', letter));
        lastLetter = letter;
      }
      fragment.append(peopleMode ? personEntry(entry) : groupEntry(entry));
    }
    if (!entries.length) fragment.append(element('p', 'index-empty', 'No hay coincidencias. Prueba con otro nombre, apellido o lugar.'));
    results.replaceChildren(fragment);
    $('#index-more').hidden = entries.length <= resultLimit;
    if (entries.length > resultLimit) $('#index-more').textContent = `Mostrar más (${Math.min(PAGE_SIZE, entries.length - resultLimit)})`;
  } catch (error) {
    if (request === indexRequest) results.replaceChildren(errorMessage('No hemos podido abrir el índice.', renderIndex));
  } finally {
    if (request === indexRequest) results.setAttribute('aria-busy', 'false');
  }
}

function bindControls() {
  document.querySelectorAll('[data-open-index]').forEach(button => button.addEventListener('click', () => openIndex(button.dataset.openIndex)));
  document.querySelectorAll('[data-close-dialog]').forEach(button => button.addEventListener('click', () => document.getElementById(button.dataset.closeDialog).close()));
  document.querySelectorAll('dialog').forEach(dialog => {
    dialog.addEventListener('close', () => {
      if (!document.querySelector('dialog[open]')) document.body.classList.remove('dialog-open');
    });
    dialog.addEventListener('click', event => { if (event.target === dialog) {
      const bounds = dialog.getBoundingClientRect();
      if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) dialog.close();
    } });
  });
  document.querySelectorAll('[data-index-tab]').forEach(button => {
    button.addEventListener('click', () => setIndexTab(button.dataset.indexTab));
    button.addEventListener('keydown', event => {
      const tabs = [...document.querySelectorAll('[data-index-tab]')];
      let next;
      if (event.key === 'ArrowRight') next = (tabs.indexOf(button) + 1) % tabs.length;
      if (event.key === 'ArrowLeft') next = (tabs.indexOf(button) + tabs.length - 1) % tabs.length;
      if (event.key === 'Home') next = 0;
      if (event.key === 'End') next = tabs.length - 1;
      if (next !== undefined) {
        event.preventDefault();
        setIndexTab(tabs[next].dataset.indexTab);
        tabs[next].focus();
      }
    });
  });
  let searchTimer;
  $('#index-query').addEventListener('input', () => {
    clearTimeout(searchTimer);
    resultLimit = PAGE_SIZE;
    searchTimer = setTimeout(renderIndex, 100);
  });
  $('#index-more').addEventListener('click', () => {
    resultLimit += PAGE_SIZE;
    renderIndex();
  });
  $('#map-reset').addEventListener('click', () => setIndexTab('places'));
  $('#generation-depth').addEventListener('change', renderTree);
  $('#zoom-in').addEventListener('click', () => { zoom = Math.min(1.4, Math.round((zoom + 0.1) * 10) / 10); applyZoom(); centerTree(); });
  $('#zoom-out').addEventListener('click', () => { zoom = Math.max(0.6, Math.round((zoom - 0.1) * 10) / 10); applyZoom(); centerTree(); });
  $('#center-tree').addEventListener('click', centerTree);
  $('#tree-back').addEventListener('click', () => {
    const previous = rootHistory.pop();
    if (previous) navigate(previous, { remember: false });
  });
  document.addEventListener('keydown', event => {
    if (event.key === '/' && !event.ctrlKey && !event.metaKey && !event.altKey && !['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName) && !document.activeElement.isContentEditable && !document.querySelector('dialog[open]')) {
      event.preventDefault();
      openIndex();
    }
  });
  window.addEventListener('hashchange', () => {
    if (!catalog) return;
    if (location.hash && !new URLSearchParams(location.hash.slice(1)).has('persona')) return;
    rootHistory.length = 0;
    navigate(locationPerson(), { writeURL: false, remember: false });
  });
  new ResizeObserver(() => {
    const compact = matchMedia('(max-width: 600px)').matches;
    if (catalog && compact !== compactTree) renderTree();
    else {
      applyZoom();
      centerTree();
    }
  }).observe($('#tree-viewport'));
}

async function init() {
  bindControls();
  try {
    catalog = await readJSON('data/catalog.json');
    $('#people-count').textContent = catalog.stats.people;
    $('#surname-count').textContent = catalog.stats.surnames;
    $('#place-count').textContent = catalog.stats.places;
    for (const branch of catalog.branches) {
      for (const person of branch.roots) {
        const tab = button(person.name, 'root-tab', () => navigate(person.id));
        tab.dataset.rootId = person.id;
        tab.title = branch.label;
        $('#root-tabs').append(tab);
      }
    }
    activeId = locationPerson();
    updateRootTabs();
    await Promise.all([renderTree(), renderProfile(activeId)]);
  } catch (error) {
    const errorBox = $('#app-error');
    errorBox.hidden = false;
    errorBox.replaceChildren(errorMessage('No hemos podido abrir el archivo familiar. Comprueba tu conexión y vuelve a intentarlo.', () => location.reload()));
    $('#person-panel').setAttribute('aria-busy', 'false');
  }
}

init();
