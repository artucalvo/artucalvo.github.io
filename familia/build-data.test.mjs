import test from 'node:test';
import assert from 'node:assert/strict';
import { copyFile, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

async function buildFixture(t, burial) {
  const directory = await mkdtemp(path.join(tmpdir(), 'familia-burial-'));
  t.after(() => rm(directory, { recursive: true, force: true }));
  for (const file of ['build-data.mjs', 'lifespan.mjs']) {
    await copyFile(new URL(file, import.meta.url), path.join(directory, file));
  }
  const person = { id: 'ana', name: 'Ana Martín', givenNames: 'Ana', surnames: ['Martín'], burial };
  await writeFile(path.join(directory, 'records.json'), JSON.stringify({
    branches: [{ id: 'familia', label: 'Familia', roots: ['ana'] }], people: [person],
  }));
  const result = spawnSync(process.execPath, [path.join(directory, 'build-data.mjs')], { encoding: 'utf8' });
  return { directory, result };
}

test('a burial is preserved and indexed without inventing a death date', async t => {
  const burial = { date: '1726-03-10', place: 'Abelón', note: 'San Martín', transcription: 'fue sepultado [ilegible]' };
  const { directory, result } = await buildFixture(t, burial);
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
    const { result } = await buildFixture(t, burial);
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, expected);
  }
});
