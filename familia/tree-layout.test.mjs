// Run from the repository root with: node --test familia/tree-layout.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import { collectTree, layoutTree, collectSiblings } from './tree-layout.mjs';

const peopleDirectory = new URL('data/people/', import.meta.url);
const records = new Map();
for (const file of await readdir(peopleDirectory)) {
  const person = JSON.parse(await readFile(new URL(file, peopleDirectory), 'utf8'));
  records.set(person.id, person);
}

const summary = id => ({ id, name: `${id} name`, givenNames: id, surnames: [`${id}-surname`] });

test('siblings appear once with only their known shared parents', () => {
  const ana = { ...summary('ana'), father: 'padre', mother: 'madre' };
  const both = { ...summary('belen'), father: 'padre', mother: 'madre' };
  const fatherOnly = { ...summary('carlos'), father: 'padre', mother: 'otra-madre' };
  const motherOnly = { ...summary('diana'), mother: 'madre' };
  const father = { id: 'padre', children: [ana, both, fatherOnly] };
  const mother = { id: 'madre', children: [ana, both, motherOnly] };
  const siblings = collectSiblings(ana, [father, mother]);
  assert.deepEqual(siblings.map(({ id, sharedParents }) => ({ id, sharedParents })), [
    { id: 'belen', sharedParents: ['padre', 'madre'] },
    { id: 'carlos', sharedParents: ['padre'] },
    { id: 'diana', sharedParents: ['madre'] },
  ]);
  assert.deepEqual(collectSiblings(motherOnly, [null, mother]).map(sibling => sibling.id), ['ana', 'belen']);
  assert.deepEqual(collectSiblings(summary('unrelated'), [null, null]), []);
});
const child = (id, father) => ({ ...summary(id), mother: 'anna', ...(father ? { father } : {}) });
const parents = (father, mother) => ({
  father,
  mother,
  parentSummaries: [{ ...summary(father), relation: 'father' }, { ...summary(mother), relation: 'mother' }],
});

// Anna has three partners, children with two of those she can show, a child with
// the third and a child whose other parent is unknown. Nobody in the real data
// has more than one partner or child yet.
const anna = {
  ...summary('anna'),
  ...parents('abel', 'alba'),
  children: [
    child('c1', 'bruno'), child('c2', 'bruno'), child('c3', 'bruno'), child('c4', 'bruno'), child('c5', 'bruno'),
    child('c6', 'carlos'), child('c7', 'carlos'),
    child('c8', 'dario'),
    child('c9'),
  ],
  partners: [
    { ...summary('bruno'), sharedChildren: ['c1', 'c2', 'c3', 'c4', 'c5'] },
    { ...summary('carlos'), sharedChildren: ['c6', 'c7'] },
    { ...summary('dario'), sharedChildren: ['c8'] },
  ],
};
const annaFamily = new Map([anna,
  { ...summary('abel'), ...parents('g1', 'g2') },
  { ...summary('alba'), ...parents('g3', 'g4') },
  { ...summary('bruno'), ...parents('b1', 'b2') },
  { ...summary('carlos'), ...parents('k1', 'k2') },
  summary('dario'),
  summary('g1'), summary('g2'), summary('g3'), summary('g4'),
].map(person => [person.id, person]));

const realPerson = async id => records.get(id);
const fixturePerson = async id => annaFamily.get(id);
const realLayout = async (id, depth = 1, compact = false) => layoutTree({ ...await collectTree(id, depth, realPerson), depth, compact });
const annaLayout = async (depth = 1, compact = false) => layoutTree({ ...await collectTree('anna', depth, fixturePerson), depth, compact });

async function everyLayout(check) {
  const sources = [...[...records.keys()].map(id => [id, realPerson]), ['anna', fixturePerson]];
  for (const [id, getPerson] of sources) {
    for (const depth of [1, 2, 3]) {
      for (const compact of [false, true]) {
        check(layoutTree({ ...await collectTree(id, depth, getPerson), depth, compact }), `${id}, depth ${depth}, ${compact ? 'compact' : 'regular'}`);
      }
    }
  }
}

