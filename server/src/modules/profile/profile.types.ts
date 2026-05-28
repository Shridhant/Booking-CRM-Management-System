export interface User {
    id: string
    name: string
    email: string
    phone: string | null
    role: string
    profile_media_id: string | null
    profile_photo_url?: string | null
    is_active: boolean
    created_at: string
    updated_at: string
}

export interface UpdateProfileInput {
    name?: string | undefined
    phone?: string | null | undefined
    profile_media_id?: string | null | undefined
}