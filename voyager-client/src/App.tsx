import React from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { useAuth } from "./context/useAuth";
import { defaultRouteForRole, hasRoleAccess, Roles } from "./services/rbac";
import type { AppRole } from "./services/rbac";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import ForgotPassword from "./pages/auth/ForgotPassword";
import ResetPassword from "./pages/auth/ResetPassword";
import Dashboard from "./pages/dashboard/Dashboard";
import Campaigns from "./pages/campaigns/Campaigns";
import CampaignDetails from "./pages/campaigns/CampaignDetails";
import Leads from "./pages/leads/Leads";
import EmailMarketing from "./pages/email/EmailMarketing";
import Analytics from "./pages/analytics/Analytics";
import Automation from "./pages/automation/Automation";
import Users from "./pages/users/Users";
import LandingPage from "./pages/LandingPage";
import CustomerPortal from "./pages/portal/CustomerPortal";
import CustomerOffersPage from "./pages/portal/CustomerOffersPage";
import CustomerMapPage from "./pages/portal/CustomerMapPage";
import CustomerCampaignsPage from "./pages/portal/CustomerCampaignsPage";
import CustomerProfilePage from "./pages/portal/CustomerProfilePage";
import CustomerSubscriptionsPage from "./pages/portal/CustomerSubscriptionsPage";
import CustomerFeedbackPage from "./pages/portal/CustomerFeedbackPage";
import Settings from "./pages/settings/Settings";
import ArchivedItems from "./pages/archived/ArchivedItems";
import Locations from "./pages/locations/Locations";
import Forbidden from "./pages/Forbidden";
import SecurityDashboard from "./pages/security/SecurityDashboard";

const ProtectedRoute = ({
  children,
  allowedRoles,
}: {
  children: React.ReactNode;
  allowedRoles?: AppRole[];
}) => {
  const { user, loading } = useAuth();

  if (loading) {
    return null;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !hasRoleAccess(user.role, allowedRoles)) {
    return <Navigate to="/forbidden" replace />;
  }

  return <>{children}</>;
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/forbidden" element={<Forbidden />} />

          <Route
            path="/dashboard"
            element={<ProtectedRoute allowedRoles={[Roles.SuperAdmin, Roles.Admin, Roles.Manager, Roles.Staff]}><Dashboard /></ProtectedRoute>}
          />
          <Route
            path="/campaigns"
            element={<ProtectedRoute allowedRoles={[Roles.SuperAdmin, Roles.Admin, Roles.Manager, Roles.Staff]}><Campaigns /></ProtectedRoute>}
          />
          <Route
            path="/campaigns/:id"
            element={<ProtectedRoute allowedRoles={[Roles.SuperAdmin, Roles.Admin, Roles.Manager, Roles.Staff]}><CampaignDetails /></ProtectedRoute>}
          />
          <Route
            path="/leads"
            element={<ProtectedRoute allowedRoles={[Roles.SuperAdmin, Roles.Admin, Roles.Manager, Roles.Staff]}><Leads /></ProtectedRoute>}
          />
          <Route
            path="/email"
            element={<ProtectedRoute allowedRoles={[Roles.SuperAdmin, Roles.Admin, Roles.Manager, Roles.Staff]}><EmailMarketing /></ProtectedRoute>}
          />
          <Route
            path="/analytics"
            element={<ProtectedRoute allowedRoles={[Roles.SuperAdmin, Roles.Admin, Roles.Manager]}><Analytics /></ProtectedRoute>}
          />
          <Route
            path="/automation"
            element={<ProtectedRoute allowedRoles={[Roles.SuperAdmin, Roles.Admin, Roles.Manager, Roles.Staff]}><Automation /></ProtectedRoute>}
          />
          <Route
            path="/locations"
            element={<ProtectedRoute allowedRoles={[Roles.SuperAdmin, Roles.Admin, Roles.Manager, Roles.Staff]}><Locations /></ProtectedRoute>}
          />
          <Route
            path="/users"
            element={<ProtectedRoute allowedRoles={[Roles.SuperAdmin, Roles.Admin]}><Users /></ProtectedRoute>}
          />
          <Route
            path="/settings"
            element={<ProtectedRoute allowedRoles={[Roles.SuperAdmin]}><Settings /></ProtectedRoute>}
          />
          <Route
            path="/archived"
            element={<ProtectedRoute allowedRoles={[Roles.SuperAdmin, Roles.Admin, Roles.Manager, Roles.Staff]}><ArchivedItems /></ProtectedRoute>}
          />
          <Route
            path="/security"
            element={<ProtectedRoute allowedRoles={[Roles.SuperAdmin, Roles.Admin]}><SecurityDashboard /></ProtectedRoute>}
          />

          <Route
            path="/portal"
            element={<ProtectedRoute allowedRoles={[Roles.Client]}><CustomerPortal /></ProtectedRoute>}
          />
          <Route
            path="/portal/home"
            element={<ProtectedRoute allowedRoles={[Roles.Client]}><CustomerOffersPage /></ProtectedRoute>}
          />
          <Route
            path="/portal/offers"
            element={<ProtectedRoute allowedRoles={[Roles.Client]}><CustomerOffersPage /></ProtectedRoute>}
          />
          <Route
            path="/portal/map"
            element={<ProtectedRoute allowedRoles={[Roles.Client]}><CustomerMapPage /></ProtectedRoute>}
          />
          <Route
            path="/portal/campaigns"
            element={<ProtectedRoute allowedRoles={[Roles.Client]}><CustomerCampaignsPage /></ProtectedRoute>}
          />
          <Route
            path="/portal/profile"
            element={<ProtectedRoute allowedRoles={[Roles.Client]}><CustomerProfilePage /></ProtectedRoute>}
          />
          <Route
            path="/portal/subscriptions"
            element={<ProtectedRoute allowedRoles={[Roles.Client]}><CustomerSubscriptionsPage /></ProtectedRoute>}
          />
          <Route
            path="/portal/feedback"
            element={<ProtectedRoute allowedRoles={[Roles.Client]}><CustomerFeedbackPage /></ProtectedRoute>}
          />

          <Route path="*" element={<RouteFallback />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

const RouteFallback = () => {
  const { user } = useAuth();
  return <Navigate to={user ? defaultRouteForRole(user.role) : "/"} replace />;
};

export default App;
