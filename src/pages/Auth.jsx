import { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { supabase } from "../lib/supabaseClient"; // adjust path as needed

export default function Auth() {
  const nav = useNavigate();
  const loc = useLocation();
  const redirectTo = loc.state?.from?.pathname || "/dashboard";

  const [mode, setMode] = useState("signin"); // 'signin' | 'signup'
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setMsg("");
    try {
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
      }
      nav(redirectTo, { replace: true });
    } catch (err) {
      setMsg(err.message || "Authentication error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ padding: "24px 16px", margin: "0 auto", maxWidth: "var(--page-max, 1200px)" }}>
      <div className="card" style={{ maxWidth: 520, margin: "24px auto" }}>
        <h2 style={{ marginBottom: 12 }}>{mode === "signin" ? "Sign in" : "Create account"}</h2>

        <p style={{ margin: "6px 0 16px 0", color: "#666" }}>
          {mode === "signin" ? "Welcome back." : "Create your Fur Majesty account."}
        </p>

        <form onSubmit={submit}>
          <div style={{ marginBottom: 10 }}>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{ width: "100%" }}
            />
          </div>
          <div style={{ marginBottom: 16 }}>
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{ width: "100%" }}
            />
          </div>

          <button type="submit" disabled={busy}>{busy ? "Working…" : (mode === "signin" ? "Sign in" : "Sign up")}</button>
        </form>

        {msg && <div style={{ marginTop: 12, color: "crimson" }}>{msg}</div>}

        <div style={{ marginTop: 16 }}>
          {mode === "signin" ? (
            <span>
              New here?{" "}
              <button onClick={() => setMode("signup")} style={{ background: "transparent", color: "#e906d3" }}>
                Create an account
              </button>
            </span>
          ) : (
            <span>
              Already have an account?{" "}
              <button onClick={() => setMode("signin")} style={{ background: "transparent", color: "#e906d3" }}>
                Sign in
              </button>
            </span>
          )}
        </div>

        <div style={{ marginTop: 12 }}>
          <Link to="/dashboard" style={{ color: "#e906d3" }}>Back to app</Link>
        </div>
      </div>
    </div>
  );
}
