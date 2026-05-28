export interface Business {
    id: string
    owner_user_id: string
    business_type: BusinessType
    name: string | undefined
    slug: string
    description: string | null
    logo_media_id: string | null
    cover_media_id: string | null
    phone: string | null
    email: string | null
    address: string | null
    city: string | null
    latitude: number | null
    longitude: number | null
    is_verified: boolean
    booking_type: BookingType
    allow_employee_selection: boolean
    auto_assign_strategy: AutoAssignStrategy
    created_at: string
    updated_at: string
    // joined fields
    logo_url?: string | null
    cover_url?: string | null
}

export type BusinessType =
    | "salon"
    | "spa"
    | "nail_studio"
    | "barber"
    | "makeup_studio"
    | "professional"

export type BookingType =
    | "free_booking"
    | "pay_online_required"
    | "partial_advance"

export type AutoAssignStrategy =
    | "manual"
    | "least_busy"
    | "round_robin"
    | "random"

export interface CreateBusinessInput {
    business_type: BusinessType
    name: string
    description?: string | undefined
    phone?: string | undefined
    email?: string | undefined
    address?: string | undefined
    city?: string | undefined
    latitude?: number | undefined
    longitude?: number | undefined
}

export interface UpdateBusinessInput {
    name?: string | undefined
    description?: string | null | undefined
    phone?: string | null | undefined
    email?: string | null | undefined
    address?: string | null | undefined
    city?: string | null | undefined
    latitude?: number | null | undefined
    longitude?: number | null | undefined
    booking_type?: BookingType | undefined
    allow_employee_selection?: boolean | undefined
    auto_assign_strategy?: AutoAssignStrategy | undefined
    logo_media_id?: string | null | undefined
    cover_media_id?: string | null | undefined
}