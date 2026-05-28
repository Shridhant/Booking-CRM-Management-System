import { db } from "../../config/db"
import { ApiError } from "../../utils/api-error"
import { getAvailableSlots } from "../bookings/bookings.service"
import {
  PublicBusinessSearchQuery,
  PublicReviewsQuery,
  PublicSlotsQuery,
} from "./public.validation"

const resolveBusiness = async (businessIdOrSlug: string) => {
  const result = await db.query(
    `SELECT
      b.id,
      b.business_type,
      b.name,
      b.slug,
      b.description,
      b.phone,
      b.email,
      b.address,
      b.city,
      b.latitude,
      b.longitude,
      b.is_verified,
      b.booking_type,
      b.allow_employee_selection,
      b.created_at,
      b.updated_at,
      logo.url AS logo_url,
      cover.url AS cover_url,
      COALESCE(ROUND(AVG(r.rating)::numeric, 1), 0)::float AS average_rating,
      COUNT(r.id)::int AS review_count
    FROM businesses b
    LEFT JOIN media logo ON logo.id = b.logo_media_id
    LEFT JOIN media cover ON cover.id = b.cover_media_id
    LEFT JOIN reviews r ON r.business_id = b.id
    WHERE b.id::text = $1 OR b.slug = $1
    GROUP BY b.id, logo.url, cover.url
    LIMIT 1`,
    [businessIdOrSlug]
  )

  if (!result.rows[0]) {
    throw new ApiError(404, "Business not found")
  }

  return result.rows[0]
}

