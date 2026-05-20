export interface AvailabilitySlot {
  id: string
  provider_type: "employee" | "business"
  provider_id: string
  branch_id: string | null
  day_of_week: number  // 0 = Sunday, 6 = Saturday
  start_time: string | null
  end_time: string | null
  is_off: boolean
  created_at: string
}

export interface ScheduleInput {
  day_of_week: number
  is_off: boolean
  start_time?: string   // required if is_off = false
  end_time?: string     // required if is_off = false
}

export interface SetAvailabilityInput {
  schedule: ScheduleInput[]
}

export interface TimeOff {
  id: string
  employee_id: string
  start_datetime: string
  end_datetime: string
  reason: string | null
  created_at: string
}

export interface CreateTimeOffInput {
  start_datetime: string
  end_datetime: string
  reason?: string
}

export const DAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
]
