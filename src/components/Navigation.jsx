import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

const Navigation = ({ onAddEntry, isDesktop }) => {
  const [showActionMenu, setShowActionMenu] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const menuRef = useRef(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowActionMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Safe helper to check active paths
  const isActive = (path) => location.pathname === path;

  const ActionMenu = ({ position = 'bottom' }) => (
    <div
      ref={menuRef}
      className="action-menu-content animate-slide-up"
      style={{
        position: 'absolute',
        [position]: position === 'bottom' ? '90px' : 'auto',
        top: position === 'top' ? '60px' : 'auto',
        left: '50%',
        transform: 'translateX(-50%)',
        backgroundColor: 'var(--bg-primary)',
        borderRadius: '24px',
        padding: '12px',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        minWidth: '220px',
        boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
        border: '1px solid var(--border-color)',
        zIndex: 1100
      }}
      onClick={e => e.stopPropagation()}
    >
      <button
        onClick={() => {
          if (onAddEntry) onAddEntry();
          else navigate('/journal', { state: { startWriting: true } });
          setShowActionMenu(false);
        }}
        className="d-flex align-items-center gap-3 p-3 rounded-4 border-0 bg-transparent text-dark fw-600 transition-all hover-bg-light text-start"
      >
        <span style={{ fontSize: '1.2rem' }}>✎</span>
        <div className="d-flex flex-column">
          <span style={{ fontSize: '0.95rem' }}>Journaling</span>
          <span style={{ fontSize: '0.7rem', opacity: 0.5, fontWeight: 400 }}>Save to your timeline</span>
        </div>
      </button>
      <button
        onClick={() => {
          navigate('/journal/release');
          setShowActionMenu(false);
        }}
        className="d-flex align-items-center gap-3 p-3 rounded-4 border-0 bg-transparent text-dark fw-600 transition-all hover-bg-light text-start"
      >
        <span style={{ fontSize: '1.2rem' }}>▽</span>
        <div className="d-flex flex-column">
          <span style={{ fontSize: '0.95rem' }}>Venting</span>
          <span style={{ fontSize: '0.7rem', opacity: 0.5, fontWeight: 400 }}>Burn away and let go</span>
        </div>
      </button>
    </div>
  );

  if (isDesktop) {
    return (
      <nav className="d-flex flex-column gap-2 mt-4 sidebar-nav w-100">
        <Link to="/journal" className={`sidebar-link ${isActive('/journal') ? 'active' : ''}`}>
          <div className="sidebar-icon-wrapper">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
          </div>
          <span>Home</span>
        </Link>
        <Link to="/journal/reflections" className={`sidebar-link ${isActive('/journal/reflections') ? 'active' : ''}`}>
          <div className="sidebar-icon-wrapper">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
          </div>
          <span>Reflections</span>
        </Link>
        <Link to="/journal/guides" className={`sidebar-link ${isActive('/journal/guides') ? 'active' : ''}`}>
          <div className="sidebar-icon-wrapper">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
          </div>
          <span>Affirmations</span>
        </Link>

        <div className="position-relative mt-4">
          <button
            onClick={() => setShowActionMenu(!showActionMenu)}
            className={`sidebar-write-btn ${showActionMenu ? 'active' : ''}`}
          >
            <span className="icon-plus">+</span> Write
          </button>

          {showActionMenu && <ActionMenu position="top" />}
        </div>
      </nav>
    );
  }

  return (
    <>
      {/* Mobile Action Menu Overlay */}
      {showActionMenu && (
        <div className="action-menu-overlay animate-fade-in" style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: 'rgba(0,0,0,0.1)',
          backdropFilter: 'blur(4px)',
          zIndex: 999
        }} onClick={() => setShowActionMenu(false)}>
          <ActionMenu position="bottom" />
        </div>
      )}

      <nav className="bottom-nav d-md-none position-fixed bottom-0 start-0 w-100 d-flex justify-content-between align-items-center px-3" style={{ height: '70px', zIndex: 1000, backgroundColor: 'var(--bg-primary)', borderTop: '1px solid var(--border-color)' }}>
        {/* Home */}
        <Link to="/journal" className={`nav-item d-flex flex-column align-items-center text-decoration-none ${isActive('/journal') ? 'active' : ''}`}>
          <span className="icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
          </span>
          <span className="label mt-1">Home</span>
        </Link>

        {/* Reflections */}
        <Link to="/journal/reflections" className={`nav-item d-flex flex-column align-items-center text-decoration-none ${isActive('/journal/reflections') ? 'active' : ''}`}>
          <span className="icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
          </span>
          <span className="label mt-1">Reflect</span>
        </Link>

        {/* Center + Action Button */}
        <div className="d-flex justify-content-center" style={{ position: 'relative', top: '-15px' }}>
          <button
            onClick={() => setShowActionMenu(!showActionMenu)}
            className={`mobile-add-btn ${showActionMenu ? 'active' : ''}`}
          >
            +
          </button>
        </div>

        {/* Affirmations */}
        <Link to="/journal/guides" className={`nav-item d-flex flex-column align-items-center text-decoration-none ${isActive('/journal/guides') ? 'active' : ''}`}>
          <span className="icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
          </span>
          <span className="label mt-1">Affirm</span>
        </Link>

        {/* Settings */}
        <Link to="/journal/settings" className={`nav-item d-flex flex-column align-items-center text-decoration-none ${isActive('/journal/settings') ? 'active' : ''}`}>
          <span className="icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.1a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.1a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path><circle cx="12" cy="12" r="3"></circle></svg>
          </span>
          <span className="label mt-1">Settings</span>
        </Link>
      </nav>

      <style jsx>{`
        .hover-bg-light:hover {
          background-color: var(--bg-secondary) !important;
        }
        .action-menu-content button {
          transition: all 0.2s ease;
        }
        .action-menu-content button:active {
          transform: scale(0.95);
        }
      `}</style>
    </>
  );
};

export default Navigation;
