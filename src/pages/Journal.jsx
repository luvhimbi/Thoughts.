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
import confetti from 'canvas-confetti';
import { MOODS } from '../components/MoodSelector';
import JournalList from '../features/journal/JournalList';
import JournalWriting from '../features/journal/JournalWriting';
import JournalViewing from '../features/journal/JournalViewing';
import JournalEditing from '../features/journal/JournalEditing';

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
  const [showPrompts, setShowPrompts] = useState(false);
  const [draftStatus, setDraftStatus] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [userStreakGoal, setUserStreakGoal] = useState(null);
  const [displayLimit, setDisplayLimit] = useState(15);
  
  // Persistent State Keys
  const STATE_KEY = 'thoughts_journal_state';

  const [showMoodModal, setShowMoodModal] = useState(false);
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

  // Initialize state from localStorage
  useEffect(() => {
    try {
      const savedState = localStorage.getItem(STATE_KEY);
      if (savedState) {
        const parsed = JSON.parse(savedState);
        if (parsed.isWriting) setIsWriting(true);
        if (parsed.mood) setMood(parsed.mood);
        if (parsed.design) setDesign(parsed.design);
        if (parsed.searchQuery) setSearchQuery(parsed.searchQuery);
      }
    } catch (e) { console.error("Failed to restore journal state"); }
  }, []);

  // Save state to localStorage on changes
  useEffect(() => {
    try {
      localStorage.setItem(STATE_KEY, JSON.stringify({
        isWriting,
        mood,
        design,
        searchQuery
      }));
    } catch (e) { /* noop */ }
  }, [isWriting, mood, design, searchQuery]);

  const handleStartWriting = () => {
    setShowMoodModal(true);
  };

  useEffect(() => {
    if (location.state?.startWriting) {
      setShowMoodModal(true);
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
    // Try cache first for instant feel
    const cachedProfile = authService.getCachedProfile();
    if (cachedProfile) {
      setUser(cachedProfile);
      setLoading(false);
    }

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        setLoading(false);
        setError(null);

        const cached = journalService.getCachedEntries();
        if (cached) {
          setEntries(cached);
          setFetchingEntries(false);
        } else {
          setFetchingEntries(true);
        }

        try {
          // Initialize user doc in background
          await authService.ensureUserDocument(currentUser);

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
        const previousStreak = calculateStats(entries).streak;
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

        // Only navigate to celebration if streak actually accumulated (increased)
        if (currentStreak > previousStreak) {
          navigate('/journal/celebration', {
            state: {
              isFirst: entries.length === 0,
              streak: currentStreak,
              hasGoal: !!userStreakGoal,
              goal: userStreakGoal
            }
          });
        }
      } catch (error) {
        alert("Failed to save your thought. Please try again.");
      } finally {
        setIsSavingEntity(false);
      }
    }
  };

  const handleDiscard = () => {
    clearDraft();
    localStorage.removeItem(STATE_KEY);
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
      
      // Replace existing content as requested
      editorRef.current.commands.setContent(templateContent);
      setNewThought(templateContent);
    }
  };

  const handleApplyPrompt = (promptText) => {
    if (editorRef.current) {
      const promptHtml = `<p><strong>${promptText}</strong></p><p></p>`;
      editorRef.current.commands.setContent(promptHtml);
      setNewThought(promptHtml);
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

  // Removed fullscreen loading to match Reflections.jsx speed


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
      <style>{`
        .recording-wave div:nth-child(3) { animation-delay: 0.4s; }
      `}</style>
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
                <Navigation onAddEntry={() => setShowMoodModal(true)} isDesktop={true} />
              </div>

              <div className="profile-section mt-auto pt-4 border-top">
                <div className="d-flex flex-column gap-3">
                  <Link to="/journal/settings" className="sidebar-profile-card">
                    <div className="profile-avatar overflow-hidden">
                      {user.photoURL ? (
                        <img src={user.photoURL} alt={user.displayName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        user.displayName?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U'
                      )}
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

            {/* Mobile Bottom Navigation */}
            <div className="d-md-none">
              <Navigation onAddEntry={() => setShowMoodModal(true)} isDesktop={false} />
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
              <JournalWriting
                newThought={newThought}
                setNewThought={setNewThought}
                mood={mood}
                setMood={setMood}
                design={design}
                setDesign={setDesign}
                isRecording={isRecording}
                toggleRecording={toggleRecording}
                isSavingEntity={isSavingEntity}
                handleSaveThought={handleSaveThought}
                handleDiscard={handleDiscard}
                handleApplyTemplate={handleApplyTemplate}
                handleApplyPrompt={handleApplyPrompt}
                showTemplates={showTemplates}
                setShowTemplates={setShowTemplates}
                showDesigns={showDesigns}
                setShowDesigns={setShowDesigns}
                showPrompts={showPrompts}
                setShowPrompts={setShowPrompts}
                draftStatus={draftStatus}
                editorRef={editorRef}
                showMoodModal={showMoodModal}
                setShowMoodModal={setShowMoodModal}
                setIsWriting={setIsWriting}
              />
            ) : (
              <JournalList
                entries={filteredEntries}
                fetchingEntries={fetchingEntries}
                displayLimit={displayLimit}
                setDisplayLimit={setDisplayLimit}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                onViewEntry={(id) => navigate(`/journal/view/${id}`)}
                onInitiateRelease={initiateRelease}
                releasingEntryId={releasingEntryId}
                onCancelRelease={cancelRelease}
                onConfirmRelease={handleConfirmRelease}
                isCompact={isCompact}
                formatListDate={formatListDate}
                getEntryPreview={getEntryPreview}
                isOnlyEmojis={isOnlyEmojis}
                extractFirstImage={extractFirstImage}
              />
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
