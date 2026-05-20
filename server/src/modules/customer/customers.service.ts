import { db } from "../../config/db"
import { ApiError } from "../../utils/api-error"
import { Customer, CreateCustomerInput, UpdateCustomerInput } from "./customers.types"

export const createCustomer = async (
  businessId: string,
  input: CreateCustomerInput
): Promise<Customer> => {
  // Check duplicate phone within same business
  if (input.phone) {
    const existing = await db.query(
      `SELECT id FROM customers WHERE phone = $1 AND business_id = $2`,
      [input.phone, businessId]
    )
    if (existing.rows.length > 0) {
      throw new ApiError(409, "A customer with this phone number already exists")
    }
  }

  const result = await db.query(
    `INSERT INTO customers (business_id, name, phone, email, notes)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [
      businessId,
      input.name,
      input.phone ?? null,
      input.email ?? null,
      input.notes ?? null,
    ]
  )

  return result.rows[0]
}

export const listCustomers = async (
  businessId: string,
  search?: string
): Promise<Customer[]> => {
  let query: string
  let params: unknown[]

  if (search) {
    query = `
      SELECT
        c.*,
        COUNT(b.id)::int AS total_bookings,
        MAX(b.booking_date)::text AS last_booking_date
      FROM customers c
      LEFT JOIN bookings b ON b.customer_id = c.id
      WHERE c.business_id = $1
        AND (
          c.name  ILIKE $2 OR
          c.phone ILIKE $2 OR
          c.email ILIKE $2
        )
      GROUP BY c.id
      ORDER BY c.name ASC`
    params = [businessId, `%${search}%`]
  } else {
    query = `
      SELECT
        c.*,
        COUNT(b.id)::int AS total_bookings,
        MAX(b.booking_date)::text AS last_booking_date
      FROM customers c
      LEFT JOIN bookings b ON b.customer_id = c.id
      WHERE c.business_id = $1
      GROUP BY c.id
      ORDER BY c.name ASC`
    params = [businessId]
  }

  const result = await db.query(query, params)
  return result.rows
}

export const getCustomerById = async (
  businessId: string,
  customerId: string
): Promise<Customer> => {
  const result = await db.query(
    `SELECT
      c.*,
      COUNT(b.id)::int AS total_bookings,
      MAX(b.booking_date)::text AS last_booking_date
    FROM customers c
    LEFT JOIN bookings b ON b.customer_id = c.id
    WHERE c.id = $1 AND c.business_id = $2
    GROUP BY c.id`,
    [customerId, businessId]
  )

  if (!result.rows[0]) {
    throw new ApiError(404, "Customer not found")
  }

  return result.rows[0]
}

export const updateCustomer = async (
  businessId: string,
  customerId: string,
  input: UpdateCustomerInput
): Promise<Customer> => {
  const existing = await db.query(
    `SELECT id FROM customers WHERE id = $1 AND business_id = $2`,
    [customerId, businessId]
  )

  if (!existing.rows[0]) {
    throw new ApiError(404, "Customer not found")
  }

  if (input.phone) {
    const duplicate = await db.query(
      `SELECT id FROM customers
       WHERE phone = $1 AND business_id = $2 AND id != $3`,
      [input.phone, businessId, customerId]
    )
    if (duplicate.rows.length > 0) {
      throw new ApiError(409, "A customer with this phone number already exists")
    }
  }

  const fields: string[] = []
  const values: unknown[] = []
  let idx = 1

  const allowedFields: (keyof UpdateCustomerInput)[] = [
    "name", "phone", "email", "notes",
  ]

  for (const field of allowedFields) {
    if (input[field] !== undefined) {
      fields.push(`${field} = $${idx++}`)
      values.push(input[field])
    }
  }

  if (fields.length === 0) {
    throw new ApiError(400, "No fields provided to update")
  }

  fields.push(`updated_at = NOW()`)
  values.push(customerId)

  const result = await db.query(
    `UPDATE customers SET ${fields.join(", ")}
     WHERE id = $${idx} RETURNING *`,
    values
  )

  return result.rows[0]
}

// Get booking history for a customer
export const getCustomerBookings = async (
  businessId: string,
  customerId: string
) => {
  const customer = await db.query(
    `SELECT id FROM customers WHERE id = $1 AND business_id = $2`,
    [customerId, businessId]
  )

  if (!customer.rows[0]) {
    throw new ApiError(404, "Customer not found")
  }

  const result = await db.query(
    `SELECT
      b.*,
      e.name AS employee_name,
      bb.name AS branch_name,
      json_agg(json_build_object(
        'service_id', bs.service_id,
        'name', s.name,
        'duration_minutes', bs.duration_minutes,
        'price', bs.price
      )) AS services
    FROM bookings b
    LEFT JOIN employees e ON e.id = b.employee_id
    LEFT JOIN business_branches bb ON bb.id = b.branch_id
    LEFT JOIN booking_services bs ON bs.booking_id = b.id
    LEFT JOIN services s ON s.id = bs.service_id
    WHERE b.customer_id = $1
    GROUP BY b.id, e.name, bb.name
    ORDER BY b.booking_date DESC, b.start_time DESC`,
    [customerId]
  )

  return result.rows
}
