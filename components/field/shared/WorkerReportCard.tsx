"use client";
import React from "react";
import Link from "next/link";
import { MapPin, Clock, User as UserIcon } from "lucide-react";
import { Badge } from "@/components/operations/shared/Badge";
import { elapsedSince, reportShortId } from "@/lib/operations/utils";
import type { Report } from "@/types";

interface WorkerReportCardProps {
  report: Report;
  href: string;
  showAction?: boolean;
}

const CATEGORY_LABELS: Record<string, string> = {
  harassment: "Harassment",
  assault: "Assault",
  transit_danger: "Transit Danger",
  domestic_violence: "Domestic Violence",
  other: "Other",
};

const REPORT_STATUS_VARIANTS: Record<string, string> = {
  new: "active",
  triaged: "triaged",
  assigned: "assigned",
  reviewing: "reviewing",
  resolved: "resolved",
  closed: "closed",
};

function reportPriorityVariant(report: Report): string {
  const p = (report.priority_label || report.priority || "medium").toLowerCase();
  if (p === "critical" || p === "high") return "critical";
  if (p === "medium") return "warning";
  return "info";
}

export function WorkerReportCard({ report, href, showAction = true }: WorkerReportCardProps) {
  const category = CATEGORY_LABELS[report.category] || report.category || "Report";
  const status = String(report.status || "new").replace(/_/g, " ");
  const priority = reportPriorityVariant(report);
  const priorityLabel = (report.priority_label || report.priority || "medium").toLowerCase();
  const elapsed = elapsedSince(report.created_at || report.createdAt);
  const loc = report.location;
  const hasLocation = loc && (loc.latitude || loc.lat);

  return (
    <Link href={href} className="field-case-card" data-priority={priorityLabel === "critical" || priorityLabel === "high" ? "critical" : "medium"}>
      <div className="field-case-card__header">
        <span className="field-case-card__id" title={String(report.id)}>
          {reportShortId(report.id)}
        </span>
        <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
          <Badge variant={priority} tone="priority">{priorityLabel}</Badge>
          <Badge variant={REPORT_STATUS_VARIANTS[report.status] || "active"} tone="status">{status}</Badge>
        </div>
      </div>

      <div className="field-case-card__incident">{category}</div>

      {report.description && (
        <div style={{ fontSize: 12, color: "var(--color-text-secondary)", lineHeight: 1.4, marginBottom: 6, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
          {report.description}
        </div>
      )}

      <div className="field-case-card__meta">
        <span className="field-case-card__meta-item">
          <Clock width={13} height={13} /> {elapsed}
        </span>
        {report.user_name && (
          <span className="field-case-card__meta-item">
            <UserIcon width={13} height={13} /> {report.user_name}
          </span>
        )}
      </div>

      {hasLocation && (
        <div className="field-case-card__location">
          <MapPin width={13} height={13} />
          {loc.address || `${Number(loc.latitude || loc.lat).toFixed(4)}, ${Number(loc.longitude || loc.lng).toFixed(4)}`}
        </div>
      )}

      {showAction && (
        <div className="field-case-card__actions">
          <span className="field-case-card__link">Open Report</span>
        </div>
      )}
    </Link>
  );
}
