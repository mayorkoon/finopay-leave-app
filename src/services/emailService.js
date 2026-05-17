/**
 * Email Service — calls Finopay's Azure Function proxy
 * which forwards to Netcore email API using the company API key.
 *
 * All emails go through one function: sendEmail(to, toName, subject, htmlBody)
 */

const FUNCTION_URL = import.meta.env.VITE_EMAIL_FUNCTION_URL;
const HR_EMAIL     = import.meta.env.VITE_HR_EMAIL  || "peopleandculture@finopay.com";
const MD_EMAIL     = import.meta.env.VITE_MD_EMAIL  || "abiodun.oyewale@finopay.com";
const FROM_NAME    = "Finopay HR";

// ── Core send function ────────────────────────────────────────────────────────
async function sendEmail(to, toName, subject, htmlBody) {
  const res = await fetch(FUNCTION_URL, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify({ to, toName, subject, htmlBody }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error || `Email send failed: ${res.status}`);
  }
  return res.json();
}

// ── HTML email builder ────────────────────────────────────────────────────────
function buildHtml(heading, intro, details, actionSection) {
  const rows = Object.entries(details)
    .map(([k, v]) => `
      <tr>
        <td style="padding:8px 16px;font-size:13px;color:#64748b;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;white-space:nowrap;background:#f8fafc;border-bottom:1px solid #f1f5f9;">${k}</td>
        <td style="padding:8px 16px;font-size:13px;color:#1e293b;border-bottom:1px solid #f1f5f9;">${v || "—"}</td>
      </tr>`)
    .join("");

  return `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:32px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.07);">
        
        <!-- Header -->
        <tr>
          <td style="background:#1e293b;padding:24px 32px;">
            <span style="font-size:22px;font-weight:800;color:#fff;">Fino</span><span style="font-size:22px;font-weight:800;color:#e74c3c;">pay</span>
            <span style="font-size:13px;color:#94a3b8;margin-left:12px;">HR Leave Management</span>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:32px;">
            <h2 style="margin:0 0 16px;font-size:18px;font-weight:700;color:#1e293b;">${heading}</h2>
            <p style="margin:0 0 24px;font-size:14px;color:#64748b;line-height:1.6;">${intro}</p>

            <!-- Details table -->
            <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e2e8f0;border-radius:10px;overflow:hidden;margin-bottom:24px;">
              ${rows}
            </table>

            ${actionSection ? `<div style="background:#f8fafc;border-radius:10px;padding:16px 20px;font-size:13px;color:#475569;line-height:1.7;white-space:pre-line;">${actionSection}</div>` : ""}
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#f8fafc;padding:16px 32px;border-top:1px solid #f1f5f9;">
            <p style="margin:0;font-size:11px;color:#94a3b8;text-align:center;">
              This is an automated message from the Finopay HR Leave Management System.<br>
              Please do not reply to this email.
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

// ── Leave details helper ──────────────────────────────────────────────────────
function leaveDetails(leave) {
  return {
    "Staff Name":   leave.staffName,
    "Department":   leave.department,
    "Leave Type":   Array.isArray(leave.leaveTypes) ? leave.leaveTypes.join(", ") : leave.leaveTypes,
    "Start Date":   leave.startDate,
    "End Date":     leave.endDate,
    "Working Days": leave.totalDays,
    "Reliever":     leave.relieverName,
    "Supervisor":   leave.supervisorName,
  };
}

// ── TEMPLATE A: Approver chain notifications ──────────────────────────────────

export async function sendSupervisorEmail(formData, user) {
  const staffName = user?.name || formData.staffName;
  const subject   = `Leave Request — ${staffName}`;
  const intro     = `${staffName} from the ${formData.department} department has submitted a leave request requiring your approval.`;
  const action    = `Please log in to the Finopay Leave Management System to review and action this request.\n${window.location.origin}`;
  const html      = buildHtml("New Leave Request", intro, leaveDetails({ ...formData, staffName }), action);
  return sendEmail(formData.supervisorEmail, formData.supervisorName, subject, html);
}

export async function sendHrNotification(leave, approverName) {
  const subject = `Leave Request Approved — ${leave.staffName} (Pending HR)`;
  const intro   = `A leave request from ${leave.staffName} (${leave.department}) has been approved by ${approverName} and is now pending your final approval.`;
  const action  = `Please log in to the Finopay Leave Management System to complete the final approval.\n${window.location.origin}`;
  const html    = buildHtml("Action Required — HR Approval", intro, leaveDetails(leave), action);
  return sendEmail(HR_EMAIL, "HR / People & Culture", subject, html);
}

export async function sendSecondApproverNotification(leave, approverName, secondApproverEmail) {
  const subject = `Leave Request Forwarded — ${leave.staffName}`;
  const intro   = `A leave request from ${leave.staffName} (${leave.department}) has been approved by ${approverName} and forwarded to you for further approval before HR.`;
  const action  = `Please log in to the Finopay Leave Management System to review and action this request.\n${window.location.origin}`;
  const html    = buildHtml("Action Required — Second Approval", intro, leaveDetails(leave), action);
  return sendEmail(secondApproverEmail, secondApproverEmail.split("@")[0], subject, html);
}

export async function sendHrNotificationFromSecondApprover(leave, approverName) {
  const subject = `Leave Request Approved — ${leave.staffName} (Pending HR)`;
  const intro   = `A leave request from ${leave.staffName} (${leave.department}) has passed both approvals (latest: ${approverName}) and is now pending your final approval.`;
  const action  = `Please log in to the Finopay Leave Management System to complete the final approval.\n${window.location.origin}`;
  const html    = buildHtml("Action Required — HR Final Approval", intro, leaveDetails(leave), action);
  return sendEmail(HR_EMAIL, "HR / People & Culture", subject, html);
}

// ── TEMPLATE B: Outcome notifications ────────────────────────────────────────

export async function sendStaffApprovedEmail(leave) {
  const subject = `Your Leave Request Has Been Approved ✓`;
  const intro   = `Great news! Your leave request has been fully approved by HR.`;
  const action  = leave.resumptionDate
    ? `Your resumption date is ${leave.resumptionDate}.\n\nPlease ensure you have made arrangements with your reliever (${leave.relieverName}) before proceeding on leave.\n\nIMPORTANT: Do not go on leave without email advice from People & Culture.`
    : `Please ensure you have made arrangements with your reliever (${leave.relieverName}) before proceeding on leave.\n\nIMPORTANT: Do not go on leave without email advice from People & Culture.`;
  const html    = buildHtml("Leave Request Approved", intro, leaveDetails(leave), action);
  return sendEmail(leave.staffEmail, leave.staffName, subject, html);
}

export async function sendStaffRejectedEmail(leave) {
  const subject = `Your Leave Request Has Been Rejected`;
  const intro   = `Your leave request has been reviewed and unfortunately could not be approved at this time.`;
  const action  = `Please contact your supervisor or HR if you have any questions regarding this decision.`;
  const html    = buildHtml("Leave Request Rejected", intro, leaveDetails(leave), action);
  return sendEmail(leave.staffEmail, leave.staffName, subject, html);
}

// ── MD Allowance notifications ────────────────────────────────────────────────

export async function sendMdAllowanceRequest(leave, approveToken) {
  const reviewUrl = `${window.location.origin}/allowance/review?token=${approveToken}`;
  const subject   = `Leave Allowance Approval Required — ${leave.staffName}`;
  const intro     = `${leave.staffName} from ${leave.department} has been approved for leave and is requesting a leave allowance. Your review is required.`;
  const action    = `Please click the link below to review and action this request:\n<a href="${reviewUrl}" style="color:#c0392b;font-weight:600;">Review Allowance Request →</a>\n\nThis link expires in 72 hours. The staff member's leave is already approved regardless of your decision on the allowance.`;
  const html      = buildHtml("Allowance Approval Required", intro, leaveDetails(leave), action);
  return sendEmail(MD_EMAIL, "MD", subject, html);
}

export async function sendHrAllowanceDecision(leave, approved) {
  const subject = `Leave Allowance ${approved ? "Approved" : "Rejected"} by MD — ${leave.staffName}`;
  const intro   = `The MD has ${approved ? "approved" : "rejected"} the leave allowance request for ${leave.staffName} (${leave.department}).`;
  const action  = approved
    ? `Please process the leave allowance payment for ${leave.staffName} accordingly.`
    : `No further action is required regarding the allowance. The staff member's leave remains active.`;
  const html    = buildHtml(`Allowance ${approved ? "Approved" : "Rejected"} by MD`, intro, leaveDetails(leave), action);
  return sendEmail(HR_EMAIL, "HR / People & Culture", subject, html);
}
