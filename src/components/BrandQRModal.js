"use client";

import { useState, useEffect, useRef } from "react";
import QRCode from "qrcode";

export default function BrandQRModal({ isOpen, onClose, brand }) {
  const [theme, setTheme] = useState("dark"); // "dark" | "light" | "gold"
  const [includeCardFrame, setIncludeCardFrame] = useState(true);
  const [isCopied, setIsCopied] = useState(false);
  const [isStandMode, setIsStandMode] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [toastMsg, setToastMsg] = useState("");

  const canvasRef = useRef(null);
  const standCanvasRef = useRef(null);

  // Canonical permanent URL for the brand
  const getBrandUrl = () => {
    if (typeof window !== "undefined") {
      const origin = window.location.origin;
      return `${origin}/brands/${brand?.slug || brand?.id}`;
    }
    return `https://aourum.com/brands/${brand?.slug || brand?.id}`;
  };

  const brandUrl = getBrandUrl();

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(""), 3000);
  };

  // Function to render QR on canvas with Aourum colors & logo emblem
  const drawQRCanvas = async (canvas, size = 800, isCard = false) => {
    if (!canvas || !brand) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Card aspect ratio: 1:1.45 for balanced editorial poster/card format
    canvas.width = size;
    canvas.height = isCard ? Math.round(size * 1.45) : size;

    const width = canvas.width;
    const height = canvas.height;

    // Define Palette
    let bgColor = "#121214";
    let moduleColor = "#FFFFFF";
    let eyeOuterColor = "#D4AF37";
    let eyeInnerColor = "#E5C158";
    let textColor = "#FFFFFF";
    let mutedTextColor = "#A1A1AA";
    let badgeBg = "#121214";
    let badgeBorder = "#D4AF37";

    if (theme === "light") {
      bgColor = "#FAF9F6";
      moduleColor = "#18181B";
      eyeOuterColor = "#B8901D";
      eyeInnerColor = "#D4AF37";
      textColor = "#1C1C1E";
      mutedTextColor = "#71717A";
      badgeBg = "#FFFFFF";
      badgeBorder = "#D4AF37";
    } else if (theme === "gold") {
      bgColor = "#1A1710";
      moduleColor = "#F3E5AB";
      eyeOuterColor = "#FFD700";
      eyeInnerColor = "#D4AF37";
      textColor = "#F3E5AB";
      mutedTextColor = "#C5A059";
      badgeBg = "#1A1710";
      badgeBorder = "#FFD700";
    }

    // 1. Draw Background
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, width, height);

    // 2. Outer & Inner Decorative Borders (if isCard)
    if (isCard) {
      // Outer Gold Frame
      ctx.strokeStyle = "rgba(212, 175, 55, 0.45)";
      ctx.lineWidth = width * 0.012;
      ctx.strokeRect(width * 0.03, width * 0.03, width * 0.94, height - width * 0.06);

      // Inner Fine Frame
      ctx.strokeStyle = "rgba(212, 175, 55, 0.25)";
      ctx.lineWidth = width * 0.003;
      ctx.strokeRect(width * 0.045, width * 0.045, width * 0.91, height - width * 0.09);
    }

    // 3. QR Matrix Placement
    const qrMargin = isCard ? width * 0.11 : width * 0.06;
    const qrTopOffset = isCard ? width * 0.36 : qrMargin;
    const qrSize = width - qrMargin * 2;

    const qrData = QRCode.create(brandUrl, { errorCorrectionLevel: "H" });
    const modules = qrData.modules;
    const moduleCount = modules.size;
    const cellSize = qrSize / moduleCount;

    const isEyeModule = (r, c) =>
      (r < 7 && c < 7) || (r < 7 && c >= moduleCount - 7) || (r >= moduleCount - 7 && c < 7);

    const centerStart = Math.floor(moduleCount * 0.38);
    const centerEnd = Math.ceil(moduleCount * 0.62);
    const isCenterModule = (r, c) =>
      r >= centerStart && r <= centerEnd && c >= centerStart && c <= centerEnd;

    // Draw QR Modules (Rounded Dots)
    ctx.fillStyle = moduleColor;
    for (let r = 0; r < moduleCount; r++) {
      for (let c = 0; c < moduleCount; c++) {
        if (modules.get(r, c) && !isEyeModule(r, c) && !isCenterModule(r, c)) {
          const x = qrMargin + c * cellSize;
          const y = qrTopOffset + r * cellSize;
          const dotRadius = cellSize * 0.38;
          ctx.beginPath();
          ctx.arc(x + cellSize / 2, y + cellSize / 2, dotRadius, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    // Draw Custom Finder Eyes
    const drawEye = (startR, startC) => {
      const eyeX = qrMargin + startC * cellSize;
      const eyeY = qrTopOffset + startR * cellSize;
      const eyeSize = 7 * cellSize;

      ctx.fillStyle = eyeOuterColor;
      const outerRadius = cellSize * 1.5;
      ctx.beginPath();
      ctx.roundRect(eyeX, eyeY, eyeSize, eyeSize, outerRadius);
      ctx.fill();

      ctx.fillStyle = bgColor;
      const innerGap = cellSize * 1;
      const innerSize = 5 * cellSize;
      ctx.beginPath();
      ctx.roundRect(eyeX + innerGap, eyeY + innerGap, innerSize, innerSize, outerRadius * 0.7);
      ctx.fill();

      ctx.fillStyle = eyeInnerColor;
      const centerGap = cellSize * 2;
      const dotSize = 3 * cellSize;
      ctx.beginPath();
      ctx.roundRect(eyeX + centerGap, eyeY + centerGap, dotSize, dotSize, outerRadius * 0.5);
      ctx.fill();
    };

    drawEye(0, 0);
    drawEye(0, moduleCount - 7);
    drawEye(moduleCount - 7, 0);

    // Center Emblem Badge
    const centerSize = (centerEnd - centerStart + 1.2) * cellSize;
    const centerX = qrMargin + (moduleCount / 2) * cellSize;
    const centerY = qrTopOffset + (moduleCount / 2) * cellSize;

    ctx.save();
    ctx.fillStyle = badgeBg;
    ctx.strokeStyle = badgeBorder;
    ctx.lineWidth = cellSize * 0.8;
    ctx.beginPath();
    ctx.arc(centerX, centerY, centerSize / 2 + cellSize * 0.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    try {
      const logoImg = new Image();
      logoImg.crossOrigin = "anonymous";
      logoImg.src = "/aourum-gold-badge.png";
      await new Promise((resolve) => {
        logoImg.onload = resolve;
        logoImg.onerror = () => {
          logoImg.src = "/icon.png";
          logoImg.onload = resolve;
          logoImg.onerror = resolve;
        };
      });

      if (logoImg.complete && logoImg.naturalWidth !== 0) {
        const imgSize = centerSize * 0.85;
        ctx.drawImage(logoImg, centerX - imgSize / 2, centerY - imgSize / 2, imgSize, imgSize);
      } else {
        ctx.fillStyle = eyeOuterColor;
        ctx.font = `bold ${Math.round(centerSize * 0.22)}px 'Tenor Sans', sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("AOURUM", centerX, centerY);
      }
    } catch (e) {
      console.warn(e);
    }
    ctx.restore();

    // Card Header & Footer Text Layout
    if (isCard) {
      ctx.save();
      const headerY = width * 0.065;

      // Brand Logo
      if (brand.logo) {
        try {
          const bLogo = new Image();
          bLogo.crossOrigin = "anonymous";
          bLogo.src = brand.logo;
          await new Promise((res) => {
            bLogo.onload = res;
            bLogo.onerror = res;
          });

          if (bLogo.complete && bLogo.naturalWidth !== 0) {
            const logoR = width * 0.06;
            const logoY = headerY;

            ctx.beginPath();
            ctx.arc(width / 2, logoY + logoR, logoR, 0, Math.PI * 2);
            ctx.clip();
            ctx.drawImage(bLogo, width / 2 - logoR, logoY, logoR * 2, logoR * 2);
            ctx.restore();
            ctx.save();

            ctx.strokeStyle = eyeOuterColor;
            ctx.lineWidth = width * 0.004;
            ctx.beginPath();
            ctx.arc(width / 2, logoY + logoR, logoR, 0, Math.PI * 2);
            ctx.stroke();
          }
        } catch (err) {}
      }

      // Brand Name
      ctx.fillStyle = textColor;
      ctx.font = `bold ${Math.round(width * 0.048)}px 'Space Grotesk', sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      ctx.fillText(brand.name || "Marca", width / 2, headerY + width * 0.135);

      // Subtitle (Category)
      ctx.fillStyle = mutedTextColor;
      ctx.font = `600 ${Math.round(width * 0.026)}px 'Space Grotesk', sans-serif`;
      ctx.fillText(
        (brand.rubro_especifico || brand.rubro_general || "MARCA REGISTRADA").toUpperCase(),
        width / 2,
        headerY + width * 0.205
      );

      // Footer CTA (Calculated inside inner border zone)
      const footerStartY = qrTopOffset + qrSize + width * 0.04;

      ctx.fillStyle = eyeOuterColor;
      ctx.font = `bold ${Math.round(width * 0.032)}px 'Space Grotesk', sans-serif`;
      ctx.fillText("ESCANEA PARA EXPLORAR NUESTRO CATÁLOGO", width / 2, footerStartY);

      ctx.fillStyle = mutedTextColor;
      ctx.font = `500 ${Math.round(width * 0.025)}px 'Space Grotesk', sans-serif`;
      ctx.fillText("Encuéntranos en AOURUM", width / 2, footerStartY + width * 0.045);

      ctx.restore();
    }
  };

  // Re-draw preview on parameter changes
  useEffect(() => {
    if (!isOpen || !brand) return;
    let active = true;
    setGenerating(true);

    const update = async () => {
      if (canvasRef.current) {
        await drawQRCanvas(canvasRef.current, 600, includeCardFrame);
      }
      if (active) setGenerating(false);
    };

    update();
    return () => {
      active = false;
    };
  }, [theme, includeCardFrame, brand, isOpen]);

  // Handle Stand Canvas render when stand mode toggled
  useEffect(() => {
    if (isStandMode && standCanvasRef.current) {
      drawQRCanvas(standCanvasRef.current, 900, true);
    }
  }, [isStandMode, theme, brand]);

  if (!isOpen || !brand) return null;

  // Export 1: High Resolution PNG (2000x2000px)
  const downloadPNGHD = async () => {
    const exportCanvas = document.createElement("canvas");
    await drawQRCanvas(exportCanvas, 2000, includeCardFrame);
    const dataUrl = exportCanvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.download = `QR-AOURUM-${(brand.slug || brand.name || "marca").toLowerCase()}.png`;
    link.href = dataUrl;
    link.click();
    showToast("¡QR PNG en Alta Definición (2000px) descargado!");
  };

  // Export 2: Pure SVG Vector Download
  const downloadSVG = () => {
    try {
      const qrData = QRCode.create(brandUrl, { errorCorrectionLevel: "H" });
      const modules = qrData.modules;
      const size = modules.size;
      const cellSize = 10;
      const totalSize = size * cellSize;

      let svgPaths = "";
      const isEyeModule = (r, c) =>
        (r < 7 && c < 7) || (r < 7 && c >= size - 7) || (r >= size - 7 && c < 7);
      const isCenterModule = (r, c) =>
        r >= Math.floor(size * 0.38) &&
        r <= Math.ceil(size * 0.62) &&
        c >= Math.floor(size * 0.38) &&
        c <= Math.ceil(size * 0.62);

      let modColor = theme === "light" ? "#18181B" : theme === "gold" ? "#F3E5AB" : "#FFFFFF";
      let eyeOuter = theme === "light" ? "#B8901D" : theme === "gold" ? "#FFD700" : "#D4AF37";
      let eyeInner = theme === "light" ? "#D4AF37" : theme === "gold" ? "#D4AF37" : "#E5C158";
      let bg = theme === "light" ? "#FAF9F6" : theme === "gold" ? "#1A1710" : "#121214";

      for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
          if (modules.get(r, c) && !isEyeModule(r, c) && !isCenterModule(r, c)) {
            const cx = c * cellSize + cellSize / 2;
            const cy = r * cellSize + cellSize / 2;
            svgPaths += `<circle cx="${cx}" cy="${cy}" r="${cellSize * 0.38}" fill="${modColor}" />`;
          }
        }
      }

      // Finder patterns SVGs
      const makeEyeSVG = (x, y) => `
        <rect x="${x}" y="${y}" width="${7 * cellSize}" height="${7 * cellSize}" rx="${1.5 * cellSize}" fill="${eyeOuter}" />
        <rect x="${x + cellSize}" y="${y + cellSize}" width="${5 * cellSize}" height="${5 * cellSize}" rx="${1 * cellSize}" fill="${bg}" />
        <rect x="${x + 2 * cellSize}" y="${y + 2 * cellSize}" width="${3 * cellSize}" height="${3 * cellSize}" rx="${0.6 * cellSize}" fill="${eyeInner}" />
      `;

      const eyesSVG =
        makeEyeSVG(0, 0) +
        makeEyeSVG((size - 7) * cellSize, 0) +
        makeEyeSVG(0, (size - 7) * cellSize);

      // Center Emblem Badge SVG
      const cCenter = totalSize / 2;
      const emblemR = (totalSize * 0.22) / 2;

      const badgeSVG = `
        <circle cx="${cCenter}" cy="${cCenter}" r="${emblemR + cellSize}" fill="${bg}" stroke="${eyeOuter}" stroke-width="${cellSize * 0.6}" />
        <text x="${cCenter}" y="${cCenter}" font-family="sans-serif" font-weight="bold" font-size="${emblemR * 0.45}" fill="${eyeOuter}" text-anchor="middle" dominant-baseline="central">AOURUM</text>
      `;

      const svgContent = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${totalSize} ${totalSize}" width="1000" height="1000">
  <rect width="${totalSize}" height="${totalSize}" fill="${bg}" />
  <g>${svgPaths}</g>
  <g>${eyesSVG}</g>
  <g>${badgeSVG}</g>
</svg>`;

      const blob = new Blob([svgContent], { type: "image/svg+xml;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.download = `QR-Vector-AOURUM-${(brand.slug || brand.name || "marca").toLowerCase()}.svg`;
      link.href = url;
      link.click();
      URL.revokeObjectURL(url);
      showToast("¡Vector SVG descargado con éxito!");
    } catch (err) {
      console.error(err);
      showToast("Error al exportar SVG.");
    }
  };

  // Export 3: Print Ready Stand Poster / Card (PDF / Browser Print)
  const handlePrintCard = async () => {
    const printCanvas = document.createElement("canvas");
    await drawQRCanvas(printCanvas, 1400, true);
    const dataUrl = printCanvas.toDataURL("image/png");

    const win = window.open("", "_blank");
    if (!win) {
      showToast("Por favor permite abrir ventanas emergentes para imprimir.");
      return;
    }

    win.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Cartel de Stand AOURUM - ${brand.name}</title>
          <style>
            body {
              margin: 0;
              padding: 0;
              display: flex;
              justify-content: center;
              align-items: center;
              min-height: 100vh;
              background-color: #000;
            }
            img {
              max-width: 100%;
              max-height: 98vh;
              box-shadow: 0 10px 40px rgba(0,0,0,0.5);
              border-radius: 12px;
            }
            @media print {
              body { background: white; }
              img { max-height: 100vh; width: 100%; object-fit: contain; }
            }
          </style>
        </head>
        <body>
          <img src="${dataUrl}" onload="window.print();" />
        </body>
      </html>
    `);
    win.document.close();
  };

  // Export 4: Copy to Clipboard
  const copyToClipboard = async () => {
    try {
      const copyCanvas = document.createElement("canvas");
      await drawQRCanvas(copyCanvas, 1200, includeCardFrame);
      copyCanvas.toBlob(async (blob) => {
        if (!blob) return;
        try {
          await navigator.clipboard.write([
            new ClipboardItem({ [blob.type]: blob })
          ]);
          setIsCopied(true);
          showToast("¡Imagen del QR copiada al portapapeles!");
          setTimeout(() => setIsCopied(false), 2500);
        } catch (e) {
          // Fallback to text link
          await navigator.clipboard.writeText(brandUrl);
          showToast("¡Enlace del QR copiado al portapapeles!");
        }
      });
    } catch (err) {
      showToast("Error al copiar imagen.");
    }
  };

  return (
    <>
      {/* Toast Floating Notification */}
      {toastMsg && (
        <div
          style={{
            position: "fixed",
            bottom: "24px",
            right: "24px",
            background: "linear-gradient(135deg, #1C1C1E, #2C2C2E)",
            color: "#D4AF37",
            padding: "12px 20px",
            borderRadius: "10px",
            border: "1px solid #D4AF37",
            boxShadow: "0 10px 30px rgba(0,0,0,0.4)",
            zIndex: 999999,
            fontWeight: "700",
            fontSize: "0.88rem",
            display: "flex",
            alignItems: "center",
            gap: "8px"
          }}
        >
          <i className="fa-solid fa-circle-check" style={{ fontSize: "1.1rem" }}></i>
          {toastMsg}
        </div>
      )}

      {/* Main Modal Overlay */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0, 0, 0, 0.85)",
          backdropFilter: "blur(8px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 99999,
          padding: "0.75rem"
        }}
        onClick={onClose}
      >
        <div
          style={{
            background: "#141416",
            border: "1px solid rgba(212, 175, 55, 0.35)",
            borderRadius: "20px",
            width: "100%",
            maxWidth: "680px",
            maxHeight: "92vh",
            overflowY: "auto",
            padding: "1.5rem",
            color: "#FFFFFF",
            boxShadow: "0 20px 60px rgba(0,0,0,0.7), 0 0 40px rgba(212,175,55,0.15)",
            position: "relative",
            boxSizing: "border-box"
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              borderBottom: "1px solid rgba(255,255,255,0.1)",
              paddingBottom: "0.8rem",
              marginBottom: "1rem"
            }}
          >
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px", flexWrap: "wrap" }}>
                <span
                  style={{
                    background: "linear-gradient(135deg, #D4AF37, #F3E5AB)",
                    color: "#121214",
                    fontSize: "0.65rem",
                    fontWeight: "800",
                    padding: "2px 8px",
                    borderRadius: "12px",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em"
                  }}
                >
                  Exclusivo AOURUM
                </span>
                <span style={{ fontSize: "0.75rem", color: "#A1A1AA" }}>
                  <i className="fa-solid fa-lock" style={{ marginRight: "4px", color: "#D4AF37" }}></i>
                  Código QR Permanente e Inalterable
                </span>
              </div>
              <h2 style={{ fontSize: "1.25rem", fontWeight: "800", margin: 0, color: "#FFFFFF" }}>
                Código QR de <span style={{ color: "#D4AF37" }}>{brand.name}</span>
              </h2>
            </div>
            <button
              onClick={onClose}
              style={{
                background: "rgba(255,255,255,0.08)",
                border: "none",
                color: "#A1A1AA",
                width: "36px",
                height: "36px",
                borderRadius: "50%",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "1rem",
                flexShrink: 0
              }}
            >
              <i className="fa-solid fa-xmark"></i>
            </button>
          </div>

          {/* Controls Bar: Theme & Format switch */}
          <div
            style={{
              display: "flex",
              gap: "10px",
              flexWrap: "wrap",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "1rem",
              background: "rgba(255,255,255,0.03)",
              padding: "10px 12px",
              borderRadius: "12px",
              border: "1px solid rgba(255,255,255,0.06)"
            }}
          >
            {/* Theme Selector */}
            <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
              <span style={{ fontSize: "0.75rem", color: "#A1A1AA", fontWeight: 600 }}>Estilo:</span>
              <button
                onClick={() => setTheme("dark")}
                style={{
                  padding: "4px 10px",
                  borderRadius: "6px",
                  fontSize: "0.75rem",
                  fontWeight: "700",
                  cursor: "pointer",
                  border: theme === "dark" ? "1px solid #D4AF37" : "1px solid rgba(255,255,255,0.1)",
                  background: theme === "dark" ? "#121214" : "transparent",
                  color: theme === "dark" ? "#D4AF37" : "#A1A1AA"
                }}
              >
                Obsidiana
              </button>
              <button
                onClick={() => setTheme("light")}
                style={{
                  padding: "4px 10px",
                  borderRadius: "6px",
                  fontSize: "0.75rem",
                  fontWeight: "700",
                  cursor: "pointer",
                  border: theme === "light" ? "1px solid #D4AF37" : "1px solid rgba(255,255,255,0.1)",
                  background: theme === "light" ? "#FAF9F6" : "transparent",
                  color: theme === "light" ? "#1C1C1E" : "#A1A1AA"
                }}
              >
                Claridad
              </button>
              <button
                onClick={() => setTheme("gold")}
                style={{
                  padding: "4px 10px",
                  borderRadius: "6px",
                  fontSize: "0.75rem",
                  fontWeight: "700",
                  cursor: "pointer",
                  border: theme === "gold" ? "1px solid #FFD700" : "1px solid rgba(255,255,255,0.1)",
                  background: theme === "gold" ? "#1A1710" : "transparent",
                  color: theme === "gold" ? "#FFD700" : "#A1A1AA"
                }}
              >
                Oro Puro
              </button>
            </div>

            {/* Layout Toggle */}
            <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
              <span style={{ fontSize: "0.75rem", color: "#A1A1AA", fontWeight: 600 }}>Formato:</span>
              <button
                onClick={() => setIncludeCardFrame(false)}
                style={{
                  padding: "4px 10px",
                  borderRadius: "6px",
                  fontSize: "0.75rem",
                  fontWeight: "700",
                  cursor: "pointer",
                  border: !includeCardFrame ? "1px solid #D4AF37" : "1px solid rgba(255,255,255,0.1)",
                  background: !includeCardFrame ? "rgba(212, 175, 55, 0.15)" : "transparent",
                  color: !includeCardFrame ? "#D4AF37" : "#A1A1AA"
                }}
              >
                Solo QR
              </button>
              <button
                onClick={() => setIncludeCardFrame(true)}
                style={{
                  padding: "4px 10px",
                  borderRadius: "6px",
                  fontSize: "0.75rem",
                  fontWeight: "700",
                  cursor: "pointer",
                  border: includeCardFrame ? "1px solid #D4AF37" : "1px solid rgba(255,255,255,0.1)",
                  background: includeCardFrame ? "rgba(212, 175, 55, 0.15)" : "transparent",
                  color: includeCardFrame ? "#D4AF37" : "#A1A1AA"
                }}
              >
                Tarjeta Impresa / Stand
              </button>
            </div>
          </div>

          {/* QR Canvas Preview Display */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: "1rem",
              background: "#0A0A0C",
              borderRadius: "16px",
              border: "1px solid rgba(212,175,55,0.2)",
              marginBottom: "1.2rem",
              position: "relative"
            }}
          >
            {generating && (
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background: "rgba(10,10,12,0.7)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: "16px",
                  zIndex: 2
                }}
              >
                <i className="fa-solid fa-spinner fa-spin" style={{ color: "#D4AF37", fontSize: "2rem" }}></i>
              </div>
            )}
            <canvas
              ref={canvasRef}
              style={{
                maxWidth: "100%",
                maxHeight: "360px",
                height: "auto",
                borderRadius: "12px",
                boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
                objectFit: "contain"
              }}
            />
            <div style={{ marginTop: "8px", textAlign: "center", width: "100%", overflow: "hidden", textOverflow: "ellipsis" }}>
              <span style={{ fontSize: "0.72rem", color: "#8E8E93", wordBreak: "break-all" }}>
                Enlace inalterable: <strong style={{ color: "#D4AF37" }}>{brandUrl}</strong>
              </span>
            </div>
          </div>

          {/* Download & Action Options Grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: "8px" }}>
            <button
              onClick={downloadPNGHD}
              style={{
                background: "linear-gradient(135deg, #D4AF37, #A68015)",
                color: "#121214",
                border: "none",
                padding: "10px 12px",
                borderRadius: "10px",
                fontWeight: "800",
                fontSize: "0.8rem",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "6px",
                boxShadow: "0 4px 12px rgba(212,175,55,0.25)"
              }}
            >
              <i className="fa-solid fa-download"></i> PNG HD (2000px)
            </button>

            <button
              onClick={downloadSVG}
              style={{
                background: "rgba(255,255,255,0.06)",
                color: "#FFFFFF",
                border: "1px solid rgba(212,175,55,0.5)",
                padding: "10px 12px",
                borderRadius: "10px",
                fontWeight: "700",
                fontSize: "0.8rem",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "6px"
              }}
            >
              <i className="fa-solid fa-vector-square" style={{ color: "#D4AF37" }}></i> Vector SVG
            </button>

            <button
              onClick={handlePrintCard}
              style={{
                background: "rgba(255,255,255,0.06)",
                color: "#FFFFFF",
                border: "1px solid rgba(255,255,255,0.15)",
                padding: "10px 12px",
                borderRadius: "10px",
                fontWeight: "700",
                fontSize: "0.8rem",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "6px"
              }}
            >
              <i className="fa-solid fa-print" style={{ color: "#38bdf8" }}></i> Cartel Impreso / PDF
            </button>

            <button
              onClick={copyToClipboard}
              style={{
                background: "rgba(255,255,255,0.06)",
                color: "#FFFFFF",
                border: "1px solid rgba(255,255,255,0.15)",
                padding: "10px 12px",
                borderRadius: "10px",
                fontWeight: "700",
                fontSize: "0.8rem",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "6px"
              }}
            >
              <i className={`fa-solid ${isCopied ? "fa-check" : "fa-copy"}`} style={{ color: isCopied ? "#4ade80" : "#a855f7" }}></i>
              {isCopied ? "¡Copiado!" : "Copiar Imagen"}
            </button>

            <button
              onClick={() => setIsStandMode(true)}
              style={{
                gridColumn: "1 / -1",
                background: "linear-gradient(135deg, #1E1B10, #2A2414)",
                color: "#FFD700",
                border: "1.5px solid #FFD700",
                padding: "12px 16px",
                borderRadius: "12px",
                fontWeight: "800",
                fontSize: "0.85rem",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                marginTop: "4px"
              }}
            >
              <i className="fa-solid fa-tablet-screen-button" style={{ fontSize: "1.05rem" }}></i>
              Abrir Modo Mostrador / Stand (Para pantalla en Feria)
            </button>
          </div>
        </div>
      </div>

      {/* FULLSCREEN STAND DISPLAY MODE (Para Tablets / Pantallas en Stands de Ferias) */}
      {isStandMode && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "#08080A",
            zIndex: 999999,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "1.2rem 1rem",
            color: "#FFFFFF",
            boxSizing: "border-box",
            overflowY: "auto"
          }}
        >
          {/* Header Bar */}
          <div
            style={{
              width: "100%",
              maxWidth: "800px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "0.5rem"
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <img src="/aourum-gold-badge.png" alt="Aourum" style={{ width: "32px", height: "32px" }} />
              <div>
                <span style={{ fontSize: "0.68rem", color: "#D4AF37", letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: "800", display: "block" }}>
                  STAND OFICIAL AOURUM
                </span>
                <h1 style={{ fontSize: "1.15rem", fontWeight: "800", margin: 0, color: "#FFFFFF", lineHeight: 1.2 }}>
                  {brand.name}
                </h1>
              </div>
            </div>

            <button
              onClick={() => setIsStandMode(false)}
              style={{
                background: "rgba(255,255,255,0.1)",
                border: "1px solid rgba(255,255,255,0.2)",
                color: "#FFFFFF",
                padding: "8px 16px",
                borderRadius: "30px",
                cursor: "pointer",
                fontWeight: "700",
                fontSize: "0.85rem",
                display: "flex",
                alignItems: "center",
                gap: "6px",
                flexShrink: 0
              }}
            >
              <i className="fa-solid fa-xmark"></i> Salir
            </button>
          </div>

          {/* Centered Canvas Container */}
          <div
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "100%",
              margin: "0.5rem 0"
            }}
          >
            <div
              style={{
                padding: "10px",
                background: "#121214",
                borderRadius: "20px",
                border: "1.5px solid #D4AF37",
                boxShadow: "0 0 50px rgba(212,175,55,0.25), 0 15px 35px rgba(0,0,0,0.8)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                maxWidth: "92vw"
              }}
            >
              <canvas
                ref={standCanvasRef}
                style={{
                  maxWidth: "100%",
                  maxHeight: "68vh",
                  width: "auto",
                  height: "auto",
                  borderRadius: "14px",
                  objectFit: "contain"
                }}
              />
            </div>
          </div>

          {/* Footer Badge */}
          <div
            style={{
              textAlign: "center",
              background: "rgba(212, 175, 55, 0.12)",
              border: "1px solid rgba(212, 175, 55, 0.3)",
              padding: "8px 20px",
              borderRadius: "30px",
              marginTop: "0.5rem"
            }}
          >
            <p style={{ fontSize: "0.85rem", fontWeight: "700", color: "#FFD700", margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
              <i className="fa-solid fa-qrcode" style={{ fontSize: "1rem" }}></i>
              Escanea para ver catálogo e información en vivo
            </p>
          </div>
        </div>
      )}
    </>
  );
}
