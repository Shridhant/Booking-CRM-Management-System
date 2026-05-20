import { db } from "../../config/db"
import { AvailableSlot } from "./bookings.types"

const SLOT_INTERVAL_MINUTES = 15

// ─────────────────────────────────────────────
// Convert "HH:MM" or "HH:MM:SS" to total minutes
// ─────────────────────────────────────────────
export const timeToMinutes = (time: string): number => {
  const parts = time.split(":")

  const hours = Number(parts[0])
  const minutes = Number(parts[1])

  if (Number.isNaN(hours) || Number.isNaN(minutes)) {
    throw new Error("Invalid time format")
  }

  return hours * 60 + minutes
}

// ─────────────────────────────────────────────
// Convert total minutes to "HH:MM" string
// ─────────────────────────────────────────────
export const minutesToTime = (minutes: number): string => {
  const h = Math.floor(minutes / 60).toString().padStart(2, "0")
  const m = (minutes % 60).toString().padStart(2, "0")
  return `${h}:${m}`
}

// ─────────────────────────────────────────────
// Get day_of_week from a YYYY-MM-DD date string
// 0 = Sunday, 6 = Saturday
// ─────────────────────────────────────────────
export const getDayOfWeek = (dateStr: string): number => {
  return new Date(dateStr).getDay()
}

// ─────────────────────────────────────────────
// Get total duration for a list of services
// including buffer between each service
// ─────────────────────────────────────────────
export const getTotalDuration = async (
  serviceIds: string[],
  bufferMinutes: number
): Promise<number> => {
  const result = await db.query(
    `SELECT id, duration_minutes FROM services
     WHERE id = ANY($1::uuid[]) AND is_active = TRUE`,
    [serviceIds]
  )

  if (result.rows.length !== serviceIds.length) {
    throw new Error("One or more services not found or inactive")
  }

  const totalServiceDuration = result.rows.reduce(
    (sum: number, s: any) => sum + s.duration_minutes,
    0
  )

  // Buffer applies between services, not after the last one
  const totalBuffer = bufferMinutes * Math.max(0, serviceIds.length - 1)

  return totalServiceDuration + totalBuffer
}

// ─────────────────────────────────────────────
// Get employee working hours for a specific date
// Returns null if employee is off that day
// ─────────────────────────────────────────────
export const getEmployeeWorkingHours = async (
  employeeId: string,
  date: string
): Promise<{ start: number; end: number } | null> => {
  const dayOfWeek = getDayOfWeek(date)

  const result = await db.query(
    `SELECT start_time, end_time, is_off
     FROM availability
     WHERE provider_type = 'employee'
       AND provider_id = $1
       AND day_of_week = $2`,
    [employeeId, dayOfWeek]
  )

  const slot = result.rows[0]

  // No availability record or marked as off
  if (!slot || slot.is_off) return null

  return {
    start: timeToMinutes(slot.start_time),
    end: timeToMinutes(slot.end_time),
  }
}

// ─────────────────────────────────────────────
// Check if employee is on time off for a date
// ─────────────────────────────────────────────
export const isEmployeeOnTimeOff = async (
  employeeId: string,
  date: string
): Promise<boolean> => {
  const result = await db.query(
    `SELECT id FROM employee_time_off
     WHERE employee_id = $1
       AND start_datetime::date <= $2
       AND end_datetime::date >= $2`,
    [employeeId, date]
  )

  return result.rows.length > 0
}

// ─────────────────────────────────────────────
// Get existing bookings for an employee on a date
// Returns array of { start, end } in minutes
// ─────────────────────────────────────────────
export const getExistingBookings = async (
  employeeId: string,
  date: string
): Promise<{ start: number; end: number }[]> => {
  const result = await db.query(
    `SELECT start_time, end_time FROM bookings
     WHERE employee_id = $1
       AND booking_date = $2
       AND booking_status NOT IN ('cancelled', 'no_show')`,
    [employeeId, date]
  )

  return result.rows.map((b: any) => ({
    start: timeToMinutes(b.start_time),
    end: timeToMinutes(b.end_time),
  }))
}

// ─────────────────────────────────────────────
// Check if a candidate slot overlaps with
// any existing booking
// ─────────────────────────────────────────────
export const hasOverlap = (
  slotStart: number,
  slotEnd: number,
  existingBookings: { start: number; end: number }[]
): boolean => {
  return existingBookings.some(
    (booking) => slotStart < booking.end && slotEnd > booking.start
  )
}

// ─────────────────────────────────────────────
// Generate available slots for an employee
// on a specific date for a given duration
// ─────────────────────────────────────────────
export const generateSlots = async (
  employeeId: string,
  date: string,
  totalDuration: number,
  branchOpenMinutes: number,
  branchCloseMinutes: number
): Promise<AvailableSlot[]> => {
  // 1. Get employee working hours
  const workingHours = await getEmployeeWorkingHours(employeeId, date)
  if (!workingHours) return []

  // 2. Check time off
  const onTimeOff = await isEmployeeOnTimeOff(employeeId, date)
  if (onTimeOff) return []

  // 3. Effective working window = intersection of employee hours and branch hours
  const windowStart = Math.max(workingHours.start, branchOpenMinutes)
  const windowEnd = Math.min(workingHours.end, branchCloseMinutes)

  if (windowStart >= windowEnd) return []

  // 4. Get existing bookings
  const existingBookings = await getExistingBookings(employeeId, date)

  // 5. Generate candidate slots every SLOT_INTERVAL_MINUTES
  const slots: AvailableSlot[] = []
  let current = windowStart

  while (current + totalDuration <= windowEnd) {
    const slotEnd = current + totalDuration

    if (!hasOverlap(current, slotEnd, existingBookings)) {
      slots.push({
        start_time: minutesToTime(current),
        end_time: minutesToTime(slotEnd),
        duration_minutes: totalDuration,
      })
    }

    current += SLOT_INTERVAL_MINUTES
  }

  return slots
}
