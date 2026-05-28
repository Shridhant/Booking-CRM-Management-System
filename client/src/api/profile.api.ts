import api from "./axios"
import type { User } from "../types"

export const getMyProfileApi = async (): Promise<User> => {
  const res = await api.get("/users/me")
  return res.data.data
}

export const updateMyProfileApi = async (data: {
  name?: string
  phone?: string | null
  profile_media_id?: string | null
}): Promise<User> => {
  const res = await api.patch("/users/me", data)
  return res.data.data
}
