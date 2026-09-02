"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, Map, ExternalLink, ChevronRight } from "lucide-react";
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

  const getBreadcrumbTitle = () => {
    if (pathname === "/dashboard") return "Overview";
    if (pathname === "/dashboard/alerts") return "Emergency Alerts";
    if (pathname === "/dashboard/reports") return "SafeChat Reports";
    if (pathname === "/dashboard/map") return "Live Vector Radar";
    if (pathname === "/dashboard/team") return "Station Team";
    if (pathname === "/dashboard/admin/agencies") return "Agencies Matrix";
    if (pathname.startsWith("/dashboard/settings")) return "Settings";
    return "Command Center";
  };

  return (
    <>
      <header className="relative z-40 h-14 shrink-0 border-b border-border bg-card/90 px-4 flex items-center justify-between">
        {/* Left Section */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onMenuToggle}
            className="lg:hidden p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-surface-200 transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>

          <nav className="flex items-center gap-1 text-xs">
            <span className="font-medium text-muted-foreground">BeSafe</span>
            <ChevronRight className="w-3 h-3 text-muted-foreground/60" />
            <span className="font-semibold text-foreground">
              {getBreadcrumbTitle()}
            </span>
          </nav>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-2">
          <IncidentPopover />

          <Link
            href="/"
            target="_blank"
            className="hidden md:flex items-center gap-1 px-2.5 py-1.5 rounded-md border border-border bg-transparent text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-surface-200 transition-colors"
          >
            <ExternalLink className="w-3 h-3" />
            <span>Public Site</span>
          </Link>

          <button
            type="button"
            onClick={() => setIsMapModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-critical text-white text-xs font-bold shadow-sm hover:bg-critical/90 transition-colors"
          >
            <Map className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Live Radar</span>
          </button>
        </div>
      </header>

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