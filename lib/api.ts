import { apiClient } from "./api/client"
import type { Agency, AIAnalysis, Alert, AlertStatus, DashboardStats, Report, FieldEvidenceItem, FieldReport, FieldNotification, FieldCheckIn } from "@/types"
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
  remove: async (staffId: string) => {
    const res = await apiClient.delete<{ success: boolean; message: string }>(`/agency/team/${staffId}`)
    return res.data
  },
}

export interface AgencyOption {
  id: string;
  name: string;
  region?: string;
  phone_number?: string;
  latitude?: number;
  longitude?: number;
}

export interface StaffApplication {
  id: string;
  agency_id: string;
  name: string;
  email: string;
  phone_number?: string;
  role?: string;
  note?: string;
  status: "pending" | "approved" | "rejected";
  created_at?: string;
}

export const fieldWorkerApi = {
  /** Public: list agencies a field worker can apply to. */
  getAgencyOptions: async () => {
    const res = await apiClient.get<AgencyOption[]>("/agency/options")
    return res.data
  },
  /** Public: submit a field-worker application for agency approval. */
  register: async (data: {
    name: string;
    email: string;
    phone_number: string;
    password: string;
    agency_id: string;
    note?: string;
  }) => {
    const res = await apiClient.post<{ success: boolean; message: string }>("/agency/staff/register", data)
    return res.data
  },

  // ── Authenticated FIELD_AGENT endpoints ──

  /** Get combined profile + latest check-in + unread count. */
  getMe: async () => {
    const res = await apiClient.get("/field/me")
    return res.data
  },

  /** Update profile (name, phone_number, avatar_url). */
  updateProfile: async (data: { name?: string; phone_number?: string; avatar_url?: string }) => {
    const res = await apiClient.patch<{ success: boolean; profile: StaffMember }>("/field/profile", data)
    return res.data
  },

  /** Upload avatar (multipart). */
  uploadAvatar: async (file: File) => {
    const form = new FormData()
    form.append("avatar", file)
    const res = await apiClient.patch<{ success: boolean; profile: StaffMember }>("/field/profile", form, {
      headers: { "Content-Type": "multipart/form-data" },
    })
    return res.data
  },

  /** Save push token. */
  savePushToken: async (token: string) => {
    const res = await apiClient.post("/field/push-token", { push_token: token })
    return res.data
  },

  /** List notifications. */
  getNotifications: async () => {
    const res = await apiClient.get<{ notifications: FieldNotification[]; unread: number }>("/field/notifications")
    return res.data
  },

  /** Mark notifications read. */
  markNotificationsRead: async (ids?: string[]) => {
    const res = await apiClient.post("/field/notifications/read", { notification_ids: ids })
    return res.data
  },

  /** Post location check-in. */
  postLocation: async (data: { lat: number; lng: number; status?: string; note?: string; alert_id?: string }) => {
    const res = await apiClient.post<{ success: boolean; checkin_id: string }>("/field/location", data)
    return res.data
  },

  /** Get own check-in history. */
  getLocationHistory: async () => {
    const res = await apiClient.get<{ checkins: FieldCheckIn[] }>("/field/location")
    return res.data
  },

  /** Upload case evidence (multipart). */
  uploadEvidence: async (alertId: string, file: File, fileType: string) => {
    const form = new FormData()
    form.append("file", file)
    form.append("type", fileType)
    const res = await apiClient.post<{ success: boolean; evidence: FieldEvidenceItem }>(
      `/field/cases/${alertId}/evidence`,
      form,
      { headers: { "Content-Type": "multipart/form-data" } }
    )
    return res.data
  },

  /** Add case report / note. */
  addReport: async (alertId: string, data: { title?: string; body: string; progress?: string }) => {
    const res = await apiClient.post<{ success: boolean; report: FieldReport }>(
      `/field/cases/${alertId}/reports`,
      data
    )
    return res.data
  },

  /** Update case report / note. */
  updateReport: async (alertId: string, reportId: string, data: { title?: string; body?: string; progress?: string }) => {
    const res = await apiClient.patch<{ success: boolean; updated: Partial<FieldReport> }>(
      `/field/cases/${alertId}/reports/${reportId}`,
      data
    )
    return res.data
  },
}

export const teamRequestsApi = {
  /** Agency-authenticated: list pending field-worker applications. */
  list: async (status?: string) => {
    const res = await apiClient.get<StaffApplication[]>("/agency/team/requests", {
      params: status ? { status } : undefined,
    })
    return res.data
  },
  approve: async (requestId: string) => {
    const res = await apiClient.post<{ success: boolean; message: string; member: StaffMember }>(
      `/agency/team/requests/${requestId}/approve`
    )
    return res.data
  },
  reject: async (requestId: string) => {
    const res = await apiClient.post<{ success: boolean; message: string }>(
      `/agency/team/requests/${requestId}/reject`
    )
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

