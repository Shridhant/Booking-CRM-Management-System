import { z } from "zod"

// Register is no longer public.
// Accounts are created by super_admin via /api/admin/onboard.
// This schema is kept as an internal utility used by the admin service.
export const createAccountSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Invalid email address"),
    phone: z.string().min(7).max(20).optional(),
    password: z.string().min(8, "Password must be at least 8 characters"),
    role: z.enum(["super_admin", "business_admin", "employee", "customer"]),
})

export const loginSchema = z.object({
    email: z.string().email("Invalid email address"),
    password: z.string().min(1, "Password is required"),
})

export const refreshTokenSchema = z.object({
    refreshToken: z.string().min(1, "Refresh token is required"),
})

export type CreateAccountSchema = z.infer<typeof createAccountSchema>
export type LoginSchema = z.infer<typeof loginSchema>
export type RefreshTokenSchema = z.infer<typeof refreshTokenSchema>