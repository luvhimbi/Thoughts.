import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Navigation from '../components/Navigation';
import { journalService } from '../services/journalService';
import { auth } from '../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { authService } from '../services/authService';
import { confirmLogout } from '../utils/alertUtils';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import GuestWarning from '../components/GuestWarning';

// Helper: Get entry preview (first sentence)
const getPreview = (content) => {
  if (!content) return '';
  // Strip HTML tags
  const plainText = content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  const end = plainText.indexOf('.');
  if (end !== -1 && end < 120) return plainText.substring(0, end + 1);
  return plainText.substring(0, Math.min(plainText.length, 100)) + (plainText.length > 100 ? '...' : '');
};

// Helper: Bucket entries into time periods
const bucketEntries = (entries) => {
  const now = new Date();
  const msInDay = 86400000;
  const weekAgo = new Date(now - 7 * msInDay);
  const monthAgo = new Date(now - 30 * msInDay);
  const yearAgo = new Date(now - 365 * msInDay);

  const buckets = {
    week: { label: 'This Week', emoji: '✦', entries: [] },
    month: { label: 'This Month', emoji: '◑', entries: [] },
    year: { label: 'This Year', emoji: '◎', entries: [] },
    older: { label: 'Older Reflections', emoji: '∞', entries: [] }
  };

  entries.forEach(entry => {
    const entryDate = entry.createdAt?.toDate ? entry.createdAt.toDate() : new Date(entry.dateString);
    if (entryDate >= weekAgo) {
      buckets.week.entries.push({ ...entry, parsedDate: entryDate });
    } else if (entryDate >= monthAgo) {
      buckets.month.entries.push({ ...entry, parsedDate: entryDate });
    } else if (entryDate >= yearAgo) {
      buckets.year.entries.push({ ...entry, parsedDate: entryDate });
    } else {
      buckets.older.entries.push({ ...entry, parsedDate: entryDate });
    }
  });

  return buckets;
};

// Helper: Format date for the timeline node
const formatNodeDate = (date) => {
  if (!date) return '';
  return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
};

