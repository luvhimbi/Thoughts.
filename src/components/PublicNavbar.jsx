import React, { useState, useEffect, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { auth } from '../lib/firebase';

/**
 * PublicNavbar — shared top navigation for Landing, Login, Register, and Legal pages.
 * Features:
 *   - Sticky header with backdrop blur on scroll
 *   - Mobile hamburger menu with slide-down drawer
 *   - Active-link highlighting
 *   - Accessible keyboard navigation
 */
const PublicNavbar = () => {
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [user, setUser] = useState(null);

  /* ── Listen to Auth State ── */
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((u) => setUser(u));
    return () => unsubscribe();
  }, []);

  /* ── Scroll listener to add glass-effect background ── */
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  /* ── Close menu on route change ── */
  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  /* ── Lock body scroll when mobile menu is open ── */
  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [menuOpen]);

  const toggleMenu = useCallback(() => setMenuOpen(prev => !prev), []);
  const closeMenu  = useCallback(() => setMenuOpen(false), []);

  const isActive = (path) => location.pathname === path;

  return (
    <>
      <nav
        className={`public-navbar ${scrolled ? 'public-navbar--scrolled' : ''}`}
        role="navigation"
        aria-label="Main navigation"
      >
        <div className="public-navbar__inner container">
          {/* Brand */}
          <Link 
            to={user ? '/journal' : (location.pathname === '/login' || location.pathname === '/register' ? location.pathname : '/')} 
            className="public-navbar__brand" 
            onClick={closeMenu}
          >
            <span className="thoughts-brand">Thoughts.</span>
          </Link>

          {/* Desktop links */}
          <div className="public-navbar__links">
            <a
              href="#features"
              className={`public-navbar__link ${location.hash === '#features' ? 'active' : ''}`}
            >
              Features
            </a>
            <a
              href="#about"
              className={`public-navbar__link ${location.hash === '#about' ? 'active' : ''}`}
            >
              How It Works
            </a>
            {user ? (
              <Link to="/journal" className="public-navbar__cta">
                Go to Dashboard
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className={`public-navbar__link ${isActive('/login') ? 'active' : ''}`}
                >
                  Sign In
                </Link>
                <Link to="/register" className="public-navbar__cta">
                  Get Started
                </Link>
              </>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            className={`public-navbar__hamburger ${menuOpen ? 'open' : ''}`}
            onClick={toggleMenu}
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
          >
            <span className="bar bar--top" />
            <span className="bar bar--mid" />
            <span className="bar bar--bot" />
          </button>
        </div>
      </nav>

      {/* ── Mobile drawer ── */}
      <div
        className={`public-navbar__drawer ${menuOpen ? 'public-navbar__drawer--open' : ''}`}
        aria-hidden={!menuOpen}
      >
        <div className="public-navbar__drawer-content">
          <a href="#features" className="public-navbar__drawer-link" onClick={closeMenu}>
            Features
          </a>
          <a href="#about" className="public-navbar__drawer-link" onClick={closeMenu}>
            How It Works
          </a>

          <div className="public-navbar__drawer-divider" />

          {user ? (
            <Link to="/journal" className="public-navbar__drawer-cta" onClick={closeMenu}>
              Go to Dashboard
            </Link>
          ) : (
            <>
              <Link to="/login" className="public-navbar__drawer-link" onClick={closeMenu}>
                Sign In
              </Link>
              <Link to="/register" className="public-navbar__drawer-cta" onClick={closeMenu}>
                Get Started — it's free
              </Link>
            </>
          )}
        </div>
      </div>

      {/* ── Backdrop overlay ── */}
      {menuOpen && (
        <div
          className="public-navbar__backdrop"
          onClick={closeMenu}
          aria-hidden="true"
        />
      )}
    </>
  );
};

export default PublicNavbar;
