import React, { useState, useEffect } from 'react';
import { authService } from '../services/authService';

function PasskeyPrompt({ user, onComplete }) {
  const [show, setShow] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const checkSupport = async () => {
      const supported = await authService.isPasskeySupported();
      setIsSupported(supported);

      if (supported) {
        // Check if this device already has a passkey registered in Firestore
        const userData = await authService.getUserData(user.uid);
        const deviceId = localStorage.getItem('thoughts_device_id');
        const thisDevice = userData?.devices?.[deviceId];

        // If not registered and not dismissed recently
        const dismissed = localStorage.getItem('passkey_prompt_dismissed');
        const recentlyDismissed = dismissed && (Date.now() - parseInt(dismissed)) < 7 * 24 * 60 * 60 * 1000; // 7 days

        if (!thisDevice?.hasPasskey && !recentlyDismissed) {
          setShow(true);
        }
      }
    };

    if (user) {
      checkSupport();
    }
  }, [user]);

  const handleRegister = async () => {
    setLoading(true);
    try {
      await authService.registerPasskey(user.uid);
      setShow(false);
      if (onComplete) onComplete(true);
    } catch (error) {
      console.error("Passkey registration error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDismiss = () => {
    localStorage.setItem('passkey_prompt_dismissed', Date.now().toString());
    setShow(false);
    if (onComplete) onComplete(false);
  };

  if (!show || !isSupported) return null;

  return (
    <div className="passkey-prompt-overlay">
      <div className="passkey-prompt-card animate-slide-up">
        <div className="passkey-icon mb-3">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3m-3-3l-2.25-2.25" />
          </svg>
        </div>
        <h3 className="h5 fw-bold mb-2">Secure this device</h3>
        <p className="text-secondary small mb-4">
          Register a passkey to unlock your journal quickly and securely using biometrics or your screen lock.
        </p>
        <div className="d-flex flex-column gap-2 w-100">
          <button 
            onClick={handleRegister} 
            disabled={loading}
            className="btn btn-dark rounded-pill py-2 fw-bold"
          >
            {loading ? 'Registering...' : 'Register Passkey'}
          </button>
          <button 
            onClick={handleDismiss}
            className="btn btn-link text-secondary text-decoration-none small"
          >
            Maybe later
          </button>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .passkey-prompt-overlay {
          position: fixed;
          bottom: 2rem;
          right: 2rem;
          z-index: 1000;
          width: 320px;
          pointer-events: none;
        }
        .passkey-prompt-card {
          pointer-events: auto;
          background: white;
          padding: 2rem;
          border-radius: 1.5rem;
          box-shadow: 0 10px 30px rgba(0,0,0,0.1);
          border: 1px solid rgba(0,0,0,0.05);
          text-align: center;
        }
        .passkey-icon {
          width: 64px;
          height: 64px;
          background: #f8f9fa;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto;
          color: var(--text-primary);
        }
        @media (max-width: 768px) {
          .passkey-prompt-overlay {
            bottom: 0;
            right: 0;
            left: 0;
            width: 100%;
            padding: 1rem;
          }
          .passkey-prompt-card {
            border-radius: 1.5rem 1.5rem 0 0;
          }
        }
      `}} />
    </div>
  );
}

export default PasskeyPrompt;
