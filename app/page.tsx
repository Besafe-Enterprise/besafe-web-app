"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Shield,
  Sun,
  Moon,
  ArrowRight,
  Smartphone,
  Building2,
  Mic,
  MapPin,
  Clock,
  ShieldCheck,
  HelpCircle,
  ChevronDown,
  HardHat,
} from "lucide-react";
import "@/styles/landing.css";

export default function LandingPage() {
  const [activePerspective, setActivePerspective] = useState<"citizens" | "agencies">("citizens");
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem("landing-theme") as "dark" | "light" | null;
    const initial = stored === "light" ? "light" : "dark";
    setTheme(initial);
    document.documentElement.setAttribute("data-theme", initial);
  }, []);

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    localStorage.setItem("landing-theme", next);
    document.documentElement.setAttribute("data-theme", next);
  };

  const faqs = [
    {
      q: "How does BeSafe detect threats via voice?",
      a: "BeSafe runs a low-power background listener that analyzes speech for distress cues. When danger signals are detected, the system automatically sends an emergency SOS with your location — no manual action required.",
    },
    {
      q: "How does it find the nearest agency?",
      a: "When an SOS is triggered, BeSafe calculates your GPS coordinates and routes the alert to the closest verified response agency or police unit in your area for fast dispatch.",
    },
    {
      q: "How does the safety check-in work?",
      a: "If you are walking alone or commuting at night, you set a timer in the app. If you do not confirm you are safe before it expires, BeSafe automatically alerts your emergency contacts and nearby responders.",
    },
    {
      q: "Can I keep my reports private?",
      a: "Yes. You can store reports locally on your phone as a personal record, or submit them to verified agencies and support organizations when you are ready. You control when and how your data is shared.",
    },
  ];

  return (
    <div className="landing-root">
      {/* ─── Navbar ───────────────────────────────────── */}
      <header className="landing-nav">
        <div className="landing-nav-inner">
          <div className="landing-nav-brand">
            <div className="landing-nav-logo">
              <Shield size={20} />
            </div>
            <div className="landing-nav-title">
              <span>BeSafe</span>
              <span>Emergency Response Platform</span>
            </div>
          </div>

          <nav>
            <ul className="landing-nav-links">
              <li><a href="#features">How It Works</a></li>
              <li><a href="#perspectives">For Citizens & Agencies</a></li>
              <li><a href="#download">Download</a></li>
              <li><a href="#faq">FAQ</a></li>
            </ul>
          </nav>

          <div className="landing-nav-actions">
            <button className="theme-toggle" onClick={toggleTheme} aria-label="Toggle theme" suppressHydrationWarning>
              {!mounted ? <Sun size={16} /> : theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
            </button>
            <Link href="/login?role=admin" className="landing-btn landing-btn--ghost landing-btn--sm">
              Sign In
            </Link>
            <a href="#download" className="landing-btn landing-btn--primary landing-btn--sm">
              Get App
            </a>
          </div>
        </div>
      </header>

      {/* ─── Hero ─────────────────────────────────────── */}
      <section className="landing-hero">
        <div className="landing-hero-inner">
          <div className="landing-hero-trust">
            <span className="landing-hero-trust__pill"><ShieldCheck size={14} /> Verified Agencies Only</span>
            <span className="landing-hero-trust__pill"><Shield size={14} /> End-to-End Encrypted</span>
            <span className="landing-hero-trust__pill"><Building2 size={14} /> NGO & Police Network</span>
          </div>

          <h1>Stay Safe. Get Help Instantly.</h1>

          <p>
            BeSafe connects you to the <b>nearest verified</b> emergency agency with one tap, voice-triggered alerts, safety check-ins, and <b>private</b> reporting — all from your phone.
          </p>

          <div className="landing-hero-actions">
            <a href="#download" className="landing-btn landing-btn--primary landing-btn--lg">
              <Smartphone size={18} />
              Download the App
              <ArrowRight size={16} />
            </a>
            <Link href="/login?role=admin" className="landing-btn landing-btn--outline landing-btn--lg">
              <Building2 size={18} />
              Agency Console
            </Link>
            <Link href="/login?role=field" className="landing-btn landing-btn--outline landing-btn--lg">
              <HardHat size={18} />
              Field Worker
            </Link>
          </div>

          <div className="landing-trust-bar">
            <div className="landing-trust-bar__item"><ShieldCheck size={16} /> <b>100%</b> Verified Agencies</div>
            <div className="landing-trust-bar__item"><Shield size={16} /> <b>AES-256</b> Encrypted Vault</div>
            <div className="landing-trust-bar__item"><Building2 size={16} /> <b>24/7</b> Command Center</div>
          </div>
        </div>
      </section>

      {/* ─── Features ─────────────────────────────────── */}
      <section id="features" className="landing-features">
        <div className="landing-section-inner">
          <div className="landing-section-header">
            <p className="landing-section-label">How It Works</p>
            <h2 className="landing-section-title">Built for Real Emergencies</h2>
            <p className="landing-section-desc">
              Four core features that work together to keep people safe and connected to help when it matters most.
            </p>
          </div>

          <div className="landing-features-grid">
            <div className="feature-card">
              <div className="feature-card-icon feature-card-icon--voice">
                <Mic size={24} />
              </div>
              <h3>Voice Detection</h3>
              <p>
                Listens for distress cues in the background and triggers an SOS automatically when danger is detected — no phone interaction needed.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-card-icon feature-card-icon--sos">
                <ShieldCheck size={24} />
              </div>
              <h3>One-Touch SOS</h3>
              <p>
                Tap once to send your live location, emergency contacts, and threat details to the nearest verified response agency.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-card-icon feature-card-icon--checkin">
                <Clock size={24} />
              </div>
              <h3>Safety Check-In</h3>
              <p>
                Set a timer when heading out alone. If you do not check in on time, BeSafe alerts your contacts and nearby responders.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-card-icon feature-card-icon--report">
                <ShieldCheck size={24} />
              </div>
              <h3>Private Reporting</h3>
              <p>
                Document incidents with details and evidence. Store them privately on your phone or share them with agencies when you are ready.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Perspectives ─────────────────────────────── */}
      <section id="perspectives" className="landing-perspectives">
        <div className="landing-section-inner">
          <div className="landing-section-header">
            <p className="landing-section-label">For Citizens and Agencies</p>
            <h2 className="landing-section-title">Two Sides of the Same Platform</h2>

            <div className="perspectives-toggle" role="tablist">
              <button
                role="tab"
                aria-selected={activePerspective === "citizens"}
                onClick={() => setActivePerspective("citizens")}
              >
                Citizens and Families
              </button>
              <button
                role="tab"
                aria-selected={activePerspective === "agencies"}
                onClick={() => setActivePerspective("agencies")}
              >
                Agencies and NGOs
              </button>
            </div>
          </div>

          {activePerspective === "citizens" ? (
            <div className="perspectives-grid">
              <div className="perspective-card">
                <div className="perspective-card-icon feature-card-icon--voice">
                  <ShieldCheck size={20} />
                </div>
                <h4>SOS and Emergency Alerts</h4>
                <p>
                  Trigger an emergency by voice or tap. Your location, contacts, and situation details are sent to the nearest response unit immediately.
                </p>
              </div>

              <div className="perspective-card">
                <div className="perspective-card-icon feature-card-icon--checkin">
                  <Clock size={20} />
                </div>
                <h4>Timed Safety Check-In</h4>
                <p>
                  Heading out at night or through an unfamiliar area? Set a timer. If you do not confirm you are safe, BeSafe takes over.
                </p>
              </div>

              <div className="perspective-card">
                <div className="perspective-card-icon feature-card-icon--report">
                  <ShieldCheck size={20} />
                </div>
                <h4>Secure Incident Reports</h4>
                <p>
                  Record details about harassment, danger, or assault. Keep them in your private vault or submit to trusted agencies on your own terms.
                </p>
              </div>
            </div>
          ) : (
            <div className="perspectives-grid">
              <div className="perspective-card">
                <div className="perspective-card-icon feature-card-icon--sos">
                  <MapPin size={20} />
                </div>
                <h4>Live Response Map</h4>
                <p>
                  A full-screen map showing incoming alerts, active incidents, and nearby agency units — updated in real time via WebSocket.
                </p>
              </div>

              <div className="perspective-card">
                <div className="perspective-card-icon feature-card-icon--purple">
                  <ShieldCheck size={20} />
                </div>
                <h4>Case Management</h4>
                <p>
                  Triage incoming reports, assign cases to staff, track investigation progress, and manage follow-ups from a single dashboard.
                </p>
              </div>

              <div className="perspective-card">
                <div className="perspective-card-icon feature-card-icon--teal">
                  <Building2 size={20} />
                </div>
                <h4>Team Dispatch</h4>
                <p>
                  Assign responders to active cases with real-time status updates. All connected consoles see changes instantly.
                </p>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ─── Trust & Safety ─────────────────────────────── */}
      <section className="landing-security">
        <div className="landing-section-inner">
          <div className="landing-section-header">
            <p className="landing-section-label">Trust & Safety</p>
            <h2 className="landing-section-title">Verified. Encrypted. Yours.</h2>
            <p className="landing-section-desc">BeSafe was built with law-enforcement and NGOs — not as a social app. Every agency is verified, every report is encrypted, and you stay in control.</p>
          </div>
          <div className="landing-security-grid">
            <div className="landing-security-card">
              <div className="landing-security-card-icon"><ShieldCheck size={18} /></div>
              <h4>Verified Agencies Only</h4>
              <p>Every police unit, response NGO and support center is manually verified against official records. No anonymous responders.</p>
              <ul>
                <li><ShieldCheck size={12} /> Government ID + HQ location verified</li>
                <li><ShieldCheck size={12} /> Revocable access — agency can be suspended instantly</li>
              </ul>
            </div>
            <div className="landing-security-card">
              <div className="landing-security-card-icon" style={{ background: "rgba(59,130,246,0.12)", color: "#3B82F6" }}><Shield size={18} /></div>
              <h4>End-to-End Encrypted Vault</h4>
              <p>Voice cues, locations and evidence are AES-256 encrypted at rest and TLS in transit. Even BeSafe cannot read your private vault.</p>
              <ul>
                <li><ShieldCheck size={12} /> Store reports locally — submit only when you choose</li>
                <li><ShieldCheck size={12} /> Auto-redacted exports for court-ready PDFs</li>
              </ul>
            </div>
            <div className="landing-security-card">
              <div className="landing-security-card-icon" style={{ background: "rgba(139,92,246,0.12)", color: "#8B5CF6" }}><Building2 size={18} /></div>
              <h4>You Control Your Data</h4>
              <p>Share a report with one agency, a support NGO, or keep it private forever. Revoke access anytime from your phone.</p>
              <ul>
                <li><ShieldCheck size={12} /> One-tap revoke + 7-day presigned evidence links</li>
                <li><ShieldCheck size={12} /> No ads, no selling, no tracking</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Download ─────────────────────────────────── */}
      <section id="download" className="landing-download">
        <div className="landing-section-inner">
          <div className="landing-section-header">
            <p className="landing-section-label">Get the App</p>
            <h2 className="landing-section-title">Available on Android and iOS</h2>
            <p className="landing-section-desc">
              Download BeSafe to start protecting yourself and the people you care about.
            </p>
          </div>

          <div className="download-cards">
            <a href="#" className="download-card" target="_blank" rel="noopener noreferrer">
              <div className="download-card-header">
                <div className="download-card-store">
                  <Smartphone size={24} />
                  <div>
                    <p className="download-card-label">Get it on</p>
                    <p className="download-card-name">Google Play</p>
                  </div>
                </div>
                <span className="landing-badge">Android</span>
              </div>
              <p>For all Android devices. Install and start using in minutes.</p>
            </a>

            <a href="#" className="download-card" target="_blank" rel="noopener noreferrer">
              <div className="download-card-header">
                <div className="download-card-store">
                  <Smartphone size={24} />
                  <div>
                    <p className="download-card-label">Download on the</p>
                    <p className="download-card-name">App Store</p>
                  </div>
                </div>
                <span className="landing-badge">iOS</span>
              </div>
              <p>Native iPhone and iPad app with full feature support.</p>
            </a>
          </div>
        </div>
      </section>

      {/* ─── FAQ ──────────────────────────────────────── */}
      <section id="faq" className="landing-faq">
        <div className="landing-section-inner">
          <div className="landing-section-header">
            <p className="landing-section-label">FAQ</p>
            <h2 className="landing-section-title">Common Questions</h2>
          </div>

          <div className="faq-list">
            {faqs.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div
                  key={idx}
                  className={`faq-item ${isOpen ? "faq-item--open" : ""}`}
                  onClick={() => setOpenFaq(isOpen ? null : idx)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setOpenFaq(isOpen ? null : idx);
                    }
                  }}
                >
                  <div className="faq-item-header">
                    <span>
                      <HelpCircle size={16} />
                      {faq.q}
                    </span>
                    <ChevronDown size={16} className="faq-chevron" />
                  </div>
                  {isOpen && (
                    <div className="faq-item-answer">
                      <p>{faq.a}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── Footer ───────────────────────────────────── */}
      <footer className="landing-footer">
        <div className="landing-footer-inner">
          <div className="landing-footer-brand">
            <div className="landing-footer-brand-icon">
              <Shield size={16} />
            </div>
            <span>BeSafe Emergency Network</span>
          </div>

          <div className="landing-footer-links">
            <Link href="/login?role=admin">Agency Console</Link>
            <Link href="/login?role=field">Field Worker</Link>
            <a href="#download">Mobile App</a>
          </div>
        </div>
        <p className="landing-footer-copy" style={{ textAlign: "center", maxWidth: 1200, margin: "var(--space-4) auto 0", padding: "0 var(--space-5)" }}>
          &copy; 2026 BeSafe. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
