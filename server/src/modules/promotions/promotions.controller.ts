import { Request, Response } from "express"
import { asyncHandler } from "../../utils/async-handler"
import { ApiResponse } from "../../utils/api-response"
import { ApiError } from "../../utils/api-error"
import * as promotionsService from "./promotions.service"

export const getPublicPromotionsController = asyncHandler(
  async (req: Request, res: Response) => {
    const list = await promotionsService.listActivePromotions()
    res.status(200).json(
      new ApiResponse(200, list, "Active promotions fetched successfully")
    )
  }
)

export const getAdminPromotionsController = asyncHandler(
  async (req: Request, res: Response) => {
    const list = await promotionsService.listAllPromotions()
    res.status(200).json(
      new ApiResponse(200, list, "All promotions fetched successfully")
    )
  }
)

export const createPromotionController = asyncHandler(
  async (req: Request, res: Response) => {
    const { title, desktop_media_id, mobile_media_id, redirect_slug, sort_order } = req.body

    if (!title || !desktop_media_id || !mobile_media_id || !redirect_slug) {
      throw new ApiError(400, "Missing required parameters: title, desktop_media_id, mobile_media_id, redirect_slug")
    }

    const promotion = await promotionsService.createPromotion({
      title,
      desktop_media_id,
      mobile_media_id,
      redirect_slug,
      sort_order: sort_order ? Number(sort_order) : 0
    })

    res.status(201).json(
      new ApiResponse(201, promotion, "Promotional banner created successfully")
    )
  }
)

export const updatePromotionController = asyncHandler(
  async (req: Request, res: Response) => {
    const id = req.params.id as string
    const { title, desktop_media_id, mobile_media_id, redirect_slug, is_active, sort_order } = req.body

    const updatePayload: Partial<{
      title: string
      desktop_media_id: string
      mobile_media_id: string
      redirect_slug: string
      is_active: boolean
      sort_order: number
    }> = {}

    if (title !== undefined) updatePayload.title = title
    if (desktop_media_id !== undefined) updatePayload.desktop_media_id = desktop_media_id
    if (mobile_media_id !== undefined) updatePayload.mobile_media_id = mobile_media_id
    if (redirect_slug !== undefined) updatePayload.redirect_slug = redirect_slug
    if (is_active !== undefined) updatePayload.is_active = Boolean(is_active)
    if (sort_order !== undefined) updatePayload.sort_order = Number(sort_order)

    const promotion = await promotionsService.updatePromotion(id, updatePayload)

    if (!promotion) {
      throw new ApiError(404, "Promotional banner not found")
    }

    res.status(200).json(
      new ApiResponse(200, promotion, "Promotional banner updated successfully")
    )
  }
)

export const deletePromotionController = asyncHandler(
  async (req: Request, res: Response) => {
    const id = req.params.id as string
    const success = await promotionsService.deletePromotion(id)

    if (!success) {
      throw new ApiError(404, "Promotional banner not found")
    }

    res.status(200).json(
      new ApiResponse(200, { success }, "Promotional banner deleted successfully")
    )
  }
)
