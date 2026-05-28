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
    getBusinessGallery,
    addMediaToGallery,
    removeMediaFromGallery,
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

// GET /api/businesses/:businessId/gallery
export const getBusinessGalleryController = asyncHandler(
    async (req: Request, res: Response) => {
        const gallery = await getBusinessGallery(req.params.businessId as string)

        res.status(200).json(
            new ApiResponse(200, gallery, "Gallery fetched successfully")
        )
    }
)

// POST /api/businesses/:businessId/gallery
export const addMediaToGalleryController = asyncHandler(
    async (req: Request, res: Response) => {
        const { media_id, sort_order } = req.body
        if (!media_id) {
            throw new ApiError(400, "media_id is required")
        }

        const item = await addMediaToGallery(
            req.params.businessId as string,
            media_id,
            sort_order ?? 0
        )

        res.status(201).json(
            new ApiResponse(201, item, "Media added to gallery successfully")
        )
    }
)

// DELETE /api/businesses/:businessId/gallery/:galleryId
export const removeMediaFromGalleryController = asyncHandler(
    async (req: Request, res: Response) => {
        await removeMediaFromGallery(
            req.params.businessId as string,
            req.params.galleryId as string
        )

        res.status(200).json(
            new ApiResponse(200, null, "Media removed from gallery successfully")
        )
    }
)