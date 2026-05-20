// admin routes
import { Router } from "express"
import {
    onboardBusinessController,
    listAllBusinessesController,
    getAnyBusinessController,
    updateAnyBusinessController,
    toggleVerificationController,
    listAllUsersController,
    deactivateUserController,
    reactivateUserController,
} from "./admin.controller"
import { authenticate } from "../../middleware/auth.middleware"
import { authorize } from "../../middleware/role.middleware"
import { validate } from "../../middleware/validate.middleware"
import {
    onboardBusinessSchema,
    updateAnyBusinessSchema,
} from "./admin.validation"

const router = Router()

// Every admin route requires authentication + super_admin role
router.use(authenticate)
router.use(authorize("super_admin"))

// ── Onboarding ────────────────────────────────
// POST /api/admin/onboard
// Creates business_admin user + business in one transaction
router.post("/onboard", validate(onboardBusinessSchema), onboardBusinessController)

// ── Businesses ────────────────────────────────
// GET /api/admin/businesses
router.get("/businesses", listAllBusinessesController)

// GET /api/admin/businesses/:businessId
router.get("/businesses/:businessId", getAnyBusinessController)

// PATCH /api/admin/businesses/:businessId
router.patch(
    "/businesses/:businessId",
    validate(updateAnyBusinessSchema),
    updateAnyBusinessController
)

// PATCH /api/admin/businesses/:businessId/verify
router.patch("/businesses/:businessId/verify", toggleVerificationController)

// ── Users ─────────────────────────────────────
// GET /api/admin/users
router.get("/users", listAllUsersController)

// PATCH /api/admin/users/:userId/deactivate
router.patch("/users/:userId/deactivate", deactivateUserController)

// PATCH /api/admin/users/:userId/reactivate
router.patch("/users/:userId/reactivate", reactivateUserController)

export default router