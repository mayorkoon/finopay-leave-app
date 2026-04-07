/**
 * Leave Entitlements — Band-based configuration
 *
 * PRIVACY DESIGN:
 * - Grade-to-band mapping lives here only (in app code)
 * - SharePoint/Firestore only stores band names + day entitlements
 * - Staff grades are never saved to any database
 * - IT and staff never see grade-to-band mapping
 *
 * ACTUAL VALUES — Provided by HR (Finopay Leave Policy)
 *
 * Confirmed Staff:
 *   Band 1 (Analyst → Expert)              → Annual: 20, Sick: 5, Casual: 0
 *   Band 2 (Senior Expert → Senior Manager) → Annual: 25, Sick: 5, Casual: 0
 *   Band 3 (Director → CEO)                → Annual: 30, Sick: 5, Casual: 0
 *
 * Contract & Not Confirmed (all grades):   → Annual: 10, Sick: 5, Casual: 5
 */

// ── Grade list (shown in form dropdown) ──────────────────────────────────────
export const GRADES = [
  "Analyst",
  "Senior Analyst",
  "Associate",
  "Senior Associate",
  "Expert",
  "Senior Expert",
  "Team Lead",
  "Manager",
  "Senior Manager",
  "Director",
  "Senior Director/VP",
  "Senior VP",
  "CEO",
];

// ── Employment types ──────────────────────────────────────────────────────────
export const EMPLOYMENT_TYPES = ["Confirmed", "Contract", "Not Confirmed"];

// ── Trackable leave types ─────────────────────────────────────────────────────
export const TRACKABLE_LEAVE_TYPES = {
  annual:  { label: "Annual Leave",  key: "annual" },
  sick:    { label: "Sick Leave",    key: "sick"   },
  casual:  { label: "Casual Leave",  key: "casual" },
};

// ── Grade to Band mapping ─────────────────────────────────────────────────────
// PRIVATE — lives in app code only, never exposed to SharePoint, Firestore, or IT
// Levels 9-13  → Band 1 (20 days annual)
// Levels 5-8   → Band 2 (25 days annual)
// Levels 1-4   → Band 3 (30 days annual)
export const GRADE_TO_BAND = {
  "Analyst":            "Band 1",  // Level 13
  "Senior Analyst":     "Band 1",  // Level 12
  "Associate":          "Band 1",  // Level 11
  "Senior Associate":   "Band 1",  // Level 10
  "Expert":             "Band 1",  // Level 9
  "Senior Expert":      "Band 2",  // Level 8
  "Team Lead":          "Band 2",  // Level 7
  "Manager":            "Band 2",  // Level 6
  "Senior Manager":     "Band 2",  // Level 5
  "Director":           "Band 3",  // Level 4
  "Senior Director/VP": "Band 3",  // Level 3
  "Senior VP":          "Band 3",  // Level 2
  "CEO":                "Band 3",  // Level 1
};

// ── Band entitlements ─────────────────────────────────────────────────────────
// Confirmed staff: annual varies by band, sick is 5 for all, no casual
// Contract & Not Confirmed: same across all grades — annual 10, sick 5, casual 5
export const BAND_ENTITLEMENTS = {
  "Band 1": {
    "Confirmed":     { annual: 20, sick: 5, casual: 0 },
    "Contract":      { annual: 10, sick: 5, casual: 5 },
    "Not Confirmed": { annual: 10, sick: 5, casual: 5 },
  },
  "Band 2": {
    "Confirmed":     { annual: 25, sick: 5, casual: 0 },
    "Contract":      { annual: 10, sick: 5, casual: 5 },
    "Not Confirmed": { annual: 10, sick: 5, casual: 5 },
  },
  "Band 3": {
    "Confirmed":     { annual: 30, sick: 5, casual: 0 },
    "Contract":      { annual: 10, sick: 5, casual: 5 },
    "Not Confirmed": { annual: 10, sick: 5, casual: 5 },
  },
};

// ── Helper functions ──────────────────────────────────────────────────────────

/**
 * Map a grade to its band — private mapping, never leaves the browser
 * @param {string} grade
 * @returns {string|null} e.g. "Band 1"
 */
export function getBandForGrade(grade) {
  return GRADE_TO_BAND[grade] || null;
}

/**
 * Get entitlement for a staff member by grade + employment type.
 * Grade is mapped to band internally — band is what gets stored everywhere else.
 * @param {string} grade
 * @param {string} employmentType
 * @returns {{ annual, sick, casual }|null}
 */
export function getEntitlement(grade, employmentType) {
  if (!grade || !employmentType) return null;
  const band = getBandForGrade(grade);
  if (!band) return null;
  return BAND_ENTITLEMENTS[band]?.[employmentType] || null;
}
