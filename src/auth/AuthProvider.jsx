import { createContext, useContext, useEffect, useState } from "react";
import { useMsal, useIsAuthenticated } from "@azure/msal-react";
import {
  USE_MOCK_AUTH, HR_EMAIL,
  INITIATORS_GROUP_ID, APPROVERS_GROUP_ID,
  loginRequest,
} from "./MsalConfig";

const AuthContext = createContext(null);

// ── Role detection from Azure AD group claims ─────────────────────────────────
function detectRole(account, groupsFromToken = []) {
  const email = account.username?.toLowerCase();
  if (email === HR_EMAIL.toLowerCase()) return "hr";
  if (groupsFromToken.includes(APPROVERS_GROUP_ID))  return "approver";
  if (groupsFromToken.includes(INITIATORS_GROUP_ID)) return "initiator";
  return "initiator";
}

// ── Mock Auth Provider ────────────────────────────────────────────────────────
function MockAuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const saved = sessionStorage.getItem("mock_user");
      return saved ? JSON.parse(saved) : null;
    } catch { return null; }
  });

  const login = (mockUser) => {
    sessionStorage.setItem("mock_user", JSON.stringify(mockUser));
    setUser(mockUser);
  };

  const logout = () => {
    sessionStorage.removeItem("mock_user");
    setUser(null);
    window.location.replace("/");
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// ── MSAL Auth Provider ────────────────────────────────────────────────────────
function MsalAuthProvider({ children }) {
  const { instance, accounts } = useMsal();
  const msalAuthenticated      = useIsAuthenticated();
  const [user, setUser]        = useState(null);

  useEffect(() => {
    if (!msalAuthenticated || !accounts.length) {
      setUser(null);
      return;
    }
    const account = accounts[0];
    const claims  = account.idTokenClaims || {};
    const groups  = claims.groups || [];
    const role    = detectRole(account, groups);

    setUser({
      name:       account.name,
      email:      account.username,
      staffId:    account.localAccountId,
      department: claims.department || "",
      role,
    });
  }, [msalAuthenticated, accounts]);

  const login  = () => instance.loginRedirect(loginRequest);
  const logout = () => instance.logoutRedirect({
    postLogoutRedirectUri: window.location.origin,
    onRedirectNavigate: () => false, // clears local MSAL cache only, does not sign out of Microsoft
  });

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: msalAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// ── Main Export ───────────────────────────────────────────────────────────────
export function AuthProvider({ children }) {
  return USE_MOCK_AUTH
    ? <MockAuthProvider>{children}</MockAuthProvider>
    : <MsalAuthProvider>{children}</MsalAuthProvider>;
}

export const useAuth = () => useContext(AuthContext);