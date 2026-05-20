import { Router } from "express"
import {
  createCustomerController,
  listCustomersController,
  getCustomerByIdController,
  updateCustomerController,
  getCustomerBookingsController,
} from "./customers.controller"
import { authenticate } from "../../middleware/auth.middleware"
import { authorize } from "../../middleware/role.middleware"
import { validate } from "../../middleware/validate.middleware"
import { createCustomerSchema, updateCustomerSchema } from "./customers.validation"

const router = Router({ mergeParams: true })

router.use(authenticate)
router.use(authorize("business_admin", "super_admin"))

// POST   /api/businesses/:businessId/customers
router.post("/", validate(createCustomerSchema), createCustomerController)

// GET    /api/businesses/:businessId/customers
// GET    /api/businesses/:businessId/customers?search=riya
router.get("/", listCustomersController)

// GET    /api/businesses/:businessId/customers/:customerId
router.get("/:customerId", getCustomerByIdController)

// PATCH  /api/businesses/:businessId/customers/:customerId
router.patch("/:customerId", validate(updateCustomerSchema), updateCustomerController)

// GET    /api/businesses/:businessId/customers/:customerId/bookings
router.get("/:customerId/bookings", getCustomerBookingsController)

export default router
