import { Router } from "express"
import {
  createCategoryController,
  listCategoriesController,
  updateCategoryController,
  reorderCategoriesController,
  deleteCategoryController,
  createServiceController,
  listServicesController,
  getServiceByIdController,
  updateServiceController,
  assignEmployeesToServiceController,
  removeEmployeeFromServiceController,
  deleteServiceController,
} from "./services.controller"
import { authenticate } from "../../middleware/auth.middleware"
import { authorize } from "../../middleware/role.middleware"
import { validate } from "../../middleware/validate.middleware"
import {
  createCategorySchema,
  updateCategorySchema,
  reorderCategoriesSchema,
  createServiceSchema,
  updateServiceSchema,
  assignEmployeesToServiceSchema,
} from "./services.validation"

const router = Router({ mergeParams: true })

router.use(authenticate)
router.use(authorize("business_admin", "super_admin"))

// ── Categories ────────────────────────────────

// POST   /api/businesses/:businessId/services/categories
router.post("/categories", validate(createCategorySchema), createCategoryController)

// GET    /api/businesses/:businessId/services/categories
// GET    /api/businesses/:businessId/services/categories?withServices=true
router.get("/categories", listCategoriesController)

// PATCH  /api/businesses/:businessId/services/categories/reorder
router.patch("/categories/reorder", validate(reorderCategoriesSchema), reorderCategoriesController)

// PATCH  /api/businesses/:businessId/services/categories/:categoryId
router.patch("/categories/:categoryId", validate(updateCategorySchema), updateCategoryController)

// DELETE /api/businesses/:businessId/services/categories/:categoryId
router.delete("/categories/:categoryId", deleteCategoryController)

// ── Services ──────────────────────────────────

// POST   /api/businesses/:businessId/services
router.post("/", validate(createServiceSchema), createServiceController)

// GET    /api/businesses/:businessId/services
// GET    /api/businesses/:businessId/services?categoryId=xxx
// GET    /api/businesses/:businessId/services?includeInactive=true
router.get("/", listServicesController)

// GET    /api/businesses/:businessId/services/:serviceId
router.get("/:serviceId", getServiceByIdController)

// PATCH  /api/businesses/:businessId/services/:serviceId
router.patch("/:serviceId", validate(updateServiceSchema), updateServiceController)

// POST   /api/businesses/:businessId/services/:serviceId/employees
// Replaces all employee assignments for the service
router.post(
  "/:serviceId/employees",
  validate(assignEmployeesToServiceSchema),
  assignEmployeesToServiceController
)

// DELETE /api/businesses/:businessId/services/:serviceId/employees/:employeeId
router.delete("/:serviceId/employees/:employeeId", removeEmployeeFromServiceController)

// DELETE /api/businesses/:businessId/services/:serviceId
router.delete("/:serviceId", deleteServiceController)

export default router
