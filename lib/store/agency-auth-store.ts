import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { AgencyProfile, AgencyRole } from "@/types/auth"

interface AgencyAuthStore {
  user: AgencyProfile | null
  agency: AgencyProfile | null
  token: string | null
  isAuthenticated: boolean
  setAuth: (token: string, profile: AgencyProfile, agency?: AgencyProfile | null) => void
  setAgency: (agency: AgencyProfile) => void
  setUser: (user: AgencyProfile) => void
  clearAuth: () => void
  isRole: (role: AgencyRole) => boolean
  hasAnyRole: (roles: AgencyRole[]) => boolean
  isAgencyAdmin: () => boolean
}

export const useAgencyAuthStore = create<AgencyAuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      agency: null,
      token: null,
      isAuthenticated: false,

      setAuth: (token, profile, explicitAgency) => {
        const agencyContext = explicitAgency || profile.agency || (profile.role === "AGENCY_ADMIN" ? profile : null)
        set({
          token,
          user: profile,
          agency: agencyContext,
          isAuthenticated: true,
        })
      },

      setAgency: (agency) => {
        set({ agency })
      },

      setUser: (user) => {
        set({ user })
      },

      clearAuth: () => {
        set({ user: null, agency: null, token: null, isAuthenticated: false })
      },

      isRole: (role) => {
        const user = get().user
        if (!user) return false
        return user.role === role
      },

      hasAnyRole: (roles) => {
        const user = get().user
        if (!user) return false
        return roles.includes(user.role)
      },

      isAgencyAdmin: () => {
        const user = get().user
        if (!user) return false
        return user.role === "AGENCY_ADMIN"
      },
    }),
    {
      name: "besafe-agency-auth",
    }
  )
)
