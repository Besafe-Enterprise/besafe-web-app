"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { EmptyState } from "@/components/operations/shared/EmptyState";
import { Skeleton } from "@/components/operations/shared/LoadingSkeleton";
import { ErrorRetry } from "@/components/field/shared/ErrorRetry";
import { useFieldActiveAlerts } from "@/lib/field/use-field-data";
import { WorkerCaseCard } from "@/components/field/shared/WorkerCaseCard";
import { WorkerStatusStepper } from "@/components/field/shared/WorkerStatusStepper";
import { workerStageFor, workerActionFor, NEXT_STATUS } from "@/lib/field/utils";
import { useUpdateAlertStatus } from "@/lib/hooks/dispatch/use-dispatch-data";
import { Activity, CheckCircle2, Play, MapPin } from "lucide-react";

/**
 * Active — hero focus: the one you should be working right now.
 * If several are open, we show the priority one as hero + list the rest.
 */
export default function FieldActivePage() {
  const router = useRouter();
  const { alerts, isLoading, isError, refetch } = useFieldActiveAlerts();
  const updateStatus = useUpdateAlertStatus();
  const hero = alerts[0];
  const rest = alerts.slice(1);
  const stage = hero ? workerStageFor(hero) : "new";
  const action = hero ? workerActionFor(stage) : null;
  const next = hero ? NEXT_STATUS[stage] : null;

  if (isLoading) {
    return (
      <div className="field-list">
        <Skeleton height={18} width="45%" />
        <div style={{ marginTop: 16 }}>
          <Skeleton height={140} width="100%" />
        </div>
      </div>
    );
  }

  if (isError) {
    return <ErrorRetry onRetry={() => refetch()} message="We couldn't load your active case." />;
  }

  if (!hero) {
    return (
      <div className="field-list">
        <div className="field-list__header">
          <h1>Active</h1>
          <span className="field-list__count">0</span>
        </div>
        <p className="field-list__subtitle">What you&apos;re working on right now.</p>
        <EmptyState icon={<CheckCircle2 width={40} height={40} />} title="Nothing active" description="You don't have an in-progress case. New assignments appear here automatically. Pull to refresh or check Cases." />
        <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
          <button className="field-primary-btn field-primary-btn--block" onClick={() => router.push("/field/assignments")}>
            Go to Cases
          </button>
          <button className="field-secondary-btn" onClick={() => router.push("/field/history")}><Activity width={16} height={16} /></button>
        </div>
      </div>
    );
  }

  return (
    <div className="field-list">
      <div className="field-list__header">
        <h1>Active</h1>
        <span className="field-list__count">{alerts.length}</span>
      </div>
      <p className="field-list__subtitle">Focus on this one — it needs your attention now.</p>

      <div className="field-detail-card" style={{ padding: 0, overflow: "hidden", borderRadius: 16 }}>
        <WorkerCaseCard alert={hero} href={`/field/cases/${hero.id}`} showAction={false} />
        <div style={{ padding: 12, borderTop: "1px solid var(--color-border)", background: "var(--color-surface-sunken)" }}>
          <WorkerStatusStepper stage={stage} />
        </div>
      </div>

      <div className="field-home__next-step">
        <div className="field-home__next-step-label">Next step</div>
        {action && next ? (
          <button className="field-primary-btn field-primary-btn--block" disabled={updateStatus.isPending} onClick={() => updateStatus.mutate({ id: hero.id, status: next })}>
            <Play width={16} height={16} /> {updateStatus.isPending ? "Updating…" : action.label}
          </button>
        ) : (
          <div className="field-success-banner"><CheckCircle2 width={16} height={16} /> All steps complete — file your report.</div>
        )}
        <div style={{ display: "flex", gap: 8 }}>
          <button className="field-secondary-btn" style={{ flex: 1 }} onClick={() => router.push(`/field/cases/${hero.id}`)}>Open file</button>
          <button className="field-secondary-btn" onClick={() => router.push(`/field/map?case=${hero.id}`)}><MapPin width={16} height={16} /> Map</button>
        </div>
      </div>

      {rest.length > 0 && (
        <>
          <div className="field-home__section-title">Also assigned to you • {rest.length}</div>
          {rest.map((alert) => (
            <WorkerCaseCard key={alert.id} alert={alert} href={`/field/cases/${alert.id}`} />
          ))}
        </>
      )}

      <button className="field-secondary-btn field-secondary-btn--block" style={{ marginTop: 12 }} onClick={() => router.push("/field/history")}>
        <Activity width={16} height={16} /> View completed cases
      </button>
    </div>
  );
}
