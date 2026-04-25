import React, { useState, useEffect, useRef } from 'react';
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
import RichTextEditor, { EditorTools } from '../components/RichTextEditor';
import MoodSelector, { MOODS } from '../components/MoodSelector';
import TemplateSelector from '../components/TemplateSelector';
import DesignSelector from '../components/DesignSelector';
import confetti from 'canvas-confetti';


const isOnlyEmojis = (htmlContent) => {
  if (!htmlContent) return false;
  const plainText = htmlContent.replace(/<[^>]*>/g, '').replace(/\s+/g, '');
  if (!plainText) return false;
  return /^[\p{Emoji_Presentation}\p{Extended_Pictographic}]+$/u.test(plainText);
};

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

const formatListDate = (dateString) => {
  try {
    const date = new Date(dateString);
    if (isNaN(date)) return { day: '', number: '' };
    return {
      day: date.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase(),
      number: date.getDate()
    };
  } catch (e) {
    return { day: '', number: '' };
  }
};

const extractFirstImage = (htmlContent) => {
  if (!htmlContent) return null;
  const match = htmlContent.match(/<img[^>]+src="([^">]+)"/);
  return match ? match[1] : null;
};

const calculateStats = (entries) => {
  if (entries.length === 0) return { streak: 0 };

  const sortedDates = Array.from(new Set(entries.map(e => {
    const d = e.createdAt?.toDate ? e.createdAt.toDate() : new Date(e.dateString);
    return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  }))).sort((a, b) => b - a);

  let streak = 0;
  const today = new Date();
  const startDay = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
  const oneDay = 86400000;

  let currentCheck = startDay;
  if (!sortedDates.includes(startDay)) {
    currentCheck -= oneDay;
  }

  for (const date of sortedDates) {
    if (date === currentCheck) {
      streak++;
      currentCheck -= oneDay;
    } else if (date < currentCheck) {
      break;
    }
  }

  return { streak };
};

