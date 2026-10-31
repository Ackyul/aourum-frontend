"use client";

import { useState } from "react";
import { parsePerfumeInfo } from "./PerfumeryShowcase";

/**
 * Calculates a relative volumetric scale factor for different perfume bottle sizes
 * so that smaller ml (e.g. 25 ml) looks smaller and larger ml (e.g. 100 ml) grows proportionally.
 */
export function getBottleSizeScaleFactor(currentSizeStr, allSizes = []) {
  if (!allSizes || allSizes.length <= 1) return 1.0;

  const parseVol = (s) => {
    if (!s) return null;
    const str = typeof s === "object" ? (s.size || "") : String(s);
    const m = str.match(/(\d+(?:\.\d+)?)\s*(?:ml|g|gr|oz)?/i);
    return m ? parseFloat(m[1]) : null;
  };

  const currentVol = parseVol(currentSizeStr);
  const volumes = allSizes.map(s => parseVol(s)).filter(v => v !== null && v > 0);

  if (!currentVol || volumes.length <= 1) {
    const idx = allSizes.findIndex(s => {
      const val = typeof s === "object" ? (s.size || "") : String(s);
      const curr = typeof currentSizeStr === "object" ? (currentSizeStr.size || "") : String(currentSizeStr);
      return val.trim().toLowerCase() === curr.trim().toLowerCase();
    });
    if (idx >= 0) {
      const step = 0.16 / (allSizes.length - 1);
      return 0.90 + idx * step;
    }
    return 1.0;
  }

  const minVol = Math.min(...volumes);
  const maxVol = Math.max(...volumes);
  if (minVol === maxVol) return 1.0;

  // Gentle volumetric scaling: min size is 88%, max size is 106% of configured scale
  const cubeMin = Math.cbrt(minVol);
  const cubeMax = Math.cbrt(maxVol);
  const cubeCurr = Math.cbrt(currentVol);

  const ratio = (cubeCurr - cubeMin) / (cubeMax - cubeMin);
  return 0.88 + ratio * 0.18;
}

/**
 * ProductCardVisual renders the product image area with automatic support for
 * "El Dúo Visual" (Original Perfume Bottle + Brand Creation Bottle) when
 * originalImg is present for fragrance products.
 */
export default function ProductCardVisual({
  prod,
  perfumeInfo: providedInfo = null,
  activeSize = null,
  allSizes = null,
  brandColor = "var(--gold-primary)",
  isDark = false
}) {
  const [origImgError, setOrigImgError] = useState(false);
  const [brandImgError, setBrandImgError] = useState(false);

  const info = providedInfo || parsePerfumeInfo(prod);
  const hasOriginal = Boolean(info.originalImg && !origImgError);
  
  // Resolve sizes list and current active size
  const sizesList = allSizes || prod?.sizes || info?.sizes || [];
  const currentSizeName = activeSize?.size || activeSize || info?.ml || info?.presentation || "";
  
  // Dynamic scale factor based on active size: 25 ml is smaller, 50 ml medium, 100 ml full size
  const sizeScaleFactor = getBottleSizeScaleFactor(currentSizeName, sizesList);
  const baseDuoScale = info.duoScale || 85;
  const effectiveDuoScale = baseDuoScale * sizeScaleFactor;

  const brandImg = activeSize?.image || prod?.image;

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
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: "150px",
            height: "150px",
            borderRadius: "50%",
            background: isDark
              ? `radial-gradient(circle, ${brandColor || "var(--gold-primary)"}20 0%, transparent 70%)`
              : `radial-gradient(circle, ${brandColor || "var(--gold-primary)"}10 0%, transparent 65%)`,
            pointerEvents: "none"
          }}
        />

        {/* 1. Frasco Original de Inspiración (Segundo plano - Izquierda) */}
        <div
          className="perfume-duo-orig"
          title={`Original de Referencia: ${info.inspiration || "Inspiración Original"}`}
          style={{
            left: `calc(6% + ${(info.origX || 0)}%)`,
            bottom: `calc(4% + ${(info.origY || 0)}%)`,
            transform: `scale(${(info.origScale || 100) / 100})`,
            transformOrigin: "bottom center"
          }}
        >
          <img
            src={info.originalImg}
            alt={`Original: ${info.inspiration || "Inspiración"}`}
            onError={() => setOrigImgError(true)}
            style={{
              width: "auto",
              height: "auto",
              maxWidth: "100%",
              maxHeight: "96%",
              objectFit: "contain"
            }}
          />
        </div>

        {/* 2. Frasco de la Marca (Primer plano - Derecha) */}
        <div
          className="perfume-duo-brand"
          title={prod?.name || "Nuestra Creación"}
          style={{
            right: `calc(5% - ${(info.duoX || 0)}%)`,
            bottom: `calc(5% + ${(info.duoY || 0)}%)`,
            transform: `scale(${effectiveDuoScale / 100})`,
            transformOrigin: "bottom center"
          }}
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
                maxHeight: "98%",
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
        </div>
      </div>
    );
  }

  // Standard single image view
  if (brandImg && !brandImgError) {
    const isCustomBg = Boolean(prod?.imgBgColor && prod?.imgBgColor !== "transparent" && prod?.imgBgColor !== "page_bg");
    const bgContainer = isCustomBg
      ? (prod.imgBgColor === "brand" ? brandColor : prod.imgBgColor)
      : "#FFFFFF";

    const fitMode = (prod?.fit || prod?.objectFit) || (isCustomBg ? "contain" : "cover");

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
            objectFit: fitMode,
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

