/**
 * Validate the leave request form
 * @param {object} form
 * @returns {object} errors - keyed by field name
 */
export function validateLeaveForm(form) {
  const errors = {};
  const today = new Date().toISOString().split("T")[0];

  if (!form.staffName?.trim()) errors.staffName = "Staff name is required";
  if (!form.department?.trim()) errors.department = "Department is required";

  // Bug Fix 2 — only one leave type allowed
  if (!form.leaveTypes || form.leaveTypes.length === 0)
    errors.leaveTypes = "Please select a leave type";
  else if (form.leaveTypes.length > 1)
    errors.leaveTypes = "Only one leave type can be selected per request";

  // Bug Fix 1 — dates cannot be in the past
  if (!form.startDate) {
    errors.startDate = "Start date is required";
  } else if (form.startDate < today) {
    errors.startDate = "Start date cannot be in the past";
  }

  if (!form.endDate) {
    errors.endDate = "End date is required";
  } else if (form.endDate < today) {
    errors.endDate = "End date cannot be in the past";
  } else if (form.startDate && form.endDate < form.startDate) {
    errors.endDate = "End date must be on or after start date";
  }

  if (!form.contactAddress?.trim())
    errors.contactAddress = "Contact address is required";

  if (!form.mobileNumber?.trim())
    errors.mobileNumber = "Mobile number is required";
  else if (!/^0[789][01]\d{8}$/.test(form.mobileNumber.replace(/\s/g, "")))
    errors.mobileNumber = "Enter a valid Nigerian mobile number";

  if (!form.relieverName?.trim()) errors.relieverName = "Reliever name is required";
  if (!form.supervisorName?.trim()) errors.supervisorName = "Supervisor name is required";

  if (!form.supervisorEmail?.trim())
    errors.supervisorEmail = "Supervisor email is required";
  else if (!/^[^\s@]+@finopay\.com$/i.test(form.supervisorEmail.trim()))
    errors.supervisorEmail = "Supervisor email must be a @finopay.com address";

  return errors;
}
