import { useEffect, useState, useCallback } from "react";
import { useAuth } from "../auth/AuthProvider";
import { getLeavesByApprover, updateApproval } from "../services/leaveService";
import ApprovalCard from "../components/leave/ApprovalCard";
import Navbar from "../components/layout/Navbar";

const ROLE_CONFIG = {
  approver: {
    title: "Pending Approvals",
    subtitle: "Leave requests assigned to you awaiting your decision.",
    stage: "supervisor",
    emptyMessage: "No pending requests assigned to you.",
  },
  hr: {
    title: "HR Final Approvals",
    subtitle: "Requests that have completed approvals and are awaiting HR sign-off.",
    stage: "hr",
    emptyMessage: "No requests pending HR approval.",
  },
};

export default function ApprovalPage() {
  const { user } = useAuth();
  const [leaves, setLeaves]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");

  const config = ROLE_CONFIG[user?.role];

  const fetchLeaves = useCallback(async () => {
    if (!user?.email || !config) return;
    setLoading(true);
    setError("");
    try {
      const data = await getLeavesByApprover(user.email);
      setLeaves(data);
    } catch (err) {
      console.error("Failed to fetch leave requests:", err);
      setError("Failed to load requests. Please refresh the page.");
    } finally {
      setLoading(false);
    }
  }, [user, config]);

  useEffect(() => { fetchLeaves(); }, [fetchLeaves]);

  const handleDecision = async (docId, decision) => {
    // Determine the correct stage based on the leave's current status
    const leave = leaves.find(l => l.id === docId);
    const stage = user?.role === "hr"
      ? "hr"
      : leave?.status === "pending_second_approver"
        ? "second_approver"
        : "supervisor";

    await updateApproval(docId, { ...decision, stage });
    await fetchLeaves();
  };

  // Guard — initiators should never reach this page
  if (!config) {
    return (
      <div style={{ minHeight: "100vh", background: "#f8fafc", fontFamily: "'DM Sans', sans-serif" }}>
        <Navbar />
        <div style={{ maxWidth: 600, margin: "80px auto", textAlign: "center", padding: "0 16px" }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🚫</div>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: "#1e293b", marginBottom: 8 }}>
            Access Restricted
          </h2>
          <p style={{ color: "#64748b", fontSize: 14 }}>
            This page is only accessible to approvers and HR staff.
          </p>
        </div>
      </div>
    );
  }

  const pendingCount = leaves.length;

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(160deg, #f8fafc 0%, #f1f5f9 100%)",
      fontFamily: "'DM Sans', sans-serif",
    }}>
      <Navbar />
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "32px 16px" }}>

        {/* Page Header */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ fontSize: 12, color: "#94a3b8", fontWeight: 500, marginBottom: 4 }}>
            Dashboard / Approvals
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
            <div>
              <h1 style={{ fontSize: 24, fontWeight: 800, color: "#1e293b", letterSpacing: "-0.02em", marginBottom: 4 }}>
                {config.title}
              </h1>
              <p style={{ fontSize: 14, color: "#64748b" }}>{config.subtitle}</p>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              {!loading && (
                <span style={{
                  fontSize: 13, fontWeight: 700, padding: "6px 14px", borderRadius: 20,
                  background: pendingCount > 0 ? "#fff7ed" : "#f1f5f9",
                  color: pendingCount > 0 ? "#c2410c" : "#64748b",
                  border: `1px solid ${pendingCount > 0 ? "#fed7aa" : "#e2e8f0"}`,
                }}>
                  {pendingCount} pending
                </span>
              )}
              <button
                onClick={fetchLeaves}
                style={{
                  padding: "8px 16px", borderRadius: 10,
                  border: "1.5px solid #e2e8f0", background: "#fff",
                  fontSize: 13, fontWeight: 600, color: "#475569",
                  cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
                }}
              >
                ↻ Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Role Badge */}
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 8,
          padding: "8px 16px", borderRadius: 10, marginBottom: 24,
          background: user?.role === "hr" ? "#f5f3ff" : "#eff6ff",
          border: `1px solid ${user?.role === "hr" ? "#ddd6fe" : "#bfdbfe"}`,
        }}>
          <span style={{ fontSize: 16 }}>
            {user?.role === "hr" ? "🏛️" : "👤"}
          </span>
          <span style={{
            fontSize: 12, fontWeight: 700,
            color: user?.role === "hr" ? "#6d28d9" : "#1d4ed8",
            textTransform: "uppercase", letterSpacing: "0.05em",
          }}>
            {user?.role === "hr" ? "HR / People & Culture" : "Approver"} View
          </span>
          <span style={{ fontSize: 12, color: "#64748b" }}>— {user?.name}</span>
        </div>

        {/* Content */}
        {loading ? (
          <div style={{ padding: "60px 0", textAlign: "center" }}>
            <div style={{ fontSize: 14, color: "#94a3b8" }}>Loading requests...</div>
          </div>
        ) : error ? (
          <div style={{
            background: "#fef2f2", border: "1.5px solid #fecaca",
            borderRadius: 12, padding: "16px 20px",
            fontSize: 13, color: "#dc2626", fontWeight: 600,
          }}>
            {error}
          </div>
        ) : leaves.length === 0 ? (
          <div style={{
            background: "#fff", borderRadius: 20, padding: "60px 32px",
            textAlign: "center", border: "1px solid #f1f5f9",
            boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
          }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: "#1e293b", marginBottom: 8 }}>
              All clear!
            </div>
            <div style={{ fontSize: 14, color: "#64748b" }}>{config.emptyMessage}</div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {leaves.map(leave => (
              <ApprovalCard
                key={leave.id}
                leave={leave}
                stage={user?.role === "hr"
                  ? "hr"
                  : leave.status === "pending_second_approver"
                    ? "second_approver"
                    : "supervisor"
                }
                approverName={user?.name}
                approverEmail={user?.email}
                onDecision={handleDecision}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
