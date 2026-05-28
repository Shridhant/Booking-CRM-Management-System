import { z } from "zod"

export const updateProfileSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters").optional(),
    phone: z.string().min(10).max(20).optional().nullable(),
    profile_media_id: z.string().uuid("Invalid UUID").optional().nullable(),
})

export type UpdateProfileSchema = z.infer<typeof updateProfileSchema>