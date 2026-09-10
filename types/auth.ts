export type AgencyRole =
  | "AGENCY_ADMIN"
  | "FIELD_AGENT";

export type StaffRole = "AGENCY_ADMIN" | "FIELD_AGENT";

export interface AgencyLocation {
  lat: number;
  lng: number;
  latitude?: number;
  longitude?: number;
  address?: string;
}

export interface AgencyProfile {
  id: string;
  name: string;
  email: string;
  phone_number?: string;
  region?: string;
  role: AgencyRole;
  agency_id?: string;
  agency_name?: string;
  agency?: AgencyProfile;
  location?: AgencyLocation;
  latitude?: number;
  longitude?: number;
  coverage_radius_km?: number;
  is_verified?: boolean;
  must_change_password?: boolean;
  created_at?: string;
}


export interface StaffMember {
  id: string;
  agency_id: string;
  name: string;
  email: string;
  phone_number?: string;
  role: StaffRole;
  is_active: boolean;
  must_change_password?: boolean;
  active_cases?: number;
  avatar_url?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface StaffCreateInput {
  name: string;
  email: string;
  password?: string;
  phone_number?: string;
  role: StaffRole;
}

export interface AuthResponse {
  success?: boolean;
  token: string;
  must_change_password?: boolean;
  refreshToken?: string;
  agency: AgencyProfile;
  user?: AgencyProfile;
}

export interface ApiFieldError {
  field: "email" | "password" | "root";
  message: string;
}

