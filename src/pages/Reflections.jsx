import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import GuestWarning from '../components/GuestWarning';
import { journalService } from '../services/journalService';
import { auth } from '../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { authService } from '../services/authService';
import Navigation from '../components/Navigation';
import { confirmLogout } from '../utils/alertUtils';

// Helper: Improved preview with reading time estimate
const getEntryMeta = (content) => {
  if (!content) return { preview: '', readTime: 0 };
  const plainText = content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  const readTime = Math.max(1, Math.ceil(plainText.split(' ').length / 200));

  let preview = plainText;
  const end = plainText.indexOf('.');
  if (end !== -1 && end < 120) {
    preview = plainText.substring(0, end + 1);
  } else {
    preview = plainText.substring(0, Math.min(plainText.length, 120)) + (plainText.length > 120 ? '...' : '');
  }
  return { preview, readTime };
};

const bucketEntries = (entries) => {
  const now = new Date();
  const msInDay = 86400000;

  const buckets = {
    week: { label: 'This Week', emoji: '✦', entries: [] },
    month: { label: 'This Month', emoji: '◑', entries: [] },
    year: { label: 'This Year', emoji: '◎', entries: [] },
    older: { label: 'Earlier', emoji: '∞', entries: [] }
  };

  entries.forEach(entry => {
    const entryDate = entry.createdAt?.toDate ? entry.createdAt.toDate() : new Date(entry.dateString);
    const diff = now - entryDate;

    if (diff < 7 * msInDay) buckets.week.entries.push({ ...entry, parsedDate: entryDate });
    else if (diff < 30 * msInDay) buckets.month.entries.push({ ...entry, parsedDate: entryDate });
    else if (diff < 365 * msInDay) buckets.year.entries.push({ ...entry, parsedDate: entryDate });
    else buckets.older.entries.push({ ...entry, parsedDate: entryDate });
  });

  return buckets;
};

