"use client";

import React from "react";
import dynamic from "next/dynamic";
import { X, Map, ShieldAlert, Navigation, Phone, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Alert } from "@/types";
import { getAlertCoords } from "./MapboxView";

const MapboxView = dynamic(() => import("@/components/map/MapboxView"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full min-h-[350px] flex items-center justify-center bg-card rounded-xl border border-border">
      <span className="text-xs text-muted-foreground">Loading Vector Radar...</span>
    </div>
  ),
});

interface QuickMapModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedAlert?: Alert | null;
  alerts?: Alert[];
  agencyLocation?: { latitude: number; longitude: number; name?: string };
}

export function QuickMapModal({
  isOpen,
  onClose,
  selectedAlert,
  alerts = [],
  agencyLocation,
}: QuickMapModalProps) {
  if (!isOpen) return null;

  const alertCoords = getAlertCoords(selectedAlert);
  const centerCoordinates: [number, number] = alertCoords
    ? [alertCoords.lng, alertCoords.lat]
    : agencyLocation && agencyLocation.longitude && agencyLocation.latitude
    ? [agencyLocation.longitude, agencyLocation.latitude]
    : [7.515401, 8.92997];

  const callerName = selectedAlert?.user?.name || selectedAlert?.user_name || "Anonymous Citizen";
  const callerPhone = selectedAlert?.user?.phone || selectedAlert?.user_phone;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in-50"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-4xl rounded-2xl bg-card border border-border/80 shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border/80 bg-background/50">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary border border-primary/20">
              <Map className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-foreground">
                {selectedAlert
                  ? `Live Telemetry Pin • SOS #${selectedAlert.id}`
                  : "Command Vector Radar"}
              </h2>
              <p className="text-[11px] text-muted-foreground">
                {selectedAlert?.transcribed_text || selectedAlert?.description || "Real-time emergency telemetry grid"}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Map Container */}
        <div className="relative w-full h-[400px] sm:h-[480px]">
          <MapboxView
            alerts={selectedAlert ? [selectedAlert] : alerts}
            selectedAlertId={selectedAlert ? selectedAlert.id : undefined}
            center={centerCoordinates}
            zoom={selectedAlert && alertCoords ? 15 : 12}
            agencyLocation={agencyLocation}
            className="w-full h-full"
          />
        </div>

        {/* Selected Incident Drawer Footer */}
        {selectedAlert && (
          <div className="p-4 border-t border-border/80 bg-secondary/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-1.5 font-medium text-foreground">
                <User className="w-3.5 h-3.5 text-primary" />
                <span>{callerName}</span>
              </div>
              {callerPhone && (
                <div className="flex items-center gap-1.5 text-muted-foreground font-mono">
                  <Phone className="w-3.5 h-3.5 text-primary" />
                  <span>{callerPhone}</span>
                </div>
              )}
              {alertCoords && (
                <div className="text-primary font-mono text-[11px]">
                  📍 {alertCoords.lat.toFixed(4)}°, {alertCoords.lng.toFixed(4)}°
                </div>
              )}
            </div>

            <Button
              size="sm"
              onClick={onClose}
              className="h-7 px-3 text-xs font-semibold self-end sm:self-auto"
            >
              Close Radar
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
