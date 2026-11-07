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

// Shared by individual records and the compact archive index.
export function lifespan(person = {}) {
  const birth = parseDate(person.birth?.date) || parseDate(person.birthYear);
  const death = parseDate(person.death?.date) || parseDate(person.deathYear);
  if (!birth) return death ? `f. ${death.text.slice(0, 4)}` : '';
  if (!death) return `n. ${birth.text.slice(0, 4)}`;

  const years = `${birth.text.slice(0, 4)} – ${death.text.slice(0, 4)}`;
  const fullDates = birth.day !== undefined && death.day !== undefined;
  const deathBeforeBirth = death.year < birth.year || (death.year === birth.year && (
    birth.month !== undefined && death.month !== undefined && (
      death.month < birth.month || (death.month === birth.month && fullDates && death.day < birth.day)
    )
  ));
  if (deathBeforeBirth) return years;

  let age = death.year - birth.year;
  if (fullDates && (death.month < birth.month || (death.month === birth.month && death.day < birth.day))) age -= 1;
  const unit = age === 1 ? 'año' : 'años';
  return `${years} (${fullDates ? '' : 'aprox. '}${age} ${unit})`;
}
