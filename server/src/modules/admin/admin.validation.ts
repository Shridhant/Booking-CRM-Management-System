// admin validation
import { z } from "zod"

export const onboardBusinessSchema = z.object({
    business_type: z.enum([
        "salon",
        "spa",
        "nail_studio",
        "barber",
        "makeup_studio",
        "professional",
    ]),
    business_name: z.string().min(2, "Business name must be at least 2 characters"),
    business_phone: z.string().min(7).max(20).optional(),
    business_email: z.string().email("Invalid business email").optional(),
    address: z.string().optional(),
    city: z.string().optional(),

    admin_name: z.string().min(2, "Admin name must be at least 2 characters"),
    admin_email: z.string().email("Invalid admin email"),
    admin_phone: z.string().min(7).max(20).optional(),
    admin_password: z.string().min(8, "Password must be at least 8 characters"),
})

export const updateAnyBusinessSchema = z.object({
    name: z.string().min(2).optional(),
    description: z.string().optional(),
    phone: z.string().min(7).max(20).optional(),
    email: z.string().email().optional(),
    address: z.string().optional(),
    city: z.string().optional(),
    is_verified: z.boolean().optional(),
    booking_type: z
        .enum(["free_booking", "pay_online_required", "partial_advance"])
        .optional(),
    allow_employee_selection: z.boolean().optional(),
    auto_assign_strategy: z
        .enum(["manual", "least_busy", "round_robin", "random"])
        .optional(),
})

export type OnboardBusinessSchema = z.infer<typeof onboardBusinessSchema>
export type UpdateAnyBusinessSchema = z.infer<typeof updateAnyBusinessSchema>