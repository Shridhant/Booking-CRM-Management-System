import { v2 as cloudinary } from "cloudinary"
import dotenv from "dotenv"

dotenv.config()

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || "",
  api_key: process.env.CLOUDINARY_API_KEY || "",
  api_secret: process.env.CLOUDINARY_API_SECRET || "",
})

export const uploadToCloudinary = (
  fileBuffer: Buffer,
  folder: string = "booking_platform"
): Promise<{ secure_url: string; public_id: string; bytes: number; format: string; resource_type: string }> => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: folder,
      },
      (error, result) => {
        if (error) return reject(error)
        if (!result) return reject(new Error("Upload resulted in empty result"))
        resolve({
          secure_url: result.secure_url,
          public_id: result.public_id,
          bytes: result.bytes,
          format: result.format,
          resource_type: result.resource_type,
        })
      }
    )
    uploadStream.end(fileBuffer)
  })
}

export const deleteFromCloudinary = async (publicId: string): Promise<void> => {
  await cloudinary.uploader.destroy(publicId)
}