const ids = items => items.map(item => item.person.id).sort();
const activeCard = layout => layout.cards.find(card => card.isActive);
const card = (layout, id) => layout.cards.find(item => item.person.id === id);
const circle = (layout, id) => layout.circles.find(item => item.person.id === id);
const relation = (layout, id) => card(layout, id).relation;

const boxes = layout => [
  ...layout.cards.map(item => ({ name: `card ${item.person.id}`, x: item.x, y: item.y, width: layout.cardWidth, height: layout.cardHeight })),
  ...layout.siblingCircles.map(item => ({ name: `sibling circle ${item.person.id}`, x: item.x, y: item.y, width: item.width, height: item.height })),
  ...layout.circles.map(item => ({ name: `circle ${item.person.id}`, x: item.x, y: item.y, width: layout.circleSize, height: layout.circleSize })),
];

// Connections are drawn with absolute M, H and V commands only.
function points(path) {
  const result = [];
  for (const [, command, first, second] of path.matchAll(/([MHV]) (-?[\d.]+)(?: (-?[\d.]+))?/g)) {
    const previous = result.at(-1);
    if (command === 'M') result.push({ x: Number(first), y: Number(second) });
    if (command === 'H') result.push({ x: Number(first), y: previous.y });
    if (command === 'V') result.push({ x: previous.x, y: Number(first) });
  }
  return result;
}
const near = (a, b) => Math.abs(a - b) < 0.01;
const isAt = (point, x, y) => near(point.x, x) && near(point.y, y);
const startsAt = (path, x, y) => isAt(points(path)[0], x, y);
const endsAt = (path, x, y) => isAt(points(path).at(-1), x, y);
const hasPath = (layout, x, y, match) => layout.connections.some(path => match(path, x, y));

test('Bernardo shows his parents and his partner as cards, and the next relatives as circles', async () => {
  const layout = await realLayout('bernardo-calvo-brioso');
  assert.deepEqual(ids(layout.cards), ['bernardo-calvo-brioso', 'maria-angeles-devesa-herrero', 'nicanor-calvo-piorno', 'rosario-brioso-de-las-heras']);
  assert.deepEqual(ids(layout.circles), ['angela-de-las-heras-prada', 'antonio-devesa-blanco', 'arturo-calvo-devesa', 'bernardo-brioso-perez', 'josefa-herrero-fernandez', 'lucia-piorno-santiago', 'miguel-calvo-mendez']);
});

test('a partner with known parents gets circles for them', async () => {
  const layout = await realLayout('nicanor-calvo-piorno');
  assert.deepEqual(ids(layout.cards), ['lucia-piorno-santiago', 'miguel-calvo-mendez', 'nicanor-calvo-piorno', 'rosario-brioso-de-las-heras']);
  assert.deepEqual(ids(layout.circles), ['angela-de-las-heras-prada', 'bernardo-brioso-perez', 'bernardo-calvo-brioso', 'marcelina-mendez-maillo', 'nicanor-calvo-martin', 'salvador-piorno-tuda', 'vicenta-santiago-sastre']);
});

test('a person without partner or children shows neither, and both parents show their known parents as circles', async () => {
  const layout = await realLayout('arturo-calvo-devesa');
  assert.deepEqual(ids(layout.cards), ['arturo-calvo-devesa', 'bernardo-calvo-brioso', 'maria-angeles-devesa-herrero']);
  assert.deepEqual(ids(layout.circles), ['antonio-devesa-blanco', 'josefa-herrero-fernandez', 'nicanor-calvo-piorno', 'rosario-brioso-de-las-heras']);
});

