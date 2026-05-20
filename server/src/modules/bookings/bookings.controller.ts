import { Request, Response } from "express"
import { asyncHandler } from "../../utils/async-handler"
import { ApiResponse } from "../../utils/api-response"
import { ApiError } from "../../utils/api-error"
import {
  getAvailableSlots,
  createBooking,
  listBookings,
  getBookingById,
  updateBookingStatus,
  assignEmployee,
} from "./bookings.service"
import { GetSlotsSchema } from "./bookings.validation"

export const getSlotsController = asyncHandler(
  async (req: Request, res: Response) => {
    const query = req.query as any

    // service_ids comes as comma-separated string in query
    const serviceIds = (query.service_ids as string)
      .split(",")
      .map((id: string) => id.trim())
      .filter(Boolean)

    if (serviceIds.length === 0) {
      throw new ApiError(400, "At least one service_id is required")
    }

    const slots = await getAvailableSlots(req.params.businessId! as string, {
      date: query.date,
      branch_id: query.branch_id,
      service_ids: serviceIds,
      employee_id: query.employee_id,
    })

    res.status(200).json(
      new ApiResponse(200, slots, "Available slots fetched successfully")
    )
  }
)

export const createBookingController = asyncHandler(
  async (req: Request, res: Response) => {
    const booking = await createBooking(
      req.params.businessId! as string,
      req.user!.userId,
      req.user!.role,
      req.body
    )

    res.status(201).json(
      new ApiResponse(201, booking, "Booking created successfully")
    )
  }
)

export const listBookingsController = asyncHandler(
  async (req: Request, res: Response) => {
    const query = req.query as any

    const bookings = await listBookings(req.params.businessId! as string, {
      date: query.date,
      branch_id: query.branch_id,
      employee_id: query.employee_id,
      booking_status: query.booking_status,
      from_date: query.from_date,
      to_date: query.to_date,
    })

    res.status(200).json(
      new ApiResponse(200, bookings, "Bookings fetched successfully")
    )
  }
)

export const getBookingByIdController = asyncHandler(
  async (req: Request, res: Response) => {
    const booking = await getBookingById(
      req.params.businessId! as string,
      req.params.bookingId! as string
    )

    res.status(200).json(
      new ApiResponse(200, booking, "Booking fetched successfully")
    )
  }
)

export const updateBookingStatusController = asyncHandler(
  async (req: Request, res: Response) => {
    const booking = await updateBookingStatus(
      req.params.businessId! as string,
      req.params.bookingId! as string,
      req.user!.userId,
      req.user!.role,
      req.body.booking_status
    )

    res.status(200).json(
      new ApiResponse(200, booking, "Booking status updated successfully")
    )
  }
)

export const assignEmployeeController = asyncHandler(
  async (req: Request, res: Response) => {
    const booking = await assignEmployee(
      req.params.businessId! as string,
      req.params.bookingId! as string,
      req.user!.userId,
      req.user!.role,
      req.body.employee_id
    )

    res.status(200).json(
      new ApiResponse(200, booking, "Employee assigned successfully")
    )
  }
)
