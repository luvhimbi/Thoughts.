import React from 'react';

const MOODS = [
  { 
    id: 'reflective', 
    label: 'Reflective', 
    color: '#E8E4DA', 
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="5" />
        <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
      </svg>
    )
  },
  { 
    id: 'grateful', 
    label: 'Grateful', 
    color: '#F4E1A1', 
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
      </svg>
    )
  },
  { 
    id: 'peaceful', 
    label: 'Peaceful', 
    color: '#AED9E0', 
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 6c.6.5 1.2 1 2.5 1C7 7 7 5 9.5 5c2.5 0 2.5 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1" />
        <path d="M2 12c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.5 0 2.5 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1" />
        <path d="M2 18c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.5 0 2.5 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1" />
      </svg>
    )
  },
  { 
    id: 'energetic', 
    label: 'Energetic', 
    color: '#F9B48F', 
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
      </svg>
    )
  },
  { 
    id: 'anxious', 
    label: 'Anxious', 
    color: '#D3D3D3', 
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 12s1-1 4-1 5 2 8 2 4-1 4-1M2 15s1-1 4-1 5 2 8 2 4-1 4-1M2 9s1-1 4-1 5 2 8 2 4-1 4-1" />
      </svg>
    )
  },
  { 
    id: 'sad', 
    label: 'Sad', 
    color: '#A9BCD0', 
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z" />
      </svg>
    )
  },
  { 
    id: 'content', 
    label: 'Content', 
    color: '#B8C6A3', 
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8a8 8 0 0 1-8 8h-2" />
        <path d="M19 10c0 4-4 4-8 4" />
      </svg>
    )
  }
];

const MoodSelector = ({ selectedMood, onSelect, compact = false }) => {
  return (
    <div className={`mood-selector-container ${compact ? 'compact' : ''}`}>
      <div className="mood-chips-scroll">
        {MOODS.map((mood) => (
          <button
            key={mood.id}
            onClick={() => onSelect(selectedMood === mood.id ? null : mood.id)}
            className={`mood-chip ${selectedMood === mood.id ? 'active' : ''}`}
            style={{ 
              '--mood-color': mood.color,
              borderColor: selectedMood === mood.id ? mood.color : 'transparent'
            }}
            title={mood.label}
          >
            <span className="mood-icon">{mood.icon}</span>
            {!compact && <span className="mood-label">{mood.label}</span>}
          </button>
        ))}
      </div>

      <style jsx="true">{`
        .mood-selector-container {
          width: 100%;
          margin-bottom: 24px;
        }
        .mood-chips-scroll {
          display: flex;
          gap: 10px;
          overflow-x: auto;
          padding: 10px 4px;
          scrollbar-width: none;
          -ms-overflow-style: none;
        }
        .mood-chips-scroll::-webkit-scrollbar {
          display: none;
        }
        .mood-chip {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 20px;
          border-radius: 100px;
          background: rgba(255, 255, 255, 0.4);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          border: 1px solid var(--border-color);
          color: var(--text-secondary);
          cursor: pointer;
          transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          white-space: nowrap;
          font-size: 0.85rem;
          font-weight: 500;
          letter-spacing: 0.3px;
        }
        .mood-chip:hover {
          background: white;
          transform: translateY(-2px);
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
          border-color: var(--mood-color);
          color: var(--text-primary);
        }
        .mood-chip.active {
          background: white;
          color: var(--text-primary);
          box-shadow: 
            0 8px 20px rgba(0, 0, 0, 0.08), 
            0 0 0 1px var(--mood-color),
            0 0 20px -5px var(--mood-color);
          transform: translateY(-2px);
        }
        .mood-icon {
          width: 20px;
          height: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: transform 0.4s ease;
        }
        .mood-chip.active .mood-icon {
          transform: scale(1.1);
        }
        .mood-chip svg {
          transition: all 0.3s ease;
        }
        .mood-chip.active svg {
          stroke: var(--mood-color);
          stroke-width: 2.5;
        }

        .mood-selector-container.compact .mood-chip {
          padding: 10px;
          width: 42px;
          height: 42px;
          justify-content: center;
        }
        
        [data-theme="dark"] .mood-chip {
           background: rgba(255, 255, 255, 0.05);
           border-color: rgba(255, 255, 255, 0.1);
        }
        [data-theme="dark"] .mood-chip:hover {
           background: rgba(255, 255, 255, 0.1);
        }
        [data-theme="dark"] .mood-chip.active {
           background: var(--element-bg);
           color: var(--text-primary);
        }
      `}</style>
    </div>
  );
};

export { MOODS };
export default MoodSelector;
