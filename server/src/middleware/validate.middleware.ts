import { Request, Response, NextFunction } from "express"
import { ZodSchema, ZodError } from "zod"
import { ApiError } from "../utils/api-error"

export const validate = (schema: ZodSchema) => {
    return (req: Request, res: Response, next: NextFunction) => {
        try {
            // console.log("BODY:", req.body)

            req.body = schema.parse(req.body)

            next()
        } catch (err) {
            if (err instanceof ZodError) {
                const message = err.issues
                    .map((e) => `${e.path.join(".")}: ${e.message}`)
                    .join(", ")
                next(new ApiError(400, message))
            } else {
                next(err)
            }
        }
    }
}