"use client";

import React, { useState, useRef, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAgencyAuthStore } from "@/lib/store/agency-auth-store";
import { useAgencyNotifications, useMarkAgencyNotificationsRead } from "@/lib/hooks/team/use-team-data";
import { initialsOf } from "@/components/operations/shared/Avatar";
import { Menu, Search, Bell, CheckCheck } from "lucide-react";

function shortenIds(text: string): string {
  return text.replace(/#([0-9a-f]{8})[0-9a-f]{16}/gi, "#$1…");
}

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
  const [bellOpen, setBellOpen] = useState(false);
  const bellRef = useRef<HTMLDivElement>(null);
  const { data: notifData } = useAgencyNotifications();
  const markRead = useMarkAgencyNotificationsRead();

  const notifications = notifData?.notifications ?? [];
  const unread = notifData?.unread ?? 0;

  useEffect(() => {
    if (!bellOpen) return;
    const onDown = (e: MouseEvent) => {
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) {
        setBellOpen(false);
      }
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [bellOpen]);

  const openNotification = (n: { id: string; data?: Record<string, unknown>; type: string }) => {
    markRead.mutate([n.id]);
    const d = n.data ?? {};
    const t = String(n.type || "");
    // Deep-link to point of interest
    if (t === "application" && d.request_id) {
      router.push("/operations/team");
    } else if (d.report_id) {
      // SafeChat report — go to report detail, scroll to relevant section
      const rid = String(d.report_id);
      if (t.includes("evidence") || d.evidence_id) router.push(`/operations/reports/${rid}#evidence`);
      else if (d.note_id) router.push(`/operations/reports/${rid}#note-${String(d.note_id)}`);
      else router.push(`/operations/reports/${rid}`);
    } else if (d.alert_id) {
      const aid = String(d.alert_id);
      if (d.report_id) router.push(`/operations/cases/${aid}#report-${String(d.report_id)}`);
      else if (t.includes("evidence") || d.evidence_id) router.push(`/operations/cases/${aid}#evidence`);
      else if (t.includes("checkin") || t === "field_checkin" || d.staff_id) {
        // Check-in → caseworker or case location
        if (d.staff_id) router.push(`/operations/caseworkers/${String(d.staff_id)}`);
        else router.push(`/operations/cases/${aid}#location`);
      } else router.push(`/operations/cases/${aid}`);
    } else if (d.staff_id) {
      router.push(`/operations/caseworkers/${String(d.staff_id)}`);
    } else if (d.request_id) {
      router.push("/operations/team");
    } else {
      router.push("/operations/command-center");
    }
    setBellOpen(false);
  };

  const title = getTitle(pathname);
  const name = user?.name || agency?.name || "Admin";

  function isObjectId(q: string) {
    return /^[a-f0-9]{24}$/i.test(q.replace(/[^a-f0-9]/gi, ""));
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const raw = query.trim();
    if (!raw) return;
    // Strip #CASE- / #RPT- / dashes for ID direct nav — try direct fetch first
    const normalized = raw.replace(/^#/, "").replace(/^(case|rpt)[-_]?/i, "").replace(/[^a-f0-9]/gi, "").toLowerCase();
    const isIdLike = isObjectId(normalized) || /^[a-f0-9]{6}$/i.test(normalized) || /^[a-f0-9]{24}$/i.test(normalized);
    if (isIdLike && normalized.length >= 6) {
      // Let the cases page handle smart ID lookup (exact + short-tail), unified search covers both
      router.push(`/operations/cases?q=${encodeURIComponent(raw)}`);
      return;
    }
    router.push(`/operations/cases?q=${encodeURIComponent(raw)}`);
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
        <div className="operations-bell-wrap" ref={bellRef}>
          <button
            type="button"
            className="operations-bell"
            aria-label="Notifications"
            onClick={() => setBellOpen((v) => !v)}
          >
            <Bell className="operations-bell__icon" />
            {unread > 0 && <span className="operations-bell__badge">{unread > 9 ? "9+" : unread}</span>}
          </button>
          {bellOpen && (
            <div className="operations-bell__panel">
              <div className="operations-bell__panel-header">
                <span>Notifications</span>
                {unread > 0 && (
                  <button
                    type="button"
                    className="btn btn--ghost btn--sm"
                    onClick={() => markRead.mutate(undefined)}
                  >
                    <CheckCheck width={14} height={14} /> Mark all read
                  </button>
                )}
              </div>
              <div className="operations-bell__panel-body">
                {notifications.length === 0 ? (
                  <div className="operations-bell__empty">
                    <Bell width={32} height={32} strokeWidth={1.5} />
                    <span>You&apos;re all caught up.</span>
                  </div>
                ) : (
                  notifications.slice(0, 15).map((n) => (
                    <button
                      key={n.id}
                      type="button"
                      className={`operations-bell__item ${n.read ? "" : "operations-bell__item--unread"}`}
                      onClick={() => openNotification(n)}
                    >
                      <span className="operations-bell__item-title">{shortenIds(n.title)}</span>
                      <span className="operations-bell__item-body">{shortenIds(n.body)}</span>
                      {n.created_at && (
                        <span className="operations-bell__item-time">
                          {new Date(n.created_at).toLocaleString()}
                        </span>
                      )}
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
        </div>
      </div>
  );
}
