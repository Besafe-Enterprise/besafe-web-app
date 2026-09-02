"use client";

import Link from "next/link";
import { useState } from "react";
import {
  Shield,
  Radio,
  Mic,
  MapPin,
  MessageSquare,
  AlertTriangle,
  Lock,
  ArrowRight,
  Download,
  Building2,
  CheckCircle2,
  Smartphone,
  ChevronRight,
  Sparkles,
  Zap,
  Activity,
  Cpu,
  Layers,
  HelpCircle,
  ChevronDown,
  ShieldAlert,
  Users,
  Compass,
  Clock,
  FolderLock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function LandingPage() {
  const [activePerspective, setActivePerspective] = useState<"citizens" | "agencies">("citizens");
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const faqs = [
    {
      q: "How does BeSafe detect threats via voice?",
      a: "BeSafe runs low-power background speech analysis paired with an NLP threat evaluation model. When acute danger keywords or distress signals are recognized, the system automatically initiates an emergency SOS package without requiring manual unlocking.",
    },
    {
      q: "How does proximity agency routing work?",
      a: "When an emergency SOS is triggered, BeSafe calculates your live GPS coordinates and automatically routes the alert to the nearest verified response agency, police division, or authorized security unit in that jurisdiction for rapid dispatch.",
    },
    {
      q: "How does the Timed Safety Check-In feature protect me?",
      a: "If you are walking alone, commuting at night, or entering unfamiliar surroundings, you can set a countdown timer in the app. If you do not confirm you are safe before the timer expires, BeSafe automatically broadcasts your live location and triggers an SOS to your emergency contacts and nearby response units.",
    },
    {
      q: "How does SafeChat protect citizen privacy when reporting incidents?",
      a: "After completing a structured SafeChat report, you have full control over your data: you can choose to save the report securely in your phone's private local storage as a personal record, or submit it to verified response agencies and NGOs whenever you are ready for investigation and support.",
    },
  ];

  return (
    <div className="min-h-screen bg-[#070B14] text-slate-100 flex flex-col selection:bg-[#353FAB] selection:text-white font-sans antialiased overflow-x-hidden">
      {/* ─── Top Navigation Bar ────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 bg-card/95 border-b border-border">
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
    <div className="flex items-center gap-3">
      <div className="w-9 h-9 rounded-lg bg-brand-600 flex items-center justify-center shadow-sm">
        <Shield className="w-5 h-5 text-white" />
      </div>
      <div className="flex flex-col">
        <span className="text-lg font-bold tracking-tight text-foreground">
          BeSafe
        </span>
        <span className="text-[10px] text-muted-foreground font-medium tracking-wide">
          Emergency Response Platform
        </span>
      </div>
    </div>

    <nav className="hidden lg:flex items-center gap-6 text-xs font-medium text-muted-foreground">
      <a href="#features" className="hover:text-foreground transition-colors">
        Features
      </a>
      <a href="#perspectives" className="hover:text-foreground transition-colors">
        For Citizens & Agencies
      </a>
      <a href="#download" className="hover:text-foreground transition-colors">
        Mobile App
      </a>
      <a href="#faq" className="hover:text-foreground transition-colors">
        FAQ
      </a>
    </nav>

    <div className="flex items-center gap-3">
      <Link
        href="/login"
        className="px-3.5 py-2 text-xs font-medium text-foreground hover:bg-surface-200 rounded-md transition-colors"
      >
        Sign In
      </Link>
      <a
        href="#download"
        className="px-4 py-2 rounded-md bg-brand-600 hover:bg-brand-700 text-white text-xs font-medium shadow-sm transition-colors"
      >
        Get Mobile App
      </a>
    </div>
  </div>
</header>

      {/* ─── Hero Section with Ambient Glow ───────────────────────────── */}
      <section className="relative pt-16 pb-20 overflow-hidden border-b border-border">
  {/* Background glow - more subtle */}
  <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-brand-500/10 blur-[120px] pointer-events-none -z-10 rounded-full" />

  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div className="grid lg:grid-cols-12 gap-12 items-center">
      <div className="lg:col-span-7 space-y-5 text-center lg:text-left">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface-200 border border-border text-xs font-medium text-muted-foreground">
          <span className="flex h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
          Real-time Safety & Response
        </div>

        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-foreground leading-[1.1]">
          Instant Safety When{" "}
          <span className="text-brand-400">
            Every Second Counts.
          </span>
        </h1>

        <p className="text-sm text-muted-foreground max-w-2xl mx-auto lg:mx-0 leading-relaxed">
          BeSafe protects citizens with voice threat recognition, one-touch SOS with proximity agency routing, timed safety check-ins, and secure reporting.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3 pt-2">
          <a
            href="#download"
            className="w-full sm:w-auto px-5 py-2.5 rounded-md bg-brand-600 hover:bg-brand-700 text-white font-medium shadow-sm transition-colors flex items-center justify-center gap-2 text-sm"
          >
            <Smartphone className="w-4 h-4" />
            Download Mobile App
            <ArrowRight className="w-4 h-4" />
          </a>

          <Link
            href="/login"
            className="w-full sm:w-auto px-5 py-2.5 rounded-md border border-border hover:bg-surface-200 text-foreground font-medium transition-colors flex items-center justify-center gap-2 text-sm"
          >
            <Building2 className="w-4 h-4 text-muted-foreground" />
            Agency Login
          </Link>
        </div>
      </div>

      {/* Right side - keep but simplify */}
      <div className="lg:col-span-5">
        {/* ... simplified hero card ... */}
      </div>
    </div>
  </div>
</section>

      {/* ─── 4 Core Capabilities Grid ─────────────────────────────────── */}
      <section id="features" className="py-24 border-b border-slate-800/60 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <h2 className="text-xs font-bold font-mono uppercase tracking-widest text-[#8B93FF]">
              Core Architecture
            </h2>
            <p className="text-3xl sm:text-4xl font-extrabold text-white">
              Real Emergency Defense Capabilities
            </p>
            <p className="text-sm text-slate-400 leading-relaxed">
              Engineered with proven features designed for rapid detection, fail-safe communication, and rapid agency coordination.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Feature 1: Voice Threat NLP */}
            <div className="p-6 rounded-2xl bg-[#0F172A]/70 border border-slate-800 hover:border-[#353FAB]/60 transition-all group shadow-lg hover:shadow-[#353FAB]/10 space-y-4">
              <div className="w-12 h-12 rounded-xl bg-red-500/15 text-red-400 flex items-center justify-center font-bold border border-red-500/20 group-hover:scale-110 transition-transform">
                <Mic className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white">Voice Threat Recognition</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Background audio NLP evaluates keywords and distress cues, triggering automated emergency alerts when danger is confirmed.
              </p>
            </div>

            {/* Feature 2: Proximity Routing */}
            <div className="p-6 rounded-2xl bg-[#0F172A]/70 border border-slate-800 hover:border-[#353FAB]/60 transition-all group shadow-lg hover:shadow-[#353FAB]/10 space-y-4">
              <div className="w-12 h-12 rounded-xl bg-[#353FAB]/20 text-[#8B93FF] flex items-center justify-center font-bold border border-[#353FAB]/30 group-hover:scale-110 transition-transform">
                <Compass className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white">Proximity Agency Routing</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Geospatial indexing automatically calculates the closest response agency headquarters based on live GPS coordinates.
              </p>
            </div>

            {/* Feature 3: Timed Safety Check-in */}
            <div className="p-6 rounded-2xl bg-[#0F172A]/70 border border-slate-800 hover:border-[#353FAB]/60 transition-all group shadow-lg hover:shadow-[#353FAB]/10 space-y-4">
              <div className="w-12 h-12 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center font-bold border border-amber-500/20 group-hover:scale-110 transition-transform">
                <Clock className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white">Timed Safety Check-In</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Set a countdown timer when walking alone. If you do not confirm safety before time expires, an emergency alert triggers automatically.
              </p>
            </div>

            {/* Feature 4: SafeChat Private Vault or Agency Push */}
            <div className="p-6 rounded-2xl bg-[#0F172A]/70 border border-slate-800 hover:border-[#353FAB]/60 transition-all group shadow-lg hover:shadow-[#353FAB]/10 space-y-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center font-bold border border-emerald-500/20 group-hover:scale-110 transition-transform">
                <FolderLock className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white">SafeChat Private / Push Vault</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Record qualitative reports with media evidence. Keep them stored privately on your phone, or submit to agencies when you are ready.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Citizen Defense vs Agency Command (Interactive Tab) ───────── */}
      <section id="perspectives" className="py-24 border-b border-slate-800/60 bg-[#0B0F19]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center space-y-4">
            <h2 className="text-xs font-bold font-mono uppercase tracking-widest text-[#8B93FF]">
              Tailored Experiences
            </h2>
            <h3 className="text-3xl font-extrabold text-white">
              Built for Citizens. Optimized for Response Agencies & Support NGOs.
            </h3>
            
            {/* Toggle Switch */}
            <div className="inline-flex p-1 rounded-xl bg-slate-900 border border-slate-800">
              <button
                type="button"
                onClick={() => setActivePerspective("citizens")}
                className={`px-5 py-2 rounded-lg text-xs font-bold transition-all ${
                  activePerspective === "citizens"
                    ? "bg-[#353FAB] text-white shadow-md"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                For Citizens & Families
              </button>
              <button
                type="button"
                onClick={() => setActivePerspective("agencies")}
                className={`px-5 py-2 rounded-lg text-xs font-bold transition-all ${
                  activePerspective === "agencies"
                    ? "bg-[#353FAB] text-white shadow-md"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                For Response Agencies, NGOs & Admins
              </button>
            </div>
          </div>

          {activePerspective === "citizens" ? (
            <div className="grid md:grid-cols-3 gap-8">
              <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
                <div className="w-10 h-10 rounded-lg bg-red-500/20 text-red-400 flex items-center justify-center font-bold">
                  <Zap className="w-5 h-5" />
                </div>
                <h4 className="text-sm font-bold text-white">One-Touch & Voice SOS</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Trigger an SOS by voice keyword or single tap, notifying both your designated emergency circle and the closest response unit.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
                <div className="w-10 h-10 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
                  <Clock className="w-5 h-5" />
                </div>
                <h4 className="text-sm font-bold text-white">Timed Safety Check-In</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Set safety alarms for night walks or unfamiliar travel. Confirm you are safe or let BeSafe automatically alert responders.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                  <FolderLock className="w-5 h-5" />
                </div>
                <h4 className="text-sm font-bold text-white">SafeChat Privacy Control</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Log harassment or safety hazards. Choose whether to store reports in your private phone vault or push them to agencies.
                </p>
              </div>
            </div>
          ) : (
            <div className="grid md:grid-cols-3 gap-8">
              <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
                <div className="w-10 h-10 rounded-lg bg-primary/20 text-[#8B93FF] flex items-center justify-center font-bold">
                  <Layers className="w-5 h-5" />
                </div>
                <h4 className="text-sm font-bold text-white">Live Vector Radar</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Full-screen interactive Mapbox telemetry canvas showing live distress vectors, active markers, and agency headquarters.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
                <div className="w-10 h-10 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
                  <Cpu className="w-5 h-5" />
                </div>
                <h4 className="text-sm font-bold text-white">AI Pattern Triage Dossiers</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Submitted citizen reports generate structured pattern tags, timeline urgency ratings, and severity scores via AI.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                  <Users className="w-5 h-5" />
                </div>
                <h4 className="text-sm font-bold text-white">Staff Assignment Queue</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Assign incidents to specific agency dispatchers with instant WebSocket sync across all connected command consoles.
                </p>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ─── Official Mobile App Showcase (Google Play & App Store) ───── */}
      <section id="download" className="py-24 border-b border-slate-800/60 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-3xl bg-gradient-to-br from-slate-900 via-[#0F172A] to-[#141B2D] border border-slate-700/80 p-8 sm:p-12 shadow-2xl relative overflow-hidden">
            <div className="grid lg:grid-cols-12 gap-10 items-center">
              <div className="lg:col-span-7 space-y-6">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/20 border border-primary/30 text-[#8B93FF] text-xs font-mono font-bold">
                  📱 OFFICIAL MOBILE APPLICATION
                </div>

                <h3 className="text-3xl sm:text-4xl font-extrabold text-white">
                  Download BeSafe for Android & iOS
                </h3>

                <p className="text-sm text-slate-300 leading-relaxed">
                  Protect yourself and your loved ones everywhere you go. The BeSafe mobile application runs lightweight continuous voice threat recognition, timed check-in alarms, and direct proximity routing to emergency units.
                </p>

                {/* Mobile App Download Cards */}
                <div className="grid sm:grid-cols-2 gap-4 pt-2">
                  {/* Google Play */}
                  <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 hover:border-emerald-500/40 transition-all space-y-2 group cursor-pointer">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">🤖</span>
                        <div className="text-left">
                          <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">GET IT ON</span>
                          <span className="text-sm font-extrabold text-white group-hover:text-emerald-400 transition-colors">Google Play</span>
                        </div>
                      </div>
                      <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 text-[9px] font-mono">
                        OFFICIAL
                      </Badge>
                    </div>
                    <p className="text-[11px] text-slate-400">Standard Android release for all smartphone brands.</p>
                  </div>

                  {/* Apple App Store */}
                  <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 hover:border-[#353FAB]/40 transition-all space-y-2 group cursor-pointer">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">🍏</span>
                        <div className="text-left">
                          <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">DOWNLOAD ON</span>
                          <span className="text-sm font-extrabold text-white group-hover:text-[#8B93FF] transition-colors">App Store</span>
                        </div>
                      </div>
                      <Badge className="bg-indigo-500/20 text-indigo-300 border-indigo-500/30 text-[9px] font-mono">
                        IOS RELEASE
                      </Badge>
                    </div>
                    <p className="text-[11px] text-slate-400">Native iOS build with Siri shortcut & lock screen widget.</p>
                  </div>
                </div>
              </div>

              {/* Phone Mockup Showcase */}
              <div className="lg:col-span-5 flex justify-center">
                <div className="w-64 sm:w-72 p-4 rounded-3xl bg-slate-950 border-4 border-slate-800 shadow-2xl space-y-3">
                  <div className="w-12 h-1 bg-slate-700 rounded-full mx-auto" />
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-[#353FAB] to-[#4E59D4] text-white text-center space-y-2 shadow-lg shadow-[#353FAB]/30">
                    <Shield className="w-10 h-10 mx-auto text-white" />
                    <h5 className="font-extrabold text-sm">BeSafe Mobile</h5>
                    <p className="text-[10px] text-slate-200">Native Citizen Defense App</p>
                  </div>
                  <div className="space-y-2 text-[11px] font-mono text-slate-300">
                    <div className="flex justify-between p-2 rounded bg-slate-900">
                      <span>AI Threat Listener:</span>
                      <span className="text-emerald-400 font-bold">ACTIVE (24/7)</span>
                    </div>
                    <div className="flex justify-between p-2 rounded bg-slate-900">
                      <span>Proximity GPS:</span>
                      <span className="text-primary font-bold">LOCKED</span>
                    </div>
                    <div className="flex justify-between p-2 rounded bg-slate-900">
                      <span>Emergency Circle:</span>
                      <span className="text-emerald-400 font-bold">SYNCED</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Frequently Asked Questions ───────────────────────────────── */}
      <section id="faq" className="py-24 border-b border-slate-800/60 bg-[#070B14]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center space-y-3">
            <h2 className="text-xs font-bold font-mono uppercase tracking-widest text-[#8B93FF]">
              Frequently Asked Questions
            </h2>
            <h3 className="text-3xl font-extrabold text-white">
              Questions & Product Protocols
            </h3>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div
                  key={idx}
                  onClick={() => setOpenFaq(isOpen ? null : idx)}
                  className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-slate-700 transition-all cursor-pointer space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-white flex items-center gap-2">
                      <HelpCircle className="w-4 h-4 text-[#8B93FF]" />
                      {faq.q}
                    </span>
                    <ChevronDown
                      className={`w-4 h-4 text-slate-400 transition-transform ${
                        isOpen ? "rotate-180" : ""
                      }`}
                    />
                  </div>
                  {isOpen && (
                    <p className="text-xs text-slate-300 leading-relaxed pt-2 border-t border-slate-800/80">
                      {faq.a}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── Footer ───────────────────────────────────────────────────── */}
      <footer className="py-12 bg-[#05080F] border-t border-slate-900 text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-xl bg-[#353FAB] flex items-center justify-center text-white font-bold">
              <Shield className="w-4 h-4" />
            </div>
            <span className="text-sm font-bold text-white">BeSafe Emergency Network</span>
          </div>

          <div className="flex items-center gap-6">
            <Link href="/login" className="hover:text-white transition-colors">
              Agency Login
            </Link>
            <Link href="/dashboard" className="hover:text-white transition-colors">
              Live HUD
            </Link>
            <a href="#download" className="hover:text-white transition-colors">
              Mobile App
            </a>
          </div>
        </div>
      </footer>

    </div>
  );
}
