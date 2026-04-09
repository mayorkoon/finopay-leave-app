import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";
import { getLeavesByUser } from "../services/sharepointService";
import { formatDate, getNextWorkingDay } from "../utils/calculateLeaveDays";
import { LEAVE_TYPES } from "../constants/leaveTypes";
import { useLeaveBalance } from "../hooks/useLeaveBalance";
import Navbar from "../components/layout/Navbar";
import StatusBadge from "../components/ui/StatusBadge";

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [leaves, setLeaves]   = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.email) return;
    getLeavesByUser(user.email)
      .then(setLeaves).catch(console.error).finally(() => setLoading(false));
  }, [user]);

  const leaveTypeLabel = (id) => LEAVE_TYPES.find((l) => l.id === id)?.label || id;
  const stats = {
    total:    leaves.length,
    approved: leaves.filter((l) => l.status === "approved").length,
    pending:  leaves.filter((l) => l.status?.startsWith("pending")).length,
    rejected: leaves.filter((l) => l.status === "rejected").length,
  };

  const latestLeave = leaves[0];
  const { balance, entitlement, used, loading: balanceLoading } = useLeaveBalance(
    user, latestLeave?.band || "", latestLeave?.confirmationStatus || ""
  );

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(160deg, #f8fafc 0%, #f1f5f9 100%)", fontFamily: "'DM Sans', sans-serif" }}>
      <Navbar />
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "32px 16px" }}>
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: "#1e293b", letterSpacing: "-0.02em", marginBottom: 4 }}>Welcome back, {user?.name?.split(" ")[0]} 👋</h1>
          <p style={{ fontSize: 14, color: "#64748b" }}>Track and manage your leave requests below.</p>
        </div>

        {balance && (
          <div style={{ marginBottom: 28 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#1e293b", marginBottom: 12 }}>Leave Balance — {new Date().getFullYear()}</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
              {[
                { label: "Annual Leave", key: "annual", color: "#3b82f6", icon: "🏖️" },
                { label: "Sick Leave",   key: "sick",   color: "#10b981", icon: "🏥" },
                { label: "Casual Leave", key: "casual", color: "#8b5cf6", icon: "☀️" },
              ].filter(({ key }) => !(key === "casual" && entitlement?.casual === 0))
               .map(({ label, key, color, icon }) => {
                const remaining = balance[key] ?? 0;
                const total     = entitlement?.[key] ?? 0;
                const usedDays  = used?.[key] ?? 0;
                const pct       = total > 0 ? Math.round((remaining / total) * 100) : 0;
                return (
                  <div key={key} style={{ background: "#fff", borderRadius: 16, padding: "20px 24px", boxShadow: "0 2px 12px rgba(0,0,0,0.05)", border: "1px solid #f1f5f9" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</div>
                        <div style={{ fontSize: 28, fontWeight: 800, color, lineHeight: 1.2 }}>{remaining}<span style={{ fontSize: 13, fontWeight: 500, color: "#94a3b8" }}> / {total} days</span></div>
                      </div>
                      <span style={{ fontSize: 28 }}>{icon}</span>
                    </div>
                    <div style={{ background: "#f1f5f9", borderRadius: 4, height: 6, overflow: "hidden", marginBottom: 8 }}>
                      <div style={{ height: "100%", borderRadius: 4, background: color, width: `${pct}%` }} />
                    </div>
                    <div style={{ fontSize: 11, color: "#94a3b8" }}>{usedDays} day{usedDays !== 1 ? "s" : ""} used · {remaining} remaining</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {!balance && !balanceLoading && leaves.length > 0 && (
          <div style={{ background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 12, padding: "12px 20px", marginBottom: 24, fontSize: 13, color: "#92400e" }}>
            ℹ️ Leave balance unavailable — please ensure your <strong>Confirmation Status</strong> and <strong>Grade</strong> are filled in on your next leave request.
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 32 }}>
          {[
            { label: "Total Requests", value: stats.total,    color: "#3b82f6" },
            { label: "Approved",       value: stats.approved, color: "#10b981" },
            { label: "Pending",        value: stats.pending,  color: "#f59e0b" },
            { label: "Rejected",       value: stats.rejected, color: "#ef4444" },
          ].map((stat) => (
            <div key={stat.label} style={{ background: "#fff", borderRadius: 16, padding: "20px 24px", boxShadow: "0 2px 12px rgba(0,0,0,0.05)", border: "1px solid #f1f5f9" }}>
              <div style={{ fontSize: 28, fontWeight: 800, color: stat.color, marginBottom: 4 }}>{stat.value}</div>
              <div style={{ fontSize: 12, color: "#94a3b8", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>{stat.label}</div>
            </div>
          ))}
        </div>

        <div style={{ background: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)", borderRadius: 16, padding: "24px 28px", marginBottom: 28, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: "#fff", marginBottom: 4 }}>Need to take time off?</div>
            <div style={{ fontSize: 13, color: "#94a3b8" }}>Submit a new leave request and notify your supervisor instantly.</div>
          </div>
          <button onClick={() => navigate("/leave/new")} style={{ padding: "12px 24px", borderRadius: 10, border: "none", background: "linear-gradient(135deg, #c0392b, #e74c3c)", color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>
            + New Leave Request
          </button>
        </div>

        <div style={{ background: "#fff", borderRadius: 20, boxShadow: "0 4px 24px rgba(0,0,0,0.06)", border: "1px solid #f1f5f9", overflow: "hidden" }}>
          <div style={{ padding: "20px 24px", borderBottom: "1px solid #f1f5f9", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: "#1e293b" }}>Leave History</h2>
            <span style={{ fontSize: 12, color: "#94a3b8" }}>{leaves.length} request{leaves.length !== 1 ? "s" : ""}</span>
          </div>
          {loading ? (
            <div style={{ padding: 48, textAlign: "center", color: "#94a3b8", fontSize: 14 }}>Loading your requests...</div>
          ) : leaves.length === 0 ? (
            <div style={{ padding: 48, textAlign: "center", color: "#94a3b8", fontSize: 14 }}>
              No leave requests yet.{" "}
              <span onClick={() => navigate("/leave/new")} style={{ color: "#c0392b", cursor: "pointer", fontWeight: 600 }}>Submit your first one →</span>
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "#f8fafc" }}>
                    {["Leave Type","Start Date","End Date","Days","Resumption Date","Supervisor","Status","Submitted"].map(h => (
                      <th key={h} style={{ padding: "12px 20px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.06em", borderBottom: "1px solid #f1f5f9", whiteSpace: "nowrap" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {leaves.map((leave) => (
                    <tr key={leave.id} style={{ borderBottom: "1px solid #f8fafc" }}>
                      <td style={{ padding: "14px 20px", fontSize: 13, color: "#1e293b", fontWeight: 600 }}>{leave.leaveTypes?.map(leaveTypeLabel).join(", ")}</td>
                      <td style={{ padding: "14px 20px", fontSize: 13, color: "#475569", whiteSpace: "nowrap" }}>{leave.startDate?.split("T")[0]}</td>
                      <td style={{ padding: "14px 20px", fontSize: 13, color: "#475569", whiteSpace: "nowrap" }}>{leave.endDate?.split("T")[0]}</td>
                      <td style={{ padding: "14px 20px", fontSize: 13, color: "#475569", textAlign: "center" }}>{leave.adjustedDays || leave.totalDays}</td>
                      <td style={{ padding: "14px 20px", fontSize: 13, color: "#475569", whiteSpace: "nowrap" }}>{leave.endDate ? getNextWorkingDay(leave.endDate.split("T")[0]) : "—"}</td>
                      <td style={{ padding: "14px 20px", fontSize: 13, color: "#475569" }}>{leave.supervisorName}</td>
                      <td style={{ padding: "14px 20px" }}><StatusBadge status={leave.status} /></td>
                      <td style={{ padding: "14px 20px", fontSize: 12, color: "#94a3b8", whiteSpace: "nowrap" }}>{formatDate(leave.submittedAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}