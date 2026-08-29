"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { useApp } from "../../../context/AppContext";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import PostList from "../../../components/PostList";
import SocialFeedPublisher from "../../../components/SocialFeedPublisher";
import BrandQRModal from "../../../components/BrandQRModal";

// Stable deterministic views generator based on hash of name + id
const getItemViews = (name, id) => {
  if (!name) return 0;
  let hash = 0;
  const str = name + (id || 0);
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash % 980) + 120; // 120 to 1100 views
};

const getProductViews = (p) => p.views || p.viewCount || getItemViews(p.name, p.id);
const DEFAULT_USER_AVATAR = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 128 128'%3E%3Crect width='128' height='128' fill='%23E5E7EB'/%3E%3Cpath d='M64 24a24 24 0 100 48 24 24 0 000-48zM32 104a32 32 0 0164 0H32z' fill='%239CA3AF'/%3E%3C/svg%3E";

export default function BrandProfileClient({ initialBrand }) {
  const routeParams = useParams();
  const slug = routeParams?.slug || "";

  const isNumeric = /^\d+$/.test(slug);
  const [brandId, setBrandId] = useState(null);

  const {
    brands,
    products,
    events,
    loadEvents,
    addEvent,
    updateEvent,
    deleteEvent,
    people,
    loading,
    activePersonId,
    activeBrandId,
    prodFormOpen,
    setProdFormOpen,
    editingProdId,
    setEditingProdId,
    prodName,
    setProdName,
    prodDescription,
    setProdDescription,
    prodPrice,
    setProdPrice,
    prodPriceAourum,
    setProdPriceAourum,
    prodStock,
    setProdStock,
    prodCategory,
    setProdCategory,
    prodType,
    setProdType,
    prodIsVisible,
    setProdIsVisible,
    prodImage,
    setProdImage,
    prodImagePreview,
    setProdImagePreview,
    prodImgBgColor,
    setProdImgBgColor,
    uploadingProd,
    productSubmitLoading,
    setUploadingProd,
    handleProductSubmit,
    handleDeleteProduct,
    uploadImage,
    removeBgAi,
    fairs,
    appFairId,
    setAppFairId,
    handleApplyToFair,
    invitations,
    sendInvitation,
    changeCollaboratorRole,
    removeCollaborator,
    editName, setEditName,
    editOwner, setEditOwner,
    editCategory, setEditCategory,
    editDescription, setEditDescription,
    editLogo, setEditLogo,
    editLogoPreview, setEditLogoPreview,
    editProfileType, setEditProfileType,
    editProfileId, setEditProfileId,
    editSlug, setEditSlug,
    editProfileOpen, setEditProfileOpen,
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
    editBanner, setEditBanner,
    editBannerPreview, setEditBannerPreview,
    editThemeColor, setEditThemeColor,
    editTagline, setEditTagline,
    editInterests, setEditInterests,
    editCity, setEditCity,
    editBrandDesign, setEditBrandDesign,
    parseDescription,
    handleDeleteBrand,
    loadBrands,
    loadProducts,
    loadPeople,
    loadFairs,
    loadInvitations,
    activeRole,
    setShowLoginModal,
    triggerNotification,
    loadPosts,
    openCreatePostModal
  } = useApp();

  const router = useRouter();

  const [activeBrandTab, setActiveBrandTab] = useState("vitrina");

  // State for Events Management inside Brand Profile
  const [eventFormOpen, setEventFormOpen] = useState(false);
  const [editingEventId, setEditingEventId] = useState(null);
  const [evtTitle, setEvtTitle] = useState("");
  const [evtDescription, setEvtDescription] = useState("");
  const [evtType, setEvtType] = useState("curso");
  const [evtDate, setEvtDate] = useState("");
  const [evtIsAllDay, setEvtIsAllDay] = useState(false);
  const [evtDuration, setEvtDuration] = useState("");
  const [evtIsOnline, setEvtIsOnline] = useState(false);
  const [evtOnlineLink, setEvtOnlineLink] = useState("");
  const [evtWhatsappNumber, setEvtWhatsappNumber] = useState("");
  const [evtLocation, setEvtLocation] = useState("");
  const [evtLat, setEvtLat] = useState(-16.39889); // Default Plaza de Armas de Arequipa
  const [evtLng, setEvtLng] = useState(-71.53694);
  const [evtMapSearching, setEvtMapSearching] = useState(false);
  const [evtPrice, setEvtPrice] = useState("");
  const [evtSpotsTotal, setEvtSpotsTotal] = useState("");
  const [evtImage, setEvtImage] = useState("");
  const [evtUploadingImage, setEvtUploadingImage] = useState(false);
  const [evtSubmitLoading, setEvtSubmitLoading] = useState(false);
  const [brandPosts, setBrandPosts] = useState([]);
  const [brandPostsLoading, setBrandPostsLoading] = useState(false);
  const [qrModalOpen, setQrModalOpen] = useState(false);

  const evtMapContainerRef = useRef(null);
  const evtLeafletMapRef = useRef(null);
  const evtMarkerRef = useRef(null);

  useEffect(() => {
    if (!eventFormOpen || evtIsOnline) {
      if (evtLeafletMapRef.current) {
        evtLeafletMapRef.current.remove();
        evtLeafletMapRef.current = null;
      }
      return;
    }

    const initEvtMap = () => {
      if (!evtMapContainerRef.current || typeof window === "undefined" || !window.L || evtLeafletMapRef.current) return;
      const L = window.L;
      delete L.Icon.Default.prototype._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      const initLat = evtLat || -16.39889;
      const initLng = evtLng || -71.53694;

      const map = L.map(evtMapContainerRef.current, { zoomControl: false }).setView([initLat, initLng], 15);
      evtLeafletMapRef.current = map;

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; OpenStreetMap',
        maxZoom: 19,
      }).addTo(map);

      const marker = L.marker([initLat, initLng], { draggable: true }).addTo(map);
      evtMarkerRef.current = marker;

      marker.on("dragend", () => {
        const pos = marker.getLatLng();
        setEvtLat(pos.lat);
        setEvtLng(pos.lng);
      });

      map.on("click", (e) => {
        const { lat, lng } = e.latlng;
        marker.setLatLng([lat, lng]);
        setEvtLat(lat);
        setEvtLng(lng);
      });

      L.control.zoom({ position: "bottomright" }).addTo(map);
    };

    const timer = setTimeout(initEvtMap, 300);
    return () => {
      clearTimeout(timer);
      if (evtLeafletMapRef.current) {
        evtLeafletMapRef.current.remove();
        evtLeafletMapRef.current = null;
      }
    };
  }, [eventFormOpen, evtIsOnline]);

  const handleSearchAddress = async (addressQuery) => {
    if (!addressQuery || !addressQuery.trim()) return;
    setEvtMapSearching(true);
    try {
      const q = addressQuery.includes("Arequipa") ? addressQuery : `${addressQuery}, Arequipa, Perú`;
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}`);
      const data = await res.json();
      if (data && data.length > 0) {
        const lat = parseFloat(data[0].lat);
        const lng = parseFloat(data[0].lon);
        setEvtLat(lat);
        setEvtLng(lng);
        if (evtMarkerRef.current && evtLeafletMapRef.current) {
          evtMarkerRef.current.setLatLng([lat, lng]);
          evtLeafletMapRef.current.setView([lat, lng], 16);
        }
        triggerNotification("Ubicación en Arequipa encontrada", "success");
      } else {
        triggerNotification("No se encontró la dirección exacta. Señala la ubicación en el mapa.", "info");
      }
    } catch (err) {
      console.error("Error geocodificando dirección:", err);
    } finally {
      setEvtMapSearching(false);
    }
  };

  useEffect(() => {
    loadBrands();
    loadProducts();
    loadPeople();
    loadFairs();
    loadInvitations();
  }, [loadBrands, loadProducts, loadPeople, loadFairs, loadInvitations]);

  const brand = useMemo(() => {
    const normSlug = slug ? slug.toString().toLowerCase() : "";
    const altSlug = normSlug.includes('_') ? normSlug.replace(/_/g, '-') : normSlug.replace(/-/g, '_');
    
    // Buscar la versión más fresca del estado reactivo de AppContext
    const updatedFromContext = (brands && brands.length > 0) ? brands.find((b) => {
      if (brandId && b.id === brandId) return true;
      if (isNumeric && b.id === Number(slug)) return true;
      if (initialBrand && (b.id === initialBrand.id || (b.slug && initialBrand.slug && b.slug.toLowerCase() === initialBrand.slug.toLowerCase()))) return true;
      const bSlug = (b.slug || "").toLowerCase();
      return bSlug === normSlug || bSlug === altSlug || b.id.toString() === slug;
    }) : null;

    if (updatedFromContext) return updatedFromContext;
    return initialBrand || null;
  }, [initialBrand, brands, brandId, isNumeric, slug]);

  // Check collaborator role of the logged-in persona
  const currentPerson = useMemo(() => people.find((p) => Number(p.id) === Number(activePersonId)), [people, activePersonId]);
  const isBrandSessionOwner = (activeRole === 'brand' && activeBrandId != null && brand?.id != null && Number(activeBrandId) === Number(brand.id));
  const isDirectOwner = isBrandSessionOwner || (activePersonId != null && brand?.personId != null && Number(brand.personId) === Number(activePersonId));
  const userCollaborator = brand?.collaborators ? brand.collaborators.find(c => Number(c.personId) === Number(activePersonId)) : null;
  const userRole = userCollaborator ? userCollaborator.role : (isDirectOwner ? 'creador_original' : null);
  const isCollaborator = !!userRole || isDirectOwner;
  const canEditProfile = isCollaborator || userRole === 'creador_original' || userRole === 'creador' || userRole === 'gestor' || isDirectOwner;
  const canInvite = userRole === 'creador_original' || userRole === 'creador' || userRole === 'gestor' || isDirectOwner;

  const isOwner = userRole === 'creador_original' || isDirectOwner;

  useEffect(() => {
    if (brand?.id) {
      setBrandPostsLoading(true);
      loadPosts({ brandId: brand.id })
        .then(res => setBrandPosts(res || []))
        .finally(() => setBrandPostsLoading(false));
    }
  }, [brand?.id, loadPosts]);
  const [showFairs, setShowFairs] = useState(false);
  const [showCollabs, setShowCollabs] = useState(false);
  const [fairSearchQuery, setFairSearchQuery] = useState("");
  const [showFairDropdown, setShowFairDropdown] = useState(false);
  const [personSearchQuery, setPersonSearchQuery] = useState("");
  const [showPersonDropdown, setShowPersonDropdown] = useState(false);
  const [selectedPersonId, setSelectedPersonId] = useState("");
  const [adminCatalogOpen, setAdminCatalogOpen] = useState(false);
  const [adminSearchQuery, setAdminSearchQuery] = useState("");
  const [categorySuggestionsOpen, setCategorySuggestionsOpen] = useState(false);

  const allCategories = useMemo(() => {
    const seen = new Set();
    const unique = [];
    products.forEach((p) => {
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
  }, [products]);

  const filteredCategoryOptions = useMemo(() => {
    if (!prodCategory) return allCategories;
    return allCategories.filter(cat => 
      cat.toLowerCase().includes(prodCategory.toLowerCase())
    );
  }, [allCategories, prodCategory]);

  // States for the interactive image editor
  const [editorOpen, setEditorOpen] = useState(false);
  const [editorSource, setEditorSource] = useState(null);
  const [aspectRatio, setAspectRatio] = useState("1:1"); // "1:1" o "4:3"
  const [scale, setScale] = useState(1); // 0.1 (alejar) a 3.0 (acercar)
  const [imgPos, setImgPos] = useState({ x: 0, y: 0 });
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [processingAiBg, setProcessingAiBg] = useState(false);

  // States and refs for the manual eraser tool
  const [editorTool, setEditorTool] = useState("move"); // "move" o "erase"
  const [brushSize, setBrushSize] = useState(30); // 10 a 100
  const [maskUpdateTrigger, setMaskUpdateTrigger] = useState(0);
  const maskCanvasRef = useRef(null);
  const isDrawingMaskRef = useRef(false);
  const lastImgCoordsRef = useRef(null);

  // Lock background scroll when any modal is open
  useEffect(() => {
    const isModalOpen = prodFormOpen || editorOpen || showFairs || showCollabs || adminCatalogOpen;
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
  }, [prodFormOpen, editorOpen, showFairs, showCollabs, adminCatalogOpen]);

  // Redraw canvas on aspect ratio/scale changes, drag, background removal toggle, and tolerance changes
  useEffect(() => {
    if (!editorOpen || !editorSource) return;
    const img = new Image();
    img.onload = () => {
      const canvas = document.getElementById("editor-canvas");
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      
      // Use high-resolution canvas internally to match Cloudinary max limit (1200px width)
      const canvasW = 1200;
      const canvasH = aspectRatio === "1:1" ? 1200 : 900;
      
      // Initialize the manual eraser mask canvas to match the original image dimensions
      if (!maskCanvasRef.current && img.width > 0) {
        const mCanvas = document.createElement("canvas");
        mCanvas.width = img.width;
        mCanvas.height = img.height;
        const mCtx = mCanvas.getContext("2d");
        mCtx.clearRect(0, 0, img.width, img.height); // Start fully transparent
        maskCanvasRef.current = mCanvas;
      }
      
      // Enable high-quality image smoothing for sharp downscaling of camera photos
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      
      // Clear the canvas
      ctx.clearRect(0, 0, canvasW, canvasH);
      
      // Calculate cover dimensions to fill canvas aspect ratio
      const imgRatio = img.width / img.height;
      const canvasRatio = canvasW / canvasH;
      
      let baseW, baseH;
      if (imgRatio > canvasRatio) {
        baseH = canvasH;
        baseW = canvasH * imgRatio;
      } else {
        baseW = canvasW;
        baseH = canvasW / imgRatio;
      }
      
      // Apply scale (zoom) on top of base cover dimensions
      const drawW = baseW * scale;
      const drawH = baseH * scale;
      
      // Drag coordinates are stored in visual screen pixels (300px width base).
      // Scale them up to the canvas coordinate space (1200px width base).
      const scaleFactor = canvasW / 300;
      const offsetX = imgPos.x * scaleFactor;
      const offsetY = imgPos.y * scaleFactor;
      
      const x = (canvasW - drawW) / 2 + offsetX;
      const y = (canvasH - drawH) / 2 + offsetY;
      
      ctx.drawImage(img, x, y, drawW, drawH);
      
      // Apply the manual eraser mask if it exists (cuts out transparency over the image)
      if (maskCanvasRef.current) {
        ctx.globalCompositeOperation = 'destination-out';
        ctx.drawImage(maskCanvasRef.current, x, y, drawW, drawH);
        ctx.globalCompositeOperation = 'source-over';
      }
    };
    img.src = editorSource;
  }, [editorOpen, editorSource, aspectRatio, scale, imgPos, maskUpdateTrigger]);

  // Helper to get relative canvas coordinates (handles mouse and touch)
  const getCanvasCoords = (e, rect) => {
    if (e.touches && e.touches.length > 0) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top
      };
    }
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  };

  // Helper to map canvas coordinates to original image coordinates
  const mapToImageCoords = (cx, cy, img) => {
    const canvasW = 1200;
    const canvasH = aspectRatio === "1:1" ? 1200 : 900;
    
    const imgRatio = img.width / img.height;
    const canvasRatio = canvasW / canvasH;
    
    let baseW, baseH;
    if (imgRatio > canvasRatio) {
      baseH = canvasH;
      baseW = canvasH * imgRatio;
    } else {
      baseW = canvasW;
      baseH = canvasW / imgRatio;
    }
    
    const drawW = baseW * scale;
    const drawH = baseH * scale;
    
    const scaleFactor = canvasW / 300;
    const offsetX = imgPos.x * scaleFactor;
    const offsetY = imgPos.y * scaleFactor;
    
    const x = (canvasW - drawW) / 2 + offsetX;
    const y = (canvasH - drawH) / 2 + offsetY;
    
    const ix = ((cx * scaleFactor - x) / drawW) * img.width;
    const iy = ((cy * scaleFactor - y) / drawH) * img.height;
    
    return { x: ix, y: iy, drawW, imgWidth: img.width };
  };

  // Eraser drawing handlers
  const handleStartDraw = (e) => {
    if (editorTool !== "erase" || !editorSource) return;
    const canvas = document.getElementById("editor-canvas");
    if (!canvas || !maskCanvasRef.current) return;
    
    const rect = canvas.getBoundingClientRect();
    const { x: cx, y: cy } = getCanvasCoords(e, rect);
    
    const img = new Image();
    img.onload = () => {
      const { x: ix, y: iy, drawW, imgWidth } = mapToImageCoords(cx, cy, img);
      
      isDrawingMaskRef.current = true;
      lastImgCoordsRef.current = { x: ix, y: iy };
      
      const maskCtx = maskCanvasRef.current.getContext("2d");
      maskCtx.fillStyle = "#000000";
      maskCtx.strokeStyle = "#000000";
      maskCtx.lineCap = "round";
      maskCtx.lineJoin = "round";
      
      const scaleFactor = 1200 / 300;
      const imgBrushSize = (brushSize * scaleFactor / drawW) * imgWidth;
      
      maskCtx.beginPath();
      maskCtx.arc(ix, iy, imgBrushSize / 2, 0, Math.PI * 2);
      maskCtx.fill();
      
      setMaskUpdateTrigger(prev => prev + 1);
    };
    img.src = editorSource;
  };

  const handleMoveDraw = (e) => {
    if (editorTool !== "erase" || !isDrawingMaskRef.current || !lastImgCoordsRef.current || !editorSource) return;
    const canvas = document.getElementById("editor-canvas");
    if (!canvas || !maskCanvasRef.current) return;
    
    const rect = canvas.getBoundingClientRect();
    const { x: cx, y: cy } = getCanvasCoords(e, rect);
    
    const img = new Image();
    img.onload = () => {
      const { x: ix, y: iy, drawW, imgWidth } = mapToImageCoords(cx, cy, img);
      
      const maskCtx = maskCanvasRef.current.getContext("2d");
      maskCtx.fillStyle = "#000000";
      maskCtx.strokeStyle = "#000000";
      maskCtx.lineCap = "round";
      maskCtx.lineJoin = "round";
      
      const scaleFactor = 1200 / 300;
      const imgBrushSize = (brushSize * scaleFactor / drawW) * imgWidth;
      maskCtx.lineWidth = imgBrushSize;
      
      maskCtx.beginPath();
      maskCtx.moveTo(lastImgCoordsRef.current.x, lastImgCoordsRef.current.y);
      maskCtx.lineTo(ix, iy);
      maskCtx.stroke();
      
      lastImgCoordsRef.current = { x: ix, y: iy };
      setMaskUpdateTrigger(prev => prev + 1);
    };
    img.src = editorSource;
  };

  const handleEndDraw = () => {
    isDrawingMaskRef.current = false;
    lastImgCoordsRef.current = null;
  };

  const handleResetEraser = () => {
    if (!maskCanvasRef.current) return;
    const maskCtx = maskCanvasRef.current.getContext("2d");
    maskCtx.clearRect(0, 0, maskCanvasRef.current.width, maskCanvasRef.current.height);
    setMaskUpdateTrigger(prev => prev + 1);
  };

  const handleRemoveBgAi = async () => {
    if (!editorSource || processingAiBg) return;
    setProcessingAiBg(true);
    try {
      const transparentImage = await removeBgAi(editorSource);
      if (transparentImage) {
        setEditorSource(transparentImage);
        // Clear the manual eraser mask as they have a fresh new AI background removal
        if (maskCanvasRef.current) {
          const maskCtx = maskCanvasRef.current.getContext("2d");
          maskCtx.clearRect(0, 0, maskCanvasRef.current.width, maskCanvasRef.current.height);
        }
        setMaskUpdateTrigger(prev => prev + 1);
        alert("¡Fondo eliminado con éxito por la IA!");
      }
    } catch (err) {
      console.error("Error al procesar la imagen con la IA:", err);
    } finally {
      setProcessingAiBg(false);
    }
  };

  const handleSaveEditor = async () => {
    const canvas = document.getElementById("editor-canvas");
    if (!canvas) return;
    
    const dataUrl = canvas.toDataURL("image/png");
    setProdImagePreview(dataUrl);
    setEditorOpen(false);
    
    try {
      const blob = await fetch(dataUrl).then(res => res.blob());
      const file = new File([blob], "edited_product.png", { type: "image/png" });
      
      setUploadingProd(true);
      const url = await uploadImage(file, setUploadingProd);
      if (url) {
        setProdImage(url);
      }
    } catch (err) {
      console.error("Error processing and uploading image", err);
    }
  };
  
  const brandMapContainerRef = useRef(null);
  const brandLeafletMapRef = useRef(null);

  useEffect(() => {
    if (brand && !brandId) {
      setBrandId(brand.id);
    }
  }, [brand, brandId]);

  useEffect(() => {
    if (!brand || typeof window === "undefined") return;
    const parsed = parseDescription(brand.description);
    if (!parsed.has_local || !brandMapContainerRef.current) return;
    if (brandLeafletMapRef.current) return;

    const initBrandMap = () => {
      if (!brandMapContainerRef.current || !window.L) return;

      const L = window.L;
      delete L.Icon.Default.prototype._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      const lat = parsed.local_lat || -16.39889;
      const lng = parsed.local_lng || -71.53694;

      const pMap = L.map(brandMapContainerRef.current, { zoomControl: false }).setView([lat, lng], 16);
      brandLeafletMapRef.current = pMap;

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; OpenStreetMap',
        maxZoom: 19,
      }).addTo(pMap);

      L.marker([lat, lng]).addTo(pMap)
        .bindPopup(`<b>${brand.name}</b><br/>${parsed.local_address || "Local"}`).openPopup();

      L.control.zoom({ position: "bottomright" }).addTo(pMap);
    };

    const timer = setTimeout(initBrandMap, 300);
    return () => {
      clearTimeout(timer);
      if (brandLeafletMapRef.current) {
        brandLeafletMapRef.current.remove();
        brandLeafletMapRef.current = null;
      }
    };
  }, [brand]);

  // Redirect from numeric ID or changed slug to current slug-based URL
  useEffect(() => {
    if (brand && brand.slug && (isNumeric || brand.slug !== slug)) {
      router.replace(`/brands/${brand.slug}`);
    }
  }, [brand, isNumeric, slug, router]);

  const filteredFairs = useMemo(() => {
    const brandFairs = fairs.filter(f => {
      const parsed = parseDescription(f.description);
      const fType = parsed.fair_type || "both";
      return fType === "both" || fType === "only_brands";
    });
    if (!fairSearchQuery.trim()) return brandFairs;
    return brandFairs.filter(f => f.name.toLowerCase().includes(fairSearchQuery.toLowerCase()));
  }, [fairs, fairSearchQuery, parseDescription]);

  const allBrandProducts = brand ? products.filter((p) => p.brandId === brand.id) : [];

  const brandProducts = useMemo(() => {
    if (canEditProfile) return allBrandProducts;
    return allBrandProducts.filter(p => p.isVisible !== false);
  }, [allBrandProducts, canEditProfile]);

  const filteredAdminProducts = useMemo(() => {
    if (!adminSearchQuery.trim()) return allBrandProducts;
    return allBrandProducts.filter((p) => 
      p.name.toLowerCase().includes(adminSearchQuery.toLowerCase()) ||
      (p.category && p.category.toLowerCase().includes(adminSearchQuery.toLowerCase()))
    );
  }, [allBrandProducts, adminSearchQuery]);

  const trackRefs = useRef({});
  const [visibleCount, setVisibleCount] = useState(15);

  useEffect(() => {
    if (typeof window !== "undefined") {
      if (window.innerWidth <= 640) {
        setVisibleCount(12);
      } else {
        setVisibleCount(15);
      }
    }
  }, []);

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

  const featuredBrandProducts = useMemo(() => {
    if (!brandProducts.length) return [];
    return [...brandProducts]
      .sort((a, b) => getProductViews(b) - getProductViews(a))
      .slice(0, 8);
  }, [brandProducts]);

  const brandCategories = useMemo(() => {
    const seen = new Set();
    const unique = [];
    brandProducts.forEach(p => {
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
  }, [brandProducts]);

  function BrandProductCard({ prod }) {
    const rawCardBg = (design.cardBgColor && design.cardBgColor !== "transparent") ? design.cardBgColor : null;
    const rawCardText = design.cardTextColor || "auto";
    const rawCardBorder = design.cardBorderColor || "auto";

    // Helper to safely calculate luminance for hex colors (including #RRGGBBAA and 3-digit hex)
    const getBgBrightness = (colorStr, fallbackColor = "#FAF9F0") => {
      let target = colorStr || fallbackColor;
      if (target === "brand") target = palette.c1;
      else if (target === "brand-soft") target = palette.c1 ? `${palette.c1}15` : fallbackColor;
      if (typeof target !== "string" || !target.startsWith("#")) return 240;

      let hex = target.replace("#", "").substring(0, 6);
      if (hex.length === 3) {
        hex = hex.split("").map(c => c + c).join("");
      }
      if (hex.length !== 6) return 240;

      const r = parseInt(hex.substring(0, 2), 16) || 0;
      const g = parseInt(hex.substring(2, 4), 16) || 0;
      const b = parseInt(hex.substring(4, 6), 16) || 0;
      return (r * 299 + g * 587 + b * 114) / 1000;
    };

    // 1. Calculate overall store background luminance
    const storeLuminance = getBgBrightness(customBgColor, "#FAF9F0");
    const isStoreBgLight = storeLuminance >= 130;

    // 2. Determine card background color from DB brand design settings
    let cardBg = rawCardBg;
    if (!cardBg) {
      if (cardStyle === "flat" || cardStyle === "elevated" || cardStyle === "bordered") {
        cardBg = "#FFFFFF";
      } else {
        // default glass style with soft brand tint
        cardBg = isStoreBgLight ? `${palette.c1}18` : "rgba(24, 24, 27, 0.88)";
      }
    } else if (cardBg === "brand") {
      cardBg = palette.c1;
    } else if (cardBg === "brand-soft") {
      cardBg = `${palette.c1}20`;
    }

    // 3. Determine brightness of card background
    const cardLuminance = getBgBrightness(cardBg, isStoreBgLight ? "#FFFFFF" : "#18181B");
    const isCardDark = cardLuminance < 140;

    // 4. Text and badge color schemes
    let categoryTextColor = isCardDark ? "var(--text-gold)" : "#854D0E";
    let titleTextColor = isCardDark ? "#FFFFFF" : "#1C1C1E";
    let priceTextColor = isCardDark ? "#FFFFFF" : "#1C1C1E";
    let dividerBorder = isCardDark ? "1px solid rgba(255,255,255,0.15)" : "1px solid rgba(0,0,0,0.1)";

    if (rawCardText === "brand") {
      titleTextColor = palette.c1;
      priceTextColor = palette.c1;
    } else if (rawCardText && rawCardText !== "auto" && rawCardText.startsWith("#")) {
      const textLuminance = getBgBrightness(rawCardText, "#1C1C1E");
      if ((isCardDark && textLuminance > 120) || (!isCardDark && textLuminance < 150)) {
        titleTextColor = rawCardText;
        priceTextColor = rawCardText;
      }
    }

    // Safety guard: Never allow white text on light card backgrounds
    if (!isCardDark) {
      const titleLuminance = getBgBrightness(titleTextColor, "#1C1C1E");
      if (titleLuminance > 180) {
        titleTextColor = "#1C1C1E";
        priceTextColor = "#1C1C1E";
        categoryTextColor = "#854D0E";
      }
    }

    // 5. Complete unified card container style
    let cardStyleObj = {
      backgroundColor: cardBg,
      color: titleTextColor,
      borderRadius: "16px",
      overflow: "hidden",
      display: "flex",
      flexDirection: "column",
      height: "100%",
      cursor: "pointer",
      boxShadow: cardStyle === "elevated" ? "0 12px 30px rgba(0,0,0,0.1)" : "0 4px 16px rgba(0,0,0,0.06)",
      transition: "all 0.25s ease-in-out"
    };

    if (rawCardBorder === "brand") {
      cardStyleObj.border = `1.5px solid ${palette.c1}`;
    } else if (rawCardBorder === "transparent") {
      cardStyleObj.border = "none";
    } else if (rawCardBorder && rawCardBorder !== "auto" && rawCardBorder.startsWith("#")) {
      cardStyleObj.border = `1.5px solid ${rawCardBorder}`;
    } else if (cardStyle === "bordered") {
      cardStyleObj.border = `2px solid ${palette.c1}`;
    } else {
      cardStyleObj.border = isCardDark ? "1px solid rgba(255,255,255,0.15)" : `1px solid ${palette.c1}30`;
    }

    const views = getProductViews(prod);
    const isPopular = views > 600;
    const formattedPrice = (prod.price != null && !isNaN(Number(prod.price))) ? Number(prod.price).toLocaleString("es-PE") : "0";
    const formattedPriceAourum = (prod.priceAourum != null && !isNaN(Number(prod.priceAourum))) ? Number(prod.priceAourum).toLocaleString("es-PE") : null;

    return (
      <div 
        className="product-card glass-panel" 
        style={cardStyleObj}
        onClick={() => router.push(`/products/${prod.slug || prod.id}`)}
      >
        {/* Top Image Box with Badge Overlays */}
        <div 
          className="card-img-container" 
          style={{ 
            width: "100%",
            aspectRatio: "4 / 3",
            position: "relative", 
            backgroundColor: (prod.imgBgColor && prod.imgBgColor !== "transparent") 
              ? (prod.imgBgColor === "brand" ? palette.c1 : prod.imgBgColor)
              : (isCardDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.03)"),
            transition: "background-color 0.3s ease",
            overflow: "hidden"
          }}
        >
          <img 
            src={prod.image} 
            alt={prod.name} 
            className="card-img-hover" 
            style={{ 
              width: "100%",
              height: "100%",
              objectFit: prod.imgBgColor && prod.imgBgColor !== "transparent" ? "contain" : "cover",
              padding: prod.imgBgColor && prod.imgBgColor !== "transparent" ? "10px" : "0"
            }} 
          />

          {/* Badges on Image top-left */}
          <div style={{ position: "absolute", top: "10px", left: "10px", display: "flex", flexDirection: "column", gap: "6px", zIndex: 3 }}>
            {isPopular ? (
              <span style={{ background: "linear-gradient(135deg, #ef4444, #f97316)", color: "#FFFFFF", fontSize: "0.62rem", padding: "3px 8px", borderRadius: "12px", fontWeight: 700, letterSpacing: "0.03em", textTransform: "uppercase", boxShadow: "0 2px 6px rgba(0,0,0,0.15)", display: "flex", alignItems: "center", gap: "3px" }}>
                <i className="fa-solid fa-fire" style={{ fontSize: "0.7rem" }}></i> Popular
              </span>
            ) : (
              <span style={{ background: "linear-gradient(135deg, #0284c7, #2563eb)", color: "#FFFFFF", fontSize: "0.62rem", padding: "3px 8px", borderRadius: "12px", fontWeight: 700, letterSpacing: "0.03em", textTransform: "uppercase", boxShadow: "0 2px 6px rgba(0,0,0,0.15)", display: "flex", alignItems: "center", gap: "3px" }}>
                <i className="fa-solid fa-wand-magic-sparkles" style={{ fontSize: "0.7rem" }}></i> Descubrir
              </span>
            )}
          </div>
        </div>

        {/* Bottom Details Body */}
        <div style={{ padding: "1.1rem", flex: 1, display: "flex", flexDirection: "column", gap: "0.4rem" }}>
          <span style={{ 
            fontSize: "0.72rem", 
            color: categoryTextColor, 
            letterSpacing: "0.05em", 
            textTransform: "uppercase", 
            fontWeight: 800
          }}>
            {prod.category || brand?.rubro_general || "General"}
          </span>

          <h3 style={{ 
            fontSize: "1.02rem", 
            fontWeight: 800, 
            lineHeight: 1.35, 
            color: titleTextColor, 
            margin: "0.1rem 0 0 0",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden"
          }}>
            {prod.name}
          </h3>

          <div style={{ fontSize: "0.8rem", color: isCardDark ? "#A1A1AA" : "var(--text-muted)", display: "flex", alignItems: "center", gap: "5px" }}>
            <span>Por:</span>
            <strong style={{ color: titleTextColor, textDecoration: "underline" }}>
              {brand?.name || "Marca Local"}
            </strong>
          </div>
          
          <div style={{ 
            display: "flex", 
            justifyContent: "space-between", 
            alignItems: "center", 
            borderTop: dividerBorder, 
            paddingTop: "0.5rem", 
            marginTop: "auto" 
          }}>
            <div>
              {formattedPriceAourum ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                    <span style={{ fontSize: "0.68rem", color: isCardDark ? "#A1A1AA" : "#71717A", textDecoration: "line-through", lineHeight: 1 }}>
                      S/ {formattedPrice}
                    </span>
                    <span style={{ fontSize: "0.5rem", background: "var(--gold-gradient)", color: "#1C1C1E", padding: "1px 4px", borderRadius: "3px", fontWeight: "800", textTransform: "uppercase", whiteSpace: "nowrap", lineHeight: 1 }}>
                      Aourum
                    </span>
                  </div>
                  <span className="card-price-main" style={{ fontSize: "1.02rem", fontWeight: 800, color: "var(--text-gold)", lineHeight: 1 }}>
                    S/ {formattedPriceAourum}
                  </span>
                </div>
              ) : (
                <span className="card-price-main" style={{ fontSize: "1.02rem", fontWeight: 800, color: priceTextColor }}>
                  S/ {formattedPrice}
                </span>
              )}
            </div>

            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "2px" }}>
              <span className="card-type-label" style={{
                fontSize: "0.65rem",
                fontWeight: 700,
                textTransform: "uppercase",
                color: prod.type === "service" ? (isCardDark ? "#93c5fd" : "#1e3a8a") : (isCardDark ? "#fde68a" : "#78350f"),
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
            <h3 className="carousel-title" style={{ fontSize: "1.3rem", fontWeight: 800, margin: 0, color: isStoreBgLight ? "#1C1C1E" : "#FFFFFF" }}>{title}</h3>
            {subtitle && <p className="carousel-subtitle" style={{ fontSize: "0.85rem", color: isStoreBgLight ? "#4B5563" : "var(--text-muted)", margin: "4px 0 0 0" }}>{subtitle}</p>}
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
                <BrandProductCard prod={prod} />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "6rem 0" }}>
        <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: "2.5rem", color: "var(--gold-primary)" }}></i>
        <p style={{ color: "var(--text-muted)", marginTop: "10px" }}>Cargando perfil de marca...</p>
      </div>
    );
  }

  if (!brand) {
    return (
      <div className="container" style={{ textAlign: "center", padding: "4rem 0" }}>
        <h3>Marca no encontrada</h3>
        <button onClick={() => router.push("/brands")} className="btn-gold" style={{ marginTop: "1rem" }}>Volver a Marcas</button>
      </div>
    );
  }



  const copyLink = (e) => {
    e.stopPropagation();
    if (typeof window === "undefined") return;
    const fullUrl = window.location.href;
    navigator.clipboard.writeText(fullUrl);
    alert("¡Enlace del perfil copiado al portapapeles! Listo para compartir.");
  };

  const handleEditClick = () => {
    const parsed = parseDescription(brand.description);
    if (setEditName) setEditName(brand.name || "");
    if (setEditOwner) setEditOwner(brand.owner || "");
    if (setEditCategory) setEditCategory(brand.category || "");
    if (setEditDescription) setEditDescription(parsed.text || "");
    if (setEditLogo) setEditLogo(brand.logo || "");
    if (setEditLogoPreview) setEditLogoPreview(brand.logo || "");
    if (setEditProfileType) setEditProfileType("brand");
    if (setEditProfileId) setEditProfileId(brand.id);
    if (setEditSlug) setEditSlug(brand.slug || "");
    if (setEditWhatsappNumber) setEditWhatsappNumber(brand.whatsappNumber || "");
    if (setEditInstagram) setEditInstagram(parsed.instagram || "");
    if (setEditFacebook) setEditFacebook(parsed.facebook || "");
    if (setEditTiktok) setEditTiktok(parsed.tiktok || "");
    if (setEditWebsite) setEditWebsite(parsed.website || "");
    if (setEditRubroGeneral) setEditRubroGeneral(parsed.rubro_general || "");
    if (setEditRubroEspecifico) setEditRubroEspecifico(parsed.rubro_especifico || "");
    if (setEditHasLocal) setEditHasLocal(!!parsed.has_local);
    if (setEditLocalAddress) setEditLocalAddress(parsed.local_address || "");
    if (setEditLocalLat) setEditLocalLat(parsed.local_lat !== undefined ? Number(parsed.local_lat) : -16.39889);
    if (setEditLocalLng) setEditLocalLng(parsed.local_lng !== undefined ? Number(parsed.local_lng) : -71.53694);
    if (setEditBanner) setEditBanner(parsed.banner || "");
    if (setEditBannerPreview) setEditBannerPreview(parsed.banner || "");
    if (setEditThemeColor) setEditThemeColor(parsed.theme_color || "");
    if (setEditTagline) setEditTagline(parsed.tagline || "");
    if (setEditInterests) setEditInterests(parsed.interests || "");
    if (setEditCity) setEditCity(brand.city || "");
    if (setEditBrandDesign) {
      const activeDesign = (brand?.brandDesign && Object.keys(brand.brandDesign).length > 0)
        ? brand.brandDesign
        : (parsed.brandDesign || {});
      setEditBrandDesign({
        customBgColor: activeDesign.customBgColor || parsed.customBgColor || "",
        bgStyle: activeDesign.bgStyle || parsed.bgStyle || "solid",
        bgImage: activeDesign.bgImage || parsed.bgImage || "",
        ...activeDesign
      });
    }
    if (setEditProfileOpen) setEditProfileOpen(true);
  };

  if (loading && !brand) {
    return (
      <div className="container" style={{ textAlign: "center", padding: "6rem 0" }}>
        <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: "2.5rem", color: "var(--gold-primary)", marginBottom: "1rem" }}></i>
        <p style={{ color: "var(--text-muted)", fontSize: "0.95rem" }}>Cargando perfil de la marca...</p>
      </div>
    );
  }

  if (!brand) {
    return (
      <div className="container" style={{ textAlign: "center", padding: "6rem 0" }}>
        <i className="fa-solid fa-store-slash" style={{ fontSize: "3.5rem", color: "var(--text-muted)", marginBottom: "1rem" }}></i>
        <h2 style={{ fontSize: "1.6rem", fontWeight: 800, marginTop: "0.5rem", color: "var(--text-primary)" }}>Marca no encontrada</h2>
        <p style={{ color: "var(--text-muted)", margin: "0.5rem 0 1.5rem 0" }}>La marca que buscas no existe o ha sido desincorporada.</p>
        <Link href="/brands" className="btn-gold" style={{ padding: "0.6rem 1.2rem", borderRadius: "8px", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "6px" }}>
          <i className="fa-solid fa-arrow-left"></i> Volver al Catálogo de Marcas
        </Link>
      </div>
    );
  }

  const { getBrandPalette } = useApp();
  const parsed = parseDescription(brand.description);
  const isEditingThisBrand = editProfileOpen && editProfileId === brand?.id;
  const effectiveThemeColor = (isEditingThisBrand && editThemeColor) ? editThemeColor : (brand.themeColor || parsed.theme_color || '');
  const effectiveBanner = isEditingThisBrand ? (editBannerPreview || editBanner || parsed.banner || '') : (parsed.banner || '');
  const effectiveTagline = isEditingThisBrand ? (editTagline !== undefined ? editTagline : parsed.tagline) : (parsed.tagline || '');
  const effectiveCity = (isEditingThisBrand && editCity) ? editCity : (brand.city || '');

  const palette = getBrandPalette ? getBrandPalette(parsed, { ...brand, themeColor: effectiveThemeColor }) : { c1: "#D4AF37", c2: "#EAB308", c3: "#F97316", c4: "#8B5CF6" };
  const themeColor = palette.c1;
  const bannerStyle = !effectiveBanner ? { background: `linear-gradient(135deg, ${palette.c1}, ${palette.c2})` } : {};

  // Opciones avanzadas de personalización visual (brandDesign) extraídas directamente de la DB (columnas y JSON)
  const dbDesign = (brand.brandDesign && Object.keys(brand.brandDesign).length > 0)
    ? brand.brandDesign
    : (parsed.brandDesign || {});

  const design = (isEditingThisBrand && editBrandDesign && Object.keys(editBrandDesign).length > 0)
    ? editBrandDesign
    : {
        customBgColor: dbDesign.customBgColor || parsed.customBgColor || "#FAF9F0",
        bgStyle: dbDesign.bgStyle || parsed.bgStyle || "solid",
        bgImage: dbDesign.bgImage || parsed.bgImage || "",
        bgImageFit: dbDesign.bgImageFit || parsed.bgImageFit || "cover",
        logoShape: dbDesign.logoShape || parsed.logoShape || "circle",
        bannerOverlay: dbDesign.bannerOverlay || parsed.bannerOverlay || "none",
        cardStyle: dbDesign.cardStyle || parsed.cardStyle || "glass",
        fontFamily: dbDesign.fontFamily || parsed.fontFamily || "Inter",
        glowIntensity: dbDesign.glowIntensity !== undefined ? dbDesign.glowIntensity : (parsed.glowIntensity !== undefined ? parsed.glowIntensity : 70),
        animations: dbDesign.animations !== false,
        ...dbDesign
      };
  const bgStyle = design.bgStyle || "solid";
  const customBgColor = design.customBgColor || "#FAF9F0";
  const bgImage = design.bgImage || "";
  const bgImageFit = design.bgImageFit || "cover";
  const logoShape = design.logoShape || "circle";
  const bannerOverlay = design.bannerOverlay || "none";
  const cardStyle = design.cardStyle || "glass";
  const fontFamily = design.fontFamily || "Inter";
  const glowIntensity = (design.glowIntensity !== undefined ? design.glowIntensity : 70) / 100;
  const enableAnimations = design.animations !== false;

  // Calculo de estilos derivados
  const logoBorderRadius = logoShape === "square" ? "0px" : logoShape === "rounded" ? "24px" : "50%";
  
  let profileBgCss = {};
  if (bgStyle === "image" && bgImage) {
    profileBgCss = {
      backgroundImage: `url(${bgImage})`,
      backgroundSize: bgImageFit === "repeat" ? "auto" : bgImageFit,
      backgroundRepeat: bgImageFit === "repeat" ? "repeat" : "no-repeat",
      backgroundPosition: "center top"
    };
  } else if (bgStyle === "solid") {
    let resolvedColor = customBgColor;
    if (resolvedColor === "brand") resolvedColor = palette.c1;
    else if (resolvedColor === "brand-soft") resolvedColor = `${palette.c1}15`;
    profileBgCss = {
      background: resolvedColor
    };
  } else if (bgStyle === "gradient") {
    profileBgCss = {
      background: `
        radial-gradient(ellipse at 15% 5%, ${palette.c1}${Math.round(40 * glowIntensity).toString(16).padStart(2, '0')} 0%, transparent 55%),
        radial-gradient(ellipse at 85% 15%, ${palette.c2}${Math.round(40 * glowIntensity).toString(16).padStart(2, '0')} 0%, transparent 55%),
        radial-gradient(ellipse at 20% 40%, ${palette.c3}${Math.round(35 * glowIntensity).toString(16).padStart(2, '0')} 0%, transparent 50%),
        radial-gradient(ellipse at 80% 65%, ${palette.c4}${Math.round(35 * glowIntensity).toString(16).padStart(2, '0')} 0%, transparent 50%),
        radial-gradient(ellipse at 30% 88%, ${palette.c1}${Math.round(30 * glowIntensity).toString(16).padStart(2, '0')} 0%, transparent 50%),
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
  } else if (bgStyle === "none") {
    profileBgCss = {
      background: "#FFFFFF"
    };
  }

  // Store background luminance determination for high contrast styling
  let isStoreBgLight = true;
  let resolvedBgForScope = customBgColor || "#FAF9F0";
  if (resolvedBgForScope === "brand") resolvedBgForScope = palette.c1;
  else if (resolvedBgForScope === "brand-soft") resolvedBgForScope = palette.c1 ? `${palette.c1}15` : "#FAF9F0";

  if (resolvedBgForScope && typeof resolvedBgForScope === "string" && resolvedBgForScope.startsWith("#")) {
    let hex = resolvedBgForScope.replace("#", "").substring(0, 6);
    if (hex.length === 3) {
      hex = hex.split("").map(c => c + c).join("");
    }
    if (hex.length === 6) {
      const r = parseInt(hex.substring(0, 2), 16) || 0;
      const g = parseInt(hex.substring(2, 4), 16) || 0;
      const b = parseInt(hex.substring(4, 6), 16) || 0;
      const brightness = (r * 299 + g * 587 + b * 114) / 1000;
      isStoreBgLight = brightness >= 130;
    }
  }

  // Estilos de tarjetas según cardStyle, cardBgColor y cardBorderColor
  let cardCss = "";
  let resolvedCardBg = null;
  if (design.cardBgColor && design.cardBgColor !== "transparent" && design.cardBgColor !== "auto") {
    let resolvedBg = design.cardBgColor;
    if (resolvedBg === "brand") resolvedBg = palette.c1;
    else if (resolvedBg === "brand-soft") resolvedBg = `${palette.c1}20`;
    resolvedCardBg = resolvedBg;
    cardCss += `background: ${resolvedBg} !important; background-color: ${resolvedBg} !important;`;
  } else {
    // Default soft tint for glass style, or white for flat/elevated/bordered
    if (cardStyle === "glass") {
      resolvedCardBg = isStoreBgLight ? `${palette.c1}18` : "rgba(24, 24, 27, 0.88)";
    } else {
      resolvedCardBg = isStoreBgLight ? "#FFFFFF" : "#18181B";
    }
    cardCss += `background: ${resolvedCardBg} !important; background-color: ${resolvedCardBg} !important;`;
  }

  if (design.cardBorderColor && design.cardBorderColor !== "auto") {
    if (design.cardBorderColor === "brand") {
      cardCss += ` border: 1.5px solid ${palette.c1} !important;`;
    } else if (design.cardBorderColor === "transparent") {
      cardCss += ` border: none !important;`;
    } else if (design.cardBorderColor.startsWith("#")) {
      cardCss += ` border: 1.5px solid ${design.cardBorderColor} !important;`;
    }
  }

  let resolvedCardTextColor = null;
  if (design.cardTextColor && design.cardTextColor !== "auto") {
    if (design.cardTextColor === "brand") resolvedCardTextColor = palette.c1;
    else if (design.cardTextColor.startsWith("#")) resolvedCardTextColor = design.cardTextColor;
  }

  return (
    <div className="brand-profile-page-wrapper" style={{ minHeight: "100vh", width: "100%", position: "relative", ...profileBgCss }}>
      <div className="container brand-profile-theme-scope" style={{ maxWidth: "1400px", padding: "1.5rem 1.5rem 3rem 1.5rem", position: "relative", minHeight: "100vh", fontFamily: fontFamily !== "Inter" ? `"${fontFamily}", sans-serif` : "inherit" }}>
        {/* Import de la fuente de Google seleccionada si no es Inter */}
        {fontFamily !== "Inter" && (
          <link rel="stylesheet" href={`https://fonts.googleapis.com/css2?family=${fontFamily.replace(/ /g, "+")}:wght@400;600;700;800&display=swap`} />
        )}

      {/* Estilos dinámicos de la Paleta de Marca para toda la página */}
      <style>{`
        ${fontFamily !== "Inter" ? `
          .brand-profile-theme-scope,
          .brand-profile-theme-scope h1,
          .brand-profile-theme-scope h2,
          .brand-profile-theme-scope h3,
          .brand-profile-theme-scope h4,
          .brand-profile-theme-scope h5,
          .brand-profile-theme-scope h6,
          .brand-profile-theme-scope p,
          .brand-profile-theme-scope span:not([class*="fa-"]),
          .brand-profile-theme-scope button:not([class*="fa-"]),
          .brand-profile-theme-scope div:not([class*="fa-"]),
          .brand-profile-theme-scope a:not([class*="fa-"]),
          .brand-profile-theme-scope label:not([class*="fa-"]),
          .brand-profile-theme-scope input:not([class*="fa-"]) {
            font-family: "${fontFamily}", sans-serif !important;
          }
          .brand-profile-theme-scope i,
          .brand-profile-theme-scope [class*="fa-"],
          .brand-profile-theme-scope .fa-solid,
          .brand-profile-theme-scope .fa-regular,
          .brand-profile-theme-scope .fa-brands,
          .brand-profile-theme-scope .fas,
          .brand-profile-theme-scope .far,
          .brand-profile-theme-scope .fab {
            font-family: "Font Awesome 6 Free", "Font Awesome 6 Brands", FontAwesome !important;
          }
        ` : ''}
        .brand-profile-theme-scope h1,
        .brand-profile-theme-scope h2,
        .brand-profile-theme-scope h4,
        .brand-profile-theme-scope h5,
        .brand-profile-theme-scope h6,
        .brand-profile-theme-scope .carousel-title {
          color: ${isStoreBgLight ? "#1C1C1E" : "#FFFFFF"} !important;
          position: relative !important;
          z-index: 2 !important;
        }
        .brand-profile-theme-scope .carousel-subtitle,
        .brand-profile-theme-scope p {
          color: ${isStoreBgLight ? "#27272A" : "#D4D4D8"} !important;
          opacity: 1 !important;
          position: relative !important;
          z-index: 2 !important;
        }
        .brand-profile-theme-scope .aourum-tab-btn.active {
          background: linear-gradient(135deg, ${palette.c1}, ${palette.c2}) !important;
          color: #ffffff !important;
          border-color: ${palette.c1} !important;
          box-shadow: 0 4px 14px ${palette.c1}40 !important;
        }
        .brand-profile-theme-scope .aourum-tab-btn {
          border-color: ${palette.c1}35 !important;
          color: ${isStoreBgLight ? "#1C1C1E" : "#FFFFFF"} !important;
        }
        .brand-profile-theme-scope .btn-gold {
          background: linear-gradient(135deg, ${palette.c1}, ${palette.c2}) !important;
          color: #ffffff !important;
          border: none !important;
          box-shadow: 0 4px 14px ${palette.c1}35 !important;
          ${enableAnimations ? 'transition: all 0.25s ease-in-out !important;' : ''}
        }
        .brand-profile-theme-scope .btn-outline-gold {
          border-color: ${palette.c1} !important;
          color: ${palette.c1} !important;
          ${enableAnimations ? 'transition: all 0.25s ease-in-out !important;' : ''}
        }
        .brand-profile-theme-scope .btn-outline-gold:hover {
          background: ${palette.c1}18 !important;
        }
        .brand-profile-theme-scope .glass-panel {
          border: ${isStoreBgLight ? "1px solid rgba(0,0,0,0.12)" : `1px solid ${palette.c1}25`} !important;
          box-shadow: ${isStoreBgLight ? "0 4px 16px rgba(0,0,0,0.06)" : `0 8px 24px ${palette.c1}08`} !important;
        }
        header {
          background: linear-gradient(180deg, ${palette.c1}18 0%, rgba(255, 255, 255, 0.96) 100%) !important;
          border-bottom: 1.5px solid ${palette.c1}40 !important;
          box-shadow: 0 4px 20px ${palette.c1}12 !important;
        }
        footer.site-footer {
          background: linear-gradient(0deg, ${palette.c1}15 0%, ${palette.c4}08 50%, #FFFFFF 100%) !important;
          border-top: 1.5px solid ${palette.c1}35 !important;
        }
        footer.site-footer a {
          color: ${palette.c1} !important;
        }
        .brand-profile-theme-scope .grid-catalog .product-card,
        .brand-profile-theme-scope .carousel-item .product-card,
        .brand-profile-theme-scope .product-card {
          border: ${isStoreBgLight ? "1px solid rgba(0, 0, 0, 0.12)" : "1px solid rgba(255, 255, 255, 0.15)"} !important;
          box-shadow: ${isStoreBgLight ? "0 6px 20px rgba(0, 0, 0, 0.07)" : "0 8px 24px rgba(0, 0, 0, 0.3)"} !important;
          border-radius: 16px !important;
          overflow: hidden !important;
          position: relative !important;
          z-index: 2 !important;
          ${cardCss}
          ${enableAnimations ? 'transition: all 0.25s ease-in-out !important;' : ''}
        }
        @media (min-width: 641px) {
          .brand-profile-theme-scope .product-card {
            min-height: 350px !important;
          }
        }
        @media (max-width: 640px) {
          .brand-profile-theme-scope .product-card {
            min-height: auto !important;
          }
          .brand-profile-theme-scope .product-card > div:last-child {
            padding: 0.65rem 0.6rem !important;
            gap: 0.2rem !important;
          }
          .brand-profile-theme-scope .product-card h3 {
            font-size: 0.82rem !important;
            line-height: 1.25 !important;
            height: 2.5em !important;
            margin: 0 !important;
          }
          .brand-profile-theme-scope .product-card .card-price-main {
            font-size: 0.88rem !important;
          }
        }
        .brand-profile-theme-scope .product-card h3 {
          color: ${resolvedCardTextColor || (isStoreBgLight ? "#1C1C1E" : "#FFFFFF")} !important;
        }
        .brand-profile-theme-scope .product-card .card-text-container {
          background-color: ${isStoreBgLight ? "#FFFFFF" : "#18181B"} !important;
        }
        ${enableAnimations ? `
          .brand-profile-theme-scope .product-card:hover {
            border-color: ${palette.c1} !important;
            box-shadow: 0 12px 32px ${palette.c1}25 !important;
            transform: translateY(-4px) !important;
          }
        ` : ''}
        .brand-profile-theme-scope .profile-avatar-wrapper {
          border-radius: ${logoBorderRadius} !important;
        }
        .brand-profile-theme-scope .profile-avatar-wrapper img {
          border-radius: ${logoBorderRadius} !important;
        }
      `}</style>

      {/* Resplandor / Fondo Personalizado de Ambiente de Marca (Atrás de todo con zIndex -1) */}
      {bgStyle !== "none" && (
        <div 
          style={{ 
            position: "fixed", 
            top: 0, 
            left: 0, 
            right: 0, 
            bottom: 0, 
            pointerEvents: "none", 
            zIndex: -1,
            ...profileBgCss
          }} 
        />
      )}

      {/* Botones de Navegación Superior */}
      <div style={{ marginBottom: "1.5rem", display: "flex", justifyContent: "space-between", alignItems: "center", position: "relative", zIndex: 1, flexWrap: "wrap", gap: "10px" }}>
        <button 
          onClick={() => router.push("/brands")} 
          className="btn-outline-gold" 
          style={{ padding: "0.5rem 1.2rem", fontSize: "0.85rem", borderRadius: "8px", border: `1.5px solid ${palette.c1}`, cursor: "pointer", transition: "var(--transition-smooth)", display: "flex", alignItems: "center", gap: "6px", background: "transparent", color: palette.c1 }}
        >
          <i className="fa-solid fa-arrow-left"></i> Volver a Marcas
        </button>
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          <button 
            onClick={() => setQrModalOpen(true)} 
            className="btn-gold" 
            style={{ padding: "0.5rem 1.2rem", fontSize: "0.85rem", borderRadius: "8px", cursor: "pointer", transition: "var(--transition-smooth)", display: "flex", alignItems: "center", gap: "6px", fontWeight: 700 }} 
            title="Generar y descargar QR oficial de la marca"
          >
            <i className="fa-solid fa-qrcode"></i> Código QR de Marca
          </button>
          <button 
            onClick={copyLink} 
            className="btn-outline-gold" 
            style={{ padding: "0.5rem 1.2rem", fontSize: "0.85rem", borderRadius: "8px", border: `1.5px solid ${palette.c1}`, cursor: "pointer", transition: "var(--transition-smooth)", display: "flex", alignItems: "center", gap: "6px", background: "transparent", color: palette.c1 }} 
            title="Copiar enlace de perfil"
          >
            <i className="fa-solid fa-share-nodes"></i> Compartir Perfil
          </button>
        </div>
      </div>

      {/* Cabezal de Perfil Extremo a Extremo 1200x500 */}
      <div style={{ position: "relative", marginBottom: "2.5rem", zIndex: 1 }}>
        <div className="profile-header-banner" style={{ ...bannerStyle, overflow: "hidden", position: "relative" }}>
          {effectiveBanner && (
            <img src={effectiveBanner} alt={brand.name} style={{ width: "100%", height: "100%", objectFit: "cover", filter: bannerOverlay === "blur" ? "blur(3px)" : "none" }} />
          )}
          
          {/* Overlay sobre el banner */}
          {bannerOverlay === "gradient" && (
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, transparent 40%, rgba(0,0,0,0.65) 100%)", pointerEvents: "none" }} />
          )}
          {bannerOverlay === "color" && (
            <div style={{ position: "absolute", inset: 0, background: `${palette.c1}35`, mixBlendMode: "multiply", pointerEvents: "none" }} />
          )}
        </div>

        <div className="profile-avatar-wrapper" style={{ borderRadius: logoBorderRadius, boxShadow: `0 10px 30px ${palette.c1}30, 0 4px 16px ${palette.c2}25, 0 0 40px ${palette.c4}20` }}>
          <img src={brand.logo} alt={brand.name} style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: logoBorderRadius }} />
        </div>

        <div className="profile-body">
          <div className="profile-info-row">
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                <span style={{ fontSize: "0.8rem", color: palette.c1, textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.08em", background: `${palette.c1}15`, padding: "4px 12px", borderRadius: "20px", border: `1px solid ${palette.c1}35` }}>
                  {brand.rubro_especifico || brand.rubro_general || brand.category}
                </span>
                {effectiveCity && (
                  <span style={{ fontSize: "0.72rem", color: palette.c2, fontWeight: 700, display: "inline-flex", alignItems: "center", gap: "4px", background: `${palette.c2}15`, padding: "4px 10px", borderRadius: "20px", border: `1px solid ${palette.c2}30` }}>
                    <i className="fa-solid fa-location-dot" style={{ fontSize: "0.75rem", color: palette.c3 }}></i> {effectiveCity}
                  </span>
                )}
              </div>
              <h2 style={{ fontSize: "1.8rem", fontWeight: 800, marginTop: "0.8rem", letterSpacing: "-0.015em" }}>{brand.name}</h2>
              {effectiveTagline && (
                <p style={{ fontSize: "1.0rem", color: "var(--text-muted)", fontStyle: "italic", marginTop: "0.4rem", marginBottom: "0.4rem" }}>
                  &ldquo;{effectiveTagline}&rdquo;
                </p>
              )}
              {brand.collaborators && brand.collaborators.length > 1 && (
                <p style={{ fontSize: "0.9rem", color: "var(--text-muted)", marginTop: "0.3rem" }}>
                  <i className="fa-solid fa-user-tag" style={{ marginRight: 6 }}></i>
                  Equipo:{" "}
                  {brand.collaborators.map(c => {
                    const person = people.find(p => p.id === c.personId);
                    return person ? (
                      <Link key={person.id} href={`/people/${person.username || person.id}`} style={{ marginRight: "10px", color: "var(--gold-dark)", textDecoration: "underline" }}>
                        {person.name}
                      </Link>
                    ) : null;
                  })}
                </p>
              )}
            </div>

            {isCollaborator && (
               <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                 {isOwner && (
                   <button
                     onClick={() => setProdFormOpen(true)}
                     className="btn-gold"
                     style={{ padding: "0.5rem 1rem", borderRadius: "8px", fontSize: "0.85rem", fontWeight: 700, display: "flex", alignItems: "center", gap: "6px" }}
                   >
                     <i className="fa-solid fa-plus"></i> Añadir Item
                   </button>
                 )}
                 {isOwner && brandProducts.length > 0 && (
                   <button
                     onClick={() => setAdminCatalogOpen(true)}
                     className="btn-outline-gold"
                     style={{ padding: "0.5rem 1rem", borderRadius: "8px", fontSize: "0.85rem", fontWeight: 700, display: "flex", alignItems: "center", gap: "6px" }}
                   >
                     <i className="fa-solid fa-list-check"></i> Administrar Catálogo
                   </button>
                 )}
                 {userRole === 'creador_original' && (
                   <button
                     onClick={async () => {
                       if (await handleDeleteBrand(brand.id)) {
                         router.push("/brands");
                       }
                     }}
                     className="btn-outline-gold"
                     style={{ padding: "0.5rem 1rem", borderRadius: "8px", fontSize: "0.85rem", fontWeight: 700, display: "flex", alignItems: "center", gap: "6px", color: "#ef4444", borderColor: "#ef4444", background: "transparent", cursor: "pointer" }}
                   >
                     <i className="fa-solid fa-trash"></i> Eliminar Marca
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
                 <button
                   onClick={() => setQrModalOpen(true)}
                   className="btn-gold"
                   style={{ padding: "0.5rem 1rem", borderRadius: "8px", fontSize: "0.85rem", fontWeight: 700, display: "flex", alignItems: "center", gap: "6px" }}
                 >
                   <i className="fa-solid fa-qrcode"></i> Generar QR Marca
                 </button>
               </div>
             )}
          </div>

          <p style={{ fontSize: "0.95rem", color: "var(--text-primary)", marginTop: "1.2rem", lineHeight: 1.65 }}>
            {parsed.text}
          </p>

          {parsed.interests && (
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginTop: "1.2rem", paddingTop: "1.0rem", borderTop: "1px dashed var(--border-color)", marginBottom: "1.5rem" }}>
              {parsed.interests.split(",").map((tag, idx) => (
                <span key={idx} style={{ fontSize: "0.75rem", background: "var(--bg-input)", border: "1px solid var(--border-color)", padding: "4px 10px", borderRadius: "20px", color: "var(--text-primary)", fontWeight: 500 }}>
                  🏷️ {tag.trim()}
                </span>
              ))}
            </div>
          )}

          {(() => {
            const parsed = parseDescription(brand.description);
            const hasSocials = parsed.instagram || parsed.facebook || parsed.tiktok || parsed.website || brand.whatsappNumber;
            if (!hasSocials) return null;
            return (
              <div style={{ display: "flex", gap: "16px", alignItems: "center", marginTop: "1rem", flexWrap: "wrap" }}>
                {brand.whatsappNumber && (
                  activeRole ? (
                    <a 
                      href={`https://api.whatsapp.com/send?phone=${brand.whatsappNumber.replace(/[^0-9]/g, "")}`} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      style={{ color: "#25d366", fontSize: "1.4rem", display: "flex", alignItems: "center", textDecoration: "none", transition: "transform 0.2s" }}
                      onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.2)"}
                      onMouseLeave={(e) => e.currentTarget.style.transform = "none"}
                      title="WhatsApp"
                    >
                      <i className="fa-brands fa-whatsapp"></i>
                    </a>
                  ) : (
                    <button 
                      onClick={() => {
                        triggerNotification(false, "Debes iniciar sesión para contactar vía WhatsApp.");
                        setShowLoginModal(true);
                      }}
                      style={{ background: "none", border: "none", padding: 0, color: "#25d366", fontSize: "1.4rem", display: "flex", alignItems: "center", transition: "transform 0.2s", cursor: "pointer" }}
                      onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.2)"}
                      onMouseLeave={(e) => e.currentTarget.style.transform = "none"}
                      title="WhatsApp (Requiere inicio de sesión)"
                    >
                      <i className="fa-brands fa-whatsapp"></i>
                    </button>
                  )
                )}
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

          {/* Ubicación del local (si tiene) */}
          {(() => {
            const parsed = parseDescription(brand.description);
            if (!parsed.has_local) return null;
            return (
              <div style={{ marginBottom: "2.2rem", marginTop: "1.5rem" }}>
                <h3 style={{ fontSize: "1.05rem", fontWeight: 800, marginBottom: "0.8rem", color: "var(--text-gold)" }}>
                  <i className="fa-solid fa-map"></i> Ubicación de nuestro Local
                </h3>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.9rem", fontWeight: 600, color: "var(--text-primary)", marginBottom: "0.8rem" }}>
                  <i className="fa-solid fa-location-dot" style={{ color: "var(--gold-primary)" }}></i>
                  <span>{parsed.local_address || "Dirección no especificada"}</span>
                </div>
                <div ref={brandMapContainerRef} style={{ height: "240px", width: "100%", borderRadius: "10px", border: "1px solid var(--border-color)", zIndex: 1, boxShadow: "0 4px 16px rgba(0,0,0,0.03)" }}></div>
              </div>
            );
          })()}

          {/* Opciones Desplegables de Administración y Colaboración */}
          {isCollaborator && (
            <>
              <hr style={{ border: 0, borderTop: "1px solid var(--border-color)", margin: "2.2rem 0" }} />
              
              {/* Opción 1: Postular Marca a Ferias */}
              {isOwner && (
                <div className="glass-panel" style={{ padding: "1.5rem", marginBottom: "1.5rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }} onClick={() => setShowFairs(true)}>
                    <h3 style={{ fontSize: "1.05rem", fontWeight: 800, margin: 0 }}>
                      <i className="fa-solid fa-paper-plane" style={{ color: "var(--gold-primary)", marginRight: 8 }}></i> Postular Marca a Ferias
                    </h3>
                    <button type="button" className="btn-outline-gold" style={{ padding: "4px 12px", fontSize: "0.75rem", borderRadius: "6px", fontWeight: 700 }}>
                      Postular
                    </button>
                  </div>
                </div>
              )}

              {/* Opción 2: Colaboradores de la Marca */}
              {isOwner && (
                <div className="glass-panel" style={{ padding: "1.5rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }} onClick={() => setShowCollabs(true)}>
                    <h3 style={{ fontSize: "1.05rem", fontWeight: 800, margin: 0 }}>
                      <i className="fa-solid fa-users" style={{ color: "var(--gold-primary)", marginRight: 8 }}></i> Colaboradores de la Marca
                    </h3>
                    <button type="button" className="btn-outline-gold" style={{ padding: "4px 12px", fontSize: "0.75rem", borderRadius: "6px", fontWeight: 700 }}>
                      Administrar
                    </button>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Info del Dueño al final del perfil */}
          {brand.owner && (
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "8px", marginTop: "2rem", padding: "1rem 0 0", borderTop: "1px solid var(--border-color)", fontSize: "0.85rem", color: "var(--text-muted)" }}>
              <i className="fa-solid fa-user-tag" style={{ color: "var(--gold-primary)" }}></i>
              <span>Esta marca es gestionada por su dueño(a): <strong>{brand.owner}</strong></span>
            </div>
          )}
        </div>
      </div>

      {/* ── PESTAÑAS: VITRINA CULTURAL vs MURO DE NOVEDADES ── */}
      <div className="aourum-tabs-container" style={{ marginTop: "2.5rem" }}>
        <button
          type="button"
          className={`aourum-tab-btn ${activeBrandTab === "vitrina" ? "active" : ""}`}
          onClick={() => setActiveBrandTab("vitrina")}
        >
          <i className="fa-solid fa-shop"></i> Vitrina Cultural
        </button>
        <button
          type="button"
          className={`aourum-tab-btn ${activeBrandTab === "muro" ? "active" : ""}`}
          onClick={() => setActiveBrandTab("muro")}
        >
          <i className="fa-solid fa-rss"></i> Muro de Novedades
        </button>
        <button
          type="button"
          className={`aourum-tab-btn ${activeBrandTab === "eventos" ? "active" : ""}`}
          onClick={() => setActiveBrandTab("eventos")}
        >
          <i className="fa-solid fa-graduation-cap"></i> Cursos & Eventos ({(events || []).filter(e => Number(e.brandId) === Number(brand?.id)).length})
        </button>

        {isCollaborator && (
          <div style={{ marginLeft: "auto", display: "flex", gap: "8px" }}>
            <button
              type="button"
              onClick={() => {
                setEditingEventId(null);
                setEvtTitle("");
                setEvtDescription("");
                setEvtType("curso");
                setEvtDate("");
                setEvtDuration("");
                setEvtIsOnline(false);
                setEvtOnlineLink("");
                setEvtLocation("");
                setEvtPrice("");
                setEvtSpotsTotal("");
                setEvtImage("");
                setEventFormOpen(true);
              }}
              className="btn-gold"
              style={{ padding: "0.45rem 1rem", fontSize: "0.82rem", borderRadius: "8px", fontWeight: 700, display: "flex", alignItems: "center", gap: "6px" }}
            >
              <i className="fa-solid fa-calendar-plus"></i> Crear Evento / Curso
            </button>
            <button
              type="button"
              onClick={() => openCreatePostModal({ brandId: brand?.id, authorType: "brand" })}
              className="btn-outline-gold"
              style={{ padding: "0.45rem 1rem", fontSize: "0.82rem", borderRadius: "8px", fontWeight: 700, display: "flex", alignItems: "center", gap: "6px" }}
            >
              <i className="fa-solid fa-pen-to-square"></i> Publicar Novedad
            </button>
          </div>
        )}
      </div>

      {activeBrandTab === "eventos" ? (
        <div style={{ marginTop: "1.5rem" }}>
          {(() => {
            const brandEvents = (events || []).filter(e => Number(e.brandId) === Number(brand?.id));
            if (brandEvents.length === 0) {
              return (
                <div className="glass-panel" style={{ textAlign: "center", padding: "4rem 1rem", color: "var(--text-muted)", borderRadius: "16px" }}>
                  <i className="fa-solid fa-graduation-cap" style={{ fontSize: "3rem", color: "var(--gold-primary)", marginBottom: "1rem", opacity: 0.5 }}></i>
                  <h3 style={{ fontSize: "1.15rem", fontWeight: 800, color: "var(--text-primary)", marginBottom: "0.5rem" }}>
                    No hay cursos o eventos activos
                  </h3>
                  <p style={{ fontSize: "0.88rem", maxWidth: "450px", margin: "0 auto 1.5rem auto" }}>
                    {brand?.name} no ha publicado eventos o talleres por el momento.
                  </p>
                  {isCollaborator && (
                    <button
                      type="button"
                      onClick={() => setEventFormOpen(true)}
                      className="btn-gold"
                      style={{ padding: "0.6rem 1.2rem", borderRadius: "12px", fontSize: "0.88rem", fontWeight: 700 }}
                    >
                      <i className="fa-solid fa-plus" style={{ marginRight: 6 }}></i> Crear Primer Curso o Taller
                    </button>
                  )}
                </div>
              );
            }

            return (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "1.25rem" }}>
                {brandEvents.map((evt) => (
                  <div
                    key={evt.id}
                    style={{
                      background: "var(--bg-card)",
                      border: "1px solid var(--border-color)",
                      borderRadius: "16px",
                      overflow: "hidden",
                      display: "flex",
                      flexDirection: "column",
                      position: "relative"
                    }}
                  >
                    <div style={{ position: "relative", width: "100%", height: "150px", background: "#111" }}>
                      <img
                        src={evt.image || brand?.logo || "/dummy.png"}
                        alt={evt.title}
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                        onError={(e) => { e.target.src = "/dummy.png"; }}
                      />
                      <span
                        style={{
                          position: "absolute",
                          top: "10px",
                          left: "10px",
                          background: "rgba(0,0,0,0.75)",
                          color: "var(--gold-dark)",
                          padding: "2px 8px",
                          borderRadius: "10px",
                          fontSize: "0.7rem",
                          fontWeight: 800,
                          textTransform: "uppercase"
                        }}
                      >
                        {evt.eventType || "Curso"}
                      </span>
                      <span
                        style={{
                          position: "absolute",
                          top: "10px",
                          right: "10px",
                          background: evt.isOnline ? "rgba(59,130,246,0.85)" : "rgba(16,185,129,0.85)",
                          color: "#FFF",
                          padding: "2px 8px",
                          borderRadius: "10px",
                          fontSize: "0.7rem",
                          fontWeight: 700
                        }}
                      >
                        {evt.isOnline ? "Online" : "Presencial"}
                      </span>
                    </div>

                    <div style={{ padding: "1rem", flex: 1, display: "flex", flexDirection: "column" }}>
                      <h4 style={{ fontSize: "1rem", fontWeight: 800, marginBottom: "0.4rem" }}>{evt.title}</h4>
                      <div style={{ fontSize: "0.8rem", color: "var(--gold-dark)", fontWeight: 700, marginBottom: "0.4rem" }}>
                        <i className="fa-regular fa-clock" style={{ marginRight: 4 }}></i>
                        {evt.eventDate ? (
                          (evt.isAllDay || evt.eventDate.includes("T00:00")) ? (
                            new Date(evt.eventDate).toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" }) + " (Todo el día)"
                          ) : (
                            new Date(evt.eventDate).toLocaleDateString("es-ES", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })
                          )
                        ) : "Por definir"}
                      </div>
                      <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginBottom: "0.8rem" }}>
                        <i className={`fa-solid ${evt.isOnline ? "fa-link" : "fa-map-pin"}`} style={{ marginRight: 4 }}></i>
                        {evt.isOnline ? "Virtual" : (evt.location || "Presencial")}
                      </div>

                      <div style={{ marginTop: "auto", paddingTop: "0.6rem", borderTop: "1px solid var(--border-color)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <span style={{ fontSize: "0.95rem", fontWeight: 900, color: evt.price > 0 ? "var(--gold-dark)" : "#10b981" }}>
                          {evt.price > 0 ? `S/ ${evt.price}` : "Gratis"}
                        </span>
                        {isCollaborator && (
                          <div style={{ display: "flex", gap: "6px" }}>
                            <button
                              type="button"
                              onClick={() => {
                                setEditingEventId(evt.id);
                                setEvtTitle(evt.title || "");
                                setEvtDescription(evt.description || "");
                                setEvtType(evt.eventType || "curso");
                                setEvtDate(evt.eventDate ? evt.eventDate.slice(0, 16) : "");
                                setEvtIsAllDay(evt.isAllDay || (evt.eventDate && evt.eventDate.includes("T00:00")) || false);
                                setEvtDuration(evt.durationMinutes || "");
                                setEvtIsOnline(!!evt.isOnline);
                                setEvtOnlineLink(evt.onlineLink || "");
                                setEvtLocation(evt.location || "");
                                setEvtPrice(evt.price !== null && evt.price !== undefined ? evt.price : "");
                                setEvtSpotsTotal(evt.spotsTotal || "");
                                setEvtImage(evt.image || "");
                                setEventFormOpen(true);
                              }}
                              className="btn-outline-gold"
                              style={{ padding: "3px 8px", fontSize: "0.72rem", borderRadius: "6px" }}
                            >
                              Editar
                            </button>
                            <button
                              type="button"
                              onClick={async () => {
                                if (confirm(`¿Eliminar el evento "${evt.title}"?`)) {
                                  await deleteEvent(evt.id);
                                }
                              }}
                              style={{ background: "rgba(239,68,68,0.15)", color: "#ef4444", border: "none", padding: "3px 8px", fontSize: "0.72rem", borderRadius: "6px", cursor: "pointer" }}
                            >
                              Borrar
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            );
          })()}
        </div>
      ) : activeBrandTab === "muro" ? (
        <div style={{ marginTop: "1.5rem" }}>
          {isCollaborator && (
            <SocialFeedPublisher
              defaultAuthorType="brand"
              defaultBrandId={brand?.id}
              onPostCreated={(newPost) => setBrandPosts(prev => [newPost, ...prev])}
            />
          )}

          <PostList
            posts={brandPosts}
            loading={brandPostsLoading}
            emptyMessage={`Aún no hay novedades publicadas por ${brand?.name || 'esta marca'}.`}
            onPostDeleted={(id) => setBrandPosts(prev => prev.filter(p => p.id !== id))}
          />
        </div>
      ) : (
        /* ── SECCIÓN DE CATÁLOGO ESTILO DESCUBRE ── */
        brandProducts.length === 0 ? (
          <div className="glass-panel" style={{ textAlign: "center", padding: "4rem 0", color: "var(--text-muted)", borderRadius: "16px", marginTop: "2rem" }}>
            <i className="fa-solid fa-box-open" style={{ fontSize: "2.5rem", opacity: 0.3, marginBottom: "1rem", display: "block" }}></i>
            <p style={{ fontSize: "0.9rem" }}>Esta marca aún no ha publicado items en su catálogo virtual.</p>
          </div>
        ) : (
          <div style={{ marginTop: "2rem" }}>
            <div style={{ marginBottom: "2rem" }}>
              <h2 style={{ fontSize: "1.7rem", fontWeight: 800, letterSpacing: "-0.015em", margin: 0, color: isStoreBgLight ? "#1C1C1E" : "#FFFFFF" }}>
                🛍️ Catálogo de la Marca
              </h2>
              <p style={{ fontSize: "0.88rem", color: isStoreBgLight ? "#4B5563" : "#9CA3AF", margin: "4px 0 0 0" }}>
                Explora todas las colecciones, servicios y productos de {brand.name}
              </p>
            </div>

          {/* 1. Carrusel de Productos Destacados de la Marca */}
          {renderCarousel(
            "productos-destacados-marca",
            "Productos Destacados",
            `Los artículos más populares y recomendados de ${brand.name}`,
            featuredBrandProducts
          )}

          {/* 2. Carruseles por Categoría de la Marca */}
          {brandCategories.map((cat) => (
            renderCarousel(
              `cat-${cat.toLowerCase().replace(/[^a-z0-9]/g, "")}`,
              cat,
              `Explora nuestra variedad en ${cat.toLowerCase()}`,
              brandProducts.filter(p => p.category && p.category.trim().toLowerCase() === cat.trim().toLowerCase())
            )
          ))}

          {/* 3. Grilla General de Todos los Productos */}
          <div style={{ borderTop: isStoreBgLight ? "1px solid rgba(0,0,0,0.1)" : "1px solid rgba(255,255,255,0.1)", paddingTop: "2.5rem", marginTop: "2rem" }}>
            <div style={{ marginBottom: "1.5rem" }}>
              <h2 style={{ fontSize: "1.5rem", fontWeight: 800, margin: 0, color: isStoreBgLight ? "#1C1C1E" : "#FFFFFF" }}>
                ✨ Vitrina Completa de Productos ({brandProducts.length})
              </h2>
              <p style={{ fontSize: "0.85rem", color: isStoreBgLight ? "#4B5563" : "#9CA3AF", margin: "4px 0 0 0" }}>
                Todos los artículos disponibles en {brand.name}
              </p>
            </div>
            <div className="grid-catalog">
              {brandProducts.slice(0, visibleCount).map((prod) => (
                <BrandProductCard key={prod.id} prod={prod} />
              ))}
            </div>

            {brandProducts.length > visibleCount && (
              <div style={{ display: "flex", justifyContent: "center", marginTop: "3rem" }}>
                <button 
                  onClick={() => setVisibleCount((prev) => prev + (typeof window !== "undefined" && window.innerWidth <= 640 ? 12 : 15))}
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
      )
      )}

      {/* ── VENTANAS SUPERPUESTAS (MODALS) RENDERIZADAS A NIVEL DE RAÍZ DEL COMPONENTE ── */}
      {/* 1. Formulario de creación/edición de producto en Ventana Superpuesta (Modal) */}
      {isOwner && prodFormOpen && (
        <div className="modal-overlay" style={{ zIndex: 1200 }}>
          <div className="modal-backdrop" onClick={() => { setProdFormOpen(false); setEditingProdId(null); }}></div>
          <div className="modal-panel fade-in" style={{ maxWidth: "750px", background: "#FFFFFF", border: "1.5px solid var(--gold-primary)", padding: 0 }}>
            <div className="modal-header">
              <h3 style={{ fontSize: "1.3rem", fontWeight: 800, margin: 0 }}>
                {editingProdId ? "✨ Editar Item de Catálogo" : "✨ Publicar Nuevo Item"}
              </h3>
              <button 
                onClick={() => { setProdFormOpen(false); setEditingProdId(null); }} 
                style={{ background: "rgba(0,0,0,0.04)", border: "none", fontSize: "1.2rem", cursor: "pointer", width: "32px", height: "32px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}
              >
                &times;
              </button>
            </div>
            <form onSubmit={(e) => handleProductSubmit(e, brand.id)} className="modal-body">
              <div className="grid-2-to-1">
                <div className="form-group">
                  <label>Nombre del Item *</label>
                  <input type="text" className="form-control" placeholder="Ej: Anillo de Plata 950" value={prodName} onChange={(e) => setProdName(e.target.value)} required />
                </div>
                <div className="form-group" style={{ position: "relative" }}>
                  <label>Categoría / Rubro *</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    placeholder="Ej: Joyería, Bienestar" 
                    value={prodCategory} 
                    onChange={(e) => {
                      setProdCategory(e.target.value);
                      setCategorySuggestionsOpen(true);
                    }}
                    onFocus={() => setCategorySuggestionsOpen(true)}
                    onBlur={() => {
                      setTimeout(() => setCategorySuggestionsOpen(false), 200);
                    }}
                    required 
                    autoComplete="off"
                  />
                  {categorySuggestionsOpen && filteredCategoryOptions.length > 0 && (
                    <div 
                      className="glass-panel" 
                      style={{
                        position: "absolute",
                        top: "100%",
                        left: 0,
                        right: 0,
                        zIndex: 10,
                        maxHeight: "160px",
                        overflowY: "auto",
                        marginTop: "4px",
                        padding: "4px",
                        borderRadius: "8px",
                        boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
                        border: "1px solid var(--border-color)",
                        background: "#FFFFFF"
                      }}
                    >
                      {filteredCategoryOptions.map((cat, idx) => (
                        <div
                          key={idx}
                          onClick={() => {
                            setProdCategory(cat);
                            setCategorySuggestionsOpen(false);
                          }}
                          style={{
                            padding: "8px 12px",
                            cursor: "pointer",
                            borderRadius: "6px",
                            fontSize: "0.85rem",
                            transition: "background 0.2s",
                            color: "var(--text-primary)",
                            textAlign: "left"
                          }}
                          onMouseEnter={(e) => e.target.style.background = "var(--gold-light-opacity, rgba(214,175,55,0.08))"}
                          onMouseLeave={(e) => e.target.style.background = "transparent"}
                        >
                          {cat}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="grid-2-to-1">
                <div className="form-group">
                  <label>Tipo de Item</label>
                  <select className="form-control" value={prodType} onChange={(e) => setProdType(e.target.value)}>
                    <option value="product">Producto Físico (Con Stock)</option>
                    <option value="service">Servicio (Por Agenda / Cita)</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Stock (Opcional)</label>
                  <input 
                    type="number" 
                    className="form-control" 
                    placeholder={prodType === "service" ? "No requiere stock" : "Ej: 15"} 
                    value={prodStock} 
                    onChange={(e) => setProdStock(e.target.value)} 
                    disabled={prodType === "service"}
                  />
                </div>
              </div>

              <div className="grid-2-to-1" style={{ marginTop: "1rem" }}>
                <div className="form-group">
                  <label>Precio Normal (S/.) *</label>
                  <input type="number" className="form-control" placeholder="Ej: 10" value={prodPrice} onChange={(e) => setProdPrice(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label>Precio AOURUM (S/.) (Opcional)</label>
                  <input type="number" className="form-control" placeholder="Ej: 8" value={prodPriceAourum} onChange={(e) => setProdPriceAourum(e.target.value)} />
                </div>
              </div>

              <div className="form-group" style={{ marginTop: "1rem" }}>
                <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", fontWeight: 700, fontSize: "0.9rem" }}>
                  <input 
                    type="checkbox" 
                    checked={prodIsVisible} 
                    onChange={(e) => setProdIsVisible(e.target.checked)} 
                    style={{ width: "18px", height: "18px", accentColor: "var(--gold-primary)", cursor: "pointer" }}
                  />
                  <span>👁️ Producto visible públicamente en el catálogo</span>
                </label>
                <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", display: "block", marginLeft: "26px", marginTop: "2px" }}>
                  Si desmarcas esta casilla, el producto estará oculto. Nadie más que tú podrá acceder a él (los enlaces externos redirigirán al inicio).
                </span>
              </div>

              <div className="prod-form-img-desc" style={{ marginTop: "1rem" }}>
                <div className="form-group">
                  <label>Subir Imagen</label>
                  <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", display: "block", marginTop: "-3px", marginBottom: "5px" }}>
                    Proporción recomendada: Cuadrada (1:1, ej. 800x800 px) o 4:3
                  </span>
                  <div style={{ marginTop: "2px", marginBottom: "8px", display: "flex", alignItems: "center", gap: "4px" }}>
                    <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "4px" }}>
                      💡 Recomendamos para quitar fondo usar esta herramienta: 
                      <a 
                        href="https://www.photoroom.com/es/tools/background-remover" 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        style={{ color: "var(--text-gold)", fontWeight: 700, textDecoration: "underline" }}
                      >
                        Photoroom
                      </a>
                    </span>
                  </div>
                  <label
                    htmlFor="prod-img-upload"
                    style={{
                      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                      border: "2px dashed var(--border-color)", borderRadius: "8px",
                      height: "120px", cursor: "pointer", transition: "var(--transition-smooth)",
                      background: "var(--bg-input)"
                    }}
                  >
                    {prodImagePreview ? (
                      <img src={prodImagePreview} alt="preview" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "6px" }} />
                    ) : (
                      <div style={{ textAlign: "center", padding: "0.5rem" }}>
                        <i className="fa-solid fa-cloud-arrow-up" style={{ color: "var(--gold-primary)", fontSize: "1.4rem", marginBottom: 4 }}></i>
                        <span style={{ fontSize: "0.75rem", display: "block", color: "var(--text-muted)" }}>Elegir archivo</span>
                      </div>
                    )}
                  </label>
                  <input 
                    id="prod-img-upload" 
                    type="file" 
                    accept="image/*" 
                    style={{ display: "none" }} 
                    disabled={uploadingProd} 
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (!file) return;
                      const reader = new FileReader();
                      reader.onload = () => {
                        const img = new Image();
                        img.onload = () => {
                          const maxDim = 1200;
                          if (img.width <= maxDim && img.height <= maxDim) {
                            setEditorSource(reader.result);
                            setAspectRatio("1:1");
                            setScale(1);
                            setImgPos({ x: 0, y: 0 });
                            setEditorTool("move");
                            setBrushSize(30);
                            if (maskCanvasRef.current) {
                              maskCanvasRef.current = null;
                            }
                            setEditorOpen(true);
                            return;
                          }
                          
                          const canvas = document.createElement("canvas");
                          let w = img.width;
                          let h = img.height;
                          
                          if (w > h) {
                            if (w > maxDim) {
                              h = Math.round((h * maxDim) / w);
                              w = maxDim;
                            }
                          } else {
                            if (h > maxDim) {
                              w = Math.round((w * maxDim) / h);
                              h = maxDim;
                            }
                          }
                          
                          canvas.width = w;
                          canvas.height = h;
                          
                          const ctx = canvas.getContext("2d");
                          ctx.imageSmoothingEnabled = true;
                          ctx.imageSmoothingQuality = "high";
                          ctx.drawImage(img, 0, 0, w, h);
                          
                          setEditorSource(canvas.toDataURL("image/png"));
                          setAspectRatio("1:1");
                          setScale(1);
                          setImgPos({ x: 0, y: 0 });
                          setEditorTool("move");
                          setBrushSize(30);
                          if (maskCanvasRef.current) {
                            maskCanvasRef.current = null;
                          }
                          setEditorOpen(true);
                        };
                        img.src = reader.result;
                      };
                      reader.readAsDataURL(file);
                    }}
                  />
                </div>

                <div className="form-group" style={{ flex: 1 }}>
                  <label>Descripción del Producto *</label>
                  <textarea className="form-control" rows="4" style={{ resize: "none" }} placeholder="Describe los materiales, dimensiones o proceso..." value={prodDescription} onChange={(e) => setProdDescription(e.target.value)}></textarea>
                </div>
              </div>

              <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", marginTop: "1.5rem" }}>
                <button 
                  type="button" 
                  onClick={() => { setProdFormOpen(false); setEditingProdId(null); }} 
                  className="btn-outline-gold"
                  style={{ padding: "0.45rem 1.2rem", borderRadius: "6px", fontSize: "0.85rem" }}
                >
                  Cancelar
                </button>
                <button type="submit" className="btn-gold" style={{ padding: "0.45rem 1.2rem", borderRadius: "6px", fontSize: "0.85rem" }} disabled={uploadingProd || productSubmitLoading}>
                  {uploadingProd ? "Subiendo..." : productSubmitLoading ? "Guardando..." : editingProdId ? "Actualizar Item" : "Publicar Item"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Modal del Editor de Imagen (Recorte y Eliminación de Fondo) */}
      {editorOpen && (
        <div className="modal-overlay" style={{ zIndex: 1300 }}>
          <div className="modal-backdrop" onClick={() => setEditorOpen(false)}></div>
          <div className="modal-panel image-editor-panel fade-in">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
              <h3 style={{ fontSize: "1.2rem", fontWeight: 800, margin: 0 }}>
                ✨ Editor de Imagen
              </h3>
              <button 
                onClick={() => setEditorOpen(false)} 
                style={{ background: "rgba(0,0,0,0.04)", border: "none", fontSize: "1.2rem", cursor: "pointer", width: "32px", height: "32px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}
              >
                &times;
              </button>
            </div>

            <div style={{ fontSize: "0.82rem", color: "var(--text-muted)", marginBottom: "1rem" }}>
              Arrastra la imagen dentro del recuadro para centrarla. Usa los controles inferiores para recortar o quitar el fondo.
            </div>

            {/* Viewport de Canvas interactivo */}
            <div style={{ position: "relative", width: "300px", height: aspectRatio === "1:1" ? "300px" : "225px", maxWidth: "100%", margin: "0 auto 1.2rem auto", overflow: "hidden" }}>
              <canvas 
                id="editor-canvas"
                width={1200}
                height={aspectRatio === "1:1" ? 1200 : 900}
                style={{
                  width: "100%",
                  height: "auto",
                  aspectRatio: aspectRatio === "1:1" ? "1/1" : "4/3",
                  border: "2px solid var(--gold-primary)",
                  borderRadius: "8px",
                  background: "repeating-conic-gradient(#f0f0f0 0% 25%, #ffffff 0% 50%) 50% / 20px 20px",
                  cursor: isDragging ? "grabbing" : (editorTool === "erase" ? "crosshair" : "grab"),
                  display: "block",
                  touchAction: "none"
                }}
                onMouseDown={(e) => {
                  e.preventDefault();
                  if (editorTool === "move") {
                    setIsDragging(true);
                    setDragStart({ x: e.clientX - imgPos.x, y: e.clientY - imgPos.y });
                  } else {
                    handleStartDraw(e);
                  }
                }}
                onMouseMove={(e) => {
                  if (editorTool === "move") {
                    if (!isDragging) return;
                    setImgPos({
                      x: e.clientX - dragStart.x,
                      y: e.clientY - dragStart.y
                    });
                  } else {
                    handleMoveDraw(e);
                  }
                }}
                onMouseUp={() => {
                  if (editorTool === "move") {
                    setIsDragging(false);
                  } else {
                    handleEndDraw();
                  }
                }}
                onMouseLeave={() => {
                  if (editorTool === "move") {
                    setIsDragging(false);
                  } else {
                    handleEndDraw();
                  }
                }}
                onTouchStart={(e) => {
                  e.preventDefault();
                  if (editorTool === "move") {
                    const touch = e.touches[0];
                    setIsDragging(true);
                    setDragStart({ x: touch.clientX - imgPos.x, y: touch.clientY - imgPos.y });
                  } else {
                    handleStartDraw(e);
                  }
                }}
                onTouchMove={(e) => {
                  e.preventDefault();
                  if (editorTool === "move") {
                    if (!isDragging) return;
                    const touch = e.touches[0];
                    setImgPos({
                      x: touch.clientX - dragStart.x,
                      y: touch.clientY - dragStart.y
                    });
                  } else {
                    handleMoveDraw(e);
                  }
                }}
                onTouchEnd={() => {
                  if (editorTool === "move") {
                    setIsDragging(false);
                  } else {
                    handleEndDraw();
                  }
                }}
              />
            </div>



            {/* Opciones de Medida / Proporción de Recorte */}
            <div className="form-group" style={{ marginBottom: "1.2rem", textAlign: "left" }}>
              <label style={{ fontSize: "0.85rem", fontWeight: 700, display: "block", marginBottom: "0.5rem", color: "var(--text-primary)" }}>
                📐 Proporción de Recorte:
              </label>
              <div style={{ display: "flex", gap: "10px" }}>
                <button
                  type="button"
                  onClick={() => { setAspectRatio("1:1"); setScale(1); setImgPos({ x: 0, y: 0 }); }}
                  className={aspectRatio === "1:1" ? "btn-gold" : "btn-outline-gold"}
                  style={{
                    flex: 1,
                    padding: "0.5rem",
                    borderRadius: "8px",
                    fontSize: "0.82rem",
                    fontWeight: 700,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "6px"
                  }}
                >
                  <i className="fa-solid fa-square"></i> Cuadrada (1:1)
                </button>
                <button
                  type="button"
                  onClick={() => { setAspectRatio("4:3"); setScale(1); setImgPos({ x: 0, y: 0 }); }}
                  className={aspectRatio === "4:3" ? "btn-gold" : "btn-outline-gold"}
                  style={{
                    flex: 1,
                    padding: "0.5rem",
                    borderRadius: "8px",
                    fontSize: "0.82rem",
                    fontWeight: 700,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "6px"
                  }}
                >
                  <i className="fa-solid fa-image"></i> Rectangular (4:3)
                </button>
              </div>
            </div>

            {/* Control de Zoom / Escala (Alejar/Acercar) */}
            <div className="form-group" style={{ marginBottom: "1.2rem", textAlign: "left" }}>
              <label style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "0.5rem" }}>
                <span>🔍 Zoom / Escala:</span>
                <span style={{ color: "var(--gold-primary)", fontWeight: 800 }}>{scale.toFixed(2)}x</span>
              </label>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <button
                  type="button"
                  onClick={() => setScale(prev => Math.max(0.1, Math.round((prev - 0.05) * 100) / 100))}
                  style={{
                    background: "var(--bg-input)",
                    border: "1px solid var(--border-color)",
                    borderRadius: "6px",
                    width: "38px",
                    height: "38px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    color: "var(--text-primary)",
                    transition: "all 0.2s"
                  }}
                  title="Alejar la foto"
                >
                  <i className="fa-solid fa-minus"></i>
                </button>
                <input 
                  type="range" 
                  min="0.1" 
                  max="3.0" 
                  step="0.05" 
                  value={scale} 
                  onChange={(e) => setScale(parseFloat(e.target.value))} 
                  style={{ flex: 1, accentColor: "var(--gold-primary)", cursor: "pointer" }}
                />
                <button
                  type="button"
                  onClick={() => setScale(prev => Math.min(3.0, Math.round((prev + 0.05) * 100) / 100))}
                  style={{
                    background: "var(--bg-input)",
                    border: "1px solid var(--border-color)",
                    borderRadius: "6px",
                    width: "38px",
                    height: "38px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    color: "var(--text-primary)",
                    transition: "all 0.2s"
                  }}
                  title="Acercar la foto"
                >
                  <i className="fa-solid fa-plus"></i>
                </button>
              </div>
              <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", display: "block", marginTop: "6px" }}>
                Tip: Usa los botones o el deslizador para alejar (reducir) la foto, o arrástrala con el mouse/dedo para acomodarla.
              </span>
            </div>



            <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
              <button 
                type="button" 
                onClick={() => setEditorOpen(false)} 
                className="btn-outline-gold"
                style={{ padding: "0.65rem 1.4rem", borderRadius: "8px", fontSize: "0.88rem", fontWeight: 600 }}
              >
                Cancelar
              </button>
              <button 
                type="button" 
                onClick={handleSaveEditor} 
                className="btn-gold" 
                style={{ padding: "0.65rem 1.8rem", borderRadius: "8px", fontSize: "0.88rem", fontWeight: 700 }}
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. Modal de postulación a ferias */}
      {isOwner && showFairs && (
        <div className="modal-overlay" style={{ zIndex: 1100 }}>
          <div className="modal-backdrop" onClick={() => setShowFairs(false)}></div>
          <div className="modal-panel fade-in" style={{ maxWidth: "550px", background: "#FFFFFF", border: "1.5px solid var(--gold-primary)", padding: 0 }}>
            <div className="modal-header">
              <h3 style={{ fontSize: "1.2rem", fontWeight: 800, margin: 0 }}>
                <i className="fa-solid fa-paper-plane" style={{ color: "var(--gold-primary)", marginRight: 8 }}></i> Postular Marca a Ferias
              </h3>
              <button 
                onClick={() => setShowFairs(false)} 
                style={{ background: "rgba(0,0,0,0.04)", border: "none", fontSize: "1.2rem", cursor: "pointer", width: "32px", height: "32px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}
              >
                &times;
              </button>
            </div>
            <form onSubmit={(e) => handleApplyToFair(e, "brand", brand.id)} className="apply-fair-form modal-body">
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

      {/* 4. Modal de colaboradores de la marca */}
      {isOwner && showCollabs && (
        <div className="modal-overlay" style={{ zIndex: 1100 }}>
          <div className="modal-backdrop" onClick={() => setShowCollabs(false)}></div>
          <div className="modal-panel fade-in" style={{ maxWidth: "750px", background: "#FFFFFF", border: "1.5px solid var(--gold-primary)", padding: 0 }}>
            <div className="modal-header">
              <h3 style={{ fontSize: "1.2rem", fontWeight: 800, margin: 0 }}>
                <i className="fa-solid fa-users" style={{ color: "var(--gold-primary)", marginRight: 8 }}></i> Colaboradores de la Marca
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
                {brand.collaborators && brand.collaborators.length === 0 ? (
                  <p style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>No hay colaboradores adicionales.</p>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    {brand.collaborators && brand.collaborators.map(c => {
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
                                onChange={(e) => changeCollaboratorRole('brand', brand.id, p.id, e.target.value)}
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
                                    removeCollaborator('brand', brand.id, p.id);
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
                    <h4 style={{ fontSize: "0.95rem", fontWeight: 700, marginBottom: "0.8rem", color: "var(--text-gold)" }}>Invitar Colaborador</h4>
                    {(() => {
                      const linkedIds = (brand.collaborators || []).map(c => c.personId);
                      const pendingReceiverIds = invitations.filter(inv => inv.senderType === "brand" && inv.senderId === brand.id).map(inv => inv.receiverPersonId);
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
                          sendInvitation("brand", brand.id, brand.name, receiverId, inviteRole);
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
                  const pending = invitations.filter(inv => inv.senderType === "brand" && inv.senderId === brand.id);
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

      {/* 5. Modal de administración del catálogo (tabla) */}
      {isOwner && adminCatalogOpen && (
        <div className="modal-overlay" style={{ zIndex: 1100 }}>
          <div className="modal-backdrop" onClick={() => { setAdminCatalogOpen(false); setAdminSearchQuery(""); }}></div>
          <div className="modal-panel fade-in" style={{ maxWidth: "850px", background: "#FFFFFF", border: "1.5px solid var(--gold-primary)", padding: 0 }}>
            <div className="modal-header">
              <h3 style={{ fontSize: "1.20rem", fontWeight: 800, margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
                <i className="fa-solid fa-list-check" style={{ color: "var(--gold-primary)" }}></i>
                Administrar Items en Catálogo
              </h3>
              <button 
                onClick={() => { setAdminCatalogOpen(false); setAdminSearchQuery(""); }} 
                style={{ background: "rgba(0,0,0,0.04)", border: "none", fontSize: "1.2rem", cursor: "pointer", width: "32px", height: "32px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}
              >
                &times;
              </button>
            </div>
            
            <div className="modal-body">
            
            {/* Buscador de items */}
            <div style={{ marginBottom: "1.5rem", position: "relative" }}>
              <input 
                type="text" 
                className="form-control" 
                placeholder="🔍 Buscar por nombre o categoría..." 
                value={adminSearchQuery}
                onChange={(e) => setAdminSearchQuery(e.target.value)}
                style={{ padding: "0.6rem 1rem", fontSize: "0.88rem", borderRadius: "8px", border: "1px solid var(--border-color)", width: "100%" }}
              />
              {adminSearchQuery && (
                <button 
                  type="button" 
                  onClick={() => setAdminSearchQuery("")}
                  style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", fontSize: "1.1rem" }}
                >
                  &times;
                </button>
              )}
            </div>
            
            <div className="admin-table-wrapper" style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.88rem" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--border-color)", textAlign: "left", color: "var(--text-muted)", fontSize: "0.78rem", textTransform: "uppercase" }}>
                    <th style={{ padding: "0.8rem 0" }}>Foto</th>
                    <th>Nombre</th>
                    <th>Tipo</th>
                    <th>Precio</th>
                    <th>Stock</th>
                    <th>Visibilidad</th>
                    <th style={{ textAlign: "right" }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAdminProducts.map((prod) => (
                    <tr key={prod.id} style={{ borderBottom: "1px solid rgba(0,0,0,0.04)" }}>
                      <td style={{ padding: "0.6rem 0" }}>
                        <img src={prod.image} alt={prod.name} style={{ width: "42px", height: "42px", objectFit: "cover", borderRadius: "6px", border: "1px solid var(--border-color)" }} />
                      </td>
                      <td style={{ fontWeight: 700 }}>{prod.name}</td>
                      <td>
                        <span style={{ fontSize: "0.72rem", padding: "3px 6px", borderRadius: "4px", color: "#FFFFFF", fontWeight: "bold", background: prod.type === "service" ? "#2563eb" : "#d97706" }}>
                          {prod.type === "service" ? "Servicio" : "Producto"}
                        </span>
                      </td>
                      <td style={{ fontWeight: "bold" }}>
                        {prod.priceAourum ? (
                          <div>
                            <span style={{ color: "var(--text-gold)" }}>S/ {prod.priceAourum.toLocaleString("es-PE")}</span>
                            <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", textDecoration: "line-through", marginLeft: "6px" }}>
                              S/ {prod.price.toLocaleString("es-PE")}
                            </span>
                          </div>
                        ) : (
                          <span>S/ {prod.price.toLocaleString("es-PE")}</span>
                        )}
                      </td>
                      <td>{prod.type === "service" ? "Por Agenda" : (prod.stock == null ? "Ilimitado / Opcional" : prod.stock)}</td>
                      <td>
                        <button 
                          type="button" 
                          onClick={async () => {
                            try {
                              const newVis = prod.isVisible === false ? true : false;
                              await handleProductSubmit({ ...prod, isVisible: newVis });
                            } catch (err) {
                              console.error("Error al actualizar visibilidad", err);
                            }
                          }}
                          style={{ 
                            background: prod.isVisible === false ? "#fee2e2" : "#dcfce7", 
                            color: prod.isVisible === false ? "#991b1b" : "#166534", 
                            border: "none", 
                            padding: "4px 8px", 
                            borderRadius: "6px", 
                            fontSize: "0.75rem", 
                            fontWeight: 700, 
                            cursor: "pointer",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "4px"
                          }}
                          title={prod.isVisible === false ? "Clic para mostrar en catálogo" : "Clic para ocultar de catálogo"}
                        >
                          <i className={prod.isVisible === false ? "fa-solid fa-eye-slash" : "fa-solid fa-eye"}></i>
                          {prod.isVisible === false ? "Oculto" : "Visible"}
                        </button>
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <button 
                          onClick={() => {
                            setEditingProdId(prod.id); 
                            setProdName(prod.name); setProdDescription(prod.description); setProdPrice(prod.price);
                            setProdPriceAourum(prod.priceAourum == null ? "" : prod.priceAourum);
                            setProdStock(prod.stock == null ? "" : prod.stock); setProdCategory(prod.category); setProdType(prod.type);
                            setProdIsVisible(prod.isVisible !== false);
                            setProdImgBgColor(prod.imgBgColor || "transparent");
                            setProdImage(prod.image); setProdImagePreview(prod.image); setProdFormOpen(true);
                          }}
                          style={{ background: "transparent", border: "none", color: "var(--gold-dark)", cursor: "pointer", marginRight: "1rem", fontWeight: 700 }}
                        >
                          Editar
                        </button>
                        <button 
                          onClick={() => handleDeleteProduct(prod.id)}
                          style={{ background: "transparent", border: "none", color: "#ef4444", cursor: "pointer", fontWeight: 700 }}
                        >
                          Eliminar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "1.5rem" }}>
              <button 
                onClick={() => { setAdminCatalogOpen(false); setAdminSearchQuery(""); }} 
                className="btn-gold" 
                style={{ padding: "0.5rem 1.4rem", borderRadius: "8px", fontSize: "0.85rem", fontWeight: 700 }}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      </div>
    )}
      {/* Modal para Crear / Editar Evento */}
      {isCollaborator && eventFormOpen && (
        <div className="modal-overlay" style={{ zIndex: 1200 }}>
          <div className="modal-backdrop" onClick={() => setEventFormOpen(false)}></div>
          <div className="modal-panel fade-in" style={{ maxWidth: "620px", background: "var(--bg-card)", border: "1.5px solid var(--gold-primary)", padding: "1.5rem", borderRadius: "20px", maxHeight: "90vh", overflowY: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.2rem" }}>
              <h3 style={{ fontSize: "1.15rem", fontWeight: 800, margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
                <i className="fa-solid fa-graduation-cap" style={{ color: "var(--gold-primary)" }}></i>
                {editingEventId ? "Editar Evento / Taller" : "Crear Nuevo Evento o Curso"}
              </h3>
              <button
                type="button"
                onClick={() => setEventFormOpen(false)}
                style={{ background: "none", border: "none", fontSize: "1.2rem", cursor: "pointer", color: "var(--text-muted)" }}
              >
                &times;
              </button>
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (!evtTitle || !evtDate) return;
                setEvtSubmitLoading(true);
                try {
                  let waUrl = null;
                  if (evtIsOnline) {
                    let cleanWa = evtWhatsappNumber ? evtWhatsappNumber.replace(/[^\d+]/g, '') : '';
                    if (cleanWa && !cleanWa.startsWith('+') && !cleanWa.startsWith('51') && cleanWa.length === 9) {
                      cleanWa = `51${cleanWa}`;
                    }
                    const msg = `Hola, quisiera solicitar información sobre el ${evtType}: "${evtTitle}"`;
                    waUrl = cleanWa ? `https://wa.me/${cleanWa.replace('+', '')}?text=${encodeURIComponent(msg)}` : evtOnlineLink;
                  }

                  const payload = {
                    brandId: brand.id,
                    title: evtTitle,
                    description: evtDescription,
                    eventType: evtType,
                    eventDate: evtIsAllDay && !evtDate.includes("T") ? `${evtDate}T00:00` : evtDate,
                    isAllDay: evtIsAllDay,
                    durationMinutes: evtDuration ? Number(evtDuration) : null,
                    isOnline: evtIsOnline,
                    onlineLink: evtIsOnline ? waUrl : null,
                    whatsappNumber: evtIsOnline ? evtWhatsappNumber : null,
                    location: !evtIsOnline ? evtLocation : null,
                    lat: !evtIsOnline ? evtLat : null,
                    lng: !evtIsOnline ? evtLng : null,
                    price: evtPrice !== "" ? Number(evtPrice) : null,
                    spotsTotal: evtSpotsTotal ? Number(evtSpotsTotal) : null,
                    image: evtImage || null,
                  };

                  if (editingEventId) {
                    await updateEvent(editingEventId, payload);
                  } else {
                    await addEvent(payload);
                  }

                  setEventFormOpen(false);
                } catch (err) {
                  console.error(err);
                } finally {
                  setEvtSubmitLoading(false);
                }
              }}
              style={{ display: "flex", flexDirection: "column", gap: "14px" }}
            >
              <div className="form-group" style={{ margin: 0 }}>
                <label style={{ fontSize: "0.8rem", fontWeight: 700 }}>Título del Evento / Curso *</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Ej: Taller de Joyería Artesanal en Plata"
                  value={evtTitle}
                  onChange={(e) => setEvtTitle(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label style={{ fontSize: "0.8rem", fontWeight: 700 }}>Tipo *</label>
                  <select
                    className="form-control"
                    value={evtType}
                    onChange={(e) => setEvtType(e.target.value)}
                    required
                  >
                    <option value="curso">Curso</option>
                    <option value="taller">Taller</option>
                    <option value="evento">Evento</option>
                  </select>
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                    <label style={{ fontSize: "0.8rem", fontWeight: 700, margin: 0 }}>
                      {evtIsAllDay ? "Fecha *" : "Fecha y Hora *"}
                    </label>
                    <label style={{ fontSize: "0.75rem", fontWeight: 600, display: "flex", alignItems: "center", gap: "4px", cursor: "pointer", userSelect: "none", color: "var(--gold-dark, #d4af37)" }}>
                      <input
                        type="checkbox"
                        checked={evtIsAllDay}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          setEvtIsAllDay(checked);
                          if (checked && evtDate.includes("T")) {
                            setEvtDate(evtDate.split("T")[0]);
                          } else if (!checked && evtDate && !evtDate.includes("T")) {
                            setEvtDate(`${evtDate}T09:00`);
                          }
                        }}
                      />
                      <span>Todo el día</span>
                    </label>
                  </div>
                  <input
                    type={evtIsAllDay ? "date" : "datetime-local"}
                    className="form-control"
                    value={evtIsAllDay && evtDate.includes("T") ? evtDate.split("T")[0] : evtDate}
                    onChange={(e) => setEvtDate(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label style={{ fontSize: "0.8rem", fontWeight: 700 }}>Precio (S/ ARS) - Vacío = Gratis</label>
                  <input
                    type="number"
                    step="0.01"
                    className="form-control"
                    placeholder="0 = Gratis / Entrada Libre"
                    value={evtPrice}
                    onChange={(e) => setEvtPrice(e.target.value)}
                  />
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label style={{ fontSize: "0.8rem", fontWeight: 700 }}>Duración (minutos)</label>
                  <input
                    type="number"
                    className="form-control"
                    placeholder="Ej: 90"
                    value={evtDuration}
                    onChange={(e) => setEvtDuration(e.target.value)}
                  />
                </div>
              </div>

              {/* ── Carga de Flyer / Póster ── */}
              <div className="form-group" style={{ margin: 0 }}>
                <label style={{ fontSize: "0.8rem", fontWeight: 700, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span>🖼️ Flyer / Poster del Anuncio</span>
                  {evtUploadingImage && <span style={{ color: "var(--gold-primary)", fontSize: "0.78rem" }}><i className="fa-solid fa-spinner fa-spin"></i> Subiendo imagen...</span>}
                </label>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "4px" }}>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        try {
                          setEvtUploadingImage(true);
                          const url = await uploadImage(file);
                          if (url) {
                            setEvtImage(url);
                            triggerNotification("Flyer del anuncio cargado con éxito", "success");
                          }
                        } catch (err) {
                          console.error(err);
                          triggerNotification("Error al subir el flyer del anuncio", "error");
                        } finally {
                          setEvtUploadingImage(false);
                        }
                      }
                    }}
                    style={{ fontSize: "0.8rem" }}
                  />
                  <input
                    type="url"
                    className="form-control"
                    placeholder="O pega la URL directa de la imagen del flyer..."
                    value={evtImage}
                    onChange={(e) => setEvtImage(e.target.value)}
                    style={{ fontSize: "0.8rem" }}
                  />
                </div>

                {evtImage && (
                  <div style={{ marginTop: "10px", position: "relative", borderRadius: "12px", overflow: "hidden", border: "1.5px solid var(--gold-primary)", background: "#000", textAlign: "center" }}>
                    <img src={evtImage} alt="Flyer Preview" style={{ maxHeight: "200px", width: "auto", maxWidth: "100%", objectFit: "contain", display: "block", margin: "0 auto" }} />
                    <button
                      type="button"
                      onClick={() => setEvtImage("")}
                      style={{ position: "absolute", top: "6px", right: "6px", background: "rgba(0,0,0,0.8)", color: "#fff", border: "none", borderRadius: "50%", width: "26px", height: "26px", cursor: "pointer", fontSize: "0.9rem" }}
                      title="Quitar flyer"
                    >
                      &times;
                    </button>
                  </div>
                )}
              </div>

              {/* ── Modalidad Switch ── */}
              <div className="form-group" style={{ margin: 0, background: "var(--bg-input)", padding: "10px 14px", borderRadius: "10px", border: "1px solid var(--border-color)" }}>
                <label style={{ fontSize: "0.85rem", fontWeight: 700, display: "flex", alignItems: "center", gap: "10px", cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={evtIsOnline}
                    onChange={(e) => setEvtIsOnline(e.target.checked)}
                    style={{ accentColor: "var(--gold-primary)", width: "18px", height: "18px" }}
                  />
                  <span>🌐 Modalidad Online / Virtual (Consultas e Inscripciones por WhatsApp)</span>
                </label>
              </div>

              {/* ── Formulario Modalidad Virtual ── */}
              {evtIsOnline ? (
                <div style={{ background: "rgba(37,211,102,0.08)", border: "1.5px solid rgba(37,211,102,0.3)", borderRadius: "14px", padding: "14px", display: "flex", flexDirection: "column", gap: "10px" }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label style={{ fontSize: "0.82rem", fontWeight: 800, color: "#25D366", display: "flex", alignItems: "center", gap: "6px" }}>
                      <i className="fa-brands fa-whatsapp" style={{ fontSize: "1.15rem" }}></i>
                      Número de WhatsApp de Contacto *
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Ej: 51987654321 o 987654321"
                      value={evtWhatsappNumber}
                      onChange={(e) => setEvtWhatsappNumber(e.target.value)}
                      required={evtIsOnline}
                    />
                    <small style={{ fontSize: "0.74rem", color: "var(--text-muted)", marginTop: "4px", display: "block" }}>
                      Al hacer clic en el anuncio, los interesados serán redirigidos a tu WhatsApp solicitando información.
                    </small>
                  </div>
                </div>
              ) : (
                /* ── Formulario Modalidad Presencial (Mapa en Arequipa) ── */
                <div style={{ display: "flex", flexDirection: "column", gap: "10px", background: "var(--bg-input)", border: "1px solid var(--border-color)", borderRadius: "14px", padding: "14px" }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label style={{ fontSize: "0.82rem", fontWeight: 700 }}>📍 Dirección / Lugar Presencial en Arequipa *</label>
                    <div style={{ display: "flex", gap: "8px", marginTop: "4px" }}>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Ej: Av. Ejercito 300, Yanahuara, Arequipa"
                        value={evtLocation}
                        onChange={(e) => setEvtLocation(e.target.value)}
                        required={!evtIsOnline}
                      />
                      <button
                        type="button"
                        className="btn-outline-gold"
                        onClick={() => handleSearchAddress(evtLocation)}
                        disabled={evtMapSearching}
                        style={{ padding: "0 14px", whiteSpace: "nowrap", fontSize: "0.8rem", borderRadius: "8px" }}
                      >
                        {evtMapSearching ? <i className="fa-solid fa-spinner fa-spin"></i> : "Buscar Mapa"}
                      </button>
                    </div>
                  </div>

                  <div style={{ fontSize: "0.74rem", color: "var(--text-muted)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span>Haz clic o arrastra el marcador para fijar la posición exacta en Arequipa:</span>
                    <button
                      type="button"
                      onClick={() => {
                        setEvtLat(-16.39889);
                        setEvtLng(-71.53694);
                        if (evtMarkerRef.current && evtLeafletMapRef.current) {
                          evtMarkerRef.current.setLatLng([-16.39889, -71.53694]);
                          evtLeafletMapRef.current.setView([-16.39889, -71.53694], 15);
                        }
                      }}
                      style={{ background: "none", border: "none", color: "var(--gold-primary)", cursor: "pointer", fontSize: "0.74rem", fontWeight: 700 }}
                    >
                      📍 Reset Plaza de Armas
                    </button>
                  </div>

                  <div
                    ref={evtMapContainerRef}
                    style={{ height: "200px", width: "100%", borderRadius: "10px", overflow: "hidden", border: "1px solid var(--border-color)", position: "relative" }}
                  ></div>
                </div>
              )}

              <div className="form-group" style={{ margin: 0 }}>
                <label style={{ fontSize: "0.8rem", fontWeight: 700 }}>Descripción / Temario *</label>
                <textarea
                  className="form-control"
                  rows={3}
                  placeholder="Detalles del evento/curso, temario, qué se aprenderá, requerimientos..."
                  value={evtDescription}
                  onChange={(e) => setEvtDescription(e.target.value)}
                />
              </div>

              <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", marginTop: "1rem" }}>
                <button
                  type="button"
                  onClick={() => setEventFormOpen(false)}
                  className="btn-outline-gold"
                  style={{ padding: "0.5rem 1.2rem", borderRadius: "8px", fontSize: "0.85rem" }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn-gold"
                  disabled={evtSubmitLoading || evtUploadingImage}
                  style={{ padding: "0.5rem 1.4rem", borderRadius: "8px", fontSize: "0.85rem", fontWeight: 700 }}
                >
                  {evtSubmitLoading ? "Guardando..." : (editingEventId ? "Guardar Cambios" : "Publicar Anuncio de Evento")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal QR de Marca AOURUM */}
      <BrandQRModal
        isOpen={qrModalOpen}
        onClose={() => setQrModalOpen(false)}
        brand={brand}
      />
    </div>
    </div>
  );
}
