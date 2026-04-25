import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import GuestWarning from '../components/GuestWarning';
import { auth } from '../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { journalService } from '../services/journalService';
import { authService } from '../services/authService';

function StreakCalendar() {
  const [user, setUser] = useState(null);
  const [entries, setEntries] = useState([]);
  const [streakGoal, setStreakGoal] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const isOnline = useOnlineStatus();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        try {
          const fetchedEntries = await journalService.getEntries(currentUser.uid);
          setEntries(fetchedEntries || []);

          const userData = await authService.getUserData(currentUser.uid);
          setStreakGoal(userData?.streakGoal || null);
        } catch (error) {
          console.error("Error loading entries for streak calendar:", error);
        }
      } else {
        navigate('/login');
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [navigate]);

  if (loading) {
    return (
      <div className="vh-100 d-flex flex-column align-items-center justify-content-center" style={{ backgroundColor: 'var(--bg-primary)' }}>
        <div className="custom-spinner mb-3"></div>
        <p className="text-secondary small animate-pulse">Gathering your journey...</p>
      </div>
    );
  }

  if (!user) return null;

  // Process Dates
  const getDayStr = (d) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;

  const entriesDatesSet = new Set(entries.map(e => {
    const d = e.createdAt?.toDate ? e.createdAt.toDate() : new Date(e.dateString);
    return getDayStr(d);
  }));

  const sortedDatesList = Array.from(entriesDatesSet).map(ds => {
    const [y, m, d] = ds.split('-').map(Number);
    return new Date(y, m, d).getTime();
  }).sort((a, b) => a - b);

  const today = new Date();
  const todayStr = getDayStr(today);

  // Calculate Current Streak
  let currentStreak = 0;
  let checkDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());

  // If today is missing, start checking from yesterday
  if (!entriesDatesSet.has(todayStr)) {
    checkDate.setDate(checkDate.getDate() - 1);
  }

  while (entriesDatesSet.has(getDayStr(checkDate))) {
    currentStreak++;
    checkDate.setDate(checkDate.getDate() - 1);
  }

  // Calculate All-Time Best (Longest Streak)
  let longestStreak = 0;
  if (sortedDatesList.length > 0) {
    let tempStreak = 1;
    for (let i = 0; i < sortedDatesList.length - 1; i++) {
      const d1 = new Date(sortedDatesList[i]);
      const d2 = new Date(sortedDatesList[i + 1]);
      const diffDays = Math.round((d2 - d1) / 86400000);

      if (diffDays === 1) {
        tempStreak++;
      } else {
        longestStreak = Math.max(longestStreak, tempStreak);
        tempStreak = 1;
      }
    }
    longestStreak = Math.max(longestStreak, tempStreak);
  }

  // FIX: Ensure Best Streak is at least the Current Streak
  const bestStreak = Math.max(longestStreak, currentStreak);

  // Goal Progress Calculation
  const progressPercent = streakGoal ? Math.min((currentStreak / streakGoal) * 100, 100) : 0;

  // Generate Calendar Grid (Last 35 Days)
  const daysInGrid = 35;
  const gridDates = [];
  const startGridDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  startGridDate.setDate(startGridDate.getDate() - (daysInGrid - 1));

  for (let i = 0; i < daysInGrid; i++) {
    const currentGridDate = new Date(startGridDate);
    currentGridDate.setDate(startGridDate.getDate() + i);
    const dateStr = getDayStr(currentGridDate);

    gridDates.push({
      timestamp: currentGridDate.getTime(),
      hasEntry: entriesDatesSet.has(dateStr),
      isToday: dateStr === todayStr,
      dateObj: currentGridDate
    });
  }

  return (
    <>
      {user && user.isAnonymous && <GuestWarning />}
      <div className="journal-page min-vh-100 d-flex flex-column animate-fade-in" style={{ backgroundColor: 'var(--bg-primary)' }}>
        <header className="container py-4 d-flex justify-content-between align-items-center">
          <button onClick={() => navigate('/journal')} className="btn btn-link text-dark text-decoration-none p-0 d-flex align-items-center justify-content-center hover-lift" style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'var(--bg-secondary)' }}>
            <span style={{ fontSize: '1.2rem', lineHeight: 1 }}>←</span>
          </button>
          <div className="fw-bold text-dark text-uppercase" style={{ fontSize: '0.85rem', letterSpacing: '2px' }}>Activity</div>
          <div style={{ width: '40px' }}></div>
        </header>

        <main className="container flex-grow-1 py-4 d-flex flex-column align-items-center" style={{ maxWidth: '600px' }}>

          {/* Hero Section */}
          <div className="text-center mb-5 animate-slide-up">
            <div className="position-relative d-inline-block mb-3">
              <div className="d-flex align-items-center justify-content-center bg-dark rounded-circle shadow-lg" style={{ width: '130px', height: '130px', border: '6px solid var(--bg-primary)' }}>
                <h1 className="display-3 fw-bold text-white mb-0" style={{ letterSpacing: '-2px' }}>{currentStreak}</h1>
              </div>
              {currentStreak > 0 && (
                <div className="position-absolute bottom-0 end-0 bg-white border rounded-circle d-flex align-items-center justify-content-center shadow-sm text-dark" style={{ width: '44px', height: '44px', transform: 'translate(10%, 10%)' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"></path></svg>
                </div>
              )}
            </div>
            <p className="text-secondary text-uppercase fw-bold m-0 mt-2" style={{ letterSpacing: '3px', fontSize: '0.75rem' }}>Current Streak</p>
          </div>

          {/* Stats Row */}
          <div className="row w-100 mb-4 g-3 animate-slide-up" style={{ animationDelay: '0.1s' }}>
            <div className="col-6">
              <div className="bg-white border rounded-4 p-3 text-center h-100">
                <span className="d-block text-secondary xx-small fw-bold text-uppercase mb-1">Total Entries</span>
                <span className="h5 fw-bold text-dark m-0">{entries.length}</span>
              </div>
            </div>
            <div className="col-6">
              <div className="bg-white border rounded-4 p-3 text-center h-100">
                <span className="d-block text-secondary xx-small fw-bold text-uppercase mb-1">Best Streak</span>
                <span className="h5 fw-bold text-dark m-0">{bestStreak}</span>
              </div>
            </div>

            {/* Goal Progress Section */}
            <div className="col-12">
              <div className="bg-white border rounded-4 p-4">
                <div className="d-flex justify-content-between align-items-end mb-2">
                  <div>
                    <span className="d-block text-secondary xx-small fw-bold text-uppercase">Goal Progress</span>
                    <span className="h6 fw-bold text-dark m-0">{streakGoal ? `${streakGoal} Days` : 'Set a Goal'}</span>
                  </div>
                  <span className="small fw-bold text-secondary">{Math.round(progressPercent)}%</span>
                </div>
                <div className="progress" style={{ height: '8px', backgroundColor: 'var(--bg-secondary)', borderRadius: '10px', overflow: 'hidden' }}>
                  <div
                    className="progress-bar bg-dark"
                    role="progressbar"
                    style={{ width: `${progressPercent}%`, transition: 'width 0.6s ease' }}
                    aria-valuenow={progressPercent}
                    aria-valuemin="0"
                    aria-valuemax="100"
                  ></div>
                </div>
                {streakGoal && currentStreak >= streakGoal && (
                  <p className="xx-small text-success fw-bold text-uppercase mt-2 mb-0">Goal Reached! 🏆</p>
                )}
              </div>
            </div>
          </div>

          {/* Activity Map */}
          <div className="w-100 bg-white border rounded-4 p-4 shadow-soft animate-slide-up" style={{ animationDelay: '0.2s' }}>
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h3 className="h6 fw-bold m-0">Recent Journey</h3>
              <span className="xx-small text-secondary fw-bold text-uppercase">Last 5 Weeks</span>
            </div>

            <div className="d-grid gap-2" style={{ gridTemplateColumns: 'repeat(7, 1fr)' }}>
              {gridDates.map((day, idx) => (
                <div key={idx} className="d-flex flex-column align-items-center gap-1">
                  <div
                    className="rounded-3 transition-all w-100 d-flex align-items-center justify-content-center fw-bold"
                    style={{
                      aspectRatio: '1/1',
                      backgroundColor: day.hasEntry ? 'var(--text-primary)' : 'var(--bg-secondary)',
                      border: day.isToday ? '2px solid var(--text-primary)' : '1px solid rgba(0,0,0,0.05)',
                      opacity: day.hasEntry ? 1 : 0.8,
                      transform: day.hasEntry ? 'scale(1.05)' : 'scale(0.95)',
                      boxShadow: day.isToday ? '0 0 0 2px var(--bg-primary), 0 0 0 4px var(--border-color)' : 'none',
                      color: day.hasEntry ? 'var(--bg-primary)' : 'var(--text-secondary)',
                      fontSize: '0.8rem'
                    }}
                    title={day.dateObj.toLocaleDateString()}
                  >
                    {day.dateObj.getDate()}
                  </div>
                </div>
              ))}
            </div>

            <div className="d-flex justify-content-between mt-4 pt-3 border-top text-secondary" style={{ fontSize: '0.7rem', fontWeight: 600, letterSpacing: '0.5px' }}>
              <span className="text-uppercase">Earlier</span>
              <div className="d-flex align-items-center gap-2">
                <span className="text-muted">Key:</span>
                <div className="rounded-2" style={{ width: '12px', height: '12px', backgroundColor: 'var(--bg-secondary)', border: '1px solid rgba(0,0,0,0.05)' }}></div>
                <div className="rounded-2" style={{ width: '12px', height: '12px', backgroundColor: 'var(--text-primary)' }}></div>
              </div>
              <span className="text-uppercase">Today</span>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}

export default StreakCalendar;