"use client";

import { useApp } from "../context/AppContext";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect, useRef, useMemo } from "react";
import { MaxHeap, getItemViews, getBrandViews, getProductViews } from "@/utils/maxHeap";
import { isVirtualMenuBrand, isPerfumeryBrand } from "@/utils/brandUtils";
import SocialFeedPublisher from "@/components/SocialFeedPublisher";
import PostList from "@/components/PostList";
import ProductCardVisual from "@/components/ProductCardVisual";
import { parsePerfumeInfo, groupCatalogProducts } from "@/components/PerfumeryShowcase";

// Helper to interleave products of different brands to guarantee representation and bypass entry order, prioritizing user's city
const interleaveProducts = (productList, brands = [], userCity = "") => {
  if (!productList || productList.length === 0) return [];

  const brandCityMap = {};
  if (Array.isArray(brands)) {
    brands.forEach(b => {
      if (b && b.id) {
        brandCityMap[b.id] = b.city ? b.city.trim().toLowerCase() : "";
      }
    });
  }

  // Group by brand
  const productsByBrand = {};
  productList.forEach(p => {
    const bId = p.brandId;
    if (!productsByBrand[bId]) {
      productsByBrand[bId] = [];
    }
    productsByBrand[bId].push(p);
  });

  // Shuffle helper using Fisher-Yates algorithm
  const shuffle = (array) => {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  };

  const brandKeys = Object.keys(productsByBrand);
  let sortedBrandKeys = shuffle(brandKeys);

  // If userCity is specified, prioritize brand keys matching userCity first
  if (userCity) {
    const cleanUserCity = userCity.trim().toLowerCase();
    const cityBrands = [];
    const otherBrands = [];

    sortedBrandKeys.forEach(bId => {
      const bCity = brandCityMap[bId] || "";
      if (bCity && bCity === cleanUserCity) {
        cityBrands.push(bId);
      } else {
        otherBrands.push(bId);
      }
    });
    sortedBrandKeys = [...cityBrands, ...otherBrands];
  }

  const shuffledProductsByBrand = {};
  sortedBrandKeys.forEach(bId => {
    shuffledProductsByBrand[bId] = shuffle(productsByBrand[bId]);
  });

  // Interleave in round-robin fashion
  const orderedProducts = [];
  let hasMore = true;
  let index = 0;
  while (hasMore) {
    hasMore = false;
    sortedBrandKeys.forEach(bId => {
      const brandProds = shuffledProductsByBrand[bId];
      if (index < brandProds.length) {
        orderedProducts.push(brandProds[index]);
        hasMore = true;
      }
    });
    index++;
  }

  return orderedProducts;
};

