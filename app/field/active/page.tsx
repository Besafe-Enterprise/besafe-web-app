"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { EmptyState } from "@/components/operations/shared/EmptyState";
import { Skeleton } from "@/components/operations/shared/LoadingSkeleton";
import { ErrorRetry } from "@/components/field/shared/ErrorRetry";
import { useFieldActiveAlerts } from "@/lib/field/use-field-data";
import { WorkerCaseCard } from "@/components/field/shared/WorkerCaseCard";
import { Activity, CheckCircle2 } from "lucide-react";

/**
 * The "Active" tab. Shows the single case you're working right now. If there's
 * more than one open case, list them all so nothing is hidden.
 */
export default function FieldActivePage() {
  const router = useRouter();
  const { alerts, isLoading, isError, refetch } = useFieldActiveAlerts();

  if (isLoading) {
    return (
      <div className="field-list">
        <Skeleton height={18} width="45%" />
        <div style={{ marginTop: 16 }}>
          <Skeleton height={120} width="100%" />
        </div>
      </div>
    );
  }

  if (isError) {
    return <ErrorRetry onRetry={() => refetch()} message="We couldn't load your active case." />;
  }

  return (
    <div className="field-list">
      <div className="field-list__header">
        <h1>Active Case</h1>
        <span className="field-list__count">{alerts.length}</span>
      </div>
      <p className="field-list__subtitle">What you&apos;re working on right now.</p>

      {alerts.length === 0 ? (
        <EmptyState
          icon={<CheckCircle2 width={40} height={40} />}
          title="Nothing active"
          description="You don't have an in-progress case. New assignments appear here automatically."
        />
      ) : (
        alerts.map((alert) => (
          <WorkerCaseCard
            key={alert.id}
            alert={alert}
            href={`/field/cases/${alert.id}`}
            showAction={false}
          />
        ))
      )}

      <button
        className="field-secondary-btn field-secondary-btn--block"
        style={{ marginTop: 16 }}
        onClick={() => router.push("/field/history")}
      >
        <Activity width={16} height={16} /> View completed cases
      </button>
    </div>
  );
}
