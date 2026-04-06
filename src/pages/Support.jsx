import React from 'react';
import { useNavigate } from 'react-router-dom';

function Support() {
  const navigate = useNavigate();

  return (
    <div className="journal-page min-vh-100 d-flex flex-column animate-fade-in" style={{ backgroundColor: 'var(--bg-primary)' }}>
      <header className="container py-4 border-bottom d-flex justify-content-between align-items-center">
        <button onClick={() => navigate('/journal/settings')} className="btn btn-link text-secondary text-decoration-none p-0 d-flex align-items-center gap-2">
          <span style={{ fontSize: '1.2rem' }}>←</span> 
          <span style={{ fontWeight: 500 }}>Settings</span>
        </button>
        <div className="fw-bold text-dark" style={{ fontSize: '1.2rem', letterSpacing: '-1px' }}>Help & Support</div>
        <div style={{ width: '80px' }}></div>
      </header>

      <main className="container flex-grow-1 py-5" style={{ maxWidth: '700px' }}>
        <section className="legal-section">
          <h1 className="h3 mb-4" style={{ fontWeight: 700, letterSpacing: '-1px' }}>How can we help?</h1>
          <p className="lead text-secondary mb-5">Everything you need to know about using Thoughts and managing your digital well-being.</p>
          
          <div className="row g-4 mb-5">
            <div className="col-md-6">
              <div className="p-4 bg-white rounded-4 border shadow-sm h-100">
                <h3 className="h6 text-dark mb-2">Getting Started</h3>
                <p className="x-small text-secondary mb-0">Learn how to create your first entry, use voice reflections, and customize your experience.</p>
              </div>
            </div>
            <div className="col-md-6">
              <div className="p-4 bg-white rounded-4 border shadow-sm h-100">
                <h3 className="h6 text-dark mb-2">Privacy & Security</h3>
                <p className="x-small text-secondary mb-0">How we protect your data and why your thoughts remain private to you alone.</p>
              </div>
            </div>
            <div className="col-md-6">
              <div className="p-4 bg-white rounded-4 border shadow-sm h-100">
                <h3 className="h6 text-dark mb-2">Offline Mode</h3>
                <p className="x-small text-secondary mb-0">Your journal works anywhere. Learn how data syncs when you're back online.</p>
              </div>
            </div>
            <div className="col-md-6">
              <div className="p-4 bg-white rounded-4 border shadow-sm h-100">
                <h3 className="h6 text-dark mb-2">Account Management</h3>
                <p className="x-small text-secondary mb-0">Managing your profile, changing fonts, and understanding data portability.</p>
              </div>
            </div>
          </div>

          <div className="bg-light p-5 rounded-4 border text-center">
            <h3 className="h5 text-dark mb-3">Still have questions?</h3>
            <p className="text-secondary mb-4">We're here to listen and help you on your journaling journey.</p>
            <a href="mailto:support@thoughts-app.com" className="btn btn-dark px-4 py-2 rounded-pill">Contact Support</a>
          </div>
        </section>
      </main>

      <footer className="container py-4 text-center border-top mt-auto" style={{ opacity: 0.6 }}>
         Thoughts Journaling App • Help Center
      </footer>
    </div>
  );
}

export default Support;
