import { Router } from "express"
import {
    getMyBusinessController,
    getBusinessByIdController,
    updateBusinessController,
    getBusinessSettingsController,
    updateBusinessSettingsController,
} from "./businesses.controller"
import { authenticate } from "../../middleware/auth.middleware"
import { authorize } from "../../middleware/role.middleware"
import { validate } from "../../middleware/validate.middleware"
import {
    updateBusinessSchema,
    updateBusinessSettingsSchema,
} from "./businesses.validation"

const router = Router()

router.use(authenticate)

// GET /api/businesses/my
// business_admin sees only their own business
router.get(
    "/my",
    authorize("business_admin", "super_admin"),
    getMyBusinessController
)

// GET /api/businesses/:businessId
router.get("/:businessId", getBusinessByIdController)

// PATCH /api/businesses/:businessId
router.patch(
    "/:businessId",
    authorize("business_admin", "super_admin"),
    validate(updateBusinessSchema),
    updateBusinessController
)

// GET /api/businesses/:businessId/settings
router.get(
    "/:businessId/settings",
    authorize("business_admin", "super_admin"),
    getBusinessSettingsController
)

// PATCH /api/businesses/:businessId/settings
router.patch(
    "/:businessId/settings",
    authorize("business_admin", "super_admin"),
    validate(updateBusinessSettingsSchema),
    updateBusinessSettingsController
)

export default router