const DRAFT_KEY = 'thoughts_draft';

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
  const [design, setDesign] = useState('minimal');
  const [error, setError] = useState(null);
  const [isSavingEntity, setIsSavingEntity] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showDesigns, setShowDesigns] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [draftStatus, setDraftStatus] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [userStreakGoal, setUserStreakGoal] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { isCompact } = useSettings();

  const editorRef = useRef(null);
  const recognitionRef = useRef(null);
  const draftTimerRef = useRef(null);
  const moreMenuRef = useRef(null);

  const clearDraft = () => {
    try { localStorage.removeItem(DRAFT_KEY); } catch (e) { /* noop */ }
    setDraftStatus(null);
  };

  const saveDraft = (content, currentMood, currentDesign) => {
    const isEmpty = !content || content === '<p></p>' || content.replace(/<[^>]*>/g, '').trim() === '';
    if (isEmpty) return;
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify({
        content,
        mood: currentMood,
        design: currentDesign,
        timestamp: Date.now()
      }));
      setDraftStatus('saved');
      setTimeout(() => setDraftStatus(null), 2000);
    } catch (e) { /* storage full or unavailable */ }
  };

  // Restore draft when entering writing mode
  useEffect(() => {
    if (!isWriting) return;
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (!raw) return;
      const draft = JSON.parse(raw);
      const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
      if (draft.timestamp < oneDayAgo) {
        clearDraft();
        return;
      }
      const currentIsEmpty = !newThought || newThought === '<p></p>' || newThought.replace(/<[^>]*>/g, '').trim() === '';
      if (currentIsEmpty && draft.content) {
        setNewThought(draft.content);
        if (draft.mood) setMood(draft.mood);
        if (draft.design) setDesign(draft.design);
        if (editorRef.current) {
          editorRef.current.commands.setContent(draft.content);
        }
        setDraftStatus('restored');
        setTimeout(() => setDraftStatus(null), 3000);
      }
    } catch (e) { /* corrupted draft */ }
  }, [isWriting]);

  // Auto-save draft every 3 seconds while writing
  useEffect(() => {
    if (!isWriting) {
      if (draftTimerRef.current) clearInterval(draftTimerRef.current);
      return;
    }
    draftTimerRef.current = setInterval(() => {
      const content = editorRef.current ? editorRef.current.getHTML() : newThought;
      saveDraft(content, mood, design);
    }, 3000);
    return () => {
      if (draftTimerRef.current) clearInterval(draftTimerRef.current);
    };
  }, [isWriting, mood, design, newThought]);

  useEffect(() => {
    if (location.state?.startWriting) {
      setIsWriting(true);
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  // Speech Recognition Initialization
  const shouldRecordRef = useRef(false);

  useEffect(() => {
    const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;

      recognition.onresult = (event) => {
        let currentInterim = "";
        let finalTranscripts = "";

        for (let i = event.resultIndex; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            finalTranscripts += event.results[i][0].transcript + " ";
          } else {
            currentInterim += event.results[i][0].transcript;
          }
        }

        if (finalTranscripts && editorRef.current) {
          editorRef.current.chain().focus('end').insertContent(finalTranscripts).run();
          setNewThought(editorRef.current.getHTML());
        }
        setInterimTranscript(currentInterim);
      };

      recognition.onerror = (event) => {
        if (event.error === 'not-allowed' || event.error === 'network') {
          shouldRecordRef.current = false;
          setIsRecording(false);
          setInterimTranscript("");
        }
      };

      recognition.onend = () => {
        if (shouldRecordRef.current) {
          try {
            recognition.start();
          } catch (e) {
            shouldRecordRef.current = false;
            setIsRecording(false);
            setInterimTranscript("");
          }
        } else {
          setIsRecording(false);
          setInterimTranscript("");
        }
      };

      recognitionRef.current = recognition;
    }

    return () => {
      shouldRecordRef.current = false;
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch (e) { /* noop */ }
      }
    };
  }, []);

  const toggleRecording = () => {
    if (isRecording) {
      shouldRecordRef.current = false;
      recognitionRef.current?.stop();
      setIsRecording(false);
      setInterimTranscript("");
    } else {
      if (recognitionRef.current) {
        try {
          shouldRecordRef.current = true;
          recognitionRef.current.start();
          setIsRecording(true);
        } catch (e) {
          shouldRecordRef.current = false;
          setIsRecording(false);
        }
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

          // Store the streak in the database
          const stats = calculateStats(fetchedEntries);
          authService.updateUserStreak(currentUser.uid, stats.streak);

          // Get user streak goal
          const userData = await authService.getUserData(currentUser.uid);
          setUserStreakGoal(userData?.streakGoal || null);
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
        const entryId = await journalService.saveEntry(user.uid, newThought, mood, design);
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
        const newEntries = [newEntry, ...entries];
        setEntries(newEntries);
        const currentStreak = calculateStats(newEntries).streak;

        clearDraft();
        setNewThought("");
        setMood(null);
        setDesign('minimal');
        setIsWriting(false);

        navigate('/journal/celebration', { 
          state: { 
            isFirst: entries.length === 0,
            streak: currentStreak,
            hasGoal: !!userStreakGoal,
            goal: userStreakGoal 
          } 
        });
      } catch (error) {
        alert("Failed to save your thought. Please try again.");
      } finally {
        setIsSavingEntity(false);
      }
    }
  };

  const handleDiscard = () => {
    clearDraft();
    setNewThought("");
    setMood(null);
    setDesign('minimal');
    setIsWriting(false);
  };

  const handleApplyTemplate = (templateContent, templateDesign) => {
    if (editorRef.current) {
      if (templateDesign) {
        setDesign(templateDesign);
      }
      const currentContent = editorRef.current.getHTML();
      const isEmpty = !currentContent || currentContent === '<p></p>' || currentContent.replace(/<[^>]*>/g, '').trim() === '';

      if (isEmpty) {
        editorRef.current.commands.setContent(templateContent);
      } else {
        editorRef.current.chain().focus('end').insertContent('<br/>' + templateContent).run();
      }

      setNewThought(editorRef.current.getHTML());
    }
  };

  const handleConfirmRelease = async (id, e) => {
    e.stopPropagation();
    try {
      await journalService.deleteEntry(id);
      
      const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.8 },
        colors: isDark 
            ? ['#EAEAEA', '#FFFFFF', '#A0A0A0', '#4A4A4A'] 
            : ['#2C2C2C', '#000000', '#646464', '#A0A0A0']
      });
      
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

  const filteredEntries = entries.filter(entry => {
    const preview = getEntryPreview(entry.content);
    const searchLower = searchQuery.toLowerCase();
    const contentText = entry.content ? entry.content.replace(/<[^>]*>/g, ' ').toLowerCase() : "";

    return (
      preview.title.toLowerCase().includes(searchLower) ||
      preview.body.toLowerCase().includes(searchLower) ||
      contentText.includes(searchLower) ||
      (entry.mood && entry.mood.toLowerCase().includes(searchLower))
    );
  });

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
                  <Link to="/journal" className="navbar-brand text-decoration-none">
                    <span className="thoughts-brand thoughts-brand--md">Thoughts.</span>
                  </Link>
                </div>
                <Navigation onAddEntry={() => setIsWriting(true)} isDesktop={true} />
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
                  <button
                    onClick={handleLogout}
                    className="sidebar-logout-btn"
                  >
                    Logout
                  </button>
                </div>
              </div>
            </aside>

            {/* Mobile Top Header (Minimal) */}
            <header className="mobile-header d-md-none d-flex justify-content-between align-items-center py-3 px-4 border-bottom shadow-sm sticky-top" style={{ zIndex: 100, backgroundColor: 'var(--element-bg)' }}>
              <div className="d-flex align-items-center gap-3">
                <div className={`sync-dot ${isOnline ? 'sync-online' : 'sync-offline'}`}></div>
                <Link to="/journal" className="navbar-brand text-decoration-none">
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
            {/* Search Section */}
            {!isWriting && (
              <header className="mb-5 d-flex gap-3 align-items-center">
                <div className="search-wrapper position-relative animate-fade-in flex-grow-1">
                  <div className="search-icon-box position-absolute start-0 top-50 translate-middle-y ps-4 text-secondary" style={{ opacity: 0.5, pointerEvents: 'none' }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                  </div>
                  <input
                    type="text"
                    className="form-control border-0 bg-light rounded-pill py-3 ps-5 pe-5"
                    placeholder="Search your thoughts..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{
                      fontSize: '1.05rem',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
                      height: '56px',
                      transition: 'all 0.3s ease',
                      backgroundColor: 'var(--bg-secondary) !important'
                    }}
                  />
                  {searchQuery && (
                    <button
                      className="position-absolute end-0 top-50 translate-middle-y border-0 bg-transparent pe-4 text-secondary hover-text-dark"
                      onClick={() => setSearchQuery("")}
                      style={{ transition: 'all 0.2s ease', outline: 'none' }}
                      title="Clear search"
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    </button>
                  )}
                </div>
                <Link
                  to="/journal/streak"
                  className="d-flex align-items-center justify-content-center gap-1 rounded-pill bg-white border text-decoration-none transition-all hover-lift animate-fade-in"
                  style={{ height: '56px', padding: '0 20px', minWidth: '80px', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}
                  title="View Streak Calendar"
                >
                  <span style={{ fontSize: '1.2rem', color: 'var(--text-primary)' }}>✦</span>
                  <span className="fw-bold text-dark" style={{ fontSize: '1rem' }}>{calculateStats(entries).streak}</span>
                </Link>
              </header>
            )}

            {/* Full Screen Editor View */}
            {isWriting ? (
              <div className="editor-container animate-fade-in w-100">
                {/* Minimal Top Bar */}
                <div className="d-flex justify-content-between align-items-center mb-3 mb-md-4 w-100">

                  {/* Left: Date + draft status */}
                  <div className="d-flex gap-2 align-items-center" style={{ opacity: 0.4 }}>
                    <span className="small text-uppercase" style={{ letterSpacing: '1.5px', fontSize: '0.7rem', fontWeight: 500 }}>
                      {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                    </span>
                    {draftStatus && (
                      <span className="animate-fade-in" style={{ fontSize: '0.7rem', fontWeight: 400, opacity: 0.8, letterSpacing: '0.3px' }}>
                        {draftStatus === 'restored' ? 'Draft restored' : 'Draft saved'}
                      </span>
                    )}
                  </div>

                  {/* Right: X, Bullet, Emoji, Dropdown, Save */}
                  <div className="d-flex gap-1 align-items-center">
                    <button
                      onClick={handleDiscard}
                      className="btn-editor-tool"
                      title="Discard"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    </button>

                    <div style={{ width: '1px', height: '16px', background: 'var(--border-color)', margin: '0 2px' }}></div>

                    <EditorTools editor={editorRef.current} />

                    {/* 3-dot More Menu */}
                    <div className="position-relative" ref={moreMenuRef}>
                      <button
                        onClick={() => setShowMoreMenu(!showMoreMenu)}
                        className="btn-editor-tool"
                        title="More options"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="5" r="2"></circle><circle cx="12" cy="12" r="2"></circle><circle cx="12" cy="19" r="2"></circle></svg>
                      </button>

                      {showMoreMenu && (
                        <>
                          <div className="editor-more-backdrop" onClick={() => setShowMoreMenu(false)}></div>
                          <div className="editor-more-dropdown animate-fade-in">
                            <button
                              onClick={() => { toggleRecording(); setShowMoreMenu(false); }}
                              className={`editor-more-item ${isRecording ? 'recording' : ''}`}
                            >
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" x2="12" y1="19" y2="22"></line></svg>
                              <span>{isRecording ? 'Stop Recording' : 'Voice Input'}</span>
                            </button>
                            <button
                              onClick={() => { setShowDesigns(true); setShowMoreMenu(false); }}
                              className="editor-more-item"
                            >
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2"></rect><path d="M3 9h18"></path><path d="M9 21V9"></path></svg>
                              <span>Design</span>
                            </button>
                            <button
                              onClick={() => { setShowTemplates(true); setShowMoreMenu(false); }}
                              className="editor-more-item"
                            >
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>
                              <span>Templates</span>
                            </button>
                          </div>
                        </>
                      )}
                    </div>

                    <div style={{ width: '1px', height: '16px', background: 'var(--border-color)', margin: '0 2px' }}></div>

                    <button
                      onClick={handleSaveThought}
                      className="btn-editor-tool btn-editor-save"
                      disabled={(!newThought.trim() || newThought === '<p></p>') && !isRecording || isSavingEntity}
                      title="Save"
                    >
                      {isSavingEntity
                        ? <span className="loading-dots" style={{ height: '16px' }}><span></span><span></span><span></span></span>
                        : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                      }
                    </button>
                  </div>
                </div>

                {showTemplates && (
                  <TemplateSelector
                    onSelect={handleApplyTemplate}
                    onClose={() => setShowTemplates(false)}
                  />
                )}

                {showDesigns && (
                  <DesignSelector
                    selectedDesign={design}
                    onSelect={setDesign}
                    onClose={() => setShowDesigns(false)}
                  />
                )}

                <div className="px-0 px-md-4 mb-2 animate-fade-in">
                  <div className="d-flex justify-content-between align-items-baseline mb-2">
                    <p className="small text-secondary m-0 fw-500" style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Current Mood</p>
                    {mood && (
                      <button
                        onClick={() => setMood(null)}
                        className="btn btn-link text-secondary text-decoration-none p-0"
                        style={{ fontSize: '0.7rem', fontWeight: 400 }}
                      >
                        Clear
                      </button>
                    )}
                  </div>
                  <MoodSelector selectedMood={mood} onSelect={setMood} compact={true} />
                  <div style={{ width: '100%', height: '1px', background: 'var(--border-color)', marginTop: '16px', opacity: 0.5 }}></div>
                </div>

                {/* Writing Area */}
                <div className="flex-grow-1 position-relative editor-scroll-container px-0 px-md-4" style={{ paddingTop: '16px' }}>
                  {(!newThought || newThought === '<p></p>') && (
                    <div
                      className="position-absolute translate-middle-x start-50 text-center animate-fade-in"
                      style={{ top: '38%', pointerEvents: 'none', width: '100%', maxWidth: '380px', zIndex: 5 }}
                    >
                      <p className="mb-3" style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 300, lineHeight: 1.6, fontStyle: 'italic' }}>
                        {(() => {
                          const prompts = [
                            "What's on your mind right now?",
                            "What moment from today do you want to remember?",
                            "What would you tell your future self?",
                            "What are you grateful for in this moment?",
                            "What's something you need to let go of?",
                            "Describe how you feel, without judgement.",
                          ];
                          const index = Math.floor(Date.now() / 60000) % prompts.length;
                          return prompts[index];
                        })()}
                      </p>
                      <button
                        onClick={() => setShowTemplates(true)}
                        className="btn btn-link text-secondary text-decoration-none p-0"
                        style={{ pointerEvents: 'auto', opacity: 0.5, fontSize: '0.8rem', fontWeight: 500 }}
                      >
                        or try a template
                      </button>
                    </div>
                  )}
                  <RichTextEditor
                    content={newThought}
                    onChange={setNewThought}
                    editorRef={editorRef}
                    design={design}
                    placeholder="Begin writing..."
                  />
                </div>
              </div>


            ) : (
              <div className="entries-list">
                {fetchingEntries ? (
                  <div className="text-center py-5">
                    <div className="custom-spinner mx-auto mb-3"></div>
                    <p className="text-secondary small animate-pulse">centering your thoughts...</p>
                  </div>
                ) : filteredEntries.length > 0 ? (
                  filteredEntries.map(entry => {
                    const preview = getEntryPreview(entry.content);
                    const isEmojiOnly = isOnlyEmojis(entry.content);
                    return (
                      <div
                        key={entry.id}
                        className={`list-entry animate-fade-in ${isCompact ? 'compact' : ''}`}
                        onClick={() => navigate(`/journal/view/${entry.id}`)}
                      >
                        <div className="list-entry-date">
                          <span className="list-day">{formatListDate(entry.dateString).day}</span>
                          <span className="list-number">{formatListDate(entry.dateString).number}</span>
                          {!entry.createdAt && (
                            <div className="list-sync-pending mt-1" title="Syncing...">
                              <span className="sync-dot sync-offline"></span>
                            </div>
                          )}
                        </div>

                        <div className="list-entry-content">
                          {isEmojiOnly ? (
                            <div className="timeline-emoji-only animate-fade-in">{entry.content.replace(/<[^>]*>/g, '').trim()}</div>
                          ) : (
                            <>
                              <div className="d-flex align-items-center gap-2 mb-1">
                                <h2 className="list-entry-title m-0">{preview.title}</h2>
                                {entry.mood && (
                                  <div
                                    className="mood-indicator-dot"
                                    style={{ backgroundColor: MOODS.find(m => m.id === entry.mood)?.color }}
                                    title={MOODS.find(m => m.id === entry.mood)?.label}
                                  ></div>
                                )}
                              </div>
                              <p className="list-entry-body m-0">{preview.body}</p>
                            </>
                          )}
                        </div>

                        {extractFirstImage(entry.content) && (
                          <div className="list-entry-image">
                            <img src={extractFirstImage(entry.content)} alt="Entry thumbnail" />
                          </div>
                        )}

                        <button
                          className="list-release-btn"
                          onClick={(e) => initiateRelease(entry.id, e)}
                          title="Release this thought"
                        >
                          ×
                        </button>

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
                    {searchQuery ? (
                      <>
                        <h2 className="h4 mb-2" style={{ fontWeight: 400 }}>No thoughts found.</h2>
                        <p className="text-secondary px-4" style={{ maxWidth: '400px', margin: '0 auto' }}>
                          Try searching for something else or clear your search to see all entries.
                        </p>
                        <button
                          onClick={() => setSearchQuery("")}
                          className="btn btn-link text-dark mt-3 text-decoration-none small fw-500"
                        >
                          Clear search
                        </button>
                      </>
                    ) : (
                      <>
                        <h2 className="h4 mb-2" style={{ fontWeight: 400 }}>A quiet space for you.</h2>
                        <p className="text-secondary px-4" style={{ maxWidth: '400px', margin: '0 auto' }}>
                          There is no right or wrong way to write. I'm here whenever you're ready to share.
                        </p>
                      </>
                    )}
                  </div>
                )}
              </div>
            )}

          </div>
        </main >
      </div >

      {/* Floating PWA Install Prompt */}
      {
        installPrompt && (
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
        )
      }
    </>
  );
}

export default Journal;
