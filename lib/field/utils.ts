import type { Alert, AlertStatus, AlertPriority } from "@/types";
import { ACTIVE_CASE_STATUSES } from "@/types";
import { alertCoords, displayPriority } from "@/lib/operations/utils";

export interface FieldWorkerProfile {
  id?: string | number;
  name?: string;
  role?: string;
}

/**
 * Backend-supported alert statuses. Sources of truth:
 *  - `PATCH /alerts/:id/status` only ever accepts: "acknowledged" | "resolved"
 *    (see BesafeDashboard/alerts/routes.py)
 *  - Alerts are created with status "active".
 * So a field worker can only ever transition: active -> acknowledged -> resolved.
 */
export const BACKEND_ALERT_STATUSES: AlertStatus[] = [
  "new",
  "pending_acceptance",
  "assigned",
  "acknowledged",
  "reviewing",
  "resolved",
  "false_alarm",
  "closed",
];

/** Statuses the worker may actually SET via the backend PATCH route. */
export const SETTABLE_STATUSES: AlertStatus[] = ["acknowledged", "resolved"];

/** Whether the alert still needs a response (whitelist approach). */
export function isOpenAlert(alert: Alert): boolean {
  return (ACTIVE_CASE_STATUSES as readonly string[]).includes(alert.status);
}

export function isAssignedToWorker(alert: Alert, worker: FieldWorkerProfile | null): boolean {
  if (!worker?.id) return false;
  return String(alert.assigned_staff_id) === String(worker.id);
}

/** Human-readable label for a backend alert status. */
export function backendStatusLabel(status?: AlertStatus | string): string {
  switch (status) {
    case "active":
      return "Active";
    case "pending_acceptance":
      return "Pending Acceptance";
    case "assigned":
      return "Assigned";
    case "acknowledged":
      return "Acknowledged";
    case "resolved":
      return "Completed";
    case "false_alarm":
      return "False Alarm";
    default:
      return status ? String(status).replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) : "Active";
  }
}

/** Map a backend status to the shared Badge `tone="status"` variant. */
export function statusBadgeVariant(status?: AlertStatus | string): string {
  switch (status) {
    case "pending_acceptance":
      return "pending_acceptance";
    case "assigned":
      return "assigned";
    case "acknowledged":
      return "acknowledged";
    case "resolved":
      return "resolved";
    case "false_alarm":
      return "false_alarm";
    default:
      return "active";
  }
}

/**
 * The field worker's guided flow, mapped 1:1 to the ONLY statuses the backend
 * lets them set. There is no separate "en route"/"on scene" server state, so
 * we only show the two real transitions: Accept (-> acknowledged) and
 * Complete (-> resolved).
 */
export type WorkerStage = "new" | "assigned" | "acknowledged" | "resolved";

export function workerStageFor(alert: Alert | null | undefined): WorkerStage {
  const status = alert?.status;
  const assignment = alert?.assignment_status;
  if (status === "resolved" || status === "false_alarm" || status === "closed") return "resolved";
  if (status === "acknowledged" || status === "reviewing") return "acknowledged";
  if (assignment === "accepted") return "acknowledged";
  if (assignment === "pending" || status === "pending_acceptance" || status === "assigned") return "assigned";
  return "new";
}

/** Next backend status to apply when the worker advances. */
export const NEXT_STATUS: Record<WorkerStage, AlertStatus | null> = {
  new: null,
  assigned: "acknowledged",
  acknowledged: "resolved",
  resolved: null,
};

export interface WorkerAction {
  stage: WorkerStage;
  label: string;
  helper: string;
  tone: "accept" | "resolve";
}

/** The dominant primary action for the current worker stage. */
export function workerActionFor(stage: WorkerStage): WorkerAction | null {
  switch (stage) {
    case "new":
      return null;
    case "assigned":
      return {
        stage,
        label: "Accept Assignment",
        helper: "Acknowledge this case so dispatch knows you're on it.",
        tone: "accept",
      };
    case "acknowledged":
      return null;
    case "resolved":
      return null;
  }
}

export function priorityVariant(priority?: AlertPriority | string | null): string {
  return displayPriority(priority ?? undefined);
}

export function incidentCoords(alert: Alert) {
  return alertCoords(alert);
}

// ── Report stage helpers (SafeChat reports) ──────────────────────────────
export type ReportWorkerStage = "new" | "triaged" | "assigned" | "reviewing" | "resolved";

export function reportWorkerStageFor(report: { status?: string; assignment_status?: string | null } | null | undefined): ReportWorkerStage {
  const s = report?.status;
  const a = report?.assignment_status;
  if (s === "resolved" || s === "closed") return "resolved";
  if (s === "reviewing") return "reviewing";
  if (s === "triaged") return "triaged";
  if (s === "pending_acceptance" || (s === "assigned" && a !== "accepted")) return "assigned";
  if (a === "accepted") return "reviewing";
  if (s === "assigned") return "assigned";
  return "new";
}

export const NEXT_REPORT_STATUS: Record<ReportWorkerStage, string | null> = {
  new: "triaged",
  triaged: "reviewing",
  assigned: "reviewing",
  reviewing: "resolved",
  resolved: null,
};

export function reportWorkerActionFor(stage: ReportWorkerStage): { label: string; tone: "accept" | "resolve" } | null {
  switch (stage) {
    case "new":
      return { label: "Start Triage", tone: "accept" };
    case "triaged":
      return { label: "Start Review", tone: "accept" };
    case "assigned":
      return { label: "Start Review", tone: "accept" };
    case "reviewing":
      return { label: "Mark Resolved", tone: "resolve" };
    case "resolved":
      return null;
  }
}
