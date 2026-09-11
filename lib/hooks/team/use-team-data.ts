"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { teamApi, teamRequestsApi, agencyNotificationsApi } from "@/lib/api";
import type { StaffMember, StaffCreateInput } from "@/types/auth";
import { toast } from "sonner";

interface ApiError {
  response?: {
    data?: {
      error?: string;
    };
  };
}

function getErrorMessage(err: unknown, fallback: string) {
  const apiErr = err as ApiError;
  return apiErr?.response?.data?.error || (err instanceof Error ? err.message : "") || fallback;
}

// 1. Fetch Station Team Members
export function useGetAgencyTeam() {
  return useQuery<StaffMember[]>({
    queryKey: ["agency", "team"],
    queryFn: async () => {
      return await teamApi.getTeam();
    },
    staleTime: 15 * 1000,
  });
}


// 2. Add New Team Member
export function useAddTeamMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: StaffCreateInput) => {
      return await teamApi.addMember(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agency", "team"] });
      toast.success("Team member successfully added");
    },
    onError: (err: unknown) => {
      const msg = getErrorMessage(err, "Failed to add team member");
      toast.error(msg);
    },
  });
}

// 3. Update Team Member Role
// 3. Remove Team Member (delete account)
export function useRemoveTeamMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (staffId: string) => {
      return await teamApi.remove(staffId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agency", "team"] });
      toast.success("Team member removed.");
    },
    onError: (err: unknown) => {
      toast.error(getErrorMessage(err, "Failed to remove team member"));
    },
  });
}

// 5. Field-worker applications awaiting agency approval
export function useGetStaffApplications(status?: string) {
  return useQuery({
    queryKey: ["agency", "team", "requests", status || "pending"],
    queryFn: async () => {
      return await teamRequestsApi.list(status || "pending");
    },
    staleTime: 15 * 1000,
  });
}

export function useApproveStaffApplication() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (requestId: string) => {
      return await teamRequestsApi.approve(requestId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agency", "team"] });
      queryClient.invalidateQueries({ queryKey: ["agency", "team", "requests"] });
      toast.success("Application approved. The field worker can now sign in.");
    },
    onError: (err: unknown) => {
      toast.error(getErrorMessage(err, "Failed to approve application"));
    },
  });
}

// 8. Comprehensive caseworker detail (member + every case + reports + evidence) — keepPreviousData prevents flicker on socket invalidation
export function useGetMemberDetail(staffId?: string) {
  return useQuery({
    queryKey: ["agency", "team", "detail", staffId],
    queryFn: async () => {
      if (!staffId) throw new Error("staffId required");
      return await teamApi.getMemberDetail(staffId);
    },
    enabled: !!staffId,
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    placeholderData: (prev) => prev,
  });
}

// 9. Review a field report (approve / request changes) — single toast via socket `case_updated:report_review`, no local double
export function useReviewFieldReport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ alertId, reportId, decision, feedback }: {
      alertId: string; reportId: string;
      decision: "approved" | "changes_requested"; feedback?: string;
    }) => {
      return await teamApi.reviewReport(alertId, reportId, decision, feedback);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["agency", "team", "detail"] });
      queryClient.invalidateQueries({ queryKey: ["dispatch", "alerts"] });
      // No local toast — socket `case_updated` will dong+toast once for all (deduped), avoids 2-3x
    },
    onError: (err: unknown) => {
      toast.error(getErrorMessage(err, "Failed to review report"));
    },
  });
}

export function useReviewReportNote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ reportId, noteId, decision, feedback }: {
      reportId: string | number; noteId: string;
      decision: "approved" | "changes_requested"; feedback?: string;
    }) => {
      return await teamApi.reviewReportNote(String(reportId), String(noteId), decision, feedback);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dispatch", "reports"] });
    },
    onError: (err: unknown) => {
      toast.error(getErrorMessage(err, "Failed to review note"));
    },
  });
}

// 10. Agency notification inbox
export function useAgencyNotifications() {
  return useQuery({
    queryKey: ["agency", "notifications"],
    queryFn: async () => {
      return await agencyNotificationsApi.list();
    },
    staleTime: 10_000,
    refetchInterval: 30_000,
  });
}

export function useMarkAgencyNotificationsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (ids?: string[]) => {
      return await agencyNotificationsApi.markRead(ids);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agency", "notifications"] });
    },
  });
}

export function useRejectStaffApplication() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (requestId: string) => {
      return await teamRequestsApi.reject(requestId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agency", "team", "requests"] });
      toast.success("Application rejected.");
    },
    onError: (err: unknown) => {
      toast.error(getErrorMessage(err, "Failed to reject application"));
    },
  });
}
