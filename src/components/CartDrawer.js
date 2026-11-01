"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useApp } from "../context/AppContext";

export default function CartDrawer() {
  const {
    cart,
    isCartOpen,
    setIsCartOpen,
    updateCartQuantity,
    removeFromCart,
    clearCart,
    cartCount,
    cartSubtotal,
    customerOrderInfo,
    setCustomerOrderInfo,
    getCurrentPerson,
    activePersonId,
    activeUsername
  } = useApp();

  const [sentBrands, setSentBrands] = useState({});
  const [showInfoForm, setShowInfoForm] = useState(false);

  // Group cart items by brand
  const groupedByBrand = useMemo(() => {
    const map = {};
    cart.forEach(item => {
      const bId = item.brandId || "general";
      if (!map[bId]) {
        map[bId] = {
          brandId: bId,
          brandName: item.brandName || "Marca Local",
          brandPhone: item.brandPhone || "",
          brandLogo: item.brandLogo || null,
          brandCategory: item.brandCategory || "Marca Local",
          items: [],
          subtotal: 0
        };
      }
      map[bId].items.push(item);
      map[bId].subtotal += (item.price || 0) * (item.quantity || 1);
    });
    return Object.values(map);
  }, [cart]);

  const loggedPerson = activePersonId ? getCurrentPerson() : null;
  const clientName = loggedPerson?.name 
    ? (loggedPerson.lastName ? `${loggedPerson.name} ${loggedPerson.lastName}` : loggedPerson.name)
    : (activeUsername || "");

  if (!isCartOpen) return null;

  // Build formatted WhatsApp message for a specific brand
  const handleCheckoutBrand = (brandGroup) => {
    const loggedPerson = activePersonId ? getCurrentPerson() : null;
    const clientName = loggedPerson?.name 
      ? (loggedPerson.lastName ? `${loggedPerson.name} ${loggedPerson.lastName}` : loggedPerson.name)
      : (activeUsername || "");
    const clientAddress = customerOrderInfo.address?.trim() || "";
    const clientNotes = customerOrderInfo.notes?.trim() || "";

    let text = `¡Hola *${brandGroup.brandName}*! 👋\n`;
    text += `Vi tus productos en *AOURUM* y deseo realizar el siguiente pedido:\n\n`;
    text += `🛍️ *PRODUCTOS SELECCIONADOS:*\n`;

    brandGroup.items.forEach(it => {
      const sizeTag = it.size ? ` (${it.size})` : "";
      const unitPriceStr = Number(it.price).toFixed(2);
      const itemTotalStr = (Number(it.price) * it.quantity).toFixed(2);
      text += `• *${it.quantity}x* ${it.name}${sizeTag} — S/ ${itemTotalStr} (S/ ${unitPriceStr} c/u)\n`;
    });

    text += `\n💰 *SUBTOTAL A PAGAR:* S/ ${brandGroup.subtotal.toFixed(2)}\n`;
    text += `──────────────────────\n`;
    text += `👤 *DATOS DE ENTREGA:*\n`;
    if (clientName) {
      text += `• *Nombre:* ${clientName}\n`;
    }
    if (clientAddress) text += `• *Ciudad / Dirección:* ${clientAddress}\n`;
    if (clientNotes) text += `• *Nota / Consulta:* ${clientNotes}\n`;
    text += `\n📍 _Pedido enviado desde AOURUM Marketplace_`;

    let cleanPhone = (brandGroup.brandPhone || "").replace(/[^0-9]/g, "");
    if (cleanPhone.length === 9) {
      cleanPhone = "51" + cleanPhone; // Código de Perú por defecto
    }

    // Mark this brand as initiated
    setSentBrands(prev => ({ ...prev, [brandGroup.brandId]: true }));

    const url = cleanPhone
      ? `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(text)}`
      : `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;

    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="cart-drawer-backdrop" onClick={() => setIsCartOpen(false)}>
      <aside 
        className="cart-drawer-panel" 
        onClick={(e) => e.stopPropagation()}
        aria-label="Carrito de Compras"
      >
        {/* Header */}
        <div className="cart-drawer-header">
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div className="cart-drawer-icon-wrap">
              <i className="fa-solid fa-bag-shopping"></i>
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: "1.15rem", fontWeight: 800 }}>Mi Carrito</h3>
              <p style={{ margin: "2px 0 0 0", fontSize: "0.78rem", color: "var(--text-muted)" }}>
                {cartCount === 1 ? "1 producto agregado" : `${cartCount} productos agregados`}
              </p>
            </div>
          </div>
          <button 
            type="button" 
            onClick={() => setIsCartOpen(false)}
            className="cart-drawer-close-btn"
            aria-label="Cerrar carrito"
          >
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>

        {/* Body content */}
        <div className="cart-drawer-body">
          {cart.length === 0 ? (
            <div className="cart-empty-state">
              <div className="cart-empty-icon">
                <i className="fa-solid fa-basket-shopping"></i>
              </div>
              <h4 style={{ fontSize: "1.2rem", fontWeight: 800, margin: "0.5rem 0" }}>Tu carrito está vacío</h4>
              <p style={{ fontSize: "0.88rem", color: "var(--text-muted)", maxWidth: "280px", margin: "0 auto 1.5rem" }}>
                Explora las marcas locales en AOURUM y añade tus artículos favoritos.
              </p>
              <button 
                type="button" 
                onClick={() => setIsCartOpen(false)} 
                className="btn-gold"
                style={{ borderRadius: "25px", padding: "0.6rem 1.8rem", fontWeight: 700 }}
              >
                Explorar Vitrinas
              </button>
            </div>
          ) : (
            <>
              {/* Optional Collapsible Customer Info Form */}
              <div className="cart-customer-info-box">
                <button 
                  type="button" 
                  onClick={() => setShowInfoForm(prev => !prev)}
                  className="cart-customer-info-toggle"
                >
                  <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <i className="fa-solid fa-location-dot" style={{ color: "var(--gold-primary)" }}></i>
                    <strong>Datos para tu entrega</strong>
                    {customerOrderInfo.address && (
                      <span className="cart-tag-ok">Dirección agregada</span>
                    )}
                  </span>
                  <i className={`fa-solid fa-chevron-${showInfoForm ? "up" : "down"}`} style={{ fontSize: "0.75rem", opacity: 0.7 }}></i>
                </button>

                {showInfoForm && (
                  <div className="cart-customer-info-fields fade-in">
                    {clientName && (
                      <div style={{ 
                        fontSize: "0.78rem", 
                        color: "var(--text-muted)", 
                        display: "flex", 
                        alignItems: "center", 
                        gap: "8px", 
                        padding: "6px 10px", 
                        background: "rgba(212, 175, 55, 0.08)", 
                        borderRadius: "8px",
                        border: "1px solid rgba(212, 175, 55, 0.2)"
                      }}>
                        <i className="fa-solid fa-circle-user" style={{ color: "var(--gold-primary)", fontSize: "0.95rem" }}></i>
                        <span>Pedido a nombre de: <strong style={{ color: "var(--text-main)" }}>{clientName}</strong></span>
                      </div>
                    )}
                    <div>
                      <label style={{ fontSize: "0.74rem", fontWeight: 700, color: "var(--text-muted)", display: "block", marginBottom: 3 }}>
                        Ciudad / Dirección de Entrega:
                      </label>
                      <input 
                        type="text" 
                        value={customerOrderInfo.address} 
                        onChange={(e) => setCustomerOrderInfo(prev => ({ ...prev, address: e.target.value }))}
                        placeholder="Ej. Cayma, Arequipa (o recojo en feria)"
                        className="cart-input"
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: "0.74rem", fontWeight: 700, color: "var(--text-muted)", display: "block", marginBottom: 3 }}>
                        Nota adicional o consulta (opcional):
                      </label>
                      <input 
                        type="text" 
                        value={customerOrderInfo.notes} 
                        onChange={(e) => setCustomerOrderInfo(prev => ({ ...prev, notes: e.target.value }))}
                        placeholder="Ej. ¿Tienen stock para entrega hoy?"
                        className="cart-input"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Explanatory Multi-brand Hint */}
              {groupedByBrand.length > 1 && (
                <div className="cart-multi-brand-hint">
                  <i className="fa-solid fa-circle-info" style={{ color: "var(--gold-primary)", flexShrink: 0 }}></i>
                  <span>
                    Tienes productos de <strong>{groupedByBrand.length} marcas</strong>. Cada botón abrirá el WhatsApp de su respectivo negocio con solo sus productos.
                  </span>
                </div>
              )}

              {/* Brand Groups */}
              <div className="cart-brands-list">
                {groupedByBrand.map((group, gIdx) => {
                  const isSent = !!sentBrands[group.brandId];
                  return (
                    <div key={group.brandId || gIdx} className="cart-brand-card">
                      {/* Brand Group Header */}
                      <div className="cart-brand-header">
                        <div style={{ display: "flex", alignItems: "center", gap: "10px", flex: 1, minWidth: 0 }}>
                          {group.brandLogo ? (
                            <img 
                              src={group.brandLogo} 
                              alt={group.brandName} 
                              className="cart-brand-logo"
                            />
                          ) : (
                            <div className="cart-brand-logo-fallback">
                              <i className="fa-solid fa-store"></i>
                            </div>
                          )}
                          <div style={{ minWidth: 0 }}>
                            <h4 className="cart-brand-name">{group.brandName}</h4>
                            <span className="cart-brand-category">{group.brandCategory}</span>
                          </div>
                        </div>

                        <div style={{ textAlign: "right", flexShrink: 0 }}>
                          <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", display: "block" }}>Subtotal</span>
                          <strong style={{ fontSize: "0.95rem", color: "var(--gold-primary)" }}>
                            S/ {group.subtotal.toFixed(2)}
                          </strong>
                        </div>
                      </div>

                      {/* Brand Items */}
                      <div className="cart-items-wrap">
                        {group.items.map((item) => (
                          <div key={item.id} className="cart-item-row">
                            <img 
                              src={item.image || "/placeholder.png"} 
                              alt={item.name} 
                              className="cart-item-img"
                            />
                            <div className="cart-item-info">
                              <Link 
                                href={`/products/${item.slug || item.productId}`}
                                onClick={() => setIsCartOpen(false)}
                                className="cart-item-title"
                              >
                                {item.name}
                              </Link>
                              
                              <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap", marginTop: "2px" }}>
                                {item.size && (
                                  <span className="cart-item-size-badge">
                                    {item.size}
                                  </span>
                                )}
                                <span className="cart-item-unit-price">
                                  S/ {Number(item.price).toFixed(2)}
                                </span>
                              </div>

                              {/* Stepper & Delete */}
                              <div className="cart-item-actions">
                                <div className="cart-stepper">
                                  <button 
                                    type="button" 
                                    onClick={() => updateCartQuantity(item.id, item.quantity - 1)}
                                    className="cart-stepper-btn"
                                    aria-label="Disminuir cantidad"
                                  >
                                    <i className="fa-solid fa-minus"></i>
                                  </button>
                                  <span className="cart-stepper-value">{item.quantity}</span>
                                  <button 
                                    type="button" 
                                    onClick={() => updateCartQuantity(item.id, item.quantity + 1)}
                                    className="cart-stepper-btn"
                                    aria-label="Aumentar cantidad"
                                  >
                                    <i className="fa-solid fa-plus"></i>
                                  </button>
                                </div>

                                <button 
                                  type="button" 
                                  onClick={() => removeFromCart(item.id)}
                                  className="cart-item-remove-btn"
                                  title="Quitar producto"
                                  aria-label="Quitar producto"
                                >
                                  <i className="fa-regular fa-trash-can"></i>
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Checkout Button for this Brand */}
                      <div className="cart-brand-checkout-wrap">
                        <button 
                          type="button"
                          onClick={() => handleCheckoutBrand(group)}
                          className={`cart-whatsapp-btn ${isSent ? "is-sent" : ""}`}
                        >
                          <i className="fa-brands fa-whatsapp" style={{ fontSize: "1.2rem" }}></i>
                          <span>
                            {isSent 
                              ? `✓ Reenviar a ${group.brandName}`
                              : `Pedir a ${group.brandName} (S/ ${group.subtotal.toFixed(2)})`}
                          </span>
                        </button>
                        {isSent && (
                          <div className="cart-sent-status">
                            <i className="fa-solid fa-check"></i> Chat de WhatsApp abierto
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        {cart.length > 0 && (
          <div className="cart-drawer-footer">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.85rem" }}>
              <div>
                <span style={{ fontSize: "0.78rem", color: "var(--text-muted)", display: "block" }}>
                  Total en Carrito ({cartCount} {cartCount === 1 ? "artículo" : "artículos"})
                </span>
                <strong style={{ fontSize: "1.3rem", fontWeight: 800, color: "var(--text-primary)" }}>
                  S/ {cartSubtotal.toFixed(2)}
                </strong>
              </div>
              <button 
                type="button" 
                onClick={() => {
                  if (confirm("¿Estás seguro de que deseas vaciar tu carrito?")) {
                    clearCart();
                  }
                }}
                className="cart-clear-btn"
                title="Vaciar todo el carrito"
              >
                <i className="fa-regular fa-trash-can" style={{ marginRight: 4 }}></i> Vaciar
              </button>
            </div>

            <p style={{ fontSize: "0.72rem", color: "var(--text-muted)", margin: 0, textAlign: "center" }}>
              🔒 Compras directas y seguras coordinadas directamente con cada marca local.
            </p>
          </div>
        )}
      </aside>
    </div>
  );
}

