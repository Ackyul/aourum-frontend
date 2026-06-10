"use client";

import { use, useEffect, useRef, useState } from "react";
import { useApp } from "../../../context/AppContext";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function FairProfilePage({ params }) {
  const unwrappedParams = use(params);
  const slug = unwrappedParams.slug;

  const {
    fairs,
    brands,
    bands,
    organizers,
    people,
    getOrganizerName,
    getBrandName,
    loading,
    activePersonId,
    uploadImage,
    fetchData,
    triggerNotification
  } = useApp();

  const router = useRouter();
  const profileMapContainerRef = useRef(null);
  const profileLeafletMapRef = useRef(null);

  // Edit states
  const [editFairOpen, setEditFairOpen] = useState(false);
  const [editFairName, setEditFairName] = useState("");
  const [editFairLocation, setEditFairLocation] = useState("");
  const [editFairDate, setEditFairDate] = useState("");
  const [editFairTime, setEditFairTime] = useState("");
  const [editFairDescription, setEditFairDescription] = useState("");
  const [editFairBanner, setEditFairBanner] = useState("");
  const [editFairBannerPreview, setEditFairBannerPreview] = useState("");
  const [editFairLat, setEditFairLat] = useState(-16.39889);
  const [editFairLng, setEditFairLng] = useState(-71.53694);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Edit Map Refs
  const editMapContainerRef = useRef(null);
  const editLeafletMapRef = useRef(null);
  const editMarkerRef = useRef(null);

  const isNumeric = /^\d+$/.test(slug);
  const fair = fairs.find((f) => {
    if (isNumeric) {
      return f.id === Number(slug) || f.slug === slug;
    }
    return f.slug === slug;
  });

  // Initialize Profile Leaflet Map
  useEffect(() => {
    if (!fair || !profileMapContainerRef.current) return;
    if (profileLeafletMapRef.current) return;

    const initMap = () => {
      if (!profileMapContainerRef.current || typeof window === "undefined" || !window.L) return;

      const L = window.L;
      delete L.Icon.Default.prototype._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      const flat = fair.lat || -16.39889;
      const flng = fair.lng || -71.53694;

      const pMap = L.map(profileMapContainerRef.current, { zoomControl: false }).setView([flat, flng], 16);
      profileLeafletMapRef.current = pMap;

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; OpenStreetMap',
        maxZoom: 19,
      }).addTo(pMap);

      L.marker([flat, flng]).addTo(pMap)
        .bindPopup(`<b>${fair.name}</b><br/>${fair.location}`).openPopup();

      L.control.zoom({ position: "bottomright" }).addTo(pMap);
    };

    const timer = setTimeout(initMap, 300);
    return () => {
      clearTimeout(timer);
      if (profileLeafletMapRef.current) {
        profileLeafletMapRef.current.remove();
        profileLeafletMapRef.current = null;
      }
    };
  }, [fair]);

  // Initialize Edit Leaflet Map when editing is opened
  useEffect(() => {
    if (!editFairOpen || !editMapContainerRef.current) return;
    if (editLeafletMapRef.current) return;

    const initEditMap = () => {
      if (!editMapContainerRef.current || typeof window === "undefined" || !window.L) return;

      const L = window.L;
      delete L.Icon.Default.prototype._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      const eMap = L.map(editMapContainerRef.current, { zoomControl: false }).setView([editFairLat, editFairLng], 14);
      editLeafletMapRef.current = eMap;

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; OpenStreetMap',
        maxZoom: 19,
      }).addTo(eMap);

      const marker = L.marker([editFairLat, editFairLng], { draggable: true }).addTo(eMap);
      editMarkerRef.current = marker;

      marker.on("dragend", () => {
        const position = marker.getLatLng();
        setEditFairLat(position.lat);
        setEditFairLng(position.lng);
      });

      eMap.on("click", (e) => {
        const { lat, lng } = e.latlng;
        marker.setLatLng([lat, lng]);
        setEditFairLat(lat);
        setEditFairLng(lng);
      });

      L.control.zoom({ position: "bottomright" }).addTo(eMap);
    };

    const timer = setTimeout(initEditMap, 300);
    return () => {
      clearTimeout(timer);
      if (editLeafletMapRef.current) {
        editLeafletMapRef.current.remove();
        editLeafletMapRef.current = null;
        editMarkerRef.current = null;
      }
    };
  }, [editFairOpen]);

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "6rem 0" }}>
        <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: "2.5rem", color: "var(--gold-primary)" }}></i>
        <p style={{ color: "var(--text-muted)", marginTop: "10px" }}>Cargando detalles de la feria...</p>
      </div>
    );
  }

  if (!fair) {
    return (
      <div className="container" style={{ textAlign: "center", padding: "4rem 0" }}>
        <h3>Feria no encontrada</h3>
        <button onClick={() => router.push("/fairs")} className="btn-gold" style={{ marginTop: "1rem" }}>Volver a Ferias</button>
      </div>
    );
  }

  // Check if the logged-in persona is an owner/organizer of this fair
  const currentPerson = people.find((p) => p.id === Number(activePersonId));
  const organizer = organizers.find((o) => o.id === fair.organizerId);
  
  const userCollaborator = organizer && organizer.collaborators ? organizer.collaborators.find(c => c.personId === Number(activePersonId)) : null;
  const userRole = userCollaborator ? userCollaborator.role : null;
  const isCollaborator = !!userRole;
  const canEditFair = userRole === 'creador_original' || userRole === 'creador' || userRole === 'gestor';
  
  const isOwner = isCollaborator;

  const copyLink = (e) => {
    e.stopPropagation();
    if (typeof window === "undefined") return;
    const fullUrl = window.location.href;
    navigator.clipboard.writeText(fullUrl);
    alert("¡Enlace del evento copiado al portapapeles! Listo para compartir.");
  };

  const handleEditClick = () => {
    setEditFairName(fair.name);
    setEditFairLocation(fair.location || "");
    setEditFairDate(fair.date || "");
    setEditFairTime(fair.time || "");
    setEditFairDescription(fair.description || "");
    setEditFairBanner(fair.banner || "");
    setEditFairBannerPreview(fair.banner || "");
    setEditFairLat(fair.lat || -16.39889);
    setEditFairLng(fair.lng || -71.53694);
    setEditFairOpen(true);
  };

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

  const handleEditFairSubmit = async (e) => {
    e.preventDefault();
    if (!editFairName || !editFairLocation || !editFairDate) {
      triggerNotification(false, "Completa los campos obligatorios del evento");
      return;
    }
    setIsSaving(true);
    const payload = {
      name: editFairName,
      location: editFairLocation,
      date: editFairDate,
      time: editFairTime,
      banner: editFairBanner,
      description: editFairDescription,
      lat: editFairLat,
      lng: editFairLng,
      organizerId: fair.organizerId
    };

    try {
      const response = await fetch(`${API_URL}/api/fairs/${fair.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        triggerNotification(true, "🎪 ¡Feria actualizada correctamente!");
        setEditFairOpen(false);
        fetchData();
      } else {
        triggerNotification(false, "No se pudo actualizar la feria.");
      }
    } catch (err) {
      triggerNotification(false, "Error de red al intentar conectar.");
    } finally {
      setIsSaving(false);
    }
  };

  const respondToApplication = async (type, entityId, accept) => {
    try {
      const response = await fetch(`${API_URL}/api/fairs/${fair.id}/respond`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, entityId: Number(entityId), accept })
      });
      if (response.ok) {
        triggerNotification(true, accept ? "✨ ¡Postulación aprobada!" : "Postulación rechazada.");
        fetchData();
      } else {
        triggerNotification(false, "No se pudo procesar la postulación.");
      }
    } catch (err) {
      triggerNotification(false, "Error de red al procesar postulación.");
    }
  };

  return (
    <div className="container" style={{ maxWidth: "1000px", padding: "0 1rem" }}>
      <div className="glass-panel" style={{ position: "relative", overflow: "hidden", borderRadius: "16px" }}>
        <button onClick={() => router.push("/fairs")} className="profile-close-btn" style={{ position: "absolute", top: "15px", right: "15px", zIndex: 10 }}>&times;</button>
        <button onClick={copyLink} className="profile-share-btn" style={{ position: "absolute", top: "15px", right: "60px", zIndex: 10 }} title="Copiar enlace del evento">
          <i className="fa-solid fa-share-nodes"></i>
        </button>
        
        <div className="profile-header-banner" style={{ height: "260px" }}>
          <img src={fair.banner} alt={fair.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        </div>

        <div className="profile-body">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem" }}>
            <div>
              <div style={{ display: "flex", gap: "10px", alignItems: "center", fontSize: "0.85rem", color: "var(--gold-dark)", textTransform: "uppercase", fontWeight: 700, marginBottom: "0.5rem" }}>
                <span><i className="fa-solid fa-calendar-days"></i> {fair.date}</span>
                <span>•</span>
                <span><i className="fa-solid fa-clock"></i> {fair.time}</span>
              </div>
              <h2 style={{ fontSize: "1.8rem", fontWeight: 800, marginBottom: "0.6rem", letterSpacing: "-0.015em" }}>{fair.name}</h2>
              
              <div style={{ fontSize: "0.88rem", color: "var(--text-muted)", marginBottom: "1.2rem" }}>
                Organizado por: <strong style={{ color: "var(--gold-dark)" }}>{organizer ? organizer.name : getOrganizerName(fair.organizerId)}</strong>
                {organizer && organizer.collaborators && organizer.collaborators.length > 1 && (
                  <div style={{ marginTop: "0.5rem", paddingLeft: "1rem", borderLeft: "2px solid var(--gold-primary)" }}>
                    <span style={{ fontSize: "0.75rem", textTransform: "uppercase", color: "var(--text-gold)", fontWeight: 700 }}>Equipo Organizador:</span>
                    <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", marginTop: "4px" }}>
                      {organizer.collaborators.map(c => {
                        const p = people.find(person => person.id === c.personId);
                        if (!p) return null;
                        return (
                          <Link href={`/people/${p.username || p.id}`} key={p.id} style={{ display: "inline-flex", alignItems: "center", gap: "6px", textDecoration: "none", color: "var(--text-primary)", fontSize: "0.8rem" }}>
                            <img src={p.logo} alt={p.name} style={{ width: "20px", height: "20px", borderRadius: "50%", objectFit: "cover" }} />
                            <span>{p.name} <span style={{ color: "var(--text-muted)", fontSize: "0.72rem", textTransform: "uppercase", fontWeight: "bold" }}>({c.role})</span></span>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {canEditFair && (
              <button
                onClick={handleEditClick}
                className="btn-outline-gold"
                style={{ padding: "0.5rem 1rem", borderRadius: "8px", fontSize: "0.85rem", fontWeight: 700, display: "flex", alignItems: "center", gap: "6px" }}
              >
                <i className="fa-solid fa-gear"></i> Editar Feria
              </button>
            )}
          </div>

          <p style={{ fontSize: "0.95rem", color: "var(--text-primary)", lineHeight: 1.65, marginBottom: "1.5rem" }}>{fair.description}</p>

          <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.95rem", fontWeight: 600, color: "var(--text-primary)", marginBottom: "1.5rem" }}>
            <i className="fa-solid fa-location-dot" style={{ color: "var(--gold-primary)" }}></i>
            <span>{fair.location}</span>
          </div>

          {/* Formulario de edición inline */}
          {canEditFair && editFairOpen && (
            <div className="glass-panel fade-in" style={{ padding: "1.8rem", marginTop: "1.5rem", marginBottom: "1.5rem", border: "1.5px solid var(--gold-primary)" }}>
              <h3 style={{ fontSize: "1.15rem", fontWeight: 800, marginBottom: "1.2rem", color: "var(--text-gold)" }}>
                🎪 Editar Información del Evento
              </h3>
              <form onSubmit={handleEditFairSubmit}>
                <div className="grid-2-to-1">
                  <div className="form-group">
                    <label>Nombre del Evento *</label>
                    <input type="text" className="form-control" value={editFairName} onChange={(e) => setEditFairName(e.target.value)} required />
                  </div>
                  <div className="form-group">
                    <label>Dirección del Evento *</label>
                    <input type="text" className="form-control" value={editFairLocation} onChange={(e) => setEditFairLocation(e.target.value)} required />
                  </div>
                </div>

                <div className="grid-2-to-1">
                  <div className="form-group">
                    <label>Fecha *</label>
                    <input type="text" className="form-control" placeholder="Ej: Sábado 15 de Octubre" value={editFairDate} onChange={(e) => setEditFairDate(e.target.value)} required />
                  </div>
                  <div className="form-group">
                    <label>Horario</label>
                    <input type="text" className="form-control" placeholder="Ej: 10:00 - 20:00" value={editFairTime} onChange={(e) => setEditFairTime(e.target.value)} />
                  </div>
                </div>

                <div className="form-group">
                  <label>Descripción del Evento</label>
                  <textarea className="form-control" rows="3" style={{ resize: "none" }} value={editFairDescription} onChange={(e) => setEditFairDescription(e.target.value)} placeholder="Escribe los detalles de la feria, atracciones, etc."></textarea>
                </div>

                {/* Banner Upload */}
                <div className="form-group">
                  <label>Imagen del Banner del Evento</label>
                  <label
                    htmlFor="edit-fair-banner-upload"
                    style={{
                      display: "flex", alignItems: "center", gap: "12px",
                      border: "2px dashed var(--border-color)", borderRadius: "8px",
                      padding: "0.8rem", cursor: "pointer", transition: "var(--transition-smooth)",
                      background: "var(--bg-input)"
                    }}
                  >
                    {editFairBannerPreview ? (
                      <img src={editFairBannerPreview} alt="preview" style={{ width: "80px", height: "48px", objectFit: "cover", borderRadius: "6px", border: "1.5px solid var(--border-color)" }} />
                    ) : (
                      <div style={{ width: "80px", height: "48px", background: "rgba(212,175,55,0.1)", borderRadius: "6px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <i className="fa-solid fa-camera" style={{ color: "var(--gold-primary)", fontSize: "1.1rem" }}></i>
                      </div>
                    )}
                    <div>
                      <span style={{ fontSize: "0.82rem", fontWeight: 700, display: "block" }}>
                        {uploadingBanner ? "Subiendo..." : editFairBannerPreview ? "Banner cargado ✓" : "Haz clic para cambiar banner"}
                      </span>
                      <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>Recomendado: Horizontal (800x260)</span>
                    </div>
                  </label>
                  <input
                    id="edit-fair-banner-upload"
                    type="file"
                    accept="image/*"
                    style={{ display: "none" }}
                    disabled={uploadingBanner}
                    onChange={async (e) => {
                      const file = e.target.files[0];
                      if (!file) return;
                      setEditFairBannerPreview(URL.createObjectURL(file));
                      const url = await uploadImage(file, setUploadingBanner);
                      if (url) setEditFairBanner(url);
                    }}
                  />
                </div>

                {/* Edit Coordinates Leaflet Map */}
                <div style={{ marginBottom: "1.5rem" }}>
                  <label style={{ fontWeight: 700, fontSize: "0.85rem", color: "var(--text-primary)", display: "block", marginBottom: "0.5rem" }}>
                    📍 Ajustar ubicación en el mapa (Arrastra el marcador o haz clic)
                  </label>
                  <div ref={editMapContainerRef} style={{ height: "200px", width: "100%", borderRadius: "8px", border: "1px solid var(--border-color)", zIndex: 1 }}></div>
                  <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "4px", display: "block" }}>
                    Coordenadas actuales: Lat: {editFairLat.toFixed(5)}, Lng: {editFairLng.toFixed(5)}
                  </span>
                </div>

                <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
                  <button type="button" onClick={() => setEditFairOpen(false)} className="btn-outline-gold" style={{ padding: "0.45rem 1.2rem", borderRadius: "6px", fontSize: "0.85rem" }}>
                    Cancelar
                  </button>
                  <button type="submit" className="btn-gold" style={{ padding: "0.45rem 1.2rem", borderRadius: "6px", fontSize: "0.85rem" }} disabled={uploadingBanner || isSaving}>
                    {isSaving ? "Guardando..." : "Guardar Cambios"}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Ubicación del mapa principal */}
          <div style={{ marginBottom: "2.2rem" }}>
            <h3 style={{ fontSize: "1.05rem", fontWeight: 800, marginBottom: "0.8rem", color: "var(--text-gold)" }}><i className="fa-solid fa-map"></i> Ubicación del Evento</h3>
            <div ref={profileMapContainerRef} style={{ height: "240px", width: "100%", borderRadius: "10px", border: "1px solid var(--border-color)", zIndex: 1, boxShadow: "0 4px 16px rgba(0,0,0,0.03)" }}></div>
          </div>

          {/* Sección de Postulaciones Pendientes para Organizador */}
          {isOwner && (
            <div className="glass-panel" style={{ padding: "1.8rem", marginTop: "1.5rem", marginBottom: "2.2rem" }}>
              <h3 style={{ fontSize: "1.15rem", fontWeight: 800, marginBottom: "1.2rem", color: "var(--text-gold)", display: "flex", alignItems: "center", gap: 8 }}>
                <i className="fa-solid fa-envelope-open-text"></i> Postulaciones Recibidas (Pendientes)
              </h3>
              
              <div className="postulaciones-grid">
                {/* Marcas Pendientes */}
                <div>
                  <h4 style={{ fontSize: "0.95rem", fontWeight: 700, marginBottom: "0.8rem", borderBottom: "1px dashed var(--border-color)", paddingBottom: "4px" }}>
                    🏪 Marcas ({fair.pendingBrands ? fair.pendingBrands.length : 0})
                  </h4>
                  {!fair.pendingBrands || fair.pendingBrands.length === 0 ? (
                    <p style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>No hay marcas pendientes.</p>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                      {fair.pendingBrands.map((bId) => {
                        const b = brands.find(brand => brand.id === bId);
                        if (!b) return null;
                        return (
                          <div key={bId} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "var(--bg-input)", padding: "0.6rem", borderRadius: "8px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                              <img src={b.logo} alt={b.name} style={{ width: "28px", height: "28px", borderRadius: "50%", objectFit: "cover" }} />
                              <Link href={`/brands/${b.slug || b.id}`} style={{ fontSize: "0.85rem", fontWeight: 700, textDecoration: "underline", color: "var(--text-primary)" }}>{b.name}</Link>
                            </div>
                            <div style={{ display: "flex", gap: 6 }}>
                              <button onClick={() => respondToApplication("brand", b.id, true)} className="btn-gold" style={{ padding: "2px 8px", fontSize: "0.75rem", borderRadius: "4px" }} title="Aceptar"><i className="fa-solid fa-check"></i></button>
                              <button onClick={() => respondToApplication("brand", b.id, false)} className="btn-outline-gold" style={{ padding: "2px 8px", fontSize: "0.75rem", borderRadius: "4px", color: "#ef4444", borderColor: "#ef4444" }} title="Rechazar"><i className="fa-solid fa-xmark"></i></button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Bandas Pendientes */}
                <div>
                  <h4 style={{ fontSize: "0.95rem", fontWeight: 700, marginBottom: "0.8rem", borderBottom: "1px dashed var(--border-color)", paddingBottom: "4px" }}>
                    🎸 Bandas ({fair.pendingBands ? fair.pendingBands.length : 0})
                  </h4>
                  {!fair.pendingBands || fair.pendingBands.length === 0 ? (
                    <p style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>No hay bandas pendientes.</p>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                      {fair.pendingBands.map((bId) => {
                        const b = bands.find(band => band.id === bId);
                        if (!b) return null;
                        return (
                          <div key={bId} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "var(--bg-input)", padding: "0.6rem", borderRadius: "8px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                              <img src={b.image} alt={b.name} style={{ width: "28px", height: "28px", borderRadius: "50%", objectFit: "cover" }} />
                              <Link href={`/bands/${b.slug || b.id}`} style={{ fontSize: "0.85rem", fontWeight: 700, textDecoration: "underline", color: "var(--text-primary)" }}>{b.name}</Link>
                            </div>
                            <div style={{ display: "flex", gap: 6 }}>
                              <button onClick={() => respondToApplication("band", b.id, true)} className="btn-gold" style={{ padding: "2px 8px", fontSize: "0.75rem", borderRadius: "4px" }} title="Aceptar"><i className="fa-solid fa-check"></i></button>
                              <button onClick={() => respondToApplication("band", b.id, false)} className="btn-outline-gold" style={{ padding: "2px 8px", fontSize: "0.75rem", borderRadius: "4px", color: "#ef4444", borderColor: "#ef4444" }} title="Rechazar"><i className="fa-solid fa-xmark"></i></button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="fair-participants-grid">
            
            {/* MARCAS PARTICIPANTES */}
            <div>
              <h3 style={{ fontSize: "1.1rem", fontWeight: 800, marginBottom: "1rem", color: "var(--text-primary)" }}><i className="fa-solid fa-store" style={{ color: "var(--gold-primary)", marginRight: 6 }}></i>Marcas Participantes</h3>
              {fair.acceptedBrands && fair.acceptedBrands.length > 0 ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.8rem" }}>
                  {fair.acceptedBrands.map((bId) => {
                    const b = brands.find((br) => br.id === bId);
                    if (!b) return null;
                    return (
                      <div 
                        key={bId} 
                        onClick={() => router.push(`/brands/${b.slug || b.id}`)}
                        style={{ display: "flex", alignItems: "center", gap: "12px", padding: "0.7rem", background: "var(--bg-input)", borderRadius: "8px", cursor: "pointer" }}
                        className="glass-panel"
                      >
                        <img src={b.logo} alt={b.name} style={{ width: "38px", height: "38px", borderRadius: "50%", objectFit: "cover", border: "1px solid var(--border-color)" }} />
                        <div>
                          <strong style={{ fontSize: "0.88rem", color: "var(--text-primary)" }}>{b.name}</strong>
                          <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", display: "block" }}>{b.category}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>Aún no hay marcas confirmadas para este evento.</p>
              )}
            </div>

            {/* BANDAS DE MÚSICA */}
            <div>
              <h3 style={{ fontSize: "1.1rem", fontWeight: 800, marginBottom: "1rem", color: "var(--text-primary)" }}><i className="fa-solid fa-music" style={{ color: "var(--gold-primary)", marginRight: 6 }}></i>Lineup de Música</h3>
              {fair.acceptedBands && fair.acceptedBands.length > 0 ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.8rem" }}>
                  {fair.acceptedBands.map((bId) => {
                    const b = bands.find((br) => br.id === bId);
                    if (!b) return null;
                    return (
                      <div 
                        key={bId} 
                        onClick={() => router.push(`/bands/${b.slug || b.id}`)}
                        style={{ display: "flex", alignItems: "center", gap: "12px", padding: "0.7rem", background: "var(--bg-input)", borderRadius: "8px", cursor: "pointer" }}
                        className="glass-panel"
                      >
                        <img src={b.image} alt={b.name} style={{ width: "38px", height: "38px", borderRadius: "50%", objectFit: "cover", border: "1px solid var(--border-color)" }} />
                        <div>
                          <strong style={{ fontSize: "0.88rem", color: "var(--text-primary)" }}>{b.name}</strong>
                          <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", display: "block" }}>{b.genre}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>Aún no hay shows musicales confirmados.</p>
              )}
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
