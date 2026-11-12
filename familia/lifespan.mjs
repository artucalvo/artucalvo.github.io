const MONTHS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

function parseDate(value) {
  const text = String(value ?? '');
  if (!/^\d{4}(?:-\d{2}(?:-\d{2})?)?$/.test(text)) return null;
  const [year, month, day] = text.split('-').map(Number);
  if (month !== undefined && (month < 1 || month > 12)) return null;
  if (day !== undefined) {
    const date = new Date(`${text}T12:00:00Z`);
    if (Number.isNaN(date.valueOf()) || date.toISOString().slice(0, 10) !== text) return null;
  }
  return { text, year, month, day };
}

// As precise as the record: «9 dic 1832», «dic 1832» or «1832».
function dateText({ year, month, day }) {
  return [day, month && MONTHS[month - 1], year].filter(part => part !== undefined).join(' ');
}

// Shared by individual records and the compact archive index. Without a birth
// date, the baptism stands in for it and is labelled as such.
export function lifespan(person = {}) {
  const birth = parseDate(person.birth?.date) || parseDate(person.birthYear);
  const start = birth || parseDate(person.baptism?.date);
  const death = parseDate(person.death?.date) || parseDate(person.deathYear);
  if (!start) return death ? `f. ${dateText(death)}` : '';
  const startText = `${birth ? '' : 'baut. '}${dateText(start)}`;
  if (!death) return birth ? `n. ${startText}` : startText;

  const range = `${startText} – ${dateText(death)}`;
  const fullDates = start.day !== undefined && death.day !== undefined;
  const deathBeforeStart = death.year < start.year || (death.year === start.year && (
    start.month !== undefined && death.month !== undefined && (
      death.month < start.month || (death.month === start.month && fullDates && death.day < start.day)
    )
  ));
  if (deathBeforeStart) return range;

  let age = death.year - start.year;
  if (fullDates && (death.month < start.month || (death.month === start.month && death.day < start.day))) age -= 1;
  const unit = age === 1 ? 'año' : 'años';
  // Counted from a baptism, the age can fall short of the real one.
  return `${range} (${fullDates && birth ? '' : 'aprox. '}${age} ${unit})`;
}