export default function Home() {
  const {
    products,
    brands,
    loading,
    getBrandName,
    filterType, setFilterType,
    filterCategory, setFilterCategory,
    searchTerm,
    parseDescription,
    loadProducts,
    loadBrands,
    activePersonId,
    getCurrentPerson,
    uploadImage,
    removeBgAi,
    triggerNotification,
    authHeaders
  } = useApp();

  useEffect(() => {
    loadProducts();
    loadBrands();
  }, [loadProducts, loadBrands]);

  const [filtersOpen, setFiltersOpen] = useState(false);
  const [visibleCount, setVisibleCount] = useState(15);

  // â”€â”€ Feed de Actividad Cultural â”€â”€
  const [activeTab, setActiveTab] = useState('vitrina'); // 'vitrina' | 'feed'
  const [feedItems, setFeedItems] = useState([]);
  const [feedPage, setFeedPage] = useState(1);
  const [feedTotal, setFeedTotal] = useState(0);
  const [feedLoading, setFeedLoading] = useState(false);
  const [feedLoaded, setFeedLoaded] = useState(false);

  const loadFeed = async (page = 1, append = false) => {
    setFeedLoading(true);
    try {
      const res = await fetch(`${API_URL || 'http://localhost:5000'}/api/feed?page=${page}&limit=15`).then(r => r.json());
      const items = res.items || [];
      setFeedItems(prev => append ? [...prev, ...items] : items);
      setFeedTotal(res.count || 0);
      setFeedPage(page);
      setFeedLoaded(true);
    } catch (err) {
      console.error('Error loading feed:', err);
    } finally {
      setFeedLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'feed' && !feedLoaded) {
      loadFeed(1);
    }
  }, [activeTab, feedLoaded]);

  const formatFeedDate = (iso) => {
    if (!iso) return '';
    const d = new Date(iso);
    const now = new Date();
    const diff = Math.floor((now - d) / 1000);
    if (diff < 60) return 'hace un momento';
    if (diff < 3600) return `hace ${Math.floor(diff / 60)} min`;
    if (diff < 86400) return `hace ${Math.floor(diff / 3600)} h`;
    if (diff < 604800) return `hace ${Math.floor(diff / 86400)} d`;
    return d.toLocaleDateString('es-PE', { day: '2-digit', month: 'short' });
  };

  const feedEventMeta = (item) => {
    switch(item.eventType) {
      case 'product_created': return { icon: 'fa-box-open', color: '#d4af37', label: 'Nueva creaciÃ³n' };
      case 'fair_created':    return { icon: 'fa-store', color: '#16a34a', label: 'Nueva feria' };
      case 'brand_created':   return { icon: 'fa-star', color: '#2563eb', label: 'Nueva marca' };
      case 'band_created':    return { icon: 'fa-music', color: '#9333ea', label: 'Nueva banda' };
      case 'person_created':  return { icon: 'fa-user-plus', color: '#ea580c', label: 'Nuevo talento' };
      default: return { icon: 'fa-bell', color: '#6b7280', label: 'Novedad' };
    }
  };

  // Estados de paginaciÃ³n del lado del servidor para filtros
  // Estados de paginación del lado del servidor para filtros
  const [pagedProducts, setPagedProducts] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [pagedLoading, setPagedLoading] = useState(false);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

  // Post state & action handlers
  const [postText, setPostText] = useState("");
  const [postImage, setPostImage] = useState("");
  const [uploadingPostImage, setUploadingPostImage] = useState(false);
  const [submittingPost, setSubmittingPost] = useState(false);

  // Client-side interactive states for posts
  const [likedPosts, setLikedPosts] = useState(new Set());
  const [bookmarkedPosts, setBookmarkedPosts] = useState(new Set());

  const toggleLike = (id) => {
    setLikedPosts(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleBookmark = (id) => {
    setBookmarkedPosts(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleSharePost = (content) => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(content);
      triggerNotification(true, "🔗 ¡Publicación copiada al portapapeles!");
    }
  };

  const handlePostImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const url = await uploadImage(file, setUploadingPostImage);
    if (url) {
      setPostImage(url);
    }
  };

  const handleRemovePostBg = async () => {
    if (!postImage) return;
    setUploadingPostImage(true);
    try {
      const response = await fetch(postImage);
      const blob = await response.blob();
      const base64 = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.readAsDataURL(blob);
      });
      const transparentBase64 = await removeBgAi(base64);
      if (transparentBase64) {
        const res = await fetch(transparentBase64);
        const transBlob = await res.blob();
        const transFile = new File([transBlob], "transparent.png", { type: "image/png" });
        const newUrl = await uploadImage(transFile, setUploadingPostImage);
        if (newUrl) {
          setPostImage(newUrl);
          triggerNotification(true, "✨ Fondo removido con éxito.");
        }
      }
    } catch (err) {
      console.error(err);
      triggerNotification(false, "No se pudo quitar el fondo.");
    } finally {
      setUploadingPostImage(false);
    }
  };

  const handleCreatePost = async (e) => {
    if (e) e.preventDefault();
    if (!postText.trim()) {
      triggerNotification(false, "El texto de la publicación no puede estar vacío.");
      return;
    }
    setSubmittingPost(true);
    try {
      const response = await fetch(`${API_URL}/api/posts`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({
          content: postText.trim(),
          image: postImage || null
        })
      });
      const data = await response.json();
      if (response.ok) {
        triggerNotification(true, "✨ ¡Publicación compartida con éxito!");
        setPostText("");
        setPostImage("");
        loadFeed(1, false);
      } else {
        triggerNotification(false, data.error || "No se pudo crear la publicación.");
      }
    } catch (err) {
      console.error(err);
      triggerNotification(false, "Error de red al crear la publicación.");
    } finally {
      setSubmittingPost(false);
    }
  };

  const handleDeletePost = async (postId) => {
    if (!confirm("¿Seguro que deseas eliminar esta publicación?")) return;
    try {
      const response = await fetch(`${API_URL}/api/posts/${postId}`, {
        method: "DELETE",
        headers: authHeaders()
      });
      const data = await response.json();
      if (response.ok) {
        triggerNotification(true, "🗑️ Publicación eliminada.");
        setFeedItems(prev => prev.filter(item => item.id !== postId));
        setFeedTotal(prev => prev - 1);
      } else {
        triggerNotification(false, data.error || "No se pudo eliminar la publicación.");
      }
    } catch (err) {
      console.error(err);
      triggerNotification(false, "Error de red al eliminar la publicación.");
    }
  };

  const handleReportPost = async (postId) => {
    if (!confirm("¿Deseas reportar esta publicación por contenido inapropiado o +18?")) return;
    try {
      const response = await fetch(`${API_URL}/api/posts/${postId}/report`, {
        method: "POST",
        headers: authHeaders()
      });
      const data = await response.json();
      if (response.ok) {
        triggerNotification(true, data.message);
        if (data.status === 'flagged' || data.status === 'rejected') {
          // Remove the post from UI if it has been auto-flagged
          setFeedItems(prev => prev.filter(item => item.id !== postId));
          setFeedTotal(prev => prev - 1);
        }
      } else {
        triggerNotification(false, data.error || "No se pudo procesar el reporte.");
      }
    } catch (err) {
      console.error(err);
      triggerNotification(false, "Error de red al enviar el reporte.");
    }
  };

  const hasActiveFilters = searchTerm !== "" || filterType !== "all" || filterCategory !== "all";

  // Buscar y paginar productos desde el backend cuando cambian los filtros
  useEffect(() => {
    if (!hasActiveFilters) {
      setPagedProducts([]);
      return;
    }
    
    const fetchFiltered = async () => {
      setPagedLoading(true);
      try {
        const queryParams = new URLSearchParams({
          page: 1,
          limit: 15,
          category: filterCategory,
          type: filterType,
          search: searchTerm
        });
        const res = await fetch(`${API_URL}/api/products?${queryParams.toString()}`).then(r => r.json());
        setPagedProducts(res.items || []);
        setTotalCount(res.count || 0);
        setCurrentPage(1);
      } catch (err) {
        console.error("Error al cargar productos paginados:", err);
      } finally {
        setPagedLoading(false);
      }
    };
    
    fetchFiltered();
  }, [searchTerm, filterType, filterCategory, hasActiveFilters, API_URL]);

  // Cargar mÃ¡s productos desde el backend
  const loadMoreProducts = async () => {
    if (pagedLoading) return;
    setPagedLoading(true);
    try {
      const nextPage = currentPage + 1;
      const queryParams = new URLSearchParams({
        page: nextPage,
        limit: 15,
        category: filterCategory,
        type: filterType,
        search: searchTerm
      });
      const res = await fetch(`${API_URL}/api/products?${queryParams.toString()}`).then(r => r.json());
      setPagedProducts(prev => [...prev, ...(res.items || [])]);
      setCurrentPage(nextPage);
    } catch (err) {
      console.error("Error al cargar mÃ¡s productos:", err);
    } finally {
      setPagedLoading(false);
    }
  };
  const router = useRouter();

  // Scroll listener for floating filter button
  const [showFloatingBtn, setShowFloatingBtn] = useState(false);
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 250) {
        setShowFloatingBtn(true);
      } else {
        setShowFloatingBtn(false);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);
  
  // Ref map to handle horizontal scroll for multiple carousels
  const trackRefs = useRef({});

  // Scroll action for Desktop navigation arrows
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



  // Prevent background scroll when sidebar filters are open
  useEffect(() => {
    if (filtersOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [filtersOpen]);

  const handleResetFilters = () => {
    setSearchTerm("");
    setFilterType("all");
    setFilterCategory("all");
  };

  // Helper universal para detectar si un producto corresponde a la marca o catálogo de perfumería
  const isProductPerfume = (p) => {
    if (!p) return false;
    const pBrandId = Number(p.brandId || p.brand_id);
    const pBrand = brands.find(b => Number(b.id) === pBrandId);
    const pBrandRubro = pBrand ? (pBrand.rubro_especifico || pBrand.rubro_general || pBrand.category || "") : "";
    const pInfo = parsePerfumeInfo(p);
    return Boolean(
      pBrandId === 6 ||
      pInfo.originalImg ||
      isPerfumeryBrand(pBrand) ||
      pBrand?.category?.toLowerCase() === "perfumería" ||
      pBrand?.category?.toLowerCase() === "perfumeria" ||
      pBrand?.brandDesign?.catalogDisplayMode === "perfumery" ||
      pBrand?.brandDesign?.catalogDisplayMode === "perfume" ||
      /perfum|fraganc|coloni|eau de|esenci/i.test(`${p.category || ""} ${pBrandRubro}`) ||
      (pInfo.inspiration && !/comida|snack|gastronom|fruta|alimento|bebida|joyer|ropa|esot[eé]ric/i.test(`${p.category || ""} ${pBrandRubro}`))
    );
  };

  // Helper to handle "Ver todo" on a category or section
  const handleViewAll = (categoryName) => {
    if (
      !categoryName ||
      categoryName === "Productos Destacados" ||
      categoryName === "Destacados" ||
      categoryName.toLowerCase().includes("destacado")
    ) {
      handleResetFilters();
    } else if (categoryName.toLowerCase().includes("perfum")) {
      setFilterCategory("Perfumería");
    } else {
      const exactCategory = products.find(p => p.category?.toLowerCase() === categoryName.toLowerCase())?.category;
      if (exactCategory) {
        setFilterCategory(exactCategory);
      } else {
        const matchedCategory = products.find(p => p.category?.toLowerCase().includes(categoryName.toLowerCase()))?.category;
        if (matchedCategory) {
          setFilterCategory(matchedCategory);
        } else {
          setFilterCategory("all");
        }
      }
    }

    setTimeout(() => {
      const targetEl = document.getElementById("grid-catalog-header") || document.querySelector(".grid-catalog");
      if (targetEl) {
        targetEl.scrollIntoView({ behavior: "smooth", block: "start" });
      } else {
        window.scrollTo({ top: 600, behavior: "smooth" });
      }
    }, 50);
  };

  const visibleProducts = useMemo(() => {
    return groupCatalogProducts(products.filter(p => p.isVisible !== false));
  }, [products]);

  // Filter products based on global search & sidebar filters
  const filteredProducts = visibleProducts.filter((prod) => {
    const matchesSearch = prod.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          prod.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          getBrandName(prod.brandId).toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === "all" || prod.type === filterType;
    const matchesCategory = filterCategory === "all" || (
      filterCategory.toLowerCase() === "perfumería" || filterCategory.toLowerCase() === "perfumeria"
        ? isProductPerfume(prod)
        : (prod.category && prod.category.trim().toLowerCase() === filterCategory.trim().toLowerCase())
    );
    return matchesSearch && matchesType && matchesCategory;
  });

  const allCategories = (() => {
    const seen = new Set();
    const unique = [];
    visibleProducts.forEach(p => {
      const isPerf = isProductPerfume(p);
      const catName = isPerf ? "Perfumería" : (p.category ? p.category.trim() : "");
      if (catName) {
        const lower = catName.toLowerCase();
        if (!seen.has(lower)) {
          seen.add(lower);
          unique.push(catName);
        }
      }
    });
    return unique;
  })();

  // Extraction of featured entities using MaxHeap (strictly real views > 0)
  const getFeaturedProducts = () => {
    if (!visibleProducts || visibleProducts.length === 0) return [];
    const productsWithViews = visibleProducts.filter(p => getProductViews(p) > 0);
    if (productsWithViews.length === 0) return [];
    
    const heap = new MaxHeap((a, b) => getProductViews(a) - getProductViews(b));
    productsWithViews.forEach(p => heap.insert(p));
    
    const result = [];
    const targetSize = Math.min(8, productsWithViews.length);
    for (let i = 0; i < targetSize; i++) {
      const p = heap.extractMax();
      if (p) result.push(p);
    }
    return result;
  };

  const featuredProducts = useMemo(() => getFeaturedProducts(), [visibleProducts]);
  const featuredIds = useMemo(() => new Set(featuredProducts.map(p => p.id)), [featuredProducts]);

  const currentPerson = getCurrentPerson();
  const userCity = currentPerson?.city || "";

  // Discover section with equalized rotation for non-featured / less-viewed products
  const discoverProducts = useMemo(() => {
    if (!visibleProducts || visibleProducts.length === 0) return [];
    const nonFeatured = visibleProducts.filter(p => !featuredIds.has(p.id));
    const pool = nonFeatured.length > 0 ? nonFeatured : visibleProducts;
    return interleaveProducts(pool, brands, userCity);
  }, [visibleProducts, featuredIds, brands, userCity]);

  const showcaseProducts = useMemo(() => {
    return interleaveProducts(visibleProducts, brands, userCity);
  }, [visibleProducts, brands, userCity]);

  const interleavedFilteredProducts = useMemo(() => {
    return interleaveProducts(filteredProducts, brands, userCity);
  }, [filteredProducts, brands, userCity]);

  // Thematic sections specifications
  const themeSpecs = [
    {
      id: "perfumeria",
      title: "Perfumería",
      subtitle: "Explora nuestra selección exclusiva de alta perfumería y fragancias",
      keywords: ["perfum", "fraganc", "eau de", "coloni", "esenci", "olfativ", "parfum", "elixir"],
      fallbackCategory: "Perfumería",
      isPerfumeSection: true
    },
    {
      id: "joyeria",
      title: "Novedades en Joyería",
      subtitle: "Diseños únicos, brillo local e identidad cultural",
      keywords: ["joyeria", "joyería", "anillo", "collar", "pulsera", "arete", "esmeralda", "plata", "oro"],
      fallbackCategory: "Joyería"
    },
    {
      id: "ropa",
      title: "Tendencias en Ropa",
      subtitle: "Prendas con historia y estilo contemporáneo",
      keywords: ["ropa", "vestimenta", "prenda", "moda", "polo", "casaca", "pantalon", "pantalón", "falda", "vestido", "abrigo"],
      fallbackCategory: "Ropa"
    },
    {
      id: "accesorios",
      title: "Accesorios Destacados",
      subtitle: "El complemento perfecto para tu día a día",
      keywords: ["accesorio", "accesorios", "cartera", "bolso", "sombrero", "lentes", "correa", "billetera"],
      fallbackCategory: "Accesorios"
    }
  ];

  const getThemedProducts = (spec) => {
    return visibleProducts.filter(p => {
      if (spec.isPerfumeSection) {
        return isProductPerfume(p);
      }
      const categoryMatch = p.category && (
        spec.keywords.some(kw => p.category.toLowerCase().includes(kw)) ||
        p.category.toLowerCase() === spec.fallbackCategory.toLowerCase()
      );
      const nameMatch = p.name && spec.keywords.some(kw => p.name.toLowerCase().includes(kw));
      return (categoryMatch || nameMatch) && !isProductPerfume(p);
    });
  };

  // Determine categories not represented by themed sections
  const representedCategories = new Set();
  themeSpecs.forEach(spec => {
    getThemedProducts(spec).forEach(p => {
      if (p.category) representedCategories.add(p.category.toLowerCase());
      if (spec.isPerfumeSection) representedCategories.add("perfumería");
    });
  });

  const remainingCategories = allCategories.filter(
    (cat) => !representedCategories.has(cat.toLowerCase()) && cat.toLowerCase() !== "perfumería"
  );

  // Sub-component for product card
  function ProductCard({ prod }) {
    const brand = brands.find((b) => b.id === prod.brandId);
    const brandRubro = brand ? (brand.rubro_especifico || brand.rubro_general || brand.category) : "Marca Local";
    const views = getProductViews(prod);

    const categoryTextColor = "var(--text-gold)";
    const titleTextColor = "var(--text-primary)";
    const priceTextColor = "var(--text-primary)";
    const dividerBorder = "1px solid var(--border-color)";
    const isDarkBg = false;

    const perfumeInfo = parsePerfumeInfo(prod);
    const brandColor = (brand?.color && brand.color.startsWith("#"))
      ? brand.color
      : (brand?.theme_color ? brand.theme_color.split(",")[0].trim() : "var(--gold-primary)");

    const isPerfume = isProductPerfume(prod);

    // Multi-size selection state
    const sizes = Array.isArray(prod.sizes) && prod.sizes.length > 0 ? prod.sizes : [];
    const hasMultipleSizes = sizes.length > 1;
    const [selectedSizeIndex, setSelectedSizeIndex] = useState(0);

    const activeSize = hasMultipleSizes ? sizes[selectedSizeIndex] : null;
    const displayPrice = activeSize ? activeSize.price : (prod.minPrice != null ? prod.minPrice : prod.price);
    const displayPriceAourum = activeSize ? activeSize.priceAourum : prod.priceAourum;
    const displayImage = (activeSize && activeSize.image) ? activeSize.image : prod.image;
    const targetSlug = (activeSize && activeSize.slug) ? activeSize.slug : (prod.slug || prod.id);

    const visualProd = useMemo(() => {
      return displayImage ? { ...prod, image: displayImage } : prod;
    }, [prod, displayImage]);

    return (
      <div 
        className="glass-panel product-card" 
        style={{ overflow: "hidden", display: "flex", flexDirection: "column", cursor: "pointer", height: "100%" }}
        onClick={() => router.push(`/products/${targetSlug}`)}
      >
        <div 
          className="card-img-container" 
          style={{ 
            position: "relative",
            backgroundColor: (prod.imgBgColor && prod.imgBgColor !== "transparent") 
              ? (prod.imgBgColor === "brand" ? brandColor : prod.imgBgColor)
              : "transparent",
            transition: "background-color 0.3s ease"
          }}
        >
          {/* Top Badges Bar: avoids collision on narrow mobile cards */}
          <div style={{
            position: "absolute",
            top: "8px",
            left: "8px",
            right: "8px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: "4px",
            zIndex: 6,
            pointerEvents: "none"
          }}>
            {/* Left badge: Más Visto or (for non-perfumes) Descubre */}
            <div>
              {(featuredIds.has(prod.id) && getProductViews(prod) > 0) ? (
                <span style={{
                  background: "linear-gradient(135deg, #d4af37 0%, #b8860b 100%)",
                  color: "#1C1C1E",
                  fontWeight: 800,
                  fontSize: "0.62rem",
                  padding: "3px 8px",
                  borderRadius: "12px",
                  backdropFilter: "blur(4px)",
                  textTransform: "uppercase",
                  letterSpacing: "0.04em",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.25)",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "4px",
                  whiteSpace: "nowrap"
                }}>
                  <i className="fa-solid fa-fire"></i>
                  Más Visto
                </span>
              ) : !isPerfume ? (
                <span style={{
                  background: "rgba(15, 23, 42, 0.85)",
                  color: "#F8FAFC",
                  fontWeight: 700,
                  fontSize: "0.62rem",
                  padding: "3px 8px",
                  borderRadius: "12px",
                  backdropFilter: "blur(4px)",
                  textTransform: "uppercase",
                  letterSpacing: "0.04em",
                  border: "1px solid rgba(255, 255, 255, 0.2)",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "4px",
                  whiteSpace: "nowrap"
                }}>
                  <i className="fa-solid fa-wand-magic-sparkles" style={{ color: "#FCD34D" }}></i>
                  Descubre
                </span>
              ) : null}
            </div>

            {/* Right badge: Gender badge if perfume */}
            <div>
              {isPerfume && perfumeInfo.gender ? (
                <span
                  style={{
                    background: "rgba(15, 23, 42, 0.85)",
                    color: "#F8FAFC",
                    fontWeight: 700,
                    fontSize: "0.62rem",
                    padding: "3px 8px",
                    borderRadius: "12px",
                    backdropFilter: "blur(4px)",
                    border: "1px solid rgba(255, 255, 255, 0.2)",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "4px",
                    whiteSpace: "nowrap"
                  }}
                >
                  {perfumeInfo.gender === "Hombre" && "👔 Hombre"}
                  {perfumeInfo.gender === "Mujer" && "👗 Mujer"}
                  {perfumeInfo.gender === "Unisex" && "✨ Unisex"}
                  {perfumeInfo.gender !== "Hombre" && perfumeInfo.gender !== "Mujer" && perfumeInfo.gender !== "Unisex" && perfumeInfo.gender}
                </span>
              ) : null}
            </div>
          </div>

          <ProductCardVisual
            prod={visualProd}
            perfumeInfo={perfumeInfo}
            brandColor={brandColor}
            isDark={isDarkBg}
          />
        </div>
        <div style={{ padding: "1.1rem", flex: 1, display: "flex", flexDirection: "column", gap: "0.35rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "6px" }}>
            <span style={{ 
              fontSize: "0.72rem", 
              color: categoryTextColor, 
              letterSpacing: "0.05em", 
              textTransform: "uppercase", 
              fontWeight: 700,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              flex: 1
            }}>
              {isPerfume ? (perfumeInfo.family && !/jean paul|dior|baccarat|sauvage|elixir|creed|versace|chanel/i.test(perfumeInfo.family) ? perfumeInfo.family : "Perfumería") : prod.category}
            </span>
            {(activeSize?.size || perfumeInfo.ml || perfumeInfo.presentation) && (
              <span style={{ 
                fontSize: "0.68rem", 
                color: isDarkBg ? "#FDE047" : "var(--text-gold)", 
                background: isDarkBg ? "rgba(253, 224, 71, 0.12)" : "rgba(212, 175, 55, 0.12)",
                padding: "1px 6px",
                borderRadius: "6px",
                fontWeight: 700,
                flexShrink: 0,
                whiteSpace: "nowrap"
              }}>
                {activeSize?.size || perfumeInfo.ml || perfumeInfo.presentation}
              </span>
            )}
          </div>
          <h3 style={{ fontSize: "1.05rem", fontWeight: 800, lineHeight: 1.35, color: titleTextColor, margin: 0 }}>
            {prod.name}
          </h3>

          {/* Inspiración original si es perfume */}
          {isPerfume && (perfumeInfo.inspiration || (prod.category && !/perfum/i.test(prod.category))) && (
            <div style={{ fontSize: "0.74rem", color: "var(--text-gold)", display: "flex", alignItems: "center", gap: "5px" }}>
              <i className="fa-solid fa-gem" style={{ fontSize: "0.65rem", opacity: 0.85 }}></i>
              <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                Insp: <strong style={{ color: titleTextColor }}>{perfumeInfo.inspiration || prod.category}</strong>
              </span>
            </div>
          )}

          <div 
            style={{ fontSize: "0.8rem", color: isDarkBg ? "#A1A1AA" : "var(--text-muted)", display: "flex", alignItems: "center", gap: "5px", marginTop: "2px" }}
            onClick={(e) => {
              e.stopPropagation();
              if (brand) {
                router.push(`/brands/${brand.slug || brand.id}`);
              }
            }}
          >
            <span>Por:</span>
            <strong style={{ color: titleTextColor, cursor: "pointer", textDecoration: "underline" }}>{getBrandName(prod.brandId)}</strong>
          </div>

          {/* Pastillas interactivas de tamaños si tiene múltiples opciones */}
          {hasMultipleSizes && (
            <div 
              className="card-sizes-scroll"
              style={{ 
                display: "flex", 
                gap: "4px", 
                flexWrap: "nowrap",
                overflowX: "auto",
                scrollbarWidth: "none",
                msOverflowStyle: "none",
                WebkitOverflowScrolling: "touch",
                margin: "0.2rem 0 0.05rem 0",
                padding: "1px 0",
                maxWidth: "100%"
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {sizes.map((s, idx) => {
                const isSelected = idx === selectedSizeIndex;
                return (
                  <button
                    key={idx}
                    type="button"
                    className="card-size-pill"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedSizeIndex(idx);
                    }}
                    title={`Ver tamaño ${s.size} por S/ ${s.price}`}
                    style={{
                      flex: "0 0 auto",
                      whiteSpace: "nowrap",
                      padding: "2px 7px",
                      borderRadius: "6px",
                      fontSize: "0.66rem",
                      fontWeight: isSelected ? 800 : 600,
                      cursor: "pointer",
                      border: isSelected 
                        ? `1.5px solid ${brandColor || "var(--gold-primary)"}` 
                        : "1px solid rgba(0,0,0,0.12)",
                      background: isSelected 
                        ? `${brandColor || "var(--gold-primary)"}18` 
                        : "rgba(0,0,0,0.03)",
                      color: isSelected 
                        ? (brandColor || "var(--gold-primary)") 
                        : "var(--text-muted)",
                      transition: "all 0.18s ease"
                    }}
                  >
                    {s.size}
                  </button>
                );
              })}
            </div>
          )}
          
          {/* Price and Stock / Agenda */}
          <div style={{ 
            display: "flex", 
            justifyContent: "space-between", 
            alignItems: "center", 
            borderTop: dividerBorder, 
            paddingTop: "0.7rem", 
            marginTop: "auto" 
          }}>
            <div>
              {displayPriceAourum ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                    <span style={{ fontSize: "0.68rem", color: isDarkBg ? "#A1A1AA" : "var(--text-muted)", textDecoration: "line-through", lineHeight: 1 }}>
                      S/ {Number(displayPrice).toLocaleString("es-PE")}
                    </span>
                    <span style={{ fontSize: "0.5rem", background: "var(--gold-gradient)", color: "#1C1C1E", padding: "1px 4px", borderRadius: "3px", fontWeight: "800", textTransform: "uppercase", whiteSpace: "nowrap", lineHeight: 1 }}>
                      Aourum
                    </span>
                  </div>
                  <span className="card-price-main" style={{ fontSize: "1.02rem", fontWeight: 800, color: priceTextColor, lineHeight: 1 }}>
                    S/ {Number(displayPriceAourum).toLocaleString("es-PE")}
                  </span>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column" }}>
                  {hasMultipleSizes && (
                    <span style={{ fontSize: "0.58rem", textTransform: "uppercase", fontWeight: 700, color: "var(--text-muted)", letterSpacing: "0.04em", lineHeight: 1 }}>
                      Desde
                    </span>
                  )}
                  <span className="card-price-main" style={{ fontSize: "1.02rem", fontWeight: 800, color: priceTextColor }}>
                    S/ {Number(displayPrice).toLocaleString("es-PE")}
                  </span>
                </div>
              )}
            </div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "2px" }}>
              <span className="card-type-label" style={{
                fontSize: "0.65rem",
                fontWeight: 700,
                textTransform: "uppercase",
                color: prod.type === "service" ? (isDarkBg ? "#93c5fd" : "#1e3a8a") : (isDarkBg ? "#fde68a" : "#78350f"),
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



  // Render horizontal carousel block for products
  const renderCarousel = (id, title, subtitle, sectionProducts, categoryValue) => {
    if (sectionProducts.length === 0) return null;

    return (
      <div key={id} className="carousel-container fade-in">
        <div className="carousel-header">
          <div className="carousel-title-group">
            <h2 className="carousel-title">{title}</h2>
            {subtitle && <p className="carousel-subtitle">{subtitle}</p>}
          </div>
          <div className="carousel-actions">
            <button className="carousel-view-all" onClick={() => handleViewAll(categoryValue || title)}>
              Ver todo <i className="fa-solid fa-arrow-right" style={{ fontSize: "0.8rem" }}></i>
            </button>
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
                <ProductCard prod={prod} />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };


  return (
    <div className="container" style={{ paddingBottom: "3rem" }}>
      {loading ? (
        <div style={{ textAlign: "center", padding: "6rem 0", display: "flex", flexDirection: "column", gap: "1rem", alignItems: "center" }}>
          <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: "2.5rem", color: "var(--gold-primary)" }}></i>
          <p style={{ color: "var(--text-muted)", fontWeight: "medium", fontSize: "0.95rem" }}>Cargando la vitrina cultural local...</p>
        </div>
      ) : (
        <>
          <div className="fade-in">

          {/* Tab Switcher */}
          <div className="aourum-tabs-container" style={{ marginBottom: "2rem" }}>
            {[{ id: "vitrina", label: "Vitrina Cultural", icon: "fa-shop" }, { id: "feed", label: "Muro de Novedades", icon: "fa-rss" }].map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`aourum-tab-btn ${activeTab === tab.id ? "active" : ""}`}
              >
                <i className={`fa-solid ${tab.icon}`}></i>
                {tab.label}
              </button>
            ))}
          </div>

          {/* Feed Tab */}
          {activeTab === "feed" && (
            <div style={{ maxWidth: "640px", margin: "0 auto" }}>
              <SocialFeedPublisher onPostCreated={() => loadFeed(1, false)} />

              <PostList
                posts={feedItems}
                loading={feedLoading && feedItems.length === 0}
                emptyMessage="Aún no hay publicaciones en la comunidad."
                onPostDeleted={(postId) => {
                  setFeedItems(prev => prev.filter(item => item.id !== postId));
                  setFeedTotal(prev => Math.max(0, prev - 1));
                }}
              />

              {feedItems.length < feedTotal && (
                <div style={{ textAlign: "center", marginTop: "1.5rem" }}>
                  <button
                    onClick={() => loadFeed(feedPage + 1, true)}
                    disabled={feedLoading}
                    className="btn-outline-gold"
                    style={{ borderRadius: "30px", padding: "0.7rem 2rem", fontWeight: 700, cursor: feedLoading ? "not-allowed" : "pointer", opacity: feedLoading ? 0.6 : 1 }}
                  >
                    <i className={`fa-solid ${feedLoading ? "fa-spinner fa-spin" : "fa-arrow-down"}`} style={{ marginRight: "8px" }}></i>
                    {feedLoading ? "Cargando..." : "Ver más novedades"}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Vitrina Tab */}
          {activeTab === "vitrina" && (
          <div>
          <div id="grid-catalog-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2.0rem", flexWrap: "wrap", gap: "1rem" }}>
            <div>
              <h2 style={{ fontSize: "1.7rem", fontWeight: 800, letterSpacing: "-0.015em", marginTop: "2px" }}>
                {hasActiveFilters ? "Resultados de busqueda" : "Marcas Locales"}
              </h2>
            </div>
            
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={handleResetFilters}
                  style={{
                    borderRadius: "20px",
                    padding: "0.45rem 1.1rem",
                    fontSize: "0.82rem",
                    fontWeight: 800,
                    cursor: "pointer",
                    background: "rgba(239, 68, 68, 0.1)",
                    color: "#ef4444",
                    border: "1.5px solid rgba(239, 68, 68, 0.35)",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    transition: "all 0.2s ease"
                  }}
                  title="Quitar todos los filtros aplicados"
                >
                  <i className="fa-solid fa-xmark"></i>
                  <span>Quitar Filtros</span>
                </button>
              )}

              <button
                onClick={() => setFiltersOpen(true)}
                className="btn-outline-gold desktop-filter-btn"
                style={{ borderRadius: "20px", padding: "0.45rem 1.2rem", fontSize: "0.85rem", display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", background: "transparent" }}
              >
                <i className="fa-solid fa-sliders"></i>
                Mostrar Filtros
                {(filterType !== "all" || filterCategory !== "all") && (
                  <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "var(--gold-primary)" }}></span>
                )}
              </button>
            </div>
          </div>

          {hasActiveFilters ? (
            (!pagedLoading && pagedProducts.length === 0) ? (
              <div style={{ padding: "5rem", textAlign: "center", background: "#FFFFFF", borderRadius: "12px", border: "1px solid var(--border-color)" }}>
                <i className="fa-solid fa-store-slash" style={{ fontSize: "3rem", color: "var(--border-color)", marginBottom: "1rem" }}></i>
                <p style={{ color: "var(--text-muted)", fontSize: "0.95rem" }}>No se encontraron items con los filtros aplicados.</p>
                <button
                  className="btn-outline-gold"
                  style={{ marginTop: "1.5rem", borderRadius: "20px", padding: "0.4rem 1.2rem", fontSize: "0.85rem" }}
                  onClick={() => { setFilterType("all"); setFilterCategory("all"); }}
                >Limpiar Filtros</button>
              </div>
            ) : (
              <div>
                <div className="grid-catalog">
                  {pagedProducts.map((prod) => (
                    <ProductCard key={prod.id} prod={prod} />
                  ))}
                </div>
                {pagedProducts.length < totalCount && (
                  <div style={{ display: "flex", justifyContent: "center", marginTop: "3rem" }}>
                    <button
                      onClick={loadMoreProducts}
                      disabled={pagedLoading}
                      className="btn-outline-gold"
                      style={{ borderRadius: "30px", padding: "0.75rem 2rem", fontSize: "0.9rem", fontWeight: 700, cursor: pagedLoading ? "not-allowed" : "pointer", opacity: pagedLoading ? 0.6 : 1 }}
                    >
                      <i className={`fa-solid ${pagedLoading ? "fa-spinner fa-spin" : "fa-arrow-rotate-right"}`} style={{ marginRight: "8px" }}></i>
                      {pagedLoading ? "Cargando..." : "Ver mas productos"}
                    </button>
                  </div>
                )}
              </div>
            )
          ) : (
            <div>
              {renderCarousel("productos-mas-vistos", "🔥 Los Más Vistos", "Las creaciones que más atención e interés están generando en AOURUM", featuredProducts, "all")}
              {renderCarousel("productos-descubre", "✨ Descubre: Joyas Ocultas", "Talentos independientes y propuestas únicas listas para ser exploradas", discoverProducts, "all")}
              {themeSpecs.map(spec => renderCarousel(spec.id, spec.title, spec.subtitle, getThemedProducts(spec), spec.fallbackCategory))}
              {remainingCategories.map(cat => renderCarousel(
                cat.toLowerCase().replace(/[^a-z0-9]/g, ""),
                cat,
                `Explora nuestra seleccion de ${cat.toLowerCase()}`,
                visibleProducts.filter(p => p.category && p.category.trim().toLowerCase() === cat.trim().toLowerCase() && !isProductPerfume(p)),
                cat
              ))}
              <div style={{ borderTop: "1px solid var(--border-color)", paddingTop: "3rem", marginTop: "1rem" }}>
                <h2 className="carousel-title" style={{ marginBottom: "1.5rem", paddingLeft: "0.2rem" }}>Vitrina de Productos</h2>
                <div className="grid-catalog">
                  {showcaseProducts.slice(0, visibleCount).map((prod) => (
                    <ProductCard key={prod.id} prod={prod} />
                  ))}
                </div>
                {showcaseProducts.length > visibleCount && (
                  <div style={{ display: "flex", justifyContent: "center", marginTop: "3rem" }}>
                    <button
                      onClick={() => setVisibleCount((prev) => prev + 15)}
                      className="btn-outline-gold"
                      style={{ borderRadius: "30px", padding: "0.75rem 2rem", fontSize: "0.9rem", fontWeight: 700, cursor: "pointer" }}
                    >
                      <i className="fa-solid fa-arrow-rotate-right" style={{ marginRight: "8px" }}></i>
                      Ver mas productos
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
          </div>
          )}

          {activeTab === "vitrina" && (<>
          {/* Sliding Sidebar Filters */}
          <div 
            className={`sidebar-backdrop ${filtersOpen ? "open" : ""}`} 
            onClick={() => setFiltersOpen(false)} 
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              width: "100vw",
              height: "100vh",
              background: "rgba(28, 28, 30, 0.4)",
              backdropFilter: "blur(8px)",
              WebkitBackdropFilter: "blur(8px)",
              zIndex: 1000,
              opacity: filtersOpen ? 1 : 0,
              visibility: filtersOpen ? "visible" : "hidden",
              transition: "opacity 0.3s ease, visibility 0.3s ease"
            }}
          />
          <div 
            className={`sidebar-panel ${filtersOpen ? "open" : ""}`}
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              width: "100%",
              maxWidth: "380px",
              height: "100vh",
              background: "var(--bg-card, #fff)",
              borderRight: "1px solid var(--border-color)",
              boxShadow: "20px 0 50px rgba(0, 0, 0, 0.15)",
              zIndex: 1001,
              display: "flex",
              flexDirection: "column",
              transform: filtersOpen ? "translateX(0)" : "translateX(-100%)",
              visibility: filtersOpen ? "visible" : "hidden",
              transition: "transform 0.35s cubic-bezier(0.16, 1, 0.3, 1), visibility 0.35s ease"
            }}
          >
            <div className="sidebar-header">
              <h3>Filtros Avanzados</h3>
              <button className="sidebar-close-btn" onClick={() => setFiltersOpen(false)} aria-label="Cerrar filtros">
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>
            <div className="sidebar-body">
              <div>
                <h4 className="sidebar-section-title"><i className="fa-solid fa-sliders"></i> Tipo de Oferta</h4>
                <div className="filter-group">
                  <label className={`filter-option-label ${filterType === "all" ? "active" : ""}`}>
                    <input type="radio" name="filterType" className="filter-input-radio" checked={filterType === "all"} onChange={() => setFilterType("all")} />Todos
                  </label>
                  <label className={`filter-option-label ${filterType === "product" ? "active" : ""}`}>
                    <input type="radio" name="filterType" className="filter-input-radio" checked={filterType === "product"} onChange={() => setFilterType("product")} />Productos
                  </label>
                  <label className={`filter-option-label ${filterType === "service" ? "active" : ""}`}>
                    <input type="radio" name="filterType" className="filter-input-radio" checked={filterType === "service"} onChange={() => setFilterType("service")} />Servicios
                  </label>
                </div>
              </div>
              <div>
                <h4 className="sidebar-section-title"><i className="fa-solid fa-tags"></i> Categorias</h4>
                <div className="filter-group">
                  <label className={`filter-option-label ${filterCategory === "all" ? "active" : ""}`}>
                    <input type="radio" name="filterCategory" className="filter-input-radio" checked={filterCategory === "all"} onChange={() => setFilterCategory("all")} />Todas las categorias
                  </label>
                  {allCategories.map(cat => (
                    <label key={cat} className={`filter-option-label ${filterCategory === cat ? "active" : ""}`}>
                      <input type="radio" name="filterCategory" className="filter-input-radio" checked={filterCategory === cat} onChange={() => setFilterCategory(cat)} />{cat}
                    </label>
                  ))}
                </div>
              </div>
            </div>
            <div className="sidebar-footer">
              <button
                className="btn-outline-gold"
                style={{ width: "100%", padding: "0.75rem", borderRadius: "8px", cursor: "pointer", fontWeight: 700 }}
                onClick={() => { setFilterType("all"); setFilterCategory("all"); setFiltersOpen(false); }}
              >Limpiar Filtros</button>
            </div>
          </div>

          <button
            onClick={() => setFiltersOpen(true)}
            className={`floating-filter-btn fade-in ${showFloatingBtn ? "visible" : ""}`}
            aria-label="Abrir filtros"
          >
            <i className="fa-solid fa-sliders"></i>
            <span>Filtros</span>
            {(filterType !== "all" || filterCategory !== "all") && (
              <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#1C1C1E" }}></span>
            )}
          </button>
          </>)}

          </div>
        </>
      )}
    </div>
  );
}
