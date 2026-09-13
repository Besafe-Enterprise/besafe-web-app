"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  FileText,
  CheckCircle2,
  BarChart3,
  RefreshCw,
  Map,
  ShieldCheck,
  ChevronRight,
  User,
  Phone,
  Clock,
  Radio,
  ArrowRight,
  ShieldAlert,
  Loader2,
  TrendingUp,
  Activity,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AdminPageHeader } from "@/components/shared/admin-page-header";
import { AdminStatCard } from "@/components/shared/admin-stat-card";
import { QuickMapModal } from "@/components/map/QuickMapModal";
import {
  useGetDashboardStats,
  useGetAlerts,
  useGetReports,
  useUpdateAlertStatus,
  useUpdateReportStatus,
} from "@/lib/hooks/dispatch/use-dispatch-data";
import { useAgencyAuthStore } from "@/lib/store/agency-auth-store";
import { timeAgo } from "@/lib/utils/format";
import type { Alert, Report } from "@/types";

export default function OverviewDashboardPage() {
  const router = useRouter();
  const user = useAgencyAuthStore((s) => s.user);
  const agency = useAgencyAuthStore((s) => s.agency);
  const isDispatcher = user?.role === "DISPATCHER";

  // Queries from live Flask API (127.0.0.1:5000)
  const {
    data: stats,
    isLoading: isStatsLoading,
    refetch: refetchStats,
    isRefetching: isStatsRefetching,
  } = useGetDashboardStats();

  const {
    data: alerts = [],
    isLoading: isAlertsLoading,
    refetch: refetchAlerts,
  } = useGetAlerts({ status: "active" });

  const {
    data: reports = [],
    isLoading: isReportsLoading,
    refetch: refetchReports,
  } = useGetReports({ status: "pending_analysis" });

  const { mutate: updateAlertStatus, isPending: isUpdatingAlert } =
    useUpdateAlertStatus();
  const { mutate: updateReportStatus, isPending: isUpdatingReport } =
    useUpdateReportStatus();

  const [selectedAlertForMap, setSelectedAlertForMap] = useState<Alert | null>(
    null
  );
  const [isMapModalOpen, setIsMapModalOpen] = useState(false);

  const handleRefreshAll = () => {
    refetchStats();
    refetchAlerts();
    refetchReports();
  };

  const handleOpenAlertMap = (alert: Alert) => {
    setSelectedAlertForMap(alert);
    setIsMapModalOpen(true);
  };

  const isRefreshing = isStatsRefetching;

  // Dedicated server stats
  const activeAlertsCount = stats?.active_alerts ?? stats?.active ?? alerts.length;
  const pendingReportsCount = stats?.pending_reports ?? stats?.pending ?? reports.length;
  const resolvedTodayCount = stats?.resolved_today ?? stats?.resolved ?? 0;
  const totalAllTimeCount = stats?.total_all_time ?? stats?.total ?? 0;

  const recentAlerts = alerts.slice(0, 7);
  const recentReports = reports.slice(0, 7);

  // Trend & Analytics Data from Real Database Aggregation
  const weeklyVolume = stats?.weekly_volume && stats.weekly_volume.length > 0
    ? stats.weekly_volume
    : [
        { day: "Mon", count: 0, date: "" },
        { day: "Tue", count: 0, date: "" },
        { day: "Wed", count: 0, date: "" },
        { day: "Thu", count: 0, date: "" },
        { day: "Fri", count: 0, date: "" },
        { day: "Sat", count: 0, date: "" },
        { day: "Sun", count: 0, date: "" },
      ];

  const maxWeekly = Math.max(...weeklyVolume.map((d) => d.count), 1);
  const peakDay = weeklyVolume.reduce(
    (max, item) => (item.count > max.count ? item : max),
    weeklyVolume[0]
  );

  const categories = stats?.category_distribution && stats.category_distribution.length > 0
    ? stats.category_distribution
    : [
        { label: "Voice Threat SOS", count: 0, percentage: "0%", color: "bg-destructive" },
        { label: "Harassment Reports", count: 0, percentage: "0%", color: "bg-primary" },
        { label: "Domestic Disturbance", count: 0, percentage: "0%", color: "bg-amber-500" },
        { label: "Unsafe Ride Distress", count: 0, percentage: "0%", color: "bg-indigo-400" },
      ];

  const headerTitle = isDispatcher
    ? `Operator Console • ${user?.name || "Dispatcher"}`
    : "Command Center Overview";

  const headerSubtitle = isDispatcher
    ? `Agency: ${agency?.name || user?.agency_name || "Headquarters"} • Live dispatch telemetry and incident coordination`
    : `Agency: ${agency?.name || "Headquarters"} • Real-time emergency telemetry, active distress alerts, and SafeChat citizen reports`;

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-200">
      {/* ─── 1. Page Header ────────────────────────────────────────── */}
      <AdminPageHeader
        title={headerTitle}
        subtitle={headerSubtitle}
        action={
          <div className="flex items-center gap-2.5">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefreshAll}
              disabled={isRefreshing}
              className="h-9 px-3 text-xs font-semibold border-border/80 bg-card hover:bg-secondary/60 text-foreground"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 mr-1.5 ${
                  isRefreshing ? "animate-spin text-primary" : "text-muted-foreground"
                }`}
              />
              <span>{isRefreshing ? "Refreshing..." : "Refresh Feed"}</span>
            </Button>

            <Button
              size="sm"
              onClick={() => router.push("/dashboard/map")}
              className="h-9 px-3.5 text-xs font-bold bg-destructive hover:bg-destructive/90 text-white shadow-md shadow-destructive/20"
            >
              <Map className="w-3.5 h-3.5 mr-1.5" />
              <span>Full Radar Map</span>
            </Button>
          </div>
        }
      />

      {/* ─── 2. 4-Card Stat HUD Metric Row ─────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Active Alerts */}
        <AdminStatCard
          label="Active SOS Alerts"
          value={isStatsLoading ? "..." : activeAlertsCount}
          icon={AlertTriangle}
          accentColor="destructive"
          trend={
            activeAlertsCount > 0
              ? { value: "URGENT", isPositive: false, description: "Requires Immediate Triage" }
              : { value: "SECURE", isPositive: true, description: "All Sectors Clear" }
          }
          subtext={
            <span className="flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-destructive animate-ping inline-block" />
              Direct GPS SOS triggers
            </span>
          }
          onClick={() => router.push("/dashboard/alerts")}
        />

        {/* Card 2: Pending SafeChat Reports */}
        <AdminStatCard
          label="Pending Reports"
          value={isStatsLoading ? "..." : pendingReportsCount}
          icon={FileText}
          accentColor="indigo"
          trend={{
            value: `${pendingReportsCount} Reports`,
            isPositive: pendingReportsCount === 0,
            description: "Citizen incident flags",
          }}
          subtext="SafeChat qualitative reports"
          onClick={() => router.push("/dashboard/reports")}
        />

        {/* Card 3: Resolved Incidents */}
        <AdminStatCard
          label="Resolved Today"
          value={isStatsLoading ? "..." : resolvedTodayCount}
          icon={CheckCircle2}
          accentColor="emerald"
          trend={{
            value: "CLOSED",
            isPositive: true,
            description: "Resolved within 24h",
          }}
          subtext="Cleared emergency actions"
        />

        {/* Card 4: Total All Time */}
        <AdminStatCard
          label="Total All Time"
          value={isStatsLoading ? "..." : totalAllTimeCount}
          icon={BarChart3}
          accentColor="primary"
          subtext={
            <span className="flex items-center gap-1 text-[11px] text-primary">
              <Radio className="w-3 h-3" /> Station Grid 100% Operational
            </span>
          }
        />
      </div>

      {/* ─── 3. Analytics & Incident Trends Section ────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Weekly Incident Bar Chart */}
        <Card className="lg:col-span-7 border-border/80 bg-card/90 shadow-lg backdrop-blur-md overflow-hidden p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3 border-b border-border/60">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary/15 text-primary flex items-center justify-center font-bold">
                <TrendingUp className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-foreground">
                  Weekly Emergency Volume Trend
                </h3>
                <p className="text-[10px] text-muted-foreground">
                  Aggregated incident triggers over the past 7 days
                </p>
              </div>
            </div>
            <span className="text-[10px] font-mono font-bold text-primary px-2 py-0.5 rounded bg-primary/10 border border-primary/20">
              {peakDay?.count && peakDay.count > 0 ? `Peak: ${peakDay.day} (${peakDay.count})` : "Normal Grid Volume"}
            </span>
          </div>

          <div className="h-44 flex items-end justify-between gap-2.5 pt-6 pb-1">
            {weeklyVolume.map((item, idx) => {
              const heightPct = item.count > 0 ? Math.max(Math.round((item.count / maxWeekly) * 100), 12) : 6;
              return (
                <div key={idx} className="flex-1 flex flex-col items-center gap-1.5 group">
                  <span className="text-[10px] font-mono text-muted-foreground group-hover:text-foreground font-bold transition-colors">
                    {item.count}
                  </span>
                  <div className="w-full bg-muted/40 rounded-xl h-28 flex items-end p-1">
                    <div
                      style={{ height: `${heightPct}%` }}
                      className={`w-full rounded-lg transition-all duration-300 shadow-sm ${
                        item.count > 0
                          ? "bg-gradient-to-t from-primary/80 to-primary group-hover:from-destructive/80 group-hover:to-destructive"
                          : "bg-muted/60"
                      }`}
                      title={`${item.day} (${item.date || ""}): ${item.count} incidents`}
                    />
                  </div>
                  <span className="text-[11px] font-semibold text-muted-foreground">
                    {item.day}
                  </span>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Threat Category Distribution */}
        <Card className="lg:col-span-5 border-border/80 bg-card/90 shadow-lg backdrop-blur-md overflow-hidden p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3 border-b border-border/60">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-500/15 text-indigo-400 flex items-center justify-center font-bold">
                <Activity className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-foreground">
                  Threat Category Distribution
                </h3>
                <p className="text-[10px] text-muted-foreground">
                  Classification breakdown by trigger source
                </p>
              </div>
            </div>
            <Badge variant="outline" className="text-[10px] font-mono font-bold">
              {totalAllTimeCount} Total
            </Badge>
          </div>

          <div className="space-y-3 pt-3">
            {categories.map((cat, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-foreground font-semibold text-[11px]">
                    {cat.label}
                  </span>
                  <span className="text-muted-foreground font-mono text-[10px]">
                    {cat.count} ({cat.percentage})
                  </span>
                </div>
                <div className="h-1.5 rounded-full bg-muted/50 overflow-hidden">
                  <div
                    style={{ width: cat.percentage }}
                    className={`h-full rounded-full ${cat.color}`}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>


      {/* ─── 4. Dual-Panel Overview (Alerts & Reports) ──────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ════ LEFT PANEL: RECENT EMERGENCY ALERTS ════ */}
        <Card className="border-border/80 bg-card/90 shadow-lg backdrop-blur-md overflow-hidden flex flex-col">
          <div className="p-4 sm:px-5 sm:py-4 border-b border-border/80 flex items-center justify-between bg-secondary/10">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-destructive/15 text-destructive border border-destructive/20">
                <AlertTriangle className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-foreground">
                  Recent Emergency Alerts
                </h2>
                <p className="text-[11px] text-muted-foreground">
                  Active distress triggers requiring station dispatch
                </p>
              </div>
            </div>

            <Link
              href="/dashboard/alerts"
              className="text-xs font-semibold text-primary hover:text-primary/90 flex items-center gap-1 hover:underline"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <CardContent className="p-0 flex-1 divide-y divide-border/40 overflow-y-auto max-h-[420px]">
            {isAlertsLoading ? (
              <div className="p-8 text-center text-xs text-muted-foreground flex flex-col items-center justify-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin text-primary" />
                <span>Loading emergency alerts stream...</span>
              </div>
            ) : alerts.length > 0 ? (
              recentAlerts.map((alert) => {
                const isActive = alert.status === "active";
                const isAcknowledged = alert.status === "acknowledged";
                const isResolved = alert.status === "resolved";

                return (
                  <div
                    key={alert.id}
                    className="p-4 hover:bg-muted/40 transition-colors flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                  >
                    <div className="space-y-1.5 min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-primary" />
                          {alert.user?.name || `Victim #${alert.id}`}
                        </span>
                        <Badge
                          variant={
                            isActive
                              ? "destructive"
                              : isAcknowledged
                              ? "warning"
                              : "success"
                          }
                          className="text-[10px] uppercase font-bold"
                        >
                          {alert.status}
                        </Badge>
                        <span className="text-[10px] text-muted-foreground font-mono">
                          {timeAgo(alert.created_at)}
                        </span>
                      </div>

                      <p className="text-xs text-foreground/90 font-medium line-clamp-1">
                        {alert.description || "Voice Distress Trigger: 'Help me please'"}
                      </p>

                      <div className="flex items-center gap-3 text-[11px] text-muted-foreground flex-wrap">
                        {alert.location?.address && (
                          <span className="truncate max-w-[200px]">
                            📍 {alert.location.address}
                          </span>
                        )}
                        {alert.user?.phone && (
                          <span className="font-mono text-primary flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            {alert.user.phone}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleOpenAlertMap(alert)}
                        className="h-8 px-2.5 text-xs border-border bg-background hover:bg-secondary/60 text-foreground"
                      >
                        <Map className="w-3.5 h-3.5 mr-1 text-primary" />
                        <span>Map Pin</span>
                      </Button>

                      {isActive && (
                        <Button
                          size="sm"
                          disabled={isUpdatingAlert}
                          onClick={() =>
                            updateAlertStatus({ id: alert.id, status: "acknowledged" })
                          }
                          className="h-8 px-2.5 text-xs font-semibold bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30"
                        >
                          Acknowledge
                        </Button>
                      )}

                      {isAcknowledged && (
                        <Button
                          size="sm"
                          disabled={isUpdatingAlert}
                          onClick={() =>
                            updateAlertStatus({ id: alert.id, status: "resolved" })
                          }
                          className="h-8 px-2.5 text-xs font-semibold bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30"
                        >
                          Resolve
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-10 text-center text-xs text-muted-foreground space-y-2">
                <ShieldCheck className="w-8 h-8 mx-auto text-emerald-400 opacity-90" />
                <p className="font-semibold text-foreground">
                  No Active Emergency Alerts
                </p>
                <p className="text-[11px]">
                  All sectors in your jurisdiction are safe and quiet.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* ════ RIGHT PANEL: RECENT SAFECHAT CITIZEN REPORTS ════ */}
        <Card className="border-border/80 bg-card/90 shadow-lg backdrop-blur-md overflow-hidden flex flex-col">
          <div className="p-4 sm:px-5 sm:py-4 border-b border-border/80 flex items-center justify-between bg-secondary/10">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/15 text-indigo-400 border border-indigo-500/20">
                <FileText className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-foreground">
                  Recent SafeChat Reports
                </h2>
                <p className="text-[11px] text-muted-foreground">
                  Anonymous citizen community flags & hazard triage
                </p>
              </div>
            </div>

            <Link
              href="/dashboard/reports"
              className="text-xs font-semibold text-primary hover:text-primary/90 flex items-center gap-1 hover:underline"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <CardContent className="p-0 flex-1 divide-y divide-border/40 overflow-y-auto max-h-[420px]">
            {isReportsLoading ? (
              <div className="p-8 text-center text-xs text-muted-foreground flex flex-col items-center justify-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin text-primary" />
                <span>Loading citizen reports stream...</span>
              </div>
            ) : reports.length > 0 ? (
              recentReports.map((report) => (
                <div
                  key={report.id}
                  className="p-4 hover:bg-muted/40 transition-colors flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1.5 min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-foreground capitalize">
                        {report.category?.replace(/-/g, " ") || "Citizen Report"}
                      </span>
                      <Badge
                        variant={
                          report.status === "pending" || report.status === "pending_analysis"
                            ? "warning"
                            : report.status === "resolved" || report.status === "closed"
                            ? "success"
                            : "secondary"
                        }
                        className="text-[10px] uppercase font-bold"
                      >
                        {report.status}
                      </Badge>
                      <span className="text-[10px] text-muted-foreground font-mono">
                        {timeAgo(report.createdAt || report.created_at)}
                      </span>
                    </div>

                    <p className="text-xs text-foreground/90 font-medium line-clamp-2 leading-relaxed">
                      {report.description}
                    </p>

                    <div className="text-[10px] text-muted-foreground font-mono">
                      Report ID #{report.id}
                    </div>
                  </div>

                  <div className="shrink-0 self-end sm:self-center">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => router.push(`/dashboard/reports`)}
                      className="h-8 px-3 text-xs border-primary/30 text-primary hover:bg-primary/10"
                    >
                      <span>Triage</span>
                      <ChevronRight className="w-3 h-3 ml-1" />
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-10 text-center text-xs text-muted-foreground space-y-2">
                <ShieldCheck className="w-8 h-8 mx-auto text-emerald-400 opacity-90" />
                <p className="font-semibold text-foreground">
                  All Citizen Reports Triaged
                </p>
                <p className="text-[11px]">
                  No pending qualitative reports in your jurisdiction.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ─── 5. Quick Map Telemetry Modal ──────────────────────────── */}
      <QuickMapModal
        isOpen={isMapModalOpen}
        onClose={() => {
          setIsMapModalOpen(false);
          setSelectedAlertForMap(null);
        }}
        selectedAlert={selectedAlertForMap}
        alerts={alerts}
        agencyLocation={
          agency
            ? {
                latitude: agency.location?.lat || agency.latitude || 15.5007,
                longitude: agency.location?.lng || agency.longitude || 32.5599,
                name: agency.name,
              }
            : undefined
        }
      />
    </div>
  );
}
