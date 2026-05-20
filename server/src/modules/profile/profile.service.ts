import { db } from "../../config/db"
import { ApiError } from "../../utils/api-error"
import { UpdateProfileInput, User } from "./profile.types"

export const getMe = async (userId: string): Promise<User> => {
    const result = await db.query(
        `SELECT
      u.id,
      u.name,
      u.email,
      u.phone,
      u.role,
      u.profile_media_id,
      u.is_active,
      u.created_at,
      u.updated_at,
      m.url AS profile_photo_url
    FROM users u
    LEFT JOIN media m ON m.id = u.profile_media_id
    WHERE u.id = $1`,
        [userId]
    )

    const user = result.rows[0]

    if (!user) {
        throw new ApiError(404, "User not found")
    }

    return user
}

export const updateProfile = async (
    userId: string,
    input: UpdateProfileInput
): Promise<User> => {
    const fields: string[] = []
    const values: unknown[] = []
    let idx = 1

    if (input.name !== undefined) {
        fields.push(`name = $${idx++}`)
        values.push(input.name)
    }

    if (input.phone !== undefined) {
        // Check phone not taken by another user
        const existing = await db.query(
            `SELECT id FROM users WHERE phone = $1 AND id != $2`,
            [input.phone, userId]
        )
        if (existing.rows.length > 0) {
            throw new ApiError(409, "Phone number is already in use")
        }
        fields.push(`phone = $${idx++}`)
        values.push(input.phone)
    }

    if (fields.length === 0) {
        throw new ApiError(400, "No fields provided to update")
    }

    fields.push(`updated_at = NOW()`)
    values.push(userId)

    const result = await db.query(
        `UPDATE users
     SET ${fields.join(", ")}
     WHERE id = $${idx}
     RETURNING id, name, email, phone, role, profile_media_id, is_active, created_at, updated_at`,
        values
    )

    return result.rows[0]
}