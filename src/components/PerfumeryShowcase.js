"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";

// Helper to intelligently extract inspiration, gender, family and concentration from product
export function parsePerfumeInfo(prod) {
  if (!prod) {
    return {
      inspiration: "",
      family: "Alta Perfumería",
      gender: "Unisex",
      concentration: "50% Esencia Pura",
      ml: "50 ml",
      cleanDesc: ""
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
  let family = meta.family || meta.familia || "";
  let gender = meta.gender || meta.genero || "";
  let concentration = meta.concentration || "50% Esencia Pura";
  let ml = meta.ml || meta.volume || "50 ml";

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

  // Check parenthesis in name: "N° 10 (Sauvage Dior)"
  if (!inspiration) {
    const parenMatch = name.match(/\(([^)]+)\)/);
    if (parenMatch && parenMatch[1] && !/^\d+\s*ml$/i.test(parenMatch[1])) {
      inspiration = parenMatch[1].trim();
    }
  }

  // Gender detection
  if (!gender) {
    const bracketGender = rawDesc.match(/\[\s*g[eé]nero\s*:\s*([^\]]+)\]/i);
    if (bracketGender && bracketGender[1]) {
      gender = bracketGender[1].trim();
    } else {
      const combined = `${name} ${rawDesc} ${prod.category || ""}`.toLowerCase();
      if (/\b(hombre|masculino|para [eé]l|caballero)\b/i.test(combined)) gender = "Hombre";
      else if (/\b(mujer|femenino|para ella|dama)\b/i.test(combined)) gender = "Mujer";
      else gender = "Unisex";
    }
  }

  // Family detection
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
      else family = prod.category && !/^(producto|perfum|perfumeria|general)$/i.test(prod.category.toLowerCase()) ? prod.category : "Alta Perfumería";
    }
  }

  // Clean description text
  let cleanDesc = rawDesc
    .replace(/\[\s*(?:inspiraci[oó]n|inspirado en|original|ref|tendencia)\s*:[^\]]+\]/gi, "")
    .replace(/\[\s*g[eé]nero\s*:[^\]]+\]/gi, "")
    .replace(/\[\s*familia\s*:[^\]]+\]/gi, "")
    .replace(/\[\s*concentraci[oó]n\s*:[^\]]+\]/gi, "")
    .replace(/\[\s*ml\s*:[^\]]+\]/gi, "")
    .trim();

  return {
    inspiration,
    family,
    gender,
    concentration: concentration || "50% Esencia Pura",
    ml,
    cleanDesc
  };
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

  // Enrich each product from the database with parsed perfume data
  const enrichedProducts = useMemo(() => {
    return (customProducts || []).map((prod) => {
      const perfumeInfo = parsePerfumeInfo(prod);
      return {
        ...prod,
        perfumeInfo
      };
    });
  }, [customProducts]);

  // Unique families from active products
  const availableFamilies = useMemo(() => {
    const set = new Set();
    enrichedProducts.forEach(p => {
      if (p.perfumeInfo.family) set.add(p.perfumeInfo.family);
    });
    return Array.from(set);
  }, [enrichedProducts]);

  // Gender counts
  const genderCounts = useMemo(() => {
    let hombre = 0, mujer = 0, unisex = 0;
    enrichedProducts.forEach(p => {
      const g = (p.perfumeInfo.gender || "").toLowerCase();
      if (g === "hombre") hombre++;
      else if (g === "mujer") mujer++;
      else unisex++;
    });
    return { all: enrichedProducts.length, hombre, mujer, unisex };
  }, [enrichedProducts]);

  // Filter products by search, gender, and family
  const filteredProducts = useMemo(() => {
    return enrichedProducts.filter(p => {
      const info = p.perfumeInfo;
      const q = searchQuery.toLowerCase().trim();

      // Search match: name, inspiration, family, gender, description
      if (q) {
        const nameMatch = (p.name || "").toLowerCase().includes(q);
        const inspMatch = (info.inspiration || "").toLowerCase().includes(q);
        const famMatch = (info.family || "").toLowerCase().includes(q);
        const descMatch = (info.cleanDesc || "").toLowerCase().includes(q);
        const match = nameMatch || inspMatch || famMatch || descMatch;
        if (!match) return false;
      }

      // Gender filter
      if (selectedGender !== "ALL") {
        if (info.gender.toLowerCase() !== selectedGender.toLowerCase()) {
          return false;
        }
      }

      // Family filter
      if (selectedFamily !== "ALL") {
        if (info.family.toLowerCase() !== selectedFamily.toLowerCase()) {
          return false;
        }
      }

      return true;
    });
  }, [enrichedProducts, searchQuery, selectedGender, selectedFamily]);

  // WhatsApp order handler
  const handleOrderWhatsApp = (prod) => {
    if (onWhatsAppClick) {
      onWhatsAppClick(prod);
      return;
    }
    const phone = brand.whatsappNumber || "51999999999";
    const cleanPhone = phone.replace(/[^0-9]/g, "");
    const info = prod.perfumeInfo || parsePerfumeInfo(prod);
    const inspText = info.inspiration ? ` (Inspirado en: ${info.inspiration})` : "";
    const text = encodeURIComponent(
      `¡Hola ${brand.name || "Maison"}! Deseo consultar/pedir el perfume "${prod.name}"${inspText}, formulado con 50% de concentración de esencia pura. ¿Tienen stock disponible para entrega?`
    );
    window.open(`https://wa.me/${cleanPhone}?text=${text}`, "_blank");
  };

  const themeGold = palette.c1 || "#D4AF37";

  return (
    <section 
      className="perfumery-catalog-section"
      style={{
        marginTop: "1.5rem",
        marginBottom: "3.5rem",
        color: "#F4F4F5"
      }}
    >
      {/* ── 1. CABECERA DE ALTA PERFUMERÍA & CONCENTRACIÓN ── */}
      <div 
        style={{
          position: "relative",
          borderRadius: "24px",
          padding: "clamp(1.5rem, 3.5vw, 2.5rem)",
          background: "linear-gradient(135deg, rgba(16, 17, 24, 0.95) 0%, rgba(9, 10, 14, 0.98) 100%)",
          border: "1px solid rgba(212, 175, 55, 0.28)",
          boxShadow: "0 20px 50px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.08)",
          overflow: "hidden",
          marginBottom: "2rem"
        }}
      >
        {/* Resplandor decorativo de fondo */}
        <div 
          style={{
            position: "absolute",
            top: "-30%",
            right: "-10%",
            width: "400px",
            height: "400px",
            borderRadius: "50%",
            background: `radial-gradient(circle, ${themeGold}20 0%, transparent 70%)`,
            pointerEvents: "none"
          }}
        />

        <div style={{ position: "relative", zIndex: 1, maxWidth: "850px" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", background: "rgba(212,175,55,0.12)", border: "1px solid rgba(212,175,55,0.35)", padding: "4px 14px", borderRadius: "20px", marginBottom: "1rem" }}>
            <span style={{ fontSize: "0.78rem", fontWeight: 800, color: "#FEF08A", letterSpacing: "0.08em", textTransform: "uppercase" }}>
              ✨ Vitrina de Perfumes de Inspiración
            </span>
          </div>

          <h2 style={{ fontSize: "clamp(1.5rem, 3vw, 2.2rem)", fontWeight: 900, letterSpacing: "-0.02em", margin: "0 0 0.5rem 0", color: "#FFFFFF", lineHeight: 1.2 }}>
            {title || `${brand.name || "Maison"} • Colección de Perfumes`}
          </h2>

          <p style={{ fontSize: "0.95rem", color: "#D4D4D8", margin: 0, lineHeight: 1.6, maxWidth: "700px" }}>
            {subtitle || "Fragancias formuladas con 50% de esencia pura para una estela envolvente y máxima fijación en piel. Encuentra tu aroma favorito o su equivalencia olfativa original."}
          </p>

          {/* Sellos de Calidad y Formulación */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", marginTop: "1.25rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", padding: "6px 14px", borderRadius: "12px", fontSize: "0.82rem", fontWeight: 700, color: "#FDE047" }}>
              <i className="fa-solid fa-flask"></i>
              <span>50% Concentración de Esencia</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "6px", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", padding: "6px 14px", borderRadius: "12px", fontSize: "0.82rem", fontWeight: 700, color: "#E4E4E7" }}>
              <i className="fa-solid fa-clock-rotate-left"></i>
              <span>+12 Horas de Duración en Piel</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "6px", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", padding: "6px 14px", borderRadius: "12px", fontSize: "0.82rem", fontWeight: 700, color: "#E4E4E7" }}>
              <i className="fa-solid fa-wand-magic-sparkles"></i>
              <span>Inspiraciones de Alta Gama</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── 2. BARRA DE BÚSQUEDA & FILTROS OLFACTIVOS ── */}
      <div 
        style={{
          background: "rgba(18, 20, 26, 0.8)",
          border: "1px solid rgba(255, 255, 255, 0.1)",
          borderRadius: "20px",
          padding: "1.25rem",
          marginBottom: "2rem",
          boxShadow: "0 10px 30px rgba(0,0,0,0.3)",
          backdropFilter: "blur(12px)"
        }}
      >
        {/* Buscador de Perfumes e Inspiraciones */}
        <div style={{ position: "relative", marginBottom: "1rem" }}>
          <i 
            className="fa-solid fa-magnifying-glass" 
            style={{ 
              position: "absolute", 
              left: "1.1rem", 
              top: "50%", 
              transform: "translateY(-50%)", 
              color: themeGold, 
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
              border: `1.5px solid ${searchQuery ? themeGold : "rgba(255, 255, 255, 0.15)"}`,
              background: "#0C0D12",
              color: "#FFFFFF",
              fontSize: "0.92rem",
              outline: "none",
              boxShadow: searchQuery ? `0 0 15px ${themeGold}30` : "none",
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
                color: "#A1A1AA",
                cursor: "pointer",
                fontSize: "1rem"
              }}
            >
              <i className="fa-solid fa-xmark"></i>
            </button>
          )}
        </div>

        {/* Filtros por Género */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "10px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
            <span style={{ fontSize: "0.78rem", fontWeight: 800, color: "#A1A1AA", textTransform: "uppercase", letterSpacing: "0.06em", marginRight: "4px" }}>
              Género:
            </span>

            {[
              { id: "ALL", label: `Todos (${genderCounts.all})`, icon: "fa-border-all" },
              { id: "Hombre", label: `👔 Hombre (${genderCounts.hombre})`, icon: null },
              { id: "Mujer", label: `👗 Mujer (${genderCounts.mujer})`, icon: null },
              { id: "Unisex", label: `✨ Unisex (${genderCounts.unisex})`, icon: null }
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
                    border: active ? `1.5px solid ${themeGold}` : "1px solid rgba(255,255,255,0.12)",
                    background: active ? `linear-gradient(135deg, ${themeGold} 0%, #b8860b 100%)` : "rgba(255,255,255,0.04)",
                    color: active ? "#0C0D11" : "#D4D4D8",
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
              <span style={{ fontSize: "0.78rem", fontWeight: 800, color: "#A1A1AA", textTransform: "uppercase", letterSpacing: "0.06em", marginRight: "4px" }}>
                Familia:
              </span>
              <button
                type="button"
                onClick={() => setSelectedFamily("ALL")}
                style={{
                  padding: "4px 10px",
                  borderRadius: "8px",
                  border: selectedFamily === "ALL" ? `1.5px solid ${themeGold}` : "1px solid rgba(255,255,255,0.1)",
                  background: selectedFamily === "ALL" ? "rgba(212,175,55,0.2)" : "transparent",
                  color: selectedFamily === "ALL" ? "#FEF08A" : "#A1A1AA",
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
                    border: selectedFamily === fam ? `1.5px solid ${themeGold}` : "1px solid rgba(255,255,255,0.1)",
                    background: selectedFamily === fam ? "rgba(212,175,55,0.2)" : "transparent",
                    color: selectedFamily === fam ? "#FEF08A" : "#A1A1AA",
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

      {/* ── 3. LISTADO / GRILLA DE TODOS LOS PERFUMES DE LA MARCA ── */}
      {filteredProducts.length === 0 ? (
        <div 
          style={{
            textAlign: "center",
            padding: "5rem 1.5rem",
            background: "rgba(18, 20, 26, 0.6)",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            borderRadius: "20px"
          }}
        >
          <i className="fa-solid fa-flask-vial" style={{ fontSize: "3rem", color: themeGold, opacity: 0.4, marginBottom: "1rem", display: "block" }}></i>
          
          {customProducts.length === 0 ? (
            <>
              <h3 style={{ fontSize: "1.3rem", fontWeight: 800, color: "#FFFFFF", marginBottom: "0.5rem" }}>
                Aún no hay perfumes registrados en la base de datos
              </h3>
              <p style={{ color: "#A1A1AA", fontSize: "0.9rem", maxWidth: "520px", margin: "0 auto 1.5rem auto" }}>
                Esta marca tiene activado el catálogo de perfumería. Al publicar tus perfumes e indicar la inspiración original en la descripción (ej: <em>Inspirado en Sauvage de Dior</em>), aparecerán organizados automáticamente aquí.
              </p>
              {isOwner && onOpenAddModal && (
                <button
                  type="button"
                  onClick={onOpenAddModal}
                  className="btn-gold"
                  style={{ padding: "0.7rem 1.8rem", borderRadius: "24px", fontWeight: 800 }}
                >
                  <i className="fa-solid fa-plus" style={{ marginRight: 8 }}></i> Publicar Primer Perfume
                </button>
              )}
            </>
          ) : (
            <>
              <h3 style={{ fontSize: "1.2rem", fontWeight: 800, color: "#FFFFFF", marginBottom: "0.5rem" }}>
                No encontramos perfumes con esos filtros
              </h3>
              <p style={{ color: "#A1A1AA", fontSize: "0.88rem", marginBottom: "1.2rem" }}>
                Intenta buscar con otra palabra clave, nombre del perfume original o quita los filtros aplicados.
              </p>
              <button
                type="button"
                onClick={() => { setSearchQuery(""); setSelectedGender("ALL"); setSelectedFamily("ALL"); }}
                style={{
                  padding: "0.5rem 1.2rem",
                  borderRadius: "20px",
                  background: "rgba(212,175,55,0.15)",
                  border: "1px solid rgba(212,175,55,0.3)",
                  color: "#FEF08A",
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
            <span style={{ fontSize: "0.85rem", color: "#A1A1AA", fontWeight: 600 }}>
              Mostrando <strong style={{ color: "#FFFFFF" }}>{filteredProducts.length}</strong> {filteredProducts.length === 1 ? "fragancia" : "fragancias"}
            </span>
          </div>

          <div 
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
              gap: "1.5rem"
            }}
          >
            {filteredProducts.map((prod) => {
              const info = prod.perfumeInfo;
              const hasImage = Boolean(prod.image);

              return (
                <div
                  key={prod.id}
                  style={{
                    background: "linear-gradient(180deg, rgba(20, 22, 28, 0.95) 0%, rgba(13, 14, 18, 0.98) 100%)",
                    border: "1px solid rgba(212, 175, 55, 0.22)",
                    borderRadius: "20px",
                    overflow: "hidden",
                    display: "flex",
                    flexDirection: "column",
                    boxShadow: "0 12px 30px rgba(0,0,0,0.45)",
                    transition: "transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease",
                    cursor: "pointer",
                    position: "relative"
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-4px)";
                    e.currentTarget.style.boxShadow = "0 20px 40px rgba(0,0,0,0.6), 0 0 25px rgba(212,175,55,0.15)";
                    e.currentTarget.style.borderColor = "rgba(212, 175, 55, 0.5)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "0 12px 30px rgba(0,0,0,0.45)";
                    e.currentTarget.style.borderColor = "rgba(212, 175, 55, 0.22)";
                  }}
                  onClick={() => router.push(`/products/${prod.slug || prod.id}`)}
                >
                  {/* IMAGEN DEL FRASCO / PRESENTACIÓN */}
                  <div
                    style={{
                      position: "relative",
                      width: "100%",
                      height: "230px",
                      background: "radial-gradient(circle at center, rgba(212,175,55,0.08) 0%, rgba(10,11,15,0.95) 75%)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      overflow: "hidden"
                    }}
                  >
                    {/* Badge de Concentración (50% Esencia) */}
                    <div
                      style={{
                        position: "absolute",
                        top: "12px",
                        left: "12px",
                        background: "linear-gradient(135deg, #D4AF37 0%, #B45309 100%)",
                        color: "#0C0D11",
                        fontSize: "0.68rem",
                        fontWeight: 900,
                        padding: "4px 10px",
                        borderRadius: "14px",
                        letterSpacing: "0.06em",
                        textTransform: "uppercase",
                        boxShadow: "0 4px 12px rgba(0,0,0,0.4)",
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                        zIndex: 2
                      }}
                    >
                      <i className="fa-solid fa-droplet"></i>
                      <span>50% Esencia</span>
                    </div>

                    {/* Badge de Género */}
                    <div
                      style={{
                        position: "absolute",
                        top: "12px",
                        right: "12px",
                        background: "rgba(0, 0, 0, 0.75)",
                        border: "1px solid rgba(255,255,255,0.2)",
                        color: "#FFFFFF",
                        fontSize: "0.68rem",
                        fontWeight: 700,
                        padding: "3px 10px",
                        borderRadius: "14px",
                        backdropFilter: "blur(6px)",
                        zIndex: 2
                      }}
                    >
                      {info.gender === "Hombre" && "👔 Hombre"}
                      {info.gender === "Mujer" && "👗 Mujer"}
                      {info.gender === "Unisex" && "✨ Unisex"}
                    </div>

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
                          background: "rgba(12, 13, 17, 0.85)",
                          border: "1px solid rgba(212, 175, 55, 0.5)",
                          color: "#FEF08A",
                          fontSize: "0.72rem",
                          fontWeight: 700,
                          padding: "4px 10px",
                          borderRadius: "10px",
                          cursor: "pointer",
                          zIndex: 3,
                          display: "flex",
                          alignItems: "center",
                          gap: "5px",
                          backdropFilter: "blur(4px)"
                        }}
                      >
                        <i className="fa-solid fa-pen-to-square"></i>
                        <span>Editar</span>
                      </button>
                    )}

                    {hasImage ? (
                      <img
                        src={prod.image}
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
                        <i className="fa-solid fa-wine-bottle" style={{ fontSize: "3.5rem", color: themeGold, opacity: 0.65, marginBottom: "8px", display: "block" }}></i>
                        <span style={{ fontSize: "0.75rem", color: "#A1A1AA", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 700 }}>
                          Frasco de Colección
                        </span>
                      </div>
                    )}
                  </div>

                  {/* CUERPO DE LA TARJETA */}
                  <div style={{ padding: "1.25rem", display: "flex", flexDirection: "column", flex: 1, gap: "10px" }}>
                    {/* Familia Olfativa */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span 
                        style={{ 
                          fontSize: "0.72rem", 
                          fontWeight: 800, 
                          color: "#FBBF24", 
                          textTransform: "uppercase", 
                          letterSpacing: "0.08em" 
                        }}
                      >
                        {info.family}
                      </span>
                      {info.ml && (
                        <span style={{ fontSize: "0.72rem", color: "#A1A1AA", fontWeight: 600 }}>
                          {info.ml}
                        </span>
                      )}
                    </div>

                    {/* Nombre del Perfume (Modelo que ellos dan) */}
                    <h3 
                      style={{ 
                        fontSize: "1.15rem", 
                        fontWeight: 900, 
                        color: "#FFFFFF", 
                        margin: 0, 
                        lineHeight: 1.3 
                      }}
                    >
                      {prod.name}
                    </h3>

                    {/* RECUADRO DE INSPIRACIÓN ORIGINAL (EL ELEMENTO CLAVE) */}
                    <div 
                      style={{
                        background: "linear-gradient(135deg, rgba(212, 175, 55, 0.14) 0%, rgba(20, 22, 28, 0.85) 100%)",
                        border: "1px solid rgba(212, 175, 55, 0.4)",
                        borderRadius: "12px",
                        padding: "9px 12px",
                        display: "flex",
                        flexDirection: "column",
                        gap: "2px",
                        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.06)"
                      }}
                    >
                      <div 
                        style={{ 
                          fontSize: "0.68rem", 
                          fontWeight: 800, 
                          color: "#FDE047", 
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
                          color: "#FFFFFF",
                          letterSpacing: "-0.01em"
                        }}
                      >
                        {info.inspiration || "Fragancia de Autor"}
                      </div>
                    </div>

                    {/* Descripción o Notas Olfativas */}
                    {info.cleanDesc && (
                      <p 
                        style={{ 
                          fontSize: "0.82rem", 
                          color: "#A1A1AA", 
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

                    {/* Precios y Botón de Acción */}
                    <div style={{ marginTop: "auto", paddingTop: "10px", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
                      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: "10px" }}>
                        <div>
                          <span style={{ fontSize: "0.72rem", color: "#A1A1AA", display: "block" }}>Precio</span>
                          <span style={{ fontSize: "1.3rem", fontWeight: 900, color: "#FFFFFF" }}>
                            S/. {prod.price}
                          </span>
                        </div>

                        {prod.priceAourum && (
                          <div style={{ textAlign: "right" }}>
                            <span style={{ fontSize: "0.68rem", color: themeGold, fontWeight: 700, display: "block", textTransform: "uppercase" }}>
                              Precio AOURUM
                            </span>
                            <span style={{ fontSize: "1.1rem", fontWeight: 800, color: "#FEF08A" }}>
                              S/. {prod.priceAourum}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Botón de Pedido por WhatsApp */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOrderWhatsApp(prod);
                        }}
                        style={{
                          width: "100%",
                          padding: "0.7rem 1rem",
                          borderRadius: "12px",
                          border: "none",
                          background: "linear-gradient(135deg, #D4AF37 0%, #B45309 100%)",
                          color: "#0C0D11",
                          fontSize: "0.85rem",
                          fontWeight: 800,
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "8px",
                          transition: "all 0.2s ease",
                          boxShadow: "0 4px 15px rgba(212,175,55,0.3)"
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.filter = "brightness(1.15)"}
                        onMouseLeave={(e) => e.currentTarget.style.filter = "none"}
                      >
                        <i className="fa-brands fa-whatsapp" style={{ fontSize: "1.1rem" }}></i>
                        <span>Pedir por WhatsApp</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}
