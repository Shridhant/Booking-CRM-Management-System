// admin types
export interface OnboardBusinessInput {
    // Business details
    business_type: "salon" | "spa" | "nail_studio" | "barber" | "makeup_studio" | "professional"
    business_name: string
    business_phone?: string
    business_email?: string
    address?: string
    city?: string

    // Admin account details
    admin_name: string
    admin_email: string
    admin_phone?: string
    admin_password: string
}

export interface OnboardBusinessResult {
    user: {
        id: string
        name: string
        email: string
        role: string
    }
    business: {
        id: string
        name: string
        slug: string
        business_type: string
    }
    message: string
}