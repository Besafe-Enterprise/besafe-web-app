"use client";

import React, { useMemo, useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { useGetAlerts } from "@/lib/hooks/dispatch/use-dispatch-data";
import { useAlertStore } from "@/stores/useAlertStore";
import { useAgencyAuthStore } from "@/lib/store/agency-auth-store";
import { useFieldReport } from "@/lib/field/use-field-data";
import { Skeleton } from "@/components/operations/shared/LoadingSkeleton";
import { ACTIVE_CASE_STATUSES } from "@/types";
import type { Alert } from "@/types";
import { MapPin, Navigation, Layers } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import "@/styles/field.css";

const MapboxView = dynamic(() => import("@/components/map/MapboxView"), {
  ssr: false,
  loading: () => (
    <div style={{ width: "100%", height: "100%", minHeight: 400 }}>
      <Skeleton height={400} width="100%" />
    </div>
  ),
});

export default function FieldMapPage() {
  const { user } = useAgencyAuthStore();
  const { data: alertsResp, isLoading } = useGetAlerts({ limit: 500 });
  const realtimeAlerts = useAlertStore((s) => s.alerts);
  const router = useRouter();
  const params = useSearchParams();
  const focusCaseId = params.get("case");
  const focusReportId = params.get("report");
  const [style, setStyle] = useState<"dark" | "streets">("dark");
  const [selectedId, setSelectedId] = useState<string | number | null>(focusCaseId ?? null);
  const [workerLocation, setWorkerLocation] = useState<{ latitude: number; longitude: number } | null>(null);

  const { data: focusReport } = useFieldReport(focusReportId ?? undefined);

  useEffect(() => {
    if (!navigator.geolocation) return;
    const watchId = navigator.geolocation.watchPosition(
      (pos) => setWorkerLocation({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
      () => {},
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 }
    );
    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  const merged = useMemo(() => {
    const base = (alertsResp?.items ?? []);
    const rt = realtimeAlerts || [];
    const map = new Map<string, Alert>();
    for (const a of [...rt, ...base]) {
      map.set(String(a.id), a);
    }
    return Array.from(map.values());
  }, [alertsResp, realtimeAlerts]);

  const myCases = user?.id ? merged.filter((a) => String(a.assigned_staff_id) === String(user.id)) : [];
  const activeCount = myCases.filter((a) => (ACTIVE_CASE_STATUSES as readonly string[]).includes(a.status)).length;
  const isReportFocus = !!focusReportId && !focusCaseId;

  const allPins = useMemo(() => {
    if (isReportFocus && focusReport && (focusReport.location?.latitude || focusReport.location?.lat)) {
      const lat = focusReport.location.latitude || focusReport.location.lat;
      const lng = focusReport.location.longitude || focusReport.location.lng;
      return [{
        id: focusReport.id,
        description: focusReport.category || "Report",
        status: focusReport.status || "new",
        priority: focusReport.priority || "medium",
        gps_lat: lat,
        gps_lng: lng,
        location: {
          latitude: lat,
          longitude: lng,
          lat: lat,
          lng: lng,
          address: focusReport.location.address,
        },
      } as Alert];
    }
    return [...myCases];
  }, [myCases, focusReport, isReportFocus]);

  useEffect(() => {
    if (focusCaseId) setSelectedId(focusCaseId);
    if (focusReportId && focusReport) setSelectedId(focusReport.id);
  }, [focusCaseId, focusReportId, focusReport]);

  if (isLoading) {
    return (
      <div style={{ padding: 16 }}>
        <Skeleton height={500} width="100%" />
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div className="field-home__greeting" style={{ marginBottom: 4 }}>
        <h1 style={{ display: "flex", alignItems: "center", gap: 8 }}><MapPin width={18} height={18} /> Live Map</h1>
        <p>{activeCount} active {activeCount === 1 ? "case" : "cases"} assigned to you • tap a pin for route</p>
      </div>

      {selectedId && !isReportFocus && (
        <button className="field-secondary-btn" onClick={() => router.push(`/field/cases/${selectedId}`)}>
          <Navigation width={14} height={14} /> Open case #{String(selectedId).slice(-6).toUpperCase()}
        </button>
      )}

      {isReportFocus && focusReport && (
        <button className="field-secondary-btn" onClick={() => router.push(`/field/reports/${focusReport.id}`)}>
          <Navigation width={14} height={14} /> Open report #{String(focusReport.id).slice(-6).toUpperCase()}
        </button>
      )}

      <div className="field-map-wrap">
        <div className="field-map__overlay" style={{ justifyContent: "flex-end" }}>
          <span className="field-map__pill" style={{ marginLeft: "auto" }}>
            <Layers width={12} height={12} />
            <select value={style} onChange={(e) => setStyle(e.target.value as "dark" | "streets")} style={{ background: "transparent", border: "none", color: "inherit", fontSize: 11, fontWeight: 700, outline: "none" }}>
              <option value="dark" style={{ color: "#000" }}>Dark</option>
              <option value="streets" style={{ color: "#000" }}>Streets</option>
            </select>
          </span>
        </div>

        <MapboxView
          alerts={allPins}
          selectedAlertId={selectedId}
          onSelectAlert={(a) => setSelectedId(String(a.id))}
          onOpenCase={(a) => isReportFocus ? router.push(`/field/reports/${a.id}`) : router.push(`/field/cases/${a.id}`)}
          mapStyle={style}
          interactive={true}
          showControls={true}
          className="field-map-container"
          agencyLocation={workerLocation ?? undefined}
        />
      </div>

      {workerLocation ? (
        <p style={{ fontSize: 11, color: "var(--color-text-tertiary)", textAlign: "center" }}>Showing route from your location to selected {isReportFocus ? "report" : "case"}.</p>
      ) : (
        <p style={{ fontSize: 11, color: "var(--color-text-tertiary)", textAlign: "center" }}>Waiting for GPS… Tap a pin to see the route once located.</p>
      )}
    </div>
  );
}
