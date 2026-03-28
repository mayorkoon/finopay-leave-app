import emailjs from "emailjs-com";

const SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID;
const TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
const PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

/**
 * Send leave request notification email to the direct supervisor.
 *
 * EmailJS Template variables used (set these up in your EmailJS dashboard):
 *   {{supervisor_name}}   - Name of supervisor
 *   {{supervisor_email}}  - Supervisor's email (used as TO address)
 *   {{staff_name}}        - Applicant's name
 *   {{staff_email}}       - Applicant's email
 *   {{department}}        - Department/Unit
 *   {{leave_types}}       - e.g. "Annual Leave"
 *   {{start_date}}        - Leave start date
 *   {{end_date}}          - Leave end date
 *   {{total_days}}        - Number of days
 *   {{reliever_name}}     - Name of reliever
 *   {{contact_address}}   - Contact address during leave
 *   {{mobile_number}}     - Mobile number
 *   {{submitted_at}}      - Submission timestamp
 *
 * EmailJS setup steps:
 * 1. Go to https://www.emailjs.com and create a free account
 * 2. Connect your email service (Gmail, Outlook, etc.)
 * 3. Create an email template using the variables above
 * 4. Copy your Service ID, Template ID, and Public Key into .env
 */
export async function sendSupervisorEmail(formData, user) {
  const templateParams = {
    supervisor_name: formData.supervisorName,
    supervisor_email: formData.supervisorEmail,  // Add this field to your form if needed
    staff_name: user.name,
    staff_email: user.email,
    department: formData.department,
    leave_types: formData.leaveTypes.join(", "),
    start_date: formData.startDate,
    end_date: formData.endDate,
    total_days: formData.totalDays,
    reliever_name: formData.relieverName,
    contact_address: formData.contactAddress,
    mobile_number: formData.mobileNumber,
    submitted_at: new Date().toLocaleString("en-NG", { timeZone: "Africa/Lagos" }),
  };

  return emailjs.send(SERVICE_ID, TEMPLATE_ID, templateParams, PUBLIC_KEY);
}
