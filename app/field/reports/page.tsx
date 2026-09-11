"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import { FileText, Clock, MapPin } from "lucide-react";
import { EmptyState } from "@/components/operations/shared/EmptyState";
import { Skeleton } from "@/components/operations/shared/LoadingSkeleton";
import { Badge } from "@/components/operations/shared/Badge";
import { ErrorRetry } from "@/components/field/shared/ErrorRetry";
import { useFieldReports } from "@/lib/field/use-field-data";
import { ACTIVE_CASE_STATUSES } from "@/types";
import { formatShortDate, reportShortId } from "@/lib/operations/utils";
import "@/styles/field.css";

export default function FieldReportsPage() {
  const { data: allReports = [], isLoading, isError, refetch } = useFieldReports();
  const reports = useMemo(
    () => allReports.filter((r) => (ACTIVE_CASE_STATUSES as readonly string[]).includes(r.status)),
    [allReports]
  );

  if (isLoading) {
    return (
      <div className="field-list">
        <Skeleton height={18} width="50%" />
        <div style={{ marginTop: 16 }}>
          <Skeleton height={90} width="100%" />
          <Skeleton height={90} width="100%" />
        </div>
      </div>
    );
  }
  if (isError) return <ErrorRetry onRetry={() => refetch()} message="We couldn't load your reported cases." />;

  return (
    <div className="field-list">
      <div className="field-list__header">
        <h1>Reported Cases</h1>
        <span className="field-list__count">{reports.length}</span>
      </div>
      <p className="field-list__subtitle">SafeChat reports assigned to you — tap to view details, evidence and update status.</p>

      {reports.length === 0 ? (
        <EmptyState icon={<FileText width={40} height={40} />} title="No reported cases" description="When a SafeChat report is assigned to you it will appear here. You’ll get a real-time notification." />
      ) : (
        reports.map((r) => (
          <Link key={String(r.id)} href={`/field/reports/${r.id}`} className="field-case-card" style={{ display: "block", textDecoration: "none" }}>
            <div className="field-case-card__header">
              <span className="field-case-card__id" title={String(r.id)}>{reportShortId(r.id)}</span>
              <Badge variant={String(r.status)} tone="report">{String(r.status).replace(/_/g, " ")}</Badge>
            </div>
            <div className="field-case-card__incident" style={{ fontSize: 14 }}>{String(r.category || "Report").replace(/_/g, " ")} • {String(r.priority || "")}</div>
            <div className="field-case-card__meta">
              <Badge variant={String(r.priority || "low")} tone="priority">{String(r.priority || "low")}</Badge>
              <span className="field-case-card__meta-item"><Clock width={13} height={13} /> {formatShortDate(r.createdAt || r.created_at)}</span>
            </div>
            {r.location?.address && (
              <div className="field-case-card__location"><MapPin width={13} height={13} />{r.location.address}</div>
            )}
            <div className="field-case-card__actions"><span className="field-case-card__link">Open Report</span></div>
          </Link>
        ))
      )}
    </div>
  );
}
