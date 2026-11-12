import test from 'node:test';
import assert from 'node:assert/strict';
import { copyFile, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

async function buildFixture(t, fields, others = []) {
  const directory = await mkdtemp(path.join(tmpdir(), 'familia-build-'));
  t.after(() => rm(directory, { recursive: true, force: true }));
  for (const file of ['build-data.mjs', 'lifespan.mjs']) {
    await copyFile(new URL(file, import.meta.url), path.join(directory, file));
  }
  const person = { id: 'ana', name: 'Ana Martín', givenNames: 'Ana', surnames: ['Martín'], ...fields };
  await writeFile(path.join(directory, 'records.json'), JSON.stringify({
    branches: [{ id: 'familia', label: 'Familia', roots: ['ana'] }], people: [person, ...others],
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
