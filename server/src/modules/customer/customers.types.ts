export interface Customer {
  id: string
  business_id: string
  name: string
  phone: string | null
  email: string | null
  notes: string | null
  user_id: string | null
  created_at: string
  updated_at: string
  // joined
  total_bookings?: number
  last_booking_date?: string | null
}

export interface CreateCustomerInput {
  name: string
  phone?: string
  email?: string
  notes?: string
}

export interface UpdateCustomerInput {
  name?: string
  phone?: string
  email?: string
  notes?: string
}
