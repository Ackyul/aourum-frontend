"use client";

import Link from "next/link";

export default function Header({
  pathname,
  mounted,
  activePersonId,
  activeUsername,
  searchTerm,
  setSearchTerm,
  showSearchDropdown,
  setShowSearchDropdown,
  searchUsers,
  setSearchUsers,
  searchContainerRef,
  people,
  products,
  brands,
  router,
  DEFAULT_USER_AVATAR,
  accountDropdownOpen,
  setAccountDropdownOpen,
  renderAccountDropdownContent,
  renderAccountBtnContent,
  setShowLoginModal,
  getCurrentPerson
}) {
  return (
    <>
      {/* ── HEADER ─────────────────────────────────────────────────────────── */}
      <header>
        <div className="header-inner">
          
          {/* Logo */}
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: "10px", textDecoration: "none", flexShrink: 0 }} aria-label="AOURUM Inicio">
            <div className="aourum-icon-badge">
              <span className="aourum-logo-icon" title="AOURUM" />
            </div>
            <div style={{ display: "flex", alignItems: "center" }}>
              <span className="aourum-logo-wordmark" aria-label="AOURUM" />
            </div>
          </Link>

          {/* Search bar */}
          <div className="header-search" ref={searchContainerRef}>
            <i className="fa-solid fa-magnifying-glass search-icon"></i>
            <input 
              type="text"
              placeholder="Buscar..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setShowSearchDropdown(true);
              }}
              onFocus={() => setShowSearchDropdown(true)}
            />
            
            {/* Search Dropdown */}
            {showSearchDropdown && searchTerm.trim() !== "" && (
              <div className="search-dropdown">
                <div className="search-dropdown-header">
                  <span style={{ color: "var(--text-muted)", fontSize: "0.75rem", fontWeight: 600 }}>BÚSQUEDA GLOBAL</span>
                  <label className="search-dropdown-toggle-label">
                    <input 
                      type="checkbox" 
                      className="search-dropdown-toggle-input"
                      checked={searchUsers}
                      onChange={(e) => setSearchUsers(e.target.checked)}
                    />
                    <span>Buscar usuarios</span>
                  </label>
                </div>
                
                <div style={{ maxHeight: "360px", overflowY: "auto" }}>
                  {searchUsers ? (
                    // MODE: Search Users
                    <>
                      {(() => {
                        const query = searchTerm.toLowerCase().trim();
                        const matchingUsers = people.filter(p => 
                          (p.name && p.name.toLowerCase().includes(query)) ||
                          (p.lastName && p.lastName.toLowerCase().includes(query)) ||
                          (p.username && p.username.toLowerCase().includes(query))
                        );
                        
                        if (matchingUsers.length === 0) {
                          return (
                            <div className="search-dropdown-no-results">
                              <i className="fa-solid fa-user-slash" style={{ fontSize: "1.5rem", color: "var(--text-muted)", marginBottom: "6px" }}></i>
                              <span>No se encontraron perfiles de usuario.</span>
                            </div>
                          );
                        }
                        
                        return (
                          <div className="search-dropdown-section">
                            <div className="search-dropdown-section-title">Usuarios y Perfiles</div>
                            {matchingUsers.map(person => (
                              <div 
                                key={person.id}
                                className="search-dropdown-item"
                                onClick={() => {
                                  setSearchTerm("");
                                  setShowSearchDropdown(false);
                                  router.push(`/people/${person.username || person.id}`);
                                }}
                              >
                                <img 
                                  src={person.logo || DEFAULT_USER_AVATAR} 
                                  alt={person.name} 
                                  className="search-dropdown-item-avatar"
                                  onError={(e) => { e.target.src = DEFAULT_USER_AVATAR; }}
                                />
                                <div className="search-dropdown-item-info">
                                  <div className="search-dropdown-item-name">{person.name} {person.lastName || ""}</div>
                                  <div className="search-dropdown-item-sub">@{person.username || `user_${person.id}`}</div>
                                </div>
                                <i className="fa-solid fa-chevron-right" style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.2)", marginLeft: "auto" }}></i>
                              </div>
                            ))}
                          </div>
                        );
                      })()}
                    </>
                  ) : (
                    // MODE: Search Products & Brands
                    <>
                      {(() => {
                        const query = searchTerm.toLowerCase().trim();
                        
                        // 1. Filter Products (limit to 5)
                        const matchingProducts = products.filter(prod => 
                          (prod.name && prod.name.toLowerCase().includes(query)) ||
                          (prod.description && prod.description.toLowerCase().includes(query))
                        );
                        const limitedProducts = matchingProducts.slice(0, 5);
                        
                        // 2. Filter Brands with similar names
                        const matchingBrands = brands.filter(brand => 
                          brand.name && brand.name.toLowerCase().includes(query)
                        );
                        
                        if (limitedProducts.length === 0 && matchingBrands.length === 0) {
                          return (
                            <div className="search-dropdown-no-results">
                              <i className="fa-solid fa-store-slash" style={{ fontSize: "1.5rem", color: "var(--text-muted)", marginBottom: "6px" }}></i>
                              <span>No se encontraron productos ni marcas.</span>
                            </div>
                          );
                        }
                        
                        return (
                          <>
                            {/* Products Section */}
                            {limitedProducts.length > 0 && (
                              <div className="search-dropdown-section">
                                <div className="search-dropdown-section-title">Productos ({matchingProducts.length})</div>
                                {limitedProducts.map(prod => (
                                  <div 
                                    key={prod.id}
                                    className="search-dropdown-item"
                                    onClick={() => {
                                      setSearchTerm("");
                                      setShowSearchDropdown(false);
                                      router.push(`/products/${prod.slug || prod.id}`);
                                    }}
                                  >
                                    <img 
                                      src={prod.image || "/dummy.png"} 
                                      alt={prod.name} 
                                      className="search-dropdown-item-img"
                                      onError={(e) => { e.target.src = "/dummy.png"; }}
                                    />
                                    <div className="search-dropdown-item-info">
                                      <div className="search-dropdown-item-name">{prod.name}</div>
                                      <div className="search-dropdown-item-sub">
                                        Por {brands.find(b => b.id === prod.brandId)?.name || "Marca Local"}
                                      </div>
                                    </div>
                                    <div className="search-dropdown-item-price">
                                      {prod.priceAourum ? (
                                        <>
                                          <span>S/ {prod.priceAourum.toLocaleString("es-PE")}</span>
                                          <span className="search-dropdown-item-price-original">
                                            S/ {prod.price.toLocaleString("es-PE")}
                                          </span>
                                        </>
                                      ) : (
                                        <span>S/ {prod.price.toLocaleString("es-PE")}</span>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                            
                            {/* Brands Section (similar names) */}
                            {matchingBrands.length > 0 && (
                              <div className="search-dropdown-section">
                                <div className="search-dropdown-section-title">Marcas Similares</div>
                                {matchingBrands.map(brand => (
                                  <div 
                                    key={brand.id}
                                    className="search-dropdown-item"
                                    onClick={() => {
                                      setSearchTerm("");
                                      setShowSearchDropdown(false);
                                      router.push(`/brands/${brand.slug || brand.id}`);
                                    }}
                                  >
                                    <img 
                                      src={brand.logo || "/dummy.png"} 
                                      alt={brand.name} 
                                      className="search-dropdown-item-avatar"
                                      onError={(e) => { e.target.src = "/dummy.png"; }}
                                    />
                                    <div className="search-dropdown-item-info">
                                      <div className="search-dropdown-item-name">{brand.name}</div>
                                      <div className="search-dropdown-item-sub">{brand.category || "Marca Local"}</div>
                                    </div>
                                    <i className="fa-solid fa-chevron-right" style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.2)", marginLeft: "auto" }}></i>
                                  </div>
                                ))}
                              </div>
                            )}
                          </>
                        );
                      })()}
                    </>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Nav links (desktop only) + account button */}
          <nav style={{ display: "flex", gap: "0.6rem", alignItems: "center", flexShrink: 0 }} className="header-right">
            {/* Desktop nav links */}
            <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }} className="header-nav-links">
              {[
                { href: "/", icon: "fa-compass", label: "Descubre" },
                { href: "/brands", icon: "fa-store", label: "Marcas" },
                { href: "/fairs", icon: "fa-calendar-days", label: "Ferias" },
                { href: "/bands", icon: "fa-guitar", label: "Música" },
              ].map(({ href, icon, label }) => (
                <Link
                  key={href}
                  href={href}
                  style={{
                    background: pathname === href ? "rgba(212, 175, 55, 0.08)" : "transparent",
                    border: pathname === href ? "1px solid rgba(212, 175, 55, 0.25)" : "1px solid transparent",
                    color: pathname === href ? "var(--gold-dark)" : "var(--text-muted)",
                    padding: "0.4rem 0.75rem",
                    borderRadius: "20px",
                    fontWeight: pathname === href ? 700 : 500,
                    textDecoration: "none",
                    fontSize: "0.84rem",
                    transition: "var(--transition-smooth)",
                    display: "flex",
                    alignItems: "center",
                    gap: "5px"
                  }}
                >
                  <i className={`fa-solid ${icon}`} style={{ fontSize: "0.88rem" }}></i>
                  {label}
                </Link>
              ))}
              {mounted && activePersonId && (
                <Link
                  href={`/people/${getCurrentPerson()?.username || activeUsername || activePersonId}`}
                  style={{
                    background: pathname.startsWith('/people/') ? "var(--gold-gradient)" : "rgba(214,175,55,0.06)",
                    border: "1px solid rgba(214,175,55,0.35)",
                    padding: "0.4rem 0.75rem",
                    borderRadius: "20px",
                    color: pathname.startsWith('/people/') ? "#1C1C1E" : "var(--gold-dark)",
                    fontWeight: 700,
                    textDecoration: "none",
                    fontSize: "0.82rem",
                    transition: "var(--transition-smooth)",
                    display: "flex",
                    alignItems: "center",
                    gap: "5px"
                  }}
                >
                  <i className="fa-solid fa-circle-user" style={{ fontSize: "0.88rem" }}></i>
                  Mi Perfil
                </Link>
              )}
              {mounted && activePersonId && <span style={{ width: "1px", height: "18px", background: "var(--border-color)" }}></span>}
            </div>

            {/* Account button (always visible) */}
            <div className="account-dropdown-wrapper">
              <button 
                id="account-popover-trigger"
                onClick={() => setAccountDropdownOpen(!accountDropdownOpen)}
                className={(mounted && activePersonId) ? "btn-outline-gold" : "btn-gold"}
                style={{
                  borderRadius: "20px",
                  padding: "0.4rem 0.9rem",
                  fontSize: "0.82rem",
                  display: "flex",
                  alignItems: "center",
                  gap: "7px",
                  border: "1.5px solid var(--gold-primary)",
                  cursor: "pointer",
                  fontWeight: 700,
                  background: !(mounted && activePersonId) ? "var(--gold-gradient)" : accountDropdownOpen ? "rgba(214,175,55,0.08)" : "transparent",
                  color: !(mounted && activePersonId) ? "#1C1C1E" : undefined,
                  transition: "var(--transition-smooth)",
                  whiteSpace: "nowrap"
                }}
              >
                {(!mounted || !activePersonId)
                  ? <><i className="fa-solid fa-user-circle"></i><span className="hide-on-mobile"> Regístrate · Inicia sesión</span><span className="show-on-mobile" style={{ display: "inline" }}>Entrar</span></>
                  : renderAccountBtnContent()
                }
                {mounted && activePersonId && <i className="fa-solid fa-chevron-down" style={{ fontSize: "0.7rem", opacity: 0.8, transition: "transform 0.3s", transform: accountDropdownOpen ? "rotate(180deg)" : "none" }}></i>}
              </button>

              {/* Popover dropdown (Desktop) */}
              {mounted && accountDropdownOpen && (
                <div className="glass-panel account-popover-desktop fade-in">
                  {renderAccountDropdownContent()}
                </div>
              )}
            </div>
          </nav>
        </div>
      </header>

      {/* Mobile Account Popover (bottom sheet) */}
      {mounted && accountDropdownOpen && (
        <>
          <div 
            className="mobile-popover-backdrop show-on-mobile" 
            onClick={() => setAccountDropdownOpen(false)}
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              width: "100vw",
              height: "100vh",
              background: "rgba(0, 0, 0, 0.4)",
              backdropFilter: "blur(4px)",
              WebkitBackdropFilter: "blur(4px)",
              zIndex: 1150
            }}
          ></div>
          <div className="glass-panel account-popover-mobile fade-in">
            <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "0.5rem" }} className="show-on-mobile">
              <button 
                onClick={() => setAccountDropdownOpen(false)} 
                style={{ 
                  background: "rgba(0,0,0,0.04)", 
                  border: "none", 
                  fontSize: "1.2rem", 
                  cursor: "pointer", 
                  width: "32px", 
                  height: "32px", 
                  borderRadius: "50%", 
                  display: "flex", 
                  alignItems: "center", 
                  justifyContent: "center" 
                }}
              >
                &times;
              </button>
            </div>
            {renderAccountDropdownContent()}
          </div>
        </>
      )}

      {/* ── MOBILE BOTTOM TAB BAR ───────────────────────────────────────────── */}
      {mounted && (
        <nav className="mobile-tab-bar">
          {[
            { href: "/", icon: "fa-compass", label: "Descubre" },
            { href: "/brands", icon: "fa-store", label: "Marcas" },
            { href: "/fairs", icon: "fa-calendar-days", label: "Ferias" },
            { href: "/bands", icon: "fa-guitar", label: "Música" },
          ].map(({ href, icon, label }) => (
            <Link
              key={href}
              href={href}
              className={`mobile-tab-item${pathname === href ? " active" : ""}`}
            >
              <i className={`fa-solid ${icon}`}></i>
              <span>{label}</span>
            </Link>
          ))}
          {activePersonId ? (
            <Link
              href={`/people/${getCurrentPerson()?.username || activeUsername || activePersonId}`}
              className={`mobile-tab-item${pathname.startsWith('/people/') ? " active" : ""}`}
            >
              <i className="fa-solid fa-circle-user"></i>
              <span>Perfil</span>
            </Link>
          ) : (
            <button
              className="mobile-tab-item"
              onClick={() => setShowLoginModal(true)}
            >
              <i className="fa-solid fa-right-to-bracket"></i>
              <span>Entrar</span>
            </button>
          )}
        </nav>
      )}
    </>
  );
}