test('adding a generation turns the circles into cards and moves the circles one level up', async () => {
  const layout = await realLayout('arturo-calvo-devesa', 2);
  assert.deepEqual(ids(layout.cards), ['antonio-devesa-blanco', 'arturo-calvo-devesa', 'bernardo-calvo-brioso', 'josefa-herrero-fernandez', 'maria-angeles-devesa-herrero', 'nicanor-calvo-piorno', 'rosario-brioso-de-las-heras']);
  assert.deepEqual(ids(layout.circles), ['adelina-fernandez-unzueta', 'angela-de-las-heras-prada', 'antonio-devesa-junquera', 'bernardo-brioso-perez', 'epifanio-herrero-cuesta', 'lucia-piorno-santiago', 'miguel-calvo-mendez', 'petra-blanco-palmero']);
});

test('a parent\'s circles sit above that parent\'s card', async () => {
  const layout = await realLayout('bernardo-calvo-brioso');
  const father = card(layout, 'nicanor-calvo-piorno');
  for (const id of ['miguel-calvo-mendez', 'lucia-piorno-santiago']) {
    const parent = circle(layout, id);
    assert.ok(parent.y + layout.circleSize <= father.y, `${id} is above the card`);
    assert.ok(parent.x >= father.x && parent.x + layout.circleSize <= father.x + layout.cardWidth, `${id} is within the width of the card`);
  }
});

test('the partner sits beside the active person, and only the partner shares that row', async () => {
  const layout = await realLayout('bernardo-calvo-brioso');
  const active = activeCard(layout);
  const partner = card(layout, 'maria-angeles-devesa-herrero');
  assert.equal(partner.y, active.y);
  assert.ok(partner.x >= active.x + layout.cardWidth, 'partner is to the right of the active card');
  assert.equal(layout.cards.filter(item => item.y === active.y).length, 2);
});

test('the active person is the card marked active and has no relation label', async () => {
  const layout = await realLayout('bernardo-calvo-brioso');
  assert.equal(activeCard(layout).person.id, 'bernardo-calvo-brioso');
  assert.equal(activeCard(layout).relation, '');
  assert.equal(layout.cards.filter(item => item.isActive).length, 1);
});

test('the other cards say how they relate to the active person', async () => {
  const nicanor = await realLayout('nicanor-calvo-piorno', 2);
  assert.equal(relation(nicanor, 'miguel-calvo-mendez'), 'Padre');
  assert.equal(relation(nicanor, 'lucia-piorno-santiago'), 'Madre');
  assert.equal(relation(nicanor, 'nicanor-calvo-martin'), 'Ascendiente · generación 3');
  assert.equal(relation(nicanor, 'rosario-brioso-de-las-heras'), 'Cónyuge');
});

test('a partner who shares a child is a spouse, even without a recorded wedding', async () => {
  assert.equal(relation(await realLayout('bernardo-calvo-brioso'), 'maria-angeles-devesa-herrero'), 'Cónyuge');
  assert.equal(relation(await realLayout('maria-angeles-devesa-herrero'), 'bernardo-calvo-brioso'), 'Cónyuge');
  assert.equal(relation(await annaLayout(), 'carlos'), 'Cónyuge');
});

test('two people with a common child are married on both of their records', () => {
  const spouses = id => (records.get(id).marriages || []).map(marriage => marriage.spouse);
  for (const person of records.values()) {
    if (!person.father || !person.mother) continue;
    assert.ok(spouses(person.father).includes(person.mother), `${person.father} is not married to ${person.mother}`);
    assert.ok(spouses(person.mother).includes(person.father), `${person.mother} is not married to ${person.father}`);
  }
});

test('a marriage assumed from a common child invents no details', () => {
  assert.deepEqual(records.get('bernardo-calvo-brioso').marriages, [{ spouse: 'maria-angeles-devesa-herrero' }]);
  assert.deepEqual(records.get('maria-angeles-devesa-herrero').marriages, [{ spouse: 'bernardo-calvo-brioso' }]);
});

test('a documented marriage keeps its details and is not repeated', async () => {
  const source = JSON.parse(await readFile(new URL('records.json', import.meta.url), 'utf8'));
  for (const id of ['miguel-calvo-mendez', 'lucia-piorno-santiago']) {
    const person = source.people.find(person => person.id === id);
    assert.equal(person.marriages.length, 1);
    assert.deepEqual(records.get(id).marriages, person.marriages);
  }
});

