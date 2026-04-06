import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { journalService } from '../services/journalService';
import { auth } from '../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { useSettings } from '../contexts/SettingsContext';
import GuestWarning from '../components/GuestWarning';
import { authService } from '../services/authService';
import RichTextEditor from '../components/RichTextEditor';
import MoodSelector, { MOODS } from '../components/MoodSelector';

function ViewEntry() {
  const { id } = useParams();
  const [user, setUser] = useState(null);
  const [entry, setEntry] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speakingIndex, setSpeakingIndex] = useState(-1);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState('');
  const [editMood, setEditMood] = useState(null);
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();
  const { voiceTone } = useSettings();

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
      unsubscribe();
      window.speechSynthesis.cancel();
    };
  }, [id, navigate]);

  const speakSegment = (segments, index) => {
    if (index >= segments.length) {
      setIsSpeaking(false);
      setSpeakingIndex(-1);
      return;
    }

    setSpeakingIndex(index);
    const utterance = new SpeechSynthesisUtterance(segments[index]);
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

    utterance.onend = () => speakSegment(segments, index + 1);
    utterance.onerror = () => {
      setIsSpeaking(false);
      setSpeakingIndex(-1);
    };

    window.speechSynthesis.speak(utterance);
  };

  const handleSpeak = () => {
    if (!entry) return;

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      setSpeakingIndex(-1);
      return;
    }

    const stripHtml = (html) => {
      const tmp = document.createElement("DIV");
      tmp.innerHTML = html;
      return tmp.textContent || tmp.innerText || "";
    };

    const plainText = stripHtml(entry.content);
    const segments = plainText.split('\n').filter(s => s.trim().length > 0);
    setIsSpeaking(true);
    speakSegment(segments, 0);
  };

  const handleEdit = () => {
    setIsEditing(true);
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      setSpeakingIndex(-1);
    }
  };

  const handleCancelEdit = () => {
    setEditContent(entry.content);
    setEditMood(entry.mood || null);
    setIsEditing(false);
  };

  const handleSaveEdit = async () => {
    const isActuallyEmpty = !editContent || editContent === '<p></p>' || editContent.replace(/<[^>]*>/g, '').trim() === '';
    if (isActuallyEmpty) return;

    setSaving(true);
    try {
      await journalService.updateEntry(id, editContent, editMood);
      setEntry({ ...entry, content: editContent, mood: editMood });
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

  if (loading) {
    return (
      <div className="vh-100 d-flex flex-column align-items-center justify-content-center" style={{ backgroundColor: 'var(--bg-primary)' }}>
        <div className="custom-spinner mb-3"></div>
        <p className="text-secondary small animate-pulse">preparing your thought...</p>
      </div>
    );
  }

  if (!entry) return null;

  return (
    <>
      {user && user.isAnonymous && <GuestWarning />}
      <div className="journal-page min-vh-100 d-flex flex-column animate-fade-in" style={{ backgroundColor: 'var(--bg-primary)' }}>
      
        {/* Header */}
        <header className="container py-4 border-bottom d-flex justify-content-between align-items-center">
          <button onClick={() => navigate('/journal')} className="btn btn-link text-secondary text-decoration-none p-0 d-flex align-items-center gap-2">
            <span style={{ fontSize: '1.2rem' }}>←</span> 
            <span className="d-none d-md-inline" style={{ fontWeight: 500 }}>Return</span>
          </button>
          
          {!isEditing && (
            <div className="d-flex align-items-center gap-2">
               <button onClick={handleSpeak} className={`btn-header-pill ${isSpeaking ? 'active' : ''}`}>
                  <span>{isSpeaking ? '⏹' : '◌'}</span>
                  <span>{isSpeaking ? 'Stop' : 'Listen'}</span>
               </button>
               <button onClick={handleEdit} className="btn-header-pill">
                  <span>✎</span>
                  <span>Edit</span>
               </button>
            </div>
          )}

          <div className="d-flex align-items-center gap-3 text-secondary">
             <time className="small fw-500 d-none d-md-block" style={{ letterSpacing: '0.5px' }}>{entry.dateString}</time>
          </div>
          <div className="d-md-none" style={{ width: '20px' }}></div>
        </header>

        <main className="container flex-grow-1 py-5" style={{ maxWidth: '750px' }}>
          {isEditing ? (
            <div className="animate-fade-in">
              <div className="d-flex justify-content-between align-items-center mb-4 pb-3 border-bottom">
                <div className="d-flex align-items-center gap-2" style={{ opacity: 0.5 }}>
                  <span className="small text-uppercase" style={{ letterSpacing: '1.5px', fontSize: '0.75rem' }}>Editing Thought</span>
                </div>
                <div className="d-flex gap-3 align-items-center">
                  <button 
                    onClick={handleCancelEdit}
                    className="btn btn-link text-secondary text-decoration-none p-0 d-flex align-items-center gap-1"
                    style={{ fontWeight: 400, fontSize: '0.9rem' }}
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleSaveEdit}
                    className="btn btn-dark px-4 py-1 small d-flex justify-content-center align-items-center"
                    disabled={saving}
                    style={{ borderRadius: '100px', fontWeight: 500, minWidth: '80px' }}
                  >
                    {saving ? <span className="loading-dots text-white" style={{ height: '18px' }}><span></span><span></span><span></span></span> : 'Save'}
                  </button>
                </div>
              </div>

              <MoodSelector selectedMood={editMood} onSelect={setEditMood} />

              <RichTextEditor 
                content={editContent} 
                onChange={setEditContent}
                placeholder="Edit your reflection..."
              />
            </div>
          ) : (
            <div className={`${isSpeaking ? 'reading-mode-active' : ''}`}>
              <article className="entry-content mb-5 px-0">
                <div 
                  className="rich-content-view"
                  dangerouslySetInnerHTML={{ __html: entry.content }}
                  style={{ 
                    fontSize: '1.2rem', 
                    lineHeight: '1.8', 
                    color: 'var(--text-primary)' 
                  }}
                />

                {entry.mood && (
                  <div className="entry-mood-display animate-fade-in mt-4 pt-3 d-flex align-items-center gap-3">
                    <div 
                      className="mood-aura-dot" 
                      style={{ backgroundColor: MOODS.find(m => m.id === entry.mood)?.color }}
                    >
                      {MOODS.find(m => m.id === entry.mood)?.icon}
                    </div>
                    <div className="mood-text">
                       <span className="small text-secondary text-uppercase" style={{ letterSpacing: '1px', fontSize: '0.7rem' }}>Current Mood</span>
                       <p className="m-0 fw-bold">{MOODS.find(m => m.id === entry.mood)?.label}</p>
                    </div>
                  </div>
                )}
                
                <div className="mt-5 pt-5 text-center" style={{ opacity: 0.4 }}>
                    <div className="x-small text-secondary text-uppercase mb-2" style={{ letterSpacing: '2px' }}>Thought Captured</div>
                    <div className="fw-bold text-dark">{entry.dateString}</div>
                </div>
              </article>

              <div className="d-flex justify-content-center pt-5">
                <button 
                  onClick={handleDelete}
                  className="btn btn-link text-secondary text-decoration-none small d-flex align-items-center gap-2"
                  style={{ opacity: 0.4, transition: 'all 0.3s ease' }}
                  onMouseEnter={(e) => e.currentTarget.style.opacity = 1}
                  onMouseLeave={(e) => e.currentTarget.style.opacity = 0.4}
                >
                  <span>✕</span>
                  Release this thought forever
                </button>
              </div>
            </div>
          )}
        </main>

        <footer className="container py-5 text-center text-secondary small border-top mt-auto" style={{ opacity: 0.4 }}>
           Your private space for reflection.
        </footer>
      </div>
    </>
  );
}

export default ViewEntry;
