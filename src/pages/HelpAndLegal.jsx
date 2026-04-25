import React from 'react';
import { useNavigate, Link } from 'react-router-dom';

function HelpAndLegal() {
  const navigate = useNavigate();

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

  return (
    <div className="journal-page min-vh-100 d-flex flex-column animate-fade-in" style={{ backgroundColor: 'var(--bg-primary)' }}>
      <header className="container py-4 border-bottom d-flex justify-content-between align-items-center">
        <button onClick={() => navigate('/journal/settings')} className="btn btn-link text-secondary text-decoration-none p-0 d-flex align-items-center gap-2">
          <span style={{ fontSize: '1.2rem' }}>←</span>
          <span style={{ fontWeight: 500 }}>Settings</span>
        </button>
        <div className="fw-bold text-dark" style={{ fontSize: '1.1rem', letterSpacing: '-0.5px' }}>Help & Legal</div>
        <div style={{ width: '80px' }}></div>
      </header>

      <main className="container py-5" style={{ maxWidth: '650px' }}>
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
                <span className="text-secondary opacity-50">→</span>
              </Link>
            ))}
          </div>
        </section>

        <footer className="mt-5 text-center pt-4" style={{ opacity: 0.5 }}>
          <p className="x-small text-secondary mb-1">THOUGHTS JOURNALING APP</p>
          <p className="x-small text-secondary m-0">v1.0.0 Stable Build</p>
        </footer>
      </main>
    </div>
  );
}

export default HelpAndLegal;
