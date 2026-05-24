import { Request, Response } from "express"
import { ZodError } from "zod"
import { asyncHandler } from "../../utils/async-handler"
import { ApiError } from "../../utils/api-error"
import { ApiResponse } from "../../utils/api-response"
import {
  getPublicBusiness,
  getPublicSlots,
  listPublicBranches,
  listPublicReviews,
  listPublicServices,
  searchPublicBusinesses,
} from "./public.service"
import {
  publicBusinessSearchQuerySchema,
  publicReviewsQuerySchema,
  publicSlotsQuerySchema,
} from "./public.validation"

const formatZodError = (error: ZodError) => {
  return error.issues
    .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
    .join(", ")
}

export const searchBusinessesController = asyncHandler(
  async (req: Request, res: Response) => {
    const parsed = publicBusinessSearchQuerySchema.safeParse(req.query)
    if (!parsed.success) {
      throw new ApiError(400, formatZodError(parsed.error))
    }

    const result = await searchPublicBusinesses(parsed.data)

    res.status(200).json(
      new ApiResponse(200, result, "Businesses fetched successfully")
    )
  }
)

export const getBusinessController = asyncHandler(
  async (req: Request, res: Response) => {
    const business = await getPublicBusiness(req.params.businessIdOrSlug as string)

    res.status(200).json(
      new ApiResponse(200, business, "Business fetched successfully")
    )
  }
)

export const listBranchesController = asyncHandler(
  async (req: Request, res: Response) => {
    const branches = await listPublicBranches(req.params.businessIdOrSlug as string)

    res.status(200).json(
      new ApiResponse(200, branches, "Branches fetched successfully")
    )
  }
)

export const listServicesController = asyncHandler(
  async (req: Request, res: Response) => {
    const services = await listPublicServices(req.params.businessIdOrSlug as string)

    res.status(200).json(
      new ApiResponse(200, services, "Services fetched successfully")
    )
  }
)

export const getSlotsController = asyncHandler(
  async (req: Request, res: Response) => {
    const parsed = publicSlotsQuerySchema.safeParse(req.query)
    if (!parsed.success) {
      throw new ApiError(400, formatZodError(parsed.error))
    }

    const slots = await getPublicSlots(
      req.params.businessIdOrSlug as string,
      parsed.data
    )

    res.status(200).json(
      new ApiResponse(200, slots, "Available slots fetched successfully")
    )
  }
)

export const listReviewsController = asyncHandler(
  async (req: Request, res: Response) => {
    const parsed = publicReviewsQuerySchema.safeParse(req.query)
    if (!parsed.success) {
      throw new ApiError(400, formatZodError(parsed.error))
    }

    const reviews = await listPublicReviews(
      req.params.businessIdOrSlug as string,
      parsed.data
    )

    res.status(200).json(
      new ApiResponse(200, reviews, "Reviews fetched successfully")
    )
  }
)
