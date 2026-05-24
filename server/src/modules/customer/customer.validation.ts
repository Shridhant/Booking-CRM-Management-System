import { z } from "zod"

const dateString = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format")

const timeString = z
  .string()
  .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Time must be in HH:MM format")

export const createCustomerBookingSchema = z.object({
  business_id: z.string().uuid("Invalid business ID"),
  branch_id: z.string().uuid("Invalid branch ID"),
  employee_id: z.string().uuid("Invalid employee ID").optional(),
  service_ids: z
    .array(z.string().uuid("Each service_id must be a valid UUID"))
    .min(1, "At least one service is required"),
  booking_date: dateString,
  start_time: timeString,
  notes: z.string().max(1000).optional(),
})

export const listCustomerBookingsQuerySchema = z.object({
  scope: z.enum(["active", "completed", "cancelled", "all"]).default("all"),
})

export const createCustomerReviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(2000).optional(),
})

export type CreateCustomerBookingSchema = z.infer<typeof createCustomerBookingSchema>
export type ListCustomerBookingsQuery = z.infer<typeof listCustomerBookingsQuerySchema>
export type CreateCustomerReviewSchema = z.infer<typeof createCustomerReviewSchema>
