import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSettings } from '../contexts/SettingsContext';
import DesignSelector from '../components/DesignSelector';
import { showReleaseSuccess } from '../utils/alertUtils';

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
  const textareaRef = useRef(null);
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

        if (finalTranscripts) {
          setText(prev => prev + finalTranscripts);
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
    const textarea = textareaRef.current;

    const rect = textarea.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;
    canvas.style.top = `${textarea.offsetTop}px`;
    canvas.style.left = `${textarea.offsetLeft}px`;

    ctx.font = window.getComputedStyle(textarea).font;
    ctx.fillStyle = theme === 'dark' ? '#EAEAEA' : '#2C2C2C';
    ctx.textBaseline = 'top';
    
    const words = text.split(' ');
    let line = '';
    const lineHeight = parseInt(window.getComputedStyle(textarea).lineHeight);
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

    textarea.style.opacity = '0';

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
    if (textareaRef.current) {
      textareaRef.current.style.opacity = '1';
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

      {/* Header */}
      <header className="container py-4 border-bottom d-flex justify-content-between align-items-center" style={{ borderColor: 'var(--border-color)' }}>
        <button 
          onClick={() => navigate('/journal')} 
          className="btn btn-link text-dark text-decoration-none p-0 d-flex align-items-center justify-content-center hover-lift" 
          style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'var(--bg-secondary)' }}
        >
          <span style={{ fontSize: '1.2rem', lineHeight: 1 }}>←</span>
        </button>
        <div className="fw-bold text-dark text-uppercase" style={{ fontSize: '0.85rem', letterSpacing: '2px' }}>Release</div>
        
        {!isComplete ? (
          <button 
            onClick={handleRelease}
            disabled={!text.trim() || isBurning}
            className="btn btn-dark rounded-pill px-4 py-2"
            style={{ fontSize: '0.85rem', fontWeight: 700, minWidth: '100px' }}
          >
            {isBurning ? 'Burning...' : 'Burn'}
          </button>
        ) : (
          <div style={{ width: '100px' }}></div>
        )}
      </header>

      {/* Content */}
      <main className="flex-grow-1 d-flex flex-column align-items-center justify-content-center px-4" style={{ paddingTop: '20px', paddingBottom: '40px' }}>
        <div className="text-center mb-4" style={{ maxWidth: '500px' }}>
          <div className="d-flex align-items-center justify-content-center gap-3 mb-2">
            <div className="d-inline-flex align-items-center justify-content-center rounded-circle shadow-sm text-dark" style={{ width: '48px', height: '48px', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"></path></svg>
            </div>
            <h1 className="hero-title m-0" style={{ fontSize: '2.2rem', letterSpacing: '-1.5px' }}>Burn your thoughts</h1>
          </div>
          <p className="hero-subtitle mb-0" style={{ fontSize: '0.95rem', opacity: 0.6, fontWeight: 400 }}>Write down what's weighing on you, then let it go forever.</p>
        </div>

        {/* Toolbar */}
        <div className="d-flex gap-2 mb-2 justify-content-end w-100" style={{ maxWidth: '700px' }}>
          <button 
            onClick={toggleRecording}
            className={`btn-tool ${isRecording ? 'active' : ''}`}
            title="Voice input"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" x2="12" y1="19" y2="22"></line></svg>
          </button>
          <button 
            onClick={() => setShowDesigns(true)}
            className="btn-tool"
            title="Design"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2"></rect><path d="M3 9h18"></path><path d="M9 21V9"></path></svg>
          </button>
        </div>

        <div 
          ref={containerRef}
          className="position-relative w-100" 
          style={{ maxWidth: '700px', height: '350px' }}
        >
          <textarea
            ref={textareaRef}
            className={`form-control editor-textarea w-100 h-100 p-4 border-0 shadow-soft entry-design-${design}`}
            placeholder="What would you like to release today?..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            disabled={isBurning}
            style={{ 
              resize: 'none', 
              fontSize: '1.15rem',
              lineHeight: '1.6',
              backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.015)',
              borderRadius: '24px',
              transition: 'opacity 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
              border: '1px solid var(--border-color)'
            }}
          />
          <canvas 
            ref={canvasRef}
            className="position-absolute pointer-events-none"
            style={{ pointerEvents: 'none', zIndex: 10 }}
          />
        </div>

        <div className="mt-3">
          {/* Old isComplete UI removed in favor of modal */}
        </div>
      </main>

      {showDesigns && (
        <DesignSelector
          selectedDesign={design}
          onSelect={setDesign}
          onClose={() => setShowDesigns(false)}
        />
      )}

      <style jsx>{`
        .shadow-soft {
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.04);
        }
        [data-theme="dark"] .shadow-soft {
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
        }
        .btn-minimal-outline:hover {
          opacity: 1 !important;
        }
        .btn-tool {
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid var(--border-color);
          background: var(--bg-secondary);
          border-radius: 12px;
          color: var(--text-secondary);
          transition: all 0.2s ease;
          cursor: pointer;
        }
        .btn-tool:hover {
          background: var(--bg-primary);
          color: var(--text-primary);
          border-color: var(--text-primary);
        }
        .btn-tool.active {
          background: var(--text-primary);
          color: var(--bg-primary);
          border-color: var(--text-primary);
        }
        .recording {
          animation: pulse-red 1.5s infinite;
          color: #ff4d4d;
          border-color: #ff4d4d;
        }
        @keyframes pulse-red {
          0% { box-shadow: 0 0 0 0 rgba(255, 77, 77, 0.4); }
          70% { box-shadow: 0 0 0 10px rgba(255, 77, 77, 0); }
          100% { box-shadow: 0 0 0 0 rgba(255, 77, 77, 0); }
        }
      `}</style>
    </div>
  );
};

export default Release;
