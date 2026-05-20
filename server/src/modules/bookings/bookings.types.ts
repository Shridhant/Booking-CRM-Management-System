export type BookingStatus = "pending" | "confirmed" | "completed" | "cancelled" | "no_show"
export type AssignmentStatus = "pending_assignment" | "assigned" | "reassigned"
export type PaymentStatus = "pending" | "paid" | "failed" | "refunded"
export type PaymentType = "pay_online" | "pay_at_salon"

export interface Booking {
  id: string
  customer_id: string | null
  customer_user_id: string | null
  business_id: string
  branch_id: string | null
  employee_id: string | null
  promo_code_id: string | null
  booking_date: string
  start_time: string
  end_time: string
  booking_status: BookingStatus
  assignment_status: AssignmentStatus
  payment_status: PaymentStatus
  payment_type: PaymentType
  total_amount: number
  discount_amount: number
  notes: string | null
  created_at: string
  updated_at: string
  // joined
  customer_name?: string | null
  customer_phone?: string | null
  employee_name?: string | null
  branch_name?: string | null
  services?: BookingServiceItem[]
}

export interface BookingServiceItem {
  id: string
  service_id: string
  service_name: string
  employee_id: string | null
  employee_name: string | null
  price: number
  duration_minutes: number
}

export interface CreateBookingInput {
  customer_id: string
  branch_id: string
  employee_id?: string       // optional — null means no preference
  service_ids: string[]      // at least one service required
  booking_date: string       // YYYY-MM-DD
  start_time: string         // HH:MM
  payment_type?: PaymentType
  notes?: string
}

export interface UpdateBookingStatusInput {
  booking_status: BookingStatus
}

export interface AssignEmployeeInput {
  employee_id: string
}

export interface AvailableSlot {
  start_time: string
  end_time: string
  duration_minutes: number
}

export interface GetSlotsInput {
  date: string           // YYYY-MM-DD
  branch_id: string
  service_ids: string[]  // comma separated in query
  employee_id?: string   // optional
}
