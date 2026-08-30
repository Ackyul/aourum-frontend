"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function EventsIndexPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/");
  }, [router]);

  return (
    <div style={{ minHeight: "60vh", display: "flex", justifyContent: "center", alignItems: "center" }}>
      <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: "2rem", color: "var(--gold-dark)" }}></i>
    </div>
  );
}
