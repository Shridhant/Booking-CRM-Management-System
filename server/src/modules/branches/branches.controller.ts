// branches controller
import { Request, Response } from "express"
import { asyncHandler } from "../../utils/async-handler"
import { ApiResponse } from "../../utils/api-response"
import {
    createBranch,
    listBranches,
    getBranchById,
    updateBranch,
    deleteBranch,
} from "./branches.service"

export const createBranchController = asyncHandler(
    async (req: Request, res: Response) => {
        const branch = await createBranch(
            req.params.businessId as string,
            req.user!.userId,
            req.user!.role,
            req.body
        )

        res.status(201).json(
            new ApiResponse(201, branch, "Branch created successfully")
        )
    }
)

export const listBranchesController = asyncHandler(
    async (req: Request, res: Response) => {
        const branches = await listBranches(req.params.businessId as string)

        res.status(200).json(
            new ApiResponse(200, branches, "Branches fetched successfully")
        )
    }
)

export const getBranchByIdController = asyncHandler(
    async (req: Request, res: Response) => {
        const branch = await getBranchById(
            req.params.businessId as string,
            req.params.branchId as string
        )

        res.status(200).json(
            new ApiResponse(200, branch, "Branch fetched successfully")
        )
    }
)

export const updateBranchController = asyncHandler(
    async (req: Request, res: Response) => {
        const branch = await updateBranch(
            req.params.businessId as string,
            req.params.branchId as string,
            req.user!.userId,
            req.user!.role,
            req.body
        )

        res.status(200).json(
            new ApiResponse(200, branch, "Branch updated successfully")
        )
    }
)

export const deleteBranchController = asyncHandler(
    async (req: Request, res: Response) => {
        await deleteBranch(
            req.params.businessId as string,
            req.params.branchId as string,
            req.user!.userId,
            req.user!.role
        )

        res.status(200).json(
            new ApiResponse(200, null, "Branch deleted successfully")
        )
    }
)