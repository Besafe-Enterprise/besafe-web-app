"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { agencySettingsApi } from "@/lib/api";
import { useAgencyAuthStore } from "@/lib/store/agency-auth-store";
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

export function useUpdateAgencyDetails() {
  const queryClient = useQueryClient();
  const agency = useAgencyAuthStore((s) => s.agency);
  const setAgency = useAgencyAuthStore((s) => s.setAgency);

  return useMutation({
    mutationFn: async (details: {
      name: string;
      email: string;
      region?: string;
      phone_number?: string;
    }) => {
      return await agencySettingsApi.updateDetails(details);
    },
    onSuccess: (_, variables) => {
      if (agency) {
        const updated = {
          ...agency,
          name: variables.name,
          email: variables.email,
          region: variables.region || agency.region,
          phone_number: variables.phone_number || agency.phone_number,
        };
        setAgency(updated);
        if (typeof window !== "undefined") {
          localStorage.setItem("besafe_agency_profile", JSON.stringify(updated));
        }
      }
      queryClient.invalidateQueries({ queryKey: ["agency", "me"] });
      toast.success("Agency profile updated");
    },
    onError: (err: unknown) => {
      toast.error(getErrorMessage(err, "Failed to update agency profile"));
    },
  });
}

export function useUpdateAgencyLocation() {
  const queryClient = useQueryClient();
  const agency = useAgencyAuthStore((s) => s.agency);
  const setAgency = useAgencyAuthStore((s) => s.setAgency);

  return useMutation({
    mutationFn: async (location: { lat: number; lng: number }) => {
      return await agencySettingsApi.updateLocation(location);
    },
    onSuccess: (_, variables) => {
      if (agency) {
        const updated = {
          ...agency,
          latitude: variables.lat,
          longitude: variables.lng,
          location: { lat: variables.lat, lng: variables.lng, latitude: variables.lat, longitude: variables.lng },
        };
        setAgency(updated);
        if (typeof window !== "undefined") {
          localStorage.setItem("besafe_agency_profile", JSON.stringify(updated));
        }
      }
      queryClient.invalidateQueries({ queryKey: ["agency", "me"] });
      toast.success("HQ location updated");
    },
    onError: (err: unknown) => {
      toast.error(getErrorMessage(err, "Failed to update location"));
    },
  });
}

export function useUpdateAgencyPassword() {
  return useMutation({
    mutationFn: async (passwords: { current_password: string; new_password: string }) => {
      return await agencySettingsApi.updatePassword(passwords);
    },
    onSuccess: () => {
      toast.success("Password updated");
    },
    onError: (err: unknown) => {
      toast.error(getErrorMessage(err, "Failed to update password"));
    },
  });
}
