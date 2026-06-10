"use client";

import { useApp } from "../../context/AppContext";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function BrandsPage() {
  const {
    brands,
    loading,
    searchTerm
  } = useApp();

  const router = useRouter();

  const filteredBrands = brands.filter((brand) => {
    const matchesSearch = brand.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          brand.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
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
              <span style={{ fontSize: "0.8rem", color: "var(--text-gold)", textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.08em" }}>Creadores Locales</span>
              <h2 style={{ fontSize: "1.7rem", fontWeight: 800, letterSpacing: "-0.015em", marginTop: "2px" }}>Marcas de Diseño & Arte</h2>
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
                    <div className="card-img-container" style={{ height: "230px", width: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg-input)" }}>
                      <img src={brand.logo} alt={brand.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} className="card-img-hover" />
                    </div>
                    <div style={{ padding: "1.2rem", flex: 1, display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                      <span style={{ fontSize: "0.75rem", color: "var(--text-gold)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>{brand.category}</span>
                      <h3 style={{ fontSize: "1.15rem", fontWeight: 800 }}>{brand.name}</h3>
                      <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", flex: 1, lineHeight: 1.45 }}>{brand.description}</p>
                      
                      <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "6px", marginBottom: "0.6rem" }}>
                        <i className="fa-solid fa-user-tag" style={{ color: "var(--gold-primary)" }}></i>
                        <span>Dueño: <strong>{brand.owner}</strong></span>
                      </div>

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
