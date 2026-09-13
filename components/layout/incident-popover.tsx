"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  FileText,
  ChevronRight,
  MapPin,
  Clock,
  ShieldCheck,
  Radio,
  ExternalLink,
  ChevronDown,
} from "lucide-react";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { useGetAlerts, useGetReports, useGetDashboardStats } from "@/lib/hooks/dispatch/use-dispatch-data";
import { timeAgo } from "@/lib/utils/format";

export function IncidentPopover() {
  const router = useRouter();
  const { data: stats } = useGetDashboardStats();
  const { data: alerts = [] } = useGetAlerts({ status: "all" });
  const { data: reports = [] } = useGetReports({ status: "all" });
  const [activeTab, setActiveTab] = useState<"alerts" | "reports">("alerts");

  const activeAlerts = alerts.filter(
    (a) => a.status === "active" || a.priority === "high"
  );
  const pendingReports = reports.filter(
    (r) => r.status === "pending" || r.status === "pending_analysis" || r.status === "investigating"
  );

  const totalIncidents = activeAlerts.length + pendingReports.length;

  return (
    <Popover>
      <PopoverTrigger className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-border/80 bg-background/70 hover:bg-secondary/40 transition-all text-xs font-semibold select-none">
        {totalIncidents > 0 ? (
          <>
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-destructive"></span>
            </span>
            <span className="text-foreground">
              {totalIncidents} Active Incident{totalIncidents > 1 ? "s" : ""}
            </span>
            <ChevronDown className="w-3 h-3 text-muted-foreground" />
          </>
        ) : (
          <>
            <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
            <span className="text-muted-foreground font-medium">All Sectors Monitored</span>
            <ChevronDown className="w-3 h-3 text-muted-foreground" />
          </>
        )}
      </PopoverTrigger>

      <PopoverContent align="end" side="bottom" className="w-80 sm:w-96 p-0 overflow-hidden">
        {/* Header & Tabs */}
        <div className="p-3 border-b border-border/70 bg-background/50">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-foreground">
              Live Incident Triage
            </span>
            <span className="text-[10px] font-mono text-muted-foreground">
              {totalIncidents} Pending Review
            </span>
          </div>

          <div className="grid grid-cols-2 gap-1.5 p-1 rounded-xl bg-secondary/30 border border-border/60">
            <button
              type="button"
              onClick={() => setActiveTab("alerts")}
              className={`flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === "alerts"
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5 text-destructive" />
              <span>SOS Alerts ({activeAlerts.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("reports")}
              className={`flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === "reports"
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <FileText className="w-3.5 h-3.5 text-indigo-400" />
              <span>SafeChat ({pendingReports.length})</span>
            </button>
          </div>
        </div>

        {/* Content List */}
        <div className="max-h-64 overflow-y-auto divide-y divide-border/40 p-1">
          {activeTab === "alerts" ? (
            activeAlerts.length > 0 ? (
              activeAlerts.map((alert) => (
                <div
                  key={alert.id}
                  onClick={() => router.push("/dashboard/alerts")}
                  className="p-3 hover:bg-muted/40 transition-colors cursor-pointer rounded-xl space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-foreground truncate max-w-[170px]">
                      {alert.user?.name || `Distress #${alert.id}`}
                    </span>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-destructive/15 text-destructive border border-destructive/20 uppercase">
                      {alert.priority || "HIGH"}
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground line-clamp-1">
                    {alert.description || "Distress trigger activated"}
                  </p>
                  <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-1">
                    <span className="truncate max-w-[180px]">
                      📍 {alert.location?.address || "Coordinates pinned"}
                    </span>
                    <span>{timeAgo(alert.created_at)}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-6 text-center text-xs text-muted-foreground">
                <ShieldCheck className="w-6 h-6 mx-auto mb-1.5 text-emerald-400 opacity-80" />
                <span>No active emergency SOS triggers</span>
              </div>
            )
          ) : pendingReports.length > 0 ? (
            pendingReports.map((report) => (
              <div
                key={report.id}
                onClick={() => router.push("/dashboard/reports")}
                className="p-3 hover:bg-muted/40 transition-colors cursor-pointer rounded-xl space-y-1"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-foreground capitalize truncate max-w-[170px]">
                    {report.category?.replace(/-/g, " ") || "Citizen Report"}
                  </span>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-indigo-500/15 text-indigo-400 border border-indigo-500/20 uppercase">
                    {report.status}
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground line-clamp-2">
                  {report.description}
                </p>
                <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-1">
                  <span>Report #{report.id}</span>
                  <span>{timeAgo(report.createdAt || report.created_at)}</span>
                </div>
              </div>
            ))
          ) : (
            <div className="p-6 text-center text-xs text-muted-foreground">
              <ShieldCheck className="w-6 h-6 mx-auto mb-1.5 text-emerald-400 opacity-80" />
              <span>All SafeChat reports triaged</span>
            </div>
          )}
        </div>

        {/* Footer Links */}
        <div className="p-2 border-t border-border/70 bg-background/70 flex items-center justify-between text-xs">
          <Link
            href="/dashboard/alerts"
            className="px-2.5 py-1.5 rounded-lg text-muted-foreground hover:text-foreground font-semibold hover:bg-secondary/60 transition-colors"
          >
            All Alerts →
          </Link>
          <Link
            href="/dashboard/reports"
            className="px-2.5 py-1.5 rounded-lg text-primary hover:text-primary/90 font-semibold hover:bg-primary/10 transition-colors"
          >
            All Reports →
          </Link>
        </div>
      </PopoverContent>
    </Popover>
  );
}
