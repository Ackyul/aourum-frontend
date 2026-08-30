"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useApp } from "../../../context/AppContext";

export default function EventDetailPage() {
  const params = useParams();
  const rawSlug = params?.slug || "";
  const router = useRouter();
  const { events = [], brands = [], loadEvents, loadBrands, triggerNotification } = useApp();

  const [eventData, setEventData] = useState(null);
  const [loadingEvent, setLoadingEvent] = useState(true);
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [fullImgOpen, setFullImgOpen] = useState(false);

  useEffect(() => {
    loadEvents();
    loadBrands();
  }, [loadEvents, loadBrands]);

  useEffect(() => {
    if (!rawSlug) return;
    const decodedSlug = decodeURIComponent(rawSlug).trim();

    // 1. Check in events state array
    if (events && events.length > 0) {
      const found = events.find((e) => {
        if (!e) return false;
        if (e.slug && e.slug.toLowerCase() === decodedSlug.toLowerCase()) return true;
        if (String(e.id) === decodedSlug) return true;
        const titleSlug = (e.title || "")
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .replace(/[^a-z0-9]/g, "_")
          .replace(/_+/g, "_")
          .replace(/^_+|_+$/g, "");
        const paramSlug = decodedSlug
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .replace(/[^a-z0-9]/g, "_")
          .replace(/_+/g, "_")
          .replace(/^_+|_+$/g, "");
        return titleSlug === paramSlug;
      });

      if (found) {
        setEventData(found);
        setLoadingEvent(false);
        return;
      }
    }

    // 2. Fetch directly from backend endpoint if not found in state
    const fetchDirect = async () => {
      setLoadingEvent(true);
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "https://aourum-backend.onrender.com";
        let res = await fetch(`${apiUrl}/api/events/by-slug/${encodeURIComponent(decodedSlug)}`);
        if (res.ok) {
          const data = await res.json();
          setEventData(data);
        } else {
          res = await fetch(`${apiUrl}/api/events/${encodeURIComponent(decodedSlug)}`);
          if (res.ok) {
            const dataId = await res.json();
            setEventData(dataId);
          }
        }
      } catch (err) {
        console.error("Error fetching event by slug:", err);
      } finally {
        setLoadingEvent(false);
      }
    };

    fetchDirect();
  }, [rawSlug, events]);

  const brand = eventData
    ? brands.find((b) => Number(b.id) === Number(eventData.brandId))
    : null;

  // Extract brand design colors
  let brandThemeCol = "#95B721";
  let brandBgColor = "#FAF9F0";
  if (brand) {
    let parsedDesc = {};
    try {
      if (brand.description && brand.description.startsWith("{")) {
        parsedDesc = JSON.parse(brand.description);
      }
    } catch (e) {}

    const designObj = brand.design || parsedDesc.design || {};
    const rawTheme = designObj.themeColor || parsedDesc.theme_color || brand.themeColor;
    if (rawTheme) brandThemeCol = rawTheme.split(",")[0].trim();
    if (designObj.bgColor || parsedDesc.bgColor || brand.bgColor) {
      brandBgColor = designObj.bgColor || parsedDesc.bgColor || brand.bgColor;
    }
  }

  const handleGoBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else if (brand?.slug) {
      router.push(`/brands/${brand.slug}`);
    } else {
      router.push("/");
    }
  };

  const handleShare = () => {
    if (typeof window !== "undefined") {
      const shareUrl = window.location.href;
      if (navigator.clipboard) {
        navigator.clipboard.writeText(shareUrl);
        triggerNotification("Enlace del evento copiado al portapapeles", "success");
      } else {
        triggerNotification("URL: " + shareUrl, "info");
      }
    }
  };

  const formatEventDate = (dateStr) => {
    if (!dateStr) return "Fecha por definir";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const isAllDay = eventData?.isAllDay || dateStr.includes("T00:00");
    const options = { weekday: "short", day: "numeric", month: "long", year: "numeric" };
    const dateFormatted = d.toLocaleDateString("es-ES", options);
    if (isAllDay) return `${dateFormatted} (Todo el día)`;
    const timeFormatted = d.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
    return `${dateFormatted} - ${timeFormatted}`;
  };

  if (loadingEvent) {
    return (
      <div style={{ minHeight: "80vh", display: "flex", justifyContent: "center", alignItems: "center", flexDirection: "column", gap: "1rem" }}>
        <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: "2.5rem", color: brandThemeCol }}></i>
        <p style={{ color: "var(--text-muted)", fontSize: "0.95rem" }}>Cargando información del evento...</p>
      </div>
    );
  }

  if (!eventData) {
    return (
      <div style={{ minHeight: "70vh", display: "flex", justifyContent: "center", alignItems: "center", flexDirection: "column", gap: "1.2rem", padding: "2rem" }}>
        <i className="fa-solid fa-calendar-xmark" style={{ fontSize: "3.5rem", color: "#ef4444" }}></i>
        <h2 style={{ fontSize: "1.4rem", fontWeight: 800 }}>Evento no encontrado</h2>
        <p style={{ color: "var(--text-muted)", textAlign: "center", maxWidth: "420px" }}>
          El curso o evento que buscas no existe o ha sido retirado.
        </p>
        <button
          onClick={handleGoBack}
          className="btn-gold"
          style={{ padding: "0.6rem 1.5rem", borderRadius: "12px", fontSize: "0.9rem", fontWeight: 700 }}
        >
          <i className="fa-solid fa-arrow-left" style={{ marginRight: 6 }}></i> Regresar
        </button>
      </div>
    );
  }

  const waNumber = eventData.whatsappNumber || brand?.whatsappNumber || brand?.phone;
  const cleanWa = waNumber ? waNumber.replace(/[^0-9]/g, "") : null;
  const waMsg = encodeURIComponent(`¡Hola! Quisiera más información sobre el evento "${eventData.title}" en AOURUM.`);
  const waLink = cleanWa ? `https://wa.me/${cleanWa}?text=${waMsg}` : null;

  return (
    <div style={{ minHeight: "100vh", background: brandBgColor, paddingBottom: "4rem" }}>
      {/* ── BARRA DE NAVEGACIÓN COMPACTA ── */}
      <div style={{ background: "rgba(255, 255, 255, 0.85)", backdropFilter: "blur(12px)", borderBottom: "1px solid rgba(0,0,0,0.08)", sticky: true, top: 0, zIndex: 100, padding: "0.8rem 1.5rem" }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "1rem" }}>
          <button
            type="button"
            onClick={handleGoBack}
            style={{
              background: "rgba(0, 0, 0, 0.05)",
              border: "1px solid rgba(0, 0, 0, 0.1)",
              borderRadius: "20px",
              padding: "6px 14px",
              fontSize: "0.82rem",
              fontWeight: 700,
              color: "#1C1C1E",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              transition: "all 0.2s ease"
            }}
          >
            <i className="fa-solid fa-arrow-left"></i>
            <span>Volver</span>
          </button>

          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <button
              type="button"
              onClick={handleShare}
              style={{
                background: "rgba(0, 0, 0, 0.05)",
                border: "1px solid rgba(0, 0, 0, 0.1)",
                borderRadius: "20px",
                padding: "6px 14px",
                fontSize: "0.82rem",
                fontWeight: 700,
                color: "#1C1C1E",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "6px"
              }}
            >
              <i className="fa-solid fa-share-nodes"></i>
              <span>Compartir</span>
            </button>

            <button
              type="button"
              onClick={() => setQrModalOpen(true)}
              style={{
                background: "rgba(0, 0, 0, 0.05)",
                border: "1px solid rgba(0, 0, 0, 0.1)",
                borderRadius: "20px",
                padding: "6px 14px",
                fontSize: "0.82rem",
                fontWeight: 700,
                color: "#1C1C1E",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "6px"
              }}
            >
              <i className="fa-solid fa-qrcode"></i>
              <span>Código QR</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── CONTENIDO PRINCIPAL DEL EVENTO ── */}
      <div style={{ maxWidth: "1000px", margin: "2rem auto", padding: "0 1.25rem" }}>
        
        {/* TARJETA PRINCIPAL DEL EVENTO */}
        <div style={{ background: "#FFFFFF", borderRadius: "24px", overflow: "hidden", border: `1.5px solid ${brandThemeCol}`, boxShadow: "0 12px 40px rgba(0,0,0,0.08)" }}>
          
          {/* FLYER COMPLETO / BANNER DESTACADO */}
          {eventData.image && (
            <div style={{ position: "relative", width: "100%", maxHeight: "520px", background: "#0a0a0a", display: "flex", justifyContent: "center", alignItems: "center" }}>
              <img
                src={eventData.image}
                alt={eventData.title}
                style={{ width: "100%", maxHeight: "520px", objectFit: "contain", display: "block" }}
              />
              <button
                type="button"
                onClick={() => setFullImgOpen(true)}
                style={{
                  position: "absolute",
                  bottom: "16px",
                  right: "16px",
                  background: "rgba(0,0,0,0.85)",
                  color: brandThemeCol,
                  border: `1px solid ${brandThemeCol}60`,
                  padding: "6px 14px",
                  borderRadius: "20px",
                  fontSize: "0.78rem",
                  fontWeight: 800,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px"
                }}
              >
                <i className="fa-solid fa-expand"></i>
                <span>Ver Imagen Completa</span>
              </button>
            </div>
          )}

          {/* DETALLES Y DATOS CLAVE */}
          <div style={{ padding: "2rem 2.2rem" }}>
            
            {/* INSIGNIAS (TIPO + MODALIDAD) */}
            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginBottom: "1.2rem" }}>
              <span
                style={{
                  background: `${brandThemeCol}18`,
                  color: brandThemeCol,
                  border: `1px solid ${brandThemeCol}50`,
                  padding: "4px 14px",
                  borderRadius: "14px",
                  fontSize: "0.8rem",
                  fontWeight: 800,
                  textTransform: "uppercase"
                }}
              >
                {eventData.eventType || "Curso"}
              </span>

              <span
                style={{
                  background: eventData.isOnline ? "rgba(59, 130, 246, 0.12)" : "rgba(16, 185, 129, 0.12)",
                  color: eventData.isOnline ? "#2563eb" : "#059669",
                  border: `1px solid ${eventData.isOnline ? "rgba(59, 130, 246, 0.3)" : "rgba(16, 185, 129, 0.3)"}`,
                  padding: "4px 14px",
                  borderRadius: "14px",
                  fontSize: "0.8rem",
                  fontWeight: 700
                }}
              >
                <i className={`fa-solid ${eventData.isOnline ? "fa-laptop" : "fa-location-dot"}`} style={{ marginRight: "6px" }}></i>
                {eventData.isOnline ? "Modalidad Online / Virtual" : "Modalidad Presencial"}
              </span>
            </div>

            {/* TÍTULO PRINCIPAL */}
            <h1 style={{ fontSize: "2.1rem", fontWeight: 900, lineHeight: 1.25, color: "#1C1C1E", marginBottom: "1.2rem" }}>
              {eventData.title}
            </h1>

            {/* MARCA ORGANIZADORA */}
            {brand && (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "rgba(0,0,0,0.025)", border: "1px solid rgba(0,0,0,0.06)", padding: "0.9rem 1.25rem", borderRadius: "16px", marginBottom: "1.8rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <img
                    src={brand.logo || "/dummy.png"}
                    alt={brand.name}
                    style={{ width: "42px", height: "42px", borderRadius: "50%", objectFit: "cover", border: `2px solid ${brandThemeCol}` }}
                    onError={(e) => { e.target.src = "/dummy.png"; }}
                  />
                  <div>
                    <div style={{ fontSize: "0.78rem", color: "#6B7280", fontWeight: 600 }}>Organizado por</div>
                    <div style={{ fontSize: "1rem", fontWeight: 800, color: "#1C1C1E" }}>{brand.name}</div>
                  </div>
                </div>

                <Link
                  href={`/brands/${brand.slug || brand.id}`}
                  style={{
                    color: brandThemeCol,
                    fontSize: "0.85rem",
                    fontWeight: 800,
                    textDecoration: "none",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px"
                  }}
                >
                  <span>Ver Marca</span>
                  <i className="fa-solid fa-chevron-right" style={{ fontSize: "0.75rem" }}></i>
                </Link>
              </div>
            )}

            {/* CAJAS DE INFORMACIÓN (FECHA, LUGAR Y PRECIO) */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "1.2rem", marginBottom: "2rem" }}>
              
              {/* FECHA Y HORA */}
              <div style={{ background: "rgba(0,0,0,0.02)", padding: "1.2rem", borderRadius: "16px", border: "1px solid rgba(0,0,0,0.05)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", color: brandThemeCol, fontWeight: 800, fontSize: "0.82rem", marginBottom: "6px", textTransform: "uppercase" }}>
                  <i className="fa-regular fa-clock" style={{ fontSize: "1rem" }}></i>
                  <span>Fecha & Hora</span>
                </div>
                <div style={{ fontSize: "0.95rem", fontWeight: 800, color: "#1C1C1E" }}>
                  {formatEventDate(eventData.eventDate)}
                </div>
              </div>

              {/* UBICACIÓN / LINK */}
              <div style={{ background: "rgba(0,0,0,0.02)", padding: "1.2rem", borderRadius: "16px", border: "1px solid rgba(0,0,0,0.05)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", color: brandThemeCol, fontWeight: 800, fontSize: "0.82rem", marginBottom: "6px", textTransform: "uppercase" }}>
                  <i className={`fa-solid ${eventData.isOnline ? "fa-link" : "fa-map-pin"}`} style={{ fontSize: "1rem" }}></i>
                  <span>{eventData.isOnline ? "Plataforma Virtual" : "Lugar del Evento"}</span>
                </div>
                <div style={{ fontSize: "0.95rem", fontWeight: 700, color: "#1C1C1E" }}>
                  {eventData.isOnline ? (
                    eventData.onlineLink ? (
                      <a href={eventData.onlineLink} target="_blank" rel="noopener noreferrer" style={{ color: "#2563eb", textDecoration: "underline" }}>
                        Acceso Virtual Disponible
                      </a>
                    ) : "Enlace proporcionado tras inscripción"
                  ) : (
                    eventData.location || "Ubicación por confirmar"
                  )}
                </div>
              </div>

              {/* INVERSIÓN / ENTRADA */}
              <div style={{ background: "rgba(0,0,0,0.02)", padding: "1.2rem", borderRadius: "16px", border: "1px solid rgba(0,0,0,0.05)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", color: brandThemeCol, fontWeight: 800, fontSize: "0.82rem", marginBottom: "6px", textTransform: "uppercase" }}>
                  <i className="fa-solid fa-ticket" style={{ fontSize: "1rem" }}></i>
                  <span>Inversión / Costo</span>
                </div>
                <div style={{ fontSize: "1.2rem", fontWeight: 900, color: eventData.price > 0 ? brandThemeCol : "#059669" }}>
                  {eventData.price !== null && eventData.price !== undefined && eventData.price > 0 ? (
                    `S/ ${eventData.price.toLocaleString("es-PE")}`
                  ) : (
                    "¡GRATIS!"
                  )}
                </div>
              </div>
            </div>

            {/* DESCRIPCIÓN DEL EVENTO */}
            {eventData.description && (
              <div style={{ marginBottom: "2.5rem" }}>
                <h3 style={{ fontSize: "1.15rem", fontWeight: 800, color: "#1C1C1E", marginBottom: "0.8rem" }}>
                  Descripción & Detalles del Evento
                </h3>
                <div style={{ fontSize: "0.95rem", lineHeight: 1.6, color: "#374151", whitespace: "pre-wrap" }}>
                  {eventData.description}
                </div>
              </div>
            )}

            {/* BOTÓN DE ACCIÓN / CONTACTO EN INSCRIPCIÓN */}
            <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", alignItems: "center", paddingTop: "1.5rem", borderTop: "1px solid rgba(0,0,0,0.08)" }}>
              {waLink ? (
                <a
                  href={waLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    background: "#25D366",
                    color: "#FFFFFF",
                    textDecoration: "none",
                    padding: "0.9rem 2rem",
                    borderRadius: "14px",
                    fontSize: "0.98rem",
                    fontWeight: 800,
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "10px",
                    boxShadow: "0 6px 20px rgba(37, 211, 102, 0.35)",
                    transition: "transform 0.2s ease"
                  }}
                >
                  <i className="fa-brands fa-whatsapp" style={{ fontSize: "1.3rem" }}></i>
                  <span>Inscribirse o Consultar por WhatsApp</span>
                </a>
              ) : (
                <button
                  type="button"
                  onClick={handleShare}
                  style={{
                    background: brandThemeCol,
                    color: "#FFFFFF",
                    border: "none",
                    padding: "0.9rem 2rem",
                    borderRadius: "14px",
                    fontSize: "0.98rem",
                    fontWeight: 800,
                    cursor: "pointer"
                  }}
                >
                  <i className="fa-solid fa-share-nodes" style={{ marginRight: 8 }}></i>
                  Compartir Evento
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── MODAL VER IMAGEN COMPLETA ── */}
      {fullImgOpen && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.92)",
            zIndex: 2000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "1.5rem"
          }}
          onClick={() => setFullImgOpen(false)}
        >
          <button
            onClick={() => setFullImgOpen(false)}
            style={{
              position: "absolute",
              top: "20px",
              right: "20px",
              background: "rgba(255,255,255,0.2)",
              color: "#FFF",
              border: "none",
              width: "40px",
              height: "40px",
              borderRadius: "50%",
              fontSize: "1.4rem",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}
          >
            &times;
          </button>
          <img
            src={eventData.image}
            alt={eventData.title}
            style={{ maxWidth: "95vw", maxHeight: "90vh", objectFit: "contain", borderRadius: "12px" }}
          />
        </div>
      )}

      {/* ── MODAL CÓDIGO QR ── */}
      {qrModalOpen && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.75)",
            backdropFilter: "blur(6px)",
            zIndex: 1500,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "1rem"
          }}
          onClick={() => setQrModalOpen(false)}
        >
          <div
            style={{
              background: "#FFFFFF",
              borderRadius: "20px",
              padding: "2rem",
              maxWidth: "380px",
              width: "100%",
              textAlign: "center",
              boxShadow: "0 20px 50px rgba(0,0,0,0.3)"
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ fontSize: "1.2rem", fontWeight: 800, marginBottom: "0.5rem", color: "#1C1C1E" }}>
              Código QR del Evento
            </h3>
            <p style={{ fontSize: "0.82rem", color: "#6B7280", marginBottom: "1.2rem" }}>
              Escanea para abrir {eventData.title}
            </p>
            <img
              src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(typeof window !== "undefined" ? window.location.href : "")}`}
              alt="QR Evento"
              style={{ width: "200px", height: "200px", margin: "0 auto 1.2rem auto", display: "block" }}
            />
            <button
              onClick={() => setQrModalOpen(false)}
              style={{
                background: "rgba(0,0,0,0.06)",
                border: "none",
                padding: "0.6rem 1.5rem",
                borderRadius: "10px",
                fontSize: "0.85rem",
                fontWeight: 700,
                cursor: "pointer"
              }}
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
