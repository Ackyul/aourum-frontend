"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { createPortal } from "react-dom";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useApp } from "../../context/AppContext";
import { ensureFullSocialUrl, isPerfumeryBrand, isVirtualMenuBrand } from "../../utils/brandUtils";
import { parseProductPresentation, parsePerfumeInfo } from "../../components/PerfumeryShowcase";



// ── PLANTILLAS INTELIGENTES POR TIPO DE PRODUCTO ──────────────────────────────
export const PRODUCT_TYPE_TEMPLATES = [
  {
    id: "perfume",
    name: "Fragancia de Alta Perfumería",
    icon: "fa-spray-can-sparkles",
    badge: "💎 Dúo Visual",
    defaultCategory: "Alta Perfumería",
    description: "Para fragancias: frasco de referencia original, notas y pirámide olfativa."
  },
  {
    id: "gastro",
    name: "Platillo / Comida",
    icon: "fa-utensils",
    badge: "🍽️ Menú & Carta",
    defaultCategory: "Platos & Especialidades",
    description: "Para platillos, salchipapas, alitas, pizzas, hamburguesas y porciones."
  },
  {
    id: "drink",
    name: "Bebida / Refresco",
    icon: "fa-glass-water",
    badge: "🥤 Carta de Bebidas",
    defaultCategory: "Bebidas & Refrescos",
    description: "Para refrescos, gaseosas, jugos, cervezas, coctelería o café."
  },
  {
    id: "standard",
    name: "Producto / Moda / Arte",
    icon: "fa-bag-shopping",
    badge: "🛍️ Tienda General",
    defaultCategory: "Moda y Accesorios",
    description: "Para moda, joyería, artesanías o productos generales con control de stock."
  },
  {
    id: "service",
    name: "Servicio / Experiencia",
    icon: "fa-hand-sparkles",
    badge: "🛠️ Servicios & Experiencias",
    defaultCategory: "Servicios",
    description: "Para sesiones, citas, clases, catering, música o reservas (stock ilimitado)."
  }
];

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export default function DashboardClient({ initialTab }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const {
    activePersonId,
    people,
    brands,
    organizers,
    bands,
    products,
    loading,
    authHeaders,
    triggerNotification,
    fetchData,
    handleProductSubmit,
    handleDeleteProduct,
    uploadImage,
    logout,
    changePassword,
    changeEmail,
    parseDescription,
    setShowRegModal,
    setRegType
  } = useApp();

  // Tab activo sincronizado con query param o initialTab o "resumen" por defecto
  const tabParam = initialTab || searchParams.get("tab") || "resumen";
  const brandIdParam = searchParams.get("brandId");

  const [activeTab, setActiveTab] = useState(tabParam);
  const [selectedBrandId, setSelectedBrandId] = useState(null);

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  // Acordeones para no agobiar al usuario con demasiadas opciones
  const [isEssentialBrandOpen, setIsEssentialBrandOpen] = useState(false);
  const [isAdvancedBrandOpen, setIsAdvancedBrandOpen] = useState(false);
  const [isAdvancedProdOpen, setIsAdvancedProdOpen] = useState(false);

  // Estados del Formulario de Marca
  const [savingBrand, setSavingBrand] = useState(false);
  const [uploadingBrandLogo, setUploadingBrandLogo] = useState(false);
  const [uploadingBrandBanner, setUploadingBrandBanner] = useState(false);
  const [brandForm, setBrandForm] = useState({
    name: "",
    category: "",
    whatsappNumber: "",
    city: "",
    tagline: "",
    logo: "",
    slug: "",
    owner: "",
    descriptionText: "",
    interests: "",
    // Colores
    c1: "#D4AF37",
    c2: "#F3E5AB",
    c3: "#EAB308",
    c4: "#FAF9F0",
    // Diseño visual
    customBgColor: "#FAF9F0",
    bgStyle: "solid",
    bgImage: "",
    bgImageFit: "cover",
    banner: "",
    bannerOverlay: "none",
    cardStyle: "luxury",
    cardBgColor: "page_bg",
    cardBorderColor: "auto",
    cardTextColor: "auto",
    fontFamily: "Cinzel",
    catalogDisplayMode: "auto",
    glowIntensity: 80,
    animations: true,
    logoShape: "rounded",
    // Local físico
    hasLocal: false,
    localAddress: "",
    localLat: -16.39889,
    localLng: -71.53694,
    // Redes
    instagram: "",
    facebook: "",
    tiktok: "",
    website: ""
  });

  // Estados del Gestor de Productos
  const [prodSearch, setProdSearch] = useState("");
  const [prodCatFilter, setProdCatFilter] = useState("all");
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProductId, setEditingProductId] = useState(null);
  const [productType, setProductType] = useState("perfume");
  const [submittingProd, setSubmittingProd] = useState(false);
  const [uploadingProdImg, setUploadingProdImg] = useState(false);
  const [uploadingOrigImg, setUploadingOrigImg] = useState(false);

  // Campos de Producto
  const [prodForm, setProdForm] = useState({
    name: "",
    price: "",
    priceAourum: "",
    stock: "10",
    category: "Alta Perfumería",
    image: "",
    imgBgColor: "transparent",
    isVisible: true,
    presentation: "",
    // Perfume
    perfumeInspiration: "",
    perfumeOriginalImg: "",
    perfumeGender: "Unisex",
    perfumeFamily: "Amaderado",
    perfumeConcentration: "",
    perfumeMl: "50 ml",
    perfumeNotes: "",
    // Gastro
    gastroPortion: "",
    gastroIngredients: "",
    // General
    description: ""
  });

  // Estados del Perfil Personal & Preferencias
  const [savingProfile, setSavingProfile] = useState(false);
  const [uploadingProfileLogo, setUploadingProfileLogo] = useState(false);
  const [uploadingProfileBanner, setUploadingProfileBanner] = useState(false);
  const [uploadingProfileBg, setUploadingProfileBg] = useState(false);
  const [profileForm, setProfileForm] = useState({
    name: "",
    lastName: "",
    username: "",
    occupation: "",
    city: "",
    bio: "",
    tagline: "",
    logo: "",
    banner: "",
    themeColor: "#D4AF37",
    customBgColor: "#FAF9F0",
    bgStyle: "solid",
    bgImage: "",
    interests: "",
    instagram: "",
    facebook: "",
    tiktok: "",
    website: ""
  });

  // Estados de Seguridad
  const [securityPassword, setSecurityPassword] = useState({ current: "", newPass: "", confirm: "" });
  const [securityEmail, setSecurityEmail] = useState({ newEmail: "", passwordConfirm: "" });
  const [securityLoading, setSecurityLoading] = useState(false);

  // Cargar datos al montar el Centro de Control
  useEffect(() => {
    if (fetchData) {
      fetchData();
    }
  }, [fetchData]);

  // Usuario actual
  const currentPerson = useMemo(() => {
    if (!activePersonId || !people) return null;
    return people.find(p => p.id === Number(activePersonId)) || null;
  }, [activePersonId, people]);

  // Marcas del usuario (como creador original, colaborador o dueño directo)
  const myBrands = useMemo(() => {
    if (!brands || brands.length === 0 || !currentPerson) return [];
    const pId = Number(currentPerson.id);
    const pBrandIds = (currentPerson.brandIds || []).map(Number);
    const userBrands = brands.filter(b => {
      const isOwner = Number(b.personId) === pId || pBrandIds.includes(Number(b.id));
      const isCollab = Array.isArray(b.personIds) && b.personIds.map(Number).includes(pId);
      const isNamed = b.owner && currentPerson.name && (b.owner.toLowerCase().trim() === currentPerson.name.toLowerCase().trim());
      return isOwner || isCollab || isNamed;
    });
    return userBrands;
  }, [currentPerson, brands]);

  // Productoras del usuario
  const myOrganizers = useMemo(() => {
    if (!organizers || organizers.length === 0 || !currentPerson) return [];
    const pOrgIds = (currentPerson.organizerIds || []).map(Number);
    return organizers.filter(o => {
      const isLinked = pOrgIds.includes(Number(o.id));
      const rObj = (currentPerson.organizerRoles || []).find(r => r.organizerId === o.id);
      const isCreator = rObj && rObj.role === 'creador_original';
      return isLinked || isCreator;
    });
  }, [currentPerson, organizers]);

  // Bandas del usuario
  const myBands = useMemo(() => {
    if (!bands || bands.length === 0 || !currentPerson) return [];
    const pBandIds = (currentPerson.bandIds || []).map(Number);
    return bands.filter(b => pBandIds.includes(Number(b.id)));
  }, [currentPerson, bands]);

  // Inicializar selección de marca
  useEffect(() => {
    if (myBrands.length > 0 && (!selectedBrandId || !myBrands.some(b => b.id === Number(selectedBrandId)))) {
      const matched = brandIdParam ? myBrands.find(b => b.id === Number(brandIdParam)) : null;
      setSelectedBrandId(matched ? matched.id : myBrands[0].id);
    }
  }, [myBrands, selectedBrandId, brandIdParam]);

  // Cargar datos de la marca seleccionada en el formulario
  useEffect(() => {
    if (!selectedBrandId || !brands) return;
    const b = brands.find(x => x.id === Number(selectedBrandId));
    if (!b) return;

    const parsed = parseDescription ? parseDescription(b.description) : {};
    const bDesign = (b.brandDesign && Object.keys(b.brandDesign).length > 0) ? b.brandDesign : (parsed.brandDesign || {});
    const colors = (b.themeColor || parsed.theme_color || "#D4AF37").split(",").map(c => c.trim());
    // Detección y filtrado de colores huérfanos/legacy (#996515 / #8B5CF6)
    const isLegacyC3 = (colors[2] === "#996515" || colors[2] === "#996515".toLowerCase()) && colors[0] !== "#D4AF37";
    const isLegacyC4 = (colors[3] === "#8B5CF6" || colors[3] === "#8B5CF6".toLowerCase()) && colors[0] !== "#D4AF37";

    setBrandForm({
      name: b.name || "",
      category: b.category || parsed.rubro_especifico || "",
      whatsappNumber: b.whatsappNumber || "",
      city: b.city || "",
      tagline: parsed.tagline || "",
      logo: b.logo || "",
      slug: b.slug || "",
      owner: b.owner || "",
      descriptionText: parsed.text || "",
      interests: parsed.interests || "",
      c1: colors[0] || "#D4AF37",
      c2: colors[1] || colors[0] || "#F3E5AB",
      c3: (!isLegacyC3 && colors[2]) ? colors[2] : (colors[1] || colors[0] || "#EAB308"),
      c4: (!isLegacyC4 && colors[3]) ? colors[3] : (bDesign.customBgColor || colors[0] || "#FAF9F0"),
      customBgColor: bDesign.customBgColor || parsed.customBgColor || "#FAF9F0",
      bgStyle: bDesign.bgStyle || parsed.bgStyle || "solid",
      bgImage: bDesign.bgImage || parsed.bgImage || "",
      bgImageFit: bDesign.bgImageFit || "cover",
      banner: parsed.banner || "",
      bannerOverlay: bDesign.bannerOverlay || "none",
      cardStyle: bDesign.cardStyle || "luxury",
      cardBgColor: bDesign.cardBgColor || "page_bg",
      cardBorderColor: bDesign.cardBorderColor || "auto",
      cardTextColor: bDesign.cardTextColor || "auto",
      fontFamily: bDesign.fontFamily || "Cinzel",
      catalogDisplayMode: b.catalogDisplayMode || bDesign.catalogDisplayMode || "auto",
      glowIntensity: bDesign.glowIntensity !== undefined ? bDesign.glowIntensity : 80,
      animations: bDesign.animations !== false,
      logoShape: bDesign.logoShape || "rounded",
      hasLocal: !!parsed.has_local,
      localAddress: parsed.local_address || "",
      localLat: parsed.local_lat !== undefined ? parsed.local_lat : -16.39889,
      localLng: parsed.local_lng !== undefined ? parsed.local_lng : -71.53694,
      instagram: ensureFullSocialUrl(parsed.instagram, "instagram"),
      facebook: ensureFullSocialUrl(parsed.facebook, "facebook"),
      tiktok: ensureFullSocialUrl(parsed.tiktok, "tiktok"),
      website: ensureFullSocialUrl(parsed.website, "website")
    });
  }, [selectedBrandId, brands, parseDescription]);

  // Cargar datos del perfil de usuario y preferencias
  useEffect(() => {
    if (!currentPerson) return;
    const parsed = parseDescription ? parseDescription(currentPerson.description) : {};
    const pDesign = (currentPerson.brandDesign && Object.keys(currentPerson.brandDesign).length > 0)
      ? currentPerson.brandDesign
      : (parsed.brandDesign || {});
    const primaryTheme = (parsed.theme_color || "").split(",")[0]?.trim() || "#D4AF37";

    setProfileForm({
      name: currentPerson.name || "",
      lastName: currentPerson.lastName || "",
      username: currentPerson.username || "",
      occupation: currentPerson.occupation || "",
      city: currentPerson.city || "",
      bio: parsed.text || "",
      tagline: parsed.tagline || "",
      logo: currentPerson.logo || "",
      banner: parsed.banner || "",
      themeColor: (primaryTheme && primaryTheme.startsWith("#")) ? primaryTheme : "#D4AF37",
      customBgColor: pDesign.customBgColor || parsed.customBgColor || "#FAF9F0",
      bgStyle: pDesign.bgStyle || parsed.bgStyle || "solid",
      bgImage: pDesign.bgImage || parsed.bgImage || "",
      interests: currentPerson.interests || parsed.interests || "",
      instagram: ensureFullSocialUrl(parsed.instagram, "instagram"),
      facebook: ensureFullSocialUrl(parsed.facebook, "facebook"),
      tiktok: ensureFullSocialUrl(parsed.tiktok, "tiktok"),
      website: ensureFullSocialUrl(parsed.website, "website")
    });
  }, [currentPerson, parseDescription]);

  // Sincronizar tab con URL
  const handleTabChange = (newTab) => {
    setActiveTab(newTab);
    const params = new URLSearchParams(window.location.search);
    params.set("tab", newTab);
    if (selectedBrandId) params.set("brandId", selectedBrandId);
    router.replace(`/dashboard?${params.toString()}`, { scroll: false });
  };

  // ── GUARDAR MARCA ───────────────────────────────────────────────────────────
  const handleSaveBrand = async (e) => {
    if (e) e.preventDefault();
    if (!selectedBrandId) {
      triggerNotification(false, "No hay ninguna marca seleccionada.");
      return;
    }
    if (!brandForm.name.trim()) {
      triggerNotification(false, "El nombre de la marca es obligatorio.");
      return;
    }

    setSavingBrand(true);
    const themeColorStr = `${brandForm.c1}, ${brandForm.c2}, ${brandForm.c3}, ${brandForm.c4}`;

    const brandDesignObj = {
      customBgColor: brandForm.customBgColor,
      bgStyle: brandForm.bgStyle,
      bgImage: brandForm.bgImage,
      bgImageFit: brandForm.bgImageFit,
      cardStyle: brandForm.cardStyle,
      cardBgColor: brandForm.cardBgColor,
      cardBorderColor: brandForm.cardBorderColor,
      cardTextColor: brandForm.cardTextColor,
      fontFamily: brandForm.fontFamily,
      catalogDisplayMode: brandForm.catalogDisplayMode,
      glowIntensity: Number(brandForm.glowIntensity),
      animations: brandForm.animations,
      bannerOverlay: brandForm.bannerOverlay,
      logoShape: brandForm.logoShape
    };

    const descriptionPayload = JSON.stringify({
      text: brandForm.descriptionText,
      instagram: brandForm.instagram,
      facebook: brandForm.facebook,
      tiktok: brandForm.tiktok,
      website: brandForm.website,
      rubro_general: brandForm.category,
      rubro_especifico: brandForm.category,
      has_local: brandForm.hasLocal,
      local_address: brandForm.localAddress,
      local_lat: Number(brandForm.localLat),
      local_lng: Number(brandForm.localLng),
      banner: brandForm.banner,
      theme_color: themeColorStr,
      tagline: brandForm.tagline,
      interests: brandForm.interests,
      customBgColor: brandForm.customBgColor,
      bgStyle: brandForm.bgStyle,
      bgImage: brandForm.bgImage,
      cardBgColor: brandForm.cardBgColor,
      cardBorderColor: brandForm.cardBorderColor,
      cardTextColor: brandForm.cardTextColor,
      brandDesign: brandDesignObj
    });

    const payload = {
      name: brandForm.name.trim(),
      owner: brandForm.owner || currentPerson?.name || "Dueño",
      category: brandForm.category || "General",
      description: descriptionPayload,
      logo: brandForm.logo,
      slug: brandForm.slug || undefined,
      whatsappNumber: brandForm.whatsappNumber || null,
      themeColor: themeColorStr,
      catalogDisplayMode: brandForm.catalogDisplayMode,
      brandDesign: brandDesignObj,
      city: brandForm.city
    };

    try {
      const res = await fetch(`${API_URL}/api/brands/${selectedBrandId}`, {
        method: "PUT",
        headers: authHeaders(),
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        triggerNotification(true, "✨ ¡Estilo y ajustes de marca guardados exitosamente!");
        fetchData();
      } else {
        const err = await res.json().catch(() => ({}));
        triggerNotification(false, err.error || "No se pudo guardar la configuración de la marca.");
      }
    } catch (error) {
      triggerNotification(false, "Error de red al guardar la marca.");
    } finally {
      setSavingBrand(false);
    }
  };

  // ── MARCA SELECCIONADA Y RUBRO / TIPO DE CATÁLOGO ────────────────────────
  const selectedBrand = useMemo(() => {
    return myBrands.find(b => b.id === Number(selectedBrandId)) || null;
  }, [myBrands, selectedBrandId]);

  // Modo de catálogo resuelto considerando la configuración manual y detección automática
  const activeCatalogMode = useMemo(() => {
    if (!selectedBrand) return "grid";
    let mode = (brandForm && brandForm.catalogDisplayMode) 
      ? brandForm.catalogDisplayMode 
      : (selectedBrand.catalogDisplayMode || selectedBrand.brandDesign?.catalogDisplayMode);
    
    if (!mode || mode === "auto") {
      let parsedDesc = {};
      if (typeof selectedBrand.description === "string" && selectedBrand.description.trim().startsWith("{")) {
        try { parsedDesc = JSON.parse(selectedBrand.description); } catch(e) {}
      }
      mode = parsedDesc.catalogDisplayMode || parsedDesc.brandDesign?.catalogDisplayMode || "auto";
    }

    if (mode === "perfumery" || mode === "perfume") return "perfumery";
    if (mode === "menu") return "menu";
    if (mode === "grid") return "grid";

    // Detección automática por categoría/rubro
    if (isPerfumeryBrand(selectedBrand)) return "perfumery";
    if (isVirtualMenuBrand(selectedBrand)) return "menu";
    return "grid";
  }, [selectedBrand, brandForm?.catalogDisplayMode]);

  const isBrandPerfume = activeCatalogMode === "perfumery";
  const isBrandMenu = activeCatalogMode === "menu";
  const isBrandStandard = activeCatalogMode === "grid";

  // Plantillas visibles adaptadas estrictamente al modo de catálogo de la marca
  const visibleTemplates = useMemo(() => {
    // 1. Alta Perfumería: La única opción de añadir es la de perfumes
    if (isBrandPerfume) {
      return [
        PRODUCT_TYPE_TEMPLATES.find(t => t.id === "perfume")
      ].filter(Boolean);
    }
    // 2. Menú Gastronómico: Platillo/Comida, Bebida y Experiencia/Servicio
    if (isBrandMenu) {
      return [
        PRODUCT_TYPE_TEMPLATES.find(t => t.id === "gastro"),
        PRODUCT_TYPE_TEMPLATES.find(t => t.id === "drink"),
        PRODUCT_TYPE_TEMPLATES.find(t => t.id === "service")
      ].filter(Boolean);
    }
    // 3. Cuadrícula Estándar: Solo 2 cuadros (Producto y Experiencia)
    return [
      PRODUCT_TYPE_TEMPLATES.find(t => t.id === "standard"),
      PRODUCT_TYPE_TEMPLATES.find(t => t.id === "service")
    ].filter(Boolean);
  }, [isBrandPerfume, isBrandMenu]);

  // Sugerencias inteligentes de categoría según el modo de catálogo y tipo de producto
  const categorySuggestions = useMemo(() => {
    if (isBrandMenu) {
      if (productType === "drink") {
        return ["Bebidas & Refrescos", "Gaseosas", "Jugos Naturales", "Cervezas", "Cafetería", "Tragos & Cócteles"];
      }
      if (productType === "service") {
        return ["Servicios", "Catering & Eventos", "Reservas Especiales"];
      }
      return ["Salchipapas", "Alitas", "Hamburguesas", "Pizzas", "Sánguches & Wraps", "Piqueos & Entradas", "Combos & Promociones", "Postres"];
    }

    if (isBrandPerfume) {
      return ["Alta Perfumería", "Amaderado", "Cítrico / Fresco", "Oriental / Especiado", "Floral", "Gourmand", "Aromático Fougère"];
    }

    // Modo Estándar
    if (productType === "service") {
      return ["Servicios", "Experiencias", "Cursos & Clases", "Consultorías"];
    }
    const brandCat = selectedBrand?.category;
    const base = ["Moda & Ropa", "Joyería & Accesorios", "Artesanía Local", "Arte & Decoración", "Calzado", "Bienestar & Cuidado"];
    if (brandCat && !base.includes(brandCat)) {
      return [brandCat, ...base];
    }
    return base;
  }, [isBrandMenu, isBrandPerfume, productType, selectedBrand]);

  // ── PRODUCTOS DE LA MARCA SELECCIONADA ─────────────────────────────────────
  const currentBrandProducts = useMemo(() => {
    if (!selectedBrandId || !products) return [];
    return products.filter(p => p.brandId === Number(selectedBrandId) || p.brand_id === Number(selectedBrandId));
  }, [selectedBrandId, products]);

  const filteredProducts = useMemo(() => {
    return currentBrandProducts.filter(p => {
      const matchSearch = !prodSearch.trim() || 
        p.name.toLowerCase().includes(prodSearch.toLowerCase()) || 
        (p.category && p.category.toLowerCase().includes(prodSearch.toLowerCase())) ||
        (p.description && p.description.toLowerCase().includes(prodSearch.toLowerCase()));
      
      const matchCat = prodCatFilter === "all" || p.category === prodCatFilter;
      return matchSearch && matchCat;
    });
  }, [currentBrandProducts, prodSearch, prodCatFilter]);

  // Categorías únicas de productos para filtro
  const brandCategories = useMemo(() => {
    const cats = new Set(currentBrandProducts.map(p => p.category).filter(Boolean));
    return Array.from(cats);
  }, [currentBrandProducts]);

  // Abrir modal de nuevo producto con plantilla adaptativa según el rubro
  const handleOpenAddProduct = (type) => {
    let defaultType = type;
    if (!defaultType) {
      if (isBrandPerfume) defaultType = "perfume";
      else if (isBrandMenu) defaultType = "gastro";
      else defaultType = "standard";
    }
    // Forzar coherencia según el modo del catálogo
    if (isBrandPerfume) defaultType = "perfume";
    if (isBrandStandard && defaultType !== "service") defaultType = "standard";

    setProductType(defaultType);
    setEditingProductId(null);
    const tmpl = PRODUCT_TYPE_TEMPLATES.find(t => t.id === defaultType) || PRODUCT_TYPE_TEMPLATES[0];
    
    setProdForm({
      name: "",
      price: "",
      priceAourum: "",
      stock: defaultType === "service" ? "99999" : "15",
      category: (isBrandStandard && selectedBrand?.category) ? selectedBrand.category : tmpl.defaultCategory,
      image: "",
      imgBgColor: "transparent",
      isVisible: true,
      presentation: "",
      perfumeInspiration: "",
      perfumeOriginalImg: "",
      perfumeGender: "Unisex",
      perfumeFamily: "Amaderado",
      perfumeConcentration: "",
      perfumeMl: "50 ml",
      perfumeNotes: "",
      gastroPortion: "",
      gastroIngredients: "",
      description: ""
    });
    setShowProductModal(true);
  };

  // Abrir modal para editar producto existente
  const handleEditProduct = (prod) => {
    setEditingProductId(prod.id);
    let desc = prod.description || "";
    
    // Parsear perfume tags si existen
    const origImgMatch = desc.match(/\[\s*(?:originalimg|originalimage|frascooriginal)\s*:\s*([^\]]+)\]/i);
    const inspMatch = desc.match(/\[\s*(?:inspiraci[oó]n|inspirado en|original|ref)\s*:\s*([^\]]+)\]/i);
    const genderMatch = desc.match(/\[\s*g[eé]nero\s*:\s*([^\]]+)\]/i);
    const concMatch = desc.match(/\[\s*concentraci[oó]n\s*:\s*([^\]]+)\]/i);
    const mlMatch = desc.match(/\[\s*ml\s*:\s*([^\]]+)\]/i);
    const presMatch = desc.match(/\[\s*(?:presentaci[oó]n|tama[ñn]o|cantidad|gramaje)\s*:\s*([^\]]+)\]/i);
    const portionMatch = desc.match(/\[\s*(?:porci[oó]n|tama[ñn]o)\s*:\s*([^\]]+)\]/i);
    const ingredientsMatch = desc.match(/\[\s*ingredientes\s*:\s*([^\]]+)\]/i);

    const parsedPres = parseProductPresentation(prod);
    const resolvedPres = presMatch ? presMatch[1].trim() : (parsedPres.presentation || (mlMatch ? mlMatch[1].trim() : (portionMatch ? portionMatch[1].trim() : "")));

    const catLower = (prod.category || "").toLowerCase();
    const isDrink = /bebida|refresco|gaseosa|jugo|cerveza|trago|caf[eé]|cocktail|vino/i.test(catLower);

    let resolvedType = "standard";
    if (isBrandPerfume) {
      resolvedType = "perfume";
    } else if (isBrandMenu) {
      if (prod.type === "service") resolvedType = "service";
      else if (isDrink) resolvedType = "drink";
      else resolvedType = "gastro";
    } else {
      resolvedType = prod.type === "service" ? "service" : "standard";
    }
    
    setProductType(resolvedType);
    
    // Remover corchetes del texto de notas
    const cleanNotes = desc.replace(/\[[^\]]+\]/g, "").trim();

    setProdForm({
      name: prod.name || "",
      price: prod.price || "",
      priceAourum: prod.priceAourum || prod.price_aourum || "",
      stock: prod.stock !== null ? String(prod.stock) : "",
      category: prod.category || (isBrandPerfume ? "Alta Perfumería" : isBrandStandard ? (selectedBrand?.category || "General") : "Platos & Especialidades"),
      image: prod.image || "",
      imgBgColor: prod.imgBgColor || "transparent",
      isVisible: prod.isVisible !== false,
      presentation: resolvedPres,
      perfumeInspiration: inspMatch ? inspMatch[1].trim() : "",
      perfumeOriginalImg: origImgMatch ? origImgMatch[1].trim() : "",
      perfumeGender: genderMatch ? genderMatch[1].trim() : "Unisex",
      perfumeFamily: prod.category || "Amaderado",
      perfumeConcentration: (concMatch && !/50%\s*esencia/i.test(concMatch[1])) ? concMatch[1].trim() : "",
      perfumeMl: mlMatch ? mlMatch[1].trim() : (resolvedPres || "50 ml"),
      perfumeNotes: cleanNotes,
      gastroPortion: portionMatch ? portionMatch[1].trim() : resolvedPres,
      gastroIngredients: ingredientsMatch ? ingredientsMatch[1].trim() : "",
      description: cleanNotes
    });
    setShowProductModal(true);
  };

  // Duplicar producto para crear otro tamaño / presentación con la misma foto e info
  const handleDuplicateProductForNewSize = (prod) => {
    setEditingProductId(null); // Producto nuevo
    let desc = prod.description || "";
    
    const origImgMatch = desc.match(/\[\s*(?:originalimg|originalimage|frascooriginal)\s*:\s*([^\]]+)\]/i);
    const inspMatch = desc.match(/\[\s*(?:inspiraci[oó]n|inspirado en|original|ref)\s*:\s*([^\]]+)\]/i);
    const genderMatch = desc.match(/\[\s*g[eé]nero\s*:\s*([^\]]+)\]/i);
    const concMatch = desc.match(/\[\s*concentraci[oó]n\s*:\s*([^\]]+)\]/i);
    const mlMatch = desc.match(/\[\s*ml\s*:\s*([^\]]+)\]/i);
    const portionMatch = desc.match(/\[\s*(?:porci[oó]n|tama[ñn]o)\s*:\s*([^\]]+)\]/i);
    const ingredientsMatch = desc.match(/\[\s*ingredientes\s*:\s*([^\]]+)\]/i);

    const parsedPres = parseProductPresentation(prod);
    const cleanNotes = desc.replace(/\[[^\]]+\]/g, "").trim();

    const catLower = (prod.category || "").toLowerCase();
    const isDrink = /bebida|refresco|gaseosa|jugo|cerveza|trago|caf[eé]|cocktail|vino/i.test(catLower);

    let resolvedType = "standard";
    if (isBrandPerfume) {
      resolvedType = "perfume";
    } else if (isBrandMenu) {
      if (prod.type === "service") resolvedType = "service";
      else if (isDrink) resolvedType = "drink";
      else resolvedType = "gastro";
    } else {
      resolvedType = prod.type === "service" ? "service" : "standard";
    }
    
    setProductType(resolvedType);

    // Sugerir siguiente tamaño si es perfume
    let nextMl = "100 ml";
    if (mlMatch) {
      if (mlMatch[1].includes("30")) nextMl = "50 ml";
      else if (mlMatch[1].includes("50")) nextMl = "100 ml";
      else if (mlMatch[1].includes("100")) nextMl = "30 ml";
    }

    setProdForm({
      name: parsedPres.cleanName || prod.name || "",
      price: "", // Limpio para que ingrese el precio del nuevo tamaño
      priceAourum: "",
      stock: prod.stock !== null ? String(prod.stock) : "15",
      category: prod.category || (isBrandPerfume ? "Alta Perfumería" : isBrandStandard ? (selectedBrand?.category || "General") : "Platos & Especialidades"),
      image: prod.image || "", // Conserva la misma foto
      imgBgColor: prod.imgBgColor || "transparent",
      isVisible: true,
      presentation: "", // Listo para elegir el nuevo tamaño/gramaje
      perfumeInspiration: inspMatch ? inspMatch[1].trim() : "",
      perfumeOriginalImg: origImgMatch ? origImgMatch[1].trim() : "",
      perfumeGender: genderMatch ? genderMatch[1].trim() : "Unisex",
      perfumeFamily: prod.category || "Amaderado",
      perfumeConcentration: (concMatch && !/50%\s*esencia/i.test(concMatch[1])) ? concMatch[1].trim() : "",
      perfumeMl: nextMl,
      perfumeNotes: cleanNotes,
      gastroPortion: portionMatch ? portionMatch[1].trim() : "",
      gastroIngredients: ingredientsMatch ? ingredientsMatch[1].trim() : "",
      description: cleanNotes
    });
    triggerNotification(true, `Nueva presentación para "${parsedPres.cleanName || prod.name}". Elige el tamaño, sube su foto y define su precio.`);
    setShowProductModal(true);
  };

  // Guardar Producto
  const handleSaveProductSubmit = async (e) => {
    e.preventDefault();
    if (!prodForm.name.trim() || !prodForm.price) {
      triggerNotification(false, "Completa el nombre y el precio del ítem.");
      return;
    }

    setSubmittingProd(true);
    let finalDesc = prodForm.description.trim();

    if (productType === "perfume") {
      const tags = [];
      if (prodForm.perfumeInspiration.trim()) tags.push(`[Inspiración: ${prodForm.perfumeInspiration.trim()}]`);
      if (prodForm.perfumeOriginalImg.trim()) tags.push(`[OriginalImg: ${prodForm.perfumeOriginalImg.trim()}]`);
      if (prodForm.perfumeGender) tags.push(`[Género: ${prodForm.perfumeGender}]`);
      if (prodForm.category || prodForm.perfumeFamily) tags.push(`[Familia: ${prodForm.category || prodForm.perfumeFamily}]`);
      if (prodForm.perfumeConcentration) tags.push(`[Concentración: ${prodForm.perfumeConcentration}]`);
      if (prodForm.perfumeMl) tags.push(`[ML: ${prodForm.perfumeMl}]`);
      if (prodForm.presentation.trim() && prodForm.presentation.trim() !== prodForm.perfumeMl) {
        tags.push(`[Presentación: ${prodForm.presentation.trim()}]`);
      }
      finalDesc = `${tags.join(' ')}\n\n${prodForm.perfumeNotes.trim()}`.trim();
    } else if (productType === "gastro" || productType === "drink") {
      const tags = [];
      if (prodForm.presentation.trim() || prodForm.gastroPortion.trim()) {
        tags.push(`[Porción: ${(prodForm.presentation || prodForm.gastroPortion).trim()}]`);
      }
      if (prodForm.gastroIngredients.trim()) tags.push(`[Ingredientes: ${prodForm.gastroIngredients.trim()}]`);
      finalDesc = `${tags.join(' ')}\n\n${prodForm.description.trim()}`.trim();
    } else {
      const tags = [];
      if (prodForm.presentation.trim()) {
        tags.push(`[Presentación: ${prodForm.presentation.trim()}]`);
      }
      finalDesc = tags.length > 0 ? `${tags.join(' ')}\n\n${prodForm.description.trim()}`.trim() : prodForm.description.trim();
    }

    const payload = {
      id: editingProductId,
      brandId: Number(selectedBrandId),
      name: prodForm.name.trim(),
      category: prodForm.category.trim() || (productType === "perfume" ? "Alta Perfumería" : productType === "drink" ? "Bebidas & Refrescos" : productType === "gastro" ? "Platos & Especialidades" : "General"),
      type: productType === "service" ? "service" : "product",
      stock: productType === "service" ? 99999 : (prodForm.stock === "" ? null : Number(prodForm.stock)),
      price: Number(prodForm.price),
      priceAourum: prodForm.priceAourum ? Number(prodForm.priceAourum) : null,
      isVisible: prodForm.isVisible !== false,
      image: prodForm.image || null,
      imgBgColor: prodForm.imgBgColor || "transparent",
      description: finalDesc
    };

    try {
      await handleProductSubmit(payload);
      setShowProductModal(false);
      setEditingProductId(null);
    } catch (err) {
      triggerNotification(false, "Error al guardar el producto.");
    } finally {
      setSubmittingProd(false);
    }
  };

  // Alternar visibilidad de producto con 1 clic
  const handleToggleProductVisibility = async (prod) => {
    const newVis = prod.isVisible === false;
    await handleProductSubmit({
      ...prod,
      id: prod.id,
      brandId: prod.brandId || prod.brand_id,
      isVisible: newVis
    });
    triggerNotification(true, newVis ? "👁️ Producto visible en la vitrina pública" : "🚫 Producto ocultado de la vitrina");
  };

  // Guardar Perfil Personal & Preferencias Visuales
  const handleSaveProfile = async (e) => {
    if (e) e.preventDefault();
    if (!profileForm.name.trim()) {
      triggerNotification(false, "El nombre es obligatorio.");
      return;
    }

    setSavingProfile(true);
    const descPayload = JSON.stringify({
      text: profileForm.bio,
      tagline: profileForm.tagline,
      banner: profileForm.banner,
      theme_color: profileForm.themeColor,
      customBgColor: profileForm.customBgColor,
      bgStyle: profileForm.bgStyle,
      bgImage: profileForm.bgImage,
      brandDesign: {
        customBgColor: profileForm.customBgColor,
        bgStyle: profileForm.bgStyle,
        bgImage: profileForm.bgImage
      },
      instagram: profileForm.instagram,
      facebook: profileForm.facebook,
      tiktok: profileForm.tiktok,
      website: profileForm.website,
      interests: profileForm.interests
    });

    const payload = {
      name: profileForm.name.trim(),
      lastName: profileForm.lastName.trim(),
      username: profileForm.username.trim() || undefined,
      occupation: profileForm.occupation.trim(),
      city: profileForm.city.trim(),
      interests: profileForm.interests.trim(),
      logo: profileForm.logo,
      description: descPayload
    };

    try {
      const res = await fetch(`${API_URL}/api/people/${activePersonId}`, {
        method: "PUT",
        headers: authHeaders(),
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        triggerNotification(true, "✨ Tu perfil personal y preferencias han sido actualizados con éxito.");
        if (fetchData) fetchData();
      } else {
        const err = await res.json().catch(() => ({}));
        triggerNotification(false, err.error || "No se pudo actualizar el perfil.");
      }
    } catch (error) {
      triggerNotification(false, "Error de red al actualizar tu perfil.");
    } finally {
      setSavingProfile(false);
    }
  };

  // Cambiar Contraseña
  const handleChangePasswordSubmit = async (e) => {
    e.preventDefault();
    if (!securityPassword.current || !securityPassword.newPass) {
      triggerNotification(false, "Completa todos los campos de contraseña.");
      return;
    }
    if (securityPassword.newPass !== securityPassword.confirm) {
      triggerNotification(false, "La nueva contraseña y su confirmación no coinciden.");
      return;
    }
    setSecurityLoading(true);
    const res = await changePassword(securityPassword.current, securityPassword.newPass);
    setSecurityLoading(false);
    if (res.success) {
      setSecurityPassword({ current: "", newPass: "", confirm: "" });
    }
  };

  // Cambiar Email
  const handleChangeEmailSubmit = async (e) => {
    e.preventDefault();
    if (!securityEmail.newEmail || !securityEmail.passwordConfirm) {
      triggerNotification(false, "Ingresa el nuevo correo y tu contraseña actual.");
      return;
    }
    setSecurityLoading(true);
    const res = await changeEmail(securityEmail.newEmail, securityEmail.passwordConfirm);
    setSecurityLoading(false);
    if (res.success) {
      setSecurityEmail({ newEmail: "", passwordConfirm: "" });
    }
  };

  if (!mounted) {
    return (
      <div style={{ textAlign: "center", padding: "6rem 0" }}>
        <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: "2rem", color: "var(--gold-primary)" }}></i>
      </div>
    );
  }

  // Si no está autenticado, mostrar mensaje claro
  if (!loading && !activePersonId) {
    return (
      <div className="container" style={{ textAlign: "center", padding: "5rem 1rem" }}>
        <div className="glass-panel" style={{ maxWidth: "540px", margin: "0 auto", padding: "3rem 2rem", borderRadius: "24px" }}>
          <div style={{ width: "64px", height: "64px", background: "var(--gold-gradient)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1.5rem" }}>
            <i className="fa-solid fa-sliders" style={{ fontSize: "1.8rem", color: "#1C1C1E" }}></i>
          </div>
          <h2 style={{ fontSize: "1.6rem", fontWeight: 800, marginBottom: "0.8rem" }}>Panel de Usuario</h2>
          <p style={{ color: "var(--text-muted)", fontSize: "0.95rem", lineHeight: 1.6, marginBottom: "2rem" }}>
            Para personalizar tus marcas, aplicar plantillas en 1 clic y administrar tus productos o perfil, inicia sesión en tu cuenta.
          </p>
          <button 
            onClick={() => router.push("/")} 
            className="btn-gold" 
            style={{ padding: "0.75rem 2rem", borderRadius: "10px", fontSize: "0.95rem", fontWeight: 700 }}
          >
            <i className="fa-solid fa-arrow-left" style={{ marginRight: 8 }}></i> Ir a Inicio
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-wrapper">
      {/* ── BANNER HEADER CON ACCIONES DIRECTAS ──────────────────────────── */}
      <div className="dashboard-header-banner">
        <div style={{ display: "flex", alignItems: "center", gap: "1.2rem" }}>
          <img 
            src={currentPerson?.logo || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150"} 
            alt={currentPerson?.name}
            style={{ width: "64px", height: "64px", borderRadius: "50%", objectFit: "cover", border: "2px solid var(--gold-primary)", boxShadow: "0 4px 14px rgba(212,175,55,0.2)" }}
          />
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
              <h1 style={{ fontSize: "1.5rem", fontWeight: 800, margin: 0, letterSpacing: "-0.01em" }}>
                Panel de Usuario · {currentPerson?.name || "Mi Cuenta"}
              </h1>
              <span style={{ fontSize: "0.72rem", background: "rgba(212,175,55,0.15)", color: "var(--text-gold)", border: "1px solid var(--gold-primary)", padding: "2px 8px", borderRadius: "10px", fontWeight: 700 }}>
                {myBrands.length > 0 ? "✨ Emprendedor" : "👤 Creador"}
              </span>
            </div>
            <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", margin: "4px 0 0" }}>
              Modifica todo tu ecosistema en pocos minutos con atajos rápidos y gestión centralizada.
            </p>
          </div>
        </div>

        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          {selectedBrand && (
            <Link 
              href={`/brands/${selectedBrand.slug || selectedBrand.id}`}
              className="btn-outline-gold"
              target="_blank"
              style={{ padding: "0.55rem 1.1rem", borderRadius: "10px", fontSize: "0.82rem", fontWeight: 700, display: "flex", alignItems: "center", gap: "6px" }}
            >
              <i className="fa-solid fa-arrow-up-right-from-square"></i> Ver Mi Vitrina Pública
            </Link>
          )}
          <Link 
            href={`/people/${currentPerson?.username || activePersonId}`}
            className="btn-gold"
            target="_blank"
            style={{ padding: "0.55rem 1.1rem", borderRadius: "10px", fontSize: "0.82rem", fontWeight: 700, display: "flex", alignItems: "center", gap: "6px" }}
          >
            <i className="fa-solid fa-circle-user"></i> Ver Mi Perfil
          </Link>
        </div>
      </div>

      {/* ── NAVEGACIÓN POR PESTAÑAS ────────────────────────────────────────── */}
      <div className="dashboard-nav-tabs">
        <button 
          className={`dashboard-tab-btn ${activeTab === "resumen" ? "active" : ""}`}
          onClick={() => handleTabChange("resumen")}
          title="Resumen & Atajos"
        >
          <i className="fa-solid fa-bolt"></i> 
          <span className="tab-label-desktop">Resumen & Atajos</span>
          <span className="tab-label-mobile">Resumen</span>
        </button>
        <button 
          className={`dashboard-tab-btn ${activeTab === "marcas" ? "active" : ""}`}
          onClick={() => handleTabChange("marcas")}
          title={`Mis Marcas & Vitrinas (${myBrands.length})`}
        >
          <i className="fa-solid fa-store"></i> 
          <span className="tab-label-desktop">Mis Marcas & Vitrinas ({myBrands.length})</span>
          <span className="tab-label-mobile">Marcas ({myBrands.length})</span>
        </button>
        <button 
          className={`dashboard-tab-btn ${activeTab === "productos" ? "active" : ""}`}
          onClick={() => handleTabChange("productos")}
          title={`Catálogo de Productos (${currentBrandProducts.length})`}
        >
          <i className="fa-solid fa-bag-shopping"></i> 
          <span className="tab-label-desktop">Catálogo de Productos ({currentBrandProducts.length})</span>
          <span className="tab-label-mobile">Productos ({currentBrandProducts.length})</span>
        </button>
        <button 
          className={`dashboard-tab-btn ${activeTab === "perfil" ? "active" : ""}`}
          onClick={() => handleTabChange("perfil")}
          title="Mi Perfil & Preferencias"
        >
          <i className="fa-solid fa-id-card-clip"></i> 
          <span className="tab-label-desktop">Mi Perfil & Preferencias</span>
          <span className="tab-label-mobile">Mi Perfil</span>
        </button>
        <button 
          className={`dashboard-tab-btn ${activeTab === "seguridad" ? "active" : ""}`}
          onClick={() => handleTabChange("seguridad")}
          title="Seguridad & Cuenta"
        >
          <i className="fa-solid fa-shield-halved"></i> 
          <span className="tab-label-desktop">Seguridad & Cuenta</span>
          <span className="tab-label-mobile">Seguridad</span>
        </button>
      </div>

      {/* ═════════════════════════════════════════════════════════════════════
          TAB 1: RESUMEN Y ATAJOS RÁPIDOS
          ═════════════════════════════════════════════════════════════════════ */}
      {activeTab === "resumen" && (
        <div className="fade-in">
          {/* Métricas y Diagnóstico Rápido */}
          <div className="quick-metrics-grid">
            <div className="quick-metric-card">
              <div className="quick-metric-icon" style={{ background: "rgba(212,175,55,0.12)", color: "var(--gold-primary)" }}>
                <i className="fa-solid fa-store"></i>
              </div>
              <div>
                <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700 }}>Marca Activa</span>
                <h4 style={{ fontSize: "1.1rem", fontWeight: 800, margin: "2px 0 0" }}>{selectedBrand?.name || "Sin marca"}</h4>
                <p style={{ fontSize: "0.75rem", color: "var(--text-gold)", margin: 0 }}>{selectedBrand?.category || "Configura tu categoría"}</p>
              </div>
            </div>

            <div className="quick-metric-card">
              <div className="quick-metric-icon" style={{ background: "rgba(59,130,246,0.12)", color: "#3B82F6" }}>
                <i className="fa-solid fa-boxes-stacked"></i>
              </div>
              <div>
                <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700 }}>Total de Ítems</span>
                <h4 style={{ fontSize: "1.1rem", fontWeight: 800, margin: "2px 0 0" }}>{currentBrandProducts.length} Productos</h4>
                <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", margin: 0 }}>
                  {currentBrandProducts.filter(p => p.isVisible !== false).length} activos en vitrina
                </p>
              </div>
            </div>

            <div className="quick-metric-card">
              <div className="quick-metric-icon" style={{ background: brandForm.whatsappNumber ? "rgba(34,197,94,0.12)" : "rgba(239,68,68,0.12)", color: brandForm.whatsappNumber ? "#22C55E" : "#EF4444" }}>
                <i className="fa-brands fa-whatsapp"></i>
              </div>
              <div>
                <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700 }}>Pedidos por WhatsApp</span>
                <h4 style={{ fontSize: "1.1rem", fontWeight: 800, margin: "2px 0 0" }}>
                  {brandForm.whatsappNumber ? `+51 ${brandForm.whatsappNumber}` : "No configurado"}
                </h4>
                <p style={{ fontSize: "0.75rem", color: brandForm.whatsappNumber ? "#22C55E" : "#EF4444", margin: 0 }}>
                  {brandForm.whatsappNumber ? "Botón directo conectado" : "Añade tu número para recibir ventas"}
                </p>
              </div>
            </div>
          </div>

          {/* Atajos en 1 Clic */}
          <div className="glass-panel" style={{ padding: "1.8rem", borderRadius: "20px", marginBottom: "2rem" }}>
            <h3 style={{ fontSize: "1.2rem", fontWeight: 800, marginBottom: "0.4rem" }}>
              ⚡ Acciones Rápidas (Configura todo sin perder tiempo)
            </h3>
            <p style={{ color: "var(--text-muted)", fontSize: "0.88rem", marginBottom: "1.5rem" }}>
              Elige qué deseas resolver ahora. Cada herramienta está diseñada para tardar menos de 60 segundos.
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 250px), 1fr))", gap: "14px" }}>
              <div 
                onClick={() => handleTabChange("marcas")}
                style={{ background: "var(--bg-card)", border: "1.5px solid var(--border-color)", borderRadius: "14px", padding: "1.2rem", cursor: "pointer", transition: "var(--transition-smooth)" }}
                onMouseEnter={e => e.currentTarget.style.borderColor = "var(--gold-primary)"}
                onMouseLeave={e => e.currentTarget.style.borderColor = "var(--border-color)"}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
                  <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "rgba(212,175,55,0.15)", color: "var(--gold-primary)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold" }}>
                    🎨
                  </div>
                  <h4 style={{ fontSize: "0.95rem", fontWeight: 700, margin: 0 }}>Cambiar Estilo de Marca</h4>
                </div>
                <p style={{ color: "var(--text-muted)", fontSize: "0.8rem", margin: 0, lineHeight: 1.4 }}>
                  Aplica una de nuestras 5 plantillas profesionales en 5 segundos sin tocar códigos ni paletas manuales.
                </p>
              </div>

              {isBrandPerfume ? (
                <div 
                  onClick={() => { handleTabChange("productos"); handleOpenAddProduct("perfume"); }}
                  style={{ background: "var(--bg-card)", border: "1.5px solid var(--border-color)", borderRadius: "14px", padding: "1.2rem", cursor: "pointer", transition: "var(--transition-smooth)" }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = "var(--gold-primary)"}
                  onMouseLeave={e => e.currentTarget.style.borderColor = "var(--border-color)"}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
                    <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "rgba(138,74,243,0.15)", color: "#8A4AF3", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold" }}>
                      💎
                    </div>
                    <h4 style={{ fontSize: "0.95rem", fontWeight: 700, margin: 0 }}>Publicar Fragancia / Dúo</h4>
                  </div>
                  <p style={{ color: "var(--text-muted)", fontSize: "0.8rem", margin: 0, lineHeight: 1.4 }}>
                    Añade un perfume con frasco de referencia original y notas olfativas listas para el Dúo Visual.
                  </p>
                </div>
              ) : isBrandMenu ? (
                <div 
                  onClick={() => { handleTabChange("productos"); handleOpenAddProduct("gastro"); }}
                  style={{ background: "var(--bg-card)", border: "1.5px solid var(--border-color)", borderRadius: "14px", padding: "1.2rem", cursor: "pointer", transition: "var(--transition-smooth)" }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = "var(--gold-primary)"}
                  onMouseLeave={e => e.currentTarget.style.borderColor = "var(--border-color)"}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
                    <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "rgba(234,179,8,0.15)", color: "#EAB308", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold" }}>
                      🍽️
                    </div>
                    <h4 style={{ fontSize: "0.95rem", fontWeight: 700, margin: 0 }}>Añadir al Menú & Carta</h4>
                  </div>
                  <p style={{ color: "var(--text-muted)", fontSize: "0.8rem", margin: 0, lineHeight: 1.4 }}>
                    Publica platillos, snacks o bebidas con porciones e ingredientes destacados.
                  </p>
                </div>
              ) : (
                <div 
                  onClick={() => { handleTabChange("productos"); handleOpenAddProduct("standard"); }}
                  style={{ background: "var(--bg-card)", border: "1.5px solid var(--border-color)", borderRadius: "14px", padding: "1.2rem", cursor: "pointer", transition: "var(--transition-smooth)" }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = "var(--gold-primary)"}
                  onMouseLeave={e => e.currentTarget.style.borderColor = "var(--border-color)"}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
                    <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "rgba(59,130,246,0.15)", color: "#3B82F6", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold" }}>
                      🛍️
                    </div>
                    <h4 style={{ fontSize: "0.95rem", fontWeight: 700, margin: 0 }}>Añadir Producto o Servicio</h4>
                  </div>
                  <p style={{ color: "var(--text-muted)", fontSize: "0.8rem", margin: 0, lineHeight: 1.4 }}>
                    Publica artículos, moda, creaciones o servicios disponibles para compra.
                  </p>
                </div>
              )}

              <div 
                onClick={() => handleTabChange("perfil")}
                style={{ background: "var(--bg-card)", border: "1.5px solid var(--border-color)", borderRadius: "14px", padding: "1.2rem", cursor: "pointer", transition: "var(--transition-smooth)" }}
                onMouseEnter={e => e.currentTarget.style.borderColor = "var(--gold-primary)"}
                onMouseLeave={e => e.currentTarget.style.borderColor = "var(--border-color)"}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
                  <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "rgba(34,197,94,0.15)", color: "#22C55E", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold" }}>
                    👤
                  </div>
                  <h4 style={{ fontSize: "0.95rem", fontWeight: 700, margin: 0 }}>Actualizar Mi Perfil & Preferencias</h4>
                </div>
                <p style={{ color: "var(--text-muted)", fontSize: "0.8rem", margin: 0, lineHeight: 1.4 }}>
                  Personaliza tu biografía, ciudad, avatar, portada, color temático y estilo de fondo.
                </p>
              </div>
            </div>
          </div>

          {/* Cuentas Vinculadas y Acceso Rápido a Registrar Proyectos en Resumen */}
          <div className="glass-panel" style={{ padding: "1.8rem", borderRadius: "20px", marginBottom: "2rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.2rem", flexWrap: "wrap", gap: "10px" }}>
              <div>
                <h3 style={{ fontSize: "1.15rem", fontWeight: 800, margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
                  <i className="fa-solid fa-folder-open" style={{ color: "var(--gold-primary)" }}></i> Mis Cuentas Vinculadas & Proyectos
                </h3>
                <p style={{ color: "var(--text-muted)", fontSize: "0.82rem", margin: "4px 0 0" }}>
                  Gestiona tus marcas, productoras y bandas registradas o crea una nueva entidad.
                </p>
              </div>
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                <button 
                  type="button"
                  onClick={() => { if (setRegType) setRegType("brand"); if (setShowRegModal) setShowRegModal(true); }}
                  className="btn-outline-gold"
                  style={{ padding: "0.45rem 1rem", fontSize: "0.8rem", borderRadius: "8px" }}
                >
                  <i className="fa-solid fa-plus" style={{ marginRight: 5 }}></i> Nueva Marca
                </button>
                <button 
                  type="button"
                  onClick={() => { if (setRegType) setRegType("organizer"); if (setShowRegModal) setShowRegModal(true); }}
                  className="btn-outline-gold"
                  style={{ padding: "0.45rem 1rem", fontSize: "0.8rem", borderRadius: "8px" }}
                >
                  <i className="fa-solid fa-plus" style={{ marginRight: 5 }}></i> Nueva Productora
                </button>
                <button 
                  type="button"
                  onClick={() => { if (setRegType) setRegType("band"); if (setShowRegModal) setShowRegModal(true); }}
                  className="btn-outline-gold"
                  style={{ padding: "0.45rem 1rem", fontSize: "0.8rem", borderRadius: "8px" }}
                >
                  <i className="fa-solid fa-plus" style={{ marginRight: 5 }}></i> Nueva Banda
                </button>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 250px), 1fr))", gap: "12px" }}>
              {myBrands.map(b => (
                <div key={`resumen-b-${b.id}`} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "var(--bg-card)", border: "1px solid var(--border-color)", padding: "10px 14px", borderRadius: "12px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", overflow: "hidden" }}>
                    <img src={b.logo || "https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=100"} alt={b.name} style={{ width: "36px", height: "36px", borderRadius: "8px", objectFit: "cover" }} />
                    <div style={{ overflow: "hidden" }}>
                      <strong style={{ display: "block", fontSize: "0.88rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{b.name}</strong>
                      <span style={{ fontSize: "0.7rem", color: "var(--text-muted)", textTransform: "uppercase" }}>{b.category || "Marca"}</span>
                    </div>
                  </div>
                  <button type="button" onClick={() => { setSelectedBrandId(b.id); handleTabChange("marcas"); }} className="btn-outline-gold" style={{ padding: "0.35rem 0.7rem", fontSize: "0.75rem", borderRadius: "6px" }}>
                    Gestionar
                  </button>
                </div>
              ))}
              {myOrganizers.map(o => (
                <div key={`resumen-o-${o.id}`} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "var(--bg-card)", border: "1px solid var(--border-color)", padding: "10px 14px", borderRadius: "12px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", overflow: "hidden" }}>
                    <img src={o.logo || "https://images.unsplash.com/photo-1511578314322-379afb476865?w=100"} alt={o.name} style={{ width: "36px", height: "36px", borderRadius: "8px", objectFit: "cover" }} />
                    <div style={{ overflow: "hidden" }}>
                      <strong style={{ display: "block", fontSize: "0.88rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{o.name}</strong>
                      <span style={{ fontSize: "0.7rem", color: "var(--text-muted)", textTransform: "uppercase" }}>Productora</span>
                    </div>
                  </div>
                  <Link href={`/organizers/${o.slug || o.id}`} target="_blank" className="btn-outline-gold" style={{ padding: "0.35rem 0.7rem", fontSize: "0.75rem", borderRadius: "6px" }}>
                    Ver
                  </Link>
                </div>
              ))}
              {myBands.map(b => (
                <div key={`resumen-bd-${b.id}`} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "var(--bg-card)", border: "1px solid var(--border-color)", padding: "10px 14px", borderRadius: "12px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", overflow: "hidden" }}>
                    <img src={b.image || "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=100"} alt={b.name} style={{ width: "36px", height: "36px", borderRadius: "50%", objectFit: "cover" }} />
                    <div style={{ overflow: "hidden" }}>
                      <strong style={{ display: "block", fontSize: "0.88rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{b.name}</strong>
                      <span style={{ fontSize: "0.7rem", color: "var(--text-muted)", textTransform: "uppercase" }}>{b.genre || "Banda"}</span>
                    </div>
                  </div>
                  <Link href={`/bands/${b.slug || b.id}`} target="_blank" className="btn-outline-gold" style={{ padding: "0.35rem 0.7rem", fontSize: "0.75rem", borderRadius: "6px" }}>
                    Ver
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════════════
          TAB 2: MIS MARCAS & VITRINAS (LA SOLUCIÓN A MEDIDA)
          ═════════════════════════════════════════════════════════════════════ */}
      {activeTab === "marcas" && (
        <div className="fade-in">
          {/* Selector de Marca y Enlace a Vitrina */}
          {myBrands.length > 0 && (
            <div className="dash-brand-mgmt-card">
              <div className="dash-brand-mgmt-header">
                <div className="dash-brand-mgmt-tag">
                  <span className="dash-brand-pulse-dot"></span>
                  <span>MARCA EN EDICIÓN ACTIVA</span>
                </div>
                {selectedBrand && (
                  <Link
                    href={`/brands/${selectedBrand.slug || selectedBrand.id}`}
                    target="_blank"
                    className="btn-outline-gold"
                    style={{ padding: "0.45rem 1rem", borderRadius: "10px", fontSize: "0.8rem", fontWeight: 700, display: "flex", alignItems: "center", gap: "6px" }}
                  >
                    <i className="fa-solid fa-arrow-up-right-from-square"></i> Ver Vitrina en Vivo
                  </Link>
                )}
              </div>

              <div className="dash-brand-mgmt-body">
                {/* Visualización de la Marca Activa */}
                {selectedBrand && (
                  <div className="dash-active-brand-banner">
                    <div className="dash-active-brand-avatar-wrap">
                      <img 
                        src={selectedBrand.logo || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150"} 
                        alt={selectedBrand.name} 
                        className="dash-active-brand-avatar" 
                      />
                    </div>
                    <div className="dash-active-brand-meta">
                      <div className="dash-active-brand-name-row">
                        <h3 className="dash-active-brand-name">{selectedBrand.name}</h3>
                        <span className="dash-active-brand-category">
                          <i className={isBrandPerfume ? "fa-solid fa-spray-can-sparkles" : isBrandMenu ? "fa-solid fa-utensils" : "fa-solid fa-tag"}></i>
                          {selectedBrand.category || "General"}
                        </span>
                      </div>
                      <p className="dash-active-brand-sub">
                        Estás modificando los datos, colores y diseño público de esta marca.
                      </p>
                    </div>
                  </div>
                )}

                {/* Selector / Switcher de Marcas si tiene más de 1 */}
                {myBrands.length > 1 && (
                  <div className="dash-brand-switch-section">
                    <span className="dash-brand-switch-label">
                      <i className="fa-solid fa-arrows-rotate"></i> Cambiar a otra marca:
                    </span>
                    <div className="dash-brand-pills-row">
                      {myBrands.map(b => {
                        const isActive = Number(selectedBrandId) === b.id;
                        return (
                          <button
                            key={b.id}
                            type="button"
                            onClick={() => setSelectedBrandId(b.id)}
                            className={`dash-brand-pill-btn ${isActive ? "active" : ""}`}
                            title={`Cambiar a ${b.name}`}
                          >
                            <img 
                              src={b.logo || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100"} 
                              alt={b.name} 
                              className="dash-brand-pill-img" 
                            />
                            <div className="dash-brand-pill-texts">
                              <span className="dash-brand-pill-title">{b.name}</span>
                              <span className="dash-brand-pill-cat">{b.category || "General"}</span>
                            </div>
                            {isActive ? (
                              <span className="dash-brand-pill-badge active">
                                <i className="fa-solid fa-check"></i> Activa
                              </span>
                            ) : (
                              <span className="dash-brand-pill-badge">
                                Editar
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── DATOS ESENCIALES DE LA MARCA ── */}
          <div className="dashboard-accordion" style={{ marginBottom: "1.5rem" }}>
            <div 
              className="dashboard-accordion-header"
              onClick={() => setIsEssentialBrandOpen(!isEssentialBrandOpen)}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: "rgba(212,175,55,0.15)", color: "var(--gold-primary)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <i className="fa-solid fa-bolt"></i>
                </div>
                <div>
                  <h4 style={{ fontSize: "1rem", fontWeight: 800, margin: 0 }}>
                    ⚡ Datos Esenciales de la Marca (Solo lo necesario)
                  </h4>
                  <p style={{ color: "var(--text-muted)", fontSize: "0.78rem", margin: "2px 0 0" }}>
                    Información clave que ven tus clientes para contactarte y comprar (Logo, Portada, WhatsApp, etc.).
                  </p>
                </div>
              </div>
              <i className={`fa-solid fa-chevron-${isEssentialBrandOpen ? "up" : "down"}`} style={{ color: "var(--text-muted)" }}></i>
            </div>

            {isEssentialBrandOpen && (
              <div className="dashboard-accordion-body">
                <form onSubmit={handleSaveBrand}>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 260px), 1fr))", gap: "16px" }}>
                    {/* Logo de la Marca */}
                    <div className="form-group">
                      <label style={{ fontSize: "0.82rem", fontWeight: 700, display: "block", marginBottom: "8px" }}>
                        Logotipo de la Marca
                      </label>
                      <div style={{ display: "flex", alignItems: "center", gap: "14px", background: "var(--bg-card)", border: "1px solid var(--border-color)", padding: "10px 14px", borderRadius: "12px" }}>
                        <img 
                          src={brandForm.logo || "https://res.cloudinary.com/decklnx3p/image/upload/v1781055233/aourum/tqu58byx9bhfz1pq6l4v.png"} 
                          alt="Logo"
                          style={{ width: "48px", height: "48px", borderRadius: brandForm.logoShape === "square" ? "0px" : brandForm.logoShape === "rounded" ? "12px" : "50%", objectFit: "cover", border: `2px solid ${brandForm.c1}`, flexShrink: 0 }}
                        />
                        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                          <label className="btn-gold" style={{ padding: "0.45rem 1rem", borderRadius: "8px", fontSize: "0.8rem", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "6px", width: "fit-content" }}>
                            <i className={uploadingBrandLogo ? "fa-solid fa-spinner fa-spin" : "fa-solid fa-camera"}></i>
                            {uploadingBrandLogo ? "Subiendo..." : "Subir Logotipo"}
                            <input 
                              type="file"
                              accept="image/*"
                              style={{ display: "none" }}
                              disabled={uploadingBrandLogo}
                              onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  setUploadingBrandLogo(true);
                                  const url = await uploadImage(file);
                                  setUploadingBrandLogo(false);
                                  if (url) setBrandForm(prev => ({ ...prev, logo: url }));
                                }
                              }}
                            />
                          </label>
                          <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>Sube el logo de tu marca</span>
                        </div>
                      </div>
                    </div>

                    {/* Portada / Banner de la Marca */}
                    <div className="form-group">
                      <label style={{ fontSize: "0.82rem", fontWeight: 700, display: "block", marginBottom: "8px" }}>
                        Portada de la Marca (Banner)
                      </label>
                      <div style={{ display: "flex", alignItems: "center", gap: "14px", background: "var(--bg-card)", border: "1px solid var(--border-color)", padding: "10px 14px", borderRadius: "12px" }}>
                        <div style={{ 
                          width: "68px", 
                          height: "48px", 
                          borderRadius: "8px", 
                          overflow: "hidden", 
                          background: brandForm.banner ? `url(${brandForm.banner}) center/cover no-repeat` : `linear-gradient(135deg, ${brandForm.c1}66, ${brandForm.c2}99)`, 
                          flexShrink: 0,
                          border: "1px solid var(--border-color)"
                        }} />
                        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                          <label className="btn-gold" style={{ padding: "0.45rem 1rem", borderRadius: "8px", fontSize: "0.8rem", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "6px", width: "fit-content" }}>
                            <i className={uploadingBrandBanner ? "fa-solid fa-spinner fa-spin" : "fa-solid fa-image"}></i>
                            {uploadingBrandBanner ? "Subiendo..." : "Subir Portada"}
                            <input 
                              type="file"
                              accept="image/*"
                              style={{ display: "none" }}
                              disabled={uploadingBrandBanner}
                              onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  setUploadingBrandBanner(true);
                                  const url = await uploadImage(file);
                                  setUploadingBrandBanner(false);
                                  if (url) setBrandForm(prev => ({ ...prev, banner: url }));
                                }
                              }}
                            />
                          </label>
                          <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>Imagen panorámica para tu vitrina</span>
                        </div>
                      </div>
                    </div>

                    <div className="form-group">
                      <label style={{ fontSize: "0.82rem", fontWeight: 700 }}>Nombre de la Marca *</label>
                      <input 
                        type="text"
                        className="form-control"
                        value={brandForm.name}
                        onChange={e => setBrandForm({ ...brandForm, name: e.target.value })}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label style={{ fontSize: "0.82rem", fontWeight: 700 }}>
                        <i className="fa-brands fa-whatsapp" style={{ color: "#22C55E", marginRight: 6 }}></i>
                        WhatsApp de Atención y Pedidos
                      </label>
                      <input 
                        type="text"
                        className="form-control"
                        placeholder="Ej. 973391928"
                        value={brandForm.whatsappNumber}
                        onChange={e => setBrandForm({ ...brandForm, whatsappNumber: e.target.value.replace(/\D/g, "") })}
                      />
                      <small style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>
                        Permite a los clientes pedir tus productos directamente a tu chat.
                      </small>
                    </div>

                    <div className="form-group">
                      <label style={{ fontSize: "0.82rem", fontWeight: 700 }}>Rubro o Categoría Principal *</label>
                      <select 
                        className="form-control"
                        value={brandForm.category}
                        onChange={e => setBrandForm({ ...brandForm, category: e.target.value })}
                      >
                        <option value="Alta Perfumería">✨ Alta Perfumería / Fragancias</option>
                        <option value="Snacks Deshidratados">🍃 Snacks Deshidratados / Alimentos</option>
                        <option value="Gastronomía">🍽️ Gastronomía, Café & Repostería</option>
                        <option value="Moda y Accesorios">👗 Moda, Ropa y Calzado</option>
                        <option value="Joyería holística y servicios energéticos">💎 Joyería y Accesorios</option>
                        <option value="Arte y Artesanías">🎨 Arte y Artesanías</option>
                        <option value="Servicios Profesionales">🛠️ Servicios Profesionales</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label style={{ fontSize: "0.82rem", fontWeight: 700 }}>Ciudad / Ubicación</label>
                      <input 
                        type="text"
                        className="form-control"
                        placeholder="Ej. Arequipa, Lima, Cusco"
                        value={brandForm.city}
                        onChange={e => setBrandForm({ ...brandForm, city: e.target.value })}
                      />
                    </div>

                    <div className="form-group" style={{ gridColumn: "1 / -1" }}>
                      <label style={{ fontSize: "0.82rem", fontWeight: 700 }}>Eslogan / Frase Corta de la Marca</label>
                      <input 
                        type="text"
                        className="form-control"
                        placeholder="Ej. Sabor que retumba / Fragancias que dejan huella"
                        value={brandForm.tagline}
                        onChange={e => setBrandForm({ ...brandForm, tagline: e.target.value })}
                      />
                    </div>
                  </div>

                  <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "1.2rem" }}>
                    <button 
                      type="submit"
                      className="btn-gold"
                      disabled={savingBrand}
                      style={{ padding: "0.6rem 1.6rem", borderRadius: "10px", fontSize: "0.88rem", fontWeight: 700 }}
                    >
                      {savingBrand ? "Guardando..." : "💾 Guardar Datos Esenciales"}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>

          {/* ── SECCIÓN 3: ACORDEÓN DE PERSONALIZACIÓN AVANZADA (100% DE OPCIONES) ── */}
          <div className="dashboard-accordion">
            <div 
              className="dashboard-accordion-header"
              onClick={() => setIsAdvancedBrandOpen(!isAdvancedBrandOpen)}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: "rgba(212,175,55,0.15)", color: "var(--gold-primary)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <i className="fa-solid fa-sliders"></i>
                </div>
                <div>
                  <h4 style={{ fontSize: "1rem", fontWeight: 800, margin: 0 }}>
                    🛠️ Personalización Avanzada y Ajustes Detallados
                  </h4>
                  <p style={{ color: "var(--text-muted)", fontSize: "0.78rem", margin: "2px 0 0" }}>
                    Despliega todas las opciones manuales: colores hexadecimales, modo de catálogo forzado, mapa, redes y fondo personalizado.
                  </p>
                </div>
              </div>
              <i className={`fa-solid fa-chevron-${isAdvancedBrandOpen ? "up" : "down"}`} style={{ color: "var(--text-muted)" }}></i>
            </div>

            {isAdvancedBrandOpen && (
              <div className="dashboard-accordion-body">
                <form onSubmit={handleSaveBrand}>
                  {/* A. Paleta Hexadecimal Detallada */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.8rem", flexWrap: "wrap", gap: "8px" }}>
                    <h5 style={{ fontSize: "0.95rem", fontWeight: 800, margin: 0, color: "var(--text-gold)" }}>
                      🎨 Paleta de Colores de la Marca
                    </h5>
                    <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", background: "rgba(0,0,0,0.04)", padding: "2px 8px", borderRadius: "6px" }}>
                      💡 C1 y C2 son tus colores principales; C3 y C4 se armonizan automáticamente si usas 1 o 2 tonos
                    </span>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "14px", marginBottom: "1.5rem" }}>
                    <div>
                      <label style={{ fontSize: "0.78rem", fontWeight: 700 }}>Color Principal (C1)</label>
                      <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                        <input type="color" value={brandForm.c1} onChange={e => setBrandForm({ ...brandForm, c1: e.target.value })} style={{ width: "38px", height: "38px", border: "none", cursor: "pointer", borderRadius: "6px" }} />
                        <input type="text" className="form-control" value={brandForm.c1} onChange={e => setBrandForm({ ...brandForm, c1: e.target.value })} />
                      </div>
                      <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>Botones principales e insignias</span>
                    </div>
                    <div>
                      <label style={{ fontSize: "0.78rem", fontWeight: 700 }}>Color Secundario (C2)</label>
                      <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                        <input type="color" value={brandForm.c2} onChange={e => setBrandForm({ ...brandForm, c2: e.target.value })} style={{ width: "38px", height: "38px", border: "none", cursor: "pointer", borderRadius: "6px" }} />
                        <input type="text" className="form-control" value={brandForm.c2} onChange={e => setBrandForm({ ...brandForm, c2: e.target.value })} />
                      </div>
                      <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>Acentos secundarios y degradados</span>
                    </div>
                    <div>
                      <label style={{ fontSize: "0.78rem", fontWeight: 700 }}>Color de Acento (C3)</label>
                      <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                        <input type="color" value={brandForm.c3} onChange={e => setBrandForm({ ...brandForm, c3: e.target.value })} style={{ width: "38px", height: "38px", border: "none", cursor: "pointer", borderRadius: "6px" }} />
                        <input type="text" className="form-control" value={brandForm.c3} onChange={e => setBrandForm({ ...brandForm, c3: e.target.value })} />
                      </div>
                      <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>Resplandor o acento armónico</span>
                    </div>
                    <div>
                      <label style={{ fontSize: "0.78rem", fontWeight: 700 }}>Color de Fondo o Suave (C4)</label>
                      <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                        <input type="color" value={brandForm.c4} onChange={e => setBrandForm({ ...brandForm, c4: e.target.value })} style={{ width: "38px", height: "38px", border: "none", cursor: "pointer", borderRadius: "6px" }} />
                        <input type="text" className="form-control" value={brandForm.c4} onChange={e => setBrandForm({ ...brandForm, c4: e.target.value })} />
                      </div>
                      <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>Tonos ambientales o de contraste</span>
                    </div>
                  </div>

                  {/* B. Tipografía y Fondo de la Tienda */}
                  <h5 style={{ fontSize: "0.95rem", fontWeight: 800, marginBottom: "0.8rem", color: "var(--text-gold)" }}>
                    🖼️ Tipografía y Fondo de la Tienda (Página y Productos)
                  </h5>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "14px", marginBottom: "1.5rem" }}>
                    <div className="form-group">
                      <label style={{ fontSize: "0.78rem", fontWeight: 700 }}>Tipografía de la Marca</label>
                      <select 
                        className="form-control"
                        value={brandForm.fontFamily}
                        onChange={e => setBrandForm({ ...brandForm, fontFamily: e.target.value })}
                      >
                        <option value="Inter">Inter (Limpia y Moderna)</option>
                        <option value="Playfair Display">Playfair Display (Alta Perfumería y Lujo)</option>
                        <option value="Cinzel">Cinzel (Imperial y Elegante)</option>
                        <option value="Outfit">Outfit (Moderna y Geométrica)</option>
                        <option value="Space Grotesk">Space Grotesk (Tech & Minimal)</option>
                        <option value="Plus Jakarta Sans">Plus Jakarta Sans (Cálida y Gourmet)</option>
                        <option value="Montserrat">Montserrat (Contemporánea)</option>
                      </select>
                      <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>
                        ✨ Aplica a la vitrina y a todos los textos, títulos y precios de los productos
                      </span>
                    </div>

                    <div className="form-group">
                      <label style={{ fontSize: "0.78rem", fontWeight: 700 }}>Fondo de la Vitrina & Productos</label>
                      <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                        <input 
                          type="color" 
                          value={brandForm.customBgColor && brandForm.customBgColor.startsWith("#") ? brandForm.customBgColor : "#FAF9F0"} 
                          onChange={e => setBrandForm({ ...brandForm, customBgColor: e.target.value })} 
                          style={{ width: "38px", height: "38px", border: "none", cursor: "pointer", borderRadius: "6px" }} 
                        />
                        <input 
                          type="text" 
                          className="form-control" 
                          value={brandForm.customBgColor} 
                          onChange={e => setBrandForm({ ...brandForm, customBgColor: e.target.value })} 
                        />
                      </div>
                      <div style={{ display: "flex", gap: "5px", marginTop: "6px", flexWrap: "wrap" }}>
                        {[
                          { label: "Marfil", color: "#FAF9F0" },
                          { label: "Dark", color: "#0A0B0E" },
                          { label: "Blanco", color: "#FFFFFF" },
                          { label: "Botánico", color: "#F4F7F4" },
                          { label: "Marca C1", color: brandForm.c1 }
                        ].map(bgOpt => (
                          <button
                            key={bgOpt.label}
                            type="button"
                            onClick={() => setBrandForm({ ...brandForm, customBgColor: bgOpt.color })}
                            style={{
                              fontSize: "0.68rem",
                              padding: "2px 7px",
                              borderRadius: "6px",
                              border: "1px solid var(--border-color)",
                              background: bgOpt.color,
                              color: (bgOpt.color === "#0A0B0E" || bgOpt.color === brandForm.c1) ? "#fff" : "#1C1C1E",
                              cursor: "pointer",
                              fontWeight: 700
                            }}
                          >
                            {bgOpt.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="form-group">
                      <label style={{ fontSize: "0.78rem", fontWeight: 700 }}>Estilo del Fondo de la Página</label>
                      <select 
                        className="form-control"
                        value={brandForm.bgStyle}
                        onChange={e => setBrandForm({ ...brandForm, bgStyle: e.target.value })}
                      >
                        <option value="solid">Sólido Puro (Limpio y Uniforme)</option>
                        <option value="gradient">Gradiente Elegante (Con tonos de marca)</option>
                        <option value="mesh">Malla Suave (Radial Mesh)</option>
                        <option value="dots">Puntos Delicados (Puntillismo)</option>
                        <option value="none">Blanco Minimalista Puro</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label style={{ fontSize: "0.78rem", fontWeight: 700 }}>Modo de Catálogo Forzado</label>
                      <select 
                        className="form-control"
                        value={brandForm.catalogDisplayMode}
                        onChange={e => setBrandForm({ ...brandForm, catalogDisplayMode: e.target.value })}
                      >
                        <option value="auto">Detección Automática (según rubro)</option>
                        <option value="perfumery">💎 Alta Perfumería (Dúo Visual & Cata)</option>
                        <option value="menu">🍽️ Menú Gastronómico (Platillos & Porciones)</option>
                        <option value="grid">🛍️ Cuadrícula Estándar (E-commerce clásico)</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label style={{ fontSize: "0.78rem", fontWeight: 700 }}>Forma del Logotipo</label>
                      <select 
                        className="form-control"
                        value={brandForm.logoShape}
                        onChange={e => setBrandForm({ ...brandForm, logoShape: e.target.value })}
                      >
                        <option value="rounded">Esquinas Redondeadas (24px)</option>
                        <option value="circle">Circular (50%)</option>
                        <option value="square">Cuadrado Puro (0px)</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label style={{ fontSize: "0.78rem", fontWeight: 700 }}>Intensidad de Resplandor: {brandForm.glowIntensity}%</label>
                      <input 
                        type="range"
                        min="0"
                        max="100"
                        className="form-control"
                        value={brandForm.glowIntensity}
                        onChange={e => setBrandForm({ ...brandForm, glowIntensity: Number(e.target.value) })}
                      />
                    </div>
                  </div>

                  {/* C. Configuración de Tarjetas de Producto */}
                  <div style={{ background: "rgba(212,175,55,0.06)", border: "1.5px solid rgba(212,175,55,0.25)", borderRadius: "16px", padding: "1.2rem", marginBottom: "1.5rem" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.9rem", flexWrap: "wrap", gap: "8px" }}>
                      <h5 style={{ fontSize: "0.95rem", fontWeight: 800, margin: 0, color: "var(--text-gold)", display: "flex", alignItems: "center", gap: "8px" }}>
                        <i className="fa-solid fa-layer-group"></i> 🃏 Configuración de Tarjetas de Producto
                      </h5>
                      <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>
                        Controla cómo se presentan tus productos en catálogo y vitrina
                      </span>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: "12px", marginBottom: "1rem" }}>
                      <div className="form-group" style={{ margin: 0 }}>
                        <label style={{ fontSize: "0.76rem", fontWeight: 700 }}>Fondo de las Tarjetas</label>
                        <select 
                          className="form-control"
                          value={brandForm.cardBgColor || "page_bg"}
                          onChange={e => setBrandForm({ ...brandForm, cardBgColor: e.target.value })}
                        >
                          <option value="page_bg">🌿 Mismo fondo de la tienda (Recomendado - 100% Integrado)</option>
                          <option value="transparent">✨ Transparente / Glass (Muestra el fondo detrás)</option>
                          <option value="#FFFFFF">⬜ Blanco Puro (#FFFFFF)</option>
                          <option value="#18181B">⬛ Oscuro Carbón (#18181B)</option>
                          <option value="brand">🎨 Color de Marca (C1)</option>
                          <option value="brand-soft">🌸 Tono Suave de Marca</option>
                        </select>
                      </div>

                      <div className="form-group" style={{ margin: 0 }}>
                        <label style={{ fontSize: "0.76rem", fontWeight: 700 }}>Borde de las Tarjetas</label>
                        <select 
                          className="form-control"
                          value={brandForm.cardBorderColor || "auto"}
                          onChange={e => setBrandForm({ ...brandForm, cardBorderColor: e.target.value })}
                        >
                          <option value="auto">Automático (Borde sutil acorde al estilo)</option>
                          <option value="brand">Borde con Color de Marca C1</option>
                          <option value="transparent">Sin Borde (Plano y limpio)</option>
                          <option value="#E2E8F0">Línea gris muy fina (#E2E8F0)</option>
                        </select>
                      </div>

                      <div className="form-group" style={{ margin: 0 }}>
                        <label style={{ fontSize: "0.76rem", fontWeight: 700 }}>Color de Texto en Tarjetas</label>
                        <select 
                          className="form-control"
                          value={brandForm.cardTextColor || "auto"}
                          onChange={e => setBrandForm({ ...brandForm, cardTextColor: e.target.value })}
                        >
                          <option value="auto">Automático (Contraste inteligente)</option>
                          <option value="#1C1C1E">Texto Oscuro (#1C1C1E)</option>
                          <option value="#F8FAFC">Texto Blanco Puro (#F8FAFC)</option>
                          <option value="brand">Color de Marca C1</option>
                        </select>
                      </div>
                    </div>

                    {/* Previsualizador en Vivo de Alta Fidelidad de la Tarjeta de Producto */}
                    {(() => {
                      const getHexBrightness = (hexColor, fallback = 240) => {
                        if (!hexColor || typeof hexColor !== "string" || !hexColor.startsWith("#")) return fallback;
                        let h = hexColor.replace("#", "");
                        if (h.length === 3) h = h.split("").map(c => c + c).join("");
                        if (h.length !== 6) return fallback;
                        const r = parseInt(h.substring(0, 2), 16) || 0;
                        const g = parseInt(h.substring(2, 4), 16) || 0;
                        const b = parseInt(h.substring(4, 6), 16) || 0;
                        return (r * 299 + g * 587 + b * 114) / 1000;
                      };

                      const storeBright = getHexBrightness(brandForm.customBgColor, 240);
                      const isStoreLight = storeBright >= 130;

                      let previewCardBg = brandForm.cardBgColor || "page_bg";
                      if (previewCardBg === "page_bg" || previewCardBg === "auto") {
                        previewCardBg = brandForm.customBgColor || (isStoreLight ? "#FFFFFF" : "#18181B");
                      } else if (previewCardBg === "brand") {
                        previewCardBg = brandForm.c1;
                      } else if (previewCardBg === "brand-soft") {
                        previewCardBg = `${brandForm.c1}18`;
                      } else if (previewCardBg === "transparent") {
                        previewCardBg = isStoreLight ? "rgba(255, 255, 255, 0.65)" : "rgba(24, 24, 27, 0.65)";
                      }

                      const cardBright = getHexBrightness(previewCardBg, isStoreLight ? 250 : 20);
                      const isCardDark = cardBright < 140;

                      let previewTitleColor = isCardDark ? "#FFFFFF" : "#1C1C1E";
                      let previewPriceColor = isCardDark ? "#FFFFFF" : "#1C1C1E";
                      let previewCatColor = isCardDark ? "var(--text-gold)" : (brandForm.c1 || "#854D0E");
                      let previewBorderDivider = isCardDark ? "1px solid rgba(255,255,255,0.12)" : "1px solid rgba(0,0,0,0.08)";

                      if (brandForm.cardTextColor === "brand") {
                        previewTitleColor = brandForm.c1;
                        previewPriceColor = brandForm.c1;
                        previewCatColor = brandForm.c1;
                      } else if (brandForm.cardTextColor && brandForm.cardTextColor !== "auto" && brandForm.cardTextColor.startsWith("#")) {
                        previewTitleColor = brandForm.cardTextColor;
                        previewPriceColor = brandForm.cardTextColor;
                        if (getHexBrightness(brandForm.cardTextColor, 0) > 160) {
                          previewCatColor = "var(--text-gold)";
                          previewBorderDivider = "1px solid rgba(255,255,255,0.2)";
                        }
                      }

                      let previewBorder = `1px solid ${brandForm.c1}30`;
                      if (brandForm.cardBorderColor === "brand") {
                        previewBorder = `1.5px solid ${brandForm.c1}`;
                      } else if (brandForm.cardBorderColor === "transparent") {
                        previewBorder = "none";
                      } else if (brandForm.cardBorderColor && brandForm.cardBorderColor.startsWith("#")) {
                        previewBorder = `1.5px solid ${brandForm.cardBorderColor}`;
                      }

                      const previewShadow = "0 4px 16px rgba(0,0,0,0.06)";

                      const sampleItem = currentBrandProducts.find(p => p.image) || currentBrandProducts?.[0] || {
                        name: "Mixto de fruta deshidratada (200gr)",
                        category: brandForm.category || "Snacks Deshidratados",
                        price: 34,
                        priceAourum: 30,
                        image: "https://res.cloudinary.com/decklnx3p/image/upload/v1782436666/aourum/s3yn9iwcxax98txmibwq.png"
                      };

                      return (
                        <div style={{ marginTop: "1rem", background: brandForm.customBgColor || "rgba(0,0,0,0.03)", border: "1.5px dashed var(--border-color)", borderRadius: "16px", padding: "1.2rem" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", flexWrap: "wrap", gap: "8px" }}>
                            <span style={{ fontSize: "0.78rem", fontWeight: 800, color: "var(--text-gold)", textTransform: "uppercase", letterSpacing: "0.05em", display: "flex", alignItems: "center", gap: "6px" }}>
                              <i className="fa-solid fa-eye"></i> Vista Previa en Vivo: Tarjeta en el Catálogo de tu Tienda
                            </span>
                            <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", background: "rgba(0,0,0,0.06)", padding: "3px 8px", borderRadius: "6px" }}>
                              Simulación sobre el fondo de tu tienda ({brandForm.customBgColor || "#FAF9F0"})
                            </span>
                          </div>

                          <div style={{ display: "flex", gap: "1.5rem", alignItems: "center", justifyContent: "center", flexWrap: "wrap" }}>
                            {/* Tarjeta de Producto Vertical Idéntica al Catálogo Real */}
                            <div 
                              style={{
                                width: "100%",
                                maxWidth: "270px",
                                backgroundColor: previewCardBg,
                                border: previewBorder,
                                borderRadius: "18px",
                                overflow: "hidden",
                                display: "flex",
                                flexDirection: "column",
                                fontFamily: brandForm.fontFamily,
                                boxShadow: previewShadow,
                                backdropFilter: brandForm.cardStyle === "glass" ? "blur(14px)" : "none",
                                WebkitBackdropFilter: brandForm.cardStyle === "glass" ? "blur(14px)" : "none",
                                transition: "all 0.25s ease-in-out"
                              }}
                            >
                              {/* Contenedor de Imagen de Producto */}
                              <div 
                                style={{
                                  width: "100%",
                                  aspectRatio: "4 / 3",
                                  position: "relative",
                                  backgroundColor: "#FFFFFF",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  padding: "12px",
                                  overflow: "hidden"
                                }}
                              >
                                {/* Badge Superior Izquierdo */}
                                <div style={{ position: "absolute", top: "10px", left: "10px", zIndex: 3 }}>
                                  <span style={{
                                    background: brandForm.c1,
                                    color: getHexBrightness(brandForm.c1, 240) > 160 ? "#1C1C1E" : "#FFFFFF",
                                    fontSize: "0.62rem",
                                    padding: "3px 9px",
                                    borderRadius: "12px",
                                    fontWeight: 800,
                                    letterSpacing: "0.03em",
                                    textTransform: "uppercase",
                                    boxShadow: "0 2px 8px rgba(0,0,0,0.18)",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "4px"
                                  }}>
                                    <i className="fa-solid fa-fire"></i> Más Visto
                                  </span>
                                </div>

                                {sampleItem.image ? (
                                  <img 
                                    src={sampleItem.image} 
                                    alt={sampleItem.name} 
                                    style={{
                                      width: "100%",
                                      height: "100%",
                                      maxWidth: "100%",
                                      maxHeight: "100%",
                                      objectFit: "contain"
                                    }}
                                  />
                                ) : (
                                  <i className="fa-solid fa-box-open" style={{ fontSize: "2.5rem", color: brandForm.c1, opacity: 0.6 }}></i>
                                )}
                              </div>

                              {/* Cuerpo de la Tarjeta */}
                              <div style={{ padding: "1rem", display: "flex", flexDirection: "column", gap: "0.35rem" }}>
                                <span style={{
                                  fontSize: "0.68rem",
                                  color: previewCatColor,
                                  letterSpacing: "0.05em",
                                  textTransform: "uppercase",
                                  fontWeight: 800
                                }}>
                                  {sampleItem.category || brandForm.category || "General"}
                                </span>

                                <h4 style={{
                                  fontSize: "0.96rem",
                                  fontWeight: 800,
                                  lineHeight: 1.3,
                                  color: previewTitleColor,
                                  margin: "2px 0 0 0",
                                  fontFamily: brandForm.fontFamily,
                                  whiteSpace: "nowrap",
                                  overflow: "hidden",
                                  textOverflow: "ellipsis"
                                }}>
                                  {sampleItem.name}
                                </h4>

                                <div style={{ fontSize: "0.75rem", color: isCardDark ? "#A1A1AA" : "var(--text-muted)", display: "flex", alignItems: "center", gap: "4px" }}>
                                  <span>Por:</span>
                                  <strong style={{ color: previewTitleColor, textDecoration: "underline" }}>
                                    {brandForm.name || "Tu Marca"}
                                  </strong>
                                </div>

                                <div style={{
                                  display: "flex",
                                  justifyContent: "space-between",
                                  alignItems: "center",
                                  borderTop: previewBorderDivider,
                                  paddingTop: "0.5rem",
                                  marginTop: "0.4rem"
                                }}>
                                  <div>
                                    {sampleItem.priceAourum ? (
                                      <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                                        <span style={{ fontSize: "1.1rem", fontWeight: 900, color: previewPriceColor }}>
                                          S/ {Number(sampleItem.priceAourum).toFixed(2)}
                                        </span>
                                        <span style={{ fontSize: "0.72rem", color: isCardDark ? "#71717A" : "#A1A1AA", textDecoration: "line-through" }}>
                                          S/ {Number(sampleItem.price).toFixed(2)}
                                        </span>
                                      </div>
                                    ) : (
                                      <span style={{ fontSize: "1.1rem", fontWeight: 900, color: previewPriceColor }}>
                                        S/ {sampleItem.price ? Number(sampleItem.price).toFixed(2) : "30.00"}
                                      </span>
                                    )}
                                  </div>

                                  <span style={{ fontSize: "0.68rem", color: "#10B981", fontWeight: 700, display: "flex", alignItems: "center", gap: "3px" }}>
                                    <i className="fa-solid fa-circle-check"></i> En Stock
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Resumen de configuración activa */}
                            <div style={{ display: "flex", flexDirection: "column", gap: "8px", maxWidth: "260px", fontSize: "0.76rem" }}>
                              <div style={{ fontWeight: 800, color: "var(--text-primary)", marginBottom: "2px" }}>
                                ⚡ Ajustes en Tiempo Real:
                              </div>
                              <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 8px", borderRadius: "6px", background: "rgba(0,0,0,0.04)" }}>
                                <span style={{ color: "var(--text-muted)" }}>Fondo:</span>
                                <span style={{ fontWeight: 700 }}>{brandForm.cardBgColor === "page_bg" ? "Mismo de la tienda" : brandForm.cardBgColor}</span>
                              </div>
                              <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 8px", borderRadius: "6px", background: "rgba(0,0,0,0.04)" }}>
                                <span style={{ color: "var(--text-muted)" }}>Borde:</span>
                                <span style={{ fontWeight: 700 }}>{brandForm.cardBorderColor}</span>
                              </div>
                              <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 8px", borderRadius: "6px", background: "rgba(0,0,0,0.04)" }}>
                                <span style={{ color: "var(--text-muted)" }}>Texto:</span>
                                <span style={{ fontWeight: 700 }}>{brandForm.cardTextColor}</span>
                              </div>
                              <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 8px", borderRadius: "6px", background: "rgba(0,0,0,0.04)" }}>
                                <span style={{ color: "var(--text-muted)" }}>Tipografía:</span>
                                <span style={{ fontWeight: 700 }}>{brandForm.fontFamily}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                  </div>

                  {/* C. Local Físico & Ubicación */}
                  <h5 style={{ fontSize: "0.95rem", fontWeight: 800, marginBottom: "0.8rem", color: "var(--text-gold)" }}>
                    📍 Ubicación y Local Físico
                  </h5>
                  <div style={{ marginBottom: "1.5rem" }}>
                    <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", marginBottom: "10px" }}>
                      <input 
                        type="checkbox"
                        checked={brandForm.hasLocal}
                        onChange={e => setBrandForm({ ...brandForm, hasLocal: e.target.checked })}
                      />
                      <span style={{ fontSize: "0.85rem", fontWeight: 600 }}>¿Tiene tienda o local físico de atención al público?</span>
                    </label>

                    {brandForm.hasLocal && (
                      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: "10px" }}>
                        <input 
                          type="text"
                          className="form-control"
                          placeholder="Dirección del local (Calle, Nro, Distrito)"
                          value={brandForm.localAddress}
                          onChange={e => setBrandForm({ ...brandForm, localAddress: e.target.value })}
                        />
                        <input 
                          type="number"
                          step="any"
                          className="form-control"
                          placeholder="Latitud"
                          value={brandForm.localLat}
                          onChange={e => setBrandForm({ ...brandForm, localLat: e.target.value })}
                        />
                        <input 
                          type="number"
                          step="any"
                          className="form-control"
                          placeholder="Longitud"
                          value={brandForm.localLng}
                          onChange={e => setBrandForm({ ...brandForm, localLng: e.target.value })}
                        />
                      </div>
                    )}
                  </div>

                  {/* D. Redes Sociales */}
                  <div style={{ marginBottom: "1.5rem" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.8rem", flexWrap: "wrap", gap: "6px" }}>
                      <h5 style={{ fontSize: "0.95rem", fontWeight: 800, margin: 0, color: "var(--text-gold)", display: "flex", alignItems: "center", gap: "8px" }}>
                        <i className="fa-solid fa-globe"></i> Redes Sociales de la Marca & Enlaces
                      </h5>
                      <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>
                        🔗 Pega el enlace web completo (URL)
                      </span>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "12px" }}>
                      <div className="form-group" style={{ margin: 0 }}>
                        <label style={{ fontSize: "0.76rem", fontWeight: 700, display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px" }}>
                          <i className="fa-brands fa-instagram" style={{ color: "#E1306C" }}></i> Instagram (Link completo)
                        </label>
                        <input 
                          type="url"
                          className="form-control"
                          placeholder="https://instagram.com/tumarca"
                          value={brandForm.instagram}
                          onChange={e => setBrandForm({ ...brandForm, instagram: e.target.value })}
                          onBlur={e => setBrandForm(prev => ({ ...prev, instagram: ensureFullSocialUrl(e.target.value, "instagram") }))}
                        />
                      </div>
                      <div className="form-group" style={{ margin: 0 }}>
                        <label style={{ fontSize: "0.76rem", fontWeight: 700, display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px" }}>
                          <i className="fa-brands fa-tiktok" style={{ color: "var(--text-primary)" }}></i> TikTok (Link completo)
                        </label>
                        <input 
                          type="url"
                          className="form-control"
                          placeholder="https://tiktok.com/@tumarca"
                          value={brandForm.tiktok}
                          onChange={e => setBrandForm({ ...brandForm, tiktok: e.target.value })}
                          onBlur={e => setBrandForm(prev => ({ ...prev, tiktok: ensureFullSocialUrl(e.target.value, "tiktok") }))}
                        />
                      </div>
                      <div className="form-group" style={{ margin: 0 }}>
                        <label style={{ fontSize: "0.76rem", fontWeight: 700, display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px" }}>
                          <i className="fa-brands fa-facebook" style={{ color: "#1877F2" }}></i> Facebook (Link completo)
                        </label>
                        <input 
                          type="url"
                          className="form-control"
                          placeholder="https://facebook.com/tumarca"
                          value={brandForm.facebook}
                          onChange={e => setBrandForm({ ...brandForm, facebook: e.target.value })}
                          onBlur={e => setBrandForm(prev => ({ ...prev, facebook: ensureFullSocialUrl(e.target.value, "facebook") }))}
                        />
                      </div>
                      <div className="form-group" style={{ margin: 0 }}>
                        <label style={{ fontSize: "0.76rem", fontWeight: 700, display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px" }}>
                          <i className="fa-solid fa-link" style={{ color: "var(--gold-primary)" }}></i> Sitio Web Oficial
                        </label>
                        <input 
                          type="url"
                          className="form-control"
                          placeholder="https://tumarca.com"
                          value={brandForm.website}
                          onChange={e => setBrandForm({ ...brandForm, website: e.target.value })}
                          onBlur={e => setBrandForm(prev => ({ ...prev, website: ensureFullSocialUrl(e.target.value, "website") }))}
                        />
                      </div>
                    </div>
                  </div>

                  <div style={{ display: "flex", justifyContent: "flex-end" }}>
                    <button 
                      type="submit"
                      className="btn-gold"
                      disabled={savingBrand}
                      style={{ padding: "0.65rem 1.8rem", borderRadius: "10px", fontSize: "0.9rem", fontWeight: 700 }}
                    >
                      {savingBrand ? "Guardando..." : "💾 Guardar Todos los Ajustes Avanzados"}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════════════
          TAB 3: CATÁLOGO DE PRODUCTOS (GESTOR RÁPIDO Y CÓMODO)
          ═════════════════════════════════════════════════════════════════════ */}
      {activeTab === "productos" && (
        <div className="fade-in">
          {/* Barra Superior con Selector de Marca y Botón Añadir */}
          <div className="dash-catalog-brand-header">
            <div className="dash-catalog-brand-info">
              <div className="dash-catalog-title-row">
                <h2 style={{ fontSize: "1.35rem", fontWeight: 800, margin: 0, letterSpacing: "-0.01em" }}>
                  Catálogo de Ítems ({currentBrandProducts.length})
                </h2>
              </div>

              {/* Marca Activa en Edición */}
              {selectedBrand && (
                <div className="dash-catalog-active-brand-chip">
                  <div className="dash-catalog-chip-avatar">
                    <img 
                      src={selectedBrand.logo || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100"} 
                      alt={selectedBrand.name} 
                    />
                  </div>
                  <div className="dash-catalog-chip-meta">
                    <span className="dash-catalog-chip-sub">Gestionando productos de:</span>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                      <strong className="dash-catalog-chip-name">{selectedBrand.name}</strong>
                      <span className="dash-catalog-chip-cat">
                        {selectedBrand.category || "General"}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Switcher Rápido si tiene múltiples marcas */}
              {myBrands.length > 1 && (
                <div className="dash-catalog-switcher-row">
                  <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "5px" }}>
                    <i className="fa-solid fa-arrows-rotate"></i> Cambiar marca:
                  </span>
                  <div className="dash-catalog-pills">
                    {myBrands.map(b => {
                      const isActive = Number(selectedBrandId) === b.id;
                      return (
                        <button
                          key={b.id}
                          type="button"
                          onClick={() => setSelectedBrandId(b.id)}
                          className={`dash-catalog-pill-btn ${isActive ? "active" : ""}`}
                          title={`Ver catálogo de ${b.name}`}
                        >
                          <img src={b.logo || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100"} alt={b.name} />
                          <span>{b.name}</span>
                          {isActive && <i className="fa-solid fa-circle-check" style={{ color: "var(--gold-primary)", fontSize: "0.75rem" }}></i>}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <div className="dash-catalog-actions-wrap">
              {isBrandPerfume && (
                <button 
                  onClick={() => handleOpenAddProduct("perfume")}
                  className="btn-gold"
                  style={{ padding: "0.55rem 1.2rem", borderRadius: "10px", fontSize: "0.85rem", fontWeight: 700, display: "flex", alignItems: "center", gap: "6px" }}
                >
                  <i className="fa-solid fa-spray-can-sparkles"></i> + Nueva Fragancia
                </button>
              )}

              {isBrandMenu && (
                <button 
                  onClick={() => handleOpenAddProduct("gastro")}
                  className="btn-gold"
                  style={{ padding: "0.55rem 1.2rem", borderRadius: "10px", fontSize: "0.85rem", fontWeight: 700, display: "flex", alignItems: "center", gap: "6px" }}
                >
                  <i className="fa-solid fa-utensils"></i> + Añadir al Menú / Carta
                </button>
              )}

              {isBrandStandard && (
                <button 
                  onClick={() => handleOpenAddProduct("standard")}
                  className="btn-gold"
                  style={{ padding: "0.55rem 1.2rem", borderRadius: "10px", fontSize: "0.85rem", fontWeight: 700, display: "flex", alignItems: "center", gap: "6px" }}
                >
                  <i className="fa-solid fa-plus"></i> + Nuevo Producto / Servicio
                </button>
              )}
            </div>
          </div>

          {/* Filtros y Buscador Rápido */}
          <div style={{ display: "flex", gap: "10px", marginBottom: "1.5rem", flexWrap: "wrap" }}>
            <div style={{ flex: 1, minWidth: "240px", position: "relative" }}>
              <i className="fa-solid fa-magnifying-glass" style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }}></i>
              <input 
                type="text"
                placeholder={isBrandPerfume ? "Buscar por nombre, categoría o inspiración..." : "Buscar por nombre o categoría..."}
                value={prodSearch}
                onChange={e => setProdSearch(e.target.value)}
                className="form-control"
                style={{ paddingLeft: "38px" }}
              />
            </div>

            <select 
              value={prodCatFilter}
              onChange={e => setProdCatFilter(e.target.value)}
              className="form-control"
              style={{ maxWidth: "200px" }}
            >
              <option value="all">Todas las categorías</option>
              {brandCategories.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Lista de Productos con Acciones en 1 Clic */}
          {filteredProducts.length === 0 ? (
            <div className="glass-panel" style={{ padding: "3rem 1.5rem", textAlign: "center", borderRadius: "20px" }}>
              <i className="fa-solid fa-box-open" style={{ fontSize: "2.5rem", color: "var(--text-muted)", marginBottom: "1rem" }}></i>
              <h3 style={{ fontSize: "1.1rem", fontWeight: 700 }}>No se encontraron productos</h3>
              <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginBottom: "1.5rem" }}>
                {prodSearch ? "Prueba cambiando el término de búsqueda." : "Añade tu primer ítem para comenzar a vender en tu vitrina."}
              </p>
              <button 
                onClick={() => handleOpenAddProduct("perfume")}
                className="btn-gold"
                style={{ padding: "0.6rem 1.4rem", borderRadius: "8px", fontSize: "0.85rem", fontWeight: 700 }}
              >
                <i className="fa-solid fa-plus" style={{ marginRight: 6 }}></i> Añadir Primer Ítem
              </button>
            </div>
          ) : (
            <div>
              {filteredProducts.map(prod => {
                const isPerfume = prod.category?.toLowerCase().includes("perfum") || prod.description?.includes("[Inspiración");
                const isVisible = prod.isVisible !== false;
                const itemPres = parseProductPresentation(prod).presentation || (isPerfume ? parsePerfumeInfo(prod).ml : "");

                return (
                  <div key={prod.id} className="dash-product-row">
                    <div className="dash-product-main-info">
                      <img 
                        src={prod.image || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=120"} 
                        alt={prod.name}
                        className="dash-product-img"
                      />
                      <div className="dash-product-text">
                        <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
                          <h4 className="dash-product-title">{prod.name}</h4>
                          {isPerfume && (
                            <span style={{ fontSize: "0.62rem", background: "rgba(138,74,243,0.15)", color: "#8A4AF3", padding: "1px 6px", borderRadius: "8px", fontWeight: 700 }}>
                              💎 Fragancia
                            </span>
                          )}
                          {itemPres && (
                            <span style={{ fontSize: "0.68rem", background: "rgba(212, 175, 55, 0.14)", color: "var(--text-gold)", border: "1px solid rgba(212, 175, 55, 0.28)", padding: "1px 8px", borderRadius: "8px", fontWeight: 700 }}>
                              ⚖️ {itemPres}
                            </span>
                          )}
                        </div>
                        <span className="dash-product-cat">{prod.category}</span>
                        <div className="dash-product-mobile-price">
                          <span className="dash-price-badge">S/. {prod.price}</span>
                          <span className="dash-stock-badge">
                            {prod.type === "service" ? "∞ Ilimitado" : `${prod.stock || 0} unid.`}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="dash-product-actions">
                      <div className="dash-desktop-price-stock">
                        <span style={{ fontSize: "0.7rem", color: "var(--text-muted)", display: "block" }}>Precio</span>
                        <span style={{ fontSize: "1rem", fontWeight: 800, color: "var(--text-gold)" }}>S/. {prod.price}</span>
                      </div>

                      <div className="dash-desktop-price-stock">
                        <span style={{ fontSize: "0.7rem", color: "var(--text-muted)", display: "block" }}>Stock</span>
                        <span style={{ fontSize: "0.85rem", fontWeight: 600 }}>
                          {prod.type === "service" ? "∞ Ilimitado" : `${prod.stock || 0} unid.`}
                        </span>
                      </div>

                      <div className="dash-product-btn-group">
                        {/* Toggle Visibilidad en 1 Clic */}
                        <button 
                          type="button"
                          onClick={() => handleToggleProductVisibility(prod)}
                          title={isVisible ? "Ocultar de la vitrina" : "Mostrar en la vitrina"}
                          className={`dash-btn-visibility ${isVisible ? "active" : "hidden"}`}
                        >
                          <i className={`fa-solid fa-${isVisible ? "eye" : "eye-slash"}`}></i>
                          <span>{isVisible ? "Activo" : "Oculto"}</span>
                        </button>

                        {/* Duplicar para crear otro tamaño con la misma foto */}
                        <button 
                          type="button"
                          onClick={() => handleDuplicateProductForNewSize(prod)}
                          className="btn-outline-gold dash-btn-edit"
                          style={{ borderColor: "rgba(212, 175, 55, 0.4)", background: "rgba(212, 175, 55, 0.08)", color: "var(--text-gold)" }}
                          title="Crear otra presentación o tamaño con la misma foto"
                        >
                          <i className="fa-solid fa-copy"></i> + Tamaño
                        </button>

                        <button 
                          type="button"
                          onClick={() => handleEditProduct(prod)}
                          className="btn-outline-gold dash-btn-edit"
                        >
                          <i className="fa-solid fa-pen"></i> Editar
                        </button>
                        <button 
                          type="button"
                          onClick={async () => {
                            if (window.confirm(`¿Estás seguro de eliminar "${prod.name}"?`)) {
                              await handleDeleteProduct(prod.id);
                            }
                          }}
                          className="dash-btn-delete"
                          title="Eliminar producto"
                        >
                          <i className="fa-solid fa-trash"></i>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* ── MODAL / PANEL DE CREACIÓN DE PRODUCTO CON PLANTILLAS Y PORTAL ───────── */}
          {showProductModal && typeof document !== "undefined" && createPortal(
            <div className="modal-overlay" style={{ zIndex: 9999 }}>
              <div className="modal-backdrop" onClick={() => setShowProductModal(false)}></div>
              <div 
                className="modal-panel" 
                style={{ 
                  maxWidth: "760px", 
                  width: "95vw", 
                  background: "var(--bg-card)", 
                  border: "1.5px solid var(--gold-primary)", 
                  borderRadius: "20px", 
                  maxHeight: "90vh", 
                  maxHeight: "90dvh", 
                  display: "flex", 
                  flexDirection: "column", 
                  overflow: "hidden", 
                  margin: "auto",
                  position: "relative",
                  zIndex: 10
                }}
              >
                {/* Cabecera Pinned / Siempre Visible */}
                <div 
                  className="modal-header" 
                  style={{ 
                    display: "flex", 
                    justifyContent: "space-between", 
                    alignItems: "center", 
                    padding: "1.2rem 1.6rem", 
                    borderBottom: "1px solid var(--border-color)", 
                    flexShrink: 0 
                  }}
                >
                  <h3 style={{ fontSize: "1.25rem", fontWeight: 800, margin: 0 }}>
                    {editingProductId ? "✏️ Editar Ítem" : "✨ Publicar Nuevo Ítem en Vitrina"}
                  </h3>
                  <button 
                    type="button"
                    onClick={() => setShowProductModal(false)}
                    style={{ 
                      background: "rgba(0,0,0,0.06)", 
                      border: "none", 
                      width: "32px", 
                      height: "32px", 
                      borderRadius: "50%", 
                      cursor: "pointer", 
                      fontSize: "1.2rem", 
                      display: "flex", 
                      alignItems: "center", 
                      justifyContent: "center" 
                    }}
                  >
                    &times;
                  </button>
                </div>

                <form onSubmit={handleSaveProductSubmit} style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0, overflow: "hidden" }}>
                  <div className="modal-body" style={{ flex: 1, overflowY: "auto", padding: "1.4rem 1.6rem", WebkitOverflowScrolling: "touch" }}>

                {/* Selector de Tipo de Producto Adaptativo */}
                {visibleTemplates.length === 1 ? (
                  <div 
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                      padding: "0.85rem 1.2rem",
                      borderRadius: "14px",
                      background: "rgba(138, 74, 243, 0.08)",
                      border: "1.5px solid #8A4AF3",
                      marginBottom: "1.2rem",
                      boxShadow: "0 4px 12px rgba(138, 74, 243, 0.12)"
                    }}
                  >
                    <div style={{ width: "38px", height: "38px", borderRadius: "10px", background: "rgba(138, 74, 243, 0.15)", color: "#8A4AF3", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.3rem" }}>
                      💎
                    </div>
                    <div style={{ flex: 1 }}>
                      <h5 style={{ fontSize: "0.92rem", fontWeight: 800, margin: 0, color: "#8A4AF3" }}>
                        Fragancia de Alta Perfumería
                      </h5>
                      <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>
                        Configuración exclusiva: Frasco de referencia original, Dúo Visual y Pirámide Olfativa
                      </span>
                    </div>
                    <span style={{ fontSize: "0.68rem", fontWeight: 700, padding: "2px 8px", borderRadius: "8px", background: "#8A4AF3", color: "#fff" }}>
                      💎 Activo
                    </span>
                  </div>
                ) : (
                  <div 
                    className="product-type-grid"
                    style={{
                      gridTemplateColumns: visibleTemplates.length === 2 ? "1fr 1fr" : "repeat(auto-fit, minmax(140px, 1fr))"
                    }}
                  >
                    {visibleTemplates.map(t => (
                      <div 
                        key={t.id}
                        className={`product-type-card ${productType === t.id ? "active" : ""}`}
                        onClick={() => {
                          setProductType(t.id);
                          if (!editingProductId) {
                            setProdForm(prev => ({ ...prev, category: t.defaultCategory }));
                          }
                        }}
                      >
                        <i className={`fa-solid ${t.icon}`} style={{ fontSize: "1.3rem", color: productType === t.id ? "var(--gold-primary)" : "var(--text-muted)", marginBottom: "4px" }}></i>
                        <h5 style={{ fontSize: "0.85rem", fontWeight: 700, margin: "2px 0" }}>{t.name}</h5>
                        <span style={{ fontSize: "0.68rem", color: "var(--text-muted)" }}>{t.badge}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Campos Esenciales Comunes */}
                <div style={{ display: "grid", gridTemplateColumns: (productType === "service" || productType === "perfume") ? "2fr 1fr 1fr" : "1.8fr 1fr 1fr 1.2fr", gap: "10px", marginBottom: "0.8rem" }}>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label style={{ fontSize: "0.82rem", fontWeight: 700 }}>
                        {isBrandPerfume ? "Nombre de la Fragancia *" : isBrandMenu ? "Nombre del Platillo / Ítem *" : "Nombre del Ítem *"}
                      </label>
                      <input 
                        type="text"
                        className="form-control"
                        placeholder={productType === "perfume" ? "Ej. Abunga Oud Noir" : productType === "drink" ? "Ej. Chicha Morada Artesanal (1L)" : productType === "gastro" ? "Ej. Salchialitas Personal" : "Nombre del producto"}
                        value={prodForm.name}
                        onChange={e => setProdForm({ ...prodForm, name: e.target.value })}
                        required
                      />
                    </div>

                    <div className="form-group" style={{ margin: 0 }}>
                      <label style={{ fontSize: "0.82rem", fontWeight: 700 }}>Precio (S/.) *</label>
                      <input 
                        type="number"
                        step="0.01"
                        className="form-control"
                        placeholder="0.00"
                        value={prodForm.price}
                        onChange={e => setProdForm({ ...prodForm, price: e.target.value })}
                        required
                      />
                    </div>

                    {productType !== "service" && (
                      <div className="form-group" style={{ margin: 0 }}>
                        <label style={{ fontSize: "0.82rem", fontWeight: 700 }}>Stock Disponible</label>
                        <input 
                          type="number"
                          className="form-control"
                          placeholder="10"
                          value={prodForm.stock}
                          onChange={e => setProdForm({ ...prodForm, stock: e.target.value })}
                        />
                      </div>
                    )}

                    {productType !== "perfume" && productType !== "service" && (
                      <div className="form-group" style={{ margin: 0 }}>
                        <label style={{ fontSize: "0.82rem", fontWeight: 700, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <span>⚖️ Tamaño / Gramaje</span>
                          <span style={{ fontSize: "0.68rem", color: "var(--text-muted)", fontWeight: 400 }}>Opcional</span>
                        </label>
                        <input 
                          type="text"
                          className="form-control"
                          placeholder="Ej. 25 gr, 50 gr, 100 gr..."
                          value={prodForm.presentation}
                          onChange={e => setProdForm({ ...prodForm, presentation: e.target.value })}
                        />
                      </div>
                    )}
                </div>

                {/* Atajos Rápidos de Tamaño / Presentación para productos estándar */}
                {productType !== "perfume" && productType !== "service" && (
                  <div style={{ marginBottom: "1.2rem", background: "var(--bg-card)", border: "1px dashed var(--border-color)", padding: "10px 14px", borderRadius: "12px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px", flexWrap: "wrap", gap: "4px" }}>
                      <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--text-gold)", display: "flex", alignItems: "center", gap: "6px" }}>
                        <i className="fa-solid fa-scale-balanced"></i> Atajos Rápidos de Cantidad / Tamaño (1 Clic)
                      </span>
                      <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>
                        💡 Para productos con varios tamaños (como los mixtos de Abunga)
                      </span>
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                      {["25 gr", "50 gr", "100 gr", "200 gr", "250 gr", "500 gr", "1 kg", "Pack x3", "Unidad", "S", "M", "L", "XL"].map(chip => (
                        <button
                          key={chip}
                          type="button"
                          onClick={() => setProdForm(prev => ({ ...prev, presentation: chip }))}
                          style={{
                            fontSize: "0.72rem",
                            padding: "3px 9px",
                            borderRadius: "14px",
                            border: prodForm.presentation === chip ? "1.5px solid var(--gold-primary)" : "1px solid var(--border-color)",
                            background: prodForm.presentation === chip ? "rgba(212, 175, 55, 0.2)" : "var(--bg-input)",
                            color: prodForm.presentation === chip ? "var(--gold-primary)" : "inherit",
                            cursor: "pointer",
                            fontWeight: prodForm.presentation === chip ? 700 : 500,
                            transition: "all 0.15s ease"
                          }}
                        >
                          {chip}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* ── SELECTOR VISIBLE DE CATEGORÍA CON SUGERENCIAS RÁPIDAS ── */}
                <div className="form-group" style={{ marginBottom: "1.2rem", background: "var(--bg-card)", border: "1px solid var(--border-color)", padding: "12px 14px", borderRadius: "12px" }}>
                  <label style={{ fontSize: "0.82rem", fontWeight: 700, display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                    <span>
                      {isBrandMenu 
                        ? (productType === "drink" ? "🥤 Tipo / Sección de Bebida *" : "🍽️ Categoría en tu Menú & Carta *")
                        : isBrandPerfume 
                        ? "💎 Familia Olfativa / Categoría *" 
                        : "📁 Categoría del Producto / Ítem *"}
                    </span>
                    <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>
                      {isBrandMenu ? "💡 Define la sección del menú y el carrusel en la página principal" : "💡 Agrupa tus productos en filtros y carruseles"}
                    </span>
                  </label>

                  {/* Chips rápidos en 1 clic */}
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "8px" }}>
                    {categorySuggestions.map(chip => (
                      <button
                        key={chip}
                        type="button"
                        onClick={() => setProdForm(prev => ({ ...prev, category: chip }))}
                        style={{
                          fontSize: "0.72rem",
                          padding: "3px 10px",
                          borderRadius: "14px",
                          border: prodForm.category === chip ? "1.5px solid var(--gold-primary)" : "1px solid var(--border-color)",
                          background: prodForm.category === chip ? "rgba(212, 175, 55, 0.15)" : "var(--bg-input)",
                          color: prodForm.category === chip ? "var(--gold-primary)" : "inherit",
                          cursor: "pointer",
                          fontWeight: prodForm.category === chip ? 700 : 500,
                          transition: "all 0.15s ease"
                        }}
                      >
                        {chip}
                      </button>
                    ))}
                  </div>

                  <input 
                    type="text"
                    className="form-control"
                    placeholder={
                      isBrandMenu
                        ? "Elige un atajo o escribe tu categoría (Ej. Salchipapas, Alitas, Pizzas, Postres...)"
                        : isBrandPerfume
                        ? "Ej. Amaderado, Cítrico, Oriental, Gourmand, Cuero..."
                        : "Elige un atajo o escribe una categoría personalizada..."
                    }
                    value={prodForm.category}
                    onChange={e => setProdForm({ ...prodForm, category: e.target.value })}
                    required
                  />
                </div>

                {/* ── DETALLES DE CARTA (PORCIÓN E INGREDIENTES PARA MENÚ) ── */}
                {(productType === "gastro" || productType === "drink") && (
                  <div style={{ background: "rgba(234, 179, 8, 0.04)", border: "1.5px solid rgba(234, 179, 8, 0.22)", borderRadius: "14px", padding: "1.1rem", marginBottom: "1.2rem" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px" }}>
                      <span style={{ fontSize: "1rem" }}>{productType === "drink" ? "🥤" : "🍽️"}</span>
                      <h4 style={{ fontSize: "0.92rem", fontWeight: 800, margin: 0, color: "#D97706" }}>
                        {productType === "drink" ? "Detalles de Bebida (Carta Digital)" : "Detalles del Platillo (Carta Digital)"}
                      </h4>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                      <div className="form-group">
                        <label style={{ fontSize: "0.78rem", fontWeight: 700 }}>Porción / Presentación</label>
                        <input 
                          type="text"
                          className="form-control"
                          placeholder={productType === "drink" ? "Ej. Vaso 500ml / Jarra 1L / Botella" : "Ej. Personal / Mediana / 8 Piezas"}
                          value={prodForm.gastroPortion}
                          onChange={e => setProdForm({ ...prodForm, gastroPortion: e.target.value })}
                        />
                      </div>

                      <div className="form-group">
                        <label style={{ fontSize: "0.78rem", fontWeight: 700 }}>Ingredientes / Acompañamiento</label>
                        <input 
                          type="text"
                          className="form-control"
                          placeholder={productType === "drink" ? "Ej. Maíz morado, piña, canela y limón" : "Ej. Papas amarillas, salchicha ahumada, salsas"}
                          value={prodForm.gastroIngredients}
                          onChange={e => setProdForm({ ...prodForm, gastroIngredients: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>
                )}

                  {/* ── CAMPOS ESPECÍFICOS PARA FRAGANCIAS / PERFUMES ── */}
                  {productType === "perfume" && (
                    <div style={{ background: "rgba(138,74,243,0.04)", border: "1.5px solid rgba(138,74,243,0.25)", borderRadius: "14px", padding: "1.2rem", marginBottom: "1.2rem" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px" }}>
                        <span style={{ fontSize: "1rem" }}>💎</span>
                        <h4 style={{ fontSize: "0.95rem", fontWeight: 800, margin: 0, color: "#8A4AF3" }}>
                          Configuración del Dúo Visual & Experiencia Olfativa
                        </h4>
                      </div>

                      <div className="dash-perfume-duo-grid">
                        <div className="form-group">
                          <label style={{ fontSize: "0.78rem", fontWeight: 700 }}>Inspiración / Referencia Original</label>
                          <input 
                            type="text"
                            className="form-control"
                            placeholder="Ej. Sauvage - Dior / Baccarat Rouge 540"
                            value={prodForm.perfumeInspiration}
                            onChange={e => setProdForm({ ...prodForm, perfumeInspiration: e.target.value })}
                          />
                        </div>

                        <div className="form-group">
                          <label style={{ fontSize: "0.78rem", fontWeight: 700, display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                            <span>💎 Foto del Frasco Original (Dúo Visual)</span>
                            {prodForm.perfumeOriginalImg && (
                              <button 
                                type="button" 
                                onClick={() => setProdForm(prev => ({ ...prev, perfumeOriginalImg: "" }))}
                                style={{ background: "none", border: "none", color: "#EF4444", fontSize: "0.72rem", cursor: "pointer", fontWeight: 600 }}
                              >
                                Quitar foto
                              </button>
                            )}
                          </label>
                          <div style={{ display: "flex", alignItems: "center", gap: "12px", background: "var(--bg-card)", border: "1px solid var(--border-color)", padding: "10px 12px", borderRadius: "10px" }}>
                            {prodForm.perfumeOriginalImg ? (
                              <div style={{ width: "48px", height: "48px", borderRadius: "8px", overflow: "hidden", border: "1.5px solid var(--gold-primary)", flexShrink: 0, background: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                <img src={prodForm.perfumeOriginalImg} alt="Frasco Original" style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }} />
                              </div>
                            ) : (
                              <div style={{ width: "48px", height: "48px", borderRadius: "8px", border: "1.5px dashed var(--border-color)", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)" }}>
                                <i className="fa-solid fa-wine-bottle" style={{ fontSize: "1.2rem" }}></i>
                              </div>
                            )}
                            <div style={{ flex: 1 }}>
                              <label className="btn-outline-gold" style={{ padding: "0.45rem 0.9rem", borderRadius: "8px", fontSize: "0.78rem", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "6px" }}>
                                <i className={uploadingOrigImg ? "fa-solid fa-spinner fa-spin" : "fa-solid fa-upload"}></i>
                                {uploadingOrigImg ? "Subiendo..." : prodForm.perfumeOriginalImg ? "Cambiar Frasco" : "Subir Frasco Original"}
                                <input 
                                  type="file"
                                  accept="image/*"
                                  style={{ display: "none" }}
                                  disabled={uploadingOrigImg}
                                  onChange={async (e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                      setUploadingOrigImg(true);
                                      const url = await uploadImage(file);
                                      setUploadingOrigImg(false);
                                      if (url) setProdForm(prev => ({ ...prev, perfumeOriginalImg: url }));
                                    }
                                  }}
                                />
                              </label>
                              <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginTop: "4px" }}>
                                Sube la foto del perfume inspirador (JPG, PNG)
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="dash-perfume-specs-grid">
                        <div className="form-group">
                          <label style={{ fontSize: "0.78rem", fontWeight: 700 }}>Género</label>
                          <select 
                            className="form-control"
                            value={prodForm.perfumeGender}
                            onChange={e => setProdForm({ ...prodForm, perfumeGender: e.target.value })}
                          >
                            <option value="Unisex">Unisex</option>
                            <option value="Hombre">Hombre (Masculino)</option>
                            <option value="Mujer">Mujer (Femenino)</option>
                          </select>
                        </div>

                        <div className="form-group">
                          <label style={{ fontSize: "0.78rem", fontWeight: 700 }}>Concentración</label>
                          <select 
                            className="form-control"
                            value={prodForm.perfumeConcentration}
                            onChange={e => setProdForm({ ...prodForm, perfumeConcentration: e.target.value })}
                          >
                            <option value="">Sin especificar</option>
                            <option value="Extrait de Parfum">Extrait de Parfum</option>
                            <option value="Eau de Parfum">Eau de Parfum (EDP)</option>
                            <option value="Eau de Toilette">Eau de Toilette (EDT)</option>
                          </select>
                        </div>

                        <div className="form-group">
                          <label style={{ fontSize: "0.78rem", fontWeight: 700, marginBottom: "4px", display: "block" }}>Mililitros / Tamaño</label>
                          <div style={{ display: "flex", gap: "6px" }}>
                            {["30 ml", "50 ml", "100 ml"].map(mlChip => (
                              <button
                                key={mlChip}
                                type="button"
                                onClick={() => setProdForm(prev => ({ ...prev, perfumeMl: mlChip, presentation: mlChip }))}
                                style={{
                                  flex: 1,
                                  fontSize: "0.78rem",
                                  padding: "6px 4px",
                                  borderRadius: "8px",
                                  border: (prodForm.perfumeMl === mlChip || prodForm.presentation === mlChip) ? "2px solid #8A4AF3" : "1px solid var(--border-color)",
                                  background: (prodForm.perfumeMl === mlChip || prodForm.presentation === mlChip) ? "rgba(138,74,243,0.18)" : "var(--bg-input)",
                                  color: (prodForm.perfumeMl === mlChip || prodForm.presentation === mlChip) ? "#8A4AF3" : "inherit",
                                  cursor: "pointer",
                                  fontWeight: (prodForm.perfumeMl === mlChip || prodForm.presentation === mlChip) ? 800 : 500,
                                  transition: "all 0.15s ease"
                                }}
                              >
                                {mlChip}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="form-group">
                        <label style={{ fontSize: "0.78rem", fontWeight: 700 }}>Notas Olfativas (Salida, Corazón, Fondo)</label>
                        <textarea 
                          rows="2"
                          className="form-control"
                          placeholder="Ej. Salida: Bergamota de Calabria. Corazón: Lavanda y Pimienta de Sichuan. Fondo: Ambroxan y Cedro."
                          value={prodForm.perfumeNotes}
                          onChange={e => setProdForm({ ...prodForm, perfumeNotes: e.target.value })}
                        />
                      </div>
                    </div>
                  )}

                  {/* ── IMAGEN DE TU CREACIÓN / FOTO DEL PRODUCTO ── */}
                  <div className="form-group" style={{ marginBottom: "1.2rem" }}>
                    <label style={{ fontSize: "0.82rem", fontWeight: 700, display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                      <span>📷 Foto de este Tamaño / Presentación {productType === "perfume" && "(Tu Frasco)"} *</span>
                      {prodForm.image && (
                        <button 
                          type="button" 
                          onClick={() => setProdForm(prev => ({ ...prev, image: "" }))}
                          style={{ background: "none", border: "none", color: "#EF4444", fontSize: "0.72rem", cursor: "pointer", fontWeight: 600 }}
                        >
                          Quitar foto
                        </button>
                      )}
                    </label>
                    <div style={{ fontSize: "0.73rem", color: "var(--text-gold)", marginBottom: "8px", display: "flex", alignItems: "center", gap: "6px" }}>
                      <i className="fa-solid fa-camera-retro"></i>
                      <span>Cada tamaño tiene su propia imagen de empaque o frasco. Puedes subir la foto correspondiente a esta presentación.</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "14px", background: "var(--bg-card)", border: "1px solid var(--border-color)", padding: "12px 14px", borderRadius: "12px" }}>
                      {prodForm.image ? (
                        <div style={{ width: "64px", height: "64px", borderRadius: "10px", overflow: "hidden", border: "2px solid var(--gold-primary)", flexShrink: 0, background: prodForm.imgBgColor || "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <img src={prodForm.image} alt="Producto" style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }} />
                        </div>
                      ) : (
                        <div style={{ width: "64px", height: "64px", borderRadius: "10px", border: "2px dashed var(--border-color)", flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "var(--text-muted)", gap: "4px" }}>
                          <i className="fa-solid fa-camera" style={{ fontSize: "1.3rem" }}></i>
                          <span style={{ fontSize: "0.65rem" }}>Sin foto</span>
                        </div>
                      )}
                      <div style={{ flex: 1 }}>
                        <label className="btn-gold" style={{ padding: "0.55rem 1.1rem", borderRadius: "8px", fontSize: "0.82rem", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "8px", width: "fit-content" }}>
                          <i className={uploadingProdImg ? "fa-solid fa-spinner fa-spin" : "fa-solid fa-upload"}></i>
                          {uploadingProdImg ? "Subiendo Foto..." : prodForm.image ? "Cambiar Foto de Producto" : "Subir Foto de Producto"}
                          <input 
                            type="file"
                            accept="image/*"
                            style={{ display: "none" }}
                            disabled={uploadingProdImg}
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                setUploadingProdImg(true);
                                const url = await uploadImage(file);
                                setUploadingProdImg(false);
                                if (url) setProdForm(prev => ({ ...prev, image: url }));
                              }
                            }}
                          />
                        </label>
                        <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: "5px" }}>
                          Sube la foto directamente desde tu dispositivo (JPG, PNG, WEBP)
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* ── ACORDEÓN DE DETALLES Y OPCIONES AVANZADAS DE PRODUCTO ── */}
                  <div style={{ borderTop: "1px dashed var(--border-color)", paddingTop: "10px", marginBottom: "1.5rem" }}>
                    <div 
                      onClick={() => setIsAdvancedProdOpen(!isAdvancedProdOpen)}
                      style={{ display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer", color: "var(--text-muted)", fontSize: "0.82rem", fontWeight: 700 }}
                    >
                      <span>⚙️ Opciones Avanzadas (Descuento Aourum, Descripción Larga)</span>
                      <i className={`fa-solid fa-chevron-${isAdvancedProdOpen ? "up" : "down"}`}></i>
                    </div>

                    {isAdvancedProdOpen && (
                      <div style={{ marginTop: "10px", display: "grid", gridTemplateColumns: "1fr", gap: "10px" }}>
                        <div className="form-group">
                          <label style={{ fontSize: "0.78rem", fontWeight: 700 }}>Precio Oferta Aourum (Opcional)</label>
                          <input 
                            type="number"
                            step="0.01"
                            className="form-control"
                            placeholder="Ej. Precio especial para miembros"
                            value={prodForm.priceAourum}
                            onChange={e => setProdForm({ ...prodForm, priceAourum: e.target.value })}
                          />
                        </div>

                        <div className="form-group">
                          <label style={{ fontSize: "0.78rem", fontWeight: 700 }}>Descripción Detallada / Historia</label>
                          <textarea 
                            rows="2"
                            className="form-control"
                            placeholder="Detalles sobre elaboración, origen o garantía..."
                            value={prodForm.description}
                            onChange={e => setProdForm({ ...prodForm, description: e.target.value })}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  </div>

                  {/* Botones de Envío Pinned en Footer */}
                  <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", padding: "1rem 1.6rem", borderTop: "1px solid var(--border-color)", background: "var(--bg-card)", flexShrink: 0 }}>
                    <button 
                      type="button"
                      onClick={() => setShowProductModal(false)}
                      className="btn-outline-gold"
                      style={{ padding: "0.6rem 1.4rem", borderRadius: "10px", fontSize: "0.88rem" }}
                    >
                      Cancelar
                    </button>
                    <button 
                      type="submit"
                      className="btn-gold"
                      disabled={submittingProd}
                      style={{ padding: "0.6rem 1.8rem", borderRadius: "10px", fontSize: "0.88rem", fontWeight: 700 }}
                    >
                      {submittingProd ? "Guardando..." : (editingProductId ? "Guardar Cambios" : "✨ Publicar Ítem")}
                    </button>
                  </div>
                </form>
              </div>
            </div>,
            document.body
          )}
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════════════
          TAB 4: MI PERFIL PERSONAL (RÁPIDO Y CÓMODO)
          ═════════════════════════════════════════════════════════════════════ */}
      {/* ═════════════════════════════════════════════════════════════════════
          TAB 4: PROFILE DASHBOARD · PERFIL & PREFERENCIAS
          ═════════════════════════════════════════════════════════════════════ */}
      {activeTab === "perfil" && (
        <div className="fade-in" style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          
          {/* Header del Profile Dashboard */}
          <div className="glass-panel" style={{ padding: "1.8rem 2rem", borderRadius: "20px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <span style={{ fontSize: "1.5rem" }}>👤</span>
                <h2 style={{ fontSize: "1.4rem", fontWeight: 800, margin: 0 }}>
                  Profile Dashboard · Editar Perfil & Preferencias
                </h2>
              </div>
              <p style={{ color: "var(--text-muted)", fontSize: "0.86rem", margin: "4px 0 0" }}>
                Configura todos tus datos personales, portada, foto, color temático, fondo y cuentas vinculadas desde un solo lugar.
              </p>
            </div>

            <button 
              type="button"
              onClick={handleSaveProfile}
              className="btn-gold"
              disabled={savingProfile}
              style={{ padding: "0.7rem 1.8rem", borderRadius: "10px", fontSize: "0.92rem", fontWeight: 700, display: "flex", alignItems: "center", gap: "8px" }}
            >
              {savingProfile ? (
                <><i className="fa-solid fa-spinner fa-spin"></i> Guardando...</>
              ) : (
                <><i className="fa-solid fa-floppy-disk"></i> Guardar Perfil & Preferencias</>
              )}
            </button>
          </div>

          {/* ── LIVE PREVIEW INTERACTIVO DEL PERFIL ────────────────────────── */}
          <div className="glass-panel" style={{ padding: "1.5rem", borderRadius: "20px", overflow: "hidden" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <span style={{ fontSize: "0.82rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--text-gold)" }}>
                ✨ Vista Previa en Vivo de tu Perfil
              </span>
              <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                Así lo verán los visitantes en <code style={{ color: "var(--text-gold)" }}>/people/{profileForm.username || "usuario"}</code>
              </span>
            </div>

            <div style={{ 
              borderRadius: "16px", 
              border: "1px solid var(--border-color)", 
              overflow: "hidden", 
              background: profileForm.customBgColor || "#FAF9F0",
              boxShadow: "0 6px 20px rgba(0,0,0,0.06)"
            }}>
              {/* Banner preview */}
              <div style={{ 
                height: "120px", 
                width: "100%", 
                background: profileForm.banner ? `url(${profileForm.banner}) center/cover no-repeat` : `linear-gradient(135deg, ${profileForm.themeColor}55, ${profileForm.themeColor})`,
                position: "relative"
              }}>
                <div style={{ position: "absolute", bottom: "10px", right: "12px", background: "rgba(0,0,0,0.55)", backdropFilter: "blur(6px)", color: "#fff", padding: "3px 10px", borderRadius: "12px", fontSize: "0.72rem", fontWeight: 600 }}>
                  Fondo: {profileForm.bgStyle}
                </div>
              </div>

              {/* Contenido preview */}
              <div style={{ padding: "0 1.5rem 1.5rem", marginTop: "-45px", display: "flex", alignItems: "flex-end", gap: "1rem", flexWrap: "wrap" }}>
                <img 
                  src={profileForm.logo || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150"} 
                  alt="Avatar"
                  style={{ width: "90px", height: "90px", borderRadius: "50%", objectFit: "cover", border: `3.5px solid ${profileForm.themeColor}`, background: "#fff", boxShadow: "0 4px 12px rgba(0,0,0,0.15)" }}
                />
                <div style={{ flex: 1, paddingBottom: "4px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                    <h3 style={{ fontSize: "1.35rem", fontWeight: 800, margin: 0, color: "#1C1C1E" }}>
                      {profileForm.name || "Tu Nombre"} {profileForm.lastName || ""}
                    </h3>
                    {profileForm.occupation && (
                      <span style={{ fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: profileForm.themeColor, background: `${profileForm.themeColor}18`, border: `1px solid ${profileForm.themeColor}40`, padding: "2px 8px", borderRadius: "14px" }}>
                        {profileForm.occupation}
                      </span>
                    )}
                  </div>
                  {profileForm.tagline && (
                    <p style={{ fontSize: "0.85rem", color: "#666", fontStyle: "italic", margin: "4px 0 0" }}>
                      &ldquo;{profileForm.tagline}&rdquo;
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Formulario Unificado de Perfil y Preferencias */}
          <form onSubmit={handleSaveProfile} style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            
            {/* ── SECCIÓN 1: DATOS PERSONALES & CONTACTO ──────────────────────── */}
            <div className="glass-panel" style={{ padding: "1.8rem 2rem", borderRadius: "20px" }}>
              <h3 style={{ fontSize: "1.15rem", fontWeight: 800, marginBottom: "0.4rem", display: "flex", alignItems: "center", gap: "8px" }}>
                <i className="fa-solid fa-address-card" style={{ color: "var(--gold-primary)" }}></i> 1. Identidad & Datos Personales
              </h3>
              <p style={{ color: "var(--text-muted)", fontSize: "0.82rem", marginBottom: "1.5rem" }}>
                Información de contacto, ocupación y biografía pública.
              </p>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 260px), 1fr))", gap: "16px", marginBottom: "1.5rem" }}>
                <div className="form-group">
                  <label style={{ fontSize: "0.82rem", fontWeight: 700 }}>Nombre *</label>
                  <input 
                    type="text"
                    className="form-control"
                    value={profileForm.name}
                    onChange={e => setProfileForm({ ...profileForm, name: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label style={{ fontSize: "0.82rem", fontWeight: 700 }}>Apellidos</label>
                  <input 
                    type="text"
                    className="form-control"
                    value={profileForm.lastName}
                    onChange={e => setProfileForm({ ...profileForm, lastName: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label style={{ fontSize: "0.82rem", fontWeight: 700 }}>Nombre de Usuario (@username)</label>
                  <input 
                    type="text"
                    className="form-control"
                    value={profileForm.username}
                    onChange={e => setProfileForm({ ...profileForm, username: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "") })}
                  />
                </div>

                <div className="form-group">
                  <label style={{ fontSize: "0.82rem", fontWeight: 700 }}>Ocupación / Profesión</label>
                  <input 
                    type="text"
                    className="form-control"
                    placeholder="Ej. Perfumista, Artesano, Chef, Músico"
                    value={profileForm.occupation}
                    onChange={e => setProfileForm({ ...profileForm, occupation: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label style={{ fontSize: "0.82rem", fontWeight: 700 }}>Ciudad</label>
                  <input 
                    type="text"
                    className="form-control"
                    placeholder="Ej. Arequipa"
                    value={profileForm.city}
                    onChange={e => setProfileForm({ ...profileForm, city: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label style={{ fontSize: "0.82rem", fontWeight: 700 }}>Intereses y Etiquetas (separados por coma)</label>
                  <input 
                    type="text"
                    className="form-control"
                    placeholder="Ej. Perfumería, Gastronomía, Moda, Arte"
                    value={profileForm.interests}
                    onChange={e => setProfileForm({ ...profileForm, interests: e.target.value })}
                  />
                </div>

                <div className="form-group" style={{ gridColumn: "1 / -1" }}>
                  <label style={{ fontSize: "0.82rem", fontWeight: 700 }}>Biografía / Propuesta Personal</label>
                  <textarea 
                    rows="3"
                    className="form-control"
                    placeholder="Cuéntale a la comunidad quién eres y qué te apasiona..."
                    value={profileForm.bio}
                    onChange={e => setProfileForm({ ...profileForm, bio: e.target.value })}
                  />
                </div>
              </div>

              {/* Redes Sociales Personales */}
              <div style={{ marginTop: "1rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.8rem", flexWrap: "wrap", gap: "6px" }}>
                  <h4 style={{ fontSize: "0.92rem", fontWeight: 800, margin: 0, color: "var(--text-gold)", display: "flex", alignItems: "center", gap: "8px" }}>
                    <i className="fa-solid fa-globe"></i> Redes Sociales Personales & Enlaces
                  </h4>
                  <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>
                    🔗 Pega el enlace web completo (URL)
                  </span>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "12px" }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label style={{ fontSize: "0.76rem", fontWeight: 700, display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px" }}>
                      <i className="fa-brands fa-instagram" style={{ color: "#E1306C" }}></i> Instagram (Link completo)
                    </label>
                    <input 
                      type="url"
                      className="form-control"
                      placeholder="https://instagram.com/tu_usuario"
                      value={profileForm.instagram}
                      onChange={e => setProfileForm({ ...profileForm, instagram: e.target.value })}
                      onBlur={e => setProfileForm(prev => ({ ...prev, instagram: ensureFullSocialUrl(e.target.value, "instagram") }))}
                    />
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label style={{ fontSize: "0.76rem", fontWeight: 700, display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px" }}>
                      <i className="fa-brands fa-tiktok" style={{ color: "var(--text-primary)" }}></i> TikTok (Link completo)
                    </label>
                    <input 
                      type="url"
                      className="form-control"
                      placeholder="https://tiktok.com/@tu_usuario"
                      value={profileForm.tiktok}
                      onChange={e => setProfileForm({ ...profileForm, tiktok: e.target.value })}
                      onBlur={e => setProfileForm(prev => ({ ...prev, tiktok: ensureFullSocialUrl(e.target.value, "tiktok") }))}
                    />
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label style={{ fontSize: "0.76rem", fontWeight: 700, display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px" }}>
                      <i className="fa-brands fa-facebook" style={{ color: "#1877F2" }}></i> Facebook (Link completo)
                    </label>
                    <input 
                      type="url"
                      className="form-control"
                      placeholder="https://facebook.com/tu_perfil"
                      value={profileForm.facebook}
                      onChange={e => setProfileForm({ ...profileForm, facebook: e.target.value })}
                      onBlur={e => setProfileForm(prev => ({ ...prev, facebook: ensureFullSocialUrl(e.target.value, "facebook") }))}
                    />
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label style={{ fontSize: "0.76rem", fontWeight: 700, display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px" }}>
                      <i className="fa-solid fa-link" style={{ color: "var(--gold-primary)" }}></i> Sitio Web / Portafolio
                    </label>
                    <input 
                      type="url"
                      className="form-control"
                      placeholder="https://tuweb.com"
                      value={profileForm.website}
                      onChange={e => setProfileForm({ ...profileForm, website: e.target.value })}
                      onBlur={e => setProfileForm(prev => ({ ...prev, website: ensureFullSocialUrl(e.target.value, "website") }))}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* ── SECCIÓN 2: PREFERENCIAS VISUALES & FONDO ────────────────────── */}
            <div className="glass-panel" style={{ padding: "1.8rem 2rem", borderRadius: "20px" }}>
              <h3 style={{ fontSize: "1.15rem", fontWeight: 800, marginBottom: "0.4rem", display: "flex", alignItems: "center", gap: "8px" }}>
                <i className="fa-solid fa-palette" style={{ color: "var(--gold-primary)" }}></i> 2. Preferencias Visuales & Personalización de Fondo
              </h3>
              <p style={{ color: "var(--text-muted)", fontSize: "0.82rem", marginBottom: "1.5rem" }}>
                Personaliza la estética, portada, color de acento y fondo de tu perfil público.
              </p>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 260px), 1fr))", gap: "16px", marginBottom: "1.5rem" }}>
                {/* Avatar */}
                <div className="form-group">
                  <label style={{ fontSize: "0.82rem", fontWeight: 700, display: "block", marginBottom: "8px" }}>
                    Foto de Perfil (Avatar)
                  </label>
                  <div style={{ display: "flex", alignItems: "center", gap: "14px", background: "var(--bg-card)", border: "1px solid var(--border-color)", padding: "12px 14px", borderRadius: "14px" }}>
                    <img 
                      src={profileForm.logo || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150"} 
                      alt="Avatar"
                      style={{ width: "54px", height: "54px", borderRadius: "50%", objectFit: "cover", border: `2.5px solid ${profileForm.themeColor}`, flexShrink: 0, boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}
                    />
                    <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                      <label className="btn-gold" style={{ padding: "0.5rem 1.1rem", borderRadius: "8px", fontSize: "0.82rem", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "6px", width: "fit-content" }}>
                        <i className={uploadingProfileLogo ? "fa-solid fa-spinner fa-spin" : "fa-solid fa-camera"}></i>
                        {uploadingProfileLogo ? "Subiendo Foto..." : "Subir Nueva Foto"}
                        <input 
                          type="file"
                          accept="image/*"
                          style={{ display: "none" }}
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              setUploadingProfileLogo(true);
                              const url = await uploadImage(file);
                              setUploadingProfileLogo(false);
                              if (url) setProfileForm(prev => ({ ...prev, logo: url }));
                            }
                          }}
                        />
                      </label>
                      <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>Sube tu foto directamente desde tu dispositivo</span>
                    </div>
                  </div>
                </div>

                {/* Banner */}
                <div className="form-group">
                  <label style={{ fontSize: "0.82rem", fontWeight: 700, display: "block", marginBottom: "8px" }}>
                    Foto de Portada (Banner)
                  </label>
                  <div style={{ display: "flex", alignItems: "center", gap: "14px", background: "var(--bg-card)", border: "1px solid var(--border-color)", padding: "12px 14px", borderRadius: "14px" }}>
                    <div style={{ 
                      width: "74px", 
                      height: "54px", 
                      borderRadius: "10px", 
                      overflow: "hidden", 
                      background: profileForm.banner ? `url(${profileForm.banner}) center/cover no-repeat` : `linear-gradient(135deg, ${profileForm.themeColor}55, ${profileForm.themeColor})`, 
                      flexShrink: 0,
                      border: "1px solid var(--border-color)"
                    }} />
                    <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                      <label className="btn-gold" style={{ padding: "0.5rem 1.1rem", borderRadius: "8px", fontSize: "0.82rem", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "6px", width: "fit-content" }}>
                        <i className={uploadingProfileBanner ? "fa-solid fa-spinner fa-spin" : "fa-solid fa-image"}></i>
                        {uploadingProfileBanner ? "Subiendo Portada..." : "Subir Nueva Portada"}
                        <input 
                          type="file"
                          accept="image/*"
                          style={{ display: "none" }}
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              setUploadingProfileBanner(true);
                              const url = await uploadImage(file);
                              setUploadingProfileBanner(false);
                              if (url) setProfileForm(prev => ({ ...prev, banner: url }));
                            }
                          }}
                        />
                      </label>
                      <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>Imagen panorámica para el fondo de tu perfil</span>
                    </div>
                  </div>
                </div>

                {/* Tagline */}
                <div className="form-group" style={{ gridColumn: "1 / -1" }}>
                  <label style={{ fontSize: "0.82rem", fontWeight: 700 }}>Lema o Frase Destacada (Tagline)</label>
                  <input 
                    type="text"
                    className="form-control"
                    placeholder="Ej. Creando experiencias sensoriales auténticas y exclusivas."
                    value={profileForm.tagline}
                    onChange={e => setProfileForm({ ...profileForm, tagline: e.target.value })}
                  />
                </div>
              </div>

              {/* Color Temático */}
              <div style={{ marginBottom: "1.8rem" }}>
                <label style={{ fontSize: "0.85rem", fontWeight: 700, display: "block", marginBottom: "8px" }}>
                  🎨 Color Temático Principal (Bordes, Botones y Destacados)
                </label>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap", marginBottom: "10px" }}>
                  <input 
                    type="color"
                    value={profileForm.themeColor}
                    onChange={e => setProfileForm({ ...profileForm, themeColor: e.target.value })}
                    style={{ width: "42px", height: "42px", borderRadius: "10px", border: "1px solid var(--border-color)", cursor: "pointer", padding: "2px" }}
                  />
                  <input 
                    type="text"
                    className="form-control"
                    value={profileForm.themeColor}
                    onChange={e => setProfileForm({ ...profileForm, themeColor: e.target.value })}
                    style={{ width: "120px", fontWeight: 700 }}
                  />
                </div>

                {/* 8 Paletas de colores rápidos */}
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                  {[
                    { name: "Dorado Imperial", color: "#D4AF37" },
                    { name: "Oro Rosa", color: "#E0A96D" },
                    { name: "Violeta Real", color: "#8A4AF3" },
                    { name: "Esmeralda", color: "#2D6A4F" },
                    { name: "Terracota", color: "#E76F51" },
                    { name: "Cian Cyber", color: "#00F2FE" },
                    { name: "Azul Marino", color: "#1E3A8A" },
                    { name: "Grafito Dark", color: "#27272A" }
                  ].map(c => (
                    <button
                      key={c.color}
                      type="button"
                      onClick={() => setProfileForm({ ...profileForm, themeColor: c.color })}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        background: profileForm.themeColor.toLowerCase() === c.color.toLowerCase() ? `${c.color}25` : "var(--bg-input)",
                        border: `1.5px solid ${profileForm.themeColor.toLowerCase() === c.color.toLowerCase() ? c.color : "var(--border-color)"}`,
                        borderRadius: "20px",
                        padding: "4px 12px",
                        fontSize: "0.78rem",
                        cursor: "pointer",
                        fontWeight: 600,
                        transition: "all 0.2s ease"
                      }}
                    >
                      <span style={{ width: "12px", height: "12px", borderRadius: "50%", background: c.color }}></span>
                      {c.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Estilo de Fondo de Perfil */}
              <div>
                <label style={{ fontSize: "0.85rem", fontWeight: 700, display: "block", marginBottom: "8px" }}>
                  🖼️ Estilo de Fondo de tu Perfil Público
                </label>
                <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginBottom: "14px" }}>
                  {[
                    { id: "solid", label: "Color Sólido", icon: "fa-fill-drip" },
                    { id: "gradient", label: "Gradiente Suave", icon: "fa-wand-magic-sparkles" },
                    { id: "mesh", label: "Malla Moderna", icon: "fa-braille" },
                    { id: "image", label: "Imagen de Fondo", icon: "fa-image" },
                    { id: "none", label: "Por Defecto", icon: "fa-ban" }
                  ].map(st => (
                    <button
                      key={st.id}
                      type="button"
                      onClick={() => setProfileForm({ ...profileForm, bgStyle: st.id })}
                      className={`btn-outline-gold ${profileForm.bgStyle === st.id ? "active" : ""}`}
                      style={{
                        padding: "0.5rem 1rem",
                        borderRadius: "12px",
                        fontSize: "0.82rem",
                        fontWeight: 700,
                        background: profileForm.bgStyle === st.id ? "var(--gold-gradient)" : "transparent",
                        color: profileForm.bgStyle === st.id ? "#1C1C1E" : undefined,
                        borderColor: profileForm.bgStyle === st.id ? "var(--gold-primary)" : "var(--border-color)"
                      }}
                    >
                      <i className={`fa-solid ${st.icon}`} style={{ marginRight: 6 }}></i>
                      {st.label}
                    </button>
                  ))}
                </div>

                {/* Sub-opciones de fondo */}
                {(profileForm.bgStyle === "solid" || profileForm.bgStyle === "gradient" || profileForm.bgStyle === "mesh") && (
                  <div style={{ background: "rgba(0,0,0,0.02)", border: "1px solid var(--border-color)", borderRadius: "12px", padding: "1rem", marginTop: "10px" }}>
                    <label style={{ fontSize: "0.8rem", fontWeight: 700, display: "block", marginBottom: "8px" }}>
                      Color de Fondo Personalizado
                    </label>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap", marginBottom: "10px" }}>
                      <input 
                        type="color"
                        value={profileForm.customBgColor}
                        onChange={e => setProfileForm({ ...profileForm, customBgColor: e.target.value })}
                        style={{ width: "36px", height: "36px", borderRadius: "8px", border: "1px solid var(--border-color)", cursor: "pointer" }}
                      />
                      <input 
                        type="text"
                        className="form-control"
                        value={profileForm.customBgColor}
                        onChange={e => setProfileForm({ ...profileForm, customBgColor: e.target.value })}
                        style={{ width: "120px", fontWeight: 700 }}
                      />
                    </div>
                    {/* Presets de fondo */}
                    <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                      {[
                        { name: "Marfil Claro", color: "#FAF9F0" },
                        { name: "Obsidiana Dark", color: "#0A0B0E" },
                        { name: "Menta Botánico", color: "#F4F7F4" },
                        { name: "Café Cálido", color: "#FCFBF7" },
                        { name: "Grafito Tech", color: "#0D1117" },
                        { name: "Blanco Puro", color: "#FFFFFF" }
                      ].map(bg => (
                        <button
                          key={bg.color}
                          type="button"
                          onClick={() => setProfileForm({ ...profileForm, customBgColor: bg.color })}
                          style={{
                            border: `1.5px solid ${profileForm.customBgColor.toLowerCase() === bg.color.toLowerCase() ? "var(--gold-primary)" : "var(--border-color)"}`,
                            borderRadius: "14px",
                            padding: "3px 10px",
                            fontSize: "0.75rem",
                            cursor: "pointer",
                            background: bg.color,
                            color: bg.color === "#0A0B0E" || bg.color === "#0D1117" ? "#fff" : "#1C1C1E",
                            fontWeight: 600
                          }}
                        >
                          {bg.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {profileForm.bgStyle === "image" && (
                  <div style={{ background: "rgba(0,0,0,0.02)", border: "1px solid var(--border-color)", borderRadius: "12px", padding: "1rem", marginTop: "10px" }}>
                    <label style={{ fontSize: "0.8rem", fontWeight: 700, display: "block", marginBottom: "8px" }}>
                      Imagen de Fondo Personalizada
                    </label>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      {profileForm.bgImage ? (
                        <img src={profileForm.bgImage} alt="Fondo" style={{ width: "64px", height: "44px", borderRadius: "8px", objectFit: "cover", border: "1px solid var(--border-color)" }} />
                      ) : (
                        <div style={{ width: "64px", height: "44px", borderRadius: "8px", background: "rgba(0,0,0,0.04)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.2rem" }}>
                          🖼️
                        </div>
                      )}
                      <label className="btn-gold" style={{ padding: "0.5rem 1.1rem", borderRadius: "8px", fontSize: "0.82rem", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "6px" }}>
                        <i className={uploadingProfileBg ? "fa-solid fa-spinner fa-spin" : "fa-solid fa-upload"}></i>
                        {uploadingProfileBg ? "Subiendo Fondo..." : (profileForm.bgImage ? "Cambiar Imagen de Fondo" : "Subir Imagen de Fondo")}
                        <input 
                          type="file"
                          accept="image/*"
                          style={{ display: "none" }}
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              setUploadingProfileBg(true);
                              const url = await uploadImage(file);
                              setUploadingProfileBg(false);
                              if (url) setProfileForm(prev => ({ ...prev, bgImage: url }));
                            }
                          }}
                        />
                      </label>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* ── SECCIÓN 3: MIS CUENTAS VINCULADAS ───────────────────────────── */}
            <div className="glass-panel" style={{ padding: "1.8rem 2rem", borderRadius: "20px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.2rem", flexWrap: "wrap", gap: "10px" }}>
                <div>
                  <h3 style={{ fontSize: "1.15rem", fontWeight: 800, margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
                    <i className="fa-solid fa-folder-open" style={{ color: "var(--gold-primary)" }}></i> 3. Mis Cuentas vinculadas
                  </h3>
                  <p style={{ color: "var(--text-muted)", fontSize: "0.82rem", margin: "4px 0 0" }}>
                    Marcas, productoras de ferias y bandas musicales asociadas a tu identidad.
                  </p>
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                {/* Marcas */}
                {myBrands.length > 0 && (
                  <div>
                    <h4 style={{ fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--text-muted)", fontWeight: 700, marginBottom: "0.8rem", display: "flex", alignItems: "center", gap: 6 }}>
                      <i className="fa-solid fa-store" style={{ color: "var(--gold-primary)" }}></i> Marcas ({myBrands.length})
                    </h4>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 260px), 1fr))", gap: "14px" }}>
                      {myBrands.map((b) => (
                        <div 
                          key={b.id}
                          style={{ 
                            display: "flex", 
                            alignItems: "center", 
                            justifyContent: "space-between",
                            background: "var(--bg-card)", 
                            border: "1px solid var(--border-color)", 
                            padding: "12px 16px", 
                            borderRadius: "14px",
                            gap: "12px",
                            boxShadow: "0 2px 8px rgba(0,0,0,0.03)"
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "center", gap: "12px", overflow: "hidden" }}>
                            <img 
                              src={b.logo || "https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=100"} 
                              alt={b.name} 
                              style={{ width: "42px", height: "42px", borderRadius: "10px", objectFit: "cover", flexShrink: 0 }} 
                            />
                            <div style={{ overflow: "hidden" }}>
                              <strong style={{ display: "block", fontSize: "0.92rem", color: "var(--text-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                {b.name}
                              </strong>
                              <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 600 }}>
                                {b.category || "Marca"}
                              </span>
                            </div>
                          </div>

                          <div style={{ display: "flex", gap: "6px", flexShrink: 0 }}>
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedBrandId(b.id);
                                handleTabChange("marcas");
                              }}
                              className="btn-outline-gold"
                              style={{ padding: "0.4rem 0.75rem", fontSize: "0.75rem", borderRadius: "8px" }}
                              title="Configurar Vitrina en Panel"
                            >
                              <i className="fa-solid fa-sliders"></i>
                            </button>
                            <Link 
                              href={`/brands/${b.slug || b.id}`}
                              target="_blank"
                              className="btn-gold"
                              style={{ padding: "0.4rem 0.75rem", fontSize: "0.75rem", borderRadius: "8px", textDecoration: "none" }}
                              title="Ver Vitrina Pública"
                            >
                              <i className="fa-solid fa-arrow-up-right-from-square"></i>
                            </Link>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Productoras */}
                {myOrganizers.length > 0 && (
                  <div>
                    <h4 style={{ fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--text-muted)", fontWeight: 700, marginBottom: "0.8rem", display: "flex", alignItems: "center", gap: 6 }}>
                      <i className="fa-solid fa-calendar-days" style={{ color: "var(--gold-primary)" }}></i> Productoras ({myOrganizers.length})
                    </h4>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 260px), 1fr))", gap: "14px" }}>
                      {myOrganizers.map((o) => (
                        <div 
                          key={o.id}
                          style={{ 
                            display: "flex", 
                            alignItems: "center", 
                            justifyContent: "space-between",
                            background: "var(--bg-card)", 
                            border: "1px solid var(--border-color)", 
                            padding: "12px 16px", 
                            borderRadius: "14px",
                            gap: "12px"
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "center", gap: "12px", overflow: "hidden" }}>
                            <img 
                              src={o.logo || "https://images.unsplash.com/photo-1511578314322-379afb476865?w=100"} 
                              alt={o.name} 
                              style={{ width: "42px", height: "42px", borderRadius: "10px", objectFit: "cover", flexShrink: 0 }} 
                            />
                            <div style={{ overflow: "hidden" }}>
                              <strong style={{ display: "block", fontSize: "0.92rem", color: "var(--text-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                {o.name}
                              </strong>
                              <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 600 }}>
                                Productora de Ferias
                              </span>
                            </div>
                          </div>

                          <Link 
                            href={`/organizers/${o.slug || o.id}`}
                            target="_blank"
                            className="btn-outline-gold"
                            style={{ padding: "0.4rem 0.75rem", fontSize: "0.75rem", borderRadius: "8px", textDecoration: "none" }}
                          >
                            <i className="fa-solid fa-arrow-up-right-from-square"></i>
                          </Link>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Bandas */}
                {myBands.length > 0 && (
                  <div>
                    <h4 style={{ fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--text-muted)", fontWeight: 700, marginBottom: "0.8rem", display: "flex", alignItems: "center", gap: 6 }}>
                      <i className="fa-solid fa-guitar" style={{ color: "var(--gold-primary)" }}></i> Bandas ({myBands.length})
                    </h4>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 260px), 1fr))", gap: "14px" }}>
                      {myBands.map((b) => (
                        <div 
                          key={b.id}
                          style={{ 
                            display: "flex", 
                            alignItems: "center", 
                            justifyContent: "space-between",
                            background: "var(--bg-card)", 
                            border: "1px solid var(--border-color)", 
                            padding: "12px 16px", 
                            borderRadius: "14px",
                            gap: "12px"
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "center", gap: "12px", overflow: "hidden" }}>
                            <img 
                              src={b.image || "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=100"} 
                              alt={b.name} 
                              style={{ width: "42px", height: "42px", borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} 
                            />
                            <div style={{ overflow: "hidden" }}>
                              <strong style={{ display: "block", fontSize: "0.92rem", color: "var(--text-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                {b.name}
                              </strong>
                              <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 600 }}>
                                {b.genre || "Banda"}
                              </span>
                            </div>
                          </div>

                          <Link 
                            href={`/bands/${b.slug || b.id}`}
                            target="_blank"
                            className="btn-outline-gold"
                            style={{ padding: "0.4rem 0.75rem", fontSize: "0.75rem", borderRadius: "8px", textDecoration: "none" }}
                          >
                            <i className="fa-solid fa-arrow-up-right-from-square"></i>
                          </Link>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {myBrands.length === 0 && myOrganizers.length === 0 && myBands.length === 0 && (
                  <div style={{ textAlign: "center", padding: "2rem 1rem", background: "rgba(0,0,0,0.02)", borderRadius: "14px", border: "1px dashed var(--border-color)" }}>
                    <i className="fa-solid fa-folder-plus" style={{ fontSize: "2rem", color: "var(--gold-primary)", marginBottom: "8px" }}></i>
                    <h4 style={{ fontSize: "1rem", fontWeight: 700, margin: 0 }}>Aún no tienes proyectos registrados</h4>
                    <p style={{ color: "var(--text-muted)", fontSize: "0.82rem", margin: "4px 0 14px" }}>
                      ¡Crea tu marca, productora o banda a continuación para comenzar a publicar vitrinas y productos!
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* ── SECCIÓN 4: REGISTRAR PROYECTO ───────────────────────────────── */}
            <div className="glass-panel" style={{ padding: "1.8rem 2rem", borderRadius: "20px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.2rem", flexWrap: "wrap", gap: "10px" }}>
                <div>
                  <h3 style={{ fontSize: "1.15rem", fontWeight: 800, margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
                    <i className="fa-solid fa-plus-circle" style={{ color: "var(--gold-primary)" }}></i> 4. Registrar Nuevo Proyecto
                  </h3>
                  <p style={{ color: "var(--text-muted)", fontSize: "0.82rem", margin: "4px 0 0" }}>
                    Lanza una nueva entidad en AOURUM con su propia vitrina y productos en un instante.
                  </p>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "14px" }}>
                <button 
                  type="button"
                  onClick={() => { 
                    if (setRegType) setRegType("brand"); 
                    if (setShowRegModal) setShowRegModal(true); 
                  }} 
                  className="btn-outline-gold"
                  style={{ 
                    padding: "1.2rem", 
                    borderRadius: "14px", 
                    display: "flex", 
                    flexDirection: "column", 
                    alignItems: "center", 
                    gap: "8px", 
                    textAlign: "center",
                    cursor: "pointer",
                    transition: "var(--transition-smooth)"
                  }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = "var(--gold-primary)"}
                  onMouseLeave={e => e.currentTarget.style.borderColor = "var(--border-color)"}
                >
                  <span style={{ fontSize: "1.8rem" }}>🏪</span>
                  <strong style={{ fontSize: "0.95rem" }}>Crear Marca</strong>
                  <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Vitrina comercial, catálogo y ventas por WhatsApp</span>
                </button>

                <button 
                  type="button"
                  onClick={() => { 
                    if (setRegType) setRegType("organizer"); 
                    if (setShowRegModal) setShowRegModal(true); 
                  }} 
                  className="btn-outline-gold"
                  style={{ 
                    padding: "1.2rem", 
                    borderRadius: "14px", 
                    display: "flex", 
                    flexDirection: "column", 
                    alignItems: "center", 
                    gap: "8px", 
                    textAlign: "center",
                    cursor: "pointer",
                    transition: "var(--transition-smooth)"
                  }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = "var(--gold-primary)"}
                  onMouseLeave={e => e.currentTarget.style.borderColor = "var(--border-color)"}
                >
                  <span style={{ fontSize: "1.8rem" }}>📅</span>
                  <strong style={{ fontSize: "0.95rem" }}>Crear Productora</strong>
                  <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Organización de ferias, convocatorias y stands</span>
                </button>

                <button 
                  type="button"
                  onClick={() => { 
                    if (setRegType) setRegType("band"); 
                    if (setShowRegModal) setShowRegModal(true); 
                  }} 
                  className="btn-outline-gold"
                  style={{ 
                    padding: "1.2rem", 
                    borderRadius: "14px", 
                    display: "flex", 
                    flexDirection: "column", 
                    alignItems: "center", 
                    gap: "8px", 
                    textAlign: "center",
                    cursor: "pointer",
                    transition: "var(--transition-smooth)"
                  }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = "var(--gold-primary)"}
                  onMouseLeave={e => e.currentTarget.style.borderColor = "var(--border-color)"}
                >
                  <span style={{ fontSize: "1.8rem" }}>🎸</span>
                  <strong style={{ fontSize: "0.95rem" }}>Crear Banda</strong>
                  <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Perfil musical, integrantes, canciones y presentaciones</span>
                </button>
              </div>
            </div>

            {/* Botón de Guardado Inferior */}
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "10px" }}>
              <button 
                type="submit"
                className="btn-gold"
                disabled={savingProfile}
                style={{ padding: "0.75rem 2.4rem", borderRadius: "12px", fontSize: "0.95rem", fontWeight: 700, display: "flex", alignItems: "center", gap: "8px" }}
              >
                {savingProfile ? (
                  <><i className="fa-solid fa-spinner fa-spin"></i> Guardando Cambios...</>
                ) : (
                  <><i className="fa-solid fa-check"></i> 💾 Guardar Todo el Perfil y Preferencias</>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════════════
          TAB 5: SEGURIDAD Y CUENTA
          ═════════════════════════════════════════════════════════════════════ */}
      {activeTab === "seguridad" && (
        <div className="fade-in" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 280px), 1fr))", gap: "20px" }}>
          {/* Cambiar Contraseña */}
          <div className="glass-panel" style={{ padding: "2rem", borderRadius: "20px" }}>
            <h3 style={{ fontSize: "1.2rem", fontWeight: 800, marginBottom: "0.4rem" }}>
              🔒 Cambiar Contraseña
            </h3>
            <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginBottom: "1.5rem" }}>
              Actualiza tu clave de acceso regularmente para mantener segura tu cuenta.
            </p>

            <form onSubmit={handleChangePasswordSubmit}>
              <div className="form-group" style={{ marginBottom: "1rem" }}>
                <label style={{ fontSize: "0.82rem", fontWeight: 700 }}>Contraseña Actual</label>
                <input 
                  type="password"
                  className="form-control"
                  value={securityPassword.current}
                  onChange={e => setSecurityPassword({ ...securityPassword, current: e.target.value })}
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: "1rem" }}>
                <label style={{ fontSize: "0.82rem", fontWeight: 700 }}>Nueva Contraseña (mínimo 6 caracteres)</label>
                <input 
                  type="password"
                  className="form-control"
                  value={securityPassword.newPass}
                  onChange={e => setSecurityPassword({ ...securityPassword, newPass: e.target.value })}
                  required
                  minLength={6}
                />
              </div>

              <div className="form-group" style={{ marginBottom: "1.5rem" }}>
                <label style={{ fontSize: "0.82rem", fontWeight: 700 }}>Confirmar Nueva Contraseña</label>
                <input 
                  type="password"
                  className="form-control"
                  value={securityPassword.confirm}
                  onChange={e => setSecurityPassword({ ...securityPassword, confirm: e.target.value })}
                  required
                />
              </div>

              <button 
                type="submit"
                className="btn-gold"
                disabled={securityLoading}
                style={{ width: "100%", padding: "0.65rem", borderRadius: "10px", fontSize: "0.9rem", fontWeight: 700 }}
              >
                {securityLoading ? "Actualizando..." : "Actualizar Contraseña"}
              </button>
            </form>
          </div>

          {/* Cambiar Correo Electrónico & Sesión */}
          <div className="glass-panel" style={{ padding: "2rem", borderRadius: "20px" }}>
            <h3 style={{ fontSize: "1.2rem", fontWeight: 800, marginBottom: "0.4rem" }}>
              ✉️ Correo Electrónico
            </h3>
            <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginBottom: "1.5rem" }}>
              Modifica la dirección de correo con la que inicias sesión.
            </p>

            <form onSubmit={handleChangeEmailSubmit}>
              <div className="form-group" style={{ marginBottom: "1rem" }}>
                <label style={{ fontSize: "0.82rem", fontWeight: 700 }}>Nuevo Correo Electrónico</label>
                <input 
                  type="email"
                  className="form-control"
                  placeholder="nuevo@correo.com"
                  value={securityEmail.newEmail}
                  onChange={e => setSecurityEmail({ ...securityEmail, newEmail: e.target.value })}
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: "1.5rem" }}>
                <label style={{ fontSize: "0.82rem", fontWeight: 700 }}>Contraseña Actual para Confirmar</label>
                <input 
                  type="password"
                  className="form-control"
                  value={securityEmail.passwordConfirm}
                  onChange={e => setSecurityEmail({ ...securityEmail, passwordConfirm: e.target.value })}
                  required
                />
              </div>

              <button 
                type="submit"
                className="btn-outline-gold"
                disabled={securityLoading}
                style={{ width: "100%", padding: "0.65rem", borderRadius: "10px", fontSize: "0.9rem", fontWeight: 700 }}
              >
                {securityLoading ? "Procesando..." : "Actualizar Correo"}
              </button>
            </form>

            <hr style={{ border: 0, borderTop: "1px solid var(--border-color)", margin: "1.8rem 0" }} />

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <h5 style={{ fontSize: "0.95rem", fontWeight: 700, margin: 0 }}>Cerrar Sesión</h5>
                <p style={{ color: "var(--text-muted)", fontSize: "0.78rem", margin: "2px 0 0" }}>Finalizar sesión en este dispositivo</p>
              </div>
              <button 
                onClick={() => { logout(); router.push("/"); }}
                style={{ background: "transparent", border: "1px solid rgba(239,68,68,0.4)", color: "#EF4444", padding: "0.5rem 1.2rem", borderRadius: "8px", fontSize: "0.82rem", fontWeight: 700, cursor: "pointer" }}
              >
                <i className="fa-solid fa-right-from-bracket" style={{ marginRight: 6 }}></i> Salir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
