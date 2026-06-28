"use client";

import { useApp } from "../../context/AppContext";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";

// Native MaxHeap implementation for internal sorting
class MaxHeap {
  constructor(compareFn) {
    this.heap = [];
    this.compare = compareFn;
  }
  getParentIndex(i) { return Math.floor((i - 1) / 2); }
  getLeftChildIndex(i) { return 2 * i + 1; }
  getRightChildIndex(i) { return 2 * i + 2; }
  swap(i, j) {
    const temp = this.heap[i];
    this.heap[i] = this.heap[j];
    this.heap[j] = temp;
  }
  insert(value) {
    this.heap.push(value);
    this.heapifyUp(this.heap.length - 1);
  }
  heapifyUp(index) {
    let currentIndex = index;
    while (currentIndex > 0) {
      const parentIndex = this.getParentIndex(currentIndex);
      if (this.compare(this.heap[currentIndex], this.heap[parentIndex]) > 0) {
        this.swap(currentIndex, parentIndex);
        currentIndex = parentIndex;
      } else {
        break;
      }
    }
  }
  extractMax() {
    if (this.heap.length === 0) return null;
    if (this.heap.length === 1) return this.heap.pop();
    const max = this.heap[0];
    this.heap[0] = this.heap.pop();
    this.heapifyDown(0);
    return max;
  }
  heapifyDown(index) {
    let currentIndex = index;
    const length = this.heap.length;
    while (this.getLeftChildIndex(currentIndex) < length) {
      let largerChildIndex = this.getLeftChildIndex(currentIndex);
      const rightChildIndex = this.getRightChildIndex(currentIndex);
      if (rightChildIndex < length && this.compare(this.heap[rightChildIndex], this.heap[largerChildIndex]) > 0) {
        largerChildIndex = rightChildIndex;
      }
      if (this.compare(this.heap[largerChildIndex], this.heap[currentIndex]) > 0) {
        this.swap(currentIndex, largerChildIndex);
        currentIndex = largerChildIndex;
      } else {
        break;
      }
    }
  }
}

// Consistent seed-based views hash function
const getItemViews = (name, id) => {
  const str = `${name}-${id || 0}`;
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash % 980) + 120; // 120 to 1100 views
};

const getBrandViews = (b) => b.views || b.viewCount || getItemViews(b.name, b.id);

