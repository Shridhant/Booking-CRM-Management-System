export interface User {
    id: string
    name: string
    email: string
    phone: string | null
    role: string
    profile_media_id: string | null
    is_active: boolean
    created_at: string
    updated_at: string
}

export interface UpdateProfileInput {
    name?: string | undefined
    phone?: string | undefined
}