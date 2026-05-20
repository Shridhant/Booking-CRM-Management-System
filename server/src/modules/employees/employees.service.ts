import { db } from "../../config/db"
import { ApiError } from "../../utils/api-error"
import {
    Employee,
    CreateEmployeeInput,
    UpdateEmployeeInput,
    AssignBranchesInput,
} from "./employees.types"

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
// Verify all branch_ids belong to the business
// Prevents assigning employee to another
// business's branches
// ─────────────────────────────────────────────
const verifyBranchesOwnedByBusiness = async (
    businessId: string,
    branchIds: string[]
) => {
    const result = await db.query(
        `SELECT id FROM business_branches
     WHERE id = ANY($1::uuid[]) AND business_id = $2`,
        [branchIds, businessId]
    )

    if (result.rows.length !== branchIds.length) {
        throw new ApiError(
            400,
            "One or more branch IDs are invalid or do not belong to this business"
        )
    }
}

// ─────────────────────────────────────────────
// Get employee with their branch assignments
// ─────────────────────────────────────────────
const getEmployeeWithBranches = async (
    employeeId: string
): Promise<Employee | null> => {
    const empResult = await db.query(
        `SELECT
      e.*,
      m.url AS profile_photo_url
    FROM employees e
    LEFT JOIN media m ON m.id = e.profile_media_id
    WHERE e.id = $1`,
        [employeeId]
    )

    if (!empResult.rows[0]) return null

    const branchResult = await db.query(
        `SELECT
      eb.branch_id,
      bb.name AS branch_name,
      bb.city
    FROM employee_branches eb
    JOIN business_branches bb ON bb.id = eb.branch_id
    WHERE eb.employee_id = $1
    ORDER BY bb.name ASC`,
        [employeeId]
    )

    return {
        ...empResult.rows[0],
        branches: branchResult.rows,
    }
}

