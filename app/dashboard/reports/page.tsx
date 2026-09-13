"use client";

import { useState } from "react";
import {
  MessageSquare,
  Search,
  Filter,
  FileText,
  Clock,
  Shield,
  ShieldAlert,
  CheckCircle2,
  AlertCircle,
  X,
  Sparkles,
  Paperclip,
  Volume2,
  Image as ImageIcon,
  MapPin,
  ExternalLink,
  Loader2,
  ChevronRight,
  Eye,
  Calendar,
  Activity,
  Phone,
  User,
  UserCheck,
  UserPlus,
} from "lucide-react";
import { AdminPageHeader } from "@/components/shared/admin-page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  useGetReports,
  useUpdateReportStatus,
  useAnalyzeReport,
  useAssignReport,
} from "@/lib/hooks/dispatch/use-dispatch-data";
import { useGetTeam } from "@/lib/hooks/team/use-team-data";
import { useAgencyAuthStore } from "@/lib/store/agency-auth-store";
import { timeAgo, formatDate } from "@/lib/utils/format";
import type { Report } from "@/types";

// Category Icons & Color Mapping
const CATEGORY_CONFIG: Record<
  string,
  { label: string; icon: any; color: string; bg: string }
> = {
  harassment: {
    label: "Harassment & Stalking",
    icon: ShieldAlert,
    color: "text-red-400",
    bg: "bg-red-500/10 border-red-500/20",
  },
  domestic_violence: {
    label: "Domestic Abuse / Dispute",
    icon: AlertCircle,
    color: "text-amber-400",
    bg: "bg-amber-500/10 border-amber-500/20",
  },
  abuse: {
    label: "Domestic Abuse / Dispute",
    icon: AlertCircle,
    color: "text-amber-400",
    bg: "bg-amber-500/10 border-amber-500/20",
  },
  "abuse-home": {
    label: "Domestic Abuse / Dispute",
    icon: AlertCircle,
    color: "text-amber-400",
    bg: "bg-amber-500/10 border-amber-500/20",
  },
  assault: {
    label: "Assault / Physical Hazard",
    icon: ShieldAlert,
    color: "text-red-500",
    bg: "bg-red-600/10 border-red-600/20",
  },
  transport: {
    label: "Unsafe Ride / Transit",
    icon: Activity,
    color: "text-indigo-400",
    bg: "bg-indigo-500/10 border-indigo-500/20",
  },
  community: {
    label: "Community / Neighborhood Concern",
    icon: MessageSquare,
    color: "text-blue-400",
    bg: "bg-blue-500/10 border-blue-500/20",
  },
};

