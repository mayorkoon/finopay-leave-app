import emailjs from "emailjs-com";

const SERVICE_ID              = import.meta.env.VITE_EMAILJS_SERVICE_ID;
const PUBLIC_KEY              = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;
const TEMPLATE_APPROVER_NOTIFY = import.meta.env.VITE_EMAILJS_TEMPLATE_APPROVER_NOTIFY;
const TEMPLATE_OUTCOME        = import.meta.env.VITE_EMAILJS_TEMPLATE_OUTCOME;

const HR_EMAIL = import.meta.env.VITE_HR_EMAIL || "hr@finopay.com";
const MD_EMAIL = import.meta.env.VITE_MD_EMAIL || "md@finopay.com";

function send(templateId, params) {
  return emailjs.send(SERVICE_ID, templateId, params, PUBLIC_KEY);
}

function leaveParams(leave) {
  return {
    staff_name:   leave.staffName,
    staff_email:  leave.staffEmail,
    department:   leave.department,
    leave_types:  Array.isArray(leave.leaveTypes)
                    ? leave.leaveTypes.join(", ")
                    : leave.leaveTypes,
    start_date:   leave.startDate,
    end_date:     leave.endDate,
    total_days:   leave.totalDays,
    app_url:      window.location.origin,
  };
}

// ── TEMPLATE A: All approver chain notifications ──────────────────────────────

export async function sendSupervisorEmail(formData, user) {
  return send(TEMPLATE_APPROVER_NOTIFY, {
    ...leaveParams({ ...formData, staffName: user?.name || formData.staffName, staffEmail: user?.email || formData.staffEmail }),
    recipient_email: formData.supervisorEmail,
    recipient_name:  formData.supervisorName,
    intro_message:   `${user?.name || formData.staffName} from the ${formData.department} department has submitted a leave request requiring your approval.`,
    contact_address: formData.contactAddress,
    mobile_number:   formData.mobileNumber,
    submitted_at:    new Date().toLocaleString("en-NG", { timeZone: "Africa/Lagos" }),
  });
}

export async function sendHrNotification(leave, approverName) {
  return send(TEMPLATE_APPROVER_NOTIFY, {
    ...leaveParams(leave),
    recipient_email: HR_EMAIL,
    recipient_name:  "HR / People & Culture",
    intro_message:   `A leave request from ${leave.staffName} (${leave.department}) has been approved by ${approverName} and is now pending your final approval.`,
  });
}

export async function sendSecondApproverNotification(leave, approverName, secondApproverEmail) {
  return send(TEMPLATE_APPROVER_NOTIFY, {
    ...leaveParams(leave),
    recipient_email: secondApproverEmail,
    recipient_name:  secondApproverEmail.split("@")[0],
    intro_message:   `A leave request from ${leave.staffName} (${leave.department}) has been approved by ${approverName} and forwarded to you for further approval before HR.`,
  });
}

export async function sendHrNotificationFromSecondApprover(leave, approverName) {
  return send(TEMPLATE_APPROVER_NOTIFY, {
    ...leaveParams(leave),
    recipient_email: HR_EMAIL,
    recipient_name:  "HR / People & Culture",
    intro_message:   `A leave request from ${leave.staffName} (${leave.department}) has passed both approvals (latest: ${approverName}) and is now pending your final approval.`,
  });
}

// ── TEMPLATE B: Staff outcome notifications ───────────────────────────────────

export async function sendStaffApprovedEmail(leave) {
  return send(TEMPLATE_OUTCOME, {
    ...leaveParams(leave),
    recipient_email: leave.staffEmail,
    recipient_name:  leave.staffName,
    email_subject:   "Your Leave Request Has Been Approved ✓",
    intro_message:   `Great news! Your leave request has been fully approved by HR.`,
    action_section:  leave.resumptionDate
      ? `Your resumption date is ${leave.resumptionDate}. Please ensure you have made arrangements with your reliever (${leave.relieverName}) before proceeding on leave.\n\nIMPORTANT: Do not go on leave without email advice from People & Culture.`
      : `Please ensure you have made arrangements with your reliever (${leave.relieverName}) before proceeding on leave.\n\nIMPORTANT: Do not go on leave without email advice from People & Culture.`,
  });
}

export async function sendStaffRejectedEmail(leave) {
  return send(TEMPLATE_OUTCOME, {
    ...leaveParams(leave),
    recipient_email: leave.staffEmail,
    recipient_name:  leave.staffName,
    email_subject:   "Your Leave Request Has Been Rejected",
    intro_message:   `Your leave request has been reviewed and unfortunately could not be approved at this time.`,
    action_section:  `Please contact your supervisor or HR if you have any questions regarding this decision.`,
  });
}

// ── MD Allowance notifications ────────────────────────────────────────────────

export async function sendMdAllowanceRequest(leave, approveToken, rejectToken) {
  const baseUrl = window.location.origin;
  const approveUrl = `${baseUrl}/allowance/review?token=${approveToken}&action=approve`;
  const rejectUrl  = `${baseUrl}/allowance/review?token=${rejectToken}&action=reject`;

  return send(TEMPLATE_OUTCOME, {
    ...leaveParams(leave),
    recipient_email: MD_EMAIL,
    recipient_name:  "MD",
    email_subject:   `Leave Allowance Approval Required — ${leave.staffName}`,
    intro_message:   `${leave.staffName} from ${leave.department} has been approved for leave and is requesting a leave allowance. Your approval is required.`,
    action_section:  `To approve this allowance request, click the link below:\n${approveUrl}\n\nTo reject this allowance request, click the link below:\n${rejectUrl}\n\nNote: These links expire in 72 hours. The staff member's leave is already approved regardless of your decision on the allowance.`,
  });
}

export async function sendHrAllowanceDecision(leave, approved) {
  return send(TEMPLATE_OUTCOME, {
    ...leaveParams(leave),
    recipient_email: HR_EMAIL,
    recipient_name:  "HR / People & Culture",
    email_subject:   `Leave Allowance ${approved ? "Approved" : "Rejected"} by MD — ${leave.staffName}`,
    intro_message:   `The MD has ${approved ? "approved" : "rejected"} the leave allowance request for ${leave.staffName} (${leave.department}).`,
    action_section:  approved
      ? `Please process the leave allowance payment for ${leave.staffName} accordingly.`
      : `No further action is required regarding the allowance. The staff member's leave remains active.`,
  });
}