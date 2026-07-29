"use client";

import { useState, useRef, useMemo } from "react";
import { useApp } from "../context/AppContext";

export default function SocialFeedPublisher({ onPostCreated, defaultFairId = null, defaultBrandId = null, defaultAuthorType = "person" }) {
  const {
    activePersonId,
    getCurrentPerson,
    brands = [],
    organizers = [],
    fairs = [],
    createPost,
    uploadImage,
    removeBgAi,
    triggerNotification
  } = useApp();

  const currentPerson = getCurrentPerson();

  // Compute available brands for the active user (plus defaultBrandId if passed)
  const availableBrands = useMemo(() => {
    const pId = Number(activePersonId);
    let list = (brands || []).filter(b => {
      if (!b) return false;
      const isOwner = Number(b.personId) === pId;
      const isCollab = Array.isArray(b.personIds) && b.personIds.map(Number).includes(pId);
      const isCollabAlt = Array.isArray(b.collaborators) && b.collaborators.some(c => Number(c.personId) === pId);
      return isOwner || isCollab || isCollabAlt;
    });

    if (defaultBrandId) {
      const defB = (brands || []).find(b => Number(b.id) === Number(defaultBrandId));
      if (defB && !list.some(b => Number(b.id) === Number(defB.id))) {
        list.push(defB);
      }
    }
    return list;
  }, [brands, activePersonId, defaultBrandId]);

  // Compute available organizers for the active user
  const availableOrganizers = useMemo(() => {
    const pId = Number(activePersonId);
    return (organizers || []).filter(o => {
      if (!o) return false;
      const isOwner = Number(o.personId) === pId;
      const isCollab = Array.isArray(o.personIds) && o.personIds.map(Number).includes(pId);
      const isCollabAlt = Array.isArray(o.collaborators) && o.collaborators.some(c => Number(c.personId) === pId);
      return isOwner || isCollab || isCollabAlt;
    });
  }, [organizers, activePersonId]);

  const [expanded, setExpanded] = useState(false);
  const [authorType, setAuthorType] = useState(defaultAuthorType);

  const initialBrandId = defaultBrandId ? defaultBrandId.toString() : (availableBrands[0]?.id?.toString() || "");
  const initialOrgId = availableOrganizers[0]?.id?.toString() || "";

  const [selectedBrandId, setSelectedBrandId] = useState(initialBrandId);
  const [selectedOrganizerId, setSelectedOrganizerId] = useState(initialOrgId);
  const [selectedFairId, setSelectedFairId] = useState(defaultFairId ? defaultFairId.toString() : "");

  const [content, setContent] = useState("");
  const [image, setImage] = useState("");
  const [imagePreview, setImagePreview] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const cameraInputRef = useRef(null);
  const galleryInputRef = useRef(null);

  if (!activePersonId) {
    return (
      <div style={{
        background: "var(--bg-card)",
        border: "1px solid var(--border-color)",
        borderRadius: "16px",
        padding: "1.25rem 1.5rem",
        textAlign: "center",
        marginBottom: "1.5rem"
      }}>
        <i className="fa-solid fa-user-lock" style={{ fontSize: "1.5rem", color: "var(--gold-primary)", marginBottom: "8px" }}></i>
        <h4 style={{ margin: "0 0 4px 0", fontSize: "0.95rem", fontWeight: 700 }}>Únete a la comunidad de AOURUM</h4>
        <p style={{ margin: 0, fontSize: "0.82rem", color: "var(--text-muted)" }}>Inicia sesión para compartir tus novedades, creaciones y vivencias en las ferias.</p>
      </div>
    );
  }

  const DEFAULT_USER_AVATAR = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 128 128'%3E%3Crect width='128' height='128' fill='%23E5E7EB'/%3E%3Cpath d='M64 24a24 24 0 100 48 24 24 0 000-48zM32 104a32 32 0 0164 0H32z' fill='%239CA3AF'/%3E%3C/svg%3E";

  // Get active identity avatar & name
  let activeAvatar = currentPerson?.logo || DEFAULT_USER_AVATAR;
  let activeName = currentPerson ? `${currentPerson.name}` : "Mi Perfil";

  if (authorType === "brand") {
    const targetId = selectedBrandId || defaultBrandId;
    const b = (brands || []).find(item => Number(item.id) === Number(targetId));
    if (b) {
      activeAvatar = b.logo || activeAvatar;
      activeName = b.name || activeName;
    }
  } else if (authorType === "organizer") {
    const o = (organizers || []).find(item => Number(item.id) === Number(selectedOrganizerId));
    if (o) {
      activeAvatar = o.logo || activeAvatar;
      activeName = o.name || activeName;
    }
  }

  const handleImageChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 15 * 1024 * 1024) {
      triggerNotification("La imagen no debe superar los 15MB", "error");
      return;
    }
    const localUrl = URL.createObjectURL(file);
    setImagePreview(localUrl);
    setUploadingImage(true);
    try {
      const url = await uploadImage(file);
      if (url) {
        setImage(url);
        setImagePreview(url);
      }
    } catch (err) {
      triggerNotification("Error al subir imagen", "error");
      setImagePreview("");
      setImage("");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleRemoveBg = async () => {
    if (!image) return;
    setUploadingImage(true);
    try {
      const response = await fetch(image);
      const blob = await response.blob();
      const base64 = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.readAsDataURL(blob);
      });
      const transparentBase64 = await removeBgAi(base64);
      if (transparentBase64) {
        const res = await fetch(transparentBase64);
        const transBlob = await res.blob();
        const transFile = new File([transBlob], "transparent.png", { type: "image/png" });
        const newUrl = await uploadImage(transFile);
        if (newUrl) {
          setImage(newUrl);
          setImagePreview(newUrl);
          triggerNotification("Fondo removido con IA con éxito", "success");
        }
      }
    } catch (err) {
      console.error(err);
      triggerNotification("No se pudo quitar el fondo", "error");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!content.trim()) {
      triggerNotification("Escribe un mensaje para publicar", "error");
      return;
    }
    setSubmitting(true);
    try {
      const effectiveBrandId = authorType === "brand" ? (selectedBrandId || defaultBrandId) : null;
      const created = await createPost({
        content: content.trim(),
        image: image || null,
        fairId: selectedFairId ? Number(selectedFairId) : null,
        brandId: effectiveBrandId ? Number(effectiveBrandId) : null,
        organizerId: authorType === "organizer" ? Number(selectedOrganizerId) : null,
        authorType
      });
      setContent("");
      setImage("");
      setImagePreview("");
      setExpanded(false);
      if (onPostCreated) onPostCreated(created);
    } catch (err) {
      // Handled in context
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="social-publisher-card fade-in"
      style={{
        background: "var(--bg-card)",
        border: "1px solid var(--border-color)",
        borderRadius: "18px",
        padding: "1.25rem 1.5rem",
        marginBottom: "1.8rem",
        boxShadow: "0 4px 20px rgba(0,0,0,0.03)",
        transition: "var(--transition-smooth)"
      }}
    >
      {/* Top Header: Avatar + Identity + Input Trigger */}
      <div style={{ display: "flex", gap: "1rem", alignItems: "flex-start" }}>
        <img
          src={activeAvatar}
          alt={activeName}
          style={{
            width: "44px",
            height: "44px",
            borderRadius: "50%",
            objectFit: "cover",
            border: "2px solid var(--border-color)",
            flexShrink: 0
          }}
        />
        
        <div style={{ flex: 1 }}>
          {/* Main Input Textarea */}
          <textarea
            rows={expanded ? 3 : 2}
            placeholder={
              authorType === "brand"
                ? `¿Qué novedad o historia comparte hoy ${activeName}?`
                : authorType === "organizer"
                ? `Publica un comunicado o noticia sobre la productora ${activeName}...`
                : `¿Qué estás creando o viviendo hoy en la feria, ${currentPerson?.name || 'amigo'}?`
            }
            value={content}
            onFocus={() => setExpanded(true)}
            onChange={(e) => setContent(e.target.value)}
            style={{
              width: "100%",
              border: "1px solid var(--border-color)",
              borderRadius: "12px",
              padding: "0.75rem 1rem",
              fontSize: "0.92rem",
              fontFamily: "var(--font-body)",
              background: "var(--bg-input)",
              color: "var(--text-primary)",
              resize: "none",
              outline: "none",
              transition: "all 0.2s ease"
            }}
          />

          {/* Expanded Controls: Image Preview, Identity Selector, Fair Tagging */}
          {expanded && (
            <div className="fade-in" style={{ marginTop: "10px", display: "flex", flexDirection: "column", gap: "12px" }}>
              
              {/* Media Preview Box */}
              {imagePreview && (
                <div style={{ position: "relative", width: "100%", maxHeight: "280px", borderRadius: "12px", overflow: "hidden", border: "1px solid var(--border-color)" }}>
                  <img src={imagePreview} alt="Preview" style={{ width: "100%", height: "240px", objectFit: "cover" }} />
                  <button
                    type="button"
                    onClick={() => { setImage(""); setImagePreview(""); }}
                    style={{
                      position: "absolute", top: "10px", right: "10px",
                      background: "rgba(0,0,0,0.75)", color: "#fff", border: "none",
                      borderRadius: "50%", width: "30px", height: "30px",
                      cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center"
                    }}
                  >
                    &times;
                  </button>
                  <button
                    type="button"
                    onClick={handleRemoveBg}
                    disabled={uploadingImage}
                    style={{
                      position: "absolute", bottom: "10px", right: "10px",
                      background: "var(--gold-primary)", color: "#1c1c1e",
                      border: "none", borderRadius: "20px", padding: "0.4rem 1rem",
                      fontSize: "0.78rem", fontWeight: 700, display: "flex", alignItems: "center", gap: "6px",
                      cursor: uploadingImage ? "not-allowed" : "pointer", boxShadow: "0 4px 12px rgba(0,0,0,0.15)"
                    }}
                  >
                    {uploadingImage ? <i className="fa-solid fa-spinner fa-spin"></i> : <i className="fa-solid fa-wand-magic-sparkles"></i>}
                    Quitar fondo con IA
                  </button>
                </div>
              )}

              {/* Identity & Event Controls Bar */}
              <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "center", background: "rgba(0,0,0,0.02)", padding: "8px 12px", borderRadius: "10px", border: "1px dashed var(--border-color)" }}>
                {/* Author Type Selection (Only shown when not pre-specified by profile context) */}
                {!defaultBrandId && defaultAuthorType !== "brand" && defaultAuthorType !== "person" && (
                  <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                    <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-muted)" }}>Publicar como:</span>
                    <button
                      type="button"
                      onClick={() => setAuthorType("person")}
                      style={{
                        padding: "3px 10px", borderRadius: "16px", fontSize: "0.76rem", fontWeight: 700,
                        background: authorType === "person" ? "var(--gold-primary)" : "transparent",
                        color: authorType === "person" ? "#1c1c1e" : "var(--text-primary)",
                        border: authorType === "person" ? "none" : "1px solid var(--border-color)",
                        cursor: "pointer"
                      }}
                    >
                      👤 Persona
                    </button>

                    {availableBrands.length > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          setAuthorType("brand");
                          if (!selectedBrandId && availableBrands.length > 0) {
                            setSelectedBrandId(availableBrands[0].id.toString());
                          }
                        }}
                        style={{
                          padding: "3px 10px", borderRadius: "16px", fontSize: "0.76rem", fontWeight: 700,
                          background: authorType === "brand" ? "var(--gold-primary)" : "transparent",
                          color: authorType === "brand" ? "#1c1c1e" : "var(--text-primary)",
                          border: authorType === "brand" ? "none" : "1px solid var(--border-color)",
                          cursor: "pointer"
                        }}
                      >
                        🏪 Marca
                      </button>
                    )}

                    {availableOrganizers.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setAuthorType("organizer")}
                        style={{
                          padding: "3px 10px", borderRadius: "16px", fontSize: "0.76rem", fontWeight: 700,
                          background: authorType === "organizer" ? "var(--gold-primary)" : "transparent",
                          color: authorType === "organizer" ? "#1c1c1e" : "var(--text-primary)",
                          border: authorType === "organizer" ? "none" : "1px solid var(--border-color)",
                          cursor: "pointer"
                        }}
                      >
                        🎪 Productora
                      </button>
                    )}
                  </div>
                )}

                {/* Sub-selector for specific brand */}
                {authorType === "brand" && availableBrands.length > 1 && (
                  <select
                    value={selectedBrandId || defaultBrandId}
                    onChange={(e) => setSelectedBrandId(e.target.value)}
                    style={{ fontSize: "0.76rem", padding: "3px 8px", borderRadius: "6px", border: "1px solid var(--border-color)", background: "var(--bg-card)" }}
                  >
                    {availableBrands.map(b => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                )}

                {/* Sub-selector for specific organizer */}
                {authorType === "organizer" && availableOrganizers.length > 1 && (
                  <select
                    value={selectedOrganizerId}
                    onChange={(e) => setSelectedOrganizerId(e.target.value)}
                    style={{ fontSize: "0.76rem", padding: "3px 8px", borderRadius: "6px", border: "1px solid var(--border-color)", background: "var(--bg-card)" }}
                  >
                    {availableOrganizers.map(o => (
                      <option key={o.id} value={o.id}>{o.name}</option>
                    ))}
                  </select>
                )}

                {/* Optional Fair Link Dropdown */}
                <div className="publisher-fair-select-wrapper" style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "6px" }}>
                  <i className="fa-solid fa-location-dot" style={{ fontSize: "0.8rem", color: "var(--gold-primary)" }}></i>
                  <select
                    value={selectedFairId}
                    onChange={(e) => setSelectedFairId(e.target.value)}
                    style={{ fontSize: "0.76rem", padding: "3px 8px", borderRadius: "6px", border: "1px solid var(--border-color)", background: "var(--bg-card)" }}
                  >
                    <option value="">-- Vincular Feria (Opcional) --</option>
                    {(fairs || []).map(f => (
                      <option key={f.id} value={f.id}>📍 {f.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Actions Bar */}
      <div style={{
        display: "flex",
        justify: "space-between",
        alignItems: "center",
        marginTop: "0.9rem",
        paddingTop: "0.8rem",
        borderTop: "1px solid var(--border-color)"
      }}>
        <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
          {/* Direct Camera Button (Opens mobile camera directly) */}
          <button
            type="button"
            onClick={() => cameraInputRef.current?.click()}
            style={{
              background: "rgba(239, 68, 68, 0.08)",
              border: "1px solid rgba(239, 68, 68, 0.2)",
              color: "#EF4444",
              fontSize: "0.82rem",
              fontWeight: 700,
              padding: "6px 12px",
              borderRadius: "20px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              transition: "all 0.2s ease"
            }}
          >
            <i className="fa-solid fa-camera" style={{ fontSize: "0.95rem" }}></i>
            <span>Tomar Foto</span>
          </button>

          {/* Gallery Button (Opens photo gallery) */}
          <button
            type="button"
            onClick={() => galleryInputRef.current?.click()}
            style={{
              background: "rgba(59, 130, 246, 0.08)",
              border: "1px solid rgba(59, 130, 246, 0.2)",
              color: "#3B82F6",
              fontSize: "0.82rem",
              fontWeight: 700,
              padding: "6px 12px",
              borderRadius: "20px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              transition: "all 0.2s ease"
            }}
          >
            <i className="fa-regular fa-images" style={{ fontSize: "0.95rem" }}></i>
            <span>Galería</span>
          </button>

          {/* Camera Direct Input (capture="environment") */}
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleImageChange}
            style={{ display: "none" }}
            disabled={uploadingImage}
          />

          {/* Gallery Input */}
          <input
            ref={galleryInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            style={{ display: "none" }}
            disabled={uploadingImage}
          />
        </div>

        {/* Cancel and Submit Actions */}
        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          {expanded && (
            <button
              type="button"
              onClick={() => { setExpanded(false); setContent(""); setImage(""); setImagePreview(""); }}
              style={{
                background: "transparent",
                border: "none",
                color: "var(--text-muted)",
                fontSize: "0.84rem",
                fontWeight: 600,
                cursor: "pointer"
              }}
            >
              Cancelar
            </button>
          )}

          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting || uploadingImage || !content.trim()}
            className="btn-gold"
            style={{
              borderRadius: "20px",
              padding: "0.45rem 1.4rem",
              fontWeight: 700,
              fontSize: "0.85rem",
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              cursor: (submitting || uploadingImage || !content.trim()) ? "not-allowed" : "pointer",
              opacity: (submitting || uploadingImage || !content.trim()) ? 0.5 : 1
            }}
          >
            {submitting ? <i className="fa-solid fa-spinner fa-spin"></i> : <i className="fa-solid fa-paper-plane"></i>}
            Publicar
          </button>
        </div>
      </div>
    </div>
  );
}
