import { z } from "zod"

export const createCustomerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  phone: z.string().min(7).max(20).optional(),
  email: z.string().email("Invalid email").optional(),
  notes: z.string().optional(),
})

export const updateCustomerSchema = z.object({
  name: z.string().min(2).optional(),
  phone: z.string().min(7).max(20).optional(),
  email: z.string().email("Invalid email").optional(),
  notes: z.string().optional(),
})

export type CreateCustomerSchema = z.infer<typeof createCustomerSchema>
export type UpdateCustomerSchema = z.infer<typeof updateCustomerSchema>
