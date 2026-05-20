import bcrypt from "bcrypt"
import { db } from "../../config/db"
import { ApiError } from "../../utils/api-error"
import { generateTokenPair, verifyRefreshToken } from "./auth.utils"
import { LoginInput, TokenPair, CreateAccountInput } from "./auth.types"

const SALT_ROUNDS = 12

// ─────────────────────────────────────────────
// Internal utility — called by admin service
// NOT exposed as a public endpoint
// ─────────────────────────────────────────────
export const createAccount = async (
    input: CreateAccountInput,
    client?: any // optional pg client for transactions
): Promise<{ id: string; email: string; role: string }> => {
    const { name, email, phone, password, role } = input
    const query = client ?? db

    const existingEmail = await query.query(
        `SELECT id FROM users WHERE email = $1`,
        [email]
    )
    if (existingEmail.rows.length > 0) {
        throw new ApiError(409, "Email is already registered")
    }

    if (phone) {
        const existingPhone = await query.query(
            `SELECT id FROM users WHERE phone = $1`,
            [phone]
        )
        if (existingPhone.rows.length > 0) {
            throw new ApiError(409, "Phone number is already registered")
        }
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS)

    const result = await query.query(
        `INSERT INTO users (name, email, phone, password_hash, role)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, email, role`,
        [name, email, phone ?? null, passwordHash, role]
    )

    return result.rows[0]
}

// ─────────────────────────────────────────────
// Public login — all roles
// ─────────────────────────────────────────────
export const loginUser = async (input: LoginInput): Promise<TokenPair> => {
    const { email, password } = input

    const result = await db.query(
        `SELECT id, email, role, password_hash, is_active
     FROM users
     WHERE email = $1`,
        [email]
    )

    const user = result.rows[0]

    if (!user) {
        throw new ApiError(401, "Invalid email or password")
    }

    if (!user.is_active) {
        throw new ApiError(403, "Your account has been deactivated")
    }

    const isMatch = await bcrypt.compare(password, user.password_hash)

    if (!isMatch) {
        throw new ApiError(401, "Invalid email or password")
    }

    return generateTokenPair({
        userId: user.id,
        email: user.email,
        role: user.role,
    })
}

// ─────────────────────────────────────────────
// Refresh token
// ─────────────────────────────────────────────
export const refreshUserToken = async (
    refreshToken: string
): Promise<TokenPair> => {
    const payload = verifyRefreshToken(refreshToken)

    const result = await db.query(
        `SELECT id, email, role, is_active
     FROM users WHERE id = $1`,
        [payload.userId]
    )

    const user = result.rows[0]

    if (!user) {
        throw new ApiError(401, "User no longer exists")
    }

    if (!user.is_active) {
        throw new ApiError(403, "Your account has been deactivated")
    }

    return generateTokenPair({
        userId: user.id,
        email: user.email,
        role: user.role,
    })
}