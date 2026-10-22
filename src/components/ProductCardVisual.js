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
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          background: isDark
            ? "radial-gradient(circle at 50% 50%, rgba(212, 175, 55, 0.12) 0%, rgba(10, 11, 15, 0.5) 100%)"
            : "radial-gradient(circle at 50% 50%, rgba(212, 175, 55, 0.05) 0%, transparent 100%)"
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
    const bgContainer = (prod?.imgBgColor && prod?.imgBgColor !== "transparent" && prod?.imgBgColor !== "page_bg")
      ? (prod.imgBgColor === "brand" ? brandColor : prod.imgBgColor)
      : "#FFFFFF";

    return (
      <div
        className="product-visual-container"
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          backgroundColor: bgContainer,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden"
        }}
      >
        <img
          src={brandImg}
          alt={prod?.name || "Producto"}
          className="product-visual-img card-img-hover"
          onError={() => setBrandImgError(true)}
          style={{
            width: "100%",
            height: "100%",
            maxWidth: "100%",
            maxHeight: "100%",
            objectFit: "contain",
            transition: "transform 0.35s cubic-bezier(0.16, 1, 0.3, 1)"
          }}
        />
      </div>
    );
  }

  // Fallback empty placeholder
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: isDark
          ? "radial-gradient(circle at 50% 50%, rgba(212, 175, 55, 0.08) 0%, rgba(20, 20, 24, 0.6) 100%)"
          : "radial-gradient(circle at 50% 50%, rgba(212, 175, 55, 0.06) 0%, rgba(248, 247, 244, 0.9) 100%)",
        padding: "16px",
        gap: "6px"
      }}
    >
      <div
        style={{
          width: "48px",
          height: "48px",
          borderRadius: "14px",
          background: isDark ? "rgba(255, 255, 255, 0.06)" : "rgba(255, 255, 255, 0.8)",
          border: `1.5px solid ${brandColor || "var(--gold-primary)"}35`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.05)"
        }}
      >
        <i
          className="fa-solid fa-box-open"
          style={{ fontSize: "1.3rem", color: brandColor || "var(--gold-primary)", opacity: 0.85 }}
        />
      </div>
      <span
        style={{
          fontSize: "0.62rem",
          fontWeight: 700,
          color: isDark ? "rgba(255, 255, 255, 0.5)" : "var(--text-muted)",
          textTransform: "uppercase",
          letterSpacing: "0.06em"
        }}
      >
        AOURUM Vitrina
      </span>
    </div>
  );
}