export default function BrandsPage() {
  const {
    brands,
    loading,
    searchTerm,
    parseDescription
  } = useApp();

  const router = useRouter();
  
  // State variables for filter and sort
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filterCategory, setFilterCategory] = useState("all");
  const [sortBy, setSortBy] = useState("popular");
  const [visibleCount, setVisibleCount] = useState(12);

  // Ref map to handle horizontal scroll for multiple carousels
  const trackRefs = useRef({});
  const getTrackRef = (id) => {
    if (!trackRefs.current[id]) {
      trackRefs.current[id] = { current: null };
    }
    return trackRefs.current[id];
  };

  // Scroll action for Desktop navigation arrows
  const scrollTrack = (id, direction) => {
    const track = trackRefs.current[id]?.current;
    if (track) {
      const scrollAmount = track.clientWidth * 0.75;
      track.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth"
      });
    }
  };

  // Reset pagination on search, category or sort changes
  useEffect(() => {
    setVisibleCount(12);
  }, [searchTerm, filterCategory, sortBy]);

  // Lock background scroll when sidebar filters are open
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

  // Extract unique general categories (rubros) from brands list
  const allCategories = [...new Set(brands.map((brand) => {
    const parsed = parseDescription(brand.description);
    return parsed.rubro_general || brand.category;
  }).filter(Boolean))];

  // Helper to handle "Ver todo" on a category or section
  const handleViewAll = (categoryName) => {
    const matchedCategory = allCategories.find(cat => 
      cat.toLowerCase().includes(categoryName.toLowerCase()) || 
      categoryName.toLowerCase().includes(cat.toLowerCase())
    );
    if (matchedCategory) {
      setFilterCategory(matchedCategory);
    } else {
      setFilterCategory("all");
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // 1. Filter brands matching search query and category selector
  const filteredBrands = brands.filter((brand) => {
    const parsed = parseDescription(brand.description);
    const descText = parsed.text || "";
    const rubroGen = parsed.rubro_general || "";
    const rubroEsp = parsed.rubro_especifico || "";

    const matchesSearch = brand.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          descText.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          brand.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          rubroGen.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          rubroEsp.toLowerCase().includes(searchTerm.toLowerCase());

    const brandCategory = parsed.rubro_general || brand.category;
    const matchesCategory = filterCategory === "all" || (brandCategory && brandCategory.toLowerCase() === filterCategory.toLowerCase());

    return matchesSearch && matchesCategory;
  });

  // 2. Sort filtered brands based on selected sorting criteria
  const getSortedBrands = (brandList) => {
    const listToSort = brandList || filteredBrands;
    if (sortBy === "popular") {
      const heap = new MaxHeap((a, b) => getBrandViews(a) - getBrandViews(b));
      listToSort.forEach(b => heap.insert(b));
      
      const sorted = [];
      const len = listToSort.length;
      for (let i = 0; i < len; i++) {
        const item = heap.extractMax();
        if (item) sorted.push(item);
      }
      return sorted;
    } else if (sortBy === "name-asc") {
      return [...listToSort].sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortBy === "name-desc") {
      return [...listToSort].sort((a, b) => b.name.localeCompare(a.name));
    }
    return listToSort;
  };

  const sortedBrands = getSortedBrands();
  const hasActiveFilters = searchTerm !== "" || filterCategory !== "all" || sortBy !== "popular";

  // Get featured brands sorted internally using MaxHeap
  const getFeaturedBrands = () => {
    if (!brands || brands.length === 0) return [];
    const heap = new MaxHeap((a, b) => getBrandViews(a) - getBrandViews(b));
    brands.forEach(b => heap.insert(b));
    
    const result = [];
    const targetSize = Math.min(6, brands.length);
    for (let i = 0; i < targetSize; i++) {
      const b = heap.extractMax();
      if (b) result.push(b);
    }
    return result;
  };

  const featuredBrands = getFeaturedBrands();

  // Themed sections specifications for Brands
  const themeSpecs = [
    {
      id: "joyeria-brands",
      title: "Joyería y Joyas",
      subtitle: "Creadores locales de joyas finas y accesorios de plata",
      keywords: ["joyeria", "joyería", "joyas", "plata", "oro", "gemas", "anillos", "anillo", "pulsera", "collar", "arete", "esmeralda"],
      fallbackCategory: "Joyería"
    },
    {
      id: "ropa-brands",
      title: "Moda y Vestimenta",
      subtitle: "Prendas de diseño independiente y tejidos de alpaca",
      keywords: ["ropa", "moda", "textil", "prendas", "vestir", "costura", "abrigo", "vestido", "falda", "pantalon", "pantalón", "polo", "casaca"],
      fallbackCategory: "Ropa"
    },
    {
      id: "accesorios-brands",
      title: "Accesorios y Complementos",
      subtitle: "El toque final con carteras, bolsos y artículos de cuero",
      keywords: ["accesorios", "bolsos", "carteras", "sombreros", "cuero", "complementos", "bolso", "cartera", "sombrero", "billetera"],
      fallbackCategory: "Accesorios"
    }
  ];

  // Helper to extract themed brands based on keywords
  const getThemedBrands = (spec) => {
    return brands.filter(b => {
      const parsed = parseDescription(b.description);
      const brandCategory = parsed.rubro_general || b.category || "";
      const brandRubroEsp = parsed.rubro_especifico || "";
      const descText = parsed.text || "";

      const categoryMatch = spec.keywords.some(kw => brandCategory.toLowerCase().includes(kw)) ||
                            spec.keywords.some(kw => brandRubroEsp.toLowerCase().includes(kw));
      const descMatch = spec.keywords.some(kw => descText.toLowerCase().includes(kw)) ||
                        spec.keywords.some(kw => b.name.toLowerCase().includes(kw));

      return categoryMatch || descMatch;
    });
  };

  // Group other brands dynamically (excluding themed section brands to avoid duplicates)
  const renderedThemedBrandIds = new Set(themeSpecs.flatMap(spec => getThemedBrands(spec).map(b => b.id)));
  const remainingBrands = brands.filter(b => !renderedThemedBrandIds.has(b.id));
  const remainingCategories = [...new Set(remainingBrands.map(b => {
    const parsed = parseDescription(b.description);
    return parsed.rubro_general || b.category;
  }).filter(Boolean))];

  // Helper to render horizontal carousels of brands
  const renderBrandsCarouselBlock = (id, title, subtitle, list, categoryValue) => {
    if (list.length === 0) return null;
    const trackRef = getTrackRef(id);
    const sortedList = getSortedBrands(list);

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
          <div className="carousel-track" ref={trackRef}>
            {sortedList.map((brand) => (
              <div key={brand.id} className="carousel-item">
                <BrandCard brand={brand} isFeatured={id === "marcas-destacadas"} />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // Brand card sub-component
  function BrandCard({ brand, isFeatured }) {
    const rubro = brand.rubro_especifico || brand.rubro_general || brand.category || "Marca Local";
    const descText = parseDescription(brand.description).text;

    return (
      <div 
        className="glass-panel" 
        style={{ overflow: "hidden", display: "flex", flexDirection: "column", cursor: "pointer", height: "100%" }}
        onClick={() => router.push(`/brands/${brand.slug || brand.id}`)}
      >
        <div className="card-img-container" style={{ position: "relative" }}>
          <img src={brand.logo} alt={brand.name} className="card-img-hover" />
          {isFeatured && (
            <span style={{
              position: "absolute", top: "12px", left: "12px",
              background: "var(--gold-gradient)",
              color: "#1C1C1E", padding: "0.3rem 0.6rem", borderRadius: "6px",
              fontSize: "0.68rem", fontWeight: 700, textTransform: "uppercase",
              boxShadow: "0 4px 8px rgba(212,175,55,0.25)",
              zIndex: 2
            }}>
              ⭐ Destacada
            </span>
          )}
        </div>
        <div style={{ padding: "1.2rem", flex: 1, display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          <span style={{ fontSize: "0.75rem", color: "var(--text-gold)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>
            {rubro}
          </span>
          <h3 style={{ fontSize: "1.15rem", fontWeight: 800 }}>{brand.name}</h3>
          <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", flex: 1, lineHeight: 1.45, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
            {descText}
          </p>
          
          <button className="btn-outline-gold" style={{ width: "100%", padding: "0.55rem 0", fontSize: "0.82rem", borderRadius: "6px", fontWeight: 700 }}>
            Ver Galería & Perfil
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container" style={{ paddingBottom: "3rem" }}>
      {loading ? (
        <div style={{ textAlign: "center", padding: "6rem 0", display: "flex", flexDirection: "column", gap: "1rem", alignItems: "center" }}>
          <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: "2.5rem", color: "var(--gold-primary)" }}></i>
          <p style={{ color: "var(--text-muted)", fontWeight: "medium", fontSize: "0.95rem" }}>Cargando marcas locales...</p>
        </div>
      ) : (
        <>
          <div className="fade-in">
            {/* Header section with title and filter action */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2.0rem", flexWrap: "wrap", gap: "1rem" }}>
              <div>
                <h2 style={{ fontSize: "1.7rem", fontWeight: 800, letterSpacing: "-0.015em", marginTop: "2px" }}>
                  {hasActiveFilters ? "Resultados de búsqueda" : "Marcas Locales"}
                </h2>
              </div>
              
              <button 
                onClick={() => setFiltersOpen(true)}
                className="btn-outline-gold"
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
                Filtrar Marcas
                {hasActiveFilters && (
                  <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "var(--gold-primary)" }}></span>
                )}
              </button>
            </div>
            
            {hasActiveFilters ? (
              // Filtered list flat grid view
              sortedBrands.length === 0 ? (
                <div style={{ padding: "5rem", textAlign: "center", background: "#FFFFFF", borderRadius: "12px", border: "1px solid var(--border-color)" }}>
                  <i className="fa-solid fa-store-slash" style={{ fontSize: "3rem", color: "var(--border-color)", marginBottom: "1rem" }}></i>
                  <p style={{ color: "var(--text-muted)", fontSize: "0.95rem" }}>No se encontraron marcas con los criterios aplicados.</p>
                  <button 
                    className="btn-outline-gold" 
                    style={{ marginTop: "1.5rem", borderRadius: "20px", padding: "0.4rem 1.2rem", fontSize: "0.85rem" }}
                    onClick={() => {
                      setFilterCategory("all");
                      setSortBy("popular");
                    }}
                  >
                    Restablecer Filtros
                  </button>
                </div>
              ) : (
                <div>
                  <div className="grid-catalog">
                    {sortedBrands.slice(0, visibleCount).map((brand) => (
                      <BrandCard key={brand.id} brand={brand} />
                    ))}
                  </div>
                  
                  {sortedBrands.length > visibleCount && (
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
                        Cargar más marcas
                      </button>
                    </div>
                  )}
                </div>
              )
            ) : (
              // Categorized Carousels view (Default layout like Homepage)
              <div>
                {/* 0. Marcas Destacadas (Popularity ranking using MaxHeap) */}
                {renderBrandsCarouselBlock(
                  "marcas-destacadas",
                  "Marcas Destacadas",
                  "Los creadores y productores locales más visitados de la comunidad",
                  featuredBrands,
                  "all"
                )}

                {/* 1. Render themed sections */}
                {themeSpecs.map(spec => 
                  renderBrandsCarouselBlock(
                    spec.id,
                    spec.title,
                    spec.subtitle,
                    getThemedBrands(spec),
                    spec.fallbackCategory
                  )
                )}

                {/* 2. Render dynamic remaining categories */}
                {remainingCategories.map(cat => {
                  const catBrands = remainingBrands.filter(b => {
                    const parsed = parseDescription(b.description);
                    return (parsed.rubro_general || b.category) === cat;
                  });
                  return renderBrandsCarouselBlock(
                    `dynamic-cat-${cat.toLowerCase().replace(/\s+/g, "-")}`,
                    `Marcas de ${cat}`,
                    `Explora las propuestas locales de ${cat.toLowerCase()}`,
                    catBrands,
                    cat
                  );
                })}

                {/* 3. General listing "Todas las Marcas" */}
                <hr style={{ border: 0, borderTop: "1px solid var(--border-color)", margin: "4rem 0 3rem 0" }} />
                <div style={{ marginBottom: "2rem" }}>
                  <h2 style={{ fontSize: "1.6rem", fontWeight: 800, letterSpacing: "-0.015em" }}>Todas las Marcas</h2>
                  <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginTop: "4px" }}>Descubre todas las propuestas y emprendimientos del ecosistema local</p>
                </div>

                <div className="grid-catalog">
                  {sortedBrands.slice(0, visibleCount).map((brand) => (
                    <BrandCard key={brand.id} brand={brand} />
                  ))}
                </div>

                {sortedBrands.length > visibleCount && (
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
                      Cargar más marcas
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Sliding Left Sidebar for Brands Filtering - Rendered outside fade-in layout wrapper */}
          <div className={`sidebar-backdrop ${filtersOpen ? "open" : ""}`} onClick={() => setFiltersOpen(false)} />
          <div className={`sidebar-panel ${filtersOpen ? "open" : ""}`}>
            <div className="sidebar-header">
              <h3>Filtros de Marcas</h3>
              <button className="sidebar-close-btn" onClick={() => setFiltersOpen(false)} aria-label="Cerrar filtros">
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>
            <div className="sidebar-body">
              {/* Order / Sort */}
              <div>
                <h4 className="sidebar-section-title">
                  <i className="fa-solid fa-sort"></i> Ordenar Por
                </h4>
                <div className="filter-group">
                  <label className={`filter-option-label ${sortBy === "popular" ? "active" : ""}`}>
                    <input 
                      type="radio" 
                      name="sortBy" 
                      className="filter-input-radio"
                      checked={sortBy === "popular"} 
                      onChange={() => setSortBy("popular")} 
                    />
                    🔥 Popularidad / Destaque
                  </label>
                  <label className={`filter-option-label ${sortBy === "name-asc" ? "active" : ""}`}>
                    <input 
                      type="radio" 
                      name="sortBy" 
                      className="filter-input-radio"
                      checked={sortBy === "name-asc"} 
                      onChange={() => setSortBy("name-asc")} 
                    />
                    🔤 Nombre (A - Z)
                  </label>
                  <label className={`filter-option-label ${sortBy === "name-desc" ? "active" : ""}`}>
                    <input 
                      type="radio" 
                      name="sortBy" 
                      className="filter-input-radio"
                      checked={sortBy === "name-desc"} 
                      onChange={() => setSortBy("name-desc")} 
                    />
                    🔤 Nombre (Z - A)
                  </label>
                </div>
              </div>

              {/* Filter by Brand Category / Rubro */}
              <div>
                <h4 className="sidebar-section-title">
                  <i className="fa-solid fa-tags"></i> Rubros Generales
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
                    Todos los rubros
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
            
            <div className="sidebar-footer" style={{ display: "flex", gap: "10px" }}>
              <button 
                className="btn-gold" 
                style={{ flex: 1, padding: "0.6rem 0", borderRadius: "8px", fontSize: "0.85rem", fontWeight: 700 }}
                onClick={() => setFiltersOpen(false)}
              >
                Aplicar
              </button>
              <button 
                className="btn-outline-gold" 
                style={{ flex: 1, padding: "0.6rem 0", borderRadius: "8px", fontSize: "0.85rem", fontWeight: 700 }}
                onClick={() => {
                  setFilterCategory("all");
                  setSortBy("popular");
                  setFiltersOpen(false);
                }}
              >
                Limpiar
              </button>
            </div>
          </div>

          {/* Floating Filter Button */}
          {showFloatingBtn && (
            <button 
              onClick={() => setFiltersOpen(true)} 
              className="floating-filter-btn fade-in"
              aria-label="Abrir filtros de marcas"
            >
              <i className="fa-solid fa-sliders"></i>
              <span>Filtros</span>
              {(filterCategory !== "all" || sortBy !== "popular") && (
                <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#1C1C1E" }}></span>
              )}
            </button>
          )}
        </>
      )}
    </div>
  );
}
