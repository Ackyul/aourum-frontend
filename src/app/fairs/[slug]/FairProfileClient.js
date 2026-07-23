"use client";

import { use, useEffect, useRef, useState, useMemo } from "react";
import { useApp } from "../../../context/AppContext";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import PostList from "../../../components/PostList";

const getProductViews = (p) => {
  if (!p) return 0;
  if (p.views || p.viewCount) return p.views || p.viewCount;
  // Stable deterministic views generator based on hash of name + id
  let hash = 0;
  const str = p.name + (p.id || 0);
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash % 980) + 120; // 120 to 1100 views
};

const formatDisplayDate = (dateStr) => {
  if (!dateStr) return "";
  const formatSingle = (str) => {
    const trimmed = str.trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
      const [year, month, day] = trimmed.split("-");
      return `${day}/${month}/${year}`;
    }
    return trimmed;
  };
  const separator = dateStr.includes(" al ") ? " al " : (dateStr.includes(" AL ") ? " AL " : null);
  if (separator) {
    const parts = dateStr.split(separator);
    return parts.map(formatSingle).join(" al ");
  }
  return formatSingle(dateStr);
};

const isFairLive = (dateStr) => {
  if (!dateStr) return false;
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  const todayStr = `${yyyy}-${mm}-${dd}`;

  const parseSingleDate = (str) => {
    const trimmed = str.trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
      return trimmed;
    }
    return null;
  };

  if (dateStr.includes(" al ")) {
    const [start, end] = dateStr.split(" al ").map(parseSingleDate);
    if (start && end) {
      return todayStr >= start && todayStr <= end;
    }
  } else if (dateStr.includes(" AL ")) {
    const [start, end] = dateStr.split(" AL ").map(parseSingleDate);
    if (start && end) {
      return todayStr >= start && todayStr <= end;
    }
  }
  const single = parseSingleDate(dateStr);
  if (single) {
    return todayStr === single;
  }
  return false;
};

