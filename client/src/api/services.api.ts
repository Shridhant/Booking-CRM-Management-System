import api from "./axios"
import type { Service, ServiceCategory } from "../types"


export const listCategoriesApi = async (
  businessId: string,
  withServices = false
): Promise<ServiceCategory[]> => {
  const res = await api.get(`/businesses/${businessId}/services/categories`, {
    params: { withServices },
  })
  return res.data.data
}

export const createCategoryApi = async (
  businessId: string,
  data: { name: string; sort_order?: number }
): Promise<ServiceCategory> => {
  const res = await api.post(`/businesses/${businessId}/services/categories`, data)
  return res.data.data
}

export const updateCategoryApi = async (
  businessId: string,
  categoryId: string,
  data: { name?: string; sort_order?: number }
): Promise<ServiceCategory> => {
  const res = await api.patch(
    `/businesses/${businessId}/services/categories/${categoryId}`,
    data
  )
  return res.data.data
}

export const deleteCategoryApi = async (
  businessId: string,
  categoryId: string
): Promise<void> => {
  await api.delete(`/businesses/${businessId}/services/categories/${categoryId}`)
}

export const listServicesApi = async (
  businessId: string,
  params?: { categoryId?: string; includeInactive?: boolean }
): Promise<Service[]> => {
  const res = await api.get(`/businesses/${businessId}/services`, { params })
  return res.data.data
}

export const createServiceApi = async (
  businessId: string,
  data: {
    name: string
    category_id?: string
    description?: string
    duration_minutes: number
    min_price: number
    max_price?: number
    employee_ids?: string[]
  }
): Promise<Service> => {
  const res = await api.post(`/businesses/${businessId}/services`, data)
  return res.data.data
}

export const updateServiceApi = async (
  businessId: string,
  serviceId: string,
  data: Partial<Service>
): Promise<Service> => {
  const res = await api.patch(`/businesses/${businessId}/services/${serviceId}`, data)
  return res.data.data
}

export const assignEmployeesToServiceApi = async (
  businessId: string,
  serviceId: string,
  employee_ids: string[]
): Promise<Service> => {
  const res = await api.post(
    `/businesses/${businessId}/services/${serviceId}/employees`,
    { employee_ids }
  )
  return res.data.data
}

export const deleteServiceApi = async (
  businessId: string,
  serviceId: string
): Promise<void> => {
  await api.delete(`/businesses/${businessId}/services/${serviceId}`)
}
