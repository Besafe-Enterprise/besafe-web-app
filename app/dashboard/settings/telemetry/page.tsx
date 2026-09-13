"use client";

import React, { useState } from "react";
import {
  Radio,
  Volume2,
  Play,
  Activity,
  ShieldCheck,
  Bell,
} from "lucide-react";
import { AdminPageHeader } from "@/components/shared/admin-page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { toast } from "sonner";

export default function StationTelemetrySettingsPage() {
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState("15");

  const handleTestSirenChime = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(880, audioCtx.currentTime); // A5
      osc.frequency.exponentialRampToValueAtTime(440, audioCtx.currentTime + 0.4);

      gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);

      osc.connect(gain);
      gain.connect(audioCtx.destination);

      osc.start();
      osc.stop(audioCtx.currentTime + 0.5);
      toast.success("Distress chime sound test triggered");
    } catch {
      toast.error("Audio playback not supported in this environment");
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in-50 duration-200">
      {/* ─── Header ────────────────────────────────────────────── */}
      <AdminPageHeader
        title="Dispatcher Sound & Telemetry"
        subtitle="Configure acoustic distress siren alarms, notification sound chimes, and background GPS sync intervals"
        action={
          <Badge
            variant="outline"
            className="h-8 px-3 text-xs font-mono font-bold bg-primary/10 border-primary/30 text-primary flex items-center gap-1.5"
          >
            <Radio className="w-3.5 h-3.5 text-primary" />
            <span>Telemetry Pipeline Active</span>
          </Badge>
        }
      />

      {/* ─── Sound & Telemetry Card ────────────────────────────── */}
      <Card className="border-border/80 bg-card/90 shadow-lg backdrop-blur-md overflow-hidden">
        <CardHeader className="p-5 border-b border-border/80 bg-secondary/10">
          <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
            <Volume2 className="w-4 h-4 text-primary" />
            <span>Acoustic Distress Siren & Cadence Configuration</span>
          </CardTitle>
          <CardDescription className="text-xs text-muted-foreground">
            Configure acoustic alarms, emergency chimes, and automatic radar feed refresh intervals
          </CardDescription>
        </CardHeader>

        <CardContent className="p-6 space-y-6 text-xs">
          {/* Audio Alert Chimes */}
          <div className="p-4 rounded-xl bg-background border border-border/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Volume2 className="w-4 h-4 text-primary" />
                <span className="font-bold text-foreground">
                  Acoustic SOS Distress Siren
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Plays an immediate audible chime whenever a high-priority voice distress signal is routed to your station
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={handleTestSirenChime}
                className="h-8 px-3 text-xs border-primary/30 text-primary hover:bg-primary/10"
              >
                <Play className="w-3 h-3 mr-1 text-primary" />
                <span>Test Tone</span>
              </Button>

              <Button
                type="button"
                size="sm"
                variant={soundEnabled ? "default" : "secondary"}
                onClick={() => {
                  setSoundEnabled(!soundEnabled);
                  toast.success(
                    soundEnabled ? "Audio alerts disabled" : "Audio alerts enabled"
                  );
                }}
                className="h-8 px-3 text-xs font-bold"
              >
                {soundEnabled ? "Enabled" : "Muted"}
              </Button>
            </div>
          </div>

          {/* Live Feed Refresh Cadence */}
          <div className="p-4 rounded-xl bg-background border border-border/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-400" />
                <span className="font-bold text-foreground">
                  Live GPS Telemetry Sync Cadence
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Frequency of background telemetry sync with station field units and citizen beacons
              </p>
            </div>

            <select
              value={refreshInterval}
              onChange={(e) => {
                setRefreshInterval(e.target.value);
                toast.success(`Telemetry sync interval set to ${e.target.value}s`);
              }}
              className="px-3 py-1.5 rounded-xl bg-muted/40 border border-border/80 text-foreground text-xs font-mono focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="10">Every 10 seconds (Ultra-Fast)</option>
              <option value="15">Every 15 seconds (Standard)</option>
              <option value="30">Every 30 seconds (Balanced)</option>
              <option value="60">Every 60 seconds (Low Bandwidth)</option>
            </select>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
