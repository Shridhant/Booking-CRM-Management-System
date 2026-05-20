import { db } from "../../config/db"
import { ApiError } from "../../utils/api-error"
import {
  Booking,
  CreateBookingInput,
  AvailableSlot,
  GetSlotsInput,
} from "./bookings.types"
import {
  timeToMinutes,
  minutesToTime,
  getTotalDuration,
  generateSlots,
  hasOverlap,
  getExistingBookings,
  getEmployeeWorkingHours,
  isEmployeeOnTimeOff,
} from "./bookings.utils"

// ─────────────────────────────────────────────
// Verify business ownership
// ─────────────────────────────────────────────
const verifyBusinessOwnership = async (
  businessId: string,
  userId: string,
  role: string
) => {
  const result = await db.query(
    `SELECT id, owner_user_id FROM businesses WHERE id = $1`,
    [businessId]
  )

  if (!result.rows[0]) {
    throw new ApiError(404, "Business not found")
  }

  if (
    role === "business_admin" &&
    result.rows[0].owner_user_id !== userId
  ) {
    throw new ApiError(403, "You do not own this business")
  }
}

// ─────────────────────────────────────────────
// Get full booking detail by ID
// ─────────────────────────────────────────────
const getBookingDetail = async (bookingId: string): Promise<Booking> => {
  const result = await db.query(
    `SELECT
      b.*,
      c.name        AS customer_name,
      c.phone       AS customer_phone,
      e.name        AS employee_name,
      bb.name       AS branch_name
    FROM bookings b
    LEFT JOIN customers c         ON c.id  = b.customer_id
    LEFT JOIN employees e         ON e.id  = b.employee_id
    LEFT JOIN business_branches bb ON bb.id = b.branch_id
    WHERE b.id = $1`,
    [bookingId]
  )

  if (!result.rows[0]) {
    throw new ApiError(404, "Booking not found")
  }

  const booking = result.rows[0]

  // Get booking services
  const servicesResult = await db.query(
    `SELECT
      bs.id,
      bs.service_id,
      s.name  AS service_name,
      bs.employee_id,
      e.name  AS employee_name,
      bs.price,
      bs.duration_minutes
    FROM booking_services bs
    JOIN services s ON s.id = bs.service_id
    LEFT JOIN employees e ON e.id = bs.employee_id
    WHERE bs.booking_id = $1`,
    [bookingId]
  )

  return { ...booking, services: servicesResult.rows }
}

// ==============================================
// SLOT GENERATION
// ==============================================

export const getAvailableSlots = async (
  businessId: string,
  input: GetSlotsInput
): Promise<{
  date: string
  employee_id: string | null
  slots: AvailableSlot[]
}[]> => {
  const serviceIds = input.service_ids

  // Get branch hours
  const branchResult = await db.query(
    `SELECT opening_time, closing_time FROM business_branches
     WHERE id = $1 AND business_id = $2`,
    [input.branch_id, businessId]
  )

  if (!branchResult.rows[0]) {
    throw new ApiError(404, "Branch not found")
  }

  const branch = branchResult.rows[0]

  // Get business buffer minutes from settings
  const settingsResult = await db.query(
    `SELECT booking_buffer_minutes FROM business_settings
     WHERE business_id = $1`,
    [businessId]
  )

  const bufferMinutes = settingsResult.rows[0]?.booking_buffer_minutes ?? 0

  // Total duration of all services + buffers between them
  const totalDuration = await getTotalDuration(serviceIds, bufferMinutes)

  // Branch hours — fallback to full day if not set
  const branchOpen = branch.opening_time
    ? timeToMinutes(branch.opening_time)
    : 0
  const branchClose = branch.closing_time
    ? timeToMinutes(branch.closing_time)
    : 24 * 60

  // If specific employee requested
  if (input.employee_id) {
    // Verify employee belongs to this business
    const emp = await db.query(
      `SELECT id FROM employees WHERE id = $1 AND business_id = $2 AND is_active = TRUE`,
      [input.employee_id, businessId]
    )
    if (!emp.rows[0]) {
      throw new ApiError(404, "Employee not found or inactive")
    }

    const slots = await generateSlots(
      input.employee_id,
      input.date,
      totalDuration,
      branchOpen,
      branchClose
    )

    return [{ date: input.date, employee_id: input.employee_id, slots }]
  }

  // No employee specified — get slots for ALL active employees at this branch
  const employeesResult = await db.query(
    `SELECT DISTINCT e.id, e.name
     FROM employees e
     JOIN employee_branches eb ON eb.employee_id = e.id
     WHERE e.business_id = $1
       AND eb.branch_id = $2
       AND e.is_active = TRUE`,
    [businessId, input.branch_id]
  )

  const results = await Promise.all(
    employeesResult.rows.map(async (emp: any) => {
      const slots = await generateSlots(
        emp.id,
        input.date,
        totalDuration,
        branchOpen,
        branchClose
      )
      return {
        date: input.date,
        employee_id: emp.id,
        employee_name: emp.name,
        slots,
      }
    })
  )

  return results
}

