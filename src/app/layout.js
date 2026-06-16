"use client";

import { useState, useEffect, useRef } from "react";
import { Inter } from "next/font/google";
import "./globals.css";
import { AppContextProvider, useApp } from "../context/AppContext";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import Script from "next/script";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

function AppLayoutShell({ children }) {
  const {
    activeRole, setActiveRole,
    loading,
    errorMsg, successMsg,
    showRegModal, setShowRegModal,
    showLoginModal, setShowLoginModal,
    loginEmail, setLoginEmail,
    loginPassword, setLoginPassword,
    loginLoading,
    handleLogin,
    regType, setRegType,
    regName, setRegName,
    regUsername, setRegUsername,
    regEmail, setRegEmail,
    regPassword, setRegPassword,
    regOwner, setRegOwner,
    regCategory, setRegCategory,
    regOccupation, setRegOccupation,
    regDescription, setRegDescription,
    regLocation, setRegLocation,
    regDate, setRegDate,
    regTime, setRegTime,
    regGenre, setRegGenre,
    regMembers, setRegMembers,
    regLogo, setRegLogo,
    regLogoPreview, setRegLogoPreview,
    editProfileOpen, setEditProfileOpen,
    editProfileType, setEditProfileType,
    editProfileId, setEditProfileId,
    editName, setEditName,
    editUsername, setEditUsername,
    editOwner, setEditOwner,
    editCategory, setEditCategory,
    editOccupation, setEditOccupation,
    editGenre, setEditGenre,
    editMembers, setEditMembers,
    editDescription, setEditDescription,
    editLogo, setEditLogo,
    editLogoPreview, setEditLogoPreview,
    editMediaLink, setEditMediaLink,
    editSlug, setEditSlug,
    editWhatsappNumber, setEditWhatsappNumber,
    editInstagram, setEditInstagram,
    editFacebook, setEditFacebook,
    editTiktok, setEditTiktok,
    editWebsite, setEditWebsite,
    editRubroGeneral, setEditRubroGeneral,
    editRubroEspecifico, setEditRubroEspecifico,
    editHasLocal, setEditHasLocal,
    editLocalAddress, setEditLocalAddress,
    editLocalLat, setEditLocalLat,
    editLocalLng, setEditLocalLng,
    editBrandIds, setEditBrandIds,
    editOrganizerIds, setEditOrganizerIds,
    editBandIds, setEditBandIds,
    uploadingEdit, setUploadingEdit,
    uploadingReg, setUploadingReg,
    uploadImage,
    handleAccountRegistration,
    handleEditProfileSubmit,
    triggerNotification,
    activeBrandId, setActiveBrandId,
    activeOrganizerId, setActiveOrganizerId,
    activeBandId, setActiveBandId,
    activePersonId, setActivePersonId,
    brands, organizers, bands, people,
    searchTerm, setSearchTerm,
    getCurrentBrand, getCurrentOrganizer, getCurrentBand, getCurrentPerson,
    forgotPassword,
    logout
  } = useApp();

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const [activeEditTab, setActiveEditTab] = useState("basic");

  useEffect(() => {
    if (editProfileOpen) {
      setActiveEditTab("basic");
    }
  }, [editProfileOpen]);

  const localMapContainerRef = useRef(null);
  const localLeafletMapRef = useRef(null);
  const localMarkerRef = useRef(null);

  useEffect(() => {
    if (!editProfileOpen || editProfileType !== "brand" || activeEditTab !== "local" || !editHasLocal || !localMapContainerRef.current) {
      if (localLeafletMapRef.current) {
        localLeafletMapRef.current.remove();
        localLeafletMapRef.current = null;
        localMarkerRef.current = null;
      }
      return;
    }
    if (localLeafletMapRef.current) return;

    const initLocalMap = () => {
      if (!localMapContainerRef.current || typeof window === "undefined" || !window.L) return;

      const L = window.L;
      delete L.Icon.Default.prototype._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      const lat = editLocalLat || -16.39889;
      const lng = editLocalLng || -71.53694;

      const eMap = L.map(localMapContainerRef.current, { zoomControl: false }).setView([lat, lng], 14);
      localLeafletMapRef.current = eMap;

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; OpenStreetMap',
        maxZoom: 19,
      }).addTo(eMap);

      const marker = L.marker([lat, lng], { draggable: true }).addTo(eMap);
      localMarkerRef.current = marker;

      marker.on("dragend", () => {
        const position = marker.getLatLng();
        setEditLocalLat(position.lat);
        setEditLocalLng(position.lng);
      });

      eMap.on("click", (e) => {
        const { lat, lng } = e.latlng;
        marker.setLatLng([lat, lng]);
        setEditLocalLat(lat);
        setEditLocalLng(lng);
      });

      L.control.zoom({ position: "bottomright" }).addTo(eMap);
    };

    const timer = setTimeout(initLocalMap, 300);
    return () => {
      clearTimeout(timer);
      if (localLeafletMapRef.current) {
        localLeafletMapRef.current.remove();
        localLeafletMapRef.current = null;
        localMarkerRef.current = null;
      }
    };
  }, [editProfileOpen, editProfileType, activeEditTab, editHasLocal]);

  const [loginPasswordVisible, setLoginPasswordVisible] = useState(false);
  const [regPasswordVisible, setRegPasswordVisible] = useState(false);

  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);

  const [accountDropdownOpen, setAccountDropdownOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  const renderAccountBtnContent = () => {
    if (!activePersonId) return <span>Iniciar Sesión</span>;
    const p = getCurrentPerson();
    return p ? (
      <>
        <img src={p.logo} alt="logo" style={{ width: "20px", height: "20px", borderRadius: "50%", objectFit: "cover", border: "1px solid var(--gold-primary)" }} />
        <span>{p.name}</span>
      </>
    ) : <span>Mi Cuenta</span>;
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>

      {/* ── HEADER ─────────────────────────────────────────────────────────── */}
      <header>
        <div className="header-inner">
          
          {/* Logo */}
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: "10px", textDecoration: "none", flexShrink: 0 }}>
            <div style={{ background: "var(--gold-gradient)", width: "36px", height: "36px", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 12px rgba(212,175,55,0.2)", flexShrink: 0 }}>
              <span style={{ color: "#1C1C1E", fontFamily: "'Cinzel', serif", fontWeight: 800, fontSize: "1.2rem" }}>A</span>
            </div>
            <div className="hide-on-mobile">
              <h1 className="brand-logo" style={{ fontSize: "1.25rem", margin: 0 }}>AOURUM</h1>
              <span style={{ display: "block", fontSize: "0.58rem", color: "var(--text-muted)", letterSpacing: "0.1rem", textTransform: "uppercase", fontWeight: 600 }}>Mercado Virtual</span>
            </div>
            <span className="show-on-mobile" style={{ fontFamily: "'Cinzel', serif", fontWeight: 800, fontSize: "1.1rem", color: "var(--text-primary)", letterSpacing: "0.05em" }}>AOURUM</span>
          </Link>

          {/* Search bar */}
          <div className="header-search">
            <i className="fa-solid fa-magnifying-glass search-icon"></i>
            <input 
              type="text"
              placeholder="Buscar..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Nav links (desktop only) + account button */}
          <nav style={{ display: "flex", gap: "0.6rem", alignItems: "center", flexShrink: 0 }} className="header-right">
            {/* Desktop nav links */}
            <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }} className="header-nav-links">
              {[
                { href: "/", icon: "fa-compass", label: "Descubre" },
                { href: "/brands", icon: "fa-store", label: "Marcas" },
                { href: "/fairs", icon: "fa-calendar-days", label: "Ferias" },
                { href: "/bands", icon: "fa-guitar", label: "Música" },
              ].map(({ href, icon, label }) => (
                <Link
                  key={href}
                  href={href}
                  style={{
                    background: pathname === href ? "rgba(212, 175, 55, 0.08)" : "transparent",
                    border: pathname === href ? "1px solid rgba(212, 175, 55, 0.25)" : "1px solid transparent",
                    color: pathname === href ? "var(--gold-dark)" : "var(--text-muted)",
                    padding: "0.4rem 0.75rem",
                    borderRadius: "20px",
                    fontWeight: pathname === href ? 700 : 500,
                    textDecoration: "none",
                    fontSize: "0.84rem",
                    transition: "var(--transition-smooth)",
                    display: "flex",
                    alignItems: "center",
                    gap: "5px"
                  }}
                >
                  <i className={`fa-solid ${icon}`} style={{ fontSize: "0.88rem" }}></i>
                  {label}
                </Link>
              ))}
              {mounted && activePersonId && (
                <Link
                  href={`/people/${getCurrentPerson()?.username || activePersonId}`}
                  style={{
                    background: pathname.startsWith('/people/') ? "var(--gold-gradient)" : "rgba(214,175,55,0.06)",
                    border: "1px solid rgba(214,175,55,0.35)",
                    padding: "0.4rem 0.75rem",
                    borderRadius: "20px",
                    color: pathname.startsWith('/people/') ? "#1C1C1E" : "var(--gold-dark)",
                    fontWeight: 700,
                    textDecoration: "none",
                    fontSize: "0.82rem",
                    transition: "var(--transition-smooth)",
                    display: "flex",
                    alignItems: "center",
                    gap: "5px"
                  }}
                >
                  <i className="fa-solid fa-circle-user" style={{ fontSize: "0.88rem" }}></i>
                  Mi Perfil
                </Link>
              )}
              {mounted && activePersonId && <span style={{ width: "1px", height: "18px", background: "var(--border-color)" }}></span>}
            </div>

            {/* Account button (always visible) */}
            <div style={{ position: "relative" }}>
              <button 
                id="account-popover-trigger"
                onClick={() => setAccountDropdownOpen(!accountDropdownOpen)}
                className={(mounted && activePersonId) ? "btn-outline-gold" : "btn-gold"}
                style={{
                  borderRadius: "20px",
                  padding: "0.4rem 0.9rem",
                  fontSize: "0.82rem",
                  display: "flex",
                  alignItems: "center",
                  gap: "7px",
                  border: "1.5px solid var(--gold-primary)",
                  cursor: "pointer",
                  fontWeight: 700,
                  background: !(mounted && activePersonId) ? "var(--gold-gradient)" : accountDropdownOpen ? "rgba(214,175,55,0.08)" : "transparent",
                  color: !(mounted && activePersonId) ? "#1C1C1E" : undefined,
                  transition: "var(--transition-smooth)",
                  whiteSpace: "nowrap"
                }}
              >
                {(!mounted || !activePersonId)
                  ? <><i className="fa-solid fa-user-circle"></i><span className="hide-on-mobile"> Regístrate · Inicia sesión</span><span className="show-on-mobile" style={{ display: "inline" }}>Entrar</span></>
                  : renderAccountBtnContent()
                }
                {mounted && activePersonId && <i className="fa-solid fa-chevron-down" style={{ fontSize: "0.7rem", opacity: 0.8, transition: "transform 0.3s", transform: accountDropdownOpen ? "rotate(180deg)" : "none" }}></i>}
              </button>

              {/* Popover dropdown */}
              {mounted && accountDropdownOpen && (
                <div 
                  className="glass-panel fade-in"
                  style={{
                    position: "absolute",
                    right: 0,
                    top: "115%",
                    width: "290px",
                    padding: "1.2rem",
                    zIndex: 1000,
                    boxShadow: "0 12px 32px rgba(0,0,0,0.08)",
                    border: "1.5px solid var(--gold-primary)",
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.8rem",
                    background: "#FFFFFF",
                    borderRadius: "12px",
                    textAlign: "left"
                  }}
                >
                  {!activePersonId && (
                    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                      <div style={{ textAlign: "center", paddingBottom: "0.6rem", borderBottom: "1px solid var(--border-color)" }}>
                        <div style={{ width: "44px", height: "44px", background: "var(--gold-gradient)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 0.6rem" }}>
                          <span style={{ color: "#1C1C1E", fontWeight: 900, fontSize: "1.3rem", fontFamily: "serif" }}>A</span>
                        </div>
                        <h3 style={{ fontSize: "1rem", fontWeight: 800, margin: "0 0 3px 0" }}>¡Bienvenido a AOURUM!</h3>
                        <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", margin: 0 }}>El mercado cultural de Arequipa</p>
                      </div>
                      <div>
                        <p style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 6px 0" }}>¿Primera vez aquí?</p>
                        <button onClick={() => { setRegType("person"); setShowRegModal(true); setAccountDropdownOpen(false); }} className="btn-gold" style={{ width: "100%", borderRadius: "8px", padding: "0.6rem", fontSize: "0.85rem", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
                          <i className="fa-solid fa-user-plus"></i> Regístrate
                        </button>
                      </div>
                      <div>
                        <p style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 6px 0" }}>¿Ya tienes cuenta?</p>
                        <button onClick={() => { setShowLoginModal(true); setAccountDropdownOpen(false); }} className="btn-outline-gold" style={{ width: "100%", borderRadius: "8px", padding: "0.6rem", fontSize: "0.85rem", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
                          <i className="fa-solid fa-right-to-bracket"></i> Iniciar Sesión
                        </button>
                      </div>
                    </div>
                  )}
                  {activePersonId && getCurrentPerson() && (
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
                      <div style={{ borderBottom: "1px solid var(--border-color)", paddingBottom: "0.6rem" }}>
                        <h3 style={{ fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--text-gold)", fontWeight: 700, margin: 0 }}><i className="fa-solid fa-user" style={{ marginRight: 6 }}></i>Tu Perfil</h3>
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
                        <h4 style={{ fontSize: "0.88rem", fontWeight: 700, margin: 0 }}>{getCurrentPerson().name}</h4>
                        {getCurrentPerson().occupation && <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", margin: 0 }}><i className="fa-solid fa-id-badge" style={{ marginRight: 6 }}></i>{getCurrentPerson().occupation}</p>}
                        <button onClick={() => { router.push(`/people/${getCurrentPerson()?.username || activePersonId}`); setAccountDropdownOpen(false); }} className="btn-gold" style={{ marginTop: "0.5rem", padding: "0.45rem", fontSize: "0.78rem", borderRadius: "6px", fontWeight: "bold", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
                          <i className="fa-solid fa-user-circle"></i> Ver Mi Perfil
                        </button>
                      </div>
                      <button onClick={() => { logout(); setAccountDropdownOpen(false); router.push("/"); }} style={{ background: "transparent", border: "1px solid rgba(239,68,68,0.3)", color: "#ef4444", borderRadius: "6px", padding: "0.4rem", fontSize: "0.78rem", cursor: "pointer", fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", transition: "var(--transition-smooth)" }}>
                        <i className="fa-solid fa-right-from-bracket"></i> Cerrar Sesión
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </nav>
        </div>
      </header>

      {/* ── MOBILE BOTTOM TAB BAR ───────────────────────────────────────────── */}
      {mounted && (
        <nav className="mobile-tab-bar">
          {[
            { href: "/", icon: "fa-compass", label: "Descubre" },
            { href: "/brands", icon: "fa-store", label: "Marcas" },
            { href: "/fairs", icon: "fa-calendar-days", label: "Ferias" },
            { href: "/bands", icon: "fa-guitar", label: "Música" },
          ].map(({ href, icon, label }) => (
            <Link
              key={href}
              href={href}
              className={`mobile-tab-item${pathname === href ? " active" : ""}`}
            >
              <i className={`fa-solid ${icon}`}></i>
              <span>{label}</span>
            </Link>
          ))}
          {activePersonId ? (
            <Link
              href={`/people/${getCurrentPerson()?.username || activePersonId}`}
              className={`mobile-tab-item${pathname.startsWith('/people/') ? " active" : ""}`}
            >
              <i className="fa-solid fa-circle-user"></i>
              <span>Perfil</span>
            </Link>
          ) : (
            <button
              className="mobile-tab-item"
              onClick={() => setShowLoginModal(true)}
            >
              <i className="fa-solid fa-right-to-bracket"></i>
              <span>Entrar</span>
            </button>
          )}
        </nav>
      )}

      {/* ── MAIN WORKSPACE ─────────────────────────────────────────────────── */}
      <main className="main-workspace" style={{ flex: 1, padding: "2rem 0" }}>
        {children}
      </main>

      {/* ── FOOTER ─────────────────────────────────────────────────────────── */}
      <footer className="site-footer" style={{ background: "#FFFFFF", borderTop: "1px solid var(--border-color)", padding: "2rem 0", marginTop: "4rem", textAlign: "center", fontSize: "0.88rem", color: "var(--text-muted)" }}>
        <div className="container">
          <p>© {new Date().getFullYear()} AOURUM.</p>
          <p style={{ margin: "4px 0 0 0", fontSize: "0.82rem" }}>
            Creado por <a href="https://ackyul.github.io/yoshuanunez.github.io/" target="_blank" rel="noopener noreferrer" style={{ color: "var(--text-primary)", fontWeight: "bold", textDecoration: "underline" }}>Yoshua Josafat Núñez Huaccoto</a> · <a href="https://ackyul.github.io/yoshuanunez.github.io/" target="_blank" rel="noopener noreferrer" style={{ color: "var(--text-gold)", fontWeight: 600, textDecoration: "underline" }}>Ackyul</a>
          </p>
          <span style={{ fontSize: "0.75rem", color: "var(--text-gold)", display: "block", marginTop: "6px", fontWeight: 500 }}>Arequipa, Perú</span>
        </div>
      </footer>

      {/* ── ACCOUNT REGISTRATION MODAL ─────────────────────────────────────── */}
      {showRegModal && (
        <div className="modal-overlay" style={{ zIndex: 1100 }}>
          <div className="modal-backdrop" onClick={() => setShowRegModal(false)}></div>
          <div className="modal-panel fade-in" style={{ maxWidth: "550px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
              <h3 style={{ fontSize: "1.3rem", fontWeight: 800, margin: 0 }}>
                {!activeRole ? "Crear tu Perfil en AOURUM" : "Registrar Nuevo Proyecto"}
              </h3>
              <button onClick={() => setShowRegModal(false)} style={{ background: "rgba(0,0,0,0.04)", border: "none", fontSize: "1.2rem", cursor: "pointer", width: "32px", height: "32px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>&times;</button>
            </div>

            <form onSubmit={handleAccountRegistration}>
              <div className="form-group">
                <label>Nombre de {regType === "brand" ? "la Marca" : regType === "organizer" ? "la Organización" : regType === "band" ? "la Banda Musical" : "la Persona"} *</label>
                <input 
                  type="text" 
                  className="form-control" 
                  placeholder={regType === "brand" ? "Ej: Joyería Luna" : regType === "organizer" ? "Ej: Eventos Rebel" : regType === "band" ? "Ej: Los Rockstars" : "Ej: Juan Pérez"} 
                  value={regName} 
                  onChange={(e) => setRegName(e.target.value)} 
                  required 
                />
              </div>

              {regType === "brand" && (
                <div className="grid-2-to-1">
                  <div className="form-group">
                    <label>Dueño / Fundador *</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      placeholder="Ej: Sofía López" 
                      value={regOwner} 
                      onChange={(e) => setRegOwner(e.target.value)} 
                      required={regType === "brand"}
                    />
                  </div>
                  <div className="form-group">
                    <label>Rubro / Categoría *</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      placeholder="Ej: Orfebrería, Moda" 
                      value={regCategory} 
                      onChange={(e) => setRegCategory(e.target.value)} 
                      required={regType === "brand"}
                    />
                  </div>
                </div>
              )}

              {regType === "organizer" && (
                <div className="form-group">
                  <label>Productor / Dueño *</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    placeholder="Ej: Carlos Rebel" 
                    value={regOwner} 
                    onChange={(e) => setRegOwner(e.target.value)} 
                    required={regType === "organizer"}
                  />
                </div>
              )}

              {regType === "band" && (
                <div className="grid-2-to-1">
                  <div className="form-group">
                    <label>Género Musical *</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      placeholder="Ej: Folk, Indie Rock" 
                      value={regGenre} 
                      onChange={(e) => setRegGenre(e.target.value)} 
                      required={regType === "band"}
                    />
                  </div>
                  <div className="form-group">
                    <label>Integrantes *</label>
                    <input 
                      type="number" 
                      className="form-control" 
                      placeholder="Ej: 4" 
                      value={regMembers} 
                      onChange={(e) => setRegMembers(e.target.value)} 
                      required={regType === "band"}
                    />
                  </div>
                </div>
              )}

              {regType === "person" && (
                <>
                  <div className="form-group">
                    <label>Nombre de Usuario *</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      placeholder="Ej: juan_perez (único, minúsculas, sin espacios)" 
                      value={regUsername} 
                      onChange={(e) => setRegUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))} 
                      required
                    />
                  </div>
                  <div className="grid-2-to-1">
                    <div className="form-group" style={{ margin: 0 }}>
                      <label>Correo electrónico *</label>
                      <input 
                        type="email"
                        className="form-control" 
                        placeholder="tu@correo.com" 
                        value={regEmail} 
                        onChange={(e) => setRegEmail(e.target.value)} 
                        required
                      />
                    </div>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label>Contraseña *</label>
                      <div style={{ position: "relative" }}>
                        <input 
                          type={regPasswordVisible ? "text" : "password"}
                          className="form-control" 
                          placeholder="Mín. 6 caracteres" 
                          value={regPassword} 
                          onChange={(e) => setRegPassword(e.target.value)} 
                          required
                          style={{ paddingRight: "2.5rem" }}
                        />
                        <button
                          type="button"
                          onClick={() => setRegPasswordVisible(!regPasswordVisible)}
                          style={{ position: "absolute", right: "10px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: 0 }}
                        >
                          <i className={`fa-solid ${regPasswordVisible ? "fa-eye-slash" : "fa-eye"}`} style={{ fontSize: "0.85rem" }}></i>
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Especialidad / Ocupación <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", fontWeight: 400 }}>(opcional)</span></label>
                    <input 
                      type="text" 
                      className="form-control" 
                      placeholder="Ej: Pintor, Diseñador de Interiores, Ilustrador" 
                      value={regOccupation} 
                      onChange={(e) => setRegOccupation(e.target.value)} 
                    />
                  </div>
                </>
              )}

              <div className="form-group">
                <label>Foto de Portada / Logotipo de Perfil</label>
                <label
                  htmlFor="profile-logo-upload"
                  style={{
                    display: "flex", alignItems: "center", gap: "12px",
                    border: "2px dashed var(--border-color)", borderRadius: "8px",
                    padding: "0.8rem", cursor: "pointer", transition: "var(--transition-smooth)",
                    background: "var(--bg-input)"
                  }}
                >
                  {regLogoPreview ? (
                    <img src={regLogoPreview} alt="preview" style={{ width: "48px", height: "48px", objectFit: "cover", borderRadius: "50%", border: "1.5px solid var(--border-color)" }} />
                  ) : (
                    <div style={{ width: "48px", height: "48px", background: "rgba(212,175,55,0.1)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <i className="fa-solid fa-camera" style={{ color: "var(--gold-primary)", fontSize: "1.1rem" }}></i>
                    </div>
                  )}
                  <div>
                    <span style={{ fontSize: "0.82rem", fontWeight: 700, display: "block" }}>
                      {regLogoPreview ? "Imagen lista ✓" : "Haz clic para subir foto o logo"}
                    </span>
                    <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>Formatos JPG, PNG, WEBP — máx 8 MB</span>
                  </div>
                </label>
                <input 
                  id="profile-logo-upload" 
                  type="file" 
                  accept="image/*" 
                  style={{ display: "none" }} 
                  onChange={async (e) => {
                    const file = e.target.files[0];
                    if (!file) return;
                    setRegLogoPreview(URL.createObjectURL(file));
                    const url = await uploadImage(file, setUploadingReg);
                    if (url) setRegLogo(url);
                  }}
                />
              </div>

              <div className="form-group">
                <label>Historia / Propuesta de Valor</label>
                <textarea 
                  className="form-control" 
                  rows="3" 
                  style={{ resize: "none" }}
                  placeholder="Cuéntanos un poco sobre tu propuesta, qué te inspira..." 
                  value={regDescription} 
                  onChange={(e) => setRegDescription(e.target.value)}
                ></textarea>
              </div>

              <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", marginTop: "1.2rem" }}>
                <button type="button" onClick={() => setShowRegModal(false)} className="btn-outline-gold" style={{ padding: "0.45rem 1.2rem", borderRadius: "6px", fontSize: "0.85rem" }}>Cancelar</button>
                <button type="submit" className="btn-gold" style={{ padding: "0.45rem 1.4rem", borderRadius: "6px", fontSize: "0.85rem", fontWeight: 700 }} disabled={uploadingReg}>
                  {uploadingReg ? "Subiendo..." : (!activeRole ? "🎉 Crear mi Perfil" : "Registrar")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── LOGIN MODAL ─────────────────────────────────────────────────────── */}
      {showLoginModal && (
        <div className="modal-overlay" style={{ zIndex: 1200 }}>
          <div className="modal-backdrop" onClick={() => setShowLoginModal(false)}></div>
          <div className="modal-panel fade-in" style={{ maxWidth: "420px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.8rem" }}>
              <div>
                <h3 style={{ fontSize: "1.3rem", fontWeight: 800, margin: "0 0 4px 0" }}>Iniciar Sesión</h3>
                <p style={{ fontSize: "0.78rem", color: "var(--text-muted)", margin: 0 }}>Accede a tu cuenta AOURUM</p>
              </div>
              <button onClick={() => setShowLoginModal(false)} style={{ background: "rgba(0,0,0,0.04)", border: "none", fontSize: "1.2rem", cursor: "pointer", width: "32px", height: "32px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>&#x00D7;</button>
            </div>

            {/* Logo decorativo */}
            <div style={{ textAlign: "center", marginBottom: "1.6rem" }}>
              <div style={{ width: "56px", height: "56px", background: "var(--gold-gradient)", borderRadius: "14px", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto", boxShadow: "0 8px 24px rgba(212,175,55,0.25)" }}>
                <span style={{ color: "#1C1C1E", fontFamily: "'Cinzel', serif", fontWeight: 900, fontSize: "1.6rem" }}>A</span>
              </div>
            </div>

            <form onSubmit={handleLogin}>
              <div className="form-group">
                <label style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <i className="fa-solid fa-envelope" style={{ color: "var(--gold-primary)", fontSize: "0.85rem" }}></i>
                  Correo electrónico
                </label>
                <input 
                  type="email"
                  className="form-control"
                  placeholder="tu@correo.com"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  required
                  autoFocus
                />
              </div>

              <div className="form-group">
                <label style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <i className="fa-solid fa-lock" style={{ color: "var(--gold-primary)", fontSize: "0.85rem" }}></i>
                  Contraseña
                </label>
                <div style={{ position: "relative" }}>
                  <input 
                    type={loginPasswordVisible ? "text" : "password"}
                    className="form-control"
                    placeholder="Tu contraseña"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    required
                    style={{ paddingRight: "2.8rem" }}
                  />
                  <button
                    type="button"
                    onClick={() => setLoginPasswordVisible(!loginPasswordVisible)}
                    style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: 0 }}
                  >
                    <i className={`fa-solid ${loginPasswordVisible ? "fa-eye-slash" : "fa-eye"}`} style={{ fontSize: "0.9rem" }}></i>
                  </button>
                </div>
                <div style={{ textAlign: "right", marginTop: "6px" }}>
                  <button 
                    type="button"
                    onClick={() => { setShowLoginModal(false); setShowForgotModal(true); }}
                    style={{ background: "none", border: "none", color: "var(--text-muted)", fontSize: "0.78rem", cursor: "pointer", textDecoration: "underline", padding: 0 }}
                  >
                    ¿Olvidaste tu contraseña?
                  </button>
                </div>
              </div>

              <button 
                type="submit" 
                className="btn-gold"
                disabled={loginLoading}
                style={{ width: "100%", padding: "0.75rem", borderRadius: "10px", fontSize: "0.95rem", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", marginTop: "0.5rem" }}
              >
                {loginLoading 
                  ? <><i className="fa-solid fa-spinner fa-spin"></i> Ingresando...</>
                  : <><i className="fa-solid fa-right-to-bracket"></i> Entrar</>
                }
              </button>

              <div style={{ textAlign: "center", marginTop: "1.2rem", paddingTop: "1rem", borderTop: "1px solid var(--border-color)" }}>
                <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", margin: "0 0 8px 0" }}>¿No tienes cuenta?</p>
                <button 
                  type="button"
                  onClick={() => { setShowLoginModal(false); setShowRegModal(true); }}
                  style={{ background: "none", border: "none", color: "var(--gold-dark)", fontWeight: 700, fontSize: "0.85rem", cursor: "pointer", textDecoration: "underline" }}
                >
                  Regístrate gratis
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── FORGOT PASSWORD MODAL ────────────────────────────────────────────── */}
      {showForgotModal && (
        <div className="modal-overlay" style={{ zIndex: 1200 }}>
          <div className="modal-backdrop" onClick={() => setShowForgotModal(false)}></div>
          <div className="modal-panel fade-in" style={{ maxWidth: "420px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.8rem" }}>
              <div>
                <h3 style={{ fontSize: "1.3rem", fontWeight: 800, margin: "0 0 4px 0" }}>Recuperar Contraseña</h3>
                <p style={{ fontSize: "0.78rem", color: "var(--text-muted)", margin: 0 }}>Te enviaremos un enlace para restablecerla</p>
              </div>
              <button onClick={() => setShowForgotModal(false)} style={{ background: "rgba(0,0,0,0.04)", border: "none", fontSize: "1.2rem", cursor: "pointer", width: "32px", height: "32px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>&#x00D7;</button>
            </div>

            {/* Logo decorativo */}
            <div style={{ textAlign: "center", marginBottom: "1.6rem" }}>
              <div style={{ width: "56px", height: "56px", background: "var(--gold-gradient)", borderRadius: "14px", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto", boxShadow: "0 8px 24px rgba(212,175,55,0.25)" }}>
                <span style={{ color: "#1C1C1E", fontFamily: "'Cinzel', serif", fontWeight: 900, fontSize: "1.6rem" }}>A</span>
              </div>
            </div>

            <form onSubmit={async (e) => {
              e.preventDefault();
              if (!forgotEmail) return;
              setForgotLoading(true);
              const res = await forgotPassword(forgotEmail);
              setForgotLoading(false);
              if (res.success) {
                setForgotEmail("");
                setShowForgotModal(false);
              }
            }}>
              <div className="form-group">
                <label style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <i className="fa-solid fa-envelope" style={{ color: "var(--gold-primary)", fontSize: "0.85rem" }}></i>
                  Correo electrónico
                </label>
                <input 
                  type="email"
                  className="form-control"
                  placeholder="tu@correo.com"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  required
                  autoFocus
                />
              </div>

              <button 
                type="submit" 
                className="btn-gold"
                disabled={forgotLoading}
                style={{ width: "100%", padding: "0.75rem", borderRadius: "10px", fontSize: "0.95rem", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", marginTop: "1rem" }}
              >
                {forgotLoading 
                  ? <><i className="fa-solid fa-spinner fa-spin"></i> Enviando...</>
                  : <><i className="fa-solid fa-paper-plane"></i> Enviar Enlace</>
                }
              </button>

              <div style={{ textAlign: "center", marginTop: "1.2rem", paddingTop: "1rem", borderTop: "1px solid var(--border-color)" }}>
                <button 
                  type="button"
                  onClick={() => { setShowForgotModal(false); setShowLoginModal(true); }}
                  style={{ background: "none", border: "none", color: "var(--gold-dark)", fontWeight: 700, fontSize: "0.85rem", cursor: "pointer", textDecoration: "underline" }}
                >
                  Volver al inicio de sesión
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── EDIT PROFILE MODAL ─────────────────────────────────────────────── */}
      {editProfileOpen && (
        <div className="modal-overlay" style={{ zIndex: 1150 }}>
          <div className="modal-backdrop" onClick={() => setEditProfileOpen(false)}></div>
          <div className="modal-panel fade-in" style={{ maxWidth: "560px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
              <h3 style={{ fontSize: "1.25rem", fontWeight: 800, display: "flex", alignItems: "center", gap: 10 }}>
                <i className="fa-solid fa-pen-to-square" style={{ color: "var(--gold-primary)" }}></i> Personalizar Perfil
              </h3>
              <button onClick={() => setEditProfileOpen(false)} style={{ background: "rgba(0,0,0,0.04)", border: "none", fontSize: "1.2rem", cursor: "pointer", width: "32px", height: "32px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>&times;</button>
            </div>

            <form onSubmit={handleEditProfileSubmit}>
              {/* Tab bar header */}
              <div style={{ display: "flex", gap: "6px", borderBottom: "1.5px solid var(--border-color)", paddingBottom: "0.6rem", marginBottom: "1.2rem", overflowX: "auto", scrollbarWidth: "none" }}>
                <button 
                  type="button" 
                  onClick={() => setActiveEditTab("basic")} 
                  style={{
                    background: activeEditTab === "basic" ? "var(--gold-gradient)" : "transparent",
                    color: activeEditTab === "basic" ? "#1C1C1E" : "var(--text-muted)",
                    border: "1px solid " + (activeEditTab === "basic" ? "var(--gold-primary)" : "transparent"),
                    padding: "0.45rem 1rem",
                    borderRadius: "20px",
                    fontSize: "0.82rem",
                    fontWeight: 700,
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                    transition: "var(--transition-smooth)",
                    boxShadow: activeEditTab === "basic" ? "0 4px 10px rgba(212,175,55,0.15)" : "none"
                  }}
                >
                  📝 Datos Básicos
                </button>
                {editProfileType === "brand" && (
                  <button 
                    type="button" 
                    onClick={() => setActiveEditTab("rubro")} 
                    style={{
                      background: activeEditTab === "rubro" ? "var(--gold-gradient)" : "transparent",
                      color: activeEditTab === "rubro" ? "#1C1C1E" : "var(--text-muted)",
                      border: "1px solid " + (activeEditTab === "rubro" ? "var(--gold-primary)" : "transparent"),
                      padding: "0.45rem 1rem",
                      borderRadius: "20px",
                      fontSize: "0.82rem",
                      fontWeight: 700,
                      cursor: "pointer",
                      whiteSpace: "nowrap",
                      transition: "var(--transition-smooth)",
                      boxShadow: activeEditTab === "rubro" ? "0 4px 10px rgba(212,175,55,0.15)" : "none"
                    }}
                  >
                    🏷️ Rubro
                  </button>
                )}
                <button 
                  type="button" 
                  onClick={() => setActiveEditTab("connections")} 
                  style={{
                    background: activeEditTab === "connections" ? "var(--gold-gradient)" : "transparent",
                    color: activeEditTab === "connections" ? "#1C1C1E" : "var(--text-muted)",
                    border: "1px solid " + (activeEditTab === "connections" ? "var(--gold-primary)" : "transparent"),
                    padding: "0.45rem 1rem",
                    borderRadius: "20px",
                    fontSize: "0.82rem",
                    fontWeight: 700,
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                    transition: "var(--transition-smooth)",
                    boxShadow: activeEditTab === "connections" ? "0 4px 10px rgba(212,175,55,0.15)" : "none"
                  }}
                >
                  🌐 Conexiones
                </button>
                {editProfileType === "brand" && (
                  <button 
                    type="button" 
                    onClick={() => setActiveEditTab("local")} 
                    style={{
                      background: activeEditTab === "local" ? "var(--gold-gradient)" : "transparent",
                      color: activeEditTab === "local" ? "#1C1C1E" : "var(--text-muted)",
                      border: "1px solid " + (activeEditTab === "local" ? "var(--gold-primary)" : "transparent"),
                      padding: "0.45rem 1rem",
                      borderRadius: "20px",
                      fontSize: "0.82rem",
                      fontWeight: 700,
                      cursor: "pointer",
                      whiteSpace: "nowrap",
                      transition: "var(--transition-smooth)",
                      boxShadow: activeEditTab === "local" ? "0 4px 10px rgba(212,175,55,0.15)" : "none"
                    }}
                  >
                    📍 Local
                  </button>
                )}
              </div>

              {/* Tab: Datos Básicos */}
              {activeEditTab === "basic" && (
                <div className="fade-in">
                  <div className="form-group">
                    <label>Foto de Perfil / Logotipo</label>
                    <div style={{ display: "flex", alignItems: "center", gap: "1.5rem", background: "var(--bg-input)", border: "1px solid var(--border-color)", borderRadius: "10px", padding: "1rem" }}>
                      <div style={{ position: "relative", flexShrink: 0 }}>
                        <img 
                          src={editLogoPreview || "https://placehold.co/80x80/d4af37/1C1C1E?text=P"} 
                          alt="preview"
                          style={{ width: "72px", height: "72px", borderRadius: editProfileType === "person" || editProfileType === "band" ? "50%" : "12px", objectFit: "cover", border: "2px solid var(--gold-primary)", boxShadow: "0 4px 12px rgba(212,175,55,0.15)" }}
                        />
                        {uploadingEdit && (
                          <div style={{ position: "absolute", inset: 0, background: "rgba(255,255,255,0.8)", borderRadius: "inherit", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <i className="fa-solid fa-spinner fa-spin" style={{ color: "var(--gold-primary)" }}></i>
                          </div>
                        )}
                      </div>
                      <div style={{ flex: 1 }}>
                        <label htmlFor="edit-logo-upload" style={{ display: "inline-block", cursor: "pointer", padding: "0.4rem 1rem", background: "var(--gold-gradient)", color: "#1C1C1E", borderRadius: "6px", fontSize: "0.82rem", fontWeight: 700 }}>
                          <i className="fa-solid fa-upload" style={{ marginRight: 6 }}></i> {uploadingEdit ? "Subiendo..." : "Cambiar imagen"}
                        </label>
                        <p style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: "6px" }}>JPG, PNG o WEBP — máx 8 MB</p>
                      </div>
                    </div>
                    <input 
                      id="edit-logo-upload" type="file" accept="image/*" style={{ display: "none" }} disabled={uploadingEdit}
                      onChange={async (e) => {
                        const file = e.target.files[0];
                        if (!file) return;
                        setEditLogoPreview(URL.createObjectURL(file));
                        const url = await uploadImage(file, setUploadingEdit);
                        if (url) setEditLogo(url);
                      }}
                    />
                  </div>

                  <div className="form-group">
                    <label>Nombre *</label>
                    <input type="text" className="form-control" value={editName} onChange={(e) => setEditName(e.target.value)} required placeholder="Nombre de tu perfil" />
                  </div>

                  {editProfileType === "person" && (
                    <div className="form-group">
                      <label>Nombre de Usuario *</label>
                      <input 
                        type="text" 
                        className="form-control" 
                        value={editUsername} 
                        onChange={(e) => setEditUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))} 
                        required 
                        placeholder="Ej: juan_perez" 
                      />
                    </div>
                  )}

                  {editProfileType !== "person" && (
                    <div className="form-group">
                      <label>Identificador de URL (Slug) *</label>
                      <input 
                        type="text" 
                        className="form-control" 
                        value={editSlug} 
                        onChange={(e) => setEditSlug(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))} 
                        required 
                        placeholder="Ej: abunga" 
                      />
                    </div>
                  )}

                  {editProfileType === "brand" && (
                    <>
                      <div className="form-group">
                        <label>Dueño / Fundador</label>
                        <input type="text" className="form-control" value={editOwner} onChange={(e) => setEditOwner(e.target.value)} placeholder="Ej: María García" />
                      </div>
                      <div className="form-group">
                        <label>
                          <i className="fa-brands fa-whatsapp" style={{ color: "#25d366", marginRight: 6 }}></i>
                          Número de WhatsApp
                        </label>
                        <input 
                          type="text" 
                          className="form-control" 
                          value={editWhatsappNumber} 
                          onChange={(e) => setEditWhatsappNumber(e.target.value.replace(/[^0-9+]/g, ""))} 
                          placeholder="Ej: 51999999999 (número con código de país sin el +)" 
                        />
                      </div>
                    </>
                  )}
                  {editProfileType === "fair" && (
                    <div className="form-group">
                      <label>Productor Responsable</label>
                      <input type="text" className="form-control" value={editOwner} onChange={(e) => setEditOwner(e.target.value)} placeholder="Ej: Carlos Mendoza" />
                    </div>
                  )}
                  {editProfileType === "band" && (
                    <div className="grid-2-to-1">
                      <div className="form-group">
                        <label>Género Musical</label>
                        <input type="text" className="form-control" value={editGenre} onChange={(e) => setEditGenre(e.target.value)} placeholder="Ej: Folk, Rock" />
                      </div>
                      <div className="form-group">
                        <label>Nº de Integrantes</label>
                        <input type="number" className="form-control" value={editMembers} onChange={(e) => setEditMembers(e.target.value)} placeholder="Ej: 4" />
                      </div>
                    </div>
                  )}
                  {editProfileType === "person" && (
                    <div className="form-group">
                      <label>Especialidad / Ocupación</label>
                      <input type="text" className="form-control" value={editOccupation} onChange={(e) => setEditOccupation(e.target.value)} placeholder="Ej: Ilustrador, Diseñador" />
                    </div>
                  )}

                  <div className="form-group">
                    <label>Descripción / Historia</label>
                    <textarea 
                      className="form-control" rows="4" style={{ resize: "none" }}
                      value={editDescription} onChange={(e) => setEditDescription(e.target.value)}
                      placeholder="Cuéntanos tu historia, propuesta de valor, qué te inspira..."
                    ></textarea>
                  </div>
                </div>
              )}

              {/* Tab: Rubro (Exclusivo para Marcas) */}
              {editProfileType === "brand" && activeEditTab === "rubro" && (
                <div className="fade-in">
                  <div className="form-group">
                    <label>Rubro General *</label>
                    <select 
                      className="form-control" 
                      value={editRubroGeneral} 
                      onChange={(e) => setEditRubroGeneral(e.target.value)}
                      required
                    >
                      <option value="">-- Selecciona un Rubro --</option>
                      <option value="Comida">Comida / Gastronomía</option>
                      <option value="Snacks">Snacks / Alimentos Deshidratados</option>
                      <option value="Joyería">Joyería / Orfebrería</option>
                      <option value="Moda y Accesorios">Moda y Accesorios</option>
                      <option value="Arte y Diseño">Arte y Diseño</option>
                      <option value="Hogar y Decoración">Hogar y Decoración</option>
                      <option value="Salud y Belleza">Salud y Belleza</option>
                      <option value="Otro">Otro Rubro</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Rubro Específico *</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      value={editRubroEspecifico} 
                      onChange={(e) => setEditRubroEspecifico(e.target.value)} 
                      placeholder="Ej: Snacks Deshidratados, Joyas de Plata 950, Repostería Vegana"
                      required
                    />
                    <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "4px", display: "block" }}>
                      Escribe detalladamente qué hace tu marca.
                    </span>
                  </div>
                </div>
              )}

              {/* Tab: Conexiones */}
              {activeEditTab === "connections" && (
                <div className="fade-in">
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "10px" }}>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.78rem" }}>
                        <i className="fa-brands fa-instagram" style={{ color: "#e1306c" }}></i> Instagram
                      </label>
                      <input 
                        type="text" 
                        className="form-control" 
                        value={editInstagram} 
                        onChange={(e) => setEditInstagram(e.target.value)} 
                        placeholder="Ej: usuario_instagram" 
                        style={{ fontSize: "0.82rem", padding: "0.4rem 0.6rem" }}
                      />
                    </div>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.78rem" }}>
                        <i className="fa-brands fa-facebook" style={{ color: "#1877f2" }}></i> Facebook
                      </label>
                      <input 
                        type="text" 
                        className="form-control" 
                        value={editFacebook} 
                        onChange={(e) => setEditFacebook(e.target.value)} 
                        placeholder="Ej: pagina.facebook" 
                        style={{ fontSize: "0.82rem", padding: "0.4rem 0.6rem" }}
                      />
                    </div>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.78rem" }}>
                        <i className="fa-brands fa-tiktok" style={{ color: "#000000" }}></i> TikTok
                      </label>
                      <input 
                        type="text" 
                        className="form-control" 
                        value={editTiktok} 
                        onChange={(e) => setEditTiktok(e.target.value)} 
                        placeholder="Ej: usuario_tiktok" 
                        style={{ fontSize: "0.82rem", padding: "0.4rem 0.6rem" }}
                      />
                    </div>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.78rem" }}>
                        <i className="fa-solid fa-globe" style={{ color: "var(--gold-primary)" }}></i> Sitio Web / Enlace
                      </label>
                      <input 
                        type="url" 
                        className="form-control" 
                        value={editWebsite} 
                        onChange={(e) => setEditWebsite(e.target.value)} 
                        placeholder="https://tuweb.com" 
                        style={{ fontSize: "0.82rem", padding: "0.4rem 0.6rem" }}
                      />
                    </div>
                  </div>

                  {editProfileType === "band" && (
                    <div className="form-group" style={{ marginTop: "12px" }}>
                      <label><i className="fa-brands fa-spotify" style={{ marginRight: 6, color: "#1db954" }}></i>Link de Música (Spotify / YouTube)</label>
                      <input type="url" className="form-control" value={editMediaLink} onChange={(e) => setEditMediaLink(e.target.value)} placeholder="https://open.spotify.com/artist/..." />
                    </div>
                  )}
                </div>
              )}

              {/* Tab: Local (Exclusivo para Marcas) */}
              {editProfileType === "brand" && activeEditTab === "local" && (
                <div className="fade-in">
                  <div className="form-group" style={{ display: "flex", alignItems: "center", gap: "10px", background: "var(--bg-input)", padding: "0.75rem", borderRadius: "8px", border: "1px solid var(--border-color)", marginBottom: "1.2rem" }}>
                    <input 
                      type="checkbox" 
                      id="editHasLocalCheckbox"
                      checked={editHasLocal} 
                      onChange={(e) => setEditHasLocal(e.target.checked)}
                      style={{ width: "18px", height: "18px", accentColor: "var(--gold-primary)", cursor: "pointer" }}
                    />
                    <label htmlFor="editHasLocalCheckbox" style={{ fontWeight: 700, margin: 0, cursor: "pointer", fontSize: "0.88rem" }}>
                      Tengo un local físico / tienda
                    </label>
                  </div>

                  {editHasLocal && (
                    <>
                      <div className="form-group">
                        <label>Dirección del Local *</label>
                        <input 
                          type="text" 
                          className="form-control" 
                          value={editLocalAddress} 
                          onChange={(e) => setEditLocalAddress(e.target.value)} 
                          placeholder="Ej: Calle Mercaderes 123, Arequipa" 
                          required={editHasLocal}
                        />
                      </div>

                      <div style={{ marginBottom: "1rem" }}>
                        <label style={{ fontWeight: 700, fontSize: "0.85rem", color: "var(--text-primary)", display: "block", marginBottom: "0.5rem" }}>
                          📍 Ajustar ubicación en el mapa (Haz clic o arrastra el marcador)
                        </label>
                        <div ref={localMapContainerRef} style={{ height: "200px", width: "100%", borderRadius: "8px", border: "1px solid var(--border-color)", zIndex: 1 }}></div>
                        <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "4px", display: "block" }}>
                          Coordenadas del local: Lat: {editLocalLat.toFixed(5)}, Lng: {editLocalLng.toFixed(5)}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              )}

              <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", marginTop: "1.2rem", borderTop: "1px solid var(--border-color)", paddingTop: "1rem" }}>
                <button type="button" onClick={() => setEditProfileOpen(false)} className="btn-outline-gold" style={{ padding: "0.5rem 1.3rem", borderRadius: "8px", fontSize: "0.88rem" }}>Cancelar</button>
                <button type="submit" className="btn-gold" style={{ padding: "0.5rem 1.6rem", borderRadius: "8px", fontSize: "0.88rem", fontWeight: 700 }} disabled={uploadingEdit}>
                  <i className="fa-solid fa-check"></i> Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── FLOATING NOTIFICATION BANNER ───────────────────────────────────── */}
      {(errorMsg || successMsg) && (
        <div
          className="notification-toast"
          style={{
            position: "fixed",
            bottom: "calc(var(--tab-bar-height) + 16px + env(safe-area-inset-bottom, 0px))",
            right: "16px",
            left: "16px",
            maxWidth: "420px",
            margin: "0 auto",
            background: successMsg ? "#10b981" : "#ef4444",
            color: "#FFFFFF", padding: "1rem 1.2rem", borderRadius: "10px",
            boxShadow: "0 10px 30px rgba(0,0,0,0.12)", zIndex: 1500,
            display: "flex", alignItems: "center", gap: "12px",
            animation: "slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards"
          }}>

          <i className={successMsg ? "fa-solid fa-circle-check" : "fa-solid fa-triangle-exclamation"} style={{ fontSize: "1.2rem", flexShrink: 0 }}></i>
          <span style={{ fontWeight: 600, fontSize: "0.88rem" }}>{successMsg || errorMsg}</span>
        </div>
      )}
    </div>
  );
}

export default function RootLayout({ children }) {
  return (
    <html lang="es" className={inter.variable}>
      <head>
        <title>Aourum - La nueva era del comercio</title>
        <meta name="description" content="Aourum es el mercado cultural y comercial de Arequipa. Encuentra las mejores ferias independientes, marcas locales y bandas de música en la nueva era del comercio." />
        <meta name="keywords" content="aourum, aourum arequipa, mercado arequipa, ferias arequipa, marcas locales arequipa, bandas arequipa, comprar arequipa, comercio cultural" />
        <meta name="author" content="Ackyul" />
        
        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://aourum.com/" />
        <meta property="og:title" content="Aourum - La nueva era del comercio" />
        <meta property="og:description" content="Aourum es el mercado cultural de Arequipa que conecta ferias, marcas locales, diseñadores y bandas en una nueva plataforma interactiva." />
        <meta property="og:image" content="https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=1200&q=80" />

        {/* Twitter */}
        <meta property="twitter:card" content="summary_large_image" />
        <meta property="twitter:url" content="https://aourum.com/" />
        <meta property="twitter:title" content="Aourum - La nueva era del comercio" />
        <meta property="twitter:description" content="Aourum es el mercado cultural de Arequipa que conecta ferias, marcas locales, diseñadores y bandas." />
        <meta property="twitter:image" content="https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=1200&q=80" />

        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" integrity="sha512-iecdLmaskl7CVkqkXNQ/ZH/XLlvWZOJyj7Yy7tcenmpD1ypASozpmT/E0iPtmFIB46ZmdtAc9eNBvH0H/ZpiBw==" crossOrigin="anonymous" referrerPolicy="no-referrer" />
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=" crossOrigin="" />
      </head>
      <body>
        <Script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js" integrity="sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=" crossOrigin="" strategy="beforeInteractive" />
        <AppContextProvider>
          <AppLayoutShell>{children}</AppLayoutShell>
        </AppContextProvider>
      </body>
    </html>
  );
}
