import api from "./axios"

export interface Promotion {
  id: string
  title: string
  desktop_media_id: string
  mobile_media_id: string
  redirect_slug: string
  is_active: boolean
  sort_order: number
  desktop_url?: string
  mobile_url?: string
}

export const listActivePromotionsApi = async (): Promise<Promotion[]> => {
  const res = await api.get("/promotions")
  return res.data.data
}

export const listAllPromotionsApi = async (): Promise<Promotion[]> => {
  const res = await api.get("/promotions/admin")
  return res.data.data
}

export const createPromotionApi = async (data: {
  title: string
  desktop_media_id: string
  mobile_media_id: string
  redirect_slug: string
  sort_order?: number
}): Promise<Promotion> => {
  const res = await api.post("/promotions", data)
  return res.data.data
}

export const updatePromotionApi = async (
  id: string,
  data: Partial<{
    title: string
    desktop_media_id: string
    mobile_media_id: string
    redirect_slug: string
    is_active: boolean
    sort_order: number
  }>
): Promise<Promotion> => {
  const res = await api.put(`/promotions/${id}`, data)
  return res.data.data
}

export const deletePromotionApi = async (id: string): Promise<void> => {
  await api.delete(`/promotions/${id}`)
}
