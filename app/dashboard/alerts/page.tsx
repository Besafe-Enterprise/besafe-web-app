"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  Search,
  Filter,
  MapPin,
  Clock,
  CheckCircle2,
  Phone,
  PhoneCall,
  User,
  Map,
  X,
  Sparkles,
  Radio,
  Volume2,
  Shield,
  ShieldAlert,
  Loader2,
  ExternalLink,
  ChevronRight,
  UserCheck,
  UserPlus,
} from "lucide-react";
import { AdminPageHeader } from "@/components/shared/admin-page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  useGetAlerts,
  useUpdateAlertStatus,
  useAnalyzeAlert,
  useAssignAlert,
} from "@/lib/hooks/dispatch/use-dispatch-data";
import { useGetTeam } from "@/lib/hooks/team/use-team-data";
import { useAgencyAuthStore } from "@/lib/store/agency-auth-store";
import { timeAgo, formatDate } from "@/lib/utils/format";
import type { Alert, AlertStatus } from "@/types";

export default function AlertsManagementPage() {
  const router = useRouter();
  const currentUser = useAgencyAuthStore((s) => s.agency);


  const { data: alerts = [], isLoading, refetch } = useGetAlerts({ status: "all" });
  const { data: teamMembers = [] } = useGetTeam();
  const { mutate: updateStatus, isPending: isUpdatingStatus } = useUpdateAlertStatus();
  const { mutate: analyzeAlert, isPending: isAnalyzing } = useAnalyzeAlert();
  const { mutate: assignAlert, isPending: isAssigning } = useAssignAlert();

  // State
  const [inspectAlert, setInspectAlert] = useState<Alert | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [timeFilter, setTimeFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Time filter helper
  const now = Date.now();
  const filteredAlerts = alerts.filter((alert) => {
    const callerName = alert.user?.name || alert.user_name || "";
    const desc = alert.description || alert.transcribed_text || "";
    const alertId = String(alert.id);
    const assignedName = alert.assigned_staff_name || "";

    const matchesSearch =
      callerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      desc.toLowerCase().includes(searchQuery.toLowerCase()) ||
      assignedName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      alertId.includes(searchQuery);

    if (!matchesSearch) return false;

    // Status Filter (includes "my_assigned" filter)
    if (statusFilter === "my_assigned") {
      if (alert.assigned_staff_id !== currentUser?.id) return false;
    } else if (statusFilter !== "all" && alert.status !== statusFilter) {
      return false;
    }

    // Time Filter
    if (timeFilter !== "all" && alert.created_at) {
      const alertTime = new Date(alert.created_at).getTime();
      const diffHours = (now - alertTime) / (1000 * 60 * 60);
      if (timeFilter === "today" && diffHours > 24) return false;
      if (timeFilter === "7d" && diffHours > 24 * 7) return false;
      if (timeFilter === "30d" && diffHours > 24 * 30) return false;
    }

    return true;
  });

  const handleStatusChange = (alert: Alert, newStatus: AlertStatus) => {
    updateStatus(
      { id: alert.id, status: newStatus },
      {
        onSuccess: () => {
          if (inspectAlert?.id === alert.id) {
            setInspectAlert({ ...inspectAlert, status: newStatus });
          }
        },
      }
    );
  };

  const handleAnalyzeAlert = (alertId: string | number) => {
    analyzeAlert(alertId, {
      onSuccess: (data: any) => {
        if (inspectAlert?.id === alertId && data?.analysis) {
          setInspectAlert({
            ...inspectAlert,
            ai_analysis: data.analysis,
            analysis_status: "completed",
          });
        }
      },
    });
  };

  const handleAssignOperator = (alertId: string | number, staffId: string) => {
    const selectedMember = teamMembers.find((m) => m.id === staffId);
    assignAlert(
      {
        alertId,
        staffId: staffId === "unassign" ? null : staffId,
        staffName: staffId === "unassign" ? null : selectedMember?.name,
      },
      {
        onSuccess: () => {
          if (inspectAlert?.id === alertId) {
            setInspectAlert({
              ...inspectAlert,
              assigned_staff_id: staffId === "unassign" ? null : staffId,
              assigned_staff_name: staffId === "unassign" ? null : selectedMember?.name,
            });
          }
        },
      }
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-200">
      {/* ─── 1. Header ────────────────────────────────────────────── */}
      <AdminPageHeader
        title="Emergency Alerts & Distress Signals"
        subtitle="Manage incoming SOS alerts, trigger Explainable AI threat triage, and dispatch responders"
        action={
          <Button
            size="sm"
            onClick={() => router.push("/dashboard/map")}
            className="h-9 px-3.5 text-xs font-bold bg-primary hover:bg-primary/90 text-primary-foreground shadow-md shadow-primary/20"
          >
            <Map className="w-3.5 h-3.5 mr-1.5" />
            <span>Open Vector Radar</span>
          </Button>
        }
      />

      {/* ─── 2. Search & Multi-Dimensional Filtering Toolbar ──────── */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 p-4 rounded-2xl bg-card border border-border/80 shadow-md">
        {/* Real-time search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by caller, phrase, responder, or ID #..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-background border border-border/80 rounded-xl text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Status Tabs */}
          <div className="flex items-center gap-1 bg-muted/40 p-1 rounded-xl border border-border/60">
            {[
              { id: "all", label: "All" },
              { id: "my_assigned", label: "Assigned to Me" },
              { id: "active", label: "Active" },
              { id: "acknowledged", label: "Acknowledged" },
              { id: "resolved", label: "Resolved" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all ${
                  statusFilter === tab.id
                    ? "bg-card text-foreground font-bold shadow-sm border border-border/80"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Time Filter Selector */}
          <div className="flex items-center gap-1.5 bg-background border border-border/80 rounded-xl px-2.5 py-1.5 text-xs text-muted-foreground">
            <Clock className="w-3.5 h-3.5 text-primary" />
            <select
              value={timeFilter}
              onChange={(e) => setTimeFilter(e.target.value)}
              className="bg-transparent text-xs text-foreground focus:outline-none cursor-pointer font-medium"
            >
              <option value="all">All Time</option>
              <option value="today">Past 24 Hours</option>
              <option value="7d">Past 7 Days</option>
              <option value="30d">Past 30 Days</option>
            </select>
          </div>
        </div>
      </div>

      {/* ─── 3. Distress Signal Feed Roster ───────────────────────── */}
      <Card className="border-border/80 bg-card/90 shadow-lg backdrop-blur-md overflow-hidden">
        <CardHeader className="p-4 sm:px-5 sm:py-4 border-b border-border/80 bg-secondary/10 flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-destructive animate-pulse" />
            <CardTitle className="text-sm font-bold text-foreground">
              Distress Signal Telemetry Roster
            </CardTitle>
          </div>
          <Badge variant="outline" className="text-[10px] font-mono font-bold">
            {filteredAlerts.length} Signals Captured
          </Badge>
        </CardHeader>

        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-12 text-center text-xs text-muted-foreground flex flex-col items-center justify-center gap-2">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
              <span>Streaming active distress beacons from server...</span>
            </div>
          ) : filteredAlerts.length === 0 ? (
            <div className="p-12 text-center text-xs text-muted-foreground space-y-2">
              <Shield className="w-8 h-8 mx-auto text-muted-foreground/60" />
              <p className="font-semibold text-foreground">No alerts match the selected criteria</p>
              <p className="text-[11px]">
                {statusFilter === "my_assigned"
                  ? "You have no distress alerts assigned to you currently."
                  : "All emergency sectors are operational and quiet."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-border/60 bg-muted/20 text-muted-foreground text-[11px] font-semibold">
                    <th className="py-3 px-4">Victim / Caller</th>
                    <th className="py-3 px-4">Distress Audio / Phrase</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Assigned Operator</th>
                    <th className="py-3 px-4">AI Analysis</th>
                    <th className="py-3 px-4">Reported</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {filteredAlerts.map((alert) => {
                    const isActive = alert.status === "active";
                    const isAcknowledged = alert.status === "acknowledged";
                    const isResolved = alert.status === "resolved";
                    const hasAI = Boolean(alert.ai_analysis);

                    return (
                      <tr
                        key={alert.id}
                        onClick={() => setInspectAlert(alert)}
                        className="hover:bg-muted/40 transition-colors cursor-pointer group"
                      >
                        {/* Caller */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-[11px] border border-primary/20">
                              {(alert.user?.name || alert.user_name || "V")[0]?.toUpperCase()}
                            </div>
                            <div>
                              <p className="font-bold text-foreground">
                                {alert.user?.name || alert.user_name || `Victim #${alert.id}`}
                              </p>
                              <span className="text-[10px] text-muted-foreground font-mono">
                                {alert.user?.phone || alert.user_phone || "Direct GPS SOS"}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Transcribed Phrase */}
                        <td className="py-3.5 px-4 max-w-xs">
                          <p className="font-medium text-foreground line-clamp-1">
                            {alert.transcribed_text || alert.description || "Voice Distress Trigger: 'Help me please'"}
                          </p>
                          {alert.confidence ? (
                            <span className="text-[10px] font-mono text-emerald-400">
                              NLP Confidence: {Math.round(alert.confidence * 100)}%
                            </span>
                          ) : null}
                        </td>

                        {/* Status */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <Badge
                            variant={
                              isActive
                                ? "destructive"
                                : isAcknowledged
                                ? "warning"
                                : isResolved
                                ? "success"
                                : "secondary"
                            }
                            className="text-[10px] uppercase font-bold"
                          >
                            {alert.status}
                          </Badge>
                        </td>

                        {/* Assigned Dispatcher */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          {alert.assigned_staff_name ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-primary/10 text-primary border border-primary/20 text-[10px] font-semibold">
                              <UserCheck className="w-3 h-3" />
                              {alert.assigned_staff_name}
                            </span>
                          ) : (
                            <span className="text-[10px] text-muted-foreground italic">
                              Unassigned
                            </span>
                          )}
                        </td>

                        {/* AI Status */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          {hasAI ? (
                            <Badge
                              variant="outline"
                              className="text-[10px] font-semibold border-indigo-500/30 text-indigo-400 bg-indigo-500/10 flex items-center gap-1 w-fit"
                            >
                              <Sparkles className="w-3 h-3 text-indigo-400" />
                              <span>Triaged (L{alert.ai_analysis?.severity_rating || 3})</span>
                            </Badge>
                          ) : (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleAnalyzeAlert(alert.id);
                              }}
                              disabled={isAnalyzing}
                              className="px-2 py-0.5 rounded text-[10px] font-semibold bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground border border-border/80 flex items-center gap-1 transition-colors"
                            >
                              <Sparkles className="w-3 h-3 text-primary" />
                              <span>Run AI Triage</span>
                            </button>
                          )}
                        </td>

                        {/* Timestamp */}
                        <td className="py-3.5 px-4 text-[11px] text-muted-foreground whitespace-nowrap">
                          {timeAgo(alert.created_at)}
                        </td>

                        {/* Inspect Button */}
                        <td className="py-3.5 px-4 text-right">
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={(e) => {
                              e.stopPropagation();
                              setInspectAlert(alert);
                            }}
                            className="h-7 px-2.5 text-xs font-semibold"
                          >
                            <span>Inspect</span>
                            <ChevronRight className="w-3 h-3 ml-1 text-muted-foreground" />
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ─── 4. Incident Deep Inspection Drawer / Modal ───────────── */}
      {inspectAlert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in-50">
          <div className="max-w-2xl w-full max-h-[90vh] overflow-y-auto rounded-2xl bg-card border border-border/80 p-6 shadow-2xl space-y-5">
            {/* Header */}
            <div className="flex items-start justify-between pb-3 border-b border-border/60">
              <div>
                <span className="text-[10px] font-mono text-primary font-bold uppercase">
                  Incident Triage Dossier #{inspectAlert.id}
                </span>
                <h3 className="text-base font-bold text-foreground mt-0.5">
                  {inspectAlert.transcribed_text ||
                    inspectAlert.description ||
                    "Emergency Distress Beacon"}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setInspectAlert(null)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Caller Identity & Emergency Contacts */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              {/* Citizen Details */}
              <div className="p-3.5 rounded-xl bg-background/80 border border-border/60 space-y-2">
                <span className="text-muted-foreground font-semibold text-[10px] uppercase">
                  Citizen Information
                </span>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-primary/20 text-primary flex items-center justify-center font-bold text-xs">
                    {(inspectAlert.user?.name || inspectAlert.user_name || "U")[0]?.toUpperCase()}
                  </div>
                  <div>
                    <p className="font-bold text-foreground">
                      {inspectAlert.user?.name || inspectAlert.user_name || "Anonymous Citizen"}
                    </p>
                    <a
                      href={`tel:${inspectAlert.user?.phone || inspectAlert.user_phone}`}
                      className="text-emerald-400 hover:underline font-mono text-[11px] flex items-center gap-1"
                    >
                      <PhoneCall className="w-3 h-3" />
                      <span>
                        {inspectAlert.user?.phone || inspectAlert.user_phone || "No phone listed"}
                      </span>
                    </a>
                  </div>
                </div>
              </div>

              {/* Status & Priority */}
              <div className="p-3.5 rounded-xl bg-background/80 border border-border/60 space-y-2">
                <span className="text-muted-foreground font-semibold text-[10px] uppercase">
                  Incident Classification
                </span>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Current Status:</span>
                  <Badge
                    variant={inspectAlert.status === "active" ? "destructive" : "secondary"}
                    className="text-[9px] uppercase font-bold"
                  >
                    {inspectAlert.status}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Reported:</span>
                  <span className="font-mono text-foreground text-[11px]">
                    {formatDate(inspectAlert.created_at)}
                  </span>
                </div>
              </div>
            </div>

            {/* Operator Assignment Panel */}
            <div className="p-3.5 rounded-xl bg-background/80 border border-border/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
              <div className="space-y-0.5">
                <span className="text-muted-foreground font-semibold text-[10px] uppercase flex items-center gap-1.5">
                  <UserPlus className="w-3 h-3 text-primary" />
                  Assigned Station Responder
                </span>
                <p className="font-bold text-foreground">
                  {inspectAlert.assigned_staff_name ? (
                    <span className="text-primary flex items-center gap-1">
                      <UserCheck className="w-3.5 h-3.5" />
                      {inspectAlert.assigned_staff_name}
                    </span>
                  ) : (
                    <span className="text-muted-foreground italic">
                      No operator assigned yet
                    </span>
                  )}
                </p>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <select
                  value={inspectAlert.assigned_staff_id || "unassign"}
                  disabled={isAssigning}
                  onChange={(e) => handleAssignOperator(inspectAlert.id, e.target.value)}
                  className="px-3 py-1.5 rounded-xl bg-card border border-border/80 text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-primary font-medium"
                >
                  <option value="unassign">-- Unassigned --</option>
                  {teamMembers.map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.name} ({member.role})
                    </option>
                  ))}
                </select>

                {currentUser && inspectAlert.assigned_staff_id !== currentUser.id && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleAssignOperator(inspectAlert.id, currentUser.id)}
                    className="h-8 px-2.5 text-xs font-semibold border-primary/40 text-primary hover:bg-primary/10 whitespace-nowrap"
                  >
                    Assign to Me
                  </Button>
                )}
              </div>
            </div>

            {/* GPS Telemetry & Live Radar Shortcut */}
            <div className="p-3.5 rounded-xl bg-background/80 border border-border/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
              <div className="space-y-0.5">
                <span className="text-muted-foreground font-semibold text-[10px] uppercase flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-destructive" /> GPS Coordinates
                </span>
                <p className="font-mono text-primary font-bold">
                  {(inspectAlert.location?.latitude || inspectAlert.location?.lat || 0).toFixed(6)}°,{" "}
                  {(inspectAlert.location?.longitude || inspectAlert.location?.lng || 0).toFixed(6)}°
                </p>
                <p className="text-muted-foreground text-[11px]">
                  {inspectAlert.location?.address || "Reverse-geocoded coordinates"}
                </p>
              </div>

              <Link
                href="/dashboard/map"
                onClick={() => setInspectAlert(null)}
                className="px-3 py-1.5 rounded-xl bg-primary/20 hover:bg-primary/30 border border-primary/40 text-primary font-bold text-xs flex items-center gap-1.5 transition-colors self-end sm:self-auto"
              >
                <Map className="w-3.5 h-3.5" />
                <span>Track on Live Radar</span>
              </Link>
            </div>

            {/* Explainable AI (XAI) Threat Assessment Dossier */}
            <div className="p-4 rounded-xl bg-secondary/15 border border-primary/20 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-indigo-400" />
                  <span className="font-bold text-xs text-foreground">
                    Explainable AI (XAI) Threat Assessment
                  </span>
                </div>
                {!inspectAlert.ai_analysis && (
                  <Button
                    size="sm"
                    onClick={() => handleAnalyzeAlert(inspectAlert.id)}
                    disabled={isAnalyzing}
                    className="h-7 px-3 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white"
                  >
                    {isAnalyzing ? "Analyzing..." : "Trigger AI Triage"}
                  </Button>
                )}
              </div>

              {inspectAlert.ai_analysis ? (
                <div className="space-y-3 text-xs">
                  {/* Severity & Threat Rating */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <div className="p-2 rounded-lg bg-background/60 border border-border/40">
                      <span className="text-[10px] text-muted-foreground uppercase">
                        Severity Rating
                      </span>
                      <p className="text-sm font-bold text-destructive font-mono">
                        Level {inspectAlert.ai_analysis.severity_rating || 3} / 5
                      </p>
                    </div>

                    <div className="p-2 rounded-lg bg-background/60 border border-border/40">
                      <span className="text-[10px] text-muted-foreground uppercase">
                        Threat Pattern
                      </span>
                      <p className="text-xs font-bold text-foreground truncate">
                        {inspectAlert.ai_analysis.identified_pattern_type || "Immediate Distress"}
                      </p>
                    </div>

                    <div className="p-2 rounded-lg bg-background/60 border border-border/40">
                      <span className="text-[10px] text-muted-foreground uppercase">
                        Escalation Risk
                      </span>
                      <p className="text-xs font-bold text-amber-400 capitalize">
                        {inspectAlert.ai_analysis.escalation_risk || "High"}
                      </p>
                    </div>

                    <div className="p-2 rounded-lg bg-background/60 border border-border/40">
                      <span className="text-[10px] text-muted-foreground uppercase">
                        Urgency Window
                      </span>
                      <p className="text-xs font-bold text-emerald-400 capitalize">
                        {inspectAlert.ai_analysis.timeline_urgency || "Immediate"}
                      </p>
                    </div>
                  </div>

                  {/* AI Narrative Breakdown */}
                  {inspectAlert.ai_analysis.explainable_ai_report && (
                    <div className="p-3 rounded-lg bg-background/90 border border-border/60 text-xs text-foreground/90 leading-relaxed">
                      <p className="font-semibold text-primary text-[11px] mb-1">
                        AI Reasoning & Investigative Assessment:
                      </p>
                      <p className="text-[11px]">
                        {inspectAlert.ai_analysis.explainable_ai_report}
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-[11px] text-muted-foreground italic">
                  No AI triage generated yet. Click "Trigger AI Triage" to run neural evaluation.
                </p>
              )}
            </div>

            {/* Action Bar (Acknowledge / Resolve) */}
            <div className="flex items-center justify-between pt-3 border-t border-border/60">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setInspectAlert(null)}
                className="h-8 px-3 text-xs"
              >
                Close
              </Button>

              <div className="flex items-center gap-2">
                {inspectAlert.status === "active" && (
                  <Button
                    size="sm"
                    disabled={isUpdatingStatus}
                    onClick={() => handleStatusChange(inspectAlert, "acknowledged")}
                    className="h-8 px-3 text-xs font-semibold bg-amber-500 hover:bg-amber-600 text-white"
                  >
                    Acknowledge Signal
                  </Button>
                )}

                {inspectAlert.status !== "resolved" && (
                  <Button
                    size="sm"
                    disabled={isUpdatingStatus}
                    onClick={() => handleStatusChange(inspectAlert, "resolved")}
                    className="h-8 px-3 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    Mark as Resolved
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
