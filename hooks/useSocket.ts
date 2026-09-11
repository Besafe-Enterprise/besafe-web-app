"use client"

import { useEffect, useRef } from "react"
import { io, Socket } from "socket.io-client"
import { useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { useAgencyAuthStore } from "@/lib/store/agency-auth-store"
import { useAlertStore } from "@/stores/useAlertStore"
import { playDong } from "@/lib/operations/sound"
import type { Alert, LiveLocationUpdate } from "@/types"

interface AgencyPush {
  id?: string;
  title: string;
  body: string;
  type: string;
  data?: Record<string, unknown>;
  agency_id?: string;
}

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || "https://besafe-server-production.up.railway.app"

let globalSocket: Socket | null = null
let listenersAttachedFor: string | null = null
let listenersRefCount = 0
const lastToastAt: Record<string, number> = {}
let lastDongAt = 0
function dedupToast(key: string, fn: () => void) {
  const now = Date.now()
  if (lastToastAt[key] && now - lastToastAt[key] < 2500) return
  lastToastAt[key] = now
  fn()
}
function dedupDong() {
  const now = Date.now()
  if (now - lastDongAt < 1200) return false
  lastDongAt = now
  return true
}

const NOTIF_PREFS_KEY = "besafe_notif_prefs"
function isNotifEnabled(category: "newEmergencies" | "statusChanges" | "assignments" | "newReports"): boolean {
  try {
    const raw = typeof window !== "undefined" ? localStorage.getItem(NOTIF_PREFS_KEY) : null
    if (!raw) return true
    const prefs = JSON.parse(raw)
    return prefs[category] !== false
  } catch {
    return true
  }
}

export function useSocket() {
  const { agency, token, user } = useAgencyAuthStore()
  const { addAlert, updateLocation, updateAlert } = useAlertStore()
  const queryClient = useQueryClient()

  const safePlayDong = () => {
    if (!dedupDong()) return
    if (useAlertStore.getState().soundAlertsEnabled) playDong()
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
        // threading mode on Windows (werkzeug) can't handle websocket upgrade -> 500 write() before start_response; prefer polling
        transports: ["polling", "websocket"],
        auth: { token },
        reconnection: true,
        reconnectionAttempts: 10,
        reconnectionDelay: 1000,
      })
    }

    const socket = globalSocket

    const isField = user?.role === "FIELD_AGENT"
    const attachKey = `${agency.id}:${isField ? "field" : "agency"}:${token?.slice(0, 8) || ""}`
    if (listenersAttachedFor === attachKey) {
      listenersRefCount++
      return () => {
        listenersRefCount--
      }
    }
    listenersAttachedFor = attachKey
    listenersRefCount = 1
    // Dedup: ensure single listener per event even if multiple components mount useSocket
    ;[
      "connect",
      "new_alert",
      "location_update",
      "alert_status_update",
      "alert_assigned",
      "notification",
      "application:submitted",
      "application:resolved",
      "report:submitted",
      "report_assigned",
      "report_status_update",
      "case_updated",
      "worker_declined",
      "worker_accepted",
      "new_report",
      "field_location_update",
      "field_progress",
      "disconnect",
    ].forEach((e) => socket.off(e))

    socket.on("connect", () => {
      console.log("🟢 [Socket.IO] Connected to BeSafe Emergency Dispatcher")
      socket.emit("join", { agency_id: agency.id })
      if (isField && token) {
        socket.emit("field:join", { token })
      }
    })

    socket.on("new_alert", (alert: Alert) => {
      console.log("🚨 [Socket.IO] New Incoming Emergency Alert:", alert)
      addAlert(alert)
      safePlayDong()
      queryClient.invalidateQueries({ queryKey: ["dispatch"] })
      if (!isField && isNotifEnabled("newEmergencies")) {
        dedupToast(`new_alert:${alert.id}`, () => {
          safePlayDong()
          toast.info("New emergency", { id: `new_alert:${alert.id}`, description: `${alert.user?.name || "Citizen"} — ${alert.description?.slice(0, 60) || "SOS"}` })
        })
      }
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

    // Server emits alert_status_update with { alert_id, status, assignment_status, priority_label, priority_score, escalated }; merge into store + real-time toast + KPI refresh
    socket.on("alert_status_update", (raw: {
      alert_id?: string | number;
      status?: string;
      assignment_status?: string | null;
      priority_label?: string;
      priority_score?: number;
      escalated?: boolean;
      accepted?: boolean;
    }) => {
      const id = raw?.alert_id
      if (id == null) return
      const existing = useAlertStore.getState().alerts.find((a) => String(a.id) === String(id))
      if (existing) {
        const patch: Partial<Alert> = {}
        if (raw.status) patch.status = raw.status as Alert["status"]
        if ((raw as Record<string, unknown>).assignment_status !== undefined) patch.assignment_status = raw.assignment_status as Alert["assignment_status"]
        else if (raw.accepted) patch.assignment_status = "accepted"
        if (raw.priority_label) {
          patch.priority_label = raw.priority_label
          patch.priority = raw.priority_label.toLowerCase() as Alert["priority"]
        }
        if (raw.priority_score != null) patch.priority_score = raw.priority_score
        updateAlert({ ...existing, ...patch })
      }
      queryClient.invalidateQueries({ queryKey: ["dispatch"] })
      queryClient.invalidateQueries({ queryKey: ["agency", "team", "detail"] })
      // Suppress duplicate toast for acceptance handshake — worker_accepted will toast instead
      if (raw.status === "assigned" && raw.assignment_status === "accepted") {
        if (isField) queryClient.invalidateQueries({ queryKey: ["field"] })
        return
      }
      if (!isField && isNotifEnabled("statusChanges")) {
        const label = raw.priority_label || raw.status
        dedupToast(`alert_status:${id}:${raw.status}`, () => {
          safePlayDong()
          toast.info(raw.escalated ? `Case #${String(id).slice(-6).toUpperCase()} escalated → ${raw.priority_label}` : `Case #${String(id).slice(-6).toUpperCase()} status → ${raw.status}`, { id: `alert_status:${id}:${raw.status}`, description: raw.escalated ? `Priority is now ${raw.priority_label}` : `Case status is now ${raw.status?.replace(/_/g, " ")}` })
        })
      } else if (isField && raw.escalated) {
        queryClient.invalidateQueries({ queryKey: ["field"] })
        dedupToast(`alert_status:${id}:escalated`, () => {
          safePlayDong()
          toast.warning(`Priority escalated → ${raw.priority_label}`, { id: `alert_status:${id}:escalated`, description: `Case #${String(id).slice(-6).toUpperCase()} is now ${raw.priority_label}` })
        })
      } else if (isField) {
        queryClient.invalidateQueries({ queryKey: ["field"] })
      }
    })

    // Server emits alert_assigned with { alert_id, staff_id, staff_name, status, assignment_status } — pending handshake
    socket.on("alert_assigned", (raw: {
      alert_id?: string | number;
      staff_id?: string | null;
      staff_name?: string | null;
      status?: string;
      assignment_status?: string | null;
    }) => {
      const id = raw?.alert_id
      if (id == null) return
      const existing = useAlertStore.getState().alerts.find((a) => String(a.id) === String(id))
      if (existing) {
        const patch: Partial<typeof existing> = {
          assigned_staff_id: raw?.staff_id ?? existing.assigned_staff_id,
          assigned_staff_name: raw?.staff_name ?? existing.assigned_staff_name,
        } as Partial<typeof existing>
        if ((raw as Record<string, unknown>).status) (patch as Record<string, unknown>).status = raw.status
        if ((raw as Record<string, unknown>).assignment_status !== undefined) (patch as Record<string, unknown>).assignment_status = (raw as Record<string, unknown>).assignment_status
        updateAlert({ ...existing, ...patch })
      }
      queryClient.invalidateQueries({ queryKey: ["dispatch"] })
      queryClient.invalidateQueries({ queryKey: ["agency", "team", "detail"] })
      queryClient.invalidateQueries({ queryKey: ["field"] })
      if (!isField && raw.staff_id && isNotifEnabled("assignments")) {
        const isPending = (raw as Record<string, unknown>).assignment_status === "pending" || raw.status === "pending_acceptance"
        if (isPending) {
          dedupToast(`alert_assigned:${id}:pending`, () => {
            toast.info(`Case ${String(id).slice(-6).toUpperCase()} pending acceptance`, { id: `alert_assigned:${id}:pending`, description: `Awaiting ${raw.staff_name || "worker"} to accept` })
          })
        } else {
          dedupToast(`alert_assigned:${id}`, () => {
            safePlayDong()
            toast.info(`Case ${String(id).slice(-6).toUpperCase()} assigned`, { id: `alert_assigned:${id}`, description: `Assigned to ${raw.staff_name || "worker"}` })
          })
        }
      }
    })

    // FIELD_AGENT personal notifications — also refresh reported-cases list when report assigned
    socket.on("notification", (n: {
      id: string;
      title: string;
      body: string;
      type: string;
      data?: Record<string, unknown>;
      agency_id?: string;
    }) => {
      console.log("🔔 [Socket.IO] Field notification:", n)
      queryClient.invalidateQueries({ queryKey: ["field"] })
      if (String(n.type || "").includes("case")) {
        queryClient.invalidateQueries({ queryKey: ["dispatch"] })
      }
      // Skip toast for status/assignment/worker types — dedicated handlers already toast, so notification would be a duplicate
      if (String(n.type || "").includes("status") || String(n.type || "").includes("assign") || String(n.type || "").includes("worker_")) return
      if (!n.title || !String(n.title).trim()) return
      dedupToast(`notif:${n.id || n.type}`, () => {
        safePlayDong()
        toast.info(n.title, { id: n.id || `notif:${n.type}`, description: n.body })
      })
    })

    // Agency command-center pushes — deduped so 2-3 toasts don't stack
    const onAgencyPush = (event: string) => (n: AgencyPush) => {
      console.log(`🔔 [Socket.IO] ${event}:`, n)
      if (!isField) {
        queryClient.invalidateQueries({ queryKey: ["agency"] })
      }
      if (event === "report:submitted" || event === "case_updated") {
        queryClient.invalidateQueries({ queryKey: ["dispatch"] })
        queryClient.invalidateQueries({ queryKey: ["agency", "team", "detail"] })
      }
      // Skip case_updated for status/assigned/evidence/report kinds —
      // dedicated handlers (alert_status_update, alert_assigned, report_assigned, etc.) toast already
      if (!isField) {
        if (!n.title || !String(n.title).trim()) return
        const raw = n as unknown as Record<string, unknown>
        const kind = raw.kind as string | undefined
        if (event === "case_updated" && kind) return
        const category = event === "report:submitted" ? "newReports" : event === "case_updated" ? "statusChanges" : "assignments"
        if (!isNotifEnabled(category as "newReports" | "statusChanges" | "assignments")) return
        const key = `${event}:${n.id || n.data?.alert_id || n.data?.report_id || n.title}`
        dedupToast(key, () => {
          safePlayDong()
          toast.info(n.title, { id: key, description: n.body })
        })
      }
    }

    socket.on("application:submitted", onAgencyPush("application:submitted"))
    socket.on("application:resolved", onAgencyPush("application:resolved"))
    socket.on("report:submitted", onAgencyPush("report:submitted"))
    socket.on("case_updated", onAgencyPush("case_updated"))
    socket.on("new_report", (report: Record<string, unknown>) => {
      console.log("📋 [Socket.IO] new_report:", report)
      queryClient.invalidateQueries({ queryKey: ["dispatch"] })
      queryClient.invalidateQueries({ queryKey: ["agency"] })
      if (!isField && isNotifEnabled("newReports")) {
        dedupToast(`new_report:${report.id}`, () => {
          safePlayDong()
          toast.info("New SafeChat report", { id: `new_report:${report.id}`, description: `Report from ${String(report.user_name || "citizen")} — ${(report.category || report.incident_type || "report") as string}` })
        })
      }
    })
    socket.on("worker_declined", (p: Record<string, unknown>) => {
      console.log("🚫 [Socket.IO] worker_declined:", p)
      queryClient.invalidateQueries({ queryKey: ["dispatch"] })
      queryClient.invalidateQueries({ queryKey: ["agency"] })
      queryClient.invalidateQueries({ queryKey: ["field"] })
      if (!isField && isNotifEnabled("assignments")) {
        dedupToast(`worker_declined:${String(p.alert_id || p.report_id || "")}`, () => {
          safePlayDong()
          toast.warning("Case declined", { id: `worker_declined:${String(p.alert_id || p.report_id || "")}`, description: String(p.message || "A worker declined the assignment. Please reassign.") })
        })
      }
    })
    socket.on("worker_accepted", (p: Record<string, unknown>) => {
      console.log("✅ [Socket.IO] worker_accepted:", p)
      queryClient.invalidateQueries({ queryKey: ["dispatch"] })
      queryClient.invalidateQueries({ queryKey: ["agency"] })
      queryClient.invalidateQueries({ queryKey: ["field"] })
      if (isField) {
        dedupToast(`worker_accepted:${String(p.alert_id || p.report_id || "")}:field`, () => {
          toast.success("Case accepted — full access granted", { id: `worker_accepted:${String(p.alert_id || p.report_id || "")}:field` })
        })
      } else if (isNotifEnabled("assignments")) {
        const kind = p.report_id ? "Report" : "Case"
        dedupToast(`worker_accepted:${String(p.alert_id || p.report_id || "")}`, () => {
          safePlayDong()
          toast.success(`${kind} accepted`, { id: `worker_accepted:${String(p.alert_id || p.report_id || "")}`, description: String(p.message || `${p.worker_name || "Worker"} accepted the assignment.`) })
        })
      }
    })
    // Report/case assignment & status — field gets personal notification already, so agency broadcast only toasts for agency
    socket.on("report_assigned", (p: Record<string, unknown>) => {
      console.log("📌 [Socket.IO] report_assigned:", p)
      queryClient.invalidateQueries({ queryKey: ["dispatch"] })
      queryClient.invalidateQueries({ queryKey: ["agency"] })
      queryClient.invalidateQueries({ queryKey: ["field"] })
      if (!isField && isNotifEnabled("assignments")) {
        const isPending = (p as Record<string, unknown>).assignment_status === "pending" || (p as Record<string, unknown>).status === "pending_acceptance"
        const isAccepted = (p as Record<string, unknown>).assignment_status === "accepted"
        if (isAccepted) return // worker_accepted will toast — avoid triple
        if (isPending) {
          dedupToast(`report_assigned:${String(p.report_id || "")}:pending`, () => {
            toast.info("Report pending acceptance", { id: `report_assigned:${String(p.report_id || "")}:pending`, description: `Awaiting ${(p as { staff_name?: string }).staff_name || "worker"} to accept` })
          })
        } else if (p.staff_id) {
          dedupToast(`report_assigned:${String(p.report_id || "")}`, () => {
            safePlayDong()
            toast.info("Report assigned", { id: `report_assigned:${String(p.report_id || "")}`, description: `Report ${(p.report_id as string || "").slice(-6).toUpperCase()} assigned to ${String((p as { staff_name?: string }).staff_name || "worker")}` })
          })
        }
      }
    })
    socket.on("report_status_update", (p: { report_id?: string; status?: string; assignment_status?: string | null }) => {
      console.log("📝 [Socket.IO] report_status_update:", p)
      queryClient.invalidateQueries({ queryKey: ["dispatch"] })
      queryClient.invalidateQueries({ queryKey: ["agency"] })
      queryClient.invalidateQueries({ queryKey: ["field"] })
      const isAccepted = (p as Record<string, unknown>).assignment_status === "accepted" || (p.status === "assigned" && (p as Record<string, unknown>).accepted)
      if (isAccepted) return // worker_accepted handles it — avoid double
      if (!isField && isNotifEnabled("statusChanges")) {
        dedupToast(`report_status:${String(p.report_id || "")}:${p.status}`, () => {
          safePlayDong()
          toast.info("Report status changed", { id: `report_status:${String(p.report_id || "")}:${p.status}`, description: `Report ${(p.report_id || "").slice(-6).toUpperCase()} → ${p.status}` })
        })
      }
    })
    // Field worker location update (broadcast to agency room) — check-in
    socket.on("field_location_update", (raw: {
      staff_id: string;
      lat: number;
      lng: number;
      status?: string;
      recorded_at: string;
    }) => {
      console.log("📍 [Socket.IO] Field location update:", raw)
      if (!isField) {
        queryClient.invalidateQueries({ queryKey: ["agency"] })
        dedupToast(`checkin:${String(raw.staff_id)}:${raw.status}`, () => {
          safePlayDong()
          toast.info("Field check-in", { id: `checkin:${String(raw.staff_id)}`, description: `Worker ${String(raw.staff_id).slice(-6).toUpperCase()} checked in${raw.status ? ` — ${raw.status}` : ""}` })
        })
      }
    })

    // Field worker progress update
    socket.on("field_progress", (raw: {
      staff_id: string;
      alert_id?: string;
      status?: string;
      recorded_at: string;
    }) => {
      console.log("📊 [Socket.IO] Field progress:", raw)
      if (raw.alert_id) {
        queryClient.invalidateQueries({ queryKey: ["dispatch"] })
        queryClient.invalidateQueries({ queryKey: ["agency", "team", "detail"] })
      }
      if (String(raw.status || "").includes("on_case") || String(raw.status || "").includes("off_case")) {
        queryClient.invalidateQueries({ queryKey: ["field", "me"] })
      }
    })

    socket.on("disconnect", (reason) => {
      console.warn("🔴 [Socket.IO] Disconnected:", reason)
    })

    return () => {
      listenersRefCount--
      if (listenersRefCount <= 0) {
        listenersAttachedFor = null
        listenersRefCount = 0
        socket.off("connect")
        socket.off("new_alert")
        socket.off("location_update")
        socket.off("alert_status_update")
        socket.off("alert_assigned")
        socket.off("notification")
        socket.off("application:submitted")
        socket.off("application:resolved")
        socket.off("report:submitted")
        socket.off("report_assigned")
        socket.off("report_status_update")
        socket.off("case_updated")
        socket.off("worker_declined")
        socket.off("worker_accepted")
        socket.off("field_location_update")
        socket.off("field_progress")
        socket.off("disconnect")
      }
    }
  }, [agency?.id, token, user?.role])

  return { socket: globalSocket }
}
