"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { useApp } from "../../../context/AppContext";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import PostList from "../../../components/PostList";

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

export default function BrandProfileClient({ initialBrand }) {
  const routeParams = useParams();
  const slug = routeParams?.slug || "";

  const isNumeric = /^\d+$/.test(slug);
  const [brandId, setBrandId] = useState(null);

  const {
    brands,
    products,
    people,
    loading,
    activePersonId,
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
    prodImage,
    setProdImage,
    prodImagePreview,
    setProdImagePreview,
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
    setEditName,
    setEditOwner,
    setEditCategory,
    setEditDescription,
    setEditLogo,
    setEditLogoPreview,
    setEditProfileType,
    setEditProfileId,
    setEditSlug,
    setEditProfileOpen,
    setEditWhatsappNumber,
    setEditInstagram,
    setEditFacebook,
    setEditTiktok,
    setEditWebsite,
    setEditRubroGeneral,
    setEditRubroEspecifico,
    setEditHasLocal,
    setEditLocalAddress,
    setEditLocalLat,
    setEditLocalLng,
    setEditBanner,
    setEditBannerPreview,
    setEditThemeColor,
    setEditTagline,
    setEditInterests,
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
  const [brandPosts, setBrandPosts] = useState([]);
  const [brandPostsLoading, setBrandPostsLoading] = useState(false);

  useEffect(() => {
    loadBrands();
    loadProducts();
    loadPeople();
    loadFairs();
    loadInvitations();
  }, [loadBrands, loadProducts, loadPeople, loadFairs, loadInvitations]);

  const brand = useMemo(() => {
    if (initialBrand) return initialBrand;
    if (!brands || brands.length === 0) return null;
    const normSlug = slug ? slug.toString().toLowerCase() : "";
    const altSlug = normSlug.includes('_') ? normSlug.replace(/_/g, '-') : normSlug.replace(/-/g, '_');
    return brands.find((b) => {
      if (brandId && b.id === brandId) return true;
      if (isNumeric && b.id === Number(slug)) return true;
      const bSlug = (b.slug || "").toLowerCase();
      return bSlug === normSlug || bSlug === altSlug || b.id.toString() === slug;
    }) || null;
  }, [initialBrand, brands, brandId, isNumeric, slug]);

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

  const brandProducts = brand ? products.filter((p) => p.brandId === brand.id) : [];

  const filteredAdminProducts = useMemo(() => {
    if (!adminSearchQuery.trim()) return brandProducts;
    return brandProducts.filter((p) => 
      p.name.toLowerCase().includes(adminSearchQuery.toLowerCase()) ||
      (p.category && p.category.toLowerCase().includes(adminSearchQuery.toLowerCase()))
    );
  }, [brandProducts, adminSearchQuery]);

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

  // Check collaborator role of the logged-in persona
  const currentPerson = people.find((p) => p.id === Number(activePersonId));
  const userCollaborator = brand.collaborators ? brand.collaborators.find(c => c.personId === Number(activePersonId)) : null;
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
    alert("¡Enlace del perfil copiado al portapapeles! Listo para compartir.");
  };

  const handleEditClick = () => {
    const parsed = parseDescription(brand.description);
    setEditName(brand.name);
    setEditOwner(brand.owner || "");
    setEditCategory(brand.category || "");
    setEditDescription(parsed.text);
    setEditLogo(brand.logo || "");
    setEditLogoPreview(brand.logo || "");
    setEditProfileType("brand");
    setEditProfileId(brand.id);
    setEditSlug(brand.slug || "");
    setEditWhatsappNumber(brand.whatsappNumber || "");
    setEditInstagram(parsed.instagram);
    setEditFacebook(parsed.facebook);
    setEditTiktok(parsed.tiktok);
    setEditWebsite(parsed.website);
    setEditRubroGeneral(parsed.rubro_general || "");
    setEditRubroEspecifico(parsed.rubro_especifico || "");
    setEditHasLocal(!!parsed.has_local);
    setEditLocalAddress(parsed.local_address || "");
    setEditLocalLat(parsed.local_lat !== undefined ? Number(parsed.local_lat) : -16.39889);
    setEditLocalLng(parsed.local_lng !== undefined ? Number(parsed.local_lng) : -71.53694);
    setEditBanner(parsed.banner || "");
    setEditBannerPreview(parsed.banner || "");
    setEditThemeColor(parsed.theme_color || "");
    setEditTagline(parsed.tagline || "");
    setEditInterests(parsed.interests || "");
    setEditProfileOpen(true);
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

  const parsed = parseDescription(brand.description);
  const themeColor = (parsed.theme_color && parsed.theme_color.startsWith('#')) ? parsed.theme_color : "#D4AF37";
  const bannerStyle = !parsed.banner ? { background: "var(--gold-gradient)" } : {};

  return (
    <div className="container" style={{ maxWidth: "1400px", padding: "0 1rem", paddingBottom: "3rem", position: "relative" }}>
      {/* Resplandor de Ambiente de Marca en el Fondo */}
      <div 
        style={{ 
          position: "absolute", 
          top: "-20px", 
          left: "5%", 
          right: "5%", 
          height: "520px", 
          background: `radial-gradient(ellipse at 50% 10%, ${themeColor}18 0%, rgba(255,255,255,0) 75%)`, 
          pointerEvents: "none", 
          zIndex: 0 
        }} 
      />

      {/* Botones de Navegación Superior */}
      <div style={{ marginBottom: "1.5rem", display: "flex", justifyContent: "space-between", alignItems: "center", position: "relative", zIndex: 1 }}>
        <button 
          onClick={() => router.push("/brands")} 
          className="btn-outline-gold" 
          style={{ padding: "0.5rem 1.2rem", fontSize: "0.85rem", borderRadius: "8px", border: "1.5px solid var(--gold-primary)", cursor: "pointer", transition: "var(--transition-smooth)", display: "flex", alignItems: "center", gap: "6px", background: "transparent" }}
        >
          <i className="fa-solid fa-arrow-left"></i> Volver a Marcas
        </button>
        <button 
          onClick={copyLink} 
          className="btn-outline-gold" 
          style={{ padding: "0.5rem 1.2rem", fontSize: "0.85rem", borderRadius: "8px", border: "1.5px solid var(--gold-primary)", cursor: "pointer", transition: "var(--transition-smooth)", display: "flex", alignItems: "center", gap: "6px", background: "transparent" }} 
          title="Copiar enlace de perfil"
        >
          <i className="fa-solid fa-share-nodes"></i> Compartir Perfil
        </button>
      </div>

      {/* Cabezal de Perfil Extremo a Extremo 1200x500 (Sin Cuadro Contenedor) */}
      <div style={{ position: "relative", marginBottom: "2.5rem", zIndex: 1 }}>
        <div className="profile-header-banner" style={bannerStyle}>
          {parsed.banner && (
            <img src={parsed.banner} alt={brand.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          )}
        </div>

        <div className="profile-avatar-wrapper" style={{ boxShadow: `0 10px 30px ${themeColor}25, 0 4px 12px rgba(0,0,0,0.08)` }}>
          <img src={brand.logo} alt={brand.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        </div>

        <div className="profile-body">
          <div className="profile-info-row">
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                <span style={{ fontSize: "0.8rem", color: themeColor, textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.08em", background: `${themeColor}15`, padding: "4px 12px", borderRadius: "20px", border: `1px solid ${themeColor}30` }}>
                  {brand.rubro_especifico || brand.rubro_general || brand.category}
                </span>
                <span style={{ fontSize: "0.72rem", color: themeColor, fontWeight: 700, display: "inline-flex", alignItems: "center", gap: "4px", background: `${themeColor}10`, padding: "4px 10px", borderRadius: "20px" }}>
                  <i className="fa-solid fa-store" style={{ fontSize: "0.75rem" }}></i> Marca Aourum
                </span>
              </div>
              <h2 style={{ fontSize: "1.8rem", fontWeight: 800, marginTop: "0.8rem", letterSpacing: "-0.015em" }}>{brand.name}</h2>
              {parsed.tagline && (
                <p style={{ fontSize: "1.0rem", color: "var(--text-muted)", fontStyle: "italic", marginTop: "0.4rem", marginBottom: "0.4rem" }}>
                  &ldquo;{parsed.tagline}&rdquo;
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

        {isCollaborator && (
          <button
            type="button"
            onClick={() => openCreatePostModal({ brandId: brand?.id, authorType: "brand" })}
            className="btn-gold"
            style={{ marginLeft: "auto", padding: "0.45rem 1rem", fontSize: "0.82rem", borderRadius: "8px", fontWeight: 700, display: "flex", alignItems: "center", gap: "6px" }}
          >
            <i className="fa-solid fa-pen-to-square"></i> Publicar Novedad
          </button>
        )}
      </div>

      {activeBrandTab === "muro" ? (
        <div style={{ marginTop: "1.5rem" }}>
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
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
              <h2 style={{ fontSize: "1.7rem", fontWeight: 800, letterSpacing: "-0.015em", margin: 0 }}>
                Catálogo de la Marca
              </h2>
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
          <div style={{ borderTop: "1px solid var(--border-color)", paddingTop: "3rem", marginTop: "2rem" }}>
            <h2 style={{ fontSize: "1.5rem", fontWeight: 800, marginBottom: "1.5rem" }}>
              Vitrina de Productos
            </h2>
            <div className="grid-catalog">
              {brandProducts.slice(0, visibleCount).map((prod) => (
                <BrandProductCard key={prod.id} prod={prod} />
              ))}
            </div>

            {brandProducts.length > visibleCount && (
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
      )
      )}

      {/* ── VENTANAS SUPERPUESTAS (MODALS) RENDERIZADAS A NIVEL DE RAÍZ DEL COMPONENTE ── */}
      {/* 1. Formulario de creación/edición de producto en Ventana Superpuesta (Modal) */}
      {isOwner && prodFormOpen && (
        <div className="modal-overlay" style={{ zIndex: 1200 }}>
          <div className="modal-backdrop" onClick={() => { setProdFormOpen(false); setEditingProdId(null); }}></div>
          <div className="modal-panel fade-in" style={{ maxWidth: "750px", width: "90%", padding: "2rem", background: "#FFFFFF", borderRadius: "12px", border: "1.5px solid var(--gold-primary)", maxHeight: "90vh", overflowY: "auto", position: "relative" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
              <h3 style={{ fontSize: "1.3rem", fontWeight: 800, margin: 0 }}>
                {editingProdId ? "✨ Editar Item de Catálogo" : "✨ Publicar Nuevo Item"}
              </h3>
              <button 
                onClick={() => { setProdFormOpen(false); setEditingProdId(null); }} 
                style={{ background: "rgba(0,0,0,0.04)", border: "none", fontSize: "1.2rem", cursor: "pointer", width: "32px", height: "32px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}
              >
                &times;
              </button>
            </div>
            <form onSubmit={(e) => handleProductSubmit(e, brand.id)}>
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
          <div className="modal-panel fade-in" style={{ maxWidth: "550px", width: "90%", padding: "2rem", background: "#FFFFFF", borderRadius: "12px", border: "1.5px solid var(--gold-primary)", position: "relative" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
              <h3 style={{ fontSize: "1.2rem", fontWeight: 800, margin: 0 }}>
                <i className="fa-solid fa-paper-plane" style={{ color: "var(--gold-primary)", marginRight: 8 }}></i> Postular Marca a Ferias
              </h3>
              <button 
                onClick={() => setShowFairs(false)} 
                style={{ background: "rgba(0,0,0,0.04)", border: "none", fontSize: "1.2rem", cursor: "pointer", width: "32px", height: "32px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}
              >
                &times;
              </button>
            </div>
            <form onSubmit={(e) => handleApplyToFair(e, "brand", brand.id)} className="apply-fair-form">
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
          <div className="modal-panel fade-in" style={{ maxWidth: "750px", width: "90%", padding: "2rem", background: "#FFFFFF", borderRadius: "12px", border: "1.5px solid var(--gold-primary)", maxHeight: "90vh", overflowY: "auto", position: "relative" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
              <h3 style={{ fontSize: "1.2rem", fontWeight: 800, margin: 0 }}>
                <i className="fa-solid fa-users" style={{ color: "var(--gold-primary)", marginRight: 8 }}></i> Colaboradores de la Marca
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
                {brand.collaborators && brand.collaborators.length === 0 ? (
                  <p style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>No hay colaboradores adicionales.</p>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    {brand.collaborators && brand.collaborators.map(c => {
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
          <div className="modal-panel fade-in" style={{ maxWidth: "850px", width: "95%", padding: "2rem", background: "#FFFFFF", borderRadius: "12px", border: "1.5px solid var(--gold-primary)", maxHeight: "90vh", overflowY: "auto", position: "relative" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
              <h3 style={{ fontSize: "1.20rem", fontWeight: 800, margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
                <i className="fa-solid fa-list-check" style={{ color: "var(--gold-primary)" }}></i>
                Administrar Items en Catálogo
              </h3>
              <button 
                onClick={() => { setAdminCatalogOpen(false); setAdminSearchQuery(""); }} 
                style={{ background: "rgba(0,0,0,0.04)", border: "none", fontSize: "1.2rem", cursor: "pointer", width: "32px", height: "32px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}
              >
                &times;
              </button>
            </div>
            
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
                      <td style={{ textAlign: "right" }}>
                        <button 
                          onClick={() => {
                            setEditingProdId(prod.id); 
                            setProdName(prod.name); setProdDescription(prod.description); setProdPrice(prod.price);
                            setProdPriceAourum(prod.priceAourum == null ? "" : prod.priceAourum);
                            setProdStock(prod.stock == null ? "" : prod.stock); setProdCategory(prod.category); setProdType(prod.type);
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
      )}
    </div>
  );
}
