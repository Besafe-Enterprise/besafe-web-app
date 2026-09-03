import { apiClient } from "./api/client"
import type { Agency, AIAnalysis, Alert, AlertStatus, DashboardStats, Report } from "@/types"
import type { AgencyProfile, StaffMember, StaffCreateInput, StaffRole } from "@/types/auth"
import type { AgencyRegisterFormData } from "@/lib/validations/auth.schema"

export { apiClient }

export const authApi = {
  login: async (credentials: { email: string; password?: string }) => {
    const res = await apiClient.post<{ token: string; must_change_password?: boolean; agency: Agency; user?: AgencyProfile }>("/agency/auth/login", credentials)
    return res.data
  },
  register: async (agencyData: AgencyRegisterFormData) => {
    const res = await apiClient.post<{ success: boolean; message: string; id: string }>("/auth/register", agencyData)
    return res.data
  },
  getProfile: async () => {
    const res = await apiClient.get<Agency>("/agency/auth/me")
    return res.data
  },
  changeInitialPassword: async (data: { new_password: string; staff_id?: string; email?: string }) => {
    const res = await apiClient.patch<{ success: boolean; message: string }>("/agency/auth/change-initial-password", data)
    return res.data
  },
}

export const alertsApi = {
  getAlerts: async (params?: { status?: AlertStatus; priority?: string; limit?: number }) => {
    const res = await apiClient.get<Alert[]>("/alerts", { params })
    return res.data
  },
  getAlertById: async (id: string | number) => {
    const res = await apiClient.get<Alert>(`/alerts/${id}`)
    return res.data
  },
  updateStatus: async (id: string | number, status: AlertStatus, notes?: string) => {
    const res = await apiClient.patch<Alert>(`/alerts/${id}/status`, { status, notes })
    return res.data
  },
  assignAlert: async (id: string | number, staffId: string | null, staffName?: string | null) => {
    const res = await apiClient.patch<{ success: boolean; message: string; assigned_staff_id: string | null; assigned_staff_name: string | null }>(`/alerts/${id}/assign`, {
      staff_id: staffId,
      staff_name: staffName,
    })
    return res.data
  },
  getLiveCoords: async (alertId: string | number) => {
    const res = await apiClient.get<{ latitude: number; longitude: number; speed?: number; heading?: number }>(`/alerts/${alertId}`)
    return res.data
  },
  analyzeAlert: async (alertId: string | number) => {
    const res = await apiClient.post<{ success: boolean; analysis: AIAnalysis }>(`/alerts/${alertId}/analyze`)
    return res.data
  },
}

export const reportsApi = {
  getReports: async (params?: { status?: string; category?: string; limit?: number }) => {
    const res = await apiClient.get<Report[]>("/agency/reports", { params })
    return res.data
  },
  getReportById: async (id: string | number) => {
    const res = await apiClient.get<Report>(`/agency/reports/${id}`)
    return res.data
  },
  updateStatus: async (id: string | number, status: string) => {
    const res = await apiClient.patch<Report>(`/agency/reports/${id}/status`, { status })
    return res.data
  },
  assignReport: async (id: string | number, staffId: string | null, staffName?: string | null) => {
    const res = await apiClient.patch<{ success: boolean; message: string; assigned_staff_id: string | null; assigned_staff_name: string | null }>(`/agency/reports/${id}/assign`, {
      staff_id: staffId,
      staff_name: staffName,
    })
    return res.data
  },
  analyzeReport: async (reportId: string | number) => {
    const res = await apiClient.post<{ success: boolean; analysis: AIAnalysis }>(`/agency/reports/${reportId}/analyze`)
    return res.data
  },
}


export const statsApi = {
  getStats: async () => {
    const res = await apiClient.get<DashboardStats>("/agency/dashboard/stats")
    return res.data
  },
}

export const teamApi = {
  getTeam: async () => {
    const res = await apiClient.get<StaffMember[]>("/agency/team")
    return res.data
  },
  addMember: async (data: StaffCreateInput) => {
    const res = await apiClient.post<{ success: boolean; member: StaffMember }>("/agency/team", data)
    return res.data
  },
  updateRole: async (staffId: string, role: StaffRole) => {
    const res = await apiClient.patch<{ success: boolean; role: StaffRole }>(`/agency/team/${staffId}/role`, { role })
    return res.data
  },
  updateStatus: async (staffId: string, isActive: boolean) => {
    const res = await apiClient.patch<{ success: boolean; is_active: boolean }>(`/agency/team/${staffId}/status`, { is_active: isActive })
    return res.data
  },
}

export const adminApi = {
  getAgencies: async () => {
    const res = await apiClient.get<Agency[]>("/admin/agencies")
    return res.data
  },
  verifyAgency: async (agencyId: string, isVerified: boolean) => {
    const res = await apiClient.patch<{ success: boolean; is_verified: boolean }>(`/admin/agencies/${agencyId}/verify`, { is_verified: isVerified })
    return res.data
  },
}

export const agencySettingsApi = {
  updateDetails: async (details: { name: string; email: string; region?: string; phone_number?: string }) => {
    const res = await apiClient.patch<{ success: boolean; message: string }>("/agency/details", details)
    return res.data
  },
  updateLocation: async (location: { lat: number; lng: number }) => {
    const res = await apiClient.patch<{ success: boolean; message: string }>("/agency/location", location)
    return res.data
  },
  updatePassword: async (passwords: { current_password?: string; new_password?: string }) => {
    const res = await apiClient.patch<{ success: boolean; message: string }>("/agency/password", passwords)
    return res.data
  },
}

