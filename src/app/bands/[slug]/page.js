"use client";

import { use, useState, useMemo, useEffect } from "react";
import { useApp } from "../../../context/AppContext";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function BandProfilePage({ params }) {
  const unwrappedParams = use(params);
  const slug = unwrappedParams.slug;

  const {
    bands,
    people,
    loading,
    activePersonId,
    fairs,
    appFairId,
    setAppFairId,
    handleApplyToFair,
    invitations,
    sendInvitation,
    changeCollaboratorRole,
    removeCollaborator,
    setEditName,
    setEditGenre,
    setEditMembers,
    setEditDescription,
    setEditLogo,
    setEditLogoPreview,
    setEditMediaLink,
    setEditProfileType,
    setEditProfileId,
    setEditSlug,
    setEditProfileOpen,
    fetchData,
    triggerNotification,
    setEditInstagram,
    setEditFacebook,
    setEditTiktok,
    setEditWebsite,
    parseDescription
  } = useApp();

  const router = useRouter();
  const [newGig, setNewGig] = useState("");
  const [isUpdatingGigs, setIsUpdatingGigs] = useState(false);
  const [showFairs, setShowFairs] = useState(false);
  const [showCollabs, setShowCollabs] = useState(false);
  const [fairSearchQuery, setFairSearchQuery] = useState("");
  const [showFairDropdown, setShowFairDropdown] = useState(false);
  const [personSearchQuery, setPersonSearchQuery] = useState("");
  const [showPersonDropdown, setShowPersonDropdown] = useState(false);
  const [selectedPersonId, setSelectedPersonId] = useState("");

  const isNumeric = /^\d+$/.test(slug);
  const band = bands.find((b) => {
    if (isNumeric) {
      return b.id === Number(slug) || b.slug === slug;
    }
    return b.slug === slug;
  });

  // Redirect from numeric ID to slug-based URL
  useEffect(() => {
    if (band && band.slug && isNumeric) {
      router.replace(`/bands/${band.slug}`);
    }
  }, [band, isNumeric, router]);

  const filteredFairs = useMemo(() => {
    if (!fairSearchQuery.trim()) return fairs;
    return fairs.filter(f => f.name.toLowerCase().includes(fairSearchQuery.toLowerCase()));
  }, [fairs, fairSearchQuery]);

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "6rem 0" }}>
        <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: "2.5rem", color: "var(--gold-primary)" }}></i>
        <p style={{ color: "var(--text-muted)", marginTop: "10px" }}>Cargando perfil de la banda...</p>
      </div>
    );
  }

  if (!band) {
    return (
      <div className="container" style={{ textAlign: "center", padding: "4rem 0" }}>
        <h3>Banda no encontrada</h3>
        <button onClick={() => router.push("/bands")} className="btn-gold" style={{ marginTop: "1rem" }}>Volver a Bandas</button>
      </div>
    );
  }

  // Check collaborator role of the logged-in persona
  const currentPerson = people.find((p) => p.id === Number(activePersonId));
  const userCollaborator = band.collaborators ? band.collaborators.find(c => c.personId === Number(activePersonId)) : null;
  const userRole = userCollaborator ? userCollaborator.role : null;
  const isCollaborator = !!userRole;
  const canEditProfile = userRole === 'creador_original' || userRole === 'creador' || userRole === 'gestor';
  const canInvite = userRole === 'creador_original' || userRole === 'creador' || userRole === 'gestor';

  const isOwner = isCollaborator;

  const copyLink = (e) => {
    e.stopPropagation();
    if (typeof window === "undefined") return;
    const fullUrl = window.location.href;
    navigator.clipboard.writeText(fullUrl);
    alert("¡Enlace de la banda copiado al portapapeles! Listo para compartir.");
  };

  const handleEditClick = () => {
    const parsed = parseDescription(band.description);
    setEditName(band.name);
    setEditGenre(band.genre || "");
    setEditMembers(band.members || 1);
    setEditDescription(parsed.text);
    setEditLogo(band.image || "");
    setEditLogoPreview(band.image || "");
    setEditMediaLink(band.mediaLink || "");
    setEditProfileType("band");
    setEditProfileId(band.id);
    setEditSlug(band.slug || "");
    setEditInstagram(parsed.instagram);
    setEditFacebook(parsed.facebook);
    setEditTiktok(parsed.tiktok);
    setEditWebsite(parsed.website);
    setEditProfileOpen(true);
  };

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

  const handleAddGigSubmit = async (e) => {
    e.preventDefault();
    if (!newGig.trim()) return;
    setIsUpdatingGigs(true);
    const updatedGigs = [...(band.gigs || []), newGig.trim()];
    try {
      const response = await fetch(`${API_URL}/api/bands/${band.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: band.name,
          genre: band.genre,
          members: band.members,
          description: band.description,
          image: band.image,
          mediaLink: band.mediaLink,
          gigs: updatedGigs
        })
      });
      if (response.ok) {
        triggerNotification(true, "✨ Nueva fecha de concierto agregada!");
        setNewGig("");
        fetchData();
      } else {
        triggerNotification(false, "No se pudo agregar el concierto.");
      }
    } catch (err) {
      triggerNotification(false, "Error de red al intentar agregar concierto.");
    } finally {
      setIsUpdatingGigs(false);
    }
  };

  const handleDeleteGig = async (gigIndex) => {
    if (!confirm("¿Seguro que deseas remover esta fecha de concierto?")) return;
    setIsUpdatingGigs(true);
    const updatedGigs = (band.gigs || []).filter((_, idx) => idx !== gigIndex);
    try {
      const response = await fetch(`${API_URL}/api/bands/${band.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: band.name,
          genre: band.genre,
          members: band.members,
          description: band.description,
          image: band.image,
          mediaLink: band.mediaLink,
          gigs: updatedGigs
        })
      });
      if (response.ok) {
        triggerNotification(true, "Concierto removido correctamente.");
        fetchData();
      } else {
        triggerNotification(false, "No se pudo remover el concierto.");
      }
    } catch (err) {
      triggerNotification(false, "Error de red al intentar remover concierto.");
    } finally {
      setIsUpdatingGigs(false);
    }
  };

  return (
    <div className="container" style={{ maxWidth: "1000px", padding: "0 1rem" }}>
      <div className="glass-panel" style={{ position: "relative", overflow: "hidden", borderRadius: "16px" }}>
        <button onClick={() => router.push("/bands")} className="profile-close-btn" style={{ position: "absolute", top: "15px", right: "15px", zIndex: 10 }}>&times;</button>
        <button onClick={copyLink} className="profile-share-btn" style={{ position: "absolute", top: "15px", right: "60px", zIndex: 10 }} title="Copiar enlace de la banda">
          <i className="fa-solid fa-share-nodes"></i>
        </button>
        
        <div className="profile-header-banner" style={{ height: "260px" }}>
          <img src={band.image} alt={band.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        </div>

        <div className="profile-body">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem" }}>
            <div>
              <span style={{ fontSize: "0.8rem", color: "var(--text-gold)", textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.08em" }}>{band.genre}</span>
              <h2 style={{ fontSize: "1.8rem", fontWeight: 800, marginTop: "0.2rem", letterSpacing: "-0.015em" }}>{band.name}</h2>
              <p style={{ fontSize: "0.9rem", color: "var(--text-muted)", marginTop: "0.3rem" }}>
                <i className="fa-solid fa-users" style={{ marginRight: 6 }}></i>
                {band.members} Integrantes en Escenario
                {band.collaborators && band.collaborators.length > 1 && (
                  <span style={{ marginLeft: "6px" }}>
                    (Integrantes registrados:{" "}
                    {band.collaborators.map((c, idx) => {
                      const p = people.find(person => person.id === c.personId);
                      if (!p) return null;
                      return (
                        <span key={p.id}>
                          <Link href={`/people/${p.username || p.id}`} style={{ color: "var(--gold-dark)", textDecoration: "underline", fontWeight: 700 }}>
                            {p.name} ({c.role})
                          </Link>
                          {idx < band.collaborators.length - 1 ? ", " : ""}
                        </span>
                      );
                    })}
                    )
                  </span>
                )}
              </p>
            </div>

            {canEditProfile && (
              <button
                onClick={handleEditClick}
                className="btn-outline-gold"
                style={{ padding: "0.5rem 1rem", borderRadius: "8px", fontSize: "0.85rem", fontWeight: 700, display: "flex", alignItems: "center", gap: "6px" }}
              >
                <i className="fa-solid fa-gear"></i> Editar Perfil
              </button>
            )}
          </div>

          <p style={{ fontSize: "0.95rem", color: "var(--text-primary)", marginTop: "1.2rem", lineHeight: 1.65 }}>
            {parseDescription(band.description).text}
          </p>

          {(() => {
            const parsed = parseDescription(band.description);
            const hasSocials = parsed.instagram || parsed.facebook || parsed.tiktok || parsed.website;
            if (!hasSocials) return null;
            return (
              <div style={{ display: "flex", gap: "16px", alignItems: "center", marginTop: "1rem", flexWrap: "wrap", marginBottom: "1rem" }}>
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

          {band.mediaLink && (
            <div style={{ marginTop: "1.6rem" }}>
              <a href={band.mediaLink} target="_blank" rel="noopener noreferrer" className="btn-gold" style={{ textDecoration: "none", borderRadius: "8px" }}>
                <i className="fa-solid fa-play"></i> Escuchar música en vivo
              </a>
            </div>
          )}

          <hr style={{ border: 0, borderTop: "1px solid var(--border-color)", margin: "2.2rem 0" }} />

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.2rem", flexWrap: "wrap", gap: "1rem" }}>
            <h3 style={{ fontSize: "1.2rem", fontWeight: 800, margin: 0 }}>
              <i className="fa-solid fa-calendar-check" style={{ color: "var(--gold-primary)", marginRight: 8 }}></i>
              Conciertos & Fechas Agendadas
            </h3>
          </div>

          {/* Formulario para añadir Gig si es Owner */}
          {isOwner && (
            <form onSubmit={handleAddGigSubmit} className="gig-form">
              <input
                type="text"
                className="form-control"
                placeholder="Ej: 15 Oct 2026 - Arequipa Rock Fest (Estadio Melgar)"
                value={newGig}
                onChange={(e) => setNewGig(e.target.value)}
                required
                disabled={isUpdatingGigs}
              />
              <button type="submit" className="btn-gold" style={{ borderRadius: "8px" }} disabled={isUpdatingGigs || !newGig.trim()}>
                {isUpdatingGigs ? "Agregando..." : "+ Agregar Fecha"}
              </button>
            </form>
          )}


          {band.gigs && band.gigs.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.8rem" }}>
              {band.gigs.map((gig, idx) => (
                <div
                  key={idx}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    background: "var(--bg-input)",
                    padding: "0.9rem",
                    borderRadius: "8px",
                    border: "1px solid var(--border-color)",
                    fontWeight: 500,
                    fontSize: "0.9rem"
                  }}
                >
                  <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                    <i className="fa-solid fa-guitar" style={{ color: "var(--gold-primary)" }}></i>
                    <span>{gig}</span>
                  </div>
                  {isOwner && (
                    <button
                      onClick={() => handleDeleteGig(idx)}
                      style={{ background: "transparent", border: "none", color: "#ef4444", cursor: "pointer", fontWeight: 700 }}
                      disabled={isUpdatingGigs}
                      title="Eliminar Fecha"
                    >
                      <i className="fa-solid fa-trash"></i>
                    </button>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>Próximamente se anunciarán las fechas para esta banda.</p>
          )}

          {/* Opciones Desplegables de Administración y Colaboración */}
          {isCollaborator && (
            <>
              <hr style={{ border: 0, borderTop: "1px solid var(--border-color)", margin: "2.2rem 0" }} />
              
              {/* Opción 1: Postular Banda a Ferias */}
              {isOwner && (
                <div className="glass-panel" style={{ padding: "1.5rem", marginBottom: "1.5rem", overflow: "visible" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }} onClick={() => setShowFairs(!showFairs)}>
                    <h3 style={{ fontSize: "1.05rem", fontWeight: 800, margin: 0 }}>
                      <i className="fa-solid fa-paper-plane" style={{ color: "var(--gold-primary)", marginRight: 8 }}></i> Postular Banda a Ferias
                    </h3>
                    <button type="button" className="btn-outline-gold" style={{ padding: "4px 12px", fontSize: "0.75rem", borderRadius: "6px", fontWeight: 700 }}>
                      {showFairs ? "Ocultar" : "Mostrar / Postular"}
                    </button>
                  </div>

                  {showFairs && (
                    <div className="fade-in" style={{ marginTop: "1.5rem", borderTop: "1px solid var(--border-color)", paddingTop: "1.5rem" }}>
                      <form onSubmit={(e) => handleApplyToFair(e, "band", band.id)} className="apply-fair-form">
                        <div className="form-group" style={{ marginBottom: "1rem", position: "relative" }}>
                          <label>Buscar y seleccionar feria del calendario local</label>
                          <div style={{ position: "relative" }}>
                            <input
                              type="text"
                              className="form-control"
                              placeholder="Escribe el nombre de la feria para buscar..."
                              value={fairSearchQuery}
                              onChange={(e) => {
                                setFairSearchQuery(e.target.value);
                                setShowFairDropdown(true);
                              }}
                              onFocus={() => setShowFairDropdown(true)}
                              onBlur={() => setTimeout(() => setShowFairDropdown(false), 200)}
                              required
                            />
                            {fairSearchQuery && (
                              <button 
                                type="button" 
                                onClick={() => { setFairSearchQuery(""); setAppFairId(""); setShowFairDropdown(false); }}
                                style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", fontSize: "1.1rem" }}
                              >
                                &times;
                              </button>
                            )}
                          </div>
                          
                          {showFairDropdown && filteredFairs.length > 0 && (
                            <div 
                              style={{
                                position: "absolute", top: "100%", left: 0, right: 0,
                                background: "var(--bg-card)", border: "1px solid var(--border-color)",
                                borderRadius: "8px", boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
                                maxHeight: "200px", overflowY: "auto", zIndex: 1000, marginTop: "4px"
                              }}
                            >
                              {filteredFairs.map(f => (
                                <div
                                  key={f.id}
                                  onClick={() => {
                                    setAppFairId(f.id.toString());
                                    setFairSearchQuery(`${f.name} (${f.date})`);
                                    setShowFairDropdown(false);
                                  }}
                                  style={{
                                    padding: "0.6rem 1rem", cursor: "pointer",
                                    transition: "background 0.2s", fontSize: "0.85rem",
                                    borderBottom: "1px solid rgba(0,0,0,0.02)",
                                    color: "var(--text-primary)"
                                  }}
                                  onMouseEnter={(e) => e.target.style.background = "var(--bg-input)"}
                                  onMouseLeave={(e) => e.target.style.background = "none"}
                                >
                                  <strong>{f.name}</strong> <span style={{ color: "var(--text-muted)", fontSize: "0.78rem", marginLeft: "6px" }}>({f.date})</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                        <button type="submit" className="btn-gold" style={{ borderRadius: "8px" }}>Enviar Postulación</button>
                      </form>
                    </div>
                  )}
                </div>
              )}

              {/* Opción 2: Integrantes de la Banda */}
              <div className="glass-panel" style={{ padding: "1.5rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }} onClick={() => setShowCollabs(!showCollabs)}>
                  <h3 style={{ fontSize: "1.05rem", fontWeight: 800, margin: 0 }}>
                    <i className="fa-solid fa-users" style={{ color: "var(--gold-primary)", marginRight: 8 }}></i> Integrantes de la Banda
                  </h3>
                  <button type="button" className="btn-outline-gold" style={{ padding: "4px 12px", fontSize: "0.75rem", borderRadius: "6px", fontWeight: 700 }}>
                    {showCollabs ? "Ocultar" : "Mostrar / Invitar"}
                  </button>
                </div>

                {showCollabs && (
                  <div className="fade-in" style={{ marginTop: "1.5rem", borderTop: "1px solid var(--border-color)", paddingTop: "1.5rem" }}>
                    <div className="collab-grid">
                      <div>
                        <h4 style={{ fontSize: "0.9rem", fontWeight: 700, marginBottom: "0.6rem", color: "var(--text-gold)" }}>Miembros Vinculados</h4>
                        {band.collaborators && band.collaborators.length === 0 ? (
                          <p style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>No hay integrantes adicionales vinculados.</p>
                        ) : (
                          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                            {band.collaborators && band.collaborators.map(c => {
                              const p = people.find(person => person.id === c.personId);
                              if (!p) return null;
                              const isThisCollaboratorOriginalCreator = c.role === 'creador_original';
                              return (
                                <div key={p.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "var(--bg-input)", padding: "0.5rem", borderRadius: "6px", gap: "10px" }}>
                                  <div onClick={() => router.push(`/people/${p.username || p.id}`)} style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
                                    <img src={p.logo} alt={p.name} style={{ width: "24px", height: "24px", borderRadius: "50%", objectFit: "cover" }} />
                                    <span style={{ fontSize: "0.85rem", fontWeight: 600, textDecoration: "underline" }}>{p.name}</span>
                                    <span style={{ fontSize: "0.72rem", color: "var(--text-gold)", textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.05em" }}>({c.role})</span>
                                  </div>
                                  
                                  {userRole === 'creador_original' && !isThisCollaboratorOriginalCreator && (
                                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                      <select 
                                        value={c.role} 
                                        onChange={(e) => changeCollaboratorRole('band', band.id, p.id, e.target.value)}
                                        className="form-control" 
                                        style={{ padding: "2px 6px", fontSize: "0.75rem", width: "auto" }}
                                      >
                                        <option value="colaborador">Colaborador</option>
                                        <option value="gestor">Gestor</option>
                                        <option value="creador">Creador</option>
                                      </select>
                                      <button 
                                        onClick={() => {
                                          if (confirm(`¿Seguro que deseas desvincular a ${p.name}?`)) {
                                            removeCollaborator('band', band.id, p.id);
                                          }
                                        }}
                                        style={{ background: "transparent", border: "none", color: "#ef4444", cursor: "pointer", fontSize: "0.82rem", fontWeight: 700 }}
                                      >
                                        <i className="fa-solid fa-user-minus"></i>
                                      </button>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                      <div>
                        {canInvite && (
                          <>
                            <h4 style={{ fontSize: "0.9rem", fontWeight: 700, marginBottom: "0.6rem", color: "var(--text-gold)" }}>Invitar Integrante</h4>
                            {(() => {
                              const linkedIds = (band.collaborators || []).map(c => c.personId);
                              const pendingReceiverIds = invitations.filter(inv => inv.senderType === "band" && inv.senderId === band.id).map(inv => inv.receiverPersonId);
                              const candidates = people.filter(p => !linkedIds.includes(p.id) && !pendingReceiverIds.includes(p.id));

                              return (
                                <form onSubmit={(e) => {
                                  e.preventDefault();
                                  const receiverId = Number(e.target.elements.invitePerson.value);
                                  const inviteRole = e.target.elements.inviteRole.value;
                                  if (!receiverId || !inviteRole) return;
                                  sendInvitation("band", band.id, band.name, receiverId, inviteRole);
                                }}>
                                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                                    <select name="invitePerson" className="form-control" style={{ fontSize: "0.85rem" }} required>
                                      <option value="">-- Seleccionar Persona --</option>
                                      {candidates.map(p => (
                                        <option key={p.id} value={p.id}>{p.name}{p.occupation ? ` (${p.occupation})` : ""}</option>
                                      ))}
                                    </select>
                                    <select name="inviteRole" className="form-control" style={{ fontSize: "0.85rem" }} required>
                                      <option value="colaborador">Colaborador</option>
                                      <option value="gestor">Gestor</option>
                                      <option value="creador">Creador</option>
                                    </select>
                                    <button type="submit" className="btn-gold" style={{ padding: "0.45rem 1rem", borderRadius: "6px", fontSize: "0.82rem", width: "100%" }} disabled={candidates.length === 0}>
                                      <i className="fa-solid fa-paper-plane" style={{ marginRight: 6 }}></i> Enviar Invitación
                                    </button>
                                  </div>
                                </form>
                              );
                            })()}
                          </>
                        )}

                        {(() => {
                          const pending = invitations.filter(inv => inv.senderType === "band" && inv.senderId === band.id);
                          if (pending.length === 0) return null;
                          return (
                            <div style={{ marginTop: "1rem", borderTop: "1px dashed var(--border-color)", paddingTop: "0.8rem" }}>
                              <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>Invitaciones Pendientes:</span>
                              <div style={{ display: "flex", flexDirection: "column", gap: "4px", marginTop: "6px" }}>
                                {pending.map(inv => {
                                  const receiver = people.find(p => p.id === inv.receiverPersonId);
                                  return (
                                    <div key={inv.id} style={{ fontSize: "0.8rem", color: "var(--text-muted)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                      <span>✉️ {receiver ? receiver.name : `Persona #${inv.receiverPersonId}`} <span style={{ fontSize: "0.72rem", color: "var(--text-gold)" }}>({inv.role})</span></span>
                                      <span style={{ fontStyle: "italic", fontSize: "0.75rem" }}>Enviada</span>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
