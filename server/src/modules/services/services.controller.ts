import { Request, Response } from "express"
import { asyncHandler } from "../../utils/async-handler"
import { ApiResponse } from "../../utils/api-response"
import {
  createCategory,
  listCategories,
  listCategoriesWithServices,
  updateCategory,
  reorderCategories,
  deleteCategory,
  createService,
  listServices,
  getServiceById,
  updateService,
  assignEmployeesToService,
  removeEmployeeFromService,
  deleteService,
} from "./services.service"

// ── Categories ────────────────────────────────

export const createCategoryController = asyncHandler(
  async (req: Request, res: Response) => {
    const category = await createCategory(
      req.params.businessId as string,
      req.user!.userId,
      req.user!.role,
      req.body
    )
    res.status(201).json(
      new ApiResponse(201, category, "Category created successfully")
    )
  }
)

export const listCategoriesController = asyncHandler(
  async (req: Request, res: Response) => {
    const withServices = req.query.withServices === "true"

    const categories = withServices
      ? await listCategoriesWithServices(req.params.businessId as string)
      : await listCategories(req.params.businessId as string)

    res.status(200).json(
      new ApiResponse(200, categories, "Categories fetched successfully")
    )
  }
)

export const updateCategoryController = asyncHandler(
  async (req: Request, res: Response) => {
    const category = await updateCategory(
      req.params.businessId as string,
      req.params.categoryId as string,
      req.user!.userId,
      req.user!.role,
      req.body
    )
    res.status(200).json(
      new ApiResponse(200, category, "Category updated successfully")
    )
  }
)

export const reorderCategoriesController = asyncHandler(
  async (req: Request, res: Response) => {
    const categories = await reorderCategories(
      req.params.businessId as string,
      req.user!.userId,
      req.user!.role,
      req.body
    )
    res.status(200).json(
      new ApiResponse(200, categories, "Categories reordered successfully")
    )
  }
)

export const deleteCategoryController = asyncHandler(
  async (req: Request, res: Response) => {
    await deleteCategory(
      req.params.businessId as string,
      req.params.categoryId as string,
      req.user!.userId,
      req.user!.role
    )
    res.status(200).json(
      new ApiResponse(200, null, "Category deleted successfully")
    )
  }
)

// ── Services ──────────────────────────────────

export const createServiceController = asyncHandler(
  async (req: Request, res: Response) => {
    const service = await createService(
      req.params.businessId as string,
      req.user!.userId,
      req.user!.role,
      req.body
    )
    res.status(201).json(
      new ApiResponse(201, service, "Service created successfully")
    )
  }
)

export const listServicesController = asyncHandler(
  async (req: Request, res: Response) => {
    const categoryId = req.query.categoryId as string | undefined
    const includeInactive = req.query.includeInactive === "true"

    const services = await listServices(
      req.params.businessId as string,
      categoryId,
      includeInactive
    )
    res.status(200).json(
      new ApiResponse(200, services, "Services fetched successfully")
    )
  }
)

export const getServiceByIdController = asyncHandler(
  async (req: Request, res: Response) => {
    const service = await getServiceById(
      req.params.businessId as string,
      req.params.serviceId as string
    )
    res.status(200).json(
      new ApiResponse(200, service, "Service fetched successfully")
    )
  }
)

export const updateServiceController = asyncHandler(
  async (req: Request, res: Response) => {
    const service = await updateService(
      req.params.businessId as string,
      req.params.serviceId as string,
      req.user!.userId,
      req.user!.role,
      req.body
    )
    res.status(200).json(
      new ApiResponse(200, service, "Service updated successfully")
    )
  }
)

export const assignEmployeesToServiceController = asyncHandler(
  async (req: Request, res: Response) => {
    const service = await assignEmployeesToService(
      req.params.businessId as string,
      req.params.serviceId as string,
      req.user!.userId,
      req.user!.role,
      req.body
    )
    res.status(200).json(
      new ApiResponse(200, service, "Employees assigned to service successfully")
    )
  }
)

export const removeEmployeeFromServiceController = asyncHandler(
  async (req: Request, res: Response) => {
    const service = await removeEmployeeFromService(
      req.params.businessId as string,
      req.params.serviceId as string,
      req.params.employeeId as string,
      req.user!.userId,
      req.user!.role
    )
    res.status(200).json(
      new ApiResponse(200, service, "Employee removed from service successfully")
    )
  }
)

export const deleteServiceController = asyncHandler(
  async (req: Request, res: Response) => {
    await deleteService(
      req.params.businessId as string,
      req.params.serviceId as string,
      req.user!.userId,
      req.user!.role
    )
    res.status(200).json(
      new ApiResponse(200, null, "Service deleted successfully")
    )
  }
)
