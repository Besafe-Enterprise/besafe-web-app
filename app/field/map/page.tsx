"use client";

import React, { useMemo } from "react";
import dynamic from "next/dynamic";
import { useGetAlerts } from "@/lib/hooks/dispatch/use-dispatch-data";
import { useAlertStore } from "@/stores/useAlertStore";
import { useAgencyAuthStore } from "@/lib/store/agency-auth-store";
import { Skeleton } from "@/components/operations/shared/LoadingSkeleton";
import type { Alert } from "@/types";
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
  const { data: alerts, isLoading } = useGetAlerts();
  const realtimeAlerts = useAlertStore((s) => s.alerts);

  const merged = useMemo(() => {
    const base = alerts || [];
    const rt = realtimeAlerts || [];
    const map = new Map<string, Alert>();
    for (const a of [...rt, ...base]) {
      map.set(String(a.id), a);
    }
    return Array.from(map.values());
  }, [alerts, realtimeAlerts]);

  const myCases = user?.id
    ? merged.filter((a) => String(a.assigned_staff_id) === String(user.id))
    : [];

  if (isLoading) {
    return (
      <div className="field-main" style={{ padding: 0 }}>
        <Skeleton height={500} width="100%" />
      </div>
    );
  }

  return (
    <div className="field-main" style={{ padding: 0 }}>
      <MapboxView
        alerts={myCases}
        mapStyle="dark"
        interactive={true}
        showControls={true}
        className="field-map-container"
      />
    </div>
  );
}
