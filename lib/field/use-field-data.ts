"use client";

import React from "react";
import { useGetAlerts } from "@/lib/hooks/dispatch/use-dispatch-data";
import { useAlertStore } from "@/stores/useAlertStore";
import { useAgencyAuthStore } from "@/lib/store/agency-auth-store";
import type { Alert } from "@/types";

function mergeAlerts(base: Alert[], realtime: Alert[]): Alert[] {
  const map = new Map<string, Alert>();
  for (const a of [...realtime, ...base]) {
    map.set(String(a.id), a);
  }
  return Array.from(map.values());
}

/**
 * Single merged source of alerts (React Query feed + realtime socket store),
 * filtered to those assigned to the current worker. Loading reflects the
 * underlying feed query.
 */
export function useFieldWorkerAlerts() {
  const user = useAgencyAuthStore((s) => s.user);
  const { data: alerts, isLoading, isError, refetch } = useGetAlerts();
  const realtimeAlerts = useAlertStore((s) => s.alerts);

  const merged = React.useMemo(
    () => mergeAlerts(alerts || [], realtimeAlerts || []),
    [alerts, realtimeAlerts]
  );

  const myId = user?.id;

  const myAlerts = React.useMemo(
    () =>
      merged
        .filter((a) => (myId != null ? String(a.assigned_staff_id) === String(myId) : false))
        .sort((a, b) => (a.status === "resolved" ? 1 : 0) - (b.status === "resolved" ? 1 : 0) || 0),
    [merged, myId]
  );

  return {
    alerts: myAlerts,
    allAlerts: merged,
    isLoading,
    isError,
    refetch,
    worker: user,
  };
}

/** Active (open) cases needing response. */
export function useFieldActiveAlerts() {
  const src = useFieldWorkerAlerts();
  const active = React.useMemo(
    () => src.alerts.filter((a) => a.status !== "resolved" && a.status !== "false_alarm"),
    [src.alerts]
  );
  return { ...src, alerts: active };
}

/** History: terminal cases the worker has completed (or were voided). */
export function useFieldResolvedAlerts() {
  const src = useFieldWorkerAlerts();
  const resolved = React.useMemo(
    () => src.alerts.filter((a) => a.status === "resolved" || a.status === "false_alarm"),
    [src.alerts]
  );
  return { ...src, alerts: resolved };
}

/** Locate one of the worker's assigned alerts by id. */
export function useFieldAlert(id?: string | number) {
  const src = useFieldWorkerAlerts();
  const alert = React.useMemo(
    () => src.alerts.find((a) => String(a.id) === String(id)) || null,
    [src.alerts, id]
  );
  return { ...src, alert };
}

export type { Alert };
