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
    isDarkMode, setIsDarkMode,
    isCompact, setIsCompact,
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
          <button onClick={() => navigate('/journal')} className="btn btn-link text-secondary text-decoration-none p-0 d-flex align-items-center gap-2">
            <span style={{ fontSize: '1.2rem' }}>←</span>
            <span style={{ fontWeight: 500 }}>Return</span>
          </button>
          <div className="fw-bold text-dark" style={{ fontSize: '1.2rem', letterSpacing: '-1px' }}>Settings</div>
          <div style={{ width: '80px' }}></div>
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
                  <h5 className="m-0 h6 text-dark">Night Mode</h5>
                  <p className="m-0 text-secondary x-small mt-1">Calming dark aesthetics for your eyes.</p>
                </div>
                <div className="form-check form-switch m-0">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    role="switch"
                    checked={isDarkMode}
                    onChange={() => setIsDarkMode(!isDarkMode)}
                  />
                </div>
              </div>
              <div className="d-flex justify-content-between align-items-center p-4 border-bottom">
                <div>
                  <h5 className="m-0 h6 text-dark">Compact View</h5>
                  <p className="m-0 text-secondary x-small mt-1">Show more thoughts on one screen.</p>
                </div>
                <div className="form-check form-switch m-0">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    role="switch"
                    checked={isCompact}
                    onChange={() => setIsCompact(!isCompact)}
                  />
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

          {/* Notifications Section */}
          <section className="settings-section mb-5">
            <h3 className="h6 text-secondary text-uppercase mb-3" style={{ fontSize: '0.75rem', letterSpacing: '1px' }}>Notifications</h3>
            <div className="bg-white rounded-4 border shadow-sm">
              <div className="d-flex justify-content-between align-items-center p-4">
                <div>
                  <h5 className="m-0 h6 text-dark inline-flex align-items-center gap-2">
                    Mindful Reminders
                    <span className="badge bg-secondary-subtle text-secondary border fw-normal x-small ms-2" style={{ padding: '3px 8px', borderRadius: '4px' }}>Coming Soon</span>
                  </h5>
                  <p className="m-0 text-secondary x-small mt-1">Receive gentle daily reminders to reflect.</p>
                </div>
                <div className="text-secondary opacity-50" style={{ fontSize: '1.2rem' }}>◌</div>
              </div>
            </div>
          </section>

          {/* App Support Section */}
          <section className="settings-section mb-5">
            <h3 className="h6 text-secondary text-uppercase mb-3" style={{ fontSize: '0.75rem', letterSpacing: '1px' }}>App Experience</h3>
            <div className="bg-white rounded-4 border shadow-sm">

              <div className="d-flex justify-content-between align-items-center p-4 border-bottom">
                <div>
                  <h5 className="m-0 h6 text-dark font-primary">Mobile Experience</h5>
                  <p className="m-0 text-secondary x-small mt-1">Get a standalone app on your home screen.</p>
                </div>
                <button
                  onClick={handleInstallApp}
                  className={`btn btn-sm ${installPrompt ? 'btn-dark' : 'btn-outline-secondary disabled'}`}
                  disabled={!installPrompt}
                >
                  {installPrompt ? 'Install App' : 'Installed'}
                </button>
              </div>
              <div className="d-flex justify-content-between align-items-center p-4">
                <div>
                  <h5 className="m-0 h6 text-dark">Developer Check</h5>
                  <p className="m-0 text-secondary x-small mt-1">Current version and system status.</p>
                </div>
                <span className="badge bg-light text-dark fw-normal border">v1.0.0 Stable</span>
              </div>
            </div>
          </section>

          {/* Legal Section */}
          <section className="settings-section mb-5">
            <h3 className="h6 text-secondary text-uppercase mb-3" style={{ fontSize: '0.75rem', letterSpacing: '1px' }}>Support & Legal</h3>
            <div className="bg-white rounded-4 border shadow-sm">
              <Link to="/journal/support" className="d-flex justify-content-between align-items-center p-4 border-bottom text-decoration-none" style={{ color: 'var(--text-primary)' }}>
                <div>
                  <h5 className="m-0 h6 text-dark">Help & Support</h5>
                  <p className="m-0 text-secondary x-small mt-1">Frequently asked questions and resources.</p>
                </div>
                <span className="text-secondary">→</span>
              </Link>
              <Link to="/privacy" className="d-flex justify-content-between align-items-center p-4 border-bottom text-decoration-none" style={{ color: 'var(--text-primary)' }}>
                <div>
                  <h5 className="m-0 h6 text-dark">Privacy Policy</h5>
                  <p className="m-0 text-secondary x-small mt-1">How we handle your data.</p>
                </div>
                <span className="text-secondary">→</span>
              </Link>
              <Link to="/terms" className="d-flex justify-content-between align-items-center p-4 border-bottom text-decoration-none" style={{ color: 'var(--text-primary)' }}>
                <div>
                  <h5 className="m-0 h6 text-dark">Terms of Service</h5>
                  <p className="m-0 text-secondary x-small mt-1">Rules of using Thoughts.</p>
                </div>
                <span className="text-secondary">→</span>
              </Link>
              <Link to="/popi" className="d-flex justify-content-between align-items-center p-4 text-decoration-none" style={{ color: 'var(--text-primary)' }}>
                <div>
                  <h5 className="m-0 h6 text-dark">POPI Act Compliance</h5>
                  <p className="m-0 text-secondary x-small mt-1">South African data protection.</p>
                </div>
                <span className="text-secondary">→</span>
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

          {/* Logout */}
          <div className="text-center mt-5 pt-4">
            <button onClick={handleLogout} className="btn-minimal-outline border-0 text-secondary d-inline-flex align-items-center gap-2">
              Sign out of <span className="thoughts-brand thoughts-brand--xs">Thoughts.</span>
            </button>
          </div>
        </main>

        <footer className="container py-4 text-center border-top mt-auto" style={{ opacity: 0.6 }}>
          Thoughts Journaling App • Version 1.0.0
        </footer>
      </div>
    </>
  );
}

export default Settings;
