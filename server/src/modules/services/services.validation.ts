import { z } from "zod"

// ── Categories ────────────────────────────────

export const createCategorySchema = z.object({
  name: z.string().min(2, "Category name must be at least 2 characters"),
  sort_order: z.number().int().min(0).optional(),
})

export const updateCategorySchema = z.object({
  name: z.string().min(2).optional(),
  sort_order: z.number().int().min(0).optional(),
})

export const reorderCategoriesSchema = z.object({
  categories: z
    .array(
      z.object({
        id: z.string().uuid("Each id must be a valid UUID"),
        sort_order: z.number().int().min(0),
      })
    )
    .min(1, "At least one category required"),
})

// ── Services ──────────────────────────────────

export const createServiceSchema = z
  .object({
    name: z.string().min(2, "Service name must be at least 2 characters"),
    category_id: z.string().uuid("Invalid category ID").optional(),
    description: z.string().optional(),
    duration_minutes: z
      .number()
      .int()
      .min(5, "Duration must be at least 5 minutes")
      .max(480, "Duration cannot exceed 8 hours"),
    min_price: z.number().min(0, "Price cannot be negative"),
    max_price: z.number().min(0).optional(),
    image_media_id: z.string().uuid("Invalid UUID").optional().nullable(),
    employee_ids: z
      .array(z.string().uuid("Each employee_id must be a valid UUID"))
      .optional(),
  })
  .refine(
    (data) => {
      if (data.max_price !== undefined && data.max_price < data.min_price) {
        return false
      }
      return true
    },
    { message: "max_price must be greater than or equal to min_price" }
  )

export const updateServiceSchema = z
  .object({
    name: z.string().min(2).optional(),
    category_id: z.string().uuid("Invalid category ID").optional(),
    description: z.string().optional(),
    duration_minutes: z.number().int().min(5).max(480).optional(),
    min_price: z.number().min(0).optional(),
    max_price: z.number().min(0).optional(),
    image_media_id: z.string().uuid("Invalid UUID").optional().nullable(),
    is_active: z.boolean().optional(),
  })
  .refine(
    (data) => {
      if (
        data.max_price !== undefined &&
        data.min_price !== undefined &&
        data.max_price < data.min_price
      ) {
        return false
      }
      return true
    },
    { message: "max_price must be greater than or equal to min_price" }
  )

export const assignEmployeesToServiceSchema = z.object({
  employee_ids: z
    .array(z.string().uuid("Each employee_id must be a valid UUID"))
    .min(1, "At least one employee_id is required"),
})

export type CreateCategorySchema = z.infer<typeof createCategorySchema>
export type UpdateCategorySchema = z.infer<typeof updateCategorySchema>
export type ReorderCategoriesSchema = z.infer<typeof reorderCategoriesSchema>
export type CreateServiceSchema = z.infer<typeof createServiceSchema>
export type UpdateServiceSchema = z.infer<typeof updateServiceSchema>
export type AssignEmployeesToServiceSchema = z.infer<typeof assignEmployeesToServiceSchema>
