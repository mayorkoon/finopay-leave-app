import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { processMdAllowanceDecision, getLeaveByAllowanceToken } from "../services/sharepointService";
import { LEAVE_TYPES } from "../constants/leaveTypes";

const leaveLabel = (id) => LEAVE_TYPES.find((l) => l.id === id)?.label || id;

function InfoRow({ label, value }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: "8px 0", borderBottom: "1px solid #f1f5f9", gap: 12 }}>
      <span style={{ fontSize: 11, color: "#94a3b8", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", flexShrink: 0, fontFamily: "'DM Sans', sans-serif" }}>{label}</span>
      <span style={{ fontSize: 13, color: "#1e293b", fontWeight: 500, textAlign: "right", fontFamily: "'DM Sans', sans-serif" }}>{value || "—"}</span>
    </div>
  );
}

export default function AllowanceReviewPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const [leave, setLeave]       = useState(null);
  const [status, setStatus]     = useState("loading");
  const [result, setResult]     = useState(null);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (!token) { setStatus("error"); setErrorMsg("Invalid link — no token provided."); return; }
    getLeaveByAllowanceToken(token)
      .then((data) => {
        if (!data) { setStatus("error"); setErrorMsg("This link is invalid or has already been used."); return; }
        if (data.allowanceStatus !== "pending_md") { setStatus("error"); setErrorMsg("This allowance request has already been actioned."); return; }
        if (data.allowanceTokenExpiry && new Date() > new Date(data.allowanceTokenExpiry)) { setStatus("error"); setErrorMsg("This approval link has expired (72 hour limit)."); return; }
        setLeave(data);
        setStatus("ready");
      })
      .catch(() => { setStatus("error"); setErrorMsg("Failed to load the request. Please try again."); });
  }, [token]);

  const handleDecision = async (approved) => {
    setStatus("processing");
    try {
      const res = await processMdAllowanceDecision(token, approved);
      setResult({ approved, staffName: res.staffName });
      setStatus("done");
    } catch (err) {
      setStatus("error");
      setErrorMsg(err.message || "Action failed. Please try again.");
    }
  };

  const pageStyle = { minHeight: "100vh", background: "linear-gradient(160deg, #0f172a 0%, #1e293b 60%, #c0392b 100%)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24, fontFamily: "'DM Sans', sans-serif" };
  const cardStyle = { background: "#fff", borderRadius: 20, padding: "40px 40px", maxWidth: 520, width: "100%", boxShadow: "0 32px 80px rgba(0,0,0,0.3)" };

  if (status === "loading") return <div style={pageStyle}><div style={{ ...cardStyle, textAlign: "center" }}><div style={{ fontSize: 40, marginBottom: 16 }}>⏳</div><p style={{ color: "#64748b", fontSize: 15 }}>Loading request details...</p></div></div>;

  if (status === "error") return (
    <div style={pageStyle}><div style={{ ...cardStyle, textAlign: "center" }}>
      <div style={{ fontSize: 40, marginBottom: 16 }}>⚠️</div>
      <h2 style={{ fontSize: 20, fontWeight: 800, color: "#1e293b", marginBottom: 8 }}>Unable to Process</h2>
      <p style={{ color: "#64748b", fontSize: 14, lineHeight: 1.6 }}>{errorMsg}</p>
      <p style={{ color: "#94a3b8", fontSize: 12, marginTop: 16 }}>If you believe this is an error, please contact HR.</p>
    </div></div>
  );

  if (status === "done") return (
    <div style={pageStyle}><div style={{ ...cardStyle, textAlign: "center" }}>
      <div style={{ width: 64, height: 64, borderRadius: "50%", background: result.approved ? "linear-gradient(135deg, #10b981, #059669)" : "linear-gradient(135deg, #ef4444, #dc2626)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px", boxShadow: result.approved ? "0 8px 24px rgba(16,185,129,0.3)" : "0 8px 24px rgba(239,68,68,0.3)" }}>
        <span style={{ fontSize: 28, color: "#fff" }}>{result.approved ? "✓" : "✗"}</span>
      </div>
      <h2 style={{ fontSize: 22, fontWeight: 800, color: "#1e293b", marginBottom: 8 }}>Allowance {result.approved ? "Approved" : "Rejected"}</h2>
      <p style={{ color: "#64748b", fontSize: 14, lineHeight: 1.6 }}>You have {result.approved ? "approved" : "rejected"} the leave allowance for <strong style={{ color: "#1e293b" }}>{result.staffName}</strong>. HR has been notified.</p>
      <p style={{ color: "#94a3b8", fontSize: 12, marginTop: 16 }}>You may close this window.</p>
    </div></div>
  );

  return (
    <div style={pageStyle}><div style={cardStyle}>
      <div style={{ textAlign: "center", marginBottom: 28 }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "6px 14px", borderRadius: 20, background: "#fff7ed", border: "1px solid #fed7aa", marginBottom: 16 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: "#c2410c", textTransform: "uppercase", letterSpacing: "0.05em" }}>Leave Allowance Approval</span>
        </div>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: "#1e293b", marginBottom: 6, letterSpacing: "-0.02em" }}>Allowance Request</h1>
        <p style={{ color: "#64748b", fontSize: 13, lineHeight: 1.6 }}>Please review the details below. The staff member's leave is already approved — this decision only affects the allowance.</p>
      </div>

      <div style={{ background: "#f8fafc", borderRadius: 12, padding: "16px 20px", marginBottom: 24, border: "1px solid #e2e8f0" }}>
        <InfoRow label="Staff Name"   value={leave.staffName} />
        <InfoRow label="Department"   value={leave.department} />
        <InfoRow label="Leave Type"   value={leave.leaveTypes?.map(leaveLabel).join(", ")} />
        <InfoRow label="Start Date"   value={leave.startDate} />
        <InfoRow label="End Date"     value={leave.endDate} />
        <InfoRow label="Working Days" value={leave.totalDays} />
        <InfoRow label="Reliever"     value={leave.relieverName} />
        <InfoRow label="Supervisor"   value={leave.supervisorName} />
      </div>

      <div style={{ display: "flex", gap: 12 }}>
        <button onClick={() => handleDecision(true)} disabled={status === "processing"} style={{ flex: 1, padding: "13px", borderRadius: 10, border: "none", background: status === "processing" ? "#94a3b8" : "linear-gradient(135deg, #059669, #10b981)", color: "#fff", fontSize: 14, fontWeight: 700, cursor: status === "processing" ? "not-allowed" : "pointer", fontFamily: "'DM Sans', sans-serif" }}>
          {status === "processing" ? "Processing..." : "✓ Approve Allowance"}
        </button>
        <button onClick={() => handleDecision(false)} disabled={status === "processing"} style={{ flex: 1, padding: "13px", borderRadius: 10, border: "1.5px solid #fca5a5", background: "#fff", color: "#ef4444", fontSize: 14, fontWeight: 700, cursor: status === "processing" ? "not-allowed" : "pointer", fontFamily: "'DM Sans', sans-serif" }}>
          ✗ Reject Allowance
        </button>
      </div>
      <p style={{ textAlign: "center", fontSize: 11, color: "#94a3b8", marginTop: 16 }}>This link expires 72 hours after it was sent.</p>
    </div></div>
  );
}