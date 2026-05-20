import { db } from "../../config/db"
import { ApiError } from "../../utils/api-error"
import {
    Business,
    CreateBusinessInput,
    UpdateBusinessInput,
} from "./businesses.types"
import { generateSlug } from "./businesses.utils"

// ─────────────────────────────────────────────
// Internal — called only by admin service
// inside a transaction, not exposed via API
// ─────────────────────────────────────────────
export const createBusiness = async (
    ownerUserId: string,
    input: CreateBusinessInput,
    client?: any
): Promise<Business> => {
    const query = client ?? db
    const slug = generateSlug(input.name)

    const result = await query.query(
        `INSERT INTO businesses (
      owner_user_id, business_type, name, slug,
      description, phone, email, address, city, latitude, longitude
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
    RETURNING *`,
        [
            ownerUserId,
            input.business_type,
            input.name,
            slug,
            input.description ?? null,
            input.phone ?? null,
            input.email ?? null,
            input.address ?? null,
            input.city ?? null,
            input.latitude ?? null,
            input.longitude ?? null,
        ]
    )

    // Auto-create default business_settings row
    await query.query(
        `INSERT INTO business_settings (business_id)
     VALUES ($1)
     ON CONFLICT (business_id) DO NOTHING`,
        [result.rows[0].id]
    )

    return result.rows[0]
}

// ─────────────────────────────────────────────
// Get business by ID
// ─────────────────────────────────────────────
export const getBusinessById = async (
    businessId: string
): Promise<Business> => {
    const result = await db.query(
        `SELECT
      b.*,
      logo.url  AS logo_url,
      cover.url AS cover_url
    FROM businesses b
    LEFT JOIN media logo  ON logo.id  = b.logo_media_id
    LEFT JOIN media cover ON cover.id = b.cover_media_id
    WHERE b.id = $1`,
        [businessId]
    )

    if (!result.rows[0]) {
        throw new ApiError(404, "Business not found")
    }

    return result.rows[0]
}

// ─────────────────────────────────────────────
// Get business by owner user ID
// A business_admin owns exactly one business
// ─────────────────────────────────────────────
export const getBusinessByOwnerId = async (
    ownerUserId: string
): Promise<Business> => {
    const result = await db.query(
        `SELECT
      b.*,
      logo.url  AS logo_url,
      cover.url AS cover_url
    FROM businesses b
    LEFT JOIN media logo  ON logo.id  = b.logo_media_id
    LEFT JOIN media cover ON cover.id = b.cover_media_id
    WHERE b.owner_user_id = $1
    LIMIT 1`,
        [ownerUserId]
    )

    if (!result.rows[0]) {
        throw new ApiError(404, "No business found for this account")
    }

    return result.rows[0]
}

// ─────────────────────────────────────────────
// Get all businesses — used by admin service
// ─────────────────────────────────────────────
export const getAllBusinesses = async (): Promise<Business[]> => {
    const result = await db.query(
        `SELECT
      b.*,
      u.name   AS owner_name,
      u.email  AS owner_email,
      logo.url AS logo_url
    FROM businesses b
    LEFT JOIN users u     ON u.id    = b.owner_user_id
    LEFT JOIN media logo  ON logo.id = b.logo_media_id
    ORDER BY b.created_at DESC`
    )

    return result.rows
}

// ─────────────────────────────────────────────
// Update business
// business_admin can only update their own
// super_admin can update any
// ─────────────────────────────────────────────
export const updateBusiness = async (
    businessId: string,
    requestingUserId: string,
    requestingUserRole: string,
    input: UpdateBusinessInput
): Promise<Business> => {
    const existing = await db.query(
        `SELECT id, owner_user_id FROM businesses WHERE id = $1`,
        [businessId]
    )

    if (!existing.rows[0]) {
        throw new ApiError(404, "Business not found")
    }

    // business_admin can only update their own business
    if (
        requestingUserRole === "business_admin" &&
        existing.rows[0].owner_user_id !== requestingUserId
    ) {
        throw new ApiError(403, "You do not own this business")
    }

    const fields: string[] = []
    const values: unknown[] = []
    let idx = 1

    const allowedFields: (keyof UpdateBusinessInput)[] = [
        "name",
        "description",
        "phone",
        "email",
        "address",
        "city",
        "latitude",
        "longitude",
        "booking_type",
        "allow_employee_selection",
        "auto_assign_strategy",
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
    values.push(businessId)

    const result = await db.query(
        `UPDATE businesses
     SET ${fields.join(", ")}
     WHERE id = $${idx}
     RETURNING *`,
        values
    )

    return result.rows[0]
}

// ─────────────────────────────────────────────
// Get business settings
// ─────────────────────────────────────────────
export const getBusinessSettings = async (businessId: string) => {
    const result = await db.query(
        `SELECT * FROM business_settings WHERE business_id = $1`,
        [businessId]
    )

    if (!result.rows[0]) {
        throw new ApiError(404, "Business settings not found")
    }

    return result.rows[0]
}

// ─────────────────────────────────────────────
// Update business settings
// ─────────────────────────────────────────────
export const updateBusinessSettings = async (
    businessId: string,
    requestingUserId: string,
    requestingUserRole: string,
    input: {
        allow_online_payment?: boolean
        allow_pay_at_salon?: boolean
        booking_buffer_minutes?: number
        cancellation_hours_limit?: number
        timezone?: string
    }
) => {
    const business = await db.query(
        `SELECT id, owner_user_id FROM businesses WHERE id = $1`,
        [businessId]
    )

    if (!business.rows[0]) {
        throw new ApiError(404, "Business not found")
    }

    if (
        requestingUserRole === "business_admin" &&
        business.rows[0].owner_user_id !== requestingUserId
    ) {
        throw new ApiError(403, "You do not own this business")
    }

    const fields: string[] = []
    const values: unknown[] = []
    let idx = 1

    const allowedFields = [
        "allow_online_payment",
        "allow_pay_at_salon",
        "booking_buffer_minutes",
        "cancellation_hours_limit",
        "timezone",
    ] as const

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
    values.push(businessId)

    const result = await db.query(
        `UPDATE business_settings
     SET ${fields.join(", ")}
     WHERE business_id = $${idx}
     RETURNING *`,
        values
    )

    return result.rows[0]
}


