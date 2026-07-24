"use client";

import { useState } from "react";
import Link from "next/link";
import { useApp } from "../context/AppContext";

function SocialPostCard({ post, activePersonId, deletePost, togglePostLike, addPostComment, deletePostComment, triggerNotification, onPostDeleted }) {
  const author = post.author || post.personAuthor || {};
  const authorName = author.name || "Usuario Aourum";
  const authorAvatar = author.logo || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&h=150&fit=crop&q=80";
  const authorTypeLabel = post.authorType === "brand" ? "Marca" : post.authorType === "organizer" ? "Productora" : "";
  const isOwner = Number(post.personId) === Number(activePersonId);

  // Social interactions state
  const initialLikes = Array.isArray(post.likes) ? post.likes.map(Number) : [];
  const [likesList, setLikesList] = useState(initialLikes);
  const isLiked = activePersonId ? likesList.includes(Number(activePersonId)) : false;
  const [likesCount, setLikesCount] = useState(post.likesCount || initialLikes.length);

  const [commentsList, setCommentsList] = useState(Array.isArray(post.comments) ? post.comments : []);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [commentInput, setCommentInput] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);

  const [bookmarked, setBookmarked] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const handleLike = async () => {
    if (!activePersonId) {
      triggerNotification("Inicia sesión para dar Me Gusta", "error");
      return;
    }
    // Optimistic UI update
    const nextIsLiked = !isLiked;
    setLikesList(prev => nextIsLiked ? [...prev, Number(activePersonId)] : prev.filter(id => id !== Number(activePersonId)));
    setLikesCount(prev => nextIsLiked ? prev + 1 : Math.max(0, prev - 1));

    try {
      const res = await togglePostLike(post.id);
      if (res && res.likes) {
        setLikesList(res.likes.map(Number));
        setLikesCount(res.likesCount);
      }
    } catch (err) {
      // Revert on error
      setLikesList(initialLikes);
      setLikesCount(post.likesCount || initialLikes.length);
    }
  };

  const handleAddComment = async (e) => {
    if (e) e.preventDefault();
    if (!activePersonId) {
      triggerNotification("Inicia sesión para comentar", "error");
      return;
    }
    if (!commentInput.trim()) return;

    setSubmittingComment(true);
    try {
      const res = await addPostComment(post.id, commentInput.trim());
      if (res && res.comment) {
        setCommentsList(prev => [...prev, res.comment]);
        setCommentInput("");
        triggerNotification("Comentario publicado", "success");
      }
    } catch (err) {
      // Handled in context
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm("¿Seguro que deseas eliminar este comentario?")) return;
    try {
      await deletePostComment(post.id, commentId);
      setCommentsList(prev => prev.filter(c => c.id !== commentId));
      triggerNotification("Comentario eliminado", "success");
    } catch (err) {
      // Handled in context
    }
  };

  const handleDeletePost = async () => {
    if (!window.confirm("¿Estás seguro de eliminar esta publicación?")) return;
    try {
      await deletePost(post.id);
      if (onPostDeleted) onPostDeleted(post.id);
    } catch (err) {
      // Handled in context
    }
  };

  const handleShare = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(`${window.location.origin}/#post-${post.id}`);
      triggerNotification("🔗 Enlace copiado al portapapeles", "success");
    }
  };

  const formatTime = (iso) => {
    if (!iso) return "";
    const d = new Date(iso);
    const now = new Date();
    const diffSec = Math.floor((now - d) / 1000);
    if (diffSec < 60) return "hace un momento";
    if (diffSec < 3600) return `hace ${Math.floor(diffSec / 60)} min`;
    if (diffSec < 86400) return `hace ${Math.floor(diffSec / 3600)} h`;
    if (diffSec < 604800) return `hace ${Math.floor(diffSec / 86400)} d`;
    return d.toLocaleDateString("es-PE", { day: "numeric", month: "short", year: "numeric" });
  };

  return (
    <div
      id={`post-${post.id}`}
      className="social-post-card fade-in"
      style={{
        background: "var(--bg-card)",
        border: "1px solid var(--border-color)",
        borderRadius: "16px",
        padding: "1.25rem",
        marginBottom: "1.2rem",
        boxShadow: "0 2px 12px rgba(0,0,0,0.02)",
        transition: "var(--transition-smooth)"
      }}
    >
      {/* ── Post Header: Author info & options ── */}
      <div className="social-post-card-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.8rem" }}>
        <div style={{ display: "flex", gap: "0.8rem", alignItems: "center" }}>
          {post.authorType === "brand" && author.slug ? (
            <Link href={`/brands/${author.slug}`}>
              <img src={authorAvatar} alt={authorName} style={{ width: "42px", height: "42px", borderRadius: "50%", objectFit: "cover", border: "1px solid var(--border-color)" }} />
            </Link>
          ) : post.personAuthor?.username ? (
            <Link href={`/people/${post.personAuthor.username}`}>
              <img src={authorAvatar} alt={authorName} style={{ width: "42px", height: "42px", borderRadius: "50%", objectFit: "cover", border: "1px solid var(--border-color)" }} />
            </Link>
          ) : (
            <img src={authorAvatar} alt={authorName} style={{ width: "42px", height: "42px", borderRadius: "50%", objectFit: "cover", border: "1px solid var(--border-color)" }} />
          )}

          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
              {post.authorType === "brand" && author.slug ? (
                <Link href={`/brands/${author.slug}`} style={{ fontWeight: 700, fontSize: "0.92rem", color: "var(--text-primary)", textDecoration: "none" }}>
                  {authorName}
                </Link>
              ) : post.personAuthor?.username ? (
                <Link href={`/people/${post.personAuthor.username}`} style={{ fontWeight: 700, fontSize: "0.92rem", color: "var(--text-primary)", textDecoration: "none" }}>
                  {authorName} {author.lastName || ""}
                </Link>
              ) : (
                <strong style={{ fontSize: "0.92rem", color: "var(--text-primary)" }}>{authorName}</strong>
              )}

              {authorTypeLabel && (
                <span style={{ fontSize: "0.68rem", padding: "2px 6px", borderRadius: "4px", background: "rgba(212,175,55,0.15)", color: "var(--text-gold)", fontWeight: 700, textTransform: "uppercase" }}>
                  {authorTypeLabel}
                </span>
              )}
            </div>

            <div style={{ fontSize: "0.76rem", color: "var(--text-muted)", marginTop: "2px" }}>
              {formatTime(post.timestamp)}
            </div>
          </div>
        </div>

        {/* Top-right Actions: Fair Badge & Delete */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          {post.fair && (
            <Link
              href={`/fairs/${post.fair.slug || post.fair.id}`}
              style={{
                fontSize: "0.75rem",
                background: "var(--bg-input)",
                border: "1px solid var(--border-color)",
                padding: "3px 10px",
                borderRadius: "16px",
                color: "var(--text-primary)",
                textDecoration: "none",
                fontWeight: 600,
                display: "inline-flex",
                alignItems: "center",
                gap: "5px"
              }}
            >
              📍 {post.fair.name}
            </Link>
          )}

          {isOwner && (
            <button
              onClick={handleDeletePost}
              title="Eliminar publicación"
              style={{
                background: "transparent", border: "none", color: "var(--text-muted)",
                cursor: "pointer", fontSize: "0.9rem", padding: "4px 8px", borderRadius: "6px",
                transition: "all 0.2s"
              }}
              onMouseOver={(e) => e.currentTarget.style.color = "#ef4444"}
              onMouseOut={(e) => e.currentTarget.style.color = "var(--text-muted)"}
            >
              <i className="fa-regular fa-trash-can"></i>
            </button>
          )}
        </div>
      </div>

      {/* ── Post Content Text ── */}
      <div style={{ fontSize: "0.92rem", color: "var(--text-primary)", lineHeight: 1.55, margin: "0.6rem 0 0.8rem 0", whiteSpace: "pre-wrap" }}>
        {post.content}
      </div>

      {/* ── Post Image Media ── */}
      {post.image && (
        <div
          onClick={() => setLightboxOpen(true)}
          style={{
            borderRadius: "12px",
            overflow: "hidden",
            border: "1px solid var(--border-color)",
            marginBottom: "0.8rem",
            cursor: "pointer",
            position: "relative"
          }}
        >
          <img
            src={post.image}
            alt="Publicación"
            style={{ width: "100%", maxHeight: "420px", objectFit: "cover", display: "block", transition: "transform 0.3s ease" }}
            onError={(e) => { e.currentTarget.style.display = 'none'; }}
          />
        </div>
      )}

      {/* ── Image Lightbox Modal ── */}
      {lightboxOpen && post.image && (
        <div
          style={{
            position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
            background: "rgba(0,0,0,0.85)", zIndex: 2000,
            display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem"
          }}
          onClick={() => setLightboxOpen(false)}
        >
          <img src={post.image} alt="Publicación ampliación" style={{ maxWidth: "90vw", maxHeight: "90vh", borderRadius: "12px", objectFit: "contain" }} />
          <button
            onClick={() => setLightboxOpen(false)}
            style={{ position: "absolute", top: "20px", right: "25px", background: "rgba(255,255,255,0.2)", color: "#fff", border: "none", borderRadius: "50%", width: "36px", height: "36px", fontSize: "1.2rem", cursor: "pointer" }}
          >
            &times;
          </button>
        </div>
      )}

      {/* ── Social Action Bar (Like, Comment, Share, Bookmark) ── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderTop: "1px solid var(--border-color)", paddingTop: "0.6rem", marginTop: "0.4rem" }}>
        <div style={{ display: "flex", gap: "1.2rem", alignItems: "center" }}>
          {/* Like Button */}
          <button
            type="button"
            onClick={handleLike}
            style={{
              background: "transparent",
              border: "none",
              color: isLiked ? "#EF4444" : "var(--text-muted)",
              cursor: "pointer",
              fontSize: "0.85rem",
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "4px 8px",
              borderRadius: "6px",
              transition: "all 0.2s ease"
            }}
          >
            <i className={isLiked ? "fa-solid fa-heart" : "fa-regular fa-heart"} style={{ fontSize: "1.05rem" }}></i>
            <span>{likesCount}</span>
          </button>

          {/* Comment Button */}
          <button
            type="button"
            onClick={() => setCommentsOpen(!commentsOpen)}
            style={{
              background: "transparent",
              border: "none",
              color: commentsOpen ? "var(--text-gold)" : "var(--text-muted)",
              cursor: "pointer",
              fontSize: "0.85rem",
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "4px 8px",
              borderRadius: "6px",
              transition: "all 0.2s ease"
            }}
          >
            <i className="fa-regular fa-comment" style={{ fontSize: "1.05rem" }}></i>
            <span>{commentsList.length}</span>
          </button>

          {/* Share Button */}
          <button
            type="button"
            onClick={handleShare}
            style={{
              background: "transparent",
              border: "none",
              color: "var(--text-muted)",
              cursor: "pointer",
              fontSize: "0.85rem",
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "4px 8px",
              borderRadius: "6px"
            }}
            title="Compartir enlace"
          >
            <i className="fa-regular fa-share-from-square" style={{ fontSize: "1.0rem" }}></i>
          </button>
        </div>

        {/* Bookmark Button */}
        <button
          type="button"
          onClick={() => { setBookmarked(!bookmarked); triggerNotification(bookmarked ? "Guardado removido" : "📌 Publicación guardada", "success"); }}
          style={{
            background: "transparent",
            border: "none",
            color: bookmarked ? "var(--gold-primary)" : "var(--text-muted)",
            cursor: "pointer",
            fontSize: "0.95rem"
          }}
          title={bookmarked ? "Guardado" : "Guardar publicación"}
        >
          <i className={bookmarked ? "fa-solid fa-bookmark" : "fa-regular fa-bookmark"}></i>
        </button>
      </div>

      {/* ── Desplegable de Comentarios ── */}
      {commentsOpen && (
        <div className="fade-in" style={{ marginTop: "1rem", paddingTop: "0.8rem", borderTop: "1px dashed var(--border-color)" }}>
          {/* Comments List */}
          {commentsList.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "1rem" }}>
              {commentsList.map((c) => {
                const canDeleteComm = Number(c.personId) === Number(activePersonId) || isOwner;
                return (
                  <div key={c.id} style={{ display: "flex", gap: "10px", background: "var(--bg-input)", padding: "8px 12px", borderRadius: "10px" }}>
                    <img
                      src={c.authorLogo || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop&q=80"}
                      alt={c.authorName}
                      style={{ width: "30px", height: "30px", borderRadius: "50%", objectFit: "cover", flexShrink: 0 }}
                    />
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <strong style={{ fontSize: "0.8rem", color: "var(--text-primary)" }}>{c.authorName}</strong>
                        {canDeleteComm && (
                          <button
                            onClick={() => handleDeleteComment(c.id)}
                            style={{ background: "transparent", border: "none", color: "#ef4444", fontSize: "0.72rem", cursor: "pointer" }}
                          >
                            Eliminar
                          </button>
                        )}
                      </div>
                      <p style={{ fontSize: "0.84rem", color: "var(--text-primary)", margin: "2px 0 0 0", lineHeight: 1.4 }}>
                        {c.content}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Add Comment Input Form */}
          {activePersonId ? (
            <form onSubmit={handleAddComment} style={{ display: "flex", gap: "8px", alignItems: "center" }}>
              <input
                type="text"
                className="form-control"
                placeholder="Escribe un comentario..."
                value={commentInput}
                onChange={(e) => setCommentInput(e.target.value)}
                style={{ flex: 1, borderRadius: "20px", fontSize: "0.84rem", padding: "0.45rem 1rem" }}
              />
              <button
                type="submit"
                disabled={submittingComment || !commentInput.trim()}
                className="btn-gold"
                style={{ borderRadius: "20px", padding: "0.45rem 1rem", fontSize: "0.78rem", fontWeight: 700, opacity: commentInput.trim() ? 1 : 0.6 }}
              >
                {submittingComment ? <i className="fa-solid fa-spinner fa-spin"></i> : "Comentar"}
              </button>
            </form>
          ) : (
            <p style={{ fontSize: "0.78rem", color: "var(--text-muted)", fontStyle: "italic", margin: 0 }}>
              Inicia sesión para escribir un comentario.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export default function PostList({ posts = [], loading = false, emptyMessage = "No hay publicaciones aún.", onPostDeleted }) {
  const { activePersonId, deletePost, togglePostLike, addPostComment, deletePostComment, triggerNotification } = useApp();

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "2.5rem 0", color: "var(--text-muted)" }}>
        <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: "1.6rem", marginBottom: "8px", color: "var(--gold-primary)" }}></i>
        <p style={{ margin: 0, fontSize: "0.88rem" }}>Cargando publicaciones de la comunidad...</p>
      </div>
    );
  }

  if (!posts || posts.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "3rem 1.5rem", background: "var(--bg-card)", borderRadius: "16px", border: "1px dashed var(--border-color)" }}>
        <i className="fa-solid fa-comments" style={{ fontSize: "2.2rem", color: "var(--gold-primary)", marginBottom: "10px" }}></i>
        <h4 style={{ fontSize: "1rem", fontWeight: 700, margin: "0 0 4px 0", color: "var(--text-primary)" }}>{emptyMessage}</h4>
        <p style={{ fontSize: "0.82rem", color: "var(--text-muted)", margin: 0 }}>Sé el primero en compartir novedades o experiencias en la comunidad.</p>
      </div>
    );
  }

  return (
    <div className="posts-container" style={{ display: "flex", flexDirection: "column" }}>
      {posts.map((post) => (
        <SocialPostCard
          key={post.id}
          post={post}
          activePersonId={activePersonId}
          deletePost={deletePost}
          togglePostLike={togglePostLike}
          addPostComment={addPostComment}
          deletePostComment={deletePostComment}
          triggerNotification={triggerNotification}
          onPostDeleted={onPostDeleted}
        />
      ))}
    </div>
  );
}
