export const LEAVE_TYPES = [
  { id: "annual",       label: "Annual Leave" },
  { id: "examination",  label: "Examination Leave" },
  { id: "compassionate",label: "Compassionate Leave" },
  { id: "casual",       label: "Casual Leave" },
  { id: "sick",         label: "Sick Leave" },
  { id: "maternity",    label: "Maternity/Paternity Leave" },
];

export const ROLES = [
  { value: "initiator", label: "Initiator — submit leave requests" },
  { value: "approver",  label: "Approver — approve & forward requests" },
  { value: "hr",        label: "HR / People & Culture — final approval" },
];

export const LEAVE_STATUS = {
  pending_supervisor: {
    label: "Awaiting Supervisor",
    color: "#f59e0b",
    bg:    "#fffbeb",
  },
  pending_second_approver: {
    label: "Awaiting 2nd Approver",
    color: "#3b82f6",
    bg:    "#eff6ff",
  },
  pending_hr: {
    label: "Awaiting HR",
    color: "#8b5cf6",
    bg:    "#f5f3ff",
  },
  approved: {
    label: "Approved",
    color: "#10b981",
    bg:    "#ecfdf5",
  },
  approved_pending_allowance: {
    label: "Approved — Allowance Pending",
    color: "#f59e0b",
    bg:    "#fffbeb",
  },
  rejected: {
    label: "Rejected",
    color: "#ef4444",
    bg:    "#fef2f2",
  },
};