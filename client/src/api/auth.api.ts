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