test('person data and the catalog contain no file attribution or file references', async () => {
  const canonical = JSON.parse(await readFile(new URL('records.json', import.meta.url), 'utf8'));
  const catalog = JSON.parse(await readFile(new URL('data/catalog.json', import.meta.url), 'utf8'));
  const fileReference = /\.(?:docx?|pdf|jpe?g|png|tiff?)\b|\bfotograf[íi]as?\b|\bdocumentos?\b|\bfuente\s*:/iu;
  function check(value, context) {
    if (typeof value === 'string') {
      assert.doesNotMatch(value, fileReference, `${context} contains a file reference`);
    } else if (Array.isArray(value)) {
      value.forEach((entry, index) => check(entry, `${context}[${index}]`));
    } else if (value && typeof value === 'object') {
      assert.equal(Object.hasOwn(value, 'source'), false, `${context} contains file attribution`);
      Object.entries(value).forEach(([key, entry]) => check(entry, `${context}.${key}`));
    }
  }
  check(canonical, 'records');
  check(catalog, 'catalog');
  for (const person of records.values()) check(person, person.id);
});

test('a surname is written the same way for everyone, never both with and without «de»', async () => {
  const source = JSON.parse(await readFile(new URL('records.json', import.meta.url), 'utf8'));
  const particle = /^(?:de las|de los|de la|del|de) /iu;
  const forms = new Map();
  for (const person of source.people) {
    for (const surname of person.surnames) {
      const key = surname.replace(particle, '').toLocaleLowerCase('es');
      if (!forms.has(key)) forms.set(key, new Map());
      if (!forms.get(key).has(surname)) forms.get(key).set(surname, person.id);
    }
  }
  const split = [...forms.values()]
    .filter(variants => variants.size > 1)
    .map(variants => [...variants].map(([surname, id]) => `«${surname}» (${id})`).join(' / '));
  assert.deepEqual(split, []);
});

test('someone without a partner has no marriage', () => {
  assert.equal(records.get('arturo-calvo-devesa').marriages, undefined);
});

test('a couple is joined by a line between their cards', async () => {
  const layout = await realLayout('bernardo-calvo-brioso');
  const active = activeCard(layout);
  const partner = card(layout, 'maria-angeles-devesa-herrero');
  const unionY = active.y + layout.cardHeight / 2;
  assert.ok(layout.connections.some(path => {
    const line = points(path);
    return line.length === 2 && isAt(line[0], active.x + layout.cardWidth, unionY) && isAt(line[1], partner.x, unionY);
  }));
});

test('a shared child hangs from the middle of the line between the parents', async () => {
  const layout = await realLayout('bernardo-calvo-brioso');
  const active = activeCard(layout);
  const partner = card(layout, 'maria-angeles-devesa-herrero');
  const shared = circle(layout, 'arturo-calvo-devesa');
  const unionX = (active.x + layout.cardWidth + partner.x) / 2;
  const path = layout.connections.find(item => endsAt(item, shared.x + layout.circleSize / 2, shared.y));
  assert.ok(path, 'the child is connected');
  assert.ok(startsAt(path, unionX, active.y + layout.cardHeight / 2), 'the connection starts on the couple line');
  assert.ok(shared.y >= active.y + layout.cardHeight, 'the child is below the couple');
});

test('a child whose other parent is unknown hangs from the active person alone', async () => {
  const layout = await annaLayout();
  const active = activeCard(layout);
  const only = circle(layout, 'c9');
  const path = layout.connections.find(item => endsAt(item, only.x + layout.circleSize / 2, only.y));
  assert.ok(path, 'the child is connected');
  assert.ok(startsAt(path, active.x + layout.cardWidth / 2, active.y + layout.cardHeight));
});

test('two partners sit on either side, and a third is left out', async () => {
  const layout = await annaLayout();
  const active = activeCard(layout);
  assert.ok(card(layout, 'bruno').x > active.x, 'the first partner is on the right');
  assert.ok(card(layout, 'carlos').x < active.x, 'the second partner is on the left');
  assert.equal(card(layout, 'dario'), undefined);
});