// ==============================================
// CREATE BOOKING
// ==============================================

export const createBooking = async (
  businessId: string,
  userId: string,
  role: string,
  input: CreateBookingInput
): Promise<Booking> => {
  await verifyBusinessOwnership(businessId, userId, role)

  // Validate customer belongs to this business
  const customer = await db.query(
    `SELECT id FROM customers WHERE id = $1 AND business_id = $2`,
    [input.customer_id, businessId]
  )
  if (!customer.rows[0]) {
    throw new ApiError(404, "Customer not found")
  }

  // Validate branch belongs to this business
  const branch = await db.query(
    `SELECT id, opening_time, closing_time FROM business_branches
     WHERE id = $1 AND business_id = $2`,
    [input.branch_id, businessId]
  )
  if (!branch.rows[0]) {
    throw new ApiError(404, "Branch not found")
  }

  // Validate all services belong to this business and are active
  const servicesResult = await db.query(
    `SELECT id, duration_minutes, min_price
     FROM services
     WHERE id = ANY($1::uuid[])
       AND business_id = $2
       AND is_active = TRUE`,
    [input.service_ids, businessId]
  )
  if (servicesResult.rows.length !== input.service_ids.length) {
    throw new ApiError(400, "One or more services are invalid or inactive")
  }

  // Get buffer minutes
  const settingsResult = await db.query(
    `SELECT booking_buffer_minutes FROM business_settings WHERE business_id = $1`,
    [businessId]
  )
  const bufferMinutes = settingsResult.rows[0]?.booking_buffer_minutes ?? 0

  // Calculate total duration and end time
  const totalDuration = await getTotalDuration(input.service_ids, bufferMinutes)
  const startMinutes = timeToMinutes(input.start_time)
  const endMinutes = startMinutes + totalDuration
  const endTime = minutesToTime(endMinutes)

  // Validate employee if provided
  if (input.employee_id) {
    const emp = await db.query(
      `SELECT id FROM employees
       WHERE id = $1 AND business_id = $2 AND is_active = TRUE`,
      [input.employee_id, businessId]
    )
    if (!emp.rows[0]) {
      throw new ApiError(404, "Employee not found or inactive")
    }
  }

  // Calculate total amount from service prices
  const totalAmount = servicesResult.rows.reduce(
    (sum: number, s: any) => sum + parseFloat(s.min_price),
    0
  )

  // ── TRANSACTION ──────────────────────────────
  // Everything from here runs inside a transaction.
  // We re-validate availability right before insert
  // to prevent race conditions / double bookings.
  const client = await db.connect()

  try {
    await client.query("BEGIN")

    // Re-validate employee availability inside transaction
    if (input.employee_id) {
      // Check working hours
      const workingHours = await getEmployeeWorkingHours(
        input.employee_id,
        input.booking_date
      )
      if (!workingHours) {
        throw new ApiError(
          400,
          "Employee is not working on this day"
        )
      }

      // Check time off
      const onTimeOff = await isEmployeeOnTimeOff(
        input.employee_id,
        input.booking_date
      )
      if (onTimeOff) {
        throw new ApiError(400, "Employee is on leave on this date")
      }

      // Check overlap with existing bookings
      const existingBookings = await getExistingBookings(
        input.employee_id,
        input.booking_date
      )
      if (hasOverlap(startMinutes, endMinutes, existingBookings)) {
        throw new ApiError(
          409,
          "This time slot is no longer available. Please choose another slot."
        )
      }
    }

    // Insert booking
    const bookingResult = await client.query(
      `INSERT INTO bookings (
        customer_id,
        business_id,
        branch_id,
        employee_id,
        booking_date,
        start_time,
        end_time,
        booking_status,
        assignment_status,
        payment_status,
        payment_type,
        total_amount,
        notes
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
      RETURNING *`,
      [
        input.customer_id,
        businessId,
        input.branch_id,
        input.employee_id ?? null,
        input.booking_date,
        input.start_time,
        endTime,
        "confirmed",  // admin-created bookings are confirmed immediately
        input.employee_id ? "assigned" : "pending_assignment",
        "pending",
        input.payment_type ?? "pay_at_salon",
        totalAmount,
        input.notes ?? null,
      ]
    )

    const booking = bookingResult.rows[0]

    // Insert booking service line items
    for (const serviceId of input.service_ids) {
      const service = servicesResult.rows.find((s: any) => s.id === serviceId)
      await client.query(
        `INSERT INTO booking_services (
          booking_id, service_id, employee_id, price, duration_minutes
        ) VALUES ($1,$2,$3,$4,$5)`,
        [
          booking.id,
          serviceId,
          input.employee_id ?? null,
          service.min_price,
          service.duration_minutes,
        ]
      )
    }

    // Log assignment history if employee assigned
    if (input.employee_id) {
      await client.query(
        `INSERT INTO booking_assignment_history (
          booking_id, old_employee_id, new_employee_id, changed_by_user_id
        ) VALUES ($1, NULL, $2, $3)`,
        [booking.id, input.employee_id, userId]
      )
    }

    await client.query("COMMIT")

    return getBookingDetail(booking.id)
  } catch (err) {
    await client.query("ROLLBACK")
    throw err
  } finally {
    client.release()
  }
}