// ─────────────────────────────────────────────
// Create employee
// Creates the employee record and assigns
// them to one or more branches in a transaction
// ─────────────────────────────────────────────
export const createEmployee = async (
    businessId: string,
    userId: string,
    role: string,
    input: CreateEmployeeInput
): Promise<Employee> => {
    await verifyBusinessOwnership(businessId, userId, role)
    await verifyBranchesOwnedByBusiness(businessId, input.branch_ids)

    const client = await db.connect()

    try {
        await client.query("BEGIN")

        // Create the employee record
        const empResult = await client.query(
            `INSERT INTO employees (business_id, name, bio, experience_years)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
            [
                businessId,
                input.name,
                input.bio ?? null,
                input.experience_years ?? 0,
            ]
        )

        const employee = empResult.rows[0]

        // Assign to branches
        for (const branchId of input.branch_ids) {
            await client.query(
                `INSERT INTO employee_branches (employee_id, branch_id)
         VALUES ($1, $2)
         ON CONFLICT DO NOTHING`,
                [employee.id, branchId]
            )
        }

        await client.query("COMMIT")

        // Return full employee with branches
        const full = await getEmployeeWithBranches(employee.id)
        return full!
    } catch (err) {
        await client.query("ROLLBACK")
        throw err
    } finally {
        client.release()
    }
}

// ─────────────────────────────────────────────
// List all employees for a business
// Optional filter by branchId
// ─────────────────────────────────────────────
export const listEmployees = async (
    businessId: string,
    branchId?: string
): Promise<Employee[]> => {
    let query: string
    let params: unknown[]

    if (branchId) {
        query = `
      SELECT
        e.*,
        m.url AS profile_photo_url
      FROM employees e
      LEFT JOIN media m ON m.id = e.profile_media_id
      JOIN employee_branches eb ON eb.employee_id = e.id
      WHERE e.business_id = $1
        AND eb.branch_id = $2
      ORDER BY e.name ASC`
        params = [businessId, branchId]
    } else {
        query = `
      SELECT
        e.*,
        m.url AS profile_photo_url
      FROM employees e
      LEFT JOIN media m ON m.id = e.profile_media_id
      WHERE e.business_id = $1
      ORDER BY e.name ASC`
        params = [businessId]
    }

    const result = await db.query(query, params)

    // Attach branches to each employee
    const employees = await Promise.all(
        result.rows.map(async (emp) => {
            const branchResult = await db.query(
                `SELECT
          eb.branch_id,
          bb.name AS branch_name,
          bb.city
        FROM employee_branches eb
        JOIN business_branches bb ON bb.id = eb.branch_id
        WHERE eb.employee_id = $1
        ORDER BY bb.name ASC`,
                [emp.id]
            )
            return { ...emp, branches: branchResult.rows }
        })
    )

    return employees
}

// ─────────────────────────────────────────────
// Get single employee by ID
// ─────────────────────────────────────────────
export const getEmployeeById = async (
    businessId: string,
    employeeId: string
): Promise<Employee> => {
    const employee = await getEmployeeWithBranches(employeeId)

    if (!employee || employee.business_id !== businessId) {
        throw new ApiError(404, "Employee not found")
    }

    return employee
}

// ─────────────────────────────────────────────
// Update employee details
// ─────────────────────────────────────────────
export const updateEmployee = async (
    businessId: string,
    employeeId: string,
    userId: string,
    role: string,
    input: UpdateEmployeeInput
): Promise<Employee> => {
    await verifyBusinessOwnership(businessId, userId, role)

    const existing = await db.query(
        `SELECT id FROM employees WHERE id = $1 AND business_id = $2`,
        [employeeId, businessId]
    )

    if (!existing.rows[0]) {
        throw new ApiError(404, "Employee not found")
    }

    const fields: string[] = []
    const values: unknown[] = []
    let idx = 1

    const allowedFields: (keyof UpdateEmployeeInput)[] = [
        "name",
        "bio",
        "experience_years",
        "is_active",
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

    values.push(employeeId)

    await db.query(
        `UPDATE employees SET ${fields.join(", ")} WHERE id = $${idx}`,
        values
    )

    const updated = await getEmployeeWithBranches(employeeId)
    return updated!
}

// ─────────────────────────────────────────────
// Assign employee to additional branches
// ─────────────────────────────────────────────
export const assignBranches = async (
    businessId: string,
    employeeId: string,
    userId: string,
    role: string,
    input: AssignBranchesInput
): Promise<Employee> => {
    await verifyBusinessOwnership(businessId, userId, role)
    await verifyBranchesOwnedByBusiness(businessId, input.branch_ids)

    const existing = await db.query(
        `SELECT id FROM employees WHERE id = $1 AND business_id = $2`,
        [employeeId, businessId]
    )

    if (!existing.rows[0]) {
        throw new ApiError(404, "Employee not found")
    }

    for (const branchId of input.branch_ids) {
        await db.query(
            `INSERT INTO employee_branches (employee_id, branch_id)
       VALUES ($1, $2)
       ON CONFLICT DO NOTHING`,
            [employeeId, branchId]
        )
    }

    const updated = await getEmployeeWithBranches(employeeId)
    return updated!
}

// ─────────────────────────────────────────────
// Remove employee from a specific branch
// ─────────────────────────────────────────────
export const removeBranchAssignment = async (
    businessId: string,
    employeeId: string,
    branchId: string,
    userId: string,
    role: string
): Promise<Employee> => {
    await verifyBusinessOwnership(businessId, userId, role)

    const existing = await db.query(
        `SELECT id FROM employees WHERE id = $1 AND business_id = $2`,
        [employeeId, businessId]
    )

    if (!existing.rows[0]) {
        throw new ApiError(404, "Employee not found")
    }

    // Make sure employee has at least one branch remaining
    const branchCount = await db.query(
        `SELECT COUNT(*) FROM employee_branches WHERE employee_id = $1`,
        [employeeId]
    )

    if (parseInt(branchCount.rows[0].count) <= 1) {
        throw new ApiError(
            400,
            "Employee must be assigned to at least one branch. Assign another branch before removing this one."
        )
    }

    await db.query(
        `DELETE FROM employee_branches
     WHERE employee_id = $1 AND branch_id = $2`,
        [employeeId, branchId]
    )

    const updated = await getEmployeeWithBranches(employeeId)
    return updated!
}

// ─────────────────────────────────────────────
// Deactivate employee (soft delete)
// Does not delete the record — preserves
// all historical booking data
// ─────────────────────────────────────────────
export const deactivateEmployee = async (
    businessId: string,
    employeeId: string,
    userId: string,
    role: string
): Promise<void> => {
    await verifyBusinessOwnership(businessId, userId, role)

    const result = await db.query(
        `UPDATE employees
     SET is_active = FALSE
     WHERE id = $1 AND business_id = $2
     RETURNING id`,
        [employeeId, businessId]
    )

    if (!result.rows[0]) {
        throw new ApiError(404, "Employee not found")
    }
}