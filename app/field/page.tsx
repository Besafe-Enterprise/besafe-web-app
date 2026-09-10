"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CheckCircle2, Clock, Bell, FileText } from "lucide-react";
import { EmptyState } from "@/components/operations/shared/EmptyState";
import { Skeleton } from "@/components/operations/shared/LoadingSkeleton";
import { WorkerCaseCard } from "@/components/field/shared/WorkerCaseCard";
import { WorkerReportCard } from "@/components/field/shared/WorkerReportCard";
import { ErrorRetry } from "@/components/field/shared/ErrorRetry";
import { useFieldActiveAlerts, useFieldReports, useFieldNotifications, useFieldProfile } from "@/lib/field/use-field-data";
import { useOnline } from "@/lib/field/use-online";

type CombinedItem =
  | { kind: "case"; id: string | number; created_at?: string; data: import("@/types").Alert }
  | { kind: "report"; id: string | number; created_at?: string; data: import("@/types").Report };

export default function FieldHomePage() {
  const router = useRouter();
  const online = useOnline();
  const { alerts, isLoading, isError, refetch, worker } = useFieldActiveAlerts();
  const { data: reports = [] } = useFieldReports();
  const { data: notifs } = useFieldNotifications();
  const unread = notifs?.unread ?? 0;

  const activeAlerts = alerts.filter((a) => a.assignment_status === "accepted");
  const pendingAlerts = alerts.filter((a) => a.assignment_status === "pending");

  const activeReports = (reports as import("@/types").Report[]).filter(
    (r) => r.status !== "resolved" && r.status !== "closed"
  );

  const combined: CombinedItem[] = React.useMemo(() => {
    const items: CombinedItem[] = [
      ...activeAlerts.map((a) => ({ kind: "case" as const, id: a.id, created_at: a.created_at, data: a })),
      ...activeReports.map((r) => ({ kind: "report" as const, id: r.id, created_at: r.created_at || r.createdAt, data: r })),
    ];
    return items.sort((a, b) => {
      const da = a.created_at ? new Date(a.created_at).getTime() : 0;
      const db = b.created_at ? new Date(b.created_at).getTime() : 0;
      return db - da;
    });
  }, [activeAlerts, activeReports]);

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
    return <ErrorRetry onRetry={() => refetch()} message="We couldn't load your cases." />;
  }

  return (
    <div className="field-home">
      <div className="field-home__greeting">
        <h1>Hi, {worker?.name || "officer"}.</h1>
        <p>{combined.length > 0 ? `${combined.length} active item${combined.length > 1 ? "s" : ""}` : "No active items right now."}</p>
      </div>

      <span className="field-sync-pill">
        <span className={`field-sync-pill__dot ${online ? "field-sync-pill__dot--online" : ""}`} />
        {online ? "Live sync on" : "Offline — will sync when back online"}
      </span>

      <div className="field-bento">
        <div className="field-bento__card">
          <div className="field-bento__label"><CheckCircle2 width={12} height={12} /> Cases</div>
          <div className="field-bento__value">{activeAlerts.length}</div>
          <div className="field-bento__hint">In progress</div>
        </div>
        <div className="field-bento__card">
          <div className="field-bento__label"><FileText width={12} height={12} /> Reports</div>
          <div className="field-bento__value">{activeReports.length}</div>
          <div className="field-bento__hint">To review</div>
        </div>
        <div className="field-bento__card">
          <div className="field-bento__label"><Clock width={12} height={12} /> Pending</div>
          <div className="field-bento__value">{pendingAlerts.length}</div>
          <div className="field-bento__hint">{pendingAlerts.length ? "Awaiting acceptance" : "All accepted"}</div>
        </div>
        <div className="field-bento__card">
          <div className="field-bento__label"><Bell width={12} height={12} /> Inbox</div>
          <div className="field-bento__value">{unread}</div>
          <div className="field-bento__hint">{unread ? "Need attention" : "All clear"}</div>
        </div>
      </div>

      {pendingAlerts.length > 0 && (
        <Link href="/field/assignments" className="field-home__pending" style={{ textDecoration: "none", marginTop: 12 }}>
          <span style={{ display: "flex", alignItems: "center", gap: 6 }}><Clock width={14} height={14} /> Cases awaiting your acceptance</span>
          <span className="field-home__pending-count">{pendingAlerts.length}</span>
        </Link>
      )}

      <div className="field-home__section-title">
        <span>{combined.length > 0 ? "Your work" : "Nothing assigned"}</span>
      </div>

      {combined.length > 0 ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {combined.map((item) =>
            item.kind === "case" ? (
              <WorkerCaseCard key={`case-${item.id}`} alert={item.data} href={`/field/cases/${item.id}`} />
            ) : (
              <WorkerReportCard key={`report-${item.id}`} report={item.data} href={`/field/reports/${item.id}`} />
            )
          )}
        </div>
      ) : (
        <EmptyState
          icon={<CheckCircle2 width={40} height={40} />}
          title="No active assignments"
          description="When dispatch assigns you a case or report, it will appear here."
        />
      )}
    </div>
  );
}
