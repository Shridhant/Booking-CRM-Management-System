export interface ServiceCategory {
  id: string
  business_id: string
  name: string
  sort_order: number
  created_at: string
  // joined
  services?: Service[]
}

export interface Service {
  id: string
  business_id: string
  category_id: string | null
  name: string
  description: string | null
  duration_minutes: number
  min_price: number
  max_price: number | null
  is_active: boolean
  created_at: string
  updated_at: string
  // joined
  category_name?: string | null
  image_media_id?: string | null
  image_url?: string | null
  employees?: ServiceEmployee[]
}

export interface ServiceEmployee {
  employee_id: string
  employee_name: string
  profile_photo_url: string | null
}

export interface CreateCategoryInput {
  name: string
  sort_order?: number
}

export interface UpdateCategoryInput {
  name?: string
  sort_order?: number
}

export interface ReorderCategoriesInput {
  categories: { id: string; sort_order: number }[]
}

export interface CreateServiceInput {
  name: string
  category_id?: string
  description?: string
  duration_minutes: number
  min_price: number
  max_price?: number
  image_media_id?: string | null
  employee_ids?: string[]
}

export interface UpdateServiceInput {
  name?: string
  category_id?: string
  description?: string
  duration_minutes?: number
  min_price?: number
  max_price?: number
  image_media_id?: string | null
  is_active?: boolean
}

export interface AssignEmployeesToServiceInput {
  employee_ids: string[]
}
