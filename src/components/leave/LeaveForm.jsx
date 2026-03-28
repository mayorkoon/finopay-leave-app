import { useAuth } from "../../auth/AuthProvider";
import { useLeaveForm } from "../../hooks/useLeaveForm";
import { LEAVE_TYPES } from "../../constants/leaveTypes";
import InputField from "../ui/InputField";
import CheckboxField from "../ui/CheckboxField";
import SectionHeader from "../ui/SectionHeader";
import LeaveSuccess from "./LeaveSuccess";

const CONFIRMATION_OPTIONS = ["Confirmed", "Not Confirmed", "Contract"];

export default function LeaveForm() {
  const { user } = useAuth();
  const {
    form,
    errors,
    status,
    submitError,
    setField,
    toggleLeaveType,
    handleDateChange,
    submit,
    reset,
  } = useLeaveForm(user);

  if (status === "success") {
    return <LeaveSuccess form={form} onReset={reset} />;
  }

  const isSubmitting = status === "submitting";

  const selectStyle = (hasError) => ({
    padding: "10px 14px",
    borderRadius: 8,
    border: `1.5px solid ${hasError ? "#fca5a5" : "#e2e8f0"}`,
    fontSize: 14,
    fontFamily: "'DM Sans', sans-serif",
    color: "#1e293b",
    background: "#fff",
    outline: "none",
    width: "100%",
    cursor: "pointer",
    appearance: "none",
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
    backgroundRepeat: "no-repeat",
    backgroundPosition: "right 14px center",
    paddingRight: 36,
  });

  const labelStyle = {
    fontSize: 12,
    fontWeight: 600,
    color: "#475569",
    letterSpacing: "0.05em",
    textTransform: "uppercase",
    fontFamily: "'DM Sans', sans-serif",
    display: "block",
    marginBottom: 4,
  };

  const errorStyle = {
    fontSize: 11,
    color: "#e11d48",
    fontFamily: "'DM Sans', sans-serif",
    marginTop: 3,
  };

  return (
    <div style={{ maxWidth: 740, margin: "0 auto", padding: "32px 16px", fontFamily: "'DM Sans', sans-serif" }}>

      {/* Error Summary */}
      {Object.keys(errors).length > 0 && (
        <div style={{
          background: "#fff1f2", border: "1.5px solid #fecdd3",
          borderRadius: 12, padding: "12px 20px", marginBottom: 20,
        }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#e11d48", marginBottom: 4 }}>
            ⚠ Please fix the following before submitting:
          </div>
          <ul style={{ margin: 0, paddingLeft: 20 }}>
            {Object.values(errors).map((e, i) => (
              <li key={i} style={{ fontSize: 12, color: "#be123c" }}>{e}</li>
            ))}
          </ul>
        </div>
      )}

      {submitError && (
        <div style={{
          background: "#fff1f2", border: "1.5px solid #fecdd3",
          borderRadius: 12, padding: "12px 20px", marginBottom: 20,
          fontSize: 13, color: "#e11d48", fontWeight: 600,
        }}>
          {submitError}
        </div>
      )}

      {/* Form Card */}
      <div style={{
        background: "#fff", borderRadius: 20,
        boxShadow: "0 8px 40px rgba(0,0,0,0.07)",
        border: "1px solid #f1f5f9", overflow: "hidden",
      }}>
        <div style={{ padding: "32px 32px 40px" }}>

          {/* ── SECTION 1: Staff Info ── */}
          <SectionHeader title="Staff Information" />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 32 }}>
            <InputField
              label="Staff Name"
              value={form.staffName}
              onChange={setField("staffName")}
              required
              error={errors.staffName}
            />
            <InputField
              label="Staff Number"
              value={form.staffNumber}
              onChange={setField("staffNumber")}
            />
            <InputField
              label="Department / Unit"
              value={form.department}
              onChange={setField("department")}
              required
              error={errors.department}
            />
            <InputField
              label="Date"
              value={form.date}
              onChange={setField("date")}
              type="date"
              readOnly
            />
            <InputField
              label="Date of Employment"
              value={form.dateOfEmployment}
              onChange={setField("dateOfEmployment")}
              type="date"
            />

            {/* Fix 1 — Confirmation Status dropdown */}
            <div>
              <label style={labelStyle}>
                Confirmation Status
              </label>
              <select
                value={form.confirmationStatus}
                onChange={setField("confirmationStatus")}
                style={selectStyle(false)}
                onFocus={e => e.target.style.borderColor = "#c0392b"}
                onBlur={e => e.target.style.borderColor = "#e2e8f0"}
              >
                <option value="">Select status...</option>
                {CONFIRMATION_OPTIONS.map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>
          </div>

          {/* ── SECTION 2: Leave Type ── */}
          <SectionHeader title="Reason for Leave" />
          {errors.leaveTypes && (
            <div style={{ ...errorStyle, marginBottom: 10 }}>{errors.leaveTypes}</div>
          )}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
            {LEAVE_TYPES.map((lt) => (
              <CheckboxField
                key={lt.id}
                label={lt.label}
                checked={form.leaveTypes.includes(lt.id)}
                onChange={() => toggleLeaveType(lt.id)}
              />
            ))}
          </div>
          <div style={{ marginBottom: 32 }}>
            <InputField
              label="Others (specify)"
              value={form.othersNote}
              onChange={setField("othersNote")}
              placeholder="Describe other leave reason if applicable..."
            />
          </div>

          {/* ── SECTION 3: Leave Request ── */}
          <SectionHeader title="Leave Request" />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 20, marginBottom: 20 }}>
            <InputField
              label="Start Date"
              value={form.startDate}
              onChange={(e) => handleDateChange("startDate", e.target.value)}
              type="date"
              required
              error={errors.startDate}
            />
            <InputField
              label="End Date"
              value={form.endDate}
              onChange={(e) => handleDateChange("endDate", e.target.value)}
              type="date"
              required
              error={errors.endDate}
            />
            {/* Fix 2 — Total days label clarifies working days */}
            <div>
              <label style={labelStyle}>Total Working Days</label>
              <input
                type="text"
                value={form.totalDays}
                readOnly
                placeholder="Auto-calculated"
                style={{
                  padding: "10px 14px", borderRadius: 8,
                  border: "1.5px solid #e2e8f0", fontSize: 14,
                  fontFamily: "'DM Sans', sans-serif", color: "#1e293b",
                  background: "#f8fafc", width: "100%", outline: "none",
                  cursor: "default",
                }}
              />
              <span style={{ fontSize: 11, color: "#94a3b8", marginTop: 3, display: "block" }}>
                Excludes weekends
              </span>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 32 }}>
            <div style={{ gridColumn: "1 / -1" }}>
              <InputField
                label="Contact Address During Leave"
                value={form.contactAddress}
                onChange={setField("contactAddress")}
                required
                placeholder="Full residential address..."
                error={errors.contactAddress}
              />
            </div>
            <InputField
              label="Mobile Number"
              value={form.mobileNumber}
              onChange={setField("mobileNumber")}
              required
              placeholder="e.g. 08012345678"
              error={errors.mobileNumber}
            />
            <InputField
              label="Alternative Email"
              value={form.alternativeEmail}
              onChange={setField("alternativeEmail")}
              type="email"
              placeholder="personal@email.com"
            />
            <InputField
              label="Name of Reliever"
              value={form.relieverName}
              onChange={setField("relieverName")}
              required
              placeholder="Who covers for you?"
              error={errors.relieverName}
            />
            <InputField
              label="Direct Supervisor Name"
              value={form.supervisorName}
              onChange={setField("supervisorName")}
              required
              placeholder="Your supervisor's full name"
              error={errors.supervisorName}
            />

            {/* Fix 3 — Supervisor email: mandatory + @finopay.com only */}
            <div style={{ gridColumn: "1 / -1" }}>
              <label style={labelStyle}>
                Supervisor Email <span style={{ color: "#e11d48" }}>*</span>
              </label>
              <input
                type="email"
                value={form.supervisorEmail}
                onChange={setField("supervisorEmail")}
                placeholder="supervisor@finopay.com"
                style={selectStyle(!!errors.supervisorEmail)}
                onFocus={e => e.target.style.borderColor = "#c0392b"}
                onBlur={e => e.target.style.borderColor = errors.supervisorEmail ? "#fca5a5" : "#e2e8f0"}
              />
              {errors.supervisorEmail ? (
                <span style={errorStyle}>{errors.supervisorEmail}</span>
              ) : (
                <span style={{ fontSize: 11, color: "#94a3b8", marginTop: 3, display: "block" }}>
                  Must be a @finopay.com address
                </span>
              )}
            </div>
          </div>

          {/* ── Note ── */}
          <div style={{
            background: "#fffbeb", border: "1.5px solid #fde68a",
            borderRadius: 12, padding: "12px 16px", marginBottom: 32,
            display: "flex", gap: 10, alignItems: "flex-start",
          }}>
            <span style={{ fontSize: 16, flexShrink: 0 }}>⚠️</span>
            <p style={{ margin: 0, fontSize: 13, color: "#92400e", lineHeight: 1.6, fontFamily: "'DM Sans', sans-serif" }}>
              <strong>Note:</strong> Please do not go on leave without email advice from People & Culture.
            </p>
          </div>

          {/* ── Submit ── */}
          <button
            onClick={submit}
            disabled={isSubmitting}
            style={{
              width: "100%", padding: "16px", borderRadius: 12, border: "none",
              background: isSubmitting ? "#94a3b8" : "linear-gradient(135deg, #c0392b 0%, #e74c3c 100%)",
              color: "#fff", fontSize: 15, fontWeight: 700,
              cursor: isSubmitting ? "not-allowed" : "pointer",
              fontFamily: "'DM Sans', sans-serif", letterSpacing: "0.05em",
              boxShadow: isSubmitting ? "none" : "0 8px 24px rgba(192,57,43,0.35)",
              transition: "all 0.2s",
            }}
          >
            {isSubmitting ? "Submitting..." : "Submit Leave Request →"}
          </button>
        </div>
      </div>
    </div>
  );
}
