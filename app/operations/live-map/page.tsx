"use client";

import React, { useMemo } from "react";
import { useGetAlerts } from "@/lib/hooks/dispatch/use-dispatch-data";
import { useGetAgencyTeam } from "@/lib/hooks/team/use-team-data";
import { useAgencyAuthStore } from "@/lib/store/agency-auth-store";
import { useAlertStore } from "@/stores/useAlertStore";
import { EmptyState } from "@/components/operations/shared/EmptyState";
import { SkeletonRow } from "@/components/operations/shared/LoadingSkeleton";
import { agencyCoords } from "@/lib/operations/utils";
import { MapPin } from "lucide-react";
import dynamic from "next/dynamic";
import "@/styles/operations/misc.css";

const MapboxView = dynamic(() => import("@/components/map/MapboxView"), {
  ssr: false,
  loading: () => <div className="skeleton" style={{ height: "100%", width: "100%" }} />,
});

export default function LiveMapPage() {
  const { data: alerts = [], isLoading } = useGetAlerts();
  const { data: team = [] } = useGetAgencyTeam();
  const { agency } = useAgencyAuthStore();
  const { alerts: liveAlerts } = useAlertStore();

  const all = useMemo(() => (liveAlerts.length > 0 ? liveAlerts : alerts), [liveAlerts, alerts]);
  const agencyRef = agencyCoords(agency);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "var(--space-4)",
        height: "calc(100vh - var(--topbar-height) - var(--space-12))",
        minHeight: 480,
      }}
    >
      <div className="page-header" style={{ marginBottom: 0 }}>
        <div>
          <h1 className="page-header__title">Live Map</h1>
          <p className="page-header__subtitle">
            Active case markers and field worker locations in real time
          </p>
        </div>
      </div>

      <div className="live-map-layout">
        <div className="live-map-panel">
          <div>
            <div className="section-header__title" style={{ marginBottom: 8 }}>Legend</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, fontSize: "var(--text-sm)" }}>
              <LegendDot color="#DC2626" label="CRITICAL case" />
              <LegendDot color="#D97706" label="HIGH priority case" />
              <LegendDot color="#2563EB" label="MEDIUM / assigned" />
              <LegendDot color="#059669" label="Resolved / available worker" />
            </div>
          </div>
          <div>
            <div className="section-header__title" style={{ marginBottom: 8 }}>Team ({team.length})</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {team.slice(0, 10).map((t) => (
                <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "var(--text-sm)" }}>
                  <LegendDot color={t.is_active ? "#059669" : "#9CA3AF"} />
                  <span>{t.name}</span>
                  <span className="text-tertiary" style={{ marginLeft: "auto", fontSize: "var(--text-xs)" }}>
                    {t.is_active ? "AVAILABLE" : "OFFLINE"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="live-map-canvas">
          {isLoading ? (
            <SkeletonRow cols={1} rows={6} />
          ) : !agencyRef && all.length === 0 ? (
            <EmptyState icon={<MapPin width={40} height={40} />} title="No map data" />
          ) : (
            <MapboxView
              alerts={all}
              interactive={true}
              mapStyle="dark"
              agencyLocation={
                agencyRef
                  ? { latitude: agencyRef.lat, longitude: agencyRef.lng, name: agency?.name || "Agency HQ" }
                  : undefined
              }
            />
          )}
        </div>
      </div>
    </div>
  );
}

function LegendDot({ color, label }: { color: string; label?: string }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
      <span style={{ width: 10, height: 10, borderRadius: "9999px", background: color, display: "inline-block" }} />
      {label && <span className="text-secondary">{label}</span>}
    </span>
  );
}