test('a child of a partner who is left out does not connect to a partner on screen', async () => {
  const layout = await annaLayout();
  const active = activeCard(layout);
  const hidden = circle(layout, 'c8');
  const path = layout.connections.find(item => endsAt(item, hidden.x + layout.circleSize / 2, hidden.y));
  assert.ok(path, 'the child is connected');
  assert.ok(startsAt(path, active.x + layout.cardWidth / 2, active.y + layout.cardHeight));
});

test('each partner\'s children hang from that couple', async () => {
  const layout = await annaLayout();
  const active = activeCard(layout);
  const unionY = active.y + layout.cardHeight / 2;
  const bruno = card(layout, 'bruno');
  const carlos = card(layout, 'carlos');
  const rightUnion = (active.x + layout.cardWidth + bruno.x) / 2;
  const leftUnion = (carlos.x + layout.cardWidth + active.x) / 2;
  const startsFrom = (id, x) => {
    const item = circle(layout, id);
    const path = layout.connections.find(line => endsAt(line, item.x + layout.circleSize / 2, item.y));
    return startsAt(path, x, unionY);
  };
  for (const id of ['c1', 'c2', 'c3', 'c4', 'c5']) assert.ok(startsFrom(id, rightUnion), `${id} hangs from Anna and Bruno`);
  for (const id of ['c6', 'c7']) assert.ok(startsFrom(id, leftUnion), `${id} hangs from Anna and Carlos`);
});

test('the active card is at the exact center of the canvas, whatever surrounds it', async () => {
  await everyLayout((layout, context) => {
    const active = activeCard(layout);
    assert.ok(near(active.x + layout.cardWidth / 2, layout.width / 2), `${context}: horizontal`);
    assert.ok(near(active.y + layout.cardHeight / 2, layout.activeCenterY), `${context}: vertical`);
  });
});

test('nothing overlaps', async () => {
  await everyLayout((layout, context) => {
    const all = boxes(layout);
    for (const [index, a] of all.entries()) {
      for (const b of all.slice(index + 1)) {
        const apart = a.x + a.width <= b.x + 0.01 || b.x + b.width <= a.x + 0.01 || a.y + a.height <= b.y + 0.01 || b.y + b.height <= a.y + 0.01;
        assert.ok(apart, `${context}: ${a.name} overlaps ${b.name}`);
      }
    }
  });
});

test('everything stays on the canvas', async () => {
  await everyLayout((layout, context) => {
    for (const box of boxes(layout)) {
      assert.ok(box.x >= 0 && box.x + box.width <= layout.width, `${context}: ${box.name} leaves the canvas sideways`);
      assert.ok(box.y >= 0 && box.y + box.height <= layout.height, `${context}: ${box.name} leaves the canvas vertically`);
    }
  });
});

test('connections never run through a card or a circle', async () => {
  await everyLayout((layout, context) => {
    for (const path of [...layout.connections, ...layout.siblingConnections]) {
      const line = points(path);
      for (const [index, from] of line.slice(0, -1).entries()) {
        const to = line[index + 1];
        for (const box of boxes(layout)) {
          const crosses = Math.max(from.x, to.x) > box.x + 0.5 && Math.min(from.x, to.x) < box.x + box.width - 0.5
            && Math.max(from.y, to.y) > box.y + 0.5 && Math.min(from.y, to.y) < box.y + box.height - 0.5;
          assert.ok(!crosses, `${context}: ${path} crosses ${box.name}`);
        }
      }
    }
  });
});

test('every circle is connected', async () => {
  await everyLayout((layout, context) => {
    for (const item of layout.circles) {
      const center = item.x + layout.circleSize / 2;
      const connected = hasPath(layout, center, item.y + layout.circleSize, startsAt) || hasPath(layout, center, item.y, endsAt);
      assert.ok(connected, `${context}: circle ${item.person.id} has no connection`);
    }
  });
});

