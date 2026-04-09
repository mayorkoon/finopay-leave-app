import { graphGet, graphPost, graphPatch } from "./graphClient";
import { SP_SITE_ID, SP_LEAVE_LIST_ID, SP_BANDS_LIST_ID, HR_EMAIL } from "../auth/MsalConfig";
import { LEAVE_TYPES } from "../constants/leaveTypes";

// Convert leave type ID to label for storage e.g. "annual" → "Annual Leave"
const leaveIdToLabel = (id) => LEAVE_TYPES.find(l => l.id === id)?.label || id;
import {
  sendHrNotification, sendSecondApproverNotification,
  sendHrNotificationFromSecondApprover, sendStaffApprovedEmail,
  sendStaffRejectedEmail, sendMdAllowanceRequest, sendHrAllowanceDecision,
} from "./emailService";

const LEAVE_BASE = `/sites/${SP_SITE_ID}/lists/${SP_LEAVE_LIST_ID}/items`;
const BANDS_BASE = `/sites/${SP_SITE_ID}/lists/${SP_BANDS_LIST_ID}/items`;

// ── Status mapping ────────────────────────────────────────────────────────────
// Our internal status codes → SharePoint choice values
const STATUS_TO_SP = {
  "pending_supervisor":        "Pending Supervisor",
  "pending_second_approver":   "Pending Second Approver",
  "pending_hr":                "Pending HR",
  "approved":                  "Approved",
  "approved_pending_allowance":"Approved",
  "rejected":                  "Rejected",
};

// SharePoint choice values → our internal status codes
const STATUS_FROM_SP = {
  "Pending Supervisor":        "pending_supervisor",
  "Pending Second Approver":   "pending_second_approver",
  "Pending HR":                "pending_hr",
  "Approved":                  "approved",
  "Rejected":                  "rejected",
};

const ALLOWANCE_TO_SP = {
  null:        "null",
  "pending_md":"Pending MD",
  "approved":  "Approved",
  "rejected":  "Rejected",
};

const ALLOWANCE_FROM_SP = {
  "null":       null,
  "Pending MD": "pending_md",
  "Approved":   "approved",
  "Rejected":   "rejected",
};

// ── Helpers ───────────────────────────────────────────────────────────────────
function generateToken() {
  return Array.from(crypto.getRandomValues(new Uint8Array(24)))
    .map(b => b.toString(16).padStart(2, "0")).join("");
}

function tokenExpiry() {
  const d = new Date();
  d.setHours(d.getHours() + 72);
  return d.toISOString();
}

// ── Map SharePoint item → internal leave object ───────────────────────────────
function mapItem(item) {
  const f = item.fields || item;
  return {
    id:                   item.id || f.id,
    staffName:            f.StaffName            || "",
    staffEmail:           f.StaffEmail           || "",
    department:           f.Department           || "",
    staffNumber:          f.StaffNumber          || "",
    confirmationStatus:   f.ConfirmationStatus   || "",
    band:                 f.Band                 || "",
    leaveTypes:           f.LeaveType ? [f.LeaveType] : [],  // stored as label e.g. "Annual Leave"
    startDate:            f.StartDate            || "",
    endDate:              f.EndDate              || "",
    totalDays:            f.TotalDays            || "",
    contactAddress:       f.ContactAddress       || "",
    mobileNumber:         f.MobileNumber         || "",
    alternativeEmail:     f.AlternativeEmail     || "",
    relieverName:         f.RelieverName         || "",
    supervisorName:       f.SupervisorsName      || "",   // note: SharePoint uses SupervisorsName
    supervisorEmail:      f.SupervisorsEmail     || "",   // note: SharePoint uses SupervisorsEmail
    status:               STATUS_FROM_SP[f.Status] || f.Status || "",
    currentApproverEmail: f.CurrentApproverEmail || "",
    approvalChain:        f.ApprovalChain ? JSON.parse(f.ApprovalChain) : [],
    requestAllowance:     f.RequestAllowance     || false,
    allowanceStatus:      ALLOWANCE_FROM_SP[f.AllowanceStatus] ?? null,
    allowanceToken:       f.AllowanceToken       || null,
    allowanceTokenExpiry: f.AllowanceTokenExpiry || null,
    allowanceDecidedAt:   f.AllowanceDecidedAt   || null,
    resumptionDate:       f.ResumptionDate       || null,
    adjustedDays:         f.AdjustedDays         || null,
    submittedAt:          f.SubmittedAt          || item.createdDateTime,
    updatedAt:            f.UpdatedAt            || item.lastModifiedDateTime,
  };
}

