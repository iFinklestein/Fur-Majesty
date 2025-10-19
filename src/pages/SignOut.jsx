// src/pages/SignOut.jsx
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";

export default function SignOut() {
  const nav = useNavigate();

  useEffect(() => {
    (async () => {
      try {
        await supabase.auth.signOut();
      } finally {
        // After sign-out, AuthGate will render the SignedOut component (AuthPage)
        // We still push a friendly URL for clarity.
        nav("/signin", { replace: true });
      }
    })();
  }, [nav]);

  return (
    <div style={{ padding: 16, maxWidth: 420 }}>
      <h2>Signing you out…</h2>
      <p>One sec while we close your session.</p>
    </div>
  );
}
