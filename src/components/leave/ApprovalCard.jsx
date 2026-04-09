import { useState, useEffect } from "react";
import { LEAVE_TYPES } from "../../constants/leaveTypes";
import { formatDate, calculateLeaveDays } from "../../utils/calculateLeaveDays";

const leaveLabel = (id) => LEAVE_TYPES.find((l) => l.id === id)?.label || id;

// ── Toast ─────────────────────────────────────────────────────────────────
function Toast({ message, type, onDone }) {
  useEffect(() => {
    const t = setTimeout(onDone, 3000);
    return () => clearTimeout(t);
  }, [onDone]);

  const colors = {
    success: { bg: "#f0fdf4", border: "#86efac", text: "#166534", icon: "✓" },
    error:   { bg: "#fef2f2", border: "#fca5a5", text: "#991b1b", icon: "✗" },
  };
  const c = colors[type] || colors.error;

  return (
    <div style={{
      position: "fixed", top: 24, right: 24, zIndex: 9999,
      background: c.bg, border: `1.5px solid ${c.border}`,
      borderRadius: 12, padding: "14px 20px",
      display: "flex", alignItems: "center", gap: 10,
      boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
      fontFamily: "'DM Sans', sans-serif",
      animation: "slideIn 0.2s ease", minWidth: 280,
    }}>
      <style>{`
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(40px); }
          to   { opacity: 1; transform: translateX(0); }
        }
      `}</style>
      <span style={{
        width: 24, height: 24, borderRadius: "50%",
        background: type === "success" ? "#16a34a" : "#dc2626",
        color: "#fff", display: "flex", alignItems: "center",
        justifyContent: "center", fontSize: 13, fontWeight: 700, flexShrink: 0,
      }}>
        {c.icon}
      </span>
      <span style={{ fontSize: 14, fontWeight: 600, color: c.text }}>
        {message}
      </span>
    </div>
  );
}

// ── Info Row ──────────────────────────────────────────────────────────────
function InfoRow({ label, value }) {
  return (
    <div style={{
      display: "flex", justifyContent: "space-between",
      alignItems: "flex-start", padding: "7px 0",
      borderBottom: "1px solid #f1f5f9", gap: 12,
    }}>
      <span style={{
        fontSize: 11, color: "#94a3b8", fontWeight: 600,
        textTransform: "uppercase", letterSpacing: "0.05em",
        flexShrink: 0, fontFamily: "'DM Sans', sans-serif",
      }}>
        {label}
      </span>
      <span style={{
        fontSize: 13, color: "#1e293b", fontWeight: 500,
        textAlign: "right", fontFamily: "'DM Sans', sans-serif",
      }}>
        {value || "—"}
      </span>
    </div>
  );
}

// ── Field ──────────────────────────────────────────────────────────────────
function Field({ label, children }) {
  return (
    <div>
      <label style={{
        fontSize: 11, fontWeight: 600, color: "#475569",
        textTransform: "uppercase", letterSpacing: "0.05em",
        display: "block", marginBottom: 5,
        fontFamily: "'DM Sans', sans-serif",
      }}>
        {label}
      </label>
      {children}
    </div>
  );
}

const inputStyle = (accentColor = "#c0392b") => ({
  width: "100%", padding: "9px 12px", borderRadius: 8,
  border: "1.5px solid #e2e8f0", fontSize: 13,
  fontFamily: "'DM Sans', sans-serif", color: "#1e293b",
  outline: "none", background: "#fff", boxSizing: "border-box",
  transition: "border-color 0.2s",
});

