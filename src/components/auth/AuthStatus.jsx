// src/components/auth/AuthStatus.jsx
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "./AuthProvider";

export default function AuthStatus() {
  const { user, loading, supabase } = useAuth();
  const navigate = useNavigate();

  if (loading) return null;

  if (!user) {
    return <Link to="/signin">Sign in</Link>;
  }

  async function signOut() {
    await supabase.auth.signOut();
    navigate("/signin", { replace: true });
  }

  return (
    <button onClick={signOut} title="Sign out">
      Sign out
    </button>
  );
}
