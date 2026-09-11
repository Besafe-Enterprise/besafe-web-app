"use client";
import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAgencyAuthStore } from "@/lib/store/agency-auth-store";
import { useFieldNotifications, useMarkFieldNotificationsRead, useFieldProfile } from "@/lib/field/use-field-data";
import { Shield, Home, Briefcase, Map as MapIcon, Bell, CheckCheck, Settings } from "lucide-react";
import "@/styles/field.css";

function shortenIds(text: string): string {
  return text.replace(/#([0-9a-f]{8})[0-9a-f]{16}/gi, "#$1…");
}

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
  end?: boolean;
  match?: (p: string) => boolean;
}

export default function FieldShell({
  children,
  agencyName,
  workerName,
  isOnline,
}: {
  children: React.ReactNode;
  agencyName?: string;
  workerName?: string;
  isOnline?: boolean;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAgencyAuthStore();
  const { data: notifData } = useFieldNotifications();
  const { data: profile } = useFieldProfile();
  const markRead = useMarkFieldNotificationsRead();
  const unread = notifData?.unread ?? 0;
  const notifications = notifData?.notifications ?? [];
  const [bellOpen, setBellOpen] = useState(false);
  const bellRef = useRef<HTMLDivElement>(null);

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

  const openNotification = (n: { id: string; data?: Record<string, unknown>; type?: string }) => {
    markRead.mutate([n.id]);
    const d = n.data || {};
    const alertId = (d.alert_id as string | undefined) || (d.case_id as string | undefined);
    const reportId = (d.report_id as string | undefined) || (d.reportId as string | undefined);
    const noteId = (d.note_id as string | undefined) || (d.noteId as string | undefined);
    const evidenceId = d.evidence_id as string | undefined;
    // Deep-link to point of interest
    if (reportId) {
      if (noteId) router.push(`/field/reports/${String(reportId)}#note-${String(noteId)}`);
      else if (evidenceId) router.push(`/field/reports/${String(reportId)}#evidence`);
      else router.push(`/field/reports/${String(reportId)}`);
    } else if (alertId) {
      if (noteId) router.push(`/field/cases/${String(alertId)}#report-${String(noteId)}`);
      else if (evidenceId) router.push(`/field/cases/${String(alertId)}#evidence`);
      else if (d.staff_id) router.push(`/field/cases/${String(alertId)}`);
      else router.push(`/field/cases/${String(alertId)}`);
    } else if (reportId) {
      router.push(`/field/reports/${String(reportId)}`);
    }
    setBellOpen(false);
  };

  const displayName = workerName || user?.name || "Field Worker";
  const initials = displayName
    .split(" ")
    .filter(Boolean)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const nav: NavItem[] = [
    { href: "/field", label: "Home", icon: <Home width={22} height={22} />, end: true },
    {
      href: "/field/assignments",
      label: "Cases",
      icon: <Briefcase width={22} height={22} />,
      match: (p) => p.startsWith("/field/assignments") || p.startsWith("/field/active") || p.startsWith("/field/history") || p.startsWith("/field/cases"),
    },
    { href: "/field/map", label: "Map", icon: <MapIcon width={22} height={22} /> },
    { href: "/field/notifications", label: "Inbox", icon: <Bell width={22} height={22} /> },
    { href: "/field/settings", label: "Settings", icon: <Settings width={22} height={22} /> },
  ];

  const isTabActive = (item: NavItem) => {
    if (item.match) return item.match(pathname || "");
    return item.end ? pathname === item.href : (pathname || "").startsWith(item.href);
  };

  return (
    <div className="field-shell">
      <header className="field-topbar">
        <div className="field-topbar__brand" title={agencyName || "Agency"}>
          <Shield width={16} height={16} />
          <span>{agencyName || "Agency"}</span>
        </div>
        <div className="field-topbar__worker" title={displayName}>
          <span className="field-topbar__worker-name" style={{ maxWidth: 140 }}>{displayName}</span>
        </div>
        {isOnline === false && <span className="field-topbar__offline-label">OFFLINE</span>}
        <div className="field-topbar__bell-wrap" ref={bellRef}>
          <button type="button" className="field-topbar__bell" aria-label="Inbox" onClick={() => setBellOpen((v) => !v)}>
            <Bell width={18} height={18} />
            {unread > 0 && <span className="field-topbar__bell-badge">{unread > 9 ? "9+" : unread}</span>}
          </button>
          {bellOpen && (
            <div className="field-bell__panel">
              <div className="field-bell__panel-header">
                <span>Inbox</span>
                {unread > 0 && (
                  <button type="button" className="field-bell__mark-read" onClick={() => markRead.mutate(undefined)}>
                    <CheckCheck width={14} height={14} /> Mark all read
                  </button>
                )}
              </div>
              <div className="field-bell__panel-body">
                {notifications.length === 0 ? (
                  <div className="field-bell__empty">
                    <Bell width={28} height={28} strokeWidth={1.5} />
                    <span>You&apos;re all caught up.</span>
                  </div>
                ) : (
                  notifications.slice(0, 12).map((n) => (
                    <button
                      key={n.id}
                      type="button"
                      className={`field-bell__item ${n.read ? "" : "field-bell__item--unread"}`}
                      onClick={() => openNotification(n)}
                    >
                      <span className="field-bell__item-title">{shortenIds(n.title)}</span>
                      <span className="field-bell__item-body">{shortenIds(n.body)}</span>
                      {n.created_at && (
                        <span className="field-bell__item-time">
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
        <Link href="/field/profile" className="field-topbar__avatar" title={displayName} aria-label="Profile" style={profile?.avatar_url ? { backgroundImage: `url("${profile.avatar_url}")`, backgroundSize: "cover", backgroundPosition: "center", color: "transparent" } : undefined}>
          {profile?.avatar_url ? "" : initials}
        </Link>
      </header>

      <main className="field-main">{children}</main>

      <nav className="field-tabs">
        {nav.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`field-tab ${isTabActive(item) ? "active" : ""}`}
            aria-current={isTabActive(item) ? "page" : undefined}
          >
            {item.icon}
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
}
