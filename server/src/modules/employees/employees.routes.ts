import { Router } from "express"
import {
    createEmployeeController,
    listEmployeesController,
    getEmployeeByIdController,
    updateEmployeeController,
    assignBranchesController,
    removeBranchAssignmentController,
    deactivateEmployeeController,
} from "./employees.controller"
import { authenticate } from "../../middleware/auth.middleware"
import { authorize } from "../../middleware/role.middleware"
import { validate } from "../../middleware/validate.middleware"
import {
    createEmployeeSchema,
    updateEmployeeSchema,
    assignBranchesSchema,
} from "./employees.validation"

const router = Router({ mergeParams: true })

router.use(authenticate)
router.use(authorize("business_admin", "super_admin"))

// POST   /api/businesses/:businessId/employees
router.post("/", validate(createEmployeeSchema), createEmployeeController)

// GET    /api/businesses/:businessId/employees
// GET    /api/businesses/:businessId/employees?branchId=xxx
router.get("/", listEmployeesController)

// GET    /api/businesses/:businessId/employees/:employeeId
router.get("/:employeeId", getEmployeeByIdController)

// PATCH  /api/businesses/:businessId/employees/:employeeId
router.patch("/:employeeId", validate(updateEmployeeSchema), updateEmployeeController)

// POST   /api/businesses/:businessId/employees/:employeeId/branches
router.post(
    "/:employeeId/branches",
    validate(assignBranchesSchema),
    assignBranchesController
)

// DELETE /api/businesses/:businessId/employees/:employeeId/branches/:branchId
router.delete(
    "/:employeeId/branches/:branchId",
    removeBranchAssignmentController
)

// DELETE /api/businesses/:businessId/employees/:employeeId
router.delete("/:employeeId", deactivateEmployeeController)

export default router