function Reflections() {
  const [user, setUser] = useState(null);
  const [entries, setEntries] = useState([]);
  const isOnline = useOnlineStatus();
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('all'); // all, week, month, year
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        try {
          await authService.ensureUserDocument(currentUser.uid);
          setUser(currentUser);
          
          const fetched = await journalService.getEntries(currentUser.uid);
          setEntries(fetched);
        } catch (error) {
          console.error("Error initializing reflections:", error);
        }
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

  if (loading) {
    return (
      <div className="vh-100 d-flex flex-column align-items-center justify-content-center" style={{ backgroundColor: 'var(--bg-primary)' }}>
        <div className="custom-spinner mb-3"></div>
        <p className="text-secondary small animate-pulse">gathering your reflections...</p>
      </div>
    );
  }

  if (!user) return null;

  const buckets = bucketEntries(entries);
  const totalCount = entries.length;

  // Filter which buckets to show
  const visibleBuckets = activeFilter === 'all'
    ? Object.values(buckets).filter(b => b.entries.length > 0)
    : Object.values(buckets).filter(b => {
        if (activeFilter === 'week') return b.label === 'This Week';
        if (activeFilter === 'month') return b.label === 'This Month';
        if (activeFilter === 'year') return b.label === 'This Year';
        return true;
      }).filter(b => b.entries.length > 0);

  return (
    <>
      {user && user.isAnonymous && <GuestWarning />}
      <div className="journal-page w-100 min-vh-100 d-flex flex-md-row flex-column" style={{ backgroundColor: 'var(--bg-primary)' }}>
      {/* Desktop Sidebar */}
      <aside className="desktop-sidebar d-none d-md-flex flex-column justify-content-between py-5 px-4 border-end bg-transparent" style={{ width: '260px', height: '100vh', position: 'sticky', top: 0, zIndex: 100 }}>
        <div>
          <div className="mb-5 px-2">
            <Link to="/" className="navbar-brand text-decoration-none">
              <span className="thoughts-brand thoughts-brand--md">Thoughts.</span>
            </Link>
          </div>
          <Navigation onAddEntry={() => navigate('/journal')} isDesktop={true} />
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

      {/* Mobile Top Header */}
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

      {/* Main Content */}
      <main className="flex-grow-1 animate-fade-in overflow-auto w-100" style={{ backgroundColor: 'var(--bg-primary)' }}>
        <div className="mx-auto w-100 py-5 px-4 ps-md-5" style={{ maxWidth: '900px' }}>
          
          {/* Page Title */}
          <header className="mb-5 text-center text-md-start">
            <div className="d-inline-flex align-items-center gap-2 mb-2 px-3 py-1 rounded-pill bg-light border x-small fw-600 text-secondary">
               <span>✧</span>
               <span>MEMORIES</span>
            </div>
            <h1 className="text-dark mb-3" style={{ fontSize: '3rem', letterSpacing: '-2.5px', fontWeight: 700, lineHeight: 1 }}>
              Reflections
            </h1>
            <p className="text-secondary mx-auto mx-md-0" style={{ fontSize: '1.1rem', fontWeight: 300, maxWidth: '500px' }}>
              {totalCount > 0
                ? `A visual history of your journey. ${totalCount} thought${totalCount !== 1 ? 's' : ''} preserved in time.`
                : 'Your quiet space for reflection. Start by capturing your first thought.'}
            </p>
          </header>

          {/* Filter Tabs */}
          {totalCount > 0 && (
            <div className="journey-filters d-flex gap-2 mb-5 flex-wrap justify-content-center justify-content-md-start">
              {[
                { key: 'all', label: 'All Time' },
                { key: 'week', label: 'Past Week' },
                { key: 'month', label: 'Past Month' },
                { key: 'year', label: 'Past Year' }
              ].map(filter => (
                <button
                  key={filter.key}
                  onClick={() => setActiveFilter(filter.key)}
                  className={`journey-filter-btn ${activeFilter === filter.key ? 'active' : ''}`}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          )}

          {/* Journey Timeline */}
          {visibleBuckets.length > 0 ? (
            <div className="journey-timeline pt-4">
              {visibleBuckets.map((bucket, bucketIdx) => (
                <div key={bucket.label} className="journey-section animate-fade-in" style={{ animationDelay: `${bucketIdx * 0.1}s` }}>
                  {/* Bucket Header */}
                  <div className="journey-section-header">
                    <span className="journey-section-emoji">{bucket.emoji}</span>
                    <h2 className="journey-section-title">{bucket.label}</h2>
                    <span className="journey-section-count">{bucket.entries.length}</span>
                  </div>

                  {/* Entry Nodes */}
                  <div className="journey-nodes">
                    {bucket.entries.map((entry, entryIdx) => (
                      <div 
                        key={entry.id} 
                        className={`journey-node ${entryIdx % 2 === 0 ? 'left' : 'right'}`}
                        onClick={() => navigate(`/journal/view/${entry.id}`)}
                        style={{ animationDelay: `${(bucketIdx * bucket.entries.length + entryIdx) * 0.05}s` }}
                      >
                        <div className="journey-node-dot"></div>
                        <div className="journey-card">
                          <time className="journey-card-date">
                            {formatNodeDate(entry.parsedDate)}
                          </time>
                          <p className="journey-card-text">{getPreview(entry.content)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-5 mt-5 animate-fade-in">
              <div className="mb-4" style={{ fontSize: '4rem', opacity: 0.1, filter: 'grayscale(1)' }}>◌</div>
              <h2 className="h4 mb-3 text-dark" style={{ fontWeight: 600, letterSpacing: '-0.5px' }}>
                {activeFilter !== 'all' ? `No reflections found for ${activeFilter === 'week' ? 'this week' : activeFilter === 'month' ? 'this month' : 'this year'}.` : 'The page is blank, for now.'}
              </h2>
              <p className="text-secondary px-4 mx-auto" style={{ maxWidth: '420px', fontSize: '1rem', fontWeight: 300 }}>
                {activeFilter !== 'all' 
                  ? 'Try looking further back into your history, or capture a new memory today.'
                  : 'Every journey starts with a single reflection. When you\'re ready, your story will begin to unfold here.'}
              </p>
              <button 
                onClick={() => navigate('/journal')}
                className="btn btn-dark rounded-pill px-4 py-2 mt-4 shadow-sm"
              >
                Write something new
              </button>
            </div>
          )}
        </div>

        <footer className="w-100 py-5 text-center mt-auto px-4" style={{ borderTop: '1px solid var(--border-color)', opacity: 0.5 }}>
          <p className="text-secondary small m-0" style={{ letterSpacing: '0.5px' }}>Stay mindful. This is your private space for growth.</p>
        </footer>
      </main>

      {/* Mobile Bottom Navigation */}
      <div className="d-md-none">
        <Navigation onAddEntry={() => navigate('/journal')} isDesktop={false} />
      </div>
    </div>
    </>
  );
}

export default Reflections;
