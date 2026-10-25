"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";

// Helper universal para extraer presentación, tamaño, gramaje o cantidad de CUALQUIER producto
export function parseProductPresentation(prod) {
  if (!prod) {
    return {
      presentation: "",
      cleanName: ""
    };
  }

  const name = prod.name || "";
  let rawDesc = prod.description || "";
  let meta = {};

  if (typeof rawDesc === "string" && rawDesc.trim().startsWith("{")) {
    try {
      meta = JSON.parse(rawDesc);
      rawDesc = meta.text || meta.description || "";
    } catch (e) {}
  }

  let presentation = meta.presentation || meta.presentacion || meta.size || meta.tamano || meta.ml || meta.volume || meta.portion || meta.porcion || "";

  // 1. Corchetes explícitos en la descripción: [Presentación: 200 gr], [Tamaño: M], [ML: 50 ml], [Porción: ...]
  if (!presentation) {
    const pMatch = rawDesc.match(/\[\s*(?:presentaci[oó]n|tama[ñn]o|cantidad|gramaje|volumen|ml|porci[oó]n)\s*:\s*([^\]]+)\]/i);
    if (pMatch && pMatch[1]) {
      presentation = pMatch[1].trim();
    }
  }

  // 2. Paréntesis en el nombre: ej. "Mixto de fruta deshidratada (200gr)" -> "200gr"
  if (!presentation) {
    const parenMatch = name.match(/\((?:tamaño|presentación)?\s*([^)]*(?:gr|g|kg|ml|oz|litros?|l|pack|talla\s+[smlx]+|[smlx]{1,3})[^)]*)\)/i);
    if (parenMatch && parenMatch[1]) {
      presentation = parenMatch[1].trim();
    }
  }

  // 3. Patrón de peso/volumen aislado en el nombre
  if (!presentation) {
    const standaloneMatch = name.match(/\b(\d+(?:\.\d+)?\s*(?:gr|g|kg|ml|oz))\b/i);
    if (standaloneMatch && standaloneMatch[1]) {
      presentation = standaloneMatch[1].trim();
    }
  }

  // Parse multiple embedded sizes/variations if present
  let sizes = [];
  if (Array.isArray(meta.sizes) && meta.sizes.length > 0) {
    sizes = meta.sizes;
  } else if (Array.isArray(prod?.sizes) && prod.sizes.length > 0) {
    sizes = prod.sizes;
  } else {
    const sizesMatch = rawDesc.match(/\[\s*(?:tama[ñn]os|sizes|variaciones|presentaciones)\s*:\s*(\[[^\]]+\])\s*\]/i);
    if (sizesMatch && sizesMatch[1]) {
      try {
        sizes = JSON.parse(sizesMatch[1]);
      } catch (e) {}
    }
  }

  // Nombre base limpio sin sufijo de tamaño/presentación entre paréntesis
  let cleanName = name
    .replace(/\s*\((?:tamaño|presentación)?\s*[^)]*(?:gr|g|kg|ml|oz|litros?|l|pack|talla\s+[smlx]+|[smlx]{1,3})[^)]*\)/gi, "")
    .replace(/\s*-\s*\d+(?:\.\d+)?\s*(?:gr|g|kg|ml|oz)/gi, "")
    .trim();

  return {
    presentation,
    cleanName: cleanName || name,
    sizes
  };
}

