import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSettings } from '../contexts/SettingsContext';
import DesignSelector from '../components/DesignSelector';
import { showReleaseSuccess, showReleaseInfo } from '../utils/alertUtils';
import RichTextEditor from '../components/RichTextEditor';
import confetti from 'canvas-confetti';

const Release = () => {
  const [text, setText] = useState('');
  const [isBurning, setIsBurning] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState('');
  const [showDesigns, setShowDesigns] = useState(false);
  const [design, setDesign] = useState('minimal');
  
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const editorRef = useRef(null);
  const recognitionRef = useRef(null);
  const shouldRecordRef = useRef(false);
  
  const { theme } = useSettings();
  const navigate = useNavigate();

  // Speech Recognition Initialization
  useEffect(() => {
    const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;

      recognition.onresult = (event) => {
        let currentInterim = "";
        let finalTranscripts = "";

        for (let i = event.resultIndex; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            finalTranscripts += event.results[i][0].transcript + " ";
          } else {
            currentInterim += event.results[i][0].transcript;
          }
        }

        if (finalTranscripts && editorRef.current) {
          editorRef.current.chain().focus('end').insertContent(finalTranscripts).run();
          setText(editorRef.current.getHTML());
        }
        setInterimTranscript(currentInterim);
      };

      recognition.onerror = (event) => {
        if (event.error === 'not-allowed' || event.error === 'network') {
          shouldRecordRef.current = false;
          setIsRecording(false);
          setInterimTranscript("");
        }
      };

      recognition.onend = () => {
        if (shouldRecordRef.current) {
          try {
            recognition.start();
          } catch (e) {
            shouldRecordRef.current = false;
            setIsRecording(false);
            setInterimTranscript("");
          }
        } else {
          setIsRecording(false);
          setInterimTranscript("");
        }
      };

      recognitionRef.current = recognition;
    }

    return () => {
      shouldRecordRef.current = false;
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch (e) { /* noop */ }
      }
    };
  }, []);

  const toggleRecording = () => {
    if (isRecording) {
      shouldRecordRef.current = false;
      recognitionRef.current?.stop();
      setIsRecording(false);
      setInterimTranscript("");
    } else {
      if (recognitionRef.current) {
        try {
          shouldRecordRef.current = true;
          recognitionRef.current.start();
          setIsRecording(true);
        } catch (e) {
          shouldRecordRef.current = false;
          setIsRecording(false);
        }
      }
    }
  };

  const handleRelease = () => {
    if (!text.trim() || isBurning) return;
    setIsBurning(true);
    startBurnAnimation();
  };

  const startBurnAnimation = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const editorEl = containerRef.current.querySelector('.ProseMirror') || containerRef.current;

    const rect = editorEl.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;
    canvas.style.top = `${editorEl.offsetTop}px`;
    canvas.style.left = `${editorEl.offsetLeft}px`;

    ctx.font = window.getComputedStyle(editorEl).font;
    ctx.fillStyle = theme === 'dark' ? '#EAEAEA' : '#2C2C2C';
    ctx.textBaseline = 'top';
    
    const plainText = text.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    const words = plainText.split(' ');
    let line = '';
    const lineHeight = parseInt(window.getComputedStyle(editorEl).lineHeight) || 24;
    let y = 0;
    const maxWidth = rect.width - 40;

    for (let n = 0; n < words.length; n++) {
      const testLine = line + words[n] + ' ';
      const metrics = ctx.measureText(testLine);
      const testWidth = metrics.width;
      if (testWidth > maxWidth && n > 0) {
        ctx.fillText(line, 20, y + 20);
        line = words[n] + ' ';
        y += lineHeight;
      } else {
        line = testLine;
      }
    }
    ctx.fillText(line, 20, y + 20);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const pixels = imageData.data;
    const particles = [];

    for (let i = 0; i < pixels.length; i += 4 * 4) {
      if (pixels[i + 3] > 128) {
        const x = (i / 4) % canvas.width;
        const y = Math.floor((i / 4) / canvas.width);
        
        particles.push({
          x,
          y,
          vx: (Math.random() - 0.5) * 2,
          vy: -Math.random() * 3 - 1,
          size: Math.random() * 2 + 1,
          life: 1,
          decay: Math.random() * 0.02 + 0.01,
          color: theme === 'dark' ? [234, 234, 234] : [44, 44, 44]
        });
      }
    }

    editorEl.style.opacity = '0';

    let animationFrame;
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      let alive = false;

      particles.forEach(p => {
        if (p.life > 0) {
          alive = true;
          p.x += p.vx;
          p.y += p.vy;
          p.vy -= 0.03;
          p.life -= p.decay;

          if (p.life < 0.6) p.color = [255, 80, 20];
          if (p.life < 0.3) p.color = [100, 100, 100];

          ctx.fillStyle = `rgba(${p.color[0]}, ${p.color[1]}, ${p.color[2]}, ${p.life})`;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
        }
      });

      if (alive) {
        animationFrame = requestAnimationFrame(animate);
      } else {
        cancelAnimationFrame(animationFrame);
        setIsComplete(true);
        
        confetti({
          particleCount: 120,
          spread: 80,
          origin: { y: 0.6 },
          colors: ['#FFD700', '#FF8C00', '#FF6347', '#4682B4', '#32CD32']
        });
        
        showReleaseSuccess().then(() => {
          handleReset();
        });
      }
    };

    animate();
  };

  const handleReset = () => {
    setText('');
    setIsBurning(false);
    setIsComplete(false);
    if (containerRef.current) {
      const editorEl = containerRef.current.querySelector('.ProseMirror');
      if (editorEl) editorEl.style.opacity = '1';
    }
  };

  return (
    <div className="app-container min-vh-100 d-flex flex-column" data-theme={theme} style={{ backgroundColor: 'var(--bg-primary)' }}>
      {isRecording && (
        <div className="focus-mode-overlay" style={{ zIndex: 3000 }}>
          <div className="thought-orb"></div>
          <div className="focus-transcript">
            {interimTranscript || "I'm listening..."}
          </div>
          <div className="focus-actions">
            <button
              onClick={toggleRecording}
              className="btn btn-outline-secondary rounded-pill px-5 py-3 shadow-sm d-flex align-items-center gap-2"
              style={{ fontSize: '1.2rem', backgroundColor: 'transparent', border: '1px solid var(--text-secondary)' }}
            >
              <span className="text-secondary">●</span> Done
            </button>
          </div>
        </div>
      )}

      {/* Floating Navigation */}
      <nav className="position-absolute top-0 w-100 px-4 py-4 d-flex justify-content-between align-items-center" style={{ zIndex: 100 }}>
        <button 
          onClick={() => navigate('/journal')} 
          className="btn btn-link text-secondary text-decoration-none p-0 d-flex align-items-center justify-content-center hover-lift" 
          style={{ width: '32px', height: '32px', opacity: 0.5 }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
        </button>
        
        <div className="d-flex align-items-center gap-3">
          <button 
            onClick={showReleaseInfo}
            className="btn btn-link text-secondary text-decoration-none p-0 d-flex align-items-center justify-content-center"
            style={{ width: '24px', height: '24px', opacity: 0.5 }}
            title="What is this?"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
          </button>
          
          {!isComplete && (
            <button 
              onClick={handleRelease}
              disabled={!text.trim() || isBurning}
              className={`btn-release-action ${text.trim() ? 'active' : ''}`}
            >
              {isBurning ? 'Releasing...' : 'Release'}
            </button>
          )}
        </div>
      </nav>

      {/* Content */}
      <main className="flex-grow-1 d-flex flex-column align-items-center px-4 pt-5">
        <div className="text-center mb-5 animate-fade-in" style={{ marginTop: '4vh' }}>
          <h1 className="fw-light text-secondary mb-1" style={{ fontSize: '1.5rem', letterSpacing: '4px', textTransform: 'uppercase', opacity: 0.4 }}>Let it go.</h1>
        </div>

        <div 
          ref={containerRef}
          className="position-relative w-100 animate-slide-up" 
          style={{ maxWidth: '750px', flexGrow: 1, marginBottom: '40px' }}
        >
          {/* Writing Area */}
          <div className="w-100 px-md-5">
            <RichTextEditor
              content={text}
              onChange={setText}
              editorRef={editorRef}
              design="minimal"
              placeholder="Let it all out here..."
            />
          </div>
          <canvas 
            ref={canvasRef}
            className="position-absolute pointer-events-none"
            style={{ pointerEvents: 'none', zIndex: 10 }}
          />

          {/* Inline Tools */}
          <div className="position-absolute bottom-0 end-0 p-4 d-flex gap-2" style={{ zIndex: 5 }}>
            <button 
              onClick={toggleRecording}
              className={`btn-tool-minimal ${isRecording ? 'active' : ''}`}
              title="Voice input"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" x2="12" y1="19" y2="22"></line></svg>
            </button>
            <button 
              onClick={() => setShowDesigns(true)}
              className="btn-tool-minimal"
              title="Design"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2"></rect><path d="M3 9h18"></path><path d="M9 21V9"></path></svg>
            </button>
          </div>
        </div>
      </main>

      {showDesigns && (
        <DesignSelector
          selectedDesign={design}
          onSelect={setDesign}
          onClose={() => setShowDesigns(false)}
        />
      )}

      <style>{`
        .btn-release-action {
          padding: 8px 24px;
          border-radius: 100px;
          border: 1px solid var(--border-color);
          background: transparent;
          color: var(--text-secondary);
          font-size: 0.8rem;
          font-weight: 600;
          letter-spacing: 1px;
          text-transform: uppercase;
          transition: all 0.3s ease;
          opacity: 0.3;
          pointer-events: none;
        }
        .btn-release-action.active {
          opacity: 1;
          pointer-events: auto;
          background: var(--text-primary);
          color: var(--bg-primary);
          border-color: var(--text-primary);
        }

        .btn-tool-minimal {
          width: 36px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          border: none;
          background: transparent;
          color: var(--text-secondary);
          opacity: 0.4;
          transition: all 0.2s ease;
          cursor: pointer;
        }
        .btn-tool-minimal:hover {
          opacity: 1;
          background: var(--bg-secondary);
          color: var(--text-primary);
        }
        .btn-tool-minimal.active {
          opacity: 1;
          color: #ff4d4d;
        }
        .shadow-soft {
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.04);
        }
        [data-theme="dark"] .shadow-soft {
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
        }
      `}</style>
    </div>
  );
};

export default Release;
