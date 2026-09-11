"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAgencyAuthStore } from "@/lib/store/agency-auth-store";
import { useAgencyLogout } from "@/lib/hooks/auth/use-agency-auth";
import { useAlertStore } from "@/stores/useAlertStore";
import { ACTIVE_CASE_STATUSES } from "@/types";
import { initialsOf } from "@/components/operations/shared/Avatar";
import {
  LayoutDashboard,
  FolderOpen,
  Users,
  MapPin,
  FileText,
  BarChart3,
  Users2,
  Settings,
  Shield,
  LogOut,
  ChevronRight,
} from "lucide-react";

const NAV_ITEMS = [
  { label: "Command Center", href: "/operations/command-center", icon: LayoutDashboard },
  { label: "Cases", href: "/operations/cases", icon: FolderOpen },
  { label: "Caseworkers", href: "/operations/caseworkers", icon: Users },
  { label: "Live Map", href: "/operations/live-map", icon: MapPin },
  { label: "Safety Chat Reports", href: "/operations/reports", icon: FileText },
  { label: "Analytics", href: "/operations/analytics", icon: BarChart3 },
  { label: "Team", href: "/operations/team", icon: Users2 },
  { label: "Settings", href: "/operations/settings", icon: Settings },
];

export function OperationsSidebar({ onClose }: { onClose?: () => void }) {
  const pathname = usePathname();
  const { user, agency } = useAgencyAuthStore();
  const { mutate: logout, isPending: isLoggingOut } = useAgencyLogout();
  const { alerts } = useAlertStore();

  const activeAlerts =
    alerts.filter((a) => (ACTIVE_CASE_STATUSES as readonly string[]).includes(a.status))
      .length;

  return (
    <div className="ops-sidebar">
      <div className="ops-sidebar-brand">
        <div className="ops-sidebar-logo">
          <Shield className="ops-sidebar-logo-icon" />
          <span className="ops-sidebar-logo-text">{agency?.name || "Agency Console"}</span>
        </div>
        <div className="ops-sidebar-platform">Powered by BeSafe</div>
      </div>

      <nav className="ops-sidebar-nav">
        {NAV_ITEMS.map((item) => {
          const isActive =
            item.href === "/operations/command-center"
              ? pathname === item.href
              : pathname === item.href || pathname.startsWith(item.href + "/");

          const badge = item.label === "Cases" && activeAlerts > 0 ? activeAlerts : undefined;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`ops-nav-item ${isActive ? "active" : ""}`}
              onClick={onClose}
            >
              <item.icon className="ops-nav-icon" />
              <span className="ops-nav-label">{item.label}</span>
              {badge && <span className="ops-nav-badge">{badge}</span>}
              <ChevronRight className="ops-nav-chevron" />
            </Link>
          );
        })}
      </nav>

      <div className="ops-sidebar-footer">
        <div className="ops-sidebar-user" style={{marginTop:"5px"}}>
          <span className="ops-sidebar-avatar">{initialsOf(user?.name || agency?.name)}</span>
          <div className="ops-sidebar-user-info">
            <div className="ops-sidebar-user-name">{user?.name || agency?.name || "Admin"}</div>
            <div className="ops-sidebar-user-role">{user?.role || "AGENCY_ADMIN"}</div>
          </div>
        </div>
        <button
          type="button"
          className="ops-sidebar-logout"
          onClick={() => logout()}
          disabled={isLoggingOut}
        >
          <LogOut className="ops-sidebar-logout-icon" />
          <span>{isLoggingOut ? "Logging out..." : "Logout"}</span>
        </button>
      </div>
    </div>
  );
}
