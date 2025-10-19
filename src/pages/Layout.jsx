// src/pages/Layout.jsx
import PropTypes from "prop-types";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../components/auth/AuthProvider";

const tabs = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/medications", label: "Medications" },
  { to: "/vaccines", label: "Vaccines" },
  { to: "/vet-visits", label: "Vet Visits" },
  { to: "/grooming", label: "Grooming" },
  { to: "/weights", label: "Weights" },
  // Feeding hidden for Phase 1
  // { to: "/feeding", label: "Feeding" },
];

export default function Layout({ children }) {
  const { pathname } = useLocation();
  const { user } = useAuth();

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <header style={{ background: "#000", color: "white" }}>
        <div
          style={{
            maxWidth: "var(--page-max, 1200px)",
            margin: "0 auto",
            padding: "10px 16px",
            display: "grid",
            gridTemplateColumns: user ? "1fr auto 1fr" : "1fr", // center logo when logged out
            alignItems: "center",
            gap: 12,
            justifyItems: user ? "stretch" : "center",
          }}
        >
          {/* Logo */}
          {user ? (
            <Link to="/dashboard" style={{ display: "inline-flex", alignItems: "center", gap: 5, justifySelf: "start" }}>
              <img src="/logo-dark.png" alt="Fur Majesty" style={{ height: 125, width: "auto" }} />
            </Link>
          ) : (
            <img src="/logo-dark.png" alt="Fur Majesty" style={{ height: 125, width: "auto" }} />
          )}

          {/* Center nav – only when signed in */}
          {user && (
            <nav style={{ justifySelf: "center", display: "flex", gap: 16, flexWrap: "wrap" }}>
              {tabs.map((t) => {
                const active = pathname === t.to;
                return (
                  <Link
                    key={t.to}
                    to={t.to}
                    style={{
                      color: "#e906d3",
                      textDecoration: "none",
                      background: active ? "#1f2937" : "transparent",
                      padding: "6px 10px",
                      borderRadius: 6,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {t.label}
                  </Link>
                );
              })}
            </nav>
          )}

          {/* Right actions – only when signed in */}
          {user && (
            <div style={{ justifySelf: "end" }}>
              <Link to="/signout" style={{ color: "#e906d3", textDecoration: "none" }}>Sign out</Link>
            </div>
          )}
        </div>
      </header>

      <main
        className="page"
        style={{
          padding: "24px 16px",
          margin: "0 auto",
          maxWidth: "var(--page-max, 1200px)",
          width: "100%",
          flex: 1, // push footer to bottom
        }}
      >
        {children}
      </main>

      <footer style={{ background: "#000", color: "#bbb" }}>
        <div
          style={{
            maxWidth: "var(--page-max, 1200px)",
            margin: "0 auto",
            padding: "8px 16px",
            fontSize: 12,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            textAlign: "center",
          }}
        >
          <span>Created by Draíocht (dree-uckt) Studios</span>
        </div>
      </footer>
    </div>
  );
}

Layout.propTypes = { children: PropTypes.node };
