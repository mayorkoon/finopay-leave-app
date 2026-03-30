import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../auth/AuthProvider";
import logo from "../../assets/finopay.png";

const ROLE_LABELS = {
  initiator: null,
  approver:  { label: "Approver", color: "#1d4ed8", bg: "#eff6ff" },
  hr:        { label: "HR",       color: "#86198f", bg: "#fdf4ff" },
};

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const isApprover = ["approver", "hr"].includes(user?.role);
  const isHR = user?.role === "hr";

  // HR only sees Approvals — no dashboard or new request
  const navLinks = isHR
    ? [{ label: "Approvals", path: "/approvals" }]
    : [
        { label: "Dashboard",   path: "/dashboard" },
        { label: "New Request", path: "/leave/new" },
        ...(isApprover ? [{ label: "Approvals", path: "/approvals" }] : []),
      ];

  const roleBadge = ROLE_LABELS[user?.role];

  return (
    <nav style={{
      background: "#fff",
      borderBottom: "1px solid #e2e8f0",
      padding: "0 32px",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      height: 64,
      position: "sticky",
      top: 0,
      zIndex: 100,
      boxShadow: "0 1px 12px rgba(0,0,0,0.05)",
    }}>

      {/* Logo */}
      <div
        style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}
        onClick={() => navigate("/dashboard")}
      >
       <img src={logo} alt="Finopay Logo" style={{ height: 40, objectFit: "contain" }} />
      </div>

      {/* Nav Links */}
      <div style={{ display: "flex", gap: 4 }}>
        {navLinks.map(link => {
          const active = location.pathname === link.path;
          return (
            <button
              key={link.path}
              onClick={() => navigate(link.path)}
              style={{
                padding: "8px 16px", borderRadius: 8, border: "none",
                background: active ? "#fff1f2" : "transparent",
                color: active ? "#c0392b" : "#64748b",
                fontSize: 14, fontWeight: active ? 700 : 500,
                fontFamily: "'DM Sans', sans-serif",
                cursor: "pointer", transition: "all 0.15s",
              }}
            >
              {link.label}
            </button>
          );
        })}
      </div>

      {/* User info + role badge + logout */}
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ textAlign: "right" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, justifyContent: "flex-end" }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: "#1e293b", fontFamily: "'DM Sans', sans-serif" }}>
              {user?.name}
            </span>
            {roleBadge && (
              <span style={{
                fontSize: 10, fontWeight: 700, padding: "2px 8px",
                borderRadius: 10, background: roleBadge.bg, color: roleBadge.color,
                textTransform: "uppercase", letterSpacing: "0.05em",
                fontFamily: "'DM Sans', sans-serif",
              }}>
                {roleBadge.label}
              </span>
            )}
          </div>
          <div style={{ fontSize: 11, color: "#94a3b8", fontFamily: "'DM Sans', sans-serif" }}>
            {user?.email}
          </div>
        </div>

        <div style={{
          width: 36, height: 36, borderRadius: "50%",
          background: isApprover
            ? "linear-gradient(135deg, #c0392b, #e74c3c)"
            : "linear-gradient(135deg, #1e293b, #334155)",
          display: "flex", alignItems: "center", justifyContent: "center",
          color: "#fff", fontSize: 13, fontWeight: 700,
          fontFamily: "'DM Sans', sans-serif", flexShrink: 0,
        }}>
          {user?.name?.charAt(0) || "?"}
        </div>

        <button
          onClick={logout}
          style={{
            padding: "7px 14px", borderRadius: 8,
            border: "1.5px solid #e2e8f0", background: "#fff",
            color: "#64748b", fontSize: 13, fontWeight: 600,
            fontFamily: "'DM Sans', sans-serif", cursor: "pointer",
          }}
          onMouseEnter={e => { e.target.style.borderColor = "#c0392b"; e.target.style.color = "#c0392b"; }}
          onMouseLeave={e => { e.target.style.borderColor = "#e2e8f0"; e.target.style.color = "#64748b"; }}
        >
          Sign out
        </button>
      </div>
    </nav>
  );
}
