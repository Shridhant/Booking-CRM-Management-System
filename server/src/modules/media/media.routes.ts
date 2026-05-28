import { Router } from "express"
import multer from "multer"
import { uploadSingleMediaController } from "./media.controller"
import { authenticate } from "../../middleware/auth.middleware"

const router = Router()

// Configure Multer to store uploaded files in memory
const storage = multer.memoryStorage()
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true)
    } else {
      cb(new Error("Only image files are allowed!"))
    }
  },
})

// Protected route to upload single image file
// It expects the multipart field to be named "image"
router.post("/upload", authenticate, upload.single("image"), uploadSingleMediaController)

export default router
