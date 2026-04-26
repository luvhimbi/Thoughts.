import React from 'react';
import RichTextEditor, { EditorTools } from '../../components/RichTextEditor';
import { MoodModal } from '../../components/MoodSelector';
import TemplateSelector from '../../components/TemplateSelector';
import DesignSelector from '../../components/DesignSelector';
import PromptSelector from '../../components/PromptSelector';

const JournalWriting = ({
  newThought,
  setNewThought,
  mood,
  setMood,
  design,
  setDesign,
  isRecording,
  toggleRecording,
  isSavingEntity,
  handleSaveThought,
  handleDiscard,
  handleApplyTemplate,
  handleApplyPrompt,
  showTemplates,
  setShowTemplates,
  showDesigns,
  setShowDesigns,
  showPrompts,
  setShowPrompts,
  draftStatus,
  editorRef,
  showMoodModal,
  setShowMoodModal,
  setIsWriting
}) => {
  return (
    <div className="editor-container animate-fade-in w-100">
      {/* Minimal Top Bar */}
      <div className="d-flex justify-content-between align-items-center mb-3 mb-md-4 w-100">
        {/* Left Side: Discard + Draft Status */}
        <div className="d-flex gap-3 align-items-center">
          <button
            onClick={handleDiscard}
            className="btn-editor-tool"
            title="Discard"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
          
          {draftStatus && (
            <span className="animate-fade-in" style={{ fontSize: '0.65rem', fontWeight: 500, opacity: 0.3, letterSpacing: '1px', textTransform: 'uppercase' }}>
              {draftStatus === 'restored' ? 'Restored' : 'Saved'}
            </span>
          )}
        </div>

        {/* Right Side: Tools + Save */}
        <div className="d-flex gap-1 align-items-center">
          <EditorTools editor={editorRef.current} />

          <div style={{ width: '1px', height: '16px', background: 'var(--border-color)', margin: '0 4px' }}></div>

          <button
            onClick={toggleRecording}
            className={`btn-editor-tool ${isRecording ? 'recording' : ''}`}
            title="Voice Input"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" x2="12" y1="19" y2="22"></line></svg>
          </button>

          <button
            onClick={() => setShowDesigns(true)}
            className="btn-editor-tool"
            title="Design"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2"></rect><path d="M3 9h18"></path><path d="M9 21V9"></path></svg>
          </button>

          <button
            onClick={() => setShowTemplates(true)}
            className="btn-editor-tool"
            title="Templates"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>
          </button>

          <button
            onClick={() => setShowPrompts(true)}
            className="btn-editor-tool"
            title="Prompts"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
          </button>

          <div style={{ width: '1px', height: '16px', background: 'var(--border-color)', margin: '0 4px' }}></div>

          <button
            onClick={handleSaveThought}
            className="btn-editor-tool btn-editor-save"
            disabled={(!newThought.trim() || newThought === '<p></p>') && !isRecording || isSavingEntity}
            title="Save"
          >
            {isSavingEntity
              ? <span className="loading-dots" style={{ height: '16px' }}><span></span><span></span><span></span></span>
              : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
            }
          </button>
        </div>
      </div>

      {showTemplates && (
        <TemplateSelector
          onSelect={handleApplyTemplate}
          onClose={() => setShowTemplates(false)}
        />
      )}

      {showPrompts && (
        <PromptSelector
          onSelect={handleApplyPrompt}
          onClose={() => setShowPrompts(false)}
        />
      )}

      {showDesigns && (
        <DesignSelector
          selectedDesign={design}
          onSelect={setDesign}
          onClose={() => setShowDesigns(false)}
        />
      )}

      {/* Writing Area */}
      <div className="flex-grow-1 position-relative editor-scroll-container px-0 px-md-4" style={{ paddingTop: '16px' }}>
        {(!newThought || newThought === '<p></p>') && (
          <div
            className="position-absolute translate-middle-x start-50 text-center animate-fade-in"
            style={{ top: '38%', pointerEvents: 'none', width: '100%', maxWidth: '380px', zIndex: 5 }}
          >
            <p className="mb-3" style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 300, lineHeight: 1.6, fontStyle: 'italic' }}>
              {(() => {
                const prompts = [
                  "What's on your mind right now?",
                  "What moment from today do you want to remember?",
                  "What would you tell your future self?",
                  "What are you grateful for in this moment?",
                  "What's something you need to let go of?",
                  "Describe how you feel, without judgement.",
                ];
                const index = Math.floor(Date.now() / 60000) % prompts.length;
                return prompts[index];
              })()}
            </p>
            <button
              onClick={() => setShowTemplates(true)}
              className="btn btn-link text-secondary text-decoration-none p-0"
              style={{ pointerEvents: 'auto', opacity: 0.5, fontSize: '0.8rem', fontWeight: 500 }}
            >
              or try a template
            </button>
          </div>
        )}
        <RichTextEditor
          content={newThought}
          onChange={setNewThought}
          editorRef={editorRef}
          design={design}
          placeholder="Begin writing..."
        />
      </div>

      <MoodModal 
        isOpen={showMoodModal} 
        onSelect={(id) => {
          setMood(id);
          setIsWriting(true);
        }} 
        onClose={() => {
          setShowMoodModal(false);
          setIsWriting(true);
        }}
      />
    </div>
  );
};

export default JournalWriting;