// ==============================================
// LIST BOOKINGS
// ==============================================

export const listBookings = async (
  businessId: string,
  filters: {
    date?: string
    branch_id?: string
    employee_id?: string
    booking_status?: string
    from_date?: string
    to_date?: string
  }
): Promise<Booking[]> => {
  const conditions = [`b.business_id = $1`]
  const params: unknown[] = [businessId]
  let idx = 2

  if (filters.date) {
    conditions.push(`b.booking_date = $${idx++}`)
    params.push(filters.date)
  }

  if (filters.from_date) {
    conditions.push(`b.booking_date >= $${idx++}`)
    params.push(filters.from_date)
  }

  if (filters.to_date) {
    conditions.push(`b.booking_date <= $${idx++}`)
    params.push(filters.to_date)
  }

  if (filters.branch_id) {
    conditions.push(`b.branch_id = $${idx++}`)
    params.push(filters.branch_id)
  }

  if (filters.employee_id) {
    conditions.push(`b.employee_id = $${idx++}`)
    params.push(filters.employee_id)
  }

  if (filters.booking_status) {
    conditions.push(`b.booking_status = $${idx++}`)
    params.push(filters.booking_status)
  }

  const result = await db.query(
    `SELECT
      b.*,
      c.name        AS customer_name,
      c.phone       AS customer_phone,
      e.name        AS employee_name,
      bb.name       AS branch_name
    FROM bookings b
    LEFT JOIN customers c          ON c.id  = b.customer_id
    LEFT JOIN employees e          ON e.id  = b.employee_id
    LEFT JOIN business_branches bb ON bb.id = b.branch_id
    WHERE ${conditions.join(" AND ")}
    ORDER BY b.booking_date ASC, b.start_time ASC`,
    params
  )

  // Attach services to each booking
  const bookings = await Promise.all(
    result.rows.map(async (booking: any) => {
      const servicesResult = await db.query(
        `SELECT
          bs.id,
          bs.service_id,
          s.name AS service_name,
          bs.employee_id,
          e.name AS employee_name,
          bs.price,
          bs.duration_minutes
        FROM booking_services bs
        JOIN services s ON s.id = bs.service_id
        LEFT JOIN employees e ON e.id = bs.employee_id
        WHERE bs.booking_id = $1`,
        [booking.id]
      )
      return { ...booking, services: servicesResult.rows }
    })
  )

  return bookings
}

// ==============================================
// GET SINGLE BOOKING
// ==============================================

export const getBookingById = async (
  businessId: string,
  bookingId: string
): Promise<Booking> => {
  const booking = await getBookingDetail(bookingId)

  if (booking.business_id !== businessId) {
    throw new ApiError(404, "Booking not found")
  }

  return booking
}

