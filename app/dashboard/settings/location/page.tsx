"use client";

import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import {
  MapPin,
  ShieldCheck,
  Save,
  Loader2,
  SlidersHorizontal,
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
import { useAgencyAuthStore } from "@/lib/store/agency-auth-store";
import { useUpdateAgencyLocation } from "@/lib/hooks/settings/use-agency-settings";

// Dynamic import of the interactive location picker map
const LocationPickerMap = dynamic(
  () =>
    import("@/components/map/LocationPickerMap").then(
      (mod) => mod.LocationPickerMap
    ),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-[380px] flex items-center justify-center bg-card rounded-2xl border border-border/80">
        <div className="flex items-center space-x-3 text-muted-foreground text-xs">
          <Loader2 className="w-5 h-5 animate-spin text-primary" />
          <span>Loading interactive headquarters geocoder...</span>
        </div>
      </div>
    ),
  }
);

export default function StationLocationSettingsPage() {
  const agency = useAgencyAuthStore((s) => s.agency);

  // Form State: Location & Geofence
  const [lat, setLat] = useState<number>(
    agency?.location?.lat || agency?.latitude || 15.5007
  );
  const [lng, setLng] = useState<number>(
    agency?.location?.lng || agency?.longitude || 32.5599
  );
  const [radiusKm, setRadiusKm] = useState<number>(
    agency?.coverage_radius_km || 25
  );

  const { mutate: updateLocation, isPending } = useUpdateAgencyLocation();

  useEffect(() => {
    if (agency) {
      if (agency.location?.lat || agency.latitude) {
        setLat(agency.location?.lat || agency.latitude || 15.5007);
      }
      if (agency.location?.lng || agency.longitude) {
        setLng(agency.location?.lng || agency.longitude || 32.5599);
      }
      if (agency.coverage_radius_km) {
        setRadiusKm(agency.coverage_radius_km);
      }
    }
  }, [agency]);

  const handleSaveLocation = (e: React.FormEvent) => {
    e.preventDefault();
    updateLocation({ lat, lng });
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in-50 duration-200">
      {/* ─── Header ────────────────────────────────────────────── */}
      <AdminPageHeader
        title="Station Headquarters Geolocation"
        subtitle="Calibrate physical station base coordinates and configure jurisdiction geofence perimeter"
        action={
          <Badge
            variant="outline"
            className="h-8 px-3 text-xs font-mono font-bold bg-primary/10 border-primary/30 text-primary flex items-center gap-1.5"
          >
            <MapPin className="w-3.5 h-3.5 text-destructive" />
            <span>HQ GPS Synchronized</span>
          </Badge>
        }
      />

      {/* ─── Location Geocoder Card ────────────────────────────── */}
      <Card className="border-border/80 bg-card/90 shadow-lg backdrop-blur-md overflow-hidden">
        <CardHeader className="p-5 border-b border-border/80 bg-secondary/10">
          <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
            <MapPin className="w-4 h-4 text-destructive" />
            <span>Headquarters Physical Coordinates</span>
          </CardTitle>
          <CardDescription className="text-xs text-muted-foreground">
            Click anywhere on the radar map or drag the station pin to calibrate physical HQ coordinates
          </CardDescription>
        </CardHeader>

        <CardContent className="p-6 space-y-5">
          {/* Interactive Mapbox Location Picker */}
          <LocationPickerMap
            lat={lat}
            lng={lng}
            radiusKm={radiusKm}
            onChange={(newLat, newLng) => {
              setLat(newLat);
              setLng(newLng);
            }}
            className="w-full h-[380px]"
          />

          {/* Coordinates & Radius Inputs Form */}
          <form onSubmit={handleSaveLocation} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Latitude */}
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-foreground">
                  Latitude
                </label>
                <input
                  type="number"
                  step="any"
                  required
                  value={lat}
                  onChange={(e) => setLat(parseFloat(e.target.value) || 0)}
                  className="w-full px-3.5 py-2 rounded-xl bg-background border border-border/80 text-foreground font-mono text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              {/* Longitude */}
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-foreground">
                  Longitude
                </label>
                <input
                  type="number"
                  step="any"
                  required
                  value={lng}
                  onChange={(e) => setLng(parseFloat(e.target.value) || 0)}
                  className="w-full px-3.5 py-2 rounded-xl bg-background border border-border/80 text-foreground font-mono text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              {/* Coverage Radius */}
              <div className="space-y-1">
                <div className="flex justify-between">
                  <label className="text-[11px] font-semibold text-foreground">
                    Jurisdiction Radius
                  </label>
                  <span className="font-mono text-primary font-bold">
                    {radiusKm} km
                  </span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="100"
                  step="5"
                  value={radiusKm}
                  onChange={(e) => setRadiusKm(parseInt(e.target.value, 10))}
                  className="w-full accent-primary h-2 bg-muted rounded-lg cursor-pointer"
                />
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-border/60">
              <Button
                type="submit"
                size="sm"
                disabled={isPending}
                className="h-9 px-4 text-xs font-bold bg-primary hover:bg-primary/90 text-primary-foreground shadow-md shadow-primary/20"
              >
                {isPending ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                    <span>Saving HQ Coordinates...</span>
                  </>
                ) : (
                  <>
                    <MapPin className="w-3.5 h-3.5 mr-1.5" />
                    <span>Save Headquarters Geolocation</span>
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
