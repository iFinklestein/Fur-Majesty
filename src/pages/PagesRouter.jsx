// src/pages/PagesRouter.jsx
import PropTypes from "prop-types";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Layout from "@/pages/Layout";
import Dashboard from "@/pages/Dashboard";
import MedicationPage from "@/pages/Medications";
import VaccineRecords from "@/components/vaccines/VaccineRecords";
import VetVisits from "@/pages/VetVisits";
import Grooming from "@/pages/Grooming";
import WeightPage from "@/pages/Weight";
// PHASE 1.1 FEATURE — Feeding page intentionally disabled
// import FeedingPage from "@/pages/Feeding";

// IMPORTANT: your sign-in screen lives at pages/index.jsx
import SignIn from "@/pages/index.jsx";
import SignOut from "@/pages/SignOut";

// 🔧 FIX: correct relative path (we are in src/pages, components is one level up)
import { useAuth } from "../components/auth/AuthProvider";

function RequireAuth({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="page">Loading…</div>;
  if (!user) return <Navigate to="/signin" replace />;
  return children;
}
RequireAuth.propTypes = { children: PropTypes.node };

function OnlyWhenSignedOut({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="page">Loading…</div>;
  if (user) return <Navigate to="/dashboard" replace />;
  return children;
}
OnlyWhenSignedOut.propTypes = { children: PropTypes.node };

function RedirectHome() {
  const { user, loading } = useAuth();
  if (loading) return <div className="page">Loading…</div>;
  return user ? <Navigate to="/dashboard" replace /> : <Navigate to="/signin" replace />;
}

export default function PagesRouter() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          {/* Public */}
          <Route path="/signin" element={<OnlyWhenSignedOut><SignIn /></OnlyWhenSignedOut>} />
          <Route path="/signout" element={<SignOut />} />

          {/* Protected */}
          <Route path="/" element={<RequireAuth><Dashboard /></RequireAuth>} />
          <Route path="/dashboard" element={<RequireAuth><Dashboard /></RequireAuth>} />
          <Route path="/medications" element={<RequireAuth><MedicationPage /></RequireAuth>} />
          <Route path="/vaccines" element={<RequireAuth><VaccineRecords /></RequireAuth>} />
          <Route path="/vet-visits" element={<RequireAuth><VetVisits /></RequireAuth>} />
          <Route path="/grooming" element={<RequireAuth><Grooming /></RequireAuth>} />
          <Route path="/weights" element={<RequireAuth><WeightPage /></RequireAuth>} />

          {/* PHASE 1.1 FEATURE — Feeding route disabled for Phase 1 */}
          <Route path="/feeding" element={<Navigate to="/dashboard" replace />} />

          {/* Safety net */}
          <Route path="*" element={<RedirectHome />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}
