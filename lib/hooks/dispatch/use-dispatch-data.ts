"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { alertsApi, reportsApi, statsApi } from "@/lib/api";
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

// 1. Fetch Dashboard Overview Stats (Active, Acknowledged, Resolved, Total)
export function useGetDashboardStats() {
  return useQuery<DashboardStats>({
    queryKey: ["dispatch", "stats"],
    queryFn: async () => {
      return await statsApi.getStats();
    },
    staleTime: 10 * 1000,
    refetchInterval: 15 * 1000, // Poll every 15s for live updates
  });
}

// 2. Fetch Alerts Feed
export function useGetAlerts(params?: {
  status?: AlertStatus;
  priority?: string;
  limit?: number;
}) {
  return useQuery<Alert[]>({
    queryKey: ["dispatch", "alerts", params],
    queryFn: async () => {
      return await alertsApi.getAlerts(params);
    },
    staleTime: 10 * 1000,
  });
}

// 3. Fetch SafeChat Reports Feed
export function useGetReports(params?: {
  status?: string;
  category?: string;
  limit?: number;
}) {
  return useQuery<Report[]>({
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
    onSuccess: (updatedAlert) => {
      queryClient.invalidateQueries({ queryKey: ["dispatch", "alerts"] });
      queryClient.invalidateQueries({ queryKey: ["dispatch", "stats"] });
      toast.success(`Alert #${updatedAlert?.id || ""} marked as ${updatedAlert?.status || "updated"}`);
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
    onSuccess: (updatedReport) => {
      queryClient.invalidateQueries({ queryKey: ["dispatch", "reports"] });
      queryClient.invalidateQueries({ queryKey: ["dispatch", "stats"] });
      toast.success(`Report #${updatedReport?.id || ""} status updated`);
    },
    onError: (err: unknown) => {
      toast.error(getErrorMessage(err, "Failed to update report status"));
    },
  });
}

// 6. Trigger AI Threat Analysis on Alert
export function useAnalyzeAlert() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (alertId: string | number) => {
      return await alertsApi.analyzeAlert(alertId);
    },
    onSuccess: (data, alertId) => {
      queryClient.invalidateQueries({ queryKey: ["dispatch", "alerts"] });
      toast.success(`AI Threat Analysis completed for Alert #${alertId}`);
    },
    onError: (err: unknown) => {
      toast.error(getErrorMessage(err, "AI Threat Analysis failed"));
    },
  });
}

// 7. Trigger AI Threat Analysis on Report
export function useAnalyzeReport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (reportId: string | number) => {
      return await reportsApi.analyzeReport(reportId);
    },
    onSuccess: (data, reportId) => {
      queryClient.invalidateQueries({ queryKey: ["dispatch", "reports"] });
      toast.success(`AI Threat Analysis completed for Report #${reportId}`);
    },
    onError: (err: unknown) => {
      toast.error(getErrorMessage(err, "AI Threat Analysis failed"));
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
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["dispatch", "alerts"] });
      toast.success(data.message || "Alert responder assignment updated");
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
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["dispatch", "reports"] });
      toast.success(data.message || "Report investigator assignment updated");
    },
    onError: (err: unknown) => {
      toast.error(getErrorMessage(err, "Failed to assign report"));
    },
  });
}


