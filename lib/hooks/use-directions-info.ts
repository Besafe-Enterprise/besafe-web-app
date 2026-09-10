import { useQuery } from "@tanstack/react-query";

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || "";

interface DirectionsResult {
  distance: number;
  duration: number;
}

async function fetchDirections(
  fromLng: number,
  fromLat: number,
  toLng: number,
  toLat: number
): Promise<DirectionsResult> {
  const coords = `${fromLng},${fromLat};${toLng},${toLat}`;
  const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${coords}?access_token=${MAPBOX_TOKEN}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Directions API error");
  const data = await res.json();
  const route = data?.routes?.[0];
  if (!route) throw new Error("No route found");
  return { distance: route.distance, duration: route.duration };
}

export function useDirectionsInfo(
  from: { lat: number; lng: number } | null,
  to: { lat: number; lng: number } | null,
  enabled = true
) {
  return useQuery<DirectionsResult, Error>({
    queryKey: ["directions", from?.lat, from?.lng, to?.lat, to?.lng],
    queryFn: () => fetchDirections(from!.lng, from!.lat, to!.lng, to!.lat),
    enabled: enabled && !!from && !!to && !!MAPBOX_TOKEN,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
}
