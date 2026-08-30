"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useApp } from "../../../context/AppContext";

export default function EventDetailPage() {
  const params = useParams();
  const rawSlug = params?.slug || "";
  const router = useRouter();
  const { events = [], brands = [], loadEvents, loadBrands, triggerNotification, getBrandPalette, parseDescription } = useApp();

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

  // Extract brand design & colors
  const parsed = parseDescription ? parseDescription(brand?.description) : {};
  const palette = getBrandPalette ? getBrandPalette(parsed, brand || {}) : { c1: "#95B721", c2: "#85a711", c3: "#95B721", c4: "#85a711" };
  const primaryColor = palette.c1 || "#95B721";

  const dbDesign = (brand?.brandDesign && Object.keys(brand.brandDesign).length > 0)
    ? brand.brandDesign
    : (parsed.brandDesign || {});

  const design = {
    customBgColor: dbDesign.customBgColor || parsed.customBgColor || "#FAF9F0",
    bgStyle: dbDesign.bgStyle || parsed.bgStyle || "solid",
    bgImage: dbDesign.bgImage || parsed.bgImage || "",
    bgImageFit: dbDesign.bgImageFit || parsed.bgImageFit || "cover",
    fontFamily: dbDesign.fontFamily || parsed.fontFamily || "Inter",
    glowIntensity: (dbDesign.glowIntensity !== undefined ? dbDesign.glowIntensity : (parsed.glowIntensity !== undefined ? parsed.glowIntensity : 70)) / 100,
    ...dbDesign
  };

  // Store background luminance determination for high contrast styling
  let profileBgCss = {};
  if (design.bgStyle === "image" && design.bgImage) {
    profileBgCss = {
      backgroundImage: `url(${design.bgImage})`,
      backgroundSize: design.bgImageFit || "cover",
      backgroundPosition: "center",
      backgroundAttachment: "fixed"
    };
  } else if (design.bgStyle === "gradient") {
    profileBgCss = {
      background: `
        radial-gradient(ellipse at 70% 20%, ${palette.c1}${Math.round(40 * design.glowIntensity).toString(16).padStart(2, '0')} 0%, transparent 60%),
        radial-gradient(ellipse at 30% 88%, ${palette.c1}${Math.round(30 * design.glowIntensity).toString(16).padStart(2, '0')} 0%, transparent 50%),
        linear-gradient(180deg, ${palette.c1}12 0%, ${palette.c2}08 25%, ${palette.c3}06 55%, ${palette.c4}10 85%, ${palette.c1}15 100%)
      `
    };
  } else if (design.bgStyle === "mesh") {
    profileBgCss = {
      background: `
        radial-gradient(at 0% 0%, ${palette.c1}30 0px, transparent 50%),
        radial-gradient(at 100% 0%, ${palette.c2}30 0px, transparent 50%),
        radial-gradient(at 100% 100%, ${palette.c3}25 0px, transparent 50%),
        radial-gradient(at 0% 100%, ${palette.c4}30 0px, transparent 50%)
      `
    };
  } else if (design.bgStyle === "dots") {
    profileBgCss = {
      background: `radial-gradient(${palette.c1}35 1px, transparent 1px)`,
      backgroundSize: "20px 20px"
    };
  } else {
    let solidBg = design.customBgColor || "#FAF9F0";
    if (solidBg === "brand") solidBg = primaryColor;
    else if (solidBg === "brand-soft") solidBg = `${primaryColor}18`;
    profileBgCss = { background: solidBg };
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
        triggerNotification(true, "✨ Enlace del evento copiado al portapapeles");
      } else {
        triggerNotification(true, "URL: " + shareUrl);
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
        <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: "2.5rem", color: primaryColor }}></i>
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
    <div style={{ minHeight: "100vh", width: "100%", position: "relative", fontFamily: design.fontFamily !== "Inter" ? `"${design.fontFamily}", sans-serif` : "inherit", ...profileBgCss, paddingBottom: "6rem" }}>
      {/* Import de la fuente de Google seleccionada si no es Inter */}
      {design.fontFamily && design.fontFamily !== "Inter" && (
        <link rel="stylesheet" href={`https://fonts.googleapis.com/css2?family=${design.fontFamily.replace(/ /g, "+")}:wght@400;600;700;800&display=swap`} />
      )}

      <style>{`
        html, body, .main-workspace {
          background: ${design.customBgColor || "#FAF9F0"} !important;
        }
        header {
          background: ${design.customBgColor || "#FAF9F0"} !important;
          border-bottom: 1px solid ${primaryColor}20 !important;
        }
        footer, .site-footer {
          background: ${design.customBgColor || "#FAF9F0"} !important;
          border-top: 1px solid ${primaryColor}30 !important;
          margin-top: 0 !important;
          padding-top: 3.5rem !important;
          color: #4B5563 !important;
        }
      `}</style>

      {/* ── BARRA DE NAVEGACIÓN FLOTANTE ── */}
      <div style={{ padding: "0.85rem 1.5rem", position: "sticky", top: 0, zIndex: 100, backdropFilter: "blur(14px)", WebkitBackdropFilter: "blur(14px)", background: design.customBgColor ? `${design.customBgColor}ee` : "rgba(250, 249, 240, 0.95)", borderBottom: `1px solid ${primaryColor}20` }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "1rem" }}>
          <button
            type="button"
            onClick={handleGoBack}
            style={{
              background: "var(--bg-card)",
              border: `1.5px solid ${primaryColor}60`,
              borderRadius: "20px",
              padding: "6px 16px",
              fontSize: "0.82rem",
              fontWeight: 700,
              color: primaryColor,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              boxShadow: "0 2px 10px rgba(0,0,0,0.04)",
              transition: "transform 0.2s ease"
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
                background: "var(--bg-card)",
                border: `1.5px solid ${primaryColor}50`,
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
              <i className="fa-solid fa-share-nodes" style={{ color: primaryColor }}></i>
              <span>Compartir</span>
            </button>

            <button
              type="button"
              onClick={() => setQrModalOpen(true)}
              style={{
                background: "var(--bg-card)",
                border: `1.5px solid ${primaryColor}50`,
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
              <i className="fa-solid fa-qrcode" style={{ color: primaryColor }}></i>
              <span>Código QR</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── ESTRUCTURA ABIERTA DE LA PÁGINA (SIN CUADRO CONTENEDOR CERRADO) ── */}
      <div style={{ maxWidth: "1200px", margin: "2rem auto", padding: "0 1.5rem", display: "flex", flexDirection: "column", gap: "2.2rem" }}>
        
        {/* 1. AFICHE / FLYER PRINCIPAL (DIRECTAMENTE SOBRE EL FONDO) */}
        {eventData.image && (
          <div style={{ position: "relative", width: "100%", maxHeight: "580px", background: "#000", borderRadius: "24px", overflow: "hidden", boxShadow: "0 16px 45px rgba(0,0,0,0.18)", display: "flex", justifyContent: "center", alignItems: "center" }}>
            <img
              src={eventData.image}
              alt={eventData.title}
              style={{ width: "100%", maxHeight: "580px", objectFit: "contain", display: "block" }}
            />
            <button
              type="button"
              onClick={() => setFullImgOpen(true)}
              style={{
                position: "absolute",
                bottom: "16px",
                right: "16px",
                background: "rgba(0,0,0,0.85)",
                color: primaryColor,
                border: `1.5px solid ${primaryColor}80`,
                padding: "6px 16px",
                borderRadius: "20px",
                fontSize: "0.78rem",
                fontWeight: 800,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "6px",
                backdropFilter: "blur(6px)"
              }}
            >
              <i className="fa-solid fa-expand"></i>
              <span>Ver Imagen Completa</span>
            </button>
          </div>
        )}

        {/* 2. CABECERA: INSIGNIAS Y TÍTULO DEL EVENTO (ABIERTOS DIRECTAMENTE SOBRE LA PÁGINA) */}
        <div>
          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginBottom: "1rem" }}>
            <span
              style={{
                background: `${primaryColor}20`,
                color: primaryColor,
                border: `1.5px solid ${primaryColor}`,
                padding: "4px 14px",
                borderRadius: "14px",
                fontSize: "0.82rem",
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
                border: `1.5px solid ${eventData.isOnline ? "rgba(59, 130, 246, 0.4)" : "rgba(16, 185, 129, 0.4)"}`,
                padding: "4px 14px",
                borderRadius: "14px",
                fontSize: "0.82rem",
                fontWeight: 700
              }}
            >
              <i className={`fa-solid ${eventData.isOnline ? "fa-laptop" : "fa-location-dot"}`} style={{ marginRight: "6px" }}></i>
              {eventData.isOnline ? "Modalidad Online / Virtual" : "Modalidad Presencial"}
            </span>
          </div>

          <h1 style={{ fontSize: "2.5rem", fontWeight: 900, lineHeight: 1.2, color: "#1C1C1E", margin: "0 0 1.2rem 0" }}>
            {eventData.title}
          </h1>

          {/* 3. MARCA ORGANIZADORA (FILA ABIERTA CON BORDES SUTILES) */}
          {brand && (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderTop: `1px solid ${primaryColor}30`, borderBottom: `1px solid ${primaryColor}30`, padding: "1rem 0", flexWrap: "wrap", gap: "1rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                <img
                  src={brand.logo || "/dummy.png"}
                  alt={brand.name}
                  style={{ width: "46px", height: "46px", borderRadius: "50%", objectFit: "cover", border: `2px solid ${primaryColor}` }}
                  onError={(e) => { e.target.src = "/dummy.png"; }}
                />
                <div>
                  <div style={{ fontSize: "0.76rem", color: "#6B7280", fontWeight: 600, textTransform: "uppercase" }}>Organizado por</div>
                  <div style={{ fontSize: "1.15rem", fontWeight: 900, color: "#1C1C1E" }}>{brand.name}</div>
                </div>
              </div>

              <Link
                href={`/brands/${brand.slug || brand.id}`}
                style={{
                  background: `linear-gradient(135deg, ${palette.c1}, ${palette.c2})`,
                  color: "#FFFFFF",
                  padding: "0.55rem 1.4rem",
                  borderRadius: "20px",
                  fontSize: "0.85rem",
                  fontWeight: 800,
                  textDecoration: "none",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  boxShadow: `0 4px 14px ${primaryColor}35`
                }}
              >
                <span>Ver Perfil de Marca</span>
                <i className="fa-solid fa-arrow-right"></i>
              </Link>
            </div>
          )}
        </div>

        {/* 4. BLOQUES CLAVE: FECHA, LUGAR E INVERSIÓN (TARJETAS INDIVIDUALES ABIERTAS) */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1.5rem" }}>
          
          {/* FECHA Y HORA */}
          <div style={{ background: design.customBgColor || `${primaryColor}18`, border: `1.5px solid ${primaryColor}45`, padding: "1.4rem 1.6rem", borderRadius: "20px", boxShadow: `0 4px 16px ${primaryColor}15` }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", color: primaryColor, fontWeight: 800, fontSize: "0.82rem", marginBottom: "8px", textTransform: "uppercase" }}>
              <i className="fa-regular fa-clock" style={{ fontSize: "1.1rem" }}></i>
              <span>Fecha & Hora</span>
            </div>
            <div style={{ fontSize: "1.05rem", fontWeight: 800, color: "#1C1C1E" }}>
              {formatEventDate(eventData.eventDate)}
            </div>
          </div>

          {/* UBICACIÓN / LINK */}
          <div style={{ background: design.customBgColor || `${primaryColor}18`, border: `1.5px solid ${primaryColor}45`, padding: "1.4rem 1.6rem", borderRadius: "20px", boxShadow: `0 4px 16px ${primaryColor}15` }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", color: primaryColor, fontWeight: 800, fontSize: "0.82rem", marginBottom: "8px", textTransform: "uppercase" }}>
              <i className={`fa-solid ${eventData.isOnline ? "fa-link" : "fa-map-pin"}`} style={{ fontSize: "1.1rem" }}></i>
              <span>{eventData.isOnline ? "Plataforma Virtual" : "Lugar del Evento"}</span>
            </div>
            <div style={{ fontSize: "1.05rem", fontWeight: 700, color: "#1C1C1E" }}>
              {eventData.isOnline ? (
                eventData.onlineLink ? (
                  <a href={eventData.onlineLink} target="_blank" rel="noopener noreferrer" style={{ color: "#2563eb", textDecoration: "underline" }}>
                    Enlace de acceso disponible
                  </a>
                ) : "Se enviará el enlace al confirmar inscripción"
              ) : (
                eventData.location || "Ubicación por confirmar"
              )}
            </div>
          </div>

          {/* INVERSIÓN / ENTRADA */}
          <div style={{ background: design.customBgColor || `${primaryColor}18`, border: `1.5px solid ${primaryColor}45`, padding: "1.4rem 1.6rem", borderRadius: "20px", boxShadow: `0 4px 16px ${primaryColor}15` }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", color: primaryColor, fontWeight: 800, fontSize: "0.82rem", marginBottom: "8px", textTransform: "uppercase" }}>
              <i className="fa-solid fa-ticket" style={{ fontSize: "1.1rem" }}></i>
              <span>Inversión / Entrada</span>
            </div>
            <div style={{ fontSize: "1.3rem", fontWeight: 900, color: eventData.price > 0 ? primaryColor : "#059669" }}>
              {eventData.price !== null && eventData.price !== undefined && eventData.price > 0 ? (
                `S/ ${eventData.price.toLocaleString("es-PE")}`
              ) : (
                "¡GRATIS!"
              )}
            </div>
          </div>
        </div>

        {/* 5. DESCRIPCIÓN DEL EVENTO (CON EL COLOR DE LA MARCA) */}
        {eventData.description && (
          <div style={{ background: design.customBgColor || `${primaryColor}18`, border: `1.5px solid ${primaryColor}45`, padding: "2rem", borderRadius: "20px", boxShadow: `0 4px 16px ${primaryColor}15` }}>
            <h3 style={{ fontSize: "1.25rem", fontWeight: 800, color: "#1C1C1E", marginBottom: "1rem" }}>
              Descripción & Detalles del Evento
            </h3>
            <div style={{ fontSize: "1rem", lineHeight: 1.7, color: "#374151", whiteSpace: "pre-wrap" }}>
              {eventData.description}
            </div>
          </div>
        )}

        {/* 6. BOTÓN DE REGISTRO / CONTACTO POR WHATSAPP */}
        <div style={{ display: "flex", justifyContent: "center", paddingTop: "1.5rem" }}>
          {waLink ? (
            <a
              href={waLink}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                background: "#25D366",
                color: "#FFFFFF",
                textDecoration: "none",
                padding: "1.1rem 2.8rem",
                borderRadius: "30px",
                fontSize: "1.08rem",
                fontWeight: 900,
                display: "inline-flex",
                alignItems: "center",
                gap: "12px",
                boxShadow: "0 8px 25px rgba(37, 211, 102, 0.4)",
                transition: "transform 0.2s ease"
              }}
            >
              <i className="fa-brands fa-whatsapp" style={{ fontSize: "1.5rem" }}></i>
              <span>Inscribirse o Consultar por WhatsApp</span>
            </a>
          ) : (
            <button
              type="button"
              onClick={handleShare}
              style={{
                background: `linear-gradient(135deg, ${palette.c1}, ${palette.c2})`,
                color: "#FFFFFF",
                border: "none",
                padding: "1.1rem 2.8rem",
                borderRadius: "30px",
                fontSize: "1.08rem",
                fontWeight: 900,
                cursor: "pointer",
                boxShadow: `0 8px 25px ${primaryColor}40`
              }}
            >
              <i className="fa-solid fa-share-nodes" style={{ marginRight: 8 }}></i>
              <span>Compartir Evento</span>
            </button>
          )}
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
