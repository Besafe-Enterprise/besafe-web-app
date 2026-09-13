"use client";

import { useState } from "react";
import Link from "next/link";
import { AlertTriangle, X } from "lucide-react";
import { useAgencyGetMe } from "@/lib/hooks/auth/use-agency-auth";
import { useAlertStore } from "@/stores/useAlertStore";
import { useSocket } from "@/hooks/useSocket";
import { AgencySidebar } from "@/components/layout/agency-sidebar";
import { AgencyTopbar } from "@/components/layout/agency-topbar";


export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { latestEmergency, isEmergencyModalOpen, dismissLatestEmergency } =
    useAlertStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Fetch current agency profile to ensure fresh session
  useAgencyGetMe();

  // Initialize socket listener
  useSocket();

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background text-foreground select-none">
      {/* ─── Mobile Sidebar Overlay Drawer ───────────────────────────── */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm lg:hidden animate-in fade-in-50"
          onClick={() => setSidebarOpen(false)}
        >
          <div
            className="fixed inset-y-0 left-0 z-50 w-64 bg-card shadow-2xl animate-in slide-in-from-left duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="absolute top-3 right-3 z-10">
              <button
                type="button"
                onClick={() => setSidebarOpen(false)}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <AgencySidebar onClose={() => setSidebarOpen(false)} />
          </div>
        </div>
      )}

      {/* ─── Desktop Sticky Sidebar ───────────────────────────────────── */}
      <div className="hidden lg:flex h-full shrink-0">
        <AgencySidebar />
      </div>

      {/* ─── Main Content Canvas ──────────────────────────────────────── */}
      <div className="flex flex-1 flex-col min-w-0 h-full overflow-hidden">
        {/* Top Navbar */}
        <AgencyTopbar onMenuToggle={() => setSidebarOpen(true)} />

        {/* Page Viewport */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 bg-background">
          {children}
        </main>
      </div>

      {/* ─── Global Incoming SOS Alert Popup Modal ────────────────────── */}
      {isEmergencyModalOpen && latestEmergency && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="max-w-lg w-full rounded-2xl bg-card p-6 shadow-2xl border-2 border-destructive animate-pulse space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-destructive/20 text-destructive flex items-center justify-center font-bold">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-foreground">
                    NEW EMERGENCY SOS TRIGGER
                  </h3>
                  <p className="text-xs text-destructive font-mono">
                    Incident #{latestEmergency.id} • Immediate Response Required
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-background border border-border space-y-3">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Victim / User:</span>
                <span className="text-foreground font-semibold">
                  {latestEmergency.user?.name || "Anonymous User"}
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Coordinates:</span>
                <span className="text-foreground font-mono">
                  {latestEmergency.location?.latitude?.toFixed(4)}° N,{" "}
                  {latestEmergency.location?.longitude?.toFixed(4)}° E
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Trigger Source:</span>
                <span className="text-primary font-semibold uppercase">
                  {latestEmergency.description || "One-Touch SOS"}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={dismissLatestEmergency}
                className="flex-1 py-2.5 rounded-xl bg-secondary hover:bg-secondary/80 text-xs font-semibold text-secondary-foreground transition-all"
              >
                Acknowledge & Close
              </button>
              <Link
                href="/dashboard/map"
                onClick={dismissLatestEmergency}
                className="flex-1 py-2.5 rounded-xl bg-destructive hover:bg-destructive/90 text-white text-xs font-bold text-center transition-all shadow-lg shadow-destructive/25"
              >
                Dispatch on Live Map →
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
