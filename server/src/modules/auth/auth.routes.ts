import { Router } from "express"
import { login, refreshToken } from "./auth.controller"
import { validate } from "../../middleware/validate.middleware"
import { loginSchema, refreshTokenSchema } from "./auth.validation"

const router = Router()

// POST /api/auth/login
router.post("/login", validate(loginSchema), login)

// POST /api/auth/refresh
router.post("/refresh", validate(refreshTokenSchema), refreshToken)

export default router