import { Router } from "express"
import { login, refreshToken, register } from "./auth.controller"
import { validate } from "../../middleware/validate.middleware"
import { loginSchema, refreshTokenSchema, registerCustomerSchema } from "./auth.validation"

const router = Router()

// POST /api/auth/login
router.post("/login", validate(loginSchema), login)

// POST /api/auth/register
router.post("/register", validate(registerCustomerSchema), register)

// POST /api/auth/refresh
router.post("/refresh", validate(refreshTokenSchema), refreshToken)

export default router
