// src/pages/Layout.jsx
import PropTypes from "prop-types";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../components/auth/AuthProvider";
import { useEffect, useMemo, useState } from "react";

const tabs = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/medications", label: "Medications" },
  { to: "/vaccines", label: "Vaccines" },
  { to: "/vet-visits", label: "Vet Visits" },
  { to: "/grooming", label: "Grooming" },
  { to: "/weights", label: "Weights" },
  // { to: "/feeding", label: "Feeding" }, // Phase 1 hidden
];

const LOGO_HEIGHT = 108; // you bumped it to 90 — keeping it here

export default function Layout({ children }) {
  const { pathname } = useLocation();
  const { user } = useAuth();

  const [open, setOpen] = useState(false);

  const currentTitle = useMemo(
    () => tabs.find(t => t.to === pathname)?.label ?? "",
    [pathname]
  );

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = open ? "hidden" : prev || "";
    return () => { document.body.style.overflow = prev || ""; };
  }, [open]);

  useEffect(() => {
    function onKey(e) { if (e.key === "Escape") setOpen(false); }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const activeMap = useMemo(() => {
    const m = new Map();
    tabs.forEach(t => m.set(t.to, pathname === t.to));
    return m;
  }, [pathname]);

  const styles = {
    header: {
      background: "#000", color: "white",
      position: "sticky", top: 0, zIndex: 50,
      boxShadow: "var(--shadow-soft)",
    },
    bar: {
      maxWidth: "var(--page-max, 1200px)",
      margin: "0 auto",
      padding: "12px 16px",
      display: "grid",
      gridTemplateColumns: user ? "56px 1fr auto" : "1fr auto",
      alignItems: "center",
      gap: 12,
    },
    burgerBtn: {
      appearance: "none",
      background: "#000",
      border: "1px solid #000",
      color: "var(--accent, #e906d3)",
      width: 56, height: 56, // bigger
      display: "inline-flex", alignItems: "center", justifyContent: "center",
      borderRadius: 0, cursor: "pointer",
      fontSize: 40, lineHeight: 1, // bigger glyph
    },
    centerStack: {
      display: "flex", flexDirection: "column", alignItems: "center",
      lineHeight: 1.1, gap: 4, minHeight: LOGO_HEIGHT,
      justifySelf: "center",
    },
    logo: { height: LOGO_HEIGHT, width: "auto" }, // not clickable (no Link)
    title: {
      color: "var(--accent, #e906d3)",
      fontWeight: 500, fontSize: 17, letterSpacing: ".2px",
      textAlign: "center", minHeight: 18,
    },
    authLink: {
      color: "var(--accent, #e906d3)",
      textDecoration: "none",
      fontWeight: 700,
      padding: "8px 10px",
      borderRadius: 6,
    },
    overlay: {
      position: "fixed", inset: 0,
      background: "rgba(0,0,0,.45)",
      opacity: open ? 1 : 0,
      pointerEvents: open ? "auto" : "none",
      transition: "opacity .18s ease",
      zIndex: 60,
    },
    drawer: {
      position: "fixed", top: 0, left: 0, height: "100vh", width: "82vw", maxWidth: 380,
      background: "var(--panel, #fff)",
      borderRight: "1px solid var(--border, #e7e7e7)",
      boxShadow: "0 10px 30px rgba(0,0,0,.15)",
      transform: open ? "translateX(0)" : "translateX(-102%)",
      transition: "transform .22s ease",
      zIndex: 61, display: "flex", flexDirection: "column",
    },
    drawerHeader: { display: "flex", alignItems: "center", gap: 8, padding: "14px 14px", borderBottom: "1px solid var(--border, #e7e7e7)" },
    drawerTitle: { fontWeight: 700, color: "var(--accent, #e906d3)" },
    drawerCloseBtn: {
      marginLeft: "auto",
      appearance: "none",
      border: "1px solid #000",
      background: "#000",
      color: "var(--accent, #e906d3)",
      width: 40, height: 40,
      display: "inline-flex", alignItems: "center", justifyContent: "center",
      borderRadius: 0, cursor: "pointer", fontSize: 22,
    },
    navList: { listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column" },
    navItem: (active) => ({
      display: "flex", alignItems: "center", gap: 12,
      padding: "14px 16px",
      textDecoration: "none",
      color: active ? "#fff" : "#000",
      background: active ? "#000" : "transparent",
      borderBottom: "1px solid var(--border, #e7e7e7)",
      fontWeight: 700,
    }),
    signout: { marginTop: "auto", padding: 14, borderTop: "1px solid var(--border, #e7e7e7)" },
    signoutLink: { textDecoration: "none", color: "var(--accent, #e906d3)", fontWeight: 700 },

    main: {
      padding: "24px 16px",
      margin: "0 auto",
      maxWidth: "var(--page-max, 1200px)",
      width: "100%",
      flex: 1,
    },
    footer: { background: "#000", color: "#bbb" },
    footerInner: {
      maxWidth: "var(--page-max, 1200px)",
      margin: "0 auto",
      padding: "8px 16px",
      fontSize: 12,
      display: "flex", justifyContent: "center", alignItems: "center", textAlign: "center",
    },
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <header style={styles.header}>
        <div style={styles.bar}>
          {user && (
            <button
              aria-label="Open navigation"
              onClick={() => setOpen(true)}
              style={styles.burgerBtn}
              title="Menu"
            >
              {/* hamburger glyph */}
              <span aria-hidden>≡</span>
            </button>
          )}

          {/* Logo + Title (logo is NOT a link) */}
          <div style={styles.centerStack}>
            <img src="/logo-dark.png" alt="Fur Majesty" style={styles.logo} />
            {user && currentTitle && <div style={styles.title}>{currentTitle}</div>}
          </div>

          {/* Right-side auth control */}
          <div style={{ justifySelf: "end" }}>
            {!user ? (
              <Link to="/auth" style={styles.authLink}>Sign in</Link>
            ) : (
              <Link to="/signout" style={styles.authLink}>Sign out</Link>
            )}
          </div>
        </div>
      </header>

      {/* Overlay + Drawer */}
      <div role="presentation" onClick={() => setOpen(false)} style={styles.overlay} />
      <aside role="dialog" aria-modal="true" aria-label="Main navigation" style={styles.drawer}>
        <div style={styles.drawerHeader}>
          <div style={styles.drawerTitle}>Menu</div>
          <button aria-label="Close menu" onClick={() => setOpen(false)} style={styles.drawerCloseBtn}>×</button>
        </div>
        <nav aria-label="Primary">
          <ul style={styles.navList}>
            {tabs.map(t => {
              const active = activeMap.get(t.to);
              return (
                <li key={t.to}>
                  <Link to={t.to} onClick={() => setOpen(false)} style={styles.navItem(active)}>
                    {t.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
        {user && (
          <div style={styles.signout}>
            <Link to="/signout" onClick={() => setOpen(false)} style={styles.signoutLink}>
              Sign out
            </Link>
          </div>
        )}
      </aside>

      <main className="page" style={styles.main}>{children}</main>

      <footer style={styles.footer}>
        <div style={styles.footerInner}>
          <span>Created by Draíocht (dree-uckt) Studios</span>
        </div>
      </footer>
    </div>
  );
}

Layout.propTypes = { children: PropTypes.node };
