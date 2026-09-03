"use client";

import React, { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAgencyAuthStore } from "@/lib/store/agency-auth-store";
import { initialsOf } from "@/components/operations/shared/Avatar";
import { Menu, Search, Bell } from "lucide-react";

const TITLES: Array<{ prefix: string; title: string }> = [
  { prefix: "/operations/command-center", title: "Command Center" },
  { prefix: "/operations/cases", title: "Cases" },
  { prefix: "/operations/caseworkers", title: "Caseworkers" },
  { prefix: "/operations/assignments", title: "Assignments" },
  { prefix: "/operations/live-map", title: "Live Map" },
  { prefix: "/operations/reports", title: "Reports" },
  { prefix: "/operations/analytics", title: "Analytics" },
  { prefix: "/operations/team", title: "Team" },
  { prefix: "/operations/settings", title: "Settings" },
];

function getTitle(pathname: string): string {
  if (pathname === "/operations/command-center") return "Command Center";
  for (const t of TITLES) {
    if (t.prefix !== "/operations/command-center" && pathname.startsWith(t.prefix)) {
      return t.title;
    }
  }
  return "Operations";
}

export function OperationsTopbar({ onMenuToggle }: { onMenuToggle: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, agency } = useAgencyAuthStore();
  const [query, setQuery] = useState("");

  const title = getTitle(pathname);
  const name = user?.name || agency?.name || "Admin";

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/operations/cases?q=${encodeURIComponent(query.trim())}`);
    }
  };

  return (
    <div className="operations-topbar-inner">
      <div className="operations-topbar__left">
        <button
          type="button"
          className="operations-topbar__menu"
          onClick={onMenuToggle}
          aria-label="Open menu"
        >
          <Menu width={18} height={18} />
        </button>
        <span className="operations-topbar__title">{title}</span>
      </div>

      <div className="operations-topbar__right">
        <form className="operations-search" onSubmit={handleSearch}>
          <Search className="operations-search__icon" />
          <input
            className="operations-search__input"
            placeholder="Search cases, reports, workers..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </form>
        <button type="button" className="operations-bell" aria-label="Notifications">
          <Bell className="operations-bell__icon" />
        </button>
        <div className="operations-user">
          <span className="operations-user__avatar">{initialsOf(name)}</span>
          <div className="operations-user__meta">
            <span className="operations-user__name">{name}</span>
            <span className="operations-user__role">{user?.role || "AGENCY_ADMIN"}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
