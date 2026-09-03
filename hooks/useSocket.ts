"use client"

import { useEffect, useRef } from "react"
import { io, Socket } from "socket.io-client"
import { useAgencyAuthStore } from "@/lib/store/agency-auth-store"
import { useAlertStore } from "@/stores/useAlertStore"
import type { Alert, LiveLocationUpdate } from "@/types"

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || "https://besafe-server-production.up.railway.app"

let globalSocket: Socket | null = null

export function useSocket() {
  const { agency, token } = useAgencyAuthStore()
  const { addAlert, updateLocation, updateAlert, soundAlertsEnabled } = useAlertStore()
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    if (typeof window !== "undefined") {
      audioRef.current = new Audio("/sounds/emergency-alert.mp3")
    }
  }, [])

  const playChime = () => {
    if (soundAlertsEnabled && audioRef.current) {
      audioRef.current.play().catch(() => {
        // audio playback was prevented by browser autoplay policy
      })
    }
  }

  useEffect(() => {
    if (!agency?.id || !token) {
      if (globalSocket) {
        globalSocket.disconnect()
        globalSocket = null
      }
      return
    }

    if (!globalSocket) {
      globalSocket = io(SOCKET_URL, {
        transports: ["websocket", "polling"],
        auth: { token },
        reconnection: true,
        reconnectionAttempts: 10,
        reconnectionDelay: 1000,
      })
    }

    const socket = globalSocket

    socket.on("connect", () => {
      console.log("🟢 [Socket.IO] Connected to BeSafe Emergency Dispatcher")
      socket.emit("join", { agency_id: agency.id })
    })

    socket.on("new_alert", (alert: Alert) => {
      console.log("🚨 [Socket.IO] New Incoming Emergency Alert:", alert)
      addAlert(alert)
      playChime()
    })

    // Server emits { alert_id, lat, lng, recorded_at }; normalize to LiveLocationUpdate
    socket.on("location_update", (raw: {
      alert_id?: string | number;
      lat?: number;
      lng?: number;
      latitude?: number;
      longitude?: number;
      recorded_at?: string;
      timestamp?: string;
    }) => {
      const alert_id = raw?.alert_id
      const latitude = raw?.lat ?? raw?.latitude
      const longitude = raw?.lng ?? raw?.longitude
      if (alert_id == null || latitude == null || longitude == null) return
      const update: LiveLocationUpdate = {
        alert_id,
        latitude,
        longitude,
        timestamp: raw?.recorded_at ?? raw?.timestamp ?? new Date().toISOString(),
      }
      updateLocation(update)
    })

    // Server emits alert_status_update with { alert_id, status }; merge into store
    socket.on("alert_status_update", (raw: {
      alert_id?: string | number;
      status?: string;
    }) => {
      const id = raw?.alert_id
      if (id == null || !raw?.status) return
      const existing = useAlertStore.getState().alerts.find((a) => String(a.id) === String(id))
      if (existing) {
        updateAlert({ ...existing, status: raw.status as Alert["status"] })
      }
    })

    // Server emits alert_assigned with { alert_id, staff_id, staff_name }
    socket.on("alert_assigned", (raw: {
      alert_id?: string | number;
      staff_id?: string | null;
      staff_name?: string | null;
    }) => {
      const id = raw?.alert_id
      if (id == null) return
      const existing = useAlertStore.getState().alerts.find((a) => String(a.id) === String(id))
      if (existing) {
        updateAlert({
          ...existing,
          assigned_staff_id: raw?.staff_id ?? existing.assigned_staff_id,
          assigned_staff_name: raw?.staff_name ?? existing.assigned_staff_name,
        })
      }
    })

    socket.on("disconnect", (reason) => {
      console.warn("🔴 [Socket.IO] Disconnected:", reason)
    })

    return () => {
      socket.off("connect")
      socket.off("new_alert")
      socket.off("location_update")
      socket.off("alert_status_update")
      socket.off("alert_assigned")
      socket.off("disconnect")
    }
  }, [agency?.id, token])

  return { socket: globalSocket }
}