// Helper to intelligently extract inspiration, original bottle image, gender, family and concentration from product
export function parsePerfumeInfo(prod) {
  if (!prod) {
    return {
      inspiration: "",
      originalImg: "",
      family: "",
      gender: "",
      concentration: "",
      ml: "",
      presentation: "",
      cleanName: "",
      cleanDesc: "",
      sizes: []
    };
  }

  const name = prod.name || "";
  let rawDesc = prod.description || "";
  let meta = {};

  if (typeof rawDesc === "string" && rawDesc.trim().startsWith("{")) {
    try {
      meta = JSON.parse(rawDesc);
      rawDesc = meta.text || meta.description || "";
    } catch (e) {}
  }

  let inspiration = meta.inspiration || meta.original || meta.inspiradoEn || "";
  let originalImg = meta.originalImg || meta.originalImage || meta.inspirationImg || prod.originalImg || prod.originalImage || "";
  let family = meta.family || meta.familia || "";
  let gender = meta.gender || meta.genero || "";
  let concentration = meta.concentration || "";
  let ml = meta.ml || meta.volume || "";

  // Check brackets for original bottle image: [OriginalImg: https://...] or [FrascoOriginal: ...]
  if (!originalImg) {
    const origMatch = rawDesc.match(/\[\s*(?:originalimg|originalimage|frascooriginal|inspiracionimg|original_img)\s*:\s*([^\]]+)\]/i);
    if (origMatch && origMatch[1]) {
      originalImg = origMatch[1].trim();
    }
  }

  // Check brackets in description like [Inspiración: Sauvage - Dior] or [Insp: Sauvage]
  if (!inspiration) {
    const bracketMatch = rawDesc.match(/\[\s*(?:inspiraci[oó]n|inspirado en|original|ref|tendencia)\s*:\s*([^\]]+)\]/i);
    if (bracketMatch && bracketMatch[1]) {
      inspiration = bracketMatch[1].trim();
    }
  }

  // Check regex in text: "Inspirado en: Sauvage de Dior", "Inspiración: Baccarat Rouge", "Original: Creed Aventus"
  if (!inspiration) {
    const textMatch = `${name} ${rawDesc}`.match(/(?:inspirad[oa]\s*(?:en)?|inspiraci[oó]n\s*(?:en)?|original\s*:?|ref\s*:?|tendencia\s*:?)\s*[:\-–]?\s*([^.,;\n\r()]+)/i);
    if (textMatch && textMatch[1]) {
      inspiration = textMatch[1].trim();
    }
  }

  // Gender detection: [Género: Hombre], [Género: Mujer], [Género: Unisex]
  if (!gender) {
    const bracketGender = rawDesc.match(/\[\s*g[eé]nero\s*:\s*([^\]]+)\]/i);
    if (bracketGender && bracketGender[1]) {
      gender = bracketGender[1].trim();
    } else {
      const combined = `${name} ${rawDesc} ${prod.category || ""}`.toLowerCase();
      if (/\b(?:hombre|masculin[oa]|pour homme|men|elixir)\b/i.test(combined)) {
        gender = "Hombre";
      } else if (/\b(?:mujer|femenin[oa]|pour femme|women)\b/i.test(combined)) {
        gender = "Mujer";
      } else if (/\bunisex\b/i.test(combined)) {
        gender = "Unisex";
      }
    }
  }

  // Normalize gender
  if (gender) {
    const gLower = gender.toLowerCase();
    if (gLower.includes("hombre") || gLower.includes("masculin")) gender = "Hombre";
    else if (gLower.includes("mujer") || gLower.includes("femenin")) gender = "Mujer";
    else if (gLower.includes("unisex")) gender = "Unisex";
  }

  // Concentration detection — only if explicitly in brackets or meta
  if (!concentration) {
    const bracketConc = rawDesc.match(/\[\s*concentraci[oó]n\s*:\s*([^\]]+)\]/i);
    if (bracketConc && bracketConc[1]) {
      concentration = bracketConc[1].trim();
    }
  }
  if (/50%\s*esencia/i.test(concentration)) {
    concentration = "";
  }

  // Volume/ML detection
  if (!ml) {
    const bracketMl = rawDesc.match(/\[\s*(?:ml|volumen|tama[ñn]o|presentaci[oó]n)\s*:\s*([^\]]+)\]/i);
    if (bracketMl && bracketMl[1]) {
      ml = bracketMl[1].trim();
    } else {
      const mlMatch = `${name} ${rawDesc}`.match(/\b(\d+\s*ml)\b/i);
      if (mlMatch) ml = mlMatch[1];
    }
  }

  // Presentation check via general helper
  const parsedPres = parseProductPresentation(prod);
  if (!ml && parsedPres.presentation) {
    ml = parsedPres.presentation;
  }
  const presentation = parsedPres.presentation || ml;

  // Embedded sizes
  let sizes = Array.isArray(parsedPres.sizes) && parsedPres.sizes.length > 0 ? parsedPres.sizes : [];
  if (sizes.length === 0) {
    if (Array.isArray(meta.sizes) && meta.sizes.length > 0) {
      sizes = meta.sizes;
    } else if (Array.isArray(prod?.sizes) && prod.sizes.length > 0) {
      sizes = prod.sizes;
    } else {
      const sizesMatch = rawDesc.match(/\[\s*(?:tama[ñn]os|sizes|variaciones|presentaciones)\s*:\s*(\[[^\]]+\])\s*\]/i);
      if (sizesMatch && sizesMatch[1]) {
        try {
          sizes = JSON.parse(sizesMatch[1]);
        } catch (e) {}
      }
    }
  }

  // Family detection — strictly for actual perfume families or explicit bracket tags
  if (!family) {
    const bracketFamily = rawDesc.match(/\[\s*familia\s*:\s*([^\]]+)\]/i);
    if (bracketFamily && bracketFamily[1]) {
      family = bracketFamily[1].trim();
    } else {
      const combined = `${name} ${rawDesc} ${prod.category || ""}`.toLowerCase();
      if (/amaderad|oud|cedro|sandalo|vetiver/i.test(combined)) family = "Amaderado";
      else if (/c[ií]tric|bergamota|lim[oó]n|mandarina|naranja/i.test(combined)) family = "Cítrico / Fresco";
      else if (/oriental|ambar|especiad|canela|vainilla/i.test(combined)) family = "Oriental / Especiado";
      else if (/floral|rosa|jazm[ií]n|iris|lavanda/i.test(combined)) family = "Floral";
      else if (/fresco|acu[aá]tic|marino|verde/i.test(combined)) family = "Fresco / Acuático";
      else if (/gourmand|dulce|caramelo|chocolate/i.test(combined)) family = "Dulce Gourmand";
      else family = "";
    }
  }

  // Clean description text
  let cleanDesc = rawDesc
    .replace(/\[\s*(?:originalimg|originalimage|frascooriginal|inspiracionimg|original_img)\s*:[^\]]+\]/gi, "")
    .replace(/\[\s*(?:inspiraci[oó]n|inspirado en|original|ref|tendencia)\s*:[^\]]+\]/gi, "")
    .replace(/\[\s*g[eé]nero\s*:[^\]]+\]/gi, "")
    .replace(/\[\s*familia\s*:[^\]]+\]/gi, "")
    .replace(/\[\s*concentraci[oó]n\s*:[^\]]+\]/gi, "")
    .replace(/\[\s*ml\s*:[^\]]+\]/gi, "")
    .replace(/\[\s*(?:presentaci[oó]n|tama[ñn]o|cantidad|gramaje|porci[oó]n)\s*:[^\]]+\]/gi, "")
    .replace(/\[\s*(?:tama[ñn]os|sizes|variaciones|presentaciones)\s*:\s*\[[^\]]+\]\s*\]/gi, "")
    .trim();

  return {
    inspiration,
    originalImg,
    family,
    gender,
    concentration,
    ml,
    presentation,
    cleanName: parsedPres.cleanName || name,
    cleanDesc,
    sizes
  };
}

/**
 * Unifies products from the same brand that represent the same item into a single card
 * with multiple size/presentation options.
 */