// ── Map internal data → SharePoint field names ────────────────────────────────
function toSpFields(data) {
  // Normalise confirmation status to match SharePoint choices exactly
  // SharePoint has: "Confirmed", "Contract", "Not confirmed" (lowercase c)
  const confirmMap = {
    "Confirmed":     "Confirmed",
    "Contract":      "Contract",
    "Not Confirmed": "Not confirmed",
    "Not confirmed": "Not confirmed",
  };

  // Only include date fields when they have a value
  // Empty string causes "bad argument" on dateOnly columns
  const fields = {
    StaffName:            data.staffName            || "",
    StaffEmail:           data.staffEmail           || "",
    Department:           data.department           || "",
    StaffNumber:          data.staffNumber          || "",
    Band:                 data.band                 || "",
    LeaveType:            Array.isArray(data.leaveTypes) ? leaveIdToLabel(data.leaveTypes[0]) : leaveIdToLabel(data.leaveTypes || ""),
    TotalDays:            parseInt(data.totalDays)  || 0,
    ContactAddress:       data.contactAddress       || "",
    MobileNumber:         data.mobileNumber         || "",
    AlternativeEmail:     data.alternativeEmail     || "",
    RelieverName:         data.relieverName         || "",
    SupervisorsName:      data.supervisorName       || "",
    SupervisorsEmail:     data.supervisorEmail      || "",
    Status:               STATUS_TO_SP[data.status] || "Pending Supervisor",
    CurrentApproverEmail: data.currentApproverEmail || "",
    ApprovalChain:        JSON.stringify(data.approvalChain || []),
    RequestAllowance:     data.requestAllowance     || false,
    AllowanceStatus:      ALLOWANCE_TO_SP[data.allowanceStatus] || "null",
    AllowanceToken:       data.allowanceToken       || "",
    SubmittedAt:          new Date().toISOString(),
    UpdatedAt:            new Date().toISOString(),
  };

  // Only add optional fields when they have values
  // Empty strings on Choice and Date columns cause "bad argument" errors
  if (data.confirmationStatus && confirmMap[data.confirmationStatus]) {
    fields.ConfirmationStatus = confirmMap[data.confirmationStatus];
  }
  if (data.startDate)          fields.StartDate          = data.startDate;
  if (data.endDate)            fields.EndDate            = data.endDate;
  if (data.allowanceTokenExpiry) fields.AllowanceTokenExpiry = data.allowanceTokenExpiry;
  if (data.resumptionDate)     fields.ResumptionDate     = data.resumptionDate;
  if (data.adjustedDays)       fields.AdjustedDays       = parseInt(data.adjustedDays);

  return fields;
}

// ── Core CRUD ─────────────────────────────────────────────────────────────────

export async function submitLeaveRequest(formData, user) {
  const fields = toSpFields({
    ...formData,
    staffEmail:           user.email,
    staffName:            user.name,
    status:               "pending_supervisor",
    currentApproverEmail: formData.supervisorEmail,
    approvalChain:        [],
    allowanceStatus:      null,
  });

  const res = await graphPost(`${LEAVE_BASE}`, { fields });
  return res.id;
}

export async function getLeavesByUser(staffEmail) {
  const filter = encodeURIComponent(`fields/StaffEmail eq '${staffEmail}'`);
  const res = await graphGet(
    `${LEAVE_BASE}?expand=fields&$filter=${filter}&$orderby=fields/SubmittedAt desc`
  );
  return (res.value || []).map(mapItem);
}

export async function getLeavesByApprover(approverEmail) {
  const spStatuses = ["Pending Supervisor", "Pending Second Approver", "Pending HR"];

  // Fetch ALL items without filter — filter client-side
  const res = await graphGet(`${LEAVE_BASE}?expand=fields`);

  const allItems = (res.value || []).map(mapItem);
  allItems.forEach(i => {
  });

  // Filter client-side by approver email and pending status
  const pending = allItems.filter(i => {
    const emailMatch  = i.currentApproverEmail?.toLowerCase() === approverEmail?.toLowerCase();
    const statusMatch = spStatuses.includes(STATUS_TO_SP[i.status]);
    return emailMatch && statusMatch;
  });

  return pending;
}

export async function getLeaveByAllowanceToken(token) {
  const filter = encodeURIComponent(`fields/AllowanceToken eq '${token}'`);
  const res = await graphGet(`${LEAVE_BASE}?expand=fields&$filter=${filter}`);
  const items = res.value || [];
  if (!items.length) return null;
  return mapItem(items[0]);
}

async function updateLeaveItem(itemId, fields) {
  await graphPatch(`${LEAVE_BASE}/${itemId}/fields`, {
    ...fields,
    UpdatedAt: new Date().toISOString(),
  });
}

// ── Approval handler ──────────────────────────────────────────────────────────

