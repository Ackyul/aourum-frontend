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

const getBandViews = (b) => b.views || b.viewCount || getItemViews(b.name, b.id);

export default function BandsPage() {
  const {
    bands,
    loading,
    searchTerm,
    parseDescription,
    loadBands
  } = useApp();

  useEffect(() => {
    loadBands();
  }, [loadBands]);

  const router = useRouter();

  // State variables for filter and sort
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filterGenre, setFilterGenre] = useState("all");
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

  // Extract unique genres from bands list
  const allGenres = [...new Set(bands.map((b) => b.genre).filter(Boolean))].sort();

  // Reset pagination on search, genre or sort changes
  useEffect(() => {
    setVisibleCount(12);
  }, [searchTerm, filterGenre, sortBy]);

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

  // Helper to handle "Ver todo" on a category or section
  const handleViewAll = (genreName) => {
    const matchedGenre = allGenres.find(g => 
      g.toLowerCase().includes(genreName.toLowerCase()) || 
      genreName.toLowerCase().includes(g.toLowerCase())
    );
    if (matchedGenre) {
      setFilterGenre(matchedGenre);
    } else {
      setFilterGenre("all");
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // 1. Filter bands matching search query and genre selector
  const filteredBands = bands.filter((band) => {
    const descText = parseDescription(band.description).text || "";
    const matchesSearch = band.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          descText.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          band.genre.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesGenre = filterGenre === "all" || (band.genre && band.genre.toLowerCase() === filterGenre.toLowerCase());

    return matchesSearch && matchesGenre;
  });

  // 2. Sort filtered bands based on selected sorting criteria
  const getSortedBands = (bandList) => {
    const listToSort = bandList || filteredBands;
    if (sortBy === "popular") {
      const heap = new MaxHeap((a, b) => getBandViews(a) - getBandViews(b));
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

  const sortedBands = getSortedBands();
  const hasActiveFilters = searchTerm !== "" || filterGenre !== "all" || sortBy !== "popular";

  // Get featured bands sorted internally using MaxHeap
  const getFeaturedBands = () => {
    if (!bands || bands.length === 0) return [];
    const heap = new MaxHeap((a, b) => getBandViews(a) - getBandViews(b));
    bands.forEach(b => heap.insert(b));
    
    const result = [];
    const targetSize = Math.min(6, bands.length);
    for (let i = 0; i < targetSize; i++) {
      const b = heap.extractMax();
      if (b) result.push(b);
    }
    return result;
  };

  const featuredBands = getFeaturedBands();

  // Helper to render horizontal carousels of bands
  const renderBandsCarouselBlock = (id, title, subtitle, list, genreValue) => {
    if (list.length === 0) return null;
    const trackRef = getTrackRef(id);
    const sortedList = getSortedBands(list);

    return (
      <div key={id} className="carousel-container fade-in">
        <div className="carousel-header">
          <div className="carousel-title-group">
            <h2 className="carousel-title">{title}</h2>
            {subtitle && <p className="carousel-subtitle">{subtitle}</p>}
          </div>
          <div className="carousel-actions">
            <button className="carousel-view-all" onClick={() => handleViewAll(genreValue || title)}>
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
            {sortedList.map((band) => (
              <div key={band.id} className="carousel-item">
                <BandCard band={band} isFeatured={id === "bandas-destacadas"} />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // Band card sub-component
  function BandCard({ band, isFeatured }) {
    const totalMembers = band.collaborators ? band.collaborators.length : 1;
    const descText = parseDescription(band.description).text;

    return (
      <div 
        className="glass-panel" 
        style={{ overflow: "hidden", display: "flex", flexDirection: "column", cursor: "pointer", height: "100%" }}
        onClick={() => router.push(`/bands/${band.slug || band.id}`)}
      >
        <div className="card-img-container" style={{ position: "relative" }}>
          <img src={band.image} alt={band.name} className="card-img-hover" />
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
            🎸 {band.genre}
          </span>
          <h3 style={{ fontSize: "1.15rem", fontWeight: 800 }}>{band.name}</h3>
          <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", flex: 1, lineHeight: 1.45, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
            {descText}
          </p>

          <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "6px", marginBottom: "0.6rem" }}>
            <i className="fa-solid fa-users" style={{ color: "var(--gold-primary)" }}></i>
            <span>Integrantes: <strong>{totalMembers}</strong></span>
          </div>
          
          <button className="btn-outline-gold" style={{ width: "100%", padding: "0.55rem 0", fontSize: "0.82rem", borderRadius: "6px", fontWeight: 700 }}>
            Ver Dossier & Perfil
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
          <p style={{ color: "var(--text-muted)", fontWeight: "medium", fontSize: "0.95rem" }}>Cargando bandas de música...</p>
        </div>
      ) : (
        <>
          <div className="fade-in">
            {/* Header section with title and filter action */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2.0rem", flexWrap: "wrap", gap: "1rem" }}>
              <div>
                <h2 style={{ fontSize: "1.7rem", fontWeight: 800, letterSpacing: "-0.015em", marginTop: "2px" }}>
                  {hasActiveFilters ? "Resultados de búsqueda" : "Bandas y Música"}
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
                Filtrar Bandas
                {hasActiveFilters && (
                  <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "var(--gold-primary)" }}></span>
                )}
              </button>
            </div>
            
            {hasActiveFilters ? (
              // Filtered list flat grid view
              sortedBands.length === 0 ? (
                <div style={{ padding: "5rem", textAlign: "center", background: "#FFFFFF", borderRadius: "12px", border: "1px solid var(--border-color)" }}>
                  <i className="fa-solid fa-guitar" style={{ fontSize: "3rem", color: "var(--border-color)", marginBottom: "1rem", opacity: 0.5 }}></i>
                  <p style={{ color: "var(--text-muted)", fontSize: "0.95rem" }}>No se encontraron bandas con los criterios aplicados.</p>
                  <button 
                    className="btn-outline-gold" 
                    style={{ marginTop: "1.5rem", borderRadius: "20px", padding: "0.4rem 1.2rem", fontSize: "0.85rem" }}
                    onClick={() => {
                      setFilterGenre("all");
                      setSortBy("popular");
                    }}
                  >
                    Restablecer Filtros
                  </button>
                </div>
              ) : (
                <div>
                  <div className="grid-catalog">
                    {sortedBands.slice(0, visibleCount).map((band) => (
                      <BandCard key={band.id} band={band} />
                    ))}
                  </div>
                  
                  {sortedBands.length > visibleCount && (
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
                        Cargar más bandas
                      </button>
                    </div>
                  )}
                </div>
              )
            ) : (
              // Categorized Carousels view (Default layout)
              <div>
                {/* 0. Bandas Destacadas (Popularity ranking using MaxHeap) */}
                {renderBandsCarouselBlock(
                  "bandas-destacadas",
                  "Bandas Destacadas",
                  "Las agrupaciones musicales más vistas de la escena local",
                  featuredBands,
                  "all"
                )}

                {/* 1. Render dynamic categories / genres */}
                {allGenres.map(genre => {
                  const genreBands = bands.filter(b => b.genre === genre);
                  return renderBandsCarouselBlock(
                    `genre-${genre.toLowerCase().replace(/\s+/g, "-")}`,
                    `Música ${genre}`,
                    `Explora las propuestas locales de género ${genre.toLowerCase()}`,
                    genreBands,
                    genre
                  );
                })}

                {/* 2. General listing "Todas las Bandas" */}
                <hr style={{ border: 0, borderTop: "1px solid var(--border-color)", margin: "4rem 0 3rem 0" }} />
                <div style={{ marginBottom: "2rem" }}>
                  <h2 style={{ fontSize: "1.6rem", fontWeight: 800, letterSpacing: "-0.015em" }}>Todas las Bandas</h2>
                  <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginTop: "4px" }}>Descubre todas las agrupaciones musicales y solistas del ecosistema local</p>
                </div>

                <div className="grid-catalog">
                  {sortedBands.slice(0, visibleCount).map((band) => (
                    <BandCard key={band.id} band={band} />
                  ))}
                </div>

                {sortedBands.length > visibleCount && (
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
                      Cargar más bandas
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Sliding Left Sidebar for Bands Filtering */}
          <div className={`sidebar-backdrop ${filtersOpen ? "open" : ""}`} onClick={() => setFiltersOpen(false)} />
          <div className={`sidebar-panel ${filtersOpen ? "open" : ""}`}>
            <div className="sidebar-header">
              <h3>Filtros de Bandas</h3>
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

              {/* Filter by Band Genre */}
              <div>
                <h4 className="sidebar-section-title">
                  <i className="fa-solid fa-music"></i> Géneros Musicales
                </h4>
                <div className="filter-group">
                  <label className={`filter-option-label ${filterGenre === "all" ? "active" : ""}`}>
                    <input 
                      type="radio" 
                      name="filterGenre" 
                      className="filter-input-radio"
                      checked={filterGenre === "all"} 
                      onChange={() => setFilterGenre("all")} 
                    />
                    Todos los géneros
                  </label>
                  {allGenres.map(genre => (
                    <label key={genre} className={`filter-option-label ${filterGenre === genre ? "active" : ""}`}>
                      <input 
                        type="radio" 
                        name="filterGenre" 
                        className="filter-input-radio"
                        checked={filterGenre === genre} 
                        onChange={() => setFilterGenre(genre)} 
                      />
                      {genre}
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
                  setFilterGenre("all");
                  setSortBy("popular");
                  setFiltersOpen(false);
                }}
              >
                Limpiar
              </button>
            </div>
          </div>

          {/* Floating Filter Button */}
          <button 
            onClick={() => setFiltersOpen(true)} 
            className={`floating-filter-btn fade-in ${showFloatingBtn ? "visible" : ""}`}
            aria-label="Abrir filtros de bandas"
          >
            <i className="fa-solid fa-sliders"></i>
            <span>Filtros</span>
            {(filterGenre !== "all" || sortBy !== "popular") && (
              <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#1C1C1E" }}></span>
            )}
          </button>
        </>
      )}
    </div>
  );
}
