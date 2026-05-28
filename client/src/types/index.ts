// ── Auth ──────────────────────────────────────

export interface User {
  userId: string
  email: string
  role: "super_admin" | "business_admin" | "employee" | "customer"
  name?: string
  phone?: string | null
  profile_photo_url?: string | null
  profile_media_id?: string | null
}

export interface TokenPair {
  accessToken: string
  refreshToken: string
}

// ── Business ──────────────────────────────────

export interface Business {
  id: string
  name: string
  slug: string
  business_type: string
  description: string | null
  phone: string | null
  email: string | null
  address: string | null
  city: string | null
  is_verified: boolean
  booking_type: string
  allow_employee_selection: boolean
  auto_assign_strategy: string
  logo_url: string | null
  cover_url: string | null
  logo_media_id?: string | null
  cover_media_id?: string | null
  created_at: string
}

export interface PublicBusiness extends Business {
  latitude?: number | null
  longitude?: number | null
  average_rating: number
  review_count: number
}

export interface PaginatedResult<T> {
  items: T[]
  page: number
  limit: number
  total: number
  total_pages: number
}

export interface BusinessSettings {
  id: string
  business_id: string
  allow_online_payment: boolean
  allow_pay_at_salon: boolean
  booking_buffer_minutes: number
  cancellation_hours_limit: number
  timezone: string
}

// ── Branch ────────────────────────────────────

export interface Branch {
  id: string
  business_id: string
  name: string
  address: string | null
  city: string | null
  opening_time: string | null
  closing_time: string | null
  phone: string | null
  created_at: string
}

// ── Employee ──────────────────────────────────

export interface Employee {
  id: string
  business_id: string
  name: string
  bio: string | null
  experience_years: number
  is_active: boolean
  profile_media_id: string | null
  profile_photo_url: string | null
  branches: EmployeeBranch[]
  created_at: string
}

export interface EmployeeBranch {
  branch_id: string
  branch_name: string
  city: string | null
}

// ── Service ───────────────────────────────────

export interface ServiceCategory {
  id: string
  business_id: string
  name: string
  sort_order: number
  services?: Service[]
}

export interface PublicServiceCategory {
  id: string | null
  business_id: string
  name: string
  sort_order: number | null
  services: Service[]
}

export interface Service {
  id: string
  business_id: string
  category_id: string | null
  category_name: string | null
  name: string
  description: string | null
  duration_minutes: number
  min_price: number
  max_price: number | null
  is_active: boolean
  image_url: string | null
  image_media_id?: string | null
  employees: ServiceEmployee[]
}

export interface ServiceEmployee {
  employee_id: string
  employee_name: string
  profile_photo_url: string | null
}

// ── Availability ──────────────────────────────

export interface AvailabilitySlot {
  id: string | null
  day_of_week: number
  day_name: string
  start_time: string | null
  end_time: string | null
  is_off: boolean
}

export interface TimeOff {
  id: string
  employee_id: string
  start_datetime: string
  end_datetime: string
  reason: string | null
  created_at: string
}

// ── Customer ──────────────────────────────────

export interface Customer {
  id: string
  business_id: string
  name: string
  phone: string | null
  email: string | null
  notes: string | null
  total_bookings: number
  last_booking_date: string | null
  created_at: string
}

// ── Booking ───────────────────────────────────

export type BookingStatus = "pending" | "confirmed" | "completed" | "cancelled" | "no_show"
export type PaymentStatus = "pending" | "paid" | "failed" | "refunded"
export type PaymentType = "pay_online" | "pay_at_salon"

export interface Booking {
  id: string
  customer_id: string | null
  business_id: string
  branch_id: string | null
  employee_id: string | null
  booking_date: string
  start_time: string
  end_time: string
  booking_status: BookingStatus
  assignment_status: string
  payment_status: PaymentStatus
  payment_type: PaymentType
  total_amount: number
  discount_amount: number
  notes: string | null
  customer_name: string | null
  customer_phone: string | null
  employee_name: string | null
  branch_name: string | null
  services: BookingServiceItem[]
  created_at: string
}

export interface CustomerBooking extends Booking {
  business_name: string
  business_slug: string
  branch_address: string | null
  review_id: string | null
  review_rating: number | null
  review_comment?: string | null
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

export interface AvailableSlot {
  start_time: string
  end_time: string
  duration_minutes: number
}

export interface SlotResult {
  date: string
  employee_id: string | null
  employee_name?: string
  slots: AvailableSlot[]
}

export interface PublicReview {
  id: string
  booking_id: string
  business_id: string
  rating: number
  comment: string | null
  customer_name: string
  created_at: string
}

// ── API Response wrapper ──────────────────────

export interface ApiResponse<T> {
  statusCode: number
  data: T
  message: string
  success: boolean
}
