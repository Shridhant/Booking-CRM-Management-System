import { Router } from "express"
import {
  setAvailabilityController,
  getAvailabilityController,
  createTimeOffController,
  listTimeOffController,
  deleteTimeOffController,
} from "./availability.controller"
import { authenticate } from "../../middleware/auth.middleware"
import { authorize } from "../../middleware/role.middleware"
import { validate } from "../../middleware/validate.middleware"
import {
  setAvailabilitySchema,
  createTimeOffSchema,
} from "./availability.validation"

const router = Router({ mergeParams: true })

router.use(authenticate)
router.use(authorize("business_admin", "super_admin"))

// POST   /api/businesses/:businessId/employees/:employeeId/availability
// Replaces the full weekly schedule
router.post(
  "/",
  validate(setAvailabilitySchema),
  setAvailabilityController
)

// GET    /api/businesses/:businessId/employees/:employeeId/availability
router.get("/", getAvailabilityController)

// POST   /api/businesses/:businessId/employees/:employeeId/time-off
router.post(
  "/time-off",
  validate(createTimeOffSchema),
  createTimeOffController
)

// GET    /api/businesses/:businessId/employees/:employeeId/time-off
router.get("/time-off", listTimeOffController)

// DELETE /api/businesses/:businessId/employees/:employeeId/time-off/:timeOffId
router.delete("/time-off/:timeOffId", deleteTimeOffController)

export default router
