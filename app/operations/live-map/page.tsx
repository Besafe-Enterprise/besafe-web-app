"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useGetAlerts, useGetReports } from "@/lib/hooks/dispatch/use-dispatch-data";
import { useAgencyAuthStore } from "@/lib/store/agency-auth-store";
import { useAlertStore } from "@/stores/useAlertStore";
import { EmptyState } from "@/components/operations/shared/EmptyState";
import { ACTIVE_CASE_STATUSES } from "@/types";
import { SkeletonRow } from "@/components/operations/shared/LoadingSkeleton";
import { agencyCoords } from "@/lib/operations/utils";
import { MapPin } from "lucide-react";
import dynamic from "next/dynamic";
import "@/styles/operations/misc.css";
import type { Alert, Report } from "@/types";

const MapboxView = dynamic(() => import("@/components/map/MapboxView"), {
  ssr: false,
  loading: () => <div className="skeleton" style={{ height: "100%", width: "100%" }} />,
});

export default function LiveMapPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [includeResolved, setIncludeResolved] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("besafe_show_resolved_map") === "true";
    }
    return false;
  });
  const { data: alertsResp, isLoading } = useGetAlerts({ limit: 500, include_resolved: includeResolved });
  const { data: reportsResp } = useGetReports({ limit: 500, include_resolved: includeResolved });
  const { agency } = useAgencyAuthStore();
  const { alerts: liveAlerts } = useAlertStore();
  const [selected, setSelected] = useState<Alert | null>(null);

  const focusLat = searchParams.get("lat");
  const focusLng = searchParams.get("lng");
  const focusCaseId = searchParams.get("case");
  const focusCoords: [number, number] | null = focusLat && focusLng ? [Number(focusLng), Number(focusLat)] : null;

  useEffect(() => {
    localStorage.setItem("besafe_show_resolved_map", String(includeResolved));
  }, [includeResolved]);

  const all = useMemo(() => {
    const m = new Map<string, Alert>();
    for (const a of (alertsResp?.items ?? []) as Alert[]) m.set(String(a.id), a);
    for (const a of liveAlerts as Alert[]) m.set(String(a.id), { ...m.get(String(a.id)) as Alert, ...a } as Alert);
    for (const a of liveAlerts as Alert[]) if (!m.has(String(a.id))) m.set(String(a.id), a);
    for (const r of (reportsResp?.items ?? []) as Report[]) {
      const rid = String(r.id);
      if (m.has(rid)) continue;
      m.set(rid, {
        id: r.id,
        status: (r.status || "new") as Alert["status"],
        assigned_staff_id: r.assigned_staff_id ?? null,
        assigned_staff_name: r.assigned_staff_name ?? null,
        priority: r.priority || "medium",
        incident_type: (r.category || r.incident_type || "report") as any,
        category: r.category,
        description: r.description || "",
        location: r.location,
        gps_lat: r.location?.latitude ?? r.location?.lat ?? null,
        gps_lng: r.location?.longitude ?? r.location?.lng ?? null,
        created_at: r.created_at || r.createdAt,
        user_name: r.user_name,
        user_phone: r.user_phone,
        _reportType: "safe_chat",
      } as Alert);
    }
    return Array.from(m.values()).filter((a) => includeResolved || (ACTIVE_CASE_STATUSES as readonly string[]).includes(a.status));
  }, [liveAlerts, alertsResp, reportsResp, includeResolved]);
  const agencyRef = agencyCoords(agency);

  useEffect(() => {
    if (!focusCaseId || all.length === 0) return;
    const hit = all.find((a) => String(a.id) === String(focusCaseId));
    if (hit) setSelected(hit);
  }, [focusCaseId, all]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
      <div className="page-header" style={{ marginBottom: 0 }}>
        <div>
          <h1 className="page-header__title">Live Map</h1>
          <p className="page-header__subtitle">Click any pin for details and quick access.</p>
        </div>
        <label className="cases-toggle">
          <input
            type="checkbox"
            checked={includeResolved}
            onChange={(e) => setIncludeResolved(e.target.checked)}
            className="cases-toggle__input"
          />
          <span className="cases-toggle__label">Include resolved</span>
        </label>
      </div>

      <div className="live-map-full">
        <div className="live-map-canvas live-map-canvas--full">
          {isLoading ? (
            <SkeletonRow cols={1} rows={6} />
          ) : !agencyRef && all.length === 0 ? (
            <EmptyState icon={<MapPin width={40} height={40} />} title="No map data" />
          ) : (
            <MapboxView
              alerts={all as any}
              selectedAlertId={selected ? String(selected.id) : null}
              onSelectAlert={(alert) => setSelected(alert)}
              interactive={true}
              mapStyle="streets"
              center={focusCoords ?? (selected ? [Number(selected.gps_lng) || agencyRef?.lng || 7.515401, Number(selected.gps_lat) || agencyRef?.lat || 8.92997] : undefined)}
              zoom={focusCoords ? 15 : selected ? 14 : undefined}
              agencyLocation={agencyRef ? { latitude: agencyRef.lat, longitude: agencyRef.lng, name: agency?.name || "Agency HQ" } : undefined}
              onOpenCase={(alert) => {
                if (alert._reportType === "safe_chat") {
                  router.push(`/operations/reports/${alert.id}`);
                } else {
                  router.push(`/operations/cases/${alert.id}`);
                }
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
