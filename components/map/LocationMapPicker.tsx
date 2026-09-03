"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import mapboxgl from "mapbox-gl";
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

    return () => {
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
    <div className={`space-y-3 ${className}`}>
      {/* ─── Search Bar ────────────────────────────────────────────── */}
      <div className="relative">
        <Label htmlFor="station-search" className="text-xs font-semibold text-foreground mb-1.5 block">
          Search Station Address, City, or Landmark
        </Label>
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="station-search"
            value={searchQuery}
            onChange={handleSearchChange}
            onFocus={() => {
              if (searchResults.length > 0) setShowDropdown(true);
            }}
            placeholder="e.g. Victoria Island, Lagos or Westminster, London"
            className="pl-10 pr-10 text-sm bg-background/70 border-input text-foreground focus-visible:ring-primary/60"
          />
          {isSearching && (
            <Loader2 className="absolute top-1/2 right-3 -translate-y-1/2 h-4 w-4 animate-spin text-primary" />
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
      <div className="relative w-full h-[260px] rounded-xl overflow-hidden border border-border shadow-inner bg-card">
        <div ref={mapContainerRef} className="w-full h-full" />

        {/* Floating Quick Action Overlay */}
        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between pointer-events-none">
          {/* Live Pinned Badge */}
          <div className="pointer-events-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-card/90 backdrop-blur-md border border-border/80 text-[11px] text-foreground font-mono shadow-md">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span>
              {lat?.toFixed(4)}° N, {lng?.toFixed(4)}° E
            </span>
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
          <Building className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">{selectedPlaceName}</span>
        </div>
      )}

      {/* ─── Collapsible Manual Coordinates Drawer ─────────────────── */}
      <div className="pt-1">
        <button
          type="button"
          onClick={() => setShowManualInputs(!showManualInputs)}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors font-medium select-none"
        >
          <Compass className="w-3.5 h-3.5 text-primary" />
          <span>{showManualInputs ? "Hide decimal coordinates" : "Manual Lat / Lng override"}</span>
          {showManualInputs ? <ChevronUp className="w-3 h-3 ml-0.5" /> : <ChevronDown className="w-3 h-3 ml-0.5" />}
        </button>

        {showManualInputs && (
          <div className="grid grid-cols-2 gap-3 mt-2 p-3 rounded-xl bg-background/50 border border-border animate-in fade-in-50">
            <div>
              <Label htmlFor="manual-lat" className="text-[11px] text-muted-foreground">
                Exact Latitude
              </Label>
              <Input
                id="manual-lat"
                type="number"
                step="any"
                value={lat || ""}
                onChange={(e) => onLocationChange(Number(e.target.value), lng)}
                className="h-8 mt-1 text-xs font-mono bg-background/80"
              />
            </div>
            <div>
              <Label htmlFor="manual-lng" className="text-[11px] text-muted-foreground">
                Exact Longitude
              </Label>
              <Input
                id="manual-lng"
                type="number"
                step="any"
                value={lng || ""}
                onChange={(e) => onLocationChange(lat, Number(e.target.value))}
                className="h-8 mt-1 text-xs font-mono bg-background/80"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
