"use client";

import React, { useEffect, useState } from "react";
import { useAgencyAuthStore } from "@/lib/store/agency-auth-store";
import { useAlertStore } from "@/stores/useAlertStore";
import { useUpdateAgencyDetails, useUpdateAgencyLocation, useUpdateAgencyPassword } from "@/lib/hooks/settings/use-agency-settings";
import { SkeletonRow } from "@/components/operations/shared/LoadingSkeleton";
import { MapPin, Lock, User, Bell } from "lucide-react";

type Tab = "profile" | "security" | "notifications";

const SOUND_KEY = "besafe_sound_enabled";
const NOTIF_PREFS_KEY = "besafe_notif_prefs";

interface NotifPrefs {
  newEmergencies: boolean;
  statusChanges: boolean;
  assignments: boolean;
  newReports: boolean;
}

const defaultNotifPrefs: NotifPrefs = {
  newEmergencies: true,
  statusChanges: true,
  assignments: true,
  newReports: true,
};

function loadNotifPrefs(): NotifPrefs {
  if (typeof window === "undefined") return defaultNotifPrefs;
  try {
    const raw = localStorage.getItem(NOTIF_PREFS_KEY);
    return raw ? { ...defaultNotifPrefs, ...JSON.parse(raw) } : defaultNotifPrefs;
  } catch {
    return defaultNotifPrefs;
  }
}

export default function SettingsPage() {
  const { agency } = useAgencyAuthStore();
  const [tab, setTab] = useState<Tab>("profile");

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
          {([
            ["profile", "Agency Profile", User],
            ["security", "Security", Lock],
            ["notifications", "Notifications", Bell],
          ] as const).map(([key, label, Icon]) => (
            <button
              key={key}
              type="button"
              className={`segmented__btn ${tab === key ? "segmented__btn--active" : ""}`}
              onClick={() => setTab(key)}
            >
              <Icon width={14} height={14} /> {label}
            </button>
          ))}
        </div>
      </div>

      {tab === "profile" && <ProfileTab />}
      {tab === "security" && <SecurityTab />}
      {tab === "notifications" && <NotificationsTab />}
    </div>
  );
}

function ProfileTab() {
  const { agency } = useAgencyAuthStore();
  const { mutate: updateDetails, isPending: savingProfile } = useUpdateAgencyDetails();
  const { mutate: updateLocation, isPending: savingLocation } = useUpdateAgencyLocation();

  const [form, setForm] = useState({
    name: agency?.name || "",
    email: agency?.email || "",
    phone_number: agency?.phone_number || "",
    region: agency?.region || "",
  });

  const lat = agency?.latitude || agency?.location?.latitude || 0;
  const lng = agency?.longitude || agency?.location?.longitude || 0;
  const [locForm, setLocForm] = useState({ lat: String(lat || ""), lng: String(lng || "") });

  const submitProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateDetails({
      name: form.name,
      email: form.email,
      phone_number: form.phone_number,
      region: form.region,
    });
  };

  const submitLocation = (e: React.FormEvent) => {
    e.preventDefault();
    const latNum = parseFloat(locForm.lat);
    const lngNum = parseFloat(locForm.lng);
    if (isNaN(latNum) || isNaN(lngNum)) return;
    updateLocation({ lat: latNum, lng: lngNum });
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)", maxWidth: 640 }}>
      <div className="card">
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
          <button type="submit" className="btn btn--primary" disabled={savingProfile} style={{ alignSelf: "flex-start" }}>
            {savingProfile ? "Saving..." : "Save Profile"}
          </button>
        </form>
      </div>

      <div className="card">
        <div className="section-header">
          <h2 className="section-header__title" style={{ display: "flex", alignItems: "center", gap: 8 }}><MapPin width={14} height={14} /> HQ Geolocation</h2>
        </div>
        <p className="text-secondary" style={{ fontSize: "var(--text-sm)", marginBottom: "var(--space-3)" }}>
          Command center coordinates used for proximity routing and distance calculations.
        </p>
        <form onSubmit={submitLocation} style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-3)" }}>
            <div>
              <label className="label">Latitude</label>
              <input className="input" type="number" step="any" value={locForm.lat} onChange={(e) => setLocForm({ ...locForm, lat: e.target.value })} required />
            </div>
            <div>
              <label className="label">Longitude</label>
              <input className="input" type="number" step="any" value={locForm.lng} onChange={(e) => setLocForm({ ...locForm, lng: e.target.value })} required />
            </div>
          </div>
          <button type="submit" className="btn btn--primary" disabled={savingLocation} style={{ alignSelf: "flex-start" }}>
            {savingLocation ? "Updating..." : "Update Location"}
          </button>
        </form>
      </div>
    </div>
  );
}

