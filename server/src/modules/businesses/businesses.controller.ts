import { Request, Response } from "express"
import { asyncHandler } from "../../utils/async-handler"
import { ApiResponse } from "../../utils/api-response"
import { ApiError } from "../../utils/api-error"
import {
    getBusinessById,
    getBusinessByOwnerId,
    updateBusiness,
    getBusinessSettings,
    updateBusinessSettings,
} from "./businesses.service"
import {
    UpdateBusinessSchema,
} from "./businesses.validation"

// GET /api/businesses/my
// Returns the single business owned by the logged in business_admin
export const getMyBusinessController = asyncHandler(
    async (req: Request, res: Response) => {
        const business = await getBusinessByOwnerId(req.user!.userId)

        res.status(200).json(
            new ApiResponse(200, business, "Business fetched successfully")
        )
    }
)

// GET /api/businesses/:businessId
export const getBusinessByIdController = asyncHandler(
    async (req: Request, res: Response) => {
        const business = await getBusinessById(req.params.businessId as string)

        res.status(200).json(
            new ApiResponse(200, business, "Business fetched successfully")
        )
    }
)

// PATCH /api/businesses/:businessId
export const updateBusinessController = asyncHandler(
    async (req: Request, res: Response) => {
        const input: UpdateBusinessSchema = req.body

        const business = await updateBusiness(
            req.params.businessId as string,
            req.user!.userId,
            req.user!.role,
            input
        )

        res.status(200).json(
            new ApiResponse(200, business, "Business updated successfully")
        )
    }
)

// GET /api/businesses/:businessId/settings
export const getBusinessSettingsController = asyncHandler(
    async (req: Request, res: Response) => {
        const settings = await getBusinessSettings(req.params.businessId as string)

        res.status(200).json(
            new ApiResponse(200, settings, "Settings fetched successfully")
        )
    }
)

// PATCH /api/businesses/:businessId/settings
export const updateBusinessSettingsController = asyncHandler(
    async (req: Request, res: Response) => {
        const settings = await updateBusinessSettings(
            req.params.businessId as string,
            req.user!.userId,
            req.user!.role,
            req.body
        )

        res.status(200).json(
            new ApiResponse(200, settings, "Settings updated successfully")
        )
    }
)