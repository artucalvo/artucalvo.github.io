import { constants } from 'node:fs';
import { readFile, writeFile, mkdir, readdir, lstat, unlink } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { lifespan } from './lifespan.mjs';

const directory = path.dirname(fileURLToPath(import.meta.url));
const output = path.join(directory, 'data');
const peopleDirectory = path.join(output, 'people');
const collator = new Intl.Collator('es', { sensitivity: 'base' });
const idPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const errors = [];
const fail = (message) => errors.push(message);
const isText = (value) => typeof value === 'string' && value.trim().length > 0;
const isObject = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);
const placeKey = (name) => name.trim().normalize('NFC').toLocaleLowerCase('es');

async function readPlaceLocations() {
  let data;
  try {
    data = JSON.parse(await readFile(path.join(directory, 'places.json'), 'utf8'));
  } catch (error) {
    if (error.code === 'ENOENT') return new Map();
    throw error;
  }
  if (!Array.isArray(data.places)) throw new Error('places.json: expected a places array.');
  const locations = new Map();
  for (const place of data.places) {
    if (!isText(place.name) || !isText(place.province) || !isText(place.source)) throw new Error('places.json: each place needs a name, province and source URL.');
    if (!Number.isFinite(place.latitude) || !Number.isFinite(place.longitude) || place.latitude < 26 || place.latitude > 44.5 || place.longitude < -19 || place.longitude > 5.5) throw new Error(`places.json: invalid Spanish coordinates for ${place.name}.`);
    if (new URL(place.source).protocol !== 'https:') throw new Error(`places.json: use an HTTPS source for ${place.name}.`);
    const key = placeKey(place.name);
    if (locations.has(key)) throw new Error(`places.json: duplicate place ${place.name}.`);
    const { name, ...location } = place;
    locations.set(key, location);
  }
  return locations;
}

function validateStrings(values, context, { required = false } = {}) {
  if (values === undefined && !required) return;
  if (!Array.isArray(values) || (required && !values.length) || values.some((value) => !isText(value))) {
    fail(`${context}: expected an array of nonempty strings.`);
  }
}

function validateDate(value, context) {
  if (value === undefined) return;
  if (typeof value !== 'string' || !/^\d{4}(?:-\d{2}(?:-\d{2})?)?$/.test(value)) {
    fail(`${context}: dates must use YYYY, YYYY-MM or YYYY-MM-DD.`);
    return;
  }
  const fullDate = value.length === 4 ? `${value}-01-01` : value.length === 7 ? `${value}-01` : value;
  const parsed = new Date(`${fullDate}T12:00:00Z`);
  if (Number.isNaN(parsed.valueOf()) || parsed.toISOString().slice(0, 10) !== fullDate) {
    fail(`${context}: invalid calendar date ${value}.`);
  }
}

function validateEvent(event, context) {
  if (event === undefined) return;
  if (!isObject(event)) {
    fail(`${context}: expected an event object.`);
    return;
  }
  validateDate(event.date, context);
  for (const field of ['place', 'note', 'transcription']) {
    if (event[field] !== undefined && !isText(event[field])) fail(`${context}.${field}: expected nonempty text.`);
  }
  if (typeof event.transcription === 'string' && (/\r/.test(event.transcription) || /(?<!\n)\n(?!\n)/.test(event.transcription))) {
    fail(`${context}.transcription: use paragraphs separated by blank lines, without source line breaks.`);
  }
  if (event.documents !== undefined) {
    fail(`${context}.documents: this repository does not store images, so events cannot have documents. Remove the field (see familia/README.md).`);
  }
}

function validateOccupations(occupations, context) {
  if (occupations === undefined) return;
  if (!Array.isArray(occupations)) {
    fail(`${context}: expected a list of occupations.`);
    return;
  }
  occupations.forEach((occupation, index) => {
    const entry = `${context}[${index}]`;
    if (!isObject(occupation)) {
      fail(`${entry}: expected an occupation object.`);
      return;
    }
    if (!isText(occupation.name)) fail(`${entry}.name: expected nonempty text.`);
    validateDate(occupation.date, entry);
    if (occupation.note !== undefined && !isText(occupation.note)) fail(`${entry}.note: expected nonempty text.`);
  });
}

