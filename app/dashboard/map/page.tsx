"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import {
  Radio,
  User,
  PhoneCall,
  MapPin,
  Clock,
  Layers,
  Search,
  CheckCircle2,
  AlertTriangle,
  Send,
  XCircle,
  Loader2,
  Shield,
} from "lucide-react";
import { AdminPageHeader } from "@/components/shared/admin-page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useAgencyAuthStore } from "@/lib/store/agency-auth-store";
import { useGetAlerts, useUpdateAlertStatus } from "@/lib/hooks/dispatch/use-dispatch-data";
import { timeAgo } from "@/lib/utils/format";
import type { Alert, AlertStatus } from "@/types";

const MapboxView = dynamic(() => import("@/components/map/MapboxView"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full min-h-[500px] flex items-center justify-center bg-card rounded-2xl border border-border/80">
      <div className="flex items-center space-x-3 text-muted-foreground">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        <span className="text-sm font-semibold">Initializing Vector Command Radar...</span>
      </div>
    </div>
  ),
});

export default function LiveVectorRadarPage() {
  const agency = useAgencyAuthStore((s) => s.agency);
  const { data: alerts = [], isLoading, refetch } = useGetAlerts({ status: "all" });
  const { mutate: updateStatus, isPending: isUpdating } = useUpdateAlertStatus();

  const [selectedAlertId, setSelectedAlertId] = useState<string | number | null>(null);
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "dispatched">("all");
  const [mapStyle, setMapStyle] = useState<"dark" | "satellite" | "streets">("dark");
  const [searchQuery, setSearchQuery] = useState("");

  // Extract Agency Command Center Database Coordinates
  const agencyLat = Number(
    agency?.location?.latitude ?? agency?.location?.lat ?? agency?.latitude ?? 8.92997
  );
  const agencyLng = Number(
    agency?.location?.longitude ?? agency?.location?.lng ?? agency?.longitude ?? 7.515401
  );

  const filteredAlerts = alerts.filter((a) => {
    const callerName = a.user?.name || a.user_name || "";
    const desc = a.transcribed_text || a.description || "";
    const id = String(a.id);

    const matchesSearch =
      callerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      desc.toLowerCase().includes(searchQuery.toLowerCase()) ||
      id.includes(searchQuery);

    if (!matchesSearch) return false;
    if (filterStatus === "active") return a.status === "active";
    if (filterStatus === "dispatched") return a.status === "dispatched";
    return true;
  });

  const selectedAlert =
    alerts.find((a) => String(a.id) === String(selectedAlertId)) ||
    filteredAlerts[0] ||
    null;

  const handleStatusChange = (newStatus: AlertStatus) => {
    if (!selectedAlert) return;
    updateStatus({ id: selectedAlert.id, status: newStatus });
  };

  const selectedLat = selectedAlert?.gps_lat ?? selectedAlert?.location?.latitude ?? selectedAlert?.location?.lat;
  const selectedLng = selectedAlert?.gps_lng ?? selectedAlert?.location?.longitude ?? selectedAlert?.location?.lng;
  const selectedCallerName = selectedAlert?.user?.name || selectedAlert?.user_name || "Anonymous Citizen";
  const selectedCallerPhone = selectedAlert?.user?.phone || selectedAlert?.user_phone || "No phone listed";

  return (
    <div className="space-y-4 animate-in fade-in-50 duration-200 flex flex-col h-[calc(100vh-7.5rem)]">
      {/* ─── 1. Header ────────────────────────────────────────────── */}
      <AdminPageHeader
        title="Live Vector Radar"
        subtitle={`Command Center: ${agency?.name || "Station HQ"} • Tactical GPS telemetry and active distress beacons`}
        action={
          <div className="flex items-center gap-2">
            {/* Map Style Selector */}
            <div className="flex items-center gap-1 bg-muted/40 p-1 rounded-xl border border-border/60">
              <Layers className="w-3.5 h-3.5 ml-1.5 text-muted-foreground" />
              {(["dark", "satellite", "streets"] as const).map((style) => (
                <button
                  key={style}
                  type="button"
                  onClick={() => setMapStyle(style)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold capitalize transition-all ${
                    mapStyle === style
                      ? "bg-card text-foreground shadow-sm font-bold"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {style}
                </button>
              ))}
            </div>
          </div>
        }
      />

      {/* ─── 2. Tactical Canvas & Split Telemetry Queue ────────────── */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 min-h-0">
        {/* ════ LEFT COLUMN: Telemetry Triage Drawer (4 cols) ════ */}
        <div className="lg:col-span-4 flex flex-col gap-3 min-h-0 overflow-hidden">
          {/* Active Emergencies Queue Card */}
          <Card className="border-border/80 bg-card/90 shadow-lg backdrop-blur-md overflow-hidden flex flex-col flex-1 min-h-[220px]">
            <CardHeader className="p-3.5 border-b border-border/80 bg-secondary/10 shrink-0">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <Radio className="w-3.5 h-3.5 text-destructive animate-pulse" />
                  <span>Distress Telemetry ({filteredAlerts.length})</span>
                </CardTitle>
                <div className="flex items-center gap-1">
                  {(["active", "dispatched", "all"] as const).map((tab) => (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => setFilterStatus(tab)}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase transition-colors ${
                        filterStatus === tab
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
              </div>

              {/* Search Bar */}
              <div className="relative mt-2">
                <Search className="w-3 h-3 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Filter by caller, ID, or description..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-2.5 py-1 rounded-lg bg-background/80 border border-border/60 text-[11px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </CardHeader>

            <CardContent className="p-0 flex-1 overflow-y-auto divide-y divide-border/40">
              {isLoading ? (
                <div className="p-8 text-center text-xs text-muted-foreground flex flex-col items-center justify-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin text-primary" />
                  <span>Syncing GPS telemetry...</span>
                </div>
              ) : filteredAlerts.length === 0 ? (
                <div className="p-8 text-center text-xs text-muted-foreground space-y-1">
                  <Shield className="w-8 h-8 mx-auto text-emerald-400 opacity-80" />
                  <p className="font-semibold text-foreground">Sector Clear</p>
                  <p className="text-[11px]">No active distress signals matching filter</p>
                </div>
              ) : (
                filteredAlerts.map((alert) => {
                  const isSelected = String(alert.id) === String(selectedAlert?.id);
                  const isActive = alert.status === "active";
                  const callerName = alert.user?.name || alert.user_name || `Distress #${alert.id}`;
                  const alertLat = alert.gps_lat ?? alert.location?.latitude ?? alert.location?.lat;
                  const alertLng = alert.gps_lng ?? alert.location?.longitude ?? alert.location?.lng;

                  return (
                    <div
                      key={alert.id}
                      onClick={() => setSelectedAlertId(alert.id)}
                      className={`p-3 cursor-pointer transition-all ${
                        isSelected
                          ? "bg-primary/15 border-l-4 border-l-primary"
                          : "hover:bg-muted/40"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-foreground truncate max-w-[170px]">
                          {callerName}
                        </span>
                        <Badge
                          variant={isActive ? "destructive" : alert.status === "resolved" ? "success" : "warning"}
                          className="text-[9px] uppercase font-bold px-1.5 py-0"
                        >
                          {alert.status}
                        </Badge>
                      </div>

                      <p className="text-[11px] text-muted-foreground line-clamp-1 mt-0.5">
                        {alert.transcribed_text || alert.description || "Direct GPS SOS trigger"}
                      </p>

                      <div className="flex items-center justify-between text-[10px] text-muted-foreground font-mono mt-1">
                        <span className="truncate max-w-[150px]">
                          {alertLat && alertLng ? `📍 ${alertLat.toFixed(4)}°, ${alertLng.toFixed(4)}°` : "📍 Manual Beacon (No GPS)"}
                        </span>
                        <span>{timeAgo(alert.created_at)}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>

          {/* Selected Emergency Quick Action HUD */}
          {selectedAlert && (
            <Card className="border-border/80 bg-card/95 shadow-xl backdrop-blur-md p-4 shrink-0 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-mono text-primary uppercase font-bold">
                    Incident #{selectedAlert.id}
                  </span>
                  <h3 className="text-xs font-bold text-foreground mt-0.5 line-clamp-1">
                    {selectedAlert.transcribed_text || selectedAlert.description || "SOS Distress Signal"}
                  </h3>
                </div>
                <Badge
                  variant={selectedAlert.status === "active" ? "destructive" : selectedAlert.status === "resolved" ? "success" : "warning"}
                  className="text-[9px] uppercase font-bold"
                >
                  {selectedAlert.status}
                </Badge>
              </div>

              {/* Citizen Details */}
              <div className="p-2.5 rounded-xl bg-background/80 border border-border/60 space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                    <User className="w-3 h-3 text-primary" /> Caller:
                  </span>
                  <span className="font-semibold text-foreground">
                    {selectedCallerName}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                    <PhoneCall className="w-3 h-3 text-emerald-400" /> Contact:
                  </span>
                  {selectedCallerPhone !== "No phone listed" ? (
                    <a
                      href={`tel:${selectedCallerPhone}`}
                      className="text-emerald-400 hover:underline font-mono text-[11px]"
                    >
                      {selectedCallerPhone}
                    </a>
                  ) : (
                    <span className="text-muted-foreground font-mono text-[11px]">
                      {selectedCallerPhone}
                    </span>
                  )}
                </div>
                <div className="flex justify-between">
                  <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-primary" /> Coordinates:
                  </span>
                  <span className="font-mono text-[11px] text-primary">
                    {selectedLat && selectedLng
                      ? `${Number(selectedLat).toFixed(4)}°, ${Number(selectedLng).toFixed(4)}°`
                      : "No GPS fix (Manual SOS beacon)"}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-3 gap-2">
                <Button
                  size="sm"
                  onClick={() => handleStatusChange("acknowledged")}
                  disabled={isUpdating || selectedAlert.status === "acknowledged"}
                  className="h-8 text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white"
                >
                  <Send className="w-3 h-3 mr-1" />
                  <span>Acknowledge</span>
                </Button>

                <Button
                  size="sm"
                  onClick={() => handleStatusChange("resolved")}
                  disabled={isUpdating || selectedAlert.status === "resolved"}
                  className="h-8 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white"
                >
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  <span>Resolve</span>
                </Button>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleStatusChange("false_alarm")}
                  disabled={isUpdating}
                  className="h-8 text-xs text-muted-foreground hover:text-destructive"
                >
                  <XCircle className="w-3 h-3 mr-1" />
                  <span>False</span>
                </Button>
              </div>
            </Card>
          )}
        </div>

        {/* ════ RIGHT COLUMN: Full Mapbox Vector Radar Canvas (8 cols) ════ */}
        <div className="lg:col-span-8 rounded-2xl overflow-hidden border border-border/80 relative min-h-[400px]">
          <MapboxView
            alerts={filteredAlerts}
            selectedAlertId={selectedAlert?.id}
            onSelectAlert={(a) => setSelectedAlertId(a.id)}
            center={[agencyLng, agencyLat]}
            agencyLocation={{
              latitude: agencyLat,
              longitude: agencyLng,
              name: agency?.name || "Station HQ",
            }}
            mapStyle={mapStyle}
            zoom={13}
            interactive={true}
            showControls={true}
            className="w-full h-full"
          />
        </div>
      </div>
    </div>
  );
}
