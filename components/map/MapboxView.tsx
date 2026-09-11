"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import type { Alert } from "@/types";

const DEFAULT_MAPBOX_TOKEN =
  process.env.NEXT_PUBLIC_MAPBOX_TOKEN || "";

export interface MapAlert extends Alert {
  _reportType?: "safe_chat";
}

interface MapboxViewProps {
  alerts?: MapAlert[];
  selectedAlertId?: number | string | null;
  onSelectAlert?: (alert: MapAlert) => void;
  onOpenCase?: (alert: MapAlert) => void;
  center?: [number, number]; // [lng, lat]
  zoom?: number;
  mapStyle?: "dark" | "satellite" | "streets";
  interactive?: boolean;
  showControls?: boolean;
  className?: string;
  agencyLocation?: { latitude: number; longitude: number; name?: string };
  compact?: boolean;
}

const STYLE_URLS = {
  dark: "mapbox://styles/mapbox/dark-v11",
  satellite: "mapbox://styles/mapbox/satellite-streets-v12",
  streets: "mapbox://styles/mapbox/streets-v12",
};

export function getAlertCoords(alert: Alert | null | undefined): { lat: number; lng: number } | null {
  if (!alert) return null;
  const lat = alert.gps_lat ?? alert.location?.latitude ?? alert.location?.lat;
  const lng = alert.gps_lng ?? alert.location?.longitude ?? alert.location?.lng;
  if (lat === null || lat === undefined || lng === null || lng === undefined) return null;
  const parsedLat = Number(lat);
  const parsedLng = Number(lng);
  if (isNaN(parsedLat) || isNaN(parsedLng)) return null;
  return { lat: parsedLat, lng: parsedLng };
}

function getMarkerColor(item: MapAlert): string {
  if (item._reportType === "safe_chat") return "#3B6FE8";
  if (item.status === "resolved") return "#10B981";
  if (item.status === "acknowledged") return "#F59E0B";
  return "#EF4444";
}

function getMarkerLabel(item: MapAlert): string {
  if (item._reportType === "safe_chat") return "RPT";
  if (item.status === "resolved") return "✓";
  return "SOS";
}

function getPopupContent(item: MapAlert, bg: string): string {
  const isReport = item._reportType === "safe_chat";
  const name = item.user?.name || item.user_name || "Unknown";
  const text = item.transcribed_text || item.description || "";
  const caseId = String(item.id).slice(-6).toUpperCase();
  const shortId = isReport ? `#RPT-${caseId}` : `#CASE-${caseId}`;
  const typeTag = isReport
    ? '<span style="display:inline-block;padding:2px 6px;border-radius:3px;background:#3B6FE8;color:#fff;font-size:9px;font-weight:700;">SafeChat</span>'
    : '<span style="display:inline-block;padding:2px 6px;border-radius:3px;background:#EF4444;color:#fff;font-size:9px;font-weight:700;">SOS</span>';
  const statusColor = item.status === "resolved" ? "#10B981" : item.status === "closed" ? "#64748B" : bg;
  const location = item.location?.address || `${Number(item.gps_lat || 0).toFixed(4)}, ${Number(item.gps_lng || 0).toFixed(4)}`;
  return `
    <div style="padding:0; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif; min-width:220px; max-width:280px;">
      <div style="padding:10px 28px 8px 12px; border-bottom:1px solid rgba(255,255,255,0.08);">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:4px;">
          <span style="font-size:10px;color:#94a3b8;font-family:monospace;letter-spacing:0.03em;">${shortId}</span>
          ${typeTag}
        </div>
        <div style="font-size:13px;font-weight:700;color:#f1f5f9;margin-bottom:6px;">${name}</div>
        ${text ? `<div style="font-size:11px;color:#94a3b8;line-height:1.4;margin-bottom:6px;">${text.length > 80 ? text.slice(0, 80) + "…" : text}</div>` : ""}
        <div style="display:flex;align-items:center;gap:6px;font-size:10px;color:#ffff;margin-bottom:2px;">
          <span> 𖡡 </span> <span>${location}</span>
        </div>
        <div style="display:flex;align-items:center;gap:6px;font-size:10px;color:${statusColor};font-weight:700;text-transform:uppercase;margin-top:4px;">
          <span style="width:6px;height:6px;border-radius:50%;background:${statusColor};display:inline-block;"></span> ${item.status?.replace(/_/g, " ")}
        </div>
      </div>
      <div style="padding:8px 12px;">
        <button class="mapbox-open-case" data-case-id="${item.id}" style="width:100%;padding:6px 10px;border:none;border-radius:5px;background:#3B6FE8;color:#fff;font-size:11px;font-weight:600;cursor:pointer;transition:background 0.15s;">${isReport ? "View report →" : "Open case →"}</button>
      </div>
    </div>
  `;
}

