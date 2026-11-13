import test from 'node:test';
import assert from 'node:assert/strict';
import { copyFile, mkdtemp, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { lifespan } from './lifespan.mjs';

async function buildFixture(t, fields, others = [], sourceFields = {}) {
  const directory = await mkdtemp(path.join(tmpdir(), 'familia-build-'));
  t.after(() => rm(directory, { recursive: true, force: true }));
  for (const file of ['build-data.mjs', 'lifespan.mjs']) {
    await copyFile(new URL(file, import.meta.url), path.join(directory, file));
  }
  const person = { id: 'ana', name: 'Ana Martín', givenNames: 'Ana', surnames: ['Martín'], ...fields };
  await writeFile(path.join(directory, 'records.json'), JSON.stringify({
    branches: [{ id: 'familia', label: 'Familia', roots: ['ana'] }], people: [person, ...others], ...sourceFields,
  }));
  const result = spawnSync(process.execPath, [path.join(directory, 'build-data.mjs')], { encoding: 'utf8' });
  return { directory, result };
}

test('explicit siblings and direct ancestors reach generated profiles without inventing surnames', async t => {
  const maria = { id: 'maria', name: 'María', givenNames: 'María', surnames: [], siblings: ['antonio'] };
  const antonio = { id: 'antonio', name: 'Antonio', givenNames: 'Antonio', surnames: [], siblings: ['maria'] };
  const { directory, result } = await buildFixture(t, { father: 'antonio', mother: 'maria' }, [maria, antonio]);
  assert.equal(result.status, 0, result.stderr);
  const person = JSON.parse(await readFile(path.join(directory, 'data/people/maria.json'), 'utf8'));
  const index = JSON.parse(await readFile(path.join(directory, 'data/index.json'), 'utf8'));
  assert.equal(person.isDirectAncestor, true);
  assert.deepEqual(person.siblingSummaries, [{ id: 'antonio', name: 'Antonio', givenNames: 'Antonio', surnames: [], isDirectAncestor: true }]);
  assert.deepEqual(index.surnames.map(entry => entry.name), ['Martín']);
});

test('indexes include only direct ancestors while the tree excludes spouses without a blood connection', async t => {
  const others = [
    { id: 'padre', name: 'Pedro Ruiz', givenNames: 'Pedro', surnames: ['Ruiz'], origins: ['Lugar ancestral'], siblings: ['tio'] },
    { id: 'tio', name: 'Tomás Ruiz', givenNames: 'Tomás', surnames: ['Ruiz'], siblings: ['padre'] },
    { id: 'prima', name: 'Paula Lateral', givenNames: 'Paula', surnames: ['Lateral'], father: 'tio' },
    {
      id: 'luis', name: 'Luis Martín Lateral', givenNames: 'Luis', surnames: ['Martín', 'Lateral'], father: 'padre',
      origins: ['Lugar ancestral', 'Lugar lateral'],
      marriages: [{ spouse: 'bellina', date: '1900', place: 'Lugar lateral' }, { spouse: 'prima', date: '1910' }],
    },
    { id: 'bellina', name: 'Juana Bellina', givenNames: 'Juana', surnames: ['Bellina'], father: 'suegro', origins: ['Lugar afín'] },
    { id: 'suegro', name: 'Juan Bellina', givenNames: 'Juan', surnames: ['Bellina'] },
    { id: 'sobrina', name: 'Sara Lateral', givenNames: 'Sara', surnames: ['Lateral'], father: 'luis', mother: 'bellina' },
    { id: 'ajeno', name: 'José Bellina', givenNames: 'José', surnames: ['Bellina'], mother: 'bellina' },
  ];
  const { directory, result } = await buildFixture(t, { father: 'padre', origins: ['Lugar ancestral', 'Lugar propio'] }, others, {
    defaultPerson: 'ana',
    branches: [
      { id: 'afin', label: 'Afinidad', roots: ['bellina'] },
      { id: 'familia', label: 'Familia', roots: ['ana', 'bellina'] },
    ],
  });
  assert.equal(result.status, 0, result.stderr);
  const index = JSON.parse(await readFile(path.join(directory, 'data/index.json'), 'utf8'));
  const catalog = JSON.parse(await readFile(path.join(directory, 'data/catalog.json'), 'utf8'));
  const luis = JSON.parse(await readFile(path.join(directory, 'data/people/luis.json'), 'utf8'));
  const sobrina = JSON.parse(await readFile(path.join(directory, 'data/people/sobrina.json'), 'utf8'));
  const padre = JSON.parse(await readFile(path.join(directory, 'data/people/padre.json'), 'utf8'));
  const expected = ['ana', 'luis', 'padre', 'prima', 'sobrina', 'tio'];
  assert.deepEqual(index.people.map(person => person.id).sort(), expected);
  assert.deepEqual((await readdir(path.join(directory, 'data/people'))).sort(), expected.map(id => `${id}.json`));
  assert.deepEqual(index.surnames, [
    { name: 'Martín', people: ['ana'] },
    { name: 'Ruiz', people: ['padre'] },
  ]);
  assert.deepEqual(index.places, [
    { name: 'Lugar ancestral', people: ['ana', 'padre'] },
    { name: 'Lugar propio', people: ['ana'] },
  ]);
  assert.deepEqual(catalog.stats, { people: 6, surnames: 2, places: 2 });
  assert.equal(catalog.defaultPerson, 'ana');
  assert.deepEqual(catalog.branches, [{ id: 'familia', label: 'Familia', roots: [{ id: 'ana', name: 'Ana Martín' }] }]);
  assert.deepEqual(luis.partners.map(person => person.id), ['prima']);
  assert.deepEqual(luis.marriages, [{ date: '1900', place: 'Lugar lateral' }, { spouse: 'prima', date: '1910' }]);
  assert.equal(sobrina.father, 'luis');
  assert.equal(sobrina.mother, undefined);
  assert.equal(luis.children[0].mother, undefined);
  assert.deepEqual(padre.siblingSummaries.map(person => person.id), ['tio']);
  const source = JSON.parse(await readFile(path.join(directory, 'records.json'), 'utf8'));
  assert.deepEqual(source.people.slice(1), others);
});

test('another co-parent of a direct ancestor stays without bringing in their unrelated family', async t => {
  const others = [
    {
      id: 'padre', name: 'Pedro Ruiz', givenNames: 'Pedro', surnames: ['Ruiz'],
      marriages: [{ spouse: 'segunda' }, { spouse: 'sin-hijos', date: '1900' }],
    },
    { id: 'madre', name: 'María López', givenNames: 'María', surnames: ['López'] },
    {
      id: 'segunda', name: 'Segunda Fuera', givenNames: 'Segunda', surnames: ['Fuera'], father: 'suegro',
      siblings: ['hermana-afin'], marriages: [{ spouse: 'otro', date: '1890' }], origins: ['Lugar afín'],
    },
    { id: 'medio', name: 'Miguel Lateral', givenNames: 'Miguel', surnames: ['Lateral'], father: 'padre', mother: 'segunda' },
    { id: 'nieta', name: 'Nuria Lateral', givenNames: 'Nuria', surnames: ['Lateral'], father: 'medio', mother: 'pareja' },
    { id: 'pareja', name: 'Paula Fuera', givenNames: 'Paula', surnames: ['Fuera'] },
    { id: 'suegro', name: 'Sebastián Fuera', givenNames: 'Sebastián', surnames: ['Fuera'] },
    { id: 'hermana-afin', name: 'Sofía Fuera', givenNames: 'Sofía', surnames: ['Fuera'], siblings: ['segunda'] },
    { id: 'otro', name: 'Óscar Fuera', givenNames: 'Óscar', surnames: ['Fuera'] },
    { id: 'ajeno', name: 'José Fuera', givenNames: 'José', surnames: ['Fuera'], father: 'otro', mother: 'segunda' },
    { id: 'sin-hijos', name: 'Sol Fuera', givenNames: 'Sol', surnames: ['Fuera'] },
  ];
  const { directory, result } = await buildFixture(t, { father: 'padre', mother: 'madre' }, others);
  assert.equal(result.status, 0, result.stderr);
  const segunda = JSON.parse(await readFile(path.join(directory, 'data/people/segunda.json'), 'utf8'));
  const padre = JSON.parse(await readFile(path.join(directory, 'data/people/padre.json'), 'utf8'));
  const medio = JSON.parse(await readFile(path.join(directory, 'data/people/medio.json'), 'utf8'));
  const nieta = JSON.parse(await readFile(path.join(directory, 'data/people/nieta.json'), 'utf8'));
  const index = JSON.parse(await readFile(path.join(directory, 'data/index.json'), 'utf8'));
  assert.deepEqual(index.people.map(person => person.id).sort(), ['ana', 'madre', 'medio', 'nieta', 'padre', 'segunda']);
  assert.deepEqual((await readdir(path.join(directory, 'data/people'))).sort(), ['ana.json', 'madre.json', 'medio.json', 'nieta.json', 'padre.json', 'segunda.json']);
  assert.deepEqual(padre.partners.map(person => person.id).sort(), ['madre', 'segunda']);
  assert.deepEqual(segunda.partners.map(person => person.id), ['padre']);
  assert.deepEqual(segunda.partners[0].sharedChildren, ['medio']);
  assert.deepEqual(segunda.children.map(person => person.id), ['medio']);
  assert.equal(segunda.isDirectAncestor, undefined);
  assert.equal(segunda.father, undefined);
  assert.equal(segunda.parentSummaries, undefined);
  assert.equal(segunda.siblings, undefined);
  assert.equal(segunda.siblingSummaries, undefined);
  assert.equal(medio.mother, 'segunda');
  assert.equal(medio.partners, undefined);
  assert.equal(nieta.mother, undefined);
  assert.deepEqual(index.surnames.map(group => group.name), ['López', 'Martín', 'Ruiz']);
  assert.deepEqual(index.places, []);
});

test('rebuilding deletes obsolete in-law profiles without deleting the research records', async t => {
  const spouse = { id: 'bellina', name: 'Juana Bellina', givenNames: 'Juana', surnames: ['Bellina'] };
  const { directory, result } = await buildFixture(t, { marriages: [{ spouse: 'bellina' }] }, [spouse]);
  assert.equal(result.status, 0, result.stderr);
  await writeFile(path.join(directory, 'data/people/bellina.json'), JSON.stringify(spouse));
  const rebuilt = spawnSync(process.execPath, [path.join(directory, 'build-data.mjs')], { encoding: 'utf8' });
  assert.equal(rebuilt.status, 0, rebuilt.stderr);
  assert.deepEqual(await readdir(path.join(directory, 'data/people')), ['ana.json']);
  const source = JSON.parse(await readFile(path.join(directory, 'records.json'), 'utf8'));
  assert.deepEqual(source.people[1], spouse);
});

test('explicit sibling links must refer to existing people and be reciprocal', async t => {
  const { result } = await buildFixture(t, { siblings: ['belen'] }, [{ id: 'belen', name: 'Belén', givenNames: 'Belén', surnames: [] }]);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /belen must reference this person in return/);
});

