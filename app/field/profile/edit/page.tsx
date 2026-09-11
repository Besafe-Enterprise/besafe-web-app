"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, X, Upload, User, Phone, Mail, Shield, Camera } from "lucide-react";
import { useAgencyAuthStore } from "@/lib/store/agency-auth-store";
import { useFieldProfile, useUpdateFieldProfile, useUploadFieldAvatar } from "@/lib/field/use-field-data";
import { toast } from "sonner";
import "@/styles/field.css";

export default function FieldProfileEditPage() {
  const router = useRouter();
  const { user, agency } = useAgencyAuthStore();
  const { data: profile } = useFieldProfile();
  const updateProfile = useUpdateFieldProfile();
  const uploadAvatar = useUploadFieldAvatar();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profile) {
      setName(profile.name || user?.name || "");
      setPhone(profile.phone_number || "");
      setEmail(profile.email || user?.email || "");
      setAvatarPreview(profile.avatar_url || null);
    }
  }, [profile, user]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Image must be under 10MB");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setAvatarPreview(reader.result as string);
    reader.readAsDataURL(file);
    uploadAvatar.mutate(file, {
      onSuccess: () => toast.success("Avatar updated"),
      onError: (err: unknown) => {
        const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error || (err as Error)?.message || "Failed to upload avatar";
        toast.error(msg);
      },
    });
  };

  const handleSave = () => {
    if (!name.trim()) {
      toast.error("Name is required");
      return;
    }
    if (phone && !/^\+?[0-9\s\-()]{7,}$/.test(phone)) {
      toast.error("Enter a valid phone number");
      return;
    }
    setSaving(true);
    // avatar already uploaded via uploadAvatar on file select — don't send data URL
    updateProfile.mutate(
      { name: name.trim(), phone_number: phone.trim() },
      {
        onSuccess: () => {
          toast.success("Profile updated");
          setSaving(false);
          router.push("/field/profile");
        },
        onError: () => {
          toast.error("Failed to update profile");
          setSaving(false);
        },
      }
    );
  };

  const initials = (name || user?.name || "W").split(" ").filter(Boolean).map((w) => w[0]).join("").slice(0, 2).toUpperCase();

  return (
    <div className="field-main">
      <button className="field-back-btn" onClick={() => router.back()} style={{ marginBottom: 12 }}>
        <ArrowLeft width={16} height={16} /> Back to Profile
      </button>

      <div className="field-profile__header" style={{ marginBottom: 16 }}>
        <div className="field-profile__avatar-wrap">
          <label className="field-avatar-input" style={{ cursor: "pointer" }}>
            <input type="file" accept="image/*" onChange={handleAvatarChange} style={{ display: "none" }} />
            <div className="field-avatar-preview" style={{ width: 88, height: 88, backgroundImage: avatarPreview ? `url(${avatarPreview})` : "none" }}>
              {!avatarPreview && <span style={{ fontSize: 22 }}>{initials}</span>}
              <span style={{ position: "absolute", bottom: -4, right: -4, width: 28, height: 28, borderRadius: 9999, background: "var(--color-brand)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", border: "2px solid var(--color-surface)", boxShadow: "0 2px 8px rgba(0,0,0,0.2)" }}>
                <Camera width={14} height={14} />
              </span>
            </div>
          </label>
        </div>
        <div style={{ textAlign: "center", marginTop: 8 }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--color-text-tertiary)" }}>Tap avatar to change</div>
          <div style={{ fontSize: 12, color: "var(--color-text-secondary)", marginTop: 4 }}>{agency?.name || "Agency"} • {user?.role?.replace(/_/g, " ") || "FIELD_AGENT"}</div>
        </div>
      </div>

      <div className="field-detail-card" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, paddingBottom: 10, borderBottom: "1px solid var(--color-border)" }}>
          <User width={14} height={14} style={{ color: "var(--color-brand)" }} />
          <span style={{ fontSize: 12, fontWeight: 800, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--color-text-primary)" }}>Personal Information</span>
        </div>

        <div className="field-edit-row">
          <label className="field-edit-label"><User width={12} height={12} /> Full Name</label>
          <input className="field-input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your full name" />
        </div>

        <div className="field-edit-row">
          <label className="field-edit-label"><Mail width={12} height={12} /> Email</label>
          <input className="field-input" value={email} disabled style={{ opacity: 0.6, cursor: "not-allowed" }} />
          <span style={{ fontSize: 11, color: "var(--color-text-tertiary)" }}>Email is managed by your agency — contact admin to change.</span>
        </div>

        <div className="field-edit-row">
          <label className="field-edit-label"><Phone width={12} height={12} /> Phone Number</label>
          <input className="field-input" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+1 555 000 0000" />
        </div>

        <div className="field-edit-row">
          <label className="field-edit-label"><Shield width={12} height={12} /> Agency</label>
          <input className="field-input" value={agency?.name || ""} disabled style={{ opacity: 0.6 }} />
        </div>

        <div className="field-edit-row">
          <label className="field-edit-label"><Shield width={12} height={12} /> Role</label>
          <input className="field-input" value={user?.role?.replace(/_/g, " ") || "FIELD_AGENT"} disabled style={{ opacity: 0.6 }} />
        </div>

        <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
          <button className="field-primary-btn" style={{ flex: 1 }} onClick={handleSave} disabled={saving || updateProfile.isPending}>
            <Save width={14} height={14} /> {saving || updateProfile.isPending ? "Saving..." : "Save Changes"}
          </button>
          <button className="field-secondary-btn" onClick={() => router.push("/field/profile")}>
            <X width={14} height={14} /> Cancel
          </button>
        </div>
      </div>

      <div className="field-detail-card" style={{ marginTop: 12 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: "var(--color-text-tertiary)", marginBottom: 8 }}>Security</div>
        <p style={{ fontSize: 12, color: "var(--color-text-secondary)", lineHeight: 1.5 }}>Password and security settings are managed in <b>Settings</b>. Use theme toggle on profile to switch dark/light.</p>
      </div>
    </div>
  );
}
