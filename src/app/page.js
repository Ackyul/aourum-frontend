"use client";

import { useApp } from "../context/AppContext";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function Home() {
  const {
    products,
    brands,
    loading,
    getBrandName,
    filterType, setFilterType,
    filterCategory, setFilterCategory,
    searchTerm
  } = useApp();

  const [filtersOpen, setFiltersOpen] = useState(false);
  const router = useRouter();

  // Filter products based on global search & collapsible filters
  const filteredProducts = products.filter((prod) => {
    const matchesSearch = prod.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          prod.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          getBrandName(prod.brandId).toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === "all" || prod.type === filterType;
    const matchesCategory = filterCategory === "all" || prod.category === filterCategory;
    return matchesSearch && matchesType && matchesCategory;
  });

  return (
    <div className="container" style={{ paddingBottom: "3rem" }}>
      {loading ? (
        <div style={{ textAlign: "center", padding: "6rem 0", display: "flex", flexDirection: "column", gap: "1rem", alignItems: "center" }}>
          <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: "2.5rem", color: "var(--gold-primary)" }}></i>
          <p style={{ color: "var(--text-muted)", fontWeight: "medium", fontSize: "0.95rem" }}>Cargando la vitrina cultural local...</p>
        </div>
      ) : (
        <div className="fade-in">
          
          {/* Header area of catalogue */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2.0rem", flexWrap: "wrap", gap: "1rem" }}>
            <div>
              <span style={{ fontSize: "0.8rem", color: "var(--text-gold)", textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.08em" }}>Vitrina de Emprendedores</span>
              <h2 style={{ fontSize: "1.7rem", fontWeight: 800, letterSpacing: "-0.015em", marginTop: "2px" }}>Marcas Locales & Creativas</h2>
            </div>
            
            <button 
              onClick={() => setFiltersOpen(!filtersOpen)}
              className="btn-outline-gold"
              style={{
                borderRadius: "20px",
                padding: "0.45rem 1.2rem",
                fontSize: "0.85rem",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                cursor: "pointer",
                background: filtersOpen ? "rgba(214,175,55,0.06)" : "transparent"
              }}
            >
              <i className="fa-solid fa-sliders"></i>
              {filtersOpen ? "Ocultar Filtros" : "Mostrar Filtros"}
              {(filterType !== "all" || filterCategory !== "all") && (
                <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "var(--gold-primary)" }}></span>
              )}
            </button>
          </div>

          {/* Collapsible Filter Panel */}
          {filtersOpen && (
            <div 
              className="glass-panel fade-in" 
              style={{ 
                padding: "1.5rem", 
                marginBottom: "2rem", 
                display: "grid", 
                gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", 
                gap: "2rem", 
                border: "1.5px solid var(--gold-primary)" 
              }}
            >
              <div>
                <h3 style={{ fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "0.8rem", color: "var(--text-gold)", fontWeight: 700 }}>
                  <i className="fa-solid fa-sliders" style={{ marginRight: 6 }}></i>Filtrar por Tipo
                </h3>
                <div style={{ display: "flex", gap: "1.2rem", flexWrap: "wrap" }}>
                  <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.88rem", cursor: "pointer", fontWeight: 500 }}>
                    <input type="radio" name="filterType" checked={filterType === "all"} onChange={() => setFilterType("all")} style={{ accentColor: "var(--gold-primary)" }} /> Todos
                  </label>
                  <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.88rem", cursor: "pointer", fontWeight: 500 }}>
                    <input type="radio" name="filterType" checked={filterType === "product"} onChange={() => setFilterType("product")} style={{ accentColor: "var(--gold-primary)" }} /> Productos
                  </label>
                  <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.88rem", cursor: "pointer", fontWeight: 500 }}>
                    <input type="radio" name="filterType" checked={filterType === "service"} onChange={() => setFilterType("service")} style={{ accentColor: "var(--gold-primary)" }} /> Servicios
                  </label>
                </div>
              </div>

              <div>
                <h3 style={{ fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "0.6rem", color: "var(--text-gold)", fontWeight: 700 }}>
                  <i className="fa-solid fa-tags" style={{ marginRight: 6 }}></i>Filtrar por Categoría
                </h3>
                <select 
                  className="form-control" 
                  style={{ width: "100%", maxWidth: "320px" }}
                  value={filterCategory} 
                  onChange={(e) => setFilterCategory(e.target.value)}
                >
                  <option value="all">Todas las categorías</option>
                  {[...new Set(products.map(p => p.category))].map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Catalog items grid */}
          {filteredProducts.length === 0 ? (
            <div style={{ padding: "5rem", textAlign: "center", background: "#FFFFFF", borderRadius: "12px", border: "1px solid var(--border-color)" }}>
              <i className="fa-solid fa-store-slash" style={{ fontSize: "3rem", color: "var(--border-color)", marginBottom: "1rem" }}></i>
              <p style={{ color: "var(--text-muted)", fontSize: "0.95rem" }}>No se encontraron items. Intenta buscando otro término.</p>
            </div>
          ) : (
            <div className="grid-catalog">
              {filteredProducts.map((prod) => (
                <div 
                  key={prod.id} 
                  className="glass-panel" 
                  style={{ overflow: "hidden", display: "flex", flexDirection: "column", cursor: "pointer" }}
                  onClick={() => router.push(`/products/${prod.id}`)}
                >
                  <div className="card-img-container" style={{ height: "220px", width: "100%", position: "relative" }}>
                    <img src={prod.image} alt={prod.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} className="card-img-hover" />
                    <span style={{
                      position: "absolute", top: "12px", left: "12px",
                      background: prod.type === "service" ? "#2563eb" : "#d97706",
                      color: "#FFFFFF", padding: "0.25rem 0.55rem", borderRadius: "6px",
                      fontSize: "0.68rem", fontWeight: 700, textTransform: "uppercase",
                      boxShadow: "0 4px 8px rgba(0,0,0,0.15)"
                    }}>
                      {prod.type === "service" ? "📅 Servicio" : "🛍️ Producto"}
                    </span>
                  </div>
                  <div style={{ padding: "1.2rem", flex: 1, display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                    <span style={{ fontSize: "0.75rem", color: "var(--text-gold)", letterSpacing: "0.05em", textTransform: "uppercase", fontWeight: 700 }}>{prod.category}</span>
                    <h3 style={{ fontSize: "1.05rem", fontWeight: 800, lineHeight: 1.35, color: "var(--text-primary)" }}>{prod.name}</h3>
                    <div 
                      style={{ fontSize: "0.8rem", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "5px" }}
                      onClick={(e) => {
                        e.stopPropagation();
                        const brand = brands.find((b) => b.id === prod.brandId);
                        router.push(`/brands/${brand?.slug || prod.brandId}`);
                      }}
                    >
                      <span>Por:</span>
                      <strong style={{ color: "var(--text-primary)", cursor: "pointer", textDecoration: "underline" }}>{getBrandName(prod.brandId)}</strong>
                    </div>
                    
                    <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden", textOverflow: "ellipsis", flex: 1, lineHeight: 1.45 }}>{prod.description}</p>
                    
                    {/* Price and Stock / Agenda */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid var(--border-color)", paddingTop: "0.8rem", marginTop: "0.4rem" }}>
                      <div>
                        <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "2px" }}>Precio</div>
                        <span style={{ fontSize: "1.1rem", fontWeight: 800, color: "var(--text-primary)" }}>
                          S/ {prod.price.toLocaleString("es-PE")}
                        </span>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "2px" }}>Disponibilidad</div>
                        <span style={{ fontSize: "0.78rem", fontWeight: 700, color: prod.type === "service" ? "#2563eb" : prod.stock == null ? "var(--text-primary)" : prod.stock > 0 ? "var(--text-primary)" : "#ef4444" }}>
                          {prod.type === "service" ? "Por Agenda" : prod.stock == null ? "Disponible" : prod.stock > 0 ? `Stock: ${prod.stock}` : "Agotado"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>
      )}
    </div>
  );
}
