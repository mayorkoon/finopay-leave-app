import { useState } from "react";
import { calculateLeaveDays } from "../utils/calculateLeaveDays";
import { validateLeaveForm } from "../utils/validators";
import { submitLeaveRequest } from "../services/leaveService";
import { sendSupervisorEmail } from "../services/emailService";

const initialForm = {
  staffName: "",
  staffNumber: "",
  department: "",
  date: new Date().toISOString().split("T")[0],
  dateOfEmployment: "",
  confirmationStatus: "",
  leaveTypes: [],
  othersNote: "",
  startDate: "",
  endDate: "",
  totalDays: "",
  contactAddress: "",
  mobileNumber: "",
  alternativeEmail: "",
  relieverName: "",
  supervisorName: "",
  supervisorEmail: "",
};

export function useLeaveForm(user) {
  const [form, setForm] = useState({
    ...initialForm,
    staffName: user?.name || "",
    department: user?.department || "",
  });

  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState("idle"); // idle | submitting | success | error
  const [submitError, setSubmitError] = useState("");

  const setField = (key) => (e) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const toggleLeaveType = (id) => {
    setForm((f) => ({
      ...f,
      leaveTypes: f.leaveTypes.includes(id)
        ? f.leaveTypes.filter((t) => t !== id)
        : [...f.leaveTypes, id],
    }));
  };

  const handleDateChange = (key, value) => {
    setForm((prev) => {
      const updated = { ...prev, [key]: value };
      updated.totalDays = calculateLeaveDays(
        key === "startDate" ? value : prev.startDate,
        key === "endDate" ? value : prev.endDate
      );
      return updated;
    });
  };

  const reset = () => {
    setForm({
      ...initialForm,
      staffName: user?.name || "",
      department: user?.department || "",
    });
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
      // 1. Save to Firestore — this is the critical operation
      await submitLeaveRequest(form, user);

      // 2. Send email — non-blocking, won't fail submission if EmailJS not configured yet
      sendSupervisorEmail(form, user).catch((err) =>
        console.warn("[EmailJS] Notification skipped — configure VITE_EMAILJS_* in .env to enable:", err?.text || err?.message || err)
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

  return {
    form,
    errors,
    status,
    submitError,
    setField,
    toggleLeaveType,
    handleDateChange,
    submit,
    reset,
  };
}
