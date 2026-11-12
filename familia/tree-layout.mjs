// What the tree view shows and where, free of the DOM. Positions are worked out
// from the center of the active person's card and the canvas is symmetric around
// it, so centering the canvas in the viewport centers the person.
const MAX_PARTNERS = 2;
const CIRCLE_SIZE = 34;
const CIRCLE_GAP = 8;
const CIRCLE_GROUP_GAP = 24;
const REGULAR = { cardWidth: 224, cardHeight: 124, leafSpacing: 264, coupleGap: 56, rowGap: 76, busDrop: 18, circleLinkGap: 14, childGap: 22, paddingX: 24, paddingY: 14 };
const COMPACT = { cardWidth: 156, cardHeight: 142, leafSpacing: 172, coupleGap: 32, rowGap: 70, busDrop: 14, circleLinkGap: 12, childGap: 20, paddingX: 8, paddingY: 12 };

// Parent profiles contain their documented children, including half siblings.
// Record only known shared parents; an unknown other parent proves nothing.
export function collectSiblings(person, parents) {
  const siblings = new Map();
  for (const parent of parents.filter(Boolean)) {
    for (const child of parent.children || []) {
      if (child.id === person.id) continue;
      if (!siblings.has(child.id)) siblings.set(child.id, { ...child, sharedParents: [] });
      const sharedParents = siblings.get(child.id).sharedParents;
      if (!sharedParents.includes(parent.id)) sharedParents.push(parent.id);
    }
  }
  for (const sibling of person.siblingSummaries || []) {
    if (sibling.id !== person.id && !siblings.has(sibling.id)) siblings.set(sibling.id, { ...sibling, sharedParents: [] });
  }
  return [...siblings.values()].sort((a, b) => a.name.localeCompare(b.name, 'es', { sensitivity: 'base' }));
}

export async function collectTree(id, depth, getPerson) {
  const ancestors = [];
  async function visit(personId, level, slot, path) {
    if (path.has(personId)) return;
    const person = await getPerson(personId);
    ancestors.push({ person, level, slot });
    if (level >= depth) return;
    const nextPath = new Set(path).add(personId);
    await Promise.all([
      person.father ? visit(person.father, level + 1, slot * 2, nextPath) : null,
      person.mother ? visit(person.mother, level + 1, slot * 2 + 1, nextPath) : null,
    ]);
  }
  await visit(id, 0, 0, new Set());
  ancestors.sort((a, b) => a.level - b.level || a.slot - b.slot);
  const shown = (ancestors[0].person.partners || []).slice(0, MAX_PARTNERS);
  const partners = await Promise.all(shown.map(async partner => ({ ...partner, person: await getPerson(partner.id) })));
  // Only the active person's siblings get nodes of their own; for everyone else a
  // sibling already in view is just marked as such. Fetch the person so direct
  // ancestors retain their full-size appearance.
  const visible = new Set([...ancestors.map(node => node.person.id), ...partners.map(item => item.person.id)]);
  const owners = [...ancestors.map(node => node.person), ...partners.map(item => item.person)];
  const seen = new Set(visible);
  const siblings = [];
  const siblingLinks = [];
  for (const owner of owners) {
    const parents = await Promise.all([owner.father, owner.mother].map(parent => parent ? getPerson(parent) : null));
    for (const summary of collectSiblings(owner, parents)) {
      if (visible.has(summary.id)) {
        siblingLinks.push({ ownerId: owner.id, siblingId: summary.id, siblingName: summary.name });
        continue;
      }
      if (owner.id !== id || seen.has(summary.id)) continue;
      seen.add(summary.id);
      siblings.push({ ownerId: owner.id, person: await getPerson(summary.id) });
    }
  }
  return { ancestors, partners, siblings, siblingLinks };
}

function ancestorRelation({ level, slot }) {
  if (level === 0) return '';
  if (level === 1) return slot === 0 ? 'Padre' : 'Madre';
  return `Ascendiente · generación ${level + 1}`;
}

function circleCenters(center, count) {
  const first = center - ((count - 1) * (CIRCLE_SIZE + CIRCLE_GAP)) / 2;
  return Array.from({ length: count }, (_, index) => first + index * (CIRCLE_SIZE + CIRCLE_GAP));
}

