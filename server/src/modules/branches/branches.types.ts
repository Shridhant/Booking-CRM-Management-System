// branches types
export interface Branch {
    id: string
    business_id: string
    name: string
    address: string | null
    city: string | null
    latitude: number | null
    longitude: number | null
    opening_time: string | null
    closing_time: string | null
    phone: string | null
    created_at: string
}

export interface CreateBranchInput {
    name: string
    address?: string
    city?: string
    latitude?: number
    longitude?: number
    opening_time?: string  // "HH:MM" format
    closing_time?: string  // "HH:MM" format
    phone?: string
}

export interface UpdateBranchInput {
    name?: string
    address?: string
    city?: string
    latitude?: number
    longitude?: number
    opening_time?: string
    closing_time?: string
    phone?: string
}