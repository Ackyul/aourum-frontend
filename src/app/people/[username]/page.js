"use client";

import { use } from "react";
import { useApp } from "../../../context/AppContext";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function PersonProfilePage({ params }) {
  const unwrappedParams = use(params);
  const usernameParam = unwrappedParams.username;

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
    setEditProfileOpen
  } = useApp();

  const router = useRouter();

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "6rem 0" }}>
        <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: "2.5rem", color: "var(--gold-primary)" }}></i>
        <p style={{ color: "var(--text-muted)", marginTop: "10px" }}>Cargando perfil...</p>
      </div>
    );
  }

  const person = people.find((p) => {
    if (p.username && p.username.toLowerCase() === usernameParam.toLowerCase()) {
      return true;
    }
    if (/^\d+$/.test(usernameParam) && p.id === Number(usernameParam)) {
      return true;
    }
    return false;
  });

  if (!person) {
    return (
      <div className="container" style={{ textAlign: "center", padding: "4rem 0" }}>
        <h3>Persona no encontrada</h3>
        <button onClick={() => router.push("/")} className="btn-gold" style={{ marginTop: "1rem" }}>Volver al Inicio</button>
      </div>
    );
  }

  const isOwner = Number(activePersonId) === person.id;

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
    setEditName(person.name);
    setEditUsername(person.username || "");
    setEditOwner("");
    setEditCategory("");
    setEditDescription(person.description || "");
    setEditLogo(person.logo || "");
    setEditLogoPreview(person.logo || "");
    setEditGenre("");
    setEditMembers("");
    setEditOccupation(person.occupation || "");
    setEditMediaLink("");
    setEditBrandIds(person.brandIds || []);
    setEditOrganizerIds(person.organizerIds || []);
    setEditBandIds(person.bandIds || []);
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
                <h2 className="person-name-heading" style={{ fontSize: "2.2rem", fontWeight: 800, marginTop: person.occupation ? "0.8rem" : "0", letterSpacing: "-0.02em" }}>{person.name}</h2>
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
            <p style={{ fontSize: "0.95rem", color: "var(--text-primary)", lineHeight: 1.65, margin: 0 }}>{person.description || "Esta persona no ha escrito una biografía todavía."}</p>
          </div>

          
          {isOwner && (
            <div style={{ display: "flex", flexDirection: "column", gap: "2rem", marginBottom: "2.5rem" }}>
              
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

              
              <div className="glass-panel" style={{ padding: "1.5rem" }}>
                <h3 style={{ fontSize: "1.05rem", fontWeight: 800, marginBottom: "0.8rem", display: "flex", alignItems: "center", gap: 8 }}>
                  <i className="fa-solid fa-plus-circle" style={{ color: "var(--gold-primary)" }}></i> ¿Tienes un nuevo proyecto propio?
                </h3>
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
            </div>
          )}

          <hr style={{ border: 0, borderTop: "1px solid var(--border-color)", margin: "2.2rem 0" }} />

          <h3 style={{ fontSize: "1.3rem", fontWeight: 800, marginBottom: "1.8rem", color: "var(--text-primary)", display: "flex", alignItems: "center", gap: 10 }}>
            <i className="fa-solid fa-link" style={{ color: "var(--gold-primary)" }}></i> Proyectos y Afiliaciones
          </h3>

          <div className="projects-grid">
            
            <div>
              <h4 style={{ fontSize: "1.05rem", fontWeight: 800, marginBottom: "1rem", color: "var(--text-primary)", display: "flex", alignItems: "center", gap: 8 }}>
                <i className="fa-solid fa-store" style={{ color: "var(--gold-primary)" }}></i> Marcas
              </h4>
              {relatedBrands.length === 0 ? (
                <p style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>No tiene marcas vinculadas.</p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.8rem" }}>
                  {relatedBrands.map((b) => (
                    <Link 
                      href={`/brands/${b.slug || b.id}`} 
                      key={b.id} 
                      style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: "12px", padding: "0.8rem", background: "var(--bg-input)", borderRadius: "8px", border: "1px solid var(--border-color)", transition: "transform 0.2s" }}
                      className="glass-panel-hover"
                    >
                      <img src={b.logo} alt={b.name} style={{ width: "40px", height: "40px", borderRadius: "50%", objectFit: "cover", border: "1px solid var(--border-color)" }} />
                      <div>
                        <strong style={{ fontSize: "0.88rem", color: "var(--text-primary)", display: "block" }}>{b.name}</strong>
                        <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>{b.category}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            
            <div>
              <h4 style={{ fontSize: "1.05rem", fontWeight: 800, marginBottom: "1rem", color: "var(--text-primary)", display: "flex", alignItems: "center", gap: 8 }}>
                <i className="fa-solid fa-guitar" style={{ color: "var(--gold-primary)" }}></i> Bandas
              </h4>
              {relatedBands.length === 0 ? (
                <p style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>No pertenece a ninguna banda.</p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.8rem" }}>
                  {relatedBands.map((b) => (
                    <Link 
                      href={`/bands/${b.slug || b.id}`} 
                      key={b.id} 
                      style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: "12px", padding: "0.8rem", background: "var(--bg-input)", borderRadius: "8px", border: "1px solid var(--border-color)" }}
                      className="glass-panel-hover"
                    >
                      <img src={b.image} alt={b.name} style={{ width: "40px", height: "40px", borderRadius: "50%", objectFit: "cover", border: "1px solid var(--border-color)" }} />
                      <div>
                        <strong style={{ fontSize: "0.88rem", color: "var(--text-primary)", display: "block" }}>{b.name}</strong>
                        <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>{b.genre}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            
            <div>
              <h4 style={{ fontSize: "1.05rem", fontWeight: 800, marginBottom: "1rem", color: "var(--text-primary)", display: "flex", alignItems: "center", gap: 8 }}>
                <i className="fa-solid fa-calendar-days" style={{ color: "var(--gold-primary)" }}></i> Ferias organizadas
              </h4>
              {relatedFairs.length === 0 ? (
                <p style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>No tiene ferias organizadas.</p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.8rem" }}>
                  {relatedFairs.map((f) => (
                    <Link 
                      href={`/fairs/${f.slug || f.id}`} 
                      key={f.id} 
                      style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: "12px", padding: "0.8rem", background: "var(--bg-input)", borderRadius: "8px", border: "1px solid var(--border-color)" }}
                      className="glass-panel-hover"
                    >
                      <img src={f.banner} alt={f.name} style={{ width: "50px", height: "36px", borderRadius: "6px", objectFit: "cover", border: "1px solid var(--border-color)" }} />
                      <div>
                        <strong style={{ fontSize: "0.88rem", color: "var(--text-primary)", display: "block" }}>{f.name}</strong>
                        <span style={{ fontSize: "0.72rem", color: "var(--gold-dark)", fontWeight: 600 }}>{f.date}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
