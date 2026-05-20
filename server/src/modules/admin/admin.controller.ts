// admin controller
import { Request, Response } from "express"
import { asyncHandler } from "../../utils/async-handler"
import { ApiResponse } from "../../utils/api-response"
import {
    onboardBusiness,
    listAllBusinesses,
    getAnyBusiness,
    updateAnyBusiness,
    toggleBusinessVerification,
    listAllUsers,
    deactivateUser,
    reactivateUser,
} from "./admin.service"

export const onboardBusinessController = asyncHandler(
    async (req: Request, res: Response) => {
        const result = await onboardBusiness(req.body)

        res.status(201).json(
            new ApiResponse(201, result, result.message)
        )
    }
)

export const listAllBusinessesController = asyncHandler(
    async (req: Request, res: Response) => {
        const businesses = await listAllBusinesses()

        res.status(200).json(
            new ApiResponse(200, businesses, "Businesses fetched successfully")
        )
    }
)

export const getAnyBusinessController = asyncHandler(
    async (req: Request, res: Response) => {
        const business = await getAnyBusiness(req.params.businessId as string)

        res.status(200).json(
            new ApiResponse(200, business, "Business fetched successfully")
        )
    }
)

export const updateAnyBusinessController = asyncHandler(
    async (req: Request, res: Response) => {
        const business = await updateAnyBusiness(req.params.businessId as string, req.body)

        res.status(200).json(
            new ApiResponse(200, business, "Business updated successfully")
        )
    }
)

export const toggleVerificationController = asyncHandler(
    async (req: Request, res: Response) => {
        const result = await toggleBusinessVerification(req.params.businessId as string)

        const msg = result.is_verified
            ? `${result.name} has been verified`
            : `${result.name} verification has been removed`

        res.status(200).json(
            new ApiResponse(200, result, msg)
        )
    }
)

export const listAllUsersController = asyncHandler(
    async (req: Request, res: Response) => {
        const users = await listAllUsers()

        res.status(200).json(
            new ApiResponse(200, users, "Users fetched successfully")
        )
    }
)

export const deactivateUserController = asyncHandler(
    async (req: Request, res: Response) => {
        const user = await deactivateUser(req.params.userId as string)

        res.status(200).json(
            new ApiResponse(200, user, "User deactivated successfully")
        )
    }
)

export const reactivateUserController = asyncHandler(
    async (req: Request, res: Response) => {
        const user = await reactivateUser(req.params.userId as string)

        res.status(200).json(
            new ApiResponse(200, user, "User reactivated successfully")
        )
    }
)