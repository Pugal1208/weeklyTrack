/**
 * Returns the ISO week number for a given date.
 * ISO weeks start on Monday and go from week 1 to 52/53.
 * @param {Date} date - defaults to today
 * @returns {number} ISO week number
 */
export function getISOWeekNumber(date = new Date()) {
  const d = new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
  );
  // ISO week: Thursday of current week determines the year
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
}

/**
 * Returns a unique key combining year and ISO week number.
 * Useful for scoping submissions to a specific week across year boundaries.
 * @param {Date} date
 * @returns {number} e.g. 202612 for week 12 of 2026
 */
export function getWeekKey(date = new Date()) {
  const week = getISOWeekNumber(date);
  const year = date.getFullYear();
  return year * 100 + week; // e.g. 202612
}
