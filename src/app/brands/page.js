"use client";

import { useApp } from "../../context/AppContext";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function BrandsPage() {
  const {
    brands,
    loading,
    searchTerm,
    parseDescription
  } = useApp();

  const router = useRouter();

  // Filter brands based on global search in the header
  const filteredBrands = brands.filter((brand) => {
    const descText = parseDescription(brand.description).text;
    const matchesSearch = brand.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          descText.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          brand.category.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  return (
    <div className="container" style={{ paddingBottom: "3rem" }}>
      {loading ? (
        <div style={{ textAlign: "center", padding: "6rem 0", display: "flex", flexDirection: "column", gap: "1rem", alignItems: "center" }}>
          <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: "2.5rem", color: "var(--gold-primary)" }}></i>
          <p style={{ color: "var(--text-muted)", fontWeight: "medium", fontSize: "0.95rem" }}>Cargando marcas locales...</p>
        </div>
      ) : (
        <div className="fade-in">
          <div>
            <div style={{ marginBottom: "2.0rem" }}>
              <h2 style={{ fontSize: "1.7rem", fontWeight: 800, letterSpacing: "-0.015em", marginTop: "2px" }}>Nuestras Marcas</h2>
            </div>
            
            {filteredBrands.length === 0 ? (
              <div style={{ padding: "5rem", textAlign: "center", background: "#FFFFFF", borderRadius: "12px", border: "1px solid var(--border-color)" }}>
                <i className="fa-solid fa-store-slash" style={{ fontSize: "3rem", color: "var(--border-color)", marginBottom: "1rem" }}></i>
                <p style={{ color: "var(--text-muted)", fontSize: "0.95rem" }}>No se encontraron marcas. Intenta buscando otro término.</p>
              </div>
            ) : (
              <div className="grid-catalog">
                {filteredBrands.map((brand) => (
                  <div 
                    key={brand.id} 
                    className="glass-panel" 
                    style={{ overflow: "hidden", display: "flex", flexDirection: "column", cursor: "pointer" }}
                    onClick={() => router.push(`/brands/${brand.slug || brand.id}`)}
                  >
                    <div className="card-img-container" style={{ position: "relative" }}>
                      <img src={brand.logo} alt={brand.name} className="card-img-hover" />
                    </div>
                    <div style={{ padding: "1.2rem", flex: 1, display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                      <span style={{ fontSize: "0.75rem", color: "var(--text-gold)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                        {brand.rubro_especifico || brand.rubro_general || brand.category || "Marca Local"}
                      </span>
                      <h3 style={{ fontSize: "1.15rem", fontWeight: 800 }}>{brand.name}</h3>
                      <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", flex: 1, lineHeight: 1.45 }}>{parseDescription(brand.description).text}</p>
                      
                      <button className="btn-outline-gold" style={{ width: "100%", padding: "0.55rem 0", fontSize: "0.82rem", borderRadius: "6px" }}>
                        Ver Galería & Perfil
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
