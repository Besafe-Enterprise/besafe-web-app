"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { teamApi, adminApi, teamRequestsApi } from "@/lib/api";
import type { StaffMember, StaffCreateInput, StaffRole } from "@/types/auth";
import type { Agency } from "@/types";
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
export const useGetTeam = useGetAgencyTeam;


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
export function useUpdateStaffRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ staffId, role }: { staffId: string; role: StaffRole }) => {
      return await teamApi.updateRole(staffId, role);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["agency", "team"] });
      toast.success(`Role updated to ${variables.role}`);
    },
    onError: (err: unknown) => {
      toast.error(getErrorMessage(err, "Failed to update role"));
    },
  });
}

// 4. Update Team Member Status (Active / Suspended)
export function useUpdateStaffStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ staffId, isActive }: { staffId: string; isActive: boolean }) => {
      return await teamApi.updateStatus(staffId, isActive);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["agency", "team"] });
      toast.success(variables.isActive ? "Access activated" : "Access revoked");
    },
    onError: (err: unknown) => {
      toast.error(getErrorMessage(err, "Failed to update status"));
    },
  });
}

// 4b. Remove Team Member (delete account)
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

// 5. Super Admin: Fetch All Agencies
export function useGetAllAgencies() {
  return useQuery<Agency[]>({
    queryKey: ["admin", "agencies"],
    queryFn: async () => {
      return await adminApi.getAgencies();
    },
    staleTime: 30 * 1000,
  });
}

// 6. Super Admin: Verify / Suspend Agency
export function useVerifyAgency() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ agencyId, isVerified }: { agencyId: string; isVerified: boolean }) => {
      return await adminApi.verifyAgency(agencyId, isVerified);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["admin", "agencies"] });
      toast.success(variables.isVerified ? "Station approved & verified" : "Station verification revoked");
    },
    onError: (err: unknown) => {
      toast.error(getErrorMessage(err, "Failed to update station status"));
    },
  });
}

// 7. Field-worker applications awaiting agency approval
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
