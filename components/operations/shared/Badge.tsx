import React from "react";

const PRIORITY_MAP: Record<string, string> = {
  critical: "badge--critical",
  high: "badge--high",
  medium: "badge--medium",
  moderate: "badge--medium",
  low: "badge--low",
};

const STATUS_MAP: Record<string, string> = {
  new: "badge--case-new",
  pending_acceptance: "badge--case-triaged",
  triaged: "badge--case-triaged",
  assigned: "badge--case-assigned",
  accepted: "badge--case-accepted",
  "en route": "badge--case-en-route",
  enroute: "badge--case-en-route",
  "on site": "badge--case-on-site",
  onsite: "badge--case-on-site",
  investigating: "badge--case-investigating",
  "pending review": "badge--case-pending-review",
  "changes requested": "badge--case-changes-requested",
  resolved: "badge--case-resolved",
  closed: "badge--case-closed",
  // legacy alert statuses
  active: "badge--case-new",
  acknowledged: "badge--case-accepted",
  false_alarm: "badge--secondary",
};

const REPORT_STATUS_MAP: Record<string, string> = {
  draft: "badge--report-draft",
  pending: "badge--report-submitted",
  pending_acceptance: "badge--report-submitted",
  submitted: "badge--report-submitted",
  pending_analysis: "badge--report-submitted",
  "under review": "badge--report-under-review",
  reviewing: "badge--report-under-review",
  investigating: "badge--report-under-review",
  "changes requested": "badge--report-changes",
  approved: "badge--report-approved",
  resolved: "badge--report-approved",
  closed: "badge--report-approved",
};

const WORKER_STATUS_MAP: Record<string, string> = {
  available: "badge--available",
  busy: "badge--busy",
  "en route": "badge--en-route",
  enroute: "badge--en-route",
  "on site": "badge--on-site",
  onsite: "badge--on-site",
  offline: "badge--offline",
  inactive: "badge--offline",
};

interface BadgeProps {
  variant?: string;
  children: React.ReactNode;
  tone?: "priority" | "status" | "report" | "worker" | "secondary";
}

export function Badge({ variant, children, tone = "secondary" }: BadgeProps) {
  let cls = "badge--secondary";
  if (variant) {
    if (tone === "priority")
      cls = PRIORITY_MAP[String(variant).toLowerCase()] || "badge--secondary";
    else if (tone === "status")
      cls = STATUS_MAP[String(variant).toLowerCase()] || "badge--secondary";
    else if (tone === "report")
      cls = REPORT_STATUS_MAP[String(variant).toLowerCase()] || "badge--secondary";
    else if (tone === "worker")
      cls = WORKER_STATUS_MAP[String(variant).toLowerCase()] || "badge--secondary";
  }
  return <span className={`badge ${cls}`}>{children}</span>;
}
