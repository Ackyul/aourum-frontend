"use client";

import React from "react";

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
    
    // Auto-reload on ChunkLoadError caused by new deployments on Vercel
    const errStr = error ? error.toString() : "";
    const isChunkError = 
      error?.name === "ChunkLoadError" || 
      errStr.includes("ChunkLoadError") || 
      errStr.includes("Failed to load chunk") || 
      errStr.includes("Loading chunk");

    if (isChunkError && typeof window !== "undefined") {
      const reloadKey = "aourum_chunk_reload_attempted";
      if (!sessionStorage.getItem(reloadKey)) {
        sessionStorage.setItem(reloadKey, "true");
        window.location.reload();
      }
    }
  }

  render() {
    if (this.state.hasError) {
      const errStr = this.state.error ? this.state.error.toString() : "";
      const isChunkError = 
        this.state.error?.name === "ChunkLoadError" || 
        errStr.includes("ChunkLoadError") || 
        errStr.includes("Failed to load chunk") || 
        errStr.includes("Loading chunk");

      return (
        <div style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "50vh",
          padding: "2rem",
          textAlign: "center"
        }}>
          <h2 style={{ fontSize: "1.5rem", fontWeight: "600", marginBottom: "1rem", color: "#111827" }}>
            {isChunkError ? "Nueva versión disponible" : "Algo no salió como esperábamos"}
          </h2>
          <p style={{ color: "#4b5563", marginBottom: "1.5rem", maxWidth: "480px" }}>
            {isChunkError 
              ? "Se ha publicado una nueva actualización de la aplicación. Haz clic en recargar para obtener la última versión."
              : "Se ha producido un inconveniente al cargar esta vista. Puedes intentar recargar la página."
            }
          </p>
          {this.state.error && (
            <div style={{
              background: "rgba(239, 68, 68, 0.08)",
              border: "1px solid rgba(239, 68, 68, 0.2)",
              borderRadius: "8px",
              padding: "10px 14px",
              marginBottom: "1.5rem",
              maxWidth: "600px",
              textAlign: "left",
              fontSize: "0.82rem",
              color: "#dc2626",
              fontFamily: "monospace",
              wordBreak: "break-word"
            }}>
              <strong>Detalle técnico del error:</strong>
              <div style={{ marginTop: "4px" }}>{this.state.error.toString()}</div>
            </div>
          )}
          <button
            onClick={() => {
              if (typeof window !== "undefined") {
                sessionStorage.removeItem("aourum_chunk_reload_attempted");
                window.location.reload();
              }
            }}
            style={{
              padding: "0.6rem 1.2rem",
              borderRadius: "0.5rem",
              backgroundColor: "#2563eb",
              color: "#ffffff",
              border: "none",
              cursor: "pointer",
              fontWeight: "500",
              boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
            }}
          >
            Recargar Página
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
