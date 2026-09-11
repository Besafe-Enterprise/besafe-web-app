"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { alertsApi, reportsApi, statsApi } from "@/lib/api";
import type { PaginatedResponse } from "@/lib/api";
import type { Alert, AlertStatus, Report, DashboardStats } from "@/types";
import { toast } from "sonner";

interface ApiError {
  response?: {
    data?: {
      error?: string;
      message?: string;
    };
  };
}

function getErrorMessage(err: unknown, fallback: string) {
  const apiErr = err as ApiError;
  return apiErr?.response?.data?.error || apiErr?.response?.data?.message || fallback;
}

// 1. Fetch Dashboard Overview Stats
export function useGetDashboardStats() {
  return useQuery<DashboardStats>({
    queryKey: ["dispatch", "stats"],
    queryFn: async () => {
      return await statsApi.getStats();
    },
    staleTime: 10 * 1000,
    refetchInterval: 15 * 1000,
  });
}

// 2. Fetch Alerts Feed (paginated)
export function useGetAlerts(params?: {
  status?: string;
  priority?: string;
  page?: number;
  limit?: number;
  include_resolved?: boolean;
}) {
  return useQuery<PaginatedResponse<Alert>>({
    queryKey: ["dispatch", "alerts", params],
    queryFn: async () => {
      return await alertsApi.getAlerts(params);
    },
    staleTime: 10 * 1000,
  });
}

// 3. Fetch SafeChat Reports Feed (paginated)
export function useGetReports(params?: {
  status?: string;
  category?: string;
  page?: number;
  limit?: number;
  include_resolved?: boolean;
}) {
  return useQuery<PaginatedResponse<Report>>({
    queryKey: ["dispatch", "reports", params],
    queryFn: async () => {
      return await reportsApi.getReports(params);
    },
    staleTime: 10 * 1000,
  });
}

// 4. Update Emergency Alert Status
export function useUpdateAlertStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      status,
      notes,
    }: {
      id: string | number;
      status: AlertStatus;
      notes?: string;
    }) => {
      return await alertsApi.updateStatus(id, status, notes);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dispatch", "alerts"] });
      queryClient.invalidateQueries({ queryKey: ["dispatch", "stats"] });
    },
    onError: (err: unknown) => {
      toast.error(getErrorMessage(err, "Failed to update alert status"));
    },
  });
}

// 5. Update SafeChat Report Status
export function useUpdateReportStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      status,
    }: {
      id: string | number;
      status: "triaged" | "reviewing" | "resolved" | "closed" | "investigating" | "pending";
    }) => {
      return await reportsApi.updateStatus(id, status);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dispatch", "reports"] });
      queryClient.invalidateQueries({ queryKey: ["dispatch", "stats"] });
    },
    onError: (err: unknown) => {
      toast.error(getErrorMessage(err, "Failed to update report status"));
    },
  });
}

// 8. Assign Operator to Alert
export function useAssignAlert() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      alertId,
      staffId,
      staffName,
    }: {
      alertId: string | number;
      staffId: string | null;
      staffName?: string | null;
    }) => {
      return await alertsApi.assignAlert(alertId, staffId, staffName);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dispatch", "alerts"] });
      queryClient.invalidateQueries({ queryKey: ["dispatch", "stats"] });
    },
    onError: (err: unknown) => {
      toast.error(getErrorMessage(err, "Failed to assign alert"));
    },
  });
}

// 9. Assign Operator to Report
export function useAssignReport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      reportId,
      staffId,
      staffName,
    }: {
      reportId: string | number;
      staffId: string | null;
      staffName?: string | null;
    }) => {
      return await reportsApi.assignReport(reportId, staffId, staffName);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dispatch", "reports"] });
      queryClient.invalidateQueries({ queryKey: ["dispatch", "stats"] });
    },
    onError: (err: unknown) => {
      toast.error(getErrorMessage(err, "Failed to assign report"));
    },
  });
}
