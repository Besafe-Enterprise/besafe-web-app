"use client";

import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import { Crosshair, Layers } from "lucide-react";

const DEFAULT_MAPBOX_TOKEN =
  process.env.NEXT_PUBLIC_MAPBOX_TOKEN || "";


const STYLE_URLS = {
  dark: "mapbox://styles/mapbox/dark-v11",
  satellite: "mapbox://styles/mapbox/satellite-streets-v12",
  streets: "mapbox://styles/mapbox/streets-v12",
};

interface LocationPickerMapProps {
  lat: number;
  lng: number;
  onChange: (lat: number, lng: number) => void;
  radiusKm?: number;
  className?: string;
}

export function LocationPickerMap({
  lat,
  lng,
  onChange,
  radiusKm = 25,
  className = "w-full h-[360px]",
}: LocationPickerMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markerRef = useRef<mapboxgl.Marker | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapStyle, setMapStyle] = useState<"dark" | "satellite" | "streets">("dark");
  const [isLocating, setIsLocating] = useState(false);

  // 1. Initialize Mapbox
  useEffect(() => {
    if (!mapContainerRef.current) return;

    mapboxgl.accessToken = DEFAULT_MAPBOX_TOKEN;

    const initialLng = !isNaN(lng) && lng !== 0 ? lng : 32.5599;
    const initialLat = !isNaN(lat) && lat !== 0 ? lat : 15.5007;

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: STYLE_URLS[mapStyle] || STYLE_URLS.dark,
      center: [initialLng, initialLat],
      zoom: 13,
      attributionControl: false,
    });

    map.addControl(new mapboxgl.NavigationControl({ showCompass: true }), "top-right");

    // Custom Draggable HQ Marker
    const markerEl = document.createElement("div");
    markerEl.className = "flex items-center justify-center cursor-move";
    markerEl.style.width = "40px";
    markerEl.style.height = "40px";
    markerEl.style.borderRadius = "12px";
    markerEl.style.backgroundColor = "#353FAB";
    markerEl.style.border = "3px solid #FFFFFF";
    markerEl.style.color = "#FFFFFF";
    markerEl.style.fontSize = "18px";
    markerEl.style.boxShadow = "0 8px 20px rgba(53, 63, 171, 0.5)";
    markerEl.innerHTML = "🏛️";
    markerEl.title = "Drag to reposition Headquarters";

    const marker = new mapboxgl.Marker({
      element: markerEl,
      draggable: true,
    })
      .setLngLat([initialLng, initialLat])
      .addTo(map);

    marker.on("dragend", () => {
      const pos = marker.getLngLat();
      onChange(pos.lat, pos.lng);
    });

    // Click anywhere on map to reposition marker
    map.on("click", (e) => {
      const clickLng = e.lngLat.lng;
      const clickLat = e.lngLat.lat;
      marker.setLngLat([clickLng, clickLat]);
      onChange(clickLat, clickLng);
    });

    map.on("load", () => {
      setMapLoaded(true);
    });

    mapRef.current = map;
    markerRef.current = marker;

    return () => {
      map.remove();
    };
  }, []);

  // 2. Map Style Switcher
  useEffect(() => {
    if (!mapRef.current || !mapLoaded) return;
    mapRef.current.setStyle(STYLE_URLS[mapStyle] || STYLE_URLS.dark);
  }, [mapStyle]);

  // 3. Update marker position when props change from text inputs
  useEffect(() => {
    if (!markerRef.current || !mapRef.current || !mapLoaded) return;
    if (isNaN(lat) || isNaN(lng) || (lat === 0 && lng === 0)) return;

    const currentPos = markerRef.current.getLngLat();
    if (
      Math.abs(currentPos.lat - lat) > 0.0001 ||
      Math.abs(currentPos.lng - lng) > 0.0001
    ) {
      markerRef.current.setLngLat([lng, lat]);
      mapRef.current.flyTo({
        center: [lng, lat],
        zoom: 14,
        essential: true,
      });
    }
  }, [lat, lng, mapLoaded]);

  // 4. Locate browser GPS
  const handleLocateBrowser = () => {
    if (!navigator.geolocation) return;
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const userLat = pos.coords.latitude;
        const userLng = pos.coords.longitude;
        onChange(userLat, userLng);
        if (markerRef.current && mapRef.current) {
          markerRef.current.setLngLat([userLng, userLat]);
          mapRef.current.flyTo({
            center: [userLng, userLat],
            zoom: 15,
            essential: true,
          });
        }
        setIsLocating(false);
      },
      () => {
        setIsLocating(false);
      }
    );
  };

  return (
    <div className={`relative overflow-hidden rounded-2xl bg-card border border-border/80 ${className}`}>
      <div ref={mapContainerRef} className="w-full h-full min-h-[300px]" />

      {/* Floating Toolbar Controls */}
      <div className="absolute top-3 left-3 z-10 flex items-center gap-2">
        {/* Style Selector */}
        <div className="flex items-center gap-1 bg-background/90 backdrop-blur-md p-1 rounded-xl border border-border/80 shadow-md">
          <Layers className="w-3.5 h-3.5 ml-1.5 text-muted-foreground" />
          {(["dark", "satellite", "streets"] as const).map((style) => (
            <button
              key={style}
              type="button"
              onClick={() => setMapStyle(style)}
              className={`px-2 py-0.5 rounded-lg text-[10px] font-bold capitalize transition-all ${
                mapStyle === style
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {style}
            </button>
          ))}
        </div>

        {/* Locate GPS Button */}
        <button
          type="button"
          onClick={handleLocateBrowser}
          disabled={isLocating}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-background/90 hover:bg-background backdrop-blur-md border border-border/80 text-[10px] font-bold text-foreground shadow-md transition-colors"
          title="Detect Current Physical Location"
        >
          <Crosshair
            className={`w-3 h-3 text-primary ${isLocating ? "animate-spin" : ""}`}
          />
          <span>{isLocating ? "Locating..." : "Use Current GPS"}</span>
        </button>
      </div>

      {/* Helper Footer Ribbon */}
      <div className="absolute bottom-3 left-3 right-3 z-10 pointer-events-none">
        <div className="p-2 rounded-xl bg-background/90 backdrop-blur-md border border-border/80 shadow-md text-[11px] text-muted-foreground flex items-center justify-between">
          <span className="font-mono text-primary font-semibold">
            📍 {lat.toFixed(4)}°, {lng.toFixed(4)}°
          </span>
          <span className="text-[10px]">
            Click map or drag marker to set HQ
          </span>
        </div>
      </div>
    </div>
  );
}
