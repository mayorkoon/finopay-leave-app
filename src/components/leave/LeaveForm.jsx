import { useAuth } from "../../auth/AuthProvider";
import { useLeaveForm } from "../../hooks/useLeaveForm";
import { useLeaveBalance } from "../../hooks/useLeaveBalance";
import { LEAVE_TYPES } from "../../constants/leaveTypes";
import { GRADES, TRACKABLE_LEAVE_TYPES } from "../../constants/leaveEntitlements";
import InputField from "../ui/InputField";
import SectionHeader from "../ui/SectionHeader";
import LeaveSuccess from "./LeaveSuccess";

const CONFIRMATION_OPTIONS = ["Confirmed", "Not Confirmed", "Contract"];
const TODAY = new Date().toISOString().split("T")[0];

const labelStyle = {
  fontSize: 12, fontWeight: 600, color: "#475569",
  letterSpacing: "0.05em", textTransform: "uppercase",
  fontFamily: "'DM Sans', sans-serif", display: "block", marginBottom: 4,
};

const errorStyle = {
  fontSize: 11, color: "#e11d48",
  fontFamily: "'DM Sans', sans-serif", marginTop: 3, display: "block",
};

const hintStyle = {
  fontSize: 11, color: "#94a3b8",
  fontFamily: "'DM Sans', sans-serif", marginTop: 3, display: "block",
};

function SelectInput({ value, onChange, children, hasError }) {
  return (
    <select
      value={value}
      onChange={onChange}
      style={{
        padding: "10px 14px", borderRadius: 8, fontSize: 14,
        border: `1.5px solid ${hasError ? "#fca5a5" : "#e2e8f0"}`,
        fontFamily: "'DM Sans', sans-serif", color: "#1e293b",
        background: "#fff", outline: "none", width: "100%",
        cursor: "pointer", appearance: "none",
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
        backgroundRepeat: "no-repeat", backgroundPosition: "right 14px center", paddingRight: 36,
      }}
      onFocus={e => e.target.style.borderColor = "#c0392b"}
      onBlur={e  => e.target.style.borderColor = hasError ? "#fca5a5" : "#e2e8f0"}
    >
      {children}
    </select>
  );
}

// ── Leave Type Radio Button ──────────────────────────────────────────────────
function LeaveTypeOption({ label, selected, onChange, exhausted }) {
  const disabled = exhausted && !selected;
  return (
    <label style={{
      display: "flex", alignItems: "center", gap: 10,
      cursor: disabled ? "not-allowed" : "pointer",
      padding: "10px 14px", borderRadius: 8,
      border: `1.5px solid ${exhausted ? "#e2e8f0" : selected ? "#c0392b" : "#e2e8f0"}`,
      background: exhausted ? "#f8fafc" : selected ? "#fff1f2" : "#fff",
      transition: "all 0.2s", userSelect: "none",
      fontFamily: "'DM Sans', sans-serif",
      opacity: exhausted ? 0.6 : 1,
    }}>
      <div style={{
        width: 18, height: 18, borderRadius: "50%",
        border: `2px solid ${selected ? "#c0392b" : "#cbd5e1"}`,
        background: selected ? "#c0392b" : "#fff",
        display: "flex", alignItems: "center", justifyContent: "center",
        flexShrink: 0, transition: "all 0.2s",
      }}>
        {selected && (
          <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#fff" }} />
        )}
      </div>
      <div style={{ flex: 1 }}>
        <span style={{
          fontSize: 14, fontWeight: selected ? 600 : 400,
          color: exhausted ? "#94a3b8" : selected ? "#c0392b" : "#1e293b",
          display: "block",
        }}>
          {label}
        </span>
        {exhausted && (
          <span style={{ fontSize: 11, color: "#ef4444", fontWeight: 600 }}>
            Balance exhausted
          </span>
        )}
      </div>
      <input type="radio" checked={selected} disabled={disabled} onChange={disabled ? undefined : onChange} style={{ display: "none" }} />
    </label>
  );
}

