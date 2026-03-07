import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
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

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  return user ? <>{children}</> : <Navigate to="/login" />;
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/campaigns" element={<ProtectedRoute><Campaigns /></ProtectedRoute>} />
          <Route path="/campaigns/:id" element={<ProtectedRoute><CampaignDetails /></ProtectedRoute>} />
          <Route path="/leads" element={<ProtectedRoute><Leads /></ProtectedRoute>} />
          <Route path="/email" element={<ProtectedRoute><EmailMarketing /></ProtectedRoute>} />
          <Route path="/analytics" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
          <Route path="/automation" element={<ProtectedRoute><Automation /></ProtectedRoute>} />
          <Route path="/locations" element={<ProtectedRoute><Locations /></ProtectedRoute>} />
          <Route path="/users" element={<ProtectedRoute><Users /></ProtectedRoute>} />
          <Route path="/portal" element={<ProtectedRoute><CustomerPortal /></ProtectedRoute>} />
          <Route path="/portal/offers" element={<ProtectedRoute><CustomerOffersPage /></ProtectedRoute>} />
          <Route path="/portal/map" element={<ProtectedRoute><CustomerMapPage /></ProtectedRoute>} />
          <Route path="/portal/campaigns" element={<ProtectedRoute><CustomerCampaignsPage /></ProtectedRoute>} />
          <Route path="/portal/profile" element={<ProtectedRoute><CustomerProfilePage /></ProtectedRoute>} />
          <Route path="/portal/subscriptions" element={<ProtectedRoute><CustomerSubscriptionsPage /></ProtectedRoute>} />
          <Route path="/portal/feedback" element={<ProtectedRoute><CustomerFeedbackPage /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
          <Route path="/archived" element={<ProtectedRoute><ArchivedItems /></ProtectedRoute>} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
