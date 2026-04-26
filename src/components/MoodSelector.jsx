import React from 'react';

const MOODS = [
  { 
    id: 'reflective', 
    label: 'Reflective', 
    color: '#C9B99A',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="5" />
        <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
      </svg>
    )
  },
  { 
    id: 'grateful', 
    label: 'Grateful', 
    color: '#D4A843',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
      </svg>
    )
  },
  { 
    id: 'peaceful', 
    label: 'Peaceful', 
    color: '#7BBAC4',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 6c.6.5 1.2 1 2.5 1C7 7 7 5 9.5 5c2.5 0 2.5 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1" />
        <path d="M2 12c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.5 0 2.5 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1" />
        <path d="M2 18c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.5 0 2.5 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1" />
      </svg>
    )
  },
  { 
    id: 'energetic', 
    label: 'Energetic', 
    color: '#E08A54',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
      </svg>
    )
  },
  { 
    id: 'anxious', 
    label: 'Anxious', 
    color: '#A0A0A0',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 12s1-1 4-1 5 2 8 2 4-1 4-1M2 15s1-1 4-1 5 2 8 2 4-1 4-1M2 9s1-1 4-1 5 2 8 2 4-1 4-1" />
      </svg>
    )
  },
  { 
    id: 'sad', 
    label: 'Sad', 
    color: '#8BA4BE',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z" />
      </svg>
    )
  },
  { 
    id: 'content', 
    label: 'Content', 
    color: '#8FAF78',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8a8 8 0 0 1-8 8h-2" />
        <path d="M19 10c0 4-4 4-8 4" />
      </svg>
    )
  }
];

const MoodSelector = ({ selectedMood, onSelect, compact = false, iconsOnly = false }) => {
  return (
    <div className={`mood-selector-container ${compact ? 'compact' : ''} ${iconsOnly ? 'icons-only' : ''}`}>
      <div className="mood-grid">
        {MOODS.map((mood) => {
          const isActive = selectedMood === mood.id;
          return (
            <button
              key={mood.id}
              onClick={() => onSelect(isActive ? null : mood.id)}
              className={`mood-tile ${isActive ? 'active' : ''}`}
              style={{ '--mood-color': mood.color }}
              title={mood.label}
            >
              <span className="mood-tile-icon">{mood.icon}</span>
              {!iconsOnly && <span className="mood-tile-label">{mood.label}</span>}
              {isActive && !iconsOnly && <span className="mood-tile-check">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
              </span>}
            </button>
          );
        })}
      </div>

      <style>{`
        .mood-selector-container {
          width: 100%;
          margin-bottom: 8px;
        }
        .mood-grid {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }
        .mood-tile {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 16px;
          border-radius: 10px;
          background: transparent;
          border: 1px solid var(--border-color);
          color: var(--text-secondary);
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          font-size: 0.8rem;
          font-weight: 500;
          letter-spacing: 0.2px;
          position: relative;
        }
        .mood-tile:hover {
          border-color: var(--mood-color);
          color: var(--text-primary);
          background: color-mix(in srgb, var(--mood-color) 8%, transparent);
        }
        .mood-tile.active {
          background: color-mix(in srgb, var(--mood-color) 12%, transparent);
          border-color: var(--mood-color);
          color: var(--text-primary);
        }
        .mood-tile-icon {
          width: 18px;
          height: 18px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          transition: all 0.3s ease;
        }
        .mood-tile.active .mood-tile-icon svg {
          stroke: var(--mood-color);
        }
        .mood-tile-label {
          line-height: 1;
        }
        .mood-tile-check {
          display: flex;
          align-items: center;
          color: var(--mood-color);
          margin-left: 2px;
        }

        .mood-selector-container.compact .mood-grid {
          gap: 6px;
        }
        .mood-selector-container.compact .mood-tile {
          padding: 8px 12px;
          font-size: 0.75rem;
        }
        .mood-selector-container.compact .mood-tile-icon {
          width: 16px;
          height: 16px;
        }
        
        .mood-selector-container.icons-only .mood-grid {
          justify-content: center;
          gap: 12px;
        }
        .mood-selector-container.icons-only .mood-tile {
          width: 50px;
          height: 50px;
          padding: 0;
          justify-content: center;
          border-radius: 50%;
        }
        .mood-selector-container.icons-only .mood-tile-icon {
          width: 24px;
          height: 24px;
        }
        
        [data-theme="dark"] .mood-tile {
           border-color: rgba(255, 255, 255, 0.1);
        }
        [data-theme="dark"] .mood-tile:hover {
           background: color-mix(in srgb, var(--mood-color) 15%, transparent);
        }
        [data-theme="dark"] .mood-tile.active {
           background: color-mix(in srgb, var(--mood-color) 18%, transparent);
        }
      `}</style>
    </div>
  );
};

export const MoodModal = ({ isOpen, onSelect, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="mood-modal-overlay animate-fade-in" onClick={onClose}>
      <div className="mood-modal-content animate-slide-up" onClick={(e) => e.stopPropagation()}>
        <div className="text-center mb-5">
          <h2 className="h4 fw-bold mb-2">How are you feeling?</h2>
          <p className="text-secondary small">Select your current energy to begin writing.</p>
        </div>
        
        <div className="mood-modal-grid">
          {MOODS.map((mood) => (
            <button
              key={mood.id}
              onClick={() => {
                onSelect(mood.id);
                setTimeout(onClose, 300);
              }}
              className="mood-modal-tile"
              style={{ '--mood-color': mood.color }}
            >
              <div className="mood-modal-icon-box">{mood.icon}</div>
              <span className="mood-modal-name">{mood.label}</span>
            </button>
          ))}
        </div>
        
        <div className="text-center mt-5">
          <button className="btn btn-link text-secondary text-decoration-none small opacity-50" onClick={onClose}>
            Skip for now
          </button>
        </div>
      </div>

      <style>{`
        .mood-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.4);
          backdrop-filter: blur(12px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 5000;
          padding: 20px;
        }
        .mood-modal-content {
          background: var(--bg-primary);
          padding: 50px 40px;
          border-radius: 40px;
          width: 100%;
          max-width: 550px;
          box-shadow: 0 25px 80px rgba(0, 0, 0, 0.2);
          border: 1px solid var(--border-color);
        }
        .mood-modal-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 20px;
        }
        @media (max-width: 500px) {
          .mood-modal-grid {
            grid-template-columns: repeat(3, 1fr);
          }
        }
        .mood-modal-tile {
          display: flex;
          flex-column: column;
          flex-direction: column;
          align-items: center;
          gap: 12px;
          background: transparent;
          border: none;
          cursor: pointer;
          transition: all 0.3s ease;
          padding: 10px;
        }
        .mood-modal-icon-box {
          width: 60px;
          height: 60px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          border: 1px solid var(--border-color);
          color: var(--text-secondary);
          transition: all 0.3s ease;
        }
        .mood-modal-icon-box svg {
          width: 24px;
          height: 24px;
        }
        .mood-modal-name {
          font-size: 0.75rem;
          font-weight: 500;
          color: var(--text-secondary);
          letter-spacing: 0.5px;
          text-transform: uppercase;
        }
        .mood-modal-tile:hover .mood-modal-icon-box {
          border-color: var(--mood-color);
          background: color-mix(in srgb, var(--mood-color) 10%, transparent);
          color: var(--mood-color);
          transform: translateY(-4px);
        }
        .mood-modal-tile:hover .mood-modal-name {
          color: var(--text-primary);
        }
      `}</style>
    </div>
  );
};

export { MOODS };
export default MoodSelector;
