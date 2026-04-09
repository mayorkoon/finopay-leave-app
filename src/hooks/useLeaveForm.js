import { useState } from "react";
import { calculateLeaveDays } from "../utils/calculateLeaveDays";
import { validateLeaveForm } from "../utils/validators";
import { submitLeaveRequest } from "../services/sharepointService";
import { sendSupervisorEmail } from "../services/emailService";
import { getBandForGrade } from "../constants/leaveEntitlements";

const today = new Date().toISOString().split("T")[0];

const initialForm = {
  staffName: "", staffNumber: "", department: "",
  date: today, dateOfEmployment: "", confirmationStatus: "",
  leaveTypes: [], othersNote: "", startDate: "", endDate: "",
  totalDays: "", contactAddress: "", mobileNumber: "",
  alternativeEmail: "", relieverName: "", supervisorName: "",
  supervisorEmail: "", grade: "", requestAllowance: false,
};

export function useLeaveForm(user) {
  const [form, setForm] = useState({
    ...initialForm,
    staffName:  user?.name       || "",
    department: user?.department || "",
  });
  const [errors, setErrors]           = useState({});
  const [status, setStatus]           = useState("idle");
  const [submitError, setSubmitError] = useState("");

  const setField = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const selectLeaveType = (id) => {
    setForm((f) => ({ ...f, leaveTypes: f.leaveTypes.includes(id) ? [] : [id] }));
  };

  const handleDateChange = (key, value) => {
    setForm((prev) => {
      const updated = { ...prev, [key]: value };
      updated.totalDays = calculateLeaveDays(
        key === "startDate" ? value : prev.startDate,
        key === "endDate"   ? value : prev.endDate
      );
      return updated;
    });
  };

  const toggleAllowance = () => setForm((f) => ({ ...f, requestAllowance: !f.requestAllowance }));

  const reset = () => {
    setForm({ ...initialForm, staffName: user?.name || "", department: user?.department || "" });
    setErrors({});
    setStatus("idle");
    setSubmitError("");
  };

  const submit = async () => {
    const validationErrors = validateLeaveForm(form);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return false;
    }
    setErrors({});
    setStatus("submitting");
    setSubmitError("");
    try {
      const band = getBandForGrade(form.grade);
      const formToSave = { ...form, band, grade: undefined };
      await submitLeaveRequest(formToSave, user);
      sendSupervisorEmail(formToSave, user).catch((err) =>
        console.warn("[EmailJS] Notification skipped:", err?.text || err?.message || err)
      );
      setStatus("success");
      return true;
    } catch (err) {
      console.error("Submission failed:", err);
      setSubmitError("Submission failed. Please try again.");
      setStatus("error");
      return false;
    }
  };

  return { form, errors, status, submitError, setField, selectLeaveType, handleDateChange, toggleAllowance, submit, reset };
}