import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { auth } from '../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import Navigation from '../components/Navigation';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { confirmLogout } from '../utils/alertUtils';

function HelpAndLegal() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const isOnline = useOnlineStatus();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
      } else {
        navigate('/login');
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [navigate]);

  const handleLogout = () => {
    confirmLogout(navigate);
  };

  const legalLinks = [
    { 
      title: "Help & Support", 
      desc: "Frequently asked questions and resources.", 
      to: "/journal/support" 
    },
    { 
      title: "Privacy Policy", 
      desc: "How we handle your data.", 
      to: "/privacy" 
    },
    { 
      title: "Terms of Service", 
      desc: "Rules of using Thoughts.", 
      to: "/terms" 
    },
    { 
      title: "POPI Act Compliance", 
      desc: "South African data protection.", 
      to: "/popi" 
    }
  ];

  if (loading) {
    return (
      <div className="vh-100 d-flex flex-column align-items-center justify-content-center" style={{ backgroundColor: 'var(--bg-primary)' }}>
        <div className="custom-spinner mb-3"></div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="journal-page w-100 min-vh-100 d-flex flex-md-row flex-column" style={{ backgroundColor: 'var(--bg-primary)' }}>

      {/* Desktop Sidebar */}
      <aside className="desktop-sidebar d-none d-md-flex flex-column justify-content-between py-5 px-4 border-end bg-transparent" style={{ width: '260px', height: '100vh', position: 'sticky', top: 0, zIndex: 100 }}>
        <div>
          <div className="mb-5 px-2">
            <Link to="/journal" className="navbar-brand text-decoration-none">
              <span className="thoughts-brand thoughts-brand--md">Thoughts.</span>
            </Link>
          </div>
          <Navigation isDesktop={true} />
        </div>

        <div className="profile-section mt-auto pt-4 border-top">
          <div className="d-flex flex-column gap-3">
            <Link to="/journal/settings" className="sidebar-profile-card">
              <div className="profile-avatar">
                {user.displayName?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U'}
              </div>
              <div className="profile-info">
                <p className="profile-name">{user.displayName}</p>
              </div>
            </Link>
            <button onClick={handleLogout} className="sidebar-logout-btn">
              Logout
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Bottom Navigation */}
      <div className="d-md-none">
        <Navigation isDesktop={false} />
      </div>

      {/* Main Content */}
      <main className="flex-grow-1 animate-fade-in overflow-auto w-100" style={{ backgroundColor: 'var(--bg-primary)' }}>
        <div className="py-5 px-4 ps-md-5 mx-auto" style={{ maxWidth: '650px' }}>

          <h2 className="fw-bold text-dark text-uppercase mb-5" style={{ fontSize: '0.85rem', letterSpacing: '2px' }}>Help & Legal</h2>

          <section className="settings-section">
            <h3 className="h6 text-secondary text-uppercase mb-3" style={{ fontSize: '0.75rem', letterSpacing: '1px' }}>Support & Legal</h3>
            <div className="bg-white rounded-4 border shadow-sm overflow-hidden">
              {legalLinks.map((link, index) => (
                <Link 
                  key={index} 
                  to={link.to} 
                  className={`d-flex justify-content-between align-items-center p-4 text-decoration-none transition-all hover-bg-light ${index !== legalLinks.length - 1 ? 'border-bottom' : ''}`}
                  style={{ color: 'var(--text-primary)' }}
                >
                  <div>
                    <h5 className="m-0 h6 text-dark fw-600">{link.title}</h5>
                    <p className="m-0 text-secondary x-small mt-1 text-uppercase fw-600 opacity-75" style={{ letterSpacing: '0.5px' }}>{link.desc}</p>
                  </div>
                  <span className="text-secondary opacity-50">&rarr;</span>
                </Link>
              ))}
            </div>
          </section>

          <footer className="mt-5 text-center pt-4" style={{ opacity: 0.5 }}>
            <p className="x-small text-secondary mb-1">THOUGHTS JOURNALING APP</p>
            <p className="x-small text-secondary m-0">v1.0.0 Stable Build</p>
          </footer>
        </div>
      </main>
    </div>
  );
}

export default HelpAndLegal;
