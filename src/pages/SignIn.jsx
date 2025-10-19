import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
// NOTE: If your SignIn.jsx is not directly under src/pages, adjust the path (e.g. "../../lib/supabaseClient")
import { supabase } from "../lib/supabaseClient";

export default function SignIn() {
  const navigate = useNavigate();
  const [mode, setMode] = useState("signin"); // "signin" | "signup"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [working, setWorking] = useState(false);
  const [msg, setMsg] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setMsg("");
    setWorking(true);

    try {
      if (!supabase) {
        throw new Error(
          "Supabase client not found. Check the import path to ../lib/supabaseClient."
        );
      }

      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        navigate("/dashboard");
      } else {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setMsg("Account created. Check your email to confirm, then sign in.");
        setMode("signin");
      }
    } catch (err) {
      setMsg(err.message || "Something went wrong");
    } finally {
      setWorking(false);
    }
  }

  return (
    <div className="page">
      <h2 style={{ marginTop: 12 }}>{mode === "signin" ? "Sign in" : "Sign up"}</h2>

      <form onSubmit={handleSubmit} className="card" style={{ maxWidth: 800 }}>
        <label>Email</label>
        <input
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <label style={{ marginTop: 12 }}>Password</label>
        <input
          type="password"
          placeholder="Your password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        {msg && (
          <div style={{ color: "crimson", marginTop: 10 }}>
            {msg}
          </div>
        )}

        <button type="submit" disabled={working} style={{ marginTop: 16 }}>
          {working ? "Working..." : mode === "signin" ? "Sign in" : "Create account"}
        </button>

        <div style={{ marginTop: 14 }}>
          {mode === "signin" ? (
            <>
              New here?{" "}
              <button
                type="button"
                onClick={() => {
                  setMsg("");
                  setMode("signup");
                }}
                className="linklike"
                style={{ background: "none", border: "none", padding: 0, color: "magenta", cursor: "pointer" }}
              >
                Create an account
              </button>
            </>
          ) : (
            <>
              Already have an account?{" "}
              <button
                type="button"
                onClick={() => {
                  setMsg("");
                  setMode("signin");
                }}
                className="linklike"
                style={{ background: "none", border: "none", padding: 0, color: "magenta", cursor: "pointer" }}
              >
                Sign in
              </button>
            </>
          )}
        </div>

        <div style={{ marginTop: 8 }}>
          <Link to="/dashboard">Back to Dashboard</Link>
        </div>
      </form>
    </div>
  );
}
