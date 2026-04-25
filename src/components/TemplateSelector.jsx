import React, { useState } from 'react';
import { TEMPLATES } from '../constants/templates';

const TemplateSelector = ({ onSelect, onClose }) => {
  const [activeCategory, setActiveCategory] = useState('All');
  const categories = ['All', 'Mindfulness', 'Reflections', 'Creative'];

  const filteredTemplates = activeCategory === 'All' 
    ? TEMPLATES 
    : TEMPLATES.filter(t => t.category === activeCategory);

  return (
    <div className="template-selector-overlay animate-fade-in" onClick={onClose}>
      <div className="template-selector-modal animate-slide-up" onClick={e => e.stopPropagation()}>
        <div className="modal-header d-flex justify-content-between align-items-center mb-2">
          <div>
            <h3 className="m-0 h5 fw-600" style={{ letterSpacing: '-0.5px' }}>Templates</h3>
            <p className="m-0 mt-1" style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 300 }}>Choose a structure to guide your writing.</p>
          </div>
          <button className="btn-close-minimal" onClick={onClose} aria-label="Close">
             <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>

        <div className="category-tabs d-flex gap-2 mb-4 mt-3">
          {categories.map(cat => (
            <button
              key={cat}
              className={`category-tab ${activeCategory === cat ? 'active' : ''}`}
              onClick={() => setActiveCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="templates-grid">
          {filteredTemplates.map(template => (
            <button
              key={template.id}
              className="template-card-btn"
              onClick={() => {
                onSelect(template.content, template.design);
                onClose();
              }}
            >
              <div className="template-info">
                 <span className="template-name">{template.name}</span>
                 <span className="template-description">{template.description}</span>
              </div>
              <span className="template-arrow">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"></path><path d="m12 5 7 7-7 7"></path></svg>
              </span>
            </button>
          ))}
        </div>
      </div>
      
      <style jsx="true">{`
        .template-selector-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0, 0, 0, 0.05);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          z-index: 2000;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
        }
        .template-selector-modal {
          background: var(--bg-primary);
          border: 1px solid var(--border-color);
          border-radius: 24px;
          width: 100%;
          max-width: 520px;
          padding: 28px 32px 32px;
          box-shadow: 0 30px 60px rgba(0, 0, 0, 0.12);
        }
        [data-theme="dark"] .template-selector-modal {
          background: var(--bg-secondary);
          box-shadow: 0 30px 60px rgba(0, 0, 0, 0.4);
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
          flex-shrink: 0;
        }
        .btn-close-minimal:hover {
          background: rgba(0,0,0,0.05);
          color: var(--text-primary);
        }
        [data-theme="dark"] .btn-close-minimal:hover {
          background: rgba(255,255,255,0.05);
        }
        .category-tab {
          padding: 7px 16px;
          border-radius: 100px;
          border: 1px solid var(--border-color);
          background: transparent;
          color: var(--text-secondary);
          font-size: 0.8rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .category-tab.active {
          background: var(--text-primary);
          color: var(--bg-primary);
          border-color: var(--text-primary);
        }
        .templates-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 8px;
          max-height: 380px;
          overflow-y: auto;
          padding-right: 4px;
        }
        .templates-grid::-webkit-scrollbar {
          width: 3px;
        }
        .templates-grid::-webkit-scrollbar-thumb {
          background: var(--border-color);
          border-radius: 10px;
        }
        .template-card-btn {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          padding: 16px 18px;
          background: transparent;
          border: 1px solid transparent;
          border-radius: 14px;
          cursor: pointer;
          transition: all 0.25s ease;
          text-align: left;
          width: 100%;
        }
        [data-theme="dark"] .template-card-btn {
          background: transparent;
        }
        .template-card-btn:hover {
          background: var(--bg-secondary);
          border-color: var(--border-color);
        }
        [data-theme="dark"] .template-card-btn:hover {
          background: var(--element-bg);
        }
        .template-info {
          display: flex;
          flex-direction: column;
          min-width: 0;
        }
        .template-name {
          font-size: 0.95rem;
          font-weight: 600;
          color: var(--text-primary);
          line-height: 1.3;
        }
        .template-description {
          font-size: 0.8rem;
          color: var(--text-secondary);
          margin-top: 3px;
          font-weight: 300;
          line-height: 1.4;
        }
        .template-arrow {
          color: var(--text-secondary);
          opacity: 0;
          transform: translateX(-4px);
          transition: all 0.25s ease;
          flex-shrink: 0;
        }
        .template-card-btn:hover .template-arrow {
          opacity: 0.6;
          transform: translateX(0);
        }
      `}</style>
    </div>
  );
};

export default TemplateSelector;
