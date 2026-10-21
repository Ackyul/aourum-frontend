"use client";

import { Suspense } from "react";
import DashboardClient from "../dashboard/DashboardClient";

export default function ProfileDashboardPage() {
  return (
    <Suspense
      fallback={
        <div style={{ textAlign: "center", padding: "8rem 0" }}>
          <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: "2.5rem", color: "var(--gold-primary)" }}></i>
          <p style={{ color: "var(--text-muted)", marginTop: "15px", fontSize: "0.95rem" }}>
            Cargando Panel de Usuario · Perfil & Preferencias...
          </p>
        </div>
      }
    >
      <DashboardClient initialTab="perfil" />
    </Suspense>
  );
}
