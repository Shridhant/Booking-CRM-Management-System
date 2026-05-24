import { z } from "zod"

export const businessTypeSchema = z.enum([
  "salon",
  "spa",
  "nail_studio",
  "barber",
  "makeup_studio",
  "professional",
])

export const publicBusinessSearchQuerySchema = z.object({
  city: z.string().trim().min(1).optional(),
  type: businessTypeSchema.optional(),
  query: z.string().trim().min(1).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
})

export const publicSlotsQuerySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),
  branch_id: z.string().uuid("Invalid branch ID"),
  service_ids: z.string().min(1, "service_ids is required"),
  employee_id: z.string().uuid("Invalid employee ID").optional(),
})

export const publicReviewsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
})

export type PublicBusinessSearchQuery = z.infer<typeof publicBusinessSearchQuerySchema>
export type PublicSlotsQuery = z.infer<typeof publicSlotsQuerySchema>
export type PublicReviewsQuery = z.infer<typeof publicReviewsQuerySchema>
