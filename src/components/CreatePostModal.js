"use client";

import { useState, useEffect } from "react";
import { useApp } from "../context/AppContext";

export default function CreatePostModal() {
  const {
    showCreatePostModal,
    setShowCreatePostModal,
    postModalDefaultFairId,
    postModalDefaultBrandId,
    postModalDefaultAuthorType,
    fairs,
    brands,
    organizers,
    activePersonId,
    getCurrentPerson,
    createPost,
    uploadImage,
    triggerNotification
  } = useApp();

  const [authorType, setAuthorType] = useState("person");
  const [selectedBrandId, setSelectedBrandId] = useState("");
  const [selectedOrganizerId, setSelectedOrganizerId] = useState("");
  const [selectedFairId, setSelectedFairId] = useState("");
  const [content, setContent] = useState("");
  const [image, setImage] = useState("");
  const [imagePreview, setImagePreview] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Filter user owned/collaborated brands & organizers
  const currentPerson = getCurrentPerson();
  const userBrands = brands.filter(b => b.personId === Number(activePersonId));
  const userOrganizers = organizers.filter(o => o.personId === Number(activePersonId));

  useEffect(() => {
    if (showCreatePostModal) {
      setAuthorType(postModalDefaultAuthorType || "person");
      setSelectedFairId(postModalDefaultFairId || (fairs.length > 0 ? fairs[0].id.toString() : ""));
      setSelectedBrandId(postModalDefaultBrandId || (userBrands.length > 0 ? userBrands[0].id.toString() : ""));
      setSelectedOrganizerId(userOrganizers.length > 0 ? userOrganizers[0].id.toString() : "");
      setContent("");
      setImage("");
      setImagePreview("");
    }
  }, [showCreatePostModal, postModalDefaultFairId, postModalDefaultBrandId, postModalDefaultAuthorType, fairs, userBrands.length, userOrganizers.length]);

  if (!showCreatePostModal) return null;

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      triggerNotification("La imagen no debe superar los 5MB", "error");
      return;
    }
    const localUrl = URL.createObjectURL(file);
    setImagePreview(localUrl);
    setUploadingImage(true);
    try {
      const cloudUrl = await uploadImage(file);
      setImage(cloudUrl);
    } catch (err) {
      triggerNotification("Error al subir la imagen", "error");
      setImagePreview("");
      setImage("");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim()) {
      triggerNotification("Por favor ingresa un mensaje para la publicación.", "error");
      return;
    }
    if (authorType === "person" && !selectedFairId) {
      triggerNotification("Para publicar en tu perfil, debes seleccionar una feria activa relacionada.", "error");
      return;
    }
    if (authorType === "brand" && !selectedBrandId) {
      triggerNotification("Selecciona la marca con la que deseas publicar.", "error");
      return;
    }

    setSubmitting(true);
    try {
      await createPost({
        content: content.trim(),
        image: image || null,
        fairId: selectedFairId ? Number(selectedFairId) : null,
        brandId: authorType === "brand" ? Number(selectedBrandId) : null,
        organizerId: authorType === "organizer" ? Number(selectedOrganizerId) : null,
        authorType
      });
      setShowCreatePostModal(false);
    } catch (err) {
      // Error handles in context
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" style={{ zIndex: 1200 }}>
      <div className="modal-backdrop" onClick={() => setShowCreatePostModal(false)}></div>
      <div className="modal-panel fade-in" style={{ maxWidth: "540px", borderRadius: "16px" }}>
        
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.2rem" }}>
          <h3 style={{ fontSize: "1.2rem", fontWeight: 800, margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
            <i className="fa-solid fa-pen-to-square" style={{ color: "var(--text-gold)" }}></i>
            Crear Publicación
          </h3>
          <button 
            type="button"
            onClick={() => setShowCreatePostModal(false)} 
            style={{ background: "rgba(0,0,0,0.05)", border: "none", fontSize: "1.2rem", cursor: "pointer", width: "32px", height: "32px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}
          >
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          
          {/* Identity Selection */}
          <div className="form-group" style={{ marginBottom: "1.2rem" }}>
            <label style={{ fontSize: "0.82rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-muted)", display: "block", marginBottom: "6px" }}>
              Publicar Como:
            </label>
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              <button
                type="button"
                className={`btn-sm ${authorType === "person" ? "btn-gold" : "btn-outline"}`}
                onClick={() => setAuthorType("person")}
                style={{ borderRadius: "8px", padding: "0.45rem 0.8rem", fontSize: "0.82rem", fontWeight: 700 }}
              >
                <i className="fa-solid fa-user" style={{ marginRight: "6px" }}></i>
                {currentPerson ? `${currentPerson.name}` : "Mi Perfil"}
              </button>

              {userBrands.length > 0 && (
                <button
                  type="button"
                  className={`btn-sm ${authorType === "brand" ? "btn-gold" : "btn-outline"}`}
                  onClick={() => setAuthorType("brand")}
                  style={{ borderRadius: "8px", padding: "0.45rem 0.8rem", fontSize: "0.82rem", fontWeight: 700 }}
                >
                  <i className="fa-solid fa-store" style={{ marginRight: "6px" }}></i>
                  Marca
                </button>
              )}

              {userOrganizers.length > 0 && (
                <button
                  type="button"
                  className={`btn-sm ${authorType === "organizer" ? "btn-gold" : "btn-outline"}`}
                  onClick={() => setAuthorType("organizer")}
                  style={{ borderRadius: "8px", padding: "0.45rem 0.8rem", fontSize: "0.82rem", fontWeight: 700 }}
                >
                  <i className="fa-solid fa-calendar-star" style={{ marginRight: "6px" }}></i>
                  Productora
                </button>
              )}
            </div>
          </div>

          {/* Sub-selector for Brand */}
          {authorType === "brand" && userBrands.length > 0 && (
            <div className="form-group" style={{ marginBottom: "1rem" }}>
              <label style={{ fontSize: "0.82rem", fontWeight: 700 }}>Selecciona la Marca *</label>
              <select 
                className="form-control"
                value={selectedBrandId}
                onChange={(e) => setSelectedBrandId(e.target.value)}
                style={{ width: "100%", borderRadius: "8px", padding: "0.5rem" }}
              >
                {userBrands.map(b => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>
          )}

          {/* Fair Selector (Mandatory for Person posts!) */}
          <div className="form-group" style={{ marginBottom: "1.2rem", background: authorType === "person" ? "rgba(212,175,55,0.06)" : "transparent", padding: authorType === "person" ? "0.8rem" : "0", borderRadius: "10px", border: authorType === "person" ? "1px solid rgba(212,175,55,0.25)" : "none" }}>
            <label style={{ fontSize: "0.82rem", fontWeight: 700, color: authorType === "person" ? "var(--text-gold)" : "var(--text-primary)", display: "flex", alignItems: "center", gap: "6px", marginBottom: "6px" }}>
              <i className="fa-solid fa-calendar-days"></i>
              Feria Relacionada {authorType === "person" ? "*" : "(Opcional)"}
            </label>
            <select
              className="form-control"
              value={selectedFairId}
              onChange={(e) => setSelectedFairId(e.target.value)}
              style={{ width: "100%", borderRadius: "8px", padding: "0.55rem", fontSize: "0.88rem" }}
              required={authorType === "person"}
            >
              <option value="">-- {authorType === "person" ? "Selecciona una feria activa *" : "Ninguna (Post General)"} --</option>
              {fairs.map(f => (
                <option key={f.id} value={f.id}>📍 {f.name} ({f.location})</option>
              ))}
            </select>
            {authorType === "person" && (
              <span style={{ fontSize: "0.74rem", color: "var(--text-muted)", display: "block", marginTop: "4px" }}>
                <i className="fa-solid fa-circle-info" style={{ marginRight: 4 }}></i>
                Los posts de personas deben estar asociados a una feria activa.
              </span>
            )}
          </div>

          {/* Post Content */}
          <div className="form-group" style={{ marginBottom: "1.2rem" }}>
            <label style={{ fontSize: "0.82rem", fontWeight: 700 }}>Mensaje o Novedad *</label>
            <textarea
              className="form-control"
              rows={4}
              placeholder={authorType === "brand" ? "¿Qué novedades, ofertas o detras de escena deseas compartir con tu comunidad?" : "¿Qué fue lo que más te gustó de la feria? Comparte tu experiencia o fotos..."}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              style={{ width: "100%", borderRadius: "10px", padding: "0.75rem", fontSize: "0.9rem", resize: "vertical" }}
              required
            />
          </div>

          {/* Image Upload */}
          <div className="form-group" style={{ marginBottom: "1.5rem" }}>
            <label style={{ fontSize: "0.82rem", fontWeight: 700, display: "flex", alignItems: "center", gap: "6px", marginBottom: "6px" }}>
              <i className="fa-solid fa-image" style={{ color: "var(--text-gold)" }}></i>
              Imagen o Fotografía (Opcional)
            </label>
            
            {imagePreview ? (
              <div style={{ position: "relative", width: "100%", maxHeight: "220px", borderRadius: "10px", overflow: "hidden", border: "1px solid var(--border-color)" }}>
                <img src={imagePreview} alt="Preview" style={{ width: "100%", height: "220px", objectFit: "cover" }} />
                <button
                  type="button"
                  onClick={() => { setImage(""); setImagePreview(""); }}
                  style={{ position: "absolute", top: "10px", right: "10px", background: "rgba(0,0,0,0.7)", color: "#fff", border: "none", borderRadius: "50%", width: "30px", height: "30px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                >
                  &times;
                </button>
              </div>
            ) : (
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="form-control"
                disabled={uploadingImage}
                style={{ width: "100%", padding: "0.5rem" }}
              />
            )}
            {uploadingImage && (
              <span style={{ fontSize: "0.78rem", color: "var(--text-gold)", display: "block", marginTop: "4px" }}>
                <i className="fa-solid fa-spinner fa-spin" style={{ marginRight: 6 }}></i> Subiendo imagen...
              </span>
            )}
          </div>

          {/* Submit Actions */}
          <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
            <button
              type="button"
              className="btn-outline"
              onClick={() => setShowCreatePostModal(false)}
              style={{ borderRadius: "8px", padding: "0.6rem 1.2rem", fontSize: "0.88rem", fontWeight: 600 }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn-gold"
              disabled={submitting || uploadingImage}
              style={{ borderRadius: "8px", padding: "0.6rem 1.4rem", fontSize: "0.88rem", fontWeight: 700, display: "inline-flex", alignItems: "center", gap: "8px" }}
            >
              {submitting ? (
                <>
                  <i className="fa-solid fa-spinner fa-spin"></i> Publicando...
                </>
              ) : (
                <>
                  <i className="fa-solid fa-paper-plane"></i> Publicar
                </>
              )}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
