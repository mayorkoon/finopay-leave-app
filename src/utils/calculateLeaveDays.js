/**
 * Calculate working days between two date strings (inclusive),
 * excluding Saturdays and Sundays.
 * @param {string} startDate - "YYYY-MM-DD"
 * @param {string} endDate   - "YYYY-MM-DD"
 * @returns {string} - number of working days as string, or "" if invalid
 */
export function calculateLeaveDays(startDate, endDate) {
  if (!startDate || !endDate) return "";
  const start = new Date(startDate);
  const end = new Date(endDate);
  if (end < start) return "";

  let workingDays = 0;
  const current = new Date(start);

  while (current <= end) {
    const day = current.getDay(); // 0 = Sunday, 6 = Saturday
    if (day !== 0 && day !== 6) {
      workingDays++;
    }
    current.setDate(current.getDate() + 1);
  }

  return String(workingDays);
}

/**
 * Returns the next working day (Mon–Fri) after a given date string.
 * @param {string} dateStr - "YYYY-MM-DD"
 * @returns {string} - "YYYY-MM-DD"
 */
export function getNextWorkingDay(dateStr) {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  do {
    date.setDate(date.getDate() + 1);
  } while (date.getDay() === 0 || date.getDay() === 6);
  return date.toISOString().split("T")[0];
}

/**
 * Format a Firestore timestamp or date string to readable Nigerian date
 * @param {any} timestamp - Firestore Timestamp or ISO string
 * @returns {string}
 */
export function formatDate(timestamp) {
  if (!timestamp) return "—";
  const date = timestamp?.toDate ? timestamp.toDate() : new Date(timestamp);
  return date.toLocaleDateString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Africa/Lagos",
  });
}
