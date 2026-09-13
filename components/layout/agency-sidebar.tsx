"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAgencyAuthStore } from "@/lib/store/agency-auth-store";
import { useAgencyLogout } from "@/lib/hooks/auth/use-agency-auth";
import { navItems, navGroups, settingsNavItems } from "./agency-nav-items";
import { cn } from "@/lib/utils";
import {
  ArrowLeft,
  ShieldAlert,
  Search,
  ChevronRight,
  MoreVertical,
  LogOut,
  SlidersHorizontal,
  LayoutDashboard,
  Loader2
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { useAlertStore } from "@/stores/useAlertStore";

interface AgencySidebarProps {
  onClose?: () => void;
}

interface SidebarLinkProps {
  href?: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  isActive: boolean;
  badge?: number;
  onClose?: () => void;
  onClick?: (e: React.MouseEvent) => void;
}

function SidebarLink({
  href,
  label,
  icon: Icon,
  isActive,
  badge,
  onClose,
  onClick,
}: SidebarLinkProps) {
  const className = cn(
    "group flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-xs font-medium transition-all duration-200 text-left cursor-pointer border select-none",
    isActive
      ? "bg-primary/15 text-primary border-primary/30 font-semibold shadow-sm shadow-primary/10"
      : "border-transparent text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
  );

  const content = (
    <>
      <div className="flex items-center gap-2.5 min-w-0">
        <Icon
          className={cn(
            "h-4 w-4 shrink-0 transition-transform duration-200 group-hover:scale-110",
            isActive ? "text-primary" : "text-muted-foreground group-hover:text-primary"
          )}
        />
        <span className="truncate">{label}</span>
      </div>

      <div className="flex items-center gap-1.5 shrink-0">
        {typeof badge === "number" && badge > 0 && (
          <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive/20 border border-destructive/40 px-1.5 text-[10px] font-bold text-destructive animate-pulse">
            {badge}
          </span>
        )}
        <ChevronRight
          className={cn(
            "h-3 w-3 transition-transform duration-200 group-hover:translate-x-0.5",
            isActive ? "text-primary opacity-100" : "text-muted-foreground/40 opacity-0 group-hover:opacity-100"
          )}
        />
      </div>
    </>
  );

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={className}>
        {content}
      </button>
    );
  }

  return (
    <Link href={href || "#"} onClick={onClose} className={className}>
      {content}
    </Link>
  );
}

