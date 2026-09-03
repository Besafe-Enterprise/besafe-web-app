import { apiClient } from "../client"
import type { AgencyLoginFormData, AgencyRegisterFormData } from "@/lib/validations/auth.schema"
import type { AuthResponse, AgencyProfile } from "@/types/auth"

export interface RegisterResponse {
  success: boolean
  message: string
  id: string
}


export const agencyAuthService = {
  login: async (credentials: AgencyLoginFormData): Promise<AuthResponse> => {
    const res = await apiClient.post<AuthResponse>("/agency/auth/login", credentials)
    return res.data
  },

  register: async (formData: AgencyRegisterFormData): Promise<RegisterResponse> => {
    const payload = {
      name: formData.name,
      phone_number: formData.phone_number,
      email: formData.email,
      password: formData.password,
      region: formData.region,
      location: {
        lat: Number(formData.lat),
        lng: Number(formData.lng),
      },
    }
    const res = await apiClient.post<RegisterResponse>("/auth/register", payload)
    return res.data
  },

  me: async (): Promise<AgencyProfile> => {
    const res = await apiClient.get<AgencyProfile>("/agency/auth/me")
    return res.data
  },

  changeInitialPassword: async (data: { new_password: string; staff_id?: string; email?: string }): Promise<{ success: boolean; message: string }> => {
    const res = await apiClient.patch<{ success: boolean; message: string }>("/agency/auth/change-initial-password", data)
    return res.data
  },

  logout: async (): Promise<void> => {
    try {
      await apiClient.post("/auth/logout")
    } catch {
      // Ignore network failure on logout
    }
  },
}
