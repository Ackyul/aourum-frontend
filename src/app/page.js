"use client";

import { useApp } from "../context/AppContext";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect, useRef, useMemo } from "react";

// MaxHeap implementation for ranking
class MaxHeap {
  constructor(compareFn) {
    this.heap = [];
    this.compare = compareFn || ((a, b) => a - b);
  }

  size() {
    return this.heap.length;
  }

  peek() {
    return this.heap[0];
  }

  insert(val) {
    this.heap.push(val);
    this.up(this.heap.length - 1);
  }

  extractMax() {
    if (this.heap.length === 0) return null;
    const max = this.heap[0];
    const end = this.heap.pop();
    if (this.heap.length > 0) {
      this.heap[0] = end;
      this.down(0);
    }
    return max;
  }

  up(i) {
    while (i > 0) {
      const p = Math.floor((i - 1) / 2);
      if (this.compare(this.heap[i], this.heap[p]) <= 0) break;
      [this.heap[i], this.heap[p]] = [this.heap[p], this.heap[i]];
      i = p;
    }
  }

  down(i) {
    const len = this.heap.length;
    while (2 * i + 1 < len) {
      let left = 2 * i + 1;
      let right = 2 * i + 2;
      let best = left;
      if (right < len && this.compare(this.heap[right], this.heap[left]) > 0) {
        best = right;
      }
      if (this.compare(this.heap[i], this.heap[best]) >= 0) break;
      [this.heap[i], this.heap[best]] = [this.heap[best], this.heap[i]];
      i = best;
    }
  }
}

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

