import { Request, Response } from "express"
import { asyncHandler } from "../../utils/async-handler"
import { ApiResponse } from "../../utils/api-response"
import { ApiError } from "../../utils/api-error"
import { createMedia } from "./media.service"

export const uploadSingleMediaController = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.file) {
      throw new ApiError(400, "No file provided for upload")
    }

    const userId = req.user?.userId || null
    const folder = req.body.folder || "booking_platform"

    const mediaRecord = await createMedia(
      req.file.buffer,
      req.file.mimetype,
      req.file.size,
      userId,
      folder
    )

    res.status(201).json(
      new ApiResponse(201, mediaRecord, "Image uploaded successfully")
    )
  }
)
