import { Request, Response, NextFunction } from "express"
import { ApiError } from "../utils/api-error"

export const authorize = (...allowedRoles: string[]) => {
    return (req: Request, res: Response, next: NextFunction) => {
        if (!req.user) {
            return next(new ApiError(401, "Not authenticated"))
        }

        if (!allowedRoles.includes(req.user.role)) {
            return next(
                new ApiError(403, "You do not have permission to perform this action")
            )
        }

        next()
    }
}