export function layoutTree({ ancestors, partners = [], siblings = [], siblingLinks = [], depth, compact = false }) {
  const size = compact ? COMPACT : REGULAR;
  const { cardWidth, cardHeight, circleLinkGap, childGap } = size;
  const active = ancestors[0].person;
  const maxLevel = Math.max(...ancestors.map(node => node.level));
  const siblingGap = 12;
  const siblingCounts = new Map();
  const upperOwners = new Set(ancestors.filter(node => node.level > 0).map(node => node.person.id));
  for (const item of siblings.filter(item => upperOwners.has(item.ownerId))) {
    const width = item.person.isDirectAncestor ? cardWidth : CIRCLE_SIZE;
    siblingCounts.set(item.ownerId, (siblingCounts.get(item.ownerId) || 0) + width + siblingGap);
  }
  // Two adjacent branches can both extend towards the space between them.
  const maxSiblingWidth = Math.max(0, ...siblingCounts.values());
  const leafSpacing = Math.max(size.leafSpacing, cardWidth + 2 * maxSiblingWidth + siblingGap);
  const spread = 2 ** maxLevel * leafSpacing;
  const partnerOffset = cardWidth + size.coupleGap;

  const ancestorCards = ancestors.map(node => ({
    ...node,
    relation: [ancestorRelation(node), ...(siblingLinks.some(link => link.ownerId === node.person.id) ? ['Hermano/a'] : [])].filter(Boolean).join(" · "),
    isActive: node.level === 0,
    center: ((node.slot + 0.5) / 2 ** node.level - 0.5) * spread,
  }));
  const partnerCards = partners.map(({ person, sharedChildren }, index) => ({
    person,
    level: 0,
    relation: 'Cónyuge',
    isActive: false,
    center: index === 0 ? partnerOffset : -partnerOffset,
    sharedChildren,
  }));
  const cards = [...ancestorCards, ...partnerCards];
  const siblingItems = [];
  // Each ancestral pair opens outwards: father to the left, mother to the right.
  function placeSiblings(card, side, edge) {
    let cursor = edge;
    for (const item of siblings.filter(item => item.ownerId === card.person.id)) {
      const fullSize = Boolean(item.person.isDirectAncestor);
      const width = fullSize ? cardWidth : CIRCLE_SIZE;
      const height = fullSize ? cardHeight : CIRCLE_SIZE;
      const center = cursor + side * (siblingGap + width / 2);
      siblingItems.push({ ...item, owner: card, center, width, height, fullSize, side });
      cursor += side * (siblingGap + width);
    }
    return cursor;
  }
  for (const card of ancestorCards.filter(card => card.level > 0)) {
    const side = card.slot % 2 === 0 ? -1 : 1;
    placeSiblings(card, side, card.center + side * cardWidth / 2);
  }
  // The active person and their partner(s) use the outside of the couple.
  const activeCards = cards.filter(card => card.level === 0);
  let left = Math.min(...activeCards.map(card => card.center - cardWidth / 2));
  let right = Math.max(...activeCards.map(card => card.center + cardWidth / 2));
  for (const card of [...activeCards].sort((a, b) => Number(a.isActive) - Number(b.isActive))) {
    const side = card.isActive ? -1 : Math.sign(card.center);
    if (side < 0) left = placeSiblings(card, side, left);
    else right = placeSiblings(card, side, right);
  }

  // The parents of the farthest visible ancestors, and those of a partner, are
  // circles. Only circles above the top row need room of their own: a partner's
  // fit in the gap under the row of parents.
  const cardsWithParentCircles = cards
    .filter(card => (card.level === depth || partnerCards.includes(card)) && card.person.parentSummaries?.length);
  const needsOuterRoute = siblingItems.some(item => item.owner.level === 0 && cards.some(other => other !== item.owner && other.level === 0 &&
    (other.center - item.owner.center) * item.side > 0 && (item.center - other.center) * item.side > 0));
  const headroom = Math.max(
    cardsWithParentCircles.some(card => card.level === maxLevel) ? CIRCLE_SIZE + circleLinkGap : 0,
    needsOuterRoute && maxLevel === 0 ? CIRCLE_SIZE + circleLinkGap + 6 : 0,
  );
  const rowY = level => size.paddingY + headroom + (maxLevel - level) * (cardHeight + size.rowGap);
  const activeY = rowY(0);
  const activeBottom = activeY + cardHeight;
  const coupleLineY = activeY + cardHeight / 2;
  const childRowY = activeBottom + childGap;

  const parentCircles = cardsWithParentCircles.flatMap(card => {
    const centers = circleCenters(card.center, card.person.parentSummaries.length);
    return card.person.parentSummaries.map((person, index) => ({ person, center: centers[index], y: rowY(card.level) - circleLinkGap - CIRCLE_SIZE }));
  });

  // Children hang from the line between their two parents when both are shown,
  // and otherwise from the active person alone.
  const children = active.children || [];
  const sharedWithShown = new Set(partnerCards.flatMap(card => card.sharedChildren));
  const childGroups = [
    ...partnerCards.map(card => ({ anchor: card.center / 2, fromY: coupleLineY, members: children.filter(child => card.sharedChildren.includes(child.id)) })),
    { anchor: 0, fromY: activeBottom, members: children.filter(child => !sharedWithShown.has(child.id)) },
  ].filter(group => group.members.length).sort((a, b) => a.anchor - b.anchor);
  let nextFree = -Infinity;
  for (const group of childGroups) {
    const groupWidth = group.members.length * (CIRCLE_SIZE + CIRCLE_GAP) - CIRCLE_GAP;
    const left = Math.max(group.anchor - groupWidth / 2, nextFree);
    group.centers = circleCenters(left + groupWidth / 2, group.members.length);
    nextFree = left + groupWidth + CIRCLE_GROUP_GAP;
  }
  const childCircles = childGroups.flatMap(group => group.members.map((person, index) => ({ person, center: group.centers[index], y: childRowY })));
  const circles = [...parentCircles, ...childCircles];

  const reach = Math.max(
    ...cards.map(card => Math.abs(card.center) + cardWidth / 2),
    ...circles.map(circle => Math.abs(circle.center) + CIRCLE_SIZE / 2),
    ...siblingItems.map(card => Math.abs(card.center) + card.width / 2),
  );
  const width = 2 * (reach + size.paddingX);
  const height = (childCircles.length ? childRowY + CIRCLE_SIZE : activeBottom) + size.paddingY;
  const canvasX = center => width / 2 + center;

  const connections = [];
  for (const parent of ancestorCards.filter(card => card.level > 0)) {
    const child = ancestorCards.find(card => card.level === parent.level - 1 && card.slot === Math.floor(parent.slot / 2));
    const bottom = rowY(parent.level) + cardHeight;
    connections.push(`M ${canvasX(parent.center)} ${bottom} V ${bottom + size.busDrop} H ${canvasX(child.center)} V ${rowY(child.level)}`);
  }
  for (const card of cardsWithParentCircles) {
    const top = rowY(card.level);
    for (const center of circleCenters(card.center, card.person.parentSummaries.length)) {
      connections.push(`M ${canvasX(center)} ${top - circleLinkGap} V ${top - circleLinkGap / 2} H ${canvasX(card.center)} V ${top}`);
    }
  }
  const siblingConnections = [];
  for (const owner of cards) {
    const items = siblingItems.filter(item => item.owner === owner);
    if (!items.length) continue;
    // Route above a partner that sits between the owner and their group. The
    // route also clears the partner's parent circles and their connecting lines.
    const side = items[0].side;
    const blocked = cards.some(other => other !== owner && other.level === owner.level &&
      (other.center - owner.center) * side > 0 && (items[0].center - other.center) * side > 0);
    let edge = owner.center + side * cardWidth / 2;
    const y = rowY(owner.level) + cardHeight / 2;
    if (blocked) {
      const first = items[0];
      const routeY = rowY(owner.level) - CIRCLE_SIZE - circleLinkGap - 5;
      const anchor = owner.center + side * cardWidth / 4;
      const firstTop = rowY(owner.level) + (cardHeight - first.height) / 2;
      siblingConnections.push(`M ${canvasX(anchor)} ${rowY(owner.level)} V ${routeY} H ${canvasX(first.center)} V ${firstTop}`);
      edge = first.center + side * first.width / 2;
    }
    for (const item of blocked ? items.slice(1) : items) {
      const near = item.center - side * item.width / 2;
      siblingConnections.push(`M ${canvasX(edge)} ${y} H ${canvasX(near)}`);
      edge = item.center + side * item.width / 2;
    }
  }
  for (const card of partnerCards) {
    const side = Math.sign(card.center);
    connections.push(`M ${canvasX(side * cardWidth / 2)} ${coupleLineY} H ${canvasX(card.center - side * cardWidth / 2)}`);
  }
  for (const group of childGroups) {
    for (const center of group.centers) {
      connections.push(`M ${canvasX(group.anchor)} ${group.fromY} V ${activeBottom + childGap / 2} H ${canvasX(center)} V ${childRowY}`);
    }
  }

  return {
    width,
    height,
    cardWidth,
    cardHeight,
    circleSize: CIRCLE_SIZE,
    activeCenterY: coupleLineY,
    cards: cards.map(({ person, relation, isActive, center, level }) => ({ person, relation, isActive, x: canvasX(center) - cardWidth / 2, y: rowY(level) })),
    siblingCards: siblingItems.filter(item => item.fullSize).map(({ person, owner, center, width, height }) => ({
      person, ownerId: owner.person.id, relation: 'Hermano/a', fullSize: true, width, height,
      x: canvasX(center) - width / 2, y: rowY(owner.level),
    })),
    siblingCircles: siblingItems.filter(item => !item.fullSize).map(({ person, owner, center, width, height }) => ({
      person, ownerId: owner.person.id, relation: 'Hermano/a', width, height,
      x: canvasX(center) - width / 2, y: rowY(owner.level) + (cardHeight - height) / 2,
    })),
    siblingLabels: cards.flatMap(owner => {
      const first = siblingItems.find(item => item.owner === owner && !item.fullSize);
      return first ? [{ x: canvasX(first.center), y: rowY(owner.level) + (cardHeight - CIRCLE_SIZE) / 2 - 16, text: 'Hermano/a' }] : [];
    }),
    siblingConnections,
    circles: circles.map(({ person, center, y }) => ({ person, x: canvasX(center) - CIRCLE_SIZE / 2, y })),
    connections,
  };
}
