export function isValidStartMinutes(value) {
  if (value === null || value === undefined) return true;
  if (!Number.isInteger(value)) return false;
  if (value < 0 || value > 1435) return false;
  return value % 15 === 0;
}

export function snapTo15(value) {
  if (!Number.isFinite(value)) return null;
  return Math.round(value / 15) * 15;
}

export function nowIso() {
  return new Date().toISOString();
}

export function formatLocalDate(date, timeZone) {
  if (!(date instanceof Date)) {
    throw new Error('date must be a Date');
  }
  const tz = timeZone || 'UTC';
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: tz,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).formatToParts(date);
  const map = Object.fromEntries(parts.map(part => [part.type, part.value]));
  return `${map.year}-${map.month}-${map.day}`;
}

export function parseIsoDateToUtcMidnight(isoDate) {
  if (typeof isoDate !== 'string') {
    throw new Error('isoDate must be a string');
  }
  const [year, month, day] = isoDate.split('-').map(Number);
  if (!year || !month || !day) {
    throw new Error('isoDate must be YYYY-MM-DD');
  }
  return Date.UTC(year, month - 1, day);
}
