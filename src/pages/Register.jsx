import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';
import PublicNavbar from '../components/PublicNavbar';

function Register() {
  const navigate = useNavigate();
  const [isRegistering, setIsRegistering] = useState(false);

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
          <h1 className="h4 mb-2" style={{ fontWeight: 400, letterSpacing: '-0.5px' }}>Start your journey.</h1>
          <p className="text-secondary small">A minimalist space for your inner world.</p>
        </div>

        <div className="login-container" style={{ maxWidth: '400px', width: '100%' }}>
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
      </div>
    </div>
  );
}

export default Register;
