import test from 'node:test';
import assert from 'node:assert/strict';
import { splitLinks } from './links.mjs';

test('text without a web address stays one piece', () => {
  assert.deepEqual(splitLinks('Familiar del Santo Oficio en 1714.'), [{ text: 'Familiar del Santo Oficio en 1714.' }]);
});

test('a web address becomes a link labelled with its site, and the sentence keeps its full stop', () => {
  assert.deepEqual(splitLinks('Consta en PARES: https://pares.cultura.gob.es/ParesBusquedas20/catalogo/description/123.'), [
    { text: 'Consta en PARES: ' },
    { url: 'https://pares.cultura.gob.es/ParesBusquedas20/catalogo/description/123', label: 'pares.cultura.gob.es' },
    { text: '.' },
  ]);
});

test('several addresses in one observation are all linked, and «www.» is left out of the label', () => {
  const parts = splitLinks('Árbol (https://www.familysearch.org/ark:/61903/2:2:QJSG-2ZC) y partida https://gw.geneanet.org/x?n=a&p=b');
  assert.deepEqual(parts.filter(part => part.url).map(part => [part.url, part.label]), [
    ['https://www.familysearch.org/ark:/61903/2:2:QJSG-2ZC', 'familysearch.org'],
    ['https://gw.geneanet.org/x?n=a&p=b', 'gw.geneanet.org'],
  ]);
  assert.equal(parts.map(part => part.text ?? part.url).join(''), 'Árbol (https://www.familysearch.org/ark:/61903/2:2:QJSG-2ZC) y partida https://gw.geneanet.org/x?n=a&p=b');
});

test('only http and https addresses are linked', () => {
  assert.deepEqual(splitLinks('javascript:alert(1) y ftp://ejemplo.es'), [{ text: 'javascript:alert(1) y ftp://ejemplo.es' }]);
});