export default function MapboxView({
  alerts = [],
  selectedAlertId,
  onSelectAlert,
  onOpenCase,
  center,
  zoom = 12,
  mapStyle = "dark",
  interactive = true,
  showControls = true,
  className = "",
  agencyLocation,
  compact = false,
}: MapboxViewProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<{ [id: string]: mapboxgl.Marker }>({});
  const agencyMarkerRef = useRef<mapboxgl.Marker | null>(null);
  const routeSourceRef = useRef<string | null>(null);
  const routeLabelRef = useRef<mapboxgl.Marker | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  const initialCenter: [number, number] = center || (
    agencyLocation && agencyLocation.longitude && agencyLocation.latitude
      ? [agencyLocation.longitude, agencyLocation.latitude]
      : [7.515401, 8.92997]
  );

  // Marker sizing based on compact prop
  const pinSize = compact ? 16 : 26;
  const pinSizeSelected = compact ? 24 : 34;
  const fontSize = compact ? 7 : 10;
  const fontSizeSelected = compact ? 9 : 13;
  const borderWidth = compact ? "1.5px" : "2px";
  const borderWidthSelected = compact ? "2px" : "3px";
  const agencySize = compact ? 26 : 38;

  // 1. Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    mapboxgl.accessToken = DEFAULT_MAPBOX_TOKEN;
    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: STYLE_URLS[mapStyle] || STYLE_URLS.dark,
      center: initialCenter,
      zoom,
      interactive,
      attributionControl: false,
    });
    if (showControls && interactive) {
      map.addControl(new mapboxgl.NavigationControl({ showCompass: true }), "top-right");
      map.addControl(new mapboxgl.FullscreenControl(), "top-right");
    }
    map.on("load", () => setMapLoaded(true));
    mapRef.current = map;
    return () => { map.remove(); };
  }, []);

  // 2. Style switcher
  useEffect(() => {
    if (!mapRef.current || !mapLoaded) return;
    mapRef.current.setStyle(STYLE_URLS[mapStyle] || STYLE_URLS.dark);
  }, [mapStyle]);

  // 2b. Event delegation for "Open case" buttons inside popups
  useEffect(() => {
    const container = mapContainerRef.current;
    if (!container) return;
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const link = target.closest(".mapbox-open-case") as HTMLElement | null;
      if (!link) return;
      e.preventDefault();
      const caseId = link.dataset.caseId;
      if (!caseId) return;
      const alert = alerts.find((a) => String(a.id) === String(caseId));
      if (alert && onOpenCase) onOpenCase(alert);
    };
    container.addEventListener("click", handleClick);
    return () => container.removeEventListener("click", handleClick);
  }, [alerts, onOpenCase]);

  // 3. Agency HQ marker
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded || !agencyLocation) return;
    const lat = agencyLocation.latitude;
    const lng = agencyLocation.longitude;
    if (!lat || !lng) return;
    if (agencyMarkerRef.current) agencyMarkerRef.current.remove();

    const isUserLocation = !agencyLocation.name;
    const wrapper = document.createElement("div");
    wrapper.className = "cursor-pointer select-none";
    const inner = document.createElement("div");
    inner.className = "transition-all duration-200 hover:scale-110 flex items-center justify-center";
    if (isUserLocation) {
      inner.style.width = `${16}px`;
      inner.style.height = `${16}px`;
      inner.style.borderRadius = "50%";
      inner.style.backgroundColor = "#3B6FE8";
      inner.style.border = "3px solid #FFFFFF";
      inner.style.boxShadow = "0 0 0 6px rgba(59,111,232,0.25), 0 0 16px rgba(59,111,232,0.6)";
    } else {
      inner.style.width = `${20}px`;
      inner.style.height = `${20}px`;
      inner.style.borderRadius = "12px";
      inner.style.backgroundColor = "#eb0000";
      inner.style.border = "2.5px solid #FFFFFF";
      inner.style.boxShadow = "0 8px 20px rgba(53, 63, 171, 0.6)";
    }
    inner.style.fontSize = `${agencySize * 0.47}px`;
    inner.title = agencyLocation.name || "Your Location";
    wrapper.appendChild(inner);

    const popup = isUserLocation
      ? new mapboxgl.Popup({ offset: 25 }).setHTML(`
      <div style="padding:10px 12px; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif; min-width:160px; text-align:center;">
        <div style="font-weight:800; font-size:13px; color:#f1f5f9;">Your Location</div>
        <div style="font-size:11px; color:#94a3b8; margin-top:2px;">Live GPS — route origin</div>
      </div>
    `)
      : new mapboxgl.Popup({ offset: 25 }).setHTML(`
      <div style="padding:10px 12px; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif; min-width:180px; text-align:center;">
        <div style="font-weight:800; font-size:13px; color:#f1f5f9;">${agencyLocation.name}</div>
        <div style="font-size:11px; color:#94a3b8; margin-top:2px;">Agency Command Headquarters & Dispatch</div>
      </div>
    `);
    agencyMarkerRef.current = new mapboxgl.Marker({ element: wrapper }).setLngLat([lng, lat]).setPopup(popup).addTo(map);
  }, [mapLoaded, agencyLocation, agencySize]);

  // 4. Alert/report markers
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded) return;

    const currentIds = new Set(alerts.map((a) => String(a.id)));
    Object.keys(markersRef.current).forEach((id) => {
      if (!currentIds.has(id)) {
        markersRef.current[id].remove();
        delete markersRef.current[id];
      }
    });

    alerts.forEach((alert) => {
      const coords = getAlertCoords(alert);
      if (!coords) return;
      const isSelected = String(alert.id) === String(selectedAlertId);
      const bg = getMarkerColor(alert);
      const label = getMarkerLabel(alert);

      let marker = markersRef.current[String(alert.id)];

      if (!marker) {
        const wrapper = document.createElement("div");
        wrapper.className = "cursor-pointer select-none";
        const inner = document.createElement("div");
        inner.className = "marker-pin transition-all duration-200 hover:scale-120 flex items-center justify-center font-bold";
        inner.style.width = `${isSelected ? pinSizeSelected : pinSize}px`;
        inner.style.height = `${isSelected ? pinSizeSelected : pinSize}px`;
        inner.style.borderRadius = "50%";
        inner.style.color = "#FFFFFF";
        inner.style.fontSize = `${isSelected ? fontSizeSelected : fontSize}px`;
        inner.style.border = `${isSelected ? borderWidthSelected : borderWidth} solid #FFFFFF`;
        inner.style.backgroundColor = bg;
        inner.style.boxShadow = isSelected ? `0 0 16px ${bg}, 0 0 32px ${bg}` : `0 4px 10px ${bg}90`;
        inner.innerHTML = label;
        wrapper.appendChild(inner);

        wrapper.addEventListener("click", () => onSelectAlert?.(alert));
        const popup = new mapboxgl.Popup({ offset: 20 }).setHTML(getPopupContent(alert, bg));
        marker = new mapboxgl.Marker({ element: wrapper }).setLngLat([coords.lng, coords.lat]).setPopup(popup).addTo(map);
        markersRef.current[String(alert.id)] = marker;
      } else {
        const wrapper = marker.getElement();
        const inner = wrapper.querySelector(".marker-pin") as HTMLElement | null;
        if (inner) {
          inner.style.width = `${isSelected ? pinSizeSelected : pinSize}px`;
          inner.style.height = `${isSelected ? pinSizeSelected : pinSize}px`;
          inner.style.fontSize = `${isSelected ? fontSizeSelected : fontSize}px`;
          inner.style.border = `${isSelected ? borderWidthSelected : borderWidth} solid #FFFFFF`;
          inner.style.backgroundColor = bg;
          inner.style.boxShadow = isSelected ? `0 0 16px ${bg}, 0 0 32px ${bg}` : `0 4px 10px ${bg}90`;
          inner.innerHTML = label;
        }
        marker.setLngLat([coords.lng, coords.lat]);
      }
    });
  }, [alerts, selectedAlertId, mapLoaded, pinSize, pinSizeSelected, fontSize, fontSizeSelected, borderWidth, borderWidthSelected, onSelectAlert]);

  // 5. Route line from HQ to selected marker (follows roads via Mapbox Directions API)
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded) return;
    let cancelled = false;

    // Remove old route
    if (routeSourceRef.current) {
      if (map.getLayer("route-line")) map.removeLayer("route-line");
      if (map.getLayer("route-casing")) map.removeLayer("route-casing");
      if (map.getLayer("route-dots")) map.removeLayer("route-dots");
      if (map.getSource(routeSourceRef.current)) map.removeSource(routeSourceRef.current);
      routeSourceRef.current = null;
    }
    if (routeLabelRef.current) {
      routeLabelRef.current.remove();
      routeLabelRef.current = null;
    }

    if (!selectedAlertId || !agencyLocation) return;
    const selected = alerts.find((a) => String(a.id) === String(selectedAlertId));
    if (!selected) return;
    const targetCoords = getAlertCoords(selected);
    if (!targetCoords) return;

    const hqLng = agencyLocation.longitude;
    const hqLat = agencyLocation.latitude;
    const color = getMarkerColor(selected);
    const sourceId = `route-${Date.now()}`;
    routeSourceRef.current = sourceId;

    // Fallback: straight line (instant, no API call needed for close-by points)
    const drawStraightLine = () => {
      if (cancelled) return;
      map.addSource(sourceId, {
        type: "geojson",
        data: {
          type: "Feature",
          properties: {},
          geometry: {
            type: "LineString",
            coordinates: [[hqLng, hqLat], [targetCoords.lng, targetCoords.lat]],
          },
        },
      });
      map.addLayer({
        id: "route-casing",
        type: "line",
        source: sourceId,
        layout: { "line-join": "round", "line-cap": "round" },
        paint: { "line-color": "#000", "line-width": 5, "line-opacity": 0.3 },
      });
      map.addLayer({
        id: "route-line",
        type: "line",
        source: sourceId,
        layout: { "line-join": "round", "line-cap": "round" },
        paint: { "line-color": color, "line-width": 3, "line-dasharray": [6, 4], "line-opacity": 0.9 },
      });
    };

    // Try Mapbox Directions API for road-following route
    const fetchRoute = async () => {
      try {
        const coords = `${hqLng},${hqLat};${targetCoords.lng},${targetCoords.lat}`;
        const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${coords}?access_token=${DEFAULT_MAPBOX_TOKEN}&geometries=geojson&overview=full`;
        const res = await fetch(url);
        const data = await res.json();
        if (cancelled) return;

        const routeObj = data?.routes?.[0];
        const route = routeObj?.geometry?.coordinates;
        if (!route || route.length < 2) {
          drawStraightLine();
          return;
        }

        map.addSource(sourceId, {
          type: "geojson",
          data: {
            type: "Feature",
            properties: {},
            geometry: { type: "LineString", coordinates: route },
          },
        });

        // Casing (dark outline for contrast)
        map.addLayer({
          id: "route-casing",
          type: "line",
          source: sourceId,
          layout: { "line-join": "round", "line-cap": "round" },
          paint: { "line-color": "#000", "line-width": 7, "line-opacity": 0.35 },
        });

        // Main road line
        map.addLayer({
          id: "route-line",
          type: "line",
          source: sourceId,
          layout: { "line-join": "round", "line-cap": "round" },
          paint: { "line-color": color, "line-width": 4, "line-opacity": 0.9 },
        });

        // Show distance + duration label at route midpoint
        if (routeObj?.distance != null && routeObj?.duration != null && !cancelled) {
          const midIdx = Math.floor(route.length / 2);
          const midCoord = route[midIdx];
          const distM = routeObj.distance;
          const durS = routeObj.duration;
          const distLabel = distM < 1000 ? `${Math.round(distM)} m` : `${(distM / 1000).toFixed(1)} km`;
          const durMins = Math.round(durS / 60);
          const durLabel = durMins < 60 ? `${durMins} min` : `${Math.floor(durMins / 60)}h ${durMins % 60}m`;

          const el = document.createElement("div");
          el.style.cssText = `
            background: rgba(15,23,42,0.88); color: #ffffff; padding: 5px 10px;
            border-radius: 6px; font-size: 11px; font-weight: 600; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            white-space: nowrap; pointer-events: none; border: 1px solid rgba(255,255,255,0.12);
            box-shadow: 0 2px 8px rgba(0,0,0,0.4); display: flex; align-items: center; gap: 6px;
          `;
          el.innerHTML = `<span style="color:#ffffff;">➣</span> ${distLabel} <span style="color:#ffffff;">|</span> <span style="color:#ffffff;">⏱</span> ${durLabel}`;

          routeLabelRef.current = new mapboxgl.Marker({ element: el, offset: [0, -10] })
            .setLngLat(midCoord)
            .addTo(map);
        }
      } catch {
        if (!cancelled) drawStraightLine();
      }
    };

    fetchRoute();

    return () => { cancelled = true; if (routeLabelRef.current) { routeLabelRef.current.remove(); routeLabelRef.current = null; } };
  }, [selectedAlertId, mapLoaded, alerts, agencyLocation]);

  // 6. Camera focus
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded || !selectedAlertId) return;
    const selected = alerts.find((a) => String(a.id) === String(selectedAlertId));
    const coords = getAlertCoords(selected);
    if (coords) {
      map.flyTo({ center: [coords.lng, coords.lat], zoom: 15, essential: true, duration: 1000 });
      const marker = markersRef.current[String(selectedAlertId)];
      if (marker) {
        const popup = marker.getPopup();
        if (popup && !popup.isOpen()) marker.togglePopup();
      }
    }
  }, [selectedAlertId, mapLoaded, alerts]);

  // 7. Resize handler
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded) return;
    const onResize = () => map.resize();
    window.addEventListener("resize", onResize);
    const ro = new ResizeObserver(() => map.resize());
    if (mapContainerRef.current) ro.observe(mapContainerRef.current);
    const t = setTimeout(() => map.resize(), 250);
    return () => {
      window.removeEventListener("resize", onResize);
      ro.disconnect();
      clearTimeout(t);
    };
  }, [mapLoaded]);

  return (
    <div className={className} style={{ position: "relative", width: "100%", height: "100%", minHeight: 400 }}>
      <div ref={mapContainerRef} style={{ width: "100%", height: "100%", minHeight: 400 }} />
    </div>
  );
}
