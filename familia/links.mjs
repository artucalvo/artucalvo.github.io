// Observations may cite an online source. The address is shown as a link
// labelled with its site, so a long address does not break the card.
const ADDRESS = /https?:\/\/[^\s<>"«»]+/giu;
// Punctuation that ends the sentence, not the address.
const TRAILING = /[.,;:!?)\]]+$/u;

export function splitLinks(text) {
  const parts = [];
  let last = 0;
  const push = value => { if (value) parts.push({ text: value }); };
  for (const match of String(text).matchAll(ADDRESS)) {
    let url = match[0];
    const trailing = url.match(TRAILING)?.[0] ?? '';
    // Keep a closing bracket that belongs to the address, as in «…_(apellido)».
    const keep = trailing.startsWith(')') && url.slice(0, -trailing.length).includes('(') ? 1 : 0;
    url = url.slice(0, url.length - trailing.length + keep);
    let label;
    try {
      label = new URL(url).hostname.replace(/^www\./u, '');
    } catch {
      continue;
    }
    push(text.slice(last, match.index));
    parts.push({ url, label });
    last = match.index + url.length;
  }
  push(text.slice(last));
  return parts.length ? parts : [{ text: String(text) }];
}
