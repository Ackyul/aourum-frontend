"use client";

import { useApp } from "../../../context/AppContext";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

export default function PersonProfile({ params }) {
  const [usernameParam, setUsernameParam] = useState("");

  useEffect(() => {
    async function resolveParams() {
      const resolvedParams = await params;
      if (resolvedParams && resolvedParams.username) {
        setUsernameParam(resolvedParams.username);
      }
    }
    resolveParams();
  }, [params]);

  const {
    people,
    loading,
    activePersonId,
    invitations,
    respondToInvitation,
    setShowRegModal,
    setRegType,
    setEditName,
    setEditLastName,
    setEditUsername,
    setEditOwner,
    setEditCategory,
    setEditOccupation,
    setEditDescription,
    setEditLogo,
    setEditLogoPreview,
    setEditGenre,
    setEditMembers,
    setEditMediaLink,
    setEditBrandIds,
    setEditOrganizerIds,
    setEditBandIds,
    setEditProfileType,
    setEditProfileId,
    setEditProfileOpen,
    setActiveEditTab,
    setEditInstagram,
    setEditFacebook,
    setEditTiktok,
    setEditWebsite,
    setEditBanner,
    setEditBannerPreview,
    setEditThemeColor,
    setEditTagline,
    setEditInterests,
    parseDescription,
    brands,
    organizers,
    bands
  } = useApp();

  const router = useRouter();

  const [personId, setPersonId] = useState(null);

  const person = people.find((p) => {
    if (personId) return p.id === personId;
    if (p.username && p.username.toLowerCase() === usernameParam.toLowerCase()) {
      return true;
    }
    return p.id.toString() === usernameParam;
  });

  useEffect(() => {
    if (person && !personId) {
      setPersonId(person.id);
    }
  }, [person, personId]);

  // Redirect if username changes
  useEffect(() => {
    if (person && person.username && person.username.toLowerCase() !== usernameParam.toLowerCase()) {
      router.replace(`/people/${person.username}`);
    }
  }, [person, usernameParam, router]);

  const [createProjectOpen, setCreateProjectOpen] = useState(false);

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "6rem 0" }}>
        <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: "2.5rem", color: "var(--gold-primary)" }}></i>
        <p style={{ color: "var(--text-muted)", marginTop: "1rem" }}>Cargando perfil...</p>
      </div>
    );
  }

  if (!person) {
    return (
      <div className="container" style={{ textAlign: "center", padding: "5rem 0" }}>
        <i className="fa-solid fa-user-slash" style={{ fontSize: "3rem", color: "var(--text-muted)", marginBottom: "1rem" }}></i>
        <h2>Perfil no encontrado</h2>
        <p style={{ color: "var(--text-muted)", marginTop: "0.5rem" }}>El usuario o ID &ldquo;{usernameParam}&rdquo; no existe en el sistema.</p>
        <button onClick={() => router.push("/")} className="btn-gold" style={{ marginTop: "1.5rem", padding: "0.5rem 1.5rem", borderRadius: "8px" }}>
          Volver a la Vitrina
        </button>
      </div>
    );
  }

  const isOwner = activePersonId != null && activePersonId.toString() === person.id.toString();

  const myBrands = (brands || []).filter((b) => (person.brandIds || []).includes(b.id));
  const myOrganizers = (organizers || []).filter((o) => {
    if (!(person.organizerIds || []).includes(o.id)) return false;
    const rObj = (person.organizerRoles || []).find((r) => r.organizerId === o.id);
    return rObj && rObj.role === 'creador_original';
  });
  const myBands = (bands || []).filter((b) => (person.bandIds || []).includes(b.id));

  const handleAccept = async (invId) => {
    try {
      await respondToInvitation(invId, true);
      alert("¡Invitación aceptada con éxito!");
    } catch (e) {
      alert("Error al aceptar invitación: " + e.message);
    }
  };

  const handleReject = async (invId) => {
    try {
      await respondToInvitation(invId, false);
      alert("Invitación rechazada.");
    } catch (e) {
      alert("Error al rechazar invitación: " + e.message);
    }
  };

  const copyLink = (e) => {
    e.stopPropagation();
    if (typeof window === "undefined") return;
    const fullUrl = window.location.href;
    navigator.clipboard.writeText(fullUrl);
    alert("¡Enlace del perfil copiado al portapapeles!");
  };

  const handleEditClick = () => {
    const parsed = parseDescription(person.description);
    setEditName(person.name);
    setEditLastName(person.lastName || "");
    setEditUsername(person.username || "");
    setEditOwner("");
    setEditCategory("");
    setEditDescription(parsed.text);
    setEditLogo(person.logo || "");
    setEditLogoPreview(person.logo || "");
    setEditGenre("");
    setEditMembers("");
    setEditOccupation(person.occupation || "");
    setEditMediaLink("");
    setEditBrandIds(person.brandIds || []);
    setEditOrganizerIds(person.organizerIds || []);
    setEditBandIds(person.bandIds || []);
    setEditInstagram(parsed.instagram);
    setEditFacebook(parsed.facebook);
    setEditTiktok(parsed.tiktok);
    setEditWebsite(parsed.website);
    setEditBanner(parsed.banner || "");
    setEditBannerPreview(parsed.banner || "");
    setEditThemeColor(parsed.theme_color || "");
    setEditTagline(parsed.tagline || "");
    setEditInterests(parsed.interests || "");
    setEditProfileType("person");
    setEditProfileId(person.id);
    setActiveEditTab("basic");
    setEditProfileOpen(true);
  };

  const handleConfigClick = () => {
    const parsed = parseDescription(person.description);
    setEditName(person.name);
    setEditLastName(person.lastName || "");
    setEditUsername(person.username || "");
    setEditOwner("");
    setEditCategory("");
    setEditDescription(parsed.text);
    setEditLogo(person.logo || "");
    setEditLogoPreview(person.logo || "");
    setEditGenre("");
    setEditMembers("");
    setEditOccupation(person.occupation || "");
    setEditMediaLink("");
    setEditBrandIds(person.brandIds || []);
    setEditOrganizerIds(person.organizerIds || []);
    setEditBandIds(person.bandIds || []);
    setEditInstagram(parsed.instagram);
    setEditFacebook(parsed.facebook);
    setEditTiktok(parsed.tiktok);
    setEditWebsite(parsed.website);
    setEditBanner(parsed.banner || "");
    setEditBannerPreview(parsed.banner || "");
    setEditThemeColor(parsed.theme_color || "");
    setEditTagline(parsed.tagline || "");
    setEditInterests(parsed.interests || "");
    setEditProfileType("person");
    setEditProfileId(person.id);
    setActiveEditTab("configuracion");
    setEditProfileOpen(true);
  };

  const parsed = parseDescription(person.description);
  const themeColor = (parsed.theme_color && parsed.theme_color.startsWith('#')) ? parsed.theme_color : "#D4AF37";
  const bannerStyle = parsed.banner 
    ? { backgroundImage: `url(${parsed.banner})`, backgroundSize: "cover", backgroundPosition: "center", height: "200px" } 
    : { background: "var(--gold-gradient)", opacity: 0.15, height: "130px" };

  return (
    <div className="container" style={{ maxWidth: "1000px", padding: "0 1rem" }}>
      <div className="glass-panel" style={{ position: "relative", overflow: "hidden", borderRadius: "16px" }}>
        <button onClick={() => router.push("/")} className="profile-close-btn" style={{ position: "absolute", top: "15px", right: "15px", zIndex: 10 }}>&times;</button>
        <button onClick={copyLink} className="profile-share-btn" style={{ position: "absolute", top: "15px", right: "60px", zIndex: 10 }} title="Copiar enlace de perfil">
          <i className="fa-solid fa-share-nodes"></i>
        </button>
        
        <div className="profile-header-banner" style={bannerStyle}></div>

        <div className="profile-body person-profile-body-offset" style={{ position: "relative", zIndex: 1, padding: "0 2rem 2rem 2rem" }}>
          <div style={{ display: "flex", gap: "2rem", alignItems: "flex-end", flexWrap: "wrap", marginBottom: "2rem" }}>
            <img 
              src={person.logo || "https://placehold.co/120x120/d4af37/1C1C1E?text=P"} 
              alt={person.name} 
              className="person-avatar-large"
              style={{ width: "140px", height: "140px", borderRadius: "50%", objectFit: "cover", border: "4px solid #FFFFFF", boxShadow: "0 8px 24px rgba(0,0,0,0.12)", flexShrink: 0 }}
            />
            <div style={{ flex: 1, paddingBottom: "10px", display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: "1rem" }}>
              <div>
                {person.occupation && (
                  <span style={{ fontSize: "0.8rem", color: themeColor, textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.08em", background: `${themeColor}12`, padding: "4px 10px", borderRadius: "20px", border: `1px solid ${themeColor}25` }}>
                    {person.occupation}
                  </span>
                )}
                <h2 className="person-name-heading" style={{ fontSize: "2.2rem", fontWeight: 800, marginTop: person.occupation ? "0.8rem" : "0", letterSpacing: "-0.02em" }}>{person.name} {person.lastName || ""}</h2>
                {parsed.tagline && (
                  <p style={{ fontSize: "1.0rem", color: "var(--text-muted)", fontStyle: "italic", marginTop: "0.4rem", marginBottom: "0.4rem" }}>
                    &ldquo;{parsed.tagline}&rdquo;
                  </p>
                )}
              </div>
              {isOwner && (
                <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                  <button 
                    onClick={handleEditClick}
                    className="btn-gold"
                    style={{ padding: "0.55rem 1.4rem", borderRadius: "8px", fontSize: "0.85rem", fontWeight: 700, background: themeColor, borderColor: themeColor }}
                  >
                    <i className="fa-solid fa-pen"></i> Editar Perfil
                  </button>
                  <button 
                    onClick={handleConfigClick}
                    style={{ 
                      padding: "0.55rem 1.4rem", 
                      borderRadius: "8px", 
                      fontSize: "0.85rem", 
                      fontWeight: 700, 
                      background: "transparent", 
                      border: `2px solid ${themeColor}`, 
                      color: themeColor,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      transition: "all 0.2s ease"
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.background = `${themeColor}15`;
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.background = "transparent";
                    }}
                  >
                    <i className="fa-solid fa-gear"></i> Configuración
                  </button>
                </div>
              )}
            </div>
          </div>

          <div style={{ background: "rgba(0,0,0,0.01)", border: "1px solid var(--border-color)", borderRadius: "12px", padding: "1.5rem", marginBottom: "2.5rem" }}>
            <h3 style={{ fontSize: "1.0rem", fontWeight: 800, marginBottom: "0.6rem", color: "var(--text-primary)" }}>Biografía / Propuesta</h3>
            <p style={{ fontSize: "0.95rem", color: "var(--text-primary)", lineHeight: 1.65, margin: 0 }}>
              {parsed.text || "Esta persona no ha escrito una biografía todavía."}
            </p>

            {parsed.interests && (
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginTop: "1.2rem", paddingTop: "1.0rem", borderTop: "1px dashed var(--border-color)" }}>
                {parsed.interests.split(",").map((tag, idx) => (
                  <span key={idx} style={{ fontSize: "0.75rem", background: "var(--bg-input)", border: "1px solid var(--border-color)", padding: "4px 10px", borderRadius: "20px", color: "var(--text-primary)", fontWeight: 500 }}>
                    🏷️ {tag.trim()}
                  </span>
                ))}
              </div>
            )}

            {(() => {
              const hasSocials = parsed.instagram || parsed.facebook || parsed.tiktok || parsed.website;
              if (!hasSocials) return null;
              return (
                <div style={{ display: "flex", gap: "16px", alignItems: "center", marginTop: "1rem", flexWrap: "wrap" }}>
                  {parsed.instagram && (
                    <a href={`https://instagram.com/${parsed.instagram.trim()}`} target="_blank" rel="noopener noreferrer" style={{ color: themeColor, fontSize: "1.4rem" }}><i className="fa-brands fa-instagram"></i></a>
                  )}
                  {parsed.facebook && (
                    <a href={`https://facebook.com/${parsed.facebook.trim()}`} target="_blank" rel="noopener noreferrer" style={{ color: themeColor, fontSize: "1.4rem" }}><i className="fa-brands fa-facebook"></i></a>
                  )}
                  {parsed.tiktok && (
                    <a href={`https://tiktok.com/@${parsed.tiktok.trim().replace(/^@/, "")}`} target="_blank" rel="noopener noreferrer" style={{ color: themeColor, fontSize: "1.4rem" }}><i className="fa-brands fa-tiktok"></i></a>
                  )}
                  {parsed.website && (
                    <a href={parsed.website.trim().startsWith("http") ? parsed.website.trim() : `https://${parsed.website.trim()}`} target="_blank" rel="noopener noreferrer" style={{ color: themeColor, fontSize: "1.4rem" }}><i className="fa-solid fa-globe"></i></a>
                  )}
                </div>
              );
            })()}
          </div>

          {isOwner && (
            <div style={{ display: "flex", flexDirection: "column", gap: "2rem", marginBottom: "2.5rem" }}>
              {(() => {
                const receivedInvs = invitations.filter(inv => inv.receiverPersonId === person.id);
                if (receivedInvs.length === 0) return null;
                return (
                  <div className="glass-panel" style={{ padding: "1.5rem", border: `1.5px solid ${themeColor}`, background: `${themeColor}05` }}>
                    <h3 style={{ fontSize: "1.05rem", fontWeight: 800, marginBottom: "0.8rem", color: themeColor, display: "flex", alignItems: "center", gap: 8 }}>
                      <i className="fa-solid fa-envelope-open-text"></i> Invitaciones Pendientes
                    </h3>
                    {receivedInvs.map(inv => (
                      <div key={inv.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#FFFFFF", padding: "1rem", borderRadius: "10px", border: "1px solid var(--border-color)", marginBottom: "0.5rem" }}>
                        <div>
                          <strong style={{ display: "block", fontSize: "0.9rem" }}>{inv.senderName}</strong>
                          <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Rol: {inv.role}</span>
                        </div>
                        <div style={{ display: "flex", gap: "8px" }}>
                          <button onClick={() => handleAccept(inv.id)} className="btn-gold" style={{ padding: "0.3rem 0.8rem", fontSize: "0.8rem" }}>Aceptar</button>
                          <button onClick={() => handleReject(inv.id)} className="btn-outline-gold" style={{ padding: "0.3rem 0.8rem", fontSize: "0.8rem" }}>Rechazar</button>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}

              {(myBrands.length > 0 || myOrganizers.length > 0 || myBands.length > 0) && (
                <div className="glass-panel" style={{ padding: "1.5rem" }}>
                  <h3 style={{ fontSize: "1.05rem", fontWeight: 800, marginBottom: "1.2rem", color: "var(--text-primary)", display: "flex", alignItems: "center", gap: 8 }}>
                    <i className="fa-solid fa-folder-open" style={{ color: themeColor }}></i> Mis Cuentas vinculadas
                  </h3>
                  
                  <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                    {myBrands.length > 0 && (
                      <div>
                        <h4 style={{ fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--text-muted)", fontWeight: 700, marginBottom: "0.6rem", display: "flex", alignItems: "center", gap: 6 }}>
                          <i className="fa-solid fa-store" style={{ color: themeColor }}></i> Marcas
                        </h4>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "12px" }}>
                          {myBrands.map((b) => (
                            <Link 
                              key={b.id} 
                              href={`/brands/${b.slug || b.id}`}
                              className="project-card-link"
                              style={{ 
                                display: "flex", 
                                alignItems: "center", 
                                gap: "12px", 
                                background: "rgba(0,0,0,0.02)", 
                                border: "1px solid var(--border-color)", 
                                padding: "10px 14px", 
                                borderRadius: "10px", 
                                textDecoration: "none",
                                transition: "var(--transition-smooth)"
                              }}
                            >
                              <img 
                                src={b.logo || "https://placehold.co/40x40/d4af37/1C1C1E?text=M"} 
                                alt={b.name} 
                                style={{ width: "36px", height: "36px", borderRadius: "8px", objectFit: "cover" }} 
                              />
                              <div style={{ overflow: "hidden" }}>
                                <strong style={{ display: "block", fontSize: "0.88rem", color: "var(--text-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{b.name}</strong>
                                <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 600 }}>{b.category || "Marca"}</span>
                              </div>
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}

                    {myOrganizers.length > 0 && (
                      <div>
                        <h4 style={{ fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--text-muted)", fontWeight: 700, marginBottom: "0.6rem", display: "flex", alignItems: "center", gap: 6 }}>
                          <i className="fa-solid fa-calendar-days" style={{ color: themeColor }}></i> Productoras
                        </h4>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "12px" }}>
                          {myOrganizers.map((o) => (
                            <Link 
                              key={o.id} 
                              href={`/organizers/${o.slug || o.id}`}
                              className="project-card-link"
                              style={{ 
                                display: "flex", 
                                alignItems: "center", 
                                gap: "12px", 
                                background: "rgba(0,0,0,0.02)", 
                                border: "1px solid var(--border-color)", 
                                padding: "10px 14px", 
                                borderRadius: "10px",
                                textDecoration: "none",
                                transition: "var(--transition-smooth)"
                              }}
                            >
                              <img 
                                src={o.logo || "https://placehold.co/40x40/d4af37/1C1C1E?text=P"} 
                                alt={o.name} 
                                style={{ width: "36px", height: "36px", borderRadius: "8px", objectFit: "cover" }} 
                              />
                              <div style={{ overflow: "hidden" }}>
                                <strong style={{ display: "block", fontSize: "0.88rem", color: "var(--text-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{o.name}</strong>
                                <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 600 }}>Productora</span>
                              </div>
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}

                    {myBands.length > 0 && (
                      <div>
                        <h4 style={{ fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--text-muted)", fontWeight: 700, marginBottom: "0.6rem", display: "flex", alignItems: "center", gap: 6 }}>
                          <i className="fa-solid fa-guitar" style={{ color: themeColor }}></i> Bandas
                        </h4>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "12px" }}>
                          {myBands.map((b) => (
                            <Link 
                              key={b.id} 
                              href={`/bands/${b.slug || b.id}`}
                              className="project-card-link"
                              style={{ 
                                display: "flex", 
                                alignItems: "center", 
                                gap: "12px", 
                                background: "rgba(0,0,0,0.02)", 
                                border: "1px solid var(--border-color)", 
                                padding: "10px 14px", 
                                borderRadius: "10px", 
                                textDecoration: "none",
                                transition: "var(--transition-smooth)"
                              }}
                            >
                              <img 
                                src={b.image || "https://placehold.co/40x40/d4af37/1C1C1E?text=B"} 
                                alt={b.name} 
                                style={{ width: "36px", height: "36px", borderRadius: "50%", objectFit: "cover" }} 
                              />
                              <div style={{ overflow: "hidden" }}>
                                <strong style={{ display: "block", fontSize: "0.88rem", color: "var(--text-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{b.name}</strong>
                                <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 600 }}>{b.genre || "Banda"}</span>
                              </div>
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="glass-panel" style={{ padding: "1.5rem" }}>
                <div onClick={() => setCreateProjectOpen(!createProjectOpen)} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }}>
                  <h3 style={{ fontSize: "1.05rem", fontWeight: 800, margin: 0, color: "var(--text-primary)", display: "flex", alignItems: "center", gap: 8 }}>
                    <i className="fa-solid fa-plus-circle" style={{ color: themeColor }}></i> Registrar Proyecto
                  </h3>
                  <i className={`fa-solid fa-chevron-${createProjectOpen ? "up" : "down"}`}></i>
                </div>
                {createProjectOpen && (
                  <div style={{ marginTop: "1rem" }}>
                    <button onClick={() => { setRegType("brand"); setShowRegModal(true); }} className="btn-outline-gold" style={{ marginRight: "10px" }}>Crear Marca</button>
                    <button onClick={() => { setRegType("organizer"); setShowRegModal(true); }} className="btn-outline-gold" style={{ marginRight: "10px" }}>Crear Productora</button>
                    <button onClick={() => { setRegType("band"); setShowRegModal(true); }} className="btn-outline-gold">Crear Banda</button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
