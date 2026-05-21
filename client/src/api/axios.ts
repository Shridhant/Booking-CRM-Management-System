import axios from "axios"
import { useAuthStore } from "../store/auth.store"

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    "Content-Type": "application/json",
  },
})

// ── Request interceptor ───────────────────────
// Attaches the JWT token to every outgoing request
api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().accessToken
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// ── Response interceptor ──────────────────────
// On 401 → clear auth state → redirect to login
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout()
      window.location.href = "/login"
    }
    // Pass the error message from the backend through
    return Promise.reject(
      error.response?.data?.message || "Something went wrong"
    )
  }
)

export default api
