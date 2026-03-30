import emailjs from "emailjs-com";

const SERVICE_ID  = import.meta.env.VITE_EMAILJS_SERVICE_ID;
const PUBLIC_KEY  = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

// Single template handles all notifications up to HR approval
const TEMPLATE_APPROVER_NOTIFY = import.meta.env.VITE_EMAILJS_TEMPLATE_APPROVER_NOTIFY;

// Config
const HR_EMAIL = import.meta.env.VITE_HR_EMAIL || "hr@finopay.com";

/**
 * Base sender — all emails go through here
 */
function send(templateId, params) {
  return emailjs.send(SERVICE_ID, templateId, params, PUBLIC_KEY);
}

/**
 * Shared leave detail params — used across all templates
 */
function leaveParams(formData, user) {
  return {
    staff_name:      user?.name  || formData.staffName,
    staff_email:     user?.email || formData.staffEmail,
    department:      formData.department,
    leave_types:     Array.isArray(formData.leaveTypes)
                       ? formData.leaveTypes.join(", ")
                       : formData.leaveTypes,
    start_date:      formData.startDate,
    end_date:        formData.endDate,
    total_days:      formData.totalDays,
    reliever_name:   formData.relieverName,
    app_url:         window.location.origin,
  };
}

// ── TEMPLATE: Supervisor (existing) ──────────────────────────────────────────
/**
 * Notify supervisor when staff submits a leave request
 */
export async function sendSupervisorEmail(formData, user) {
  return send(TEMPLATE_APPROVER_NOTIFY, {
    ...leaveParams(formData, user),
    recipient_email:  formData.supervisorEmail,
    recipient_name:   formData.supervisorName,
    intro_message:    `${user?.name || formData.staffName} from the ${formData.department} department has submitted a leave request requiring your approval.`,
    contact_address:  formData.contactAddress,
    mobile_number:    formData.mobileNumber,
    submitted_at:     new Date().toLocaleString("en-NG", { timeZone: "Africa/Lagos" }),
  });
}

// ── TEMPLATE A: Approver Notifications ───────────────────────────────────────
/**
 * Notify HR when approver approves with no further approval needed
 */
export async function sendHrNotification(formData, approverName) {
  return send(TEMPLATE_APPROVER_NOTIFY, {
    ...leaveParams(formData, null),
    recipient_email: HR_EMAIL,
    recipient_name:  "HR / People & Culture",
    intro_message:   `A leave request from ${formData.staffName} (${formData.department}) has been approved by ${approverName} and is now pending your final approval.`,
  });
}

/**
 * Notify second approver when first approver forwards the request
 */
export async function sendSecondApproverNotification(formData, approverName, secondApproverEmail) {
  return send(TEMPLATE_APPROVER_NOTIFY, {
    ...leaveParams(formData, null),
    recipient_email: secondApproverEmail,
    recipient_name:  secondApproverEmail.split("@")[0],  // best guess at name until we have a directory
    intro_message:   `A leave request from ${formData.staffName} (${formData.department}) has been approved by ${approverName} and forwarded to you for further approval before HR.`,
  });
}

/**
 * Notify HR when second approver approves
 */
export async function sendHrNotificationFromSecondApprover(formData, approverName) {
  return send(TEMPLATE_APPROVER_NOTIFY, {
    ...leaveParams(formData, null),
    recipient_email: HR_EMAIL,
    recipient_name:  "HR / People & Culture",
    intro_message:   `A leave request from ${formData.staffName} (${formData.department}) has passed both approvals (latest: ${approverName}) and is now pending your final approval.`,
  });
}