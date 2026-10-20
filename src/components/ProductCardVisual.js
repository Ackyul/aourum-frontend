"use client";

import { useState } from "react";
import { parsePerfumeInfo } from "./PerfumeryShowcase";

/**
 * ProductCardVisual renders the product image area with automatic support for
 * "El Dúo Visual" (Original Perfume Bottle + Brand Creation Bottle) when
 * originalImg is present for fragrance products.
 */
export default function ProductCardVisual({
  prod,
  perfumeInfo: providedInfo = null,
  brandColor = "var(--gold-primary)",
  isDark = false
}) {
  const [origImgError, setOrigImgError] = useState(false);
  const [brandImgError, setBrandImgError] = useState(false);

  const info = providedInfo || parsePerfumeInfo(prod);
  const hasOriginal = Boolean(info.originalImg && !origImgError);
  const brandImg = prod?.image;

  if (hasOriginal) {
    return (
      <div 
        className="perfume-duo-wrapper"
        style={{
          background: isDark
            ? "radial-gradient(circle at 50% 50%, rgba(212, 175, 55, 0.12) 0%, rgba(10, 11, 15, 0.6) 100%)"
            : "radial-gradient(circle at 50% 50%, rgba(212, 175, 55, 0.06) 0%, rgba(0, 0, 0, 0.04) 100%)"
        }}
      >
        {/* Ambient subtle radial glow */}
        <div
          style={{
            position: "absolute",
            top: "45%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: "160px",
            height: "160px",
            borderRadius: "50%",
            background: `radial-gradient(circle, ${brandColor || "var(--gold-primary)"}22 0%, transparent 70%)`,
            pointerEvents: "none"
          }}
        />

        {/* 1. Frasco Original de Inspiración (Segundo plano - Izquierda) */}
        <div
          className="perfume-duo-orig"
          title={`Original de Referencia: ${info.inspiration || "Inspiración Original"}`}
        >
          <img
            src={info.originalImg}
            alt={`Original: ${info.inspiration || "Inspiración"}`}
            onError={() => setOrigImgError(true)}
            style={{
              width: "auto",
              height: "auto",
              maxWidth: "100%",
              maxHeight: "75%",
              objectFit: "contain"
            }}
          />
          <span className="perfume-duo-badge orig-badge">
            💎 Original
          </span>
        </div>

        {/* 2. Frasco de la Marca (Primer plano - Derecha) */}
        <div
          className="perfume-duo-brand"
          title={prod?.name || "Nuestra Creación"}
        >
          {brandImg && !brandImgError ? (
            <img
              src={brandImg}
              alt={prod?.name || "Perfume"}
              onError={() => setBrandImgError(true)}
              style={{
                width: "auto",
                height: "auto",
                maxWidth: "100%",
                maxHeight: "76%",
                objectFit: "contain"
              }}
            />
          ) : (
            <div style={{ textAlign: "center", marginBottom: "6px" }}>
              <i 
                className="fa-solid fa-wine-bottle" 
                style={{ fontSize: "2.8rem", color: brandColor || "var(--gold-primary)", opacity: 0.9 }}
              />
            </div>
          )}
          <span 
            className="perfume-duo-badge brand-badge"
            style={{ background: brandColor || "var(--gold-primary)" }}
          >
            ✨ Creación
          </span>
        </div>
      </div>
    );
  }

  // Standard single image view
  if (brandImg && !brandImgError) {
    const isContain = prod?.imgBgColor && prod?.imgBgColor !== "transparent";
    return (
      <img
        src={brandImg}
        alt={prod?.name || "Producto"}
        className="card-img-hover"
        onError={() => setBrandImgError(true)}
        style={{
          width: "100%",
          height: "100%",
          objectFit: isContain ? "contain" : "cover",
          padding: isContain ? "10px" : "0"
        }}
      />
    );
  }

  // Fallback empty placeholder
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: isDark ? "#A1A1AA" : "var(--text-muted)",
        fontSize: "2.2rem"
      }}
    >
      <i className="fa-solid fa-box-open" style={{ opacity: 0.4 }} />
    </div>
  );
}
