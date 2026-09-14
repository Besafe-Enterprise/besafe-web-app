export type AlertStatus =
  | "new"
  | "active"
  | "pending_acceptance"
  | "triaged"
  | "reviewing"
  | "assigned"
  | "acknowledged"
  | "resolved"
  | "false_alarm"
  | "closed"
  | "pending_analysis"
  | "all";

export const ACTIVE_CASE_STATUSES = [
  "new",
  "active",
  "pending_acceptance",
  "pending_analysis",
  "acknowledged",
  "reviewing",
  "triaged",
  "assigned",
] as const;

export type AlertPriority = "critical" | "high" | "medium" | "low";
export type IncidentType =
  | "sos"
  | "harassment"
  | "abuse"
  | "assault"
  | "accident"
  | "medical"
  | "other";

export interface Agency {
  id: number | string;
  name: string;
  email: string;
  phone?: string;
  phone_number?: string;
  region?: string;
  address?: string;
  coverage_radius_km?: number;
  latitude?: number;
  longitude?: number;
  location?: {
    lat: number;
    lng: number;
    latitude?: number;
    longitude?: number;
    address?: string;
  };
  is_verified?: boolean;
  created_at?: string;
}

export interface UserSummary {
  id?: number | string;
  name?: string;
  phone?: string;
  emergency_contacts?: Array<{
    name: string;
    phone: string;
    relationship?: string;
  }>;
}

export interface GPSCoordinate {
  lat: number;
  lng: number;
  timestamp?: string;
  accuracy?: number;
  speed?: number;
  heading?: number;
}

export interface AIAnalysis {
  severity_rating?: number;
  identified_pattern_type?: string;
  escalation_risk?: "low" | "medium" | "high" | "critical" | string;
  timeline_urgency?: "immediate" | "within_24h" | "monitoring" | string;
  isolation_risk_detected?: boolean;
  investigative_priority?: string;
  pattern_tags?: string[];
  explainable_ai_report?: string;
}

export interface Alert {
  id: number | string;
  user_id?: number | string;
  agency_id?: number | string;
  assigned_staff_id?: string | null;
  assigned_staff_name?: string | null;
  assigned_at?: string | null;
  assignment_status?: "pending" | "accepted" | "declined" | null;
  status: AlertStatus;
  priority?: AlertPriority | string;
  priority_label?: string;
  priority_score?: number;
  incident_type?: IncidentType;
  category?: string;
  description?: string;
  transcribed_text?: string;
  audio_url?: string;
  confidence?: number;
  gps_lat?: number | null;
  gps_lng?: number | null;
  user_name?: string;
  user_phone?: string;
  user_photo?: string;
  user_contacts?: Array<{
    name: string;
    phone: string;
    relationship?: string;
  }>;
  ai_analysis?: AIAnalysis;
  analysis_status?: "pending" | "completed" | "failed";
  location?: {
    latitude: number;
    longitude: number;
    lat?: number;
    lng?: number;
    address?: string;
  };

  user?: UserSummary;
  gps_trail?: GPSCoordinate[];
  created_at?: string;
  updated_at?: string;
  resolved_at?: string;
  notes?: string;
  field_evidence?: FieldEvidenceItem[];
  field_reports?: FieldReport[];
  status_history?: Array<{ status: string; timestamp: string; actor?: string; detail?: string }>;
}

export interface FieldEvidenceItem {
  id: string;
  type: string;
  url: string;
  name?: string;
  mime?: string;
  uploaded_by?: string;
  uploaded_at?: string;
}

export interface FieldReport {
  id: string;
  title: string;
  body: string;
  progress?: string | null;
  review_status?: "draft" | "submitted" | "approved" | "changes_requested" | string;
  review_feedback?: string;
  submitted_at?: string;
  reviewed_at?: string;
  created_by?: string;
  created_by_name?: string;
  created_at?: string;
  updated_at?: string;
}

export interface FieldNotification {
  id: string;
  staff_id?: string;
  agency_id?: string;
  title: string;
  body: string;
  type: string;
  data?: Record<string, unknown>;
  read: boolean;
  created_at?: string;
}

export interface FieldCheckIn {
  id: string;
  alert_id?: string | null;
  lat?: number | null;
  lng?: number | null;
  status?: string | null;
  note?: string;
  recorded_at?: string;
}

export interface EvidenceAttachment {
  id: string;
  file_url: string;
  file_type: "audio" | "image" | "video" | "document";
  filename: string;
  created_at?: string;
  duration_seconds?: number;
}

export interface SafeChatAnswer {
  question: string;
  answer: string;
}

export interface Report {
  id: number | string;
  user_id?: number | string;
  userId?: string;
  agency_id?: number | string;
  assignedAgencyId?: number | string;
  assigned_staff_id?: string | null;
  assigned_staff_name?: string | null;
  assigned_at?: string | null;
  assignment_status?: "pending" | "accepted" | "declined" | null;
  category: string;
  incident_type?: string;
  priority?: string;
  priority_label?: string;
  description: string;
  timing?: string;
  frequency?: string;
  user_name?: string;
  user_phone?: string;
  answers?: SafeChatAnswer[];
  ai_Analysis?: AIAnalysis;
  ai_analysis?: AIAnalysis;
  status:
    | "pending"
    | "pending_analysis"
    | "pending_acceptance"
    | "investigating"
    | "triaged"
    | "reviewing"
    | "assigned"
    | "resolved"
    | "closed"
    | string;
  location?: {
    latitude: number;
    longitude: number;
    lat?: number;
    lng?: number;
    address?: string;
  };
  attachments?: Array<{
    name?: string;
    url?: string;
    uri?: string;
    type?: string;
    filename?: string;
    file_type?: string;
    file_url?: string;
  }>;
  field_reports?: FieldReport[];
  status_history?: Array<{ status: string; timestamp: string; actor?: string; detail?: string }>;
  created_at?: string;
  createdAt?: string;
  updated_at?: string;
  updatedAt?: string;
}

export interface WeeklyVolumeDay {
  day: string;
  date?: string;
  count: number;
  alerts?: number;
  reports?: number;
}

export interface CategoryDistributionItem {
  label: string;
  count: number;
  percentage: string;
  color: string;
}

export interface DashboardStats {
  active_alerts?: number;
  pending_reports?: number;
  resolved_today?: number;
  total_all_time?: number;
  weekly_volume?: WeeklyVolumeDay[];
  category_distribution?: CategoryDistributionItem[];
  active?: number;
  pending?: number;
  acknowledged?: number;
  resolved?: number;
  total?: number;
  active_emergencies?: number;
  total_today?: number;
  avg_response_minutes?: number;
  safe_chat_reports_count?: number;
  dispatch_units_available?: number;
  unassigned?: number;
  assigned?: number;
  new_cases?: number;
  new_today?: number;
  on_case?: number;
  unassigned_alerts?: number;
  unassigned_reports?: number;
  assigned_alerts?: number;
  assigned_reports?: number;
  new_alerts_today?: number;
  new_reports_today?: number;
  total_alerts?: number;
  total_reports?: number;
}


export interface LiveLocationUpdate {
  alert_id: number | string;
  latitude: number;
  longitude: number;
  timestamp: string;
  speed?: number;
  heading?: number;
}
