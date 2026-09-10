import axios from "axios"
import { parseCookies, destroyCookie } from "nookies"

// Default to local Flask backend server
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:5000"

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 15000,
})

// Request interceptor to attach JWT Token from cookies or localStorage
apiClient.interceptors.request.use(
  (config) => {
    // Let browser set multipart boundary for FormData — don't send application/json
    if (config.data instanceof FormData && config.headers) {
      delete (config.headers as Record<string, unknown>)["Content-Type"]
      delete (config.headers as Record<string, unknown>)["content-type"]
    }
    if (typeof window !== "undefined") {
      const cookies = parseCookies()
      const token =
        cookies.agencyAccessToken ||
        localStorage.getItem("besafe_agency_token")
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`
      }
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Response interceptor: handle 401 without hard window.location reload loops
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && typeof window !== "undefined") {
      destroyCookie(null, "agencyAccessToken", { path: "/" })
      destroyCookie(null, "agencyRefreshToken", { path: "/" })
      destroyCookie(null, "besafe_agency_token", { path: "/" })
      localStorage.removeItem("besafe_agency_token")
      localStorage.removeItem("besafe_agency_profile")
    }
    return Promise.reject(error)
  }
)
