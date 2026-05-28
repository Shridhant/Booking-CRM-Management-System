import api from "./axios"

export interface GalleryItem {
  id: string
  sort_order: number
  media_id: string
  url: string
  size?: number | null
  mime_type?: string | null
}

export const getBusinessGalleryApi = async (businessId: string): Promise<GalleryItem[]> => {
  const res = await api.get(`/businesses/${businessId}/gallery`)
  return res.data.data
}

export const addGalleryPhotoApi = async (
  businessId: string,
  mediaId: string,
  sortOrder: number = 0
): Promise<GalleryItem> => {
  const res = await api.post(`/businesses/${businessId}/gallery`, {
    media_id: mediaId,
    sort_order: sortOrder,
  })
  return res.data.data
}

export const deleteGalleryPhotoApi = async (
  businessId: string,
  galleryId: string
): Promise<void> => {
  await api.delete(`/businesses/${businessId}/gallery/${galleryId}`)
}

export const getPublicGalleryApi = async (
  businessIdOrSlug: string
): Promise<GalleryItem[]> => {
  const res = await api.get(`/public/businesses/${businessIdOrSlug}/gallery`)
  return res.data.data
}
