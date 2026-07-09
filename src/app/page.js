"use client";

import { useApp } from "../context/AppContext";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";

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
  const [visibleCount, setVisibleCount] = useState(12);
  const [prevSearchTerm, setPrevSearchTerm] = useState(searchTerm);
  const [prevFilterType, setPrevFilterType] = useState(filterType);
  const [prevFilterCategory, setPrevFilterCategory] = useState(filterCategory);

  if (searchTerm !== prevSearchTerm || filterType !== prevFilterType || filterCategory !== prevFilterCategory) {
    setPrevSearchTerm(searchTerm);
    setPrevFilterType(filterType);
    setPrevFilterCategory(filterCategory);
    setVisibleCount(12);
  }
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

  const hasActiveFilters = searchTerm !== "" || filterType !== "all" || filterCategory !== "all";
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

  // Thematic sections specifications
  const themeSpecs = [
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
          
          {/* Header area of catalogue */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2.0rem", flexWrap: "wrap", gap: "1rem" }}>
            <div>
              <h2 style={{ fontSize: "1.7rem", fontWeight: 800, letterSpacing: "-0.015em", marginTop: "2px" }}>
                {hasActiveFilters ? "Resultados de búsqueda" : "Marcas Locales"}
              </h2>
            </div>
            
            <button 
              onClick={() => setFiltersOpen(true)}
              className="btn-outline-gold desktop-filter-btn"
              style={{
                borderRadius: "20px",
                padding: "0.45rem 1.2rem",
                fontSize: "0.85rem",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                cursor: "pointer",
                background: "transparent"
              }}
            >
              <i className="fa-solid fa-sliders"></i>
              Mostrar Filtros
              {(filterType !== "all" || filterCategory !== "all") && (
                <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "var(--gold-primary)" }}></span>
              )}
            </button>
          </div>

          {/* Catalog items display logic */}
          {hasActiveFilters ? (
            // Grid view for filtered results
            filteredProducts.length === 0 ? (
              <div style={{ padding: "5rem", textAlign: "center", background: "#FFFFFF", borderRadius: "12px", border: "1px solid var(--border-color)" }}>
                <i className="fa-solid fa-store-slash" style={{ fontSize: "3rem", color: "var(--border-color)", marginBottom: "1rem" }}></i>
                <p style={{ color: "var(--text-muted)", fontSize: "0.95rem" }}>No se encontraron items con los filtros aplicados. Intenta buscando otro término o reseteando los filtros.</p>
                <button 
                  className="btn-outline-gold" 
                  style={{ marginTop: "1.5rem", borderRadius: "20px", padding: "0.4rem 1.2rem", fontSize: "0.85rem" }}
                  onClick={() => {
                    setFilterType("all");
                    setFilterCategory("all");
                  }}
                >
                  Limpiar Filtros
                </button>
              </div>
            ) : (
              <div>
                <div className="grid-catalog">
                  {filteredProducts.slice(0, visibleCount).map((prod) => (
                    <ProductCard key={prod.id} prod={prod} />
                  ))}
                </div>
                
                {filteredProducts.length > visibleCount && (
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
            )
          ) : (
            // Categorized Carousels (Default Homepage View)
            <div>


              {renderCarousel(
                "productos-destacados",
                "Productos Destacados",
                "Los artículos más vistos y preferidos de la vitrina cultural",
                featuredProducts,
                "all"
              )}

              {/* 1. Render themed sections */}
              {themeSpecs.map(spec => 
                renderCarousel(
                  spec.id, 
                  spec.title, 
                  spec.subtitle, 
                  getThemedProducts(spec), 
                  spec.fallbackCategory
                )
              )}

              {/* 2. Render other categories dynamically */}
              {remainingCategories.map(cat => 
                renderCarousel(
                  cat.toLowerCase().replace(/[^a-z0-9]/g, ""),
                  cat,
                  `Explora nuestra selección de ${cat.toLowerCase()}`,
                  products.filter(p => p.category && p.category.trim().toLowerCase() === cat.trim().toLowerCase()),
                  cat
                )
              )}

              {/* 3. General Catalogue Grid ("Otros Productos") */}
              <div style={{ borderTop: "1px solid var(--border-color)", paddingTop: "3rem", marginTop: "1rem" }}>
                <h2 className="carousel-title" style={{ marginBottom: "1.5rem", paddingLeft: "0.2rem" }}>Vitrina de Productos</h2>
                <div className="grid-catalog">
                  {products.slice(0, visibleCount).map((prod) => (
                    <ProductCard key={prod.id} prod={prod} />
                  ))}
                </div>

                {products.length > visibleCount && (
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

          </div>

          {/* Sliding Left Sidebar for Filters */}
          <div className={`sidebar-backdrop ${filtersOpen ? "open" : ""}`} onClick={() => setFiltersOpen(false)} />
          <div className={`sidebar-panel ${filtersOpen ? "open" : ""}`}>
            <div className="sidebar-header">
              <h3>Filtros Avanzados</h3>
              <button className="sidebar-close-btn" onClick={() => setFiltersOpen(false)} aria-label="Cerrar filtros">
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>
            <div className="sidebar-body">
              {/* Filter by Type */}
              <div>
                <h4 className="sidebar-section-title">
                  <i className="fa-solid fa-sliders"></i> Tipo de Oferta
                </h4>
                <div className="filter-group">
                  <label className={`filter-option-label ${filterType === "all" ? "active" : ""}`}>
                    <input 
                      type="radio" 
                      name="filterType" 
                      className="filter-input-radio"
                      checked={filterType === "all"} 
                      onChange={() => setFilterType("all")} 
                    />
                    Todos
                  </label>
                  <label className={`filter-option-label ${filterType === "product" ? "active" : ""}`}>
                    <input 
                      type="radio" 
                      name="filterType" 
                      className="filter-input-radio"
                      checked={filterType === "product"} 
                      onChange={() => setFilterType("product")} 
                    />
                    🛍️ Productos
                  </label>
                  <label className={`filter-option-label ${filterType === "service" ? "active" : ""}`}>
                    <input 
                      type="radio" 
                      name="filterType" 
                      className="filter-input-radio"
                      checked={filterType === "service"} 
                      onChange={() => setFilterType("service")} 
                    />
                    📅 Servicios
                  </label>
                </div>
              </div>

              {/* Filter by Category */}
              <div>
                <h4 className="sidebar-section-title">
                  <i className="fa-solid fa-tags"></i> Categorías
                </h4>
                <div className="filter-group">
                  <label className={`filter-option-label ${filterCategory === "all" ? "active" : ""}`}>
                    <input 
                      type="radio" 
                      name="filterCategory" 
                      className="filter-input-radio"
                      checked={filterCategory === "all"} 
                      onChange={() => setFilterCategory("all")} 
                    />
                    Todas las categorías
                  </label>
                  {allCategories.map(cat => (
                    <label key={cat} className={`filter-option-label ${filterCategory === cat ? "active" : ""}`}>
                      <input 
                        type="radio" 
                        name="filterCategory" 
                        className="filter-input-radio"
                        checked={filterCategory === cat} 
                        onChange={() => setFilterCategory(cat)} 
                      />
                      {cat}
                    </label>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="sidebar-footer">
              <button 
                className="btn-outline-gold" 
                style={{ width: "100%", padding: "0.75rem", borderRadius: "8px", cursor: "pointer", fontWeight: 700 }}
                onClick={() => {
                  setFilterType("all");
                  setFilterCategory("all");
                  setFiltersOpen(false);
                }}
              >
                Limpiar Filtros
              </button>
            </div>
          </div>

          {/* Floating Filter Button */}
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

      </>
      )}
    </div>
  );
}