// Helper to interleave products of different brands to guarantee representation and bypass entry order
const interleaveProducts = (productList) => {
  if (!productList || productList.length === 0) return [];

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

  // Shuffle the brands list and also shuffle products within each brand
  const shuffledBrands = shuffle(Object.keys(productsByBrand));
  const shuffledProductsByBrand = {};
  shuffledBrands.forEach(bId => {
    shuffledProductsByBrand[bId] = shuffle(productsByBrand[bId]);
  });

  // Interleave in round-robin fashion
  const orderedProducts = [];
  let hasMore = true;
  let index = 0;
  while (hasMore) {
    hasMore = false;
    shuffledBrands.forEach(bId => {
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
    loadBrands
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
  const [pagedProducts, setPagedProducts] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [pagedLoading, setPagedLoading] = useState(false);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
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

  // Helper to handle "Ver todo" on a category or section
  const handleViewAll = (categoryName) => {
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
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Filter products based on global search & sidebar filters
  const filteredProducts = products.filter((prod) => {
    const matchesSearch = prod.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          prod.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          getBrandName(prod.brandId).toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === "all" || prod.type === filterType;
    const matchesCategory = filterCategory === "all" || (prod.category && prod.category.trim().toLowerCase() === filterCategory.trim().toLowerCase());
    return matchesSearch && matchesType && matchesCategory;
  });

  const allCategories = (() => {
    const seen = new Set();
    const unique = [];
    products.forEach(p => {
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
  })();

  // Extraction of featured entities using MaxHeap
  const getFeaturedProducts = () => {
    if (!products || products.length === 0) return [];
    const heap = new MaxHeap((a, b) => getProductViews(a) - getProductViews(b));
    products.forEach(p => heap.insert(p));
    
    const result = [];
    const targetSize = Math.min(8, products.length);
    for (let i = 0; i < targetSize; i++) {
      const p = heap.extractMax();
      if (p) result.push(p);
    }
    return result;
  };

  const featuredProducts = getFeaturedProducts();

  const showcaseProducts = useMemo(() => {
    return interleaveProducts(products);
  }, [products]);

  const interleavedFilteredProducts = useMemo(() => {
    return interleaveProducts(filteredProducts);
  }, [filteredProducts]);

  // Thematic sections specifications
  const themeSpecs = [
    {
      id: "joyeria",
      title: "Novedades en JoyerÃ­a",
      subtitle: "DiseÃ±os Ãºnicos, brillo local e identidad cultural",
      keywords: ["joyeria", "joyerÃ­a", "anillo", "collar", "pulsera", "arete", "esmeralda", "plata", "oro"],
      fallbackCategory: "JoyerÃ­a"
    },
    {
      id: "ropa",
      title: "Tendencias en Ropa",
      subtitle: "Prendas con historia y estilo contemporÃ¡neo",
      keywords: ["ropa", "vestimenta", "prenda", "moda", "polo", "casaca", "pantalon", "pantalÃ³n", "falda", "vestido", "abrigo"],
      fallbackCategory: "Ropa"
    },
    {
      id: "accesorios",
      title: "Accesorios Destacados",
      subtitle: "El complemento perfecto para tu dÃ­a a dÃ­a",
      keywords: ["accesorio", "accesorios", "cartera", "bolso", "sombrero", "lentes", "correa", "billetera"],
      fallbackCategory: "Accesorios"
    }
  ];

  const getThemedProducts = (spec) => {
    return products.filter(p => {
      const categoryMatch = p.category && (
        spec.keywords.some(kw => p.category.toLowerCase().includes(kw)) ||
        p.category.toLowerCase() === spec.fallbackCategory.toLowerCase()
      );
      const nameMatch = p.name && spec.keywords.some(kw => p.name.toLowerCase().includes(kw));
      return categoryMatch || nameMatch;
    });
  };

  // Determine categories not represented by themed sections
  const representedCategories = new Set();
  themeSpecs.forEach(spec => {
    getThemedProducts(spec).forEach(p => {
      if (p.category) representedCategories.add(p.category.toLowerCase());
    });
  });

  const remainingCategories = allCategories.filter(
    (cat) => !representedCategories.has(cat.toLowerCase())
  );

  // Sub-component for product card
  function ProductCard({ prod }) {
    const brand = brands.find((b) => b.id === prod.brandId);
    const brandRubro = brand ? (brand.rubro_especifico || brand.rubro_general || brand.category) : "Marca Local";
    const views = getProductViews(prod);

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
          
          <div 
            style={{ fontSize: "0.8rem", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "5px" }}
            onClick={(e) => {
              e.stopPropagation();
              if (brand) {
                router.push(`/brands/${brand.slug || brand.id}`);
              }
            }}
          >
            <span>Por:</span>
            <strong style={{ color: "var(--text-primary)", cursor: "pointer", textDecoration: "underline" }}>{getBrandName(prod.brandId)}</strong>
          </div>
          
          {/* Price and Stock / Agenda */}
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
          <div style={{ display: "flex", gap: "0.5rem", marginBottom: "2rem", borderBottom: "2px solid var(--border-color)", paddingBottom: "0" }}>
            {[{ id: "vitrina", label: "Vitrina Cultural", icon: "fa-store" }, { id: "feed", label: "Muro de Novedades", icon: "fa-rss" }].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  padding: "0.6rem 1.2rem",
                  borderRadius: "8px 8px 0 0",
                  border: "none",
                  cursor: "pointer",
                  fontWeight: 700,
                  fontSize: "0.88rem",
                  display: "flex",
                  alignItems: "center",
                  gap: "7px",
                  transition: "all 0.18s",
                  background: activeTab === tab.id ? "var(--gold-primary)" : "transparent",
                  color: activeTab === tab.id ? "#1c1c1e" : "var(--text-muted)",
                  borderBottom: activeTab === tab.id ? "2px solid var(--gold-primary)" : "2px solid transparent",
                  marginBottom: "-2px"
                }}
              >
                <i className={`fa-solid ${tab.icon}`} style={{ fontSize: "0.8rem" }}></i>
                {tab.label}
              </button>
            ))}
          </div>

          {/* Feed Tab */}
          {activeTab === "feed" && (
            <div style={{ maxWidth: "640px", margin: "0 auto" }}>
              {feedLoading && feedItems.length === 0 ? (
                <div style={{ textAlign: "center", padding: "4rem 0" }}>
                  <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: "2rem", color: "var(--gold-primary)" }}></i>
                </div>
              ) : feedItems.length === 0 ? (
                <div style={{ textAlign: "center", padding: "4rem 0", color: "var(--text-muted)" }}>
                  <i className="fa-solid fa-rss" style={{ fontSize: "2.5rem", marginBottom: "1rem", display: "block" }}></i>
                  <p>Aun no hay actividad registrada.</p>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                  {feedItems.map(item => {
                    const meta = feedEventMeta(item);
                    return (
                      <div
                        key={item.id}
                        className="fade-in"
                        style={{
                          background: "var(--card-bg, #fff)",
                          border: "1px solid var(--border-color)",
                          borderRadius: "14px",
                          padding: "1rem 1.2rem",
                          display: "flex",
                          gap: "1rem",
                          alignItems: "flex-start",
                          boxShadow: "0 2px 10px rgba(0,0,0,0.04)"
                        }}
                      >
                        <div style={{
                          width: "42px", height: "42px", borderRadius: "50%",
                          background: meta.color + "18",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          flexShrink: 0
                        }}>
                          <i className={`fa-solid ${meta.icon}`} style={{ color: meta.color, fontSize: "1rem" }}></i>
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
                            <span style={{
                              fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase",
                              letterSpacing: "0.05em", color: meta.color, background: meta.color + "15",
                              padding: "2px 8px", borderRadius: "20px"
                            }}>{meta.label}</span>
                            <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{formatFeedDate(item.timestamp)}</span>
                          </div>
                          {item.link ? (
                            <Link href={item.link} style={{ textDecoration: "none", color: "inherit" }}>
                              <p style={{ fontWeight: 700, fontSize: "0.95rem", margin: "0.3rem 0 0.2rem", lineHeight: 1.3 }}>{item.title}</p>
                            </Link>
                          ) : (
                            <p style={{ fontWeight: 700, fontSize: "0.95rem", margin: "0.3rem 0 0.2rem", lineHeight: 1.3 }}>{item.title}</p>
                          )}
                          {item.description && (
                            <p style={{
                              fontSize: "0.83rem", color: "var(--text-muted)",
                              display: "-webkit-box", WebkitLineClamp: 2,
                              WebkitBoxOrient: "vertical", overflow: "hidden", margin: 0
                            }}>{item.description}</p>
                          )}
                          {item.image && (
                            <img
                              src={item.image} alt={item.title}
                              style={{ width: "100%", maxHeight: "180px", objectFit: "cover", borderRadius: "10px", marginTop: "0.7rem" }}
                              onError={e => { e.currentTarget.style.display = "none"; }}
                            />
                          )}
                          {item.meta && item.eventType === "fair_created" && item.meta.date && (
                            <div style={{ display: "flex", gap: "1rem", marginTop: "0.6rem", fontSize: "0.78rem", color: "var(--text-muted)" }}>
                              <span><i className="fa-solid fa-calendar" style={{ marginRight: "4px" }}></i>{item.meta.date}</span>
                              {item.meta.location && <span><i className="fa-solid fa-location-dot" style={{ marginRight: "4px" }}></i>{item.meta.location}</span>}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  {feedItems.length < feedTotal && (
                    <div style={{ textAlign: "center", marginTop: "1rem" }}>
                      <button
                        onClick={() => loadFeed(feedPage + 1, true)}
                        disabled={feedLoading}
                        className="btn-outline-gold"
                        style={{ borderRadius: "30px", padding: "0.7rem 2rem", fontWeight: 700, cursor: feedLoading ? "not-allowed" : "pointer", opacity: feedLoading ? 0.6 : 1 }}
                      >
                        <i className={`fa-solid ${feedLoading ? "fa-spinner fa-spin" : "fa-arrow-down"}`} style={{ marginRight: "8px" }}></i>
                        {feedLoading ? "Cargando..." : "Ver mas novedades"}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Vitrina Tab */}
          {activeTab === "vitrina" && (
          <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2.0rem", flexWrap: "wrap", gap: "1rem" }}>
            <div>
              <h2 style={{ fontSize: "1.7rem", fontWeight: 800, letterSpacing: "-0.015em", marginTop: "2px" }}>
                {hasActiveFilters ? "Resultados de busqueda" : "Marcas Locales"}
              </h2>
            </div>
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
              {renderCarousel("productos-destacados", "Productos Destacados", "Los articulos mas vistos y preferidos de la vitrina cultural", featuredProducts, "all")}
              {themeSpecs.map(spec => renderCarousel(spec.id, spec.title, spec.subtitle, getThemedProducts(spec), spec.fallbackCategory))}
              {remainingCategories.map(cat => renderCarousel(
                cat.toLowerCase().replace(/[^a-z0-9]/g, ""),
                cat,
                `Explora nuestra seleccion de ${cat.toLowerCase()}`,
                products.filter(p => p.category && p.category.trim().toLowerCase() === cat.trim().toLowerCase()),
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