function Reflections() {
  const [user, setUser] = useState(null);
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('all');
  const navigate = useNavigate();
  const isOnline = useOnlineStatus();

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
        
        // Try cache first for instant load
        const cached = journalService.getCachedEntries();
        if (cached) {
          setEntries(cached.sort((a, b) => {
            const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.dateString);
            const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.dateString);
            return dateB - dateA;
          }));
        }
        
        setLoading(false);

        try {
          await authService.ensureUserDocument(currentUser);
          const fetched = await journalService.getEntries(currentUser.uid);
          setEntries(fetched.sort((a, b) => {
            const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.dateString);
            const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.dateString);
            return dateB - dateA;
          }));
        } catch (error) {
          console.error("Error:", error);
        }
      } else {
        setUser(null);
        navigate('/login');
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  const handleLogout = () => {
    confirmLogout(navigate);
  };

  // Removed fullscreen loading for instant feel
  const [viewMode, setViewMode] = useState('timeline'); // 'timeline' or 'calendar'
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);

  // Calendar Helper Functions
  const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  // Intro Section
  const Header = () => (
    <header className="mb-5 animate-slide-up">
      <div className="d-flex justify-content-between align-items-end mb-4">
        <div>
          <h1 className="display-4 fw-black text-dark mb-1" style={{ letterSpacing: '-2px' }}>Reflections</h1>
          <p className="text-secondary small fw-bold text-uppercase m-0" style={{ letterSpacing: '1px', opacity: 0.6 }}>
            {entries.length} Total Memories
          </p>
        </div>
        <div className="d-flex bg-light rounded-pill p-1 shadow-sm">
          <button
            onClick={() => setViewMode('timeline')}
            className={`btn btn-sm rounded-pill px-3 fw-bold transition-all ${viewMode === 'timeline' ? 'btn-white shadow-sm' : 'text-secondary'}`}
            style={{ fontSize: '0.75rem' }}
          >
            Timeline
          </button>
          <button
            onClick={() => setViewMode('calendar')}
            className={`btn btn-sm rounded-pill px-3 fw-bold transition-all ${viewMode === 'calendar' ? 'btn-white shadow-sm' : 'text-secondary'}`}
            style={{ fontSize: '0.75rem' }}
          >
            Calendar
          </button>
        </div>
      </div>

      {viewMode === 'timeline' && (
        <div className="d-flex flex-wrap align-items-center gap-2">
          {['all', 'week', 'month', 'year'].map(f => (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              className={`btn btn-sm rounded-pill px-3 fw-bold transition-all ${activeFilter === f ? 'btn-dark' : 'btn-light text-secondary'}`}
              style={{ fontSize: '0.7rem' }}
            >
              {f.toUpperCase()}
            </button>
          ))}
        </div>
      )}
    </header>
  );

  const renderCalendar = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    
    const days = [];
    const prevMonthDays = getDaysInMonth(year, month - 1);
    
    // Previous month padding
    for (let i = firstDay - 1; i >= 0; i--) {
      days.push({ day: prevMonthDays - i, currentMonth: false, date: new Date(year, month - 1, prevMonthDays - i) });
    }
    
    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({ day: i, currentMonth: true, date: new Date(year, month, i) });
    }
    
    // Next month padding
    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
      days.push({ day: i, currentMonth: false, date: new Date(year, month + 1, i) });
    }

    const monthName = currentDate.toLocaleString('default', { month: 'long' });

    return (
      <div className="calendar-view bg-white border rounded-5 p-4 p-md-5 shadow-soft animate-fade-in">
        <div className="d-flex justify-content-between align-items-center mb-5">
          <h2 className="h4 fw-black text-dark m-0">{monthName} <span className="text-secondary opacity-50">{year}</span></h2>
          <div className="d-flex gap-2">
            <button onClick={handlePrevMonth} className="btn btn-light rounded-circle p-2 shadow-sm" style={{ width: '40px', height: '40px' }}>&lsaquo;</button>
            <button onClick={handleNextMonth} className="btn btn-light rounded-circle p-2 shadow-sm" style={{ width: '40px', height: '40px' }}>&rsaquo;</button>
          </div>
        </div>

        <div className="calendar-grid">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
            <div key={d} className="text-center xx-small fw-bold text-uppercase text-secondary mb-3" style={{ letterSpacing: '1px' }}>{d}</div>
          ))}
          {days.map((d, i) => {
            const dateStr = d.date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
            const dayEntries = entries.filter(e => e.dateString === dateStr);
            const hasEntry = dayEntries.length > 0;
            const isToday = new Date().toDateString() === d.date.toDateString();
            const isSelected = selectedDate && selectedDate.toDateString() === d.date.toDateString();

            return (
              <div
                key={i}
                onClick={() => hasEntry && setSelectedDate(isSelected ? null : d.date)}
                className={`calendar-day ${!d.currentMonth ? 'opacity-25' : ''} ${hasEntry ? 'has-entry cursor-pointer' : ''} ${isSelected ? 'selected' : ''}`}
                style={{
                  aspectRatio: '1/1',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '16px',
                  position: 'relative',
                  transition: 'all 0.3s ease',
                  backgroundColor: isSelected ? 'var(--text-primary)' : hasEntry ? 'var(--bg-secondary)' : 'transparent',
                  color: isSelected ? 'var(--bg-primary)' : 'var(--text-primary)',
                  fontWeight: hasEntry || isToday ? '700' : '400',
                  border: isToday ? '2px solid var(--text-primary)' : 'none'
                }}
              >
                <span style={{ fontSize: '0.9rem' }}>{d.day}</span>
                {hasEntry && !isSelected && (
                  <div 
                    className="position-absolute bottom-0 mb-2 rounded-circle" 
                    style={{ width: '4px', height: '4px', backgroundColor: 'var(--text-primary)' }}
                  ></div>
                )}
              </div>
            );
          })}
        </div>

        {selectedDate && (
          <div className="selected-day-entries mt-5 pt-5 border-top animate-slide-up">
            <h3 className="h6 text-uppercase fw-bold text-secondary mb-4" style={{ letterSpacing: '1px' }}>
              Thoughts from {selectedDate.toLocaleDateString('default', { month: 'long', day: 'numeric' })}
            </h3>
            <div className="d-flex flex-column gap-3">
              {entries.filter(e => e.dateString === selectedDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })).map(entry => {
                const { preview } = getEntryMeta(entry.content);
                return (
                  <div 
                    key={entry.id}
                    onClick={() => navigate(`/journal/view/${entry.id}`)}
                    className="p-4 bg-light rounded-4 cursor-pointer hover-lift border transition-all"
                  >
                    <p className="m-0 text-dark small lh-base">{preview}</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <style>{`
          .calendar-grid {
            display: grid;
            grid-template-columns: repeat(7, 1fr);
            gap: 8px;
          }
          .calendar-day.has-entry:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(0,0,0,0.05);
            background-color: var(--bg-secondary) !important;
          }
          .calendar-day.selected:hover {
            background-color: var(--text-primary) !important;
          }
          .btn-white {
            background: white;
            color: var(--text-primary);
          }
          .shadow-soft {
            box-shadow: 0 10px 30px rgba(0,0,0,0.02);
          }
        `}</style>
      </div>
    );
  };

  if (!user) return null;

  const buckets = bucketEntries(entries);
  const visibleBuckets = activeFilter === 'all'
    ? Object.values(buckets).filter(b => b.entries.length > 0)
    : [buckets[activeFilter]].filter(b => b && b.entries.length > 0);

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
        <div className="py-5 px-4 ps-md-5" style={{ maxWidth: '800px' }}>
          {user?.isAnonymous && <GuestWarning />}


          <Header />

          {viewMode === 'calendar' ? (
            renderCalendar()
          ) : visibleBuckets.length > 0 ? (
            <div className="position-relative">
              {/* The Vertical Spine */}
              <div
                className="position-absolute h-100 d-none d-md-block"
                style={{ width: '2px', backgroundColor: '#eee', left: '50%', transform: 'translateX(-50%)', top: '20px' }}
              ></div>

              {visibleBuckets.map((bucket, bIdx) => (
                <div key={bucket.label} className="mb-5 animate-fade-in">
                  <div className="text-center position-relative mb-5" style={{ zIndex: 2 }}>
                    <span className="bg-white border px-4 py-2 rounded-pill fw-bold small shadow-sm">
                      {bucket.emoji} &nbsp;{bucket.label}
                    </span>
                  </div>

                  <div className="row g-4 position-relative">
                    {bucket.entries.map((entry, eIdx) => {
                      const { preview, readTime } = getEntryMeta(entry.content);
                      const isEven = eIdx % 2 === 0;

                      return (
                        <div
                          key={entry.id}
                          className={`col-12 d-md-flex align-items-center ${isEven ? 'flex-row' : 'flex-row-reverse'} mb-4`}
                        >
                          {/* Desktop Spacing / Card */}
                          <div className="col-md-5">
                            <div
                              onClick={() => navigate(`/journal/view/${entry.id}`)}
                              className="bg-white border rounded-4 p-4 shadow-soft cursor-pointer transition-all hover-lift w-100 h-100"
                              style={{ cursor: 'pointer' }}
                            >
                              <div className="d-flex justify-content-between align-items-start mb-2">
                                <time className="xx-small fw-bold text-uppercase text-secondary" style={{ letterSpacing: '1px' }}>
                                  {entry.parsedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                </time>
                                <span className="xx-small text-muted">{readTime} min read</span>
                              </div>
                              <p className="text-dark mb-0 lh-base" style={{ fontSize: '0.95rem', fontWeight: 450 }}>
                                {preview}
                              </p>
                            </div>
                          </div>

                          {/* Timeline Node Center */}
                          <div className="col-md-2 d-none d-md-flex justify-content-center position-relative" style={{ zIndex: 2 }}>
                            <div
                              className="rounded-circle bg-white border-dark border-4"
                              style={{ width: '16px', height: '16px' }}
                            ></div>
                          </div>

                          {/* Desktop Empty Space */}
                          <div className="col-md-5 d-none d-md-block"></div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-5 bg-white border rounded-5 mt-5 shadow-sm">
              <span style={{ fontSize: '3rem' }}>&#9729;&#65039;</span>
              <h3 className="fw-bold mt-3">Quiet Skies</h3>
              <p className="text-secondary small">No entries found for this period. Time to capture a new thought?</p>
              <button
                onClick={() => navigate('/journal', { state: { startWriting: true } })}
                className="btn btn-dark rounded-pill px-4 py-2 mt-2 fw-bold"
              >
                Start Writing
              </button>
            </div>
          )}

          <footer className="mt-5 pt-5 border-top text-center">
            <p className="xx-small fw-bold text-secondary text-uppercase" style={{ letterSpacing: '2px', opacity: 0.4 }}>
              End of Journey — Keep growing
            </p>
          </footer>
        </div>
      </main>
    </div>
  );
}

export default Reflections;