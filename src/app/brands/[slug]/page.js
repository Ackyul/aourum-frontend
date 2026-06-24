"use client";

import { use, useState, useMemo, useEffect, useRef } from "react";
import { useApp } from "../../../context/AppContext";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function BrandProfilePage({ params }) {
  const unwrappedParams = use(params);
  const slug = unwrappedParams.slug;

  const {
    brands,
    products,
    people,
    loading,
    activePersonId,
    prodFormOpen,
    setProdFormOpen,
    editingProdId,
    setEditingProdId,
    prodName,
    setProdName,
    prodDescription,
    setProdDescription,
    prodPrice,
    setProdPrice,
    prodPriceAourum,
    setProdPriceAourum,
    prodStock,
    setProdStock,
    prodCategory,
    setProdCategory,
    prodType,
    setProdType,
    prodImage,
    setProdImage,
    prodImagePreview,
    setProdImagePreview,
    uploadingProd,
    setUploadingProd,
    handleProductSubmit,
    handleDeleteProduct,
    uploadImage,
    fairs,
    appFairId,
    setAppFairId,
    handleApplyToFair,
    invitations,
    sendInvitation,
    changeCollaboratorRole,
    removeCollaborator,
    setEditName,
    setEditOwner,
    setEditCategory,
    setEditDescription,
    setEditLogo,
    setEditLogoPreview,
    setEditProfileType,
    setEditProfileId,
    setEditSlug,
    setEditProfileOpen,
    setEditWhatsappNumber,
    setEditInstagram,
    setEditFacebook,
    setEditTiktok,
    setEditWebsite,
    setEditRubroGeneral,
    setEditRubroEspecifico,
    setEditHasLocal,
    setEditLocalAddress,
    setEditLocalLat,
    setEditLocalLng,
    parseDescription,
    handleDeleteBrand
  } = useApp();

  const router = useRouter();
  const [showFairs, setShowFairs] = useState(false);
  const [showCollabs, setShowCollabs] = useState(false);
  const [fairSearchQuery, setFairSearchQuery] = useState("");
  const [showFairDropdown, setShowFairDropdown] = useState(false);
  const [personSearchQuery, setPersonSearchQuery] = useState("");
  const [showPersonDropdown, setShowPersonDropdown] = useState(false);
  const [selectedPersonId, setSelectedPersonId] = useState("");

  // States for the interactive image editor
  const [editorOpen, setEditorOpen] = useState(false);
  const [editorSource, setEditorSource] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [imgPos, setImgPos] = useState({ x: 0, y: 0 });
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [removeBg, setRemoveBg] = useState(false);
  const [tolerance, setTolerance] = useState(30);

  // Redraw canvas on zoom, drag, background removal toggle, and tolerance changes
  useEffect(() => {
    if (!editorOpen || !editorSource) return;
    const img = new Image();
    img.onload = () => {
      const canvas = document.getElementById("editor-canvas");
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      ctx.clearRect(0, 0, 300, 300);
      
      const w = 300 * zoom;
      const h = 300 * zoom;
      const x = 150 - w/2 + imgPos.x;
      const y = 150 - h/2 + imgPos.y;
      
      ctx.drawImage(img, x, y, w, h);
      
      if (removeBg) {
        const imgData = ctx.getImageData(0, 0, 300, 300);
        const data = imgData.data;
        
        const getPixel = (pixelData, px, py) => {
          const idx = (py * 300 + px) * 4;
          return { r: pixelData[idx], g: pixelData[idx+1], b: pixelData[idx+2] };
        };

        // Average colors of the four corners to detect the background color
        const corners = [
          getPixel(data, 0, 0),
          getPixel(data, 299, 0),
          getPixel(data, 0, 299),
          getPixel(data, 299, 299)
        ];
        
        let rBg = 0, gBg = 0, bBg = 0;
        corners.forEach(c => {
          rBg += c.r;
          gBg += c.g;
          bBg += c.b;
        });
        rBg /= 4;
        gBg /= 4;
        bBg /= 4;
        
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i+1];
          const b = data[i+2];
          
          const dist = Math.sqrt(
            Math.pow(r - rBg, 2) +
            Math.pow(g - gBg, 2) +
            Math.pow(b - bBg, 2)
          );
          
          if (dist < tolerance) {
            data[i+3] = 0; // Set transparency (alpha = 0)
          }
        }
        ctx.putImageData(imgData, 0, 0);
      }
    };
    img.src = editorSource;
  }, [editorOpen, editorSource, zoom, imgPos, removeBg, tolerance]);

  const handleSaveEditor = async () => {
    const canvas = document.getElementById("editor-canvas");
    if (!canvas) return;
    
    const dataUrl = canvas.toDataURL("image/png");
    setProdImagePreview(dataUrl);
    setEditorOpen(false);
    
    try {
      const blob = await fetch(dataUrl).then(res => res.blob());
      const file = new File([blob], "edited_product.png", { type: "image/png" });
      
      setUploadingProd(true);
      const url = await uploadImage(file, setUploadingProd);
      if (url) {
        setProdImage(url);
      }
    } catch (err) {
      console.error("Error processing and uploading image", err);
    }
  };
  
  const brandMapContainerRef = useRef(null);
  const brandLeafletMapRef = useRef(null);

  const isNumeric = /^\d+$/.test(slug);
  const brand = brands.find((b) => {
    if (isNumeric) {
      return b.id === Number(slug) || b.slug === slug;
    }
    return b.slug === slug;
  });

  useEffect(() => {
    if (!brand || typeof window === "undefined") return;
    const parsed = parseDescription(brand.description);
    if (!parsed.has_local || !brandMapContainerRef.current) return;
    if (brandLeafletMapRef.current) return;

    const initBrandMap = () => {
      if (!brandMapContainerRef.current || !window.L) return;

      const L = window.L;
      delete L.Icon.Default.prototype._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      const lat = parsed.local_lat || -16.39889;
      const lng = parsed.local_lng || -71.53694;

      const pMap = L.map(brandMapContainerRef.current, { zoomControl: false }).setView([lat, lng], 16);
      brandLeafletMapRef.current = pMap;

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; OpenStreetMap',
        maxZoom: 19,
      }).addTo(pMap);

      L.marker([lat, lng]).addTo(pMap)
        .bindPopup(`<b>${brand.name}</b><br/>${parsed.local_address || "Local"}`).openPopup();

      L.control.zoom({ position: "bottomright" }).addTo(pMap);
    };

    const timer = setTimeout(initBrandMap, 300);
    return () => {
      clearTimeout(timer);
      if (brandLeafletMapRef.current) {
        brandLeafletMapRef.current.remove();
        brandLeafletMapRef.current = null;
      }
    };
  }, [brand]);

  // Redirect from numeric ID to slug-based URL
  useEffect(() => {
    if (brand && brand.slug && isNumeric) {
      router.replace(`/brands/${brand.slug}`);
    }
  }, [brand, isNumeric, router]);

  const filteredFairs = useMemo(() => {
    if (!fairSearchQuery.trim()) return fairs;
    return fairs.filter(f => f.name.toLowerCase().includes(fairSearchQuery.toLowerCase()));
  }, [fairs, fairSearchQuery]);

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "6rem 0" }}>
        <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: "2.5rem", color: "var(--gold-primary)" }}></i>
        <p style={{ color: "var(--text-muted)", marginTop: "10px" }}>Cargando perfil de marca...</p>
      </div>
    );
  }

  if (!brand) {
    return (
      <div className="container" style={{ textAlign: "center", padding: "4rem 0" }}>
        <h3>Marca no encontrada</h3>
        <button onClick={() => router.push("/brands")} className="btn-gold" style={{ marginTop: "1rem" }}>Volver a Marcas</button>
      </div>
    );
  }

  const brandProducts = products.filter((p) => p.brandId === brand.id);

  // Check collaborator role of the logged-in persona
  const currentPerson = people.find((p) => p.id === Number(activePersonId));
  const userCollaborator = brand.collaborators ? brand.collaborators.find(c => c.personId === Number(activePersonId)) : null;
  const userRole = userCollaborator ? userCollaborator.role : null;
  const isCollaborator = !!userRole;
  const canEditProfile = userRole === 'creador_original' || userRole === 'creador' || userRole === 'gestor';
  const canInvite = userRole === 'creador_original' || userRole === 'creador' || userRole === 'gestor';

  const isOwner = isCollaborator;

  const copyLink = (e) => {
    e.stopPropagation();
    if (typeof window === "undefined") return;
    const fullUrl = window.location.href;
    navigator.clipboard.writeText(fullUrl);
    alert("¡Enlace del perfil copiado al portapapeles! Listo para compartir.");
  };

  const handleEditClick = () => {
    const parsed = parseDescription(brand.description);
    setEditName(brand.name);
    setEditOwner(brand.owner || "");
    setEditCategory(brand.category || "");
    setEditDescription(parsed.text);
    setEditLogo(brand.logo || "");
    setEditLogoPreview(brand.logo || "");
    setEditProfileType("brand");
    setEditProfileId(brand.id);
    setEditSlug(brand.slug || "");
    setEditWhatsappNumber(brand.whatsappNumber || "");
    setEditInstagram(parsed.instagram);
    setEditFacebook(parsed.facebook);
    setEditTiktok(parsed.tiktok);
    setEditWebsite(parsed.website);
    setEditRubroGeneral(parsed.rubro_general || "");
    setEditRubroEspecifico(parsed.rubro_especifico || "");
    setEditHasLocal(!!parsed.has_local);
    setEditLocalAddress(parsed.local_address || "");
    setEditLocalLat(parsed.local_lat !== undefined ? Number(parsed.local_lat) : -16.39889);
    setEditLocalLng(parsed.local_lng !== undefined ? Number(parsed.local_lng) : -71.53694);
    setEditProfileOpen(true);
  };

  return (
    <div className="container" style={{ maxWidth: "1000px", padding: "0 1rem" }}>
      <div className="glass-panel" style={{ position: "relative", overflow: "hidden", borderRadius: "16px" }}>
        <button onClick={() => router.push("/brands")} className="profile-close-btn" style={{ position: "absolute", top: "15px", right: "15px", zIndex: 10 }}>&times;</button>
        <button onClick={copyLink} className="profile-share-btn" style={{ position: "absolute", top: "15px", right: "60px", zIndex: 10 }} title="Copiar enlace de perfil">
          <i className="fa-solid fa-share-nodes"></i>
        </button>
        
        <div className="profile-header-banner" style={{ height: "200px" }}>
          <div className="profile-avatar-wrapper">
            <img src={brand.logo} alt={brand.name} />
          </div>
        </div>

        <div className="profile-body">
          <div className="profile-info-row">
            <div>
              <span style={{ fontSize: "0.8rem", color: "var(--text-gold)", textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.08em" }}>{brand.category}</span>
              <h2 style={{ fontSize: "1.8rem", fontWeight: 800, marginTop: "0.2rem", letterSpacing: "-0.015em" }}>{brand.name}</h2>
              {brand.collaborators && brand.collaborators.length > 1 && (
                <p style={{ fontSize: "0.9rem", color: "var(--text-muted)", marginTop: "0.3rem" }}>
                  <i className="fa-solid fa-user-tag" style={{ marginRight: 6 }}></i>
                  Equipo:{" "}
                  {brand.collaborators.map(c => {
                    const person = people.find(p => p.id === c.personId);
                    return person ? (
                      <Link key={person.id} href={`/people/${person.username || person.id}`} style={{ marginRight: "10px", color: "var(--gold-dark)", textDecoration: "underline" }}>
                        {person.name} ({c.role})
                      </Link>
                    ) : null;
                  })}
                </p>
              )}
            </div>

            {isCollaborator && (
               <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                 <button
                   onClick={() => setProdFormOpen(true)}
                   className="btn-gold"
                   style={{ padding: "0.5rem 1rem", borderRadius: "8px", fontSize: "0.85rem", fontWeight: 700, display: "flex", alignItems: "center", gap: "6px" }}
                 >
                   <i className="fa-solid fa-plus"></i> Añadir Item
                 </button>
                 {userRole === 'creador_original' && (
                   <button
                     onClick={async () => {
                       if (await handleDeleteBrand(brand.id)) {
                         router.push("/brands");
                       }
                     }}
                     className="btn-outline-gold"
                     style={{ padding: "0.5rem 1rem", borderRadius: "8px", fontSize: "0.85rem", fontWeight: 700, display: "flex", alignItems: "center", gap: "6px", color: "#ef4444", borderColor: "#ef4444", background: "transparent", cursor: "pointer" }}
                   >
                     <i className="fa-solid fa-trash"></i> Eliminar Marca
                   </button>
                 )}
                 {canEditProfile && (
                   <button
                     onClick={handleEditClick}
                     className="btn-outline-gold"
                     style={{ padding: "0.5rem 1rem", borderRadius: "8px", fontSize: "0.85rem", fontWeight: 700, display: "flex", alignItems: "center", gap: "6px" }}
                   >
                     <i className="fa-solid fa-gear"></i> Editar Perfil
                   </button>
                 )}
               </div>
             )}
          </div>

          <p style={{ fontSize: "0.95rem", color: "var(--text-primary)", marginTop: "1.2rem", lineHeight: 1.65 }}>
            {parseDescription(brand.description).text}
          </p>

          {(() => {
            const parsed = parseDescription(brand.description);
            const hasSocials = parsed.instagram || parsed.facebook || parsed.tiktok || parsed.website || brand.whatsappNumber;
            if (!hasSocials) return null;
            return (
              <div style={{ display: "flex", gap: "16px", alignItems: "center", marginTop: "1rem", flexWrap: "wrap" }}>
                {brand.whatsappNumber && (
                  <a 
                    href={`https://api.whatsapp.com/send?phone=${brand.whatsappNumber.replace(/[^0-9]/g, "")}`} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    style={{ color: "#25d366", fontSize: "1.4rem", display: "flex", alignItems: "center", textDecoration: "none", transition: "transform 0.2s" }}
                    onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.2)"}
                    onMouseLeave={(e) => e.currentTarget.style.transform = "none"}
                    title="WhatsApp"
                  >
                    <i className="fa-brands fa-whatsapp"></i>
                  </a>
                )}
                {parsed.instagram && (
                  <a 
                    href={`https://instagram.com/${parsed.instagram.trim()}`} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    style={{ color: "#e1306c", fontSize: "1.4rem", display: "flex", alignItems: "center", textDecoration: "none", transition: "transform 0.2s" }}
                    onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.2)"}
                    onMouseLeave={(e) => e.currentTarget.style.transform = "none"}
                    title="Instagram"
                  >
                    <i className="fa-brands fa-instagram"></i>
                  </a>
                )}
                {parsed.facebook && (
                  <a 
                    href={`https://facebook.com/${parsed.facebook.trim()}`} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    style={{ color: "#1877f2", fontSize: "1.4rem", display: "flex", alignItems: "center", textDecoration: "none", transition: "transform 0.2s" }}
                    onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.2)"}
                    onMouseLeave={(e) => e.currentTarget.style.transform = "none"}
                    title="Facebook"
                  >
                    <i className="fa-brands fa-facebook"></i>
                  </a>
                )}
                {parsed.tiktok && (
                  <a 
                    href={`https://tiktok.com/@${parsed.tiktok.trim().replace(/^@/, "")}`} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    style={{ color: "#000000", fontSize: "1.4rem", display: "flex", alignItems: "center", textDecoration: "none", transition: "transform 0.2s" }}
                    onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.2)"}
                    onMouseLeave={(e) => e.currentTarget.style.transform = "none"}
                    title="TikTok"
                  >
                    <i className="fa-brands fa-tiktok"></i>
                  </a>
                )}
                {parsed.website && (
                  <a 
                    href={parsed.website.trim().startsWith("http") ? parsed.website.trim() : `https://${parsed.website.trim()}`} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    style={{ color: "var(--gold-primary)", fontSize: "1.4rem", display: "flex", alignItems: "center", textDecoration: "none", transition: "transform 0.2s" }}
                    onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.2)"}
                    onMouseLeave={(e) => e.currentTarget.style.transform = "none"}
                    title="Sitio Web"
                  >
                    <i className="fa-solid fa-globe"></i>
                  </a>
                )}
              </div>
            );
          })()}

          {/* Ubicación del local (si tiene) */}
          {(() => {
            const parsed = parseDescription(brand.description);
            if (!parsed.has_local) return null;
            return (
              <div style={{ marginBottom: "2.2rem", marginTop: "1.5rem" }}>
                <h3 style={{ fontSize: "1.05rem", fontWeight: 800, marginBottom: "0.8rem", color: "var(--text-gold)" }}>
                  <i className="fa-solid fa-map"></i> Ubicación de nuestro Local
                </h3>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.9rem", fontWeight: 600, color: "var(--text-primary)", marginBottom: "0.8rem" }}>
                  <i className="fa-solid fa-location-dot" style={{ color: "var(--gold-primary)" }}></i>
                  <span>{parsed.local_address || "Dirección no especificada"}</span>
                </div>
                <div ref={brandMapContainerRef} style={{ height: "240px", width: "100%", borderRadius: "10px", border: "1px solid var(--border-color)", zIndex: 1, boxShadow: "0 4px 16px rgba(0,0,0,0.03)" }}></div>
              </div>
            );
          })()}

          <hr style={{ border: 0, borderTop: "1px solid var(--border-color)", margin: "2.2rem 0" }} />
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", flexWrap: "wrap", gap: "1rem" }}>
            <h3 style={{ fontSize: "1.2rem", fontWeight: 800, margin: 0 }}>
              <i className="fa-solid fa-store" style={{ color: "var(--gold-primary)", marginRight: 8 }}></i>
              Catálogo de la Marca
            </h3>
          </div>

          {/* Formulario de creación/edición de producto en Ventana Superpuesta (Modal) */}
          {isOwner && prodFormOpen && (
            <div className="modal-overlay" style={{ zIndex: 1100 }}>
              <div className="modal-backdrop" onClick={() => { setProdFormOpen(false); setEditingProdId(null); }}></div>
              <div className="modal-panel fade-in" style={{ maxWidth: "750px", width: "90%", padding: "2rem", background: "#FFFFFF", borderRadius: "12px", border: "1.5px solid var(--gold-primary)", maxHeight: "90vh", overflowY: "auto", position: "relative" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
                  <h3 style={{ fontSize: "1.3rem", fontWeight: 800, margin: 0 }}>
                    {editingProdId ? "✨ Editar Item de Catálogo" : "✨ Publicar Nuevo Item"}
                  </h3>
                  <button 
                    onClick={() => { setProdFormOpen(false); setEditingProdId(null); }} 
                    style={{ background: "rgba(0,0,0,0.04)", border: "none", fontSize: "1.2rem", cursor: "pointer", width: "32px", height: "32px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}
                  >
                    &times;
                  </button>
                </div>
                <form onSubmit={(e) => handleProductSubmit(e, brand.id)}>
                  <div className="grid-2-to-1">
                    <div className="form-group">
                      <label>Nombre del Item *</label>
                      <input type="text" className="form-control" placeholder="Ej: Anillo de Plata 950" value={prodName} onChange={(e) => setProdName(e.target.value)} required />
                    </div>
                    <div className="form-group">
                      <label>Categoría / Rubro *</label>
                      <input type="text" className="form-control" placeholder="Ej: Joyería, Bienestar" value={prodCategory} onChange={(e) => setProdCategory(e.target.value)} required />
                    </div>
                  </div>

                  <div className="grid-2-to-1">
                    <div className="form-group">
                      <label>Tipo de Item</label>
                      <select className="form-control" value={prodType} onChange={(e) => setProdType(e.target.value)}>
                        <option value="product">Producto Físico (Con Stock)</option>
                        <option value="service">Servicio (Por Agenda / Cita)</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Stock (Opcional)</label>
                      <input 
                        type="number" 
                        className="form-control" 
                        placeholder={prodType === "service" ? "No requiere stock" : "Ej: 15"} 
                        value={prodStock} 
                        onChange={(e) => setProdStock(e.target.value)} 
                        disabled={prodType === "service"}
                      />
                    </div>
                  </div>

                  <div className="grid-2-to-1" style={{ marginTop: "1rem" }}>
                    <div className="form-group">
                      <label>Precio Normal (S/.) *</label>
                      <input type="number" className="form-control" placeholder="Ej: 10" value={prodPrice} onChange={(e) => setProdPrice(e.target.value)} required />
                    </div>
                    <div className="form-group">
                      <label>Precio AOURUM (S/.) (Opcional)</label>
                      <input type="number" className="form-control" placeholder="Ej: 8" value={prodPriceAourum} onChange={(e) => setProdPriceAourum(e.target.value)} />
                    </div>
                  </div>

                  <div className="prod-form-img-desc" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1.5rem", marginTop: "1rem" }}>
                    <div className="form-group">
                      <label>Subir Imagen</label>
                      <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", display: "block", marginTop: "-3px", marginBottom: "5px" }}>
                        Proporción recomendada: Cuadrada (1:1, ej. 800x800 px) o 4:3
                      </span>
                      <label
                        htmlFor="prod-img-upload"
                        style={{
                          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                          border: "2px dashed var(--border-color)", borderRadius: "8px",
                          height: "120px", cursor: "pointer", transition: "var(--transition-smooth)",
                          background: "var(--bg-input)"
                        }}
                      >
                        {prodImagePreview ? (
                          <img src={prodImagePreview} alt="preview" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "6px" }} />
                        ) : (
                          <div style={{ textAlign: "center", padding: "0.5rem" }}>
                            <i className="fa-solid fa-cloud-arrow-up" style={{ color: "var(--gold-primary)", fontSize: "1.4rem", marginBottom: 4 }}></i>
                            <span style={{ fontSize: "0.75rem", display: "block", color: "var(--text-muted)" }}>Elegir archivo</span>
                          </div>
                        )}
                      </label>
                      <input 
                        id="prod-img-upload" 
                        type="file" 
                        accept="image/*" 
                        style={{ display: "none" }} 
                        disabled={uploadingProd} 
                        onChange={(e) => {
                          const file = e.target.files[0];
                          if (!file) return;
                          const reader = new FileReader();
                          reader.onload = () => {
                            setEditorSource(reader.result);
                            setZoom(1);
                            setImgPos({ x: 0, y: 0 });
                            setRemoveBg(false);
                            setEditorOpen(true);
                          };
                          reader.readAsDataURL(file);
                        }}
                      />
                    </div>

                    <div className="form-group" style={{ flex: 1 }}>
                      <label>Descripción del Producto *</label>
                      <textarea className="form-control" rows="4" style={{ resize: "none" }} placeholder="Describe los materiales, dimensiones o proceso..." value={prodDescription} onChange={(e) => setProdDescription(e.target.value)}></textarea>
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", marginTop: "1.5rem" }}>
                    <button 
                      type="button" 
                      onClick={() => { setProdFormOpen(false); setEditingProdId(null); }} 
                      className="btn-outline-gold"
                      style={{ padding: "0.45rem 1.2rem", borderRadius: "6px", fontSize: "0.85rem" }}
                    >
                      Cancelar
                    </button>
                    <button type="submit" className="btn-gold" style={{ padding: "0.45rem 1.2rem", borderRadius: "6px", fontSize: "0.85rem" }} disabled={uploadingProd}>
                      {uploadingProd ? "Subiendo..." : editingProdId ? "Actualizar Item" : "Publicar Item"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Modal del Editor de Imagen (Recorte y Eliminación de Fondo) */}
          {editorOpen && (
            <div className="modal-overlay" style={{ zIndex: 1200 }}>
              <div className="modal-backdrop" onClick={() => setEditorOpen(false)}></div>
              <div className="modal-panel fade-in" style={{ maxWidth: "500px", width: "90%", padding: "2rem", background: "#FFFFFF", borderRadius: "12px", border: "1.5px solid var(--gold-primary)", textAlign: "center" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
                  <h3 style={{ fontSize: "1.2rem", fontWeight: 800, margin: 0 }}>
                    ✨ Editor de Imagen
                  </h3>
                  <button 
                    onClick={() => setEditorOpen(false)} 
                    style={{ background: "rgba(0,0,0,0.04)", border: "none", fontSize: "1.2rem", cursor: "pointer", width: "32px", height: "32px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}
                  >
                    &times;
                  </button>
                </div>

                <div style={{ fontSize: "0.82rem", color: "var(--text-muted)", marginBottom: "1rem" }}>
                  Arrastra la imagen dentro del recuadro para centrarla. Usa los controles inferiores para recortar o quitar el fondo.
                </div>

                {/* Viewport de Canvas interactivo */}
                <div style={{ position: "relative", width: "300px", height: "300px", margin: "0 auto 1.2rem auto", overflow: "hidden" }}>
                  <canvas 
                    id="editor-canvas"
                    width={300}
                    height={300}
                    style={{
                      width: "300px",
                      height: "300px",
                      border: "2px solid var(--gold-primary)",
                      borderRadius: "8px",
                      background: "repeating-conic-gradient(#f0f0f0 0% 25%, #ffffff 0% 50%) 50% / 20px 20px",
                      cursor: isDragging ? "grabbing" : "grab",
                      display: "block",
                      touchAction: "none"
                    }}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      setIsDragging(true);
                      setDragStart({ x: e.clientX - imgPos.x, y: e.clientY - imgPos.y });
                    }}
                    onMouseMove={(e) => {
                      if (!isDragging) return;
                      setImgPos({
                        x: e.clientX - dragStart.x,
                        y: e.clientY - dragStart.y
                      });
                    }}
                    onMouseUp={() => setIsDragging(false)}
                    onMouseLeave={() => setIsDragging(false)}
                  />
                </div>

                {/* Controles de Zoom */}
                <div className="form-group" style={{ marginBottom: "1.2rem", textAlign: "left" }}>
                  <label style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", fontWeight: 600 }}>
                    <span>🔍 Zoom:</span>
                    <span>{zoom.toFixed(1)}x</span>
                  </label>
                  <input 
                    type="range" 
                    min="1" 
                    max="3" 
                    step="0.1" 
                    value={zoom} 
                    onChange={(e) => setZoom(parseFloat(e.target.value))} 
                    style={{ width: "100%", accentColor: "var(--gold-primary)", cursor: "pointer" }}
                  />
                </div>

                {/* Controles de Eliminación de Fondo */}
                <div style={{ background: "var(--bg-input)", padding: "1rem", borderRadius: "8px", marginBottom: "1.5rem", textAlign: "left", border: "1px solid var(--border-color)" }}>
                  <label style={{ display: "flex", alignItems: "center", gap: "10px", fontWeight: 700, fontSize: "0.88rem", cursor: "pointer" }}>
                    <input 
                      type="checkbox" 
                      checked={removeBg} 
                      onChange={(e) => setRemoveBg(e.target.checked)} 
                      style={{ accentColor: "var(--gold-primary)", width: "16px", height: "16px" }}
                    />
                    <span>🪄 Remover Fondo (Inteligente)</span>
                  </label>
                  
                  {removeBg && (
                    <div className="fade-in" style={{ marginTop: "0.8rem" }}>
                      <label style={{ display: "flex", justifyContent: "space-between", fontSize: "0.78rem", color: "var(--text-muted)" }}>
                        <span>Tolerancia de color:</span>
                        <span>{tolerance}</span>
                      </label>
                      <input 
                        type="range" 
                        min="5" 
                        max="100" 
                        value={tolerance} 
                        onChange={(e) => setTolerance(parseInt(e.target.value))} 
                        style={{ width: "100%", accentColor: "var(--gold-primary)", cursor: "pointer", marginTop: "4px" }}
                      />
                      <span style={{ fontSize: "0.7rem", color: "var(--text-muted)", display: "block", marginTop: "4px" }}>
                        Tip: Ajusta la tolerancia para quitar tonos similares al color detectado en las esquinas de la foto.
                      </span>
                    </div>
                  )}
                </div>

                <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
                  <button 
                    type="button" 
                    onClick={() => setEditorOpen(false)} 
                    className="btn-outline-gold"
                    style={{ padding: "0.5rem 1.2rem", borderRadius: "6px", fontSize: "0.85rem" }}
                  >
                    Cancelar
                  </button>
                  <button 
                    type="button" 
                    onClick={handleSaveEditor} 
                    className="btn-gold" 
                    style={{ padding: "0.5rem 1.4rem", borderRadius: "6px", fontSize: "0.85rem", fontWeight: 700 }}
                  >
                    Guardar
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Tabla de administración del catálogo si es dueño */}
          {isOwner && brandProducts.length > 0 && (
            <div className="glass-panel" style={{ padding: "1.5rem", marginTop: "1.5rem", marginBottom: "1.5rem" }}>
              <h3 style={{ fontSize: "1.05rem", fontWeight: 800, marginBottom: "1rem" }}><i className="fa-solid fa-list-check" style={{ color: "var(--gold-primary)", marginRight: 8 }}></i>Administrar Items en Catálogo</h3>
              <div className="admin-table-wrapper" style={{ overflowX: "auto" }}>

                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.88rem" }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid var(--border-color)", textAlign: "left", color: "var(--text-muted)", fontSize: "0.78rem", textTransform: "uppercase" }}>
                      <th style={{ padding: "0.8rem 0" }}>Foto</th>
                      <th>Nombre</th>
                      <th>Tipo</th>
                      <th>Precio</th>
                      <th>Stock</th>
                      <th style={{ textAlign: "right" }}>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {brandProducts.map((prod) => (
                      <tr key={prod.id} style={{ borderBottom: "1px solid rgba(0,0,0,0.04)" }}>
                        <td style={{ padding: "0.6rem 0" }}>
                          <img src={prod.image} alt={prod.name} style={{ width: "42px", height: "42px", objectFit: "cover", borderRadius: "6px", border: "1px solid var(--border-color)" }} />
                        </td>
                        <td style={{ fontWeight: 700 }}>{prod.name}</td>
                        <td>
                          <span style={{ fontSize: "0.72rem", padding: "3px 6px", borderRadius: "4px", color: "#FFFFFF", fontWeight: "bold", background: prod.type === "service" ? "#2563eb" : "#d97706" }}>
                            {prod.type === "service" ? "Servicio" : "Producto"}
                          </span>
                        </td>
                        <td style={{ fontWeight: "bold" }}>
                          {prod.priceAourum ? (
                            <div>
                              <span style={{ color: "var(--text-gold)" }}>S/ {prod.priceAourum.toLocaleString("es-PE")}</span>
                              <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", textDecoration: "line-through", marginLeft: "6px" }}>
                                S/ {prod.price.toLocaleString("es-PE")}
                              </span>
                            </div>
                          ) : (
                            <span>S/ {prod.price.toLocaleString("es-PE")}</span>
                          )}
                        </td>
                        <td>{prod.type === "service" ? "Por Agenda" : (prod.stock == null ? "Ilimitado / Opcional" : prod.stock)}</td>
                        <td style={{ textAlign: "right" }}>
                          <button 
                            onClick={() => {
                              setEditingProdId(prod.id); 
                              setProdName(prod.name); setProdDescription(prod.description); setProdPrice(prod.price);
                              setProdPriceAourum(prod.priceAourum == null ? "" : prod.priceAourum);
                              setProdStock(prod.stock == null ? "" : prod.stock); setProdCategory(prod.category); setProdType(prod.type);
                              setProdImage(prod.image); setProdImagePreview(prod.image); setProdFormOpen(true);
                            }}
                            style={{ background: "transparent", border: "none", color: "var(--gold-dark)", cursor: "pointer", marginRight: "1rem", fontWeight: 700 }}
                          >
                            Editar
                          </button>
                          <button 
                            onClick={() => handleDeleteProduct(prod.id)}
                            style={{ background: "transparent", border: "none", color: "#ef4444", cursor: "pointer", fontWeight: 700 }}
                          >
                            Eliminar
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {brandProducts.length === 0 ? (
            <div style={{ textAlign: "center", padding: "3rem 0", color: "var(--text-muted)" }}>
              <i className="fa-solid fa-box-open" style={{ fontSize: "2.5rem", opacity: 0.3, marginBottom: "1rem", display: "block" }}></i>
              <p style={{ fontSize: "0.9rem" }}>Esta marca aún no ha publicado items en su catálogo virtual.</p>
            </div>
          ) : (
            <div className="grid-catalog">
              {brandProducts.map((prod) => (
                <div key={prod.id} className="glass-panel" style={{ overflow: "hidden", display: "flex", flexDirection: "column", cursor: "pointer" }} onClick={() => router.push(`/products/${prod.slug || prod.id}`)}>
                  <div className="card-img-container" style={{ height: "180px", position: "relative" }}>
                    <img src={prod.image} alt={prod.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} className="card-img-hover" />
                    <span style={{
                      position: "absolute", top: "10px", left: "10px",
                      background: prod.type === "service" ? "#2563eb" : "#d97706",
                      color: "#FFFFFF", padding: "0.2rem 0.5rem", borderRadius: "5px",
                      fontSize: "0.68rem", fontWeight: 700, textTransform: "uppercase"
                    }}>
                      {prod.type === "service" ? "Servicio" : "Producto"}
                    </span>
                  </div>
                  <div style={{ padding: "1rem", flex: 1, display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                    <h4 style={{ fontSize: "1.0rem", fontWeight: 800, color: "var(--text-primary)" }}>{prod.name}</h4>
                    <p style={{ fontSize: "0.82rem", color: "var(--text-muted)", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden", flex: 1, lineHeight: 1.4 }}>{prod.description}</p>
                    
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid rgba(0,0,0,0.04)", paddingTop: "0.6rem" }}>
                      {prod.priceAourum ? (
                        <div style={{ display: "flex", flexDirection: "column" }}>
                          <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", textDecoration: "line-through" }}>
                            S/ {prod.price.toLocaleString("es-PE")}
                          </span>
                          <span style={{ fontSize: "1.0rem", fontWeight: 800, color: "var(--text-gold)" }}>
                            S/ {prod.priceAourum.toLocaleString("es-PE")}
                          </span>
                        </div>
                      ) : (
                        <span style={{ fontSize: "1.0rem", fontWeight: 800 }}>S/ {prod.price.toLocaleString("es-PE")}</span>
                      )}
                      <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 600 }}>
                        {prod.type === "service" ? "Por Agenda" : (prod.stock == null ? "Disponible" : `Stock: ${prod.stock}`)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Opciones Desplegables de Administración y Colaboración */}
          {isCollaborator && (
            <>
              <hr style={{ border: 0, borderTop: "1px solid var(--border-color)", margin: "2.2rem 0" }} />
              
              {/* Opción 1: Postular Marca a Ferias */}
              {isOwner && (
                <div className="glass-panel" style={{ padding: "1.5rem", marginBottom: "1.5rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }} onClick={() => setShowFairs(true)}>
                    <h3 style={{ fontSize: "1.05rem", fontWeight: 800, margin: 0 }}>
                      <i className="fa-solid fa-paper-plane" style={{ color: "var(--gold-primary)", marginRight: 8 }}></i> Postular Marca a Ferias
                    </h3>
                    <button type="button" className="btn-outline-gold" style={{ padding: "4px 12px", fontSize: "0.75rem", borderRadius: "6px", fontWeight: 700 }}>
                      Postular
                    </button>
                  </div>

                  {showFairs && (
                    <div className="modal-overlay" style={{ zIndex: 1100 }}>
                      <div className="modal-backdrop" onClick={() => setShowFairs(false)}></div>
                      <div className="modal-panel fade-in" style={{ maxWidth: "550px", width: "90%", padding: "2rem", background: "#FFFFFF", borderRadius: "12px", border: "1.5px solid var(--gold-primary)", position: "relative" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
                          <h3 style={{ fontSize: "1.2rem", fontWeight: 800, margin: 0 }}>
                            <i className="fa-solid fa-paper-plane" style={{ color: "var(--gold-primary)", marginRight: 8 }}></i> Postular Marca a Ferias
                          </h3>
                          <button 
                            onClick={() => setShowFairs(false)} 
                            style={{ background: "rgba(0,0,0,0.04)", border: "none", fontSize: "1.2rem", cursor: "pointer", width: "32px", height: "32px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}
                          >
                            &times;
                          </button>
                        </div>
                        <form onSubmit={(e) => handleApplyToFair(e, "brand", brand.id)} className="apply-fair-form">
                          <div className="form-group" style={{ marginBottom: "1.5rem", position: "relative" }}>
                            <label style={{ fontWeight: 600, fontSize: "0.9rem", display: "block", marginBottom: "0.5rem" }}>Buscar y seleccionar feria del calendario local</label>
                            <div style={{ position: "relative" }}>
                              <input
                                type="text"
                                className="form-control"
                                placeholder="Escribe el nombre de la feria para buscar..."
                                value={fairSearchQuery}
                                onChange={(e) => {
                                  setFairSearchQuery(e.target.value);
                                  setShowFairDropdown(true);
                                }}
                                onFocus={() => setShowFairDropdown(true)}
                                onBlur={() => setTimeout(() => setShowFairDropdown(false), 200)}
                                required
                              />
                              {fairSearchQuery && (
                                <button 
                                  type="button" 
                                  onClick={() => { setFairSearchQuery(""); setAppFairId(""); setShowFairDropdown(false); }}
                                  style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", fontSize: "1.1rem" }}
                                >
                                  &times;
                                </button>
                              )}
                            </div>
                            
                            {showFairDropdown && fairSearchQuery.trim() !== "" && filteredFairs.length > 0 && (
                              <div 
                                style={{
                                  position: "absolute", top: "100%", left: 0, right: 0,
                                  background: "var(--bg-card)", border: "1px solid var(--border-color)",
                                  borderRadius: "8px", boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
                                  maxHeight: "200px", overflowY: "auto", zIndex: 1000, marginTop: "4px"
                                }}
                              >
                                {filteredFairs.map(f => (
                                  <div
                                    key={f.id}
                                    onClick={() => {
                                      setAppFairId(f.id.toString());
                                      setFairSearchQuery(`${f.name} (${f.date})`);
                                      setShowFairDropdown(false);
                                    }}
                                    style={{
                                      padding: "0.6rem 1rem", cursor: "pointer",
                                      transition: "background 0.2s", fontSize: "0.85rem",
                                      borderBottom: "1px solid rgba(0,0,0,0.02)",
                                      color: "var(--text-primary)"
                                    }}
                                    onMouseEnter={(e) => e.target.style.background = "var(--bg-input)"}
                                    onMouseLeave={(e) => e.target.style.background = "none"}
                                  >
                                    <strong>{f.name}</strong> <span style={{ color: "var(--text-muted)", fontSize: "0.78rem", marginLeft: "6px" }}>({f.date})</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                          <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
                            <button type="button" onClick={() => setShowFairs(false)} className="btn-outline-gold" style={{ padding: "0.5rem 1.2rem", borderRadius: "6px" }}>Cancelar</button>
                            <button type="submit" className="btn-gold" style={{ padding: "0.5rem 1.4rem", borderRadius: "6px", fontWeight: 700 }}>Enviar Postulación</button>
                          </div>
                        </form>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Opción 2: Colaboradores de la Marca */}
              <div className="glass-panel" style={{ padding: "1.5rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }} onClick={() => setShowCollabs(true)}>
                  <h3 style={{ fontSize: "1.05rem", fontWeight: 800, margin: 0 }}>
                    <i className="fa-solid fa-users" style={{ color: "var(--gold-primary)", marginRight: 8 }}></i> Colaboradores de la Marca
                  </h3>
                  <button type="button" className="btn-outline-gold" style={{ padding: "4px 12px", fontSize: "0.75rem", borderRadius: "6px", fontWeight: 700 }}>
                    Administrar
                  </button>
                </div>

                {showCollabs && (
                  <div className="modal-overlay" style={{ zIndex: 1100 }}>
                    <div className="modal-backdrop" onClick={() => setShowCollabs(false)}></div>
                    <div className="modal-panel fade-in" style={{ maxWidth: "750px", width: "90%", padding: "2rem", background: "#FFFFFF", borderRadius: "12px", border: "1.5px solid var(--gold-primary)", maxHeight: "90vh", overflowY: "auto", position: "relative" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
                        <h3 style={{ fontSize: "1.2rem", fontWeight: 800, margin: 0 }}>
                          <i className="fa-solid fa-users" style={{ color: "var(--gold-primary)", marginRight: 8 }}></i> Colaboradores de la Marca
                        </h3>
                        <button 
                          onClick={() => setShowCollabs(false)} 
                          style={{ background: "rgba(0,0,0,0.04)", border: "none", fontSize: "1.2rem", cursor: "pointer", width: "32px", height: "32px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}
                        >
                          &times;
                        </button>
                      </div>
                      
                      <div className="collab-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "2rem" }}>
                        <div>
                          <h4 style={{ fontSize: "0.95rem", fontWeight: 700, marginBottom: "0.8rem", color: "var(--text-gold)" }}>Miembros Vinculados</h4>
                          {brand.collaborators && brand.collaborators.length === 0 ? (
                            <p style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>No hay colaboradores adicionales.</p>
                          ) : (
                            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                              {brand.collaborators && brand.collaborators.map(c => {
                                const p = people.find(person => person.id === c.personId);
                                if (!p) return null;
                                const isThisCollaboratorOriginalCreator = c.role === 'creador_original';
                                return (
                                  <div key={p.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "var(--bg-input)", padding: "0.5rem", borderRadius: "6px", gap: "10px" }}>
                                    <div onClick={() => { router.push(`/people/${p.username || p.id}`); setShowCollabs(false); }} style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
                                      <img src={p.logo} alt={p.name} style={{ width: "24px", height: "24px", borderRadius: "50%", objectFit: "cover" }} />
                                      <span style={{ fontSize: "0.85rem", fontWeight: 600, textDecoration: "underline" }}>{p.name}</span>
                                      <span style={{ fontSize: "0.72rem", color: "var(--text-gold)", textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.05em" }}>({c.role})</span>
                                    </div>
                                    
                                    {userRole === 'creador_original' && !isThisCollaboratorOriginalCreator && (
                                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                        <select 
                                          value={c.role} 
                                          onChange={(e) => changeCollaboratorRole('brand', brand.id, p.id, e.target.value)}
                                          className="form-control" 
                                          style={{ padding: "2px 6px", fontSize: "0.75rem", width: "auto" }}
                                        >
                                          <option value="colaborador">Colaborador</option>
                                          <option value="gestor">Gestor</option>
                                          <option value="creador">Creador</option>
                                        </select>
                                        <button 
                                          onClick={() => {
                                            if (confirm(`¿Seguro que deseas desvincular a ${p.name}?`)) {
                                              removeCollaborator('brand', brand.id, p.id);
                                            }
                                          }}
                                          style={{ background: "transparent", border: "none", color: "#ef4444", cursor: "pointer", fontSize: "0.82rem", fontWeight: 700 }}
                                        >
                                          <i className="fa-solid fa-user-minus"></i>
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                        
                        <div>
                          {canInvite && (
                            <>
                              <h4 style={{ fontSize: "0.95rem", fontWeight: 700, marginBottom: "0.8rem", color: "var(--text-gold)" }}>Invitar Colaborador</h4>
                              {(() => {
                                const linkedIds = (brand.collaborators || []).map(c => c.personId);
                                const pendingReceiverIds = invitations.filter(inv => inv.senderType === "brand" && inv.senderId === brand.id).map(inv => inv.receiverPersonId);
                                const candidates = people.filter(p => !linkedIds.includes(p.id) && !pendingReceiverIds.includes(p.id));

                                const filteredCandidates = candidates.filter(p => 
                                  p.name.toLowerCase().includes(personSearchQuery.toLowerCase()) || 
                                  (p.username && p.username.toLowerCase().includes(personSearchQuery.toLowerCase())) ||
                                  (p.occupation && p.occupation.toLowerCase().includes(personSearchQuery.toLowerCase()))
                                );

                                return (
                                  <form onSubmit={(e) => {
                                    e.preventDefault();
                                    const receiverId = Number(e.target.elements.invitePerson.value);
                                    const inviteRole = e.target.elements.inviteRole.value;
                                    if (!receiverId || !inviteRole) return;
                                    sendInvitation("brand", brand.id, brand.name, receiverId, inviteRole);
                                    setPersonSearchQuery("");
                                    setSelectedPersonId("");
                                  }}>
                                    <div style={{ display: "flex", flexDirection: "column", gap: "8px", position: "relative" }}>
                                      <input type="hidden" name="invitePerson" value={selectedPersonId} />
                                      <div style={{ position: "relative" }}>
                                        <input
                                          type="text"
                                          className="form-control"
                                          placeholder="Escribe el nombre para buscar..."
                                          value={personSearchQuery}
                                          onChange={(e) => {
                                            setPersonSearchQuery(e.target.value);
                                            setShowPersonDropdown(true);
                                          }}
                                          onFocus={() => setShowPersonDropdown(true)}
                                          onBlur={() => setTimeout(() => setShowPersonDropdown(false), 200)}
                                          required
                                        />
                                        {personSearchQuery && (
                                          <button 
                                            type="button" 
                                            onClick={() => { setPersonSearchQuery(""); setSelectedPersonId(""); setShowPersonDropdown(false); }}
                                            style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", fontSize: "1.1rem" }}
                                          >
                                            &times;
                                          </button>
                                        )}

                                        {showPersonDropdown && personSearchQuery.trim() !== "" && filteredCandidates.length > 0 && (
                                          <div 
                                            style={{
                                              position: "absolute", top: "100%", left: 0, right: 0,
                                              background: "var(--bg-card)", border: "1px solid var(--border-color)",
                                              borderRadius: "8px", boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
                                              maxHeight: "160px", overflowY: "auto", zIndex: 1000, marginTop: "4px"
                                            }}
                                          >
                                            {filteredCandidates.map(p => (
                                              <div
                                                key={p.id}
                                                onClick={() => {
                                                  setSelectedPersonId(p.id.toString());
                                                  setPersonSearchQuery(p.name + (p.occupation ? ` (${p.occupation})` : ""));
                                                  setShowPersonDropdown(false);
                                                }}
                                                style={{
                                                  padding: "0.6rem 1rem", cursor: "pointer",
                                                  transition: "background 0.2s", fontSize: "0.85rem",
                                                  borderBottom: "1px solid rgba(0,0,0,0.02)",
                                                  color: "var(--text-primary)"
                                                }}
                                                onMouseEnter={(e) => e.target.style.background = "var(--bg-input)"}
                                                onMouseLeave={(e) => e.target.style.background = "none"}
                                              >
                                                <strong>{p.name}</strong> {p.occupation && <span style={{ color: "var(--text-muted)", fontSize: "0.78rem", marginLeft: "6px" }}>({p.occupation})</span>}
                                              </div>
                                            ))}
                                          </div>
                                        )}
                                      </div>

                                      <select name="inviteRole" className="form-control" style={{ fontSize: "0.85rem" }} required>
                                        <option value="colaborador">Colaborador</option>
                                        <option value="gestor">Gestor</option>
                                        <option value="creador">Creador</option>
                                      </select>
                                      <button type="submit" className="btn-gold" style={{ padding: "0.45rem 1rem", borderRadius: "6px", fontSize: "0.82rem", width: "100%" }} disabled={candidates.length === 0 || !selectedPersonId}>
                                        <i className="fa-solid fa-paper-plane" style={{ marginRight: 6 }}></i> Enviar Invitación
                                      </button>
                                    </div>
                                  </form>
                                );
                              })()}
                            </>
                          )}

                          {(() => {
                            const pending = invitations.filter(inv => inv.senderType === "brand" && inv.senderId === brand.id);
                            if (pending.length === 0) return null;
                            return (
                              <div style={{ marginTop: "1rem", borderTop: "1px dashed var(--border-color)", paddingTop: "0.8rem" }}>
                                <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>Invitaciones Pendientes:</span>
                                <div style={{ display: "flex", flexDirection: "column", gap: "4px", marginTop: "6px" }}>
                                  {pending.map(inv => {
                                    const receiver = people.find(p => p.id === inv.receiverPersonId);
                                    return (
                                      <div key={inv.id} style={{ fontSize: "0.8rem", color: "var(--text-muted)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                        <span>✉️ {receiver ? receiver.name : `Persona #${inv.receiverPersonId}`} <span style={{ fontSize: "0.72rem", color: "var(--text-gold)" }}>({inv.role})</span></span>
                                        <span style={{ fontStyle: "italic", fontSize: "0.75rem" }}>Enviada</span>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            );
                          })()}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
