import { db } from "../../config/db"
import { ApiError } from "../../utils/api-error"
import {
  getEmployeeWorkingHours,
  getExistingBookings,
  hasOverlap,
  isEmployeeOnTimeOff,
  minutesToTime,
  timeToMinutes,
} from "../bookings/bookings.utils"
import {
  CreateCustomerBookingSchema,
  CreateCustomerReviewSchema,
  ListCustomerBookingsQuery,
} from "./customer.validation"

type CustomerUser = {
  id: string
  name: string
  email: string
  phone: string | null
}

const getCustomerUser = async (userId: string, client: any = db): Promise<CustomerUser> => {
  const result = await client.query(
    `SELECT id, name, email, phone
     FROM users
     WHERE id = $1 AND role = 'customer' AND is_active = TRUE`,
    [userId]
  )

  if (!result.rows[0]) {
    throw new ApiError(404, "Customer account not found")
  }

  if (!result.rows[0].phone) {
    throw new ApiError(400, "A phone number is required to book")
  }

  return result.rows[0]
}

const getCustomerBookingDetail = async (bookingId: string, customerUserId: string) => {
  const result = await db.query(
    `SELECT
      b.*,
      business.name AS business_name,
      business.slug AS business_slug,
      e.name AS employee_name,
      bb.name AS branch_name,
      bb.address AS branch_address,
      r.id AS review_id,
      r.rating AS review_rating,
      r.comment AS review_comment,
      COALESCE(
        json_agg(
          json_build_object(
            'service_id', bs.service_id,
            'service_name', s.name,
            'employee_id', bs.employee_id,
            'price', bs.price,
            'duration_minutes', bs.duration_minutes
          )
        ) FILTER (WHERE bs.id IS NOT NULL),
        '[]'::json
      ) AS services
    FROM bookings b
    JOIN businesses business ON business.id = b.business_id
    LEFT JOIN employees e ON e.id = b.employee_id
    LEFT JOIN business_branches bb ON bb.id = b.branch_id
    LEFT JOIN booking_services bs ON bs.booking_id = b.id
    LEFT JOIN services s ON s.id = bs.service_id
    LEFT JOIN LATERAL (
      SELECT id, rating, comment
      FROM reviews
      WHERE booking_id = b.id AND customer_user_id = $2
      ORDER BY created_at DESC
      LIMIT 1
    ) r ON TRUE
    WHERE b.id = $1 AND b.customer_user_id = $2
    GROUP BY b.id, business.name, business.slug, e.name, bb.name, bb.address,
      r.id, r.rating, r.comment`,
    [bookingId, customerUserId]
  )

  if (!result.rows[0]) {
    throw new ApiError(404, "Booking not found")
  }

  return result.rows[0]
}

const resolveCustomerCard = async (
  client: any,
  businessId: string,
  user: CustomerUser
): Promise<string> => {
  const existing = await client.query(
    `SELECT id, user_id
     FROM customers
     WHERE business_id = $1
       AND (
         user_id = $2 OR
         phone = $3 OR
         (email IS NOT NULL AND LOWER(email) = LOWER($4))
       )
     ORDER BY
       CASE
         WHEN user_id = $2 THEN 0
         WHEN phone = $3 THEN 1
         ELSE 2
       END
     LIMIT 1`,
    [businessId, user.id, user.phone, user.email]
  )

  const customer = existing.rows[0]

  if (customer) {
    if (customer.user_id && customer.user_id !== user.id) {
      throw new ApiError(409, "This customer profile is linked to another account")
    }

    if (!customer.user_id) {
      await client.query(
        `UPDATE customers
         SET user_id = $1, updated_at = NOW()
         WHERE id = $2`,
        [user.id, customer.id]
      )

      await client.query(
        `UPDATE bookings
         SET customer_user_id = $1, updated_at = NOW()
         WHERE customer_id = $2
           AND customer_user_id IS NULL`,
        [user.id, customer.id]
      )
    }

    return customer.id
  }

  const created = await client.query(
    `INSERT INTO customers (business_id, name, phone, email, user_id)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id`,
    [businessId, user.name, user.phone, user.email, user.id]
  )

  return created.rows[0].id
}