export default function FairProfileClient({ initialFair }) {
  const routeParams = useParams();
  const slug = routeParams?.slug || "";

  const isNumeric = /^\d+$/.test(slug);
  const [fairId, setFairId] = useState(null);

  const {
    fairs,
    brands,
    bands,
    organizers,
    people,
    products,
    getOrganizerName,
    getBrandName,
    loading,
    activePersonId,
    uploadImage,
    fetchData,
    triggerNotification,
    handleDeleteFair,
    authHeaders,
    loadFairs,
    loadBrands,
    loadBands,
    loadPeople,
    loadProducts,
    parseDescription,
    loadPosts,
    openCreatePostModal
  } = useApp();

  const router = useRouter();

  const [fairPosts, setFairPosts] = useState([]);
  const [fairPostsLoading, setFairPostsLoading] = useState(false);

  useEffect(() => {
    loadFairs();
    loadBrands();
    loadBands();
    loadPeople();
    loadProducts();
  }, [loadFairs, loadBrands, loadBands, loadPeople, loadProducts]);

  const fair = useMemo(() => {
    if (initialFair) return initialFair;
    if (!fairs || fairs.length === 0) return null;
    const normSlug = slug ? slug.toString().toLowerCase() : "";
    const altSlug = normSlug.includes('_') ? normSlug.replace(/_/g, '-') : normSlug.replace(/-/g, '_');
    return fairs.find((f) => {
      if (fairId && f.id === fairId) return true;
      if (isNumeric && f.id === Number(slug)) return true;
      const fSlug = (f.slug || "").toLowerCase();
      return fSlug === normSlug || fSlug === altSlug || f.id.toString() === slug;
    }) || null;
  }, [initialFair, fairs, fairId, isNumeric, slug]);

  useEffect(() => {
    if (fair?.id) {
      setFairPostsLoading(true);
      loadPosts({ fairId: fair.id })
        .then(res => setFairPosts(res || []))
        .finally(() => setFairPostsLoading(false));
    }
  }, [fair?.id, loadPosts]);
  const profileMapContainerRef = useRef(null);
  const profileLeafletMapRef = useRef(null);

  // Edit states
  const [infoModalOpen, setInfoModalOpen] = useState(false);
  const [editBrandsAllowed, setEditBrandsAllowed] = useState(true);
  const [editBandsAllowed, setEditBandsAllowed] = useState(true);
  const [editFairOpen, setEditFairOpen] = useState(false);
  const [editFairName, setEditFairName] = useState("");
  const [editFairLocation, setEditFairLocation] = useState("");
  const [editFairDate, setEditFairDate] = useState("");
  const [editStartDate, setEditStartDate] = useState("");
  const [editEndDate, setEditEndDate] = useState("");
  const [editFairSlug, setEditFairSlug] = useState("");


  const [editFairTime, setEditFairTime] = useState("");
  const [editFairDescription, setEditFairDescription] = useState("");
  const [editFairBanner, setEditFairBanner] = useState("");
  const [editFairBannerPreview, setEditFairBannerPreview] = useState("");
  const [editFairLat, setEditFairLat] = useState(-16.39889);
  const [editFairLng, setEditFairLng] = useState(-71.53694);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [activeEditTab, setActiveEditTab] = useState("general");
  const [activeInfoTab, setActiveInfoTab] = useState("marcas");
  const [locationModalOpen, setLocationModalOpen] = useState(false);
  const [brandSearchQuery, setBrandSearchQuery] = useState("");
  const [bandSearchQuery, setBandSearchQuery] = useState("");
  const trackRefs = useRef({});
  const [visibleCount, setVisibleCount] = useState(12);

  const scrollTrack = (id, direction) => {
    const track = trackRefs.current[id];
    if (track) {
      const scrollAmount = track.clientWidth * 0.75;
      track.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth"
      });
    }
  };

  function FairProductCard({ prod }) {
    const brandOfProd = brands.find(b => b.id === prod.brandId);
    return (
      <div 
        className="glass-panel product-card" 
        style={{ overflow: "hidden", display: "flex", flexDirection: "column", cursor: "pointer", height: "100%" }}
        onClick={() => router.push(`/products/${prod.slug || prod.id}`)}
      >
        <div className="card-img-container" style={{ position: "relative" }}>
          <img src={prod.image} alt={prod.name} className="card-img-hover" />
        </div>
        <div style={{ padding: "1.2rem", flex: 1, display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          <span style={{ fontSize: "0.72rem", color: "var(--text-gold)", letterSpacing: "0.05em", textTransform: "uppercase", fontWeight: 700 }}>
            {prod.category}
          </span>
          <h3 style={{ fontSize: "1.05rem", fontWeight: 800, lineHeight: 1.35, color: "var(--text-primary)" }}>{prod.name}</h3>
          {brandOfProd && (
            <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "4px" }}>
              <i className="fa-solid fa-store" style={{ fontSize: "0.7rem" }}></i> {brandOfProd.name}
            </span>
          )}
          
          <div style={{ 
            display: "flex", 
            justifyContent: "space-between", 
            alignItems: "center", 
            borderTop: "1px solid var(--border-color)", 
            paddingTop: "0.8rem", 
            marginTop: "auto" 
          }}>
            <div>
              {prod.priceAourum ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "1px" }}>
                  <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", textDecoration: "line-through" }}>
                    S/ {prod.price.toLocaleString("es-PE")}
                  </span>
                  <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                    <span style={{ fontSize: "1.05rem", fontWeight: 800, color: "var(--text-gold)" }}>
                      S/ {prod.priceAourum.toLocaleString("es-PE")}
                    </span>
                    <span style={{ fontSize: "0.55rem", background: "var(--gold-gradient)", color: "#1C1C1E", padding: "1px 4px", borderRadius: "3px", fontWeight: "bold", textTransform: "uppercase" }}>
                      Aourum
                    </span>
                  </div>
                </div>
              ) : (
                <span style={{ fontSize: "1.05rem", fontWeight: 800, color: "var(--text-primary)" }}>
                  S/ {prod.price.toLocaleString("es-PE")}
                </span>
              )}
            </div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "2px" }}>
              <span className="card-type-label" style={{
                fontSize: "0.65rem",
                fontWeight: 700,
                textTransform: "uppercase",
                color: prod.type === "service" ? "#1e3a8a" : "#78350f",
                letterSpacing: "0.03em"
              }}>
                {prod.type === "service" ? "Servicio" : "Producto"}
              </span>
              <span className="card-stock-label" style={{
                fontSize: "0.65rem",
                fontWeight: 700,
                padding: "2px 6px",
                borderRadius: "8px",
                textTransform: "uppercase",
                letterSpacing: "0.02em",
                background: prod.type === "service" ? "#dbeafe" : (prod.stock == null || prod.stock > 0) ? "#dcfce7" : "#fee2e2",
                color: prod.type === "service" ? "#1e40af" : (prod.stock == null || prod.stock > 0) ? "#15803d" : "#b91c1c"
              }}>
                {prod.type === "service" ? "Agenda" : (prod.stock == null || prod.stock > 0) ? "Stock" : "Agotado"}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const renderCarousel = (id, title, subtitle, sectionProducts) => {
    if (sectionProducts.length === 0) return null;

    return (
      <div key={id} className="carousel-container fade-in" style={{ marginBottom: "2.5rem" }}>
        <div className="carousel-header" style={{ marginBottom: "1.0rem" }}>
          <div className="carousel-title-group">
            <h3 className="carousel-title" style={{ fontSize: "1.3rem", fontWeight: 800, margin: 0 }}>{title}</h3>
            {subtitle && <p className="carousel-subtitle" style={{ fontSize: "0.85rem", color: "var(--text-muted)", margin: "4px 0 0 0" }}>{subtitle}</p>}
          </div>
          <div className="carousel-actions">
            <div className="carousel-arrows">
              <button className="carousel-arrow-btn" onClick={() => scrollTrack(id, "left")} aria-label="Anterior">
                <i className="fa-solid fa-chevron-left"></i>
              </button>
              <button className="carousel-arrow-btn" onClick={() => scrollTrack(id, "right")} aria-label="Siguiente">
                <i className="fa-solid fa-chevron-right"></i>
              </button>
            </div>
          </div>
        </div>

        <div className="carousel-track-wrapper">
          <div className="carousel-track" ref={el => {
            if (el) {
              trackRefs.current[id] = el;
            } else {
              delete trackRefs.current[id];
            }
          }}>
            {sectionProducts.map((prod) => (
              <div key={prod.id} className="carousel-item">
                <FairProductCard prod={prod} />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // Edit Map Refs
  const editMapContainerRef = useRef(null);
  const editLeafletMapRef = useRef(null);
  const editMarkerRef = useRef(null);

  useEffect(() => {
    if (fair && !fairId) {
      setFairId(fair.id);
    }
  }, [fair, fairId]);

  // Redirect from numeric ID or changed slug to current slug-based URL
  useEffect(() => {
    if (fair && fair.slug && (isNumeric || fair.slug !== slug)) {
      router.replace(`/fairs/${fair.slug}`);
    }
  }, [fair, isNumeric, slug, router]);

  // Inicializa las fechas locales al abrir el formulario de edición
  useEffect(() => {
    if (editFairOpen && fair && fair.date) {
      if (fair.date.includes(" al ")) {
        const parts = fair.date.split(" al ");
        setEditStartDate(parts[0]);
        setEditEndDate(parts[1]);
      } else {
        setEditStartDate(fair.date);
        setEditEndDate("");
      }
    }
  }, [editFairOpen, fair]);

  // Sincroniza la fecha combinada para enviarla al backend
  useEffect(() => {
    const combined = editEndDate ? `${editStartDate} al ${editEndDate}` : editStartDate;
    setEditFairDate(combined);
  }, [editStartDate, editEndDate]);

  // Lock background scroll when modal is open
  useEffect(() => {
    if (editFairOpen || infoModalOpen || locationModalOpen) {
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
  }, [editFairOpen, infoModalOpen, locationModalOpen]);

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
  }, [fair, locationModalOpen]);

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

  // When switching to the 'ubicacion' tab, invalidate leaflet map size so it renders correctly
  useEffect(() => {
    if (activeEditTab === "ubicacion" && editLeafletMapRef.current) {
      setTimeout(() => {
        editLeafletMapRef.current.invalidateSize();
      }, 100);
    }
  }, [activeEditTab]);

  const fairProducts = useMemo(() => {
    if (!fair || !fair.acceptedBrands || !products) return [];
    return products.filter(p => p.brandId && fair.acceptedBrands.includes(p.brandId));
  }, [fair, products]);

  const featuredFairProducts = useMemo(() => {
    if (!fairProducts.length) return [];
    return [...fairProducts]
      .sort((a, b) => getProductViews(b) - getProductViews(a))
      .slice(0, 8);
  }, [fairProducts]);

  const fairCategories = useMemo(() => {
    const seen = new Set();
    const unique = [];
    fairProducts.forEach(p => {
      if (p.category) {
        const trimmed = p.category.trim();
        const lower = trimmed.toLowerCase();
        if (!seen.has(lower)) {
          seen.add(lower);
          unique.push(trimmed);
        }
      }
    });
    return unique;
  }, [fairProducts]);

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
  
  const isOwner = userRole === 'creador_original';

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
    
    const parsed = parseDescription(fair.description);
    setEditFairDescription(parsed.text || "");
    const fType = parsed.fair_type || "both";
    setEditBrandsAllowed(fType === "both" || fType === "only_brands");
    setEditBandsAllowed(fType === "both" || fType === "only_bands");

    setEditFairBanner(fair.banner || "");
    setEditFairBannerPreview(fair.banner || "");
    setEditFairLat(fair.lat || -16.39889);
    setEditFairLng(fair.lng || -71.53694);
    setEditFairSlug(fair.slug || "");
    setActiveEditTab("general");
    setEditFairOpen(true);
  };

  const handleDeleteClick = async () => {
    const success = await handleDeleteFair(fair.id);
    if (success) {
      router.replace("/");
    }
  };

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

  const handleEditFairSubmit = async (e) => {
    e.preventDefault();
    if (!editFairName || !editFairLocation || !editFairDate) {
      triggerNotification(false, "Completa los campos obligatorios del evento");
      return;
    }
    setIsSaving(true);
    
    let finalFairType = "both";
    if (editBrandsAllowed && !editBandsAllowed) {
      finalFairType = "only_brands";
    } else if (!editBrandsAllowed && editBandsAllowed) {
      finalFairType = "only_bands";
    } else if (!editBrandsAllowed && !editBandsAllowed) {
      triggerNotification(false, "Debes seleccionar al menos un tipo de participante (marcas o bandas)");
      setIsSaving(false);
      return;
    }

    const descriptionPayload = JSON.stringify({
      text: editFairDescription,
      fair_type: finalFairType
    });

    const payload = {
      name: editFairName,
      location: editFairLocation,
      date: editFairDate,
      time: editFairTime,
      banner: editFairBanner,
      description: descriptionPayload,
      lat: editFairLat,
      lng: editFairLng,
      organizerId: fair.organizerId,
      slug: editFairSlug
    };

    try {
      const response = await fetch(`${API_URL}/api/fairs/${fair.id}`, {
        method: "PUT",
        headers: authHeaders(),
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        const updatedFair = await response.json();
        triggerNotification(true, "🎪 ¡Feria actualizada correctamente!");
        setEditFairOpen(false);
        fetchData();
        if (updatedFair.slug && updatedFair.slug !== slug) {
          router.replace(`/fairs/${updatedFair.slug}`);
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        triggerNotification(false, errorData.error || "No se pudo actualizar la feria.");
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
        headers: authHeaders(),
        body: JSON.stringify({ type, entityId: Number(entityId), accept })
      });
      if (response.ok) {
        triggerNotification(true, accept ? "✨ ¡Postulación aprobada!" : "Postulación rechazada.");
        fetchData();
      } else {
        const errorData = await response.json().catch(() => ({}));
        triggerNotification(false, errorData.error || "No se pudo procesar la postulación.");
      }
    } catch (err) {
      triggerNotification(false, "Error de red al procesar postulación.");
    }
  };

  const parsed = fair ? parseDescription(fair.description) : { text: "", fair_type: "both" };
  const fairType = parsed.fair_type || "both";
  const descriptionText = parsed.text || "";

  // useMemo hooks moved before loading check

  const filteredBrands = fair && fair.acceptedBrands
    ? fair.acceptedBrands
        .map(bId => brands.find(br => br.id === bId))
        .filter(b => b && b.name.toLowerCase().includes(brandSearchQuery.toLowerCase()))
    : [];

  const filteredBands = fair && fair.acceptedBands
    ? fair.acceptedBands
        .map(bId => bands.find(br => br.id === bId))
        .filter(b => b && b.name.toLowerCase().includes(bandSearchQuery.toLowerCase()))
    : [];

  if (loading && !fair) {
    return (
      <div className="container" style={{ textAlign: "center", padding: "6rem 0" }}>
        <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: "2.5rem", color: "var(--gold-primary)", marginBottom: "1rem" }}></i>
        <p style={{ color: "var(--text-muted)", fontSize: "0.95rem" }}>Cargando evento...</p>
      </div>
    );
  }

  if (!fair) {
    return (
      <div className="container" style={{ textAlign: "center", padding: "6rem 0" }}>
        <i className="fa-solid fa-calendar-xmark" style={{ fontSize: "3.5rem", color: "var(--text-muted)", marginBottom: "1rem" }}></i>
        <h2 style={{ fontSize: "1.6rem", fontWeight: 800, marginTop: "0.5rem", color: "var(--text-primary)" }}>Feria no encontrada</h2>
        <p style={{ color: "var(--text-muted)", margin: "0.5rem 0 1.5rem 0" }}>El evento que buscas no existe o ha finalizado.</p>
        <Link href="/fairs" className="btn-gold" style={{ padding: "0.6rem 1.2rem", borderRadius: "8px", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "6px" }}>
          <i className="fa-solid fa-arrow-left"></i> Volver a Ferias
        </Link>
      </div>
    );
  }

  return (
    <div className="container" style={{ maxWidth: "1400px", padding: "0 1rem" }}>
      <style>{`
        @keyframes pulse-live {
          0% { transform: scale(0.9); opacity: 0.6; }
          50% { transform: scale(1.3); opacity: 1; }
          100% { transform: scale(0.9); opacity: 0.6; }
        }
      `}</style>
      <div style={{ position: "relative", marginBottom: "2.5rem" }}>
        <button onClick={() => router.push("/fairs")} className="profile-close-btn" style={{ position: "absolute", top: "15px", right: "15px", zIndex: 10 }}>&times;</button>
        <button onClick={copyLink} className="profile-share-btn" style={{ position: "absolute", top: "15px", right: "60px", zIndex: 10 }} title="Copiar enlace del evento">
          <i className="fa-solid fa-share-nodes"></i>
        </button>
        
        <div className="profile-header-banner">
          <img src={fair.banner} alt={fair.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        </div>

        <div className="profile-body">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem" }}>
            <div>
              <div style={{ display: "flex", gap: "10px", alignItems: "center", fontSize: "0.85rem", color: "var(--gold-dark)", textTransform: "uppercase", fontWeight: 700, marginBottom: "0.5rem", flexWrap: "wrap" }}>
                {isFairLive(fair.date) && (
                  <span style={{ background: "#ef4444", color: "white", padding: "2px 8px", borderRadius: "12px", fontSize: "0.7rem", fontWeight: 800, display: "inline-flex", alignItems: "center", gap: "4px", boxShadow: "0 0 8px rgba(239,68,68,0.25)" }}>
                    <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "white", display: "inline-block", animation: "pulse-live 1.5s infinite" }}></span>
                    EN VIVO
                  </span>
                )}
                <span><i className="fa-solid fa-calendar-days"></i> {formatDisplayDate(fair.date)}</span>
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
                            <span>{p.name}</span>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              <button
                onClick={() => setLocationModalOpen(true)}
                className="btn-outline-gold"
                style={{ padding: "0.5rem 1rem", borderRadius: "8px", fontSize: "0.85rem", fontWeight: 700, display: "flex", alignItems: "center", gap: "6px" }}
              >
                <i className="fa-solid fa-location-dot"></i> Ubicación
              </button>
              <button
                onClick={() => {
                  if (fairType === "only_bands") {
                    setActiveInfoTab("bandas");
                  } else {
                    setActiveInfoTab("marcas");
                  }
                  setInfoModalOpen(true);
                }}
                className="btn-outline-gold"
                style={{ padding: "0.5rem 1rem", borderRadius: "8px", fontSize: "0.85rem", fontWeight: 700, display: "flex", alignItems: "center", gap: "6px" }}
              >
                <i className="fa-solid fa-circle-info"></i> Información
              </button>
              {canEditFair && (
                <button
                  onClick={handleEditClick}
                  className="btn-outline-gold"
                  style={{ padding: "0.5rem 1rem", borderRadius: "8px", fontSize: "0.85rem", fontWeight: 700, display: "flex", alignItems: "center", gap: "6px" }}
                >
                  <i className="fa-solid fa-gear"></i> Editar Feria
                </button>
              )}
              {isOwner && (
                <button
                  onClick={handleDeleteClick}
                  className="btn-outline-gold"
                  style={{ padding: "0.5rem 1rem", borderRadius: "8px", fontSize: "0.85rem", fontWeight: 700, display: "flex", alignItems: "center", gap: "6px", color: "#ef4444", borderColor: "#ef4444" }}
                >
                  <i className="fa-solid fa-trash"></i> Eliminar Feria
                </button>
              )}
            </div>
          </div>

          {/* Sección de Postulaciones Pendientes para Organizador */}
          {isOwner && (
            <div className="glass-panel" style={{ padding: "1.8rem", marginTop: "1.5rem", marginBottom: "2.2rem" }}>
              <h3 style={{ fontSize: "1.15rem", fontWeight: 800, marginBottom: "1.2rem", color: "var(--text-gold)", display: "flex", alignItems: "center", gap: 8 }}>
                <i className="fa-solid fa-envelope-open-text"></i> Postulaciones Recibidas (Pendientes)
              </h3>
              
              <div className="postulaciones-grid" style={{ gridTemplateColumns: (fairType === "both") ? undefined : "1fr" }}>
                {/* Marcas Pendientes */}
                {(fairType === "both" || fairType === "only_brands") && (
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
                )}

                {/* Bandas Pendientes */}
                {(fairType === "both" || fairType === "only_bands") && (
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
                )}
              </div>
            </div>
          )}
          
          </div>
        </div>

        {/* ── SECCIÓN: CATÁLOGO DE LA FERIA ── */}
        {fairProducts.length > 0 && (
          <div style={{ marginTop: "3.5rem", borderTop: "1px solid var(--border-color)", paddingTop: "3rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
              <h2 style={{ fontSize: "1.7rem", fontWeight: 800, letterSpacing: "-0.015em", margin: 0, color: "var(--text-gold)" }}>
                Catálogo de la Feria
              </h2>
            </div>

            {/* 1. Carrusel de Productos Destacados de la Feria */}
            {renderCarousel(
              "productos-destacados-feria",
              "Productos Destacados",
              `Los artículos más populares y recomendados de las marcas en ${fair.name}`,
              featuredFairProducts
            )}

            {/* 2. Carruseles por Categoría de la Feria */}
            {fairCategories.map((cat) => (
              renderCarousel(
                `cat-${cat.toLowerCase().replace(/[^a-z0-9]/g, "")}`,
                cat,
                `Explora la variedad en ${cat.toLowerCase()}`,
                fairProducts.filter(p => p.category && p.category.trim().toLowerCase() === cat.trim().toLowerCase())
              )
            ))}

            {/* 3. Grilla General de Todos los Productos de la Feria */}
            <div style={{ borderTop: "1px solid var(--border-color)", paddingTop: "3rem", marginTop: "2rem" }}>
              <h2 style={{ fontSize: "1.5rem", fontWeight: 800, marginBottom: "1.5rem", color: "var(--text-gold)" }}>
                Vitrina de Productos de la Feria
              </h2>
              <div className="grid-catalog">
                {fairProducts.slice(0, visibleCount).map((prod) => (
                  <FairProductCard key={prod.id} prod={prod} />
                ))}
              </div>

              {fairProducts.length > visibleCount && (
                <div style={{ display: "flex", justifyContent: "center", marginTop: "3rem" }}>
                  <button 
                    onClick={() => setVisibleCount((prev) => prev + 12)}
                    className="btn-outline-gold"
                    style={{
                      borderRadius: "30px",
                      padding: "0.75rem 2rem",
                      fontSize: "0.9rem",
                      fontWeight: 700,
                      boxShadow: "0 4px 12px rgba(214,175,55,0.08)",
                      cursor: "pointer"
                    }}
                  >
                    <i className="fa-solid fa-arrow-rotate-right" style={{ marginRight: "8px" }}></i>
                    Ver más productos
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      {/* ── MURO DE LA FERIA ── */}
      <div style={{ marginTop: "4rem", borderTop: "1px solid var(--border-color)", paddingTop: "3rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", flexWrap: "wrap", gap: "10px" }}>
          <div>
            <h2 style={{ fontSize: "1.6rem", fontWeight: 800, margin: 0, display: "flex", alignItems: "center", gap: "10px" }}>
              <i className="fa-solid fa-comments" style={{ color: "var(--gold-primary)" }}></i>
              Muro de la Feria
            </h2>
            <p style={{ fontSize: "0.88rem", color: "var(--text-muted)", margin: "4px 0 0 0" }}>
              Todas las publicaciones, fotos y vivencias compartidas por asistentes, marcas y productores en {fair?.name || 'la feria'}.
            </p>
          </div>

          <button
            type="button"
            onClick={() => openCreatePostModal({ fairId: fair?.id })}
            className="btn-gold"
            style={{ padding: "0.55rem 1.2rem", fontSize: "0.88rem", borderRadius: "10px", fontWeight: 700, display: "inline-flex", alignItems: "center", gap: "8px" }}
          >
            <i className="fa-solid fa-pen-to-square"></i> Publicar en esta Feria
          </button>
        </div>

        <PostList
          posts={fairPosts}
          loading={fairPostsLoading}
          emptyMessage={`Aún no hay publicaciones en el muro de ${fair?.name || 'esta feria'}.`}
          onPostDeleted={(id) => setFairPosts(prev => prev.filter(p => p.id !== id))}
        />
      </div>

      {/* ── MODAL: EDITAR FERIA / EVENTO ── */}
      {canEditFair && editFairOpen && (
        <div className="modal-overlay" style={{ zIndex: 1100 }}>
          <div className="modal-backdrop" onClick={() => setEditFairOpen(false)}></div>
          <div className="modal-panel fade-in" style={{ maxWidth: "550px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
              <h3 style={{ fontSize: "1.3rem", fontWeight: 800, margin: 0 }}>
                🎪 Editar Información del Evento
              </h3>
              <button onClick={() => setEditFairOpen(false)} style={{ background: "rgba(0,0,0,0.04)", border: "none", fontSize: "1.2rem", cursor: "pointer", width: "32px", height: "32px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>&times;</button>
            </div>

            <form onSubmit={handleEditFairSubmit}>
              {/* Tab bar header */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", borderBottom: "1.5px solid var(--border-color)", paddingBottom: "0.6rem", marginBottom: "1.2rem" }}>
                <button 
                  type="button" 
                  onClick={() => setActiveEditTab("general")} 
                  style={{
                    background: activeEditTab === "general" ? "var(--gold-gradient)" : "transparent",
                    color: activeEditTab === "general" ? "#1C1C1E" : "var(--text-muted)",
                    border: "1px solid " + (activeEditTab === "general" ? "var(--gold-primary)" : "transparent"),
                    padding: "0.45rem 1rem",
                    borderRadius: "20px",
                    fontSize: "0.82rem",
                    fontWeight: 700,
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                    transition: "var(--transition-smooth)",
                    boxShadow: activeEditTab === "general" ? "0 4px 10px rgba(212,175,55,0.15)" : "none"
                  }}
                >
                  ⚙️ General
                </button>
                <button 
                  type="button" 
                  onClick={() => {
                    setActiveEditTab("ubicacion");
                    if (window.dispatchEvent) {
                      setTimeout(() => window.dispatchEvent(new Event('resize')), 100);
                    }
                  }} 
                  style={{
                    background: activeEditTab === "ubicacion" ? "var(--gold-gradient)" : "transparent",
                    color: activeEditTab === "ubicacion" ? "#1C1C1E" : "var(--text-muted)",
                    border: "1px solid " + (activeEditTab === "ubicacion" ? "var(--gold-primary)" : "transparent"),
                    padding: "0.45rem 1rem",
                    borderRadius: "20px",
                    fontSize: "0.82rem",
                    fontWeight: 700,
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                    transition: "var(--transition-smooth)",
                    boxShadow: activeEditTab === "ubicacion" ? "0 4px 10px rgba(212,175,55,0.15)" : "none"
                  }}
                >
                  📍 Ubicación
                </button>
                <button 
                  type="button" 
                  onClick={() => setActiveEditTab("contenido")} 
                  style={{
                    background: activeEditTab === "contenido" ? "var(--gold-gradient)" : "transparent",
                    color: activeEditTab === "contenido" ? "#1C1C1E" : "var(--text-muted)",
                    border: "1px solid " + (activeEditTab === "contenido" ? "var(--gold-primary)" : "transparent"),
                    padding: "0.45rem 1rem",
                    borderRadius: "20px",
                    fontSize: "0.82rem",
                    fontWeight: 700,
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                    transition: "var(--transition-smooth)",
                    boxShadow: activeEditTab === "contenido" ? "0 4px 10px rgba(212,175,55,0.15)" : "none"
                  }}
                >
                  📝 Contenido
                </button>
                <button 
                  type="button" 
                  onClick={() => setActiveEditTab("personalizacion")} 
                  style={{
                    background: activeEditTab === "personalizacion" ? "var(--gold-gradient)" : "transparent",
                    color: activeEditTab === "personalizacion" ? "#1C1C1E" : "var(--text-muted)",
                    border: "1px solid " + (activeEditTab === "personalizacion" ? "var(--gold-primary)" : "transparent"),
                    padding: "0.45rem 1rem",
                    borderRadius: "20px",
                    fontSize: "0.82rem",
                    fontWeight: 700,
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                    transition: "var(--transition-smooth)",
                    boxShadow: activeEditTab === "personalizacion" ? "0 4px 10px rgba(212,175,55,0.15)" : "none"
                  }}
                >
                  🎨 Personalización
                </button>
              </div>

              {/* SECCIÓN: GENERAL */}
              <div style={{ display: activeEditTab === "general" ? "block" : "none" }} className="fade-in">
                <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem" }}>
                  <div className="form-group" style={{ flex: "1 1 200px", minWidth: "0" }}>
                    <label>Nombre del Evento *</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      value={editFairName} 
                      onChange={(e) => setEditFairName(e.target.value)} 
                      required={activeEditTab === "general"} 
                    />
                  </div>
                  <div className="form-group" style={{ flex: "1 1 200px", minWidth: "0" }}>
                    <label>Identificador de URL (Slug) *</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      value={editFairSlug} 
                      onChange={(e) => setEditFairSlug(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))} 
                      required={activeEditTab === "general"} 
                      placeholder="Ej: rock-food-fest"
                    />
                  </div>
                </div>

                <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem" }}>
                  <div className="form-group" style={{ flex: "1 1 200px", minWidth: "0" }}>
                    <label>Fecha de Inicio *</label>
                    <input 
                      type="date" 
                      className="form-control" 
                      value={editStartDate} 
                      onChange={(e) => setEditStartDate(e.target.value)} 
                      required={activeEditTab === "general"} 
                    />
                  </div>
                  <div className="form-group" style={{ flex: "1 1 200px", minWidth: "0" }}>
                    <label>Fecha de Final (Opcional)</label>
                    <input type="date" className="form-control" value={editEndDate} onChange={(e) => setEditEndDate(e.target.value)} />
                  </div>
                </div>

                <div className="form-group">
                  <label>Horario (Opcional)</label>
                  <input type="text" className="form-control" placeholder="Ej: 10:00 - 20:00" value={editFairTime} onChange={(e) => setEditFairTime(e.target.value)} />
                </div>
              </div>

              {/* SECCIÓN: UBICACIÓN */}
              <div style={{ display: activeEditTab === "ubicacion" ? "block" : "none" }} className="fade-in">
                <div className="form-group">
                  <label>Dirección del Evento *</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    value={editFairLocation} 
                    onChange={(e) => setEditFairLocation(e.target.value)} 
                    required={activeEditTab === "ubicacion"} 
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
              </div>

              {/* SECCIÓN: CONTENIDO */}
              <div style={{ display: activeEditTab === "contenido" ? "block" : "none" }} className="fade-in">
                <div className="form-group" style={{ marginBottom: "1.2rem" }}>
                  <label style={{ fontWeight: 700, fontSize: "0.85rem", color: "var(--text-primary)", display: "block", marginBottom: "0.6rem" }}>
                    Tipo de Participantes Requeridos (Selecciona al menos uno) *
                  </label>
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    <label style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer", fontSize: "0.9rem", color: "var(--text-primary)" }}>
                      <input 
                        type="checkbox" 
                        checked={editBrandsAllowed} 
                        onChange={(e) => setEditBrandsAllowed(e.target.checked)} 
                        style={{ 
                          width: "18px", 
                          height: "18px", 
                          cursor: "pointer", 
                          accentColor: "var(--gold-primary)" 
                        }} 
                      />
                      <span>🏪 Marcas y Emprendimientos Locales</span>
                    </label>
                    <label style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer", fontSize: "0.9rem", color: "var(--text-primary)" }}>
                      <input 
                        type="checkbox" 
                        checked={editBandsAllowed} 
                        onChange={(e) => setEditBandsAllowed(e.target.checked)} 
                        style={{ 
                          width: "18px", 
                          height: "18px", 
                          cursor: "pointer", 
                          accentColor: "var(--gold-primary)" 
                        }} 
                      />
                      <span>🎸 Bandas y Proyectos de Música (Lineup)</span>
                    </label>
                  </div>
                </div>

                <div className="form-group">
                  <label>Descripción del Evento</label>
                  <textarea className="form-control" rows="4" style={{ resize: "none" }} value={editFairDescription} onChange={(e) => setEditFairDescription(e.target.value)} placeholder="Escribe los detalles de la feria, atracciones, etc."></textarea>
                </div>
              </div>

              {/* SECCIÓN: PERSONALIZACIÓN */}
              <div style={{ display: activeEditTab === "personalizacion" ? "block" : "none" }} className="fade-in">
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
              </div>

              <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", marginTop: "1.5rem" }}>
                <button type="button" onClick={() => setEditFairOpen(false)} className="btn-outline-gold" style={{ padding: "0.45rem 1.2rem", borderRadius: "6px", fontSize: "0.85rem" }}>
                  Cancelar
                </button>
                <button type="submit" className="btn-gold" style={{ padding: "0.45rem 1.2rem", borderRadius: "6px", fontSize: "0.85rem" }} disabled={uploadingBanner || isSaving}>
                  {isSaving ? "Guardando..." : "Guardar Cambios"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* ── MODAL: INFORMACIÓN DE LA FERIA / EVENTO ── */}
      {/* ── MODAL: UBICACIÓN DEL EVENTO ── */}
      {locationModalOpen && (
        <div className="modal-overlay" style={{ zIndex: 1100 }}>
          <div className="modal-backdrop" onClick={() => setLocationModalOpen(false)}></div>
          <div className="modal-panel fade-in" style={{ maxWidth: "600px", width: "90%", maxHeight: "85vh", display: "flex", flexDirection: "column", padding: 0 }}>
            {/* Modal Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "1.5rem", borderBottom: "1px solid var(--border-color)" }}>
              <h3 style={{ fontSize: "1.3rem", fontWeight: 800, margin: 0, color: "var(--text-gold)", display: "flex", alignItems: "center", gap: "8px" }}>
                <i className="fa-solid fa-location-dot"></i> Ubicación del Evento
              </h3>
              <button onClick={() => setLocationModalOpen(false)} style={{ background: "rgba(0,0,0,0.04)", border: "none", fontSize: "1.2rem", cursor: "pointer", width: "32px", height: "32px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>&times;</button>
            </div>

            {/* Modal Body */}
            <div style={{ overflowY: "auto", padding: "1.5rem", flex: 1, display: "flex", flexDirection: "column", gap: "1rem" }}>
              {fair.location && (
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", flexWrap: "wrap", gap: "10px" }}>
                    <div>
                      <h4 style={{ fontSize: "0.95rem", fontWeight: 800, color: "var(--text-gold)", marginBottom: "0.2rem" }}>Dirección</h4>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.88rem", color: "var(--text-primary)" }}>
                        <i className="fa-solid fa-location-dot" style={{ color: "var(--gold-primary)" }}></i>
                        <span>{fair.location}</span>
                      </div>
                    </div>
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${fair.lat || -16.39889},${fair.lng || -71.53694}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-outline-gold"
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px",
                        padding: "5px 12px",
                        borderRadius: "20px",
                        fontSize: "0.78rem",
                        fontWeight: 700,
                        textDecoration: "none"
                      }}
                    >
                      <i className="fa-solid fa-map-location-dot"></i> Google Maps
                    </a>
                  </div>
                  <div ref={profileMapContainerRef} style={{ height: "280px", width: "100%", borderRadius: "10px", border: "1px solid var(--border-color)", zIndex: 1, boxShadow: "0 4px 16px rgba(0,0,0,0.03)" }}></div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div style={{ padding: "1.2rem", borderTop: "1px solid var(--border-color)", display: "flex", justifyContent: "flex-end" }}>
              <button onClick={() => setLocationModalOpen(false)} className="btn-gold" style={{ padding: "0.45rem 1.5rem", borderRadius: "6px", fontSize: "0.85rem" }}>
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: INFORMACIÓN Y CONTENIDO DE LA FERIA ── */}
      {infoModalOpen && (
        <div className="modal-overlay" style={{ zIndex: 1100 }}>
          <div className="modal-backdrop" onClick={() => setInfoModalOpen(false)}></div>
          <div className="modal-panel fade-in" style={{ maxWidth: "650px", width: "95%", maxHeight: "90vh", display: "flex", flexDirection: "column", padding: 0 }}>
            {/* Modal Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "1.5rem 1.5rem 0.8rem 1.5rem" }}>
              <h3 style={{ fontSize: "1.3rem", fontWeight: 800, margin: 0, color: "var(--text-gold)", display: "flex", alignItems: "center", gap: "8px" }}>
                <i className="fa-solid fa-store"></i> {fairType === "only_bands" ? "Lineup de Música" : "Marcas Presentes"}
              </h3>
              <button onClick={() => setInfoModalOpen(false)} style={{ background: "rgba(0,0,0,0.04)", border: "none", fontSize: "1.2rem", cursor: "pointer", width: "32px", height: "32px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>&times;</button>
            </div>

            {/* Description is always shown at the top of the body if present */}
            {descriptionText && (
              <div style={{ padding: "0 1.5rem 0.8rem 1.5rem" }}>
                <div>
                  <h4 style={{ fontSize: "0.95rem", fontWeight: 800, color: "var(--text-gold)", marginBottom: "0.4rem" }}>Sobre el Evento</h4>
                  <p style={{ fontSize: "0.92rem", color: "var(--text-primary)", lineHeight: 1.6, margin: 0 }}>
                    {descriptionText}
                  </p>
                </div>
              </div>
            )}

            {/* Tab bar header for Info Modal: Only Marcas and Bandas tabs as shown in the screenshot */}
            {(fairType === "both") && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", borderBottom: "1.5px solid var(--border-color)", padding: "0 1.5rem 0.8rem 1.5rem", marginBottom: "0.5rem" }}>
                <button 
                  type="button" 
                  onClick={() => setActiveInfoTab("marcas")} 
                  style={{
                    background: activeInfoTab === "marcas" ? "var(--gold-gradient)" : "transparent",
                    color: activeInfoTab === "marcas" ? "#1C1C1E" : "var(--text-muted)",
                    border: "1px solid " + (activeInfoTab === "marcas" ? "var(--gold-primary)" : "transparent"),
                    padding: "0.45rem 1rem",
                    borderRadius: "20px",
                    fontSize: "0.82rem",
                    fontWeight: 700,
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                    transition: "var(--transition-smooth)",
                    boxShadow: activeInfoTab === "marcas" ? "0 4px 10px rgba(212,175,55,0.15)" : "none"
                  }}
                >
                  🏪 Marcas
                </button>
                <button 
                  type="button" 
                  onClick={() => setActiveInfoTab("bandas")} 
                  style={{
                    background: activeInfoTab === "bandas" ? "var(--gold-gradient)" : "transparent",
                    color: activeInfoTab === "bandas" ? "#1C1C1E" : "var(--text-muted)",
                    border: "1px solid " + (activeInfoTab === "bandas" ? "var(--gold-primary)" : "transparent"),
                    padding: "0.45rem 1rem",
                    borderRadius: "20px",
                    fontSize: "0.82rem",
                    fontWeight: 700,
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                    transition: "var(--transition-smooth)",
                    boxShadow: activeInfoTab === "bandas" ? "0 4px 10px rgba(212,175,55,0.15)" : "none"
                  }}
                >
                  🎸 Bandas
                </button>
              </div>
            )}

            {/* Modal Body */}
            <div style={{ overflowY: "auto", padding: "1.2rem 1.5rem", flex: 1, display: "flex", flexDirection: "column" }}>
              {/* TAB: MARCAS */}
              {(fairType === "both" || fairType === "only_brands") && (activeInfoTab === "marcas" || fairType === "only_brands") && (
                <div className="fade-in">
                  <h4 style={{ fontSize: "1rem", fontWeight: 800, color: "var(--text-gold)", marginBottom: "1rem", display: "flex", alignItems: "center", gap: "6px" }}>
                    <i className="fa-solid fa-store" style={{ color: "var(--gold-primary)" }}></i> Marcas Presentes
                  </h4>

                  {/* Search input for Brands */}
                  {fair.acceptedBrands && fair.acceptedBrands.length > 0 && (
                    <div style={{ position: "relative", marginBottom: "1.2rem" }}>
                      <i className="fa-solid fa-magnifying-glass" style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)", fontSize: "0.85rem" }}></i>
                      <input
                        type="text"
                        placeholder="Buscar marca..."
                        value={brandSearchQuery}
                        onChange={(e) => setBrandSearchQuery(e.target.value)}
                        className="form-control"
                        style={{ paddingLeft: "32px", fontSize: "0.85rem", height: "36px", borderRadius: "8px" }}
                      />
                      {brandSearchQuery && (
                        <button 
                          onClick={() => setBrandSearchQuery("")} 
                          style={{ position: "absolute", right: "10px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: "1.1rem" }}
                        >
                          &times;
                        </button>
                      )}
                    </div>
                  )}

                  {filteredBrands.length > 0 ? (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "0.8rem", maxHeight: "350px", overflowY: "auto", paddingRight: "4px" }}>
                      {filteredBrands.map((b) => (
                        <div 
                          key={b.id} 
                          onClick={() => {
                            setInfoModalOpen(false);
                            router.push(`/brands/${b.slug || b.id}`);
                          }}
                          style={{ display: "flex", alignItems: "center", gap: "10px", padding: "0.6rem", background: "var(--bg-input)", borderRadius: "8px", cursor: "pointer", border: "1px solid var(--border-color)" }}
                          className="glass-panel"
                        >
                          <img src={b.logo} alt={b.name} style={{ width: "32px", height: "32px", borderRadius: "50%", objectFit: "cover", border: "1px solid var(--border-color)" }} />
                          <div>
                            <strong style={{ fontSize: "0.82rem", color: "var(--text-primary)", display: "block" }}>{b.name}</strong>
                            <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>{b.category}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
                      {brandSearchQuery ? "No se encontraron marcas con ese nombre." : "Aún no hay marcas confirmadas para este evento."}
                    </p>
                  )}
                </div>
              )}

              {/* TAB: BANDAS */}
              {(fairType === "both" || fairType === "only_bands") && (activeInfoTab === "bandas" || fairType === "only_bands") && (
                <div className="fade-in">
                  <h4 style={{ fontSize: "1rem", fontWeight: 800, color: "var(--text-gold)", marginBottom: "1rem", display: "flex", alignItems: "center", gap: "6px" }}>
                    <i className="fa-solid fa-music" style={{ color: "var(--gold-primary)" }}></i> Lineup de Música
                  </h4>

                  {/* Search input for Bands */}
                  {fair.acceptedBands && fair.acceptedBands.length > 0 && (
                    <div style={{ position: "relative", marginBottom: "1.2rem" }}>
                      <i className="fa-solid fa-magnifying-glass" style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)", fontSize: "0.85rem" }}></i>
                      <input
                        type="text"
                        placeholder="Buscar banda..."
                        value={bandSearchQuery}
                        onChange={(e) => setBandSearchQuery(e.target.value)}
                        className="form-control"
                        style={{ paddingLeft: "32px", fontSize: "0.85rem", height: "36px", borderRadius: "8px" }}
                      />
                      {bandSearchQuery && (
                        <button 
                          onClick={() => setBandSearchQuery("")} 
                          style={{ position: "absolute", right: "10px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: "1.1rem" }}
                        >
                          &times;
                        </button>
                      )}
                    </div>
                  )}

                  {filteredBands.length > 0 ? (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "0.8rem", maxHeight: "350px", overflowY: "auto", paddingRight: "4px" }}>
                      {filteredBands.map((b) => (
                        <div 
                          key={b.id} 
                          onClick={() => {
                            setInfoModalOpen(false);
                            router.push(`/bands/${b.slug || b.id}`);
                          }}
                          style={{ display: "flex", alignItems: "center", gap: "10px", padding: "0.6rem", background: "var(--bg-input)", borderRadius: "8px", cursor: "pointer", border: "1px solid var(--border-color)" }}
                          className="glass-panel"
                        >
                          <img src={b.image} alt={b.name} style={{ width: "32px", height: "32px", borderRadius: "50%", objectFit: "cover", border: "1px solid var(--border-color)" }} />
                          <div>
                            <strong style={{ fontSize: "0.82rem", color: "var(--text-primary)", display: "block" }}>{b.name}</strong>
                            <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>{b.genre}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
                      {bandSearchQuery ? "No se encontraron bandas con ese nombre." : "Aún no hay shows musicales confirmados."}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div style={{ padding: "1.2rem", borderTop: "1px solid var(--border-color)", display: "flex", justifyContent: "flex-end" }}>
              <button onClick={() => setInfoModalOpen(false)} className="btn-gold" style={{ padding: "0.45rem 1.5rem", borderRadius: "6px", fontSize: "0.85rem" }}>
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
