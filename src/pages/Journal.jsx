import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { authService } from '../services/authService';
import { auth } from '../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import Navigation from '../components/Navigation';
import GuestWarning from '../components/GuestWarning';
import { journalService } from '../services/journalService';
import { useSettings } from '../contexts/SettingsContext';
import { confirmLogout } from '../utils/alertUtils';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import RichTextEditor from '../components/RichTextEditor';
import MoodSelector, { MOODS } from '../components/MoodSelector';

const getEntryPreview = (content) => {
  if (!content) return { title: '', body: '', hasMore: false };

  // Strip HTML tags for preview
  const plainText = content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  const MAX_BODY = 150;

  // Find the first sentence ending, or fallback to length
  let titleEnd = plainText.indexOf('.');
  if (titleEnd === -1 || titleEnd > 80) {
    titleEnd = Math.min(plainText.length, 60);
    const rawBody = plainText.substring(titleEnd).trim();
    return {
      title: plainText.substring(0, titleEnd) + (plainText.length > 60 ? '...' : ''),
      body: rawBody.length > MAX_BODY ? rawBody.substring(0, MAX_BODY) + '...' : rawBody,
      hasMore: rawBody.length > MAX_BODY
    };
  }
  const rawBody = plainText.substring(titleEnd + 1).trim();
  return {
    title: plainText.substring(0, titleEnd + 1),
    body: rawBody.length > MAX_BODY ? rawBody.substring(0, MAX_BODY) + '...' : rawBody,
    hasMore: rawBody.length > MAX_BODY
  };
};

const formatShortDate = (dateString) => {
  try {
    const date = new Date(dateString);
    if (isNaN(date)) return dateString.toUpperCase();
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).toUpperCase();
  } catch (e) {
    return dateString?.toUpperCase() || '';
  }
};