export const createCustomerBooking = async (
  customerUserId: string,
  input: CreateCustomerBookingSchema
) => {
  const client = await db.connect()

  try {
    await client.query("BEGIN")

    const user = await getCustomerUser(customerUserId, client)

    const businessResult = await client.query(
      `SELECT id, booking_type
       FROM businesses
       WHERE id = $1`,
      [input.business_id]
    )

    const business = businessResult.rows[0]
    if (!business) {
      throw new ApiError(404, "Business not found")
    }

    if (business.booking_type !== "free_booking") {
      throw new ApiError(
        400,
        "This business requires online payment before booking"
      )
    }

    const branch = await client.query(
      `SELECT id
       FROM business_branches
       WHERE id = $1 AND business_id = $2`,
      [input.branch_id, input.business_id]
    )
    if (!branch.rows[0]) {
      throw new ApiError(404, "Branch not found")
    }

    const servicesResult = await client.query(
      `SELECT id, duration_minutes, min_price
       FROM services
       WHERE id = ANY($1::uuid[])
         AND business_id = $2
         AND is_active = TRUE`,
      [input.service_ids, input.business_id]
    )
    if (servicesResult.rows.length !== input.service_ids.length) {
      throw new ApiError(400, "One or more services are invalid or inactive")
    }

    const settingsResult = await client.query(
      `SELECT booking_buffer_minutes
       FROM business_settings
       WHERE business_id = $1`,
      [input.business_id]
    )
    const bufferMinutes = settingsResult.rows[0]?.booking_buffer_minutes ?? 0

    const totalServiceDuration = servicesResult.rows.reduce(
      (sum: number, service: any) => sum + Number(service.duration_minutes),
      0
    )
    const totalDuration =
      totalServiceDuration + bufferMinutes * Math.max(0, input.service_ids.length - 1)
    const startMinutes = timeToMinutes(input.start_time)
    const endMinutes = startMinutes + totalDuration
    const endTime = minutesToTime(endMinutes)

    if (input.employee_id) {
      const employee = await client.query(
        `SELECT e.id
         FROM employees e
         JOIN employee_branches eb ON eb.employee_id = e.id
         WHERE e.id = $1
           AND e.business_id = $2
           AND eb.branch_id = $3
           AND e.is_active = TRUE`,
        [input.employee_id, input.business_id, input.branch_id]
      )
      if (!employee.rows[0]) {
        throw new ApiError(404, "Employee not found, inactive, or unavailable at this branch")
      }

      const workingHours = await getEmployeeWorkingHours(
        input.employee_id,
        input.booking_date
      )
      if (!workingHours) {
        throw new ApiError(400, "Employee is not working on this day")
      }

      const onTimeOff = await isEmployeeOnTimeOff(
        input.employee_id,
        input.booking_date
      )
      if (onTimeOff) {
        throw new ApiError(400, "Employee is on leave on this date")
      }

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

    const customerId = await resolveCustomerCard(client, input.business_id, user)

    const totalAmount = servicesResult.rows.reduce(
      (sum: number, service: any) => sum + Number(service.min_price),
      0
    )

    const bookingResult = await client.query(
      `INSERT INTO bookings (
        customer_id,
        customer_user_id,
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
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
      RETURNING *`,
      [
        customerId,
        user.id,
        input.business_id,
        input.branch_id,
        input.employee_id ?? null,
        input.booking_date,
        input.start_time,
        endTime,
        "pending",
        input.employee_id ? "assigned" : "pending_assignment",
        "pending",
        "pay_at_salon",
        totalAmount,
        input.notes ?? null,
      ]
    )

    const booking = bookingResult.rows[0]

    for (const serviceId of input.service_ids) {
      const service = servicesResult.rows.find((row: any) => row.id === serviceId)
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

    if (input.employee_id) {
      await client.query(
        `INSERT INTO booking_assignment_history (
          booking_id, old_employee_id, new_employee_id, changed_by_user_id
        ) VALUES ($1, NULL, $2, $3)`,
        [booking.id, input.employee_id, user.id]
      )
    }

    await client.query("COMMIT")

    return getCustomerBookingDetail(booking.id, user.id)
  } catch (err) {
    await client.query("ROLLBACK")
    throw err
  } finally {
    client.release()
  }
}

export const listCustomerBookings = async (
  customerUserId: string,
  filters: ListCustomerBookingsQuery
) => {
  const conditions = [`b.customer_user_id = $1`]
  const params: unknown[] = [customerUserId]

  if (filters.scope === "active") {
    conditions.push(`b.booking_status IN ('pending', 'confirmed')`)
  }

  if (filters.scope === "completed") {
    conditions.push(`b.booking_status = 'completed'`)
  }

  if (filters.scope === "cancelled") {
    conditions.push(`b.booking_status = 'cancelled'`)
  }

  const result = await db.query(
    `SELECT
      b.*,
      business.name AS business_name,
      business.slug AS business_slug,
      e.name AS employee_name,
      bb.name AS branch_name,
      bb.address AS branch_address,
      r.id AS review_id,
      r.rating AS review_rating,
      COALESCE(
        json_agg(
          json_build_object(
            'service_id', bs.service_id,
            'service_name', s.name,
            'employee_id', bs.employee_id,
            'price', bs.price,
            'duration_minutes', bs.duration_minutes
          )
        ) FILTER (WHERE bs.id IS NOT NULL),
        '[]'::json
      ) AS services
    FROM bookings b
    JOIN businesses business ON business.id = b.business_id
    LEFT JOIN employees e ON e.id = b.employee_id
    LEFT JOIN business_branches bb ON bb.id = b.branch_id
    LEFT JOIN booking_services bs ON bs.booking_id = b.id
    LEFT JOIN services s ON s.id = bs.service_id
    LEFT JOIN LATERAL (
      SELECT id, rating
      FROM reviews
      WHERE booking_id = b.id AND customer_user_id = $1
      ORDER BY created_at DESC
      LIMIT 1
    ) r ON TRUE
    WHERE ${conditions.join(" AND ")}
    GROUP BY b.id, business.name, business.slug, e.name, bb.name, bb.address,
      r.id, r.rating
    ORDER BY b.booking_date DESC, b.start_time DESC`,
    params
  )

  return result.rows
}

export const cancelCustomerBooking = async (
  customerUserId: string,
  bookingId: string,
  reason?: string
) => {
  const client = await db.connect()

  try {
    await client.query("BEGIN")

    const result = await client.query(
      `SELECT
        b.id,
        b.booking_status,
        b.business_id,
        (b.booking_date::timestamp + b.start_time <= NOW()) AS has_started,
        (
          NOW() >
          (
            b.booking_date::timestamp +
            b.start_time -
            (COALESCE(bs.cancellation_hours_limit, 24) * INTERVAL '1 hour')
          )
        ) AS cancellation_window_closed
       FROM bookings b
       LEFT JOIN business_settings bs ON bs.business_id = b.business_id
       WHERE b.id = $1 AND b.customer_user_id = $2
       FOR UPDATE OF b`,
      [bookingId, customerUserId]
    )

    const booking = result.rows[0]
    if (!booking) {
      throw new ApiError(404, "Booking not found")
    }

    if (!["pending", "confirmed"].includes(booking.booking_status)) {
      throw new ApiError(400, "Only pending or confirmed bookings can be cancelled")
    }

    if (booking.has_started) {
      throw new ApiError(400, "Started or past bookings cannot be cancelled")
    }

    if (booking.cancellation_window_closed) {
      throw new ApiError(400, "Cancellation window has closed for this booking")
    }

    await client.query(
      `UPDATE bookings
       SET booking_status = 'cancelled', updated_at = NOW()
       WHERE id = $1`,
      [bookingId]
    )

    await client.query(
      `INSERT INTO cancellations (booking_id, cancelled_by_user_id, reason)
       VALUES ($1, $2, $3)`,
      [bookingId, customerUserId, reason ?? null]
    )

    await client.query("COMMIT")

    return getCustomerBookingDetail(bookingId, customerUserId)
  } catch (err) {
    await client.query("ROLLBACK")
    throw err
  } finally {
    client.release()
  }
}

export const createCustomerReview = async (
  customerUserId: string,
  bookingId: string,
  input: CreateCustomerReviewSchema
) => {
  const client = await db.connect()

  try {
    await client.query("BEGIN")

    const bookingResult = await client.query(
      `SELECT id, business_id, booking_status
       FROM bookings
       WHERE id = $1 AND customer_user_id = $2
       FOR UPDATE`,
      [bookingId, customerUserId]
    )

    const booking = bookingResult.rows[0]
    if (!booking) {
      throw new ApiError(404, "Booking not found")
    }

    if (booking.booking_status !== "completed") {
      throw new ApiError(400, "Only completed bookings can be reviewed")
    }

    const duplicate = await client.query(
      `SELECT id FROM reviews WHERE booking_id = $1 LIMIT 1`,
      [bookingId]
    )
    if (duplicate.rows.length > 0) {
      throw new ApiError(409, "This booking has already been reviewed")
    }

    const reviewResult = await client.query(
      `INSERT INTO reviews (
        booking_id, customer_user_id, business_id, rating, comment
      ) VALUES ($1, $2, $3, $4, $5)
      RETURNING *`,
      [
        bookingId,
        customerUserId,
        booking.business_id,
        input.rating,
        input.comment ?? null,
      ]
    )

    await client.query("COMMIT")

    return reviewResult.rows[0]
  } catch (err) {
    await client.query("ROLLBACK")
    throw err
  } finally {
    client.release()
  }
}