function placesOf(person) {
  return [...new Set([
    person.birth?.place,
    person.baptism?.place,
    ...(person.marriages ?? []).map((marriage) => marriage.place),
    person.death?.place,
    person.burial?.place,
    ...(person.origins ?? []),
  ].filter(Boolean))].sort(collator.compare);
}

async function rejectSymlink(target) {
  try {
    if ((await lstat(target)).isSymbolicLink()) throw new Error(`Refusing to write through symlink: ${target}`);
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
}

async function writeJson(filename, value) {
  const target = path.join(output, filename);
  if (!target.startsWith(`${output}${path.sep}`)) throw new Error('Output path escaped familia/data.');
  await rejectSymlink(target);
  await writeFile(target, `${JSON.stringify(value)}\n`, {
    flag: constants.O_WRONLY | constants.O_CREAT | constants.O_TRUNC | constants.O_NOFOLLOW,
  });
}

async function build() {
  const source = JSON.parse(await readFile(path.join(directory, 'records.json'), 'utf8'));
  if (Object.hasOwn(source, 'source')) fail('source: file attribution is not supported.');
  if (!Array.isArray(source.people) || !source.people.length) throw new Error('people: expected a nonempty array.');
  if (!Array.isArray(source.branches) || !source.branches.length) throw new Error('branches: expected a nonempty array.');
  const people = new Map();
  for (const person of source.people) {
    if (!isObject(person)) {
      fail('Each person must be an object.');
      continue;
    }
    if (!isText(person.id) || !idPattern.test(person.id)) fail(`Invalid person ID: ${person.id}`);
    if (people.has(person.id)) fail(`Duplicate person ID: ${person.id}`);
    people.set(person.id, person);
    for (const field of ['name', 'givenNames']) {
      if (!isText(person[field])) fail(`${person.id}.${field}: expected nonempty text.`);
    }
    if (Object.hasOwn(person, 'source')) fail(`${person.id}.source: file attribution is not supported.`);
    for (const field of ['children', 'parentSummaries', 'partners', 'siblingSummaries', 'isDirectAncestor']) {
      if (person[field] !== undefined) fail(`${person.id}.${field}: this relationship field is generated from parent and marriage references.`);
    }
    // Some historical records identify a sibling by given name only.
    if (!Array.isArray(person.surnames)) fail(`${person.id}.surnames: expected an array (empty when unknown).`);
    else validateStrings(person.surnames, `${person.id}.surnames`);
    validateStrings(person.origins, `${person.id}.origins`);
    validateStrings(person.observations, `${person.id}.observations`);
    validateStrings(person.siblings, `${person.id}.siblings`);
    // The card reads only the list, so a lone "occupation" would never be shown.
    if (Object.hasOwn(person, 'occupation')) fail(`${person.id}.occupation: use occupations, a list, even for a single one.`);
    validateOccupations(person.occupations, `${person.id}.occupations`);
    for (const event of ['birth', 'baptism', 'death', 'burial']) validateEvent(person[event], `${person.id}.${event}`);
    if (person.marriages !== undefined && !Array.isArray(person.marriages)) {
      fail(`${person.id}.marriages: expected an array.`);
    } else {
      person.marriages?.forEach((marriage, index) => validateEvent(marriage, `${person.id}.marriages[${index}]`));
    }
  }
  for (const person of people.values()) {
    const references = [['father', person.father], ['mother', person.mother]];
    if (Array.isArray(person.marriages)) person.marriages.forEach((marriage, index) => references.push([`marriages[${index}].spouse`, marriage?.spouse]));
    if (Array.isArray(person.siblings)) person.siblings.forEach((id, index) => references.push([`siblings[${index}]`, id]));
    for (const [field, id] of references) {
      if (id === undefined) continue;
      if (!people.has(id)) fail(`${person.id}.${field}: unknown person ${id}.`);
      if (id === person.id) fail(`${person.id}.${field}: cannot reference the same person.`);
    }
    if (Array.isArray(person.siblings)) {
      if (new Set(person.siblings).size !== person.siblings.length) fail(`${person.id}.siblings: duplicate reference.`);
      for (const id of person.siblings) {
        if (people.has(id) && !people.get(id).siblings?.includes(person.id)) fail(`${person.id}.siblings: ${id} must reference this person in return.`);
      }
    }
  }
  const branchIds = new Set();
  for (const branch of source.branches) {
    if (!isObject(branch)) { fail('Each branch must be an object.'); continue; }
    if (!isText(branch.id) || !idPattern.test(branch.id) || branchIds.has(branch.id)) fail(`Invalid or duplicate branch ID: ${branch.id}`);
    branchIds.add(branch.id);
    if (!isText(branch.label)) fail(`${branch.id}.label: expected nonempty text.`);
    validateStrings(branch.roots, `${branch.id}.roots`, { required: true });
    if (Array.isArray(branch.roots)) {
      branch.roots.forEach((id) => { if (!people.has(id)) fail(`${branch.id}.roots: unknown person ${id}.`); });
    }
  }
  if (source.defaultPerson !== undefined && !people.has(source.defaultPerson)) fail(`defaultPerson: unknown person ${source.defaultPerson}.`);
  const visited = new Set();
  const active = new Set();
  function visit(id) {
    if (active.has(id)) { fail(`Ancestry cycle involving ${id}.`); return; }
    if (visited.has(id) || !people.has(id)) return;
    active.add(id);
    const person = people.get(id);
    for (const parent of [person.father, person.mother].filter(Boolean)) visit(parent);
    active.delete(id);
    visited.add(id);
  }
  for (const id of people.keys()) visit(id);
  if (errors.length) throw new Error(`Family data validation failed:\n${errors.map((message) => `- ${message}`).join('\n')}`);

  // Direct ancestors stand out among the siblings and children shown as circles.
  const directAncestors = new Set();
  function markAncestor(id) {
    if (!id || directAncestors.has(id)) return;
    directAncestors.add(id);
    const person = people.get(id);
    markAncestor(person.father);
    markAncestor(person.mother);
  }
  markAncestor(source.defaultPerson || source.branches[0].roots[0]);

  const summaries = source.people.map((person) => ({
    id: person.id,
    name: person.name,
    givenNames: person.givenNames,
    surnames: person.surnames,
    places: placesOf(person),
    ...(person.birth?.date ? { birthYear: person.birth.date.slice(0, 4) } : {}),
    ...(person.death?.date ? { deathYear: person.death.date.slice(0, 4) } : {}),
    ...(lifespan(person) ? { lifespan: lifespan(person) } : {}),
  })).sort((a, b) => collator.compare(a.name, b.name));
  function indexBy(field) {
    const entries = new Map();
    for (const person of summaries) {
      for (const name of new Set(person[field])) {
        const key = name.trim().normalize('NFC').toLocaleLowerCase('es');
        if (!entries.has(key)) entries.set(key, { name: name.trim().normalize('NFC'), people: new Set() });
        entries.get(key).people.add(person.id);
      }
    }
    return [...entries.values()].sort((a, b) => collator.compare(a.name, b.name)).map(({ name, people }) => ({ name, people: [...people] }));
  }
  const surnames = indexBy('surnames');
  const locations = await readPlaceLocations();
  const places = indexBy('places').map(place => {
    const location = locations.get(placeKey(place.name));
    return { ...place, ...(location ? { location } : {}) };
  });
  const relativeSummary = (person) => ({ id: person.id, name: person.name, givenNames: person.givenNames, surnames: person.surnames, ...(directAncestors.has(person.id) ? { isDirectAncestor: true } : {}) });
  const childrenByParent = new Map();
  const partnersByPerson = new Map();
  function addPartner(personId, partnerId, childId) {
    if (!partnersByPerson.has(personId)) partnersByPerson.set(personId, new Map());
    const partners = partnersByPerson.get(personId);
    if (!partners.has(partnerId)) partners.set(partnerId, new Set());
    if (childId) partners.get(partnerId).add(childId);
  }
  for (const person of source.people) {
    for (const parent of new Set([person.father, person.mother].filter(Boolean))) {
      if (!childrenByParent.has(parent)) childrenByParent.set(parent, []);
      childrenByParent.get(parent).push({
        ...relativeSummary(person),
        ...(person.father ? { father: person.father } : {}),
        ...(person.mother ? { mother: person.mother } : {}),
      });
    }
    for (const marriage of person.marriages || []) {
      if (!marriage.spouse) continue;
      addPartner(person.id, marriage.spouse);
      addPartner(marriage.spouse, person.id);
    }
    if (person.father && person.mother && person.father !== person.mother) {
      addPartner(person.father, person.mother, person.id);
      addPartner(person.mother, person.father, person.id);
    }
  }
  for (const children of childrenByParent.values()) children.sort((a, b) => collator.compare(a.name, b.name));
  const catalog = {
    version: 1,
    defaultPerson: source.defaultPerson || source.branches[0].roots[0],
    branches: source.branches.map((branch) => ({
      ...branch,
      roots: branch.roots.map((id) => ({ id, name: people.get(id).name })),
    })),
    stats: { people: people.size, surnames: surnames.length, places: places.length },
  };
  await rejectSymlink(output);
  await mkdir(output, { recursive: true });
  await rejectSymlink(peopleDirectory);
  await mkdir(peopleDirectory, { recursive: true });
  for (const person of source.people) {
    const children = childrenByParent.get(person.id);
    const siblingSummaries = (person.siblings || []).map(id => relativeSummary(people.get(id))).sort((a, b) => collator.compare(a.name, b.name));
    const parentSummaries = ['father', 'mother'].filter(relation => person[relation]).map(relation => ({ ...relativeSummary(people.get(person[relation])), relation }));
    const partners = [...(partnersByPerson.get(person.id) || [])].map(([id, sharedChildren]) => ({
      ...relativeSummary(people.get(id)),
      sharedChildren: [...sharedChildren].sort((a, b) => collator.compare(people.get(a).name, people.get(b).name)),
    })).sort((a, b) => collator.compare(a.name, b.name));
    // Two people with a common child are taken to be married, so a couple the
    // source says nothing about still gets a marriage, without invented details.
    const assumedMarriages = partners
      .filter(({ id }) => !person.marriages?.some((marriage) => marriage.spouse === id))
      .map(({ id }) => ({ spouse: id }));
    const marriages = [...(person.marriages || []), ...assumedMarriages];
    await writeJson(`people/${person.id}.json`, {
      ...person,
      ...(directAncestors.has(person.id) ? { isDirectAncestor: true } : {}),
      ...(siblingSummaries.length ? { siblingSummaries } : {}),
      ...(marriages.length ? { marriages } : {}),
      ...(parentSummaries.length ? { parentSummaries } : {}),
      ...(children ? { children } : {}),
      ...(partners.length ? { partners } : {}),
    });
  }
  await writeJson('index.json', { people: summaries, surnames, places });
  await writeJson('catalog.json', catalog);
  for (const filename of await readdir(peopleDirectory)) {
    if (filename.endsWith('.json') && !people.has(filename.slice(0, -5))) {
      const target = path.join(peopleDirectory, filename);
      await rejectSymlink(target);
      await unlink(target);
    }
  }
  console.log(`Family data built: ${people.size} people, ${surnames.length} surnames, ${places.length} places.`);
}

build().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
