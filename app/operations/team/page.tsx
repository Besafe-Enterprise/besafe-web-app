"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  useGetAgencyTeam,
  useAddTeamMember,
  useRemoveTeamMember,
  useGetStaffApplications,
  useApproveStaffApplication,
  useRejectStaffApplication,
} from "@/lib/hooks/team/use-team-data";
import { Avatar } from "@/components/operations/shared/Avatar";
import { Badge } from "@/components/operations/shared/Badge";
import { EmptyState } from "@/components/operations/shared/EmptyState";
import { SkeletonRow } from "@/components/operations/shared/LoadingSkeleton";
import { formatShortDate } from "@/lib/operations/utils";
import { useAgencyAuthStore } from "@/lib/store/agency-auth-store";
import { toast } from "sonner";
import { Plus, X, Check, UserPlus, Trash2 } from "lucide-react";

export default function TeamPage() {
  const { data: team = [], isLoading } = useGetAgencyTeam();
  const { mutate: addMember, isPending } = useAddTeamMember();
  const { data: applications = [], isLoading: appsLoading } = useGetStaffApplications("pending");
  const { mutate: approveApp, isPending: approving } = useApproveStaffApplication();
  const { mutate: rejectApp, isPending: rejecting } = useRejectStaffApplication();
  const { mutate: removeMember, isPending: removing } = useRemoveTeamMember();
  const currentUserId = useAgencyAuthStore((s) => s.user?.id);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<"AGENCY_ADMIN" | "FIELD_AGENT">("FIELD_AGENT");
  const [removeTarget, setRemoveTarget] = useState<{ id: string; name: string } | null>(null);

  const submitInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !name.trim()) {
      toast.error("Name and email are required");
      return;
    }
    addMember(
      { name: name.trim(), email: email.trim(), role },
      {
        onSuccess: () => {
          setInviteOpen(false);
          setEmail("");
          setName("");
          setRole("FIELD_AGENT");
        },
      }
    );
  };

  const confirmRemove = () => {
    if (!removeTarget) return;
    removeMember(removeTarget.id, {
      onSuccess: () => setRemoveTarget(null),
    });
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-header__title">Team</h1>
          <p className="page-header__subtitle">Manage agency staff and access</p>
        </div>
        <div className="page-header__actions">
          <button type="button" className="btn btn--primary btn--sm" onClick={() => setInviteOpen(true)}>
            <Plus width={14} height={14} /> Invite Member
          </button>
        </div>
      </div>

      {/* Pending field-worker applications */}
      <div style={{ marginBottom: "var(--space-6)" }}>
        <div className="page-section-title" style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <UserPlus width={16} height={16} />
          <span>Field Worker Applications</span>
          {applications.length > 0 && <Badge variant="active" tone="status">{applications.length}</Badge>}
        </div>

        {appsLoading ? (
          <SkeletonRow cols={4} rows={2} />
        ) : applications.length === 0 ? (
          <div className="card">
            <EmptyState
              title="No pending applications"
              description="Field workers who request to join your agency will appear here for approval."
            />
          </div>
        ) : (
          <div className="card" style={{ padding: 0, overflow: "hidden" }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Applicant</th>
                  <th>Role</th>
                  <th>Requested</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {applications.map((app) => (
                  <tr key={app.id}>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <Avatar name={app.name} size="sm" />
                        <div>
                          <div>{app.name}</div>
                          <div className="text-tertiary" style={{ fontSize: "var(--text-xs)" }}>{app.email}</div>
                          {app.phone_number && <div className="text-tertiary" style={{ fontSize: "var(--text-xs)" }}>{app.phone_number}</div>}
                        </div>
                      </div>
                    </td>
                    <td>{app.role || "FIELD_AGENT"}</td>
                    <td>{formatShortDate(app.created_at)}</td>
                    <td>
                      <div style={{ display: "flex", gap: 8 }}>
                        <button
                          type="button"
                          className="btn btn--primary btn--sm"
                          disabled={approving || rejecting}
                          onClick={() => approveApp(app.id)}
                        >
                          <Check width={14} height={14} /> Approve
                        </button>
                        <button
                          type="button"
                          className="btn btn--danger btn--sm"
                          disabled={approving || rejecting}
                          onClick={() => rejectApp(app.id)}
                        >
                          <X width={14} height={14} /> Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {isLoading ? (
        <SkeletonRow cols={6} rows={6} />
      ) : team.length === 0 ? (
        <div className="card">
          <EmptyState title="No team members" description="Invite your first agency member to begin." />
        </div>
      ) : (
        <div className="card" style={{ padding: "var(--space-4)", overflow: "hidden", }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Role</th>
                <th>Cases</th>
                <th>Status</th>
                <th>Last Updated</th>
                <th>Created</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {team.map((t) => (
                <tr key={t.id}>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <Avatar name={t.name} size="sm" />
                      <div>
                        <div>{t.name}</div>
                        <div className="text-tertiary" style={{ fontSize: "var(--text-xs)" }}>{t.email}</div>
                      </div>
                    </div>
                  </td>
                  <td>{t.role}</td>
                  <td>
                    <Badge variant={(t.active_cases ?? 0) > 0 ? "active" : "secondary"} tone="status">
                      {t.active_cases ?? 0}
                    </Badge>
                  </td>
                  <td>
                    <Badge variant={t.is_active ? "available" : "offline"} tone="worker">
                      {t.is_active ? "ACTIVE" : "INACTIVE"}
                    </Badge>
                  </td>
                  <td>{formatShortDate(t.updated_at)}</td>
                  <td>{formatShortDate(t.created_at)}</td>
                  <td>
                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      <Link
                        href={`/operations/caseworkers/${t.id}`}
                        className="btn btn--ghost btn--sm"
                        onClick={(e) => e.stopPropagation()}
                      >
                        View Worker
                      </Link>
                      {t.role === "FIELD_AGENT" && t.id !== currentUserId && (
                        <button
                          type="button"
                          className="btn btn--danger btn--sm"
                          disabled={removing}
                          onClick={(e) => {
                            e.stopPropagation();
                            setRemoveTarget({ id: t.id, name: t.name });
                          }}
                        >
                          <Trash2 width={14} height={14} /> Remove
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {inviteOpen && (
        <div className="modal-backdrop" onClick={() => setInviteOpen(false)} style={{marginTop: "var(--space-6)" }}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal__header" style={{ display: "flex" }}>
              <h3 className="modal__title" style={{marginBottom:"var(--space-4"}}>Invite Member</h3>
              <button type="button" className="btn btn--ghost btn--sm" onClick={() => setInviteOpen(false)} style={{alignItems: "end", marginLeft: "auto"}}>
                <X width={14} height={14} style={{}} />
              </button>
            </div>
            <form onSubmit={submitInvite} style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
              <div>
                <label className="label" htmlFor="invite-name">Full Name</label>
                <input id="invite-name" className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Jane Doe" />
              </div>
              <div>
                <label className="label" htmlFor="invite-email">Email Address</label>
                <input id="invite-email" className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="worker@agency.gov" />
              </div>
              <div>
                <label className="label" htmlFor="invite-role">Role</label>
                <select id="invite-role" className="input" value={role} onChange={(e) => setRole(e.target.value as "AGENCY_ADMIN" | "FIELD_AGENT")}>
                  <option value="FIELD_AGENT">Field Worker</option>
                  <option value="AGENCY_ADMIN">Agency Admin</option>
                </select>
              </div>
              <button type="submit" className="btn btn--primary" disabled={isPending}>
                {isPending ? "Sending..." : "Send Invitation"}
              </button>
            </form>
          </div>
        </div>
      )}

      {removeTarget && (
        <div className="modal-backdrop" onClick={() => setRemoveTarget(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal__header">
              <h3 className="modal__title">Remove Field Worker</h3>
              <button type="button" className="btn btn--ghost btn--sm" onClick={() => setRemoveTarget(null)}>
                <X width={14} height={14} />
              </button>
            </div>
            <p style={{ fontSize: "var(--text-sm)", color: "var(--text-secondary)", marginBottom: "var(--space-4)" }}>
              Are you sure you want to remove <strong>{removeTarget.name}</strong>? This permanently deletes their
              field worker account and revokes access.
            </p>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "var(--space-2)" }}>
              <button type="button" className="btn btn--ghost" onClick={() => setRemoveTarget(null)}>
                Cancel
              </button>
              <button type="button" className="btn btn--danger" disabled={removing} onClick={confirmRemove}>
                <Trash2 width={14} height={14} /> {removing ? "Removing..." : "Remove"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
