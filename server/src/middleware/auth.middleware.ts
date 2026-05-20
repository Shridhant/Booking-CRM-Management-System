import { Request, Response, NextFunction } from "express"
import { ApiError } from "../utils/api-error"
import { verifyAccessToken } from "../modules/auth/auth.utils"

// Extend Express Request to carry the authenticated user
declare global {
    namespace Express {
        interface Request {
            user?: {
                userId: string
                email: string
                role: string
            }
        }
    }
}

export const authenticate = (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const authHeader = req.headers.authorization

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return next(new ApiError(401, "No token provided"))
    }

    const token = authHeader.split(" ")[1]

    if (!token) {
        return next(new ApiError(401, "No token provided"))
    }

    try {
        const payload = verifyAccessToken(token)
        req.user = payload
        next()
    } catch {
        next(new ApiError(401, "Invalid or expired token"))
    }
}