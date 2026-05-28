import { db } from "../../config/db"
import { uploadToCloudinary } from "./upload.service"

export interface MediaRecord {
  id: string
  uploaded_by_user_id: string | null
  url: string
  mime_type: string | null
  type: string | null
  size: number | null
  created_at: Date
}

export const createMedia = async (
  fileBuffer: Buffer,
  mimeType: string,
  size: number,
  userId: string | null,
  folder: string = "booking_platform"
): Promise<MediaRecord> => {
  // 1. Upload to Cloudinary
  const uploadResult = await uploadToCloudinary(fileBuffer, folder)

  // 2. Insert record into Postgres
  const query = `
    INSERT INTO public.media (uploaded_by_user_id, url, mime_type, "type", "size")
    VALUES ($1, $2, $3, $4, $5)
    RETURNING id, uploaded_by_user_id, url, mime_type, "type", "size", created_at
  `
  const values = [userId, uploadResult.secure_url, mimeType, "image", size]

  const { rows } = await db.query(query, values)
  return rows[0]
}
