import { Request, Response } from "express"
import { asyncHandler } from "../../utils/async-handler"
import { ApiResponse } from "../../utils/api-response"
import {
  createCustomer,
  listCustomers,
  getCustomerById,
  updateCustomer,
  getCustomerBookings,
} from "./customers.service"

export const createCustomerController = asyncHandler(
  async (req: Request, res: Response) => {
    const customer = await createCustomer(req.params.businessId as string, req.body)
    res.status(201).json(
      new ApiResponse(201, customer, "Customer created successfully")
    )
  }
)

export const listCustomersController = asyncHandler(
  async (req: Request, res: Response) => {
    const search = req.query.search as string | undefined
    const customers = await listCustomers(req.params.businessId as string, search)
    res.status(200).json(
      new ApiResponse(200, customers, "Customers fetched successfully")
    )
  }
)

export const getCustomerByIdController = asyncHandler(
  async (req: Request, res: Response) => {
    const customer = await getCustomerById(
      req.params.businessId as string,
      req.params.customerId as string
    )
    res.status(200).json(
      new ApiResponse(200, customer, "Customer fetched successfully")
    )
  }
)

export const updateCustomerController = asyncHandler(
  async (req: Request, res: Response) => {
    const customer = await updateCustomer(
      req.params.businessId as string,
      req.params.customerId as string,
      req.body
    )
    res.status(200).json(
      new ApiResponse(200, customer, "Customer updated successfully")
    )
  }
)

export const getCustomerBookingsController = asyncHandler(
  async (req: Request, res: Response) => {
    const bookings = await getCustomerBookings(
      req.params.businessId as string,
      req.params.customerId as string
    )
    res.status(200).json(
      new ApiResponse(200, bookings, "Customer bookings fetched successfully")
    )
  }
)
