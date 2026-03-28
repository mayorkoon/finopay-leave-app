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
