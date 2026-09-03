"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { EmptyState } from "@/components/operations/shared/EmptyState";
import { Skeleton } from "@/components/operations/shared/LoadingSkeleton";
import { WorkerCaseCard } from "@/components/field/shared/WorkerCaseCard";
import { SyncIndicator } from "@/components/field/shared/SyncIndicator";
import { ErrorRetry } from "@/components/field/shared/ErrorRetry";
import { useFieldActiveAlerts } from "@/lib/field/use-field-data";
import { backendStatusLabel, statusBadgeVariant } from "@/lib/field/utils";
import { Badge } from "@/components/operations/shared/Badge";
import { useOnline } from "@/lib/field/use-online";
import { Briefcase, ChevronRight } from "lucide-react";

export default function FieldHomePage() {
  const router = useRouter();
  const online = useOnline();
  const { alerts, isLoading, isError, refetch, worker } = useFieldActiveAlerts();

  const current = alerts[0];
  const pendingCount = alerts.length;

  if (isLoading) {
    return (
      <div className="field-home">
        <Skeleton height={18} width="60%" />
        <div style={{ marginTop: 20 }}>
          <Skeleton height={120} width="100%" />
          <Skeleton height={80} width="100%" />
        </div>
      </div>
    );
  }

  if (isError) {
    return <ErrorRetry onRetry={() => refetch()} message="We couldn't load your current assignment." />;
  }

  if (alerts.length === 0) {
    return (
      <div className="field-home">
        <div className="field-home__greeting">
          <h1>You&apos;re all caught up.</h1>
          <p>{worker?.name?.split(" ")[0] || "Field worker"} — no active assignment right now.</p>
        </div>
        <SyncIndicator online={online} />
        <EmptyState
          icon={<CheckCircle2 width={40} height={40} />}
          title="No active assignment"
          description="When dispatch assigns you a case, it will appear here at the top of your home screen."
        />
        <Link href="/field/history" className="field-primary-btn field-primary-btn--block">
          View your case history
        </Link>
      </div>
    );
  }

  return (
    <div className="field-home">
      <div className="field-home__greeting">
        <h1>Hi, {worker?.name?.split(" ")[0] || "officer"}.</h1>
        <p>Here&apos;s what needs your attention.</p>
      </div>

      <SyncIndicator online={online} />

      {pendingCount > 1 && (
        <div className="field-home__pending">
          <span>Other pending assignments</span>
          <span className="field-home__pending-count">{pendingCount - 1}</span>
        </div>
      )}

      <div className="field-home__section-title">
        <span>{pendingCount > 1 ? "Priority — take this first" : "Your assignment"}</span>
      </div>

      {current && (
        <div className="field-home__current">
          <WorkerCaseCard alert={current} href={`/field/cases/${current.id}`} showAction={false} />
          <div className="field-home__next-step">
            <div className="field-home__next-step-label">Next step</div>
            <div className="field-home__next-step-row">
              <Badge variant={statusBadgeVariant(current.status)} tone="status">
                {backendStatusLabel(current.status)}
              </Badge>
              <button
                className="field-primary-btn field-primary-btn--expand"
                onClick={() => router.push(`/field/cases/${current.id}`)}
              >
                Open Case <ChevronRight width={16} height={16} />
              </button>
            </div>
          </div>
        </div>
      )}

      {pendingCount > 1 && (
        <div className="field-home__more">
          <Link href="/field/assignments" className="field-home__more-link">
            <Briefcase width={16} height={16} />
            View all {pendingCount} assignments
          </Link>
        </div>
      )}
    </div>
  );
}
