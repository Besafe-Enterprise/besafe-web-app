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
  Loader2,
  CheckCircle2,
  Radio,
  UserCheck,
  Building,
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
    "group flex w-full items-center justify-between rounded-md px-3 py-2 text-xs font-medium transition-all duration-150 text-left cursor-pointer select-none",
    isActive
      ? "bg-brand-500/15 text-brand-400 font-semibold"
      : "text-muted-foreground hover:bg-surface-200 hover:text-foreground"
  );

  const content = (
    <>
      <div className="flex items-center gap-2.5 min-w-0">
        <Icon
          className={cn(
            "h-4 w-4 shrink-0",
            isActive ? "text-brand-400" : "text-muted-foreground group-hover:text-foreground"
          )}
        />
        <span className="truncate">{label}</span>
      </div>

      <div className="flex items-center gap-1 shrink-0">
        {typeof badge === "number" && badge > 0 && (
          <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-critical/20 px-1.5 text-[9px] font-bold text-critical">
            {badge}
          </span>
        )}
        <ChevronRight
          className={cn(
            "h-3 w-3 transition-all",
            isActive ? "text-brand-400 opacity-100" : "text-muted-foreground/40 opacity-0 group-hover:opacity-100"
          )}
        />
      </div>
    </>
  );

  // ... rest of component
}