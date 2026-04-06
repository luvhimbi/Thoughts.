import React from 'react';
import { Link } from 'react-router-dom';

const GuestWarning = () => {
  return (
    <div className="guest-warning-banner animate-fade-in shadow-sm">
      <div className="container d-flex flex-column flex-sm-row align-items-center justify-content-between py-2 px-3 py-sm-2 px-sm-4 gap-2">
        <div className="d-flex align-items-center gap-2 gap-sm-3">
          <span className="warning-icon text-dark" style={{ fontSize: '1.2rem' }}>✦</span>
          <p className="m-0 small text-dark" style={{ fontWeight: 400, lineHeight: 1.2 }}>
            You're writing as a guest. <span className="text-secondary d-none d-md-inline">Sign in to sync your thoughts to the cloud and keep them forever.</span>
            <span className="text-secondary d-md-none">Sign in to sync to cloud.</span>
          </p>
        </div>
        <Link to="/login" className="btn btn-sm btn-dark rounded-pill px-4 py-1" style={{ fontSize: '0.8rem', fontWeight: 500 }}>
          Sign In
        </Link>
      </div>
    </div>
  );
};

export default GuestWarning;
