import { Request, Response } from "express"
import { ZodError } from "zod"
import { asyncHandler } from "../../utils/async-handler"
import { ApiError } from "../../utils/api-error"
import { ApiResponse } from "../../utils/api-response"
import {
  cancelCustomerBooking,
  createCustomerBooking,
  createCustomerReview,
  listCustomerBookings,
} from "./customer.service"
import { listCustomerBookingsQuerySchema } from "./customer.validation"

const formatZodError = (error: ZodError) => {
  return error.issues
    .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
    .join(", ")
}

export const createBookingController = asyncHandler(
  async (req: Request, res: Response) => {
    const booking = await createCustomerBooking(req.user!.userId, req.body)

    res.status(201).json(
      new ApiResponse(201, booking, "Booking created successfully")
    )
  }
)

export const listBookingsController = asyncHandler(
  async (req: Request, res: Response) => {
    const parsed = listCustomerBookingsQuerySchema.safeParse(req.query)
    if (!parsed.success) {
      throw new ApiError(400, formatZodError(parsed.error))
    }

    const bookings = await listCustomerBookings(req.user!.userId, parsed.data)

    res.status(200).json(
      new ApiResponse(200, bookings, "Bookings fetched successfully")
    )
  }
)

export const cancelBookingController = asyncHandler(
  async (req: Request, res: Response) => {
    const reason =
      typeof req.body?.reason === "string" && req.body.reason.trim().length > 0
        ? req.body.reason.trim()
        : undefined

    const booking = await cancelCustomerBooking(
      req.user!.userId,
      req.params.bookingId as string,
      reason
    )

    res.status(200).json(
      new ApiResponse(200, booking, "Booking cancelled successfully")
    )
  }
)

export const createReviewController = asyncHandler(
  async (req: Request, res: Response) => {
    const review = await createCustomerReview(
      req.user!.userId,
      req.params.bookingId as string,
      req.body
    )

    res.status(201).json(
      new ApiResponse(201, review, "Review created successfully")
    )
  }
)
