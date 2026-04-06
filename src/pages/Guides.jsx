import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';

const GUIDES = [
  {
    id: 'morning-clarity',
    title: 'Morning Clarity',
    focus: 'Energy',
    icon: 'A',
    desc: 'Align your mind before the day begins.',
    method: 'The 3-3-1 Rule',
    prompts: [
      '3 things I am grateful for today.',
      '3 things that would make today great.',
      '1 daily affirmation (e.g., "I am capable").'
    ],
    color: '#fff9db'
  },
  {
    id: 'evening-review',
    title: 'Evening Review',
    focus: 'Reflection',
    icon: 'B',
    desc: 'Process the day and clear your head for sleep.',
    method: 'The Triple Check',
    prompts: [
      'What went well today?',
      'What challenged me?',
      'What is one thing I learned?'
    ],
    color: '#e7f5ff'
  },
  {
    id: 'unsent-letter',
    title: 'The Unsent Letter',
    focus: 'Emotion',
    icon: 'C',
    desc: 'Cahartic release for complex feelings.',
    method: 'Honest Expression',
    prompts: [
      'Pick someone you have unresolved feelings for.',
      'Write exactly what you wish you could say.',
      'Acknowledge the feeling, then let it go.'
    ],
    color: '#fff0f6'
  },
  {
    id: 'why-chain',
    title: 'The Why Chain',
    focus: 'Insight',
    icon: 'D',
    desc: 'Get to the root of any thought or feeling.',
    method: 'Five Whys',
    prompts: [
      'State a problem or feeling you have.',
      'Ask "Why?" and write the answer.',
      'Repeat 5 times until you find the core truth.'
    ],
    color: '#f3f0ff'
  },
  {
    id: 'bullet-reflection',
    title: 'Bullet Reflection',
    focus: 'Routine',
    icon: 'E',
    desc: 'Fast, efficient logging for busy days.',
    method: 'Rapid Logging',
    prompts: [
      'Log 3 small wins from today.',
      'Log 1 "work-in-progress" task.',
      'Write one word that describes your mood.'
    ],
    color: '#f4fce3'
  }
];

function Guides() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [selectedGuide, setSelectedGuide] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) navigate('/login');
      setLoading(false);
    });
    return unsubscribe;
  }, [navigate]);

  if (loading) return null;

  return (
    <div className="journal-page min-vh-100 d-flex flex-column animate-fade-in" style={{ backgroundColor: 'var(--bg-primary)' }}>
      <header className="container py-4 border-bottom d-flex justify-content-between align-items-center">
        <button onClick={() => navigate('/journal')} className="btn btn-link text-secondary text-decoration-none p-0 d-flex align-items-center gap-2">
          <span style={{ fontSize: '1.2rem' }}>←</span> 
          <span style={{ fontWeight: 500 }}>Journal</span>
        </button>
        <div className="fw-bold text-dark" style={{ fontSize: '1.2rem', letterSpacing: '-1px' }}>Inspiration</div>
        <div style={{ width: '80px' }}></div>
      </header>

      <main className="container flex-grow-1 py-5">
        <div className="text-center mb-5">
          <h1 className="h3 fw-bold mb-2">Journaling Guides</h1>
          <p className="text-secondary small">Scientifically-backed techniques to help you grow.</p>
        </div>

        <div className="row g-4">
          {GUIDES.map(guide => (
            <div key={guide.id} className="col-12 col-md-6 col-lg-4">
              <div 
                className="guide-card h-100 p-4 rounded-4 border bg-white shadow-sm reveal-click"
                onClick={() => setSelectedGuide(selectedGuide?.id === guide.id ? null : guide)}
              >
                <div className="d-flex justify-content-between align-items-start mb-3">
                  <div className="guide-icon-box fs-2">{guide.icon}</div>
                  <span className="badge bg-light text-secondary fw-normal border px-2 py-1 x-small">{guide.focus}</span>
                </div>
                <h3 className="h5 fw-bold mb-2" style={{ letterSpacing: '-0.5px' }}>{guide.title}</h3>
                <p className="small text-secondary mb-3">{guide.desc}</p>
                
                <div className="guide-method d-flex align-items-center gap-2 mb-3">
                  <span className="xx-small fw-bold text-uppercase text-secondary tracking-widest">Method:</span>
                  <span className="x-small fw-600 text-dark">{guide.method}</span>
                </div>

                {selectedGuide?.id === guide.id && (
                  <div className="guide-content animate-slide-up mt-3 pt-3 border-top">
                    <h4 className="xx-small fw-bold text-secondary text-uppercase mb-2">Try this:</h4>
                    <ul className="list-unstyled mb-0">
                      {guide.prompts.map((prompt, i) => (
                        <li key={i} className="small mb-2 d-flex gap-2">
                          <span className="text-secondary opacity-50">—</span>
                          <span>{prompt}</span>
                        </li>
                      ))}
                    </ul>
                    <button 
                      className="btn btn-dark btn-sm w-100 mt-3 rounded-pill"
                      onClick={(e) => {
                        e.stopPropagation();
                        // Copy first prompt to editor? 
                        // For now just navigate back with motivation
                        navigate('/journal', { state: { startWriting: true } });
                      }}
                    >
                      Start Writing
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </main>

      <footer className="container py-5 text-center" style={{ opacity: 0.5 }}>
        <p className="x-small">Studies show consistent journaling can reduce stress and improve immune function.</p>
      </footer>
    </div>
  );
}

export default Guides;
