"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAgencyAuthStore } from "@/lib/store/agency-auth-store";
import { useAgencyLogout } from "@/lib/hooks/auth/use-agency-auth";
import { Shield, Bell, Moon, Sun, MapPin, Vibrate, Volume2, User, LogOut, ChevronRight, ExternalLink, Trash2 } from "lucide-react";
import "@/styles/field.css";

function getTheme(): "dark" | "light" {
  if (typeof window === "undefined") return "dark";
  return (localStorage.getItem("field-theme") as "dark" | "light" | null) ?? "dark";
}

export default function FieldSettingsPage() {
  const { user, agency } = useAgencyAuthStore();
  const { mutate: logout, isPending: isLoggingOut } = useAgencyLogout("/login?role=field");
  const router = useRouter();
  const [theme, setTheme] = useState<"dark" | "light">(getTheme);
  const [pushEnabled, setPushEnabled] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [hapticsEnabled, setHapticsEnabled] = useState(true);
  const [locationEnabled, setLocationEnabled] = useState(true);

  useEffect(() => {
    document.documentElement.setAttribute("data-field-theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    localStorage.setItem("field-theme", next);
    document.documentElement.setAttribute("data-field-theme", next);
  };

  const initials = (user?.name || "W").split(" ").filter(Boolean).map((w) => w[0]).join("").slice(0, 2).toUpperCase();

  return (
    <div className="field-settings">
      <div className="field-settings__header">
        <h1>Settings</h1>
        <p>Manage your field console preferences.</p>
      </div>

      {/* Profile summary card -> links to full profile */}
      <Link href="/field/profile" className="field-settings__profile-card">
        <div className="field-settings__avatar">{initials}</div>
        <div className="field-settings__profile-main">
          <div className="field-settings__profile-name">{user?.name || "Field Worker"}</div>
          <div className="field-settings__profile-sub">{(user?.role || "FIELD_AGENT").replace(/_/g, " ")} • {agency?.name || "Agency"}</div>
        </div>
        <ChevronRight width={18} height={18} className="field-settings__chevron" />
      </Link>

      {/* Appearance */}
      <section className="field-settings__section">
        <h2 className="field-settings__section-title"><Moon width={14} height={14} /> Appearance</h2>
        <div className="field-settings__card">
          <div className="field-settings__row">
            <div className="field-settings__row-main">
              <span className="field-settings__row-label">Theme</span>
              <span className="field-settings__row-hint">Dark is easier outdoors at night</span>
            </div>
            <button className="field-theme-btn" onClick={toggleTheme} aria-label="Toggle theme">
              {theme === "dark" ? <Sun width={18} height={18} /> : <Moon width={18} height={18} />}
            </button>
          </div>
        </div>
      </section>

      {/* Notifications */}
      <section className="field-settings__section">
        <h2 className="field-settings__section-title"><Bell width={14} height={14} /> Notifications</h2>
        <div className="field-settings__card">
          <label className="field-settings__row field-settings__row--toggle">
            <div className="field-settings__row-main">
              <span className="field-settings__row-label" style={{ display: "flex", alignItems: "center", gap: 8 }}><Bell width={14} height={14} /> Push notifications</span>
              <span className="field-settings__row-hint">New assignments & report reviews</span>
            </div>
            <input type="checkbox" checked={pushEnabled} onChange={(e) => setPushEnabled(e.target.checked)} className="field-switch" />
          </label>
          <div className="field-settings__divider" />
          <label className="field-settings__row field-settings__row--toggle">
            <div className="field-settings__row-main">
              <span className="field-settings__row-label" style={{ display: "flex", alignItems: "center", gap: 8 }}><Volume2 width={14} height={14} /> Sound alerts</span>
              <span className="field-settings__row-hint">Play dong on new assignment</span>
            </div>
            <input type="checkbox" checked={soundEnabled} onChange={(e) => setSoundEnabled(e.target.checked)} className="field-switch" />
          </label>
          <div className="field-settings__divider" />
          <label className="field-settings__row field-settings__row--toggle">
            <div className="field-settings__row-main">
              <span className="field-settings__row-label" style={{ display: "flex", alignItems: "center", gap: 8 }}><Vibrate width={14} height={14} /> Haptics</span>
              <span className="field-settings__row-hint">Vibrate on accept / submit</span>
            </div>
            <input type="checkbox" checked={hapticsEnabled} onChange={(e) => setHapticsEnabled(e.target.checked)} className="field-switch" />
          </label>
        </div>
      </section>

      {/* Location & Privacy */}
      <section className="field-settings__section">
        <h2 className="field-settings__section-title"><MapPin width={14} height={14} /> Location & Privacy</h2>
        <div className="field-settings__card">
          <label className="field-settings__row field-settings__row--toggle">
            <div className="field-settings__row-main">
              <span className="field-settings__row-label">Share location with dispatch</span>
              <span className="field-settings__row-hint">Lets command center see you on live map</span>
            </div>
            <input type="checkbox" checked={locationEnabled} onChange={(e) => setLocationEnabled(e.target.checked)} className="field-switch" />
          </label>
        </div>
      </section>

      {/* Account */}
      <section className="field-settings__section">
        <h2 className="field-settings__section-title"><User width={14} height={14} /> Account</h2>
        <div className="field-settings__card field-settings__card--padded">
          <div className="field-settings__kv"><span>Email</span><span>{user?.email || "—"}</span></div>
          <div className="field-settings__kv"><span>Agency</span><span>{agency?.name || "—"}</span></div>
          <div className="field-settings__kv"><span>Role</span><span>{(user?.role || "FIELD_AGENT").replace(/_/g, " ")}</span></div>
          <div className="field-settings__kv"><span>Member ID</span><span className="mono">{String(user?.id || "—").slice(0, 8)}</span></div>
        </div>
      </section>

      <p className="field-settings__footer">BeSafe • Field Worker Console • Your agency may manage some settings centrally.</p>
    </div>
  );
}
