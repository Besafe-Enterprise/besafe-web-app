"use client";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Bell, CheckCheck, Inbox } from "lucide-react";
import { Skeleton } from "@/components/operations/shared/LoadingSkeleton";
import { ErrorRetry } from "@/components/field/shared/ErrorRetry";
import { EmptyState } from "@/components/operations/shared/EmptyState";
import { useFieldNotifications, useMarkFieldNotificationsRead } from "@/lib/field/use-field-data";
import "@/styles/field.css";

function shortenIds(text: string): string {
  return text.replace(/#([0-9a-f]{8})[0-9a-f]{16}/gi, "#$1…");
}

export default function FieldNotificationsPage() {
  const router = useRouter();
  const { data, isLoading, isError, refetch } = useFieldNotifications();
  const markRead = useMarkFieldNotificationsRead();
  const [filter, setFilter] = useState<"all" | "unread">("all");

  const notifications = data?.notifications ?? [];
  const unread = data?.unread ?? 0;

  const filtered = useMemo(() => (filter === "unread" ? notifications.filter((n) => !n.read) : notifications), [notifications, filter]);

  const openNotification = (n: { id: string; data?: Record<string, unknown>; type?: string }) => {
    markRead.mutate([n.id]);
    const d = n.data || {};
    const alertId = (d.alert_id as string | undefined) || (d.case_id as string | undefined);
    const reportId = (d.report_id as string | undefined) || (d.reportId as string | undefined);
    const noteId = (d.note_id as string | undefined) || (d.noteId as string | undefined);
    const evidenceId = d.evidence_id as string | undefined;
    // NOTE: field progress reports carry BOTH alert_id + report_id (UUID inside alert).
    // They must go to /field/cases, NOT /field/reports (SafeChat only).
    // So check alertId first.
    if (alertId) {
      if (reportId || noteId) router.push(`/field/cases/${String(alertId)}#report-${String(reportId ?? noteId)}`);
      else if (evidenceId) router.push(`/field/cases/${String(alertId)}#evidence`);
      else router.push(`/field/cases/${String(alertId)}`);
    } else if (reportId) {
      if (noteId) router.push(`/field/reports/${String(reportId)}#note-${String(noteId)}`);
      else if (evidenceId) router.push(`/field/reports/${String(reportId)}#evidence`);
      else router.push(`/field/reports/${String(reportId)}`);
    } else if (String(n.type || "").includes("report")) {
      router.push("/field/reports");
    }
  };

  if (isLoading) {
    return (
      <div className="field-home">
        <Skeleton height={22} width="50%" />
        <div style={{ marginTop: 20 }}>
          <Skeleton height={72} width="100%" />
          <Skeleton height={72} width="100%" />
          <Skeleton height={72} width="100%" />
        </div>
      </div>
    );
  }

  if (isError) {
    return <ErrorRetry onRetry={() => refetch()} message="We couldn't load your notifications." />;
  }

  return (
    <div className="field-home">
      <button className="field-back-btn" onClick={() => router.back()}>
        <ArrowLeft width={16} height={16} /> Back
      </button>

      <div className="field-notif-page__header">
        <div className="field-home__greeting" style={{ marginBottom: 0 }}>
        </div>
        {unread > 0 && (
          <button className="field-primary-btn field-primary-btn--sm" onClick={() => markRead.mutate(undefined)} disabled={markRead.isPending}>
            <CheckCheck width={14} height={14} /> Mark all read
          </button>
        )}
      </div>

      <div className="field-segmented" style={{ marginBottom: 12, alignSelf: "flex-start" }}>
        <button className={`field-segmented__btn ${filter === "all" ? "field-segmented__btn--active" : ""}`} onClick={() => setFilter("all")}>All • {notifications.length}</button>
        <button className={`field-segmented__btn ${filter === "unread" ? "field-segmented__btn--active" : ""}`} onClick={() => setFilter("unread")}>Unread • {unread}</button>
      </div>

      {filtered.length === 0 ? (
        filter === "unread" ? (
          <EmptyState icon={<CheckCheck width={40} height={40} />} title="No unread" description="Everything is read. Check All for older messages." />
        ) : (
          <EmptyState icon={<Bell width={40} height={40} />} title="No notifications" description="Messages from your agency — new assignments, report reviews, announcements — will appear here." />
        )
      ) : (
        <div className="field-notif-list">
          {filtered.map((n) => (
            <button key={n.id} type="button" className={`field-notif-card ${n.read ? "" : "field-notif-card--unread"}`} onClick={() => openNotification(n)}>
              {!n.read && <span className="field-notif-card__dot" />}
              <span className="field-notif-card__content">
                <span className="field-notif-card__title">{shortenIds(n.title)}</span>
                <span className="field-notif-card__body">{shortenIds(n.body)}</span>
                {n.created_at && <span className="field-notif-card__time">{new Date(n.created_at).toLocaleString()}</span>}
              </span>
              <span className={`field-notif-card__tag field-notif-card__tag--${n.type}`}>{n.type.replace(/_/g, " ")}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