function Journal() {
  const [user, setUser] = useState(null);
  const isOnline = useOnlineStatus();
  const [loading, setLoading] = useState(true);
  const [fetchingEntries, setFetchingEntries] = useState(false);
  const [isWriting, setIsWriting] = useState(false);
  const [entries, setEntries] = useState([]);
  const [installPrompt, setInstallPrompt] = useState(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [newThought, setNewThought] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState("");
  const [releasingEntryId, setReleasingEntryId] = useState(null);
  const [mood, setMood] = useState(null);
  const [error, setError] = useState(null);
  const [isSavingEntity, setIsSavingEntity] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { isCompact } = useSettings();

  useEffect(() => {
    if (location.state?.startWriting) {
      setIsWriting(true);
      // Clear the state so it doesn't re-open on refresh
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  // Speech Recognition Logic
  let recognition = null;
  if ('webkitSpeechRecognition' in window) {
    recognition = new window.webkitSpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
  }

  const toggleRecording = () => {
    if (isRecording) {
      window.recognitionInstance?.stop();
      setIsRecording(false);
      setInterimTranscript("");
    } else {
      if (recognition) {
        recognition.onresult = (event) => {
          let currentInterim = "";
          for (let i = event.resultIndex; i < event.results.length; i++) {
            if (event.results[i].isFinal) {
              setNewThought(prev => prev + (prev ? ' ' : '') + event.results[i][0].transcript);
            } else {
              currentInterim += event.results[i][0].transcript;
            }
          }
          setInterimTranscript(currentInterim);
        };
        recognition.onend = () => {
          setIsRecording(false);
          setInterimTranscript("");
        };
        recognition.start();
        window.recognitionInstance = recognition;
        setIsRecording(true);
      } else {
        alert("Speech recognition isn't supported in this browser.");
      }
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setFetchingEntries(true);
        setError(null);
        try {
          // Initialize user doc
          await authService.ensureUserDocument(currentUser.uid);
          setUser(currentUser);
          
          const fetchedEntries = await journalService.getEntries(currentUser.uid);
          setEntries(fetchedEntries);
        } catch (err) {
          console.error("Error initializing journal:", err);
          setError("We couldn't load your journal. Please check your connection or try again.");
        } finally {
          setFetchingEntries(false);
        }
      } else {
        setUser(null);
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

  const handleSaveThought = async () => {
    const isActuallyEmpty = !newThought || newThought === '<p></p>' || newThought.replace(/<[^>]*>/g, '').trim() === '';
    if (!isActuallyEmpty && user) {
      setIsSavingEntity(true);
      try {
        const entryId = await journalService.saveEntry(user.uid, newThought, mood);
        const newEntry = {
          id: entryId,
          content: newThought,
          mood,
          dateString: new Date().toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric'
          }),
          createdAt: { toMillis: () => Date.now() }
        };
        setEntries([newEntry, ...entries]);
        setNewThought("");
        setMood(null);
        setIsWriting(false);
      } catch (error) {
        alert("Failed to save your thought. Please try again.");
      } finally {
        setIsSavingEntity(false);
      }
    }
  };

  const handleConfirmRelease = async (id, e) => {
    e.stopPropagation();
    try {
      await journalService.deleteEntry(id);
      setEntries(entries.filter(entry => entry.id !== id));
      setReleasingEntryId(null);
    } catch (error) {
      alert("Could not release this thought right now. Try again later.");
    }
  };

  const cancelRelease = (e) => {
    e.stopPropagation();
    setReleasingEntryId(null);
  };

  const initiateRelease = (id, e) => {
    e.stopPropagation();
    setReleasingEntryId(id);
  };

  if (loading) {
    return (
      <div className="vh-100 d-flex flex-column align-items-center justify-content-center bg-white">
        <div className="custom-spinner mb-3"></div>
        <p className="text-secondary small animate-pulse">centering your thoughts...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="vh-100 d-flex flex-column align-items-center justify-content-center bg-white p-4 text-center">
        <div className="mb-4" style={{ fontSize: '3rem', opacity: 0.3 }}>◌</div>
        <h2 className="h5 mb-3" style={{ fontWeight: 400 }}>{error}</h2>
        <div className="d-flex gap-3">
          <button onClick={() => window.location.reload()} className="btn btn-dark rounded-pill px-4">Retry</button>
          <Link to="/" className="btn btn-outline-secondary rounded-pill px-4">Home</Link>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <>
      {user && user.isAnonymous && <GuestWarning />}
      {isRecording && (
        <div className="focus-mode-overlay">
          <div className="thought-orb"></div>
          <div className="focus-transcript">
            {interimTranscript || "I'm listening..."}
          </div>
          <div className="focus-actions">
            <button
              onClick={toggleRecording}
              className="btn btn-outline-secondary rounded-pill px-5 py-3 shadow-sm d-flex align-items-center gap-2"
              style={{ fontSize: '1.2rem', backgroundColor: 'transparent', border: '1px solid var(--text-secondary)' }}
            >
              <span className="text-secondary">●</span> Done
            </button>
          </div>
        </div>
      )}
      <div className="journal-page w-100 min-vh-100 d-flex flex-md-row flex-column" style={{ backgroundColor: 'var(--bg-primary)' }}>

        {!isWriting && (
          <>
            {/* Desktop Sidebar */}
            <aside className="desktop-sidebar d-none d-md-flex flex-column justify-content-between py-5 px-4 border-end bg-transparent" style={{ width: '260px', height: '100vh', position: 'sticky', top: 0, zIndex: 100 }}>
              <div>
                <div className="mb-5 px-2">
                  <Link to="/" className="navbar-brand text-decoration-none">
                    <span className="thoughts-brand thoughts-brand--md">Thoughts.</span>
                  </Link>
                </div>
                <Navigation onAddEntry={() => setIsWriting(true)} isDesktop={true} />
              </div>

              <div className="profile-section mt-auto pt-4 border-top">
                <Link to="/journal/settings" className="d-flex align-items-center gap-3 p-2 rounded-3 text-decoration-none text-dark transition-all hover-bg-light">
                  <div
                    className="rounded-circle d-flex align-items-center justify-content-center bg-dark text-white fw-bold"
                    style={{ width: '36px', height: '36px', fontSize: '0.9rem', flexShrink: 0 }}
                  >
                    {user.displayName?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U'}
                  </div>
                  <div className="text-truncate">
                    <p className="m-0 small fw-bold" style={{ lineHeight: 1.2 }}>{user.displayName}</p>
                    <div className="d-flex align-items-center gap-1 mt-1" style={{ opacity: 0.6 }}>
                      <span className={`sync-dot ${isOnline ? 'sync-online' : 'sync-offline'}`}></span>
                      <span className="x-small">{isOnline ? 'Cloud Synced' : 'Offline Mode'}</span>
                    </div>
                  </div>
                </Link>
                <button
                  onClick={handleLogout}
                  className="btn btn-link text-danger text-decoration-none p-2 w-100 text-start small mt-1 d-flex gap-3 align-items-center"
                >
                  <span style={{ width: '36px' }}></span>
                  <span className="small fw-500">Logout</span>
                </button>
              </div>
            </aside>

            {/* Mobile Top Header (Minimal) */}
            <header className="mobile-header d-md-none d-flex justify-content-between align-items-center py-3 px-4 border-bottom shadow-sm sticky-top" style={{ zIndex: 100, backgroundColor: 'var(--element-bg)' }}>
              <div className="d-flex align-items-center gap-3">
                <div className={`sync-dot ${isOnline ? 'sync-online' : 'sync-offline'}`}></div>
                <Link to="/" className="navbar-brand text-decoration-none">
                  <span className="thoughts-brand">Thoughts.</span>
                </Link>
              </div>

              <div className="position-relative profile-menu-wrapper">
                <div
                  className="rounded-circle d-flex align-items-center justify-content-center bg-light text-dark fw-bold cursor-pointer transition-all"
                  style={{ width: '36px', height: '36px', fontSize: '0.9rem', border: '1px solid #eee' }}
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                >
                  {user.displayName?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U'}
                </div>

                {isProfileOpen && (
                  <div className="profile-dropdown position-absolute end-0 mt-2 p-2 shadow-lg border rounded-3 animate-fade-in" style={{ width: '160px', zIndex: 1100, backgroundColor: 'var(--element-bg)' }}>
                    <Link to="/journal/settings" className="dropdown-item p-2 text-dark text-decoration-none d-block rounded-2 small">Settings</Link>
                    <button onClick={handleLogout} className="dropdown-item p-2 text-danger text-decoration-none d-block w-100 text-start border-0 bg-transparent rounded-2 small">Logout</button>
                  </div>
                )}
              </div>
            </header>

            {/* Mobile Bottom Navigation */}
            <div className="d-md-none">
              <Navigation onAddEntry={() => setIsWriting(true)} isDesktop={false} />
            </div>
          </>
        )}

        <main className="flex-grow-1 animate-fade-in overflow-auto w-100" style={{ backgroundColor: 'var(--bg-primary)' }}>
          <div
            className={`mx-auto w-100 ${isWriting ? 'pt-4 px-3 px-md-4' : 'py-5 px-4 ps-md-5'}`}
            style={{ maxWidth: isWriting ? '950px' : '800px' }}
          >
            {/* Welcome Section */}
            {!isWriting && (
              <header className="mb-5">
                <h1 className="hero-title text-dark" style={{ fontSize: '2.4rem', letterSpacing: '-1.5px' }}>
                  {(() => {
                    const hour = new Date().getHours();
                    if (hour < 12) return "Good morning.";
                    if (hour < 18) return "Good afternoon.";
                    return "Good evening.";
                  })()} <br />
                  <span className="text-secondary" style={{ fontSize: '1.2rem', fontWeight: 400 }}>How are you holding up, {user.displayName?.split(' ')[0] || 'Friend'}?</span>
                </h1>
              </header>
            )}

            {/* Full Screen Editor View */}
            {isWriting ? (
              <div className="editor-container animate-fade-in w-100">
                <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 mb-md-5 pb-2 pb-md-3 w-100">

                  {/* Left Brand/Date */}
                  <div className="d-flex gap-2 gap-md-3 align-items-baseline" style={{ opacity: 0.5 }}>
                    <span className="d-none d-md-inline" style={{ fontSize: '1.2rem', fontFamily: "'Times New Roman', serif" }}>Thoughts</span>
                    <span className="small text-uppercase" style={{ letterSpacing: '1.5px', fontSize: '0.75rem' }}>
                      {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                  </div>

                  {/* Right Actions */}
                  <div className="d-flex gap-2 gap-md-4 align-items-center mt-2 mt-sm-0">
                    <button
                      onClick={() => setIsWriting(false)}
                      className="btn btn-link text-secondary text-decoration-none p-0 d-flex align-items-center gap-1"
                      style={{ fontWeight: 400, fontSize: '0.9rem' }}
                      title="Discard"
                    >
                      <span style={{ fontSize: '1.5rem', lineHeight: 1 }}>×</span>
                      <span className="d-none d-md-inline">Discard</span>
                    </button>

                    <button
                      onClick={toggleRecording}
                      className={`btn btn-link text-decoration-none p-0 d-flex align-items-center gap-2 ${isRecording ? 'text-danger pulse-record' : 'text-secondary'}`}
                      style={{ fontWeight: 400, fontSize: '0.9rem' }}
                    >
                      <span style={{ fontSize: '1.1rem' }}>{isRecording ? '●' : '◌'}</span>
                      <span className="d-none d-md-inline">{isRecording ? 'Listening...' : 'Speak'}</span>
                    </button>
                    
                    <button
                      onClick={handleSaveThought}
                      className="btn btn-dark px-4 py-2 d-flex justify-content-center align-items-center"
                      disabled={!newThought.trim() && !isRecording || isSavingEntity}
                      style={{ borderRadius: '4px', fontWeight: 500, fontSize: '0.9rem', minWidth: '80px' }}
                    >
                      {isSavingEntity ? <span className="loading-dots text-white" style={{ height: '18px' }}><span></span><span></span><span></span></span> : "Save"}
                    </button>
                  </div>
                </div>

                <div className="flex-grow-1 position-relative editor-scroll-container px-4">
                  {(!newThought || newThought === '<p></p>') && (
                    <div 
                      className="position-absolute translate-middle-x start-50 text-center animate-fade-in" 
                      style={{ top: '30%', pointerEvents: 'none', width: '100%', maxWidth: '300px', zIndex: 5 }}
                    >
                      <button 
                        onClick={() => navigate('/journal/guides')}
                        className="btn btn-minimal-outline btn-sm rounded-pill px-4"
                        style={{ pointerEvents: 'auto', opacity: 0.6 }}
                      >
                        Need inspiration?
                      </button>
                    </div>
                  )}
                  <RichTextEditor 
                    content={newThought} 
                    onChange={setNewThought}
                    placeholder="The unwritten title... Begin your reflection here..."
                  />
                </div>

                {/* Mood Selection at the bottom of editor for better flow, above the action buttons or in a dedicated section */}
                <div className="px-4 pb-4 animate-slide-up" style={{ borderTop: '1px solid var(--border-color)', paddingTop: '20px' }}>
                  <p className="small text-secondary mb-3 fw-500">How are you feeling?</p>
                  <MoodSelector selectedMood={mood} onSelect={setMood} />
                </div>
              </div>
            ) : (
              <div className="entries-list">
                {fetchingEntries ? (
                  <div className="text-center py-5">
                    <div className="custom-spinner mx-auto mb-3"></div>
                    <p className="text-secondary small animate-pulse">centering your thoughts...</p>
                  </div>
                ) : entries.length > 0 ? (
                  entries.map(entry => {
                    const preview = getEntryPreview(entry.content);
                    return (
                      <div
                        key={entry.id}
                        className={`timeline-entry animate-fade-in ${isCompact ? 'compact' : ''}`}
                        onClick={() => navigate(`/journal/view/${entry.id}`)}
                      >
                        <div className="timeline-meta">
                          <div className="d-flex align-items-center gap-2">
                            <time className="timeline-date">{formatShortDate(entry.dateString)}</time>
                            
                            {entry.mood && (
                              <div 
                                className="mood-indicator-dot" 
                                style={{ backgroundColor: MOODS.find(m => m.id === entry.mood)?.color }}
                                title={MOODS.find(m => m.id === entry.mood)?.label}
                              ></div>
                            )}

                            {!entry.createdAt && (
                              <span className="badge-sync-pending" title="Draft saved locally. Will sync to cloud when online.">
                                <span className="sync-dot sync-offline x-small"></span>
                                <span className="ms-1" style={{ fontSize: '0.65rem' }}>Syncing</span>
                              </span>
                            )}
                          </div>
                          <button
                            className="timeline-release-btn"
                            onClick={(e) => initiateRelease(entry.id, e)}
                            title="Release this thought"
                          >
                            ×
                          </button>
                        </div>

                        <div className="timeline-content">
                          <h2 className="timeline-title">{preview.title}</h2>
                          <p className="timeline-body m-0">{preview.body}</p>
                          {preview.hasMore && (
                            <span className="timeline-continue">Continue reading →</span>
                          )}
                        </div>

                        {releasingEntryId === entry.id && (
                          <div className="confirm-release-overlay position-absolute top-0 start-0 w-100 h-100 d-flex flex-column align-items-center justify-content-center p-3 text-center">
                            <p className="small mb-3 fw-500">Release this thought forever?</p>
                            <div className="d-flex gap-3">
                              <button
                                className="btn btn-sm btn-link text-dark text-decoration-none"
                                onClick={(e) => cancelRelease(e)}
                              >
                                Keep it
                              </button>
                              <button
                                className="btn btn-sm btn-dark rounded-pill px-3"
                                onClick={(e) => handleConfirmRelease(entry.id, e)}
                              >
                                Release
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-5">
                    <div className="mb-4" style={{ fontSize: '3rem', opacity: 0.5 }}>◌</div>
                    <h2 className="h4 mb-2" style={{ fontWeight: 400 }}>A quiet space for you.</h2>
                    <p className="text-secondary px-4" style={{ maxWidth: '400px', margin: '0 auto' }}>
                      There is no right or wrong way to write. I'm here whenever you're ready to share.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Floating PWA Install Prompt */}
      {installPrompt && (
        <div className="pwa-floating-prompt animate-slide-up">
           <div className="d-flex align-items-center justify-content-between gap-4 p-3 bg-white rounded-pill border shadow-lg" style={{ minWidth: '280px' }}>
              <div className="d-flex align-items-center gap-3 ps-2">
                 <span style={{ fontSize: '1.2rem' }}>✦</span>
                 <div className="lh-1">
                    <p className="m-0 small fw-bold">Thoughts.</p>
                    <p className="m-0 x-small text-secondary">Install on your home screen</p>
                 </div>
              </div>
              <div className="d-flex gap-2 pe-1">
                 <button onClick={() => setInstallPrompt(null)} className="btn btn-sm btn-link text-secondary text-decoration-none x-small">Later</button>
                 <button 
                  onClick={() => {
                    installPrompt.prompt();
                    installPrompt.userChoice.then(() => setInstallPrompt(null));
                  }} 
                  className="btn btn-sm btn-dark rounded-pill px-3 x-small"
                >
                  Install
                </button>
              </div>
           </div>
        </div>
      )}
    </>
  );
}

export default Journal;
