"use client";

import React from "react";
import Link from "next/link";
import { useGetAlerts } from "@/lib/hooks/dispatch/use-dispatch-data";
import { useAlertStore } from "@/stores/useAlertStore";
import { useAgencyAuthStore } from "@/lib/store/agency-auth-store";
import { Badge } from "@/components/operations/shared/Badge";
import { EmptyState } from "@/components/operations/shared/EmptyState";
import { Skeleton } from "@/components/operations/shared/LoadingSkeleton";
import { Briefcase, MapPin, Clock, ChevronRight } from "lucide-react";
import {
  elapsedSince,
  displayPriority,
  incidentLabel,
  locationLabel,
} from "@/lib/operations/utils";
import type { Alert } from "@/types";
import "@/styles/field.css";

function getWorkerLocalStatus(alert: Alert): string {
  if (alert.status === "resolved") return "resolved";
  if (alert.status === "dispatched") return "on site";
  if (alert.status === "acknowledged") return "en route";
  return "active";
}

function CaseCard({ alert }: { alert: Alert }) {
  const priority = displayPriority(alert.priority);
  const incident = incidentLabel(alert.incident_type, alert.description);
  const location = locationLabel(alert);
  const elapsed = elapsedSince(alert.created_at);
  const workerStatus = getWorkerLocalStatus(alert);

  return (
    <Link href={`/field/cases/${alert.id}`} className="field-case-card" style={{ textDecoration: "none", color: "inherit", display: "block" }}>
      <div className="field-case-card__header">
        <span className="field-case-card__id">#{alert.id}</span>
        <Badge variant={workerStatus} tone="status">
          {workerStatus}
        </Badge>
      </div>
      <div className="field-case-card__incident">{incident}</div>
      <div className="field-case-card__meta">
        <Badge variant={priority} tone="priority">
          {priority}
        </Badge>
        <span className="field-case-card__meta">
          <Clock width={12} height={12} /> {elapsed}
        </span>
      </div>
      <div className="field-case-card__location">
        <MapPin width={12} height={12} style={{ display: "inline", marginRight: 4 }} />
        {location}
      </div>
      <div className="field-case-card__actions">
        <span className="field-action-btn field-action-btn--en-route" style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
          View <ChevronRight width={14} height={14} />
        </span>
      </div>
    </Link>
  );
}

export default function FieldCasesPage() {
  const { user } = useAgencyAuthStore();
  const { data: alerts, isLoading } = useGetAlerts();
  const realtimeAlerts = useAlertStore((s) => s.alerts);

  const merged = React.useMemo(() => {
    const base = alerts || [];
    const rt = realtimeAlerts || [];
    const map = new Map<string, Alert>();
    for (const a of [...rt, ...base]) {
      map.set(String(a.id), a);
    }
    return Array.from(map.values());
  }, [alerts, realtimeAlerts]);

  const myCases = user?.id
    ? merged.filter((a) => String(a.assigned_staff_id) === String(user.id))
    : [];

  if (isLoading) {
    return (
      <div className="field-main">
        <Skeleton height={20} width="40%" />
        <div style={{ marginTop: 16 }}>
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="field-case-card" style={{ marginBottom: 12 }}>
              <Skeleton height={14} width="60%" />
              <Skeleton height={18} width="80%" />
              <Skeleton height={12} width="40%" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (myCases.length === 0) {
    return (
      <div className="field-main">
        <EmptyState
          icon={<Briefcase width={40} height={40} />}
          title="No assigned cases"
          description="You have no active cases assigned to you right now."
        />
      </div>
    );
  }

  return (
    <div className="field-main">
      <div className="field-case-card__header" style={{ marginBottom: 16 }}>
        <span style={{ fontSize: "var(--text-lg)", fontWeight: "var(--weight-bold)", color: "var(--color-text-primary)" }}>
          My Cases
        </span>
        <span className="field-badge field-badge--active">{myCases.length}</span>
      </div>
      {myCases.map((alert) => (
        <CaseCard key={alert.id} alert={alert} />
      ))}
    </div>
  );
}
