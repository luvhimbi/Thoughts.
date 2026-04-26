import React from 'react';
import RichTextEditor, { EditorTools } from '../../components/RichTextEditor';
import MoodSelector from '../../components/MoodSelector';
import TemplateSelector from '../../components/TemplateSelector';
import DesignSelector from '../../components/DesignSelector';

const JournalEditing = ({
  editContent,
  setEditContent,
  editMood,
  setEditMood,
  editDesign,
  setEditDesign,
  saving,
  handleSaveEdit,
  handleCancelEdit,
  handleApplyTemplate,
  showTemplates,
  setShowTemplates,
  showDesigns,
  setShowDesigns,
  showMoreMenu,
  setShowMoreMenu,
  moreMenuRef,
  editorRef
}) => {
  return (
    <div className="animate-fade-in">
      {/* Toolbar matching Journal.jsx */}
      <div className="d-flex justify-content-between align-items-center mb-4 w-100">
        <div className="d-flex gap-2 align-items-center" style={{ opacity: 0.4 }}>
          <span className="small text-uppercase" style={{ letterSpacing: '1.5px', fontSize: '0.7rem', fontWeight: 600 }}>Editing Reflection</span>
        </div>

        <div className="d-flex gap-1 align-items-center">
          <button
            onClick={handleCancelEdit}
            className="btn-editor-tool"
            title="Cancel"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>

          <div style={{ width: '1px', height: '16px', background: 'var(--border-color)', margin: '0 2px' }}></div>

          <EditorTools editor={editorRef.current} />

          <div className="position-relative" ref={moreMenuRef}>
            <button
              onClick={() => setShowMoreMenu(!showMoreMenu)}
              className="btn-editor-tool"
              title="More options"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="5" r="2"></circle><circle cx="12" cy="12" r="2"></circle><circle cx="12" cy="19" r="2"></circle></svg>
            </button>

            {showMoreMenu && (
              <>
                <div className="editor-more-backdrop" onClick={() => setShowMoreMenu(false)}></div>
                <div className="editor-more-dropdown animate-fade-in">
                  <button
                    onClick={() => { setShowDesigns(true); setShowMoreMenu(false); }}
                    className="editor-more-item"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2"></rect><path d="M3 9h18"></path><path d="M9 21V9"></path></svg>
                    <span>Design</span>
                  </button>
                  <button
                    onClick={() => { setShowTemplates(true); setShowMoreMenu(false); }}
                    className="editor-more-item"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>
                    <span>Templates</span>
                  </button>
                </div>
              </>
            )}
          </div>

          <div style={{ width: '1px', height: '16px', background: 'var(--border-color)', margin: '0 2px' }}></div>

          <button
            onClick={handleSaveEdit}
            className="btn-editor-tool btn-editor-save"
            disabled={saving || !editContent || editContent === '<p></p>'}
            title="Save"
          >
            {saving 
              ? <span className="loading-dots" style={{ height: '16px' }}><span></span><span></span><span></span></span> 
              : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
            }
          </button>
        </div>
      </div>

      {/* Mood Selection (Top) matching Journal.jsx */}
      <div className="mb-3 animate-fade-in">
        <div className="d-flex justify-content-between align-items-baseline mb-2">
          <p className="small text-secondary m-0 fw-500" style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Current Mood</p>
          {editMood && (
            <button 
              onClick={() => setEditMood(null)} 
              className="btn btn-link text-secondary text-decoration-none p-0"
              style={{ fontSize: '0.7rem', fontWeight: 400 }}
            >
              Clear
            </button>
          )}
        </div>
        <MoodSelector selectedMood={editMood} onSelect={setEditMood} compact={true} />
        <div style={{ width: '100%', height: '1px', background: 'var(--border-color)', marginTop: '16px', opacity: 0.5 }}></div>
      </div>

      {showTemplates && (
        <TemplateSelector 
          onSelect={handleApplyTemplate} 
          onClose={() => setShowTemplates(false)} 
        />
      )}

      {showDesigns && (
        <DesignSelector 
          selectedDesign={editDesign}
          onSelect={setEditDesign} 
          onClose={() => setShowDesigns(false)} 
        />
      )}

      <RichTextEditor 
        content={editContent} 
        onChange={setEditContent}
        editorRef={editorRef}
        design={editDesign}
        placeholder="Edit your reflection..."
      />
    </div>
  );
};

export default JournalEditing;
