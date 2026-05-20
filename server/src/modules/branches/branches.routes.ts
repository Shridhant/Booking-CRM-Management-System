// branches routes
import { Router } from "express"
import {
    createBranchController,
    listBranchesController,
    getBranchByIdController,
    updateBranchController,
    deleteBranchController,
} from "./branches.controller"
import { authenticate } from "../../middleware/auth.middleware"
import { authorize } from "../../middleware/role.middleware"
import { validate } from "../../middleware/validate.middleware"
import { createBranchSchema, updateBranchSchema } from "./branches.validation"

const router = Router({ mergeParams: true })
// mergeParams: true is required so :businessId from the
// parent route in app.ts is accessible inside this router

router.use(authenticate)
router.use(authorize("business_admin", "super_admin"))

// POST   /api/businesses/:businessId/branches
router.post("/", validate(createBranchSchema), createBranchController)

// GET    /api/businesses/:businessId/branches
router.get("/", listBranchesController)

// GET    /api/businesses/:businessId/branches/:branchId
router.get("/:branchId", getBranchByIdController)

// PATCH  /api/businesses/:businessId/branches/:branchId
router.patch("/:branchId", validate(updateBranchSchema), updateBranchController)

// DELETE /api/businesses/:businessId/branches/:branchId
router.delete("/:branchId", deleteBranchController)

export default router