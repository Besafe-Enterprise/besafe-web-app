"use client";
import React from "react";
import { Shield, Loader2 } from "lucide-react";
import "@/styles/field.css";

/** Full-height loading for routes behind auth/data fetch. */
export function LoadingScreen({ label = "Syncing your workspace..." }: { label?: string }) {
  return (
    <div className="field-main" style={{ display: "flex", flexDirection: "column",marginTop:200, paddingTop: 24 ,
     justifyContent: "center" }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14, padding: "28px 16px 12px", borderRadius: 16, background: "var(--color-surface)", border: "1px solid var(--color-border)", boxShadow: "0 4px 16px rgba(0,0,0,0.06)" }}>
        <div style={{ width: 56, height: 56, borderRadius: 16, background: "linear-gradient(135deg, var(--color-brand) 0%, #1D4ED8 100%)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 8px 20px rgba(59,111,232,0.3)", color: "#fff" }}>
          <Shield size={26} className="animate-pulse" />
        </div>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 14, fontWeight: 800, letterSpacing: "-0.01em", color: "var(--color-text-primary)" }}>BeSafe Field</div>
          <div style={{ fontSize: 11, fontWeight: 600, color: "var(--color-text-tertiary)", marginTop: 2 }}>Encrypted • {label}</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4, padding: "6px 12px", borderRadius: 9999, background: "var(--color-surface-sunken)", border: "1px solid var(--color-border)", fontSize: 11, fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase", color: "var(--color-text-secondary)" }}>
          <Loader2 size={12} className="animate-spin" style={{ color: "var(--color-brand)" }} /> Preparing
        </div>
      </div>
    </div>
  );
}
