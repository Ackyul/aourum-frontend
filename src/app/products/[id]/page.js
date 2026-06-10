"use client";

import { use } from "react";
import { useApp } from "../../../context/AppContext";
import { useRouter } from "next/navigation";

export default function ProductDetailPage({ params }) {
  const unwrappedParams = use(params);
  const id = Number(unwrappedParams.id);

  const {
    products,
    brands,
    getBrandName,
    loading
  } = useApp();

  const router = useRouter();

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "6rem 0" }}>
        <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: "2.5rem", color: "var(--gold-primary)" }}></i>
        <p style={{ color: "var(--text-muted)", marginTop: "10px" }}>Cargando detalles del producto...</p>
      </div>
    );
  }

  const prod = products.find((p) => p.id === id);
  if (!prod) {
    return (
      <div className="container" style={{ textAlign: "center", padding: "4rem 0" }}>
        <h3>Producto o servicio no encontrado</h3>
        <button onClick={() => router.push("/")} className="btn-gold" style={{ marginTop: "1rem" }}>Volver al Catálogo</button>
      </div>
    );
  }

  const brand = brands.find((b) => b.id === prod.brandId);
  const relatedProds = products.filter((p) => p.brandId === prod.brandId && p.id !== prod.id);

  return (
    <div className="product-details-container">
      {/* Retorno al catálogo */}
      <div style={{ marginBottom: "2rem" }}>
        <button 
          onClick={() => router.push("/")} 
          className="btn-outline-gold" 
          style={{ padding: "0.5rem 1.2rem", fontSize: "0.85rem", borderRadius: "8px", border: "1.5px solid var(--gold-primary)", cursor: "pointer", transition: "var(--transition-smooth)" }}
        >
          <i className="fa-solid fa-arrow-left" style={{ marginRight: 6 }}></i> Volver al Catálogo
        </button>
      </div>

      {/* Main product view split */}
      <div className="product-split-layout">
        {/* Columna Izquierda: Imagen del Producto */}
        <div className="product-image-box">
          <img src={prod.image} alt={prod.name} />
        </div>

        {/* Columna Derecha: Información del Producto y Características */}
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
            <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", display: "block", marginBottom: "2px", fontWeight: 500 }}>Precio Exclusivo AOURUM</span>
            <div style={{ display: "flex", alignItems: "baseline", gap: "10px" }}>
              <span style={{ fontSize: "2.2rem", fontWeight: 800, color: "var(--text-primary)", letterSpacing: "-0.02em" }}>S/ {prod.price.toLocaleString("es-PE")}</span>
              <span style={{ fontSize: "0.85rem", color: "var(--text-gold)", fontWeight: 700 }}><i className="fa-solid fa-shield-halved"></i> Precio Justo Local</span>
            </div>
          </div>

          {/* Tabla de Especificaciones Técnicas */}
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
                <tr>
                  <td className="label">Disponibilidad</td>
                  <td className="value" style={{ color: prod.type === "service" ? "#2563eb" : prod.stock > 0 ? "var(--text-primary)" : "#ef4444", fontWeight: 700 }}>
                    {prod.type === "service" ? "Por Agenda / Cita" : prod.stock > 0 ? `En Stock (${prod.stock} unidades)` : "Agotado Temporalmente"}
                  </td>
                </tr>
                <tr>
                  <td className="label">Ubicación de Origen</td>
                  <td className="value">Arequipa, Perú (100% Local)</td>
                </tr>
                <tr>
                  <td className="label">Garantía</td>
                  <td className="value">Garantía Directa del Productor</td>
                </tr>
                <tr>
                  <td className="label">Coordinación de Entrega</td>
                  <td className="value">A acordar vía WhatsApp con la marca</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Advertencia de compra */}
          <div style={{ background: "rgba(212,175,55,0.06)", border: "1px solid rgba(212,175,55,0.2)", borderRadius: "12px", padding: "1.2rem", marginBottom: "1.8rem" }}>
            <p style={{ fontSize: "0.85rem", color: "var(--gold-dark)", lineHeight: 1.5, display: "flex", gap: "8px" }}>
              <i className="fa-solid fa-circle-info" style={{ marginTop: "3px", fontSize: "0.95rem" }}></i>
              <span>Este es un catálogo virtual de economía circular y cultural. No realizamos transacciones de pago directo. Para comprar o agendar, coordina directamente con el productor.</span>
            </p>
          </div>

          {/* Botones de acción */}
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <a 
              href={`https://api.whatsapp.com/send?phone=51999999999&text=Hola%20${brand ? encodeURIComponent(brand.name) : "Productor"}%20desde%20AOURUM,%20estoy%20interesado%20en%20el%20item%20"${encodeURIComponent(prod.name)}".`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-gold"
              style={{ width: "100%", textDecoration: "none", fontSize: "0.95rem" }}
            >
              <i className="fa-brands fa-whatsapp" style={{ fontSize: "1.2rem" }}></i> Coordinar Adquisición vía WhatsApp
            </a>
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

      {/* Descripción Detallada */}
      <div style={{ borderTop: "1px solid var(--border-color)", paddingTop: "2.5rem", marginBottom: "3.5rem" }}>
        <h3 style={{ fontSize: "1.2rem", fontWeight: 800, marginBottom: "1rem", color: "var(--text-primary)" }}>Descripción Detallada</h3>
        <p style={{ fontSize: "0.95rem", color: "var(--text-primary)", lineHeight: 1.7, whiteSpace: "pre-line" }}>
          {prod.description}
        </p>
      </div>

      {/* Sobre el productor / Ficha de Marca */}
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
              <p style={{ fontSize: "0.88rem", color: "var(--text-primary)", lineHeight: 1.55, marginBottom: "1.2rem" }}>
                {brand.description}
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

      {/* Más de la marca - Colección Cruzada */}
      {relatedProds.length > 0 && (
        <div style={{ borderTop: "1px solid var(--border-color)", paddingTop: "2.5rem" }}>
          <h3 style={{ fontSize: "1.2rem", fontWeight: 800, marginBottom: "1.5rem", color: "var(--text-primary)", display: "flex", alignItems: "center", gap: 8 }}>
            <i className="fa-solid fa-boxes-stacked" style={{ color: "var(--gold-primary)" }}></i>
            Otros productos de <span style={{ color: "var(--gold-dark)" }}>{brand ? brand.name : "esta marca"}</span>
          </h3>
          <div className="grid-catalog">
            {relatedProds.slice(0, 4).map((rp) => (
              <div 
                key={rp.id}
                className="glass-panel"
                style={{ overflow: "hidden", cursor: "pointer", display: "flex", flexDirection: "column" }}
                onClick={() => router.push(`/products/${rp.id}`)}
              >
                <div className="card-img-container" style={{ height: "200px", position: "relative" }}>
                  <img src={rp.image} alt={rp.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} className="card-img-hover" />
                  <span style={{
                    position: "absolute", top: "10px", left: "10px",
                    background: rp.type === "service" ? "#2563eb" : "#d97706",
                    color: "#FFFFFF", padding: "0.2rem 0.5rem", borderRadius: "5px",
                    fontSize: "0.68rem", fontWeight: 700, textTransform: "uppercase"
                  }}>
                    {rp.type === "service" ? "Servicio" : "Producto"}
                  </span>
                </div>
                <div style={{ padding: "1.2rem", flex: 1, display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  <h4 style={{ fontSize: "1.05rem", fontWeight: 800, color: "var(--text-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {rp.name}
                  </h4>
                  <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden", flex: 1, lineHeight: 1.45 }}>
                    {rp.description}
                  </p>
                  
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid rgba(0,0,0,0.04)", paddingTop: "0.6rem", marginTop: "0.4rem" }}>
                    <div>
                      <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "2px" }}>Precio</div>
                      <span style={{ fontSize: "1.1rem", fontWeight: 800 }}>S/ {rp.price.toLocaleString("es-PE")}</span>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "2px" }}>Disponibilidad</div>
                      <span style={{ fontSize: "0.78rem", color: rp.type === "service" ? "#2563eb" : rp.stock > 0 ? "var(--text-primary)" : "#ef4444", fontWeight: 700 }}>
                        {rp.type === "service" ? "Por Agenda" : `Stock: ${rp.stock}`}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
