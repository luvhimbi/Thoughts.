import React, { useState, useEffect } from 'react';
import { promptService } from '../services/promptService';

const PromptSelector = ({ onSelect, onClose }) => {
  const [prompts, setPrompts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState('All');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPrompts = async () => {
      try {
        const allPrompts = await promptService.getPrompts();
        const cats = await promptService.getCategories();
        setPrompts(allPrompts);
        setCategories(['All', ...cats]);
      } catch (error) {
        console.error("Failed to load prompts:", error);
      } finally {
        setLoading(false);
      }
    };
    loadPrompts();
  }, []);

  const filteredPrompts = (activeCategory === 'All' 
    ? prompts 
    : prompts.filter(p => p.category === activeCategory)).slice(0, 4);

  return (
    <div className="prompt-selector-overlay animate-fade-in" onClick={onClose}>
      <div className="prompt-selector-content animate-slide-up" onClick={(e) => e.stopPropagation()}>
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h3 className="h5 fw-bold m-0">Writing Prompts</h3>
            <p className="text-secondary small m-0">Need a spark? Choose a prompt to begin.</p>
          </div>
          <button onClick={onClose} className="btn-close-minimal">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>

        {/* Categories */}
        <div className="category-scroll mb-4">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`category-pill ${activeCategory === cat ? 'active' : ''}`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Prompts List */}
        <div className="prompts-list-scroll">
          {loading ? (
            <div className="text-center py-5">
              <div className="custom-spinner mx-auto mb-2"></div>
              <p className="text-secondary small">finding inspiration...</p>
            </div>
          ) : filteredPrompts.length > 0 ? (
            <div className="prompts-grid">
              {filteredPrompts.map(prompt => (
                <button
                  key={prompt.id}
                  onClick={() => {
                    onSelect(prompt.text);
                    onClose();
                  }}
                  className="prompt-card"
                >
                  <div className="prompt-category-tag">{prompt.category}</div>
                  <p className="prompt-text">{prompt.text}</p>
                  {prompt.description && <p className="prompt-desc">{prompt.description}</p>}
                </button>
              ))}
            </div>
          ) : (
            <div className="text-center py-5 opacity-50">
              <p>No prompts found in this category.</p>
            </div>
          )}
        </div>
      </div>

      <style>{`
        .prompt-selector-overlay {
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
          z-index: 5500;
        }
        .prompt-selector-content {
          background: var(--bg-primary);
          width: 90%;
          max-width: 480px;
          max-height: 75vh;
          padding: 35px;
          display: flex;
          flex-direction: column;
          box-shadow: 0 30px 90px rgba(0,0,0,0.2);
          border: 1px solid var(--border-color);
          border-radius: 32px;
          margin-bottom: 5vh;
        }
        .btn-close-minimal {
          background: transparent;
          border: none;
          color: var(--text-secondary);
          opacity: 0.4;
          transition: all 0.2s ease;
          padding: 4px;
        }
        .btn-close-minimal:hover {
          opacity: 1;
          color: var(--text-primary);
        }
        .category-scroll {
          display: flex;
          gap: 8px;
          overflow-x: auto;
          padding-bottom: 12px;
          margin-bottom: 20px;
          scrollbar-width: none;
          border-bottom: 1px solid var(--border-color);
        }
        .category-scroll::-webkit-scrollbar { display: none; }
        
        .category-pill {
          padding: 6px 14px;
          border-radius: 100px;
          border: none;
          background: transparent;
          color: var(--text-secondary);
          font-size: 0.75rem;
          font-weight: 600;
          white-space: nowrap;
          transition: all 0.3s ease;
          letter-spacing: 0.5px;
          text-transform: uppercase;
        }
        .category-pill.active {
          color: var(--text-primary);
          position: relative;
        }
        .category-pill.active::after {
          content: '';
          position: absolute;
          bottom: -12px;
          left: 0;
          right: 0;
          height: 2px;
          background: var(--text-primary);
        }
        
        .prompts-list-scroll {
          flex-grow: 1;
          overflow-y: auto;
          padding-right: 8px;
          margin-right: -8px;
        }
        .prompts-grid {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .prompt-card {
          text-align: left;
          background: var(--bg-secondary);
          border: 1px solid var(--border-color);
          border-radius: 16px;
          padding: 18px;
          transition: all 0.2s ease;
          cursor: pointer;
          width: 100%;
        }
        .prompt-card:hover {
          border-color: var(--text-primary);
          background: var(--bg-primary);
        }
        .prompt-category-tag {
          font-size: 0.6rem;
          text-transform: uppercase;
          letter-spacing: 1px;
          color: var(--text-secondary);
          margin-bottom: 6px;
          font-weight: 700;
          opacity: 0.5;
        }
        .prompt-text {
          font-size: 0.95rem;
          margin: 0;
          color: var(--text-primary);
          line-height: 1.5;
          font-weight: 500;
        }
        .prompt-desc {
          display: none;
        }
        
        [data-theme="dark"] .prompt-card {
          background: rgba(255, 255, 255, 0.03);
        }
        [data-theme="dark"] .prompt-card:hover {
          background: rgba(255, 255, 255, 0.05);
        }
      `}</style>
    </div>
  );
};

export default PromptSelector;
