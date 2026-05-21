import api from "./axios"
import type { Branch } from "../types"


export const listBranchesApi = async (businessId: string): Promise<Branch[]> => {
  const res = await api.get(`/businesses/${businessId}/branches`)
  return res.data.data
}

export const createBranchApi = async (
  businessId: string,
  data: Partial<Branch>
): Promise<Branch> => {
  const res = await api.post(`/businesses/${businessId}/branches`, data)
  return res.data.data
}

export const updateBranchApi = async (
  businessId: string,
  branchId: string,
  data: Partial<Branch>
): Promise<Branch> => {
  const res = await api.patch(`/businesses/${businessId}/branches/${branchId}`, data)
  return res.data.data
}

export const deleteBranchApi = async (
  businessId: string,
  branchId: string
): Promise<void> => {
  await api.delete(`/businesses/${businessId}/branches/${branchId}`)
}
