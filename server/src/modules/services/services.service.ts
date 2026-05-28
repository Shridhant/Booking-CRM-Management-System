import { db } from "../../config/db"
import { ApiError } from "../../utils/api-error"
import {
  ServiceCategory,
  Service,
  CreateCategoryInput,
  UpdateCategoryInput,
  ReorderCategoriesInput,
  CreateServiceInput,
  UpdateServiceInput,
  AssignEmployeesToServiceInput,
} from "./services.types"

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
// Get employees assigned to a service
// ─────────────────────────────────────────────
const getServiceEmployees = async (serviceId: string) => {
  const result = await db.query(
    `SELECT
      se.employee_id,
      e.name AS employee_name,
      m.url  AS profile_photo_url
    FROM service_employees se
    JOIN employees e ON e.id = se.employee_id
    LEFT JOIN media m ON m.id = e.profile_media_id
    WHERE se.service_id = $1
    ORDER BY e.name ASC`,
    [serviceId]
  )
  return result.rows
}

// ==============================================
// CATEGORIES
// ==============================================

export const createCategory = async (
  businessId: string,
  userId: string,
  role: string,
  input: CreateCategoryInput
): Promise<ServiceCategory> => {
  await verifyBusinessOwnership(businessId, userId, role)

  // Auto set sort_order to end of list if not provided
  const countResult = await db.query(
    `SELECT COUNT(*) FROM service_categories WHERE business_id = $1`,
    [businessId]
  )
  const nextOrder = input.sort_order ?? parseInt(countResult.rows[0].count)

  const result = await db.query(
    `INSERT INTO service_categories (business_id, name, sort_order)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [businessId, input.name, nextOrder]
  )

  return result.rows[0]
}

export const listCategories = async (
  businessId: string
): Promise<ServiceCategory[]> => {
  const result = await db.query(
    `SELECT * FROM service_categories
     WHERE business_id = $1
     ORDER BY sort_order ASC, created_at ASC`,
    [businessId]
  )
  return result.rows
}

// List categories with their services nested inside
// Used for the full service menu view
export const listCategoriesWithServices = async (
  businessId: string
): Promise<ServiceCategory[]> => {
  const categories = await listCategories(businessId)

  const servicesResult = await db.query(
    `SELECT
      s.*,
      sc.name AS category_name,
      m.url AS image_url,
      m.id AS image_media_id
    FROM services s
    LEFT JOIN service_categories sc ON sc.id = s.category_id
    LEFT JOIN service_media sm ON sm.service_id = s.id
    LEFT JOIN media m ON m.id = sm.media_id
    WHERE s.business_id = $1
    ORDER BY sc.sort_order ASC, s.name ASC`,
    [businessId]
  )

  // Group services under their category
  const servicesByCategory: Record<string, Service[]> = {}
  for (const service of servicesResult.rows) {
    const key = service.category_id ?? "uncategorised"
    if (!servicesByCategory[key]) servicesByCategory[key] = []
    servicesByCategory[key].push(service)
  }

  return categories.map((cat) => ({
    ...cat,
    services: servicesByCategory[cat.id] ?? [],
  }))
}

export const updateCategory = async (
  businessId: string,
  categoryId: string,
  userId: string,
  role: string,
  input: UpdateCategoryInput
): Promise<ServiceCategory> => {
  await verifyBusinessOwnership(businessId, userId, role)

  const existing = await db.query(
    `SELECT id FROM service_categories WHERE id = $1 AND business_id = $2`,
    [categoryId, businessId]
  )

  if (!existing.rows[0]) {
    throw new ApiError(404, "Category not found")
  }

  const fields: string[] = []
  const values: unknown[] = []
  let idx = 1

  if (input.name !== undefined) {
    fields.push(`name = $${idx++}`)
    values.push(input.name)
  }
  if (input.sort_order !== undefined) {
    fields.push(`sort_order = $${idx++}`)
    values.push(input.sort_order)
  }

  if (fields.length === 0) {
    throw new ApiError(400, "No fields provided to update")
  }

  values.push(categoryId)

  const result = await db.query(
    `UPDATE service_categories
     SET ${fields.join(", ")}
     WHERE id = $${idx}
     RETURNING *`,
    values
  )

  return result.rows[0]
}

// Bulk reorder — update sort_order for multiple categories at once
export const reorderCategories = async (
  businessId: string,
  userId: string,
  role: string,
  input: ReorderCategoriesInput
): Promise<ServiceCategory[]> => {
  await verifyBusinessOwnership(businessId, userId, role)

  const client = await db.connect()

  try {
    await client.query("BEGIN")

    for (const item of input.categories) {
      await client.query(
        `UPDATE service_categories
         SET sort_order = $1
         WHERE id = $2 AND business_id = $3`,
        [item.sort_order, item.id, businessId]
      )
    }

    await client.query("COMMIT")
  } catch (err) {
    await client.query("ROLLBACK")
    throw err
  } finally {
    client.release()
  }

  return listCategories(businessId)
}

export const deleteCategory = async (
  businessId: string,
  categoryId: string,
  userId: string,
  role: string
): Promise<void> => {
  await verifyBusinessOwnership(businessId, userId, role)

  const existing = await db.query(
    `SELECT id FROM service_categories WHERE id = $1 AND business_id = $2`,
    [categoryId, businessId]
  )

  if (!existing.rows[0]) {
    throw new ApiError(404, "Category not found")
  }

  // Null out category_id on services instead of blocking delete
  // Services remain but become uncategorised
  await db.query(
    `UPDATE services SET category_id = NULL WHERE category_id = $1`,
    [categoryId]
  )

  await db.query(
    `DELETE FROM service_categories WHERE id = $1`,
    [categoryId]
  )
}

// ==============================================
// SERVICES
// ==============================================

export const createService = async (
  businessId: string,
  userId: string,
  role: string,
  input: CreateServiceInput
): Promise<Service> => {
  await verifyBusinessOwnership(businessId, userId, role)

  // Validate category belongs to this business if provided
  if (input.category_id) {
    const cat = await db.query(
      `SELECT id FROM service_categories WHERE id = $1 AND business_id = $2`,
      [input.category_id, businessId]
    )
    if (!cat.rows[0]) {
      throw new ApiError(400, "Category not found or does not belong to this business")
    }
  }

  // Validate employees belong to this business if provided
  if (input.employee_ids && input.employee_ids.length > 0) {
    const empResult = await db.query(
      `SELECT id FROM employees
       WHERE id = ANY($1::uuid[]) AND business_id = $2`,
      [input.employee_ids, businessId]
    )
    if (empResult.rows.length !== input.employee_ids.length) {
      throw new ApiError(400, "One or more employee IDs are invalid")
    }
  }

  const client = await db.connect()

  try {
    await client.query("BEGIN")

    const serviceResult = await client.query(
      `INSERT INTO services (
        business_id, category_id, name, description,
        duration_minutes, min_price, max_price
      ) VALUES ($1,$2,$3,$4,$5,$6,$7)
      RETURNING *`,
      [
        businessId,
        input.category_id ?? null,
        input.name,
        input.description ?? null,
        input.duration_minutes,
        input.min_price,
        input.max_price ?? null,
      ]
    )

    const service = serviceResult.rows[0]

    // Assign employees to service if provided
    if (input.employee_ids && input.employee_ids.length > 0) {
      for (const employeeId of input.employee_ids) {
        await client.query(
          `INSERT INTO service_employees (service_id, employee_id)
           VALUES ($1, $2)
           ON CONFLICT DO NOTHING`,
          [service.id, employeeId]
        )
      }
    }

    // Assign service media if provided
    if (input.image_media_id) {
      await client.query(
        `INSERT INTO service_media (service_id, media_id)
         VALUES ($1, $2)`,
        [service.id, input.image_media_id]
      )
    }

    await client.query("COMMIT")

    const fullService = await getServiceById(businessId, service.id)
    return fullService
  } catch (err) {
    await client.query("ROLLBACK")
    throw err
  } finally {
    client.release()
  }
}

export const listServices = async (
  businessId: string,
  categoryId?: string,
  includeInactive?: boolean
): Promise<Service[]> => {
  const conditions = [`s.business_id = $1`]
  const params: unknown[] = [businessId]
  let idx = 2

  if (categoryId) {
    conditions.push(`s.category_id = $${idx++}`)
    params.push(categoryId)
  }

  if (!includeInactive) {
    conditions.push(`s.is_active = TRUE`)
  }

  const result = await db.query(
    `SELECT
      s.*,
      sc.name AS category_name,
      m.url AS image_url,
      m.id AS image_media_id
    FROM services s
    LEFT JOIN service_categories sc ON sc.id = s.category_id
    LEFT JOIN service_media sm ON sm.service_id = s.id
    LEFT JOIN media m ON m.id = sm.media_id
    WHERE ${conditions.join(" AND ")}
    ORDER BY sc.sort_order ASC, s.name ASC`,
    params
  )

  const services = await Promise.all(
    result.rows.map(async (svc) => ({
      ...svc,
      employees: await getServiceEmployees(svc.id),
    }))
  )

  return services
}

export const getServiceById = async (
  businessId: string,
  serviceId: string
): Promise<Service> => {
  const result = await db.query(
    `SELECT
      s.*,
      sc.name AS category_name,
      m.url AS image_url,
      m.id AS image_media_id
    FROM services s
    LEFT JOIN service_categories sc ON sc.id = s.category_id
    LEFT JOIN service_media sm ON sm.service_id = s.id
    LEFT JOIN media m ON m.id = sm.media_id
    WHERE s.id = $1 AND s.business_id = $2`,
    [serviceId, businessId]
  )

  if (!result.rows[0]) {
    throw new ApiError(404, "Service not found")
  }

  const employees = await getServiceEmployees(serviceId)
  return { ...result.rows[0], employees }
}

export const updateService = async (
  businessId: string,
  serviceId: string,
  userId: string,
  role: string,
  input: UpdateServiceInput
): Promise<Service> => {
  await verifyBusinessOwnership(businessId, userId, role)

  const existing = await db.query(
    `SELECT id FROM services WHERE id = $1 AND business_id = $2`,
    [serviceId, businessId]
  )

  if (!existing.rows[0]) {
    throw new ApiError(404, "Service not found")
  }

  if (input.category_id) {
    const cat = await db.query(
      `SELECT id FROM service_categories WHERE id = $1 AND business_id = $2`,
      [input.category_id, businessId]
    )
    if (!cat.rows[0]) {
      throw new ApiError(400, "Category not found or does not belong to this business")
    }
  }

  const fields: string[] = []
  const values: unknown[] = []
  let idx = 1

  const allowedFields: (keyof UpdateServiceInput)[] = [
    "name",
    "category_id",
    "description",
    "duration_minutes",
    "min_price",
    "max_price",
    "is_active",
  ]

  for (const field of allowedFields) {
    if (input[field] !== undefined) {
      fields.push(`${field} = $${idx++}`)
      values.push(input[field])
    }
  }

  const client = await db.connect()
  try {
    await client.query("BEGIN")

    if (fields.length > 0) {
      fields.push(`updated_at = NOW()`)
      values.push(serviceId)
      await client.query(
        `UPDATE services SET ${fields.join(", ")} WHERE id = $${idx}`,
        values
      )
    }

    // Update service media link if provided
    if (input.image_media_id !== undefined) {
      await client.query(
        `DELETE FROM service_media WHERE service_id = $1`,
        [serviceId]
      )
      if (input.image_media_id) {
        await client.query(
          `INSERT INTO service_media (service_id, media_id)
           VALUES ($1, $2)`,
          [serviceId, input.image_media_id]
        )
      }
    }

    await client.query("COMMIT")
  } catch (err) {
    await client.query("ROLLBACK")
    throw err
  } finally {
    client.release()
  }

  return getServiceById(businessId, serviceId)
}

// ─────────────────────────────────────────────
// Assign employees to a service
// Replaces existing assignments entirely
// ─────────────────────────────────────────────
export const assignEmployeesToService = async (
  businessId: string,
  serviceId: string,
  userId: string,
  role: string,
  input: AssignEmployeesToServiceInput
): Promise<Service> => {
  await verifyBusinessOwnership(businessId, userId, role)

  const existing = await db.query(
    `SELECT id FROM services WHERE id = $1 AND business_id = $2`,
    [serviceId, businessId]
  )

  if (!existing.rows[0]) {
    throw new ApiError(404, "Service not found")
  }

  const empResult = await db.query(
    `SELECT id FROM employees
     WHERE id = ANY($1::uuid[]) AND business_id = $2`,
    [input.employee_ids, businessId]
  )

  if (empResult.rows.length !== input.employee_ids.length) {
    throw new ApiError(400, "One or more employee IDs are invalid")
  }

  const client = await db.connect()

  try {
    await client.query("BEGIN")

    // Remove all existing assignments for this service
    await client.query(
      `DELETE FROM service_employees WHERE service_id = $1`,
      [serviceId]
    )

    // Insert new assignments
    for (const employeeId of input.employee_ids) {
      await client.query(
        `INSERT INTO service_employees (service_id, employee_id)
         VALUES ($1, $2)`,
        [serviceId, employeeId]
      )
    }

    await client.query("COMMIT")
  } catch (err) {
    await client.query("ROLLBACK")
    throw err
  } finally {
    client.release()
  }

  return getServiceById(businessId, serviceId)
}

// ─────────────────────────────────────────────
// Remove one employee from a service
// ─────────────────────────────────────────────
export const removeEmployeeFromService = async (
  businessId: string,
  serviceId: string,
  employeeId: string,
  userId: string,
  role: string
): Promise<Service> => {
  await verifyBusinessOwnership(businessId, userId, role)

  await db.query(
    `DELETE FROM service_employees
     WHERE service_id = $1 AND employee_id = $2`,
    [serviceId, employeeId]
  )

  return getServiceById(businessId, serviceId)
}

export const deleteService = async (
  businessId: string,
  serviceId: string,
  userId: string,
  role: string
): Promise<void> => {
  await verifyBusinessOwnership(businessId, userId, role)

  // Block delete if service has been booked
  const bookings = await db.query(
    `SELECT id FROM booking_services WHERE service_id = $1 LIMIT 1`,
    [serviceId]
  )

  if (bookings.rows.length > 0) {
    throw new ApiError(
      409,
      "Cannot delete a service that has existing bookings. Deactivate it instead."
    )
  }

  const result = await db.query(
    `DELETE FROM services WHERE id = $1 AND business_id = $2 RETURNING id`,
    [serviceId, businessId]
  )

  if (!result.rows[0]) {
    throw new ApiError(404, "Service not found")
  }
}