export default function SafeChatReportsPage() {
  const currentUser = useAgencyAuthStore((s) => s.agency);


  const { data: reports = [], isLoading, refetch } = useGetReports();
  const { data: teamMembers = [] } = useGetTeam();
  const { mutate: updateStatus, isPending: isUpdatingStatus } = useUpdateReportStatus();
  const { mutate: analyzeReport, isPending: isAnalyzing } = useAnalyzeReport();
  const { mutate: assignReport, isPending: isAssigning } = useAssignReport();

  // State
  const [inspectReport, setInspectReport] = useState<Report | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [timeFilter, setTimeFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const now = Date.now();
  const filteredReports = reports.filter((r) => {
    const desc = r.description || "";
    const category = r.category || "";
    const id = String(r.id);
    const assignedName = r.assigned_staff_name || "";

    const matchesSearch =
      desc.toLowerCase().includes(searchQuery.toLowerCase()) ||
      category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      assignedName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      id.includes(searchQuery);

    if (!matchesSearch) return false;

    // Status Filter (includes "my_assigned" tab)
    if (statusFilter === "my_assigned") {
      if (r.assigned_staff_id !== currentUser?.id) return false;
    } else if (statusFilter !== "all") {
      if (statusFilter === "pending_analysis" && (r.status === "pending" || r.status === "pending_analysis")) {
        // match
      } else if (r.status !== statusFilter) {
        return false;
      }
    }

    // Time Filter
    const timestamp = r.createdAt || r.created_at;
    if (timeFilter !== "all" && timestamp) {
      const reportTime = new Date(timestamp).getTime();
      const diffHours = (now - reportTime) / (1000 * 60 * 60);
      if (timeFilter === "today" && diffHours > 24) return false;
      if (timeFilter === "7d" && diffHours > 24 * 7) return false;
      if (timeFilter === "30d" && diffHours > 24 * 30) return false;
    }

    return true;
  });

  const handleStatusChange = (
    report: Report,
    newStatus: "triaged" | "reviewing" | "resolved" | "closed" | "investigating" | "pending"
  ) => {
    updateStatus(
      { id: report.id, status: newStatus },
      {
        onSuccess: () => {
          if (inspectReport?.id === report.id) {
            setInspectReport({ ...inspectReport, status: newStatus });
          }
        },
      }
    );
  };

  const handleAnalyzeReport = (reportId: string | number) => {
    analyzeReport(reportId, {
      onSuccess: (data: any) => {
        if (inspectReport?.id === reportId && data?.analysis) {
          setInspectReport({
            ...inspectReport,
            ai_Analysis: data.analysis,
            status: "triaged",
          });
        }
      },
    });
  };

  const handleAssignOperator = (reportId: string | number, staffId: string) => {
    const selectedMember = teamMembers.find((m) => m.id === staffId);
    assignReport(
      {
        reportId,
        staffId: staffId === "unassign" ? null : staffId,
        staffName: staffId === "unassign" ? null : selectedMember?.name,
      },
      {
        onSuccess: () => {
          if (inspectReport?.id === reportId) {
            setInspectReport({
              ...inspectReport,
              assigned_staff_id: staffId === "unassign" ? null : staffId,
              assigned_staff_name: staffId === "unassign" ? null : selectedMember?.name,
            });
          }
        },
      }
    );
  };

  const getCategoryMeta = (cat: string) => {
    return (
      CATEGORY_CONFIG[cat.toLowerCase()] || {
        label: cat.replace(/[-_]/g, " ").toUpperCase(),
        icon: MessageSquare,
        color: "text-primary",
        bg: "bg-primary/10 border-primary/20",
      }
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-200">
      {/* ─── 1. Header ────────────────────────────────────────────── */}
      <AdminPageHeader
        title="SafeChat Intelligence & Reports"
        subtitle="Review qualitative citizen incident descriptions, examine multimedia evidence attachments, and initiate investigations"
      />

      {/* ─── 2. Search & Filter Bar ───────────────────────────────── */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 p-4 rounded-2xl bg-card border border-border/80 shadow-md">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search report descriptions, categories, responders, or ID #..."
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
          <div className="flex items-center gap-1 bg-muted/40 p-1 rounded-xl border border-border/60 overflow-x-auto">
            {[
              { id: "all", label: "All" },
              { id: "my_assigned", label: "Assigned to Me" },
              { id: "pending_analysis", label: "Pending" },
              { id: "triaged", label: "Triaged" },
              { id: "reviewing", label: "Reviewing" },
              { id: "resolved", label: "Resolved" },
              { id: "closed", label: "Closed" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all whitespace-nowrap ${
                  statusFilter === tab.id
                    ? "bg-card text-foreground font-bold shadow-sm border border-border/80"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Time Selector */}
          <div className="flex items-center gap-1.5 bg-background border border-border/80 rounded-xl px-2.5 py-1.5 text-xs text-muted-foreground">
            <Clock className="w-3.5 h-3.5 text-primary" />
            <select
              value={timeFilter}
              onChange={(e) => setTimeFilter(e.target.value)}
              className="bg-transparent text-xs text-foreground focus:outline-none cursor-pointer font-medium"
            >
              <option value="all">All Time</option>
              <option value="today">Past 24h</option>
              <option value="7d">Past 7 Days</option>
              <option value="30d">Past 30 Days</option>
            </select>
          </div>
        </div>
      </div>

      {/* ─── 3. SafeChat Intelligence Feed Table ──────────────────── */}
      <Card className="border-border/80 bg-card/90 shadow-lg backdrop-blur-md overflow-hidden">
        <CardHeader className="p-4 sm:px-5 sm:py-4 border-b border-border/80 bg-secondary/10 flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-indigo-400" />
            <CardTitle className="text-sm font-bold text-foreground">
              Qualitative Incident Reports Feed
            </CardTitle>
          </div>
          <Badge variant="outline" className="text-[10px] font-mono font-bold">
            {filteredReports.length} Reports Filed
          </Badge>
        </CardHeader>

        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-12 text-center text-xs text-muted-foreground flex flex-col items-center justify-center gap-2">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
              <span>Streaming SafeChat intelligence from server...</span>
            </div>
          ) : filteredReports.length === 0 ? (
            <div className="p-12 text-center text-xs text-muted-foreground space-y-2">
              <Shield className="w-8 h-8 mx-auto text-muted-foreground/60" />
              <p className="font-semibold text-foreground">No reports match your filters</p>
              <p className="text-[11px]">
                {statusFilter === "my_assigned"
                  ? "You have no citizen reports assigned to you currently."
                  : "All citizen safety reports have been triaged."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-border/60 bg-muted/20 text-muted-foreground text-[11px] font-semibold">
                    <th className="py-3 px-4">Category & Classification</th>
                    <th className="py-3 px-4">Citizen Narrative</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Assigned Investigator</th>
                    <th className="py-3 px-4">Evidence</th>
                    <th className="py-3 px-4">AI Analysis</th>
                    <th className="py-3 px-4">Filed</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {filteredReports.map((report) => {
                    const meta = getCategoryMeta(report.category);
                    const CategoryIcon = meta.icon;
                    const hasAI = Boolean(report.ai_Analysis || report.ai_analysis);
                    const attachmentCount = report.attachments?.length || 0;

                    return (
                      <tr
                        key={report.id}
                        onClick={() => setInspectReport(report)}
                        className="hover:bg-muted/40 transition-colors cursor-pointer group"
                      >
                        {/* Category */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <div
                              className={`w-7 h-7 rounded-lg flex items-center justify-center border ${meta.bg}`}
                            >
                              <CategoryIcon className={`w-3.5 h-3.5 ${meta.color}`} />
                            </div>
                            <span className="font-bold text-foreground capitalize">
                              {meta.label}
                            </span>
                          </div>
                        </td>

                        {/* Narrative */}
                        <td className="py-3.5 px-4 max-w-sm">
                          <p className="font-medium text-foreground line-clamp-1">
                            {report.description}
                          </p>
                          <span className="text-[10px] text-muted-foreground">
                            ID #{report.id} • {report.timing || "Recent Incident"}
                          </span>
                        </td>

                        {/* Status */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <Badge
                            variant={
                              report.status === "pending" || report.status === "pending_analysis"
                                ? "warning"
                                : report.status === "triaged"
                                ? "outline"
                                : report.status === "reviewing"
                                ? "secondary"
                                : "success"
                            }
                            className="text-[10px] uppercase font-bold"
                          >
                            {report.status}
                          </Badge>
                        </td>

                        {/* Assigned Investigator */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          {report.assigned_staff_name ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-primary/10 text-primary border border-primary/20 text-[10px] font-semibold">
                              <UserCheck className="w-3 h-3" />
                              {report.assigned_staff_name}
                            </span>
                          ) : (
                            <span className="text-[10px] text-muted-foreground italic">
                              Unassigned
                            </span>
                          )}
                        </td>

                        {/* Evidence Attachments */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          {attachmentCount > 0 ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-muted text-muted-foreground font-mono text-[10px] font-semibold border border-border/60">
                              <Paperclip className="w-3 h-3 text-primary" />
                              {attachmentCount} Files
                            </span>
                          ) : (
                            <span className="text-[10px] text-muted-foreground">None</span>
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
                              <span>Triaged</span>
                            </Badge>
                          ) : (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleAnalyzeReport(report.id);
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
                          {timeAgo(report.createdAt || report.created_at)}
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-4 text-right">
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={(e) => {
                              e.stopPropagation();
                              setInspectReport(report);
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

      {/* ─── 4. SafeChat Deep Dossier Modal ───────────────────────── */}
      {inspectReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in-50">
          <div className="max-w-2xl w-full max-h-[90vh] overflow-y-auto rounded-2xl bg-card border border-border/80 p-6 shadow-2xl space-y-5">
            {/* Header */}
            <div className="flex items-start justify-between pb-3 border-b border-border/60">
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center border ${
                    getCategoryMeta(inspectReport.category).bg
                  }`}
                >
                  <FileText
                    className={`w-4 h-4 ${
                      getCategoryMeta(inspectReport.category).color
                    }`}
                  />
                </div>
                <div>
                  <span className="text-[10px] font-mono text-primary font-bold uppercase">
                    SafeChat Report #{inspectReport.id}
                  </span>
                  <h3 className="text-sm font-bold text-foreground">
                    {getCategoryMeta(inspectReport.category).label}
                  </h3>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setInspectReport(null)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Citizen Description Narrative */}
            <div className="p-4 rounded-xl bg-background/90 border border-border/60 space-y-2">
              <span className="text-[10px] font-semibold uppercase text-muted-foreground flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-primary" /> Citizen Incident Narrative
              </span>
              <p className="text-xs text-foreground/95 leading-relaxed font-normal">
                "{inspectReport.description}"
              </p>
              <div className="flex items-center gap-4 text-[10px] text-muted-foreground font-mono pt-1">
                <span>Timing: {inspectReport.timing || "Not specified"}</span>
                <span>Frequency: {inspectReport.frequency || "Single occurrence"}</span>
              </div>
            </div>

            {/* Operator Assignment Panel */}
            <div className="p-3.5 rounded-xl bg-background/80 border border-border/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
              <div className="space-y-0.5">
                <span className="text-muted-foreground font-semibold text-[10px] uppercase flex items-center gap-1.5">
                  <UserPlus className="w-3 h-3 text-primary" />
                  Assigned Case Investigator
                </span>
                <p className="font-bold text-foreground">
                  {inspectReport.assigned_staff_name ? (
                    <span className="text-primary flex items-center gap-1">
                      <UserCheck className="w-3.5 h-3.5" />
                      {inspectReport.assigned_staff_name}
                    </span>
                  ) : (
                    <span className="text-muted-foreground italic">
                      No investigator assigned yet
                    </span>
                  )}
                </p>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <select
                  value={inspectReport.assigned_staff_id || "unassign"}
                  disabled={isAssigning}
                  onChange={(e) => handleAssignOperator(inspectReport.id, e.target.value)}
                  className="px-3 py-1.5 rounded-xl bg-card border border-border/80 text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-primary font-medium"
                >
                  <option value="unassign">-- Unassigned --</option>
                  {teamMembers.map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.name} ({member.role})
                    </option>
                  ))}
                </select>

                {currentUser && inspectReport.assigned_staff_id !== currentUser.id && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleAssignOperator(inspectReport.id, currentUser.id)}
                    className="h-8 px-2.5 text-xs font-semibold border-primary/40 text-primary hover:bg-primary/10 whitespace-nowrap"
                  >
                    Assign to Me
                  </Button>
                )}
              </div>
            </div>

            {/* Multimedia Evidence Vault */}
            <div className="p-4 rounded-xl bg-background/80 border border-border/60 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-semibold uppercase text-muted-foreground flex items-center gap-1.5">
                  <Paperclip className="w-3.5 h-3.5 text-primary" /> Vaulted Evidence Files
                </span>
                <span className="text-[10px] font-mono text-muted-foreground">
                  {inspectReport.attachments?.length || 0} Attachments
                </span>
              </div>

              {inspectReport.attachments && inspectReport.attachments.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {inspectReport.attachments.map((file, idx) => {
                    const fileUrl = file.url || file.file_url || file.uri || "#";
                    const fileName = file.filename || file.name || `Attachment-${idx + 1}`;
                    const isAudio = file.type?.includes("audio") || file.file_type?.includes("audio");

                    return (
                      <a
                        key={idx}
                        href={fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="p-2.5 rounded-lg bg-card hover:bg-muted/60 border border-border/60 flex items-center justify-between text-xs transition-colors group"
                      >
                        <div className="flex items-center gap-2 truncate">
                          {isAudio ? (
                            <Volume2 className="w-4 h-4 text-emerald-400 shrink-0" />
                          ) : (
                            <ImageIcon className="w-4 h-4 text-primary shrink-0" />
                          )}
                          <span className="truncate font-medium text-foreground group-hover:text-primary">
                            {fileName}
                          </span>
                        </div>
                        <ExternalLink className="w-3.5 h-3.5 text-muted-foreground group-hover:text-foreground shrink-0 ml-2" />
                      </a>
                    );
                  })}
                </div>
              ) : (
                <p className="text-[11px] text-muted-foreground italic">
                  No multimedia evidence attached to this report.
                </p>
              )}
            </div>

            {/* Explainable AI Threat Dossier */}
            <div className="p-4 rounded-xl bg-secondary/15 border border-primary/20 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-indigo-400" />
                  <span className="font-bold text-xs text-foreground">
                    Explainable AI (XAI) Threat Evaluation
                  </span>
                </div>
                {!inspectReport.ai_Analysis && !inspectReport.ai_analysis && (
                  <Button
                    size="sm"
                    onClick={() => handleAnalyzeReport(inspectReport.id)}
                    disabled={isAnalyzing}
                    className="h-7 px-3 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white"
                  >
                    {isAnalyzing ? "Evaluating..." : "Run AI Triage"}
                  </Button>
                )}
              </div>

              {inspectReport.ai_Analysis || inspectReport.ai_analysis ? (
                <div className="space-y-3 text-xs">
                  {/* Rating grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <div className="p-2 rounded-lg bg-background/60 border border-border/40">
                      <span className="text-[10px] text-muted-foreground uppercase">Severity</span>
                      <p className="text-sm font-bold text-amber-400 font-mono">
                        Level {(inspectReport.ai_Analysis || inspectReport.ai_analysis)?.severity_rating || 2} / 5
                      </p>
                    </div>

                    <div className="p-2 rounded-lg bg-background/60 border border-border/40">
                      <span className="text-[10px] text-muted-foreground uppercase">Threat Type</span>
                      <p className="text-xs font-bold text-foreground truncate">
                        {(inspectReport.ai_Analysis || inspectReport.ai_analysis)?.identified_pattern_type || "Citizen Concern"}
                      </p>
                    </div>

                    <div className="p-2 rounded-lg bg-background/60 border border-border/40">
                      <span className="text-[10px] text-muted-foreground uppercase">Escalation</span>
                      <p className="text-xs font-bold text-amber-400 capitalize">
                        {(inspectReport.ai_Analysis || inspectReport.ai_analysis)?.escalation_risk || "Low"}
                      </p>
                    </div>

                    <div className="p-2 rounded-lg bg-background/60 border border-border/40">
                      <span className="text-[10px] text-muted-foreground uppercase">Urgency</span>
                      <p className="text-xs font-bold text-emerald-400 capitalize">
                        {(inspectReport.ai_Analysis || inspectReport.ai_analysis)?.timeline_urgency || "Monitoring"}
                      </p>
                    </div>
                  </div>

                  {/* AI Narrative */}
                  {(inspectReport.ai_Analysis || inspectReport.ai_analysis)?.explainable_ai_report && (
                    <div className="p-3 rounded-lg bg-background/90 border border-border/60 text-xs text-foreground/90 leading-relaxed">
                      <p className="font-semibold text-primary text-[11px] mb-1">
                        Neural Threat Assessment:
                      </p>
                      <p className="text-[11px]">
                        {(inspectReport.ai_Analysis || inspectReport.ai_analysis)?.explainable_ai_report}
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-[11px] text-muted-foreground italic">
                  Report not yet evaluated by AI. Click "Run AI Triage" to execute pattern detection.
                </p>
              )}
            </div>

            {/* Action Bar (Status Progression) */}
            <div className="flex items-center justify-between pt-3 border-t border-border/60">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setInspectReport(null)}
                className="h-8 px-3 text-xs"
              >
                Close
              </Button>

              <div className="flex items-center gap-2">
                {inspectReport.status !== "reviewing" && (
                  <Button
                    size="sm"
                    disabled={isUpdatingStatus}
                    onClick={() => handleStatusChange(inspectReport, "reviewing")}
                    className="h-8 px-3 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white"
                  >
                    Mark Reviewing
                  </Button>
                )}

                {inspectReport.status !== "resolved" && (
                  <Button
                    size="sm"
                    disabled={isUpdatingStatus}
                    onClick={() => handleStatusChange(inspectReport, "resolved")}
                    className="h-8 px-3 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    Mark Resolved
                  </Button>
                )}

                {inspectReport.status !== "closed" && (
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={isUpdatingStatus}
                    onClick={() => handleStatusChange(inspectReport, "closed")}
                    className="h-8 px-3 text-xs font-semibold"
                  >
                    Close Report
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
