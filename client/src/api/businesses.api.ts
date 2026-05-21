import api from "./axios"
import type { Business, BusinessSettings } from "../types"


export const getMyBusinessApi = async (): Promise<Business> => {
  const res = await api.get("/businesses/my")
  return res.data.data
}

export const getBusinessByIdApi = async (businessId: string): Promise<Business> => {
  const res = await api.get(`/businesses/${businessId}`)
  return res.data.data
}

export const updateBusinessApi = async (
  businessId: string,
  data: Partial<Business>
): Promise<Business> => {
  const res = await api.patch(`/businesses/${businessId}`, data)
  return res.data.data
}

export const getBusinessSettingsApi = async (
  businessId: string
): Promise<BusinessSettings> => {
  const res = await api.get(`/businesses/${businessId}/settings`)
  return res.data.data
}

export const updateBusinessSettingsApi = async (
  businessId: string,
  data: Partial<BusinessSettings>
): Promise<BusinessSettings> => {
  const res = await api.patch(`/businesses/${businessId}/settings`, data)
  return res.data.data
}
