import { z } from "zod"

const businessTypeEnum = z.enum([
    "salon",
    "spa",
    "nail_studio",
    "barber",
    "makeup_studio",
    "professional",
])

const bookingTypeEnum = z.enum([
    "free_booking",
    "pay_online_required",
    "partial_advance",
])

const autoAssignStrategyEnum = z.enum([
    "manual",
    "least_busy",
    "round_robin",
    "random",
])

export const createBusinessSchema = z.object({
    business_type: businessTypeEnum,
    name: z.string().min(2, "Business name must be at least 2 characters"),
    description: z.string().optional(),
    phone: z.string().min(7).max(20).optional(),
    email: z.string().email("Invalid email").optional(),
    address: z.string().optional(),
    city: z.string().optional(),
    latitude: z.number().optional(),
    longitude: z.number().optional(),
})

const emptyToNull = (val: unknown) => (val === "" ? null : val)

export const updateBusinessSchema = z.object({
    name: z.string().min(2).optional(),
    description: z.preprocess(emptyToNull, z.string().optional().nullable()),
    phone: z.preprocess(emptyToNull, z.string().min(7).max(20).optional().nullable()),
    email: z.preprocess(emptyToNull, z.string().email("Invalid email").optional().nullable()),
    address: z.preprocess(emptyToNull, z.string().optional().nullable()),
    city: z.preprocess(emptyToNull, z.string().optional().nullable()),
    latitude: z.number().optional().nullable(),
    longitude: z.number().optional().nullable(),
    booking_type: bookingTypeEnum.optional(),
    allow_employee_selection: z.boolean().optional(),
    auto_assign_strategy: autoAssignStrategyEnum.optional(),
    logo_media_id: z.preprocess(emptyToNull, z.string().uuid("Invalid UUID").optional().nullable()),
    cover_media_id: z.preprocess(emptyToNull, z.string().uuid("Invalid UUID").optional().nullable()),
})

export const updateBusinessSettingsSchema = z.object({
    allow_online_payment: z.boolean().optional(),
    allow_pay_at_salon: z.boolean().optional(),
    booking_buffer_minutes: z.number().int().min(0).max(120).optional(),
    cancellation_hours_limit: z.number().int().min(0).max(168).optional(),
    timezone: z.string().min(1).optional(),
})

export type CreateBusinessSchema = z.infer<typeof createBusinessSchema>
export type UpdateBusinessSchema = z.infer<typeof updateBusinessSchema>
export type UpdateBusinessSettingsSchema = z.infer<typeof updateBusinessSettingsSchema>