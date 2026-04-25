import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';
import PublicNavbar from '../components/PublicNavbar';

const ONBOARDING_SLIDES = [
  {
    title: "A Minimalist Space",
    desc: "An interface that disappears, leaving only you and your thoughts in a secure environment.",
    icon: (
      <div className="d-flex align-items-center justify-content-center rounded-circle mb-4 mx-auto" style={{ width: '80px', height: '80px', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', boxShadow: '0 8px 24px rgba(0,0,0,0.04)' }}>
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 20h9"></path>
          <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
        </svg>
      </div>
    )
  },
  {
    title: "Build Your Habit",
    desc: "Track your consistency with beautiful activity streaks and daily mindful affirmations.",
    icon: (
      <div className="d-flex align-items-center justify-content-center rounded-circle mb-4 mx-auto" style={{ width: '80px', height: '80px', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', boxShadow: '0 8px 24px rgba(0,0,0,0.04)' }}>
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
        </svg>
      </div>
    )
  },
  {
    title: "Release & Let Go",
    desc: "Safely release what weighs on you by writing it down and watching it burn away.",
    icon: (
      <div className="d-flex align-items-center justify-content-center rounded-circle mb-4 mx-auto" style={{ width: '80px', height: '80px', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', boxShadow: '0 8px 24px rgba(0,0,0,0.04)' }}>
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"></path>
        </svg>
      </div>
    )
  }
];

function Register() {
  const navigate = useNavigate();
  const [isRegistering, setIsRegistering] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);

  const handleGoogleSignup = async () => {
    setIsRegistering(true);
    try {
      await authService.loginWithGoogle();
      navigate('/journal');
    } catch (error) {
      alert("Registration failed.");
      setIsRegistering(false);
    }
  };

  return (
    <div className="register-page login-page min-vh-100 d-flex flex-column animate-fade-in" style={{ backgroundColor: 'var(--bg-primary)' }}>
      <PublicNavbar />

      <div className="flex-grow-1 d-flex flex-column align-items-center justify-content-center px-4" style={{ paddingTop: '80px', paddingBottom: '120px' }}>
        <div className="text-center mb-5">
          <span className="thoughts-brand thoughts-brand--lg mb-3">Thoughts.</span>
          {currentSlide >= ONBOARDING_SLIDES.length && (
            <>
              <h1 className="h4 mb-2 animate-fade-in" style={{ fontWeight: 400, letterSpacing: '-0.5px' }}>Start your journey.</h1>
              <p className="text-secondary small animate-fade-in">A minimalist space for your inner world.</p>
            </>
          )}
        </div>

        <div className="login-container" style={{ maxWidth: '400px', width: '100%' }}>
          {currentSlide < ONBOARDING_SLIDES.length ? (
            <div className="text-center animate-slide-up" key={`slide-${currentSlide}`}>
              {ONBOARDING_SLIDES[currentSlide].icon}
              <h2 className="h3 mb-3 fw-bold text-dark" style={{ letterSpacing: '-0.5px' }}>{ONBOARDING_SLIDES[currentSlide].title}</h2>
              <p className="text-secondary mb-5 px-3" style={{ minHeight: '64px', fontSize: '1.05rem', lineHeight: '1.6' }}>
                {ONBOARDING_SLIDES[currentSlide].desc}
              </p>
              
              <div className="d-flex justify-content-between align-items-center mb-3 px-2">
                <div className="d-flex gap-2">
                  {ONBOARDING_SLIDES.map((_, idx) => (
                    <div 
                      key={idx} 
                      style={{ 
                        width: idx === currentSlide ? '28px' : '8px', 
                        height: '8px', 
                        borderRadius: '4px', 
                        backgroundColor: idx === currentSlide ? 'var(--text-primary)' : 'var(--border-color)',
                        transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
                      }} 
                    />
                  ))}
                </div>
                <button 
                  onClick={() => setCurrentSlide(prev => prev + 1)}
                  className="btn btn-dark rounded-pill px-4 py-2 shadow-sm hover-lift d-flex align-items-center gap-2"
                  style={{ fontWeight: 500, letterSpacing: '0.5px' }}
                >
                  {currentSlide === ONBOARDING_SLIDES.length - 1 ? 'Start' : 'Next'}
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
                </button>
              </div>
              <div className="text-center mt-4">
                <button 
                  onClick={() => setCurrentSlide(ONBOARDING_SLIDES.length)} 
                  className="btn btn-link text-secondary text-decoration-none small fw-500 hover-text-dark"
                >
                  Skip intro
                </button>
              </div>
            </div>
          ) : (
            <div className="animate-fade-in">
              <button
                onClick={handleGoogleSignup}
                disabled={isRegistering}
                className="btn-minimal w-100 d-flex align-items-center justify-content-center py-3 mb-4"
                style={{ gap: '12px', fontSize: '1rem', letterSpacing: '0.5px' }}
              >
                {isRegistering ? (
                  <span className="loading-dots text-white" style={{ height: '18px' }}><span></span><span></span><span></span></span>
                ) : (
                  <>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                    Sign up with Google
                  </>
                )}
              </button>

              <div className="text-center">
                <p className="text-secondary small">
                  Already have an account? <Link to="/login" className="text-dark text-decoration-none fw-bold ms-1">Sign In</Link>
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Register;
