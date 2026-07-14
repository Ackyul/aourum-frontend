"use client";

import { use, useState, useEffect, useRef } from "react";
import { useApp } from "../../../context/AppContext";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function OrganizerProfilePage({ params }) {
  const unwrappedParams = use(params);
  const slug = unwrappedParams.slug;

  const {
    organizers,
    people,
    fairs,
    activePersonId,
    loading,
    uploadImage,
    fetchData,
    triggerNotification,
    parseDescription,
    handleDeleteOrganizer,
    loadFairs,
    loadPeople
  } = useApp();

  useEffect(() => {
    loadFairs();
    loadPeople();
  }, [loadFairs, loadPeople]);

  const {
    // Fair creation inputs
    fairName, setFairName,
    fairLocation, setFairLocation,
    fairDate, setFairDate,
    fairTime, setFairTime,
    fairDescription, setFairDescription,
    fairBanner, setFairBanner,
    fairBannerPreview, setFairBannerPreview,
    fairLat, setFairLat,
    fairLng, setFairLng,
    uploadingFair, setUploadingFair,
    handleFairSubmit,
    // Edit profile modal context helpers
    setEditName,
    setEditOwner,
    setEditCategory,
    setEditDescription,
    setEditLogo,
    setEditLogoPreview,
    setEditProfileType,
    setEditProfileId,
    setEditSlug,
    setEditInstagram,
    setEditFacebook,
    setEditTiktok,
    setEditWebsite,
    setEditBanner,
    setEditBannerPreview,
    setEditThemeColor,
    setEditTagline,
    setEditInterests,
    setEditProfileOpen
  } = useApp();

  const router = useRouter();
  const [showFairModal, setShowFairModal] = useState(false);
  const [isCreatingFair, setIsCreatingFair] = useState(false);
  const [localStartDate, setLocalStartDate] = useState("");
  const [localEndDate, setLocalEndDate] = useState("");

  // Sincroniza la fecha del contexto con el rango local
  useEffect(() => {
    const combined = localEndDate ? `${localStartDate} al ${localEndDate}` : localStartDate;
    setFairDate(combined);
  }, [localStartDate, localEndDate, setFairDate]);

  // Lock background scroll when modal is open
  useEffect(() => {
    if (showFairModal) {
      document.documentElement.style.overflow = "hidden";
      document.body.style.overflow = "hidden";
    } else {
      document.documentElement.style.overflow = "";
      document.body.style.overflow = "";
    }
    return () => {
      document.documentElement.style.overflow = "";
      document.body.style.overflow = "";
    };
  }, [showFairModal]);

  const createMapContainerRef = useRef(null);
  const createLeafletMapRef = useRef(null);
  const createMarkerRef = useRef(null);

  useEffect(() => {
    if (!showFairModal || !createMapContainerRef.current) return;
    if (createLeafletMapRef.current) return;

    const initCreateMap = () => {
      if (!createMapContainerRef.current || typeof window === "undefined" || !window.L) return;

      const L = window.L;
      delete L.Icon.Default.prototype._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      // Default to Arequipa center
      const initialLat = fairLat || -16.39889;
      const initialLng = fairLng || -71.53694;

      const cMap = L.map(createMapContainerRef.current, { zoomControl: false }).setView([initialLat, initialLng], 14);
      createLeafletMapRef.current = cMap;

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; OpenStreetMap',
        maxZoom: 19,
      }).addTo(cMap);

      const marker = L.marker([initialLat, initialLng], { draggable: true }).addTo(cMap);
      createMarkerRef.current = marker;

      marker.on("dragend", () => {
        const position = marker.getLatLng();
        setFairLat(position.lat);
        setFairLng(position.lng);
      });

      cMap.on("click", (e) => {
        const { lat, lng } = e.latlng;
        marker.setLatLng([lat, lng]);
        setFairLat(lat);
        setFairLng(lng);
      });

      L.control.zoom({ position: "bottomright" }).addTo(cMap);
    };

    const timer = setTimeout(initCreateMap, 300);
    return () => {
      clearTimeout(timer);
      if (createLeafletMapRef.current) {
        createLeafletMapRef.current.remove();
        createLeafletMapRef.current = null;
        createMarkerRef.current = null;
      }
    };
  }, [showFairModal, fairLat, fairLng, setFairLat, setFairLng]);

  const isNumeric = /^\d+$/.test(slug);
  const [organizerId, setOrganizerId] = useState(null);

  const organizer = organizers.find((o) => {
    if (organizerId) return o.id === organizerId;
    if (isNumeric) {
      return o.id === Number(slug) || o.slug === slug;
    }
    return o.slug === slug;
  });

  useEffect(() => {
    if (organizer && !organizerId) {
      setOrganizerId(organizer.id);
    }
  }, [organizer, organizerId]);

  // Redirect from numeric ID or changed slug to current slug-based URL
  useEffect(() => {
    if (organizer && organizer.slug && (isNumeric || organizer.slug !== slug)) {
      router.replace(`/organizers/${organizer.slug}`);
    }
  }, [organizer, isNumeric, slug, router]);

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "6rem 0" }}>
        <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: "2.5rem", color: "var(--gold-primary)" }}></i>
        <p style={{ color: "var(--text-muted)", marginTop: "10px" }}>Cargando perfil de la productora...</p>
      </div>
    );
  }

  if (!organizer) {
    return (
      <div className="container" style={{ textAlign: "center", padding: "4rem 0" }}>
        <h3>Productora no encontrada</h3>
        <button onClick={() => router.push("/")} className="btn-gold" style={{ marginTop: "1rem" }}>Volver a la Vitrina</button>
      </div>
    );
  }

  const organizerFairs = fairs.filter((f) => f.organizerId === organizer.id);

  // Check collaborator role of the logged-in persona
  const userCollaborator = organizer.collaborators ? organizer.collaborators.find(c => c.personId === Number(activePersonId)) : null;
  const userRole = userCollaborator ? userCollaborator.role : null;
  const isCollaborator = !!userRole;
  const isOwner = userRole === 'creador_original';

  const copyLink = (e) => {
    e.stopPropagation();
    if (typeof window === "undefined") return;
    const fullUrl = window.location.href;
    navigator.clipboard.writeText(fullUrl);
    alert("¡Enlace del perfil copiado al portapapeles! Listo para compartir.");
  };

  const handleEditClick = () => {
    const parsed = parseDescription(organizer.description);
    setEditName(organizer.name);
    setEditOwner(organizer.owner || "");
    setEditCategory("organizer");
    setEditDescription(parsed.text);
    setEditLogo(organizer.logo || "");
    setEditLogoPreview(organizer.logo || "");
    setEditProfileType("organizer");
    setEditProfileId(organizer.id);
    setEditSlug(organizer.slug || "");
    setEditInstagram(parsed.instagram || "");
    setEditFacebook(parsed.facebook || "");
    setEditTiktok(parsed.tiktok || "");
    setEditWebsite(parsed.website || "");
    setEditBanner(parsed.banner || "");
    setEditBannerPreview(parsed.banner || "");
    setEditThemeColor(parsed.theme_color || "");
    setEditTagline(parsed.tagline || "");
    setEditInterests(parsed.interests || "");
    setEditProfileOpen(true);
  };

  const handleDeleteClick = async () => {
    if (confirm(`¿Estás seguro de que deseas eliminar la productora "${organizer.name}"? Esta acción borrará permanentemente todas sus ferias y eventos asociados.`)) {
      const success = await handleDeleteOrganizer(organizer.id);
      if (success) {
        router.replace("/dashboard");
      }
    }
  };

  const handleBannerUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setFairBannerPreview(URL.createObjectURL(file));
    const url = await uploadImage(file, setUploadingFair);
    if (url) {
      setFairBanner(url);
    }
  };

  const onSubmitFair = async (e) => {
    e.preventDefault();
    setIsCreatingFair(true);
    try {
      await handleFairSubmit(e, organizer.id);
      setShowFairModal(false);
      setLocalStartDate("");
      setLocalEndDate("");
    } catch (err) {
      triggerNotification(false, "Ocurrió un error al crear la feria.");
    } finally {
      setIsCreatingFair(false);
    }
  };

  const parsed = parseDescription(organizer.description);
  const themeColor = (parsed.theme_color && parsed.theme_color.startsWith('#')) ? parsed.theme_color : "#D4AF37";
  const bannerStyle = parsed.banner 
    ? { backgroundImage: `url(${parsed.banner})`, backgroundSize: "cover", backgroundPosition: "center", height: "200px" } 
    : { background: "var(--gold-gradient)" };

  return (
    <div className="container" style={{ maxWidth: "1000px", padding: "0 1rem" }}>
      <div style={{ position: "relative" }}>
        <button onClick={() => router.push("/")} className="profile-close-btn" style={{ position: "absolute", top: "15px", right: "15px", zIndex: 10 }}>&times;</button>
        <button onClick={copyLink} className="profile-share-btn" style={{ position: "absolute", top: "15px", right: "60px", zIndex: 10 }} title="Copiar enlace de perfil">
          <i className="fa-solid fa-share-nodes"></i>
        </button>
        
        <div className="profile-header-banner" style={bannerStyle}>
          <div className="profile-avatar-wrapper">
            <img src={organizer.logo || "https://placehold.co/150x150/d4af37/1C1C1E?text=P"} alt={organizer.name} />
          </div>
        </div>

        <div className="profile-body">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem" }}>
            <div>
              <span style={{ fontSize: "0.8rem", color: "var(--text-gold)", textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.05em" }}>Productora de Eventos</span>
              <h2 style={{ fontSize: "1.8rem", fontWeight: 800, marginTop: "0.2rem", letterSpacing: "-0.015em" }}>{organizer.name}</h2>
              {parsed.tagline && (
                <p style={{ fontSize: "1.0rem", color: "var(--text-muted)", fontStyle: "italic", marginTop: "0.4rem", marginBottom: "0.4rem" }}>
                  &ldquo;{parsed.tagline}&rdquo;
                </p>
              )}
              <p style={{ fontSize: "0.9rem", color: "var(--text-muted)", marginTop: "0.3rem" }}>
                Productor Responsable: <strong>{organizer.owner || "No especificado"}</strong>
              </p>
            </div>

            {isCollaborator && (
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                {isOwner && (
                  <>
                    <button onClick={() => setShowFairModal(true)} className="btn-gold" style={{ padding: "0.5rem 1rem", borderRadius: "8px", fontSize: "0.85rem", fontWeight: 700, display: "flex", alignItems: "center", gap: "6px" }}>
                      <i className="fa-solid fa-calendar-plus"></i> Crear Feria / Evento
                    </button>
                    <button onClick={handleEditClick} className="btn-outline-gold" style={{ padding: "0.5rem 1rem", borderRadius: "8px", fontSize: "0.85rem", fontWeight: 700, display: "flex", alignItems: "center", gap: "6px" }}>
                      <i className="fa-solid fa-pen-to-square"></i> Personalizar Perfil
                    </button>
                    <button onClick={handleDeleteClick} className="btn-outline-gold" style={{ padding: "0.5rem 1rem", borderRadius: "8px", fontSize: "0.85rem", fontWeight: 700, display: "flex", alignItems: "center", gap: "6px", color: "#ef4444", borderColor: "#ef4444" }}>
                      <i className="fa-solid fa-trash"></i> Eliminar Productora
                    </button>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Social Links */}
          {(parsed.instagram || parsed.facebook || parsed.tiktok || parsed.website) && (
            <div style={{ display: "flex", gap: "12px", marginTop: "1rem", flexWrap: "wrap" }}>
              {parsed.instagram && (
                <a href={`https://instagram.com/${parsed.instagram.replace('@', '')}`} target="_blank" rel="noopener noreferrer" style={{ color: themeColor, fontSize: "1.4rem" }}><i className="fa-brands fa-instagram"></i></a>
              )}
              {parsed.facebook && (
                <a href={`https://facebook.com/${parsed.facebook}`} target="_blank" rel="noopener noreferrer" style={{ color: themeColor, fontSize: "1.4rem" }}><i className="fa-brands fa-facebook"></i></a>
              )}
              {parsed.tiktok && (
                <a href={`https://tiktok.com/@${parsed.tiktok.replace('@', '')}`} target="_blank" rel="noopener noreferrer" style={{ color: themeColor, fontSize: "1.4rem" }}><i className="fa-brands fa-tiktok"></i></a>
              )}
              {parsed.website && (
                <a href={parsed.website.trim().startsWith("http") ? parsed.website.trim() : `https://${parsed.website.trim()}`} target="_blank" rel="noopener noreferrer" style={{ color: themeColor, fontSize: "1.4rem" }}><i className="fa-solid fa-globe"></i></a>
              )}
            </div>
          )}

          {parsed.text && (
            <div style={{ marginTop: "1.5rem" }}>
              <h3 style={{ fontSize: "1.1rem", fontWeight: 800, marginBottom: "0.5rem" }}>Nuestra Historia & Propuesta</h3>
              <p style={{ fontSize: "0.95rem", color: "var(--text-muted)", lineHeight: "1.5", whiteSpace: "pre-line" }}>{parsed.text}</p>
            </div>
          )}

          <hr style={{ border: 0, borderTop: "1px solid var(--border-color)", margin: "2.2rem 0" }} />

          {/* Listado de Ferias y Eventos */}
          <div>
            <h3 style={{ fontSize: "1.2rem", fontWeight: 800, marginBottom: "1.2rem" }}>
              <i className="fa-solid fa-calendar-days" style={{ color: "var(--gold-primary)", marginRight: 8 }}></i>
              Ferias & Eventos Organizados
            </h3>
            {organizerFairs.length > 0 ? (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "1rem" }}>
                {organizerFairs.map((f) => (
                  <Link 
                    key={f.id} 
                    href={`/fairs/${f.slug || f.id}`}
                    style={{ textDecoration: "none", color: "inherit" }}
                  >
                    <div 
                      className="glass-panel" 
                      style={{ 
                        padding: "1.2rem", 
                        borderRadius: "12px", 
                        border: "1px solid var(--border-color)", 
                        transition: "all 0.2s",
                        background: "var(--bg-input)"
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.borderColor = "var(--gold-primary)"}
                      onMouseLeave={(e) => e.currentTarget.style.borderColor = "var(--border-color)"}
                    >
                      {f.banner && (
                        <div style={{ width: "100%", height: "120px", borderRadius: "8px", overflow: "hidden", marginBottom: "0.8rem" }}>
                          <img src={f.banner} alt={f.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        </div>
                      )}
                      <h4 style={{ fontSize: "1.05rem", fontWeight: 800, margin: "0 0 6px 0", color: "var(--text-primary)" }}>{f.name}</h4>
                      <p style={{ fontSize: "0.82rem", color: "var(--text-muted)", margin: "0 0 4px 0", display: "flex", alignItems: "center", gap: "6px" }}>
                        <i className="fa-regular fa-calendar" style={{ color: themeColor }}></i>
                        <span>{f.date}</span>
                      </p>
                      {f.location && (
                        <p style={{ fontSize: "0.82rem", color: "var(--text-muted)", margin: 0, display: "flex", alignItems: "center", gap: "6px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          <i className="fa-solid fa-location-dot" style={{ color: themeColor }}></i>
                          <span>{f.location}</span>
                        </p>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>Aún no se han publicado ferias o eventos para esta productora.</p>
            )}
          </div>

          {/* Integrantes Registrados al final */}
          {organizer.collaborators && organizer.collaborators.length > 0 && (
            <div style={{ marginTop: "3rem", paddingTop: "1.5rem", borderTop: "1px solid var(--border-color)" }}>
              <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--text-gold)", textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: "0.8rem" }}>
                Equipo de trabajo:
              </span>
              <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", marginTop: "4px" }}>
                {organizer.collaborators.map((c) => {
                  const p = people.find(person => person.id === c.personId);
                  if (!p) return null;
                  return (
                    <Link 
                      key={p.id}
                      href={`/people/${p.username || p.id}`}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "8px",
                        textDecoration: "none",
                        padding: "6px 12px",
                        background: "var(--bg-input)",
                        borderRadius: "20px",
                        border: "1px solid var(--border-color)",
                        transition: "all 0.2s"
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.borderColor = "var(--gold-primary)"}
                      onMouseLeave={(e) => e.currentTarget.style.borderColor = "var(--border-color)"}
                    >
                      <img 
                        src={p.logo || "https://placehold.co/24x24/d4af37/1C1C1E?text=P"} 
                        alt={p.name} 
                        style={{ width: "24px", height: "24px", borderRadius: "50%", objectFit: "cover", border: "1px solid var(--border-color)" }} 
                      />
                      <span style={{ color: "var(--text-primary)", fontWeight: 700, fontSize: "0.85rem" }}>
                        {p.name}
                      </span>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── MODAL: CREAR NUEVA FERIA / EVENTO ── */}
      {showFairModal && (
        <div className="modal-overlay" style={{ zIndex: 1100 }}>
          <div className="modal-backdrop" onClick={() => setShowFairModal(false)}></div>
          <div className="modal-panel fade-in" style={{ maxWidth: "550px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
              <h3 style={{ fontSize: "1.3rem", fontWeight: 800, margin: 0 }}>
                🎪 Publicar Nuevo Evento / Feria
              </h3>
              <button onClick={() => setShowFairModal(false)} style={{ background: "rgba(0,0,0,0.04)", border: "none", fontSize: "1.2rem", cursor: "pointer", width: "32px", height: "32px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>&times;</button>
            </div>

            <form onSubmit={onSubmitFair}>
              <div className="form-group">
                <label>Nombre del Evento *</label>
                <input 
                  type="text" 
                  className="form-control" 
                  placeholder="Ej: Arequipa Rock & Food Fest" 
                  value={fairName} 
                  onChange={(e) => setFairName(e.target.value)} 
                  required 
                />
              </div>

              <div className="form-group">
                <label>Dirección / Ubicación del Evento *</label>
                <input 
                  type="text" 
                  className="form-control" 
                  placeholder="Ej: Estadio Melgar, Arequipa" 
                  value={fairLocation} 
                  onChange={(e) => setFairLocation(e.target.value)} 
                  required 
                />
              </div>

              {/* Mapa de Coordenadas de Leaflet */}
              <div style={{ marginBottom: "1.2rem" }}>
                <label style={{ fontWeight: 700, fontSize: "0.85rem", color: "var(--text-primary)", display: "block", marginBottom: "0.5rem" }}>
                  📍 Marcar ubicación en el mapa (Arrastra el marcador o haz clic)
                </label>
                <div ref={createMapContainerRef} style={{ height: "180px", width: "100%", borderRadius: "8px", border: "1px solid var(--border-color)", zIndex: 1 }}></div>
                <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: "4px", display: "block" }}>
                  Coordenadas fijadas: Lat: {fairLat ? Number(fairLat).toFixed(5) : "-16.39889"}, Lng: {fairLng ? Number(fairLng).toFixed(5) : "-71.53694"}
                </span>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div className="form-group">
                  <label>Fecha de Inicio *</label>
                  <input 
                    type="date" 
                    className="form-control" 
                    value={localStartDate} 
                    onChange={(e) => setLocalStartDate(e.target.value)} 
                    required 
                  />
                </div>
                <div className="form-group">
                  <label>Fecha de Final (Opcional)</label>
                  <input 
                    type="date" 
                    className="form-control" 
                    value={localEndDate} 
                    onChange={(e) => setLocalEndDate(e.target.value)} 
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Horarios (Opcional)</label>
                <input 
                  type="text" 
                  className="form-control" 
                  placeholder="Ej: 10:00 AM - 10:00 PM" 
                  value={fairTime} 
                  onChange={(e) => setFairTime(e.target.value)} 
                />
              </div>

              {/* Subida de Imagen de Banner */}
              <div className="form-group">
                <label>Foto de Portada / Banner del Evento</label>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", border: "1px dashed var(--border-color)", padding: "1.5rem", borderRadius: "8px", alignItems: "center", background: "#FFFFFF" }}>
                  <div style={{ display: "flex", gap: "1rem", alignItems: "center", justifyContent: "center", cursor: "pointer", width: "100%" }}>
                    <label
                      htmlFor="fair-banner-upload-org"
                      style={{
                        display: "flex", alignItems: "center", gap: "12px",
                        cursor: "pointer"
                      }}
                    >
                      {fairBannerPreview ? (
                        <img src={fairBannerPreview} alt="preview" style={{ width: "80px", height: "48px", objectFit: "cover", borderRadius: "6px", border: "1px solid var(--border-color)" }} />
                      ) : (
                        <div style={{ width: "48px", height: "48px", background: "rgba(212,175,55,0.1)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <i className="fa-solid fa-camera" style={{ color: "var(--gold-primary)", fontSize: "1.1rem" }}></i>
                        </div>
                      )}
                      <div>
                        <span style={{ fontSize: "0.82rem", fontWeight: 700, display: "block" }}>
                          {fairBannerPreview ? "Imagen de portada lista ✓" : "Sube el banner o portada"}
                        </span>
                        <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>Formatos JPG, PNG, WEBP — máx 8 MB</span>
                      </div>
                    </label>
                    <input 
                      id="fair-banner-upload-org" 
                      type="file" 
                      accept="image/*" 
                      style={{ display: "none" }} 
                      onChange={handleBannerUpload}
                    />
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label>Breve Descripción o Historia</label>
                <textarea 
                  className="form-control" 
                  rows="3" 
                  style={{ resize: "none" }}
                  placeholder="De qué trata el evento, qué marcas y agrupaciones se presentarán..." 
                  value={fairDescription} 
                  onChange={(e) => setFairDescription(e.target.value)}
                ></textarea>
              </div>

              <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", marginTop: "1.5rem" }}>
                <button type="button" onClick={() => setShowFairModal(false)} className="btn-outline-gold" style={{ padding: "0.45rem 1.2rem", borderRadius: "6px", fontSize: "0.85rem" }}>Cancelar</button>
                <button type="submit" className="btn-gold" style={{ padding: "0.45rem 1.4rem", borderRadius: "6px", fontSize: "0.85rem", fontWeight: 700 }} disabled={uploadingFair || isCreatingFair}>
                  {uploadingFair ? "Subiendo..." : isCreatingFair ? "Publicando..." : "🎪 Publicar Evento"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
