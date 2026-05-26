import api from "./axios"
import type { CustomerBooking, PublicReview } from "../types"

export const createCustomerBookingApi = async (data: {
  business_id: string
  branch_id: string
  employee_id?: string
  service_ids: string[]
  booking_date: string
  start_time: string
  notes?: string
}): Promise<CustomerBooking> => {
  const res = await api.post("/customer/bookings", data)
  return res.data.data
}

export const listCustomerBookingsApi = async (
  scope: "active" | "completed" | "cancelled" | "all" = "all"
): Promise<CustomerBooking[]> => {
  const res = await api.get("/customer/bookings", { params: { scope } })
  return res.data.data
}

export const cancelCustomerBookingApi = async (
  bookingId: string,
  reason?: string
): Promise<CustomerBooking> => {
  const res = await api.patch(`/customer/bookings/${bookingId}/cancel`, { reason })
  return res.data.data
}

export const submitCustomerReviewApi = async (
  bookingId: string,
  data: { rating: number; comment?: string }
): Promise<PublicReview> => {
  const res = await api.post(`/customer/bookings/${bookingId}/reviews`, data)
  return res.data.data
}
