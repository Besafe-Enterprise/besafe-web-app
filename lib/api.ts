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

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}

export const alertsApi = {
  getAlerts: async (params?: { status?: string; priority?: string; page?: number; limit?: number; include_resolved?: boolean }) => {
    const res = await apiClient.get<PaginatedResponse<Alert>>("/alerts", { params })
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
  getReports: async (params?: { status?: string; category?: string; page?: number; limit?: number; include_resolved?: boolean }) => {
    const res = await apiClient.get<PaginatedResponse<Report>>("/agency/reports", { params })
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
  getMemberDetail: async (staffId: string) => {
    const res = await apiClient.get(`/agency/team/${staffId}/detail`)
    return res.data
  },
  reviewReport: async (alertId: string, reportId: string, decision: "approved" | "changes_requested", feedback?: string) => {
    const res = await apiClient.patch(`/agency/cases/${alertId}/reports/${reportId}/review`, { decision, feedback })
    return res.data
  },
  reviewReportNote: async (reportId: string, noteId: string, decision: "approved" | "changes_requested", feedback?: string) => {
    const res = await apiClient.patch(`/agency/reports/${reportId}/notes/${noteId}/review`, { decision, feedback })
    return res.data
  },
}

export interface AgencyNotification {
  id: string;
  agency_id?: string;
  title: string;
  body: string;
  type: string;
  data?: Record<string, unknown>;
  read: boolean;
  created_at?: string;
}

export const agencyNotificationsApi = {
  list: async () => {
    const res = await apiClient.get<{ notifications: AgencyNotification[]; unread: number }>("/agency/notifications")
    return res.data
  },
  markRead: async (ids?: string[]) => {
    const res = await apiClient.post("/agency/notifications/read", { notification_ids: ids })
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
    const res = await apiClient.patch<{ success: boolean; profile: StaffMember }>("/field/profile", form)
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

  /** Upload case evidence (multipart) — 2min timeout for large video. */
  uploadEvidence: async (alertId: string, file: File, fileType: string) => {
    const form = new FormData()
    form.append("file", file)
    form.append("type", fileType)
    const res = await apiClient.post<{ success: boolean; evidence: FieldEvidenceItem }>(
      `/field/cases/${alertId}/evidence`,
      form,
      { timeout: 120000 }
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

  /** Submit a report to the agency for check. */
  submitReport: async (alertId: string, reportId: string) => {
    const res = await apiClient.post<{ success: boolean; review_status: string }>(
      `/field/cases/${alertId}/reports/${reportId}/submit`
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

  /** Assigned SafeChat reports (reported cases) for this worker. */
  getReports: async () => {
    const res = await apiClient.get<Report[]>("/field/reports")
    return res.data
  },
  getReport: async (reportId: string) => {
    const res = await apiClient.get<Report>(`/field/reports/${reportId}`)
    return res.data
  },
  uploadReportEvidence: async (reportId: string, file: File, fileType: string) => {
    const form = new FormData()
    form.append("file", file)
    form.append("type", fileType)
    const res = await apiClient.post(`/field/reports/${reportId}/evidence`, form, { timeout: 120000 })
    return res.data
  },
  updateReportStatus: async (reportId: string, status: string) => {
    const res = await apiClient.patch(`/field/reports/${reportId}/status`, { status })
    return res.data
  },
  /** Add a progress note to a SafeChat report. */
  addReportNote: async (reportId: string, data: { title?: string; body: string; progress?: string }) => {
    const res = await apiClient.post<{ success: boolean; note: FieldReport }>(
      `/field/reports/${reportId}/notes`,
      data
    )
    return res.data
  },
  /** Submit a report note to the agency for review. */
  submitReportNote: async (reportId: string, noteId: string) => {
    const res = await apiClient.post<{ success: boolean }>(
      `/field/reports/${reportId}/notes/${noteId}/submit`
    )
    return res.data
  },
  /** Accept a report assignment. */
  acceptReport: async (reportId: string) => {
    const res = await apiClient.post<{ success: boolean; status: string }>(
      `/field/reports/${reportId}/accept`
    )
    return res.data
  },
  /** Decline a report assignment (unassigns self). */
  declineReport: async (reportId: string) => {
    const res = await apiClient.post<{ success: boolean; status: string }>(
      `/field/reports/${reportId}/decline`
    )
    return res.data
  },
  /** Accept a case assignment — gains full access. */
  acceptCase: async (caseId: string) => {
    const res = await apiClient.post<{ success: boolean; status: string }>(
      `/field/cases/${caseId}/accept`
    )
    return res.data
  },
  /** Decline a case assignment — clears assignment. */
  declineCase: async (caseId: string) => {
    const res = await apiClient.post<{ success: boolean; status: string }>(
      `/field/cases/${caseId}/decline`
    )
    return res.data
  },
  /** Go on-case — marks this case as the worker's single active case. */
  goOnCase: async (caseId: string) => {
    const res = await apiClient.post<{ success: boolean; active_case_id: string | null }>(
      `/field/cases/${caseId}/on-case`
    )
    return res.data
  },
  /** Go off-case — clears this case as the worker's active case. */
  goOffCase: async (caseId: string) => {
    const res = await apiClient.post<{ success: boolean; active_case_id: null }>(
      `/field/cases/${caseId}/off-case`
    )
    return res.data
  },
  /** Go on-case for a report — marks this report as the worker's single active case. */
  goOnReportCase: async (reportId: string) => {
    const res = await apiClient.post<{ success: boolean; active_case_id: string | null }>(
      `/field/reports/${reportId}/on-case`
    )
    return res.data
  },
  /** Go off-case for a report — clears this report as the worker's active case. */
  goOffReportCase: async (reportId: string) => {
    const res = await apiClient.post<{ success: boolean; active_case_id: null }>(
      `/field/reports/${reportId}/off-case`
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

export const exportApi = {
  casePdf: async (alertId: string | number) => {
    const res = await apiClient.get<Blob>(`/agency/cases/${alertId}/export.pdf`, { responseType: "blob" as unknown as "json", timeout: 60000 })
    return res.data as unknown as Blob
  },
  statisticsPdf: async () => {
    const res = await apiClient.get<Blob>("/agency/statistics/export.pdf", { responseType: "blob" as unknown as "json", timeout: 60000 })
    return res.data as unknown as Blob
  },
  reportPdf: async (reportId: string | number) => {
    const res = await apiClient.get<Blob>(`/agency/reports/${reportId}/export.pdf`, { responseType: "blob" as unknown as "json", timeout: 60000 })
    return res.data as unknown as Blob
  },
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

