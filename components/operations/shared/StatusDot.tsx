import React from "react";

const TONE_MAP: Record<string, string> = {
  critical: "status-dot--critical",
  high: "status-dot--high",
  medium: "status-dot--medium",
  low: "status-dot--low",
  available: "status-dot--available",
  busy: "status-dot--busy",
  "en route": "status-dot--en-route",
  enroute: "status-dot--en-route",
  "on site": "status-dot--on-site",
  onsite: "status-dot--on-site",
  offline: "status-dot--offline",
};

export function StatusDot({ tone }: { tone: string }) {
  const cls = TONE_MAP[String(tone).toLowerCase()] || "status-dot--offline";
  return <span className={`status-dot ${cls}`} />;
}
