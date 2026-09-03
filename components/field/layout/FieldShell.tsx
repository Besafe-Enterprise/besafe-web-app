"use client";
import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAgencyAuthStore } from "@/lib/store/agency-auth-store";
import { Shield, Home, Briefcase, Activity, History, User } from "lucide-react";
import "@/styles/field.css";

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
  end?: boolean;
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
  const { user } = useAgencyAuthStore();

  const initials = (workerName || user?.name || "W")
    .split(" ")
    .filter(Boolean)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const nav: NavItem[] = [
    { href: "/field", label: "Home", icon: <Home width={22} height={22} />, end: true },
    { href: "/field/assignments", label: "Assignments", icon: <Briefcase width={22} height={22} /> },
    { href: "/field/active", label: "Active", icon: <Activity width={22} height={22} /> },
    { href: "/field/history", label: "History", icon: <History width={22} height={22} /> },
    { href: "/field/profile", label: "More", icon: <User width={22} height={22} />, end: true },
  ];

  const isTabActive = (item: NavItem) =>
    item.end ? pathname === item.href : pathname.startsWith(item.href);

  return (
    <div className="field-shell">
      <header className="field-topbar">
        <div className="field-topbar__brand">
          <Shield width={16} height={16} />
          <span>{agencyName || "Agency"}</span>
        </div>
        {isOnline === false && (
          <span className="field-topbar__offline-label">OFFLINE</span>
        )}
        <div className="field-topbar__status">
          <span
            className={`field-status-dot ${
              isOnline === false
                ? "field-status-dot--offline"
                : "field-status-dot--online"
            }`}
          />
          <span>{isOnline === false ? "OFF DUTY" : "ONLINE"}</span>
        </div>
        <div className="field-topbar__avatar">{initials}</div>
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
