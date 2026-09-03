"use client";

import { useState } from "react";
import { useGetAlerts } from "@/lib/hooks/dispatch/use-dispatch-data";
import { useAgencyAuthStore } from "@/lib/store/agency-auth-store";
import { useAgencyLogout } from "@/lib/hooks/auth/use-agency-auth";
import { User, Shield, Briefcase, CheckCircle, LogOut } from "lucide-react";
import "@/styles/field.css";

export default function FieldProfilePage() {
  const { user, agency } = useAgencyAuthStore();
  const { mutate: logout, isPending: isLoggingOut } = useAgencyLogout("/login?role=field");
  const { data: alerts } = useGetAlerts();
  const [onDuty, setOnDuty] = useState(true);

  const myAlerts = user?.id && alerts
    ? alerts.filter((a) => String(a.assigned_staff_id) === String(user.id))
    : [];

  const assignedCount = myAlerts.filter((a) => a.status !== "resolved" && a.status !== "false_alarm").length;
  const resolvedCount = myAlerts.filter((a) => a.status === "resolved").length;

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
        <div className="field-profile__avatar">{initials}</div>
        <div className="field-profile__name">{user?.name || "Field Worker"}</div>
        <div className="field-profile__role">{roleLabel}</div>

        <div className="field-profile__stat" style={{ marginTop: 24 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Shield width={16} height={16} style={{ color: "var(--color-brand)" }} />
            <span className="field-profile__stat-label">Agency</span>
          </div>
          <span className="field-profile__stat-value">{agency?.name || "—"}</span>
        </div>

        <div className="field-profile__stat">
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Briefcase width={16} height={16} style={{ color: "var(--color-info)" }} />
            <span className="field-profile__stat-label">Active Cases</span>
          </div>
          <span className="field-profile__stat-value">{assignedCount}</span>
        </div>

        <div className="field-profile__stat">
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <CheckCircle width={16} height={16} style={{ color: "var(--color-success)" }} />
            <span className="field-profile__stat-label">Resolved</span>
          </div>
          <span className="field-profile__stat-value">{resolvedCount}</span>
        </div>

        <div className="field-profile__stat" style={{ marginTop: 24 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <User width={16} height={16} style={{ color: "var(--color-text-secondary)" }} />
            <span className="field-profile__stat-label">Status</span>
          </div>
          <button
            onClick={() => setOnDuty((prev) => !prev)}
            style={{
              background: onDuty ? "var(--color-success)" : "var(--color-offline)",
              color: "var(--color-text-inverse)",
              border: "none",
              borderRadius: "var(--radius-full)",
              padding: "4px 12px",
              fontSize: "var(--text-xs)",
              fontWeight: "var(--weight-semibold)",
              cursor: "pointer",
            }}
          >
            {onDuty ? "ON DUTY" : "OFF DUTY"}
          </button>
        </div>

        <button
          className="field-profile__logout"
          onClick={() => logout()}
          disabled={isLoggingOut}
        >
          <LogOut width={16} height={16} />
          <span>{isLoggingOut ? "Signing out..." : "Sign Out"}</span>
        </button>
      </div>
    </div>
  );
}
