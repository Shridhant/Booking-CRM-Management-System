// branches validation
import { z } from "zod"

// "HH:MM" time format validator
const timeString = z
    .string()
    .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Time must be in HH:MM format (e.g. 09:00)")

export const createBranchSchema = z.object({
    name: z.string().min(2, "Branch name must be at least 2 characters"),
    address: z.string().optional(),
    city: z.string().optional(),
    latitude: z.number().optional(),
    longitude: z.number().optional(),
    opening_time: timeString.optional(),
    closing_time: timeString.optional(),
    phone: z.string().min(7).max(20).optional(),
}).refine(
    (data) => {
        // If one time is provided, both must be provided
        if (data.opening_time && !data.closing_time) return false
        if (data.closing_time && !data.opening_time) return false
        return true
    },
    { message: "Both opening_time and closing_time must be provided together" }
)

export const updateBranchSchema = z.object({
    name: z.string().min(2).optional(),
    address: z.string().optional(),
    city: z.string().optional(),
    latitude: z.number().optional(),
    longitude: z.number().optional(),
    opening_time: timeString.optional(),
    closing_time: timeString.optional(),
    phone: z.string().min(7).max(20).optional(),
}).refine(
    (data) => {
        if (data.opening_time && !data.closing_time) return false
        if (data.closing_time && !data.opening_time) return false
        return true
    },
    { message: "Both opening_time and closing_time must be provided together" }
)

export type CreateBranchSchema = z.infer<typeof createBranchSchema>
export type UpdateBranchSchema = z.infer<typeof updateBranchSchema>