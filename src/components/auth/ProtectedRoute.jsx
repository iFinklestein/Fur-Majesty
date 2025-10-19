import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./AuthProvider";

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  const loc = useLocation();

  if (loading) return null; // or a small spinner if you want

  if (!user) {
    return <Navigate to="/auth" replace state={{ from: loc }} />;
  }

  return children;
}
