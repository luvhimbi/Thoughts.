import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import PublicNavbar from '../components/PublicNavbar';

/* ══════════════════════════════════════════
   Data — easy to refactor / extend
   ══════════════════════════════════════════ */

const STATS = [
  { value: '100%',  label: 'Private' },
  { value: '∞',     label: 'Unlimited Entries' },
  { value: 'Secure', label: 'Cloud Synced' },
];

const STEPS = [
  { num: '01', title: 'Create your space',  desc: 'Sign in securely with Google. Your journal is created instantly.' },
  { num: '02', title: 'Write or speak',     desc: 'Type your thoughts or use voice-to-text. No rules, no prompts.' },
  { num: '03', title: 'Reflect & grow',     desc: 'Revisit your journey over time. Listen back to your own words.' },
];

const FEATURES = [
  { icon: '✎',  title: 'Minimal Focus',        desc: 'An interface that disappears, leaving only you and your thoughts.' },
  { icon: '☁',  title: 'Sync Anywhere',         desc: 'Your entries are private, secure, and available across all your devices.' },
  { icon: '☾',  title: 'Night Mode',            desc: 'Gentle on the eyes, perfect for those late-night reflections.' },
  { icon: '🎙', title: 'Voice Journaling',      desc: 'Speak your mind and let your words transcribe themselves beautifully.' },
  { icon: '◌',  title: 'Listen Back',           desc: 'Hear your past thoughts read back to you in a calming voice tone.' },
  { icon: '◎',  title: 'Reflections Timeline',  desc: 'Revisit your journey through an elegant timeline of your memories.' },
  { icon: '⊕',  title: 'End-to-End Encryption', desc: 'Secure privacy is our priority. Your thoughts are encrypted so only you can read them.' },
  { icon: '✦',  title: 'Offline-First PWA',     desc: 'Install Thoughts on your home screen. Write anytime, anywhere—even without internet.' },
];

const QUOTES = [
  { text: "Journaling is like whispering to oneself and listening at the same time.", author: "Shackerley-Quilter" },
  { text: "I can shake off everything as I write; my sorrows disappear, my courage is reborn.", author: "Anne Frank" },
  { text: "Writing is a way of talking without being interrupted.", author: "Jules Renard" },
  { text: "The act of writing is the act of discovering what you believe.", author: "David Hare" },
  { text: "In the silence between thoughts, you find yourself.", author: "Unknown" }
];

const FOOTER_LINKS = [
  { to: '/privacy', label: 'Privacy Policy' },
  { to: '/terms',   label: 'Terms of Service' },
  { to: '/popi',    label: 'POPI Act' },
];

/* ══════════════════════════════════════════
   Intersection Observer hook for scroll-
   triggered reveal animations
   ══════════════════════════════════════════ */

function useReveal() {
  const ref = useRef(null);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;

    const targets = root.querySelectorAll('.reveal');

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('revealed');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 }
    );

    targets.forEach((t) => observer.observe(t));
    return () => observer.disconnect();
  }, []);

  return ref;
}

/* ══════════════════════════════════════════
   Landing Component
   ══════════════════════════════════════════ */

function Landing() {
  const pageRef = useReveal();

  return (
    <div className="landing-page" ref={pageRef} style={{ backgroundColor: 'var(--bg-primary)' }}>
      {/* ──── Shared Navbar ──── */}
      <PublicNavbar />

      {/* ──── Hero Section ──── */}
      <section className="landing-hero">
        <div className="container">
          <div className="landing-hero__badge reveal">
            <span>✦ Private · Secure · Yours</span>
          </div>

          <h1 className="landing-hero__title reveal">
            A quiet place for<br className="landing-hero__br" /> your inner world.
          </h1>

          <p className="landing-hero__subtitle reveal">
            Your private sanctuary for morning clarity and evening reflection. 
            A secure, offline-first Progressive Web App (PWA) built to preserve your journey of growth.
          </p>

          <div className="landing-hero__actions reveal">
            <Link to="/register" className="btn-minimal landing-hero__btn-primary">
              Create your journal
            </Link>
            <a href="#about" className="btn-minimal-outline landing-hero__btn-secondary">
              Learn more
            </a>
          </div>

          {/* Stats row */}
          <div className="landing-hero__stats reveal">
            {STATS.map((s) => (
              <div className="landing-hero__stat" key={s.label}>
                <span className="landing-hero__stat-value">{s.value}</span>
                <span className="landing-hero__stat-label">{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ──── How It Works ──── */}
      <section id="about" className="landing-section">
        <div className="container">
          <div className="landing-section__header reveal">
            <h2 className="landing-section__title">How it works</h2>
            <p className="landing-section__desc">Three simple steps to your sanctuary.</p>
          </div>

          <div className="landing-steps">
            {STEPS.map((step) => (
              <div className="landing-step reveal" key={step.num}>
                <div className="landing-step__number">{step.num}</div>
                <h3 className="landing-step__title">{step.title}</h3>
                <p className="landing-step__desc">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ──── Features ──── */}
      <section id="features" className="landing-section">
        <div className="container">
          <div className="landing-section__header reveal">
            <h2 className="landing-section__title">Designed for stillness</h2>
            <p className="landing-section__desc">Every detail exists to protect your focus.</p>
          </div>

          <div className="landing-features">
            {FEATURES.map((f) => (
              <div className="landing-feature reveal" key={f.title}>
                <div className="landing-feature__icon">{f.icon}</div>
                <h3 className="landing-feature__title">{f.title}</h3>
                <p className="landing-feature__desc">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ──── Quote Gallery ──── */}
      <section className="landing-section landing-quotes reveal">
        <div className="container">
          <div className="landing-quotes__grid">
            {QUOTES.map((quote, idx) => (
              <div 
                className={`landing-quote reveal ${idx % 2 !== 0 ? 'landing-quote--staggered' : ''}`} 
                key={idx}
              >
                <blockquote className="landing-quote__text">
                  "{quote.text}"
                </blockquote>
                <cite className="landing-quote__author">— {quote.author}</cite>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ──── Final CTA ──── */}
      <section className="landing-cta reveal">
        <div className="container">
          <h2 className="landing-cta__title">Begin your journey today.</h2>
          <p className="landing-cta__desc">Start your private digital journal for personal reflection.</p>
          <Link to="/register" className="btn-minimal landing-cta__btn">Get Started</Link>
        </div>
      </section>

      {/* ──── Footer ──── */}
      <footer className="landing-footer">
        <div className="container landing-footer__inner">
          <p className="landing-footer__copy">© 2026 Thoughts Journaling. All rights reserved.</p>
          <div className="landing-footer__links">
            {FOOTER_LINKS.map((l) => (
              <Link key={l.to} to={l.to} className="landing-footer__link">{l.label}</Link>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}

export default Landing;
