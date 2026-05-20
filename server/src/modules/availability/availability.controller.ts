import { Request, Response } from "express"
import { asyncHandler } from "../../utils/async-handler"
import { ApiResponse } from "../../utils/api-response"
import {
  setAvailability,
  getAvailability,
  createTimeOff,
  listTimeOff,
  deleteTimeOff,
} from "./availability.service"

export const setAvailabilityController = asyncHandler(
  async (req: Request, res: Response) => {
    const schedule = await setAvailability(
      req.params.businessId as string,
      req.params.employeeId as string,
      req.user!.userId as string,
      req.user!.role as string,
      req.body
    )

    res.status(200).json(
      new ApiResponse(200, schedule, "Availability updated successfully")
    )
  }
)

export const getAvailabilityController = asyncHandler(
  async (req: Request, res: Response) => {
    const schedule = await getAvailability(
      req.params.businessId as string,
      req.params.employeeId as string
    )

    res.status(200).json(
      new ApiResponse(200, schedule, "Availability fetched successfully")
    )
  }
)

export const createTimeOffController = asyncHandler(
  async (req: Request, res: Response) => {
    const timeOff = await createTimeOff(
      req.params.businessId as string,
      req.params.employeeId as string,
      req.user!.userId as string,
      req.user!.role as string,
      req.body
    )

    res.status(201).json(
      new ApiResponse(201, timeOff, "Time off added successfully")
    )
  }
)

export const listTimeOffController = asyncHandler(
  async (req: Request, res: Response) => {
    const timeOff = await listTimeOff(
      req.params.businessId as string,
      req.params.employeeId as string
    )

    res.status(200).json(
      new ApiResponse(200, timeOff, "Time off fetched successfully")
    )
  }
)

export const deleteTimeOffController = asyncHandler(
  async (req: Request, res: Response) => {
    await deleteTimeOff(
      req.params.businessId as string,
      req.params.employeeId as string,
      req.params.timeOffId as string,
      req.user!.userId as string,
      req.user!.role as string
    )

    res.status(200).json(
      new ApiResponse(200, null, "Time off removed successfully")
    )
  }
)
