/* eslint-disable react-refresh/only-export-components */
// ^ If you prefer to keep the “only export components” rule,
//   move useAuth into its own file and remove this disable.

/* ------------------------------------------------------------------ */
/* AuthProvider: Supabase auth context + hook                         */
/* ------------------------------------------------------------------ */

import PropTypes from "prop-types";
import { createContext, useContext, useEffect, useState } from "react";

// components/auth -> lib (two levels up)
import { supabase } from "../../lib/supabaseClient";

const AuthContext = createContext({ user: null, loading: true });

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function loadSession() {
      try {
        const { data } = await supabase.auth.getSession();
        if (!mounted) return;
        setUser(data.session?.user ?? null);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      mounted = false;
      subscription?.unsubscribe?.();
    };
  }, []);

  const value = { user, loading, supabase };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

AuthProvider.propTypes = {
  children: PropTypes.node, // mark as required if you prefer: .isRequired
};

export function useAuth() {
  return useContext(AuthContext);
}
