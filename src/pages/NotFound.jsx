import React from 'react';
import { useNavigate } from 'react-router-dom';

function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="vh-100 d-flex flex-column align-items-center justify-content-center text-center animate-fade-in" style={{ backgroundColor: 'var(--bg-primary)', padding: '20px' }}>
      <div className="mb-5 animate-pulse" style={{ fontSize: '5rem', opacity: 0.1, filter: 'grayscale(1)' }}>
        ◌
      </div>
      
      <h1 className="text-dark mb-3" style={{ fontSize: '2.5rem', fontWeight: 700, letterSpacing: '-1.5px' }}>
        Lost in thought?
      </h1>
      
      <p className="text-secondary mx-auto mb-5" style={{ maxWidth: '400px', fontSize: '1.1rem', fontWeight: 300 }}>
        The page you are looking for has drifted away or never existed. 
        Take a breath and return to where you started.
      </p>
      
      <button 
        onClick={() => navigate('/')}
        className="btn btn-dark rounded-pill px-5 py-3 shadow-sm transition-all"
        style={{ fontWeight: 500, letterSpacing: '0.5px' }}
      >
        Return to Sanctuary
      </button>

      <footer className="position-absolute bottom-0 w-100 py-4 text-center text-secondary small opacity-50">
        Thoughts. — Your private space for reflection.
      </footer>
    </div>
  );
}

export default NotFound;
