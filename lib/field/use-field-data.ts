"use client";

import React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useGetAlerts } from "@/lib/hooks/dispatch/use-dispatch-data";
import { useAlertStore } from "@/stores/useAlertStore";
import { useAgencyAuthStore } from "@/lib/store/agency-auth-store";
import { fieldWorkerApi } from "@/lib/api";
import type { Alert, FieldNotification, FieldCheckIn } from "@/types";

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

/** Profile (field/me). */
export function useFieldProfile() {
  return useQuery({
    queryKey: ["field", "me"],
    queryFn: async () => {
      return await fieldWorkerApi.getMe();
    },
    staleTime: 60 * 1000,
  });
}

/** Update profile. */
export function useUpdateFieldProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { name?: string; phone_number?: string; avatar_url?: string }) => {
      return await fieldWorkerApi.updateProfile(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["field", "me"] });
    },
  });
}

/** Upload avatar. */
export function useUploadFieldAvatar() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (file: File) => {
      return await fieldWorkerApi.uploadAvatar(file);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["field", "me"] });
    },
  });
}

/** Notifications list. */
export function useFieldNotifications() {
  return useQuery({
    queryKey: ["field", "notifications"],
    queryFn: async () => {
      return await fieldWorkerApi.getNotifications();
    },
    refetchInterval: 30 * 1000,
  });
}

/** Mark notifications read. */
export function useMarkFieldNotificationsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (ids?: string[]) => {
      return await fieldWorkerApi.markNotificationsRead(ids);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["field", "notifications"] });
      queryClient.invalidateQueries({ queryKey: ["field", "me"] });
    },
  });
}

/** Post location check-in. */
export function usePostFieldLocation() {
  return useMutation({
    mutationFn: async (data: { lat: number; lng: number; status?: string; note?: string; alert_id?: string }) => {
      return await fieldWorkerApi.postLocation(data);
    },
  });
}

/** Location history. */
export function useFieldLocationHistory() {
  return useQuery({
    queryKey: ["field", "location", "history"],
    queryFn: async () => {
      return await fieldWorkerApi.getLocationHistory();
    },
  });
}

/** Upload evidence. */
export function useUploadFieldEvidence() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ alertId, file, fileType }: { alertId: string; file: File; fileType: string }) => {
      return await fieldWorkerApi.uploadEvidence(alertId, file, fileType);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["field", "alert", variables.alertId] });
    },
  });
}

/** Add report. */
export function useAddFieldReport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ alertId, data }: { alertId: string; data: { title?: string; body: string; progress?: string } }) => {
      return await fieldWorkerApi.addReport(alertId, data);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["field", "alert", variables.alertId] });
    },
  });
}

/** Update report. */
export function useUpdateFieldReport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ alertId, reportId, data }: { alertId: string; reportId: string; data: { title?: string; body?: string; progress?: string } }) => {
      return await fieldWorkerApi.updateReport(alertId, reportId, data);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["field", "alert", variables.alertId] });
    },
  });
}

export type { Alert };
