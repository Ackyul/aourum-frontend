"use client";

import { useEffect, useMemo } from "react";
import { useApp } from "../../context/AppContext";
import Link from "next/link";
import { useRouter } from "next/navigation";

const formatDisplayDate = (dateStr) => {
  if (!dateStr) return "";
  const formatSingle = (str) => {
    const trimmed = str.trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
      const [year, month, day] = trimmed.split("-");
      return `${day}/${month}/${year}`;
    }
    return trimmed;
  };
  const separator = dateStr.includes(" al ") ? " al " : (dateStr.includes(" AL ") ? " AL " : null);
  if (separator) {
    const parts = dateStr.split(separator);
    return parts.map(formatSingle).join(" al ");
  }
  return formatSingle(dateStr);
};

const isFairLive = (dateStr) => {
  if (!dateStr) return false;
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  const todayStr = `${yyyy}-${mm}-${dd}`;

  const parseSingleDate = (str) => {
    const trimmed = str.trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
      return trimmed;
    }
    return null;
  };

  if (dateStr.includes(" al ")) {
    const [start, end] = dateStr.split(" al ").map(parseSingleDate);
    if (start && end) {
      return todayStr >= start && todayStr <= end;
    }
  } else if (dateStr.includes(" AL ")) {
    const [start, end] = dateStr.split(" AL ").map(parseSingleDate);
    if (start && end) {
      return todayStr >= start && todayStr <= end;
    }
  }
  const single = parseSingleDate(dateStr);
  if (single) {
    return todayStr === single;
  }
  return false;
};

const getFairStartDate = (dateStr) => {
  if (!dateStr) return "";
  const parts = dateStr.split(/ al | AL /);
  const firstPart = parts[0].trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(firstPart)) {
    return firstPart;
  }
  return "9999-12-31"; // Malformed at the end
};

const getFairEndDate = (dateStr) => {
  if (!dateStr) return "";
  const parts = dateStr.split(/ al | AL /);
  const lastPart = (parts[1] || parts[0]).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(lastPart)) {
    return lastPart;
  }
  return "1970-01-01"; // Malformed at the beginning for past sort
};

export default function FairsPage() {
  const {
    fairs,
    loading,
    getOrganizerName,
    searchTerm,
    loadFairs,
    parseDescription
  } = useApp();

  useEffect(() => {
    loadFairs();
  }, [loadFairs]);

  const router = useRouter();

  // Filter and sort fairs (live first, then upcoming ascending, then past descending)
  const sortedFairs = useMemo(() => {
    const filtered = fairs.filter((fair) => {
      const descText = parseDescription(fair.description).text || "";
      const matchesSearch = fair.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            descText.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            fair.location.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesSearch;
    });

    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const todayStr = `${yyyy}-${mm}-${dd}`;

    return [...filtered].sort((a, b) => {
      const liveA = isFairLive(a.date);
      const liveB = isFairLive(b.date);

      if (liveA && !liveB) return -1;
      if (!liveA && liveB) return 1;

      const startA = getFairStartDate(a.date);
      const startB = getFairStartDate(b.date);
      const endA = getFairEndDate(a.date);
      const endB = getFairEndDate(b.date);

      if (liveA && liveB) {
        return startA.localeCompare(startB) || endA.localeCompare(endB);
      }

      const upcomingA = startA > todayStr;
      const upcomingB = startB > todayStr;

      // One upcoming, one past
      if (upcomingA && !upcomingB) return -1;
      if (!upcomingA && upcomingB) return 1;

      // Both upcoming
      if (upcomingA && upcomingB) {
        return startA.localeCompare(startB);
      }

      // Both past
      return endB.localeCompare(endA);
    });
  }, [fairs, searchTerm, parseDescription]);

  return (
    <div className="container" style={{ paddingBottom: "3rem" }}>
      <style>{`
        @keyframes pulse-live {
          0% { transform: scale(0.9); opacity: 0.6; }
          50% { transform: scale(1.3); opacity: 1; }
          100% { transform: scale(0.9); opacity: 0.6; }
        }
      `}</style>

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
            
            {sortedFairs.length === 0 ? (
              <div style={{ padding: "5rem", textAlign: "center", background: "#FFFFFF", borderRadius: "12px", border: "1px solid var(--border-color)" }}>
                <i className="fa-solid fa-calendar-times" style={{ fontSize: "3rem", color: "var(--border-color)", marginBottom: "1rem" }}></i>
                <p style={{ color: "var(--text-muted)", fontSize: "0.95rem" }}>No se encontraron ferias. Intenta buscando otro término.</p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "1.8rem" }}>
                {sortedFairs.map((fair) => {
                  const isLive = isFairLive(fair.date);
                  return (
                    <div 
                      key={fair.id} 
                      className="glass-panel fair-horizontal-card" 
                      style={{
                        border: isLive ? "2px solid #ef4444" : undefined,
                        boxShadow: isLive ? "0 0 15px rgba(239, 68, 68, 0.15)" : undefined,
                        position: "relative",
                        cursor: "pointer"
                      }}
                      onClick={() => router.push(`/fairs/${fair.slug || fair.id}`)}
                    >
                      <div className="fair-card-image-wrapper">
                        <img src={fair.banner} alt={fair.name} />
                      </div>
                      <div className="fair-card-content">
                        <div>
                          <div style={{ display: "flex", gap: "12px", alignItems: "center", fontSize: "0.82rem", color: "var(--gold-dark)", textTransform: "uppercase", fontWeight: 700, marginBottom: "0.4rem", flexWrap: "wrap" }}>
                            {isLive && (
                              <span style={{ background: "#ef4444", color: "white", padding: "2px 8px", borderRadius: "12px", fontSize: "0.7rem", fontWeight: 800, display: "inline-flex", alignItems: "center", gap: "4px", boxShadow: "0 0 8px rgba(239,68,68,0.25)" }}>
                                <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "white", display: "inline-block", animation: "pulse-live 1.5s infinite" }}></span>
                                EN VIVO
                              </span>
                            )}
                            <span><i className="fa-solid fa-calendar-day"></i> {formatDisplayDate(fair.date)}</span>
                            <span>•</span>
                            <span><i className="fa-solid fa-clock"></i> {fair.time}</span>
                          </div>
                          <h3 style={{ fontSize: "1.25rem", fontWeight: 800, marginBottom: "0.5rem" }}>{fair.name}</h3>
                          <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "0.8rem", lineHeight: 1.45 }}>{parseDescription(fair.description).text}</p>
                          
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
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
