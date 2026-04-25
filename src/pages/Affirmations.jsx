import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { affirmationService } from '../services/affirmationService';
import * as htmlToImage from 'html-to-image';

function Affirmations() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [affirmation, setAffirmation] = useState(null);
  const [isSeeding, setIsSeeding] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const cardRef = useRef(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        navigate('/login');
        return;
      }

      try {
        await affirmationService.seedAffirmations();
        const daily = await affirmationService.getDailyAffirmation();
        setAffirmation(daily);
      } catch (err) {
        console.error("Failed to load affirmation:", err);
      } finally {
        setLoading(false);
      }
    });
    return unsubscribe;
  }, [navigate]);

  const handleManualSeed = async () => {
    setIsSeeding(true);
    await affirmationService.seedAffirmations();
    const daily = await affirmationService.getDailyAffirmation();
    setAffirmation(daily);
    setIsSeeding(false);
  };

  const handleShareImage = async () => {
    if (!cardRef.current || isSharing) return;
    
    setIsSharing(true);
    try {
      // Capture the element as a blob
      const blob = await htmlToImage.toBlob(cardRef.current, {
        backgroundColor: '#fffcf9',
        quality: 1,
        pixelRatio: 2
      });

      if (!blob) throw new Error("Failed to create image");

      const file = new File([blob], 'affirmation.png', { type: 'image/png' });

      if (navigator.share && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: "Today's Affirmation",
          text: `"${affirmation.text}"`
        });
      } else {
        // Fallback: Download
        const link = document.createElement('a');
        link.download = 'affirmation.png';
        link.href = URL.createObjectURL(blob);
        link.click();
      }
    } catch (err) {
      console.error("Sharing failed:", err);
    } finally {
      setIsSharing(false);
    }
  };

  const handleWhatsAppShare = () => {
    const text = encodeURIComponent(`"${affirmation.text}" - Today's Affirmation from Thoughts`);
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  if (loading) {
    return (
      <div className="vh-100 d-flex flex-column align-items-center justify-content-center" style={{ backgroundColor: 'var(--bg-primary)' }}>
        <div className="custom-spinner mb-3"></div>
      </div>
    );
  }

  return (
    <div className="journal-page vh-100 d-flex flex-column animate-fade-in overflow-hidden" style={{ backgroundColor: 'var(--bg-primary)' }}>
      <header className="container py-4 d-flex justify-content-between align-items-center" style={{ zIndex: 10 }}>
        <button onClick={() => navigate('/journal')} className="btn btn-link text-dark text-decoration-none p-0 d-flex align-items-center justify-content-center hover-lift" style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'var(--bg-secondary)' }}>
          <span style={{ fontSize: '1.2rem', lineHeight: 1 }}>←</span> 
        </button>
        <div className="fw-bold text-dark text-uppercase" style={{ fontSize: '0.85rem', letterSpacing: '2px' }}>Daily Intention</div>
        <div style={{ width: '40px' }}></div>
      </header>

      <main className="container flex-grow-1 d-flex flex-column align-items-center justify-content-center position-relative">
        <div className="w-100 d-flex flex-column align-items-center justify-content-center" style={{ marginTop: '-5vh' }}>
          
          <div 
            ref={cardRef}
            className="affirmation-share-card text-center animate-slide-up p-5" 
            style={{ maxWidth: '600px', width: '100%', background: 'transparent' }}
          >
            <div className="affirmation-accent mb-4 mx-auto"></div>
            
            {affirmation ? (
              <>
                <h1 className="affirmation-text mb-4" style={{ fontSize: '2.8rem', fontWeight: 700, lineHeight: 1.2, letterSpacing: '-1.5px', color: 'var(--text-primary)' }}>
                  "{affirmation.text}"
                </h1>
                <p className="text-secondary text-uppercase tracking-widest small m-0" style={{ letterSpacing: '3px', opacity: 0.6 }}>
                  Today's Affirmation
                </p>
              </>
            ) : (
              <div className="text-center py-5">
                <p className="text-secondary mb-4">Finding your intention...</p>
                <button 
                  onClick={handleManualSeed} 
                  className="btn btn-dark rounded-pill px-4 py-2"
                  disabled={isSeeding}
                >
                  {isSeeding ? 'Seeding...' : 'Retry'}
                </button>
              </div>
            )}
          </div>

          {affirmation && (
            <div className="mt-5 pt-2 d-flex flex-column flex-md-row gap-3 animate-fade-in delay-200">
               <button 
                onClick={handleShareImage}
                disabled={isSharing}
                className="btn btn-dark rounded-pill px-5 py-3 fw-bold shadow-soft transition-all hover-scale d-flex align-items-center justify-content-center gap-3"
                style={{ fontSize: '0.95rem', minWidth: '220px' }}
               >
                 {isSharing ? (
                   <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                 ) : (
                   <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" x2="12" y1="15" y2="3"></line></svg>
                 )}
                 Share as Image
               </button>
               
               <button 
                onClick={handleWhatsAppShare}
                className="btn btn-outline-dark rounded-pill px-4 py-3 fw-bold transition-all hover-scale d-flex align-items-center justify-content-center gap-2"
                style={{ fontSize: '0.95rem', border: '1.5px solid var(--text-primary)' }}
               >
                 <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.438 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.414 0 .018 5.396.015 12.03c0 2.12.554 4.189 1.605 6.04L0 24l6.117-1.605a11.847 11.847 0 005.933 1.598h.005c6.632 0 12.032-5.398 12.035-12.032.003-3.218-1.248-6.242-3.517-8.511z"></path></svg>
                 WhatsApp
               </button>
            </div>
          )}
        </div>
      </main>

      <footer className="container py-5 text-center" style={{ opacity: 0.3 }}>
        <p className="x-small text-uppercase" style={{ letterSpacing: '1px' }}>A moment of peace, once a day.</p>
      </footer>

      <style jsx="true">{`
        .affirmation-accent {
          width: 40px;
          height: 4px;
          background: var(--text-primary);
          border-radius: 2px;
          opacity: 0.2;
        }
        .affirmation-text {
          font-family: var(--font-lora), serif;
          font-style: italic;
        }
        .hover-scale:hover {
          transform: scale(1.02);
        }
        .delay-200 {
          animation-delay: 200ms;
        }
      `}</style>
    </div>
  );
}

export default Affirmations;