test('a burial is preserved and indexed without inventing a death date', async t => {
  const burial = { date: '1726-03-10', place: 'Abelón', note: 'San Martín', transcription: 'fue sepultado [ilegible]' };
  const { directory, result } = await buildFixture(t, { burial });
  assert.equal(result.status, 0, result.stderr);
  const person = JSON.parse(await readFile(path.join(directory, 'data/people/ana.json'), 'utf8'));
  const index = JSON.parse(await readFile(path.join(directory, 'data/index.json'), 'utf8'));
  assert.deepEqual(person.burial, burial);
  assert.equal(person.death, undefined);
  assert.equal(index.people[0].deathYear, undefined);
  assert.equal(index.people[0].lifespan, undefined);
  assert.deepEqual(index.places.find(place => place.name === 'Abelón').people, ['ana']);
});

test('dates show as precisely as recorded, and a baptism stands in for an unknown birth', () => {
  assert.equal(lifespan({ birth: { date: '1832-12-09' }, baptism: { date: '1832-12-12' } }), 'n. 9 dic 1832');
  assert.equal(lifespan({ birth: { date: '1832-12' } }), 'n. dic 1832');
  assert.equal(lifespan({ birth: { date: '1832' } }), 'n. 1832');
  assert.equal(lifespan({ baptism: { date: '1822-11-27' } }), 'baut. 27 nov 1822');
  assert.equal(lifespan({ death: { date: '1726-03-09' } }), 'f. 9 mar 1726');
  assert.equal(lifespan({ birth: { date: '1948-05-03' }, death: { date: '2023-01-12' } }), '3 may 1948 – 12 ene 2023 (74 años)');
  assert.equal(lifespan({ birth: { date: '1832' }, death: { date: '1900-01-01' } }), '1832 – 1 ene 1900 (aprox. 68 años)');
  // Counted from the baptism, the age is only approximate.
  assert.equal(lifespan({ baptism: { date: '1822-11-27' }, death: { date: '1890-09-30' } }), 'baut. 27 nov 1822 – 30 sep 1890 (aprox. 67 años)');
  assert.equal(lifespan({ burial: { date: '1726-03-10' } }), '');
});

