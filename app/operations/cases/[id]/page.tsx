"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useGetAlerts } from "@/lib/hooks/dispatch/use-dispatch-data";
import { useGetAgencyTeam } from "@/lib/hooks/team/use-team-data";
import { useAssignAlert } from "@/lib/hooks/dispatch/use-dispatch-data";
import { useAlertStore } from "@/stores/useAlertStore";
import type { Alert } from "@/types";
import { Badge } from "@/components/operations/shared/Badge";
import { Avatar } from "@/components/operations/shared/Avatar";
import { EmptyState } from "@/components/operations/shared/EmptyState";
import { SkeletonRow } from "@/components/operations/shared/LoadingSkeleton";
import { CASE_STAGES, incidentLabel, displayPriority, elapsedSince, formatShortDate, workerStatus, type CaseStatus } from "@/lib/operations/utils";
import { toast } from "sonner";
import { Check, X, UserPlus, RotateCcw, AlertTriangle, FileText, Copy } from "lucide-react";
import "@/styles/operations/cases.css";

function CaseStepper({ status }: { status?: string }) {
  const current = useMemo(() => {
    if (!status) return 0;
    const s = String(status).toLowerCase().replace(/[_-]/g, " ").trim();
    return Math.max(0, CASE_STAGES.indexOf(s as CaseStatus));
  }, [status]);

  return (
    <div className="stepper">
      {CASE_STAGES.map((stage, i) => {
        const isDone = i < current;
        const isCurrent = i === current;
        return (
          <div
            key={stage}
            className={`stepper__stage ${isCurrent ? "stepper__stage--current" : ""} ${isDone ? "stepper__stage--done" : ""} ${i > current ? "stepper__stage--future" : ""}`}
          >
            <span
              className={`stepper__dot ${isDone ? "stepper__dot--done" : ""} ${isCurrent ? "stepper__dot--current" : ""}`}
            >
              {isDone ? <Check width={12} height={12} /> : i + 1}
            </span>
            <span className="stepper__stage-label">{stage.toUpperCase()}</span>
          </div>
        );
      })}
    </div>
  );
}

