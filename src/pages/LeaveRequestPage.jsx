import Navbar from "../components/layout/Navbar";
import LeaveForm from "../components/leave/LeaveForm";

export default function LeaveRequestPage() {
  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(160deg, #f8fafc 0%, #f1f5f9 100%)" }}>
      <Navbar />
      <div style={{ padding: "8px 0 40px" }}>
        {/* Page Title */}
        <div
          style={{
            maxWidth: 740,
            margin: "0 auto",
            padding: "24px 16px 0",
            fontFamily: "'DM Sans', sans-serif",
          }}
        >
          <div style={{ marginBottom: 4 }}>
            <span style={{ fontSize: 12, color: "#94a3b8", fontWeight: 500 }}>
              Dashboard / New Leave Request
            </span>
          </div>
          <h1
            style={{
              fontSize: 24,
              fontWeight: 800,
              color: "#1e293b",
              letterSpacing: "-0.02em",
              marginBottom: 4,
            }}
          >
            New Leave Request
          </h1>
          <p style={{ fontSize: 14, color: "#64748b" }}>
            Complete the form below and submit for your supervisor's approval.
          </p>
        </div>
        <LeaveForm />
      </div>
    </div>
  );
}
