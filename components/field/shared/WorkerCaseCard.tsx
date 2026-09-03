"use client";
import React from "react";
import Link from "next/link";
import { MapPin, Clock, User as UserIcon } from "lucide-react";
import { Badge } from "@/components/operations/shared/Badge";
import {
  elapsedSince,
  incidentLabel,
  locationLabel,
} from "@/lib/operations/utils";
import {
  backendStatusLabel,
  statusBadgeVariant,
  priorityVariant,
} from "@/lib/field/utils";
import type { Alert } from "@/types";

interface WorkerCaseCardProps {
  alert: Alert;
  href: string;
  showAction?: boolean;
}

/**
 * Reusable mobile case card for the field console. Uses the shared Badge for
 * statuses/priorities so visual language matches the Agency Dashboard.
 */
export function WorkerCaseCard({ alert, href, showAction = true }: WorkerCaseCardProps) {
  const incident = incidentLabel(alert.incident_type, alert.description);
  const location = locationLabel(alert);
  const elapsed = elapsedSince(alert.created_at);
  const status = backendStatusLabel(alert.status);

  return (
    <Link href={href} className="field-case-card">
      <div className="field-case-card__header">
        <span className="field-case-card__id">Case #{alert.id}</span>
        <Badge variant={statusBadgeVariant(alert.status)} tone="status">
          {status}
        </Badge>
      </div>

      <div className="field-case-card__incident">{incident}</div>

      <div className="field-case-card__meta">
        <Badge variant={priorityVariant(alert.priority)} tone="priority">
          {alert.priority || "medium"}
        </Badge>
        <span className="field-case-card__meta-item">
          <Clock width={13} height={13} /> {elapsed}
        </span>
      </div>

      <div className="field-case-card__location">
        <MapPin width={13} height={13} />
        {location}
      </div>

      {(alert.user?.name || alert.user_phone) && (
        <div className="field-case-card__reporter">
          <UserIcon width={13} height={13} />
          {alert.user?.name || alert.user_phone}
        </div>
      )}

      {showAction && (
        <div className="field-case-card__actions">
          <span className="field-case-card__link">Open Case</span>
        </div>
      )}
    </Link>
  );
}