export async function updateApproval(itemId, decision) {
  const {
    approved, by, byEmail, comment, stage,
    requiresFurtherApproval, secondApproverEmail,
    resumptionDate, adjustedDays,
  } = decision;

  const res   = await graphGet(`${LEAVE_BASE}/${itemId}?expand=fields`);
  const leave = mapItem(res);

  const chainEntry = {
    stage, approved, by, byEmail,
    comment: comment || "",
    at: new Date().toISOString(),
  };
  const updatedChain = [...(leave.approvalChain || []), chainEntry];

  let nextStatus;
  let nextApproverEmail;

  if (!approved) {
    nextStatus = "rejected";
    nextApproverEmail = "";
  } else if (stage === "hr") {
    nextStatus = leave.requestAllowance ? "approved_pending_allowance" : "approved";
    nextApproverEmail = "";
  } else if (requiresFurtherApproval && secondApproverEmail) {
    nextStatus = "pending_second_approver";
    nextApproverEmail = secondApproverEmail;
  } else {
    nextStatus = "pending_hr";
    nextApproverEmail = HR_EMAIL;
  }

  const updateFields = {
    Status:               STATUS_TO_SP[nextStatus] || "Approved",
    CurrentApproverEmail: nextApproverEmail,
    ApprovalChain:        JSON.stringify(updatedChain),
  };

  if (stage === "hr" && approved) {
    if (resumptionDate) updateFields.ResumptionDate = resumptionDate;
    if (adjustedDays)   updateFields.AdjustedDays   = parseInt(adjustedDays);
  }

  let approveToken;
  if (stage === "hr" && approved && leave.requestAllowance) {
    approveToken = generateToken();
    updateFields.AllowanceToken       = approveToken;
    updateFields.AllowanceTokenExpiry = tokenExpiry();
    updateFields.AllowanceStatus      = "Pending MD";
  }

  await updateLeaveItem(itemId, updateFields);

  const updatedLeave = {
    ...leave, status: nextStatus,
    approvalChain: updatedChain,
    resumptionDate: resumptionDate || leave.resumptionDate,
  };

  if (approved) {
    if (stage === "hr") {
      sendStaffApprovedEmail(updatedLeave)
        .catch(err => console.warn("[EmailJS] Staff approved:", err?.text || err));
      if (leave.requestAllowance) {
        sendMdAllowanceRequest(updatedLeave, approveToken)
          .catch(err => console.warn("[EmailJS] MD allowance:", err?.text || err));
      }
    } else if (requiresFurtherApproval && secondApproverEmail) {
      sendSecondApproverNotification(leave, by, secondApproverEmail)
        .catch(err => console.warn("[EmailJS] 2nd approver:", err?.text || err));
    } else if (stage === "second_approver") {
      sendHrNotificationFromSecondApprover(leave, by)
        .catch(err => console.warn("[EmailJS] HR notify:", err?.text || err));
    } else {
      sendHrNotification(leave, by)
        .catch(err => console.warn("[EmailJS] HR notify:", err?.text || err));
    }
  } else {
    sendStaffRejectedEmail(leave)
      .catch(err => console.warn("[EmailJS] Staff rejected:", err?.text || err));
  }
}

// ── MD Allowance Decision ─────────────────────────────────────────────────────

export async function processMdAllowanceDecision(token, approved) {
  const leave = await getLeaveByAllowanceToken(token);
  if (!leave) throw new Error("Invalid or expired token.");
  if (leave.allowanceTokenExpiry && new Date() > new Date(leave.allowanceTokenExpiry))
    throw new Error("This approval link has expired.");
  if (leave.allowanceStatus !== "pending_md")
    throw new Error("This request has already been actioned.");

  await updateLeaveItem(leave.id, {
    Status:             "Approved",
    AllowanceStatus:    approved ? "Approved" : "Rejected",
    AllowanceToken:     "",
    AllowanceDecidedAt: new Date().toISOString(),
  });

  sendHrAllowanceDecision(leave, approved)
    .catch(err => console.warn("[EmailJS] HR allowance decision:", err?.text || err));

  return { approved, staffName: leave.staffName };
}

// ── Leave Band Entitlements ───────────────────────────────────────────────────

export async function getBandEntitlements() {
  try {
    const res = await graphGet(`${BANDS_BASE}?expand=fields`);
    const entitlements = {};
    (res.value || []).forEach(item => {
      const f    = item.fields;
      const band = f.BandName;
      const type = f.EmploymentType;
      if (!entitlements[band]) entitlements[band] = {};
      entitlements[band][type] = {
        annual: f.AnnualLeaveDays || 0,
        sick:   f.SickLeaveDays   || 0,
        casual: f.CasualLeaveDays || 0,
      };
    });
    return entitlements;
  } catch (err) {
    console.warn("[SharePoint] Entitlements fetch failed, using local fallback:", err);
    const { BAND_ENTITLEMENTS } = await import("../constants/leaveEntitlements");
    return BAND_ENTITLEMENTS;
  }
}