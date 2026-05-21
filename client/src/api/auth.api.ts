import api from "./axios"
import type { TokenPair } from "../types"


export const loginApi = async (email: string, password: string): Promise<TokenPair> => {
  const res = await api.post("/auth/login", { email, password })
  return res.data.data
}

export const refreshTokenApi = async (refreshToken: string): Promise<TokenPair> => {
  const res = await api.post("/auth/refresh", { refreshToken })
  return res.data.data
}

export const onboardBusinessApi = async (data: {
  business_type: string
  business_name: string
  city: string
  admin_name: string
  admin_email: string
  admin_password: string
}): Promise<any> => {
  const res = await api.post("/admin/onboard", data)
  return res.data
}

