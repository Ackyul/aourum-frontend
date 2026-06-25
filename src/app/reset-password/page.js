"use client";

import { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useApp } from "../../context/AppContext";
import Link from "next/link";

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { resetPassword, setShowLoginModal } = useApp();

  const token = searchParams.get("token");
  const email = searchParams.get("email");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!token || !email) {
      setError("Enlace de recuperación inválido o incompleto.");
      return;
    }

    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    setLoading(true);
    const res = await resetPassword(token, email, password);
    setLoading(false);

    if (res.success) {
      setSuccess(true);
    } else {
      setError(res.error || "No se pudo restablecer la contraseña.");
    }
  };

  if (success) {
    return (
      <div 
        style={{ 
          maxWidth: "460px", 
          margin: "4rem auto", 
          padding: "2.5rem 2rem", 
          background: "#FFFFFF", 
          borderRadius: "12px", 
          border: "1.5px solid var(--gold-primary)", 
          boxShadow: "0 12px 32px rgba(212,175,55,0.1)", 
          textAlign: "center" 
        }} 
        className="reset-password-card fade-in"
      >
        <div 
          style={{ 
            width: "64px", 
            height: "64px", 
            background: "var(--gold-gradient)", 
            borderRadius: "50%", 
            display: "flex", 
            alignItems: "center", 
            justify: "center", 
            margin: "0 auto 1.5rem",
            boxShadow: "0 8px 20px rgba(212,175,55,0.2)"
          }}
        >
          <i className="fa-solid fa-check" style={{ color: "#1C1C1E", fontSize: "1.8rem" }}></i>
        </div>
        <h2 style={{ fontSize: "1.5rem", fontWeight: 800, marginBottom: "0.5rem" }}>Contraseña Restablecida</h2>
        <p style={{ color: "var(--text-muted)", fontSize: "0.88rem", marginBottom: "2rem", lineHeight: "1.5" }}>
          Tu contraseña ha sido actualizada exitosamente. Ya puedes iniciar sesión con tus nuevas credenciales.
        </p>
        <button 
          onClick={() => {
            router.push("/");
            setTimeout(() => setShowLoginModal(true), 300);
          }}
          className="btn-gold" 
          style={{ width: "100%", padding: "0.8rem", borderRadius: "8px", fontWeight: "bold", fontSize: "0.95rem" }}
        >
          Iniciar Sesión
        </button>
      </div>
    );
  }

  return (
    <div 
      style={{ 
        maxWidth: "460px", 
        margin: "4rem auto", 
        padding: "2.5rem 2rem", 
        background: "#FFFFFF", 
        borderRadius: "12px", 
        border: "1px solid var(--border-color)", 
        boxShadow: "0 8px 24px rgba(0,0,0,0.02)" 
      }} 
      className="reset-password-card fade-in"
    >
      <div style={{ textAlign: "center", marginBottom: "2rem" }}>
        <div 
          style={{ 
            width: "56px", 
            height: "56px", 
            background: "var(--gold-gradient)", 
            borderRadius: "14px", 
            display: "flex", 
            alignItems: "center", 
            justify: "center", 
            margin: "0 auto 1rem", 
            boxShadow: "0 8px 24px rgba(212,175,55,0.25)" 
          }}
        >
          <span style={{ color: "#1C1C1E", fontFamily: "'Cinzel', serif", fontWeight: 900, fontSize: "1.6rem" }}>A</span>
        </div>
        <h2 style={{ fontSize: "1.4rem", fontWeight: 800, marginBottom: "0.4rem" }}>Nueva Contraseña</h2>
        <p style={{ color: "var(--text-muted)", fontSize: "0.82rem" }}>Ingresa tu nueva contraseña para acceder a AOURUM</p>
      </div>

      {(!token || !email) ? (
        <div style={{ padding: "1rem", background: "rgba(239, 68, 68, 0.08)", border: "1px solid rgba(239, 68, 68, 0.2)", borderRadius: "8px", color: "#ef4444", fontSize: "0.85rem", textAlign: "center", marginBottom: "1.5rem" }}>
          <i className="fa-solid fa-triangle-exclamation" style={{ marginRight: "8px" }}></i>
          Enlace de recuperación inválido o incompleto. Por favor, solicita uno nuevo.
        </div>
      ) : (
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.2rem" }}>
          {error && (
            <div style={{ padding: "0.8rem", background: "rgba(239, 68, 68, 0.08)", border: "1px solid rgba(239, 68, 68, 0.2)", borderRadius: "8px", color: "#ef4444", fontSize: "0.85rem" }}>
              <i className="fa-solid fa-circle-exclamation" style={{ marginRight: "6px" }}></i>
              {error}
            </div>
          )}

          <div className="form-group" style={{ margin: 0 }}>
            <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.85rem", fontWeight: 600, marginBottom: "6px" }}>
              <i className="fa-solid fa-lock" style={{ color: "var(--gold-primary)", fontSize: "0.85rem" }}></i>
              Nueva Contraseña
            </label>
            <div style={{ position: "relative" }}>
              <input 
                type={passwordVisible ? "text" : "password"}
                className="form-control"
                placeholder="Mínimo 6 caracteres"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={{ paddingRight: "2.8rem" }}
              />
              <button
                type="button"
                onClick={() => setPasswordVisible(!passwordVisible)}
                style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: 0 }}
              >
                <i className={`fa-solid ${passwordVisible ? "fa-eye-slash" : "fa-eye"}`} style={{ fontSize: "0.9rem" }}></i>
              </button>
            </div>
          </div>

          <div className="form-group" style={{ margin: 0 }}>
            <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.85rem", fontWeight: 600, marginBottom: "6px" }}>
              <i className="fa-solid fa-lock" style={{ color: "var(--gold-primary)", fontSize: "0.85rem" }}></i>
              Confirmar Nueva Contraseña
            </label>
            <input 
              type="password"
              className="form-control"
              placeholder="Repite tu contraseña"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>

          <button 
            type="submit" 
            className="btn-gold"
            disabled={loading}
            style={{ width: "100%", padding: "0.75rem", borderRadius: "10px", fontSize: "0.95rem", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", marginTop: "0.5rem" }}
          >
            {loading 
              ? <><i className="fa-solid fa-spinner fa-spin"></i> Guardando...</>
              : <><i className="fa-solid fa-save"></i> Guardar Nueva Contraseña</>
            }
          </button>
        </form>
      )}

      <div style={{ textAlign: "center", marginTop: "1.5rem", paddingTop: "1rem", borderTop: "1px solid var(--border-color)" }}>
        <Link 
          href="/"
          style={{ textDecoration: "none", color: "var(--text-muted)", fontSize: "0.85rem", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: "6px" }}
        >
          <i className="fa-solid fa-arrow-left"></i>
          Volver a Inicio
        </Link>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense 
      fallback={
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}>
          <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: "2rem", color: "var(--gold-primary)" }}></i>
        </div>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  );
}
