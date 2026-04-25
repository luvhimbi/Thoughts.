import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { journalService } from '../services/journalService';
import { auth } from '../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { useSettings } from '../contexts/SettingsContext';
import GuestWarning from '../components/GuestWarning';
import { authService } from '../services/authService';
import RichTextEditor, { EditorTools } from '../components/RichTextEditor';
import MoodSelector, { MOODS } from '../components/MoodSelector';
import DesignSelector from '../components/DesignSelector';
import TemplateSelector from '../components/TemplateSelector';

function ViewEntry() {
  const { id } = useParams();

  const isOnlyEmojis = (htmlContent) => {
    if (!htmlContent) return false;
    const plainText = htmlContent.replace(/<[^>]*>/g, '').replace(/\s+/g, '');
    if (!plainText) return false;
    return /^[\p{Emoji_Presentation}\p{Extended_Pictographic}]+$/u.test(plainText);
  };

  const [user, setUser] = useState(null);
  const [entry, setEntry] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speakingIndex, setSpeakingIndex] = useState(-1);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState('');
  const [editMood, setEditMood] = useState(null);
  const [editDesign, setEditDesign] = useState('minimal');
  const [saving, setSaving] = useState(false);
  const [showDesigns, setShowDesigns] = useState(false);
  const navigate = useNavigate();
  const { voiceTone } = useSettings();
  const speakingRef = useRef(false);
  const editorRef = useRef(null);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const moreMenuRef = useRef(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        try {
          await authService.ensureUserDocument(currentUser.uid);
          setUser(currentUser);
          
          const data = await journalService.getEntry(id);
          if (data && data.userId === currentUser.uid) {
            setEntry(data);
            setEditContent(data.content);
            setEditMood(data.mood || null);
            setEditDesign(data.design || 'minimal');
          } else {
            navigate('/journal');
          }
        } catch (error) {
          console.error("Error loading entry:", error);
        } finally {
          setLoading(false);
        }
      } else {
        navigate('/login');
      }
    });

    return () => {
      speakingRef.current = false;
      unsubscribe();
      window.speechSynthesis.cancel();
    };
  }, [id, navigate]);

  const [segments, setSegments] = useState([]);

  useEffect(() => {
    if (entry && !isEditing) {
      const stripHtml = (html) => {
        let processed = html.replace(/<br\s*\/?>/gi, '\n');
        processed = processed.replace(/<\/p>/gi, '\n\n');
        processed = processed.replace(/<\/div>/gi, '\n');
        processed = processed.replace(/<\/h[1-6]>/gi, '\n\n');
        processed = processed.replace(/<\/li>/gi, '\n');
        const tmp = document.createElement("DIV");
        tmp.innerHTML = processed;
        return tmp.textContent || tmp.innerText || "";
      };

      const plainText = stripHtml(entry.content);
      const chunks = [];
      plainText.split('\n').forEach(line => {
        const trimmed = line.trim();
        if (!trimmed) return;
        const sentenceLike = trimmed.replace(/([.!?])\s+/g, "$1~").split("~");
        sentenceLike.forEach(s => {
            if (s.trim().length > 0) chunks.push(s.trim());
        });
      });
      setSegments(chunks);
    }
  }, [entry, isEditing]);

  const speakSegment = (index) => {
    if (!speakingRef.current || index >= segments.length) {
      setIsSpeaking(false);
      setSpeakingIndex(-1);
      speakingRef.current = false;
      return;
    }

    setSpeakingIndex(index);
    const utterance = new SpeechSynthesisUtterance(segments[index]);
    window.__currentUtterance = utterance; 
    
    const voices = window.speechSynthesis.getVoices();
    let selectedVoice = null;

    if (voiceTone === 'Friendly') {
      selectedVoice = voices.find(v => (v.name.includes('Female') || v.name.includes('Google UK English Female') || v.name.includes('Samantha') || v.name.includes('Victoria')) && v.lang.startsWith('en'));
      utterance.pitch = 1.1;
      utterance.rate = 0.95;
    } else if (voiceTone === 'Formal') {
      selectedVoice = voices.find(v => (v.name.includes('Male') || v.name.includes('Google UK English Male') || v.name.includes('Arthur') || v.name.includes('Daniel')) && v.lang.startsWith('en'));
      utterance.pitch = 0.9;
      utterance.rate = 1.0;
    } else {
      selectedVoice = voices.find(v => v.name.includes('Google US English') || v.name.includes('Natural')) || voices.find(v => v.lang.startsWith('en'));
      utterance.pitch = 1.0;
      utterance.rate = 1.0;
    }

    if (selectedVoice) utterance.voice = selectedVoice;

    utterance.onend = () => {
      if (speakingRef.current) speakSegment(index + 1);
    };
    
    utterance.onerror = (e) => {
      if (e.error !== 'canceled' && speakingRef.current) {
        setIsSpeaking(false);
        setSpeakingIndex(-1);
        speakingRef.current = false;
      }
    };

    window.speechSynthesis.speak(utterance);
  };

  const handleSpeak = () => {
    if (!entry || segments.length === 0) return;

    if (isSpeaking) {
      speakingRef.current = false;
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      setSpeakingIndex(-1);
      return;
    }

    window.speechSynthesis.cancel(); 
    setIsSpeaking(true);
    speakingRef.current = true;
    speakSegment(0);
  };

  const handleEdit = () => {
    setIsEditing(true);
    if (isSpeaking) {
      speakingRef.current = false;
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      setSpeakingIndex(-1);
    }
  };

  const handleCancelEdit = () => {
    setEditContent(entry.content);
    setEditMood(entry.mood || null);
    setEditDesign(entry.design || 'minimal');
    setIsEditing(false);
  };

  const handleSaveEdit = async () => {
    const isActuallyEmpty = !editContent || editContent === '<p></p>' || editContent.replace(/<[^>]*>/g, '').trim() === '';
    if (isActuallyEmpty) return;

    setSaving(true);
    try {
      await journalService.updateEntry(id, editContent, editMood, editDesign);
      setEntry({ ...entry, content: editContent, mood: editMood, design: editDesign });
      setIsEditing(false);
    } catch (error) {
      console.error("Error saving edit:", error);
      alert("Failed to save changes. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (window.confirm("Release this thought forever? This cannot be undone.")) {
      try {
        await journalService.deleteEntry(id);
        navigate('/journal');
      } catch (error) {
        console.error("Error deleting entry:", error);
      }
    }
  };

  const handleApplyTemplate = (templateContent) => {
    setEditContent(templateContent);
    setShowTemplates(false);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (moreMenuRef.current && !moreMenuRef.current.contains(event.target)) {
        setShowMoreMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (loading) {
    return (
      <div className="vh-100 d-flex flex-column align-items-center justify-content-center" style={{ backgroundColor: 'var(--bg-primary)' }}>
        <div className="custom-spinner mb-3"></div>
        <p className="text-secondary small animate-pulse">preparing your thought...</p>
      </div>
    );
  }

  if (!entry) return null;

  const currentMoodData = MOODS.find(m => m.id === entry.mood);

  return (
    <>
      {user && user.isAnonymous && <GuestWarning />}
      <div className="journal-page min-vh-100 d-flex flex-column animate-fade-in" style={{ backgroundColor: 'var(--bg-primary)' }}>
      
        {/* Header */}
        <header className="container py-3 d-flex justify-content-between align-items-center" style={{ borderBottom: '1px solid var(--border-color)' }}>
          <button onClick={() => navigate('/journal')} className="btn btn-link text-secondary text-decoration-none p-0 d-flex align-items-center gap-2" style={{ fontSize: '0.85rem' }}>
            <span>←</span> 
            <span style={{ fontWeight: 500 }}>Return</span>
          </button>
          
          <div className="d-flex align-items-center gap-2">
            {!isEditing && (
              <>
                <button onClick={handleSpeak} className={`view-action-pill ${isSpeaking ? 'active' : ''}`} title="Listen">
                  <span className="view-action-icon">{isSpeaking ? '⏹' : '◌'}</span>
                  <span>{isSpeaking ? 'Stop' : 'Listen'}</span>
                </button>
                <button onClick={handleEdit} className="view-action-pill" title="Edit">
                  <span className="view-action-icon">✎</span>
                  <span>Edit</span>
                </button>
                <button onClick={handleDelete} className="view-action-pill view-action-delete" title="Delete">
                  <span className="view-action-icon">✕</span>
                </button>
              </>
            )}
            <time className="small text-secondary ms-3 d-none d-md-block" style={{ fontWeight: 500 }}>{entry.dateString}</time>
          </div>
        </header>

        <main className="container flex-grow-1 py-5" style={{ maxWidth: '800px' }}>
          {isEditing ? (
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
          ) : (
            <div className="view-content-wrapper">
              <article className={`entry-display entry-design-${entry.design || 'minimal'}`}>
                {isSpeaking ? (
                  <div className="speaking-container">
                    {segments.map((text, i) => (
                      <span 
                        key={i} 
                        className={`speaking-segment ${speakingIndex === i ? 'highlighted' : ''}`}
                      >
                        {text}{' '}
                      </span>
                    ))}
                  </div>
                ) : (
                  <div 
                    className={`rich-content-view ${isOnlyEmojis(entry.content) ? 'emoji-only-entry' : ''}`}
                    dangerouslySetInnerHTML={{ __html: entry.content }}
                  />
                )}
              </article>

              {entry.mood && currentMoodData && (
                <div className="mood-display-card mt-5 animate-fade-in">
                  <div className="mood-display-icon" style={{ backgroundColor: currentMoodData.color }}>
                    {currentMoodData.icon}
                  </div>
                  <div className="mood-display-info">
                    <span className="mood-display-label">Current Mood</span>
                    <span className="mood-display-value">{currentMoodData.label}</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </main>

        <style jsx="true">{`
          .view-action-pill {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 6px 16px;
            border-radius: 100px;
            background: rgba(0, 0, 0, 0.03);
            border: 1px solid transparent;
            color: var(--text-secondary);
            font-size: 0.85rem;
            font-weight: 500;
            transition: all 0.2s ease;
            cursor: pointer;
          }
          .view-action-pill:hover {
            background: rgba(0, 0, 0, 0.06);
            color: var(--text-primary);
          }
          .view-action-delete:hover {
            background: rgba(220, 53, 69, 0.1) !important;
            color: #dc3545 !important;
            border-color: rgba(220, 53, 69, 0.2);
          }
          .view-action-pill.active {
            background: var(--text-primary);
            color: var(--bg-primary);
          }
          .view-action-icon {
            font-size: 0.9rem;
          }

          .speaking-segment {
            transition: all 0.3s ease;
            display: inline;
            color: var(--text-primary);
            opacity: 0.4;
          }
          .speaking-segment.highlighted {
            background: color-mix(in srgb, var(--text-primary) 8%, transparent);
            color: var(--text-primary);
            opacity: 1;
            border-radius: 4px;
            padding: 0 4px;
            box-shadow: 0 0 10px rgba(0,0,0,0.05);
          }

          .mood-display-card {
            display: flex;
            align-items: center;
            gap: 16px;
            padding: 20px;
            background: var(--bg-secondary);
            border: 1px solid var(--border-color);
            border-radius: 20px;
            width: fit-content;
          }
          .mood-display-icon {
            width: 44px;
            height: 44px;
            border-radius: 14px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
          }
          .mood-display-icon svg {
            width: 20px;
            height: 20px;
            stroke: currentColor;
          }
          .mood-display-info {
            display: flex;
            flex-direction: column;
          }
          .mood-display-label {
            font-size: 0.65rem;
            text-transform: uppercase;
            letter-spacing: 1px;
            color: var(--text-secondary);
            font-weight: 600;
          }
          .mood-display-value {
            font-size: 1.1rem;
            font-weight: 700;
            color: var(--text-primary);
          }

          .entry-footer-info .info-label {
            font-size: 0.65rem;
            text-transform: uppercase;
            letter-spacing: 2px;
            color: var(--text-secondary);
            margin-bottom: 6px;
          }
          .entry-footer-info .info-date {
            font-weight: 700;
            color: var(--text-primary);
            font-size: 0.95rem;
          }

          .btn-delete-thought {
            background: none;
            border: none;
            color: var(--text-secondary);
            font-size: 0.8rem;
            opacity: 0.4;
            transition: all 0.3s ease;
            cursor: pointer;
            padding: 10px 20px;
          }
          .btn-delete-thought:hover {
            opacity: 1;
            color: #dc3545;
          }

          [data-theme="dark"] .view-action-pill {
            background: rgba(255, 255, 255, 0.05);
          }
          [data-theme="dark"] .view-action-pill:hover {
            background: rgba(255, 255, 255, 0.1);
          }
          [data-theme="dark"] .speaking-segment {
            opacity: 0.3;
          }
          [data-theme="dark"] .speaking-segment.highlighted {
            background: rgba(255, 255, 255, 0.1);
          }
        `}</style>
      </div>
    </>
  );
}

export default ViewEntry;

