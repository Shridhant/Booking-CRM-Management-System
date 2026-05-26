import { Router } from "express"
import {
  getSlotsController,
  createBookingController,
  listBookingsController,
  getBookingByIdController,
  updateBookingStatusController,
  assignEmployeeController,
  checkoutBookingController,
} from "./bookings.controller"
import { authenticate } from "../../middleware/auth.middleware"
import { authorize } from "../../middleware/role.middleware"
import { validate } from "../../middleware/validate.middleware"
import {
  createBookingSchema,
  updateBookingStatusSchema,
  assignEmployeeSchema,
  checkoutBookingSchema,
} from "./bookings.validation"

const router = Router({ mergeParams: true })

router.use(authenticate)
router.use(authorize("business_admin", "super_admin"))

// GET  /api/businesses/:businessId/bookings/slots
//      ?date=2026-06-07
//      &branch_id=xxx
//      &service_ids=id1,id2
//      &employee_id=xxx  (optional)
router.get("/slots", getSlotsController)

// POST /api/businesses/:businessId/bookings
router.post("/", validate(createBookingSchema), createBookingController)

// GET  /api/businesses/:businessId/bookings
//      ?date=2026-06-07
//      ?from_date=2026-06-01&to_date=2026-06-30
//      ?branch_id=xxx
//      ?employee_id=xxx
//      ?booking_status=confirmed
router.get("/", listBookingsController)

// GET  /api/businesses/:businessId/bookings/:bookingId
router.get("/:bookingId", getBookingByIdController)

// PATCH /api/businesses/:businessId/bookings/:bookingId/status
router.patch(
  "/:bookingId/status",
  validate(updateBookingStatusSchema),
  updateBookingStatusController
)

// PATCH /api/businesses/:businessId/bookings/:bookingId/assign
router.patch(
  "/:bookingId/assign",
  validate(assignEmployeeSchema),
  assignEmployeeController
)

// POST /api/businesses/:businessId/bookings/:bookingId/checkout
router.post(
  "/:bookingId/checkout",
  validate(checkoutBookingSchema),
  checkoutBookingController
)

export default router