test('the index shows the baptism of someone whose birth date is unknown', async t => {
  const { directory, result } = await buildFixture(t, { baptism: { date: '1822-11-27', place: 'Villardeciervos' } });
  assert.equal(result.status, 0, result.stderr);
  const index = JSON.parse(await readFile(path.join(directory, 'data/index.json'), 'utf8'));
  assert.equal(index.people[0].lifespan, 'baut. 27 nov 1822');
  assert.equal(index.people[0].birthYear, undefined);
});

test('burials use the same date, event and document validation as other events', async t => {
  for (const [burial, expected] of [
    [{ date: '1726-02-30' }, /ana\.burial: invalid calendar date/],
    [{ documents: ['image.jpg'] }, /ana\.burial\.documents/],
    ['not an event', /ana\.burial: expected an event object/],
  ]) {
    const { result } = await buildFixture(t, { burial });
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, expected);
  }
});

test('transcriptions use paragraphs rather than source line breaks', async t => {
  const good = await buildFixture(t, { burial: { transcription: 'Primer párrafo.\n\nSegundo párrafo.' } });
  assert.equal(good.result.status, 0, good.result.stderr);
  for (const transcription of ['Una línea\notra línea', 'Una línea\r\notra línea']) {
    const { result } = await buildFixture(t, { burial: { transcription } });
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /transcription: use paragraphs/);
  }
});

