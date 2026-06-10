"use client";

import { useEffect } from "react";
import { useApp } from "../../context/AppContext";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
  const { activePersonId, people, loading } = useApp();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    if (activePersonId) {
      const p = people.find(x => x.id === Number(activePersonId));
      router.replace(`/people/${p?.username || activePersonId}`);
    } else {
      router.replace("/");
    }
  }, [activePersonId, people, loading, router]);

  return (
    <div style={{ textAlign: "center", padding: "8rem 0" }}>
      <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: "2.5rem", color: "var(--gold-primary)" }}></i>
      <p style={{ color: "var(--text-muted)", marginTop: "15px" }}>
        Redireccionando a tu perfil personal...
      </p>
    </div>
  );
}