export const searchPublicBusinesses = async (filters: PublicBusinessSearchQuery) => {
  const conditions: string[] = []
  const params: unknown[] = []
  let idx = 1

  if (filters.city) {
    conditions.push(`b.city ILIKE $${idx++}`)
    params.push(`%${filters.city}%`)
  }

  if (filters.type) {
    conditions.push(`b.business_type = $${idx++}`)
    params.push(filters.type)
  }

  if (filters.query) {
    conditions.push(`(
      b.name ILIKE $${idx} OR
      b.description ILIKE $${idx} OR
      b.city ILIKE $${idx}
    )`)
    params.push(`%${filters.query}%`)
    idx++
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : ""
  const offset = (filters.page - 1) * filters.limit

  const totalResult = await db.query(
    `SELECT COUNT(*)::int AS total
     FROM businesses b
     ${whereClause}`,
    params
  )

  const result = await db.query(
    `SELECT
      b.id,
      b.business_type,
      b.name,
      b.slug,
      b.description,
      b.phone,
      b.email,
      b.address,
      b.city,
      b.latitude,
      b.longitude,
      b.is_verified,
      b.booking_type,
      b.allow_employee_selection,
      b.created_at,
      logo.url AS logo_url,
      cover.url AS cover_url,
      COALESCE(ROUND(AVG(r.rating)::numeric, 1), 0)::float AS average_rating,
      COUNT(r.id)::int AS review_count
    FROM businesses b
    LEFT JOIN media logo ON logo.id = b.logo_media_id
    LEFT JOIN media cover ON cover.id = b.cover_media_id
    LEFT JOIN reviews r ON r.business_id = b.id
    ${whereClause}
    GROUP BY b.id, logo.url, cover.url
    ORDER BY b.is_verified DESC, b.name ASC, b.created_at DESC
    LIMIT $${idx++} OFFSET $${idx}`,
    [...params, filters.limit, offset]
  )

  const total = totalResult.rows[0]?.total ?? 0

  return {
    items: result.rows,
    page: filters.page,
    limit: filters.limit,
    total,
    total_pages: Math.ceil(total / filters.limit),
  }
}

export const getPublicBusiness = async (businessIdOrSlug: string) => {
  return resolveBusiness(businessIdOrSlug)
}

export const listPublicBranches = async (businessIdOrSlug: string) => {
  const business = await resolveBusiness(businessIdOrSlug)

  const result = await db.query(
    `SELECT
      id,
      business_id,
      name,
      address,
      city,
      latitude,
      longitude,
      opening_time,
      closing_time,
      phone,
      created_at
    FROM business_branches
    WHERE business_id = $1
    ORDER BY name ASC`,
    [business.id]
  )

  return result.rows
}

export const listPublicServices = async (businessIdOrSlug: string) => {
  const business = await resolveBusiness(businessIdOrSlug)

  const categoriesResult = await db.query(
    `SELECT id, business_id, name, sort_order, created_at
     FROM service_categories
     WHERE business_id = $1
     ORDER BY sort_order ASC, created_at ASC`,
    [business.id]
  )

  const servicesResult = await db.query(
    `SELECT
      s.*,
      sc.name AS category_name,
      COALESCE(
        json_agg(
          json_build_object(
            'employee_id', e.id,
            'employee_name', e.name,
            'profile_photo_url', m.url
          )
        ) FILTER (WHERE e.id IS NOT NULL),
        '[]'::json
      ) AS employees
    FROM services s
    LEFT JOIN service_categories sc ON sc.id = s.category_id
    LEFT JOIN service_employees se ON se.service_id = s.id
    LEFT JOIN employees e ON e.id = se.employee_id AND e.is_active = TRUE
    LEFT JOIN media m ON m.id = e.profile_media_id
    WHERE s.business_id = $1
      AND s.is_active = TRUE
    GROUP BY s.id, sc.name, sc.sort_order
    ORDER BY sc.sort_order ASC NULLS LAST, s.name ASC`,
    [business.id]
  )

  const servicesByCategory: Record<string, any[]> = {}
  const uncategorized: any[] = []

  for (const service of servicesResult.rows) {
    if (!service.category_id) {
      uncategorized.push(service)
      continue
    }

    const categoryServices = servicesByCategory[service.category_id] ?? []
    categoryServices.push(service)
    servicesByCategory[service.category_id] = categoryServices
  }

  const categories = categoriesResult.rows.map((category: any) => ({
    ...category,
    services: servicesByCategory[category.id] ?? [],
  }))

  if (uncategorized.length > 0) {
    categories.push({
      id: null,
      business_id: business.id,
      name: "Uncategorized",
      sort_order: null,
      created_at: null,
      services: uncategorized,
    })
  }

  return categories
}

export const getPublicSlots = async (
  businessIdOrSlug: string,
  query: PublicSlotsQuery
) => {
  const business = await resolveBusiness(businessIdOrSlug)
  const serviceIds = query.service_ids
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean)

  if (serviceIds.length === 0) {
    throw new ApiError(400, "At least one service_id is required")
  }

  return getAvailableSlots(business.id, {
    date: query.date,
    branch_id: query.branch_id,
    service_ids: serviceIds,
    ...(query.employee_id ? { employee_id: query.employee_id } : {}),
  })
}

export const listPublicReviews = async (
  businessIdOrSlug: string,
  query: PublicReviewsQuery
) => {
  const business = await resolveBusiness(businessIdOrSlug)
  const offset = (query.page - 1) * query.limit

  const totalResult = await db.query(
    `SELECT COUNT(*)::int AS total FROM reviews WHERE business_id = $1`,
    [business.id]
  )

  const result = await db.query(
    `SELECT
      r.id,
      r.booking_id,
      r.business_id,
      r.rating,
      r.comment,
      r.created_at,
      u.name AS customer_name
    FROM reviews r
    JOIN users u ON u.id = r.customer_user_id
    WHERE r.business_id = $1
    ORDER BY r.created_at DESC
    LIMIT $2 OFFSET $3`,
    [business.id, query.limit, offset]
  )

  const total = totalResult.rows[0]?.total ?? 0

  return {
    items: result.rows,
    page: query.page,
    limit: query.limit,
    total,
    total_pages: Math.ceil(total / query.limit),
  }
}

export const getPublicBusinessGallery = async (businessIdOrSlug: string) => {
  const business = await resolveBusiness(businessIdOrSlug)
  const result = await db.query(
    `SELECT bg.id, bg.sort_order, m.id AS media_id, m.url
     FROM business_gallery bg
     JOIN media m ON m.id = bg.media_id
     WHERE bg.business_id = $1
     ORDER BY bg.sort_order ASC, bg.created_at DESC`,
    [business.id]
  )
  return result.rows
}
