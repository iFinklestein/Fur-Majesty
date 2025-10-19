// src/App.jsx

import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./components/auth/AuthProvider";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import Layout from "./Layout";

// pages
import Dashboard from "./pages/Dashboard";
import Medications from "./pages/Medications";
import VaccineRecords from "./pages/VaccineRecords";
import VetVisits from "./pages/VetVisits";
import Grooming from "./pages/Grooming";
import Weight from "./pages/Weight";
import Feeding from "./pages/Feeding";
import Auth from "./pages/Auth";

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public: Auth */}
          <Route path="/auth" element={<Auth />} />

          {/* Protected app shell */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout>
                  <Dashboard />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Layout>
                  <Dashboard />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/medications"
            element={
              <ProtectedRoute>
                <Layout>
                  <Medications />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/vaccines"
            element={
              <ProtectedRoute>
                <Layout>
                  <VaccineRecords />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/vet-visits"
            element={
              <ProtectedRoute>
                <Layout>
                  <VetVisits />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/grooming"
            element={
              <ProtectedRoute>
                <Layout>
                  <Grooming />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/weights"
            element={
              <ProtectedRoute>
                <Layout>
                  <Weight />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/feeding"
            element={
              <ProtectedRoute>
                <Layout>
                  <Feeding />
                </Layout>
              </ProtectedRoute>
            }
          />

          {/* fallback */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
