import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { User } from "../types"

import { jwtDecode } from "jwt-decode"

interface AuthState {
  accessToken: string | null
  refreshToken: string | null
  user: User | null
  isAuthenticated: boolean
  login: (accessToken: string, refreshToken: string) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      refreshToken: null,
      user: null,
      isAuthenticated: false,

      login: (accessToken, refreshToken) => {
        // Decode the JWT to get user info — no extra API call needed
        const decoded = jwtDecode<User>(accessToken)
        set({
          accessToken,
          refreshToken,
          user: decoded,
          isAuthenticated: true,
        })
      },

      logout: () => {
        set({
          accessToken: null,
          refreshToken: null,
          user: null,
          isAuthenticated: false,
        })
      },
    }),
    {
      name: "bookingapp-auth", // localStorage key
    }
  )
)
