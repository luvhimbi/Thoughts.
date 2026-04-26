import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { auth } from '../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import Navigation from '../components/Navigation';
import { confirmLogout } from '../utils/alertUtils';
import PublicNavbar from '../components/PublicNavbar';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

function LegalPage({ title, children }) {
  const [user, setUser] = React.useState(null);
  const isOnline = useOnlineStatus();
  const [loading, setLoading] = React.useState(true);
  const navigate = useNavigate();

  React.useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = () => confirmLogout(navigate);

  if (loading) return null;

  if (user) {
    return (
      <div className="journal-page w-100 min-vh-100 d-flex flex-md-row flex-column" style={{ backgroundColor: 'var(--bg-primary)' }}>
        {/* Desktop Sidebar */}
        <aside className="desktop-sidebar d-none d-md-flex flex-column justify-content-between py-5 px-4 border-end bg-transparent" style={{ width: '260px', height: '100vh', position: 'sticky', top: 0, zIndex: 100 }}>
          <div>
            <div className="mb-5 px-2">
              <Link to="/" className="navbar-brand text-decoration-none">
                <span className="thoughts-brand thoughts-brand--md">Thoughts.</span>
              </Link>
            </div>
            <Navigation onAddEntry={() => navigate('/journal')} isDesktop={true} />
          </div>

          <div className="profile-section mt-auto pt-4 border-top">
            <Link to="/journal/settings" className="d-flex align-items-center gap-3 p-2 rounded-3 text-decoration-none text-dark transition-all hover-bg-light">
              <div
                className="rounded-circle d-flex align-items-center justify-content-center bg-dark text-white fw-bold"
                style={{ width: '36px', height: '36px', fontSize: '0.9rem', flexShrink: 0 }}
              >
                {user.displayName?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U'}
              </div>
              <div className="text-truncate">
                <p className="m-0 small fw-bold" style={{ lineHeight: 1.2 }}>{user.displayName}</p>
                <div className="d-flex align-items-center gap-1 mt-1" style={{ opacity: 0.6 }}>
                  <span className={`sync-dot ${isOnline ? 'sync-online' : 'sync-offline'}`}></span>
                  <span className="x-small">{isOnline ? 'Cloud Synced' : 'Offline Mode'}</span>
                </div>
              </div>
            </Link>
            <button
              onClick={handleLogout}
              className="btn btn-link text-danger text-decoration-none p-2 w-100 text-start small mt-1 d-flex gap-3 align-items-center"
            >
              <span style={{ width: '36px' }}></span>
              <span className="small fw-500">Logout</span>
            </button>
          </div>
        </aside>

        {/* No Mobile Top Header as per request */}


        {/* Main Content */}
        <main className="flex-grow-1 animate-fade-in overflow-auto w-100" style={{ backgroundColor: 'var(--bg-primary)' }}>
          <div className="mx-auto w-100 py-5 px-4 ps-md-5" style={{ maxWidth: '800px' }}>
            <h1 className="mb-2" style={{ fontSize: '2.4rem', letterSpacing: '-1.5px', color: 'var(--text-primary)', fontWeight: 600 }}>{title}</h1>
            <p className="text-secondary small mb-5">Last updated: April 6, 2026</p>
            <div className="legal-content">
              {children}
            </div>
          </div>
          
          <footer className="w-100 py-4 text-center mt-5 px-4" style={{ borderTop: '1px solid var(--border-color)', opacity: 0.6 }}>
            <div className="d-flex gap-4 justify-content-center mb-2">
              <Link to="/privacy" className="text-secondary text-decoration-none small">Privacy</Link>
              <Link to="/terms" className="text-secondary text-decoration-none small">Terms</Link>
              <Link to="/popi" className="text-secondary text-decoration-none small">POPI</Link>
            </div>
            <p className="text-secondary x-small m-0">Stay mindful. Your private space.</p>
          </footer>
        </main>

        {/* Mobile Bottom Navigation */}
        <div className="d-md-none">
          <Navigation onAddEntry={() => navigate('/journal')} isDesktop={false} />
        </div>
      </div>
    );
  }

  return (
    <div className="journal-page min-vh-100 d-flex flex-column animate-fade-in" style={{ backgroundColor: 'var(--bg-primary)' }}>
      <div className="container py-4">
        <Link to="/" className="text-decoration-none text-secondary small fw-500 d-flex align-items-center gap-2">
          <span>&larr;</span> Back to Home
        </Link>
      </div>

      <main className="container flex-grow-1 py-5" style={{ maxWidth: '700px' }}>
        <h1 className="mb-2" style={{ fontSize: '2rem', letterSpacing: '-1px', color: 'var(--text-primary)' }}>{title}</h1>
        <p className="text-secondary small mb-5">Last updated: April 6, 2026</p>
        
        <div className="legal-content">
          {children}
        </div>
      </main>

      <footer className="container py-4 text-center border-top mt-auto" style={{ opacity: 0.6 }}>
        <div className="d-flex gap-4 justify-content-center">
          <Link to="/privacy" className="text-secondary text-decoration-none small">Privacy</Link>
          <Link to="/terms" className="text-secondary text-decoration-none small">Terms</Link>
          <Link to="/popi" className="text-secondary text-decoration-none small">POPI</Link>
        </div>
      </footer>
    </div>
  );
}

export function Privacy() {
  return (
    <LegalPage title="Privacy Policy">
      <section className="legal-section">
        <h2>1. Introduction</h2>
        <p>
          Thoughts Journaling ("Thoughts", "we", "us", or "our") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, store, and protect your personal information when you use our journaling application.
        </p>
        <p>
          By using Thoughts, you agree to the collection and use of information in accordance with this policy. We will never sell, trade, or share your personal data with third parties for marketing purposes.
        </p>
      </section>

      <section className="legal-section">
        <h2>2. Information We Collect</h2>
        <h3>2.1 Account Information</h3>
        <p>When you sign in using Google Authentication, we receive:</p>
        <ul>
          <li>Your display name</li>
          <li>Your email address</li>
          <li>Your Google profile photo URL (if available)</li>
        </ul>
        <p>We do not have access to your Google account password.</p>

        <h3>2.2 Journal Content</h3>
        <p>
          Your journal entries are stored securely in our cloud database (Google Firebase Firestore). Each entry includes:
        </p>
        <ul>
          <li>The text content you write or dictate</li>
          <li>The date and time the entry was created</li>
          <li>Your unique user identifier (to keep entries private to your account)</li>
        </ul>

        <h3>2.3 Application Preferences</h3>
        <p>
          Settings such as Night Mode, Compact View, and Voice Tone preferences are stored locally on your device using browser LocalStorage. This data never leaves your device.
        </p>
      </section>

      <section className="legal-section">
        <h2>3. How We Use Your Information</h2>
        <p>We use your information exclusively to:</p>
        <ul>
          <li>Authenticate your identity and secure your account</li>
          <li>Store and retrieve your personal journal entries</li>
          <li>Provide the text-to-speech and voice-to-text features</li>
          <li>Improve the application experience</li>
        </ul>
        <p>We do not use your journal content for any analytics, advertising, machine learning training, or any purpose other than displaying it back to you.</p>
      </section>

      <section className="legal-section">
        <h2>4. Data Storage & Security</h2>
        <p>
          Your data is stored on Google Firebase servers, which employ industry-standard encryption both in transit (TLS/SSL) and at rest. Access to your data is restricted to your authenticated account only.
        </p>
        <p>
          While we implement strong security measures, no method of electronic transmission or storage is 100% secure. We encourage you to use strong, unique passwords for your Google account.
        </p>
      </section>

      <section className="legal-section">
        <h2>5. Data Retention & Deletion</h2>
        <p>
          Your journal entries are retained for as long as your account is active. You may delete individual entries at any time through the application. You may also request complete account data deletion by using the "Clear all thoughts" feature in Settings.
        </p>
        <p>
          Upon deletion, your data is permanently removed from our servers and cannot be recovered.
        </p>
      </section>

      <section className="legal-section">
        <h2>6. Third-Party Services</h2>
        <p>Thoughts uses the following third-party services:</p>
        <ul>
          <li><strong>Google Firebase:</strong> Authentication and database storage</li>
          <li><strong>Web Speech API:</strong> Browser-native voice recognition and text-to-speech (processed locally on your device)</li>
        </ul>
        <p>These services are governed by their own respective privacy policies.</p>
      </section>

      <section className="legal-section">
        <h2>7. Your Rights</h2>
        <p>You have the right to:</p>
        <ul>
          <li>Access all personal data we hold about you</li>
          <li>Request correction of inaccurate data</li>
          <li>Request deletion of your data</li>
          <li>Withdraw consent at any time by deleting your account</li>
          <li>Lodge a complaint with a supervisory authority</li>
        </ul>
      </section>

      <section className="legal-section">
        <h2>8. Children's Privacy</h2>
        <p>
          Thoughts is not directed at individuals under the age of 13. We do not knowingly collect personal information from children. If we discover that a child under 13 has provided us with personal data, we will delete it immediately.
        </p>
      </section>

      <section className="legal-section">
        <h2>9. Changes to This Policy</h2>
        <p>
          We may update this Privacy Policy from time to time. Any changes will be reflected on this page with an updated revision date. Continued use of the application after changes constitutes acceptance of the updated policy.
        </p>
      </section>

      <section className="legal-section">
        <h2>10. Contact Us</h2>
        <p>
          If you have any questions about this Privacy Policy or your personal data, please contact us at <strong>privacy@thoughts-app.com</strong>.
        </p>
      </section>
    </LegalPage>
  );
}

export function Terms() {
  return (
    <LegalPage title="Terms of Service">
      <section className="legal-section">
        <h2>1. Acceptance of Terms</h2>
        <p>
          By accessing or using Thoughts Journaling ("Thoughts", "the Service"), you agree to be bound by these Terms of Service ("Terms"). If you do not agree to these Terms, you may not use the Service.
        </p>
      </section>

      <section className="legal-section">
        <h2>2. Description of Service</h2>
        <p>
          Thoughts is a personal journaling application that allows users to write, store, and reflect on personal thoughts and entries. The Service includes text entry, voice-to-text transcription, text-to-speech playback, night mode, and a reflections timeline.
        </p>
      </section>

      <section className="legal-section">
        <h2>3. User Accounts</h2>
        <p>
          To use Thoughts, you must sign in using a valid Google account. You are responsible for maintaining the security of your Google account credentials. You agree that all activity under your account is your responsibility.
        </p>
        <p>
          You must be at least 13 years of age to create an account and use the Service.
        </p>
      </section>

      <section className="legal-section">
        <h2>4. User Content</h2>
        <p>
          You retain full ownership of all content you create within Thoughts. We do not claim any intellectual property rights over your journal entries.
        </p>
        <p>
          You are solely responsible for the content of your entries. You agree not to use the Service to store content that is illegal, harmful, threatening, or violates the rights of others.
        </p>
      </section>

      <section className="legal-section">
        <h2>5. Acceptable Use</h2>
        <p>You agree not to:</p>
        <ul>
          <li>Use the Service for any unlawful purpose</li>
          <li>Attempt to gain unauthorized access to other users' data</li>
          <li>Interfere with or disrupt the Service or its servers</li>
          <li>Reverse engineer, decompile, or otherwise attempt to derive the source code</li>
          <li>Use automated systems to access the Service without permission</li>
        </ul>
      </section>

      <section className="legal-section">
        <h2>6. Service Availability</h2>
        <p>
          Thoughts is provided on an "as-is" and "as-available" basis. We make no guarantees regarding uptime, data preservation, or uninterrupted access. We reserve the right to modify, suspend, or discontinue the Service at any time without prior notice.
        </p>
      </section>

      <section className="legal-section">
        <h2>7. Limitation of Liability</h2>
        <p>
          To the fullest extent permitted by law, Thoughts and its creators shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of the Service, including but not limited to loss of data, loss of profits, or personal distress.
        </p>
      </section>

      <section className="legal-section">
        <h2>8. Intellectual Property</h2>
        <p>
          The Thoughts name, logo, visual design, interface, and underlying code are the intellectual property of their respective creators. You may not reproduce, distribute, or create derivative works from the Service without express written permission.
        </p>
      </section>

      <section className="legal-section">
        <h2>9. Termination</h2>
        <p>
          We reserve the right to suspend or terminate your access to the Service at any time, for any reason, including violation of these Terms. Upon termination, your right to use the Service ceases immediately.
        </p>
        <p>
          You may terminate your account at any time by deleting your data through the Settings page.
        </p>
      </section>

      <section className="legal-section">
        <h2>10. Governing Law</h2>
        <p>
          These Terms shall be governed by and construed in accordance with the laws of the Republic of South Africa, without regard to conflict of law principles.
        </p>
      </section>

      <section className="legal-section">
        <h2>11. Changes to Terms</h2>
        <p>
          We may revise these Terms at any time by updating this page. Your continued use of the Service after changes are posted constitutes acceptance of the revised Terms.
        </p>
      </section>

      <section className="legal-section">
        <h2>12. Contact</h2>
        <p>
          For questions about these Terms, please contact us at <strong>legal@thoughts-app.com</strong>.
        </p>
      </section>
    </LegalPage>
  );
}

export function Popi() {
  return (
    <LegalPage title="POPI Act Compliance">
      <section className="legal-section">
        <h2>1. Overview</h2>
        <p>
          Thoughts Journaling is committed to compliance with the Protection of Personal Information Act, 2013 (POPIA) of the Republic of South Africa. This notice explains how we process your personal information in accordance with POPIA's requirements.
        </p>
      </section>

      <section className="legal-section">
        <h2>2. Responsible Party</h2>
        <p>
          For the purposes of POPIA, the responsible party for the processing of your personal information is Thoughts Journaling. As the responsible party, we determine the purpose and means of processing personal information.
        </p>
      </section>

      <section className="legal-section">
        <h2>3. Purpose of Processing</h2>
        <p>We process your personal information for the following specific purposes:</p>
        <ul>
          <li><strong>Account Authentication:</strong> To verify your identity and provide secure access to your journal</li>
          <li><strong>Service Delivery:</strong> To store, retrieve, and display your personal journal entries</li>
          <li><strong>Personalization:</strong> To remember your interface preferences (stored locally on your device)</li>
          <li><strong>Communication:</strong> To respond to any queries or requests you may submit</li>
        </ul>
      </section>

      <section className="legal-section">
        <h2>4. Legal Basis for Processing</h2>
        <p>We process your personal information on the following legal bases as defined by POPIA:</p>
        <ul>
          <li><strong>Consent (Section 11(1)(a)):</strong> You voluntarily provide your information when signing in and creating journal entries</li>
          <li><strong>Legitimate Interest (Section 11(1)(f)):</strong> Processing is necessary to provide and improve the Service</li>
          <li><strong>Contractual Obligation (Section 11(1)(b)):</strong> Processing is necessary to fulfill our Terms of Service</li>
        </ul>
      </section>

      <section className="legal-section">
        <h2>5. Categories of Personal Information</h2>
        <p>Under POPIA's definition, the personal information we process includes:</p>
        <ul>
          <li><strong>Identifiable Information:</strong> Name, email address, Google profile identifier</li>
          <li><strong>Personal Opinions & Views:</strong> The content of your journal entries, which may contain personal views, beliefs, and reflections</li>
          <li><strong>Behavioural Data:</strong> Entry creation timestamps for chronological ordering</li>
        </ul>
        <p>
          We do not process any <strong>special personal information</strong> (as defined in Section 26 of POPIA) intentionally, though we acknowledge that users may voluntarily include such information in their journal entries.
        </p>
      </section>

      <section className="legal-section">
        <h2>6. Your Rights Under POPIA</h2>
        <p>As a data subject under POPIA, you have the following rights:</p>
        <ul>
          <li><strong>Right of Access (Section 23):</strong> You may request confirmation of whether we hold your personal information and request access to it</li>
          <li><strong>Right to Correction (Section 24):</strong> You may request that we correct or delete personal information that is inaccurate, irrelevant, excessive, or misleading</li>
          <li><strong>Right to Deletion (Section 24):</strong> You may request that we destroy or delete your personal information</li>
          <li><strong>Right to Object (Section 11(3)):</strong> You may object to the processing of your personal information on reasonable grounds</li>
          <li><strong>Right to Complain:</strong> You have the right to lodge a complaint with the Information Regulator (South Africa)</li>
        </ul>
      </section>

      <section className="legal-section">
        <h2>7. Cross-Border Data Transfers</h2>
        <p>
          Your data is stored on Google Firebase servers, which may be located outside the Republic of South Africa. In accordance with Section 72 of POPIA, we ensure that any cross-border transfer of personal information is subject to binding agreements that provide an adequate level of protection as required by POPIA.
        </p>
        <p>
          Google's infrastructure complies with internationally recognized data protection standards, including SOC 2 Type II and ISO 27001.
        </p>
      </section>

      <section className="legal-section">
        <h2>8. Data Security Measures</h2>
        <p>In compliance with Section 19 of POPIA, we implement the following security safeguards:</p>
        <ul>
          <li>Encryption of all data in transit using TLS/SSL protocols</li>
          <li>Encryption of data at rest within Google Firebase infrastructure</li>
          <li>Authentication through Google's OAuth 2.0 protocol</li>
          <li>User-scoped data access ensuring journal entries are visible only to their owner</li>
          <li>No retention of authentication credentials on our servers</li>
        </ul>
      </section>

      <section className="legal-section">
        <h2>9. Data Retention</h2>
        <p>
          Your personal information is retained only for as long as is necessary to fulfill the purposes outlined in this notice, or as long as your account remains active. You may delete your data at any time through the application.
        </p>
        <p>
          Upon account deletion or data clearing, all personal information is permanently and irrecoverably removed from our systems within a reasonable timeframe.
        </p>
      </section>

      <section className="legal-section">
        <h2>10. Information Officer</h2>
        <p>
          In compliance with Section 55 of POPIA, inquiries regarding this notice or the processing of your personal information may be directed to our designated Information Officer:
        </p>
        <p>
          <strong>Email:</strong> privacy@thoughts-app.com<br />
          <strong>Subject Line:</strong> POPIA Inquiry
        </p>
      </section>

      <section className="legal-section">
        <h2>11. Information Regulator</h2>
        <p>
          If you believe that we have not adequately addressed your concerns, you have the right to lodge a complaint with the Information Regulator of South Africa:
        </p>
        <p>
          <strong>Website:</strong> https://inforegulator.org.za<br />
          <strong>Email:</strong> enquiries@inforegulator.org.za
        </p>
      </section>
    </LegalPage>
  );
}
