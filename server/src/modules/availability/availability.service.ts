import { db } from "../../config/db"
import { ApiError } from "../../utils/api-error"
import {
  AvailabilitySlot,
  SetAvailabilityInput,
  TimeOff,
  CreateTimeOffInput,
  DAY_NAMES,
} from "./availability.types"

// ─────────────────────────────────────────────
// Verify employee belongs to the business
// and the requesting user owns that business
// ─────────────────────────────────────────────
const verifyEmployeeAccess = async (
  businessId: string,
  employeeId: string,
  userId: string,
  role: string
) => {
  const business = await db.query(
    `SELECT id, owner_user_id FROM businesses WHERE id = $1`,
    [businessId]
  )

  if (!business.rows[0]) {
    throw new ApiError(404, "Business not found")
  }

  if (
    role === "business_admin" &&
    business.rows[0].owner_user_id !== userId
  ) {
    throw new ApiError(403, "You do not own this business")
  }

  const employee = await db.query(
    `SELECT id FROM employees WHERE id = $1 AND business_id = $2`,
    [employeeId, businessId]
  )

  if (!employee.rows[0]) {
    throw new ApiError(404, "Employee not found")
  }
}

// ==============================================
// AVAILABILITY
// ==============================================

// ─────────────────────────────────────────────
// Set full weekly schedule
// Wipes existing schedule and replaces it.
// Runs in a transaction.
// ─────────────────────────────────────────────
export const setAvailability = async (
  businessId: string,
  employeeId: string,
  userId: string,
  role: string,
  input: SetAvailabilityInput
): Promise<AvailabilitySlot[]> => {
  await verifyEmployeeAccess(businessId, employeeId, userId, role)

  const client = await db.connect()

  try {
    await client.query("BEGIN")

    // Wipe existing schedule for this employee
    await client.query(
      `DELETE FROM availability
       WHERE provider_type = 'employee' AND provider_id = $1`,
      [employeeId]
    )

    // Insert new schedule
    for (const slot of input.schedule) {
      if (slot.is_off) continue;

      await client.query(
        `INSERT INTO availability (
          provider_type, provider_id,
          day_of_week, start_time, end_time, is_off
        ) VALUES ('employee', $1, $2, $3, $4, false)`,
        [
          employeeId,
          slot.day_of_week,
          slot.start_time,
          slot.end_time,
        ]
      )
    }

    await client.query("COMMIT")
  } catch (err) {
    await client.query("ROLLBACK")
    throw err
  } finally {
    client.release()
  }

  return getAvailability(businessId, employeeId)
}

// ─────────────────────────────────────────────
// Get weekly schedule
// Returns all 7 days, filling in missing days
// as OFF so the frontend always gets a full week
// ─────────────────────────────────────────────
export const getAvailability = async (
  businessId: string,
  employeeId: string
): Promise<AvailabilitySlot[]> => {
  const result = await db.query(
    `SELECT * FROM availability
     WHERE provider_type = 'employee' AND provider_id = $1
     ORDER BY day_of_week ASC`,
    [employeeId]
  )

  // Build a full 7-day week — fill missing days as OFF
  const scheduleMap: Record<number, AvailabilitySlot> = {}
  for (const row of result.rows) {
    scheduleMap[row.day_of_week] = row
  }

  const fullWeek = Array.from({ length: 7 }, (_, day) => {
    if (scheduleMap[day]) {
      return {
        ...scheduleMap[day],
        day_name: DAY_NAMES[day],
      }
    }
    // Day not set — treat as OFF
    return {
      id: null,
      provider_type: "employee",
      provider_id: employeeId,
      branch_id: null,
      day_of_week: day,
      day_name: DAY_NAMES[day],
      start_time: null,
      end_time: null,
      is_off: true,
      created_at: null,
    }
  })

  return fullWeek as AvailabilitySlot[]
}

// ==============================================
// TIME OFF
// ==============================================

export const createTimeOff = async (
  businessId: string,
  employeeId: string,
  userId: string,
  role: string,
  input: CreateTimeOffInput
): Promise<TimeOff> => {
  await verifyEmployeeAccess(businessId, employeeId, userId, role)

  // Check for overlapping time off entries
  const overlap = await db.query(
    `SELECT id FROM employee_time_off
     WHERE employee_id = $1
       AND start_datetime < $3
       AND end_datetime > $2`,
    [employeeId, input.start_datetime, input.end_datetime]
  )

  if (overlap.rows.length > 0) {
    throw new ApiError(
      409,
      "This time off period overlaps with an existing one"
    )
  }

  const result = await db.query(
    `INSERT INTO employee_time_off (employee_id, start_datetime, end_datetime, reason)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [
      employeeId,
      input.start_datetime,
      input.end_datetime,
      input.reason ?? null,
    ]
  )

  return result.rows[0]
}

export const listTimeOff = async (
  businessId: string,
  employeeId: string
): Promise<TimeOff[]> => {
  // Verify employee belongs to business
  const employee = await db.query(
    `SELECT id FROM employees WHERE id = $1 AND business_id = $2`,
    [employeeId, businessId]
  )

  if (!employee.rows[0]) {
    throw new ApiError(404, "Employee not found")
  }

  const result = await db.query(
    `SELECT * FROM employee_time_off
     WHERE employee_id = $1
     ORDER BY start_datetime ASC`,
    [employeeId]
  )

  return result.rows
}

export const deleteTimeOff = async (
  businessId: string,
  employeeId: string,
  timeOffId: string,
  userId: string,
  role: string
): Promise<void> => {
  await verifyEmployeeAccess(businessId, employeeId, userId, role)

  const result = await db.query(
    `DELETE FROM employee_time_off
     WHERE id = $1 AND employee_id = $2
     RETURNING id`,
    [timeOffId, employeeId]
  )

  if (!result.rows[0]) {
    throw new ApiError(404, "Time off record not found")
  }
}