test('every ancestor card connects down to the card of its child', async () => {
  await everyLayout((layout, context) => {
    const active = activeCard(layout);
    for (const item of layout.cards) {
      if (item.y >= active.y) continue;
      const center = item.x + layout.cardWidth / 2;
      const path = layout.connections.find(line => startsAt(line, center, item.y + layout.cardHeight));
      assert.ok(path, `${context}: ${item.person.id} has no connection`);
      const end = points(path).at(-1);
      assert.ok(layout.cards.some(other => other !== item && near(other.x + layout.cardWidth / 2, end.x) && near(other.y, end.y)), `${context}: ${item.person.id} connects to nothing`);
    }
  });
});

test('the default view of every real person fits the tree viewport without scrolling', async () => {
  // familia.css: .tree-viewport min-height, and its value on narrow screens.
  const REGULAR_VIEWPORT = 470;
  const COMPACT_VIEWPORT = 484;
  for (const id of records.keys()) {
    assert.ok((await realLayout(id, 1, false)).height <= REGULAR_VIEWPORT, `${id}, regular`);
    assert.ok((await realLayout(id, 1, true)).height <= COMPACT_VIEWPORT, `${id}, compact`);
  }
});

test('siblings from shared parents and explicit links appear as distinct nodes', async () => {
  const people = new Map([
    { ...summary('a'), father: 'p', siblingSummaries: [summary('explicit')] },
    { ...summary('p'), children: [summary('a'), summary('b'), summary('direct')] },
    summary('b'), { ...summary('direct'), isDirectAncestor: true }, summary('explicit'),
  ].map(person => [person.id, person]));
  const tree = await collectTree('a', 1, async id => people.get(id));
  assert.deepEqual(tree.siblings.map(item => item.person.id).sort(), ['b', 'direct', 'explicit']);
  const layout = layoutTree({ ...tree, depth: 1 });
  const sibling = layout.siblingCircles.find(item => item.person.id === 'b');
  const direct = layout.siblingCircles.find(item => item.person.id === 'direct');
  assert.equal(sibling.relation, 'Hermano/a');
  assert.equal(sibling.width, layout.circleSize);
  assert.equal(direct.width, layout.circleSize);
  assert.equal(direct.person.isDirectAncestor, true);
  assert.equal(direct.relation, 'Hermano/a');
  const all = boxes(layout);
  for (const [index, a] of all.entries()) {
    for (const b of all.slice(index + 1)) {
      assert.ok(a.x + a.width <= b.x || b.x + b.width <= a.x || a.y + a.height <= b.y || b.y + b.height <= a.y, `${a.name} overlaps ${b.name}`);
    }
  }
});

test('a sibling already shown as an ancestor is not duplicated and keeps its ancestor card', async () => {
  const people = new Map([
    { ...summary('a'), father: 'p', mother: 'q' },
    { ...summary('p'), father: 'g' }, { ...summary('q'), father: 'g' },
    { ...summary('g'), children: [summary('p'), summary('q')] },
  ].map(person => [person.id, person]));
  const layout = layoutTree({ ...await collectTree('a', 1, async id => people.get(id)), depth: 1 });
  assert.equal(layout.siblingCircles.length, 0);
  assert.match(card(layout, 'p').relation, /Padre.*Hermano\/a/);
  assert.match(card(layout, 'q').relation, /Madre.*Hermano\/a/);
});