export function groupCatalogProducts(products = []) {
  if (!Array.isArray(products) || products.length <= 1) return products || [];

  const groups = new Map();
  const orderedList = [];

  for (const prod of products) {
    if (!prod) continue;
    const pBrandId = Number(prod.brandId || prod.brand_id || 0);
    const pParsed = parseProductPresentation(prod);
    const pPerfume = parsePerfumeInfo(prod);

    const cleanName = (pParsed.cleanName || prod.name || "").trim().toLowerCase();
    const insp = (pPerfume.inspiration || "").trim().toLowerCase();

    // Key to group variations of the same product:
    // Perfume with inspiration: brandId + inspiration
    // Otherwise: brandId + cleanName + category
    let groupKey = null;
    if (insp) {
      groupKey = `${pBrandId}::insp::${insp}`;
    } else if (cleanName) {
      groupKey = `${pBrandId}::name::${cleanName}::${(prod.category || "").trim().toLowerCase()}`;
    }

    if (!groupKey) {
      orderedList.push(prod);
      continue;
    }

    const itemSizes = (Array.isArray(pPerfume.sizes) && pPerfume.sizes.length > 0)
      ? pPerfume.sizes
      : (Array.isArray(pParsed.sizes) && pParsed.sizes.length > 0 ? pParsed.sizes : []);

    if (!groups.has(groupKey)) {
      const initialSizes = [];
      if (itemSizes.length > 0) {
        itemSizes.forEach(s => {
          initialSizes.push({
            size: s.size || s.presentation || "",
            price: Number(s.price != null ? s.price : prod.price || 0),
            priceAourum: s.priceAourum != null ? Number(s.priceAourum) : (prod.priceAourum ? Number(prod.priceAourum) : null),
            image: s.image || prod.image || "",
            id: prod.id,
            slug: prod.slug || prod.id
          });
        });
      } else {
        const currentPres = pParsed.presentation || pPerfume.ml;
        if (currentPres) {
          initialSizes.push({
            size: currentPres,
            price: Number(prod.price || 0),
            priceAourum: prod.priceAourum ? Number(prod.priceAourum) : null,
            image: prod.image || "",
            id: prod.id,
            slug: prod.slug || prod.id
          });
        }
      }

      const unified = {
        ...prod,
        sizes: initialSizes,
        _allVariations: [prod]
      };
      groups.set(groupKey, unified);
      orderedList.push(unified);
    } else {
      const groupItem = groups.get(groupKey);
      groupItem._allVariations.push(prod);

      if (itemSizes.length > 0) {
        itemSizes.forEach(s => {
          const sName = (s.size || s.presentation || "").toLowerCase().trim();
          if (sName && !groupItem.sizes.some(x => (x.size || "").toLowerCase().trim() === sName)) {
            groupItem.sizes.push({
              size: s.size || s.presentation || "",
              price: Number(s.price != null ? s.price : prod.price || 0),
              priceAourum: s.priceAourum != null ? Number(s.priceAourum) : null,
              image: s.image || prod.image || "",
              id: prod.id,
              slug: prod.slug || prod.id
            });
          }
        });
      } else {
        const siblingPres = pParsed.presentation || pPerfume.ml;
        if (siblingPres) {
          const sName = siblingPres.toLowerCase().trim();
          if (!groupItem.sizes.some(x => (x.size || "").toLowerCase().trim() === sName)) {
            groupItem.sizes.push({
              size: siblingPres,
              price: Number(prod.price || 0),
              priceAourum: prod.priceAourum ? Number(prod.priceAourum) : null,
              image: prod.image || "",
              id: prod.id,
              slug: prod.slug || prod.id
            });
          }
        }
      }
    }
  }

  // Finalize sizes, minPrice, and hasMultipleSizes flag
  return orderedList.map(item => {
    if (Array.isArray(item.sizes) && item.sizes.length > 0) {
      item.sizes.sort((a, b) => Number(a.price || 0) - Number(b.price || 0));
      item.minPrice = item.sizes[0].price;
      if (item.sizes.length > 1) {
        item.hasMultipleSizes = true;
      }
    }
    return item;
  });
}

