import { create } from "zustand"
import type { Alert, LiveLocationUpdate } from "@/types"

interface AlertState {
  alerts: Alert[]
  selectedAlertId: number | string | null
  soundAlertsEnabled: boolean
  isEmergencyModalOpen: boolean
  latestEmergency: Alert | null

  setAlerts: (alerts: Alert[]) => void
  addAlert: (alert: Alert) => void
  updateAlert: (alert: Alert) => void
  updateLocation: (update: LiveLocationUpdate) => void
  setSelectedAlertId: (id: number | string | null) => void
  toggleSoundAlerts: () => void
  dismissLatestEmergency: () => void
}

export const useAlertStore = create<AlertState>((set) => ({
  alerts: [],
  selectedAlertId: null,
  soundAlertsEnabled: true,
  isEmergencyModalOpen: false,
  latestEmergency: null,

  setAlerts: (alerts) => set({ alerts }),

  addAlert: (alert) =>
    set((state) => {
      const exists = state.alerts.some((a) => a.id === alert.id)
      const updated = exists ? state.alerts.map((a) => (a.id === alert.id ? alert : a)) : [alert, ...state.alerts]
      return {
        alerts: updated,
        latestEmergency: alert.priority === "high" || alert.status === "new" ? alert : state.latestEmergency,
        isEmergencyModalOpen: alert.priority === "high" || alert.status === "new",
      }
    }),

  updateAlert: (alert) =>
    set((state) => ({
      alerts: state.alerts.map((a) => (a.id === alert.id ? alert : a)),
      latestEmergency: state.latestEmergency?.id === alert.id ? alert : state.latestEmergency,
    })),

  updateLocation: (update) =>
    set((state) => ({
      alerts: state.alerts.map((a) => {
        if (a.id === update.alert_id) {
          const newTrail = a.gps_trail
            ? [...a.gps_trail, { lat: update.latitude, lng: update.longitude, timestamp: update.timestamp }]
            : [{ lat: update.latitude, lng: update.longitude, timestamp: update.timestamp }]
          return {
            ...a,
            location: {
              latitude: update.latitude,
              longitude: update.longitude,
              address: a.location?.address,
            },
            gps_trail: newTrail,
          }
        }
        return a
      }),
    })),

  setSelectedAlertId: (id) => set({ selectedAlertId: id }),

  toggleSoundAlerts: () => set((state) => ({ soundAlertsEnabled: !state.soundAlertsEnabled })),

  dismissLatestEmergency: () => set({ isEmergencyModalOpen: false, latestEmergency: null }),
}))
