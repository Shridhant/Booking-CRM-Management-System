import api from "./axios"

export interface MediaRecord {
  id: string
  url: string
  mime_type: string | null
  type: string | null
  size: number | null
  created_at: string
}

export const uploadMediaApi = async (file: File, folder: string = "booking_platform"): Promise<MediaRecord> => {
  const formData = new FormData()
  formData.append("image", file)
  formData.append("folder", folder)

  const res = await api.post("/media/upload", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  })
  return res.data.data
}
