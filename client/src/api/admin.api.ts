import api from "./axios"
import type { Business, User } from "../types"

export const listAdminBusinessesApi = async (): Promise<Business[]> => {
  const res = await api.get("/admin/businesses")
  return res.data.data
}

export const getAdminBusinessByIdApi = async (businessId: string): Promise<Business> => {
  const res = await api.get(`/admin/businesses/${businessId}`)
  return res.data.data
}

export const updateAdminBusinessApi = async (
  businessId: string,
  data: Partial<Business>
): Promise<Business> => {
  const res = await api.patch(`/admin/businesses/${businessId}`, data)
  return res.data.data
}

export const toggleAdminBusinessVerificationApi = async (
  businessId: string
): Promise<Business> => {
  const res = await api.patch(`/admin/businesses/${businessId}/verify`)
  return res.data.data
}

export interface AdminUser extends User {
  id: string
  name: string
  email: string
  phone: string | null
  role: "super_admin" | "business_admin" | "employee" | "customer"
  is_active: boolean
  created_at: string
}

export const listAdminUsersApi = async (): Promise<AdminUser[]> => {
  const res = await api.get("/admin/users")
  return res.data.data
}

export const deactivateAdminUserApi = async (userId: string): Promise<AdminUser> => {
  const res = await api.patch(`/admin/users/${userId}/deactivate`)
  return res.data.data
}

export const reactivateAdminUserApi = async (userId: string): Promise<AdminUser> => {
  const res = await api.patch(`/admin/users/${userId}/reactivate`)
  return res.data.data
}
