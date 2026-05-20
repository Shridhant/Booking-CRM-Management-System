export interface Employee {
    id: string
    business_id: string
    user_id: string | null
    name: string
    bio: string | null
    experience_years: number
    profile_media_id: string | null
    is_active: boolean
    created_at: string
    // joined fields
    profile_photo_url?: string | null
    branches?: EmployeeBranch[]
}

export interface EmployeeBranch {
    branch_id: string
    branch_name: string
    city: string | null
}

export interface CreateEmployeeInput {
    name: string
    bio?: string
    experience_years?: number
    branch_ids: string[]  // at least one branch required
}

export interface UpdateEmployeeInput {
    name?: string
    bio?: string
    experience_years?: number
    is_active?: boolean
}

export interface AssignBranchesInput {
    branch_ids: string[]
}