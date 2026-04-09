import { useState, useEffect } from "react";
import { getLeavesByUser, getBandEntitlements } from "../services/sharepointService";
import { TRACKABLE_LEAVE_TYPES } from "../constants/leaveEntitlements";

/**
 * Calculate leave balance for the logged-in staff member.
 * Entitlements are fetched from SharePoint Leave Band Entitlements list.
 * Falls back to local constants if SharePoint is unavailable.
 *
 * @param {object} user           - authenticated user
 * @param {string} band           - e.g. "Band 1" (stored in leave record)
 * @param {string} employmentType - Confirmed | Contract | Not Confirmed
 */
export function useLeaveBalance(user, band, employmentType) {
  const [balance, setBalance]         = useState(null);
  const [entitlement, setEntitlement] = useState(null);
  const [used, setUsed]               = useState(null);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState("");

  useEffect(() => {
    if (!user?.email) return;

    const currentYear = new Date().getFullYear();

    Promise.all([
      getLeavesByUser(user.email),
      getBandEntitlements(),
    ])
      .then(([leaves, entitlements]) => {
        // Only count HR-approved leaves from current year
        const approvedThisYear = leaves.filter((l) => {
          const isApproved = l.status === "approved" ||
                             l.status === "approved_pending_allowance";
          const leaveYear  = l.startDate
            ? new Date(l.startDate).getFullYear()
            : null;
          return isApproved && leaveYear === currentYear;
        });

        // Sum days used per trackable leave type
        const usedDays = { annual: 0, sick: 0, casual: 0 };
        approvedThisYear.forEach((leave) => {
          const leaveTypeId = Array.isArray(leave.leaveTypes)
            ? leave.leaveTypes[0]
            : leave.leaveTypes;
          if (TRACKABLE_LEAVE_TYPES[leaveTypeId]) {
            const key  = TRACKABLE_LEAVE_TYPES[leaveTypeId].key;
            const days = parseInt(leave.totalDays) || 0;
            usedDays[key] += days;
          }
        });

        // Look up entitlement from SharePoint data
        const ent = band && employmentType
          ? entitlements[band]?.[employmentType] || null
          : null;

        setUsed(usedDays);
        setEntitlement(ent);

        if (ent) {
          setBalance({
            annual: Math.max(0, ent.annual - usedDays.annual),
            sick:   Math.max(0, ent.sick   - usedDays.sick),
            casual: Math.max(0, ent.casual  - usedDays.casual),
          });
        }
      })
      .catch((err) => {
        console.error("Failed to calculate leave balance:", err);
        setError("Could not load leave balance.");
      })
      .finally(() => setLoading(false));
  }, [user, band, employmentType]);

  return { balance, entitlement, used, loading, error };
}