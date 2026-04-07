import { createContext, useContext, useEffect, useState } from "react";
import { USE_MOCK_AUTH } from "./MsalConfig";

const AuthContext = createContext(null);

// ── Mock Auth Provider ──────────────────────────────────────────────────────
function MockAuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const saved = sessionStorage.getItem("mock_user");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const login = (mockUser) => {
    sessionStorage.setItem("mock_user", JSON.stringify(mockUser));
    setUser(mockUser);
  };

  const logout = () => {
    sessionStorage.removeItem("mock_user");
    setUser(null);
    // Always return to root after logout so next login
    // triggers a clean redirect based on the new user's role
    window.location.replace("/");
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// ── MSAL Auth Provider ──────────────────────────────────────────────────────
// This component is ONLY rendered when MsalProvider is in the tree (real auth)
// Importing the hooks here is safe because this file is only mounted then
function MsalAuthProvider({ children }) {
  // We use a lazy import pattern via state to avoid the hooks
  // being called before MsalProvider is ready
  const [msalHooks, setMsalHooks] = useState(null);
  const [user, setUser] = useState(null);
  const [msalAuthenticated, setMsalAuthenticated] = useState(false);

  useEffect(() => {
    import("@azure/msal-react").then((mod) => {
      setMsalHooks(mod);
    });
  }, []);

  // Once hooks are available, render the inner component
  if (!msalHooks) return null;

  return (
    <MsalAuthInner
      useMsal={msalHooks.useMsal}
      useIsAuthenticated={msalHooks.useIsAuthenticated}
    >
      {children}
    </MsalAuthInner>
  );
}

function MsalAuthInner({ useMsal, useIsAuthenticated, children }) {
  const { instance, accounts } = useMsal();
  const msalAuthenticated = useIsAuthenticated();
  const [user, setUser] = useState(null);

  useEffect(() => {
    if (msalAuthenticated && accounts.length > 0) {
      const account = instance.getActiveAccount() || accounts[0];
      setUser({
        name: account.name,
        email: account.username,
        staffId: account.localAccountId,
        department: account.idTokenClaims?.department || "",
        role: "staff",
      });
    } else {
      setUser(null);
    }
  }, [msalAuthenticated, accounts]);

  const login = () =>
    instance.loginRedirect({ scopes: ["User.Read", "openid", "profile", "email"] });

  const logout = () => {
    // Clear local MSAL tokens only — does NOT redirect to Microsoft's logout page.
    // This keeps the user's Microsoft SSO session intact and just signs them
    // out of the app, returning them to the login page.
    instance.logoutRedirect({
      onRedirectNavigate: () => false,
    });
    window.location.replace("/");
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: msalAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// ── Main Export ─────────────────────────────────────────────────────────────
export function AuthProvider({ children }) {
  return USE_MOCK_AUTH
    ? <MockAuthProvider>{children}</MockAuthProvider>
    : <MsalAuthProvider>{children}</MsalAuthProvider>;
}

export const useAuth = () => useContext(AuthContext);
