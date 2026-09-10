"use client";

import { useState, useMemo, useEffect } from "react";
import { useApp } from "../../../context/AppContext";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import PostList from "../../../components/PostList";
import SocialFeedPublisher from "../../../components/SocialFeedPublisher";
import BrandQRModal from "../../../components/BrandQRModal";

const DEFAULT_USER_AVATAR = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 128 128'%3E%3Crect width='128' height='128' fill='%23E5E7EB'/%3E%3Cpath d='M64 24a24 24 0 100 48 24 24 0 000-48zM32 104a32 32 0 100-48 24 24 0 000-48z' fill='%239CA3AF'/%3E%3C/svg%3E";

export default function BandProfileClient({ initialBand }) {
  const routeParams = useParams();
  const slug = routeParams?.slug || "";

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
    editProfileOpen,
    editProfileId,
    editBrandDesign,
    setEditBrandDesign,
    editThemeColor,
    parseDescription,
    handleDeleteBand,
    loadBands,
    loadPeople,
    loadFairs,
    loadInvitations,
    getBrandPalette
  } = useApp();

  const router = useRouter();

  const [activeTab, setActiveTab] = useState("vitrina");
  const [showQrModal, setShowQrModal] = useState(false);
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
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  useEffect(() => {
    loadBands();
    loadPeople();
    loadFairs();
    loadInvitations();
  }, [loadBands, loadPeople, loadFairs, loadInvitations]);

  // Lock background scroll when any modal is open
  useEffect(() => {
    const isModalOpen = showFairs || showCollabs || showQrModal;
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
  }, [showFairs, showCollabs, showQrModal]);

  const isNumeric = /^\d+$/.test(slug);
  const [bandId, setBandId] = useState(null);

  const band = useMemo(() => {
    const updatedFromContext = (bands && bands.length > 0) ? bands.find((b) => {
      if (bandId && b.id === bandId) return true;
      if (initialBand && (b.id === initialBand.id || (b.slug && initialBand.slug && b.slug.toLowerCase() === initialBand.slug.toLowerCase()))) return true;
      if (isNumeric) return b.id === Number(slug) || b.slug === slug;
      return b.slug === slug;
    }) : null;
    if (updatedFromContext) return updatedFromContext;
    return initialBand || null;
  }, [initialBand, bands, bandId, isNumeric, slug]);

  useEffect(() => {
    if (band && !bandId) {
      setBandId(band.id);
    }
  }, [band, bandId]);

  const totalMembers = band?.collaborators ? band.collaborators.length : (band?.members || 1);

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

  if (loading && !band) {
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
        <i className="fa-solid fa-guitar" style={{ fontSize: "3rem", color: "var(--text-muted)", marginBottom: "1rem" }}></i>
        <h2 style={{ fontSize: "1.5rem", fontWeight: 800 }}>Banda no encontrada</h2>
        <p style={{ color: "var(--text-muted)", margin: "0.5rem 0 1.5rem 0" }}>La banda que buscas no existe o ha sido eliminada.</p>
        <button onClick={() => router.push("/bands")} className="btn-gold" style={{ borderRadius: "8px" }}>Volver al Catálogo de Bandas</button>
      </div>
    );
  }

  // Check collaborator role of the logged-in persona
  const isDirectOwner = activePersonId != null && band?.personId != null && Number(band.personId) === Number(activePersonId);
  const userCollaborator = band?.collaborators ? band.collaborators.find(c => Number(c.personId) === Number(activePersonId)) : null;
  const userRole = userCollaborator ? userCollaborator.role : (isDirectOwner ? 'creador_original' : null);
  const isCollaborator = !!userRole || isDirectOwner;
  const canEditProfile = isCollaborator || userRole === 'creador_original' || userRole === 'creador' || userRole === 'gestor' || isDirectOwner;
  const canInvite = userRole === 'creador_original' || userRole === 'creador' || userRole === 'gestor' || isDirectOwner;
  const isOwner = userRole === 'creador_original' || isDirectOwner;

  const copyLink = (e) => {
    e.stopPropagation();
    if (typeof window === "undefined") return;
    const fullUrl = window.location.href;
    navigator.clipboard.writeText(fullUrl);
    alert("¡Enlace de la banda copiado al portapapeles! Listo para compartir.");
  };

  const handleEditClick = () => {
    const parsed = parseDescription(band.description);
    if (setEditName) setEditName(band.name);
    if (setEditGenre) setEditGenre(band.genre || "");
    if (setEditMembers) setEditMembers(band.members || 1);
    if (setEditDescription) setEditDescription(parsed.text);
    if (setEditLogo) setEditLogo(band.image || "");
    if (setEditLogoPreview) setEditLogoPreview(band.image || "");
    if (setEditMediaLink) setEditMediaLink(band.mediaLink || "");
    if (setEditProfileType) setEditProfileType("band");
    if (setEditProfileId) setEditProfileId(band.id);
    if (setEditSlug) setEditSlug(band.slug || "");
    if (setEditInstagram) setEditInstagram(parsed.instagram || "");
    if (setEditFacebook) setEditFacebook(parsed.facebook || "");
    if (setEditTiktok) setEditTiktok(parsed.tiktok || "");
    if (setEditWebsite) setEditWebsite(parsed.website || "");
    if (setEditBrandDesign) {
      const activeDesign = (band?.brandDesign && Object.keys(band.brandDesign).length > 0)
        ? band.brandDesign
        : (parsed.brandDesign || {});
      setEditBrandDesign({
        customBgColor: activeDesign.customBgColor || parsed.customBgColor || "",
        bgStyle: activeDesign.bgStyle || parsed.bgStyle || "solid",
        bgImage: activeDesign.bgImage || parsed.bgImage || "",
        logoShape: activeDesign.logoShape || parsed.logoShape || "circle",
        cardStyle: activeDesign.cardStyle || parsed.cardStyle || "glass",
        glowIntensity: activeDesign.glowIntensity !== undefined ? activeDesign.glowIntensity : 70,
        ...activeDesign
      });
    }
    if (setEditProfileOpen) setEditProfileOpen(true);
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

  const parsed = parseDescription(band.description);

  // Paleta de color dinámica basada en el tema de la banda o género musical
  const isEditingThisBand = editProfileOpen && editProfileId === band?.id;
  const effectiveThemeColor = (isEditingThisBand && editThemeColor) ? editThemeColor : (band.themeColor || parsed.theme_color || '');
  const palette = getBrandPalette ? getBrandPalette(parsed, { ...band, themeColor: effectiveThemeColor }) : { c1: "#D4AF37", c2: "#EAB308", c3: "#F97316", c4: "#8B5CF6" };

  // Personalización visual completa del perfil
  const dbDesign = (band.brandDesign && Object.keys(band.brandDesign).length > 0)
    ? band.brandDesign
    : (parsed.brandDesign || {});

  const design = (isEditingThisBand && editBrandDesign && Object.keys(editBrandDesign).length > 0)
    ? editBrandDesign
    : {
        customBgColor: dbDesign.customBgColor || parsed.customBgColor || "",
        bgStyle: dbDesign.bgStyle || parsed.bgStyle || "solid",
        bgImage: dbDesign.bgImage || parsed.bgImage || "",
        logoShape: dbDesign.logoShape || parsed.logoShape || "circle",
        cardStyle: dbDesign.cardStyle || parsed.cardStyle || "glass",
        glowIntensity: dbDesign.glowIntensity !== undefined ? dbDesign.glowIntensity : 70,
        ...dbDesign
      };

  const bgStyle = design.bgStyle || "solid";
  const customBgColor = design.customBgColor || "";
  const bgImage = design.bgImage || "";
  const logoShape = design.logoShape || "circle";
  const glowIntensity = (design.glowIntensity !== undefined ? design.glowIntensity : 70) / 100;

  const logoBorderRadius = logoShape === "square" ? "0px" : logoShape === "rounded" ? "24px" : "50%";

  let profileBgCss = {};
  if (bgStyle === "image" && bgImage) {
    profileBgCss = {
      backgroundImage: `url(${bgImage})`,
      backgroundSize: "cover",
      backgroundPosition: "center top",
      backgroundRepeat: "no-repeat"
    };
  } else if (bgStyle === "solid" && customBgColor) {
    let resolvedColor = customBgColor;
    if (resolvedColor === "brand") resolvedColor = palette.c1;
    else if (resolvedColor === "brand-soft") resolvedColor = `${palette.c1}15`;
    profileBgCss = { background: resolvedColor };
  } else if (bgStyle === "gradient") {
    profileBgCss = {
      background: `
        radial-gradient(ellipse at 15% 5%, ${palette.c1}${Math.round(40 * glowIntensity).toString(16).padStart(2, '0')} 0%, transparent 55%),
        radial-gradient(ellipse at 85% 15%, ${palette.c2}${Math.round(40 * glowIntensity).toString(16).padStart(2, '0')} 0%, transparent 55%),
        radial-gradient(ellipse at 20% 40%, ${palette.c3}${Math.round(35 * glowIntensity).toString(16).padStart(2, '0')} 0%, transparent 50%),
        radial-gradient(ellipse at 80% 65%, ${palette.c4}${Math.round(35 * glowIntensity).toString(16).padStart(2, '0')} 0%, transparent 50%),
        linear-gradient(180deg, ${palette.c1}12 0%, ${palette.c2}08 25%, ${palette.c3}06 55%, ${palette.c4}10 85%, ${palette.c1}15 100%)
      `
    };
  } else if (bgStyle === "mesh") {
    profileBgCss = {
      background: `
        radial-gradient(at 0% 0%, ${palette.c1}30 0px, transparent 50%),
        radial-gradient(at 100% 0%, ${palette.c2}30 0px, transparent 50%),
        radial-gradient(at 100% 100%, ${palette.c3}25 0px, transparent 50%),
        radial-gradient(at 0% 100%, ${palette.c4}30 0px, transparent 50%)
      `
    };
  } else if (bgStyle === "dots") {
    profileBgCss = {
      background: `radial-gradient(${palette.c1}35 1px, transparent 1px)`,
      backgroundSize: "20px 20px"
    };
  }

  const bandSongs = parsed.songs || [];
  const bandGigs = band.gigs || [];

  const bandTabs = [
    { id: "vitrina", label: "Vitrina & Música", icon: "fa-solid fa-compact-disc" },
    { id: "conciertos", label: "Conciertos & Fechas", icon: "fa-solid fa-guitar", count: bandGigs.length + sortedUpcomingFairs.length },
    { id: "repertorio", label: "Repertorio", icon: "fa-solid fa-music", count: bandSongs.length },
    { id: "muro", label: "Muro Social", icon: "fa-solid fa-newspaper" },
    { id: "integrantes", label: "Integrantes", icon: "fa-solid fa-users", count: totalMembers },
    { id: "ferias", label: "Ferias & Festivales", icon: "fa-solid fa-tent", count: sortedUpcomingFairs.length }
  ];

  return (
    <>
      {/* Background layer */}
      {bgStyle !== "none" && (customBgColor || bgImage || bgStyle === "gradient" || bgStyle === "mesh" || bgStyle === "dots") && (
        <div 
          style={{ 
            position: "fixed", 
            top: 0, 
            left: 0, 
            right: 0, 
            bottom: 0, 
            pointerEvents: "none", 
            zIndex: -1,
            transition: "all 0.3s ease",
            ...profileBgCss
          }} 
        />
      )}

      <div className="container" style={{ maxWidth: "1350px", padding: "1.2rem 1.5rem", position: "relative", minHeight: "100vh" }}>
        
        {/* ── HERO BANNER HEADER ─────────────────────────────────────────────── */}
        <div 
          className="glass-panel" 
          style={{ 
            borderRadius: "24px", 
            overflow: "hidden", 
            marginBottom: "2rem",
            boxShadow: `0 16px 40px -10px ${palette.c1}25`,
            border: `1.5px solid ${palette.c1}35`,
            position: "relative"
          }}
        >
          {/* Top Floating Utility Bar */}
          <div style={{ position: "absolute", top: "16px", right: "16px", zIndex: 10, display: "flex", gap: "10px" }}>
            <button 
              onClick={() => setShowQrModal(true)} 
              className="profile-share-btn" 
              style={{
                background: "rgba(0,0,0,0.55)",
                color: "#FFFFFF",
                backdropFilter: "blur(10px)",
                WebkitBackdropFilter: "blur(10px)",
                border: "1px solid rgba(255,255,255,0.25)",
                width: "42px",
                height: "42px",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                transition: "transform 0.2s"
              }} 
              title="Código QR de la Banda"
            >
              <i className="fa-solid fa-qrcode" style={{ fontSize: "1.1rem" }}></i>
            </button>
            <button 
              onClick={copyLink} 
              className="profile-share-btn" 
              style={{
                background: "rgba(0,0,0,0.55)",
                color: "#FFFFFF",
                backdropFilter: "blur(10px)",
                WebkitBackdropFilter: "blur(10px)",
                border: "1px solid rgba(255,255,255,0.25)",
                width: "42px",
                height: "42px",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                transition: "transform 0.2s"
              }} 
              title="Compartir enlace de la banda"
            >
              <i className="fa-solid fa-share-nodes" style={{ fontSize: "1.1rem" }}></i>
            </button>
            <button 
              onClick={() => router.push("/bands")} 
              style={{
                background: "rgba(0,0,0,0.55)",
                color: "#FFFFFF",
                backdropFilter: "blur(10px)",
                WebkitBackdropFilter: "blur(10px)",
                border: "1px solid rgba(255,255,255,0.25)",
                width: "42px",
                height: "42px",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer"
              }}
              title="Volver al catálogo"
            >
              <i className="fa-solid fa-xmark" style={{ fontSize: "1.2rem" }}></i>
            </button>
          </div>

          {/* Banner Graphic Canvas */}
          <div style={{ position: "relative", height: "260px", width: "100%", overflow: "hidden", background: `linear-gradient(135deg, ${palette.c1}, ${palette.c2})` }}>
            <img 
              src={band.image} 
              alt={band.name} 
              style={{ 
                width: "100%", 
                height: "100%", 
                objectFit: "cover", 
                filter: "brightness(0.7) contrast(1.05)" 
              }} 
            />
            {/* Glossy Gradient Overlay */}
            <div style={{
              position: "absolute",
              inset: 0,
              background: `linear-gradient(180deg, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.4) 60%, rgba(18,18,20,0.95) 100%)`
            }}></div>
          </div>

          {/* Profile Details Container */}
          <div style={{ padding: "0 2rem 2rem 2rem", position: "relative" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: "1.5rem", marginTop: "-70px", marginBottom: "1.5rem" }}>
              
              {/* Avatar Emblem with Dynamic Ring */}
              <div style={{ display: "flex", alignItems: "flex-end", gap: "1.5rem", flexWrap: "wrap" }}>
                <div style={{
                  width: "135px",
                  height: "135px",
                  borderRadius: logoBorderRadius,
                  overflow: "hidden",
                  border: `3.5px solid ${palette.c1}`,
                  boxShadow: `0 12px 28px ${palette.c1}45`,
                  background: "#18181B",
                  flexShrink: 0,
                  position: "relative",
                  zIndex: 5
                }}>
                  <img src={band.image} alt={band.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                </div>

                <div style={{ marginBottom: "0.2rem" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap", marginBottom: "4px" }}>
                    <span style={{ 
                      fontSize: "0.75rem", 
                      fontWeight: 900, 
                      color: palette.c1, 
                      background: `${palette.c1}20`, 
                      border: `1px solid ${palette.c1}50`, 
                      padding: "3px 10px", 
                      borderRadius: "14px",
                      letterSpacing: "0.06em",
                      textTransform: "uppercase"
                    }}>
                      🎸 {band.genre || "Banda de Música"}
                    </span>

                    <span style={{ 
                      fontSize: "0.75rem", 
                      fontWeight: 800, 
                      color: "var(--text-muted)", 
                      background: "rgba(255,255,255,0.08)", 
                      border: "1px solid var(--border-color)", 
                      padding: "3px 10px", 
                      borderRadius: "14px",
                      display: "flex",
                      alignItems: "center",
                      gap: "5px"
                    }}>
                      <i className="fa-solid fa-users" style={{ color: palette.c1 }}></i>
                      <span>{totalMembers} Integrantes</span>
                    </span>

                    <span style={{ fontSize: "0.85rem", color: palette.c1, display: "flex", alignItems: "center" }} title="Banda Verificada Oficial">
                      <i className="fa-solid fa-circle-check"></i>
                    </span>
                  </div>

                  <h1 style={{ fontSize: "2.3rem", fontWeight: 900, letterSpacing: "-0.02em", margin: "4px 0", color: "var(--text-primary)" }}>
                    {band.name}
                  </h1>

                  {/* Redes Sociales Pill Row */}
                  {(() => {
                    const hasSocials = parsed.instagram || parsed.facebook || parsed.tiktok || parsed.website || band.mediaLink;
                    if (!hasSocials) return null;
                    return (
                      <div style={{ display: "flex", gap: "12px", alignItems: "center", marginTop: "8px", flexWrap: "wrap" }}>
                        {parsed.instagram && (
                          <a 
                            href={`https://instagram.com/${parsed.instagram.trim().replace(/^@/, '')}`} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            style={{ color: "#E1306C", fontSize: "1.25rem", transition: "transform 0.2s", textDecoration: "none" }}
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
                            style={{ color: "#1877F2", fontSize: "1.25rem", transition: "transform 0.2s", textDecoration: "none" }}
                            onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.2)"}
                            onMouseLeave={(e) => e.currentTarget.style.transform = "none"}
                            title="Facebook"
                          >
                            <i className="fa-brands fa-facebook"></i>
                          </a>
                        )}
                        {parsed.tiktok && (
                          <a 
                            href={`https://tiktok.com/@${parsed.tiktok.trim().replace(/^@/, '')}`} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            style={{ color: "var(--text-primary)", fontSize: "1.25rem", transition: "transform 0.2s", textDecoration: "none" }}
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
                            style={{ color: palette.c1, fontSize: "1.25rem", transition: "transform 0.2s", textDecoration: "none" }}
                            onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.2)"}
                            onMouseLeave={(e) => e.currentTarget.style.transform = "none"}
                            title="Sitio Web"
                          >
                            <i className="fa-solid fa-globe"></i>
                          </a>
                        )}
                        {band.mediaLink && (
                          <a 
                            href={band.mediaLink} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            style={{ color: "#1DB954", fontSize: "1.25rem", transition: "transform 0.2s", textDecoration: "none" }}
                            onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.2)"}
                            onMouseLeave={(e) => e.currentTarget.style.transform = "none"}
                            title="Escuchar Música en Spotify / Plataforma"
                          >
                            <i className="fa-brands fa-spotify"></i>
                          </a>
                        )}
                      </div>
                    );
                  })()}
                </div>
              </div>

              {/* Quick Action Buttons */}
              <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
                {isOwner && (
                  <button
                    onClick={() => setShowFairs(true)}
                    className="btn-gold"
                    style={{ padding: "0.55rem 1.1rem", borderRadius: "12px", fontSize: "0.88rem", fontWeight: 800, display: "inline-flex", alignItems: "center", gap: "8px" }}
                  >
                    <i className="fa-solid fa-paper-plane"></i> Postular a Ferias
                  </button>
                )}

                {canEditProfile && (
                  <button
                    onClick={handleEditClick}
                    className="btn-outline-gold"
                    style={{ padding: "0.55rem 1.1rem", borderRadius: "12px", fontSize: "0.88rem", fontWeight: 800, display: "inline-flex", alignItems: "center", gap: "8px" }}
                  >
                    <i className="fa-solid fa-gear"></i> Editar Perfil
                  </button>
                )}

                {userRole === 'creador_original' && (
                  <button
                    onClick={async () => {
                      if (await handleDeleteBand(band.id)) {
                        router.push("/bands");
                      }
                    }}
                    style={{ padding: "0.55rem 1rem", borderRadius: "12px", fontSize: "0.85rem", fontWeight: 700, display: "inline-flex", alignItems: "center", gap: "6px", color: "#ef4444", borderColor: "#ef4444", background: "transparent", border: "1px solid #ef4444", cursor: "pointer" }}
                  >
                    <i className="fa-solid fa-trash"></i> Eliminar
                  </button>
                )}
              </div>
            </div>

            {/* Tagline or Brief Intro */}
            {parsed.text && (
              <p style={{ fontSize: "0.98rem", color: "var(--text-primary)", lineHeight: 1.6, margin: "0.8rem 0 0 0", maxWidth: "900px" }}>
                {parsed.text}
              </p>
            )}
          </div>

          {/* ── BARRA DE PESTAÑAS NAVEGABLES ──────────────────────────────────── */}
          <div style={{ borderTop: "1px solid var(--border-color)", background: "rgba(0,0,0,0.05)", padding: "0 1.5rem" }}>
            <div style={{ display: "flex", gap: "8px", overflowX: "auto", scrollbarWidth: "none", padding: "0.6rem 0" }}>
              {bandTabs.map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    style={{
                      background: isActive ? `linear-gradient(135deg, ${palette.c1}, ${palette.c2})` : "transparent",
                      color: isActive ? "#1C1C1E" : "var(--text-muted)",
                      border: isActive ? `1px solid ${palette.c1}` : "1px solid transparent",
                      padding: "0.55rem 1.1rem",
                      borderRadius: "14px",
                      fontSize: "0.88rem",
                      fontWeight: 800,
                      cursor: "pointer",
                      whiteSpace: "nowrap",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "8px",
                      transition: "all 0.2s ease",
                      boxShadow: isActive ? `0 4px 14px ${palette.c1}35` : "none"
                    }}
                  >
                    <i className={tab.icon} style={{ fontSize: "0.95rem" }}></i>
                    <span>{tab.label}</span>
                    {tab.count !== undefined && tab.count > 0 && (
                      <span style={{
                        fontSize: "0.72rem",
                        fontWeight: 900,
                        background: isActive ? "rgba(0,0,0,0.2)" : "var(--bg-input)",
                        color: isActive ? "#1C1C1E" : palette.c1,
                        padding: "2px 7px",
                        borderRadius: "10px",
                        marginLeft: "2px"
                      }}>
                        {tab.count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── PESTAÑA 1: VITRINA & MÚSICA ────────────────────────────────────── */}
        {activeTab === "vitrina" && (
          <div className="fade-in" style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
            
            {/* Show Highlights / Purple spotlight if event is coming in next week */}
            {nearestFairInNextWeek && (
              <div 
                style={{
                  background: "linear-gradient(135deg, rgba(88, 28, 135, 0.95) 0%, rgba(107, 33, 168, 0.95) 100%)",
                  border: "2px solid #a855f7",
                  borderRadius: "20px",
                  padding: "1.8rem",
                  boxShadow: "0 12px 30px -5px rgba(168, 85, 247, 0.45)",
                  color: "#FFFFFF",
                  position: "relative",
                  overflow: "hidden"
                }} 
              >
                <i className="fa-solid fa-star" style={{ position: "absolute", right: "-15px", bottom: "-25px", fontSize: "8rem", color: "rgba(255, 255, 255, 0.05)", transform: "rotate(15deg)", pointerEvents: "none" }}></i>
                
                <div style={{ position: "relative", zIndex: 2 }}>
                  <span style={{
                    background: "#a855f7",
                    color: "#FFFFFF",
                    fontSize: "0.75rem",
                    fontWeight: 900,
                    textTransform: "uppercase",
                    padding: "4px 12px",
                    borderRadius: "20px",
                    display: "inline-block",
                    marginBottom: "0.8rem",
                    letterSpacing: "0.08em",
                    boxShadow: "0 2px 10px rgba(168, 85, 247, 0.6)"
                  }}>
                    ⚡ ¡Próximo Show esta semana!
                  </span>
                  <h3 style={{ fontSize: "1.45rem", fontWeight: 900, margin: 0, color: "#FFFFFF" }}>
                    La banda se presenta en la feria: <span style={{ color: "#e9d5ff" }}>{nearestFairInNextWeek.name}</span>
                  </h3>
                  <p style={{ margin: "0.5rem 0 0", fontSize: "1.05rem", color: "rgba(255,255,255,0.9)" }}>
                    Horario: <strong>{nearestFairInNextWeek.time}</strong>
                  </p>
                  
                  <div style={{ display: "flex", gap: "16px", marginTop: "1.2rem", fontSize: "0.88rem", flexWrap: "wrap", borderTop: "1px solid rgba(255,255,255,0.18)", paddingTop: "1rem" }}>
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
                    <Link href={`/fairs/${nearestFairInNextWeek.slug || nearestFairInNextWeek.id}`} className="btn-gold" style={{ textDecoration: "none", borderRadius: "10px", display: "inline-flex", alignItems: "center", gap: "8px", background: "#FFFFFF", color: "#6b21a8", border: "none", padding: "0.55rem 1.3rem", fontWeight: 800 }}>
                      Ver Detalles de la Feria <i className="fa-solid fa-arrow-right"></i>
                    </Link>
                  </div>
                </div>
              </div>
            )}

            {/* Main Featured Music Player Showcase */}
            <div className="glass-panel" style={{ padding: "1.8rem", borderRadius: "20px", border: `1.5px solid ${palette.c1}35` }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.2rem", flexWrap: "wrap", gap: "1rem" }}>
                <h2 style={{ fontSize: "1.3rem", fontWeight: 900, margin: 0, display: "flex", alignItems: "center", gap: "10px" }}>
                  <i className="fa-solid fa-compact-disc" style={{ color: palette.c1, fontSize: "1.4rem" }}></i>
                  <span>Música Destacada & Presentaciones</span>
                </h2>
                {band.mediaLink && (
                  <a 
                    href={band.mediaLink} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="btn-gold" 
                    style={{ padding: "0.45rem 1rem", borderRadius: "10px", fontSize: "0.82rem", textDecoration: "none", fontWeight: 800, display: "inline-flex", alignItems: "center", gap: "6px" }}
                  >
                    <i className="fa-solid fa-play"></i> Abrir en Plataforma
                  </a>
                )}
              </div>

              <div style={{
                background: `linear-gradient(135deg, ${palette.c1}15 0%, ${palette.c2}10 100%)`,
                borderRadius: "16px",
                padding: "1.5rem",
                border: `1px solid ${palette.c1}30`,
                display: "flex",
                alignItems: "center",
                gap: "1.5rem",
                flexWrap: "wrap"
              }}>
                <div style={{
                  width: "100px",
                  height: "100px",
                  borderRadius: "16px",
                  overflow: "hidden",
                  boxShadow: `0 8px 20px ${palette.c1}30`,
                  border: `2px solid ${palette.c1}`,
                  flexShrink: 0,
                  position: "relative"
                }}>
                  <img src={band.image} alt={band.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  <button 
                    onClick={() => {
                      if (band.mediaLink) {
                        window.open(band.mediaLink, "_blank");
                      } else {
                        setIsPlayingAudio(!isPlayingAudio);
                      }
                    }}
                    style={{
                      position: "absolute",
                      inset: 0,
                      background: "rgba(0,0,0,0.45)",
                      border: "none",
                      color: "#FFFFFF",
                      fontSize: "1.8rem",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      transition: "transform 0.2s"
                    }}
                  >
                    <i className={`fa-solid ${isPlayingAudio ? "fa-pause" : "fa-play"}`}></i>
                  </button>
                </div>

                <div style={{ flex: 1, minWidth: "220px" }}>
                  <span style={{ fontSize: "0.72rem", fontWeight: 900, textTransform: "uppercase", color: palette.c1, letterSpacing: "0.08em" }}>
                    En Vivo / Pista Principal
                  </span>
                  <h3 style={{ fontSize: "1.2rem", fontWeight: 900, margin: "2px 0 6px 0", color: "var(--text-primary)" }}>
                    {band.name} — Presentaciones en Escenario
                  </h3>
                  <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", margin: 0, lineHeight: 1.5 }}>
                    {bandSongs.length > 0 ? `Repertorio activo de ${bandSongs.length} temas en concierto` : "Escucha la propuesta sonora y temas de la banda en plataformas streaming."}
                  </p>

                  {/* Animated Waveform Graphic */}
                  <div style={{ display: "flex", gap: "4px", alignItems: "flex-end", height: "24px", marginTop: "10px" }}>
                    {[40, 75, 55, 90, 60, 80, 45, 95, 70, 50, 85, 65, 40, 75, 60].map((h, i) => (
                      <span 
                        key={i} 
                        style={{ 
                          width: "3px", 
                          height: isPlayingAudio ? `${h}%` : "30%", 
                          background: palette.c1, 
                          borderRadius: "3px",
                          transition: "height 0.3s ease" 
                        }} 
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Bio & Details Grid */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "1.5rem" }}>
              
              {/* About Card */}
              <div className="glass-panel" style={{ padding: "1.5rem", borderRadius: "18px" }}>
                <h3 style={{ fontSize: "1.1rem", fontWeight: 800, margin: "0 0 1rem 0", display: "flex", alignItems: "center", gap: "8px" }}>
                  <i className="fa-solid fa-align-left" style={{ color: palette.c1 }}></i> Biografía & Propuesta
                </h3>
                <p style={{ fontSize: "0.9rem", color: "var(--text-primary)", lineHeight: 1.6, margin: 0 }}>
                  {parsed.text || "Esta banda aún no ha agregado una biografía extensa en su perfil público."}
                </p>
              </div>

              {/* Upcoming Gigs Quick Summary */}
              <div className="glass-panel" style={{ padding: "1.5rem", borderRadius: "18px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                  <h3 style={{ fontSize: "1.1rem", fontWeight: 800, margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
                    <i className="fa-solid fa-calendar-days" style={{ color: palette.c1 }}></i> Próximos Conciertos
                  </h3>
                  <button onClick={() => setActiveTab("conciertos")} style={{ background: "none", border: "none", color: palette.c1, fontWeight: 800, fontSize: "0.8rem", cursor: "pointer" }}>
                    Ver Todos ({bandGigs.length + sortedUpcomingFairs.length})
                  </button>
                </div>

                {(bandGigs.length > 0 || sortedUpcomingFairs.length > 0) ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    {sortedUpcomingFairs.slice(0, 2).map(f => (
                      <div key={`fair-preview-${f.id}`} style={{ background: "var(--bg-input)", padding: "10px 14px", borderRadius: "10px", border: "1px solid var(--border-color)", fontSize: "0.85rem" }}>
                        <div style={{ fontWeight: 800, color: "var(--text-primary)" }}>Feria {f.name}</div>
                        <div style={{ color: "var(--text-muted)", fontSize: "0.78rem", marginTop: "2px" }}>📅 {f.date} • 🕒 {f.time}</div>
                      </div>
                    ))}
                    {bandGigs.slice(0, 2).map((gig, idx) => (
                      <div key={`gig-preview-${idx}`} style={{ background: "var(--bg-input)", padding: "10px 14px", borderRadius: "10px", border: "1px solid var(--border-color)", fontSize: "0.85rem" }}>
                        <div style={{ fontWeight: 700, color: "var(--text-primary)" }}>🎸 {gig}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", margin: 0 }}>No hay fechas confirmadas en este momento.</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── PESTAÑA 2: CONCIERTOS & FECHAS ─────────────────────────────────── */}
        {activeTab === "conciertos" && (
          <div className="fade-in" style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            <div className="glass-panel" style={{ padding: "1.8rem", borderRadius: "20px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.2rem", flexWrap: "wrap", gap: "1rem" }}>
                <h3 style={{ fontSize: "1.25rem", fontWeight: 800, margin: 0, display: "flex", alignItems: "center", gap: "10px" }}>
                  <i className="fa-solid fa-guitar" style={{ color: palette.c1 }}></i>
                  Conciertos & Agenda de Presentaciones
                </h3>
              </div>

              {/* Formulario para agregar Gig si es Owner */}
              {isOwner && (
                <form onSubmit={handleAddGigSubmit} className="gig-form" style={{ marginBottom: "1.8rem" }}>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Ej: 20 Nov 2026 - Arequipa Rock Fest (Estadio Melgar, 8:00 PM)"
                    value={newGig}
                    onChange={(e) => setNewGig(e.target.value)}
                    required
                    disabled={isUpdatingGigs}
                  />
                  <button type="submit" className="btn-gold" style={{ borderRadius: "10px", fontWeight: 800 }} disabled={isUpdatingGigs || !newGig.trim()}>
                    {isUpdatingGigs ? "Agregando..." : "+ Agregar Fecha"}
                  </button>
                </form>
              )}

              {((sortedUpcomingFairs.length > 0) || (bandGigs.length > 0)) ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                  {/* Ferias Agendadas */}
                  {sortedUpcomingFairs.map(f => (
                    <div
                      key={`fair-${f.id}`}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        background: "var(--bg-input)",
                        padding: "1.2rem 1.5rem",
                        borderRadius: "14px",
                        border: `1px solid ${palette.c1}40`,
                        gap: "1rem",
                        flexWrap: "wrap"
                      }}
                    >
                      <div style={{ display: "flex", gap: "14px", alignItems: "center" }}>
                        <div style={{ width: "42px", height: "42px", borderRadius: "10px", background: `${palette.c1}20`, color: palette.c1, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.2rem", flexShrink: 0 }}>
                          <i className="fa-solid fa-calendar-day"></i>
                        </div>
                        <div>
                          <span style={{ fontSize: "0.72rem", fontWeight: 900, textTransform: "uppercase", color: palette.c1, letterSpacing: "0.05em" }}>Presentación Confirmada</span>
                          <h4 style={{ fontSize: "1rem", fontWeight: 800, margin: "2px 0 0 0", color: "var(--text-primary)" }}>
                            Feria {f.name}
                          </h4>
                          <span style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>
                            📅 <strong>{f.date}</strong> a las <strong>{f.time}</strong> • 📍 {f.location || "Arequipa"}
                          </span>
                        </div>
                      </div>

                      <Link href={`/fairs/${f.slug || f.id}`} className="btn-gold" style={{ padding: "0.45rem 1rem", fontSize: "0.8rem", borderRadius: "8px", textDecoration: "none", fontWeight: 800 }}>
                        Ver Feria <i className="fa-solid fa-arrow-right" style={{ marginLeft: "4px" }}></i>
                      </Link>
                    </div>
                  ))}

                  {/* Fechas Manuales */}
                  {bandGigs.map((gig, idx) => (
                    <div
                      key={`gig-${idx}`}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        background: "var(--bg-input)",
                        padding: "1.2rem 1.5rem",
                        borderRadius: "14px",
                        border: "1px solid var(--border-color)",
                        gap: "1rem",
                        flexWrap: "wrap"
                      }}
                    >
                      <div style={{ display: "flex", gap: "14px", alignItems: "center" }}>
                        <div style={{ width: "42px", height: "42px", borderRadius: "10px", background: "rgba(255,255,255,0.06)", color: "var(--text-gold)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.2rem", flexShrink: 0 }}>
                          <i className="fa-solid fa-guitar"></i>
                        </div>
                        <div>
                          <span style={{ fontSize: "0.72rem", fontWeight: 900, textTransform: "uppercase", color: "var(--text-gold)", letterSpacing: "0.05em" }}>Concierto / Show</span>
                          <div style={{ fontSize: "0.95rem", fontWeight: 700, color: "var(--text-primary)", marginTop: "2px" }}>
                            {gig}
                          </div>
                        </div>
                      </div>

                      {isOwner && (
                        <button
                          onClick={() => handleDeleteGig(idx)}
                          style={{ background: "transparent", border: "none", color: "#ef4444", cursor: "pointer", fontWeight: 800, fontSize: "0.85rem" }}
                          disabled={isUpdatingGigs}
                          title="Eliminar Concierto"
                        >
                          <i className="fa-solid fa-trash"></i>
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ textAlign: "center", padding: "3rem 1rem", color: "var(--text-muted)" }}>
                  <i className="fa-solid fa-calendar-xmark" style={{ fontSize: "2.5rem", marginBottom: "0.8rem", opacity: 0.5 }}></i>
                  <p style={{ margin: 0, fontSize: "0.95rem" }}>Próximamente se anunciarán las nuevas fechas para esta banda.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── PESTAÑA 3: REPERTORIO ─────────────────────────────────────────── */}
        {activeTab === "repertorio" && (
          <div className="fade-in" style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            <div className="glass-panel" style={{ padding: "1.8rem", borderRadius: "20px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.2rem", flexWrap: "wrap", gap: "1rem" }}>
                <h3 style={{ fontSize: "1.25rem", fontWeight: 800, margin: 0, display: "flex", alignItems: "center", gap: "10px" }}>
                  <i className="fa-solid fa-music" style={{ color: palette.c1 }}></i>
                  Repertorio Musical & Canciones
                </h3>
              </div>

              {/* Formulario para añadir Canción si es Owner */}
              {isOwner && (
                <form onSubmit={handleAddSongSubmit} className="gig-form" style={{ marginBottom: "1.8rem" }}>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Ej: Arequipa en Vivo (Cover / Tema Propio)"
                    value={newSong}
                    onChange={(e) => setNewSong(e.target.value)}
                    required
                    disabled={isUpdatingSongs}
                  />
                  <button type="submit" className="btn-gold" style={{ borderRadius: "10px", fontWeight: 800 }} disabled={isUpdatingSongs || !newSong.trim()}>
                    {isUpdatingSongs ? "Agregando..." : "+ Agregar Canción"}
                  </button>
                </form>
              )}

              {bandSongs.length > 0 ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.8rem" }}>
                  {bandSongs.map((song, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        background: "var(--bg-input)",
                        padding: "1rem 1.25rem",
                        borderRadius: "12px",
                        border: "1px solid var(--border-color)",
                        gap: "1rem"
                      }}
                    >
                      <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                        <span style={{ fontSize: "0.85rem", fontWeight: 900, color: palette.c1, width: "24px", textAlign: "center" }}>
                          {String(idx + 1).padStart(2, "0")}
                        </span>
                        <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: `${palette.c1}20`, color: palette.c1, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          <i className="fa-solid fa-music" style={{ fontSize: "0.9rem" }}></i>
                        </div>
                        <div>
                          <span style={{ fontSize: "0.92rem", fontWeight: 700, color: "var(--text-primary)" }}>{song}</span>
                        </div>
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        {band.mediaLink && (
                          <a 
                            href={band.mediaLink} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            style={{ color: palette.c1, fontSize: "0.85rem", textDecoration: "none", fontWeight: 800, display: "flex", alignItems: "center", gap: "4px" }}
                          >
                            <i className="fa-solid fa-circle-play"></i> Escuchar
                          </a>
                        )}

                        {isOwner && (
                          <button
                            onClick={() => handleDeleteSong(idx)}
                            style={{ background: "transparent", border: "none", color: "#ef4444", cursor: "pointer", fontWeight: 800 }}
                            disabled={isUpdatingSongs}
                            title="Eliminar Canción"
                          >
                            <i className="fa-solid fa-trash"></i>
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ textAlign: "center", padding: "3rem 1rem", color: "var(--text-muted)" }}>
                  <i className="fa-solid fa-compact-disc" style={{ fontSize: "2.5rem", marginBottom: "0.8rem", opacity: 0.5 }}></i>
                  <p style={{ margin: 0, fontSize: "0.95rem" }}>No se han agregado canciones al repertorio de esta banda.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── PESTAÑA 4: MURO SOCIAL ────────────────────────────────────────── */}
        {activeTab === "muro" && (
          <div className="fade-in" style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            {canEditProfile && (
              <SocialFeedPublisher profileType="band" profileId={band.id} />
            )}
            <PostList profileType="band" profileId={band.id} />
          </div>
        )}

        {/* ── PESTAÑA 5: INTEGRANTES ────────────────────────────────────────── */}
        {activeTab === "integrantes" && (
          <div className="fade-in" style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            <div className="glass-panel" style={{ padding: "1.8rem", borderRadius: "20px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", flexWrap: "wrap", gap: "1rem" }}>
                <h3 style={{ fontSize: "1.25rem", fontWeight: 800, margin: 0, display: "flex", alignItems: "center", gap: "10px" }}>
                  <i className="fa-solid fa-users" style={{ color: palette.c1 }}></i>
                  Integrantes & Músicos de Escenario
                </h3>
                {isOwner && (
                  <button 
                    onClick={() => setShowCollabs(true)} 
                    className="btn-outline-gold" 
                    style={{ padding: "0.45rem 1rem", borderRadius: "10px", fontSize: "0.82rem", fontWeight: 800 }}
                  >
                    <i className="fa-solid fa-user-plus" style={{ marginRight: "6px" }}></i> Administrar e Invitar
                  </button>
                )}
              </div>

              {band.collaborators && band.collaborators.length > 0 ? (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "1.2rem" }}>
                  {band.collaborators.map((c) => {
                    const p = people.find(person => person.id === c.personId);
                    if (!p) return null;
                    return (
                      <Link 
                        key={p.id}
                        href={`/people/${p.username || p.id}`}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "14px",
                          textDecoration: "none",
                          padding: "1rem 1.2rem",
                          background: "var(--bg-input)",
                          borderRadius: "16px",
                          border: "1px solid var(--border-color)",
                          transition: "all 0.2s ease"
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.borderColor = palette.c1}
                        onMouseLeave={(e) => e.currentTarget.style.borderColor = "var(--border-color)"}
                      >
                        <img 
                          src={p.logo || DEFAULT_USER_AVATAR} 
                          alt={p.name} 
                          style={{ width: "48px", height: "48px", borderRadius: "50%", objectFit: "cover", border: `2px solid ${palette.c1}` }} 
                        />
                        <div>
                          <div style={{ color: "var(--text-primary)", fontWeight: 800, fontSize: "0.95rem" }}>
                            {p.name}
                          </div>
                          <div style={{ color: palette.c1, fontSize: "0.78rem", fontWeight: 700, marginTop: "2px" }}>
                            @{p.username || p.id} • <span style={{ textTransform: "capitalize" }}>{c.role || "Integrante"}</span>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              ) : (
                <div style={{ textAlign: "center", padding: "2.5rem 1rem", color: "var(--text-muted)" }}>
                  <i className="fa-solid fa-users-slash" style={{ fontSize: "2.5rem", marginBottom: "0.8rem", opacity: 0.5 }}></i>
                  <p style={{ margin: 0, fontSize: "0.95rem" }}>No se han vinculado integrantes registrados aún a esta banda.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── PESTAÑA 6: FERIAS & FESTIVALES ────────────────────────────────── */}
        {activeTab === "ferias" && (
          <div className="fade-in" style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            <div className="glass-panel" style={{ padding: "1.8rem", borderRadius: "20px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", flexWrap: "wrap", gap: "1rem" }}>
                <h3 style={{ fontSize: "1.25rem", fontWeight: 800, margin: 0, display: "flex", alignItems: "center", gap: "10px" }}>
                  <i className="fa-solid fa-tent" style={{ color: palette.c1 }}></i>
                  Ferias & Festivales Confirmados
                </h3>
                {isOwner && (
                  <button 
                    onClick={() => setShowFairs(true)} 
                    className="btn-gold" 
                    style={{ padding: "0.45rem 1rem", borderRadius: "10px", fontSize: "0.82rem", fontWeight: 800 }}
                  >
                    <i className="fa-solid fa-paper-plane" style={{ marginRight: "6px" }}></i> Postular a Nueva Feria
                  </button>
                )}
              </div>

              {sortedUpcomingFairs.length > 0 ? (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "1.2rem" }}>
                  {sortedUpcomingFairs.map(f => (
                    <div 
                      key={`fair-tab-${f.id}`}
                      style={{
                        background: "var(--bg-input)",
                        padding: "1.2rem 1.4rem",
                        borderRadius: "16px",
                        border: `1.5px solid ${palette.c1}35`,
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "space-between",
                        gap: "1rem"
                      }}
                    >
                      <div>
                        <span style={{ fontSize: "0.72rem", fontWeight: 900, textTransform: "uppercase", color: palette.c1, letterSpacing: "0.06em" }}>
                          Feria Confirmada
                        </span>
                        <h4 style={{ fontSize: "1.1rem", fontWeight: 800, margin: "4px 0 6px 0", color: "var(--text-primary)" }}>
                          {f.name}
                        </h4>
                        <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", display: "flex", flexDirection: "column", gap: "4px" }}>
                          <span>📅 Date: <strong>{f.date}</strong></span>
                          <span>🕒 Time: <strong>{f.time}</strong></span>
                          {f.location && <span>📍 Lugar: {f.location}</span>}
                        </div>
                      </div>

                      <Link href={`/fairs/${f.slug || f.id}`} className="btn-outline-gold" style={{ padding: "0.45rem 1rem", fontSize: "0.8rem", borderRadius: "8px", textDecoration: "none", fontWeight: 800, textAlign: "center" }}>
                        Ver Feria Completa <i className="fa-solid fa-arrow-right" style={{ marginLeft: "4px" }}></i>
                      </Link>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ textAlign: "center", padding: "3rem 1rem", color: "var(--text-muted)" }}>
                  <i className="fa-solid fa-tent-arrow-turn-left" style={{ fontSize: "2.5rem", marginBottom: "0.8rem", opacity: 0.5 }}></i>
                  <p style={{ margin: 0, fontSize: "0.95rem" }}>Esta banda aún no tiene presentaciones en ferias locales registradas.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── MODALS RENDERIZADOS A NIVEL RAÍZ DEL COMPONENTE ────────────────── */}

        {/* 1. Modal QR Code Sharing */}
        <BrandQRModal
          isOpen={showQrModal}
          onClose={() => setShowQrModal(false)}
          brand={band}
          profileType="band"
        />

        {/* 2. Modal de postulación a ferias */}
        {isOwner && showFairs && (
          <div className="modal-overlay" style={{ zIndex: 1100 }}>
            <div className="modal-backdrop" onClick={() => setShowFairs(false)}></div>
            <div className="modal-panel fade-in" style={{ maxWidth: "550px", background: "#FFFFFF", border: "1.5px solid var(--gold-primary)", padding: 0 }}>
              <div className="modal-header">
                <h3 style={{ fontSize: "1.2rem", fontWeight: 800, margin: 0 }}>
                  <i className="fa-solid fa-paper-plane" style={{ color: "var(--gold-primary)", marginRight: 8 }}></i> Postular Banda a Ferias
                </h3>
                <button 
                  onClick={() => setShowFairs(false)} 
                  style={{ background: "rgba(0,0,0,0.04)", border: "none", fontSize: "1.2rem", cursor: "pointer", width: "32px", height: "32px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}
                >
                  &times;
                </button>
              </div>
              <form onSubmit={(e) => handleApplyToFair(e, "band", band.id)} className="apply-fair-form modal-body">
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

        {/* 3. Modal de integrantes de la banda */}
        {isOwner && showCollabs && (
          <div className="modal-overlay" style={{ zIndex: 1100 }}>
            <div className="modal-backdrop" onClick={() => setShowCollabs(false)}></div>
            <div className="modal-panel fade-in" style={{ maxWidth: "750px", background: "#FFFFFF", border: "1.5px solid var(--gold-primary)", padding: 0 }}>
              <div className="modal-header">
                <h3 style={{ fontSize: "1.2rem", fontWeight: 800, margin: 0 }}>
                  <i className="fa-solid fa-users" style={{ color: "var(--gold-primary)", marginRight: 8 }}></i> Integrantes de la Banda
                </h3>
                <button 
                  onClick={() => setShowCollabs(false)} 
                  style={{ background: "rgba(0,0,0,0.04)", border: "none", fontSize: "1.2rem", cursor: "pointer", width: "32px", height: "32px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}
                >
                  &times;
                </button>
              </div>
              
              <div className="collab-grid modal-body">
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
                          <div key={p.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "var(--bg-input)", padding: "0.5rem 0.75rem", borderRadius: "8px", gap: "10px" }}>
                            <div onClick={() => { router.push(`/people/${p.username || p.id}`); setShowCollabs(false); }} style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
                              <img src={p.logo || DEFAULT_USER_AVATAR} alt={p.name} style={{ width: "28px", height: "28px", borderRadius: "50%", objectFit: "cover" }} />
                              <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
                                <span style={{ fontSize: "0.85rem", fontWeight: 700, textDecoration: "underline" }}>{p.name}</span>
                                <span style={{ fontSize: "0.78rem", color: "var(--text-gold)", fontWeight: 700 }}>@{p.username || p.id}</span>
                                <span style={{ fontSize: "0.70rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.05em" }}>({c.role})</span>
                              </div>
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

                        const cleanQ = personSearchQuery.toLowerCase().trim().replace(/^@/, '');
                        const filteredCandidates = candidates.filter(p => {
                          if (!cleanQ) return true;
                          const pName = (p.name || '').toLowerCase();
                          const pUser = (p.username || '').toLowerCase();
                          const pOcc = (p.occupation || '').toLowerCase();
                          return pName.includes(cleanQ) || pUser.includes(cleanQ) || pOcc.includes(cleanQ);
                        });

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
                                  placeholder="Buscar por nombre o @usuario..."
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
                                      maxHeight: "180px", overflowY: "auto", zIndex: 1000, marginTop: "4px"
                                    }}
                                  >
                                    {filteredCandidates.map(p => (
                                      <div
                                        key={p.id}
                                        onClick={() => {
                                          setSelectedPersonId(p.id.toString());
                                          setPersonSearchQuery(`${p.name} (@${p.username || p.id})`);
                                          setShowPersonDropdown(false);
                                        }}
                                        style={{
                                          padding: "0.6rem 1rem", cursor: "pointer",
                                          transition: "background 0.2s", fontSize: "0.85rem",
                                          borderBottom: "1px solid rgba(0,0,0,0.04)",
                                          display: "flex", alignItems: "center", gap: "10px",
                                          color: "var(--text-primary)"
                                        }}
                                        onMouseEnter={(e) => e.currentTarget.style.background = "var(--bg-input)"}
                                        onMouseLeave={(e) => e.currentTarget.style.background = "none"}
                                      >
                                        <img src={p.logo || DEFAULT_USER_AVATAR} alt={p.name} style={{ width: "26px", height: "26px", borderRadius: "50%", objectFit: "cover" }} />
                                        <div style={{ display: "flex", flexDirection: "column", lineHeight: "1.2" }}>
                                          <div>
                                            <strong>{p.name}</strong>
                                            <span style={{ color: "var(--text-gold)", fontSize: "0.8rem", fontWeight: 700, marginLeft: "6px" }}>@{p.username || p.id}</span>
                                          </div>
                                          {p.occupation && <span style={{ color: "var(--text-muted)", fontSize: "0.75rem", marginTop: "2px" }}>{p.occupation}</span>}
                                        </div>
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
    </>
  );
}