// ── ApprovalCard ──────────────────────────────────────────────────────────
export default function ApprovalCard({ leave, stage, approverName, approverEmail, onDecision }) {
  const [comment, setComment]                     = useState("");
  const [loading, setLoading]                     = useState(false);
  const [decided, setDecided]                     = useState(false);
  const [decision, setDecision]                   = useState(null);
  const [toast, setToast]                         = useState(null);
  // Approver-only: forward to second approver
  const [requiresFurther, setRequiresFurther]     = useState(false);
  const [secondApproverEmail, setSecondApproverEmail] = useState("");
  const [secondApproverError, setSecondApproverError] = useState("");
  // HR-only: adjustable fields
  const [resumptionDate, setResumptionDate]       = useState(leave.resumptionDate || "");
  const [adjustedDays, setAdjustedDays]           = useState(leave.totalDays || "");

  useEffect(() => {
    if (!resumptionDate || !leave.startDate) return;
    // Resumption date is the first day back, so last leave day = resumption - 1
    const lastDay = new Date(resumptionDate);
    lastDay.setDate(lastDay.getDate() - 1);
    const lastDayStr = lastDay.toISOString().split("T")[0];
    const days = calculateLeaveDays(leave.startDate.split("T")[0], lastDayStr);
    if (days) setAdjustedDays(days);
  }, [resumptionDate]);

  const showToast = (message, type) => setToast({ message, type });

  const validateSecondApprover = () => {
    if (requiresFurther) {
      if (!secondApproverEmail.trim()) {
        setSecondApproverError("Second approver email is required.");
        return false;
      }
      if (!/^[^\s@]+@finopay\.com$/i.test(secondApproverEmail.trim())) {
        setSecondApproverError("Must be a valid @finopay.com email.");
        return false;
      }
      if (secondApproverEmail.trim().toLowerCase() === approverEmail?.toLowerCase()) {
        setSecondApproverError("You cannot forward to yourself.");
        return false;
      }
    }
    setSecondApproverError("");
    return true;
  };

  const handleDecision = async (approved) => {
    if (approved && !validateSecondApprover()) return;
    setLoading(true);
    try {
      await onDecision(leave.id, {
        approved,
        by:          approverName,
        byEmail:     approverEmail,
        comment:     comment.trim(),
        stage,
        requiresFurtherApproval: approved ? requiresFurther : false,
        secondApproverEmail:     approved && requiresFurther ? secondApproverEmail.trim() : null,
        resumptionDate:          stage === "hr" ? resumptionDate : null,
        adjustedDays:            stage === "hr" ? adjustedDays   : null,
      });
      setDecision(approved ? "approved" : "rejected");
      setDecided(true);
      showToast(
        approved
          ? requiresFurther
            ? `Forwarded to second approver for ${leave.staffName}`
            : `Leave approved for ${leave.staffName}`
          : `Leave rejected for ${leave.staffName}`,
        approved ? "success" : "error"
      );
    } catch (err) {
      console.error("Approval action failed:", err);
      showToast("Action failed. Please try again.", "error");
    } finally {
      setLoading(false);
    }
  };

  const decidedColor = decision === "approved" ? "#10b981" : "#ef4444";
  const decidedBg    = decision === "approved" ? "#f0fdf4" : "#fef2f2";

  return (
    <>
      {toast && (
        <Toast message={toast.message} type={toast.type} onDone={() => setToast(null)} />
      )}

      <div style={{
        background: "#fff", borderRadius: 16,
        border: `1.5px solid ${decided ? decidedColor : "#e2e8f0"}`,
        boxShadow: "0 2px 16px rgba(0,0,0,0.05)",
        overflow: "hidden", transition: "border-color 0.25s",
        fontFamily: "'DM Sans', sans-serif",
      }}>

        {/* ── Header ── */}
        <div style={{
          padding: "14px 20px",
          background: decided ? decidedBg : "#f8fafc",
          borderBottom: "1px solid #f1f5f9",
          display: "flex", alignItems: "center",
          justifyContent: "space-between", flexWrap: "wrap", gap: 8,
        }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#1e293b" }}>
              {leave.staffName}
            </div>
            <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>
              {leave.department} · {leave.staffEmail}
            </div>
          </div>
          {decided ? (
            <span style={{
              fontSize: 12, fontWeight: 700, padding: "4px 14px",
              borderRadius: 20, background: decidedColor, color: "#fff",
            }}>
              {decision === "approved"
                ? requiresFurther ? "↗ Forwarded" : "✓ Approved"
                : "✗ Rejected"}
            </span>
          ) : (
            <span style={{
              fontSize: 12, fontWeight: 600, padding: "4px 12px",
              borderRadius: 20, background: "#fef9c3", color: "#854d0e",
              border: "1px solid #fde047",
            }}>
              Awaiting your action
            </span>
          )}
        </div>

        {/* ── Body ── */}
        <div style={{ padding: "16px 20px" }}>

          {/* Leave details grid */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 28px" }}>
            <div>
              <InfoRow label="Leave Type"   value={leave.leaveTypes?.map(leaveLabel).join(", ")} />
              <InfoRow label="Start Date"   value={leave.startDate} />
              <InfoRow label="End Date"     value={leave.endDate} />
              <InfoRow label="Working Days" value={leave.totalDays} />
            </div>
            <div>
              <InfoRow label="Supervisor" value={leave.supervisorName} />
              <InfoRow label="Reliever"   value={leave.relieverName} />
              <InfoRow label="Mobile"     value={leave.mobileNumber} />
              <InfoRow label="Submitted"  value={formatDate(leave.submittedAt)} />
            </div>
          </div>

          {leave.contactAddress && (
            <div style={{ marginTop: 4 }}>
              <InfoRow label="Contact Address" value={leave.contactAddress} />
            </div>
          )}

          {/* ── Approval trail ── */}
          {leave.approvalChain?.length > 0 && (
            <div style={{ marginTop: 14 }}>
              <div style={{
                fontSize: 11, fontWeight: 700, color: "#94a3b8",
                textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8,
              }}>
                Approval Trail
              </div>
              {leave.approvalChain.map((entry, i) => (
                <div key={i} style={{
                  fontSize: 12, color: "#475569", marginBottom: 4,
                  display: "flex", gap: 6, alignItems: "flex-start",
                }}>
                  <span style={{
                    fontWeight: 700,
                    color: entry.approved ? "#10b981" : "#ef4444",
                    flexShrink: 0,
                  }}>
                    {entry.approved ? "✓" : "✗"}
                  </span>
                  <span>
                    <strong>{entry.by}</strong>
                    {" "}({entry.stage.replace("_", " ")})
                    {entry.comment && ` — "${entry.comment}"`}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* ── HR fields ── */}
          {stage === "hr" && (
            <div style={{
              marginTop: 14, padding: "14px 16px",
              background: "#f5f3ff", borderRadius: 10,
              border: "1px solid #ddd6fe",
            }}>
              <div style={{
                fontSize: 11, fontWeight: 700, color: "#6d28d9",
                textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 12,
              }}>
                People & Culture — Fill before approving
              </div>
              {decided ? (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 28px" }}>
                  <InfoRow label="Resumption Date" value={resumptionDate || "—"} />
                  <InfoRow label="Days Approved"   value={adjustedDays  || "—"} />
                </div>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <Field label="Resumption Date">
                    <input
                      type="date"
                      value={resumptionDate}
                      onChange={e => setResumptionDate(e.target.value)}
                      style={{ ...inputStyle("#7c3aed"), borderColor: "#ddd6fe" }}
                      onFocus={e => e.target.style.borderColor = "#7c3aed"}
                      onBlur={e  => e.target.style.borderColor = "#ddd6fe"}
                    />
                  </Field>
                  <Field label="No. of Days Approved">
                    <input
                      type="number"
                      min="0"
                      value={adjustedDays}
                      onChange={e => setAdjustedDays(e.target.value)}
                      placeholder={leave.totalDays || "e.g. 5"}
                      style={{ ...inputStyle("#7c3aed"), borderColor: "#ddd6fe" }}
                      onFocus={e => e.target.style.borderColor = "#7c3aed"}
                      onBlur={e  => e.target.style.borderColor = "#ddd6fe"}
                    />
                  </Field>
                </div>
              )}
            </div>
          )}

          {/* ── Action area ── */}
          {!decided && (
            <div style={{ marginTop: 16, paddingTop: 16, borderTop: "1px solid #f1f5f9" }}>

              <Field label="Comment (optional)">
                <textarea
                  value={comment}
                  onChange={e => setComment(e.target.value)}
                  placeholder="Add a note for the staff member..."
                  rows={2}
                  style={{
                    ...inputStyle(),
                    resize: "vertical",
                    marginBottom: stage !== "hr" ? 14 : 0,
                  }}
                  onFocus={e => e.target.style.borderColor = "#c0392b"}
                  onBlur={e  => e.target.style.borderColor = "#e2e8f0"}
                />
              </Field>

              {/* ── Further approval checkbox — approvers only, not HR ── */}
              {stage !== "hr" && (
                <div style={{ marginBottom: 14 }}>
                  <label style={{
                    display: "flex", alignItems: "center", gap: 10,
                    cursor: "pointer", padding: "10px 14px",
                    borderRadius: 8, border: `1.5px solid ${requiresFurther ? "#3b82f6" : "#e2e8f0"}`,
                    background: requiresFurther ? "#eff6ff" : "#f8fafc",
                    transition: "all 0.2s", userSelect: "none",
                  }}>
                    <div style={{
                      width: 18, height: 18, borderRadius: 4,
                      border: `2px solid ${requiresFurther ? "#3b82f6" : "#cbd5e1"}`,
                      background: requiresFurther ? "#3b82f6" : "#fff",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      flexShrink: 0, transition: "all 0.2s",
                    }}>
                      {requiresFurther && (
                        <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                          <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="2"
                            strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </div>
                    <span style={{
                      fontSize: 13, fontWeight: requiresFurther ? 600 : 400,
                      color: requiresFurther ? "#1d4ed8" : "#475569",
                      fontFamily: "'DM Sans', sans-serif",
                    }}>
                      Requires further approval before HR
                    </span>
                    <input
                      type="checkbox"
                      checked={requiresFurther}
                      onChange={e => {
                        setRequiresFurther(e.target.checked);
                        if (!e.target.checked) {
                          setSecondApproverEmail("");
                          setSecondApproverError("");
                        }
                      }}
                      style={{ display: "none" }}
                    />
                  </label>

                  {/* Second approver email input */}
                  {requiresFurther && (
                    <div style={{ marginTop: 10 }}>
                      <Field label="Second Approver Email *">
                        <input
                          type="email"
                          value={secondApproverEmail}
                          onChange={e => {
                            setSecondApproverEmail(e.target.value);
                            setSecondApproverError("");
                          }}
                          placeholder="approver@finopay.com"
                          style={{
                            ...inputStyle(),
                            borderColor: secondApproverError ? "#fca5a5" : "#e2e8f0",
                          }}
                          onFocus={e => e.target.style.borderColor = "#3b82f6"}
                          onBlur={e  => e.target.style.borderColor = secondApproverError ? "#fca5a5" : "#e2e8f0"}
                        />
                        {secondApproverError && (
                          <span style={{
                            fontSize: 11, color: "#e11d48",
                            fontFamily: "'DM Sans', sans-serif", marginTop: 3, display: "block",
                          }}>
                            {secondApproverError}
                          </span>
                        )}
                      </Field>
                    </div>
                  )}
                </div>
              )}

              {/* Approve / Reject buttons */}
              <div style={{ display: "flex", gap: 10 }}>
                <button
                  onClick={() => handleDecision(true)}
                  disabled={loading}
                  style={{
                    flex: 1, padding: "11px", borderRadius: 10, border: "none",
                    background: loading ? "#94a3b8" : requiresFurther
                      ? "linear-gradient(135deg, #2563eb, #3b82f6)"
                      : "linear-gradient(135deg, #059669, #10b981)",
                    color: "#fff", fontSize: 14, fontWeight: 700,
                    cursor: loading ? "not-allowed" : "pointer",
                    fontFamily: "'DM Sans', sans-serif",
                    boxShadow: loading ? "none" : requiresFurther
                      ? "0 4px 14px rgba(37,99,235,0.35)"
                      : "0 4px 14px rgba(16,185,129,0.35)",
                    transition: "all 0.2s",
                  }}
                >
                  {loading ? "Processing..." : requiresFurther ? "↗ Forward" : "✓ Approve"}
                </button>
                <button
                  onClick={() => handleDecision(false)}
                  disabled={loading}
                  style={{
                    flex: 1, padding: "11px", borderRadius: 10,
                    border: "1.5px solid #fca5a5", background: "#fff",
                    color: "#ef4444", fontSize: 14, fontWeight: 700,
                    cursor: loading ? "not-allowed" : "pointer",
                    fontFamily: "'DM Sans', sans-serif", transition: "all 0.2s",
                  }}
                >
                  ✗ Reject
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
