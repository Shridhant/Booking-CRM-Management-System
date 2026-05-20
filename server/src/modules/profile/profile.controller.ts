import { Request, Response } from "express"
import { asyncHandler } from "../../utils/async-handler"
import { ApiResponse } from "../../utils/api-response"
import { getMe, updateProfile } from "./profile.service"
import { UpdateProfileSchema } from "./profile.validation"

export const getMeController = asyncHandler(
    async (req: Request, res: Response) => {
        const user = await getMe(req.user!.userId)

        res.status(200).json(
            new ApiResponse(200, user, "User fetched successfully")
        )
    }
)

export const updateProfileController = asyncHandler(
    async (req: Request, res: Response) => {
        const input: UpdateProfileSchema = req.body

        const user = await updateProfile(req.user!.userId, input)

        res.status(200).json(
            new ApiResponse(200, user, "Profile updated successfully")
        )
    }
)