export function AgencySidebar({ onClose }: AgencySidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const user = useAgencyAuthStore((s) => s.user);
  const agency = useAgencyAuthStore((s) => s.agency);
  const { mutate: logout, isPending: isLoggingOut } = useAgencyLogout();
  const { alerts } = useAlertStore();

  const isFieldWorker = user?.role === "FIELD_AGENT";
  const userRole = user?.role || "AGENCY_ADMIN";

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const isSettingsPath = pathname.startsWith("/dashboard/settings");
  const [showSettingsSidebar, setShowSettingsSidebar] = useState(isSettingsPath);

  // Active SOS alert count
  const activeAlertsCount = alerts.filter(
    (a) => a.status === "active" || a.priority === "high"
  ).length;

  useEffect(() => {
    if (isSettingsPath) {
      setShowSettingsSidebar(true);
    } else {
      setShowSettingsSidebar(false);
    }
  }, [isSettingsPath]);

  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
    }
  }, [showSettingsSidebar]);

  const displayName = isFieldWorker
    ? user?.name || "Field Worker"
    : user?.name || agency?.name || "Station Admin";

  const agencyLabel = agency?.name || user?.agency_name || "Agency HQ";

  const userInitials = (user?.name || agency?.name || "OP")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <aside className="flex h-full w-64 flex-col bg-card/95 backdrop-blur-xl border-r border-border select-none text-foreground">
      {/* ─── 1. Station Brand Header ───────────────────────────────── */}
      <div className="flex h-16 items-center border-b border-border/70 px-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-md shadow-blue-500/25 ring-1 ring-white/20">
            <ShieldAlert className="h-5 w-5" />
          </div>
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="truncate text-xs font-bold tracking-tight text-foreground">
                BeSafe
              </span>
              <span className="rounded-md border border-primary/30 bg-primary/15 px-1.5 py-0.2 text-[9px] font-bold uppercase tracking-wider text-primary">
                {isFieldWorker ? "Field" : "Command"}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground truncate">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping shrink-0" />
              <span className="truncate">{agencyLabel}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ─── 2. Search Quick Trigger ──────────────────────────────── */}
      <div className="px-4 pt-3 pb-2">
        <button
          type="button"
          onClick={() => router.push("/dashboard/alerts")}
          className="relative flex h-9 w-full cursor-pointer items-center justify-between rounded-xl border border-border/80 bg-background/60 px-3 text-muted-foreground transition-colors hover:bg-secondary/40 hover:text-foreground"
        >
          <div className="flex items-center gap-2">
            <Search className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-xs">Find incident...</span>
          </div>
          <kbd className="inline-flex h-5 items-center gap-0.5 rounded border border-border bg-card px-1.5 font-mono text-[10px] font-bold text-muted-foreground shadow-sm">
            F
          </kbd>
        </button>
      </div>

      {/* ─── 3. Scrollable Dual-Pane Body ──────────────────────────── */}
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-x-hidden overflow-y-auto py-2"
      >
        <div
          className={cn(
            "flex w-[200%] h-full transition-transform duration-300 ease-in-out",
            showSettingsSidebar ? "-translate-x-1/2" : "translate-x-0"
          )}
        >
          {/* ════ Pane 1: Main Command Operations ════ */}
          <div className="w-1/2 px-3 space-y-5">
            {navGroups
              .filter((group) => {
                // Field workers don't see administration sections
                if (isFieldWorker && group.title.includes("ADMINISTRATION")) {
                  return false;
                }
                if (!group.requiredRoles) return true;
                return group.requiredRoles.includes(userRole);
              })
              .map((group) => {
                const groupItems = navItems.filter((item) => {
                  if (!group.items.includes(item.href)) return false;
                  if (!item.requiredRoles) return true;
                  return item.requiredRoles.includes(userRole);
                });
                if (groupItems.length === 0) return null;

                return (
                  <div key={group.title} className="space-y-1">
                    <h3 className="px-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70">
                      {group.title}
                    </h3>
                    <div className="space-y-1">
                      {groupItems.map((item) => {
                        const isActive =
                          item.href === "/dashboard"
                            ? pathname === item.href
                            : pathname === item.href ||
                              pathname.startsWith(item.href + "/");

                        const badgeCount =
                          item.badgeKey === "alerts" ? activeAlertsCount : undefined;

                        if (item.href === "/dashboard/settings") {
                          return (
                            <SidebarLink
                              key={item.href}
                              label={item.label}
                              icon={item.icon}
                              isActive={isActive}
                              onClick={() => setShowSettingsSidebar(true)}
                            />
                          );
                        }

                        return (
                          <SidebarLink
                            key={item.href}
                            href={item.href}
                            label={item.label}
                            icon={item.icon}
                            isActive={isActive}
                            badge={badgeCount}
                            onClose={onClose}
                          />
                        );
                      })}
                    </div>
                  </div>
                );
              })}
          </div>

          {/* ════ Pane 2: System Settings Sub-Menu (Admins Only) ════ */}
          <div className="w-1/2 px-3 space-y-4">
            {/* Header / Back */}
            <div className="pb-2 border-b border-border/50">
              <button
                type="button"
                onClick={() => setShowSettingsSidebar(false)}
                className="group flex w-full items-center gap-2 rounded-xl px-2.5 py-2 text-xs font-semibold text-muted-foreground hover:bg-secondary/60 hover:text-foreground transition-colors"
              >
                <ArrowLeft className="h-4 w-4 text-primary transition-transform group-hover:-translate-x-0.5" />
                <span className="text-foreground font-bold">Station Settings</span>
              </button>
            </div>

            {/* Sub-items */}
            <div className="space-y-1">
              {settingsNavItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <SidebarLink
                    key={item.href}
                    href={item.href}
                    label={item.label}
                    icon={item.icon}
                    isActive={isActive}
                    onClose={onClose}
                  />
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ─── 4. Bottom User / Operator Profile & Dropdown ──────────── */}
      <div className="border-t border-border/70 p-3 bg-secondary/10">
        <DropdownMenu>
          <DropdownMenuTrigger className="flex w-full cursor-pointer items-center justify-between gap-2 rounded-xl p-1.5 transition-colors hover:bg-secondary/40">
            <div className="flex min-w-0 items-center gap-2.5">
              <Avatar size="sm">
                <AvatarFallback className="bg-primary/20 text-primary border border-primary/30 text-[11px] font-bold">
                  {userInitials}
                </AvatarFallback>
              </Avatar>
              <div className="flex min-w-0 flex-col text-left">
                <span className="truncate text-xs font-semibold text-foreground max-w-[130px]">
                  {displayName}
                </span>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="truncate text-[9px] text-muted-foreground font-medium max-w-[90px]">
                    Agency: {agencyLabel}
                  </span>
                  <span
                    className={cn(
                      "text-[8px] font-bold uppercase px-1 py-0.2 rounded border",
                      isFieldWorker
                        ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                        : "bg-primary/15 text-primary border-primary/20"
                    )}
                  >
                    {userRole.replace("_", " ")}
                  </span>
                </div>
              </div>
            </div>
            <MoreVertical className="h-4 w-4 shrink-0 text-muted-foreground/70" />
          </DropdownMenuTrigger>

          <DropdownMenuContent align="start" side="top" className="w-56 p-1.5">
            {/* Header info */}
            <div className="px-3 py-2 border-b border-border/50 space-y-0.5">
              <p className="truncate text-xs font-bold text-foreground">
                {displayName}
              </p>
              <p className="truncate text-[11px] text-muted-foreground">
                {user?.email || "operator@agency.gov"}
              </p>
              <p className="truncate text-[10px] text-primary/80 font-medium">
                Agency: {agencyLabel}
              </p>
              <span className="inline-block text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-secondary text-foreground mt-1">
                Role: {userRole.replace("_", " ")}
              </span>
            </div>

            <div className="py-1">
              <DropdownMenuItem onClick={() => router.push("/dashboard")}>
                <LayoutDashboard className="h-3.5 w-3.5 text-muted-foreground" />
                <span>Command Overview</span>
              </DropdownMenuItem>

              {!isFieldWorker && (
                <DropdownMenuItem onClick={() => router.push("/dashboard/settings")}>
                  <SlidersHorizontal className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>Station Settings</span>
                </DropdownMenuItem>
              )}
            </div>

            <DropdownMenuSeparator />

            {/* Logout Action */}
            <DropdownMenuItem
              onClick={() => logout()}
              disabled={isLoggingOut}
              className="text-destructive hover:bg-destructive/10 hover:text-destructive focus:bg-destructive/10 focus:text-destructive"
            >
              {isLoggingOut ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Signing out...</span>
                </>
              ) : (
                <>
                  <LogOut className="h-3.5 w-3.5" />
                  <span>Sign Out Console</span>
                </>
              )}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </aside>
  );
}