test('the occupations of a person reach their card unchanged', async t => {
  const occupations = [
    { name: 'Jornalero', date: '1898', note: 'Consta «de oficio jornalero» al casarse.' },
    { name: 'Labrador' },
  ];
  const { directory, result } = await buildFixture(t, { occupations });
  assert.equal(result.status, 0, result.stderr);
  const person = JSON.parse(await readFile(path.join(directory, 'data/people/ana.json'), 'utf8'));
  assert.deepEqual(person.occupations, occupations);
});

test('a malformed occupation stops the build and says where it is', async t => {
  for (const [occupations, expected] of [
    ['Labrador', /ana\.occupations: expected a list/],
    [['Labrador'], /ana\.occupations\[0\]: expected an occupation object/],
    [[{ name: 'Labrador' }, { date: '1898' }], /ana\.occupations\[1\]\.name: expected nonempty text/],
    [[{ name: 'Labrador', date: '1898-13' }], /ana\.occupations\[0\]: invalid calendar date/],
    [[{ name: 'Labrador', note: '' }], /ana\.occupations\[0\]\.note: expected nonempty text/],
  ]) {
    const { result } = await buildFixture(t, { occupations });
    assert.notEqual(result.status, 0, `accepted ${JSON.stringify(occupations)}`);
    assert.match(result.stderr, expected);
  }
});

test('a job written as a single occupation is rejected instead of silently left off the card', async t => {
  const { result } = await buildFixture(t, { occupation: 'Labrador' });
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /ana\.occupation: use occupations/);
});
