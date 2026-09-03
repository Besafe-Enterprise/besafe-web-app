"use client";

import React from "react";
import { ArrowLeft } from "lucide-react";
import { Badge } from "@/components/operations/shared/Badge";
import { EmptyState } from "@/components/operations/shared/EmptyState";
import { Skeleton } from "@/components/operations/shared/LoadingSkeleton";
import { WorkerCaseCard } from "@/components/field/shared/WorkerCaseCard";
import { backendStatusLabel, statusBadgeVariant } from "@/lib/field/utils";
import { useFieldResolvedAlerts } from "@/lib/field/use-field-data";
import { Link, useRouter } from "next/navigation";
import "@/styles/field.css";

export default function FieldHistoryPage() {
  const router = useRouter();
  const { alerts, isLoading, isError, refetch } = useFieldResolvedAlerts();

  if (isLoading) {
    return (
      <div className="field-home">
        <Skeleton height={22} width="60%" />
        <div style={{ marginTop: 20 }}>
          <Skeleton height={120} width="100%" />
          <Skeleton height={80} width="100%" />
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="field-home">
        <button className="field-back-btn" onClick={() => router.back()}>
          <ArrowLeft width={16} height={16} /> Back
        </button>
        <div className="field-home__greeting">
          <h1>Couldn&apos;t load history</h1>
          <p>Try pulling to refresh.</p>
        </div>
        <button className="field-primary-btn field-primary-btn--block" onClick={() => refetch()}>
          Retry
        </button>
      </div>
    );
  }

  if (alerts.length === 0) {
    return (
      <div className="field-home">
        <button className="field-back-btn" onClick={() => router.back()}>
          <ArrowLeft width={16} height={16} /> Back
        </button>
        <div className="field-home__greeting">
          <h1>Case History</h1>
          <p>Your completed cases will appear here.</p>
        </div>
        <EmptyState
          icon={null}
          title="No completed cases"
          description="When you finish a case, it will move to your history."
        />
      </div>
    );
  }

  return (
    <div className="field-home">
      <button className="field-back-btn" onClick={() => router.back()}>
        <ArrowLeft width={16} height={16} /> Back
      </button>

      <div className="field-home__greeting">
        <h1>Case History</h1>
        <p>{alerts.length} completed case{alerts.length !== 1 ? "s" : ""}</p>
      </div>

      <div className="field-case-list">
        {alerts.map((alert) => (
          <Link key={alert.id} href={`/field/cases/${alert.id}`} className="field-case-list-item">
            <div className="field-case-list-item__main">
              <Badge variant={statusBadgeVariant(alert.status)} tone="status" className="field-case-list-badge">
                {backendStatusLabel(alert.status)}
              </Badge>
              <div className="field-case-list-item__info">
                <div className="field-case-list-item__title">
                  Case #{alert.id}
                </div>
                <div className="field-case-list-item__meta">
                  {alert.incident_type && <span>{alert.incident_type}</span>}
                  {alert.location?.address && <span>{alert.location.address}</span>}
                </div>
              </div>
            </div>
            <div className="field-case-list-item__time">
              {alert.resolved_at || alert.updated_at ? new Date(alert.resolved_at || alert.updated_at).toLocaleDateString() : "—"}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}