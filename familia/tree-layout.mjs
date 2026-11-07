// What the tree view shows and where, free of the DOM. Positions are worked out
// from the center of the active person's card and the canvas is symmetric around
// it, so centering the canvas in the viewport centers the person.
const MAX_PARTNERS = 2;
const CIRCLE_SIZE = 34;
const CIRCLE_GAP = 8;
const CIRCLE_GROUP_GAP = 24;
const REGULAR = { cardWidth: 224, cardHeight: 124, leafSpacing: 264, coupleGap: 56, rowGap: 76, busDrop: 18, circleLinkGap: 14, childGap: 22, paddingX: 24, paddingY: 14 };
const COMPACT = { cardWidth: 156, cardHeight: 142, leafSpacing: 172, coupleGap: 32, rowGap: 70, busDrop: 14, circleLinkGap: 12, childGap: 20, paddingX: 8, paddingY: 12 };

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
  return { ancestors, partners };
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

export function layoutTree({ ancestors, partners = [], depth, compact = false }) {
  const size = compact ? COMPACT : REGULAR;
  const { cardWidth, cardHeight, circleLinkGap, childGap } = size;
  const active = ancestors[0].person;
  const maxLevel = Math.max(...ancestors.map(node => node.level));
  const spread = 2 ** maxLevel * size.leafSpacing;
  const partnerOffset = cardWidth + size.coupleGap;

  const ancestorCards = ancestors.map(node => ({
    ...node,
    relation: ancestorRelation(node),
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

  // The parents of the farthest visible ancestors, and those of a partner, are
  // circles. Only circles above the top row need room of their own: a partner's
  // fit in the gap under the row of parents.
  const cardsWithParentCircles = cards
    .filter(card => (card.level === depth || partnerCards.includes(card)) && card.person.parentSummaries?.length);
  const headroom = cardsWithParentCircles.some(card => card.level === maxLevel) ? CIRCLE_SIZE + circleLinkGap : 0;
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
    circles: circles.map(({ person, center, y }) => ({ person, x: canvasX(center) - CIRCLE_SIZE / 2, y })),
    connections,
  };
}
