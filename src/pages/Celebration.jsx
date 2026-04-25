import React, { useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { authService } from '../services/authService';
import { auth } from '../lib/firebase';

function Celebration() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isFirst, streak, hasGoal, goal } = location.state || {};

  // If there's no state, they shouldn't be here, redirect back to journal
  useEffect(() => {
    if (isFirst === undefined || streak === undefined) {
      navigate('/journal', { replace: true });
    }
  }, [isFirst, streak, navigate]);

  if (isFirst === undefined || streak === undefined) return null;

  const handleCommitGoal = async (newGoal) => {
    if (auth.currentUser) {
      await authService.updateUserStreakGoal(auth.currentUser.uid, newGoal);
    }
    navigate('/journal', { replace: true });
  };

  const handleContinue = () => {
    navigate('/journal', { replace: true });
  };

  return (
    <div className="min-vh-100 d-flex flex-column align-items-center justify-content-center px-4 animate-fade-in" style={{ backgroundColor: 'var(--bg-primary)' }}>
      <div className="w-100" style={{ maxWidth: '500px' }}>
        <div className="text-center mb-5">
          <div className="mb-4 d-flex align-items-center justify-content-center rounded-circle shadow-sm mx-auto" style={{ width: '80px', height: '80px', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}>
            {isFirst ? (
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
            ) : (
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>
            )}
          </div>
          
          <h2 className="h3 fw-bold mb-3 text-dark" style={{ letterSpacing: '-0.5px' }}>
            {isFirst 
              ? "Your first entry!" 
              : `Amazing! You're on a ${streak}-day streak.`}
          </h2>
          <p className="text-secondary px-md-4" style={{ fontSize: '1.05rem', lineHeight: '1.6' }}>
            {isFirst 
              ? "You've taken the first step towards a clearer mind. Consistency is key to building a mindful habit."
              : "Consistency builds clarity. You're doing incredible work for your mental space."}
          </p>
        </div>

        {!hasGoal ? (
          <div className="animate-slide-up text-center w-100 mx-auto" style={{ maxWidth: '400px' }}>
            <p className="small text-uppercase fw-bold text-secondary mb-4" style={{ letterSpacing: '1px' }}>Commit to a Streak Goal</p>
            <div className="d-grid gap-3">
              {[2, 4, 7, 10, 30].map(days => (
                <button 
                  key={days}
                  onClick={() => handleCommitGoal(days)}
                  className="btn btn-outline-dark rounded-pill py-3 hover-lift d-flex justify-content-between align-items-center px-4"
                  style={{ fontWeight: 500, backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                >
                  <span>{days} Days</span>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
                </button>
              ))}
            </div>
            <button 
              onClick={handleContinue}
              className="btn btn-link text-secondary text-decoration-none mt-4 small fw-500 hover-text-dark"
            >
              Not right now
            </button>
          </div>
        ) : (
          <div className="animate-slide-up text-center">
            <button 
              onClick={handleContinue}
              className="btn btn-dark rounded-pill px-5 py-3 shadow-sm hover-lift d-flex align-items-center gap-2 mx-auto"
              style={{ fontWeight: 500 }}
            >
              Continue
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default Celebration;
