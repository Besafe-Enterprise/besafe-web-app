import type { Alert, AlertStatus, AlertPriority } from "@/types";
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
  "active",
  "dispatched",
  "acknowledged",
  "resolved",
  "false_alarm",
];

/** Statuses the worker may actually SET via the backend PATCH route. */
export const SETTABLE_STATUSES: AlertStatus[] = ["acknowledged", "resolved"];

/** Whether the alert still needs a response (not terminal). */
export function isOpenAlert(alert: Alert): boolean {
  return alert.status !== "resolved" && alert.status !== "false_alarm";
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
    case "dispatched":
      return "Dispatched";
    case "acknowledged":
      return "Accepted";
    case "resolved":
      return "Completed";
    case "false_alarm":
      return "False Alarm";
    default:
      return status ? String(status) : "Active";
  }
}

/** Map a backend status to the shared Badge `tone="status"` variant. */
export function statusBadgeVariant(status?: AlertStatus | string): string {
  switch (status) {
    case "dispatched":
      return "dispatched";
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
export type WorkerStage = "active" | "acknowledged" | "resolved";

export function workerStageFor(alert: Alert | null | undefined): WorkerStage {
  const status = alert?.status;
  if (status === "resolved" || status === "false_alarm") return "resolved";
  if (status === "acknowledged") return "acknowledged";
  return "active";
}

/** Next backend status to apply when the worker advances. */
export const NEXT_STATUS: Record<WorkerStage, AlertStatus | null> = {
  active: "acknowledged",
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
    case "active":
      return {
        stage,
        label: "Accept Assignment",
        helper: "Acknowledge this case so dispatch knows you're on it.",
        tone: "accept",
      };
    case "acknowledged":
      return {
        stage,
        label: "Complete Case",
        helper: "Work on site is done. Mark this case completed.",
        tone: "resolve",
      };
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
