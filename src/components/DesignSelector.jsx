import React from 'react';

const DESIGNS = [
  { id: 'minimal', name: 'Minimal', symbol: '—', description: 'Clean and modern focus' },
  { id: 'notebook', name: 'Notebook', symbol: '////', description: 'Classic lined paper feel' },
  { id: 'zen', name: 'Zen', symbol: '~', description: 'Centered and airy layout' },
  { id: 'typewriter', name: 'Typewriter', symbol: 'Tt', description: 'Monospace, retro typed feel' },
  { id: 'poetic', name: 'Poetic', symbol: 'Aa', description: 'Serif, literary with breathing room' },
  { id: 'darkink', name: 'Dark Ink', symbol: '/', description: 'High contrast, inverted palette' },
  { id: 'letter', name: 'Letter', symbol: 'Ll', description: 'Warm handwritten tone' }
];

const DesignSelector = ({ selectedDesign, onSelect, onClose }) => {
  return (
    <div className="design-selector-overlay animate-fade-in" onClick={onClose}>
      <div className="design-selector-modal animate-slide-up" onClick={e => e.stopPropagation()}>
        <div className="modal-header d-flex justify-content-between align-items-center mb-4">
          <h3 className="m-0 h5 fw-600">Journal Design</h3>
          <button className="btn-close-minimal" onClick={onClose}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>

        <div className="designs-grid">
          {DESIGNS.map(design => (
            <button
              key={design.id}
              className={`design-card-btn ${selectedDesign === design.id ? 'active' : ''}`}
              onClick={() => {
                onSelect(design.id);
                onClose();
              }}
            >
              <div className="design-icon">{design.symbol}</div>
              <div className="design-info">
                <span className="design-name">{design.name}</span>
                <span className="design-desc">{design.description}</span>
              </div>
              {selectedDesign === design.id && <div className="active-check">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
              </div>}
            </button>
          ))}
        </div>
      </div>

      <style jsx="true">{`
        .design-selector-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0, 0, 0, 0.05);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          z-index: 2000;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
        }
        .design-selector-modal {
          background: var(--bg-primary);
          border: 1px solid var(--border-color);
          border-radius: 24px;
          width: 100%;
          max-width: 400px;
          padding: 28px 32px 32px;
          box-shadow: 0 30px 60px rgba(0, 0, 0, 0.12);
        }
        [data-theme="dark"] .design-selector-modal {
          background: var(--bg-secondary);
        }
        .btn-close-minimal {
          background: none;
          border: none;
          color: var(--text-secondary);
          cursor: pointer;
          padding: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
          border-radius: 50%;
        }
        .btn-close-minimal:hover {
          background: rgba(0,0,0,0.05);
          color: var(--text-primary);
        }
        .designs-grid {
          display: flex;
          flex-direction: column;
          gap: 8px;
          max-height: 400px;
          overflow-y: auto;
          padding-right: 4px;
        }
        .designs-grid::-webkit-scrollbar {
          width: 3px;
        }
        .designs-grid::-webkit-scrollbar-thumb {
          background: var(--border-color);
          border-radius: 10px;
        }
        .design-card-btn {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 16px;
          background: transparent;
          border: 1px solid transparent;
          border-radius: 14px;
          cursor: pointer;
          transition: all 0.2s ease;
          text-align: left;
          position: relative;
        }
        [data-theme="dark"] .design-card-btn {
          background: transparent;
        }
        .design-card-btn:hover {
          background: var(--bg-secondary);
          border-color: var(--border-color);
        }
        .design-card-btn.active {
          background: var(--bg-secondary);
          border-color: var(--text-primary);
        }
        .design-icon {
          font-size: 1rem;
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--bg-secondary);
          border-radius: 10px;
          border: 1px solid var(--border-color);
          color: var(--text-secondary);
          font-weight: 600;
          letter-spacing: -1px;
          flex-shrink: 0;
        }
        .design-card-btn.active .design-icon {
          background: var(--text-primary);
          color: var(--bg-primary);
          border-color: var(--text-primary);
        }
        .design-info {
          display: flex;
          flex-direction: column;
        }
        .design-name {
          font-weight: 600;
          color: var(--text-primary);
          font-size: 0.95rem;
        }
        .design-desc {
          font-size: 0.75rem;
          color: var(--text-secondary);
          font-weight: 300;
        }
        .active-check {
          position: absolute;
          right: 18px;
          color: var(--text-primary);
          display: flex;
          align-items: center;
        }
      `}</style>
    </div>
  );
};

export default DesignSelector;
