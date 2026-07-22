"use client";

import Link from "next/link";
import { useApp } from "../context/AppContext";

export default function PostList({ posts = [], loading = false, emptyMessage = "No hay publicaciones aún.", onPostDeleted }) {
  const { activePersonId, deletePost, triggerNotification } = useApp();

  const handleDelete = async (postId) => {
    if (!window.confirm("¿Estás seguro de eliminar esta publicación?")) return;
    try {
      await deletePost(postId);
      if (onPostDeleted) onPostDeleted(postId);
    } catch (err) {
      // Handled in context
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "2rem", color: "var(--text-muted)" }}>
        <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: "1.5rem", marginBottom: "8px" }}></i>
        <p style={{ margin: 0, fontSize: "0.88rem" }}>Cargando publicaciones...</p>
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "3rem 1.5rem", background: "var(--bg-card)", borderRadius: "14px", border: "1px dashed var(--border-color)" }}>
        <i className="fa-solid fa-newspaper" style={{ fontSize: "2rem", color: "var(--text-muted)", marginBottom: "10px" }}></i>
        <h4 style={{ fontSize: "1rem", fontWeight: 700, margin: "0 0 4px 0", color: "var(--text-primary)" }}>{emptyMessage}</h4>
        <p style={{ fontSize: "0.82rem", color: "var(--text-muted)", margin: 0 }}>Sé el primero en compartir novedades o vivencias de la feria.</p>
      </div>
    );
  }

  return (
    <div className="posts-grid">
      {posts.map((post) => {
        const author = post.author || post.personAuthor || {};
        const authorName = author.name || "Usuario Aourum";
        const authorAvatar = author.logo || "/dummy.png";
        const authorTypeLabel = post.authorType === "brand" ? "Marca" : post.authorType === "organizer" ? "Productora" : "";
        const isOwner = Number(post.personId) === Number(activePersonId);

        return (
          <div key={post.id} className="post-card">
            
            {/* Header */}
            <div className="post-card-header">
              <div className="post-card-author-info">
                <img
                  src={authorAvatar}
                  alt={authorName}
                  className="post-card-avatar"
                  onError={(e) => { e.target.src = "/dummy.png"; }}
                />
                <div>
                  <div className="post-card-author-name">
                    {post.authorType === "brand" && author.slug ? (
                      <Link href={`/brands/${author.slug}`} style={{ textDecoration: "none", color: "inherit" }}>
                        {authorName}
                      </Link>
                    ) : post.personAuthor?.username ? (
                      <Link href={`/people/${post.personAuthor.username}`} style={{ textDecoration: "none", color: "inherit" }}>
                        {authorName} {author.lastName || ""}
                      </Link>
                    ) : (
                      <span>{authorName}</span>
                    )}

                    {authorTypeLabel && (
                      <span style={{ fontSize: "0.68rem", padding: "0.15rem 0.4rem", borderRadius: "4px", background: "rgba(212,175,55,0.15)", color: "var(--text-gold)", fontWeight: 700, textTransform: "uppercase" }}>
                        {authorTypeLabel}
                      </span>
                    )}
                  </div>
                  <div className="post-card-author-sub">
                    {new Date(post.timestamp).toLocaleDateString("es-PE", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                {post.fair && (
                  <Link href={`/fairs/${post.fair.slug || post.fair.id}`} className="post-card-fair-tag">
                    <i className="fa-solid fa-calendar-days"></i>
                    {post.fair.name}
                  </Link>
                )}

                {isOwner && (
                  <button
                    onClick={() => handleDelete(post.id)}
                    title="Eliminar publicación"
                    style={{ background: "transparent", border: "none", color: "rgba(239,68,68,0.7)", cursor: "pointer", fontSize: "0.9rem", padding: "4px 8px", borderRadius: "6px", transition: "var(--transition-smooth)" }}
                    onMouseEnter={(e) => e.target.style.color = "#ef4444"}
                    onMouseLeave={(e) => e.target.style.color = "rgba(239,68,68,0.7)"}
                  >
                    <i className="fa-solid fa-trash"></i>
                  </button>
                )}
              </div>
            </div>

            {/* Content Text */}
            <div className="post-card-content">
              {post.content}
            </div>

            {/* Content Image */}
            {post.image && (
              <img
                src={post.image}
                alt="Post media"
                className="post-card-image"
                onError={(e) => { e.target.style.display = 'none'; }}
              />
            )}

          </div>
        );
      })}
    </div>
  );
}