function PerfumeryShowcaseCard({
  prod,
  info,
  primaryCol,
  resolvedCardBg,
  resolvedCardBorder,
  resolvedCardShadow,
  resolvedCardTextColor,
  secondaryTextColor,
  isStoreBgLight,
  isOwner,
  onEditProduct,
  onOrderWhatsApp,
  router
}) {
  const sizes = Array.isArray(prod.sizes) && prod.sizes.length > 0 ? prod.sizes : [];
  const hasMultipleSizes = sizes.length > 1;
  const [selectedSizeIndex, setSelectedSizeIndex] = useState(0);

  const activeSize = hasMultipleSizes ? sizes[selectedSizeIndex] : null;
  const currentPrice = activeSize ? activeSize.price : (prod.minPrice != null ? prod.minPrice : prod.price);
  const currentPriceAourum = activeSize ? activeSize.priceAourum : prod.priceAourum;
  const currentImage = (activeSize && activeSize.image) ? activeSize.image : prod.image;
  const currentVolume = activeSize?.size || info?.ml || info?.presentation;
  const targetSlug = (activeSize && activeSize.slug) ? activeSize.slug : (prod.slug || prod.id);
  const hasImage = Boolean(currentImage);

  return (
    <div
      style={{
        background: resolvedCardBg,
        border: resolvedCardBorder,
        borderRadius: "20px",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        boxShadow: resolvedCardShadow,
        transition: "transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease",
        cursor: "pointer",
        position: "relative"
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-4px)";
        e.currentTarget.style.boxShadow = isStoreBgLight 
          ? "0 18px 36px rgba(0,0,0,0.1), 0 0 15px rgba(0,0,0,0.03)"
          : "0 20px 40px rgba(0,0,0,0.6)";
        e.currentTarget.style.borderColor = primaryCol;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = resolvedCardShadow;
        e.currentTarget.style.borderColor = "";
      }}
      onClick={() => router.push(`/products/${targetSlug}`)}
    >
      {/* IMAGEN DEL FRASCO / PRESENTACIÓN */}
      <div
        style={{
          position: "relative",
          width: "100%",
          height: "240px",
          background: isStoreBgLight 
            ? "radial-gradient(circle at center, rgba(0,0,0,0.01) 0%, rgba(0,0,0,0.04) 100%)" 
            : "radial-gradient(circle at center, rgba(255,255,255,0.04) 0%, rgba(10,11,15,0.95) 75%)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden"
        }}
      >
        {/* Badge de Género */}
        {info?.gender ? (
          <div
            style={{
              position: "absolute",
              top: "12px",
              right: "12px",
              background: isStoreBgLight ? "rgba(255, 255, 255, 0.92)" : "rgba(0, 0, 0, 0.8)",
              border: isStoreBgLight ? "1px solid rgba(0,0,0,0.1)" : "1px solid rgba(255,255,255,0.2)",
              color: isStoreBgLight ? "#1F2937" : "#FFFFFF",
              fontSize: "0.7rem",
              fontWeight: 700,
              padding: "3px 10px",
              borderRadius: "14px",
              backdropFilter: "blur(6px)",
              boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
              zIndex: 6
            }}
          >
            {info.gender === "Hombre" && "👔 Hombre"}
            {info.gender === "Mujer" && "👗 Mujer"}
            {info.gender === "Unisex" && "✨ Unisex"}
            {info.gender !== "Hombre" && info.gender !== "Mujer" && info.gender !== "Unisex" && info.gender}
          </div>
        ) : null}

        {isOwner && onEditProduct && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onEditProduct(prod);
            }}
            style={{
              position: "absolute",
              bottom: "10px",
              right: "10px",
              background: isStoreBgLight ? "rgba(255, 255, 255, 0.92)" : "rgba(12, 13, 17, 0.85)",
              border: `1px solid ${primaryCol}`,
              color: primaryCol,
              fontSize: "0.72rem",
              fontWeight: 700,
              padding: "4px 10px",
              borderRadius: "10px",
              cursor: "pointer",
              zIndex: 7,
              display: "flex",
              alignItems: "center",
              gap: "5px",
              backdropFilter: "blur(4px)",
              boxShadow: "0 2px 8px rgba(0,0,0,0.08)"
            }}
          >
            <i className="fa-solid fa-pen-to-square"></i>
            <span>Editar</span>
          </button>
        )}

        {info?.originalImg ? (
          <div
            style={{
              position: "relative",
              width: "100%",
              height: "100%",
              display: "flex",
              alignItems: "flex-end",
              justifyContent: "center",
              padding: "10px 14px 12px"
            }}
          >
            <div
              style={{
                position: "absolute",
                top: "40%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                width: "190px",
                height: "190px",
                borderRadius: "50%",
                background: `radial-gradient(circle, ${primaryCol}22 0%, transparent 70%)`,
                pointerEvents: "none"
              }}
            />

            {/* 1. Frasco Original */}
            <div
              style={{
                position: "absolute",
                left: "6%",
                bottom: "8%",
                width: "48%",
                height: "80%",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "flex-end",
                zIndex: 2,
                filter: "drop-shadow(0 6px 14px rgba(0,0,0,0.22))",
                opacity: 0.94,
                transition: "all 0.3s ease"
              }}
              className="perfume-original-duo"
              title={`Original de Referencia: ${info.inspiration || "Inspiración"}`}
            >
              <img
                src={info.originalImg}
                alt={`Inspiración: ${info.inspiration || "Original"}`}
                style={{
                  maxWidth: "100%",
                  maxHeight: "90%",
                  objectFit: "contain",
                  transition: "transform 0.3s ease"
                }}
              />
            </div>

            {/* 2. Frasco de la Marca */}
            <div
              style={{
                position: "absolute",
                right: "6%",
                bottom: "6%",
                width: "56%",
                height: "94%",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "flex-end",
                zIndex: 3,
                filter: "drop-shadow(0 12px 24px rgba(0,0,0,0.32))",
                transition: "all 0.3s ease"
              }}
              className="perfume-brand-duo"
            >
              {hasImage ? (
                <img
                  src={currentImage}
                  alt={prod.name}
                  style={{
                    maxWidth: "100%",
                    maxHeight: "90%",
                    objectFit: "contain",
                    transition: "transform 0.3s ease"
                  }}
                />
              ) : (
                <div style={{ textAlign: "center", marginBottom: "8px" }}>
                  <i className="fa-solid fa-wine-bottle" style={{ fontSize: "3.5rem", color: primaryCol, opacity: 0.9 }}></i>
                </div>
              )}
            </div>
          </div>
        ) : (
          hasImage ? (
            <img
              src={currentImage}
              alt={prod.name}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "contain",
                padding: "16px",
                transition: "transform 0.3s ease"
              }}
            />
          ) : (
            <div style={{ textAlign: "center", padding: "1rem" }}>
              <i className="fa-solid fa-wine-bottle" style={{ fontSize: "3.5rem", color: primaryCol, opacity: 0.65, marginBottom: "8px", display: "block" }}></i>
              <span style={{ fontSize: "0.75rem", color: secondaryTextColor, textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 700 }}>
                Frasco de Colección
              </span>
            </div>
          )
        )}
      </div>

      {/* CUERPO DE LA TARJETA */}
      <div style={{ padding: "1.25rem", display: "flex", flexDirection: "column", flex: 1, gap: "8px" }}>
        {/* Familia Olfativa y Volumen */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span 
            style={{ 
              fontSize: "0.72rem", 
              fontWeight: 800, 
              color: primaryCol, 
              textTransform: "uppercase", 
              letterSpacing: "0.06em" 
            }}
          >
            {info?.family || prod.category || "Perfumería"}
          </span>
          {currentVolume && (
            <span style={{ 
              fontSize: "0.72rem", 
              color: primaryCol, 
              background: `${primaryCol}18`,
              padding: "2px 8px",
              borderRadius: "6px",
              fontWeight: 700 
            }}>
              {currentVolume}
            </span>
          )}
        </div>

        {/* Nombre del Perfume */}
        <h3 
          style={{ 
            fontSize: "1.15rem", 
            fontWeight: 900, 
            color: resolvedCardTextColor, 
            margin: 0, 
            lineHeight: 1.3 
          }}
        >
          {prod.name}
        </h3>

        {/* RECUADRO DE INSPIRACIÓN ORIGINAL */}
        <div 
          style={{
            background: isStoreBgLight 
              ? `${primaryCol}12` 
              : `linear-gradient(135deg, ${primaryCol}20 0%, rgba(20, 22, 28, 0.85) 100%)`,
            border: `1.5px solid ${primaryCol}35`,
            borderRadius: "12px",
            padding: "9px 12px",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.06)"
          }}
        >
          {info?.originalImg ? (
            <div 
              style={{ 
                width: "34px", 
                height: "42px", 
                flexShrink: 0, 
                display: "flex", 
                alignItems: "center", 
                justifyContent: "center", 
                background: isStoreBgLight ? "#FFFFFF" : "rgba(255,255,255,0.08)", 
                borderRadius: "8px", 
                padding: "3px", 
                border: `1px solid ${primaryCol}30`,
                boxShadow: "0 2px 6px rgba(0,0,0,0.08)"
              }}
            >
              <img 
                src={info.originalImg} 
                alt={info.inspiration} 
                style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }} 
              />
            </div>
          ) : null}

          <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: "2px" }}>
            <div 
              style={{ 
                fontSize: "0.68rem", 
                fontWeight: 800, 
                color: primaryCol, 
                textTransform: "uppercase", 
                letterSpacing: "0.08em",
                display: "flex",
                alignItems: "center",
                gap: "5px"
              }}
            >
              <i className="fa-solid fa-sparkles"></i>
              <span>Inspirado en:</span>
            </div>
            <div 
              style={{ 
                fontSize: "0.95rem", 
                fontWeight: 900, 
                color: resolvedCardTextColor,
                letterSpacing: "-0.01em",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis"
              }}
              title={info?.inspiration || "Fragancia de Autor"}
            >
              {info?.inspiration || "Fragancia de Autor"}
            </div>
          </div>
        </div>

        {/* Descripción */}
        {info?.cleanDesc && (
          <p 
            style={{ 
              fontSize: "0.82rem", 
              color: secondaryTextColor, 
              margin: 0, 
              lineHeight: 1.45,
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden"
            }}
          >
            {info.cleanDesc}
          </p>
        )}

        {/* Pastillas de tamaños interactivos si tiene múltiples presentaciones */}
        {hasMultipleSizes && (
          <div 
            style={{ 
              display: "flex", 
              gap: "6px", 
              flexWrap: "wrap", 
              margin: "0.2rem 0" 
            }} 
            onClick={(e) => e.stopPropagation()}
          >
            {sizes.map((s, idx) => {
              const isSelected = idx === selectedSizeIndex;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedSizeIndex(idx);
                  }}
                  title={`Ver tamaño ${s.size} por S/ ${s.price}`}
                  style={{
                    padding: "3px 10px",
                    borderRadius: "8px",
                    fontSize: "0.72rem",
                    fontWeight: isSelected ? 800 : 600,
                    cursor: "pointer",
                    border: isSelected 
                      ? `1.5px solid ${primaryCol}` 
                      : (isStoreBgLight ? "1px solid rgba(0,0,0,0.15)" : "1px solid rgba(255,255,255,0.15)"),
                    background: isSelected ? `${primaryCol}22` : "transparent",
                    color: isSelected ? primaryCol : secondaryTextColor,
                    transition: "all 0.18s ease"
                  }}
                >
                  {s.size}
                </button>
              );
            })}
          </div>
        )}

        {/* Precios y Botón de Acción */}
        <div style={{ marginTop: "auto", paddingTop: "10px", borderTop: isStoreBgLight ? "1px solid rgba(0,0,0,0.08)" : "1px solid rgba(255,255,255,0.08)" }}>
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: "10px" }}>
            <div>
              <span style={{ fontSize: "0.72rem", color: secondaryTextColor, display: "block" }}>
                {hasMultipleSizes ? "Desde" : "Precio"}
              </span>
              <span style={{ fontSize: "1.3rem", fontWeight: 900, color: resolvedCardTextColor }}>
                S/. {Number(currentPrice).toLocaleString("es-PE")}
              </span>
            </div>

            {currentPriceAourum && (
              <div style={{ textAlign: "right" }}>
                <span style={{ fontSize: "0.68rem", color: primaryCol, fontWeight: 700, display: "block", textTransform: "uppercase" }}>
                  Precio AOURUM
                </span>
                <span style={{ fontSize: "1.1rem", fontWeight: 800, color: primaryCol }}>
                  S/. {Number(currentPriceAourum).toLocaleString("es-PE")}
                </span>
              </div>
            )}
          </div>

          {/* Botón de Pedido por WhatsApp */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onOrderWhatsApp(prod, activeSize);
            }}
            style={{
              width: "100%",
              padding: "0.7rem 1rem",
              borderRadius: "12px",
              border: "none",
              background: primaryCol,
              color: "#FFFFFF",
              fontSize: "0.85rem",
              fontWeight: 800,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              transition: "all 0.2s ease",
              boxShadow: `0 4px 15px ${primaryCol}40`
            }}
            onMouseEnter={(e) => e.currentTarget.style.filter = "brightness(1.1)"}
            onMouseLeave={(e) => e.currentTarget.style.filter = "none"}
          >
            <i className="fa-brands fa-whatsapp" style={{ fontSize: "1.1rem" }}></i>
            <span>Pedir por WhatsApp</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default function PerfumeryShowcase({
  brand = {},
  brandDesign = {},
  palette = { c1: "#D4AF37", c2: "#1C1C1E", c3: "#0C0D11", c4: "#F59E0B" },
  customProducts = [],
  title = "",
  subtitle = "",
  onWhatsAppClick = null,
  isOwner = false,
  onOpenAddModal = null,
  onEditProduct = null
}) {
  const router = useRouter();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGender, setSelectedGender] = useState("ALL"); // 'ALL' | 'Hombre' | 'Mujer' | 'Unisex'
  const [selectedFamily, setSelectedFamily] = useState("ALL"); // 'ALL' | string

  // ── RESOLUCIÓN DE PERSONALIZACIÓN Y COLORES DE MARCA ──
  const primaryCol = palette.c1 || brand.themeColor || "#95B721";
  const customBgColor = brandDesign?.customBgColor || brand?.customBgColor || "";

  // Detectar si el fondo general de la tienda es claro u oscuro
  const isStoreBgLight = useMemo(() => {
    if (customBgColor && customBgColor.startsWith("#")) {
      const hex = customBgColor.replace('#', '');
      if (hex.length === 6) {
        const r = parseInt(hex.substring(0, 2), 16);
        const g = parseInt(hex.substring(2, 4), 16);
        const b = parseInt(hex.substring(4, 6), 16);
        const brightness = (r * 299 + g * 587 + b * 114) / 1000;
        return brightness >= 130;
      }
    }
    return true; // Predeterminado claro
  }, [customBgColor]);

  // Color de fondo de tarjetas personalizado desde "Personalizar Perfil"
  const resolvedCardBg = useMemo(() => {
    const bgVal = brandDesign?.cardBgColor;
    if (bgVal && bgVal !== "transparent" && bgVal !== "auto") {
      if (bgVal === "brand") return primaryCol;
      if (bgVal === "brand-soft") {
        return (customBgColor && customBgColor.startsWith("#")) ? customBgColor : (isStoreBgLight ? "#FAF9F0" : "#242427");
      }
      return bgVal;
    }
    return isStoreBgLight ? "#FFFFFF" : "#18181B";
  }, [brandDesign?.cardBgColor, primaryCol, customBgColor, isStoreBgLight]);

  // Borde de tarjetas personalizado
  const resolvedCardBorder = useMemo(() => {
    const borderVal = brandDesign?.cardBorderColor;
    const styleVal = brandDesign?.cardStyle;

    if (borderVal && borderVal !== "auto") {
      if (borderVal === "brand") return `1.5px solid ${primaryCol}`;
      if (borderVal === "transparent") return "none";
      if (borderVal.startsWith("#")) return `1.5px solid ${borderVal}`;
    }
    if (styleVal === "bordered") {
      return `1.5px solid ${primaryCol}`;
    }
    if (styleVal === "flat") {
      return isStoreBgLight ? "1px solid rgba(0, 0, 0, 0.08)" : "1px solid rgba(255, 255, 255, 0.1)";
    }
    return isStoreBgLight ? "1px solid rgba(0, 0, 0, 0.1)" : `1px solid ${primaryCol}30`;
  }, [brandDesign?.cardBorderColor, brandDesign?.cardStyle, primaryCol, isStoreBgLight]);

  // Color de texto de tarjetas personalizado
  const resolvedCardTextColor = useMemo(() => {
    const textVal = brandDesign?.cardTextColor;
    if (textVal && textVal !== "auto") {
      if (textVal === "brand") return primaryCol;
      if (textVal.startsWith("#")) return textVal;
    }
    // Si no está especificado, calcular contraste según el fondo de la tarjeta
    if (resolvedCardBg && resolvedCardBg.startsWith("#")) {
      const hex = resolvedCardBg.replace('#', '');
      if (hex.length === 6) {
        const r = parseInt(hex.substring(0, 2), 16);
        const g = parseInt(hex.substring(2, 4), 16);
        const b = parseInt(hex.substring(4, 6), 16);
        const bgt = (r * 299 + g * 587 + b * 114) / 1000;
        return bgt >= 130 ? "#1C1C1E" : "#FFFFFF";
      }
    }
    return isStoreBgLight ? "#1C1C1E" : "#FFFFFF";
  }, [brandDesign?.cardTextColor, resolvedCardBg, primaryCol, isStoreBgLight]);

  // Sombra de tarjetas según Estilo de Tarjetas
  const resolvedCardShadow = useMemo(() => {
    const styleVal = brandDesign?.cardStyle;
    if (styleVal === "flat") return "none";
    if (styleVal === "elevated") {
      return isStoreBgLight ? "0 12px 30px rgba(0,0,0,0.08)" : "0 16px 40px rgba(0,0,0,0.5)";
    }
    if (styleVal === "glass") {
      return isStoreBgLight ? "0 6px 20px rgba(0,0,0,0.05)" : "0 8px 30px rgba(0,0,0,0.3)";
    }
    return isStoreBgLight ? "0 4px 18px rgba(0,0,0,0.05)" : "0 8px 25px rgba(0,0,0,0.35)";
  }, [brandDesign?.cardStyle, isStoreBgLight]);

  const secondaryTextColor = isStoreBgLight ? "#4B5563" : "#A1A1AA";
  const fontFamily = brandDesign?.fontFamily || "inherit";

  // Unificar productos con múltiples tamaños o variaciones
  const unifiedProducts = useMemo(() => {
    return groupCatalogProducts(customProducts || []);
  }, [customProducts]);

  // Enriquecer cada producto con datos olfativos
  const enrichedProducts = useMemo(() => {
    return (unifiedProducts || []).map((prod) => {
      const perfumeInfo = parsePerfumeInfo(prod);
      return {
        ...prod,
        perfumeInfo
      };
    });
  }, [unifiedProducts]);

  // Familias olfativas registradas
  const availableFamilies = useMemo(() => {
    const set = new Set();
    enrichedProducts.forEach(p => {
      if (p.perfumeInfo.family) set.add(p.perfumeInfo.family);
    });
    return Array.from(set);
  }, [enrichedProducts]);

  // Contadores de género
  const genderCounts = useMemo(() => {
    let hombre = 0, mujer = 0, unisex = 0;
    enrichedProducts.forEach(p => {
      const g = (p.perfumeInfo.gender || "").toLowerCase();
      if (g === "hombre") hombre++;
      else if (g === "mujer") mujer++;
      else if (g === "unisex") unisex++;
    });
    return { all: enrichedProducts.length, hombre, mujer, unisex };
  }, [enrichedProducts]);

  // Filtrado de productos
  const filteredProducts = useMemo(() => {
    return enrichedProducts.filter(p => {
      const info = p.perfumeInfo;
      const q = searchQuery.toLowerCase().trim();

      // Búsqueda
      if (q) {
        const nameMatch = (p.name || "").toLowerCase().includes(q);
        const inspMatch = (info.inspiration || "").toLowerCase().includes(q);
        const famMatch = (info.family || "").toLowerCase().includes(q);
        const descMatch = (info.cleanDesc || "").toLowerCase().includes(q);
        const match = nameMatch || inspMatch || famMatch || descMatch;
        if (!match) return false;
      }

      // Filtro de Género
      if (selectedGender !== "ALL") {
        if ((info.gender || "").toLowerCase() !== selectedGender.toLowerCase()) {
          return false;
        }
      }

      // Filtro de Familia
      if (selectedFamily !== "ALL") {
        if ((info.family || "").toLowerCase() !== selectedFamily.toLowerCase()) {
          return false;
        }
      }

      return true;
    });
  }, [enrichedProducts, searchQuery, selectedGender, selectedFamily]);

  // WhatsApp order handler
  const handleOrderWhatsApp = (prod, selectedSize = null) => {
    if (onWhatsAppClick) {
      onWhatsAppClick(prod);
      return;
    }
    const phone = brand.whatsappNumber || "51999999999";
    const cleanPhone = phone.replace(/[^0-9]/g, "");
    const info = prod.perfumeInfo || parsePerfumeInfo(prod);
    const inspText = info.inspiration ? ` (Inspirado en: ${info.inspiration})` : "";
    const sizeText = selectedSize?.size ? ` - Tamaño: ${selectedSize.size}` : (info.ml ? ` - Tamaño: ${info.ml}` : "");
    const priceVal = selectedSize?.price != null ? selectedSize.price : prod.price;
    const priceText = priceVal ? ` (S/ ${priceVal})` : "";
    const text = encodeURIComponent(
      `¡Hola ${brand.name || "Maison"}! Deseo consultar/pedir el perfume "${prod.name}"${sizeText}${priceText}${inspText}. ¿Tienen stock disponible para entrega?`
    );
    window.open(`https://wa.me/${cleanPhone}?text=${text}`, "_blank");
  };

  return (
    <section 
      className="perfumery-catalog-section"
      style={{
        marginTop: "1.5rem",
        marginBottom: "3.5rem",
        color: resolvedCardTextColor,
        fontFamily: fontFamily !== "inherit" ? `"${fontFamily}", sans-serif` : "inherit"
      }}
    >
      {/* ── BARRA DE BÚSQUEDA & FILTROS ── */}
      <div 
        style={{
          background: isStoreBgLight ? "rgba(255, 255, 255, 0.9)" : "rgba(18, 20, 26, 0.85)",
          border: isStoreBgLight ? "1px solid rgba(0, 0, 0, 0.08)" : "1px solid rgba(255, 255, 255, 0.1)",
          borderRadius: "20px",
          padding: "1.25rem",
          marginBottom: "2rem",
          boxShadow: isStoreBgLight ? "0 8px 24px rgba(0,0,0,0.04)" : "0 10px 30px rgba(0,0,0,0.3)",
          backdropFilter: "blur(12px)"
        }}
      >
        {/* Buscador */}
        <div style={{ position: "relative", marginBottom: "1rem" }}>
          <i 
            className="fa-solid fa-magnifying-glass" 
            style={{ 
              position: "absolute", 
              left: "1.1rem", 
              top: "50%", 
              transform: "translateY(-50%)", 
              color: primaryCol, 
              fontSize: "1rem" 
            }}
          />
          <input
            type="text"
            placeholder="Buscar por tu perfume, número o inspiración original (ej: Sauvage, Baccarat, Dior, Tom Ford)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: "100%",
              padding: "0.85rem 2.8rem 0.85rem 3rem",
              borderRadius: "14px",
              border: `1.5px solid ${searchQuery ? primaryCol : (isStoreBgLight ? "rgba(0, 0, 0, 0.15)" : "rgba(255, 255, 255, 0.15)")}`,
              background: isStoreBgLight ? "#FFFFFF" : "#0C0D12",
              color: isStoreBgLight ? "#111827" : "#FFFFFF",
              fontSize: "0.92rem",
              outline: "none",
              boxShadow: searchQuery ? `0 0 15px ${primaryCol}30` : "none",
              transition: "all 0.2s ease"
            }}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              style={{
                position: "absolute",
                right: "1rem",
                top: "50%",
                transform: "translateY(-50%)",
                background: "none",
                border: "none",
                color: secondaryTextColor,
                cursor: "pointer",
                fontSize: "1rem"
              }}
            >
              <i className="fa-solid fa-xmark"></i>
            </button>
          )}
        </div>

        {/* Filtros por Género y Familia */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "10px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
            <span style={{ fontSize: "0.78rem", fontWeight: 800, color: secondaryTextColor, textTransform: "uppercase", letterSpacing: "0.06em", marginRight: "4px" }}>
              Género:
            </span>

            {[
              { id: "ALL", label: `Todos (${genderCounts.all})` },
              { id: "Hombre", label: `👔 Hombre (${genderCounts.hombre})` },
              { id: "Mujer", label: `👗 Mujer (${genderCounts.mujer})` },
              ...(genderCounts.unisex > 0 ? [{ id: "Unisex", label: `✨ Unisex (${genderCounts.unisex})` }] : [])
            ].map((tab) => {
              const active = selectedGender === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setSelectedGender(tab.id)}
                  style={{
                    padding: "6px 14px",
                    borderRadius: "10px",
                    border: active ? `1.5px solid ${primaryCol}` : (isStoreBgLight ? "1px solid rgba(0,0,0,0.12)" : "1px solid rgba(255,255,255,0.12)"),
                    background: active ? primaryCol : (isStoreBgLight ? "rgba(0,0,0,0.03)" : "rgba(255,255,255,0.04)"),
                    color: active ? "#FFFFFF" : (isStoreBgLight ? "#374151" : "#D4D4D8"),
                    fontSize: "0.82rem",
                    fontWeight: active ? 800 : 600,
                    cursor: "pointer",
                    transition: "all 0.2s ease"
                  }}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Familias olfativas disponibles */}
          {availableFamilies.length > 1 && (
            <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
              <span style={{ fontSize: "0.78rem", fontWeight: 800, color: secondaryTextColor, textTransform: "uppercase", letterSpacing: "0.06em", marginRight: "4px" }}>
                Familia:
              </span>
              <button
                type="button"
                onClick={() => setSelectedFamily("ALL")}
                style={{
                  padding: "4px 10px",
                  borderRadius: "8px",
                  border: selectedFamily === "ALL" ? `1.5px solid ${primaryCol}` : (isStoreBgLight ? "1px solid rgba(0,0,0,0.1)" : "1px solid rgba(255,255,255,0.1)"),
                  background: selectedFamily === "ALL" ? `${primaryCol}25` : "transparent",
                  color: selectedFamily === "ALL" ? primaryCol : secondaryTextColor,
                  fontSize: "0.75rem",
                  fontWeight: 700,
                  cursor: "pointer"
                }}
              >
                Todas
              </button>
              {availableFamilies.map(fam => (
                <button
                  key={fam}
                  type="button"
                  onClick={() => setSelectedFamily(fam)}
                  style={{
                    padding: "4px 10px",
                    borderRadius: "8px",
                    border: selectedFamily === fam ? `1.5px solid ${primaryCol}` : (isStoreBgLight ? "1px solid rgba(0,0,0,0.1)" : "1px solid rgba(255,255,255,0.1)"),
                    background: selectedFamily === fam ? `${primaryCol}25` : "transparent",
                    color: selectedFamily === fam ? primaryCol : secondaryTextColor,
                    fontSize: "0.75rem",
                    fontWeight: 700,
                    cursor: "pointer"
                  }}
                >
                  {fam}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── 3. LISTADO / GRILLA DE TARJETAS PERSONALIZADAS ── */}
      {filteredProducts.length === 0 ? (
        <div 
          style={{
            textAlign: "center",
            padding: "5rem 1.5rem",
            background: isStoreBgLight ? "rgba(255, 255, 255, 0.7)" : "rgba(18, 20, 26, 0.6)",
            border: isStoreBgLight ? "1px solid rgba(0, 0, 0, 0.08)" : "1px solid rgba(255, 255, 255, 0.08)",
            borderRadius: "20px"
          }}
        >
          <i className="fa-solid fa-flask-vial" style={{ fontSize: "3rem", color: primaryCol, opacity: 0.4, marginBottom: "1rem", display: "block" }}></i>
          
          {customProducts.length === 0 ? (
            <>
              <h3 style={{ fontSize: "1.3rem", fontWeight: 800, color: resolvedCardTextColor, marginBottom: "0.5rem" }}>
                Aún no hay perfumes registrados en la base de datos
              </h3>
              <p style={{ color: secondaryTextColor, fontSize: "0.9rem", maxWidth: "520px", margin: "0 auto 1.5rem auto" }}>
                Esta marca tiene activado el catálogo de perfumería. Al publicar tus perfumes e indicar la inspiración original en la descripción (ej: <em>Inspirado en Sauvage de Dior</em>), aparecerán organizados automáticamente aquí.
              </p>
              {isOwner && onOpenAddModal && (
                <button
                  type="button"
                  onClick={onOpenAddModal}
                  style={{ 
                    padding: "0.75rem 1.8rem", 
                    borderRadius: "24px", 
                    fontWeight: 800,
                    background: primaryCol,
                    color: "#FFFFFF",
                    border: "none",
                    cursor: "pointer",
                    boxShadow: `0 4px 15px ${primaryCol}40`
                  }}
                >
                  <i className="fa-solid fa-plus" style={{ marginRight: 8 }}></i> Publicar Primer Perfume
                </button>
              )}
            </>
          ) : (
            <>
              <h3 style={{ fontSize: "1.2rem", fontWeight: 800, color: resolvedCardTextColor, marginBottom: "0.5rem" }}>
                No encontramos perfumes con esos filtros
              </h3>
              <p style={{ color: secondaryTextColor, fontSize: "0.88rem", marginBottom: "1.2rem" }}>
                Intenta buscar con otra palabra clave, nombre del perfume original o quita los filtros aplicados.
              </p>
              <button
                type="button"
                onClick={() => { setSearchQuery(""); setSelectedGender("ALL"); setSelectedFamily("ALL"); }}
                style={{
                  padding: "0.5rem 1.2rem",
                  borderRadius: "20px",
                  background: `${primaryCol}20`,
                  border: `1px solid ${primaryCol}40`,
                  color: primaryCol,
                  fontWeight: 700,
                  fontSize: "0.82rem",
                  cursor: "pointer"
                }}
              >
                Limpiar búsqueda y filtros
              </button>
            </>
          )}
        </div>
      ) : (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
            <span style={{ fontSize: "0.85rem", color: secondaryTextColor, fontWeight: 600 }}>
              Mostrando <strong style={{ color: resolvedCardTextColor }}>{filteredProducts.length}</strong> {filteredProducts.length === 1 ? "fragancia" : "fragancias"}
            </span>
          </div>

          <div 
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
              gap: "1.5rem"
            }}
          >
            {filteredProducts.map((prod) => (
              <PerfumeryShowcaseCard
                key={prod.id}
                prod={prod}
                info={prod.perfumeInfo}
                primaryCol={primaryCol}
                resolvedCardBg={resolvedCardBg}
                resolvedCardBorder={resolvedCardBorder}
                resolvedCardShadow={resolvedCardShadow}
                resolvedCardTextColor={resolvedCardTextColor}
                secondaryTextColor={secondaryTextColor}
                isStoreBgLight={isStoreBgLight}
                isOwner={isOwner}
                onEditProduct={onEditProduct}
                onOrderWhatsApp={handleOrderWhatsApp}
                router={router}
              />
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
