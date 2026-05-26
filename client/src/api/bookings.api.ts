import api from "./axios"
import type { Booking, SlotResult } from "../types"


export const getSlotsApi = async (
  businessId: string,
  params: {
    date: string
    branch_id: string
    service_ids: string[]
    employee_id?: string
  }
): Promise<SlotResult[]> => {
  const res = await api.get(`/businesses/${businessId}/bookings/slots`, {
    params: {
      ...params,
      service_ids: params.service_ids.join(","),
    },
  })
  return res.data.data
}

export const createBookingApi = async (
  businessId: string,
  data: {
    customer_id: string
    branch_id: string
    employee_id?: string
    service_ids: string[]
    booking_date: string
    start_time: string
    payment_type?: string
    notes?: string
  }
): Promise<Booking> => {
  const res = await api.post(`/businesses/${businessId}/bookings`, data)
  return res.data.data
}

export const listBookingsApi = async (
  businessId: string,
  params?: {
    date?: string
    from_date?: string
    to_date?: string
    branch_id?: string
    employee_id?: string
    booking_status?: string
  }
): Promise<Booking[]> => {
  const res = await api.get(`/businesses/${businessId}/bookings`, { params })
  return res.data.data
}

export const getBookingByIdApi = async (
  businessId: string,
  bookingId: string
): Promise<Booking> => {
  const res = await api.get(`/businesses/${businessId}/bookings/${bookingId}`)
  return res.data.data
}

export const updateBookingStatusApi = async (
  businessId: string,
  bookingId: string,
  booking_status: string
): Promise<Booking> => {
  const res = await api.patch(
    `/businesses/${businessId}/bookings/${bookingId}/status`,
    { booking_status }
  )
  return res.data.data
}

export const assignEmployeeToBookingApi = async (
  businessId: string,
  bookingId: string,
  employee_id: string
): Promise<Booking> => {
  const res = await api.patch(
    `/businesses/${businessId}/bookings/${bookingId}/assign`,
    { employee_id }
  )
  return res.data.data
}

export const checkoutBookingApi = async (
  businessId: string,
  bookingId: string,
  data: {
    payment_type: "pay_online" | "pay_at_salon"
    payment_method: "cash" | "card" | "upi" | "other"
    notes?: string
    services: {
      service_id: string
      employee_id: string | null
      price: number
      duration_minutes: number
    }[]
  }
): Promise<Booking> => {
  const res = await api.post(
    `/businesses/${businessId}/bookings/${bookingId}/checkout`,
    data
  )
  return res.data.data
}
