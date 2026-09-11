"use client";

import { useEffect, useState } from "react";

/** Tracks the browser's real network connectivity state. */
export function useOnline(): boolean {
  const [online, setOnline] = useState<boolean>(
    typeof navigator !== "undefined" ? navigator.onLine : true
  );

  useEffect(() => {
    const onOffline = () => setOnline(false);
    const onOnline = () => setOnline(true);
    window.addEventListener("offline", onOffline);
    window.addEventListener("online", onOnline);
    return () => {
      window.removeEventListener("offline", onOffline);
      window.removeEventListener("online", onOnline);
    };
  }, []);

  return online;
}
