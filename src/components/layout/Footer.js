"use client";

export default function Footer() {
  return (
    <footer className="site-footer" style={{ background: "transparent", borderTop: "1px solid var(--border-color)", padding: "2rem 0", marginTop: "4rem", textAlign: "center", fontSize: "0.88rem", color: "var(--text-muted)" }}>
      <div className="container">
        <p>© {new Date().getFullYear()} AOURUM.</p>
        <p style={{ margin: "4px 0 0 0", fontSize: "0.82rem" }}>
          Creado por <a href="https://ackyul.github.io/yoshuanunez.github.io/" target="_blank" rel="noopener noreferrer" style={{ color: "var(--text-primary)", fontWeight: "bold", textDecoration: "underline" }}>Yoshua Josafat Núñez Huaccoto</a> · <a href="https://ackyul.github.io/yoshuanunez.github.io/" target="_blank" rel="noopener noreferrer" style={{ color: "var(--text-gold)", fontWeight: 600, textDecoration: "underline" }}>Ackyul</a>
        </p>
        <span style={{ fontSize: "0.75rem", color: "var(--text-gold)", display: "block", marginTop: "6px", fontWeight: 500 }}>Arequipa, Perú</span>
      </div>
    </footer>
  );
}
