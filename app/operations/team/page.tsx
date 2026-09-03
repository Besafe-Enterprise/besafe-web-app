"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useGetAgencyTeam, useAddTeamMember } from "@/lib/hooks/team/use-team-data";
import { Avatar } from "@/components/operations/shared/Avatar";
import { Badge } from "@/components/operations/shared/Badge";
import { EmptyState } from "@/components/operations/shared/EmptyState";
import { SkeletonRow } from "@/components/operations/shared/LoadingSkeleton";
import { formatShortDate } from "@/lib/operations/utils";
import { toast } from "sonner";
import { Plus, X } from "lucide-react";

export default function TeamPage() {
  const { data: team = [], isLoading } = useGetAgencyTeam();
  const { mutate: addMember, isPending } = useAddTeamMember();
  const [inviteOpen, setInviteOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<"DISPATCHER" | "AGENCY_ADMIN">("DISPATCHER");

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
          setRole("DISPATCHER");
        },
      }
    );
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

      {isLoading ? (
        <SkeletonRow cols={6} rows={6} />
      ) : team.length === 0 ? (
        <div className="card">
          <EmptyState title="No team members" description="Invite your first agency member to begin." />
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Role</th>
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
                    <Badge variant={t.is_active ? "available" : "offline"} tone="worker">
                      {t.is_active ? "ACTIVE" : "INACTIVE"}
                    </Badge>
                  </td>
                  <td>{formatShortDate(t.updated_at)}</td>
                  <td>{formatShortDate(t.created_at)}</td>
                  <td>
                    <Link
                      href={`/operations/caseworkers/${t.id}`}
                      className="btn btn--ghost btn--sm"
                      onClick={(e) => e.stopPropagation()}
                    >
                      View Worker
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {inviteOpen && (
        <div className="modal-backdrop" onClick={() => setInviteOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal__header">
              <h3 className="modal__title">Invite Member</h3>
              <button type="button" className="btn btn--ghost btn--sm" onClick={() => setInviteOpen(false)}>
                <X width={14} height={14} />
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
                <select id="invite-role" className="input" value={role} onChange={(e) => setRole(e.target.value as "DISPATCHER" | "AGENCY_ADMIN")}>
                  <option value="DISPATCHER">Field Worker / Dispatcher</option>
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
    </div>
  );
}
