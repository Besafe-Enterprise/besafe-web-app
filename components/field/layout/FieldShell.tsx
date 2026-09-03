"use client";
import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAgencyAuthStore } from "@/lib/store/agency-auth-store";
import { Briefcase, Map, User, Shield } from "lucide-react";
import "@/styles/field.css";

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

  const isActive = (href: string) =>
    href === "/field"
      ? pathname === "/field"
      : pathname.startsWith(href);

  return (
    <div className="field-shell">
      <div className="field-topbar">
        <div className="field-topbar__brand">
          <Shield width={16} height={16} />
          <span>{agencyName || "Agency"}</span>
        </div>
        <div className="field-topbar__status">
          <span
            className={`field-status-dot ${isOnline ? "field-status-dot--online" : "field-status-dot--offline"}`}
          />
          <span>{isOnline ? "ON DUTY" : "OFF DUTY"}</span>
        </div>
        <div className="field-topbar__avatar">{initials}</div>
      </div>

      <div className="field-main">{children}</div>

      <nav className="field-tabs">
        <Link
          href="/field"
          className={`field-tab ${isActive("/field") && !isActive("/field/cases") && !isActive("/field/profile") ? "active" : ""}`}
        >
          <Briefcase width={20} height={20} />
          <span>My Cases</span>
        </Link>
        <Link
          href="/field/map"
          className={`field-tab ${isActive("/field/map") ? "active" : ""}`}
        >
          <Map width={20} height={20} />
          <span>Map</span>
        </Link>
        <Link
          href="/field/profile"
          className={`field-tab ${isActive("/field/profile") ? "active" : ""}`}
        >
          <User width={20} height={20} />
          <span>Profile</span>
        </Link>
      </nav>
    </div>
  );
}
