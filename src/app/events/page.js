"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useApp } from "../../context/AppContext";

export default function EventsPage() {
  const { events, brands, loading, loadEvents, loadBrands } = useApp();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState("all");
  const [selectedModality, setSelectedModality] = useState("all"); // all, online, presencial
  const [sortBy, setSortBy] = useState("date_asc"); // date_asc, price_asc, price_desc
  const [selectedEvent, setSelectedEvent] = useState(null); // Detail modal

  useEffect(() => {
    loadEvents();
    loadBrands();
  }, [loadEvents, loadBrands]);

  useEffect(() => {
    if (typeof window !== "undefined" && events && events.length > 0) {
      const urlParams = new URLSearchParams(window.location.search);
      const targetId = urlParams.get("id");
      if (targetId) {
        const found = events.find(e => Number(e.id) === Number(targetId));
        if (found) setSelectedEvent(found);
      }
    }
  }, [events]);

  // Event types for filtering
  const eventTypes = [
    { id: "all", label: "Todos los Tipos", icon: "fa-border-all" },
    { id: "curso", label: "Cursos", icon: "fa-graduation-cap" },
    { id: "taller", label: "Talleres", icon: "fa-chalkboard-user" },
    { id: "evento", label: "Eventos", icon: "fa-calendar-days" },
  ];

  // Filtering logic
  const filteredEvents = useMemo(() => {
    return (events || []).filter((evt) => {
      // 1. Search term
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const titleMatch = evt.title && evt.title.toLowerCase().includes(q);
        const descMatch = evt.description && evt.description.toLowerCase().includes(q);
        const locMatch = evt.location && evt.location.toLowerCase().includes(q);
        const brand = brands.find((b) => Number(b.id) === Number(evt.brandId));
        const brandMatch = brand && brand.name && brand.name.toLowerCase().includes(q);
        if (!titleMatch && !descMatch && !locMatch && !brandMatch) return false;
      }

      // 2. Event type
      if (selectedType !== "all" && evt.eventType !== selectedType) {
        return false;
      }

      // 3. Modality
      if (selectedModality === "online" && !evt.isOnline) return false;
      if (selectedModality === "presencial" && evt.isOnline) return false;

      return true;
    }).sort((a, b) => {
      if (sortBy === "date_asc") {
        return new Date(a.eventDate || 0) - new Date(b.eventDate || 0);
      }
      if (sortBy === "price_asc") {
        return (a.price || 0) - (b.price || 0);
      }
      if (sortBy === "price_desc") {
        return (b.price || 0) - (a.price || 0);
      }
      return 0;
    });
  }, [events, brands, searchQuery, selectedType, selectedModality, sortBy]);

  const formatEventDate = (dateStr, isAllDay = false) => {
    if (!dateStr) return "Fecha por confirmar";
    try {
      const date = new Date(dateStr);
      const isAllDayDate = isAllDay || dateStr.includes("T00:00");
      if (isAllDayDate) {
        return date.toLocaleDateString("es-ES", {
          weekday: "short",
          day: "numeric",
          month: "short",
          year: "numeric"
        }) + " (Todo el día)";
      }
      return date.toLocaleDateString("es-ES", {
        weekday: "short",
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div style={{ minHeight: "100vh", paddingBottom: "4rem" }}>
      {/* ── BANNER CABEZAL ── */}
      <section
        style={{
          background: "linear-gradient(135deg, rgba(20,20,22,0.95) 0%, rgba(35,30,20,0.9) 100%)",
          borderBottom: "1px solid var(--border-color)",
          padding: "3.5rem 1.5rem 2.5rem 1.5rem",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div style={{ maxWidth: "1200px", margin: "0 auto", textAlign: "center", position: "relative", zIndex: 2 }}>
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              background: "rgba(212, 175, 55, 0.12)",
              border: "1px solid rgba(212, 175, 55, 0.3)",
              color: "var(--gold-dark)",
              fontSize: "0.8rem",
              fontWeight: 700,
              padding: "4px 14px",
              borderRadius: "20px",
              marginBottom: "1rem"
            }}
          >
            <i className="fa-solid fa-graduation-cap"></i> APRENDE Y CONECTA CON MARCAS LOCALES
          </span>
          <h1
            style={{
              fontSize: "clamp(2rem, 5vw, 3.2rem)",
              fontWeight: 900,
              letterSpacing: "-0.02em",
              color: "#FFFFFF",
              marginBottom: "0.75rem",
              lineHeight: 1.1
            }}
          >
            Eventos, Cursos & Talleres
          </h1>
          <p
            style={{
              color: "var(--text-muted)",
              fontSize: "1.05rem",
              maxWidth: "680px",
              margin: "0 auto 2rem auto",
              lineHeight: 1.6
            }}
          >
            Descubre experiencias en vivo, talleres artesanales, capacitaciones exclusivas y eventos organizados por la comunidad de marcas independientes de AOURUM.
          </p>

          {/* Search Bar */}
          <div
            style={{
              maxWidth: "600px",
              margin: "0 auto",
              display: "flex",
              alignItems: "center",
              gap: "10px",
              background: "var(--bg-card)",
              border: "1.5px solid var(--gold-primary)",
              borderRadius: "30px",
              padding: "6px 16px",
              boxShadow: "0 8px 24px rgba(0,0,0,0.2)"
            }}
          >
            <i className="fa-solid fa-magnifying-glass" style={{ color: "var(--gold-primary)", fontSize: "1rem" }}></i>
            <input
              type="text"
              placeholder="Buscar curso, taller, tema o marca..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                flex: 1,
                background: "transparent",
                border: "none",
                color: "var(--text-primary)",
                fontSize: "0.95rem",
                outline: "none",
                padding: "8px 0"
              }}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer" }}
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            )}
          </div>
        </div>
      </section>

      {/* ── SECCIÓN PRINCIPAL CON FILTROS Y GRILLA ── */}
      <div style={{ maxWidth: "1200px", margin: "2rem auto 0 auto", padding: "0 1.5rem" }}>
        
        {/* Barra de Filtros Rápidos */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "12px",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "2rem",
            paddingBottom: "1rem",
            borderBottom: "1px solid var(--border-color)"
          }}
        >
          {/* Categorías de Eventos */}
          <div style={{ display: "flex", gap: "8px", overflowX: "auto", paddingBottom: "4px", flex: 1, scrollbarWidth: "none" }}>
            {eventTypes.map((type) => {
              const active = selectedType === type.id;
              return (
                <button
                  key={type.id}
                  onClick={() => setSelectedType(type.id)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    background: active ? "var(--gold-gradient)" : "var(--bg-card)",
                    color: active ? "#1C1C1E" : "var(--text-primary)",
                    border: active ? "1.5px solid var(--gold-primary)" : "1px solid var(--border-color)",
                    padding: "0.45rem 1rem",
                    borderRadius: "20px",
                    fontWeight: active ? 700 : 500,
                    fontSize: "0.82rem",
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                    transition: "var(--transition-smooth)"
                  }}
                >
                  <i className={`fa-solid ${type.icon}`} style={{ fontSize: "0.8rem" }}></i>
                  <span>{type.label}</span>
                </button>
              );
            })}
          </div>

          {/* Filtro de Modalidad y Ordenamiento */}
          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            <select
              value={selectedModality}
              onChange={(e) => setSelectedModality(e.target.value)}
              style={{
                background: "var(--bg-card)",
                border: "1px solid var(--border-color)",
                color: "var(--text-primary)",
                padding: "0.45rem 0.85rem",
                borderRadius: "16px",
                fontSize: "0.82rem",
                fontWeight: 600,
                outline: "none",
                cursor: "pointer"
              }}
            >
              <option value="all">🌐 Todas las modalidades</option>
              <option value="presencial">📍 Presencial</option>
              <option value="online">💻 Online / Virtual</option>
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              style={{
                background: "var(--bg-card)",
                border: "1px solid var(--border-color)",
                color: "var(--text-primary)",
                padding: "0.45rem 0.85rem",
                borderRadius: "16px",
                fontSize: "0.82rem",
                fontWeight: 600,
                outline: "none",
                cursor: "pointer"
              }}
            >
              <option value="date_asc">📅 Más Próximos</option>
              <option value="price_asc">💵 Precio: Menor a Mayor</option>
              <option value="price_desc">💎 Precio: Mayor a Menor</option>
            </select>
          </div>
        </div>

        {/* Grilla de Eventos */}
        {loading && filteredEvents.length === 0 ? (
          <div style={{ textAlign: "center", padding: "4rem 1rem", color: "var(--text-muted)" }}>
            <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: "2rem", color: "var(--gold-primary)", marginBottom: "1rem" }}></i>
            <p>Cargando eventos y talleres...</p>
          </div>
        ) : filteredEvents.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "4rem 2rem",
              background: "var(--bg-card)",
              borderRadius: "16px",
              border: "1px solid var(--border-color)"
            }}
          >
            <i className="fa-solid fa-calendar-xmark" style={{ fontSize: "3rem", color: "var(--gold-primary)", marginBottom: "1rem" }}></i>
            <h3 style={{ fontSize: "1.2rem", fontWeight: 800, marginBottom: "0.5rem" }}>No se encontraron eventos</h3>
            <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", maxWidth: "450px", margin: "0 auto 1.5rem auto" }}>
              Intenta cambiar los filtros seleccionados o buscar con un término diferente.
            </p>
            <button
              onClick={() => { setSearchQuery(""); setSelectedType("all"); setSelectedModality("all"); }}
              className="btn-outline-gold"
              style={{ borderRadius: "20px", padding: "0.5rem 1.2rem", fontSize: "0.85rem" }}
            >
              Restablecer Filtros
            </button>
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
              gap: "1.5rem"
            }}
          >
            {filteredEvents.map((evt) => {
              const brand = brands.find((b) => Number(b.id) === Number(evt.brandId));

              return (
                <div
                  key={evt.id}
                  style={{
                    background: "var(--bg-card)",
                    border: "1px solid var(--border-color)",
                    borderRadius: "16px",
                    overflow: "hidden",
                    display: "flex",
                    flexDirection: "column",
                    transition: "transform 0.25s ease, box-shadow 0.25s ease",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
                    cursor: "pointer"
                  }}
                  className="card-hover-effect"
                  onClick={() => setSelectedEvent(evt)}
                >
                  {/* Banner/Imagen del Evento */}
                  <div style={{ position: "relative", width: "100%", height: "170px", background: "#111" }}>
                    <img
                      src={evt.image || brand?.logo || "/dummy.png"}
                      alt={evt.title}
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      onError={(e) => { e.target.src = "/dummy.png"; }}
                    />

                    {/* Insignia Tipo de Evento */}
                    <span
                      style={{
                        position: "absolute",
                        top: "12px",
                        left: "12px",
                        background: "rgba(0, 0, 0, 0.75)",
                        backdropFilter: "blur(6px)",
                        color: "var(--gold-dark)",
                        border: "1px solid rgba(212, 175, 55, 0.4)",
                        padding: "3px 10px",
                        borderRadius: "12px",
                        fontSize: "0.72rem",
                        fontWeight: 800,
                        textTransform: "uppercase"
                      }}
                    >
                      {evt.eventType || "Curso"}
                    </span>

                    {/* Insignia Modalidad Online/Presencial */}
                    <span
                      style={{
                        position: "absolute",
                        top: "12px",
                        right: "12px",
                        background: evt.isOnline ? "rgba(59, 130, 246, 0.85)" : "rgba(16, 185, 129, 0.85)",
                        color: "#FFFFFF",
                        padding: "3px 10px",
                        borderRadius: "12px",
                        fontSize: "0.72rem",
                        fontWeight: 700
                      }}
                    >
                      <i className={`fa-solid ${evt.isOnline ? "fa-laptop" : "fa-location-dot"}`} style={{ marginRight: "4px" }}></i>
                      {evt.isOnline ? "Online" : "Presencial"}
                    </span>
                  </div>

                  {/* Detalle del Evento */}
                  <div style={{ padding: "1.2rem", flex: 1, display: "flex", flexDirection: "column" }}>
                    
                    {/* Marca organizadora */}
                    {brand && (
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                        <img
                          src={brand.logo || "/dummy.png"}
                          alt={brand.name}
                          style={{ width: "22px", height: "22px", borderRadius: "50%", objectFit: "cover" }}
                          onError={(e) => { e.target.src = "/dummy.png"; }}
                        />
                        <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--text-muted)" }}>
                          {brand.name}
                        </span>
                      </div>
                    )}

                    {/* Título */}
                    <h3
                      style={{
                        fontSize: "1.05rem",
                        fontWeight: 800,
                        lineHeight: 1.3,
                        marginBottom: "0.6rem",
                        color: "var(--text-primary)"
                      }}
                    >
                      {evt.title}
                    </h3>

                    {/* Fecha y Hora */}
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.82rem", color: "var(--gold-dark)", fontWeight: 700, marginBottom: "0.5rem" }}>
                      <i className="fa-regular fa-clock"></i>
                      <span>{formatEventDate(evt.eventDate)}</span>
                    </div>

                    {/* Ubicación / Link */}
                    <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "1rem" }}>
                      <i className={`fa-solid ${evt.isOnline ? "fa-link" : "fa-map-pin"}`} style={{ marginRight: "6px" }}></i>
                      <span>{evt.isOnline ? (evt.onlineLink ? "Enlace de acceso disponible" : "Plataforma virtual") : (evt.location || "Ubicación por confirmar")}</span>
                    </div>

                    {/* Footer de Tarjeta: Precio y Acción */}
                    <div style={{ marginTop: "auto", paddingTop: "0.8rem", borderTop: "1px solid var(--border-color)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <div>
                        {evt.price !== null && evt.price !== undefined && evt.price > 0 ? (
                          <span style={{ fontSize: "1.1rem", fontWeight: 900, color: "var(--gold-dark)" }}>
                            S/ {evt.price.toLocaleString("es-PE")}
                          </span>
                        ) : (
                          <span style={{ fontSize: "0.85rem", fontWeight: 800, color: "#10b981", background: "rgba(16,185,129,0.12)", padding: "2px 8px", borderRadius: "10px" }}>
                            ¡GRATIS!
                          </span>
                        )}
                      </div>

                      <button
                        onClick={(e) => { e.stopPropagation(); setSelectedEvent(evt); }}
                        className="btn-gold"
                        style={{ padding: "0.4rem 0.9rem", borderRadius: "14px", fontSize: "0.78rem", fontWeight: 700 }}
                      >
                        Ver Detalles
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── MODAL DE DETALLES DEL EVENTO ── */}
      {selectedEvent && (() => {
        const brand = brands.find((b) => Number(b.id) === Number(selectedEvent.brandId));

        return (
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: "rgba(0,0,0,0.8)",
              backdropFilter: "blur(6px)",
              zIndex: 1400,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "1rem"
            }}
            onClick={() => setSelectedEvent(null)}
          >
            <div
              style={{
                background: "var(--bg-card)",
                border: "1.5px solid var(--gold-primary)",
                borderRadius: "20px",
                maxWidth: "560px",
                width: "100%",
                maxHeight: "90vh",
                overflowY: "auto",
                boxShadow: "0 20px 50px rgba(0,0,0,0.5)",
                position: "relative"
              }}
              onClick={(e) => e.stopPropagation()}
              className="fade-in"
            >
              {/* Botón Cerrar */}
              <button
                onClick={() => setSelectedEvent(null)}
                style={{
                  position: "absolute",
                  top: "14px",
                  right: "14px",
                  background: "rgba(0,0,0,0.6)",
                  border: "1px solid var(--border-color)",
                  color: "#FFF",
                  width: "32px",
                  height: "32px",
                  borderRadius: "50%",
                  cursor: "pointer",
                  zIndex: 10,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center"
                }}
              >
                <i className="fa-solid fa-xmark"></i>
              </button>

              {/* Imagen Cabezal / Flyer Completo */}
              {selectedEvent.image && (
                <div style={{ width: "100%", maxHeight: "420px", overflow: "hidden", position: "relative", background: "#000", display: "flex", justifyContent: "center", alignItems: "center" }}>
                  <img
                    src={selectedEvent.image}
                    alt={selectedEvent.title}
                    style={{ width: "100%", height: "100%", objectFit: "contain", maxHeight: "420px", display: "block" }}
                  />
                  <a 
                    href={selectedEvent.image} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    style={{ position: "absolute", bottom: "12px", right: "12px", background: "rgba(0,0,0,0.8)", color: "var(--gold-dark, #d4af37)", padding: "5px 12px", borderRadius: "20px", fontSize: "0.75rem", textDecoration: "none", fontWeight: 700, border: "1px solid rgba(212,175,55,0.4)" }}
                  >
                    <i className="fa-solid fa-expand" style={{ marginRight: 5 }}></i> Ver Imagen Completa
                  </a>
                </div>
              )}

              <div style={{ padding: "1.5rem" }}>
                {/* Categoría y Modalidad */}
                <div style={{ display: "flex", gap: "8px", marginBottom: "0.75rem" }}>
                  <span
                    style={{
                      background: "rgba(212, 175, 55, 0.15)",
                      color: "var(--gold-dark)",
                      border: "1px solid rgba(212, 175, 55, 0.4)",
                      padding: "3px 10px",
                      borderRadius: "12px",
                      fontSize: "0.75rem",
                      fontWeight: 800,
                      textTransform: "uppercase"
                    }}
                  >
                    {selectedEvent.eventType || "Curso"}
                  </span>
                  <span
                    style={{
                      background: selectedEvent.isOnline ? "rgba(59, 130, 246, 0.15)" : "rgba(16, 185, 129, 0.15)",
                      color: selectedEvent.isOnline ? "#3b82f6" : "#10b981",
                      border: "1px solid rgba(255,255,255,0.1)",
                      padding: "3px 10px",
                      borderRadius: "12px",
                      fontSize: "0.75rem",
                      fontWeight: 700
                    }}
                  >
                    {selectedEvent.isOnline ? "💻 Online / Virtual" : "📍 Presencial"}
                  </span>
                </div>

                {/* Título */}
                <h2 style={{ fontSize: "1.35rem", fontWeight: 900, marginBottom: "0.75rem", color: "var(--text-primary)" }}>
                  {selectedEvent.title}
                </h2>

                {/* Marca Organizadora */}
                {brand && (
                  <Link
                    href={`/brands/${brand.slug || brand.id}`}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "8px",
                      background: "var(--bg-input)",
                      padding: "6px 12px",
                      borderRadius: "20px",
                      textDecoration: "none",
                      color: "var(--text-primary)",
                      marginBottom: "1.2rem",
                      fontSize: "0.85rem",
                      fontWeight: 700
                    }}
                  >
                    <img
                      src={brand.logo || "/dummy.png"}
                      alt={brand.name}
                      style={{ width: "24px", height: "24px", borderRadius: "50%", objectFit: "cover" }}
                    />
                    <span>Organizado por: <strong>{brand.name}</strong></span>
                    <i className="fa-solid fa-chevron-right" style={{ fontSize: "0.7rem", color: "var(--gold-primary)" }}></i>
                  </Link>
                )}

                {/* Info Clave Grid */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "12px",
                    background: "var(--bg-input)",
                    padding: "1rem",
                    borderRadius: "14px",
                    marginBottom: "1.2rem",
                    border: "1px solid var(--border-color)"
                  }}
                >
                  <div>
                    <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", display: "block", fontWeight: 700 }}>FECHA Y HORA</span>
                    <span style={{ fontSize: "0.88rem", fontWeight: 800, color: "var(--gold-dark)" }}>
                      {formatEventDate(selectedEvent.eventDate)}
                    </span>
                  </div>

                  {selectedEvent.durationMinutes && (
                    <div>
                      <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", display: "block", fontWeight: 700 }}>DURACIÓN</span>
                      <span style={{ fontSize: "0.88rem", fontWeight: 800 }}>
                        {selectedEvent.durationMinutes} minutos
                      </span>
                    </div>
                  )}

                  <div>
                    <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", display: "block", fontWeight: 700 }}>UBICACIÓN / PLATAFORMA</span>
                    <span style={{ fontSize: "0.85rem", fontWeight: 700 }}>
                      {selectedEvent.isOnline ? "Modalidad Virtual" : (selectedEvent.location || "Por confirmar")}
                    </span>
                  </div>

                  <div>
                    <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", display: "block", fontWeight: 700 }}>CUPOS</span>
                    <span style={{ fontSize: "0.85rem", fontWeight: 700, color: selectedEvent.spotsRemaining > 0 ? "#10b981" : "var(--text-primary)" }}>
                      {selectedEvent.spotsRemaining !== null && selectedEvent.spotsRemaining !== undefined
                        ? `${selectedEvent.spotsRemaining} ${selectedEvent.spotsTotal ? `/ ${selectedEvent.spotsTotal}` : ""} disponibles`
                        : "Sin límite indicado"}
                    </span>
                  </div>
                </div>

                {/* Descripción */}
                {selectedEvent.description && (
                  <div style={{ marginBottom: "1.5rem" }}>
                    <h4 style={{ fontSize: "0.88rem", fontWeight: 800, color: "var(--text-muted)", marginBottom: "0.4rem", textTransform: "uppercase" }}>
                      Descripción del Evento / Temario
                    </h4>
                    <p style={{ fontSize: "0.92rem", lineHeight: 1.6, color: "var(--text-primary)", whiteSpace: "pre-line" }}>
                      {selectedEvent.description}
                    </p>
                  </div>
                )}

                {/* Link u Opción de WhatsApp para Modalidad Virtual */}
                {selectedEvent.isOnline && selectedEvent.onlineLink && (
                  <div style={{ marginBottom: "1.5rem", background: "rgba(37, 211, 102, 0.1)", border: "1px solid rgba(37, 211, 102, 0.4)", padding: "1rem", borderRadius: "14px", display: "flex", flexDirection: "column", gap: "8px", alignItems: "flex-start" }}>
                    <span style={{ fontSize: "0.82rem", fontWeight: 800, color: "#25D366", display: "flex", alignItems: "center", gap: "6px" }}>
                      <i className="fa-brands fa-whatsapp" style={{ fontSize: "1.1rem" }}></i> Inscripción y Consultas por WhatsApp
                    </span>
                    <a
                      href={selectedEvent.onlineLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "8px",
                        padding: "10px 18px",
                        borderRadius: "12px",
                        backgroundColor: "#25D366",
                        color: "#ffffff",
                        fontWeight: 700,
                        fontSize: "0.9rem",
                        textDecoration: "none",
                        boxShadow: "0 4px 12px rgba(37, 211, 102, 0.3)"
                      }}
                    >
                      <i className="fa-brands fa-whatsapp" style={{ fontSize: "1.25rem" }}></i>
                      Pedir Información por WhatsApp
                    </a>
                  </div>
                )}

                {/* Ubicación en Mapa para Modalidad Presencial */}
                {!selectedEvent.isOnline && selectedEvent.lat && selectedEvent.lng && (
                  <div style={{ marginBottom: "1.5rem", background: "rgba(212, 175, 55, 0.08)", border: "1px solid var(--border-color)", padding: "1rem", borderRadius: "14px", display: "flex", flexDirection: "column", gap: "8px" }}>
                    <span style={{ fontSize: "0.82rem", fontWeight: 800, color: "var(--gold-dark)", display: "flex", alignItems: "center", gap: "6px" }}>
                      <i className="fa-solid fa-map-location-dot"></i> Ubicación Presencial en Arequipa
                    </span>
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${selectedEvent.lat},${selectedEvent.lng}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "8px",
                        padding: "9px 16px",
                        borderRadius: "10px",
                        backgroundColor: "rgba(212,175,55,0.15)",
                        color: "var(--gold-primary)",
                        border: "1px solid var(--gold-primary)",
                        fontWeight: 700,
                        fontSize: "0.85rem",
                        textDecoration: "none",
                        width: "fit-content"
                      }}
                    >
                      <i className="fa-solid fa-map-location-dot"></i>
                      Ver Ubicación en Google Maps
                    </a>
                  </div>
                )}

                {/* Botón de Inscripción / Contacto */}
                <div style={{ display: "flex", gap: "10px", marginTop: "1rem" }}>
                  {brand && (
                    <Link
                      href={`/brands/${brand.slug || brand.id}`}
                      className="btn-gold"
                      style={{
                        flex: 1,
                        textAlign: "center",
                        padding: "0.75rem",
                        borderRadius: "12px",
                        fontWeight: 800,
                        fontSize: "0.92rem",
                        textDecoration: "none",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "8px"
                      }}
                    >
                      <i className="fa-solid fa-paper-plane"></i> Contactar a {brand.name}
                    </Link>
                  )}

                  <button
                    onClick={() => setSelectedEvent(null)}
                    className="btn-outline-gold"
                    style={{ padding: "0.75rem 1.2rem", borderRadius: "12px", fontSize: "0.88rem" }}
                  >
                    Cerrar
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