// ==============================================
// UPDATE BOOKING STATUS
// ==============================================

export const updateBookingStatus = async (
  businessId: string,
  bookingId: string,
  userId: string,
  role: string,
  booking_status: string
): Promise<Booking> => {
  await verifyBusinessOwnership(businessId, userId, role)

  const existing = await db.query(
    `SELECT id, booking_status FROM bookings
     WHERE id = $1 AND business_id = $2`,
    [bookingId, businessId]
  )

  if (!existing.rows[0]) {
    throw new ApiError(404, "Booking not found")
  }

  const current = existing.rows[0].booking_status

  // Prevent invalid status transitions
  const invalidTransitions: Record<string, string[]> = {
    completed: ["pending", "confirmed"],
    cancelled: ["completed"],
    no_show: ["pending", "cancelled", "completed"],
  }

  if (
    invalidTransitions[current] &&
    invalidTransitions[current].includes(booking_status)
  ) {
    throw new ApiError(
      400,
      `Cannot change status from "${current}" to "${booking_status}"`
    )
  }

  // If cancelling, log a cancellation record
  if (booking_status === "cancelled") {
    await db.query(
      `INSERT INTO cancellations (booking_id, cancelled_by_user_id, refund_status)
       VALUES ($1, $2, 'not_applicable')`,
      [bookingId, userId]
    )
  }

  const result = await db.query(
    `UPDATE bookings
     SET booking_status = $1, updated_at = NOW()
     WHERE id = $2
     RETURNING *`,
    [booking_status, bookingId]
  )

  return getBookingDetail(result.rows[0].id)
}

// ==============================================
// ASSIGN EMPLOYEE
// ==============================================

export const assignEmployee = async (
  businessId: string,
  bookingId: string,
  userId: string,
  role: string,
  employeeId: string
): Promise<Booking> => {
  await verifyBusinessOwnership(businessId, userId, role)

  const existing = await db.query(
    `SELECT id, employee_id, booking_date, start_time, end_time, booking_status
     FROM bookings WHERE id = $1 AND business_id = $2`,
    [bookingId, businessId]
  )

  if (!existing.rows[0]) {
    throw new ApiError(404, "Booking not found")
  }

  const booking = existing.rows[0]

  if (booking.booking_status === "cancelled") {
    throw new ApiError(400, "Cannot assign employee to a cancelled booking")
  }

  // Validate employee
  const emp = await db.query(
    `SELECT id FROM employees WHERE id = $1 AND business_id = $2 AND is_active = TRUE`,
    [employeeId, businessId]
  )
  if (!emp.rows[0]) {
    throw new ApiError(404, "Employee not found or inactive")
  }

  // Check employee availability for this slot
  const workingHours = await getEmployeeWorkingHours(
    employeeId,
    booking.booking_date
  )
  if (!workingHours) {
    throw new ApiError(400, "Employee is not working on this day")
  }

  const onTimeOff = await isEmployeeOnTimeOff(employeeId, booking.booking_date)
  if (onTimeOff) {
    throw new ApiError(400, "Employee is on leave on this date")
  }

  const startMinutes = timeToMinutes(booking.start_time)
  const endMinutes = timeToMinutes(booking.end_time)
  const existingBookings = await getExistingBookings(
    employeeId,
    booking.booking_date
  )

  if (hasOverlap(startMinutes, endMinutes, existingBookings)) {
    throw new ApiError(
      409,
      "Employee already has a booking during this time slot"
    )
  }

  const oldEmployeeId = booking.employee_id

  // Update booking
  await db.query(
    `UPDATE bookings
     SET employee_id = $1,
         assignment_status = $2,
         updated_at = NOW()
     WHERE id = $3`,
    [
      employeeId,
      oldEmployeeId ? "reassigned" : "assigned",
      bookingId,
    ]
  )

  // Update booking_services employee_id
  await db.query(
    `UPDATE booking_services SET employee_id = $1 WHERE booking_id = $2`,
    [employeeId, bookingId]
  )

  // Log assignment history
  await db.query(
    `INSERT INTO booking_assignment_history (
      booking_id, old_employee_id, new_employee_id, changed_by_user_id
    ) VALUES ($1, $2, $3, $4)`,
    [bookingId, oldEmployeeId ?? null, employeeId, userId]
  )

  return getBookingDetail(bookingId)
}
