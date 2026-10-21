"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useApp } from "../../context/AppContext";

// ── 5 PLANTILLAS DE ESTILO INTELIGENTES EN 1 CLIC ─────────────────────────────
export const BRAND_STYLE_PRESETS = [
  {
    id: "dorado-luxury",
    name: "Dorado Imperial",
    tagline: "El sello de prestigio AOURUM",
    badge: "👑 Signature",
    description: "Paleta oro imperial, tarjetas con resplandor dorado y tipografía clásica editorial.",
    themeColor: "#D4AF37, #F3E5AB, #996515, #8B5CF6",
    colors: ["#D4AF37", "#F3E5AB", "#996515", "#8B5CF6"],
    customBgColor: "#FAF9F0",
    bgStyle: "solid",
    cardStyle: "luxury",
    fontFamily: "Cinzel",
    catalogDisplayMode: "auto",
    glowIntensity: 80,
    bannerOverlay: "gold",
    logoShape: "rounded"
  },
  {
    id: "alta-perfumeria",
    name: "Alta Perfumería",
    tagline: "Dúo Visual & Experiencia Olfativa",
    badge: "💎 Fragancias",
    description: "Activa el Dúo Visual (original + creación propia), pirámide olfativa y vitrina oscura de lujo.",
    themeColor: "#E0A96D, #8A4AF3, #F5D061, #12131C",
    colors: ["#E0A96D", "#8A4AF3", "#F5D061", "#12131C"],
    customBgColor: "#0A0B0E",
    bgStyle: "gradient",
    cardStyle: "glass",
    fontFamily: "Playfair Display",
    catalogDisplayMode: "perfumery",
    glowIntensity: 85,
    bannerOverlay: "dark",
    logoShape: "circle"
  },
  {
    id: "organico-botanico",
    name: "Orgánico & Botánico",
    tagline: "Frescura natural y sostenible",
    badge: "🌿 Sostenible",
    description: "Tonos verdes botánicos, tarjetas limpias sin artificios y tipografía moderna geométrica.",
    themeColor: "#2D6A4F, #52B788, #D8F3DC, #1B4332",
    colors: ["#2D6A4F", "#52B788", "#D8F3DC", "#1B4332"],
    customBgColor: "#F4F7F4",
    bgStyle: "solid",
    cardStyle: "solid",
    fontFamily: "Outfit",
    catalogDisplayMode: "grid",
    glowIntensity: 35,
    bannerOverlay: "none",
    logoShape: "rounded"
  },
  {
    id: "gastro-menu",
    name: "Gastro, Café & Menú",
    tagline: "Carta gourmet y platillos",
    badge: "🍽️ Sabores",
    description: "Modo Menú para restaurantes y cafés: platillos, porciones, notas de cata y tonos terracota cálidos.",
    themeColor: "#E76F51, #F4A261, #2A9D8F, #264653",
    colors: ["#E76F51", "#F4A261", "#2A9D8F", "#264653"],
    customBgColor: "#FCFBF7",
    bgStyle: "solid",
    cardStyle: "minimal",
    fontFamily: "Plus Jakarta Sans",
    catalogDisplayMode: "menu",
    glowIntensity: 45,
    bannerOverlay: "vignette",
    logoShape: "rounded"
  },
  {
    id: "minimalista-tech",
    name: "Minimalista Moderno",
    tagline: "Líneas puras y contraste contemporáneo",
    badge: "🖤 Vanguardia",
    description: "Fondo dark grafito con bordes nítidos outlined, tipografía Space Grotesk y acentos cian.",
    themeColor: "#00F2FE, #4FACFE, #0072FF, #0D1117",
    colors: ["#00F2FE", "#4FACFE", "#0072FF", "#0D1117"],
    customBgColor: "#0D1117",
    bgStyle: "mesh",
    cardStyle: "outlined",
    fontFamily: "Space Grotesk",
    catalogDisplayMode: "grid",
    glowIntensity: 65,
    bannerOverlay: "dark",
    logoShape: "square"
  }
];

