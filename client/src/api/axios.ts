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

// Flag to track token refreshing process
let isRefreshing = false
// Queue to hold requests that failed with 401 while refreshing
let failedQueue: any[] = []

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error)
    } else {
      prom.resolve(token)
    }
  })
  failedQueue = []
}

// ── Response interceptor ──────────────────────
// On 401 → attempt token refresh → retry original request
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    // Check if error is 401 and request hasn't been retried yet
    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      if (isRefreshing) {
        // If refreshing is already in progress, queue this request
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`
            return api(originalRequest)
          })
          .catch((err) => Promise.reject(err))
      }

      originalRequest._retry = true
      const refreshToken = useAuthStore.getState().refreshToken

      if (refreshToken) {
        isRefreshing = true

        try {
          // Perform a direct call using clean axios instance to avoid looping
          const res = await axios.post(`${import.meta.env.VITE_API_URL}/auth/refresh`, {
            refreshToken
          })

          const { accessToken: newAccessToken, refreshToken: newRefreshToken } = res.data.data

          // Update Zustand store
          useAuthStore.getState().login(newAccessToken, newRefreshToken)

          // Process queued requests
          processQueue(null, newAccessToken)

          // Retry original request
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`
          return api(originalRequest)
        } catch (refreshError) {
          processQueue(refreshError, null)
          useAuthStore.getState().logout()
          window.location.href = `${import.meta.env.BASE_URL}login`
          return Promise.reject(refreshError)
        } finally {
          isRefreshing = false
        }
      } else {
        useAuthStore.getState().logout()
        window.location.href = `${import.meta.env.BASE_URL}login`
      }
    }

    // Pass the error message from the backend through
    return Promise.reject(
      error.response?.data?.message || "Something went wrong"
    )
  }
)

export default api
