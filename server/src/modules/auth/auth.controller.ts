import { Request, Response, NextFunction } from "express"
import { asyncHandler } from "../../utils/async-handler"
import { ApiResponse } from "../../utils/api-response"
import { loginUser, refreshUserToken, registerCustomer } from "./auth.service"
import { LoginSchema, RefreshTokenSchema, RegisterCustomerSchema } from "./auth.validation"
import { ApiError } from "../../utils/api-error"

// export const register = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
//     const input: RegisterSchema = req.body


//     const tokens = await registerUser(input)

//     res.status(201).json(
//         new ApiResponse(201, tokens, "Account created successfully")
//     )
// })

export const register = asyncHandler(async (req: Request, res: Response) => {
    const input: RegisterCustomerSchema = req.body

    const tokens = await registerCustomer(input)

    res.status(201).json(
        new ApiResponse(201, tokens, "Account created successfully")
    )
})

export const login = asyncHandler(async (req: Request, res: Response) => {
    const input: LoginSchema = req.body

    const tokens = await loginUser(input)

    res.status(200).json(
        new ApiResponse(200, tokens, "Logged in successfully")
    )
})

export const refreshToken = asyncHandler(async (req: Request, res: Response) => {
    const input: RefreshTokenSchema = req.body

    const tokens = await refreshUserToken(input.refreshToken)

    res.status(200).json(
        new ApiResponse(200, tokens, "Token refreshed successfully")
    )
})
