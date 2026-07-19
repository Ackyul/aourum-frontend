"use client";

import { use, useState, useMemo, useEffect } from "react";
import { useApp } from "../../../context/AppContext";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function BandProfileClient({ params, initialBand }) {
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
    parseDescription,
    handleDeleteBand,
    loadBands,
    loadPeople,
    loadFairs,
    loadInvitations
  } = useApp();

  const router = useRouter();

  useEffect(() => {
    loadBands();
    loadPeople();
    loadFairs();
    loadInvitations();
  }, [loadBands, loadPeople, loadFairs, loadInvitations]);
  const [newGig, setNewGig] = useState("");
  const [isUpdatingGigs, setIsUpdatingGigs] = useState(false);
  const [newSong, setNewSong] = useState("");
  const [isUpdatingSongs, setIsUpdatingSongs] = useState(false);
  const [showFairs, setShowFairs] = useState(false);
  const [showCollabs, setShowCollabs] = useState(false);
  const [fairSearchQuery, setFairSearchQuery] = useState("");
  const [showFairDropdown, setShowFairDropdown] = useState(false);
  const [personSearchQuery, setPersonSearchQuery] = useState("");
  const [showPersonDropdown, setShowPersonDropdown] = useState(false);
  const [selectedPersonId, setSelectedPersonId] = useState("");

  // Lock background scroll when any modal is open
  useEffect(() => {
    const isModalOpen = showFairs || showCollabs;
    if (isModalOpen) {
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
  }, [showFairs, showCollabs]);

  const isNumeric = /^\d+$/.test(slug);
  const [bandId, setBandId] = useState(null);

  const band = initialBand || bands.find((b) => {
    if (bandId) return b.id === bandId;
    if (isNumeric) {
      return b.id === Number(slug) || b.slug === slug;
    }
    return b.slug === slug;
  });

  useEffect(() => {
    if (band && !bandId) {
      setBandId(band.id);
    }
  }, [band, bandId]);

  const totalMembers = band?.collaborators ? band.collaborators.length : 1;

  // Redirect from numeric ID or changed slug to current slug-based URL
  useEffect(() => {
    if (band && band.slug && (isNumeric || band.slug !== slug)) {
      router.replace(`/bands/${band.slug}`);
    }
  }, [band, isNumeric, slug, router]);

  const filteredFairs = useMemo(() => {
    const bandFairs = fairs.filter(f => {
      const parsed = parseDescription(f.description);
      const fType = parsed.fair_type || "both";
      return fType === "both" || fType === "only_bands";
    });
    if (!fairSearchQuery.trim()) return bandFairs;
    return bandFairs.filter(f => f.name.toLowerCase().includes(fairSearchQuery.toLowerCase()));
  }, [fairs, fairSearchQuery, parseDescription]);

  // ── LOGICA DE PRESENTACION DE FERIAS Y REPERTORIO ──
  const parsedFairs = useMemo(() => {
    if (!band) return [];
    return fairs
      .filter(f => f.acceptedBands && f.acceptedBands.map(Number).includes(Number(band.id)))
      .map(f => {
        let parsedDate = null;
        if (f.date) {
          const yyyymmdd = f.date.match(/(\d{4})-(\d{2})-(\d{2})/);
          if (yyyymmdd) {
            parsedDate = new Date(Number(yyyymmdd[1]), Number(yyyymmdd[2]) - 1, Number(yyyymmdd[3]));
          } else {
            const parsedTs = Date.parse(f.date);
            if (!isNaN(parsedTs)) {
              parsedDate = new Date(parsedTs);
            } else {
              try {
                const normalized = f.date.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
                const months = {
                  enero: 0, febrero: 1, marzo: 2, abril: 3, mayo: 4, junio: 5,
                  julio: 6, agosto: 7, septiembre: 8, setiembre: 8, octubre: 9,
                  noviembre: 10, diciembre: 11
                };
                let monthIndex = null;
                for (const [name, index] of Object.entries(months)) {
                  if (normalized.includes(name)) {
                    monthIndex = index;
                    break;
                  }
                }
                if (monthIndex !== null) {
                  const numbers = normalized.match(/\d+/g);
                  if (numbers) {
                    let year = new Date().getFullYear();
                    let day = null;
                    for (const numStr of numbers) {
                      const val = Number(numStr);
                      if (val >= 2000 && val <= 2100) {
                        year = val;
                      } else if (val >= 1 && val <= 31) {
                        day = val;
                      }
                    }
                    if (day !== null) {
                      parsedDate = new Date(year, monthIndex, day);
                    }
                  }
                }
              } catch (e) {}
            }
          }
        }
        return { ...f, parsedDate };
      });
  }, [fairs, band?.id]);

  const sortedUpcomingFairs = useMemo(() => {
    const today = new Date();
    today.setHours(0,0,0,0);
    return parsedFairs
      .filter(f => f.parsedDate !== null && f.parsedDate >= today)
      .sort((a, b) => a.parsedDate - b.parsedDate);
  }, [parsedFairs]);

  const nearestFairInNextWeek = useMemo(() => {
    const today = new Date();
    today.setHours(0,0,0,0);
    const oneWeekLater = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    oneWeekLater.setHours(23,59,59,999);
    return sortedUpcomingFairs.find(f => f.parsedDate >= today && f.parsedDate <= oneWeekLater);
  }, [sortedUpcomingFairs]);

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

  const isOwner = userRole === 'creador_original';

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

  const handleAddSongSubmit = async (e) => {
    e.preventDefault();
    if (!newSong.trim()) return;
    setIsUpdatingSongs(true);
    const parsed = parseDescription(band.description);
    const updatedSongs = [...(parsed.songs || []), newSong.trim()];
    const updatedDescription = JSON.stringify({
      ...parsed,
      songs: updatedSongs
    });
    try {
      const response = await fetch(`${API_URL}/api/bands/${band.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: band.name,
          genre: band.genre,
          members: band.members,
          description: updatedDescription,
          image: band.image,
          mediaLink: band.mediaLink,
          gigs: band.gigs
        })
      });
      if (response.ok) {
        triggerNotification(true, "🎵 ¡Nueva canción agregada al repertorio!");
        setNewSong("");
        fetchData();
      } else {
        triggerNotification(false, "No se pudo agregar la canción.");
      }
    } catch (err) {
      triggerNotification(false, "Error de red al intentar agregar canción.");
    } finally {
      setIsUpdatingSongs(false);
    }
  };

  const handleDeleteSong = async (songIndex) => {
    if (!confirm("¿Seguro que deseas remover esta canción del repertorio?")) return;
    setIsUpdatingSongs(true);
    const parsed = parseDescription(band.description);
    const updatedSongs = (parsed.songs || []).filter((_, idx) => idx !== songIndex);
    const updatedDescription = JSON.stringify({
      ...parsed,
      songs: updatedSongs
    });
    try {
      const response = await fetch(`${API_URL}/api/bands/${band.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: band.name,
          genre: band.genre,
          members: band.members,
          description: updatedDescription,
          image: band.image,
          mediaLink: band.mediaLink,
          gigs: band.gigs
        })
      });
      if (response.ok) {
        triggerNotification(true, "Canción removida correctamente.");
        fetchData();
      } else {
        triggerNotification(false, "No se pudo remover la canción.");
      }
    } catch (err) {
      triggerNotification(false, "Error de red al intentar remover la canción.");
    } finally {
      setIsUpdatingSongs(false);
    }
  };


  return (
    <div className="container" style={{ maxWidth: "1000px", padding: "0 1rem" }}>
      <head>
        <title>{`${band.name} | AOURUM`}</title>
        <meta name="description" content={band.description ? band.description.substring(0, 160) : `Conoce el perfil, integrantes y canciones de ${band.name} en AOURUM, el nodo central del talento local.`} />
        <meta property="og:title" content={`${band.name} | AOURUM`} />
        <meta property="og:description" content={band.description ? band.description.substring(0, 160) : `Conoce a ${band.name} en AOURUM.`} />
        <meta property="og:image" content={band.image || "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=1200&q=80"} />
        <link rel="canonical" href={`https://aourum.com/bands/${band.slug || band.id}`} />
      </head>
      <div className="glass-panel" style={{ position: "relative", overflow: "hidden", borderRadius: "16px" }}>
        <button onClick={() => router.push("/bands")} className="profile-close-btn" style={{ position: "absolute", top: "15px", right: "15px", zIndex: 10 }}>&times;</button>
        <button onClick={copyLink} className="profile-share-btn" style={{ position: "absolute", top: "15px", right: "60px", zIndex: 10 }} title="Copiar enlace de la banda">
          <i className="fa-solid fa-share-nodes"></i>
        </button>
        
        <div className="profile-header-banner banner-tall">
          <img src={band.image} alt={band.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        </div>

        <div className="profile-body">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem" }}>
            <div>
              <span style={{ fontSize: "0.8rem", color: "var(--text-gold)", textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.08em" }}>{band.genre}</span>
              <h2 style={{ fontSize: "1.8rem", fontWeight: 800, marginTop: "0.2rem", letterSpacing: "-0.015em" }}>{band.name}</h2>
              <p style={{ fontSize: "0.9rem", color: "var(--text-muted)", marginTop: "0.3rem", display: "flex", alignItems: "center", gap: "6px" }}>
                <i className="fa-solid fa-users"></i>
                <span>{totalMembers} Integrantes en Escenario</span>
              </p>
            </div>

             <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
               {userRole === 'creador_original' && (
                 <button
                   onClick={async () => {
                     if (await handleDeleteBand(band.id)) {
                       router.push("/bands");
                     }
                   }}
                   className="btn-outline-gold"
                   style={{ padding: "0.5rem 1rem", borderRadius: "8px", fontSize: "0.85rem", fontWeight: 700, display: "flex", alignItems: "center", gap: "6px", color: "#ef4444", borderColor: "#ef4444", background: "transparent", cursor: "pointer" }}
                 >
                   <i className="fa-solid fa-trash"></i> Eliminar Banda
                 </button>
               )}
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

          {/* Caso 2: Cuadro morado llamativo para show en 1 semana */}
          {nearestFairInNextWeek && (
            <div style={{
              background: "linear-gradient(135deg, rgba(88, 28, 135, 0.9) 0%, rgba(107, 33, 168, 0.9) 100%)",
              border: "2px solid #a855f7",
              borderRadius: "16px",
              padding: "1.8rem",
              marginBottom: "2.2rem",
              boxShadow: "0 10px 25px -5px rgba(168, 85, 247, 0.4)",
              color: "#FFFFFF",
              position: "relative",
              overflow: "hidden"
            }} className="fade-in">
              <i className="fa-solid fa-star" style={{ position: "absolute", right: "-10px", bottom: "-20px", fontSize: "7rem", color: "rgba(255, 255, 255, 0.05)", transform: "rotate(15deg)", pointerEvents: "none" }}></i>
              
              <div style={{ position: "relative", zIndex: 2 }}>
                <span style={{
                  background: "#a855f7",
                  color: "#FFFFFF",
                  fontSize: "0.75rem",
                  fontWeight: 800,
                  textTransform: "uppercase",
                  padding: "4px 10px",
                  borderRadius: "20px",
                  display: "inline-block",
                  marginBottom: "0.8rem",
                  letterSpacing: "0.08em",
                  boxShadow: "0 2px 8px rgba(168, 85, 247, 0.5)"
                }}>
                  ⚡ ¡Próximo Show esta semana!
                </span>
                <h3 style={{ fontSize: "1.4rem", fontWeight: 800, margin: 0, color: "#FFFFFF" }}>
                  La banda se presenta en la feria: <span style={{ color: "#e9d5ff" }}>{nearestFairInNextWeek.name}</span>
                </h3>
                <p style={{ margin: "0.5rem 0 0", fontSize: "1.05rem", color: "rgba(255,255,255,0.9)" }}>
                  Horario: <strong>{nearestFairInNextWeek.time}</strong>
                </p>
                
                <div style={{ display: "flex", gap: "16px", marginTop: "1.2rem", fontSize: "0.85rem", flexWrap: "wrap", borderTop: "1px solid rgba(255,255,255,0.15)", paddingTop: "1rem" }}>
                  <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <i className="fa-solid fa-calendar-day"></i> {nearestFairInNextWeek.date}
                  </span>
                  {nearestFairInNextWeek.location && (
                    <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <i className="fa-solid fa-location-dot"></i> {nearestFairInNextWeek.location}
                    </span>
                  )}
                </div>
                
                <div style={{ marginTop: "1.2rem" }}>
                  <Link href={`/fairs/${nearestFairInNextWeek.slug || nearestFairInNextWeek.id}`} className="btn-gold" style={{ textDecoration: "none", borderRadius: "8px", display: "inline-flex", alignItems: "center", gap: "6px", background: "#FFFFFF", color: "#6b21a8", border: "none", padding: "0.5rem 1.2rem", fontWeight: 700 }}>
                    Ver Detalles de la Feria <i className="fa-solid fa-arrow-right"></i>
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* Sección 1: Repertorio de Canciones */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.2rem", flexWrap: "wrap", gap: "1rem" }}>
            <h3 style={{ fontSize: "1.2rem", fontWeight: 800, margin: 0 }}>
              <i className="fa-solid fa-music" style={{ color: "var(--gold-primary)", marginRight: 8 }}></i>
              Repertorio de Canciones
            </h3>
          </div>

          {/* Formulario para añadir Canción si es Owner */}
          {isOwner && (
            <form onSubmit={handleAddSongSubmit} className="gig-form" style={{ marginBottom: "1.5rem" }}>
              <input
                type="text"
                className="form-control"
                placeholder="Ej: Arequipa Rock (Cover / Tema Propio)"
                value={newSong}
                onChange={(e) => setNewSong(e.target.value)}
                required
                disabled={isUpdatingSongs}
              />
              <button type="submit" className="btn-gold" style={{ borderRadius: "8px" }} disabled={isUpdatingSongs || !newSong.trim()}>
                {isUpdatingSongs ? "Agregando..." : "+ Agregar Canción"}
              </button>
            </form>
          )}

          {(() => {
            const parsed = parseDescription(band.description);
            const songs = parsed.songs || [];
            return songs.length > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.8rem" }}>
                {songs.map((song, idx) => (
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
                      <i className="fa-solid fa-music" style={{ color: "var(--gold-primary)" }}></i>
                      <span>{song}</span>
                    </div>
                    {isOwner && (
                      <button
                        onClick={() => handleDeleteSong(idx)}
                        style={{ background: "transparent", border: "none", color: "#ef4444", cursor: "pointer", fontWeight: 700 }}
                        disabled={isUpdatingSongs}
                        title="Eliminar Canción"
                      >
                        <i className="fa-solid fa-trash"></i>
                      </button>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>No se han agregado canciones al repertorio de esta banda.</p>
            );
          })()}

          <hr style={{ border: 0, borderTop: "1px solid var(--border-color)", margin: "2.2rem 0" }} />

          {/* Sección 2: Conciertos & Fechas Agendadas */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.2rem", flexWrap: "wrap", gap: "1rem" }}>
            <h3 style={{ fontSize: "1.2rem", fontWeight: 800, margin: 0 }}>
              <i className="fa-solid fa-calendar-check" style={{ color: "var(--gold-primary)", marginRight: 8 }}></i>
              Conciertos & Fechas Agendadas
            </h3>
          </div>

          {/* Formulario para añadir Gig si es Owner */}
          {isOwner && (
            <form onSubmit={handleAddGigSubmit} className="gig-form" style={{ marginBottom: "1.5rem" }}>
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

          {((sortedUpcomingFairs.length > 0) || (band.gigs && band.gigs.length > 0)) ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.8rem" }}>
              {/* Presentaciones en ferias confirmadas */}
              {sortedUpcomingFairs.map(f => (
                <div
                  key={`fair-${f.id}`}
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
                    <i className="fa-solid fa-calendar-day" style={{ color: "var(--gold-primary)" }}></i>
                    <span><strong>{f.date}</strong> - Presentación en feria <strong>{f.name}</strong> a las {f.time} ({f.location || "Arequipa"})</span>
                  </div>
                  <Link href={`/fairs/${f.slug || f.id}`} className="btn-outline-gold" style={{ padding: "4px 10px", fontSize: "0.75rem", borderRadius: "6px", textDecoration: "none", fontWeight: 700 }}>
                    Ver Feria
                  </Link>
                </div>
              ))}

              {/* Fechas manuales */}
              {band.gigs && band.gigs.map((gig, idx) => (
                <div
                  key={`gig-${idx}`}
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
                <div className="glass-panel" style={{ padding: "1.5rem", marginBottom: "1.5rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }} onClick={() => setShowFairs(true)}>
                    <h3 style={{ fontSize: "1.05rem", fontWeight: 800, margin: 0 }}>
                      <i className="fa-solid fa-paper-plane" style={{ color: "var(--gold-primary)", marginRight: 8 }}></i> Postular Banda a Ferias
                    </h3>
                    <button type="button" className="btn-outline-gold" style={{ padding: "4px 12px", fontSize: "0.75rem", borderRadius: "6px", fontWeight: 700 }}>
                      Postular
                    </button>
                  </div>

                  {/* Modal de postulación a ferias se trasladó al final del archivo */}
                </div>
              )}

              {/* Opción 2: Integrantes de la Banda */}
              {isOwner && (
                <div className="glass-panel" style={{ padding: "1.5rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }} onClick={() => setShowCollabs(true)}>
                    <h3 style={{ fontSize: "1.05rem", fontWeight: 800, margin: 0 }}>
                      <i className="fa-solid fa-users" style={{ color: "var(--gold-primary)", marginRight: 8 }}></i> Integrantes de la Banda
                    </h3>
                    <button type="button" className="btn-outline-gold" style={{ padding: "4px 12px", fontSize: "0.75rem", borderRadius: "6px", fontWeight: 700 }}>
                      Administrar
                    </button>
                  </div>

                  {/* Modal de integrantes se trasladó al final del archivo */}
                </div>
              )}
            </>
          )}

          {/* Integrantes Registrados al final */}
          {band.collaborators && band.collaborators.length > 0 && (
            <div style={{ marginTop: "2.2rem", paddingTop: "1.5rem", borderTop: "1px solid var(--border-color)" }}>
              <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--text-gold)", textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: "0.8rem" }}>
                Integrantes registrados:
              </span>
              <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", marginTop: "4px" }}>
                {band.collaborators.map((c) => {
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

      {/* ── VENTANAS SUPERPUESTAS (MODALS) RENDERIZADAS A NIVEL DE RAÍZ DEL COMPONENTE ── */}
      {/* 1. Modal de postulación a ferias */}
      {isOwner && showFairs && (
        <div className="modal-overlay" style={{ zIndex: 1100 }}>
          <div className="modal-backdrop" onClick={() => setShowFairs(false)}></div>
          <div className="modal-panel fade-in" style={{ maxWidth: "550px", width: "90%", padding: "2rem", background: "#FFFFFF", borderRadius: "12px", border: "1.5px solid var(--gold-primary)", position: "relative" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
              <h3 style={{ fontSize: "1.2rem", fontWeight: 800, margin: 0 }}>
                <i className="fa-solid fa-paper-plane" style={{ color: "var(--gold-primary)", marginRight: 8 }}></i> Postular Banda a Ferias
              </h3>
              <button 
                onClick={() => setShowFairs(false)} 
                style={{ background: "rgba(0,0,0,0.04)", border: "none", fontSize: "1.2rem", cursor: "pointer", width: "32px", height: "32px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}
              >
                &times;
              </button>
            </div>
            <form onSubmit={(e) => handleApplyToFair(e, "band", band.id)} className="apply-fair-form">
              <div className="form-group" style={{ marginBottom: "1.5rem", position: "relative" }}>
                <label style={{ fontWeight: 600, fontSize: "0.9rem", display: "block", marginBottom: "0.5rem" }}>Buscar y seleccionar feria del calendario local</label>
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
                
                {showFairDropdown && fairSearchQuery.trim() !== "" && filteredFairs.length > 0 && (
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
              <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
                <button type="button" onClick={() => setShowFairs(false)} className="btn-outline-gold" style={{ padding: "0.5rem 1.2rem", borderRadius: "6px" }}>Cancelar</button>
                <button type="submit" className="btn-gold" style={{ padding: "0.5rem 1.4rem", borderRadius: "6px", fontWeight: 700 }}>Enviar Postulación</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Modal de integrantes de la banda */}
      {isOwner && showCollabs && (
        <div className="modal-overlay" style={{ zIndex: 1100 }}>
          <div className="modal-backdrop" onClick={() => setShowCollabs(false)}></div>
          <div className="modal-panel fade-in" style={{ maxWidth: "750px", width: "90%", padding: "2rem", background: "#FFFFFF", borderRadius: "12px", border: "1.5px solid var(--gold-primary)", maxHeight: "90vh", overflowY: "auto", position: "relative" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
              <h3 style={{ fontSize: "1.2rem", fontWeight: 800, margin: 0 }}>
                <i className="fa-solid fa-users" style={{ color: "var(--gold-primary)", marginRight: 8 }}></i> Integrantes de la Banda
              </h3>
              <button 
                onClick={() => setShowCollabs(false)} 
                style={{ background: "rgba(0,0,0,0.04)", border: "none", fontSize: "1.2rem", cursor: "pointer", width: "32px", height: "32px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}
              >
                &times;
              </button>
            </div>
            
            <div className="collab-grid">
              <div>
                <h4 style={{ fontSize: "0.95rem", fontWeight: 700, marginBottom: "0.8rem", color: "var(--text-gold)" }}>Miembros Vinculados</h4>
                {band.collaborators && band.collaborators.length === 0 ? (
                  <p style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>No hay colaboradores adicionales.</p>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    {band.collaborators && band.collaborators.map(c => {
                      const p = people.find(person => person.id === c.personId);
                      if (!p) return null;
                      const isThisCollaboratorOriginalCreator = c.role === 'creador_original';
                      return (
                        <div key={p.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "var(--bg-input)", padding: "0.5rem", borderRadius: "6px", gap: "10px" }}>
                          <div onClick={() => { router.push(`/people/${p.username || p.id}`); setShowCollabs(false); }} style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
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
                    <h4 style={{ fontSize: "0.95rem", fontWeight: 700, marginBottom: "0.8rem", color: "var(--text-gold)" }}>Invitar Integrante</h4>
                    {(() => {
                      const linkedIds = (band.collaborators || []).map(c => c.personId);
                      const pendingReceiverIds = invitations.filter(inv => inv.senderType === "band" && inv.senderId === band.id).map(inv => inv.receiverPersonId);
                      const candidates = people.filter(p => !linkedIds.includes(p.id) && !pendingReceiverIds.includes(p.id));

                      const filteredCandidates = candidates.filter(p => 
                        p.name.toLowerCase().includes(personSearchQuery.toLowerCase()) || 
                        (p.username && p.username.toLowerCase().includes(personSearchQuery.toLowerCase())) ||
                        (p.occupation && p.occupation.toLowerCase().includes(personSearchQuery.toLowerCase()))
                      );

                      return (
                        <form onSubmit={(e) => {
                          e.preventDefault();
                          const receiverId = Number(e.target.elements.invitePerson.value);
                          const inviteRole = e.target.elements.inviteRole.value;
                          if (!receiverId || !inviteRole) return;
                          sendInvitation("band", band.id, band.name, receiverId, inviteRole);
                          setPersonSearchQuery("");
                          setSelectedPersonId("");
                        }}>
                          <div style={{ display: "flex", flexDirection: "column", gap: "8px", position: "relative" }}>
                            <input type="hidden" name="invitePerson" value={selectedPersonId} />
                            <div style={{ position: "relative" }}>
                              <input
                                type="text"
                                className="form-control"
                                placeholder="Escribe el nombre para buscar..."
                                value={personSearchQuery}
                                onChange={(e) => {
                                  setPersonSearchQuery(e.target.value);
                                  setShowPersonDropdown(true);
                                }}
                                onFocus={() => setShowPersonDropdown(true)}
                                onBlur={() => setTimeout(() => setShowPersonDropdown(false), 200)}
                                required
                              />
                              {personSearchQuery && (
                                <button 
                                  type="button" 
                                  onClick={() => { setPersonSearchQuery(""); setSelectedPersonId(""); setShowPersonDropdown(false); }}
                                  style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", fontSize: "1.1rem" }}
                                >
                                  &times;
                                </button>
                              )}

                              {showPersonDropdown && personSearchQuery.trim() !== "" && filteredCandidates.length > 0 && (
                                <div 
                                  style={{
                                    position: "absolute", top: "100%", left: 0, right: 0,
                                    background: "var(--bg-card)", border: "1px solid var(--border-color)",
                                    borderRadius: "8px", boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
                                    maxHeight: "160px", overflowY: "auto", zIndex: 1000, marginTop: "4px"
                                  }}
                                >
                                  {filteredCandidates.map(p => (
                                    <div
                                      key={p.id}
                                      onClick={() => {
                                        setSelectedPersonId(p.id.toString());
                                        setPersonSearchQuery(p.name + (p.occupation ? ` (${p.occupation})` : ""));
                                        setShowPersonDropdown(false);
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
                                      <strong>{p.name}</strong> {p.occupation && <span style={{ color: "var(--text-muted)", fontSize: "0.78rem", marginLeft: "6px" }}>({p.occupation})</span>}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>

                            <select name="inviteRole" className="form-control" style={{ fontSize: "0.85rem" }} required>
                              <option value="colaborador">Colaborador</option>
                              <option value="gestor">Gestor</option>
                              <option value="creador">Creador</option>
                            </select>
                            <button type="submit" className="btn-gold" style={{ padding: "0.45rem 1rem", borderRadius: "6px", fontSize: "0.82rem", width: "100%" }} disabled={candidates.length === 0 || !selectedPersonId}>
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
        </div>
      )}
    </div>
  );
}
