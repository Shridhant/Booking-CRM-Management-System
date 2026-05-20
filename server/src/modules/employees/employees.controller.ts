import { Request, Response } from "express"
import { asyncHandler } from "../../utils/async-handler"
import { ApiResponse } from "../../utils/api-response"
import {
    createEmployee,
    listEmployees,
    getEmployeeById,
    updateEmployee,
    assignBranches,
    removeBranchAssignment,
    deactivateEmployee,
} from "./employees.service"

export const createEmployeeController = asyncHandler(
    async (req: Request, res: Response) => {
        const employee = await createEmployee(
            req.params.businessId as string,
            req.user!.userId,
            req.user!.role,
            req.body
        )

        res.status(201).json(
            new ApiResponse(201, employee, "Employee created successfully")
        )
    }
)

export const listEmployeesController = asyncHandler(
    async (req: Request, res: Response) => {
        const branchId = req.query.branchId as string | undefined

        const employees = await listEmployees(req.params.businessId as string, branchId)

        res.status(200).json(
            new ApiResponse(200, employees, "Employees fetched successfully")
        )
    }
)

export const getEmployeeByIdController = asyncHandler(
    async (req: Request, res: Response) => {
        const employee = await getEmployeeById(
            req.params.businessId as string,
            req.params.employeeId as string
        )

        res.status(200).json(
            new ApiResponse(200, employee, "Employee fetched successfully")
        )
    }
)

export const updateEmployeeController = asyncHandler(
    async (req: Request, res: Response) => {
        const employee = await updateEmployee(
            req.params.businessId as string,
            req.params.employeeId as string,
            req.user!.userId as string,
            req.user!.role as string,
            req.body
        )

        res.status(200).json(
            new ApiResponse(200, employee, "Employee updated successfully")
        )
    }
)

export const assignBranchesController = asyncHandler(
    async (req: Request, res: Response) => {
        const employee = await assignBranches(
            req.params.businessId as string,
            req.params.employeeId as string,
            req.user!.userId as string,
            req.user!.role as string,
            req.body
        )

        res.status(200).json(
            new ApiResponse(200, employee, "Branches assigned successfully")
        )
    }
)

export const removeBranchAssignmentController = asyncHandler(
    async (req: Request, res: Response) => {
        const employee = await removeBranchAssignment(
            req.params.businessId as string,
            req.params.employeeId as string,
            req.params.branchId as string,
            req.user!.userId as string,
            req.user!.role as string
        )

        res.status(200).json(
            new ApiResponse(200, employee, "Branch assignment removed successfully")
        )
    }
)

export const deactivateEmployeeController = asyncHandler(
    async (req: Request, res: Response) => {
        await deactivateEmployee(
            req.params.businessId as string,
            req.params.employeeId as string,
            req.user!.userId as string,
            req.user!.role as string
        )

        res.status(200).json(
            new ApiResponse(200, null, "Employee deactivated successfully")
        )
    }
)