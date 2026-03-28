import { Routes, Route, Navigate } from "react-router-dom";
import { USE_MOCK_AUTH } from "./auth/MsalConfig";
import { AuthProvider, useAuth } from "./auth/AuthProvider";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import LeaveRequestPage from "./pages/LeaveRequestPage";
import ApprovalPage from "./pages/ApprovalPage";
import ProtectedRoute from "./components/layout/ProtectedRoute";

function AuthenticatedRoutes() {
  const { user } = useAuth();
  const isHR = user?.role === "hr";

  // Wait until user is fully loaded before deciding where to redirect
  if (!user) return null;

  return (
    <Routes>
      {/* HR lands on /approvals, everyone else lands on /dashboard */}
      <Route
        path="/"
        element={<Navigate to={isHR ? "/approvals" : "/dashboard"} replace />}
      />
      <Route
        path="/dashboard"
        element={
          isHR
            ? <Navigate to="/approvals" replace />
            : <ProtectedRoute><DashboardPage /></ProtectedRoute>
        }
      />
      <Route
        path="/leave/new"
        element={
          isHR
            ? <Navigate to="/approvals" replace />
            : <ProtectedRoute><LeaveRequestPage /></ProtectedRoute>
        }
      />
      <Route
        path="/approvals"
        element={<ProtectedRoute><ApprovalPage /></ProtectedRoute>}
      />
      <Route
        path="*"
        element={<Navigate to={isHR ? "/approvals" : "/dashboard"} replace />}
      />
    </Routes>
  );
}

function UnauthenticatedRoutes() {
  return (
    <Routes>
      <Route path="*" element={<LoginPage />} />
    </Routes>
  );
}

function MockAppRoutes() {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <AuthenticatedRoutes /> : <UnauthenticatedRoutes />;
}

function MsalAppRoutes() {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <AuthenticatedRoutes /> : <UnauthenticatedRoutes />;
}

export default function App() {
  return (
    <AuthProvider>
      {USE_MOCK_AUTH ? <MockAppRoutes /> : <MsalAppRoutes />}
    </AuthProvider>
  );
}
