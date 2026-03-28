import { useState } from "react";
import { useMsal } from "@azure/msal-react";
import { loginRequest, USE_MOCK_AUTH, HR_EMAIL } from "../auth/MsalConfig";
import { useAuth } from "../auth/AuthProvider";

const ROLES = [
  { value: "initiator", label: "Initiator — submit leave requests" },
  { value: "approver",  label: "Approver — approve & forward requests" },
  { value: "hr",        label: "HR / People & Culture — final approval" },
];

export default function LoginPage() {
  const { instance } = useMsal();
  const { login } = useAuth();
  const [form, setForm] = useState({ name: "", email: "", department: "", role: "initiator" });
  const isHREmail = form.email.trim().toLowerCase() === HR_EMAIL.toLowerCase();
  const [error, setError] = useState("");

  const handleMockLogin = () => {
    if (!form.name.trim() || !form.email.trim()) {
      setError("Please enter your name and email.");
      return;
    }
    setError("");
    // Auto-assign HR role if email matches the fixed HR email
    const isHR = form.email.trim().toLowerCase() === HR_EMAIL.toLowerCase();
    login({
      name: form.name.trim(),
      email: form.email.trim(),
      department: form.department.trim(),
      role: isHR ? "hr" : form.role,
      staffId: form.email.trim(),
    });
  };

  const handleMsalLogin = () => instance.loginRedirect(loginRequest);

  const inputStyle = {
    width: "100%", padding: "10px 14px", borderRadius: 8,
    border: "1.5px solid #e2e8f0", fontSize: 14,
    fontFamily: "'DM Sans', sans-serif", color: "#1e293b",
    outline: "none", boxSizing: "border-box",
  };

  const labelStyle = {
    fontSize: 11, fontWeight: 600, color: "#475569",
    textTransform: "uppercase", letterSpacing: "0.05em",
    display: "block", marginBottom: 4,
    fontFamily: "'DM Sans', sans-serif",
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(160deg, #0f172a 0%, #1e293b 60%, #c0392b 100%)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: 24, fontFamily: "'DM Sans', sans-serif",
    }}>
      <div style={{
        background: "#fff", borderRadius: 24, padding: "48px 44px",
        maxWidth: 440, width: "100%", textAlign: "center",
        boxShadow: "0 32px 80px rgba(0,0,0,0.3)",
      }}>
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, marginBottom: 32 }}>
          <div style={{
            width: 52, height: 52, borderRadius: 14,
            background: "linear-gradient(135deg, #c0392b, #e74c3c)",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 6px 20px rgba(192,57,43,0.4)",
          }}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L3 7v5c0 5.25 3.75 10.15 9 11.35C17.25 22.15 21 17.25 21 12V7L12 2z" fill="white" opacity="0.9"/>
              <path d="M9 12l2 2 4-4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div style={{ textAlign: "left" }}>
            <div style={{ fontSize: 26, fontWeight: 800, color: "#1e293b", lineHeight: 1 }}>
              Fino<span style={{ color: "#c0392b" }}>pay</span>
            </div>
            <div style={{ fontSize: 11, color: "#94a3b8", letterSpacing: "0.1em", textTransform: "uppercase" }}>
              HR Portal
            </div>
          </div>
        </div>

        <h1 style={{ fontSize: 21, fontWeight: 800, color: "#1e293b", marginBottom: 6, letterSpacing: "-0.02em" }}>
          Staff Leave Management
        </h1>

        {USE_MOCK_AUTH ? (
          <>
            <div style={{
              background: "#fffbeb", border: "1.5px solid #fde68a",
              borderRadius: 10, padding: "8px 14px", marginBottom: 24, marginTop: 12,
              fontSize: 12, color: "#92400e", fontWeight: 600,
            }}>
              🔧 Dev Mode — Microsoft auth bypassed
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 14, textAlign: "left", marginBottom: 16 }}>
              <div>
                <label style={labelStyle}>Full Name *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Abiodun Oyewale"
                  style={inputStyle}
                  onFocus={e => e.target.style.borderColor = "#c0392b"}
                  onBlur={e => e.target.style.borderColor = "#e2e8f0"}
                  onKeyDown={e => e.key === "Enter" && handleMockLogin()}
                />
              </div>

              <div>
                <label style={labelStyle}>Work Email *</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  placeholder="you@finopay.com"
                  style={inputStyle}
                  onFocus={e => e.target.style.borderColor = "#c0392b"}
                  onBlur={e => e.target.style.borderColor = "#e2e8f0"}
                  onKeyDown={e => e.key === "Enter" && handleMockLogin()}
                />
              </div>

              <div>
                <label style={labelStyle}>Department</label>
                <input
                  type="text"
                  value={form.department}
                  onChange={e => setForm(f => ({ ...f, department: e.target.value }))}
                  placeholder="e.g. Engineering"
                  style={inputStyle}
                  onFocus={e => e.target.style.borderColor = "#c0392b"}
                  onBlur={e => e.target.style.borderColor = "#e2e8f0"}
                />
              </div>

              {isHREmail ? (
                <div style={{
                  padding: "10px 14px", borderRadius: 8,
                  background: "#f5f3ff", border: "1.5px solid #ddd6fe",
                  fontSize: 13, fontWeight: 600, color: "#6d28d9",
                  fontFamily: "'DM Sans', sans-serif",
                  display: "flex", alignItems: "center", gap: 8,
                }}>
                  🏛️ HR / People & Culture — auto-assigned
                </div>
              ) : (
                <div>
                  <label style={labelStyle}>Role (Dev Testing) *</label>
                  <select
                    value={form.role}
                    onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
                    style={{
                      ...inputStyle,
                      appearance: "none",
                      backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
                      backgroundRepeat: "no-repeat",
                      backgroundPosition: "right 14px center",
                      paddingRight: 36,
                      cursor: "pointer",
                    }}
                  >
                    {ROLES.map(r => (
                      <option key={r.value} value={r.value}>{r.label}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {error && (
              <div style={{ fontSize: 12, color: "#e11d48", marginBottom: 12, textAlign: "left", fontWeight: 600 }}>
                ⚠ {error}
              </div>
            )}

            <button
              onClick={handleMockLogin}
              style={{
                width: "100%", padding: "14px", borderRadius: 12, border: "none",
                background: "linear-gradient(135deg, #c0392b, #e74c3c)",
                color: "#fff", fontSize: 15, fontWeight: 700,
                cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
                boxShadow: "0 6px 20px rgba(192,57,43,0.35)",
              }}
            >
              Continue to App →
            </button>
          </>
        ) : (
          <>
            <p style={{ color: "#64748b", fontSize: 14, lineHeight: 1.6, marginBottom: 32, marginTop: 8 }}>
              Sign in with your Finopay Microsoft account to apply for leave or track your requests.
            </p>
            <button
              onClick={handleMsalLogin}
              style={{
                width: "100%", padding: "14px 24px", borderRadius: 12,
                border: "1.5px solid #e2e8f0", background: "#fff",
                cursor: "pointer", display: "flex", alignItems: "center",
                justifyContent: "center", gap: 12, fontSize: 15,
                fontWeight: 600, color: "#1e293b", fontFamily: "'DM Sans', sans-serif",
                boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
              }}
            >
              <svg width="20" height="20" viewBox="0 0 21 21" fill="none">
                <rect x="1" y="1" width="9" height="9" fill="#F25022"/>
                <rect x="11" y="1" width="9" height="9" fill="#7FBA00"/>
                <rect x="1" y="11" width="9" height="9" fill="#00A4EF"/>
                <rect x="11" y="11" width="9" height="9" fill="#FFB900"/>
              </svg>
              Sign in with Microsoft
            </button>
            <p style={{ marginTop: 20, fontSize: 12, color: "#94a3b8", lineHeight: 1.5 }}>
              Use your company email address.<br/>Contact IT if you have login issues.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
