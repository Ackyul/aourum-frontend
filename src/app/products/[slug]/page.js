"use client";

import { use, useMemo, useEffect } from "react";
import { useApp } from "../../../context/AppContext";
import { useRouter } from "next/navigation";

export default function ProductDetailPage({ params }) {
  const unwrappedParams = use(params);
  const slugParam = unwrappedParams.slug;

  const {
    products,
    brands,
    loading,
    parseDescription,
    loadProducts,
    loadBrands,
    activeRole,
    setShowLoginModal,
    triggerNotification
  } = useApp();

  const router = useRouter();

  useEffect(() => {
    loadProducts();
    loadBrands();
  }, [loadProducts, loadBrands]);

  const prod = useMemo(() => {
    if (!products.length) return null;
    const bySlug = products.find((p) => p.slug === slugParam);
    if (bySlug) return bySlug;
    const numId = Number(slugParam);
    if (!isNaN(numId)) return products.find((p) => p.id === numId);
    return null;
  }, [products, slugParam]);

  const isNumericSlug = /^\d+$/.test(slugParam);

  // Redirect from numeric ID to slug-based URL
  useEffect(() => {
    if (prod && prod.slug && isNumericSlug) {
      router.replace(`/products/${prod.slug}`);
    }
  }, [prod, isNumericSlug, router]);

  const randomBrandProds = useMemo(() => {
    if (!prod) return [];
    const brandProds = products.filter((p) => p.brandId === prod.brandId && p.id !== prod.id);
    
    // Deterministic pseudo-random shuffle based on product ID to keep it pure
    let seed = 0;
    const idStr = String(prod.id || "");
    for (let i = 0; i < idStr.length; i++) {
      seed += idStr.charCodeAt(i);
    }
    const random = () => {
      const x = Math.sin(seed++) * 10000;
      return x - Math.floor(x);
    };
    const shuffled = [...brandProds].sort(() => random() - 0.5);
    return shuffled.slice(0, 8);
  }, [prod, products]);

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "6rem 0" }}>
        <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: "2.5rem", color: "var(--gold-primary)" }}></i>
        <p style={{ color: "var(--text-muted)", marginTop: "10px" }}>Cargando detalles del producto...</p>
      </div>
    );
  }

  if (!prod) {
    return (
      <div className="container" style={{ textAlign: "center", padding: "4rem 0" }}>
        <h3>Producto o servicio no encontrado</h3>
        <button onClick={() => router.push("/")} className="btn-gold" style={{ marginTop: "1rem" }}>Volver al Catálogo</button>
      </div>
    );
  }

  const brand = brands.find((b) => b.id === prod.brandId);

  const whatsappNumber = brand?.whatsappNumber || "51999999999";
  const whatsappLink = `https://api.whatsapp.com/send?phone=${whatsappNumber}&text=Hola%20${brand ? encodeURIComponent(brand.name) : "Productor"}%20desde%20AOURUM,%20estoy%20interesado%20en%20el%20item%20"${encodeURIComponent(prod.name)}".`;

  return (
    <div className="product-details-container">
      <head>
        <title>{`${prod.name} | AOURUM`}</title>
        <meta name="description" content={prod.description ? prod.description.substring(0, 160) : `Compra ${prod.name} en AOURUM, el nodo central del talento local.`} />
        <meta property="og:title" content={`${prod.name} | AOURUM`} />
        <meta property="og:description" content={prod.description ? prod.description.substring(0, 160) : `Compra ${prod.name} en AOURUM.`} />
        <meta property="og:image" content={prod.image || "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=1200&q=80"} />
        <link rel="canonical" href={`https://aourum.com/products/${prod.slug || prod.id}`} />
      </head>
      
      <div style={{ marginBottom: "2rem" }}>
        <button 
          onClick={() => router.push("/")} 
          className="btn-outline-gold" 
          style={{ padding: "0.5rem 1.2rem", fontSize: "0.85rem", borderRadius: "8px", border: "1.5px solid var(--gold-primary)", cursor: "pointer", transition: "var(--transition-smooth)" }}
        >
          <i className="fa-solid fa-arrow-left" style={{ marginRight: 6 }}></i> Volver al Catálogo
        </button>
      </div>

      
      <div className="product-split-layout">
        
        <div className="product-image-box">
          <img src={prod.image} alt={prod.name} />
        </div>

        
        <div>
          <div style={{ display: "flex", gap: "10px", alignItems: "center", marginBottom: "0.5rem" }}>
            <span style={{
              background: "rgba(214,175,55,0.1)",
              border: "1px solid rgba(214,175,55,0.3)",
              color: "var(--gold-dark)",
              padding: "0.25rem 0.6rem",
              borderRadius: "6px",
              fontSize: "0.72rem",
              fontWeight: 700,
              textTransform: "uppercase"
            }}>
              {prod.category}
            </span>
            <span style={{
              background: prod.type === "service" ? "#2563eb" : "#d97706",
              color: "#FFFFFF",
              padding: "0.25rem 0.6rem",
              borderRadius: "6px",
              fontSize: "0.72rem",
              fontWeight: 700,
              textTransform: "uppercase"
            }}>
              {prod.type === "service" ? "📅 Servicio" : "🛍️ Producto"}
            </span>
          </div>

          <h1 style={{ fontSize: "2.2rem", fontWeight: 800, color: "var(--text-primary)", lineHeight: 1.25, letterSpacing: "-0.015em", marginBottom: "0.4rem" }}>
            {prod.name}
          </h1>

          <div style={{ fontSize: "0.92rem", color: "var(--text-muted)", marginBottom: "1.5rem" }}>
            Elaborado y vendido por: <strong style={{ color: "var(--text-primary)", textDecoration: "underline", cursor: "pointer" }} onClick={() => router.push(`/brands/${brand?.slug || prod.brandId}`)}>{brand ? brand.name : "Marca Local"}</strong>
          </div>

          <div style={{ background: "var(--bg-input)", padding: "1.2rem 1.5rem", borderRadius: "12px", border: "1px solid var(--border-color)", marginBottom: "1.8rem" }}>
            <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", display: "block", marginBottom: "2px", fontWeight: 500 }}>
              {prod.priceAourum ? "Oferta Especial AOURUM" : "Precio Exclusivo"}
            </span>
            <div style={{ display: "flex", alignItems: "baseline", gap: "12px", flexWrap: "wrap" }}>
              {prod.priceAourum ? (
                <>
                  <span style={{ fontSize: "2.2rem", fontWeight: 800, color: "var(--text-gold)", letterSpacing: "-0.02em" }}>
                    S/ {prod.priceAourum.toLocaleString("es-PE")}
                  </span>
                  <span style={{ fontSize: "1.3rem", color: "var(--text-muted)", textDecoration: "line-through", fontWeight: 500 }}>
                    S/ {prod.price.toLocaleString("es-PE")}
                  </span>
                  <span style={{ fontSize: "0.85rem", color: "var(--text-gold)", fontWeight: 700 }}>
                    <i className="fa-solid fa-gift"></i> Precio Especial
                  </span>
                </>
              ) : (
                <>
                  <span style={{ fontSize: "2.2rem", fontWeight: 800, color: "var(--text-primary)", letterSpacing: "-0.02em" }}>
                    S/ {prod.price.toLocaleString("es-PE")}
                  </span>
                  <span style={{ fontSize: "0.85rem", color: "var(--text-gold)", fontWeight: 700 }}>
                    <i className="fa-solid fa-shield-halved"></i> Precio Justo Local
                  </span>
                </>
              )}
            </div>
          </div>

          
          <div style={{ marginBottom: "2rem" }}>
            <h3 style={{ fontSize: "1.05rem", fontWeight: 700, borderBottom: "1.5px solid var(--border-color)", paddingBottom: "0.4rem", marginBottom: "0.8rem", color: "var(--text-primary)" }}>
              <i className="fa-solid fa-list-check" style={{ color: "var(--gold-primary)", marginRight: 8 }}></i> Especificaciones Técnicas
            </h3>
            <table className="specs-table">
              <tbody>
                <tr>
                  <td className="label">Rubro o Categoría</td>
                  <td className="value">{prod.category}</td>
                </tr>
                <tr>
                  <td className="label">Tipo de Catálogo</td>
                  <td className="value">{prod.type === "service" ? "Servicio / Experiencia" : "Producto Físico"}</td>
                </tr>
                
                {prod.type === "service" && (
                  <tr>
                    <td className="label">Disponibilidad</td>
                    <td className="value" style={{ color: "#2563eb", fontWeight: 700 }}>Por Agenda / Cita</td>
                  </tr>
                )}
                {prod.type !== "service" && prod.stock != null && (
                  <tr>
                    <td className="label">Disponibilidad</td>
                    <td className="value" style={{ color: prod.stock > 0 ? "var(--text-primary)" : "#ef4444", fontWeight: 700 }}>
                      {prod.stock > 0 ? `En Stock (${prod.stock} unidades)` : "Agotado Temporalmente"}
                    </td>
                  </tr>
                )}

              </tbody>
            </table>
          </div>

          
          <div style={{ background: "rgba(212,175,55,0.06)", border: "1px solid rgba(212,175,55,0.2)", borderRadius: "12px", padding: "1.2rem", marginBottom: "1.8rem" }}>
            <p style={{ fontSize: "0.85rem", color: "var(--gold-dark)", lineHeight: 1.5, display: "flex", gap: "8px" }}>
              <i className="fa-solid fa-circle-info" style={{ marginTop: "3px", fontSize: "0.95rem" }}></i>
              <span>Este es un catálogo virtual de economía circular y cultural. No realizamos transacciones de pago directo. Para comprar o agendar, coordina directamente con el productor.</span>
            </p>
          </div>

          
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {brand?.whatsappNumber ? (
              activeRole ? (
                <a 
                  href={whatsappLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-gold"
                  style={{ width: "100%", textDecoration: "none", fontSize: "0.95rem" }}
                >
                  <i className="fa-brands fa-whatsapp" style={{ fontSize: "1.2rem" }}></i> Coordinar Adquisición vía WhatsApp
                </a>
              ) : (
                <button 
                  onClick={() => {
                    triggerNotification(false, "Debes iniciar sesión para coordinar la adquisición.");
                    setShowLoginModal(true);
                  }}
                  className="btn-gold"
                  style={{ width: "100%", fontSize: "0.95rem", cursor: "pointer" }}
                >
                  <i className="fa-brands fa-whatsapp" style={{ fontSize: "1.2rem" }}></i> Coordinar Adquisición vía WhatsApp
                </button>
              )
            ) : (
              <div style={{ background: "rgba(212,175,55,0.06)", border: "1px dashed rgba(212,175,55,0.4)", borderRadius: "10px", padding: "1rem", textAlign: "center" }}>
                <p style={{ fontSize: "0.82rem", color: "var(--text-muted)", margin: "0 0 6px 0" }}>
                  <i className="fa-brands fa-whatsapp" style={{ color: "#25d366", marginRight: 6 }}></i>
                  <strong>WhatsApp de la marca:</strong>
                </p>
                <p style={{ fontSize: "0.78rem", color: "var(--text-muted)", margin: 0 }}>
                  Esta marca aún no ha configurado su número de contacto.
                  <br />Visita su galería para más información.
                </p>
              </div>
            )}
            <button 
              onClick={() => router.push(`/brands/${brand?.slug || prod.brandId}`)}
              className="btn-outline-gold"
              style={{ width: "100%", fontSize: "0.95rem" }}
            >
              <i className="fa-solid fa-store"></i> Visitar Galería de la Marca
            </button>
          </div>
        </div>
      </div>

      
      <div style={{ borderTop: "1px solid var(--border-color)", paddingTop: "2.5rem", marginBottom: "3.5rem" }}>
        <h3 style={{ fontSize: "1.2rem", fontWeight: 800, marginBottom: "1rem", color: "var(--text-primary)" }}>Descripción Detallada</h3>
        <p style={{ fontSize: "0.95rem", color: "var(--text-primary)", lineHeight: 1.7, whiteSpace: "pre-line" }}>
          {prod.description}
        </p>
      </div>

      
      {randomBrandProds.length > 0 && (
        <div style={{ borderTop: "1px solid var(--border-color)", paddingTop: "2.5rem", marginBottom: "3.5rem" }}>
          <h3 style={{ fontSize: "1.2rem", fontWeight: 800, marginBottom: "1.5rem", color: "var(--text-primary)", display: "flex", alignItems: "center", gap: 8 }}>
            <i className="fa-solid fa-boxes-stacked" style={{ color: "var(--gold-primary)" }}></i>
            Otros productos de <span style={{ color: "var(--gold-dark)" }}>{brand ? brand.name : "esta marca"}</span>
          </h3>
          <div className="grid-catalog">
            {randomBrandProds.map((rp) => (
              <div 
                key={rp.id}
                className="glass-panel product-card"
                style={{ overflow: "hidden", cursor: "pointer", display: "flex", flexDirection: "column" }}
                onClick={() => router.push(`/products/${rp.slug || rp.id}`)}
              >
                <div className="card-img-container" style={{ position: "relative" }}>
                  <img src={rp.image} alt={rp.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} className="card-img-hover" />
                </div>
                <div style={{ padding: "1.2rem", flex: 1, display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  <h4 style={{ fontSize: "1.05rem", fontWeight: 800, color: "var(--text-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {rp.name}
                  </h4>
                  
                  <div style={{ 
                    display: "flex", 
                    justifyContent: "space-between", 
                    alignItems: "center", 
                    borderTop: "1px solid var(--border-color)", 
                    paddingTop: "0.8rem", 
                    marginTop: "auto" 
                  }}>
                    <div>
                      {rp.priceAourum ? (
                        <div style={{ display: "flex", flexDirection: "column", gap: "1px" }}>
                          <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", textDecoration: "line-through" }}>
                            S/ {rp.price.toLocaleString("es-PE")}
                          </span>
                          <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                            <span style={{ fontSize: "1.05rem", fontWeight: 800, color: "var(--text-gold)" }}>
                              S/ {rp.priceAourum.toLocaleString("es-PE")}
                            </span>
                            <span style={{ fontSize: "0.55rem", background: "var(--gold-gradient)", color: "#1C1C1E", padding: "1px 4px", borderRadius: "3px", fontWeight: "bold", textTransform: "uppercase" }}>
                              Aourum
                            </span>
                          </div>
                        </div>
                      ) : (
                        <span style={{ fontSize: "1.05rem", fontWeight: 800, color: "var(--text-primary)" }}>
                          S/ {rp.price.toLocaleString("es-PE")}
                        </span>
                      )}
                    </div>
                     <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "2px" }}>
                       <span className="card-type-label" style={{
                         fontSize: "0.65rem",
                         fontWeight: 700,
                         textTransform: "uppercase",
                         color: rp.type === "service" ? "#1e3a8a" : "#78350f",
                         letterSpacing: "0.03em"
                       }}>
                         {rp.type === "service" ? "Servicio" : "Producto"}
                       </span>
                       <span className="card-stock-label" style={{
                         fontSize: "0.65rem",
                         fontWeight: 700,
                         padding: "2px 6px",
                         borderRadius: "8px",
                         textTransform: "uppercase",
                         letterSpacing: "0.02em",
                         background: rp.type === "service" ? "#dbeafe" : (rp.stock == null || rp.stock > 0) ? "#dcfce7" : "#fee2e2",
                         color: rp.type === "service" ? "#1e40af" : (rp.stock == null || rp.stock > 0) ? "#15803d" : "#b91c1c"
                       }}>
                         {rp.type === "service" ? "Agenda" : (rp.stock == null || rp.stock > 0) ? "Stock" : "Agotado"}
                       </span>
                     </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      
      {brand && (
        <div style={{ borderTop: "1px solid var(--border-color)", paddingTop: "2.5rem", marginBottom: "3.5rem" }}>
          <h3 style={{ fontSize: "1.2rem", fontWeight: 800, marginBottom: "1.2rem", color: "var(--text-primary)" }}>
            <i className="fa-solid fa-user-tie" style={{ color: "var(--gold-primary)", marginRight: 8 }}></i> Sobre la Marca / Productor
          </h3>
          <div className="brand-banner-card">
            <img src={brand.logo} alt={brand.name} className="brand-banner-logo" />
            <div style={{ flex: 1 }}>
              <span style={{ fontSize: "0.78rem", color: "var(--text-gold)", textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.05em" }}>
                {brand.category}
              </span>
              <h4 style={{ fontSize: "1.5rem", fontWeight: 800, margin: "2px 0 6px 0", letterSpacing: "-0.015em" }}>
                {brand.name}
              </h4>
              <p style={{ fontSize: "0.82rem", color: "var(--text-muted)", marginBottom: "0.8rem" }}>
                <i className="fa-solid fa-user-tag" style={{ marginRight: 6 }}></i> Fundador: <strong>{brand.owner}</strong>
              </p>
              {brand.whatsappNumber && (
                <p style={{ fontSize: "0.82rem", color: "var(--text-muted)", marginBottom: "0.8rem", display: "flex", alignItems: "center", gap: 6 }}>
                  <i className="fa-brands fa-whatsapp" style={{ color: "#25d366", fontSize: "1rem" }}></i>
                  <strong>WhatsApp:</strong>
                  {activeRole ? (
                    <span 
                      style={{ cursor: "pointer", color: "#25d366", fontWeight: 700, textDecoration: "underline" }}
                      onClick={() => { 
                        navigator.clipboard?.writeText(brand.whatsappNumber); 
                        triggerNotification(true, "Número de WhatsApp copiado al portapapeles.");
                      }}
                      title="Haz clic para copiar"
                    >
                      +{brand.whatsappNumber}
                    </span>
                  ) : (
                    <span 
                      style={{ cursor: "pointer", color: "var(--text-muted)", textDecoration: "underline" }}
                      onClick={() => {
                        triggerNotification(false, "Debes iniciar sesión para ver el número de contacto.");
                        setShowLoginModal(true);
                      }}
                      title="Inicia sesión para ver número"
                    >
                      Iniciar sesión para ver número
                    </span>
                  )}
                </p>
              )}
              <p style={{ fontSize: "0.88rem", color: "var(--text-primary)", lineHeight: 1.55, marginBottom: "1.2rem" }}>
                {parseDescription(brand.description).text}
              </p>
              <button 
                onClick={() => router.push(`/brands/${brand.slug || brand.id}`)}
                className="btn-outline-gold"
                style={{ padding: "0.45rem 1.2rem", fontSize: "0.82rem", borderRadius: "6px" }}
              >
                Ver Catálogo Completo de {brand.name}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
