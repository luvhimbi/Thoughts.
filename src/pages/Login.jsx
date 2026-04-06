import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';
import { auth } from '../lib/firebase';
import PublicNavbar from '../components/PublicNavbar';

function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [isSendingLink, setIsSendingLink] = useState(false);
  const [linkSent, setLinkSent] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isGuestLoggingIn, setIsGuestLoggingIn] = useState(false);

  // Redirect users who are already logged in
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        navigate('/journal');
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  useEffect(() => {
    // Check if the user is returning from a magic link
    const handleMagicLinkCallback = async () => {
      if (authService.isMagicLink(window.location.href)) {
        let emailForSignIn = window.localStorage.getItem('emailForSignIn');
        
        if (!emailForSignIn) {
          // Fallback if email is missing from localStorage (e.g. opened in different browser)
          emailForSignIn = window.prompt('Please provide your email for confirmation');
        }

        if (emailForSignIn) {
          try {
            await authService.finishMagicLinkLogin(emailForSignIn, window.location.href);
            navigate('/journal');
          } catch (error) {
            setErrorMessage("Failed to sign in. The link may have expired.");
          }
        }
      }
    };

    handleMagicLinkCallback();
  }, [navigate]);

  const handleGoogleLogin = async () => {
    setIsLoggingIn(true);
    try {
      await authService.loginWithGoogle();
      navigate('/journal');
    } catch (error) {
      setErrorMessage("Sign-in failed. Please try again.");
      setIsLoggingIn(false);
    }
  };

  const handleGuestLogin = async () => {
    setIsGuestLoggingIn(true);
    try {
      await authService.loginAnonymously();
      navigate('/journal');
    } catch (error) {
      setErrorMessage("Could not start guest session.");
      setIsGuestLoggingIn(false);
    }
  };

  const handleMagicLinkSubmit = async (e) => {
    e.preventDefault();
    if (!email) return;

    setIsSendingLink(true);
    setErrorMessage("");
    try {
      await authService.sendMagicLink(email);
      setLinkSent(true);
    } catch (error) {
      setErrorMessage("Could not send magic link. Please check the email address.");
    } finally {
      setIsSendingLink(false);
    }
  };

  return (
    <div className="login-page min-vh-100 d-flex flex-column animate-fade-in" style={{ backgroundColor: 'var(--bg-primary)' }}>
      <PublicNavbar />

      <div className="flex-grow-1 d-flex flex-column align-items-center justify-content-center px-4" style={{ paddingTop: '80px', paddingBottom: '120px' }}>
        <div className="text-center mb-5">
          <span className="thoughts-brand thoughts-brand--lg mb-3">Thoughts.</span>
          <p className="text-secondary" style={{ fontSize: '1.1rem', fontWeight: 300 }}>Welcome back to your quiet space.</p>
        </div>

        <div className="login-container" style={{ maxWidth: '400px', width: '100%' }}>
          {errorMessage && <div className="alert alert-danger border-0 small mb-4 py-2 px-3 animate-fade-in" style={{ borderRadius: '4px' }}>{errorMessage}</div>}
          
          {linkSent ? (
            <div className="text-center p-4 bg-white border animate-fade-in" style={{ borderRadius: '8px' }}>
              <div className="mb-3" style={{ fontSize: '2.5rem' }}>✉️</div>
              <h3 className="h5 mb-2" style={{ fontWeight: 600 }}>Check your email</h3>
              <p className="small text-secondary mb-3">We've sent a magic login link to <strong>{email}</strong>. Click the link to sign in instantly.</p>
              <button 
                onClick={() => setLinkSent(false)} 
                className="btn btn-sm btn-link text-dark text-decoration-none small fw-bold"
              >
                Try another email
              </button>
            </div>
          ) : (
            <>
              <button 
                onClick={handleGoogleLogin} 
                disabled={isLoggingIn || isGuestLoggingIn}
                className="btn-minimal w-100 d-flex align-items-center justify-content-center py-3 mb-3 shadow-sm hover-shadow-md"
                style={{ gap: '12px', fontSize: '1rem', letterSpacing: '0.5px', transition: 'all 0.3s ease' }}
              >
                {isLoggingIn ? (
                  <span className="loading-dots text-white" style={{ height: '18px' }}><span></span><span></span><span></span></span>
                ) : (
                  <>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                    Continue with Google
                  </>
                )}
              </button>

              <div className="d-flex align-items-center my-4 opacity-25">
                <hr className="flex-grow-1 m-0" />
                <span className="px-3 x-small text-uppercase" style={{ letterSpacing: '1px' }}>or</span>
                <hr className="flex-grow-1 m-0" />
              </div>

              <form onSubmit={handleMagicLinkSubmit} className="mb-4">
                <div className="mb-3">
                  <input 
                    type="email" 
                    className="form-control text-center py-2" 
                    placeholder="Enter your email" 
                    required 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    style={{ border: '1px solid var(--border-color)', borderRadius: '4px', fontSize: '0.95rem' }}
                  />
                </div>
                <button 
                  type="submit" 
                  disabled={isSendingLink}
                  className="btn btn-minimal-outline w-100 py-2 d-flex align-items-center justify-content-center gap-2"
                  style={{ borderStyle: 'solid', borderRadius: '4px', fontSize: '0.95rem' }}
                >
                  {isSendingLink ? (
                    <>
                      <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                      Sending calm link...
                    </>
                  ) : (
                    "Login with Magic Link"
                  )}
                </button>
              </form>
            </>
          )}
          
          <div className="text-center mt-5">
            <button 
              onClick={handleGuestLogin}
              disabled={isLoggingIn || isGuestLoggingIn}
              className="btn btn-link text-secondary text-decoration-none small transition-all hover-text-dark d-inline-flex justify-content-center"
              style={{ fontWeight: 500, minWidth: '130px' }}
            >
              {isGuestLoggingIn ? <span className="loading-dots"><span></span><span></span><span></span></span> : "Continue as Guest"}
            </button>
            <p className="text-secondary small mt-3">
              New here? <Link to="/register" className="text-dark text-decoration-none fw-bold ms-1">Create an account</Link>
            </p>
          </div>
        </div>
      </div>

      <style>{`
        .ls-1 { letter-spacing: 1px; }
        .hover-shadow-md:hover { box-shadow: 0 8px 30px rgba(0,0,0,0.08) !important; }
        .hover-text-dark:hover { color: var(--text-primary) !important; }
      `}</style>
    </div>
  );
}

export default Login;
