import { Router } from "express"
import { authenticate } from "../../middleware/auth.middleware"
import { authorize } from "../../middleware/role.middleware"
import { validate } from "../../middleware/validate.middleware"
import {
  cancelBookingController,
  createBookingController,
  createReviewController,
  listBookingsController,
} from "./customer.controller"
import {
  createCustomerBookingSchema,
  createCustomerReviewSchema,
} from "./customer.validation"

const router = Router()

router.use(authenticate)
router.use(authorize("customer"))

// POST /api/customer/bookings
router.post("/bookings", validate(createCustomerBookingSchema), createBookingController)

// GET /api/customer/bookings?scope=active|completed|cancelled|all
router.get("/bookings", listBookingsController)

// PATCH /api/customer/bookings/:bookingId/cancel
router.patch("/bookings/:bookingId/cancel", cancelBookingController)

// POST /api/customer/bookings/:bookingId/reviews
router.post(
  "/bookings/:bookingId/reviews",
  validate(createCustomerReviewSchema),
  createReviewController
)

export default router