// ── PLANTILLAS INTELIGENTES POR TIPO DE PRODUCTO ──────────────────────────────
export const PRODUCT_TYPE_TEMPLATES = [
  {
    id: "perfume",
    name: "Fragancia / Perfume",
    icon: "fa-spray-can-sparkles",
    badge: "💎 Dúo Visual",
    defaultCategory: "Alta Perfumería",
    description: "Para fragancias: frasco de referencia original, notas y pirámide olfativa."
  },
  {
    id: "gastro",
    name: "Plato / Café / Bebida",
    icon: "fa-utensils",
    badge: "🍽️ Menú & Carta",
    defaultCategory: "Gastronomía",
    description: "Para restaurantes, cafés y cocina: porciones, ingredientes y maridaje."
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
    badge: "🛠️ Servicios",
    defaultCategory: "Servicios",
    description: "Para sesiones, citas, clases, música o lecturas (stock ilimitado automático)."
  }
];

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export default function DashboardClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const {
    activePersonId,
    people,
    brands,
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
    parseDescription
  } = useApp();

  // Tab activo sincronizado con query param o "resumen" por defecto
  const tabParam = searchParams.get("tab") || "resumen";
  const brandIdParam = searchParams.get("brandId");

  const [activeTab, setActiveTab] = useState(tabParam);
  const [selectedBrandId, setSelectedBrandId] = useState(null);

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  // Acordeones para no agobiar al usuario con demasiadas opciones
  const [isAdvancedBrandOpen, setIsAdvancedBrandOpen] = useState(false);
  const [isAdvancedProdOpen, setIsAdvancedProdOpen] = useState(false);

  // Estados del Formulario de Marca
  const [savingBrand, setSavingBrand] = useState(false);
  const [selectedPresetId, setSelectedPresetId] = useState(null);
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
    c3: "#996515",
    c4: "#8B5CF6",
    // Diseño visual
    customBgColor: "#FAF9F0",
    bgStyle: "solid",
    bgImage: "",
    bgImageFit: "cover",
    banner: "",
    bannerOverlay: "none",
    cardStyle: "luxury",
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
    // Perfume
    perfumeInspiration: "",
    perfumeOriginalImg: "",
    perfumeGender: "Unisex",
    perfumeFamily: "Amaderado",
    perfumeConcentration: "50% Esencia Pura",
    perfumeMl: "50 ml",
    perfumeNotes: "",
    // Gastro
    gastroPortion: "",
    gastroIngredients: "",
    // General
    description: ""
  });

  // Estados del Perfil Personal
  const [savingProfile, setSavingProfile] = useState(false);
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
    if (!brands || brands.length === 0) return [];
    if (!currentPerson) return brands;
    const pId = Number(currentPerson.id);
    const pBrandIds = (currentPerson.brandIds || []).map(Number);
    const userBrands = brands.filter(b => {
      const isOwner = Number(b.personId) === pId || pBrandIds.includes(Number(b.id));
      const isCollab = Array.isArray(b.personIds) && b.personIds.map(Number).includes(pId);
      const isNamed = b.owner && currentPerson.name && (b.owner.toLowerCase().trim() === currentPerson.name.toLowerCase().trim());
      return isOwner || isCollab || isNamed;
    });
    return userBrands.length > 0 ? userBrands : brands;
  }, [currentPerson, brands]);

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
      c2: colors[1] || "#F3E5AB",
      c3: colors[2] || "#996515",
      c4: colors[3] || "#8B5CF6",
      customBgColor: bDesign.customBgColor || parsed.customBgColor || "#FAF9F0",
      bgStyle: bDesign.bgStyle || parsed.bgStyle || "solid",
      bgImage: bDesign.bgImage || parsed.bgImage || "",
      bgImageFit: bDesign.bgImageFit || "cover",
      banner: parsed.banner || "",
      bannerOverlay: bDesign.bannerOverlay || "none",
      cardStyle: bDesign.cardStyle || "luxury",
      fontFamily: bDesign.fontFamily || "Cinzel",
      catalogDisplayMode: b.catalogDisplayMode || bDesign.catalogDisplayMode || "auto",
      glowIntensity: bDesign.glowIntensity !== undefined ? bDesign.glowIntensity : 80,
      animations: bDesign.animations !== false,
      logoShape: bDesign.logoShape || "rounded",
      hasLocal: !!parsed.has_local,
      localAddress: parsed.local_address || "",
      localLat: parsed.local_lat !== undefined ? parsed.local_lat : -16.39889,
      localLng: parsed.local_lng !== undefined ? parsed.local_lng : -71.53694,
      instagram: parsed.instagram || "",
      facebook: parsed.facebook || "",
      tiktok: parsed.tiktok || "",
      website: parsed.website || ""
    });
  }, [selectedBrandId, brands, parseDescription]);

  // Cargar datos del perfil de usuario
  useEffect(() => {
    if (!currentPerson) return;
    const parsed = parseDescription ? parseDescription(currentPerson.description) : {};
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
      interests: currentPerson.interests || parsed.interests || "",
      instagram: parsed.instagram || "",
      facebook: parsed.facebook || "",
      tiktok: parsed.tiktok || "",
      website: parsed.website || ""
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

  // ── APLICAR PLANTILLA EN 1 CLIC ─────────────────────────────────────────────
  const applyPreset = (preset) => {
    setSelectedPresetId(preset.id);
    setBrandForm(prev => ({
      ...prev,
      c1: preset.colors[0],
      c2: preset.colors[1],
      c3: preset.colors[2],
      c4: preset.colors[3],
      customBgColor: preset.customBgColor,
      bgStyle: preset.bgStyle,
      cardStyle: preset.cardStyle,
      fontFamily: preset.fontFamily,
      catalogDisplayMode: preset.catalogDisplayMode,
      glowIntensity: preset.glowIntensity,
      bannerOverlay: preset.bannerOverlay,
      logoShape: preset.logoShape
    }));

    if (triggerNotification) {
      triggerNotification(true, `🎨 Plantilla "${preset.name}" seleccionada. Haz clic en "Guardar Estilo" para aplicarla.`);
    }
  };

  // ── GUARDAR MARCA (MODO RÁPIDO Y AVANZADO) ──────────────────────────────────
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

  // Abrir modal de nuevo producto con plantilla
  const handleOpenAddProduct = (type = "perfume") => {
    setProductType(type);
    setEditingProductId(null);
    const tmpl = PRODUCT_TYPE_TEMPLATES.find(t => t.id === type) || PRODUCT_TYPE_TEMPLATES[0];
    
    setProdForm({
      name: "",
      price: "",
      priceAourum: "",
      stock: type === "service" ? "99999" : "15",
      category: tmpl.defaultCategory,
      image: "",
      imgBgColor: "transparent",
      isVisible: true,
      perfumeInspiration: "",
      perfumeOriginalImg: "",
      perfumeGender: "Unisex",
      perfumeFamily: "Amaderado",
      perfumeConcentration: "50% Esencia Pura",
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

    const isFragrance = !!(origImgMatch || inspMatch || (prod.category && prod.category.toLowerCase().includes("perfum")));
    const isGastro = prod.category && (prod.category.toLowerCase().includes("gastro") || prod.category.toLowerCase().includes("comida"));
    
    setProductType(isFragrance ? "perfume" : isGastro ? "gastro" : prod.type === "service" ? "service" : "standard");
    
    // Remover corchetes del texto de notas
    const cleanNotes = desc.replace(/\[[^\]]+\]/g, "").trim();

    setProdForm({
      name: prod.name || "",
      price: prod.price || "",
      priceAourum: prod.priceAourum || prod.price_aourum || "",
      stock: prod.stock !== null ? String(prod.stock) : "",
      category: prod.category || "General",
      image: prod.image || "",
      imgBgColor: prod.imgBgColor || "transparent",
      isVisible: prod.isVisible !== false,
      perfumeInspiration: inspMatch ? inspMatch[1].trim() : "",
      perfumeOriginalImg: origImgMatch ? origImgMatch[1].trim() : "",
      perfumeGender: genderMatch ? genderMatch[1].trim() : "Unisex",
      perfumeFamily: prod.category || "Amaderado",
      perfumeConcentration: concMatch ? concMatch[1].trim() : "50% Esencia Pura",
      perfumeMl: mlMatch ? mlMatch[1].trim() : "50 ml",
      perfumeNotes: cleanNotes,
      gastroPortion: "",
      gastroIngredients: "",
      description: cleanNotes
    });
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
      finalDesc = `${tags.join(' ')}\n\n${prodForm.perfumeNotes.trim()}`.trim();
    } else if (productType === "gastro") {
      const tags = [];
      if (prodForm.gastroPortion.trim()) tags.push(`[Porción: ${prodForm.gastroPortion.trim()}]`);
      if (prodForm.gastroIngredients.trim()) tags.push(`[Ingredientes: ${prodForm.gastroIngredients.trim()}]`);
      finalDesc = `${tags.join(' ')}\n\n${prodForm.description.trim()}`.trim();
    }

    const payload = {
      id: editingProductId,
      brandId: Number(selectedBrandId),
      name: prodForm.name.trim(),
      category: prodForm.category || (productType === "perfume" ? "Alta Perfumería" : "General"),
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

  // Guardar Perfil Personal
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!profileForm.name.trim()) {
      triggerNotification(false, "El nombre es obligatorio.");
      return;
    }

    setSavingProfile(true);
    const descPayload = JSON.stringify({
      text: profileForm.bio,
      tagline: profileForm.tagline,
      instagram: profileForm.instagram,
      facebook: profileForm.facebook,
      tiktok: profileForm.tiktok,
      website: profileForm.website,
      banner: profileForm.banner
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
        triggerNotification(true, "✨ Tu perfil personal ha sido actualizado con éxito.");
        fetchData();
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
          <h2 style={{ fontSize: "1.6rem", fontWeight: 800, marginBottom: "0.8rem" }}>Centro de Configuración y Gestión</h2>
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

  const selectedBrand = myBrands.find(b => b.id === Number(selectedBrandId)) || null;

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
                Panel de Control de {currentPerson?.name || "Usuario"}
              </h1>
              <span style={{ fontSize: "0.72rem", background: "rgba(212,175,55,0.15)", color: "var(--text-gold)", border: "1px solid var(--gold-primary)", padding: "2px 8px", borderRadius: "10px", fontWeight: 700 }}>
                {myBrands.length > 0 ? "✨ Emprendedor" : "👤 Creador"}
              </span>
            </div>
            <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", margin: "4px 0 0" }}>
              Modifica todo tu ecosistema en pocos minutos con atajos rápidos y plantillas inteligentes.
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
        >
          <i className="fa-solid fa-bolt"></i> Resumen & Atajos
        </button>
        <button 
          className={`dashboard-tab-btn ${activeTab === "marcas" ? "active" : ""}`}
          onClick={() => handleTabChange("marcas")}
        >
          <i className="fa-solid fa-store"></i> Mis Marcas & Vitrinas ({myBrands.length})
        </button>
        <button 
          className={`dashboard-tab-btn ${activeTab === "productos" ? "active" : ""}`}
          onClick={() => handleTabChange("productos")}
        >
          <i className="fa-solid fa-bag-shopping"></i> Catálogo de Productos ({currentBrandProducts.length})
        </button>
        <button 
          className={`dashboard-tab-btn ${activeTab === "perfil" ? "active" : ""}`}
          onClick={() => handleTabChange("perfil")}
        >
          <i className="fa-solid fa-user-pen"></i> Mi Perfil Personal
        </button>
        <button 
          className={`dashboard-tab-btn ${activeTab === "seguridad" ? "active" : ""}`}
          onClick={() => handleTabChange("seguridad")}
        >
          <i className="fa-solid fa-shield-halved"></i> Seguridad & Cuenta
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

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "14px" }}>
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
                  Publica ropa, comida, accesorios o servicios en un formulario limpio y con control de stock.
                </p>
              </div>

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
                  <h4 style={{ fontSize: "0.95rem", fontWeight: 700, margin: 0 }}>Actualizar Mi Perfil</h4>
                </div>
                <p style={{ color: "var(--text-muted)", fontSize: "0.8rem", margin: 0, lineHeight: 1.4 }}>
                  Modifica tu biografía, ciudad, foto de perfil y enlaces de tus redes sociales.
                </p>
              </div>
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
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px", background: "var(--bg-card)", padding: "0.9rem 1.4rem", borderRadius: "16px", border: "1px solid var(--border-color)", marginBottom: "1.5rem", flexWrap: "wrap" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--text-muted)" }}>Marca a Gestionar:</span>
                <select 
                  value={selectedBrandId || ""}
                  onChange={(e) => setSelectedBrandId(Number(e.target.value))}
                  className="form-control"
                  style={{ maxWidth: "340px", fontWeight: 700, padding: "6px 12px" }}
                >
                  {myBrands.map(b => (
                    <option key={b.id} value={b.id}>{b.name} ({b.category || "General"})</option>
                  ))}
                </select>
              </div>

              {selectedBrand && (
                <div style={{ display: "flex", gap: "8px" }}>
                  <Link
                    href={`/brands/${selectedBrand.slug || selectedBrand.id}`}
                    target="_blank"
                    className="btn-outline-gold"
                    style={{ padding: "0.45rem 1rem", borderRadius: "8px", fontSize: "0.8rem", fontWeight: 700, display: "flex", alignItems: "center", gap: "6px" }}
                  >
                    <i className="fa-solid fa-arrow-up-right-from-square"></i> Ver Vitrina en Vivo
                  </Link>
                </div>
              )}
            </div>
          )}

          {/* ── SECCIÓN 1: MODO RÁPIDO: PLANTILLAS EN 1 CLIC ──────────────── */}
          <div className="glass-panel" style={{ padding: "1.8rem", borderRadius: "20px", marginBottom: "2rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
              <div>
                <span style={{ fontSize: "0.72rem", background: "var(--gold-gradient)", color: "#1C1C1E", fontWeight: 800, padding: "3px 9px", borderRadius: "10px", letterSpacing: "0.05em", textTransform: "uppercase" }}>
                  ⚡ Modo Rápido (En 5 Segundos)
                </span>
                <h2 style={{ fontSize: "1.4rem", fontWeight: 800, margin: "6px 0 2px", letterSpacing: "-0.01em" }}>
                  Plantillas de Estilo Inteligentes
                </h2>
                <p style={{ color: "var(--text-muted)", fontSize: "0.88rem", margin: 0 }}>
                  Elige una plantilla armonizada y toda tu vitrina adoptará colores, tipografía, tarjetas y modo de catálogo al instante.
                </p>
              </div>

              <button 
                type="button"
                onClick={handleSaveBrand}
                className="btn-gold"
                disabled={savingBrand}
                style={{ padding: "0.65rem 1.6rem", borderRadius: "10px", fontSize: "0.9rem", fontWeight: 700, display: "flex", alignItems: "center", gap: "8px" }}
              >
                <i className={savingBrand ? "fa-solid fa-spinner fa-spin" : "fa-solid fa-check"}></i>
                {savingBrand ? "Guardando..." : "💾 Guardar Estilo en Mi Marca"}
              </button>
            </div>

            {/* Grid de 5 Presets */}
            <div className="preset-grid">
              {BRAND_STYLE_PRESETS.map(preset => {
                const isSelected = selectedPresetId === preset.id || (
                  brandForm.cardStyle === preset.cardStyle && 
                  brandForm.fontFamily === preset.fontFamily &&
                  brandForm.catalogDisplayMode === preset.catalogDisplayMode
                );

                return (
                  <div 
                    key={preset.id}
                    className={`preset-card ${isSelected ? "active" : ""}`}
                    onClick={() => applyPreset(preset)}
                  >
                    <div>
                      <span style={{ fontSize: "0.7rem", fontWeight: 800, color: "var(--text-gold)" }}>{preset.badge}</span>
                      <h4 style={{ fontSize: "1.05rem", fontWeight: 800, margin: "4px 0 2px" }}>{preset.name}</h4>
                      <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontStyle: "italic", margin: "0 0 8px" }}>
                        &ldquo;{preset.tagline}&rdquo;
                      </p>

                      <div className="preset-color-dots">
                        {preset.colors.map((c, i) => (
                          <div key={i} className="preset-dot" style={{ background: c }} title={c} />
                        ))}
                      </div>

                      <p style={{ fontSize: "0.78rem", color: "var(--text-primary)", lineHeight: 1.35, margin: "6px 0 0" }}>
                        {preset.description}
                      </p>
                    </div>

                    <div style={{ marginTop: "12px", paddingTop: "8px", borderTop: "1px dashed var(--border-color)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>Fuente: <b>{preset.fontFamily}</b></span>
                      <span style={{ fontSize: "0.75rem", color: "var(--gold-primary)", fontWeight: 700 }}>
                        {isSelected ? "Seleccionada" : "Aplicar →"}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Vista Previa En Vivo del Estilo Seleccionado */}
            <div style={{ background: brandForm.customBgColor || "var(--bg-card)", border: "1.5px solid var(--border-color)", borderRadius: "16px", padding: "1.4rem", marginTop: "1.5rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", flexWrap: "wrap", gap: "8px" }}>
                <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                  👁️ Vista Previa en Vivo de tu Vitrina
                </span>
                <span style={{ fontSize: "0.75rem", background: "rgba(0,0,0,0.06)", padding: "3px 8px", borderRadius: "6px", fontFamily: brandForm.fontFamily }}>
                  Tipografía activa: <b>{brandForm.fontFamily}</b> · Tarjetas: <b>{brandForm.cardStyle}</b> · Modo: <b>{brandForm.catalogDisplayMode}</b>
                </span>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "1.2rem", flexWrap: "wrap" }}>
                <img 
                  src={brandForm.logo || "https://res.cloudinary.com/decklnx3p/image/upload/v1781055233/aourum/tqu58byx9bhfz1pq6l4v.png"} 
                  alt="Logo"
                  style={{ 
                    width: "56px", 
                    height: "56px", 
                    borderRadius: brandForm.logoShape === "square" ? "0px" : brandForm.logoShape === "rounded" ? "14px" : "50%",
                    objectFit: "cover",
                    border: `2px solid ${brandForm.c1}`
                  }}
                />
                <div style={{ flex: 1 }}>
                  <h3 style={{ fontSize: "1.25rem", fontWeight: 800, margin: 0, fontFamily: brandForm.fontFamily, color: "var(--text-primary)" }}>
                    {brandForm.name || "Nombre de tu Marca"}
                  </h3>
                  <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", margin: "2px 0 0" }}>
                    {brandForm.tagline ? `"${brandForm.tagline}"` : "Tu eslogan o categoría aparecerá aquí"}
                  </p>
                </div>
                <div style={{ display: "flex", gap: "6px" }}>
                  <span style={{ background: brandForm.c1, color: "#fff", padding: "4px 10px", borderRadius: "12px", fontSize: "0.72rem", fontWeight: 700 }}>
                    Color Principal
                  </span>
                  <span style={{ background: brandForm.c2, color: "#1C1C1E", padding: "4px 10px", borderRadius: "12px", fontSize: "0.72rem", fontWeight: 700 }}>
                    Acento
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* ── SECCIÓN 2: DATOS ESENCIALES (30 SEGUNDOS) ────────────────── */}
          <div className="glass-panel" style={{ padding: "1.8rem", borderRadius: "20px", marginBottom: "2rem" }}>
            <h3 style={{ fontSize: "1.2rem", fontWeight: 800, marginBottom: "0.4rem" }}>
              ⚡ Datos Esenciales de la Marca (Solo lo necesario)
            </h3>
            <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginBottom: "1.5rem" }}>
              Información clave que ven tus clientes para contactarte y comprar.
            </p>

            <form onSubmit={handleSaveBrand}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "16px" }}>
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
                  <h5 style={{ fontSize: "0.95rem", fontWeight: 800, marginBottom: "0.8rem", color: "var(--text-gold)" }}>
                    🎨 Paleta de Colores Manual
                  </h5>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "14px", marginBottom: "1.5rem" }}>
                    <div>
                      <label style={{ fontSize: "0.78rem", fontWeight: 700 }}>Color Principal (C1)</label>
                      <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                        <input type="color" value={brandForm.c1} onChange={e => setBrandForm({ ...brandForm, c1: e.target.value })} style={{ width: "38px", height: "38px", border: "none", cursor: "pointer", borderRadius: "6px" }} />
                        <input type="text" className="form-control" value={brandForm.c1} onChange={e => setBrandForm({ ...brandForm, c1: e.target.value })} />
                      </div>
                    </div>
                    <div>
                      <label style={{ fontSize: "0.78rem", fontWeight: 700 }}>Color Secundario (C2)</label>
                      <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                        <input type="color" value={brandForm.c2} onChange={e => setBrandForm({ ...brandForm, c2: e.target.value })} style={{ width: "38px", height: "38px", border: "none", cursor: "pointer", borderRadius: "6px" }} />
                        <input type="text" className="form-control" value={brandForm.c2} onChange={e => setBrandForm({ ...brandForm, c2: e.target.value })} />
                      </div>
                    </div>
                    <div>
                      <label style={{ fontSize: "0.78rem", fontWeight: 700 }}>Color de Acento (C3)</label>
                      <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                        <input type="color" value={brandForm.c3} onChange={e => setBrandForm({ ...brandForm, c3: e.target.value })} style={{ width: "38px", height: "38px", border: "none", cursor: "pointer", borderRadius: "6px" }} />
                        <input type="text" className="form-control" value={brandForm.c3} onChange={e => setBrandForm({ ...brandForm, c3: e.target.value })} />
                      </div>
                    </div>
                    <div>
                      <label style={{ fontSize: "0.78rem", fontWeight: 700 }}>Color de Fondo (C4)</label>
                      <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                        <input type="color" value={brandForm.c4} onChange={e => setBrandForm({ ...brandForm, c4: e.target.value })} style={{ width: "38px", height: "38px", border: "none", cursor: "pointer", borderRadius: "6px" }} />
                        <input type="text" className="form-control" value={brandForm.c4} onChange={e => setBrandForm({ ...brandForm, c4: e.target.value })} />
                      </div>
                    </div>
                  </div>

                  {/* B. Visuales y Tarjetas */}
                  <h5 style={{ fontSize: "0.95rem", fontWeight: 800, marginBottom: "0.8rem", color: "var(--text-gold)" }}>
                    🖼️ Formas, Tipografía y Modo de Catálogo
                  </h5>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "14px", marginBottom: "1.5rem" }}>
                    <div className="form-group">
                      <label style={{ fontSize: "0.78rem", fontWeight: 700 }}>Tipografía</label>
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
                    </div>

                    <div className="form-group">
                      <label style={{ fontSize: "0.78rem", fontWeight: 700 }}>Estilo de Tarjetas de Producto</label>
                      <select 
                        className="form-control"
                        value={brandForm.cardStyle}
                        onChange={e => setBrandForm({ ...brandForm, cardStyle: e.target.value })}
                      >
                        <option value="luxury">Luxury (Resplandor dorado & relieve)</option>
                        <option value="glass">Glassmorphism (Vidrio translúcido esmerilado)</option>
                        <option value="solid">Sólido (Fondo blanco nítido)</option>
                        <option value="outlined">Outlined (Bordes finos minimalistas)</option>
                        <option value="minimal">Minimal (Sin sombras pesadas)</option>
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
                  <h5 style={{ fontSize: "0.95rem", fontWeight: 800, marginBottom: "0.8rem", color: "var(--text-gold)" }}>
                    🌐 Redes Sociales y Enlaces
                  </h5>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "12px", marginBottom: "1.5rem" }}>
                    <input 
                      type="text"
                      className="form-control"
                      placeholder="Instagram (@usuario)"
                      value={brandForm.instagram}
                      onChange={e => setBrandForm({ ...brandForm, instagram: e.target.value })}
                    />
                    <input 
                      type="text"
                      className="form-control"
                      placeholder="TikTok (@usuario)"
                      value={brandForm.tiktok}
                      onChange={e => setBrandForm({ ...brandForm, tiktok: e.target.value })}
                    />
                    <input 
                      type="text"
                      className="form-control"
                      placeholder="Facebook (Link o página)"
                      value={brandForm.facebook}
                      onChange={e => setBrandForm({ ...brandForm, facebook: e.target.value })}
                    />
                    <input 
                      type="url"
                      className="form-control"
                      placeholder="Sitio Web Oficial"
                      value={brandForm.website}
                      onChange={e => setBrandForm({ ...brandForm, website: e.target.value })}
                    />
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
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem", marginBottom: "1.5rem" }}>
            <div>
              <h2 style={{ fontSize: "1.4rem", fontWeight: 800, margin: 0 }}>
                Catálogo de Ítems ({currentBrandProducts.length})
              </h2>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "4px" }}>
                <span style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>Marca:</span>
                {myBrands.length > 1 ? (
                  <select 
                    value={selectedBrandId || ""}
                    onChange={(e) => setSelectedBrandId(Number(e.target.value))}
                    className="form-control"
                    style={{ maxWidth: "260px", padding: "4px 10px", fontSize: "0.82rem", fontWeight: 700 }}
                  >
                    {myBrands.map(b => (
                      <option key={b.id} value={b.id}>{b.name} ({b.category || "General"})</option>
                    ))}
                  </select>
                ) : (
                  <b style={{ fontSize: "0.88rem" }}>{selectedBrand?.name || "Selecciona una marca"}</b>
                )}
              </div>
            </div>

            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              <button 
                onClick={() => handleOpenAddProduct("perfume")}
                className="btn-outline-gold"
                style={{ padding: "0.55rem 1.1rem", borderRadius: "10px", fontSize: "0.85rem", fontWeight: 700, display: "flex", alignItems: "center", gap: "6px" }}
              >
                <i className="fa-solid fa-spray-can-sparkles"></i> + Fragancia
              </button>

              <button 
                onClick={() => handleOpenAddProduct("standard")}
                className="btn-gold"
                style={{ padding: "0.55rem 1.2rem", borderRadius: "10px", fontSize: "0.85rem", fontWeight: 700, display: "flex", alignItems: "center", gap: "6px" }}
              >
                <i className="fa-solid fa-plus"></i> + Nuevo Producto / Servicio
              </button>
            </div>
          </div>

          {/* Filtros y Buscador Rápido */}
          <div style={{ display: "flex", gap: "10px", marginBottom: "1.5rem", flexWrap: "wrap" }}>
            <div style={{ flex: 1, minWidth: "240px", position: "relative" }}>
              <i className="fa-solid fa-magnifying-glass" style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }}></i>
              <input 
                type="text"
                placeholder="Buscar por nombre, categoría o inspiración..."
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

                return (
                  <div key={prod.id} className="dash-product-row">
                    <div style={{ display: "flex", alignItems: "center", gap: "12px", minWidth: "260px" }}>
                      <img 
                        src={prod.image || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=120"} 
                        alt={prod.name}
                        style={{ width: "52px", height: "52px", borderRadius: "10px", objectFit: "cover", border: "1px solid var(--border-color)", background: "#fff" }}
                      />
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          <h4 style={{ fontSize: "0.95rem", fontWeight: 700, margin: 0 }}>{prod.name}</h4>
                          {isPerfume && (
                            <span style={{ fontSize: "0.62rem", background: "rgba(138,74,243,0.15)", color: "#8A4AF3", padding: "1px 6px", borderRadius: "8px", fontWeight: 700 }}>
                              💎 Fragancia
                            </span>
                          )}
                        </div>
                        <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{prod.category}</span>
                      </div>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "1.5rem", flexWrap: "wrap" }} className="dash-product-actions">
                      <div>
                        <span style={{ fontSize: "0.7rem", color: "var(--text-muted)", display: "block" }}>Precio</span>
                        <span style={{ fontSize: "1rem", fontWeight: 800, color: "var(--text-gold)" }}>S/. {prod.price}</span>
                      </div>

                      <div>
                        <span style={{ fontSize: "0.7rem", color: "var(--text-muted)", display: "block" }}>Stock</span>
                        <span style={{ fontSize: "0.85rem", fontWeight: 600 }}>
                          {prod.type === "service" ? "∞ Ilimitado" : `${prod.stock || 0} unid.`}
                        </span>
                      </div>

                      {/* Toggle Visibilidad en 1 Clic */}
                      <button 
                        onClick={() => handleToggleProductVisibility(prod)}
                        title={isVisible ? "Ocultar de la vitrina" : "Mostrar en la vitrina"}
                        style={{ 
                          background: isVisible ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)", 
                          color: isVisible ? "#22C55E" : "#EF4444",
                          border: `1px solid ${isVisible ? "rgba(34,197,94,0.3)" : "rgba(239,68,68,0.3)"}`,
                          padding: "6px 12px", 
                          borderRadius: "8px", 
                          fontSize: "0.78rem", 
                          fontWeight: 700, 
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: "6px"
                        }}
                      >
                        <i className={`fa-solid fa-${isVisible ? "eye" : "eye-slash"}`}></i>
                        {isVisible ? "Activo" : "Oculto"}
                      </button>

                      <div style={{ display: "flex", gap: "6px" }}>
                        <button 
                          onClick={() => handleEditProduct(prod)}
                          className="btn-outline-gold"
                          style={{ padding: "6px 12px", borderRadius: "8px", fontSize: "0.78rem", fontWeight: 700 }}
                        >
                          <i className="fa-solid fa-pen"></i> Editar
                        </button>
                        <button 
                          onClick={async () => {
                            if (window.confirm(`¿Estás seguro de eliminar "${prod.name}"?`)) {
                              await handleDeleteProduct(prod.id);
                            }
                          }}
                          style={{ background: "transparent", border: "1px solid rgba(239,68,68,0.3)", color: "#EF4444", padding: "6px 10px", borderRadius: "8px", fontSize: "0.78rem", cursor: "pointer" }}
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

          {/* ── MODAL / PANEL DE CREACIÓN DE PRODUCTO CON PLANTILLAS ───────── */}
          {showProductModal && (
            <div className="modal-overlay" style={{ zIndex: 1200 }}>
              <div className="modal-backdrop" onClick={() => setShowProductModal(false)}></div>
              <div className="modal-panel fade-in" style={{ maxWidth: "760px", background: "#FFFFFF", border: "1.5px solid var(--gold-primary)", padding: "1.8rem", borderRadius: "20px", maxHeight: "90vh", overflowY: "auto" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.2rem" }}>
                  <h3 style={{ fontSize: "1.3rem", fontWeight: 800, margin: 0 }}>
                    {editingProductId ? "✏️ Editar Ítem" : "✨ Publicar Nuevo Ítem en Vitrina"}
                  </h3>
                  <button 
                    onClick={() => setShowProductModal(false)}
                    style={{ background: "rgba(0,0,0,0.06)", border: "none", width: "32px", height: "32px", borderRadius: "50%", cursor: "pointer", fontSize: "1.1rem" }}
                  >
                    &times;
                  </button>
                </div>

                {/* Selector de Tipo de Producto en 1 Clic */}
                <div className="product-type-grid">
                  {PRODUCT_TYPE_TEMPLATES.map(t => (
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

                <form onSubmit={handleSaveProductSubmit}>
                  {/* Campos Esenciales Comunes */}
                  <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: "12px", marginBottom: "1rem" }}>
                    <div className="form-group">
                      <label style={{ fontSize: "0.82rem", fontWeight: 700 }}>Nombre del Ítem *</label>
                      <input 
                        type="text"
                        className="form-control"
                        placeholder={productType === "perfume" ? "Ej. Abunga Oud Noir" : productType === "gastro" ? "Ej. Café Espresso de Origen" : "Nombre del producto"}
                        value={prodForm.name}
                        onChange={e => setProdForm({ ...prodForm, name: e.target.value })}
                        required
                      />
                    </div>

                    <div className="form-group">
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
                      <div className="form-group">
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
                  </div>

                  {/* ── CAMPOS ESPECÍFICOS PARA FRAGANCIAS / PERFUMES ── */}
                  {productType === "perfume" && (
                    <div style={{ background: "rgba(138,74,243,0.04)", border: "1.5px solid rgba(138,74,243,0.25)", borderRadius: "14px", padding: "1.2rem", marginBottom: "1.2rem" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px" }}>
                        <span style={{ fontSize: "1rem" }}>💎</span>
                        <h4 style={{ fontSize: "0.95rem", fontWeight: 800, margin: 0, color: "#8A4AF3" }}>
                          Configuración del Dúo Visual & Experiencia Olfativa
                        </h4>
                      </div>

                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "10px" }}>
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
                          <label style={{ fontSize: "0.78rem", fontWeight: 700 }}>URL Imagen Frasco Original (Dúo)</label>
                          <input 
                            type="url"
                            className="form-control"
                            placeholder="URL https://... del frasco original"
                            value={prodForm.perfumeOriginalImg}
                            onChange={e => setProdForm({ ...prodForm, perfumeOriginalImg: e.target.value })}
                          />
                        </div>
                      </div>

                      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "10px", marginBottom: "10px" }}>
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
                            <option value="50% Esencia Pura">50% Esencia Pura</option>
                            <option value="Extrait de Parfum">Extrait de Parfum (33%)</option>
                            <option value="Eau de Parfum">Eau de Parfum (EDP)</option>
                          </select>
                        </div>

                        <div className="form-group">
                          <label style={{ fontSize: "0.78rem", fontWeight: 700 }}>Mililitros / Tamaño</label>
                          <select 
                            className="form-control"
                            value={prodForm.perfumeMl}
                            onChange={e => setProdForm({ ...prodForm, perfumeMl: e.target.value })}
                          >
                            <option value="30 ml">30 ml</option>
                            <option value="50 ml">50 ml</option>
                            <option value="100 ml">100 ml</option>
                          </select>
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
                    <label style={{ fontSize: "0.82rem", fontWeight: 700 }}>
                      Foto de tu Producto / Creación {productType === "perfume" && "(Tu Frasco)"}
                    </label>
                    <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                      <input 
                        type="url"
                        className="form-control"
                        placeholder="Pega la URL de la foto o sube un archivo →"
                        value={prodForm.image}
                        onChange={e => setProdForm({ ...prodForm, image: e.target.value })}
                      />
                      <label className="btn-outline-gold" style={{ padding: "0.55rem 1rem", borderRadius: "8px", fontSize: "0.82rem", cursor: "pointer", whiteSpace: "nowrap" }}>
                        <i className={uploadingProdImg ? "fa-solid fa-spinner fa-spin" : "fa-solid fa-upload"}></i> Subir Foto
                        <input 
                          type="file"
                          accept="image/*"
                          style={{ display: "none" }}
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              setUploadingProdImg(true);
                              const url = await uploadImage(file);
                              setUploadingProdImg(false);
                              if (url) setProdForm({ ...prodForm, image: url });
                            }
                          }}
                        />
                      </label>
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
                      <div style={{ marginTop: "10px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                        <div className="form-group">
                          <label style={{ fontSize: "0.78rem", fontWeight: 700 }}>Precio Oferta Aourum (Opcional)</label>
                          <input 
                            type="number"
                            step="0.01"
                            className="form-control"
                            placeholder="Ej. Precio especial"
                            value={prodForm.priceAourum}
                            onChange={e => setProdForm({ ...prodForm, priceAourum: e.target.value })}
                          />
                        </div>

                        <div className="form-group">
                          <label style={{ fontSize: "0.78rem", fontWeight: 700 }}>Categoría Específica</label>
                          <input 
                            type="text"
                            className="form-control"
                            value={prodForm.category}
                            onChange={e => setProdForm({ ...prodForm, category: e.target.value })}
                          />
                        </div>

                        <div className="form-group" style={{ gridColumn: "1 / -1" }}>
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

                  {/* Botones de Envío */}
                  <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                    <button 
                      type="button"
                      onClick={() => setShowProductModal(false)}
                      className="btn-outline-gold"
                      style={{ padding: "0.65rem 1.4rem", borderRadius: "10px", fontSize: "0.88rem" }}
                    >
                      Cancelar
                    </button>
                    <button 
                      type="submit"
                      className="btn-gold"
                      disabled={submittingProd}
                      style={{ padding: "0.65rem 1.8rem", borderRadius: "10px", fontSize: "0.88rem", fontWeight: 700 }}
                    >
                      {submittingProd ? "Guardando..." : (editingProductId ? "Guardar Cambios" : "✨ Publicar Ítem")}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════════════
          TAB 4: MI PERFIL PERSONAL (RÁPIDO Y CÓMODO)
          ═════════════════════════════════════════════════════════════════════ */}
      {activeTab === "perfil" && (
        <div className="glass-panel fade-in" style={{ padding: "2rem", borderRadius: "20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", flexWrap: "wrap", gap: "1rem" }}>
            <div>
              <h2 style={{ fontSize: "1.4rem", fontWeight: 800, margin: 0 }}>
                Mi Perfil Personal
              </h2>
              <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", margin: "2px 0 0" }}>
                Información de tu identidad, ocupación y presencia en AOURUM.
              </p>
            </div>

            <button 
              type="button"
              onClick={handleSaveProfile}
              className="btn-gold"
              disabled={savingProfile}
              style={{ padding: "0.65rem 1.6rem", borderRadius: "10px", fontSize: "0.9rem", fontWeight: 700 }}
            >
              {savingProfile ? "Guardando..." : "💾 Guardar Mi Perfil"}
            </button>
          </div>

          <form onSubmit={handleSaveProfile}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "16px", marginBottom: "1.5rem" }}>
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
                <label style={{ fontSize: "0.82rem", fontWeight: 700 }}>URL Foto de Perfil (Avatar)</label>
                <div style={{ display: "flex", gap: "8px" }}>
                  <input 
                    type="url"
                    className="form-control"
                    value={profileForm.logo}
                    onChange={e => setProfileForm({ ...profileForm, logo: e.target.value })}
                  />
                  <label className="btn-outline-gold" style={{ padding: "0.5rem 0.9rem", borderRadius: "8px", fontSize: "0.8rem", cursor: "pointer", whiteSpace: "nowrap" }}>
                    Subir
                    <input 
                      type="file"
                      accept="image/*"
                      style={{ display: "none" }}
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const url = await uploadImage(file);
                          if (url) setProfileForm({ ...profileForm, logo: url });
                        }
                      }}
                    />
                  </label>
                </div>
              </div>

              <div className="form-group" style={{ gridColumn: "1 / -1" }}>
                <label style={{ fontSize: "0.82rem", fontWeight: 700 }}>Biografía / Sobre Mí</label>
                <textarea 
                  rows="3"
                  className="form-control"
                  placeholder="Cuéntale a la comunidad quién eres y qué te apasiona..."
                  value={profileForm.bio}
                  onChange={e => setProfileForm({ ...profileForm, bio: e.target.value })}
                />
              </div>

              <div className="form-group" style={{ gridColumn: "1 / -1" }}>
                <label style={{ fontSize: "0.82rem", fontWeight: 700 }}>Intereses y Etiquetas (separados por coma)</label>
                <input 
                  type="text"
                  className="form-control"
                  placeholder="Ej. Perfumería, Gastronomía, Moda, Arte"
                  value={profileForm.interests}
                  onChange={e => setProfileForm({ ...profileForm, interests: e.target.value })}
                />
              </div>
            </div>

            {/* Redes Sociales Personales */}
            <h4 style={{ fontSize: "1rem", fontWeight: 800, marginBottom: "0.8rem", color: "var(--text-gold)" }}>
              🌐 Redes Sociales Personales
            </h4>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "12px", marginBottom: "1.5rem" }}>
              <input 
                type="text"
                className="form-control"
                placeholder="Instagram (@usuario)"
                value={profileForm.instagram}
                onChange={e => setProfileForm({ ...profileForm, instagram: e.target.value })}
              />
              <input 
                type="text"
                className="form-control"
                placeholder="TikTok (@usuario)"
                value={profileForm.tiktok}
                onChange={e => setProfileForm({ ...profileForm, tiktok: e.target.value })}
              />
              <input 
                type="text"
                className="form-control"
                placeholder="Facebook"
                value={profileForm.facebook}
                onChange={e => setProfileForm({ ...profileForm, facebook: e.target.value })}
              />
              <input 
                type="url"
                className="form-control"
                placeholder="Sitio Web / Portafolio"
                value={profileForm.website}
                onChange={e => setProfileForm({ ...profileForm, website: e.target.value })}
              />
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button 
                type="submit"
                className="btn-gold"
                disabled={savingProfile}
                style={{ padding: "0.65rem 2rem", borderRadius: "10px", fontSize: "0.9rem", fontWeight: 700 }}
              >
                {savingProfile ? "Guardando..." : "💾 Guardar Perfil"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════════════
          TAB 5: SEGURIDAD Y CUENTA
          ═════════════════════════════════════════════════════════════════════ */}
      {activeTab === "seguridad" && (
        <div className="fade-in" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "20px" }}>
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
