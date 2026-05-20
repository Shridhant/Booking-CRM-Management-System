import { Router } from "express"
import { getMeController, updateProfileController } from "./profile.controller"
import { authenticate } from "../../middleware/auth.middleware"
import { validate } from "../../middleware/validate.middleware"
import { updateProfileSchema } from "./profile.validation"

const router = Router()

// All user routes require authentication
router.use(authenticate)

// GET /api/profile/myprofile
router.get("/me", getMeController)

// PATCH /api/profile/myprofile
router.patch("/me", validate(updateProfileSchema), updateProfileController)

export default router