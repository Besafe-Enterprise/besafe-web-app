"use client";

import React from "react";
import { Briefcase, Check } from "lucide-react";
import { EmptyState } from "@/components/operations/shared/EmptyState";
import { Skeleton } from "@/components/operations/shared/LoadingSkeleton";
import { WorkerCaseCard } from "@/components/field/shared/WorkerCaseCard";
import { ErrorRetry } from "@/components/field/shared/ErrorRetry";
import { useFieldActiveAlerts } from "@/lib/field/use-field-data";
import { workerStageFor } from "@/lib/field/utils";

export default function FieldAssignmentsPage() {
  const { alerts, isLoading, isError, refetch } = useFieldActiveAlerts();

  if (isLoading) {
    return (
      <div className="field-list">
        <Skeleton height={18} width="45%" />
        <div style={{ marginTop: 16 }}>
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} height={90} width="100%" />
          ))}
        </div>
      </div>
    );
  }

  if (isError) {
    return <ErrorRetry onRetry={() => refetch()} message="We couldn't load your assignments." />;
  }

  return (
    <div className="field-list">
      <div className="field-list__header">
        <h1>Assignments</h1>
        <span className="field-list__count">{alerts.length}</span>
      </div>
      <p className="field-list__subtitle">
        Cases assigned to you and waiting for your response.
      </p>

      {alerts.length === 0 ? (
        <EmptyState
          icon={<Briefcase width={40} height={40} />}
          title="No pending assignments"
          description="You're all clear. New assignments from dispatch will appear here."
        />
      ) : (
        alerts.map((alert) => (
          <div key={alert.id} className="field-assignment">
            <WorkerCaseCard alert={alert} href={`/field/cases/${alert.id}`} />
            <div className="field-assignment__hint">
              {workerStageFor(alert) === "active" ? (
                <span className="field-assignment__hint--new">
                  <Check width={14} height={14} /> Awaiting your acceptance
                </span>
              ) : (
                <span>In progress</span>
              )}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
