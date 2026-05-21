import api from "./axios"
import type { Customer, Booking } from "../types"


export const listCustomersApi = async (
  businessId: string,
  search?: string
): Promise<Customer[]> => {
  const res = await api.get(`/businesses/${businessId}/customers`, {
    params: search ? { search } : {},
  })
  return res.data.data
}

export const getCustomerByIdApi = async (
  businessId: string,
  customerId: string
): Promise<Customer> => {
  const res = await api.get(`/businesses/${businessId}/customers/${customerId}`)
  return res.data.data
}

export const createCustomerApi = async (
  businessId: string,
  data: { name: string; phone?: string; email?: string; notes?: string }
): Promise<Customer> => {
  const res = await api.post(`/businesses/${businessId}/customers`, data)
  return res.data.data
}

export const updateCustomerApi = async (
  businessId: string,
  customerId: string,
  data: Partial<Customer>
): Promise<Customer> => {
  const res = await api.patch(
    `/businesses/${businessId}/customers/${customerId}`,
    data
  )
  return res.data.data
}

export const getCustomerBookingsApi = async (
  businessId: string,
  customerId: string
): Promise<Booking[]> => {
  const res = await api.get(
    `/businesses/${businessId}/customers/${customerId}/bookings`
  )
  return res.data.data
}
