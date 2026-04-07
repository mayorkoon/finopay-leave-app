import { useState, useEffect } from "react";
import { getLeavesByUser } from "../services/leaveService";
import { getEntitlement, TRACKABLE_LEAVE_TYPES } from "../constants/leaveEntitlements";

/**
 * Calculate leave balance for the logged-in staff member.
 *
 * Rules:
 * - Only fully HR-approved leaves count (status === "approved" or "approved_pending_allowance")
 * - Only leaves taken in the current calendar year count
 * - Resets January 1st every year
 * - Tracks Annual, Sick, and Casual leave only
 */
export function useLeaveBalance(user, confirmationStatus, grade) {
  const [balance, setBalance]       = useState(null);
  const [entitlement, setEntitlement] = useState(null);
  const [used, setUsed]             = useState(null);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState("");

  useEffect(() => {
    if (!user?.email) return;

    const currentYear = new Date().getFullYear();

    getLeavesByUser(user.email)
      .then((leaves) => {
        // Filter: approved this calendar year only
        const approvedThisYear = leaves.filter((l) => {
          const isApproved = l.status === "approved" || l.status === "approved_pending_allowance";
          const leaveYear  = l.startDate ? new Date(l.startDate).getFullYear() : null;
          return isApproved && leaveYear === currentYear;
        });

        // Calculate days used per trackable leave type
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

        // Get entitlement based on confirmation status and grade
        const ent = getEntitlement(confirmationStatus, grade);

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
  }, [user, confirmationStatus, grade]);

  return { balance, entitlement, used, loading, error };
}
