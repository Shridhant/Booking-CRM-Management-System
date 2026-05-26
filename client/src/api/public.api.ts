import api from "./axios"
import type {
  Branch,
  PaginatedResult,
  PublicBusiness,
  PublicReview,
  PublicServiceCategory,
  SlotResult
} from "../types"

export const searchPublicBusinessesApi = async (params?: {
  query?: string
  city?: string
  type?: string
  page?: number
  limit?: number
}): Promise<PaginatedResult<PublicBusiness>> => {
  const res = await api.get("/public/businesses/search", { params })
  return res.data.data
}

export const getPublicBusinessApi = async (
  businessIdOrSlug: string
): Promise<PublicBusiness> => {
  const res = await api.get(`/public/businesses/${businessIdOrSlug}`)
  return res.data.data
}

export const listPublicServicesApi = async (
  businessIdOrSlug: string
): Promise<PublicServiceCategory[]> => {
  const res = await api.get(`/public/businesses/${businessIdOrSlug}/services`)
  return res.data.data
}

export const listPublicBranchesApi = async (
  businessIdOrSlug: string
): Promise<Branch[]> => {
  const res = await api.get(`/public/businesses/${businessIdOrSlug}/branches`)
  return res.data.data
}

export const getPublicSlotsApi = async (
  businessIdOrSlug: string,
  params: {
    date: string
    branch_id: string
    service_ids: string[]
    employee_id?: string
  }
): Promise<SlotResult[]> => {
  const res = await api.get(`/public/businesses/${businessIdOrSlug}/slots`, {
    params: {
      ...params,
      service_ids: params.service_ids.join(",")
    }
  })
  return res.data.data
}

export const listPublicReviewsApi = async (
  businessIdOrSlug: string,
  params?: { page?: number; limit?: number }
): Promise<PaginatedResult<PublicReview>> => {
  const res = await api.get(`/public/businesses/${businessIdOrSlug}/reviews`, { params })
  return res.data.data
}
