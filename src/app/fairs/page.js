"use client";

import { useApp } from "../../context/AppContext";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function FairsPage() {
  const {
    fairs,
    loading,
    getOrganizerName,
    searchTerm
  } = useApp();

  const router = useRouter();

  // Filter fairs based on global search in the header
  const filteredFairs = fairs.filter((fair) => {
    const matchesSearch = fair.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          fair.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          fair.location.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  return (
    <div className="container" style={{ paddingBottom: "3rem" }}>
      {loading ? (
        <div style={{ textAlign: "center", padding: "6rem 0", display: "flex", flexDirection: "column", gap: "1rem", alignItems: "center" }}>
          <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: "2.5rem", color: "var(--gold-primary)" }}></i>
          <p style={{ color: "var(--text-muted)", fontWeight: "medium", fontSize: "0.95rem" }}>Cargando calendario de ferias...</p>
        </div>
      ) : (
        <div className="fade-in">
          <div>
            <div style={{ marginBottom: "2.0rem" }}>
              <h2 style={{ fontSize: "1.7rem", fontWeight: 800, letterSpacing: "-0.015em", marginTop: "2px" }}>Ferias y Eventos</h2>
            </div>
            
            {filteredFairs.length === 0 ? (
              <div style={{ padding: "5rem", textAlign: "center", background: "#FFFFFF", borderRadius: "12px", border: "1px solid var(--border-color)" }}>
                <i className="fa-solid fa-calendar-times" style={{ fontSize: "3rem", color: "var(--border-color)", marginBottom: "1rem" }}></i>
                <p style={{ color: "var(--text-muted)", fontSize: "0.95rem" }}>No se encontraron ferias. Intenta buscando otro término.</p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "1.8rem" }}>
                {filteredFairs.map((fair) => (
                  <div 
                    key={fair.id} 
                    className="glass-panel" 
                    style={{ overflow: "hidden", cursor: "pointer" }}
                    onClick={() => router.push(`/fairs/${fair.slug || fair.id}`)}
                  >
                    <div style={{ height: "100%", minHeight: "220px", position: "relative" }}>
                      <img src={fair.banner} alt={fair.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    </div>
                    <div style={{ padding: "1.6rem", display: "flex", flexDirection: "column", justifyContent: "space-between", gap: "0.8rem" }}>
                      <div>
                        <div style={{ display: "flex", gap: "12px", alignItems: "center", fontSize: "0.82rem", color: "var(--gold-dark)", textTransform: "uppercase", fontWeight: 700, marginBottom: "0.4rem" }}>
                          <span><i className="fa-solid fa-calendar-day"></i> {fair.date}</span>
                          <span>•</span>
                          <span><i className="fa-solid fa-clock"></i> {fair.time}</span>
                        </div>
                        <h3 style={{ fontSize: "1.25rem", fontWeight: 800, marginBottom: "0.5rem" }}>{fair.name}</h3>
                        <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "0.8rem", lineHeight: 1.45 }}>{fair.description}</p>
                        
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.85rem", color: "var(--text-primary)", fontWeight: 500 }}>
                          <i className="fa-solid fa-location-dot" style={{ color: "var(--gold-primary)" }}></i>
                          <span>{fair.location}</span>
                        </div>

                        <div style={{ marginTop: "0.6rem", fontSize: "0.8rem", color: "var(--text-muted)" }}>
                          Organizado por: <strong style={{ color: "var(--text-primary)" }}>{getOrganizerName(fair.organizerId)}</strong>
                        </div>
                      </div>

                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid var(--border-color)", paddingTop: "1rem" }}>
                        <div style={{ display: "flex", gap: "1.2rem" }}>
                          <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                            🏢 Marcas: <strong>{fair.acceptedBrands ? fair.acceptedBrands.length : 0}</strong>
                          </span>
                          <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                            🎸 Escenario: <strong>{fair.acceptedBands ? fair.acceptedBands.length : 0}</strong>
                          </span>
                        </div>

                        <button className="btn-outline-gold" style={{ padding: "0.45rem 1rem", fontSize: "0.8rem", borderRadius: "6px" }}>
                          Ver Evento
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
