"use client";

import { useMemo, useEffect } from "react";
import { useApp } from "../../../context/AppContext";
import { useRouter, useParams } from "next/navigation";
import { isVirtualMenuBrand } from "@/utils/brandUtils";

// Helper for URL slug generation
const slugify = (text) => {
  if (!text) return "";
  return text
    .toString()
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9 -]/g, "")
    .replace(/\s+/g, "_")
    .replace(/-+/g, "_");
};

// Safe price formatter
const formatPrice = (val) => {
  if (val == null || val === "" || isNaN(Number(val))) return "0";
  return Number(val).toLocaleString("es-PE");
};

// Stable deterministic views generator based on hash of name + id
const getItemViews = (name, id) => {
  if (!name) return 0;
  let hash = 0;
  const str = name + (id || 0);
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash % 980) + 120; // 120 to 1100 views
};

const getProductViews = (p) => p.views || p.viewCount || getItemViews(p.name, p.id);

// Balances popularity and discovery by combining most viewed and least viewed products
const getBalancedSuggestions = (candidates, limit = 5) => {
  if (!candidates || candidates.length === 0) return [];
  
  const sorted = [...candidates].sort((a, b) => getProductViews(b) - getProductViews(a));
  
  if (candidates.length <= limit) {
    const mid = sorted.length / 2;
    return sorted.map((item, idx) => ({
      ...item,
      suggestionType: idx < mid ? "popular" : "discover"
    }));
  }

  const half = Math.floor(limit / 2);
  const mostViewed = sorted.slice(0, half).map(item => ({ ...item, suggestionType: "popular" }));
  const leastViewed = sorted.slice(sorted.length - (limit - half)).map(item => ({ ...item, suggestionType: "discover" }));

  // Combine
  const combined = [...mostViewed];
  leastViewed.forEach(item => {
    if (!combined.some(c => c.id === item.id)) {
      combined.push(item);
    }
  });

  // If combined size is less than limit, add items from the middle
  let nextIdx = half;
  while (combined.length < limit && nextIdx < sorted.length - (limit - half)) {
    const candidate = { ...sorted[nextIdx], suggestionType: "discover" };
    if (!combined.some(c => c.id === candidate.id)) {
      combined.push(candidate);
    }
    nextIdx++;
  }

  return combined;
};

