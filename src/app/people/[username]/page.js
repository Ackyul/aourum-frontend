"use client";

import { use, useEffect, useState } from "react";
import { useApp } from "../../../context/AppContext";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function PersonProfilePage({ params }) {
  const unwrappedParams = use(params);
  const usernameParam = unwrappedParams.username;

  const [createProjectOpen, setCreateProjectOpen] = useState(false);
  const [projectsOpen, setProjectsOpen] = useState(true);

  const {
    people,
    brands,
    bands,
    organizers,
    fairs,
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
    setEditInstagram,
    setEditFacebook,
    setEditTiktok,
    setEditWebsite,
    parseDescription,
    handleDeleteBand,
    handleDeleteBrand,
    handleDeleteOrganizer
  } = useApp();

  const router = useRouter();

  const person = people.find((p) => {
    if (p.username && p.username.toLowerCase() === usernameParam.toLowerCase()) {
      return true;
    }
    if (/^\d+$/.test(usernameParam) && p.id === Number(usernameParam)) {
      return true;
    }
    return false;
  });

  // Redirect from numeric ID to username-based URL
  useEffect(() => {
    if (person && person.username && /^\d+$/.test(usernameParam)) {
      router.replace(`/people/${person.username}`);
    }
  }, [person, usernameParam, router]);

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "6rem 0" }}>
        <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: "2.5rem", color: "var(--gold-primary)" }}></i>
        <p style={{ color: "var(--text-muted)", marginTop: "10px" }}>Cargando perfil...</p>
      </div>
    );
  }

  if (!person) {
    return (
      <div className="container" style={{ textAlign: "center", padding: "4rem 0" }}>
        <h3>Persona no encontrada</h3>
        <button onClick={() => router.push("/")} className="btn-gold" style={{ marginTop: "1rem" }}>Volver al Inicio</button>
      </div>
    );
  }

  const isOwner = Number(activePersonId) === person.id;

  // Find related entities
  const relatedBrands = brands.filter((b) => (person.brandIds && person.brandIds.includes(b.id)) || (b.personIds && b.personIds.includes(person.id)));
  const relatedBands = bands.filter((b) => (person.bandIds && person.bandIds.includes(b.id)) || (b.personIds && b.personIds.includes(person.id)));
  const relatedOrganizers = organizers.filter((o) => (person.organizerIds && person.organizerIds.includes(o.id)) || (o.personIds && o.personIds.includes(person.id)));
  const organizerIds = relatedOrganizers.map(o => o.id);
  const relatedFairs = fairs.filter((f) => organizerIds.includes(f.organizerId));

  const copyLink = (e) => {
    e.stopPropagation();
    if (typeof window === "undefined") return;
    const fullUrl = window.location.href;
    navigator.clipboard.writeText(fullUrl);
    alert("¡Enlace del perfil copiado al portapapeles! Listo para compartir.");
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
    setEditProfileType("person");
    setEditProfileId(person.id);
    setEditProfileOpen(true);
  };

  return (
    <div className="container" style={{ maxWidth: "1000px", padding: "0 1rem" }}>
      <div className="glass-panel" style={{ position: "relative", overflow: "hidden", borderRadius: "16px" }}>
        <button onClick={() => router.push("/")} className="profile-close-btn" style={{ position: "absolute", top: "15px", right: "15px", zIndex: 10 }}>&times;</button>
        <button onClick={copyLink} className="profile-share-btn" style={{ position: "absolute", top: "15px", right: "60px", zIndex: 10 }} title="Copiar enlace de perfil">
          <i className="fa-solid fa-share-nodes"></i>
        </button>
        
        <div className="profile-header-banner" style={{ height: "200px", background: "var(--gold-gradient)", opacity: 0.15 }}></div>

        <div className="profile-body" style={{ marginTop: "-80px", position: "relative", zIndex: 1 }}>
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
                  <span style={{ fontSize: "0.8rem", color: "var(--text-gold)", textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.08em", background: "rgba(214,175,55,0.08)", padding: "4px 10px", borderRadius: "20px", border: "1px solid rgba(214,175,55,0.2)" }}>
                    {person.occupation}
                  </span>
                )}
                <h2 className="person-name-heading" style={{ fontSize: "2.2rem", fontWeight: 800, marginTop: person.occupation ? "0.8rem" : "0", letterSpacing: "-0.02em" }}>{person.name} {person.lastName || ""}</h2>
              </div>
              {isOwner && (
                <button 
                  onClick={handleEditClick}
                  className="btn-gold"
                  style={{ padding: "0.55rem 1.4rem", borderRadius: "8px", fontSize: "0.85rem", fontWeight: 700 }}
                >
                  <i className="fa-solid fa-pen"></i> Editar Perfil
                </button>
              )}
            </div>
          </div>

          <div style={{ background: "rgba(0,0,0,0.01)", border: "1px solid var(--border-color)", borderRadius: "12px", padding: "1.5rem", marginBottom: "2.5rem" }}>
            <h3 style={{ fontSize: "1.0rem", fontWeight: 800, marginBottom: "0.6rem", color: "var(--text-primary)" }}>Biografía / Propuesta</h3>
            <p style={{ fontSize: "0.95rem", color: "var(--text-primary)", lineHeight: 1.65, margin: 0 }}>
              {parseDescription(person.description).text || "Esta persona no ha escrito una biografía todavía."}
            </p>

            {(() => {
              const parsed = parseDescription(person.description);
              const hasSocials = parsed.instagram || parsed.facebook || parsed.tiktok || parsed.website;
              if (!hasSocials) return null;
              return (
                <div style={{ display: "flex", gap: "16px", alignItems: "center", marginTop: "1rem", flexWrap: "wrap" }}>
                  {parsed.instagram && (
                    <a 
                      href={`https://instagram.com/${parsed.instagram.trim()}`} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      style={{ color: "#e1306c", fontSize: "1.4rem", display: "flex", alignItems: "center", textDecoration: "none", transition: "transform 0.2s" }}
                      onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.2)"}
                      onMouseLeave={(e) => e.currentTarget.style.transform = "none"}
                      title="Instagram"
                    >
                      <i className="fa-brands fa-instagram"></i>
                    </a>
                  )}
                  {parsed.facebook && (
                    <a 
                      href={`https://facebook.com/${parsed.facebook.trim()}`} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      style={{ color: "#1877f2", fontSize: "1.4rem", display: "flex", alignItems: "center", textDecoration: "none", transition: "transform 0.2s" }}
                      onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.2)"}
                      onMouseLeave={(e) => e.currentTarget.style.transform = "none"}
                      title="Facebook"
                    >
                      <i className="fa-brands fa-facebook"></i>
                    </a>
                  )}
                  {parsed.tiktok && (
                    <a 
                      href={`https://tiktok.com/@${parsed.tiktok.trim().replace(/^@/, "")}`} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      style={{ color: "#000000", fontSize: "1.4rem", display: "flex", alignItems: "center", textDecoration: "none", transition: "transform 0.2s" }}
                      onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.2)"}
                      onMouseLeave={(e) => e.currentTarget.style.transform = "none"}
                      title="TikTok"
                    >
                      <i className="fa-brands fa-tiktok"></i>
                    </a>
                  )}
                  {parsed.website && (
                    <a 
                      href={parsed.website.trim().startsWith("http") ? parsed.website.trim() : `https://${parsed.website.trim()}`} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      style={{ color: "var(--gold-primary)", fontSize: "1.4rem", display: "flex", alignItems: "center", textDecoration: "none", transition: "transform 0.2s" }}
                      onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.2)"}
                      onMouseLeave={(e) => e.currentTarget.style.transform = "none"}
                      title="Sitio Web"
                    >
                      <i className="fa-solid fa-globe"></i>
                    </a>
                  )}
                </div>
              );
            })()}
          </div>

          {/* Gestión del Propietario (Invitaciones y Creación de Proyectos) */}
          {isOwner && (
            <div style={{ display: "flex", flexDirection: "column", gap: "2rem", marginBottom: "2.5rem" }}>
              {/* Invitaciones de Colaboración */}
              {(() => {
                const receivedInvs = invitations.filter(inv => inv.receiverPersonId === person.id);
                if (receivedInvs.length === 0) return null;
                return (
                  <div className="glass-panel" style={{ padding: "1.5rem", border: "1.5px solid var(--gold-primary)", background: "rgba(214,175,55,0.02)" }}>
                    <h3 style={{ fontSize: "1.05rem", fontWeight: 800, marginBottom: "0.8rem", color: "var(--text-gold)", display: "flex", alignItems: "center", gap: 8 }}>
                      <i className="fa-solid fa-envelope-open-text"></i> Invitaciones de Colaboración Pendientes
                    </h3>
                    <p style={{ fontSize: "0.82rem", color: "var(--text-muted)", marginBottom: "1.2rem" }}>
                      Otras cuentas te han invitado a unirte a sus proyectos como colaborador.
                    </p>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.8rem" }}>
                      {receivedInvs.map(inv => (
                        <div key={inv.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#FFFFFF", padding: "1rem", borderRadius: "10px", border: "1px solid var(--border-color)", flexWrap: "wrap", gap: "1rem" }}>
                          <div>
                            <strong style={{ fontSize: "0.9rem", color: "var(--text-primary)" }}>
                              {inv.senderName} ({inv.senderType === "brand" ? "🏪 Marca" : inv.senderType === "organizer" ? "🎪 Organizador" : "🎸 Banda"})
                            </strong>
                            <span style={{ display: "block", fontSize: "0.78rem", color: "var(--text-muted)", marginTop: "2px" }}>
                              Rol invitado: <strong style={{ color: "var(--gold-dark)" }}>{inv.role === "owner" ? "Propietario / Diseñador" : inv.role === "producer" ? "Productor / Creador" : "Integrante"}</strong>
                            </span>
                          </div>
                          <div style={{ display: "flex", gap: "8px" }}>
                            <button 
                              onClick={() => respondToInvitation(inv.id, true)} 
                              className="btn-gold" 
                              style={{ padding: "0.4rem 1rem", fontSize: "0.8rem", borderRadius: "6px" }}
                            >
                              Aceptar
                            </button>
                            <button 
                              onClick={() => respondToInvitation(inv.id, false)} 
                              className="btn-outline-gold" 
                              style={{ padding: "0.4rem 1rem", fontSize: "0.8rem", borderRadius: "6px" }}
                            >
                              Rechazar
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}

              {/* Crear Proyectos */}
              <div className="glass-panel" style={{ padding: "1.5rem" }}>
                <div 
                  onClick={() => setCreateProjectOpen(!createProjectOpen)}
                  style={{ display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }}
                >
                  <h3 style={{ fontSize: "1.05rem", fontWeight: 800, margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
                    <i className="fa-solid fa-plus-circle" style={{ color: "var(--gold-primary)" }}></i> ¿Tienes un nuevo proyecto propio?
                  </h3>
                  <i className={`fa-solid fa-chevron-${createProjectOpen ? "up" : "down"}`} style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}></i>
                </div>
                
                {createProjectOpen && (
                  <div className="fade-in" style={{ marginTop: "1.2rem" }}>
                    <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "1.2rem", lineHeight: 1.5 }}>
                      Registra tu marca, banda de música, o productora de eventos. Se asociarán automáticamente a tu cuenta de persona en la base de datos.
                    </p>
                    <div className="projects-grid" style={{ gap: "10px" }}>
                      <button 
                        onClick={() => { setRegType("brand"); setShowRegModal(true); }}
                        className="btn-outline-gold"
                        style={{ borderRadius: "8px", padding: "0.6rem 1rem", fontSize: "0.85rem", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}
                      >
                        🏪 Crear Marca
                      </button>
                      <button 
                        onClick={() => { setRegType("organizer"); setShowRegModal(true); }}
                        className="btn-outline-gold"
                        style={{ borderRadius: "8px", padding: "0.6rem 1rem", fontSize: "0.85rem", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}
                      >
                        🎪 Crear Productora
                      </button>
                      <button 
                        onClick={() => { setRegType("band"); setShowRegModal(true); }}
                        className="btn-outline-gold"
                        style={{ borderRadius: "8px", padding: "0.6rem 1rem", fontSize: "0.85rem", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}
                      >
                        🎸 Crear Banda
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          <hr style={{ border: 0, borderTop: "1px solid var(--border-color)", margin: "2.2rem 0" }} />

          <div 
            onClick={() => setProjectsOpen(!projectsOpen)}
            style={{ display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer", marginBottom: "1.8rem" }}
          >
            <h3 style={{ fontSize: "1.3rem", fontWeight: 800, margin: 0, color: "var(--text-primary)", display: "flex", alignItems: "center", gap: 10 }}>
              <i className="fa-solid fa-link" style={{ color: "var(--gold-primary)" }}></i> Proyectos y Afiliaciones
            </h3>
            <i className={`fa-solid fa-chevron-${projectsOpen ? "up" : "down"}`} style={{ color: "var(--text-muted)", fontSize: "1.1rem" }}></i>
          </div>

          {projectsOpen && (
            <div className="projects-grid fade-in">
              {/* MARCAS */}
              <div>
                <h4 style={{ fontSize: "1.05rem", fontWeight: 800, marginBottom: "1rem", color: "var(--text-primary)", display: "flex", alignItems: "center", gap: 8 }}>
                  <i className="fa-solid fa-store" style={{ color: "var(--gold-primary)" }}></i> Marcas
                </h4>
                {relatedBrands.length === 0 ? (
                  <p style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>No tiene marcas vinculadas.</p>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.8rem" }}>
                    {relatedBrands.map((b) => (
                      <div key={b.id} style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                        <Link 
                          href={`/brands/${b.slug || b.id}`} 
                          style={{ flex: 1, textDecoration: "none", display: "flex", alignItems: "center", gap: "12px", padding: "0.8rem", background: "var(--bg-input)", borderRadius: "8px", border: "1px solid var(--border-color)", transition: "transform 0.2s" }}
                          className="glass-panel-hover"
                        >
                          <img src={b.logo} alt={b.name} style={{ width: "40px", height: "40px", borderRadius: "50%", objectFit: "cover", border: "1px solid var(--border-color)" }} />
                          <div>
                            <strong style={{ fontSize: "0.88rem", color: "var(--text-primary)", display: "block" }}>{b.name}</strong>
                            <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>{b.category}</span>
                          </div>
                        </Link>
                        {isOwner && (
                          <button 
                            onClick={() => handleDeleteBrand(b.id)}
                            style={{ background: "transparent", border: "none", color: "#ef4444", cursor: "pointer", padding: "0.5rem", fontSize: "0.95rem" }}
                            title="Eliminar Marca"
                          >
                            <i className="fa-solid fa-trash"></i>
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* BANDAS */}
              <div>
                <h4 style={{ fontSize: "1.05rem", fontWeight: 800, marginBottom: "1rem", color: "var(--text-primary)", display: "flex", alignItems: "center", gap: 8 }}>
                  <i className="fa-solid fa-guitar" style={{ color: "var(--gold-primary)" }}></i> Bandas
                </h4>
                {relatedBands.length === 0 ? (
                  <p style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>No pertenece a ninguna banda.</p>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.8rem" }}>
                    {relatedBands.map((b) => (
                      <div key={b.id} style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                        <Link 
                          href={`/bands/${b.slug || b.id}`} 
                          style={{ flex: 1, textDecoration: "none", display: "flex", alignItems: "center", gap: "12px", padding: "0.8rem", background: "var(--bg-input)", borderRadius: "8px", border: "1px solid var(--border-color)" }}
                          className="glass-panel-hover"
                        >
                          <img src={b.image} alt={b.name} style={{ width: "40px", height: "40px", borderRadius: "50%", objectFit: "cover", border: "1px solid var(--border-color)" }} />
                          <div>
                            <strong style={{ fontSize: "0.88rem", color: "var(--text-primary)", display: "block" }}>{b.name}</strong>
                            <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>{b.genre}</span>
                          </div>
                        </Link>
                        {isOwner && (
                          <button 
                            onClick={() => handleDeleteBand(b.id)}
                            style={{ background: "transparent", border: "none", color: "#ef4444", cursor: "pointer", padding: "0.5rem", fontSize: "0.95rem" }}
                            title="Eliminar Banda"
                          >
                            <i className="fa-solid fa-trash"></i>
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* PRODUCTORAS & FERIAS */}
              <div>
                <h4 style={{ fontSize: "1.05rem", fontWeight: 800, marginBottom: "1rem", color: "var(--text-primary)", display: "flex", alignItems: "center", gap: 8 }}>
                  <i className="fa-solid fa-calendar-days" style={{ color: "var(--gold-primary)" }}></i> Productoras & Ferias
                </h4>
                {relatedOrganizers.length === 0 ? (
                  <p style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>No tiene productoras vinculadas.</p>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                    {relatedOrganizers.map((o) => {
                      const oFairs = fairs.filter(f => f.organizerId === o.id);
                      return (
                        <div key={o.id} style={{ background: "rgba(0,0,0,0.02)", border: "1px solid var(--border-color)", borderRadius: "10px", padding: "0.8rem", display: "flex", flexDirection: "column", gap: "0.6rem" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                              <img src={o.logo} alt={o.name} style={{ width: "32px", height: "32px", borderRadius: "50%", objectFit: "cover" }} />
                              <strong style={{ fontSize: "0.85rem", color: "var(--text-primary)" }}>{o.name}</strong>
                            </div>
                            {isOwner && (
                              <button 
                                onClick={() => handleDeleteOrganizer(o.id)}
                                style={{ background: "transparent", border: "none", color: "#ef4444", cursor: "pointer", fontSize: "0.85rem" }}
                                title="Eliminar Productora"
                              >
                                <i className="fa-solid fa-trash"></i>
                              </button>
                            )}
                          </div>
                          {oFairs.length === 0 ? (
                            <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontStyle: "italic" }}>Sin ferias creadas</span>
                          ) : (
                            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                              {oFairs.map(f => (
                                <Link 
                                  href={`/fairs/${f.slug || f.id}`} 
                                  key={f.id}
                                  style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: "8px", padding: "0.4rem", background: "#FFFFFF", borderRadius: "6px", border: "1px solid var(--border-color)" }}
                                >
                                  <img src={f.banner} alt={f.name} style={{ width: "30px", height: "22px", objectFit: "cover", borderRadius: "3px" }} />
                                  <span style={{ fontSize: "0.75rem", color: "var(--text-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", flex: 1 }}>{f.name}</span>
                                </Link>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
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
