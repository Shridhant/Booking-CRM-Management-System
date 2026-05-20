import { z } from "zod"

const dateString = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format")

const timeString = z
  .string()
  .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Time must be in HH:MM format")

export const createBookingSchema = z.object({
  customer_id: z.string().uuid("Invalid customer ID"),
  branch_id: z.string().uuid("Invalid branch ID"),
  employee_id: z.string().uuid("Invalid employee ID").optional(),
  service_ids: z
    .array(z.string().uuid("Each service_id must be a valid UUID"))
    .min(1, "At least one service is required"),
  booking_date: dateString,
  start_time: timeString,
  payment_type: z.enum(["pay_online", "pay_at_salon"]).optional(),
  notes: z.string().optional(),
})

export const updateBookingStatusSchema = z.object({
  booking_status: z.enum([
    "pending",
    "confirmed",
    "completed",
    "cancelled",
    "no_show",
  ]),
})

export const assignEmployeeSchema = z.object({
  employee_id: z.string().uuid("Invalid employee ID"),
})

export const getSlotsSchema = z.object({
  date: dateString,
  branch_id: z.string().uuid("Invalid branch ID"),
  service_ids: z.string().min(1, "service_ids is required"),
  employee_id: z.string().uuid("Invalid employee ID").optional(),
})

export type CreateBookingSchema = z.infer<typeof createBookingSchema>
export type UpdateBookingStatusSchema = z.infer<typeof updateBookingStatusSchema>
export type AssignEmployeeSchema = z.infer<typeof assignEmployeeSchema>
export type GetSlotsSchema = z.infer<typeof getSlotsSchema>
