"use client";

import React, { useState } from "react";
import { useAgencyAuthStore } from "@/lib/store/agency-auth-store";
import { useUpdateAgencyDetails } from "@/lib/hooks/settings/use-agency-settings";
import { SkeletonRow } from "@/components/operations/shared/LoadingSkeleton";
import { toast } from "sonner";

type Tab = "profile" | "caseconfig" | "sla" | "notifications" | "teamdefaults" | "appearance";

export default function SettingsPage() {
  const { agency } = useAgencyAuthStore();
  const { mutate: updateDetails, isPending } = useUpdateAgencyDetails();
  const [tab, setTab] = useState<Tab>("profile");

  const [form, setForm] = useState({
    name: agency?.name || "",
    email: agency?.email || "",
    phone_number: agency?.phone_number || "",
    region: agency?.region || "",
  });

  const submitProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateDetails(
      { name: form.name, email: form.email, phone_number: form.phone_number, region: form.region },
      { onSuccess: () => toast.success("Agency profile updated") }
    );
  };

  if (!agency) return <SkeletonRow cols={1} rows={6} />;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-header__title">Settings</h1>
          <p className="page-header__subtitle">Agency configuration</p>
        </div>
      </div>

      <div style={{ marginBottom: "var(--space-4)" }}>
        <div className="segmented" style={{ flexWrap: "wrap" }}>
          {(
            [
              ["profile", "Agency Profile"],
              ["sla", "SLA"],
              ["notifications", "Notifications"],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              className={`segmented__btn ${tab === key ? "segmented__btn--active" : ""}`}
              onClick={() => setTab(key)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {tab === "profile" && (
        <div className="card" style={{ maxWidth: 640 }}>
          <div className="section-header">
            <h2 className="section-header__title">Agency Profile</h2>
          </div>
          <form onSubmit={submitProfile} style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
            <div>
              <label className="label">Agency Name</label>
              <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </div>
            <div>
              <label className="label">Official Email</label>
              <input className="input" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-3)" }}>
              <div>
                <label className="label">Phone</label>
                <input className="input" value={form.phone_number} onChange={(e) => setForm({ ...form, phone_number: e.target.value })} />
              </div>
              <div>
                <label className="label">Region</label>
                <input className="input" value={form.region} onChange={(e) => setForm({ ...form, region: e.target.value })} />
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
              <span className="text-secondary" style={{ fontSize: "var(--text-sm)" }}>
                Headquarters geolocation features are managed under the dashboard&apos;s Agency Geolocation settings.
              </span>
            </div>
            <button type="submit" className="btn btn--primary" disabled={isPending} style={{ alignSelf: "flex-start" }}>
              {isPending ? "Saving..." : "Save Profile"}
            </button>
          </form>
        </div>
      )}

      {tab === "sla" && (
        <div className="card" style={{ maxWidth: 640 }}>
          <div className="section-header">
            <h2 className="section-header__title">SLA Configuration</h2>
          </div>
          <p className="text-secondary" style={{ fontSize: "var(--text-sm)", marginBottom: "var(--space-4)" }}>
            Set service-level agreement thresholds per priority. Backend route configuration pending.
          </p>
          <table className="data-table">
            <thead>
              <tr>
                <th>Priority</th>
                <th>Response Target</th>
                <th>Warning At</th>
              </tr>
            </thead>
            <tbody>
              <tr><td>Critical</td><td>5 min</td><td>80%</td></tr>
              <tr><td>High</td><td>15 min</td><td>80%</td></tr>
              <tr><td>Medium</td><td>60 min</td><td>80%</td></tr>
              <tr><td>Low</td><td>24 hr</td><td>80%</td></tr>
            </tbody>
          </table>
        </div>
      )}

      {tab === "notifications" && (
        <div className="card" style={{ maxWidth: 640 }}>
          <div className="section-header">
            <h2 className="section-header__title">Notifications</h2>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
            <ToggleRow label="Email notifications" />
            <ToggleRow label="In-app notifications" />
            <ToggleRow label="New critical case alerts" />
            <ToggleRow label="SLA breach alerts" />
          </div>
        </div>
      )}
    </div>
  );
}

function ToggleRow({ label }: { label: string }) {
  const [on, setOn] = useState(true);
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "var(--space-2) 0", borderBottom: "1px solid var(--color-border)" }}>
      <span className="text-secondary" style={{ fontSize: "var(--text-sm)" }}>{label}</span>
      <button
        type="button"
        onClick={() => setOn(!on)}
        style={{
          width: 42,
          height: 22,
          borderRadius: "9999px",
          border: "none",
          background: on ? "var(--color-success)" : "var(--color-border-strong)",
          position: "relative",
          cursor: "pointer",
          transition: "background var(--transition-fast)",
        }}
      >
        <span
          style={{
            position: "absolute",
            top: 2,
            left: on ? 22 : 2,
            width: 18,
            height: 18,
            borderRadius: "9999px",
            background: "#fff",
            transition: "left var(--transition-fast)",
          }}
        />
      </button>
    </div>
  );
}