// ── Allowance Toggle ─────────────────────────────────────────────────────────
function AllowanceToggle({ checked, onChange }) {
  return (
    <div style={{
      padding: "16px 20px", borderRadius: 12,
      border: `1.5px solid ${checked ? "#f59e0b" : "#e2e8f0"}`,
      background: checked ? "#fffbeb" : "#f8fafc",
      transition: "all 0.2s", cursor: "pointer",
    }} onClick={onChange}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{
          width: 44, height: 24, borderRadius: 12,
          background: checked ? "#f59e0b" : "#cbd5e1",
          position: "relative", transition: "background 0.2s", flexShrink: 0,
        }}>
          <div style={{
            width: 18, height: 18, borderRadius: "50%", background: "#fff",
            position: "absolute", top: 3,
            left: checked ? 23 : 3,
            transition: "left 0.2s",
            boxShadow: "0 1px 4px rgba(0,0,0,0.2)",
          }} />
        </div>
        <div>
          <div style={{
            fontSize: 14, fontWeight: 600,
            color: checked ? "#92400e" : "#475569",
            fontFamily: "'DM Sans', sans-serif",
          }}>
            Request Leave Allowance
          </div>
          <div style={{ fontSize: 12, color: "#94a3b8", fontFamily: "'DM Sans', sans-serif", marginTop: 2 }}>
            {checked
              ? "Leave allowance will be reviewed by the MD after HR approval"
              : "Toggle on to include a leave allowance request"}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LeaveForm() {
  const { user } = useAuth();
  const {
    form, errors, status, submitError,
    setField, selectLeaveType, handleDateChange,
    toggleAllowance, submit, reset,
  } = useLeaveForm(user);

  const { balance } = useLeaveBalance(user, form.confirmationStatus, form.grade);

  // Returns true if a leave type's balance is known and exhausted
  const isExhausted = (leaveTypeId) => {
    if (!balance) return false;
    const trackable = TRACKABLE_LEAVE_TYPES[leaveTypeId];
    if (!trackable) return false;
    return balance[trackable.key] <= 0;
  };

  if (status === "success") {
    return <LeaveSuccess form={form} onReset={reset} />;
  }

  const isSubmitting = status === "submitting";

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

      <div style={{
        background: "#fff", borderRadius: 20,
        boxShadow: "0 8px 40px rgba(0,0,0,0.07)",
        border: "1px solid #f1f5f9", overflow: "hidden",
      }}>
        <div style={{ padding: "32px 32px 40px" }}>

          {/* ── SECTION 1: Staff Info ── */}
          <SectionHeader title="Staff Information" />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 32 }}>
            <InputField label="Staff Name" value={form.staffName} onChange={setField("staffName")} required error={errors.staffName} />
            <InputField label="Staff Number" value={form.staffNumber} onChange={setField("staffNumber")} />
            <InputField label="Department / Unit" value={form.department} onChange={setField("department")} required error={errors.department} />
            <InputField label="Date" value={form.date} onChange={() => {}} type="date" readOnly />
            <InputField label="Date of Employment" value={form.dateOfEmployment} onChange={setField("dateOfEmployment")} type="date" required error={errors.dateOfEmployment} />
            <div>
              <label style={labelStyle}>Confirmation Status <span style={{ color: "#e11d48" }}>*</span></label>
              <SelectInput value={form.confirmationStatus} onChange={setField("confirmationStatus")} hasError={!!errors.confirmationStatus}>
                <option value="">Select status...</option>
                {CONFIRMATION_OPTIONS.map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </SelectInput>
              {errors.confirmationStatus && <span style={errorStyle}>{errors.confirmationStatus}</span>}
            </div>
            <div style={{ gridColumn: "1 / -1" }}>
              <label style={labelStyle}>Grade / Level <span style={{ color: "#e11d48" }}>*</span></label>
              <SelectInput value={form.grade || ""} onChange={setField("grade")} hasError={!!errors.grade}>
                <option value="">Select your grade...</option>
                {GRADES.map(g => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </SelectInput>
              {errors.grade && <span style={errorStyle}>{errors.grade}</span>}
            </div>
          </div>

          {/* ── SECTION 2: Leave Type (single select) ── */}
          <SectionHeader title="Reason for Leave" />
          {errors.leaveTypes && <span style={{ ...errorStyle, marginBottom: 10 }}>{errors.leaveTypes}</span>}
          <span style={{ ...hintStyle, marginBottom: 12 }}>Select one leave type per request</span>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
            {LEAVE_TYPES.map((lt) => (
              <LeaveTypeOption
                key={lt.id}
                label={lt.label}
                selected={form.leaveTypes.includes(lt.id)}
                exhausted={isExhausted(lt.id)}
                onChange={() => selectLeaveType(lt.id)}
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
            {/* Bug Fix 1 — min date set to today */}
            <div>
              <label style={labelStyle}>Start Date <span style={{ color: "#e11d48" }}>*</span></label>
              <input
                type="date"
                value={form.startDate}
                min={TODAY}
                onChange={(e) => handleDateChange("startDate", e.target.value)}
                style={{
                  padding: "10px 14px", borderRadius: 8, width: "100%",
                  border: `1.5px solid ${errors.startDate ? "#fca5a5" : "#e2e8f0"}`,
                  fontSize: 14, fontFamily: "'DM Sans', sans-serif",
                  color: "#1e293b", outline: "none", boxSizing: "border-box",
                }}
                onFocus={e => e.target.style.borderColor = "#c0392b"}
                onBlur={e  => e.target.style.borderColor = errors.startDate ? "#fca5a5" : "#e2e8f0"}
              />
              {errors.startDate && <span style={errorStyle}>{errors.startDate}</span>}
            </div>

            <div>
              <label style={labelStyle}>End Date <span style={{ color: "#e11d48" }}>*</span></label>
              <input
                type="date"
                value={form.endDate}
                min={form.startDate || TODAY}
                onChange={(e) => handleDateChange("endDate", e.target.value)}
                style={{
                  padding: "10px 14px", borderRadius: 8, width: "100%",
                  border: `1.5px solid ${errors.endDate ? "#fca5a5" : "#e2e8f0"}`,
                  fontSize: 14, fontFamily: "'DM Sans', sans-serif",
                  color: "#1e293b", outline: "none", boxSizing: "border-box",
                }}
                onFocus={e => e.target.style.borderColor = "#c0392b"}
                onBlur={e  => e.target.style.borderColor = errors.endDate ? "#fca5a5" : "#e2e8f0"}
              />
              {errors.endDate && <span style={errorStyle}>{errors.endDate}</span>}
            </div>

            <div>
              <label style={labelStyle}>Total Working Days</label>
              <input
                type="text" value={form.totalDays} readOnly
                placeholder="Auto-calculated"
                style={{
                  padding: "10px 14px", borderRadius: 8, width: "100%",
                  border: "1.5px solid #e2e8f0", fontSize: 14,
                  fontFamily: "'DM Sans', sans-serif", color: "#1e293b",
                  background: "#f8fafc", outline: "none", cursor: "default",
                  boxSizing: "border-box",
                }}
              />
              <span style={hintStyle}>Excludes weekends</span>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 32 }}>
            <div style={{ gridColumn: "1 / -1" }}>
              <InputField label="Contact Address During Leave" value={form.contactAddress} onChange={setField("contactAddress")} required placeholder="Full residential address..." error={errors.contactAddress} />
            </div>
            <InputField label="Mobile Number" value={form.mobileNumber} onChange={setField("mobileNumber")} required placeholder="e.g. 08012345678" error={errors.mobileNumber} />
            <InputField label="Alternative Email" value={form.alternativeEmail} onChange={setField("alternativeEmail")} type="email" placeholder="personal@email.com" />
            <InputField label="Name of Reliever" value={form.relieverName} onChange={setField("relieverName")} required placeholder="Who covers for you?" error={errors.relieverName} />
            <InputField label="Direct Supervisor Name" value={form.supervisorName} onChange={setField("supervisorName")} required placeholder="Your supervisor's full name" error={errors.supervisorName} />
            <div style={{ gridColumn: "1 / -1" }}>
              <label style={labelStyle}>Supervisor Email <span style={{ color: "#e11d48" }}>*</span></label>
              <input
                type="email"
                value={form.supervisorEmail}
                onChange={setField("supervisorEmail")}
                placeholder="supervisor@finopay.com"
                style={{
                  padding: "10px 14px", borderRadius: 8, width: "100%",
                  border: `1.5px solid ${errors.supervisorEmail ? "#fca5a5" : "#e2e8f0"}`,
                  fontSize: 14, fontFamily: "'DM Sans', sans-serif",
                  color: "#1e293b", outline: "none", boxSizing: "border-box",
                }}
                onFocus={e => e.target.style.borderColor = "#c0392b"}
                onBlur={e  => e.target.style.borderColor = errors.supervisorEmail ? "#fca5a5" : "#e2e8f0"}
              />
              {errors.supervisorEmail
                ? <span style={errorStyle}>{errors.supervisorEmail}</span>
                : <span style={hintStyle}>Must be a @finopay.com address</span>
              }
            </div>
          </div>

          {/* ── SECTION 4: Leave Allowance ── */}
          <SectionHeader title="Leave Allowance" />
          <div style={{ marginBottom: 32 }}>
            <AllowanceToggle checked={form.requestAllowance} onChange={toggleAllowance} />
            {form.requestAllowance && (
              <div style={{
                marginTop: 12, padding: "12px 16px", borderRadius: 10,
                background: "#fffbeb", border: "1px solid #fde68a",
                fontSize: 13, color: "#92400e", lineHeight: 1.6,
                fontFamily: "'DM Sans', sans-serif",
              }}>
                ℹ️ Your leave allowance request will be sent to the <strong>MD</strong> for approval
                after HR approves your leave. Your leave remains valid regardless of the MD's decision
                on the allowance.
              </div>
            )}
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
