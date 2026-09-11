"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import {
  Search,
  MapPin,
  LocateFixed,
  Loader2,
  ChevronDown,
  ChevronUp,
  Compass,
  Check,
  Building,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || "";


interface GeocodingFeature {
  id: string;
  place_name: string;
  text: string;
  center: [number, number]; // [lng, lat]
}

interface LocationMapPickerProps {
  lat: number;
  lng: number;
  onLocationChange: (lat: number, lng: number, placeName?: string) => void;
  className?: string;
}

export default function LocationMapPicker({
  lat,
  lng,
  onLocationChange,
  className = "",
}: LocationMapPickerProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markerRef = useRef<mapboxgl.Marker | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<GeocodingFeature[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedPlaceName, setSelectedPlaceName] = useState<string>("");
  const [isLocating, setIsLocating] = useState(false);
  const [showManualInputs, setShowManualInputs] = useState(false);

  // Reverse Geocoding to get location label
  const reverseGeocode = async (longitude: number, latitude: number) => {
    try {
      const res = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json?access_token=${MAPBOX_TOKEN}&types=address,poi,neighborhood,locality,place`
      );
      const data = await res.json();
      if (data.features && data.features.length > 0) {
        const placeName = data.features[0].place_name;
        setSelectedPlaceName(placeName);
      }
    } catch {
      // Ignore reverse geocode failures
    }
  };

  // Initialize Mapbox map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    mapboxgl.accessToken = MAPBOX_TOKEN;

    const initialLng = isNaN(lng) || lng === 0 ? 32.5599 : lng;
    const initialLat = isNaN(lat) || lat === 0 ? 15.5007 : lat;

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: "mapbox://styles/mapbox/dark-v11",
      center: [initialLng, initialLat],
      zoom: 13,
      attributionControl: false,
    });

    mapRef.current = map;

    // Custom tactical glowing marker element
    const el = document.createElement("div");
    el.className = "station-marker";
    el.innerHTML = `
      <div style="
        position: relative;
        width: 36px;
        height: 36px;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: grab;
      ">
        <div style="
          position: absolute;
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: rgba(59, 130, 246, 0.35);
          animation: ping 1.8s cubic-bezier(0, 0, 0.2, 1) infinite;
        "></div>
        <div style="
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%);
          border: 2px solid #FFFFFF;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.5);
        ">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
            <circle cx="12" cy="10" r="3"/>
          </svg>
        </div>
      </div>
    `;

    const marker = new mapboxgl.Marker({
      element: el,
      draggable: true,
    })
      .setLngLat([initialLng, initialLat])
      .addTo(map);

    markerRef.current = marker;

    // Handle marker dragend
    marker.on("dragend", () => {
      const lngLat = marker.getLngLat();
      const newLat = Number(lngLat.lat.toFixed(6));
      const newLng = Number(lngLat.lng.toFixed(6));
      onLocationChange(newLat, newLng);
      reverseGeocode(newLng, newLat);
    });

    // Handle map click
    map.on("click", (e) => {
      const newLat = Number(e.lngLat.lat.toFixed(6));
      const newLng = Number(e.lngLat.lng.toFixed(6));
      marker.setLngLat([newLng, newLat]);
      onLocationChange(newLat, newLng);
      reverseGeocode(newLng, newLat);
    });

    map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), "top-right");

    // Fix half-height on flex/grid parents
    const ro = new ResizeObserver(() => map.resize());
    ro.observe(mapContainerRef.current);
    setTimeout(() => map.resize(), 200);

    return () => {
      ro.disconnect();
      map.remove();
    };
  }, []);

  // Update marker position when external lat/lng props change
  useEffect(() => {
    if (markerRef.current && mapRef.current && !isNaN(lat) && !isNaN(lng)) {
      const currentPos = markerRef.current.getLngLat();
      if (
        Math.abs(currentPos.lat - lat) > 0.0001 ||
        Math.abs(currentPos.lng - lng) > 0.0001
      ) {
        markerRef.current.setLngLat([lng, lat]);
      }
    }
  }, [lat, lng]);

  // Forward Geocoding Search
  const handleSearchChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);

    if (query.trim().length < 3) {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }

    setIsSearching(true);
    try {
      const res = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
          query
        )}.json?access_token=${MAPBOX_TOKEN}&autocomplete=true&limit=5&types=poi,address,neighborhood,locality,place`
      );
      const data = await res.json();
      setSearchResults(data.features || []);
      setShowDropdown(true);
    } catch (err) {
      console.warn("Geocoding search failed:", err);
    } finally {
      setIsSearching(false);
    }
  };

  // Select place from search dropdown
  const handleSelectPlace = (feature: GeocodingFeature) => {
    const [featureLng, featureLat] = feature.center;
    const newLat = Number(featureLat.toFixed(6));
    const newLng = Number(featureLng.toFixed(6));

    setSelectedPlaceName(feature.place_name);
    setSearchQuery(feature.text || feature.place_name);
    setShowDropdown(false);

    if (markerRef.current) {
      markerRef.current.setLngLat([newLng, newLat]);
    }
    if (mapRef.current) {
      mapRef.current.flyTo({
        center: [newLng, newLat],
        zoom: 14,
        speed: 1.4,
      });
    }

    onLocationChange(newLat, newLng, feature.place_name);
    toast.success("Command station moved to " + feature.text);
  };

  // Auto-detect browser location
  const handleDetectGPS = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const currentLat = Number(pos.coords.latitude.toFixed(6));
        const currentLng = Number(pos.coords.longitude.toFixed(6));

        if (markerRef.current) {
          markerRef.current.setLngLat([currentLng, currentLat]);
        }
        if (mapRef.current) {
          mapRef.current.flyTo({
            center: [currentLng, currentLat],
            zoom: 15,
            speed: 1.5,
          });
        }

        onLocationChange(currentLat, currentLng);
        reverseGeocode(currentLng, currentLat);
        setIsLocating(false);
        toast.success("Current GPS location pinned!");
      },
      (err) => {
        setIsLocating(false);
        toast.error("Unable to retrieve location: " + err.message);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  return (
    <div className={`${className}`} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* ─── Search Bar — Professional · Spacious ─────────────────── */}
      <div style={{ position: "relative" }}>
        <Label htmlFor="station-search" style={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--color-text-tertiary)", marginBottom: 10, display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ width: 20, height: 20, borderRadius: 7, background: "var(--color-brand)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", boxShadow: "0 2px 8px rgba(59,111,232,0.25)" }}><Search size={11} /></span>
          Search Station Address, City, or Landmark
        </Label>
        <div style={{ position: "relative", display: "flex", alignItems: "center", height: 48, borderRadius: 14, background: "var(--color-surface)", border: "1px solid var(--color-border)", boxShadow: "0 4px 16px rgba(0,0,0,0.06)", overflow: "hidden", transition: "border-color 0.15s, boxShadow 0.15s" }}>
          <span style={{ position: "absolute", left: 14, display: "flex", color: "var(--color-text-tertiary)", pointerEvents: "none" }}><Search size={16} /></span>
          <Input
            id="station-search"
            value={searchQuery}
            onChange={handleSearchChange}
            onFocus={() => {
              if (searchResults.length > 0) setShowDropdown(true);
            }}
            placeholder="e.g. Federal HQ, 123 Main St, Minna,Niger State"
            style={{ flex: 1, height: "100%", paddingLeft: 44, paddingRight: 44, fontSize: 13.5, fontWeight: 500, background: "transparent", border: "none", boxShadow: "none" }}
          />
          {isSearching && (
            <span style={{ position: "absolute", right: 14, display: "flex", color: "var(--color-brand)" }}><Loader2 size={16} className="animate-spin" /></span>
          )}
        </div>

        {/* Autocomplete Dropdown */}
        {showDropdown && searchResults.length > 0 && (
          <div className="absolute z-50 mt-1 w-full rounded-xl border border-border bg-card/95 backdrop-blur-xl shadow-2xl overflow-hidden animate-in fade-in-50">
            <div className="max-h-56 overflow-y-auto divide-y divide-border/40">
              {searchResults.map((feature) => (
                <button
                  key={feature.id}
                  type="button"
                  onClick={() => handleSelectPlace(feature)}
                  className="w-full px-4 py-2.5 text-left flex items-start gap-3 hover:bg-muted/70 transition-colors"
                >
                  <MapPin className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-semibold text-foreground truncate">
                      {feature.text}
                    </div>
                    <div className="text-[11px] text-muted-foreground truncate">
                      {feature.place_name}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ─── Interactive Mapbox Canvas ─────────────────────────────── */}
      <div style={{ position: "relative", width: "100%", height: 260, borderRadius: 12, overflow: "hidden", border: "1px solid var(--color-border)", background: "var(--color-surface)" }}>
        <div ref={mapContainerRef} style={{ width: "100%", height: "100%" }} />

        {/* Floating Quick Action Overlay */}
        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between pointer-events-none">
          {/* Live Pinned Badge */}
          <div className="pointer-events-auto flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 backdrop-blur-md border border-emerald-500/20 text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold shadow-md">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>HQ Pinned</span>
            <Check size={12} className="text-emerald-500" />
          </div>

          {/* Detect GPS Button */}
          <Button
            type="button"
            size="sm"
            onClick={handleDetectGPS}
            disabled={isLocating}
            className="pointer-events-auto h-8 px-3 text-xs bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/25 rounded-lg"
          >
            {isLocating ? (
              <>
                <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                Locating...
              </>
            ) : (
              <>
                <LocateFixed className="w-3.5 h-3.5 mr-1.5" />
                Detect GPS
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Pinned Address Preview */}
      {selectedPlaceName && (
        <div className="px-3 py-2 rounded-lg bg-primary/10 border border-primary/20 flex items-center gap-2 text-xs text-primary font-medium">
          <span className="truncate">{selectedPlaceName}</span>
        </div>
      )}

      {/* ─── Styled Manual Coordinates — Professional (plain CSS) ─ */}
      <div style={{ paddingTop: 8 }}>
        <button
          type="button"
          onClick={() => setShowManualInputs(!showManualInputs)}
          style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "3px 14px", borderRadius: 9999, background: "var(--color-surface)", border: "1px solid var(--color-border)", color: "var(--color-text-secondary)", fontSize: 11, fontWeight: 700, letterSpacing: "0.02em", cursor: "pointer" }}
        >
          <span>{showManualInputs ? "Hide precise decimals" : "Fine-tune precise decimals"}</span>
          {showManualInputs ? <ChevronUp size={12} style={{ opacity: 0.7 }} /> : <ChevronDown size={12} style={{ opacity: 0.7 }} />}
        </button>

        {showManualInputs && (
          <div style={{ marginTop: 10, borderRadius: 16, border: "1px solid var(--color-border)", background: "var(--color-surface)", overflow: "hidden", boxShadow: "0 4px 16px rgba(0,0,0,0.08)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", borderBottom: "1px solid var(--color-border)", background: "var(--color-surface-sunken)" }}>
              <div style={{ width: 28, height: 28, borderRadius: 8, background: "var(--color-brand)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff" }}>
                <Compass size={13} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--color-text-primary)" }}>Precise Coordinates</div>
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, padding: 12 }}>
              <div>
                <Label htmlFor="manual-lat" style={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--color-text-inverse)", display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                  <span style={{ width: 3, height: 12, borderRadius: 9999, background: "#ffffff", display: "inline-block" }} /> Latitude
                </Label>
                <div style={{ position: "relative" }}>
                  <Input
                    id="manual-lat"
                    type="number"
                    step="any"
                    value={lat ?? ""}
                    onChange={(e) => onLocationChange(Number(e.target.value), lng)}
                    placeholder="lattitude"
                    style={{ height: 40, paddingRight: 28, fontSize: 13, fontFamily: "var(--font-mono)", fontWeight: 600,paddingLeft: 12 }}
                  />
                  <span style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", fontSize: 11, fontWeight: 800, color: "#ffffff" }}>°N</span>
                </div>
              </div>
              <div>
                <Label htmlFor="manual-lng" style={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--color-text-inverse)", display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                  <span style={{ width: 3, height: 12, borderRadius: 9999, background: "#ffffff", display: "inline-block" }} /> Longitude
                </Label>
                <div style={{ position: "relative" }}>
                  <Input
                    id="manual-lng"
                    type="number"
                    step="any"
                    value={lng ?? ""}
                    onChange={(e) => onLocationChange(lat, Number(e.target.value))}
                    placeholder="longitude"
                    style={{ height: 40, paddingRight: 28,paddingLeft: 12, fontSize: 13, fontFamily: "var(--font-mono)", fontWeight: 600 }}
                  />
                  <span style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", fontSize: 11, fontWeight: 800, color: "var(--color-text-inverse)" }}>°E</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
