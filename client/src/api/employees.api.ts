import api from "./axios"
import type { Employee } from "../types"


export const listEmployeesApi = async (
  businessId: string,
  branchId?: string
): Promise<Employee[]> => {
  const params = branchId ? { branchId } : {}
  const res = await api.get(`/businesses/${businessId}/employees`, { params })
  return res.data.data
}

export const getEmployeeByIdApi = async (
  businessId: string,
  employeeId: string
): Promise<Employee> => {
  const res = await api.get(`/businesses/${businessId}/employees/${employeeId}`)
  return res.data.data
}

export const createEmployeeApi = async (
  businessId: string,
  data: { name: string; bio?: string; experience_years?: number; profile_media_id?: string | null; branch_ids: string[] }
): Promise<Employee> => {
  const res = await api.post(`/businesses/${businessId}/employees`, data)
  return res.data.data
}

export const updateEmployeeApi = async (
  businessId: string,
  employeeId: string,
  data: Partial<Employee>
): Promise<Employee> => {
  const res = await api.patch(`/businesses/${businessId}/employees/${employeeId}`, data)
  return res.data.data
}

export const assignEmployeeBranchesApi = async (
  businessId: string,
  employeeId: string,
  branch_ids: string[]
): Promise<Employee> => {
  const res = await api.post(
    `/businesses/${businessId}/employees/${employeeId}/branches`,
    { branch_ids }
  )
  return res.data.data
}

export const removeEmployeeBranchApi = async (
  businessId: string,
  employeeId: string,
  branchId: string
): Promise<Employee> => {
  const res = await api.delete(
    `/businesses/${businessId}/employees/${employeeId}/branches/${branchId}`
  )
  return res.data.data
}

export const deactivateEmployeeApi = async (
  businessId: string,
  employeeId: string
): Promise<void> => {
  await api.delete(`/businesses/${businessId}/employees/${employeeId}`)
}
