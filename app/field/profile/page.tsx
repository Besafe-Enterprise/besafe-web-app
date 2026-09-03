"use client";

import { useState, useEffect } from "react";
import { useAgencyAuthStore } from "@/lib/store/agency-auth-store";
import { useAgencyLogout } from "@/lib/hooks/auth/use-agency-auth";
import { useFieldProfile, useUpdateFieldProfile, useUploadFieldAvatar, useFieldNotifications, useMarkFieldNotificationsRead } from "@/lib/field/use-field-data";
import { User, Shield, Briefcase, CheckCircle, LogOut, Edit2, Save, X, Moon, Sun, Bell, Upload } from "lucide-react";
import "@/styles/field.css";

export default function FieldProfilePage() {
  const { user, agency, clearAuth } = useAgencyAuthStore();
  const { mutate: logout, isPending: isLoggingOut } = useAgencyLogout("/login?role=field");

  const { data: profile, isLoading: loadingProfile, refetch: refetchProfile } = useFieldProfile();
  const { data: notificationsData, isLoading: loadingNotifs, refetch: refetchNotifs } = useFieldNotifications();
  const markNotificationsRead = useMarkFieldNotificationsRead();
  const updateProfile = useUpdateFieldProfile();
  const uploadAvatar = useUploadFieldAvatar();

  const [editing, setEditing] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [notifOpen, setNotifOpen] = useState(false);
  const [onDuty, setOnDuty] = useState(true);

  // Load theme from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("field-theme") as "dark" | "light" | null;
    if (saved) {
      setTheme(saved);
      document.documentElement.setAttribute("data-field-theme", saved);
    } else {
      document.documentElement.setAttribute("data-field-theme", "dark");
    }
  }, []);

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    localStorage.setItem("field-theme", next);
    document.documentElement.setAttribute("data-field-theme", next);
  };

  const handleEditStart = () => {
    if (!profile) return;
    setName(profile.name || "");
    setPhone(profile.phone_number || "");
    setAvatarPreview(profile.avatar_url || null);
    setEditing(true);
  };

  const handleSave = () => {
    updateProfile.mutate(
      { name, phone_number: phone, avatar_url: avatarPreview },
      {
        onSuccess: () => {
          setEditing(false);
          refetchProfile();
        },
      }
    );
  };

  const handleCancel = () => {
    setEditing(false);
    setAvatarPreview(null);
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setAvatarPreview(reader.result as string);
    reader.readAsDataURL(file);
    uploadAvatar.mutate(file, {
      onSuccess: () => refetchProfile(),
    });
  };

  const myAlerts = user?.id && profile?.alerts
    ? profile.alerts.filter((a: any) => String(a.assigned_staff_id) === String(user.id))
    : [];

  const assignedCount = myAlerts.filter((a: any) => a.status !== "resolved" && a.status !== "false_alarm").length;
  const resolvedCount = myAlerts.filter((a: any) => a.status === "resolved").length;

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
        {/* Avatar + Name + Role */}
        <div className="field-profile__header">
          <div className="field-profile__avatar-wrap">
            {editing ? (
              <label className="field-avatar-input">
                <input type="file" accept="image/*" onChange={handleAvatarChange} />
                <div className="field-avatar-preview" style={{ backgroundImage: avatarPreview ? `url(${avatarPreview})` : "none" }}>
                  {!avatarPreview && <span>{initials}</span>}
                  <Upload width={24} height={24} />
                </div>
              </label>
            ) : (
              <div className="field-profile__avatar" style={{ backgroundImage: profile?.avatar_url ? `url(${profile.avatar_url})` : "none" }}>
                {!profile?.avatar_url && <span>{initials}</span>}
              </div>
            )}
            {editing && (
              <div className="field-avatar-actions">
                <button type="button" className="btn btn--ghost btn--sm" onClick={handleSave} disabled={updateProfile.isPending}>
                  <Save width={14} height={14} /> Save
                </button>
                <button type="button" className="btn btn--ghost btn--sm" onClick={handleCancel}>
                  <X width={14} height={14} />
                </button>
              </div>
            )}
          </div>
          <div className="field-profile__identity">
            {editing ? (
              <div className="field-edit-fields">
                <div className="field-edit-row">
                  <label className="field-edit-label">Name</label>
                  <input className="field-input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />
                </div>
                <div className="field-edit-row">
                  <label className="field-edit-label">Phone</label>
                  <input className="field-input" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+1 555 000 0000" />
                </div>
              </div>
            ) : (
              <>
                <div className="field-profile__name">{user?.name || "Field Worker"}</div>
                <div className="field-profile__role">{roleLabel}</div>
                {!editing && <button className="field-profile__edit-btn" onClick={handleEditStart}><Edit2 width={14} height={14} /> Edit Profile</button>}
              </>
            )}
          </div>
          <div className="field-profile__theme-toggle" title="Toggle theme">
            <button className="field-theme-btn" onClick={toggleTheme} aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}>
              {theme === "dark" ? <Sun width={18} height={18} /> : <Moon width={18} height={18} />}
            </button>
          </div>
        </div>

        {/* Stats */}
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

        {/* Notifications */}
        <div className="field-profile__stat" style={{ marginTop: 24 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Bell width={16} height={16} style={{ color: "var(--color-warning)" }} />
            <span className="field-profile__stat-label">Notifications</span>
          </div>
          <button className="field-profile__notif-btn" onClick={() => setNotifOpen(true)}>
            <span className="field-profile__stat-value">View Inbox</span>
            <Bell width={14} height={14} />
          </button>
        </div>

        {/* Duty Status */}
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

        {/* Logout */}
        <button
          className="field-profile__logout"
          onClick={() => logout()}
          disabled={isLoggingOut}
        >
          <LogOut width={16} height={16} />
          <span>{isLoggingOut ? "Signing out..." : "Sign Out"}</span>
        </button>

        {/* Notifications Drawer */}
        {notifOpen && (
          <div className="field-notif-drawer-backdrop" onClick={() => setNotifOpen(false)}>
            <div className="field-notif-drawer" onClick={(e) => e.stopPropagation()}>
              <div className="field-notif-drawer__header">
                <h3>Notifications</h3>
                <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
                  {notificationsData?.unread > 0 && (
                    <button
                      className="field-primary-btn field-primary-btn--sm"
                      onClick={() => {
                        markNotificationsRead.mutate(undefined, {
                          onSuccess: () => refetchNotifs(),
                        });
                      }}
                    >
                      Mark all read
                    </button>
                  )}
                  <button className="btn btn--ghost btn--sm" onClick={() => setNotifOpen(false)}><X width={16} height={16} /></button>
                </div>
              </div>
              <div className="field-notif-drawer__body">
                {loadingNotifs ? (
                  <div className="field-skeleton-line" />
                ) : notificationsData?.notifications?.length ? (
                  notificationsData.notifications.map((n: any) => (
                    <div
                      key={n.id}
                      className={`field-notif-item ${n.read ? "" : "field-notif-item--unread"}`}
                      style={{
                        padding: "var(--space-3)",
                        borderBottom: "1px solid var(--color-border)",
                        background: n.read ? "transparent" : "var(--color-warning-bg)",
                      }}
                    >
                      <div style={{ fontWeight: "var(--weight-semibold)", fontSize: "var(--text-sm)", color: "var(--color-text-primary)" }}>
                        {n.title}
                      </div>
                      <div style={{ fontSize: "var(--text-xs)", color: "var(--color-text-secondary)", marginTop: 2 }}>
                        {n.body}
                      </div>
                      <div style={{ fontSize: "var(--text-xs)", color: "var(--color-text-tertiary)", marginTop: 4 }}>
                        {n.created_at ? new Date(n.created_at).toLocaleString() : ""}
                      </div>
                    </div>
                  ))
                ) : (
                  <p style={{ fontSize: "var(--text-sm)", color: "var(--text-tertiary)", textAlign: "center", padding: "var(--space-4)" }}>
                    No notifications yet.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}