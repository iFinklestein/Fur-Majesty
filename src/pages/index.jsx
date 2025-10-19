// src/pages/index.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
// ✅ Correct named import (matches your export)
import { supabase } from "../lib/supabaseClient";

export default function SignIn() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [mode, setMode] = useState("signin");

  async function handleSignIn(e) {
    e.preventDefault();
    if (!email || !password) return;
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) { alert(error.message); return; }
    navigate("/dashboard", { replace: true });
  }

  async function handleSignUp(e) {
    e.preventDefault();
    if (!email || !password) return;
    setBusy(true);
    const { error } = await supabase.auth.signUp({ email, password });
    setBusy(false);
    if (error) { alert(error.message); return; }
    alert("Account created. Please check your email to confirm your address.");
  }

  async function handleForgot() {
    if (!email) { alert("Enter your email above first, then tap Forgot Password."); return; }
    setBusy(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/signin`,
    });
    setBusy(false);
    if (error) { alert(error.message); return; }
    alert("Password reset email sent. Check your inbox.");
  }

  return (
    <div className="page" style={{ display: "flex", justifyContent: "center" }}>
      <div className="card" style={{ maxWidth: 420, width: "100%", borderRadius: 12, padding: 16 }}>
        <h2 style={{ marginTop: 0, marginBottom: 8 }}>Fur Majesty</h2>
        <div style={{ color: "var(--muted,#666)", marginBottom: 16 }}>
          {mode === "signin" ? "Welcome. Sign in to see your pets and tasks." : "Create your account to get started."}
        </div>

        <form onSubmit={mode === "signin" ? handleSignIn : handleSignUp}>
          <label style={{ display: "block", marginBottom: 10 }}>
            <div style={{ fontSize: 12, color: "var(--muted,#666)", marginBottom: 6 }}>Email</div>
            <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required />
          </label>

          <label style={{ display: "block", marginBottom: 10 }}>
            <div style={{ fontSize: 12, color: "var(--muted,#666)", marginBottom: 6 }}>Password</div>
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete={mode === "signin" ? "current-password" : "new-password"}
                required style={{ flex: 1 }}
              />
              {mode === "signin" && (
                <button type="submit" disabled={busy}
                  style={{
                    appearance: "none", border: 0, padding: "8px 12px", borderRadius: 0,
                    background: "#000", color: "#e906d3", fontWeight: 700, cursor: "pointer", minWidth: 80
                  }}>
                  {busy ? "…" : "Sign In"}
                </button>
              )}
            </div>
          </label>

          {mode === "signin" && (
            <button type="button" onClick={handleForgot} disabled={busy}
              style={{
                border: 0, background: "transparent", color: "#5b5bd6", padding: 0, marginTop: 2,
                textDecoration: "none", cursor: "pointer"
              }}>
              Forgot Password
            </button>
          )}

          {mode === "signup" && (
            <button type="submit" disabled={busy}
              style={{
                width: "100%", marginTop: 12, appearance: "none", border: 0, borderRadius: 0, padding: "10px 12px",
                background: "#000", color: "#e906d3", fontWeight: 800, cursor: "pointer"
              }}>
              {busy ? "…" : "Sign Up"}
            </button>
          )}
        </form>

        <div style={{ marginTop: 14 }}>
          {mode === "signin" ? (
            <button type="button" onClick={() => setMode("signup")} disabled={busy}
              style={{
                appearance: "none", border: "1px solid #111", borderRadius: 0, padding: "8px 12px",
                background: "#fff", color: "#111", fontWeight: 700, cursor: "pointer"
              }}>
              Sign Up
            </button>
          ) : (
            <button type="button" onClick={() => setMode("signin")} disabled={busy}
              style={{
                appearance: "none", border: "1px solid #111", borderRadius: 0, padding: "8px 12px",
                background: "#fff", color: "#111", fontWeight: 700, cursor: "pointer"
              }}>
              Back to Sign In
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
