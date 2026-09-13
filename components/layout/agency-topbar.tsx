"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Menu,
  Map,
  ExternalLink,
  ChevronRight,
  Shield,
  Layers,
} from "lucide-react";
import { IncidentPopover } from "./incident-popover";
import { QuickMapModal } from "@/components/map/QuickMapModal";
import { useGetAlerts } from "@/lib/hooks/dispatch/use-dispatch-data";
import { useAgencyAuthStore } from "@/lib/store/agency-auth-store";

interface AgencyTopbarProps {
  onMenuToggle: () => void;
}

export function AgencyTopbar({ onMenuToggle }: AgencyTopbarProps) {
  const pathname = usePathname();
  const agency = useAgencyAuthStore((s) => s.agency);
  const { data: alerts = [] } = useGetAlerts();
  const [isMapModalOpen, setIsMapModalOpen] = useState(false);

  // Compute breadcrumbs dynamically
  const getBreadcrumbTitle = () => {
    if (pathname === "/dashboard") return "Overview HUD";
    if (pathname === "/dashboard/alerts") return "Emergency Alerts";
    if (pathname === "/dashboard/reports") return "SafeChat Reports";
    if (pathname === "/dashboard/map") return "Live Vector Radar";
    if (pathname === "/dashboard/analytics") return "Analytics & Trends";
    if (pathname.startsWith("/dashboard/settings")) return "Agency Settings";
    return "Command Center";
  };

  return (
    <>
      <header className="relative z-40 h-16 shrink-0 bg-card/85 backdrop-blur-md border-b border-border/80 px-4 sm:px-6 flex items-center justify-between select-none">
        {/* Left Section: Mobile Menu + Breadcrumbs */}
        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={onMenuToggle}
            className="lg:hidden p-2 rounded-xl bg-secondary/50 text-muted-foreground hover:text-foreground transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>

          <nav className="flex items-center space-x-1.5 text-xs">
            <span className="font-semibold text-muted-foreground">BeSafe</span>
            <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/60" />
            <span className="font-bold text-foreground">
              {getBreadcrumbTitle()}
            </span>
          </nav>
        </div>

        {/* Right Section: Smart Incident Popover + Live Map Modal + Public Link */}
        <div className="flex items-center space-x-2.5 sm:space-x-3">
          {/* Consolidated Incident Popover Trigger */}
          <IncidentPopover />

          {/* Public Site Link */}
          <Link
            href="/"
            target="_blank"
            className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border/70 bg-background/50 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Public Site</span>
          </Link>

          {/* Quick-Map Modal Launcher */}
          <button
            type="button"
            onClick={() => setIsMapModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-destructive hover:bg-destructive/90 text-white text-xs font-bold shadow-md shadow-destructive/20 transition-all cursor-pointer"
          >
            <Map className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Live Radar</span>
          </button>
        </div>
      </header>

      {/* Quick Mapbox Telemetry Modal */}
      <QuickMapModal
        isOpen={isMapModalOpen}
        onClose={() => setIsMapModalOpen(false)}
        alerts={alerts}
        agencyLocation={
          agency
            ? {
                latitude: agency.location?.lat || agency.latitude || 15.5007,
                longitude: agency.location?.lng || agency.longitude || 32.5599,
                name: agency.name,
              }
            : undefined
        }
      />
    </>
  );
}
