// admin service
import { db } from "../../config/db"
import { ApiError } from "../../utils/api-error"
import { createAccount } from "../auth/auth.service"
import { createBusiness } from "../businesses/businesses.service"
import { OnboardBusinessInput, OnboardBusinessResult } from "./admin.types"

// ─────────────────────────────────────────────
// Onboard a new salon
// Creates business_admin user + business
// + business_settings in a single transaction.
// If anything fails the whole thing rolls back.
// ─────────────────────────────────────────────
export const onboardBusiness = async (
    input: OnboardBusinessInput
): Promise<OnboardBusinessResult> => {
    const client = await db.connect()

    try {
        await client.query("BEGIN")

        // 1. Create the business_admin user account
        const user = await createAccount(
            {
                name: input.admin_name as string,
                email: input.admin_email as string,
                phone: input.admin_phone as string,
                password: input.admin_password as string,
                role: "business_admin",
            },
            client
        )

        // 2. Create the business owned by that user
        const business = await createBusiness(
            user.id,
            {
                business_type: input.business_type,
                name: input.business_name,
                phone: input.business_phone,
                email: input.business_email,
                address: input.address,
                city: input.city,
            },
            client
        )

        await client.query("COMMIT")

        return {
            user: {
                id: user.id,
                name: input.admin_name,
                email: user.email,
                role: user.role,
            },
            business: {
                id: business.id,
                name: business.name as string,
                slug: business.slug,
                business_type: business.business_type,
            },
            message: `${input.business_name} has been onboarded. Share these credentials with ${input.admin_name}.`,
        }
    } catch (err) {
        await client.query("ROLLBACK")
        throw err
    } finally {
        client.release()
    }
}

// ─────────────────────────────────────────────
// List all businesses on the platform
// ─────────────────────────────────────────────
export const listAllBusinesses = async () => {
    const result = await db.query(
        `SELECT
      b.id,
      b.name,
      b.slug,
      b.business_type,
      b.city,
      b.is_verified,
      b.created_at,
      u.id    AS owner_id,
      u.name  AS owner_name,
      u.email AS owner_email,
      u.phone AS owner_phone,
      u.is_active AS owner_is_active
    FROM businesses b
    JOIN users u ON u.id = b.owner_user_id
    ORDER BY b.created_at DESC`
    )

    return result.rows
}

// ─────────────────────────────────────────────
// Get full detail of any business
// ─────────────────────────────────────────────
export const getAnyBusiness = async (businessId: string) => {
    const result = await db.query(
        `SELECT
      b.*,
      u.id    AS owner_id,
      u.name  AS owner_name,
      u.email AS owner_email,
      u.phone AS owner_phone,
      logo.url  AS logo_url,
      cover.url AS cover_url
    FROM businesses b
    JOIN users u          ON u.id    = b.owner_user_id
    LEFT JOIN media logo  ON logo.id = b.logo_media_id
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
// Update any business field including is_verified
// ─────────────────────────────────────────────
export const updateAnyBusiness = async (
    businessId: string,
    input: Partial<{
        name: string
        description: string
        phone: string
        email: string
        address: string
        city: string
        is_verified: boolean
        booking_type: string
        allow_employee_selection: boolean
        auto_assign_strategy: string
        logo_media_id: string | null
        cover_media_id: string | null
    }>
) => {
    const existing = await db.query(
        `SELECT id FROM businesses WHERE id = $1`,
        [businessId]
    )

    if (!existing.rows[0]) {
        throw new ApiError(404, "Business not found")
    }

    const fields: string[] = []
    const values: unknown[] = []
    let idx = 1

    const allowedFields = [
        "name",
        "description",
        "phone",
        "email",
        "address",
        "city",
        "is_verified",
        "booking_type",
        "allow_employee_selection",
        "auto_assign_strategy",
        "logo_media_id",
        "cover_media_id",
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

    await db.query(
        `UPDATE businesses
     SET ${fields.join(", ")}
     WHERE id = $${idx}
     RETURNING *`,
        values
    )

    return getAnyBusiness(businessId)
}

// ─────────────────────────────────────────────
// Toggle business verified status
// ─────────────────────────────────────────────
export const toggleBusinessVerification = async (
    businessId: string
) => {
    const result = await db.query(
        `UPDATE businesses
     SET is_verified = NOT is_verified, updated_at = NOW()
     WHERE id = $1
     RETURNING id, name, is_verified`,
        [businessId]
    )

    if (!result.rows[0]) {
        throw new ApiError(404, "Business not found")
    }

    return result.rows[0]
}

// ─────────────────────────────────────────────
// List all users on the platform
// ─────────────────────────────────────────────
export const listAllUsers = async () => {
    const result = await db.query(
        `SELECT
      id, name, email, phone, role, is_active, created_at
    FROM users
    ORDER BY created_at DESC`
    )

    return result.rows
}

// ─────────────────────────────────────────────
// Deactivate a user account
// ─────────────────────────────────────────────
export const deactivateUser = async (userId: string) => {
    const result = await db.query(
        `UPDATE users
     SET is_active = FALSE, updated_at = NOW()
     WHERE id = $1
     RETURNING id, name, email, role, is_active`,
        [userId]
    )

    if (!result.rows[0]) {
        throw new ApiError(404, "User not found")
    }

    return result.rows[0]
}

// ─────────────────────────────────────────────
// Reactivate a user account
// ─────────────────────────────────────────────
export const reactivateUser = async (userId: string) => {
    const result = await db.query(
        `UPDATE users
     SET is_active = TRUE, updated_at = NOW()
     WHERE id = $1
     RETURNING id, name, email, role, is_active`,
        [userId]
    )

    if (!result.rows[0]) {
        throw new ApiError(404, "User not found")
    }

    return result.rows[0]
}