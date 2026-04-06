import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const Navigation = ({ onAddEntry, isDesktop }) => {
  const location = useLocation();
  // Safe helper to check active paths
  const isActive = (path) => location.pathname === path;

  if (isDesktop) {
    return (
      <nav className="d-flex flex-column gap-2 mt-4 sidebar-nav w-100">
        <Link to="/journal" className={`p-3 rounded-3 text-decoration-none d-flex align-items-center gap-3 transition-all ${isActive('/journal') ? 'bg-light text-dark fw-bold' : 'text-secondary'}`} style={{ fontSize: '1.05rem' }}>
          <span style={{ fontSize: '1.2rem' }}>{isActive('/journal') ? '●' : '○'}</span>
          Today
        </Link>
        <Link to="/journal/reflections" className={`p-3 rounded-3 text-decoration-none d-flex align-items-center gap-3 transition-all ${isActive('/journal/reflections') ? 'bg-light text-dark fw-bold' : 'text-secondary'}`} style={{ fontSize: '1.05rem' }}>
          <span style={{ fontSize: '1.2rem' }}>{isActive('/journal/reflections') ? '■' : '□'}</span>
          Reflections
        </Link>
        <Link to="/journal/guides" className={`p-3 rounded-3 text-decoration-none d-flex align-items-center gap-3 transition-all ${isActive('/journal/guides') ? 'bg-light text-dark fw-bold' : 'text-secondary'}`} style={{ fontSize: '1.05rem' }}>
          <span style={{ fontSize: '1.2rem' }}>{isActive('/journal/guides') ? '▲' : '△'}</span>
          Guides
        </Link>
        <button 
          onClick={onAddEntry} 
          className="btn btn-dark w-100 mt-4 py-3 rounded-3 fw-bold shadow-soft d-flex align-items-center justify-content-center gap-2"
          style={{ letterSpacing: '0.5px' }}
        >
          <span style={{ fontSize: '1.2rem', lineHeight: 1 }}>+</span> Write
        </button>
      </nav>
    );
  }

  return (
    <nav className="bottom-nav d-md-none position-fixed bottom-0 start-0 w-100 d-flex justify-content-between align-items-end pb-2 px-2" style={{ height: '75px', zIndex: 1000 }}>
      {/* Today */}
      <Link to="/journal" className={`nav-item d-flex flex-column align-items-center text-decoration-none ${isActive('/journal') ? 'text-dark' : 'text-secondary'}`} style={{ flex: '1', minWidth: '0' }}>
        <span className="icon" style={{ fontSize: '1.2rem', lineHeight: 1 }}>{isActive('/journal') ? '●' : '○'}</span>
        <span className="label mt-1 xx-small fw-bold text-uppercase" style={{ letterSpacing: '0.5px' }}>Today</span>
      </Link>

      {/* Reflections */}
      <Link to="/journal/reflections" className={`nav-item d-flex flex-column align-items-center text-decoration-none ${isActive('/journal/reflections') ? 'text-dark' : 'text-secondary'}`} style={{ flex: '1', minWidth: '0' }}>
        <span className="icon" style={{ fontSize: '1.2rem', lineHeight: 1 }}>{isActive('/journal/reflections') ? '■' : '□'}</span>
        <span className="label mt-1 xx-small fw-bold text-uppercase" style={{ letterSpacing: '0.5px' }}>Reflect</span>
      </Link>
      
      {/* Center + Action Button */}
      <div className="d-flex justify-content-center" style={{ flex: '1.2', position: 'relative', top: '-12px' }}>
        <button 
          onClick={onAddEntry} 
          className="btn-minimal d-flex align-items-center justify-content-center rounded-circle"
          style={{ 
            width: '52px', 
            height: '52px', 
            fontSize: '1.5rem', 
            backgroundColor: 'var(--text-primary)',
            color: 'var(--bg-primary)',
            boxShadow: '0 8px 20px rgba(0,0,0,0.15)'
          }}
        >
          +
        </button>
      </div>

      {/* Guides */}
      <Link to="/journal/guides" className={`nav-item d-flex flex-column align-items-center text-decoration-none ${isActive('/journal/guides') ? 'text-dark' : 'text-secondary'}`} style={{ flex: '1', minWidth: '0' }}>
        <span className="icon" style={{ fontSize: '1.2rem', lineHeight: 1 }}>{isActive('/journal/guides') ? '▲' : '△'}</span>
        <span className="label mt-1 xx-small fw-bold text-uppercase" style={{ letterSpacing: '0.5px' }}>Guides</span>
      </Link>

      {/* Settings */}
      <Link to="/journal/settings" className={`nav-item d-flex flex-column align-items-center text-decoration-none ${isActive('/journal/settings') ? 'text-dark' : 'text-secondary'}`} style={{ flex: '1', minWidth: '0' }}>
        <span className="icon" style={{ fontSize: '1.2rem', lineHeight: 1 }}>{isActive('/journal/settings') ? '◆' : '◇'}</span>
        <span className="label mt-1 xx-small fw-bold text-uppercase" style={{ letterSpacing: '0.5px' }}>Settings</span>
      </Link>
    </nav>
  );
};



export default Navigation;
