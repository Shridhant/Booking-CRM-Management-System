// branches service
import { db } from "../../config/db"
import { ApiError } from "../../utils/api-error"
import { Branch, CreateBranchInput, UpdateBranchInput } from "./branches.types"

// ─────────────────────────────────────────────
// Verify that a business belongs to the
// requesting user. Reused across service methods.
// super_admin bypasses this check.
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
// Create a branch
// ─────────────────────────────────────────────
export const createBranch = async (
    businessId: string,
    userId: string,
    role: string,
    input: CreateBranchInput
): Promise<Branch> => {
    await verifyBusinessOwnership(businessId, userId, role)

    const result = await db.query(
        `INSERT INTO business_branches (
      business_id, name, address, city,
      latitude, longitude,
      opening_time, closing_time, phone
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
    RETURNING *`,
        [
            businessId,
            input.name,
            input.address ?? null,
            input.city ?? null,
            input.latitude ?? null,
            input.longitude ?? null,
            input.opening_time ?? null,
            input.closing_time ?? null,
            input.phone ?? null,
        ]
    )

    return result.rows[0]
}

// ─────────────────────────────────────────────
// List all branches for a business
// ─────────────────────────────────────────────
export const listBranches = async (businessId: string): Promise<Branch[]> => {
    const result = await db.query(
        `SELECT * FROM business_branches
     WHERE business_id = $1
     ORDER BY created_at ASC`,
        [businessId]
    )

    return result.rows
}

// ─────────────────────────────────────────────
// Get a single branch by ID
// ─────────────────────────────────────────────
export const getBranchById = async (
    businessId: string,
    branchId: string
): Promise<Branch> => {
    const result = await db.query(
        `SELECT * FROM business_branches
     WHERE id = $1 AND business_id = $2`,
        [branchId, businessId]
    )

    if (!result.rows[0]) {
        throw new ApiError(404, "Branch not found")
    }

    return result.rows[0]
}

// ─────────────────────────────────────────────
// Update a branch
// ─────────────────────────────────────────────
export const updateBranch = async (
    businessId: string,
    branchId: string,
    userId: string,
    role: string,
    input: UpdateBranchInput
): Promise<Branch> => {
    await verifyBusinessOwnership(businessId, userId, role)

    // Confirm branch belongs to this business
    const existing = await db.query(
        `SELECT id FROM business_branches WHERE id = $1 AND business_id = $2`,
        [branchId, businessId]
    )

    if (!existing.rows[0]) {
        throw new ApiError(404, "Branch not found")
    }

    const fields: string[] = []
    const values: unknown[] = []
    let idx = 1

    const allowedFields: (keyof UpdateBranchInput)[] = [
        "name",
        "address",
        "city",
        "latitude",
        "longitude",
        "opening_time",
        "closing_time",
        "phone",
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

    values.push(branchId)

    const result = await db.query(
        `UPDATE business_branches
     SET ${fields.join(", ")}
     WHERE id = $${idx}
     RETURNING *`,
        values
    )

    return result.rows[0]
}

// ─────────────────────────────────────────────
// Delete a branch
// Blocked if employees or bookings exist under it
// ─────────────────────────────────────────────
export const deleteBranch = async (
    businessId: string,
    branchId: string,
    userId: string,
    role: string
): Promise<void> => {
    await verifyBusinessOwnership(businessId, userId, role)

    // Confirm branch belongs to this business
    const existing = await db.query(
        `SELECT id FROM business_branches WHERE id = $1 AND business_id = $2`,
        [branchId, businessId]
    )

    if (!existing.rows[0]) {
        throw new ApiError(404, "Branch not found")
    }

    // Block delete if employees are assigned to this branch
    const employees = await db.query(
        `SELECT id FROM employees WHERE branch_id = $1 LIMIT 1`,
        [branchId]
    )

    if (employees.rows.length > 0) {
        throw new ApiError(
            409,
            "Cannot delete branch with assigned employees. Reassign or remove them first."
        )
    }

    // Block delete if bookings exist for this branch
    const bookings = await db.query(
        `SELECT id FROM bookings WHERE branch_id = $1 LIMIT 1`,
        [branchId]
    )

    if (bookings.rows.length > 0) {
        throw new ApiError(
            409,
            "Cannot delete branch with existing bookings."
        )
    }

    await db.query(
        `DELETE FROM business_branches WHERE id = $1`,
        [branchId]
    )
}