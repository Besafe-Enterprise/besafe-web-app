"use client";

import { useState } from "react";
import {
  Users,
  UserPlus,
  ShieldCheck,
  Radio,
  MoreVertical,
  CheckCircle2,
  XCircle,
  Loader2,
  Mail,
  Phone,
  Lock,
  X,
  User,
} from "lucide-react";
import { AdminPageHeader } from "@/components/shared/admin-page-header";
import { AdminStatCard } from "@/components/shared/admin-stat-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import {
  useGetAgencyTeam,
  useAddTeamMember,
  useUpdateStaffStatus,
} from "@/lib/hooks/team/use-team-data";
import { useAgencyAuthStore } from "@/lib/store/agency-auth-store";
import { formatDate } from "@/lib/utils/format";

export default function StationTeamPage() {
  const currentAgency = useAgencyAuthStore((s) => s.agency);
  const { data: team = [], isLoading } = useGetAgencyTeam();
  const { mutate: addMember, isPending: isAdding } = useAddTeamMember();
  const { mutate: updateStatus, isPending: isUpdatingStatus } = useUpdateStaffStatus();

  // Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone_number: "",
    password: "",
  });

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.password) return;

    addMember(
      {
        ...formData,
        role: "DISPATCHER",
      },
      {
        onSuccess: () => {
          setIsAddModalOpen(false);
          setFormData({
            name: "",
            email: "",
            phone_number: "",
            password: "",
          });
        },
      }
    );
  };

  const dispatchersCount = team.length;
  const activeCount = team.filter((m) => m.is_active).length;

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-200">
      {/* ─── 1. Header ────────────────────────────────────────────── */}
      <AdminPageHeader
        title="Station Team & Dispatchers"
        subtitle="Manage responder roster and provision frontline dispatch operators for this station"
        action={
          <Button
            size="sm"
            onClick={() => setIsAddModalOpen(true)}
            className="h-9 px-3.5 text-xs font-bold bg-primary hover:bg-primary/90 text-primary-foreground shadow-md shadow-primary/20"
          >
            <UserPlus className="w-3.5 h-3.5 mr-1.5" />
            <span>Add Dispatcher</span>
          </Button>
        }
      />

      {/* ─── 2. Metric Row ────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <AdminStatCard
          label="Active Dispatchers"
          value={isLoading ? "..." : activeCount}
          icon={Users}
          accentColor="primary"
          trend={{
            value: "ONLINE",
            isPositive: true,
            description: "Frontline responders",
          }}
          subtext="Total station roster"
        />

        <AdminStatCard
          label="Total Dispatchers"
          value={isLoading ? "..." : dispatchersCount}
          icon={Radio}
          accentColor="indigo"
          subtext="Authorized station operators"
        />

        <AdminStatCard
          label="Station Administrator"
          value="1"
          icon={ShieldCheck}
          accentColor="emerald"
          trend={{
            value: "CREATOR",
            isPositive: true,
            description: currentAgency?.name || "Station Lead",
          }}
          subtext="Full station administrator"
        />
      </div>

      {/* ─── 3. Staff Roster Table ─────────────────────────────────── */}
      <Card className="border-border/80 bg-card/90 shadow-lg backdrop-blur-md overflow-hidden">
        <CardHeader className="p-4 sm:px-5 sm:py-4 border-b border-border/80 bg-secondary/10">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
                <Users className="w-4 h-4 text-primary" />
                <span>Station Dispatchers</span>
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                Frontline responders authorized to triage emergency alerts and SafeChat reports
              </CardDescription>
            </div>
            <Badge variant="outline" className="text-[10px] font-mono font-bold">
              {team.length} Dispatchers
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-12 text-center text-xs text-muted-foreground flex flex-col items-center justify-center gap-2">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
              <span>Loading station personnel...</span>
            </div>
          ) : team.length === 0 ? (
            <div className="p-12 text-center text-xs text-muted-foreground space-y-3">
              <Users className="w-10 h-10 mx-auto text-muted-foreground/50" />
              <p className="font-semibold text-foreground">No dispatchers added yet</p>
              <p className="text-muted-foreground max-w-sm mx-auto">
                Invite frontline operators to monitor the live radar and triage incoming distress signals alongside you.
              </p>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsAddModalOpen(true)}
                className="mt-2"
              >
                <UserPlus className="w-3.5 h-3.5 mr-1.5" />
                <span>Add First Dispatcher</span>
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-border/60 bg-muted/20 text-muted-foreground uppercase tracking-wider font-semibold text-[10px]">
                    <th className="py-3 px-4">Dispatcher</th>
                    <th className="py-3 px-4">Role</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Phone</th>
                    <th className="py-3 px-4">Date Added</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {team.map((member) => (
                    <tr
                      key={member.id}
                      className="hover:bg-muted/30 transition-colors"
                    >
                      {/* Name & Email */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 text-primary flex items-center justify-center font-bold text-xs">
                            {member.name[0]?.toUpperCase() || "D"}
                          </div>
                          <div>
                            <p className="font-bold text-foreground text-xs">
                              {member.name}
                            </p>
                            <p className="text-[11px] text-muted-foreground font-mono">
                              {member.email}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Role Badge */}
                      <td className="py-3.5 px-4">
                        <Badge
                          variant="secondary"
                          className="text-[10px] font-bold tracking-wide"
                        >
                          DISPATCHER
                        </Badge>
                      </td>

                      {/* Status Badge */}
                      <td className="py-3.5 px-4">
                        {member.is_active ? (
                          <span className="inline-flex items-center gap-1.5 text-emerald-400 font-semibold text-[11px]">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-destructive font-semibold text-[11px]">
                            <XCircle className="w-3.5 h-3.5" /> Suspended
                          </span>
                        )}
                      </td>

                      {/* Phone */}
                      <td className="py-3.5 px-4 text-[11px] text-muted-foreground font-mono">
                        {member.phone_number || "—"}
                      </td>

                      {/* Date Joined */}
                      <td className="py-3.5 px-4 text-[11px] text-muted-foreground">
                        {formatDate(member.created_at)}
                      </td>

                      {/* Actions Dropdown */}
                      <td className="py-3.5 px-4 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger className="p-1.5 rounded-lg hover:bg-secondary/60 text-muted-foreground hover:text-foreground">
                            <MoreVertical className="w-4 h-4" />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-44 p-1">
                            {/* Status Toggle Option */}
                            {member.is_active ? (
                              <DropdownMenuItem
                                onClick={() =>
                                  updateStatus({
                                    staffId: member.id,
                                    isActive: false,
                                  })
                                }
                                disabled={isUpdatingStatus}
                                className="text-destructive hover:bg-destructive/10 hover:text-destructive focus:bg-destructive/10 focus:text-destructive"
                              >
                                <XCircle className="w-3.5 h-3.5 mr-2" />
                                <span>Revoke Access</span>
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem
                                onClick={() =>
                                  updateStatus({
                                    staffId: member.id,
                                    isActive: true,
                                  })
                                }
                                disabled={isUpdatingStatus}
                                className="text-emerald-400 hover:bg-emerald-500/10 focus:bg-emerald-500/10"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5 mr-2" />
                                <span>Reactivate Access</span>
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ─── 4. Add Dispatcher Modal ───────────────────────────────── */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in-50">
          <div className="max-w-md w-full rounded-2xl bg-card border border-border/80 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border/60">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-primary/20 text-primary flex items-center justify-center font-bold text-xs">
                  <UserPlus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-foreground">
                    Add Station Dispatcher
                  </h3>
                  <p className="text-[10px] text-muted-foreground">
                    Provision frontline dispatcher credentials for this station
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-3.5 text-xs">
              {/* Full Name */}
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-foreground flex items-center gap-1.5">
                  <User className="w-3 h-3 text-muted-foreground" />
                  <span>Full Name</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="e.g. Officer James Doe"
                  className="w-full px-3 py-2 rounded-xl bg-background border border-border/80 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              {/* Email */}
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-foreground flex items-center gap-1.5">
                  <Mail className="w-3 h-3 text-muted-foreground" />
                  <span>Official Email Address</span>
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  placeholder="e.g. j.doe@police.gov"
                  className="w-full px-3 py-2 rounded-xl bg-background border border-border/80 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              {/* Phone */}
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-foreground flex items-center gap-1.5">
                  <Phone className="w-3 h-3 text-muted-foreground" />
                  <span>Phone Number (Optional)</span>
                </label>
                <input
                  type="tel"
                  value={formData.phone_number}
                  onChange={(e) =>
                    setFormData({ ...formData, phone_number: e.target.value })
                  }
                  placeholder="e.g. +234 801 234 5678"
                  className="w-full px-3 py-2 rounded-xl bg-background border border-border/80 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              {/* Password */}
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-foreground flex items-center gap-1.5">
                  <Lock className="w-3 h-3 text-muted-foreground" />
                  <span>Temporary Passcode</span>
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  placeholder="Minimum 6 characters"
                  className="w-full px-3 py-2 rounded-xl bg-background border border-border/80 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              {/* Form Actions */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-border/60">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsAddModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={isAdding}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold"
                >
                  {isAdding ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                      <span>Creating...</span>
                    </>
                  ) : (
                    <span>Create Dispatcher Account</span>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
