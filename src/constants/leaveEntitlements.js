/**
 * Leave entitlements by employment type and grade.
 * 
 * PLACEHOLDER VALUES — HR to configure via admin screen (coming soon).
 * 
 * Structure: entitlements[confirmationStatus][grade] = { annual, sick, casual }
 * 
 * Trackable leave types: Annual Leave, Sick Leave, Casual Leave
 * Reset date: January 1st every year
 * Counted: Only fully HR-approved leaves
 */

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

export const EMPLOYMENT_TYPES = ["Confirmed", "Contract", "Not Confirmed"];

// Trackable leave type IDs mapped to entitlement keys
export const TRACKABLE_LEAVE_TYPES = {
  annual:  { label: "Annual Leave",  key: "annual"  },
  sick:    { label: "Sick Leave",    key: "sick"    },
  casual:  { label: "Casual Leave",  key: "casual"  },
};

/**
 * Placeholder entitlements — update these when HR configures actual values.
 * Format: entitlements[employmentType][grade] = { annual, sick, casual }
 */
export const ENTITLEMENTS = {
  Confirmed: {
    "Analyst":              { annual: 20, sick: 10, casual: 5 },
    "Senior Analyst":       { annual: 20, sick: 10, casual: 5 },
    "Associate":            { annual: 21, sick: 10, casual: 5 },
    "Senior Associate":     { annual: 21, sick: 10, casual: 5 },
    "Expert":               { annual: 22, sick: 12, casual: 5 },
    "Senior Expert":        { annual: 22, sick: 12, casual: 5 },
    "Team Lead":            { annual: 24, sick: 12, casual: 5 },
    "Manager":              { annual: 24, sick: 12, casual: 7 },
    "Senior Manager":       { annual: 25, sick: 14, casual: 7 },
    "Director":             { annual: 25, sick: 14, casual: 7 },
    "Senior Director/VP":   { annual: 27, sick: 14, casual: 7 },
    "Senior VP":            { annual: 27, sick: 14, casual: 7 },
    "CEO":                  { annual: 30, sick: 14, casual: 7 },
  },
  Contract: {
    "Analyst":              { annual: 15, sick: 7,  casual: 3 },
    "Senior Analyst":       { annual: 15, sick: 7,  casual: 3 },
    "Associate":            { annual: 15, sick: 7,  casual: 3 },
    "Senior Associate":     { annual: 16, sick: 7,  casual: 3 },
    "Expert":               { annual: 16, sick: 7,  casual: 5 },
    "Senior Expert":        { annual: 16, sick: 7,  casual: 5 },
    "Team Lead":            { annual: 18, sick: 10, casual: 5 },
    "Manager":              { annual: 18, sick: 10, casual: 5 },
    "Senior Manager":       { annual: 20, sick: 10, casual: 5 },
    "Director":             { annual: 20, sick: 10, casual: 5 },
    "Senior Director/VP":   { annual: 22, sick: 10, casual: 5 },
    "Senior VP":            { annual: 22, sick: 10, casual: 5 },
    "CEO":                  { annual: 25, sick: 10, casual: 5 },
  },
  "Not Confirmed": {
    "Analyst":              { annual: 10, sick: 5,  casual: 3 },
    "Senior Analyst":       { annual: 10, sick: 5,  casual: 3 },
    "Associate":            { annual: 10, sick: 5,  casual: 3 },
    "Senior Associate":     { annual: 12, sick: 5,  casual: 3 },
    "Expert":               { annual: 12, sick: 7,  casual: 3 },
    "Senior Expert":        { annual: 12, sick: 7,  casual: 3 },
    "Team Lead":            { annual: 14, sick: 7,  casual: 5 },
    "Manager":              { annual: 14, sick: 7,  casual: 5 },
    "Senior Manager":       { annual: 15, sick: 7,  casual: 5 },
    "Director":             { annual: 15, sick: 7,  casual: 5 },
    "Senior Director/VP":   { annual: 16, sick: 7,  casual: 5 },
    "Senior VP":            { annual: 16, sick: 7,  casual: 5 },
    "CEO":                  { annual: 20, sick: 7,  casual: 5 },
  },
};

/**
 * Get entitlement for a specific staff member
 * Returns { annual, sick, casual } or null if not found
 */
export function getEntitlement(confirmationStatus, grade) {
  if (!confirmationStatus || !grade) return null;
  return ENTITLEMENTS[confirmationStatus]?.[grade] || null;
}