function SecurityTab() {
  const { mutate: updatePassword, isPending } = useUpdateAgencyPassword();
  const [form, setForm] = useState({ current_password: "", new_password: "", confirm_password: "" });
  const [error, setError] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (form.new_password.length < 8) {
      setError("New password must be at least 8 characters.");
      return;
    }
    if (form.new_password !== form.confirm_password) {
      setError("New passwords do not match.");
      return;
    }
    updatePassword(
      { current_password: form.current_password, new_password: form.new_password },
      { onSuccess: () => setForm({ current_password: "", new_password: "", confirm_password: "" }) },
    );
  };

  return (
    <div className="card" style={{ maxWidth: 640 }}>
      <div className="section-header">
        <h2 className="section-header__title" style={{ display: "flex", alignItems: "center", gap: 8 }}><Lock width={14} height={14} /> Change Password</h2>
      </div>
      <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
        <div>
          <label className="label">Current Password</label>
          <input className="input" type="password" value={form.current_password} onChange={(e) => setForm({ ...form, current_password: e.target.value })} required autoComplete="current-password" />
        </div>
        <div>
          <label className="label">New Password</label>
          <input className="input" type="password" value={form.new_password} onChange={(e) => setForm({ ...form, new_password: e.target.value })} required minLength={8} autoComplete="new-password" />
        </div>
        <div>
          <label className="label">Confirm New Password</label>
          <input className="input" type="password" value={form.confirm_password} onChange={(e) => setForm({ ...form, confirm_password: e.target.value })} required minLength={8} autoComplete="new-password" />
        </div>
        {error && <p style={{ color: "var(--color-danger)", fontSize: "var(--text-sm)" }}>{error}</p>}
        <button type="submit" className="btn btn--primary" disabled={isPending} style={{ alignSelf: "flex-start" }}>
          {isPending ? "Updating..." : "Update Password"}
        </button>
      </form>
    </div>
  );
}

function NotificationsTab() {
  const { soundAlertsEnabled, toggleSoundAlerts } = useAlertStore();
  const [prefs, setPrefs] = useState<NotifPrefs>(loadNotifPrefs);

  useEffect(() => {
    localStorage.setItem(NOTIF_PREFS_KEY, JSON.stringify(prefs));
  }, [prefs]);

  const togglePref = (key: keyof NotifPrefs) => {
    setPrefs((p) => ({ ...p, [key]: !p[key] }));
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)", maxWidth: 640 }}>
      <div className="card">
        <div className="section-header">
          <h2 className="section-header__title" style={{ display: "flex", alignItems: "center", gap: 8 }}><Bell width={14} height={14} /> Sound</h2>
        </div>
        <ToggleRow
          label="Alert notification sound"
          description="Play a sound when new emergencies arrive"
          enabled={soundAlertsEnabled}
          onToggle={toggleSoundAlerts}
        />
      </div>

      <div className="card">
        <div className="section-header">
          <h2 className="section-header__title">Notification Preferences</h2>
        </div>
        <p className="text-secondary" style={{ fontSize: "var(--text-sm)", marginBottom: "var(--space-3)" }}>
          Choose which events trigger toasts in the dashboard.
        </p>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <ToggleRow label="New emergency alerts" enabled={prefs.newEmergencies} onToggle={() => togglePref("newEmergencies")} />
          <ToggleRow label="Case status changes" enabled={prefs.statusChanges} onToggle={() => togglePref("statusChanges")} />
          <ToggleRow label="Case assignments" enabled={prefs.assignments} onToggle={() => togglePref("assignments")} />
          <ToggleRow label="New SafeChat reports" enabled={prefs.newReports} onToggle={() => togglePref("newReports")} />
        </div>
      </div>
    </div>
  );
}

function ToggleRow({ label, description, enabled, onToggle }: { label: string; description?: string; enabled: boolean; onToggle: () => void }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid var(--color-border)" }}>
      <div>
        <span className="text-secondary" style={{ fontSize: "var(--text-sm)" }}>{label}</span>
        {description && <div style={{ fontSize: "var(--text-xs)", color: "var(--color-text-tertiary)", marginTop: 2 }}>{description}</div>}
      </div>
      <button
        type="button"
        onClick={onToggle}
        style={{
          width: 42,
          height: 22,
          borderRadius: "9999px",
          border: "none",
          background: enabled ? "var(--color-success, #10B981)" : "var(--color-border-strong)",
          position: "relative",
          cursor: "pointer",
          transition: "background 0.15s",
          flexShrink: 0,
        }}
      >
        <span
          style={{
            position: "absolute",
            top: 2,
            left: enabled ? 22 : 2,
            width: 18,
            height: 18,
            borderRadius: "9999px",
            background: "#fff",
            transition: "left 0.15s",
          }}
        />
      </button>
    </div>
  );
}
