import { Request, Response, NextFunction } from "express"
import { ApiError } from "../utils/api-error"

export const errorMiddleware = (
    err: Error,
    req: Request,
    res: Response,
    next: NextFunction
) => {
    if (err instanceof ApiError) {
        return res.status(err.statusCode).json({
            success: false,
            statusCode: err.statusCode,
            message: err.message,
        })
    }

    // Unexpected errors — don't leak details in production
    console.error("Unexpected error:", err)

    return res.status(500).json({
        success: false,
        statusCode: 500,
        message:
            process.env.NODE_ENV === "development"
                ? err.message
                : "Something went wrong",
    })
}