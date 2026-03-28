import { useNavigate } from "react-router-dom";
import { LEAVE_TYPES } from "../../constants/leaveTypes";

export default function LeaveSuccess({ form, onReset }) {
  const navigate = useNavigate();

  const leaveTypeLabels = form.leaveTypes
    .map((id) => LEAVE_TYPES.find((l) => l.id === id)?.label || id)
    .join(", ");

  const summaryRows = [
    ["Staff", form.staffName],
    ["Department", form.department],
    ["Leave Type", leaveTypeLabels],
    ["Period", `${form.startDate} → ${form.endDate}`],
    ["Total Days", `${form.totalDays} day(s)`],
    ["Reliever", form.relieverName],
    ["Supervisor", form.supervisorName],
  ];

  return (
    <div
      style={{
        maxWidth: 520,
        margin: "60px auto",
        padding: "0 16px",
        fontFamily: "'DM Sans', sans-serif",
        textAlign: "center",
      }}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: 20,
          padding: 48,
          boxShadow: "0 20px 60px rgba(0,0,0,0.08)",
          border: "1px solid #f1f5f9",
        }}
      >
        {/* Success Icon */}
        <div
          style={{
            width: 72,
            height: 72,
            borderRadius: "50%",
            background: "linear-gradient(135deg, #10b981, #059669)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 24px",
            boxShadow: "0 8px 24px rgba(16,185,129,0.3)",
          }}
        >
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
            <path
              d="M5 13l4 4L19 7"
              stroke="white"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        <h2
          style={{
            fontSize: 24,
            fontWeight: 800,
            color: "#1e293b",
            marginBottom: 8,
          }}
        >
          Request Submitted!
        </h2>
        <p
          style={{
            color: "#64748b",
            fontSize: 15,
            lineHeight: 1.6,
            marginBottom: 8,
          }}
        >
          Your leave request has been sent to{" "}
          <strong style={{ color: "#1e293b" }}>{form.supervisorName}</strong>{" "}
          for approval.
        </p>
        <p style={{ color: "#94a3b8", fontSize: 13, marginBottom: 32 }}>
          You'll receive an email once it's reviewed.
        </p>

        {/* Summary */}
        <div
          style={{
            background: "#f8fafc",
            borderRadius: 12,
            padding: "4px 16px",
            marginBottom: 28,
            border: "1px solid #e2e8f0",
            textAlign: "left",
          }}
        >
          {summaryRows.map(([label, value]) => (
            <div
              key={label}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "10px 0",
                borderBottom: "1px solid #e2e8f0",
              }}
            >
              <span
                style={{
                  fontSize: 11,
                  color: "#94a3b8",
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                {label}
              </span>
              <span
                style={{
                  fontSize: 13,
                  color: "#1e293b",
                  fontWeight: 600,
                  textAlign: "right",
                  maxWidth: "60%",
                }}
              >
                {value || "—"}
              </span>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div style={{ display: "flex", gap: 12 }}>
          <button
            onClick={() => navigate("/dashboard")}
            style={{
              flex: 1,
              padding: "12px",
              borderRadius: 10,
              border: "1.5px solid #e2e8f0",
              background: "#fff",
              color: "#475569",
              fontSize: 14,
              fontWeight: 600,
              cursor: "pointer",
              fontFamily: "'DM Sans', sans-serif",
            }}
          >
            View Dashboard
          </button>
          <button
            onClick={onReset}
            style={{
              flex: 1,
              padding: "12px",
              borderRadius: 10,
              border: "none",
              background: "linear-gradient(135deg, #c0392b, #e74c3c)",
              color: "#fff",
              fontSize: 14,
              fontWeight: 700,
              cursor: "pointer",
              fontFamily: "'DM Sans', sans-serif",
              boxShadow: "0 4px 16px rgba(192,57,43,0.3)",
            }}
          >
            New Request
          </button>
        </div>
      </div>
    </div>
  );
}
