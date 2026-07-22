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
  }

  render() {
    if (this.state.hasError) {
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
            Algo no salió como esperábamos
          </h2>
          <p style={{ color: "#4b5563", marginBottom: "1.5rem", maxWidth: "480px" }}>
            Se ha producido un inconveniente al cargar esta vista. Puedes intentar recargar la página.
          </p>
          <button
            onClick={() => {
              this.setState({ hasError: false, error: null });
              window.location.reload();
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