export default function CaseDetailPage() {
  const params = useParams();
  const id = params.id;
  const { data: alerts = [], isLoading } = useGetAlerts();
  const { data: team = [], isLoading: teamLoading } = useGetAgencyTeam();
  const { alerts: liveAlerts } = useAlertStore();
  const [assignOpen, setAssignOpen] = useState(false);

  const caseItem = useMemo(() => {
    if (liveAlerts.length > 0) return liveAlerts.find((a) => String(a.id) === String(id));
    return alerts.find((a) => String(a.id) === String(id));
  }, [liveAlerts, alerts, id]);

  const { mutate: assignAlert, isPending: assigning } = useAssignAlert();

  if (isLoading) return <SkeletonRow cols={2} rows={8} />;

  if (!caseItem) {
    return (
      <EmptyState
        icon={<Copy width={40} height={40} />}
        title="Case not found"
        description={`No case found with ID #${id}.`}
      />
    );
  }

  const coords =
    caseItem.gps_lat ?? caseItem.location?.latitude ?? caseItem.location?.lat;
  const lng =
    caseItem.gps_lng ?? caseItem.location?.longitude ?? caseItem.location?.lng;

  const handleAssign = (staffId: string, staffName: string) => {
    assignAlert(
      { alertId: caseItem.id, staffId, staffName },
      {
        onSuccess: () => {
          setAssignOpen(false);
          toast.success(`Assigned to ${staffName}`);
        },
      }
    );
    setAssignOpen(false);
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <Link href="/operations/cases" className="text-tertiary" style={{ fontSize: "var(--text-sm)" }}>
            ← Back to cases
          </Link>
        </div>
      </div>

      <div className="case-detail">
        {/* ─── LEFT COLUMN ─── */}
        <div className="case-detail__left">
          <div className="case-header">
            <div className="case-header__row">
              <span className="case-header__id">{`#${caseItem.id}`}</span>
              <Badge variant={displayPriority(caseItem.priority)} tone="priority">
                {displayPriority(caseItem.priority)}
              </Badge>
              <Badge variant={caseItem.status} tone="status">
                {String(caseItem.status).replace(/_/g, " ")}
              </Badge>
            </div>
            <div className="case-header__title">{incidentLabel(caseItem.incident_type, caseItem.description)}</div>
            <div className="case-header__sub">
              {caseItem.location?.address ||
                (coords != null && lng != null ? `${Number(coords).toFixed(4)}, ${Number(lng).toFixed(4)}` : "Location pending")}
              {" • "}
              {caseItem.assigned_staff_name || "Unassigned"}
            </div>
            <div className="case-header__actions">
              {!caseItem.assigned_staff_name ? (
                <button type="button" className="btn btn--primary" onClick={() => setAssignOpen(true)}>
                  <UserPlus width={14} height={14} /> Assign
                </button>
              ) : (
                <button type="button" className="btn btn--primary" onClick={() => setAssignOpen(true)}>
                  <RotateCcw width={14} height={14} /> Reassign
                </button>
              )}
              <button type="button" className="btn btn--secondary">Change Status</button>
              <button type="button" className="btn btn--secondary">Add Note</button>
              <Link href={`/operations/reports`} className="btn btn--secondary">
                <FileText width={14} height={14} /> Generate Report
              </Link>
              <button type="button" className="btn btn--ghost" style={{ color: "var(--color-warning)" }}>
                <AlertTriangle width={14} height={14} /> Escalate
              </button>
            </div>
          </div>

          {/* Case information */}
          <div className="card">
            <div className="section-header">
              <h2 className="section-header__title">Case Information</h2>
            </div>
            <div className="info-grid">
              <div className="info-row"><span className="info-row__label">Case ID</span><span className="info-row__value mono">#{caseItem.id}</span></div>
              <div className="info-row"><span className="info-row__label">Category</span><span className="info-row__value">{caseItem.incident_type || "sos"}</span></div>
              <div className="info-row"><span className="info-row__label">Priority</span><span className="info-row__value">{displayPriority(caseItem.priority)}</span></div>
              <div className="info-row"><span className="info-row__label">Status</span><span className="info-row__value">{String(caseItem.status).replace(/_/g, " ")}</span></div>
              <div className="info-row"><span className="info-row__label">Reporter</span><span className="info-row__value">{caseItem.user?.name || caseItem.user_name || "Anonymous"}</span></div>
              <div className="info-row"><span className="info-row__label">Created</span><span className="info-row__value">{formatShortDate(caseItem.created_at)}</span></div>
              <div className="info-row"><span className="info-row__label">Location</span><span className="info-row__value">{caseItem.location?.address || "Coordinates pending"}</span></div>
              <div className="info-row"><span className="info-row__label">Last Update</span><span className="info-row__value">{formatShortDate(caseItem.updated_at || caseItem.created_at)}</span></div>
              <div className="info-row"><span className="info-row__label">Assigned Worker</span><span className="info-row__value">{caseItem.assigned_staff_name || "Unassigned"}</span></div>
              <div className="info-row"><span className="info-row__label">Elapsed</span><span className="info-row__value">{elapsedSince(caseItem.created_at)}</span></div>
            </div>
          </div>

          {/* Progress stepper */}
          <div className="card">
            <div className="section-header">
              <h2 className="section-header__title">Case Progress</h2>
            </div>
            <CaseStepper status={caseItem.status} />
          </div>

          {/* Timeline */}
          <div className="card">
            <div className="section-header">
              <h2 className="section-header__title">Timeline</h2>
            </div>
            <Timeline caseItem={caseItem} />
          </div>
        </div>

        {/* ─── RIGHT COLUMN ─── */}
        <div className="case-detail__right">
          {/* Assignment panel */}
          <div className="card">
            <div className="section-header">
              <h2 className="section-header__title">
                {caseItem.assigned_staff_name ? "Current Assignment" : "Assignment"}
              </h2>
            </div>
            {caseItem.assigned_staff_name ? (
              <div className="worker-option">
                <Avatar name={caseItem.assigned_staff_name} />
                <div className="worker-option__info">
                  <div className="worker-option__name">{caseItem.assigned_staff_name}</div>
                  <div className="worker-option__meta">
                    Assigned {formatShortDate(caseItem.assigned_at)}
                  </div>
                </div>
                <button type="button" className="btn btn--secondary btn--sm" onClick={() => setAssignOpen(true)}>
                  Reassign
                </button>
              </div>
            ) : (
              <>
                <p className="text-secondary" style={{ fontSize: "var(--text-sm)", marginBottom: "var(--space-3)" }}>
                  No worker assigned. Available workers:
                </p>
                {teamLoading ? (
                  <SkeletonRow cols={1} rows={3} />
                ) : team.length === 0 ? (
                  <EmptyState title="No workers" description="Invite field workers to assign cases." />
                ) : (
                  <div className="assign-panel">
                    {team.map((t) => (
                      <div key={t.id} className="worker-option">
                        <Avatar name={t.name} size="sm" />
                        <div className="worker-option__info">
                          <div className="worker-option__name">{t.name}</div>
                          <div className="worker-option__meta">
                            {workerStatus(t) === "available" ? "AVAILABLE" : "OFFLINE"} •{" "}
                            {t.role}
                          </div>
                        </div>
                        <button
                          type="button"
                          className="btn btn--primary btn--sm"
                          disabled={assigning || !t.is_active}
                          onClick={() => handleAssign(String(t.id), t.name)}
                        >
                          Assign
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Findings */}
          <div className="card">
            <div className="section-header">
              <h2 className="section-header__title">Findings</h2>
            </div>
            <p className="text-tertiary" style={{ fontSize: "var(--text-sm)" }}>
              {caseItem.transcribed_text || caseItem.description || "No findings recorded yet."}
            </p>
          </div>

          {/* GPS trail */}
          <div className="card">
            <div className="section-header">
              <h2 className="section-header__title">Location</h2>
            </div>
            <p className="mono text-secondary" style={{ fontSize: "var(--text-sm)" }}>
              {coords != null && lng != null
                ? `${Number(coords).toFixed(5)}, ${Number(lng).toFixed(5)}`
                : "No coordinates attached"}
            </p>
          </div>
        </div>
      </div>

      {/* Assign modal */}
      {assignOpen && (
        <div className="modal-backdrop" onClick={() => setAssignOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal__header">
              <h3 className="modal__title">Assign Worker</h3>
              <button type="button" className="btn btn--ghost btn--sm" onClick={() => setAssignOpen(false)}>
                <X width={14} height={14} />
              </button>
            </div>
            {assigning ? (
              <SkeletonRow cols={1} rows={3} />
            ) : team.length === 0 ? (
              <EmptyState title="No available workers" description="Invite field workers first." />
            ) : (
              <div className="assign-panel">
                {team
                  .filter((t) => t.is_active)
                  .map((t) => (
                    <div key={t.id} className="worker-option">
                      <Avatar name={t.name} size="sm" />
                      <div className="worker-option__info">
                        <div className="worker-option__name">{t.name}</div>
                        <div className="worker-option__meta">{t.role}</div>
                      </div>
                      <button
                        type="button"
                        className="btn btn--primary btn--sm"
                        onClick={() => handleAssign(String(t.id), t.name)}
                      >
                        Assign
                      </button>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function Timeline({ caseItem }: { caseItem: Alert }) {
  const events: Array<{ time: string; actor: string; text: string }> = [];
  if (caseItem.created_at)
    events.push({ time: formatShortDate(caseItem.created_at), actor: "System", text: "Case created" });
  if (caseItem.assigned_at && caseItem.assigned_staff_name)
    events.push({
      time: formatShortDate(caseItem.assigned_at),
      actor: "Admin",
      text: `Assigned to ${caseItem.assigned_staff_name}`,
    });
  if (caseItem.updated_at && caseItem.updated_at !== caseItem.created_at)
    events.push({ time: formatShortDate(caseItem.updated_at), actor: "System", text: `Status: ${String(caseItem.status).replace(/_/g, " ")}` });

  if (events.length === 0) {
    return <p className="text-tertiary" style={{ fontSize: "var(--text-sm)" }}>No timeline events recorded.</p>;
  }

  return (
    <div className="timeline">
      {events.map((e, i) => (
        <div key={i} className="timeline__item">
          <div className="timeline__gutter">
            <span className="timeline__dot" />
            {i < events.length - 1 && <span className="timeline__line" />}
          </div>
          <span className="timeline__time">{e.time}</span>
          <div className="timeline__body">
            <div className="timeline__text">{e.text}</div>
            <div className="timeline__meta">{e.actor}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
