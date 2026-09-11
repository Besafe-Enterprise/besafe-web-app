"use client";
import React from "react";
import { CloudOff, CheckCircle2 } from "lucide-react";

/**
 * Honest connectivity state. The current architecture has no offline queue, so
 * we only ever report what's true: connected, or offline (actions may fail).
 */
export function SyncIndicator({ online }: { online: boolean }) {
  if (online) {
    return (
      <div className="field-sync field-sync--ok">
        <CheckCircle2 width={16} height={16} />
        <span>Connected · updates live</span>
      </div>
    );
  }
  return (
    <div className="field-sync field-sync--off">
      <CloudOff width={16} height={16} />
      <span>Offline · changes may not save</span>
    </div>
  );
}
