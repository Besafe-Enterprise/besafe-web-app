import type { Alert, Report } from "@/types";
import type { AgencyProfile, StaffMember } from "@/types/auth";

export const CASE_STAGES = [
  "new",
  "triaged",
  "assigned",
  "accepted",
  "en route",
  "on site",
  "investigating",
  "pending review",
  "changes requested",
  "resolved",
  "closed",
] as const;

export type CaseStatus = (typeof CASE_STAGES)[number];

export function normalizeStatus(status?: string): string {
  if (!status) return "new";
  const s = String(status).toLowerCase().replace(/[_-]/g, " ").trim();
  const match = CASE_STAGES.find((stage) => stage === s);
  return match || s;
}

export function getCaseStageIndex(status?: string): number {
  const s = normalizeStatus(status);
  return Math.max(0, CASE_STAGES.indexOf(s as CaseStatus));
}

export function alertCoords(alert: Alert): { lat: number; lng: number } | null {
  const lat = alert.gps_lat ?? alert.location?.latitude ?? alert.location?.lat ?? null;
  const lng = alert.gps_lng ?? alert.location?.longitude ?? alert.location?.lng ?? null;
  if (lat == null || lng == null) return null;
  return { lat: Number(lat), lng: Number(lng) };
}

export function reportCoords(report: Report): { lat: number; lng: number } | null {
  const lat = report.location?.latitude ?? report.location?.lat ?? null;
  const lng = report.location?.longitude ?? report.location?.lng ?? null;
  if (lat == null || lng == null) return null;
  return { lat: Number(lat), lng: Number(lng) };
}

export function agencyCoords(agency?: AgencyProfile | null): { lat: number; lng: number } | null {
  if (!agency) return null;
  const lat = agency.latitude ?? agency.location?.latitude ?? agency.location?.lat;
  const lng = agency.longitude ?? agency.location?.longitude ?? agency.location?.lng;
  if (lat == null || lng == null) return null;
  return { lat: Number(lat), lng: Number(lng) };
}

export function elapsedSince(dateString?: string | null): string {
  if (!dateString) return "—";
  const date = new Date(dateString);
  const now = Date.now();
  const seconds = Math.max(0, Math.floor((now - date.getTime()) / 1000));
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ${minutes % 60}m`;
  const days = Math.floor(hours / 24);
  return `${days}d ${hours % 24}h`;
}

export function workerStatus(staff: StaffMember): "available" | "busy" | "offline" {
  if (!staff.is_active) return "offline";
  return "available";
}

export function displayPriority(p?: string | null): string {
  if (!p) return "medium";
  const s = String(p).toLowerCase();
  if (s.includes("critical")) return "critical";
  if (s.includes("high")) return "high";
  if (s.includes("low")) return "low";
  return "medium";
}

export function formatShortDate(dateString?: string | null): string {
  if (!dateString) return "—";
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function incidentLabel(incident_type?: string | null, description?: string | null): string {
  if (incident_type && String(incident_type) !== "other" && String(incident_type) !== "sos") {
    return String(incident_type)
      .replace(/[_-]/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());
  }
  if (description) return description.slice(0, 60);
  return "Safety Incident";
}

export function locationLabel(alert: Alert | Report): string {
  const loc = "location" in alert ? alert.location : undefined;
  if (loc?.address) return loc.address;
  const coords = "gps_lat" in alert ? alertCoords(alert as Alert) : null;
  if (coords) return `${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}`;
  return "Coordinates pending";
}
