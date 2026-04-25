import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authService } from '../services/authService';
import { auth } from '../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { useSettings } from '../contexts/SettingsContext';
import { confirmLogout, confirmDeleteData, confirmDeleteAccount } from '../utils/alertUtils';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import GuestWarning from '../components/GuestWarning';
import { pushService } from '../services/pushService';

function Settings() {
  const [user, setUser] = useState(null);
  const isOnline = useOnlineStatus();
  const [loading, setLoading] = useState(true);
  const [isEditingName, setIsEditingName] = useState(false);
  const [newName, setNewName] = useState("");
  const [installPrompt, setInstallPrompt] = useState(null);
  const {
    themeMode, setThemeMode,
    voiceTone, setVoiceTone,
    fontFamily, setFontFamily
  } = useSettings();
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isPushLoading, setIsPushLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        setNewName(currentUser.displayName || "");

        // Check push status
        const status = await pushService.getSubscriptionStatus();
        setIsSubscribed(status);
      } else {
        navigate('/login');
      }
      setLoading(false);
    });

    const handleBeforeInstall = (e) => {
      e.preventDefault();
      setInstallPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    return () => {
      unsubscribe();
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, [navigate]);

  const handleLogout = () => {
    confirmLogout(navigate);
  };

  const handleUpdateName = async () => {
    if (!newName.trim()) return;
    try {
      await authService.updateDisplayName(newName);
      setUser({ ...user, displayName: newName });
      setIsEditingName(false);
    } catch (error) {
      alert("Failed to update name. Please try again.");
    }
  };

  const handleInstallApp = async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === 'accepted') {
      setInstallPrompt(null);
    }
  };

  const handleNotificationToggle = async () => {
    if (!user) return;
    setIsPushLoading(true);
    try {
      if (isSubscribed) {
        await pushService.unsubscribeUser(user.uid);
        setIsSubscribed(false);
      } else {
        const success = await pushService.subscribeUser(user.uid);
        setIsSubscribed(success);
      }
    } catch (error) {
      alert("Notification error: " + error.message);
    } finally {
      setIsPushLoading(false);
    }
  };

  const handleDeleteData = () => {
    confirmDeleteData(user.uid);
  };

  const handleDeleteAccount = () => {
    confirmDeleteAccount(user.uid, navigate);
  };

  if (loading) {
    return (
      <div className="vh-100 d-flex flex-column align-items-center justify-content-center bg-white">
        <div className="custom-spinner mb-3"></div>
        <p className="text-secondary small animate-pulse">loading your preferences...</p>
      </div>
    );
  }

  if (!user) return null;

  return (
    <>
      {user && user.isAnonymous && <GuestWarning />}
      <div className="journal-page min-vh-100 d-flex flex-column animate-fade-in" style={{ backgroundColor: 'var(--bg-primary)' }}>
        <header className="container py-4 border-bottom d-flex justify-content-between align-items-center">
          <button onClick={() => navigate('/journal')} className="btn btn-link text-dark text-decoration-none p-0 d-flex align-items-center justify-content-center hover-lift" style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'var(--bg-secondary)' }}>
            <span style={{ fontSize: '1.2rem', lineHeight: 1 }}>←</span>
          </button>
          <div className="fw-bold text-dark text-uppercase" style={{ fontSize: '0.85rem', letterSpacing: '2px' }}>Settings</div>
          <button onClick={handleLogout} className="btn btn-link text-dark text-decoration-none p-0 d-flex align-items-center justify-content-center hover-lift" style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'var(--bg-secondary)' }} title="Sign Out">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
              <polyline points="16 17 21 12 16 7"></polyline>
              <line x1="21" y1="12" x2="9" y2="12"></line>
            </svg>
          </button>
        </header>

        <main className="container flex-grow-1 py-5" style={{ maxWidth: '650px' }}>
          {/* Profile Section */}
          <section className="settings-section mb-5">
            <h3 className="h6 text-secondary text-uppercase mb-3" style={{ fontSize: '0.75rem', letterSpacing: '1px' }}>Your Profile</h3>
            <div className="d-flex align-items-center p-4 bg-white rounded-4 border shadow-sm mb-3">
              <div
                className="rounded-circle me-4 d-flex align-items-center justify-content-center bg-light text-dark fw-bold"
                style={{ width: '64px', height: '64px', fontSize: '1.2rem', border: '1px solid var(--border-color)' }}
              >
                {user.displayName?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U'}
              </div>
              <div className="text-truncate flex-grow-1">
                {isEditingName ? (
                  <div className="d-flex gap-2 align-items-center">
                    <input
                      type="text"
                      className="form-control form-control-sm border-0 bg-light"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      autoFocus
                    />
                    <button onClick={handleUpdateName} className="btn btn-sm btn-dark px-3">Save</button>
                    <button onClick={() => setIsEditingName(false)} className="btn btn-sm btn-link text-secondary text-decoration-none p-0">Cancel</button>
                  </div>
                ) : (
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <h4 className="m-0 h5 text-dark" style={{ fontWeight: 600 }}>{user.displayName}</h4>
                      <div className="d-flex align-items-center gap-1 mt-1" style={{ opacity: 0.6 }}>
                        <span className={`sync-dot ${isOnline ? 'sync-online' : 'sync-offline'}`}></span>
                        <span className="x-small">{isOnline ? 'Cloud Synced' : 'Offline Mode'}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => setIsEditingName(true)}
                      className="btn btn-link text-secondary text-decoration-none p-0 small"
                      style={{ fontSize: '0.8rem' }}
                    >
                      Edit Name
                    </button>
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* Preferences Section */}
          <section className="settings-section mb-5">
            <h3 className="h6 text-secondary text-uppercase mb-3" style={{ fontSize: '0.75rem', letterSpacing: '1px' }}>Personalization</h3>
            <div className="bg-white rounded-4 border shadow-sm">
              <div className="d-flex justify-content-between align-items-center p-4 border-bottom">
                <div>
                  <h5 className="m-0 h6 text-dark">App Theme</h5>
                  <p className="m-0 text-secondary x-small mt-1">Follow system settings or force dark/light.</p>
                </div>
                <div className="position-relative">
                  <select
                    className="form-select border-0 bg-light text-dark fw-500"
                    value={themeMode}
                    onChange={(e) => setThemeMode(e.target.value)}
                    style={{
                      appearance: 'none',
                      paddingRight: '2rem',
                      cursor: 'pointer',
                      borderRadius: '8px',
                      fontSize: '0.9rem'
                    }}
                  >
                    <option value="system">System Default</option>
                    <option value="light">Light Mode</option>
                    <option value="dark">Dark Mode</option>
                  </select>
                  <span className="position-absolute text-secondary" style={{ right: '10px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', fontSize: '0.8rem' }}>▼</span>
                </div>
              </div>
              <div className="d-flex justify-content-between align-items-center p-4 border-bottom">
                <div>
                  <h5 className="m-0 h6 text-dark">Voice Tone</h5>
                  <p className="m-0 text-secondary x-small mt-1">Select the voice for speech reflections.</p>
                </div>
                <div className="position-relative">
                  <select
                    className="form-select border-0 bg-light text-dark fw-500"
                    value={voiceTone}
                    onChange={(e) => setVoiceTone(e.target.value)}
                    style={{
                      appearance: 'none',
                      paddingRight: '2rem',
                      cursor: 'pointer',
                      borderRadius: '8px',
                      fontSize: '0.9rem'
                    }}
                  >
                    <option>Friendly</option>
                    <option>Formal</option>
                    <option>Natural</option>
                  </select>
                  <span className="position-absolute text-secondary" style={{ right: '10px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', fontSize: '0.8rem' }}>▼</span>
                </div>
              </div>
              <div className="d-flex justify-content-between align-items-center p-4">
                <div>
                  <h5 className="m-0 h6 text-dark">Font Family</h5>
                  <p className="m-0 text-secondary x-small mt-1">Customize the app's typography.</p>
                </div>
                <div className="position-relative">
                  <select
                    className="form-select border-0 bg-light text-dark fw-500"
                    value={fontFamily}
                    onChange={(e) => setFontFamily(e.target.value)}
                    style={{
                      appearance: 'none',
                      paddingRight: '2rem',
                      cursor: 'pointer',
                      borderRadius: '8px',
                      fontSize: '0.9rem'
                    }}
                  >
                    <option value="Poppins">Balanced (Default)</option>
                    <option value="Inter">Modern (Sans)</option>
                    <option value="Outfit">Clean (Geometric)</option>
                    <option value="Lora">Elegant (Serif)</option>
                    <option value="Garamond">Classic (Serif)</option>
                  </select>
                  <span className="position-absolute text-secondary" style={{ right: '10px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', fontSize: '0.8rem' }}>▼</span>
                </div>
              </div>
            </div>
          </section>

          {/* Help & Legal Section */}
          <section className="settings-section mb-5">
            <h3 className="h6 text-secondary text-uppercase mb-3" style={{ fontSize: '0.75rem', letterSpacing: '1px' }}>Support</h3>
            <div className="bg-white rounded-4 border shadow-sm">
              <Link to="/journal/help" className="d-flex justify-content-between align-items-center p-4 text-decoration-none transition-all hover-bg-light" style={{ color: 'var(--text-primary)' }}>
                <div>
                  <h5 className="m-0 h6 text-dark fw-600">Help & Legal</h5>
                  <p className="m-0 text-secondary x-small mt-1 text-uppercase fw-600 opacity-75" style={{ letterSpacing: '0.5px' }}>Support, Privacy, and Terms</p>
                </div>
                <span className="text-secondary opacity-50">→</span>
              </Link>
            </div>
          </section>

          {/* Danger Zone */}
          <section className="settings-section mb-5">
            <h3 className="h6 text-danger text-uppercase mb-3" style={{ fontSize: '0.75rem', letterSpacing: '1px' }}>Danger Zone</h3>
            <div className="bg-white rounded-4 border shadow-sm">
              <div className="p-4 border-bottom d-flex justify-content-between align-items-center">
                <div>
                  <h5 className="m-0 h6">Clear all thoughts</h5>
                  <p className="m-0 text-secondary x-small mt-1">Permanently remove all your entries.</p>
                </div>
                <button
                  onClick={handleDeleteData}
                  className="btn btn-outline-danger btn-sm px-3"
                >
                  Reset Journal
                </button>
              </div>
              <div className="p-4 d-flex justify-content-between align-items-center">
                <div>
                  <h5 className="m-0 h6">Delete Account</h5>
                  <p className="m-0 text-secondary x-small mt-1">Permanently delete your profile and all data.</p>
                </div>
                <button
                  onClick={handleDeleteAccount}
                  className="btn btn-danger btn-sm px-3"
                >
                  Delete Account
                </button>
              </div>
            </div>
          </section>

        </main>

        <footer className="container py-4 text-center border-top mt-auto" style={{ opacity: 0.6 }}>
          Thoughts Journaling App • Version 1.0.0
        </footer>
      </div>
    </>
  );
}

export default Settings;
