import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function AuthGate({ SignedOut, SignedIn, Loading }) {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) console.warn("getSession error:", error.message);
        if (!cancelled) setSession(data.session ?? null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    const { data: sub } = supabase.auth.onAuthStateChange((_evt, newSession) => {
      setSession(newSession);
    });

    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, []);

  if (loading) return Loading ? <Loading /> : <div style={{padding: 16}}>Loading…</div>;
  if (!session) return <SignedOut />;
  return <SignedIn session={session} />;
}
