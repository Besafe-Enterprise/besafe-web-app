"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAgencyAuthStore } from "@/lib/store/agency-auth-store";
import { useAgencyLogout } from "@/lib/hooks/auth/use-agency-auth";
import { useFieldProfile, useFieldWorkerAlerts, useFieldReports, useFieldNotifications } from "@/lib/field/use-field-data";
import { User, Shield, Briefcase, CheckCircle, LogOut, Edit2, Moon, Sun, Bell } from "lucide-react";
import { ACTIVE_CASE_STATUSES } from "@/types";
import "@/styles/field.css";

function getInitialFieldTheme(): "dark" | "light" {
  if (typeof window === "undefined") return "dark";
  return (localStorage.getItem("field-theme") as "dark" | "light" | null) ?? "dark";
}

export default function FieldProfilePage() {
  const { user, agency } = useAgencyAuthStore();
  const { mutate: logout, isPending: isLoggingOut } = useAgencyLogout("/login?role=field");

  const { data: profile } = useFieldProfile();
  const { data: notificationsData } = useFieldNotifications();
  const unreadCount = notificationsData?.unread ?? 0;
  const { alerts: allAlerts } = useFieldWorkerAlerts();
  const { data: reports = [] } = useFieldReports();

  const [theme, setTheme] = useState<"dark" | "light">(getInitialFieldTheme);
  const [onDuty, setOnDuty] = useState(true);

  // Sync theme to the document element
  useEffect(() => {
    document.documentElement.setAttribute("data-field-theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    localStorage.setItem("field-theme", next);
    document.documentElement.setAttribute("data-field-theme", next);
  };

  const myActiveAlerts = allAlerts.filter((a) => (ACTIVE_CASE_STATUSES as readonly string[]).includes(a.status));
  const myActiveReports = (reports as unknown as { status?: string; assigned_staff_id?: string | null }[]).filter((r) => r.status !== "resolved" && r.status !== "closed" && String(r.assigned_staff_id) === String(user?.id));
  // Resolved includes both cases and reports that are terminal
  const myResolvedAlerts = allAlerts.filter((a) => a.status === "resolved" || a.status === "closed" || a.status === "false_alarm");
  const myResolvedReports = (reports as unknown as { status?: string; assigned_staff_id?: string | null }[]).filter((r) => r.status === "resolved" || r.status === "closed");
  const assignedCount = myActiveAlerts.length + myActiveReports.length;
  const resolvedCount = myResolvedAlerts.length + myResolvedReports.length;

  const initials = (user?.name || "W")
    .split(" ")
    .filter(Boolean)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const roleLabel = (user?.role || "FIELD_AGENT")
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <div className="field-main">
      <div className="field-profile">
        {/* Header — cover + avatar */}
        <div className="field-profile__header" style={{ position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(135deg, rgba(59,111,232,0.18), rgba(124,58,237,0.18))", pointerEvents: "none" }} />
          <div className="field-profile__avatar-wrap" style={{ zIndex: 1 }}>
            <div className="field-profile__avatar" style={{ backgroundImage: profile?.avatar_url ? `url(${profile.avatar_url})` : "none", zIndex: 1 }}>
              {!profile?.avatar_url && <span>{initials}</span>}
            </div>
          </div>
          <div className="field-profile__identity" style={{ zIndex: 1 }}>
            <div className="field-profile__name">{user?.name || "Field Worker"}</div>
            <div className="field-profile__role">{roleLabel} • {agency?.name || "Agency"}</div>
            <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
              <Link href="/field/profile/edit" className="field-profile__edit-btn" style={{ textDecoration: "none" }}><Edit2 width={12} height={12} /> Edit Profile</Link>
            </div>
          </div>
          </div>
        </div>

        {/* Bento stats — replaces loose rows */}
        <div className="field-bento" style={{ marginTop: 14 }}>
          <div className="field-bento__card">
            <div className="field-bento__label" style={{ display: "flex", alignItems: "center", gap: 6 }}><Shield width={12} height={12} /> Agency</div>
            <div className="field-bento__value" style={{ fontSize: 13, marginTop: 8, lineHeight: 1.35, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{agency?.name || "—"}</div>
            <div className="field-bento__hint">Your unit</div>
          </div>
          <div className="field-bento__card">
            <div className="field-bento__label" style={{ display: "flex", alignItems: "center", gap: 6 }}><Briefcase width={12} height={12} /> Active</div>
            <div className="field-bento__value">{assignedCount}</div>
            <div className="field-bento__hint">Open cases</div>
          </div>
          <div className="field-bento__card">
            <div className="field-bento__label" style={{ display: "flex", alignItems: "center", gap: 6 }}><CheckCircle width={12} height={12} /> Resolved</div>
            <div className="field-bento__value">{resolvedCount}</div>
            <div className="field-bento__hint">Completed</div>
          </div>
          <div className="field-bento__card">
            <div className="field-bento__label" style={{ display: "flex", alignItems: "center", gap: 6 }}><Bell width={12} height={12} /> Inbox</div>
            <div className="field-bento__value">{unreadCount}</div>
            <div className="field-bento__hint">{unreadCount ? "Unread" : "All clear"}</div>
          </div>
        </div>

        <div className="field-profile__stat" style={{marginTop:20, marginBottom:20}}>
          <span className="field-profile__stat-label"><Bell width={14} height={14} /> Notifications</span>
          <Link className="field-profile__notif-btn" href="/field/notifications">
            {unreadCount > 0 ? `${unreadCount} unread` : "View Inbox"} <Bell width={12} height={12} />
          </Link>
        </div>

        <div className="field-profile__stat" style={{marginBottom:20}}>
          <span className="field-profile__stat-label"><User width={14} height={14} /> Duty</span>
          <button className={`field-duty-pill ${onDuty ? "field-duty-pill--on" : "field-duty-pill--off"}`} onClick={() => setOnDuty((prev) => !prev)}>
            <span className={`field-status-dot ${onDuty ? "field-status-dot--online" : "field-status-dot--offline"}`} style={{ width: 7, height: 7 }} />
            {onDuty ? "ON DUTY" : "OFF DUTY"}
          </button>
        </div>

        {/* Logout */}
        <button
          className="field-profile__logout"
          onClick={() => logout()}
          disabled={isLoggingOut}
        >
          <LogOut width={16} height={16} />
          <span>{isLoggingOut ? "Signing out..." : "Sign Out"}</span>
        </button>

      </div>
  );
}