test('siblings sit on the outside of each parental branch, including large groups', () => {
  const ancestors = [
    { person: summary('child'), level: 0, slot: 0 },
    { person: summary('father'), level: 1, slot: 0 },
    { person: summary('mother'), level: 1, slot: 1 },
  ];
  const siblings = [
    ...Array.from({ length: 12 }, (_, index) => ({ ownerId: 'father', person: summary(`f${index}`) })),
    ...Array.from({ length: 12 }, (_, index) => ({ ownerId: 'mother', person: summary(`m${index}`) })),
  ];
  for (const compact of [false, true]) {
    const layout = layoutTree({ ancestors, siblings, depth: 1, compact });
    const father = card(layout, 'father');
    const mother = card(layout, 'mother');
    for (const item of layout.siblingCircles) {
      if (item.ownerId === 'father') assert.ok(item.x + item.width < father.x);
      else assert.ok(item.x > mother.x + layout.cardWidth);
    }
    assert.equal(layout.siblingLabels.length, 2);
    assert.equal(layout.siblingConnections.length, siblings.length);
    for (const [index, a] of boxes(layout).entries()) {
      for (const b of boxes(layout).slice(index + 1)) {
        assert.ok(a.x + a.width <= b.x || b.x + b.width <= a.x || a.y + a.height <= b.y || b.y + b.height <= a.y, `${a.name} overlaps ${b.name}`);
      }
    }
  }
});

test('María and Antonio Unzueta Fernández show each other as small sibling circles in the direct line', async () => {
  for (const [active, sibling] of [
    ['maria-unzueta-fernandez', 'antonio-unzueta-fernandez'],
    ['antonio-unzueta-fernandez', 'maria-unzueta-fernandez'],
  ]) {
    const layout = await realLayout(active);
    assert.ok(!layout.cards.some(item => item.person.id === sibling), `${sibling} has no card`);
    const node = layout.siblingCircles.find(item => item.person.id === sibling);
    assert.equal(node.width, layout.circleSize);
    assert.equal(node.height, layout.circleSize);
    assert.equal(node.relation, 'Hermano/a');
    assert.equal(node.person.isDirectAncestor, true);
  }
});

test('a sibling beyond a second partner has a clear connector around the partner', async () => {
  for (const compact of [false, true]) {
    const layout = await realLayout('manuel-hernandez-gaitan', 1, compact);
    const active = activeCard(layout);
    const sibling = layout.siblingCircles.find(item => item.person.id === 'teodora-hernandez');
    assert.ok(sibling);
    const line = layout.siblingConnections.find(path => startsAt(path, active.x + layout.cardWidth / 4, active.y));
    assert.ok(line, 'sibling connector starts at the active person');
    assert.ok(endsAt(line, sibling.x + sibling.width / 2, sibling.y), 'sibling connector ends at the sibling');
    assert.ok(points(line).slice(1, -1).every(point => point.y < active.y), 'connector passes above the partner and spouse line');
  }
});

test('only the active person has sibling nodes; parents stay close together', async () => {
  const people = new Map([
    { ...summary('a'), father: 'p', mother: 'q' },
    { ...summary('p'), father: 'g', children: [summary('a'), summary('b')] }, { ...summary('q'), father: 'h', children: [summary('a')] },
    { ...summary('g'), children: [summary('p'), summary('u1'), summary('u2'), summary('u3')] },
    { ...summary('h'), children: [summary('q'), summary('t1')] },
    summary('b'), summary('u1'), summary('u2'), summary('u3'), summary('t1'),
  ].map(person => [person.id, person]));
  const tree = await collectTree('a', 1, async id => people.get(id));
  assert.deepEqual(tree.siblings.map(item => item.person.id), ['b']);
  const layout = layoutTree({ ...tree, depth: 1 });
  assert.equal(card(layout, 'q').x - card(layout, 'p').x, layoutTree({ ...tree, siblings: [], depth: 1 }).cards.find(item => item.person.id === 'q').x - layoutTree({ ...tree, siblings: [], depth: 1 }).cards.find(item => item.person.id === 'p').x);
});

test('child circles are flagged so the direct-line child can stand out', async () => {
  const people = new Map([
    { ...summary('a'), children: [summary('c1'), { ...summary('c2'), isDirectAncestor: true }] },
  ].map(person => [person.id, person]));
  const layout = layoutTree({ ...await collectTree('a', 1, async id => people.get(id)), depth: 1 });
  const children = layout.circles.filter(circle => circle.isChild);
  assert.deepEqual(children.map(circle => [circle.person.id, Boolean(circle.person.isDirectAncestor)]), [['c1', false], ['c2', true]]);
});
