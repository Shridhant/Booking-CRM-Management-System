export interface JwtPayload {
    userId: string
    email: string
    role: string
}

export interface TokenPair {
    accessToken: string
    refreshToken: string
}

// Used internally by admin service when creating accounts
export interface CreateAccountInput {
    name: string
    email: string
    phone?: string
    password: string
    role: "super_admin" | "business_admin" | "employee" | "customer"
}

export interface LoginInput {
    email: string
    password: string
}

export interface RegisterCustomerInput {
    name: string
    email: string
    phone: string
    password: string
}

export interface RefreshTokenInput {
    refreshToken: string
}
