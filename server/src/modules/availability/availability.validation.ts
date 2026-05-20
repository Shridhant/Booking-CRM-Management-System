import { z } from "zod"

const timeString = z
  .string()
  .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Time must be in HH:MM format (e.g. 09:00)")

const scheduleSlotSchema = z
  .object({
    day_of_week: z
      .number()
      .int()
      .min(0, "day_of_week must be between 0 (Sunday) and 6 (Saturday)")
      .max(6, "day_of_week must be between 0 (Sunday) and 6 (Saturday)"),
    is_off: z.boolean(),
    start_time: timeString.optional(),
    end_time: timeString.optional(),
  })
  .refine(
    (data) => {
      // If working day, both times are required
      if (!data.is_off) {
        return !!data.start_time && !!data.end_time
      }
      return true
    },
    { message: "start_time and end_time are required for working days" }
  )
  .refine(
    (data) => {
      // end_time must be after start_time
      if (!data.is_off && data.start_time && data.end_time) {
        return data.end_time > data.start_time
      }
      return true
    },
    { message: "end_time must be after start_time" }
  )

export const setAvailabilitySchema = z.object({
  schedule: z
    .array(scheduleSlotSchema)
    .min(1, "Schedule must have at least one day")
    .max(7, "Schedule cannot have more than 7 days")
    .refine(
      (slots) => {
        // No duplicate days
        const days = slots.map((s) => s.day_of_week)
        return new Set(days).size === days.length
      },
      { message: "Each day_of_week must appear only once" }
    ),
})

export const createTimeOffSchema = z
  .object({
    start_datetime: z.string().datetime("Invalid start_datetime format. Use ISO 8601."),
    end_datetime: z.string().datetime("Invalid end_datetime format. Use ISO 8601."),
    reason: z.string().optional(),
  })
  .refine(
    (data) => new Date(data.end_datetime) > new Date(data.start_datetime),
    { message: "end_datetime must be after start_datetime" }
  )

export type SetAvailabilitySchema = z.infer<typeof setAvailabilitySchema>
export type CreateTimeOffSchema = z.infer<typeof createTimeOffSchema>