export default function ProductDetailPage() {
  const routeParams = useParams();
  const rawParam = routeParams?.slug || "";
  const slugParam = typeof rawParam === "string" ? decodeURIComponent(rawParam) : "";

  const {
    products,
    brands,
    loading,
    getBrandPalette,
    parseDescription,
    loadProducts,
    loadBrands,
    activeRole,
    activeBrandId,
    activePersonId,
    people,
    setShowLoginModal,
    triggerNotification
  } = useApp();

  const router = useRouter();

  useEffect(() => {
    loadProducts();
    loadBrands();
  }, [loadProducts, loadBrands]);

  const prod = useMemo(() => {
    if (!products || !products.length) return null;
    const target = slugParam.toLowerCase().trim();
    const normTarget = target.replace(/-/g, "_");

    const bySlug = products.find((p) => {
      if (!p) return false;
      const pSlug = p.slug ? p.slug.toLowerCase().trim() : "";
      const pNameSlug = p.name ? slugify(p.name) : "";
      const normSlug = pSlug.replace(/-/g, "_");
      const normNameSlug = pNameSlug.replace(/-/g, "_");

      return (
        pSlug === target ||
        pNameSlug === target ||
        normSlug === normTarget ||
        normNameSlug === normTarget ||
        String(p.id) === target
      );
    });

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

  const brand = useMemo(() => {
    if (!prod) return null;
    return brands.find((b) => b.id === prod.brandId);
  }, [prod, brands]);

  const isCreatorOrOwner = useMemo(() => {
    if (!prod || !brand) return false;
    const isBrandSessionOwner = (activeRole === 'brand' && activeBrandId != null && Number(activeBrandId) === Number(brand.id));
    const isDirectOwner = isBrandSessionOwner || (activePersonId != null && brand.personId != null && Number(brand.personId) === Number(activePersonId));
    const userCollaborator = brand.collaborators ? brand.collaborators.find(c => Number(c.personId) === Number(activePersonId)) : null;
    return isDirectOwner || !!userCollaborator;
  }, [prod, brand, activeRole, activeBrandId, activePersonId]);

  // Redirect if product is hidden and visitor is not creator
  useEffect(() => {
    if (!loading && prod && prod.isVisible === false && !isCreatorOrOwner) {
      if (triggerNotification) {
        triggerNotification(false, "Este enlace no existe o el producto fue ocultado por su creador.");
      }
      router.replace("/");
    }
  }, [loading, prod, isCreatorOrOwner, router, triggerNotification]);

  const suggestedBrandProds = useMemo(() => {
    if (!prod) return [];
    const brandCandidates = products.filter(
      (p) => p.brandId === prod.brandId && p.id !== prod.id && p.isVisible !== false
    );
    return getBalancedSuggestions(brandCandidates, 6);
  }, [prod, products]);

  const allBrandProducts = useMemo(() => {
    if (!prod || !products) return [];
    return products.filter((p) => p.brandId === prod.brandId && p.isVisible !== false);
  }, [prod, products]);

  const suggestedCategoryProds = useMemo(() => {
    if (!prod) return [];
    const categoryCandidates = products.filter(
      (p) => p.category && 
             prod.category && 
             p.category.trim().toLowerCase() === prod.category.trim().toLowerCase() && 
             p.id !== prod.id &&
             p.brandId !== prod.brandId &&
             p.isVisible !== false
    );
    const finalCandidates = categoryCandidates.length > 0 
      ? categoryCandidates 
      : products.filter(
          (p) => p.category && 
                 prod.category && 
                 p.category.trim().toLowerCase() === prod.category.trim().toLowerCase() && 
                 p.id !== prod.id &&
                 p.isVisible !== false
        );
    return getBalancedSuggestions(finalCandidates, 6);
  }, [prod, products]);

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "6rem 0" }}>
        <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: "2.5rem", color: "var(--gold-primary)" }}></i>
        <p style={{ color: "var(--text-muted)", marginTop: "10px" }}>Cargando detalles del producto...</p>
      </div>
    );
  }

  if (!prod || (prod.isVisible === false && !isCreatorOrOwner)) {
    return (
      <div className="container" style={{ textAlign: "center", padding: "4rem 0" }}>
        <h3 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "1rem" }}>Este enlace no existe</h3>
        <p style={{ color: "var(--text-muted)", marginBottom: "1.5rem" }}>El producto o servicio que buscas no está disponible o el enlace no existe. Redireccionando a la página principal...</p>
        <button onClick={() => router.push("/")} className="btn-gold" style={{ padding: "0.75rem 1.8rem", cursor: "pointer" }}>Ir a la Página Principal</button>
      </div>
    );
  }

  const parsedBrand = brand ? parseDescription(brand.description) : null;
  const palette = (brand && getBrandPalette) 
    ? getBrandPalette(parsedBrand, brand) 
    : { c1: "#D4AF37", c2: "#EAB308", c3: "#F97316", c4: "#8B5CF6" };
  const brandThemeColor = palette.c1;

  const brandDesign = brand?.brandDesign || {};
  const bgStyle = brandDesign.bgStyle || "solid";
  const customBgColor = brandDesign.customBgColor || "#FAF9F0";
  const bgImage = brandDesign.bgImage || "";
  const bgImageFit = brandDesign.bgImageFit || "cover";
  const fontFamily = brandDesign.fontFamily || "Inter";

  let pageBgCss = {};
  if (bgStyle === "image" && bgImage) {
    pageBgCss = {
      backgroundImage: `url(${bgImage})`,
      backgroundSize: bgImageFit === "repeat" ? "auto" : bgImageFit,
      backgroundRepeat: bgImageFit === "repeat" ? "repeat" : "no-repeat",
      backgroundPosition: "center top"
    };
  } else if (bgStyle === "solid") {
    let resolvedColor = customBgColor;
    if (resolvedColor === "brand") resolvedColor = palette.c1;
    else if (resolvedColor === "brand-soft") resolvedColor = `${palette.c1}15`;
    pageBgCss = {
      background: resolvedColor
    };
  } else if (bgStyle === "gradient") {
    pageBgCss = {
      background: `
        radial-gradient(ellipse at 15% 5%, ${palette.c1}25 0%, transparent 55%),
        radial-gradient(ellipse at 85% 15%, ${palette.c2}25 0%, transparent 55%),
        radial-gradient(ellipse at 20% 40%, ${palette.c3}20 0%, transparent 50%),
        radial-gradient(ellipse at 80% 65%, ${palette.c4}22 0%, transparent 50%),
        linear-gradient(180deg, ${palette.c1}12 0%, ${palette.c2}08 25%, ${palette.c3}06 55%, ${palette.c4}10 85%, ${palette.c1}15 100%)
      `
    };
  } else if (bgStyle === "mesh") {
    pageBgCss = {
      background: `
        radial-gradient(at 0% 0%, ${palette.c1}30 0px, transparent 50%),
        radial-gradient(at 100% 0%, ${palette.c2}30 0px, transparent 50%),
        radial-gradient(at 100% 100%, ${palette.c3}25 0px, transparent 50%),
        radial-gradient(at 0% 100%, ${palette.c4}30 0px, transparent 50%)
      `
    };
  } else if (bgStyle === "dots") {
    pageBgCss = {
      background: `radial-gradient(${palette.c1}35 1px, transparent 1px)`,
      backgroundSize: "20px 20px"
    };
  } else if (bgStyle === "none") {
    pageBgCss = {
      background: "#FFFFFF"
    };
  }

  const whatsappNumber = (brand?.whatsappNumber || "51999999999").replace(/[^0-9]/g, "");
  const productPrice = prod?.priceAourum ?? prod?.price;
  const formattedPriceStr = (productPrice != null && !isNaN(Number(productPrice)))
    ? `S/ ${formatPrice(productPrice)}`
    : null;
  const productUrl = typeof window !== "undefined"
    ? `${window.location.origin}/products/${prod.slug || prod.id}`
    : "";

  let whatsappMsg = `Hola ${brand ? brand.name : "Productor"} desde AOURUM, estoy interesado en el item "${prod.name}".`;
  if (formattedPriceStr) {
    whatsappMsg += `\nPrecio: ${formattedPriceStr}`;
  }
  if (productUrl) {
    whatsappMsg += `\nLink: ${productUrl}`;
  }
  const whatsappLink = `https://api.whatsapp.com/send?phone=${whatsappNumber}&text=${encodeURIComponent(whatsappMsg)}`;

  const renderSuggestedCard = (rp) => {
    const rpBrand = brands.find((b) => b.id === rp.brandId);
    const rpDesign = rpBrand?.brandDesign || {};
    const rpParsedBrand = rpBrand ? parseDescription(rpBrand.description) : null;
    const rpPalette = (rpBrand && getBrandPalette)
      ? getBrandPalette(rpParsedBrand, rpBrand)
      : { c1: "#D4AF37", c2: "#EAB308", c3: "#F97316", c4: "#8B5CF6" };

    const rpCardStyle = rpDesign.cardStyle || "glass";
    const rawCardBg = (rpDesign.cardBgColor && rpDesign.cardBgColor !== "transparent") ? rpDesign.cardBgColor : null;
    const rawCardText = rpDesign.cardTextColor || "auto";
    const rawCardBorder = rpDesign.cardBorderColor || "auto";

    const getBgBrightness = (colorStr, fallbackColor = "#FAF9F0") => {
      let target = colorStr || fallbackColor;
      if (target === "brand") target = rpPalette.c1;
      else if (target === "brand-soft") target = rpPalette.c1 ? `${rpPalette.c1}15` : fallbackColor;
      if (typeof target !== "string" || !target.startsWith("#")) return 240;

      let hex = target.replace("#", "").substring(0, 6);
      if (hex.length === 3) {
        hex = hex.split("").map(c => c + c).join("");
      }
      if (hex.length !== 6) return 240;

      const r = parseInt(hex.substring(0, 2), 16) || 0;
      const g = parseInt(hex.substring(2, 4), 16) || 0;
      const b = parseInt(hex.substring(4, 6), 16) || 0;
      return (r * 299 + g * 587 + b * 114) / 1000;
    };

    const storeLuminance = getBgBrightness(customBgColor, "#FAF9F0");
    const isStoreBgLight = storeLuminance >= 130;

    let cardBg = rawCardBg;
    if (!cardBg) {
      if (rpCardStyle === "flat" || rpCardStyle === "elevated" || rpCardStyle === "bordered") {
        cardBg = "#FFFFFF";
      } else {
        cardBg = isStoreBgLight ? `${rpPalette.c1}18` : "rgba(24, 24, 27, 0.88)";
      }
    } else if (cardBg === "brand") {
      cardBg = rpPalette.c1;
    } else if (cardBg === "brand-soft") {
      cardBg = `${rpPalette.c1}20`;
    }

    const cardLuminance = getBgBrightness(cardBg, isStoreBgLight ? "#FFFFFF" : "#18181B");
    const isCardDark = cardLuminance < 140;

    let categoryTextColor = isCardDark ? "var(--text-gold)" : "#854D0E";
    let titleTextColor = isCardDark ? "#FFFFFF" : "#1C1C1E";
    let priceTextColor = isCardDark ? "#FFFFFF" : "#1C1C1E";
    let dividerBorder = isCardDark ? "1px solid rgba(255,255,255,0.15)" : "1px solid rgba(0,0,0,0.1)";

    if (rawCardText === "brand") {
      titleTextColor = rpPalette.c1;
      priceTextColor = rpPalette.c1;
    } else if (rawCardText && rawCardText !== "auto" && rawCardText.startsWith("#")) {
      const textLuminance = getBgBrightness(rawCardText, "#1C1C1E");
      if ((isCardDark && textLuminance > 120) || (!isCardDark && textLuminance < 150)) {
        titleTextColor = rawCardText;
        priceTextColor = rawCardText;
      }
    }

    if (!isCardDark) {
      const titleLuminance = getBgBrightness(titleTextColor, "#1C1C1E");
      if (titleLuminance > 180) {
        titleTextColor = "#1C1C1E";
        priceTextColor = "#1C1C1E";
        categoryTextColor = "#854D0E";
      }
    }

    let cardStyleObj = {
      background: cardBg,
      color: titleTextColor,
      borderRadius: "16px",
      overflow: "hidden",
      display: "flex",
      flexDirection: "column",
      height: "100%",
      cursor: "pointer",
      boxShadow: rpCardStyle === "elevated" ? "0 12px 30px rgba(0,0,0,0.1)" : "0 4px 16px rgba(0,0,0,0.06)",
      transition: "all 0.25s ease-in-out"
    };

    if (rawCardBorder === "brand") {
      cardStyleObj.border = `1.5px solid ${rpPalette.c1}`;
    } else if (rawCardBorder === "transparent") {
      cardStyleObj.border = "none";
    } else if (rawCardBorder && rawCardBorder !== "auto" && rawCardBorder.startsWith("#")) {
      cardStyleObj.border = `1.5px solid ${rawCardBorder}`;
    } else if (rpCardStyle === "bordered") {
      cardStyleObj.border = `2px solid ${rpPalette.c1}`;
    } else {
      cardStyleObj.border = isCardDark ? "1px solid rgba(255,255,255,0.15)" : (isStoreBgLight ? "1px solid rgba(0, 0, 0, 0.12)" : `1px solid ${rpPalette.c1}30`);
    }

    const views = getProductViews(rp);
    const isPopular = views > 600;
    const formattedPrice = (rp.price != null && !isNaN(Number(rp.price))) ? Number(rp.price).toLocaleString("es-PE") : "0";
    const formattedPriceAourum = (rp.priceAourum != null && !isNaN(Number(rp.priceAourum))) ? Number(rp.priceAourum).toLocaleString("es-PE") : null;

    return (
      <div 
        key={rp.id}
        className="product-card glass-panel" 
        style={cardStyleObj}
        onClick={() => router.push(`/products/${rp.slug || rp.id}`)}
      >
        {/* Top Image Box with Badge Overlays */}
        <div 
          className="card-img-container" 
          style={{ 
            width: "100%",
            aspectRatio: "4 / 3",
            position: "relative", 
            background: (rp.imgBgColor && rp.imgBgColor !== "transparent") 
              ? (rp.imgBgColor === "brand" ? rpPalette.c1 : rp.imgBgColor)
              : (isCardDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.03)"),
            transition: "background-color 0.3s ease",
            overflow: "hidden"
          }}
        >
          {rp.image ? (
            <img 
              src={rp.image} 
              alt={rp.name} 
              className="card-img-hover" 
              style={{ 
                width: "100%",
                height: "100%",
                objectFit: rp.imgBgColor && rp.imgBgColor !== "transparent" ? "contain" : "cover",
                padding: rp.imgBgColor && rp.imgBgColor !== "transparent" ? "10px" : "0"
              }} 
            />
          ) : (
            <div
              style={{
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: isCardDark ? "#A1A1AA" : "var(--text-muted)",
                fontSize: "2rem"
              }}
            >
              <i className="fa-solid fa-box-open"></i>
            </div>
          )}

          {/* Badges on Image top-left */}
          <div style={{ position: "absolute", top: "10px", left: "10px", display: "flex", flexDirection: "column", gap: "6px", zIndex: 3 }}>
            {isPopular ? (
              <span style={{ background: "linear-gradient(135deg, #ef4444, #f97316)", color: "#FFFFFF", fontSize: "0.62rem", padding: "3px 8px", borderRadius: "12px", fontWeight: 700, letterSpacing: "0.03em", textTransform: "uppercase", boxShadow: "0 2px 6px rgba(0,0,0,0.15)", display: "flex", alignItems: "center", gap: "3px" }}>
                <i className="fa-solid fa-fire" style={{ fontSize: "0.7rem" }}></i> Popular
              </span>
            ) : (
              <span style={{ background: "linear-gradient(135deg, #0284c7, #2563eb)", color: "#FFFFFF", fontSize: "0.62rem", padding: "3px 8px", borderRadius: "12px", fontWeight: 700, letterSpacing: "0.03em", textTransform: "uppercase", boxShadow: "0 2px 6px rgba(0,0,0,0.15)", display: "flex", alignItems: "center", gap: "3px" }}>
                <i className="fa-solid fa-wand-magic-sparkles" style={{ fontSize: "0.7rem" }}></i> Descubrir
              </span>
            )}
          </div>
        </div>

        {/* Bottom Details Body */}
        <div style={{ padding: "1.1rem", flex: 1, display: "flex", flexDirection: "column", gap: "0.4rem" }}>
          <span style={{ 
            fontSize: "0.72rem", 
            color: categoryTextColor, 
            letterSpacing: "0.05em", 
            textTransform: "uppercase", 
            fontWeight: 800
          }}>
            {rp.category || rpBrand?.rubro_general || "General"}
          </span>

          <h3 style={{ 
            fontSize: "1.02rem", 
            fontWeight: 800, 
            lineHeight: 1.35, 
            color: titleTextColor, 
            margin: "0.1rem 0 0 0",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden"
          }}>
            {rp.name}
          </h3>

          <div style={{ fontSize: "0.8rem", color: isCardDark ? "#A1A1AA" : "var(--text-muted)", display: "flex", alignItems: "center", gap: "5px" }}>
            <span>Por:</span>
            <strong style={{ color: titleTextColor, textDecoration: "underline" }}>
              {rpBrand?.name || "Marca Local"}
            </strong>
          </div>
          
          <div style={{ 
            display: "flex", 
            justifyContent: "space-between", 
            alignItems: "center", 
            borderTop: dividerBorder, 
            paddingTop: "0.5rem", 
            marginTop: "auto" 
          }}>
            <div>
              {formattedPriceAourum ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                    <span style={{ fontSize: "0.68rem", color: isCardDark ? "#A1A1AA" : "#71717A", textDecoration: "line-through", lineHeight: 1 }}>
                      S/ {formattedPrice}
                    </span>
                    <span style={{ fontSize: "0.5rem", background: "var(--gold-gradient)", color: "#1C1C1E", padding: "1px 4px", borderRadius: "3px", fontWeight: "800", textTransform: "uppercase", whiteSpace: "nowrap", lineHeight: 1 }}>
                      Aourum
                    </span>
                  </div>
                  <span className="card-price-main" style={{ fontSize: "1.02rem", fontWeight: 800, color: "var(--text-gold)", lineHeight: 1 }}>
                    S/ {formattedPriceAourum}
                  </span>
                </div>
              ) : (
                <span className="card-price-main" style={{ fontSize: "1.02rem", fontWeight: 800, color: priceTextColor }}>
                  S/ {formattedPrice}
                </span>
              )}
            </div>

            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "2px" }}>
              <span className="card-type-label" style={{
                fontSize: "0.65rem",
                fontWeight: 700,
                textTransform: "uppercase",
                color: rp.type === "service" ? (isCardDark ? "#93c5fd" : "#1e3a8a") : (isCardDark ? "#fde68a" : "#78350f"),
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
    );
  };

  return (
    <div className="product-details-container product-theme-scope" style={{ position: "relative", minHeight: "100vh", fontFamily: fontFamily !== "Inter" ? `"${fontFamily}", sans-serif` : "inherit" }}>
      {/* Banner de Producto Oculto para el creador */}
      {prod.isVisible === false && (
        <div className="container" style={{ paddingTop: "1.5rem" }}>
          <div style={{ background: "#fee2e2", color: "#991b1b", padding: "0.85rem 1.2rem", borderRadius: "10px", fontWeight: 700, fontSize: "0.88rem", display: "flex", alignItems: "center", gap: "10px", border: "1px solid #fca5a5" }}>
            <i className="fa-solid fa-eye-slash" style={{ fontSize: "1.2rem" }}></i>
            <span>🔒 Producto Oculto: Solo tú como creador(a) de la marca puedes ver este enlace. Para los demás usuarios o visitantes, este enlace saldrá como inexistente y los redirigirá al inicio.</span>
          </div>
        </div>
      )}
      {/* Import de la fuente de Google seleccionada si no es Inter */}
      {fontFamily !== "Inter" && (
        <link rel="stylesheet" href={`https://fonts.googleapis.com/css2?family=${encodeURIComponent(fontFamily)}:wght@400;600;700;800&display=swap`} />
      )}

      {/* Estilos dinámicos de la Paleta de Marca para la página de producto */}
      <style>{`
        .product-theme-scope .btn-gold {
          background: linear-gradient(135deg, ${palette.c1}, ${palette.c2}) !important;
          color: #ffffff !important;
          border: none !important;
          box-shadow: 0 4px 14px ${palette.c1}35 !important;
        }
        .product-theme-scope .btn-outline-gold {
          border-color: ${palette.c1} !important;
          color: ${palette.c1} !important;
        }
        .product-theme-scope .glass-panel:not(.product-card) {
          border: 1px solid ${palette.c1}25 !important;
          box-shadow: 0 8px 24px ${palette.c1}08 !important;
        }
        header {
          background: linear-gradient(180deg, ${palette.c1}18 0%, rgba(255, 255, 255, 0.96) 100%) !important;
          border-bottom: 1.5px solid ${palette.c1}40 !important;
          box-shadow: 0 4px 20px ${palette.c1}12 !important;
        }
        footer.site-footer {
          background: linear-gradient(0deg, ${palette.c1}15 0%, ${palette.c4}08 50%, #FFFFFF 100%) !important;
          border-top: 1.5px solid ${palette.c1}35 !important;
        }
        footer.site-footer a {
          color: ${palette.c1} !important;
        }
        .product-theme-scope .grid-catalog .product-card,
        .product-theme-scope .product-card {
          border-radius: 16px !important;
          overflow: hidden !important;
          position: relative !important;
          z-index: 2 !important;
          transition: all 0.25s ease-in-out !important;
        }
        @media (min-width: 641px) {
          .product-theme-scope .product-card {
            min-height: 350px !important;
          }
          .product-theme-scope .grid-catalog > div:nth-child(n+6) {
            display: none !important;
          }
        }
        @media (max-width: 640px) {
          .product-theme-scope .product-card {
            min-height: auto !important;
          }
          .product-theme-scope .grid-catalog > div:nth-child(n+6) {
            display: flex !important;
          }
          .product-theme-scope .product-card > div:last-child {
            padding: 0.65rem 0.6rem !important;
            gap: 0.2rem !important;
          }
          .product-theme-scope .product-card h3 {
            font-size: 0.82rem !important;
            line-height: 1.25 !important;
            height: 2.5em !important;
            margin: 0 !important;
          }
          .product-theme-scope .product-card .card-price-main {
            font-size: 0.88rem !important;
          }
        }
        .product-theme-scope .product-card:hover {
          border-color: ${palette.c1} !important;
          box-shadow: 0 12px 32px ${palette.c1}25 !important;
          transform: translateY(-4px) !important;
        }
      `}</style>

      {/* Fondo de la Marca en la Página de su Producto */}
      {bgStyle !== "none" && (
        <div 
          style={{ 
            position: "absolute", 
            top: "-30px", 
            left: "50%", 
            transform: "translateX(-50%)",
            width: "100vw", 
            bottom: "-3rem", 
            pointerEvents: "none", 
            zIndex: 0,
            ...pageBgCss
          }} 
        />
      )}

      {/* Botón Volver */}
      <div style={{ marginBottom: "2rem", position: "relative", zIndex: 1, paddingTop: "1rem" }}>
        <button 
          onClick={() => router.push("/")} 
          className="btn-outline-gold" 
          style={{ padding: "0.5rem 1.2rem", fontSize: "0.85rem", borderRadius: "8px", border: "1.5px solid var(--gold-primary)", cursor: "pointer", transition: "var(--transition-smooth)" }}
        >
          <i className="fa-solid fa-arrow-left" style={{ marginRight: 6 }}></i> Volver al Catálogo
        </button>
      </div>

      {/* Vista Principal del Producto */}
      <div className="product-split-layout" style={{ position: "relative", zIndex: 1 }}>
        {/* Imagen del Producto */}
        <div 
          className="product-image-box"
          style={{
            backgroundColor: prod.imgBgColor === "brand" ? palette.c1 : (prod.imgBgColor || "transparent"),
            transition: "background-color 0.3s ease"
          }}
        >
          {prod.image ? (
            <img 
              src={prod.image} 
              alt={prod.name} 
              style={{
                objectFit: prod.imgBgColor && prod.imgBgColor !== "transparent" ? "contain" : "cover",
                padding: prod.imgBgColor && prod.imgBgColor !== "transparent" ? "16px" : "0"
              }}
            />
          ) : (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "350px", color: "var(--text-muted)" }}>
              <i className="fa-solid fa-image" style={{ fontSize: "4rem", marginBottom: "1rem", opacity: 0.5 }}></i>
              <p>Sin imagen disponible</p>
            </div>
          )}
        </div>

        {/* Detalles e Información del Producto */}
        <div>
          {(() => {
            const isVirtualMenu = isVirtualMenuBrand(brand);
            return (
              <>
                <div style={{ display: "flex", gap: "10px", alignItems: "center", marginBottom: "0.5rem", flexWrap: "wrap" }}>
                  <span style={{
                    background: `${brandThemeColor}15`,
                    border: `1px solid ${brandThemeColor}35`,
                    color: brandThemeColor,
                    padding: "0.25rem 0.6rem",
                    borderRadius: "6px",
                    fontSize: "0.72rem",
                    fontWeight: 700,
                    textTransform: "uppercase"
                  }}>
                    {prod.category || "General"}
                  </span>
                  <span style={{
                    background: isVirtualMenu ? "#10B981" : (prod.type === "service" ? "#2563eb" : "#d97706"),
                    color: "#FFFFFF",
                    padding: "0.25rem 0.6rem",
                    borderRadius: "6px",
                    fontSize: "0.72rem",
                    fontWeight: 700,
                    textTransform: "uppercase"
                  }}>
                    {isVirtualMenu ? "🍽️ Platillo / Menú Virtual" : (prod.type === "service" ? "📅 Servicio" : "🛍️ Producto")}
                  </span>
                </div>

                <h1 style={{ fontSize: "2.2rem", fontWeight: 800, color: "var(--text-primary)", lineHeight: 1.25, letterSpacing: "-0.015em", marginBottom: "0.6rem" }}>
                  {prod.name}
                </h1>

                {/* Insignia y Enlace a la Marca Personalizada */}
                <div 
                  style={{ 
                    display: "inline-flex", 
                    alignItems: "center", 
                    gap: "10px", 
                    marginBottom: "1.5rem",
                    padding: "0.5rem 0.9rem",
                    borderRadius: "10px",
                    background: `${brandThemeColor}10`,
                    border: `1px solid ${brandThemeColor}28`,
                    cursor: "pointer",
                    transition: "transform 0.2s ease"
                  }}
                  onClick={() => router.push(`/brands/${brand?.slug || prod.brandId}`)}
                >
                  {brand?.logo && (
                    <img 
                      src={brand.logo} 
                      alt={brand.name} 
                      style={{ width: "26px", height: "26px", borderRadius: "50%", objectFit: "cover", border: `1.5px solid ${brandThemeColor}` }} 
                    />
                  )}
                  <span style={{ fontSize: "0.85rem", color: "var(--text-primary)" }}>
                    Elaborado y vendido por: <strong style={{ color: brandThemeColor }}>{brand ? brand.name : "Marca Local"}</strong>
                  </span>
                  <i className="fa-solid fa-chevron-right" style={{ fontSize: "0.75rem", color: brandThemeColor, marginLeft: "4px" }}></i>
                </div>

                {/* Sección de Precio */}
                <div style={{ background: "var(--bg-input)", padding: "1.2rem 1.5rem", borderRadius: "12px", border: "1px solid var(--border-color)", marginBottom: "1.8rem" }}>
                  <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", display: "block", marginBottom: "2px", fontWeight: 500 }}>
                    {prod.priceAourum ? "Oferta Especial AOURUM" : "Precio Exclusivo"}
                  </span>
                  <div style={{ display: "flex", alignItems: "baseline", gap: "12px", flexWrap: "wrap" }}>
                    {prod.priceAourum ? (
                      <>
                        <span style={{ fontSize: "2.2rem", fontWeight: 800, color: "var(--text-gold)", letterSpacing: "-0.02em" }}>
                          S/ {formatPrice(prod.priceAourum)}
                        </span>
                        <span style={{ fontSize: "1.3rem", color: "var(--text-muted)", textDecoration: "line-through", fontWeight: 500 }}>
                          S/ {formatPrice(prod.price)}
                        </span>
                        <span style={{ fontSize: "0.85rem", color: "var(--text-gold)", fontWeight: 700 }}>
                          <i className="fa-solid fa-gift"></i> Precio Especial
                        </span>
                      </>
                    ) : (
                      <>
                        <span style={{ fontSize: "2.2rem", fontWeight: 800, color: "var(--text-primary)", letterSpacing: "-0.02em" }}>
                          S/ {formatPrice(prod.price)}
                        </span>
                        <span style={{ fontSize: "0.85rem", color: "var(--text-gold)", fontWeight: 700 }}>
                          <i className="fa-solid fa-shield-halved"></i> Precio Justo Local
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {/* Información & Contenido del Platillo / Producto */}
                <div style={{ marginBottom: "1.8rem" }}>
                  <h3 style={{ fontSize: "1.05rem", fontWeight: 700, borderBottom: "1.5px solid var(--border-color)", paddingBottom: "0.4rem", marginBottom: "0.8rem", color: "var(--text-primary)", display: "flex", alignItems: "center", gap: "8px" }}>
                    <i className="fa-solid fa-circle-info" style={{ color: brandThemeColor }}></i>
                    <span>{isVirtualMenu ? "Información y Descripción del Platillo" : "Información y Descripción"}</span>
                  </h3>
                  <div style={{ background: "var(--bg-input)", padding: "1.2rem 1.4rem", borderRadius: "12px", border: "1px solid var(--border-color)" }}>
                    <p style={{ fontSize: "0.92rem", color: "var(--text-primary)", lineHeight: 1.65, whiteSpace: "pre-line", margin: 0 }}>
                      {prod.description && prod.description.trim() ? (
                        prod.description
                      ) : (
                        <span style={{ color: "var(--text-muted)", fontStyle: "italic" }}>
                          {isVirtualMenu 
                            ? `Especialidad gastronómica de ${brand?.name || 'la marca'}. Platillo preparado fresco al momento de realizar tu pedido.`
                            : `Artículo disponible en la vitrina de ${brand?.name || 'la marca'}. Para más detalles, coordina directamente con el vendedor.`}
                        </span>
                      )}
                    </p>
                  </div>
                </div>

                {/* Tabla de Especificaciones */}
                <div style={{ marginBottom: "2rem" }}>
                  <h3 style={{ fontSize: "1.05rem", fontWeight: 700, borderBottom: "1.5px solid var(--border-color)", paddingBottom: "0.4rem", marginBottom: "0.8rem", color: "var(--text-primary)" }}>
                    <i className="fa-solid fa-list-check" style={{ color: "var(--gold-primary)", marginRight: 8 }}></i> Especificaciones Técnicas
                  </h3>
                  <table className="specs-table">
                    <tbody>
                      <tr>
                        <td className="label">Rubro o Categoría</td>
                        <td className="value">{prod.category || "General"}</td>
                      </tr>
                      <tr>
                        <td className="label">Tipo de Catálogo</td>
                        <td className="value">{isVirtualMenu ? "Platillo Gastronómico (Carta Virtual)" : (prod.type === "service" ? "Servicio / Experiencia" : "Producto Físico")}</td>
                      </tr>
                      
                      {isVirtualMenu ? (
                        <tr>
                          <td className="label">Disponibilidad</td>
                          <td className="value" style={{ color: "#10B981", fontWeight: 700 }}>En Carta / Preparación Fresca</td>
                        </tr>
                      ) : prod.type === "service" ? (
                        <tr>
                          <td className="label">Disponibilidad</td>
                          <td className="value" style={{ color: "#2563eb", fontWeight: 700 }}>Por Agenda / Cita</td>
                        </tr>
                      ) : (
                        <tr>
                          <td className="label">Disponibilidad</td>
                          <td className="value" style={{ color: (prod.stock == null || prod.stock > 0) ? "var(--text-primary)" : "#ef4444", fontWeight: 700 }}>
                            {prod.stock == null ? "En Stock (Disponibilidad continua)" : prod.stock > 0 ? `En Stock (${prod.stock} unidades)` : "Agotado Temporalmente"}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Aviso informativo */}
                <div style={{ background: "rgba(212,175,55,0.06)", border: "1px solid rgba(212,175,55,0.2)", borderRadius: "12px", padding: "1.2rem", marginBottom: "1.8rem" }}>
                  <p style={{ fontSize: "0.85rem", color: "var(--gold-dark)", lineHeight: 1.5, display: "flex", gap: "8px", margin: 0 }}>
                    <i className="fa-solid fa-circle-info" style={{ marginTop: "3px", fontSize: "0.95rem" }}></i>
                    <span>
                      {isVirtualMenu
                        ? "Este es un plato/ítem de la carta virtual gastronómica. No realizamos transacciones de pago directo. Para realizar tu pedido o consultar, coordina directamente con el restaurante o productor."
                        : "Este es un catálogo virtual de economía circular y cultural. No realizamos transacciones de pago directo. Para comprar o agendar, coordina directamente con el productor."}
                    </span>
                  </p>
                </div>

                {/* Botones de Acción */}
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {brand?.whatsappNumber ? (
                    activeRole ? (
                      <a 
                        href={whatsappLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-gold"
                        style={{ width: "100%", textDecoration: "none", fontSize: "0.95rem", padding: "0.8rem", textAlign: "center", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}
                      >
                        <i className="fa-brands fa-whatsapp" style={{ fontSize: "1.2rem" }}></i> {isVirtualMenu ? "Coordinar Pedido de Platillo vía WhatsApp" : "Coordinar Adquisición vía WhatsApp"}
                      </a>
                    ) : (
                      <button 
                        onClick={() => {
                          triggerNotification(false, isVirtualMenu ? "Debes iniciar sesión para pedir este platillo." : "Debes iniciar sesión para coordinar la adquisición.");
                          setShowLoginModal(true);
                        }}
                        className="btn-gold"
                        style={{ width: "100%", fontSize: "0.95rem", cursor: "pointer", padding: "0.8rem", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}
                      >
                        <i className="fa-brands fa-whatsapp" style={{ fontSize: "1.2rem" }}></i> {isVirtualMenu ? "Coordinar Pedido de Platillo vía WhatsApp" : "Coordinar Adquisición vía WhatsApp"}
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
                    style={{ width: "100%", fontSize: "0.95rem", padding: "0.8rem" }}
                  >
                    <i className="fa-solid fa-store" style={{ marginRight: 6 }}></i> Visitar Galería de la Marca
                  </button>
                </div>
              </>
            );
          })()}
        </div>
      </div>

      {/* Carta & Menú Gastronómico de la Marca */}
      {brand && allBrandProducts.length > 0 && (
        <div style={{ borderTop: "1px solid var(--border-color)", paddingTop: "2.5rem", marginBottom: "3.5rem", position: "relative", zIndex: 1 }}>
          <div style={{ marginBottom: "1.5rem", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
            <div>
              <h3 style={{ fontSize: "1.4rem", fontWeight: 800, margin: 0, color: "var(--text-primary)", display: "flex", alignItems: "center", gap: "8px" }}>
                <i className="fa-solid fa-utensils" style={{ color: brandThemeColor }}></i>
                <span>Carta & Menú Gastronómico de {brand.name}</span>
              </h3>
              <p style={{ fontSize: "0.88rem", color: "var(--text-muted)", margin: "4px 0 0 0" }}>
                Explora la selección de platillos, bebidas y especialidades de {brand.name}
              </p>
            </div>
            <button 
              onClick={() => router.push(`/brands/${brand.slug || brand.id}`)}
              className="btn-outline-gold"
              style={{ padding: "0.55rem 1.3rem", fontSize: "0.85rem", borderRadius: "20px", cursor: "pointer", fontWeight: 700 }}
            >
              Ver perfil de la marca
            </button>
          </div>

          {/* Menú de Platos */}
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {allBrandProducts.map((item) => {
              const isCurrent = item.id === prod.id;
              const waNumber = brand?.whatsappNumber;
              const cleanWa = waNumber ? waNumber.replace(/[^0-9]/g, "") : null;
              const waMsg = encodeURIComponent(`¡Hola! Quisiera realizar un pedido de "${item.name}" desde la Carta Virtual de ${brand?.name || 'la marca'} en AOURUM.`);
              const waLink = cleanWa ? `https://wa.me/${cleanWa}?text=${waMsg}` : null;

              return (
                <div 
                  key={item.id}
                  className="glass-panel"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "1.25rem",
                    padding: "1.1rem 1.3rem",
                    borderRadius: "16px",
                    border: isCurrent ? `2px solid ${brandThemeColor}` : "1px solid var(--border-color)",
                    background: isCurrent ? `${brandThemeColor}10` : "var(--bg-card)",
                    flexWrap: "wrap",
                    transition: "transform 0.2s ease, box-shadow 0.2s ease",
                    cursor: "pointer"
                  }}
                  onClick={() => router.push(`/products/${item.slug || item.id}`)}
                >
                  {item.image && (
                    <div 
                      style={{ 
                        width: "80px", 
                        height: "80px", 
                        borderRadius: "12px", 
                        overflow: "hidden", 
                        flexShrink: 0,
                        border: "1px solid var(--border-color)"
                      }}
                    >
                      <img src={item.image} alt={item.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    </div>
                  )}
                  <div style={{ flex: 1, minWidth: "200px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                      {item.category && (
                        <span style={{ fontSize: "0.68rem", fontWeight: 800, textTransform: "uppercase", color: brandThemeColor, background: `${brandThemeColor}18`, padding: "2px 8px", borderRadius: "6px" }}>
                          {item.category}
                        </span>
                      )}
                      {isCurrent && (
                        <span style={{ fontSize: "0.68rem", fontWeight: 800, color: "#10B981", background: "rgba(16, 185, 129, 0.15)", padding: "2px 8px", borderRadius: "6px" }}>
                          Plato Viendo Ahora
                        </span>
                      )}
                    </div>
                    <h4 
                      style={{ fontSize: "1.05rem", fontWeight: 800, margin: "2px 0 4px 0", color: "var(--text-primary)" }}
                    >
                      {item.name}
                    </h4>
                    {item.description && (
                      <p style={{ fontSize: "0.82rem", color: "var(--text-muted)", margin: "0 0 6px 0", lineHeight: 1.4, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                        {item.description}
                      </p>
                    )}
                    <span style={{ fontSize: "1.1rem", fontWeight: 800, color: brandThemeColor }}>
                      S/ {item.price ? item.price.toLocaleString("es-PE") : "0.00"}
                    </span>
                  </div>

                  <div onClick={(e) => e.stopPropagation()} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    {waLink ? (
                      <a 
                        href={waLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        style={{
                          background: "#25D366",
                          color: "#FFFFFF",
                          textDecoration: "none",
                          padding: "0.55rem 1.2rem",
                          borderRadius: "20px",
                          fontSize: "0.82rem",
                          fontWeight: 800,
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "6px",
                          whiteSpace: "nowrap"
                        }}
                      >
                        <i className="fa-brands fa-whatsapp"></i>
                        <span>Pedir Plato</span>
                      </a>
                    ) : (
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/products/${item.slug || item.id}`);
                        }}
                        className="btn-gold"
                        style={{ padding: "0.55rem 1.2rem", borderRadius: "20px", fontSize: "0.82rem", fontWeight: 800 }}
                      >
                        Ver Plato
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Sugerencias de la misma categoría */}
      {suggestedCategoryProds.length > 0 && (
        <div style={{ borderTop: "1px solid var(--border-color)", paddingTop: "2.5rem", marginBottom: "3.5rem", position: "relative", zIndex: 1 }}>
          <h3 style={{ fontSize: "1.2rem", fontWeight: 800, marginBottom: "1.5rem", color: "var(--text-primary)", display: "flex", alignItems: "center", gap: 8 }}>
            <i className="fa-solid fa-tags" style={{ color: "var(--gold-primary)" }}></i>
            Productos recomendados en <span style={{ color: "var(--gold-dark)" }}>{prod.category || "esta categoría"}</span>
          </h3>
          <div className="grid-catalog">
            {suggestedCategoryProds.map(renderSuggestedCard)}
          </div>
        </div>
      )}

      {/* Banner de la Marca */}
      {brand && (
        <div style={{ borderTop: "1px solid var(--border-color)", paddingTop: "2.5rem", marginBottom: "3.5rem", position: "relative", zIndex: 1 }}>
          <h3 style={{ fontSize: "1.2rem", fontWeight: 800, marginBottom: "1.2rem", color: "var(--text-primary)" }}>
            <i className="fa-solid fa-user-tie" style={{ color: brandThemeColor, marginRight: 8 }}></i> Sobre la Marca / Productor
          </h3>
          <div 
            className="brand-banner-card"
            style={{ 
              border: `1.5px solid ${brandThemeColor}35`,
              background: `linear-gradient(135deg, ${brandThemeColor}0A 0%, var(--bg-card) 100%)`,
              boxShadow: `0 8px 30px ${brandThemeColor}15`,
              borderRadius: "16px",
              padding: "1.5rem"
            }}
          >
            {brand.logo && (
              <img 
                src={brand.logo} 
                alt={brand.name} 
                className="brand-banner-logo"
                style={{ border: `2px solid ${brandThemeColor}`, width: "80px", height: "80px", borderRadius: "50%", objectFit: "cover" }}
              />
            )}
            <div style={{ flex: 1 }}>
              <span style={{ fontSize: "0.78rem", color: brandThemeColor, textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.05em" }}>
                {brand.category || "Marca Local"}
              </span>
              <h4 style={{ fontSize: "1.5rem", fontWeight: 800, margin: "2px 0 6px 0", letterSpacing: "-0.015em" }}>
                {brand.name}
              </h4>
              {brand.owner && (
                <p style={{ fontSize: "0.82rem", color: "var(--text-muted)", marginBottom: "0.8rem" }}>
                  <i className="fa-solid fa-user-tag" style={{ marginRight: 6 }}></i> Fundador: <strong>{brand.owner}</strong>
                </p>
              )}
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
              {brand.description && (
                <p style={{ fontSize: "0.88rem", color: "var(--text-primary)", lineHeight: 1.55, marginBottom: "1.2rem" }}>
                  {parseDescription(brand.description).text}
                </p>
              )}
              <button 
                onClick={() => router.push(`/brands/${brand.slug || brand.id}`)}
                className="btn-outline-gold"
                style={{ padding: "0.45rem 1.2rem", fontSize: "0.82rem", borderRadius: "6px", cursor: "pointer" }}
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
