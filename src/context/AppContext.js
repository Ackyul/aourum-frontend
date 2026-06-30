"use client";

import { createContext, useContext, useState, useEffect, useRef } from "react";

const AppContext = createContext();

const SESSION_KEY = "aourum_session";
const TOKEN_KEY = "aourum_token";

function loadSession() {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveSession(data) {
  if (typeof window === "undefined") return;
  localStorage.setItem(SESSION_KEY, JSON.stringify(data));
}

function clearSession() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(SESSION_KEY);
  localStorage.removeItem(TOKEN_KEY);
}

function saveToken(token) {
  if (typeof window === "undefined") return;
  localStorage.setItem(TOKEN_KEY, token);
}

function loadToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function AppContextProvider({ children }) {
  const session = loadSession();

  // Global data states loaded from API
  const [products, setProducts] = useState([]);
  const [fairs, setFairs] = useState([]);
  const [bands, setBands] = useState([]);
  const [brands, setBrands] = useState([]);
  const [organizers, setOrganizers] = useState([]);
  const [people, setPeople] = useState([]);
  const [invitations, setInvitations] = useState([]);

  // Loading & status states
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Session / role states — null means "logged out"
  const [activeRole, setActiveRoleState] = useState(session?.role ?? null);
  const [activeBrandId, setActiveBrandIdState] = useState(session?.brandId ?? "");
  const [activeOrganizerId, setActiveOrganizerIdState] = useState(session?.organizerId ?? "");
  const [activeBandId, setActiveBandIdState] = useState(session?.bandId ?? "");
  const [activePersonId, setActivePersonIdState] = useState(session?.personId ?? "");
  const [activeFairId, setActiveFairId] = useState("");

  // Helpers that also persist to localStorage
  const setActiveRole = (role) => {
    setActiveRoleState(role);
    const current = loadSession() || {};
    saveSession({ ...current, role });
  };
  const setActiveBrandId = (id) => {
    setActiveBrandIdState(id);
    const current = loadSession() || {};
    saveSession({ ...current, brandId: id });
  };
  const setActiveOrganizerId = (id) => {
    setActiveOrganizerIdState(id);
    const current = loadSession() || {};
    saveSession({ ...current, organizerId: id });
  };
  const setActiveBandId = (id) => {
    setActiveBandIdState(id);
    const current = loadSession() || {};
    saveSession({ ...current, bandId: id });
  };
  const setActivePersonId = (id) => {
    setActivePersonIdState(id);
    const current = loadSession() || {};
    saveSession({ ...current, personId: id });
  };

  // Logout — clears all session state
  const logout = () => {
    clearSession();
    setActiveRoleState(null);
    setActiveBrandIdState("");
    setActiveOrganizerIdState("");
    setActiveBandIdState("");
    setActivePersonIdState("");
    setActiveFairId("");
  };

  // UI state variables
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");

  // Registration/Creation modal state
  const [showRegModal, setShowRegModal] = useState(false);
  const [regType, setRegType] = useState("person");
  // Auth modal state (login)
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  // Form input states
  // 1. Account registration
  const [regName, setRegName] = useState("");
  const [regUsername, setRegUsername] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regOwner, setRegOwner] = useState("");
  const [regCategory, setRegCategory] = useState("");
  const [regOccupation, setRegOccupation] = useState("");
  const [regDescription, setRegDescription] = useState("");
  const [regLocation, setRegLocation] = useState("");
  const [regDate, setRegDate] = useState("");
  const [regTime, setRegTime] = useState("");
  const [regGenre, setRegGenre] = useState("");
  const [regMembers, setRegMembers] = useState("");
  const [regLogo, setRegLogo] = useState("");
  const [regLogoPreview, setRegLogoPreview] = useState("");
  const [uploadingReg, setUploadingReg] = useState(false);

  // Profile Customization state
  const [editProfileOpen, setEditProfileOpen] = useState(false);
  const [editProfileType, setEditProfileType] = useState("person");
  const [editProfileId, setEditProfileId] = useState("");
  const [editName, setEditName] = useState("");
  const [editLastName, setEditLastName] = useState("");
  const [editUsername, setEditUsername] = useState("");
  const [editOwner, setEditOwner] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [editOccupation, setEditOccupation] = useState("");
  const [editGenre, setEditGenre] = useState("");
  const [editMembers, setEditMembers] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editLogo, setEditLogo] = useState("");
  const [editLogoPreview, setEditLogoPreview] = useState("");
  const [editMediaLink, setEditMediaLink] = useState("");
  const [editSlug, setEditSlug] = useState("");
  const [editWhatsappNumber, setEditWhatsappNumber] = useState("");
  const [editInstagram, setEditInstagram] = useState("");
  const [editFacebook, setEditFacebook] = useState("");
  const [editTiktok, setEditTiktok] = useState("");
  const [editWebsite, setEditWebsite] = useState("");
  const [editRubroGeneral, setEditRubroGeneral] = useState("");
  const [editRubroEspecifico, setEditRubroEspecifico] = useState("");
  const [editHasLocal, setEditHasLocal] = useState(false);
  const [editLocalAddress, setEditLocalAddress] = useState("");
  const [editLocalLat, setEditLocalLat] = useState(-16.39889);
  const [editLocalLng, setEditLocalLng] = useState(-71.53694);
  const [uploadingEdit, setUploadingEdit] = useState(false);
  const [editBrandIds, setEditBrandIds] = useState([]);
  const [editOrganizerIds, setEditOrganizerIds] = useState([]);
  const [editBandIds, setEditBandIds] = useState([]);

  // Social network customization options
  const [editBanner, setEditBanner] = useState("");
  const [editBannerPreview, setEditBannerPreview] = useState("");
  const [editThemeColor, setEditThemeColor] = useState("");
  const [editTagline, setEditTagline] = useState("");
  const [editInterests, setEditInterests] = useState("");

  // 2. Product/Service creation & editing
  const [prodFormOpen, setProdFormOpen] = useState(false);
  const [editingProdId, setEditingProdId] = useState(null);
  const [prodName, setProdName] = useState("");
  const [prodDescription, setProdDescription] = useState("");
  const [prodPrice, setProdPrice] = useState("");
  const [prodPriceAourum, setProdPriceAourum] = useState("");
  const [prodStock, setProdStock] = useState("");
  const [prodCategory, setProdCategory] = useState("");
  const [prodType, setProdType] = useState("product");
  const [prodImage, setProdImage] = useState("");
  const [prodImagePreview, setProdImagePreview] = useState("");
  const [uploadingProd, setUploadingProd] = useState(false);

  // 3. Fair creation (within Organizer Dashboard)
  const [fairFormOpen, setFairFormOpen] = useState(false);
  const [fairName, setFairName] = useState("");
  const [fairLocation, setFairLocation] = useState("");
  const [fairDate, setFairDate] = useState("");
  const [fairTime, setFairTime] = useState("");
  const [fairDescription, setFairDescription] = useState("");
  const [fairBanner, setFairBanner] = useState("");
  const [fairBannerPreview, setFairBannerPreview] = useState("");
  const [fairLat, setFairLat] = useState(-16.39889);
  const [fairLng, setFairLng] = useState(-71.53694);
  const [uploadingFair, setUploadingFair] = useState(false);

  // 4. Fair Application (Brands & Bands)
  const [appFairId, setAppFairId] = useState("");

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

  // Fetch initial data
  const fetchData = async () => {
    setLoading(true);
    try {
      const [resProds, resFairs, resBands, resBrands, resOrgs, resPeople, resInvs] = await Promise.all([
        fetch(`${API_URL}/api/products`).then((r) => r.json()),
        fetch(`${API_URL}/api/fairs`).then((r) => r.json()),
        fetch(`${API_URL}/api/bands`).then((r) => r.json()),
        fetch(`${API_URL}/api/brands`).then((r) => r.json()),
        fetch(`${API_URL}/api/organizers`).then((r) => r.json()),
        fetch(`${API_URL}/api/people`).then((r) => r.json()),
        fetch(`${API_URL}/api/invitations`).then((r) => r.json()),
      ]);

      if (Array.isArray(resProds)) setProducts(resProds);
      
      if (Array.isArray(resFairs)) {
        setFairs(resFairs);
        if (resFairs.length > 0 && !activeFairId) {
          setActiveFairId(resFairs[0].id.toString());
        }
      }

      if (Array.isArray(resBands)) setBands(resBands);
      if (Array.isArray(resBrands)) setBrands(resBrands);
      if (Array.isArray(resOrgs)) setOrganizers(resOrgs);
      if (Array.isArray(resPeople)) setPeople(resPeople);
      if (Array.isArray(resInvs)) setInvitations(resInvs);

      // ── Session validation: if saved IDs don't exist anymore, auto-logout ──
      const currentSession = loadSession();
      if (currentSession?.role) {
        let valid = false;
        if (currentSession.role === "person" && Array.isArray(resPeople)) {
          valid = resPeople.some(p => p.id === Number(currentSession.personId));
        } else if (currentSession.role === "brand" && Array.isArray(resBrands)) {
          valid = resBrands.some(b => b.id === Number(currentSession.brandId));
        } else if (currentSession.role === "fair" && Array.isArray(resOrgs)) {
          valid = resOrgs.some(o => o.id === Number(currentSession.organizerId));
        } else if (currentSession.role === "band" && Array.isArray(resBands)) {
          valid = resBands.some(b => b.id === Number(currentSession.bandId));
        }
        if (!valid) {
          // Entity no longer in DB — clear stale session silently
          clearSession();
          setActiveRoleState(null);
          setActiveBrandIdState("");
          setActiveOrganizerIdState("");
          setActiveBandIdState("");
          setActivePersonIdState("");
        }
      }

      setErrorMsg("");
    } catch (err) {
      console.error("Error loading data:", err);
      setErrorMsg(`No se pudo conectar con el servidor backend en ${API_URL}. Asegúrate de que esté corriendo.`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Float notifications handler
  const triggerNotification = (success, msg) => {
    if (success) {
      setSuccessMsg(msg);
      setTimeout(() => setSuccessMsg(""), 3500);
    } else {
      setErrorMsg(msg);
      setTimeout(() => setErrorMsg(""), 3500);
    }
  };

  // Image upload helper
  const uploadImage = async (file, setUploading) => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch(`${API_URL}/api/upload`, {
        method: "POST",
        body: formData,
      });
      if (!res.ok) throw new Error("Upload fallido");
      const data = await res.json();
      return data.url;
    } catch (err) {
      triggerNotification(false, "No se pudo subir la imagen. Intenta de nuevo.");
      return null;
    } finally {
      setUploading(false);
    }
  };

  // AI background removal helper
  const removeBgAi = async (imageBase64) => {
    try {
      const res = await fetch(`${API_URL}/api/remove-bg-ai`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ image: imageBase64 }),
      });
      if (!res.ok) throw new Error("Error en la remoción de fondo con IA");
      const data = await res.json();
      return data.image; // Returns the base64 transparent image
    } catch (err) {
      console.error("Error calling remove-bg-ai API:", err);
      triggerNotification(false, "No se pudo quitar el fondo con IA. Intenta de nuevo.");
      return null;
    }
  };

  // Submit handlers
  const handleProductSubmit = async (e, brandId) => {
    if (e) e.preventDefault();
    const targetBrandId = brandId || activeBrandId;
    if (!prodName || !prodPrice || !prodCategory || !targetBrandId) {
      triggerNotification(false, "Completa los campos obligatorios del producto/servicio");
      return;
    }
    const trimmedCategory = prodCategory.trim();
    const existingCategory = products.find(p => p.category && p.category.trim().toLowerCase() === trimmedCategory.toLowerCase())?.category;
    const cleanCategory = existingCategory ? existingCategory.trim() : trimmedCategory;

    const payload = {
      name: prodName,
      description: prodDescription,
      price: Number(prodPrice),
      priceAourum: prodPriceAourum === "" || prodPriceAourum == null ? null : Number(prodPriceAourum),
      stock: prodType === "service" ? 99999 : (prodStock === "" || prodStock == null ? null : Number(prodStock)),
      category: cleanCategory,
      brandId: Number(targetBrandId),
      type: prodType,
      image: prodImage || undefined
    };

    try {
      let response;
      if (editingProdId) {
        response = await fetch(`${API_URL}/api/products/${editingProdId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
      } else {
        response = await fetch(`${API_URL}/api/products`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
      }

      if (response.ok) {
        triggerNotification(true, editingProdId ? "✨ Producto/Servicio actualizado exitosamente" : "✨ ¡Nuevo item añadido al catálogo!");
        setProdName(""); setProdDescription(""); setProdPrice(""); setProdPriceAourum("");
        setProdStock(""); setProdCategory(""); setProdType("product");
        setProdImage(""); setProdImagePreview("");
        setProdFormOpen(false); setEditingProdId(null);
        fetchData();
      } else {
        triggerNotification(false, "No se pudo guardar el item. Revisa tus campos.");
      }
    } catch (err) {
      triggerNotification(false, "Error de red al intentar conectar con el servidor.");
    }
  };

  const handleDeleteProduct = async (id) => {
    if (!confirm("¿Seguro que deseas eliminar este item del catálogo?")) return;
    try {
      const response = await fetch(`${API_URL}/api/products/${id}`, { method: "DELETE" });
      if (response.ok) {
        triggerNotification(true, "Item removido correctamente.");
        fetchData();
      } else {
        triggerNotification(false, "No se pudo eliminar el item.");
      }
    } catch (err) {
      triggerNotification(false, "Error de red al intentar eliminar.");
    }
  };

  const handleDeleteBand = async (id) => {
    if (!confirm("¿Seguro que deseas eliminar esta banda de música?")) return false;
    try {
      const response = await fetch(`${API_URL}/api/bands/${id}`, { method: "DELETE" });
      if (response.ok) {
        triggerNotification(true, "Banda eliminada correctamente.");
        fetchData();
        return true;
      } else {
        triggerNotification(false, "No se pudo eliminar la banda.");
        return false;
      }
    } catch (err) {
      triggerNotification(false, "Error de red al intentar eliminar la banda.");
      return false;
    }
  };

  const handleDeleteBrand = async (id) => {
    if (!confirm("¿Seguro que deseas eliminar esta marca y todos sus productos?")) return false;
    try {
      const response = await fetch(`${API_URL}/api/brands/${id}`, { method: "DELETE" });
      if (response.ok) {
        triggerNotification(true, "Marca eliminada correctamente.");
        fetchData();
        return true;
      } else {
        triggerNotification(false, "No se pudo eliminar la marca.");
        return false;
      }
    } catch (err) {
      triggerNotification(false, "Error de red al intentar eliminar la marca.");
      return false;
    }
  };

  const handleDeleteOrganizer = async (id) => {
    if (!confirm("¿Seguro que deseas eliminar esta productora y todas sus ferias?")) return false;
    try {
      const response = await fetch(`${API_URL}/api/organizers/${id}`, { method: "DELETE" });
      if (response.ok) {
        triggerNotification(true, "Productora eliminada correctamente.");
        fetchData();
        return true;
      } else {
        triggerNotification(false, "No se pudo eliminar la productora.");
        return false;
      }
    } catch (err) {
      triggerNotification(false, "Error de red al intentar eliminar la productora.");
      return false;
    }
  };

  const handleFairSubmit = async (e, organizerId) => {
    if (e) e.preventDefault();
    const targetOrganizerId = organizerId || activeOrganizerId;
    if (!fairName || !fairLocation || !fairDate || !targetOrganizerId) {
      triggerNotification(false, "Por favor completa el nombre, dirección y fecha.");
      return;
    }
    const payload = {
      name: fairName, location: fairLocation, date: fairDate,
      time: fairTime, description: fairDescription,
      banner: fairBanner || undefined, lat: fairLat, lng: fairLng,
      organizerId: Number(targetOrganizerId)
    };
    try {
      const response = await fetch(`${API_URL}/api/fairs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (response.ok) {
        triggerNotification(true, "🎪 ¡Feria publicada correctamente!");
        setFairName(""); setFairLocation(""); setFairDate(""); setFairTime("");
        setFairDescription(""); setFairBanner(""); setFairBannerPreview("");
        setFairLat(-16.39889); setFairLng(-71.53694);
        setFairFormOpen(false); fetchData();
      } else {
        triggerNotification(false, "Error al crear la feria.");
      }
    } catch (err) {
      triggerNotification(false, "Error de red al intentar conectar.");
    }
  };

  const handleAccountRegistration = async (e) => {
    e.preventDefault();
    if (!regName) {
      triggerNotification(false, "El nombre de la cuenta es requerido");
      return;
    }
    let url = "";
    let payload = {};
    if (regType === "brand") {
      url = `${API_URL}/api/brands`;
      payload = { 
        name: regName, 
        owner: regOwner || "Dueño de Marca", 
        category: regCategory || "General", 
        description: regDescription, 
        logo: regLogo || undefined,
        personId: activeRole === "person" ? Number(activePersonId) : undefined
      };
    } else if (regType === "organizer") {
      url = `${API_URL}/api/organizers`;
      payload = { 
        name: regName, 
        owner: regOwner || "Productor General", 
        description: regDescription, 
        logo: regLogo || undefined,
        personId: activeRole === "person" ? Number(activePersonId) : undefined
      };
    } else if (regType === "band") {
      url = `${API_URL}/api/bands`;
      payload = { 
        name: regName, 
        genre: regGenre || "Varios", 
        members: Number(regMembers || 1), 
        description: regDescription, 
        image: regLogo || undefined,
        personId: activeRole === "person" ? Number(activePersonId) : undefined
      };
    } else if (regType === "person") {
      // ── Email + password registration via /api/auth/register ──
      if (!regEmail || !regPassword) {
        triggerNotification(false, "El correo y la contraseña son obligatorios.");
        return;
      }
      if (regPassword.length < 6) {
        triggerNotification(false, "La contraseña debe tener al menos 6 caracteres.");
        return;
      }
      try {
        const response = await fetch(`${API_URL}/api/auth/register`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: regName,
            username: regUsername,
            email: regEmail,
            password: regPassword,
            occupation: regOccupation || "",
            description: regDescription,
            logo: regLogo || undefined
          })
        });
        const data = await response.json();
        if (response.ok) {
          saveToken(data.token);
          const stringId = data.person.id.toString();
          triggerNotification(true, `🎉 ¡Bienvenido a AOURUM, ${regName}!`);
          setActivePersonId(stringId);
          setActiveRole("person");
          setRegName(""); setRegUsername(""); setRegEmail(""); setRegPassword(""); setRegOwner("");
          setRegCategory(""); setRegOccupation(""); setRegDescription("");
          setRegLocation(""); setRegDate(""); setRegTime(""); setRegGenre("");
          setRegMembers(""); setRegLogo(""); setRegLogoPreview("");
          setShowRegModal(false);
          fetchData();
        } else {
          triggerNotification(false, data.error || "No se pudo registrar. Intenta con otro correo o usuario.");
        }
      } catch (err) {
        triggerNotification(false, "Error de red al crear cuenta.");
      }
      return;
    }
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (response.ok) {
        const createdObj = await response.json();
        const msg = `✨ ${regType === "band" ? "Banda" : regType === "organizer" ? "Productora" : "Marca"} "${regName}" creada y vinculada a tu perfil.`;
        triggerNotification(true, msg);
        const stringId = createdObj.id.toString();

        // The user is already a Persona creating a sub-project,
        // stay as Persona — the entity is linked via personId.
        const creatingAsPersona = activeRole === "person";

        if (regType === "brand") {
          setActiveBrandId(stringId);
          if (!creatingAsPersona) setActiveRole("brand");
        } else if (regType === "organizer") {
          setActiveOrganizerId(stringId);
          if (!creatingAsPersona) setActiveRole("fair");
        } else if (regType === "band") {
          setActiveBandId(stringId);
          if (!creatingAsPersona) setActiveRole("band");
        }
        
        setRegName(""); setRegOwner(""); setRegCategory(""); setRegOccupation(""); setRegDescription("");
        setRegLocation(""); setRegDate(""); setRegTime(""); setRegGenre("");
        setRegMembers(""); setRegLogo(""); setRegLogoPreview("");
        setShowRegModal(false);
        fetchData();
      } else {
        triggerNotification(false, "No se pudo registrar la cuenta. Intente con otro nombre.");
      }
    } catch (err) {
      triggerNotification(false, "Error de red al crear cuenta.");
    }
  };

  // ── Email + Password Login ────────────────────────────────────────────────
  const handleLogin = async (e) => {
    e.preventDefault();
    if (!loginEmail || !loginPassword) {
      triggerNotification(false, "Correo y contraseña son obligatorios.");
      return;
    }
    setLoginLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: loginEmail, password: loginPassword })
      });
      const data = await response.json();
      if (response.ok) {
        saveToken(data.token);
        const stringId = data.person.id.toString();
        setActivePersonId(stringId);
        setActiveRole("person");
        setLoginEmail("");
        setLoginPassword("");
        setShowLoginModal(false);
        triggerNotification(true, `👋 ¡Bienvenido de vuelta, ${data.person.name}!`);
        fetchData();
      } else {
        triggerNotification(false, data.error || "Credenciales incorrectas.");
      }
    } catch (err) {
      triggerNotification(false, "Error de red al iniciar sesión.");
    } finally {
      setLoginLoading(false);
    }
  };

  const forgotPassword = async (email) => {
    try {
      const response = await fetch(`${API_URL}/api/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      });
      const data = await response.json();
      if (response.ok) {
        triggerNotification(true, data.message);
        return { success: true, message: data.message };
      } else {
        triggerNotification(false, data.error || "No se pudo procesar la solicitud.");
        return { success: false, error: data.error };
      }
    } catch (err) {
      triggerNotification(false, "Error de red al solicitar restablecimiento.");
      return { success: false, error: "Error de red" };
    }
  };

  const resetPassword = async (token, email, password) => {
    try {
      const response = await fetch(`${API_URL}/api/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, email, password })
      });
      const data = await response.json();
      if (response.ok) {
        triggerNotification(true, data.message || "Contraseña restablecida con éxito.");
        return { success: true };
      } else {
        triggerNotification(false, data.error || "No se pudo restablecer la contraseña.");
        return { success: false, error: data.error };
      }
    } catch (err) {
      triggerNotification(false, "Error de red al restablecer la contraseña.");
      return { success: false, error: "Error de red" };
    }
  };

  const handleEditProfileSubmit = async (e, type, targetId) => {
    if (e) e.preventDefault();
    if (!editName) {
      triggerNotification(false, "El nombre es obligatorio");
      return;
    }
    let url = "";
    let payload = {};
    const effectiveType = type || editProfileType || activeRole;
    const effectiveId = targetId || editProfileId || (effectiveType === "brand" ? activeBrandId : effectiveType === "fair" ? activeOrganizerId : effectiveType === "band" ? activeBandId : activePersonId);
    
    const descriptionPayload = JSON.stringify({
      text: editDescription,
      instagram: editInstagram,
      facebook: editFacebook,
      tiktok: editTiktok,
      website: editWebsite,
      rubro_general: effectiveType === "brand" ? editRubroGeneral : "",
      rubro_especifico: effectiveType === "brand" ? editRubroEspecifico : "",
      has_local: effectiveType === "brand" ? editHasLocal : false,
      local_address: effectiveType === "brand" ? editLocalAddress : "",
      local_lat: effectiveType === "brand" ? editLocalLat : -16.39889,
      local_lng: effectiveType === "brand" ? editLocalLng : -71.53694,
      banner: editBanner,
      theme_color: editThemeColor,
      tagline: editTagline,
      interests: editInterests
    });

    if (effectiveType === "brand") {
      url = `${API_URL}/api/brands/${effectiveId}`;
      payload = { 
        name: editName, 
        owner: editOwner, 
        category: editRubroEspecifico || editRubroGeneral || editCategory, 
        description: descriptionPayload, 
        logo: editLogo, 
        slug: editSlug, 
        whatsappNumber: editWhatsappNumber 
      };
    } else if (effectiveType === "fair" || effectiveType === "organizer") {
      url = `${API_URL}/api/organizers/${effectiveId}`;
      payload = { name: editName, owner: editOwner, description: descriptionPayload, logo: editLogo, slug: editSlug };
    } else if (effectiveType === "band") {
      url = `${API_URL}/api/bands/${effectiveId}`;
      payload = { name: editName, genre: editGenre, members: Number(editMembers), description: descriptionPayload, image: editLogo, mediaLink: editMediaLink, slug: editSlug };
    } else if (effectiveType === "person") {
      url = `${API_URL}/api/people/${effectiveId}`;
      payload = { 
        name: editName, 
        username: editUsername,
        occupation: editOccupation, 
        description: descriptionPayload, 
        logo: editLogo,
        brandIds: editBrandIds,
        organizerIds: editOrganizerIds,
        bandIds: editBandIds,
        lastName: editLastName
      };
    }
    try {
      const response = await fetch(url, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (response.ok) {
        triggerNotification(true, "✨ ¡Perfil actualizado exitosamente!");
        setEditProfileOpen(false);
        fetchData();
      } else {
        triggerNotification(false, "No se pudo actualizar el perfil.");
      }
    } catch (err) {
      triggerNotification(false, "Error de red al intentar actualizar el perfil.");
    }
  };

  const handleApplyToFair = async (e, type, id) => {
    if (e) e.preventDefault();
    if (!appFairId) {
      triggerNotification(false, "Selecciona una feria para postularte");
      return;
    }
    const effectiveType = type || (activeRole === "brand" ? "brand" : "band");
    const effectiveId = id || (activeRole === "brand" ? activeBrandId : activeBandId);
    const payload = {
      fairId: Number(appFairId),
      type: effectiveType,
      id: Number(effectiveId)
    };
    try {
      const response = await fetch(`${API_URL}/api/fairs/apply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (response.ok) {
        triggerNotification(true, "✉️ ¡Postulación enviada correctamente al organizador!");
        setAppFairId("");
        fetchData();
      } else {
        const errorData = await response.json();
        triggerNotification(false, errorData.error || "Ya enviaste una postulación para este evento.");
      }
    } catch (err) {
      triggerNotification(false, "Error de red al intentar postular.");
    }
  };

  const sendInvitation = async (senderType, senderId, senderName, receiverPersonId, role) => {
    try {
      const response = await fetch(`${API_URL}/api/invitations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ senderType, senderId, senderName, receiverPersonId, role })
      });
      if (response.ok) {
        triggerNotification(true, "✉️ Invitación de colaboración enviada correctamente.");
        fetchData();
      } else {
        triggerNotification(false, "No se pudo enviar la invitación.");
      }
    } catch (err) {
      triggerNotification(false, "Error de red al intentar enviar invitación.");
    }
  };

  const respondToInvitation = async (invitationId, accept) => {
    try {
      const response = await fetch(`${API_URL}/api/invitations/${invitationId}/respond`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accept })
      });
      if (response.ok) {
        triggerNotification(true, accept ? "✨ ¡Has aceptado la colaboración!" : "Invitación rechazada.");
        fetchData();
      } else {
        triggerNotification(false, "No se pudo responder a la invitación.");
      }
    } catch (err) {
      triggerNotification(false, "Error de red al responder invitación.");
    }
  };

  const changeCollaboratorRole = async (entityType, entityId, personId, role) => {
    try {
      let routeType = entityType;
      if (routeType === "brand") routeType = "brands";
      if (routeType === "band") routeType = "bands";
      if (routeType === "organizer") routeType = "organizers";

      const response = await fetch(`${API_URL}/api/${routeType}/${entityId}/collaborators`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ personId, role })
      });
      if (response.ok) {
        triggerNotification(true, "✨ Rol de colaborador actualizado.");
        fetchData();
      } else {
        const errData = await response.json();
        triggerNotification(false, errData.error || "No se pudo actualizar el rol.");
      }
    } catch (err) {
      triggerNotification(false, "Error de red al actualizar rol.");
    }
  };

  const removeCollaborator = async (entityType, entityId, personId) => {
    try {
      let routeType = entityType;
      if (routeType === "brand") routeType = "brands";
      if (routeType === "band") routeType = "bands";
      if (routeType === "organizer") routeType = "organizers";

      const response = await fetch(`${API_URL}/api/${routeType}/${entityId}/collaborators/${personId}`, {
        method: "DELETE"
      });
      if (response.ok) {
        triggerNotification(true, "Miembro desvinculado del proyecto.");
        fetchData();
      } else {
        const errData = await response.json();
        triggerNotification(false, errData.error || "No se pudo desvincular al colaborador.");
      }
    } catch (err) {
      triggerNotification(false, "Error de red al desvincular colaborador.");
    }
  };

  // Helper functions
  const getCurrentBrand = () => brands.find((b) => b.id === Number(activeBrandId));
  const getBrandName = (id) => {
    const b = brands.find((br) => br.id === Number(id));
    return b ? b.name : "Marca Local";
  };
  const getCurrentOrganizer = () => organizers.find((o) => o.id === Number(activeOrganizerId));
  const getOrganizerName = (id) => {
    const o = organizers.find((org) => org.id === Number(id));
    return o ? o.name : "Organizador Local";
  };
  const getCurrentFair = () => fairs.find((f) => f.id === Number(activeFairId));
  const getCurrentBand = () => bands.find((b) => b.id === Number(activeBandId));
  const getCurrentPerson = () => people.find((p) => p.id === Number(activePersonId));
  const getPersonName = (id) => {
    const p = people.find((pe) => pe.id === Number(id));
    return p ? p.name : "Persona Local";
  };

  return (
    <AppContext.Provider
      value={{
        products, setProducts,
        fairs, setFairs,
        bands, setBands,
        brands, setBrands,
        organizers, setOrganizers,
        people, setPeople,
        loading, setLoading,
        errorMsg, setErrorMsg,
        successMsg, setSuccessMsg,
        activeRole, setActiveRole,
        activeBrandId, setActiveBrandId,
        activeOrganizerId, setActiveOrganizerId,
        activeBandId, setActiveBandId,
        activePersonId, setActivePersonId,
        activeFairId, setActiveFairId,
        searchTerm, setSearchTerm,
        filterType, setFilterType,
        filterCategory, setFilterCategory,
        showRegModal, setShowRegModal,
        showLoginModal, setShowLoginModal,
        loginEmail, setLoginEmail,
        loginPassword, setLoginPassword,
        loginLoading,
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
        uploadingReg, setUploadingReg,
        editProfileOpen, setEditProfileOpen,
        editProfileType, setEditProfileType,
        editProfileId, setEditProfileId,
        editName, setEditName,
        editLastName, setEditLastName,
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
        editBanner, setEditBanner,
        editBannerPreview, setEditBannerPreview,
        editThemeColor, setEditThemeColor,
        editTagline, setEditTagline,
        editInterests, setEditInterests,
        prodFormOpen, setProdFormOpen,
        editingProdId, setEditingProdId,
        prodName, setProdName,
        prodDescription, setProdDescription,
        prodPrice, setProdPrice,
        prodPriceAourum, setProdPriceAourum,
        prodStock, setProdStock,
        prodCategory, setProdCategory,
        prodType, setProdType,
        prodImage, setProdImage,
        prodImagePreview, setProdImagePreview,
        uploadingProd, setUploadingProd,
        fairFormOpen, setFairFormOpen,
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
        appFairId, setAppFairId,
        fetchData,
        uploadImage,
        removeBgAi,
        handleProductSubmit,
        handleDeleteProduct,
        handleDeleteBand,
        handleDeleteBrand,
        handleDeleteOrganizer,
        handleFairSubmit,
        handleAccountRegistration,
        handleLogin,
        forgotPassword,
        resetPassword,
        handleEditProfileSubmit,
        handleApplyToFair,
        invitations,
        sendInvitation,
        respondToInvitation,
        changeCollaboratorRole,
        removeCollaborator,
        getCurrentBrand,
        getBrandName,
        getCurrentOrganizer,
        getOrganizerName,
        getCurrentFair,
        getCurrentBand,
        getCurrentPerson,
        getPersonName,
        triggerNotification,
        logout,
        parseDescription
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function parseDescription(description) {
  const defaultVal = { 
    text: description || "", 
    instagram: "", 
    facebook: "", 
    tiktok: "", 
    website: "",
    rubro_general: "",
    rubro_especifico: "",
    has_local: false,
    local_address: "",
    local_lat: -16.39889,
    local_lng: -71.53694,
    songs: []
  };
  if (!description) return defaultVal;
  const trimmed = description.trim();
  if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
    try {
      const parsed = JSON.parse(description);
      return {
        text: parsed.text || "",
        instagram: parsed.instagram || "",
        facebook: parsed.facebook || "",
        tiktok: parsed.tiktok || "",
        website: parsed.website || "",
        rubro_general: parsed.rubro_general || "",
        rubro_especifico: parsed.rubro_especifico || "",
        has_local: !!parsed.has_local,
        local_address: parsed.local_address || "",
        local_lat: parsed.local_lat !== undefined ? Number(parsed.local_lat) : -16.39889,
        local_lng: parsed.local_lng !== undefined ? Number(parsed.local_lng) : -71.53694,
        songs: parsed.songs || []
      };
    } catch (e) {
      return defaultVal;
    }
  }
  return defaultVal;
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp debe ser utilizado dentro de un AppContextProvider");
  }
  return context;
}
