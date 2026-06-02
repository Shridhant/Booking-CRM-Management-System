import { Router } from "express"
import { authenticate } from "../../middleware/auth.middleware"
import { authorize } from "../../middleware/role.middleware"
import {
  getPublicPromotionsController,
  getAdminPromotionsController,
  createPromotionController,
  updatePromotionController,
  deletePromotionController
} from "./promotions.controller"

const router = Router()

// Public route to get active banners
router.get("/", getPublicPromotionsController)

// Admin-only routes (Requires Super Admin credentials)
router.get("/admin", authenticate, authorize("super_admin"), getAdminPromotionsController)
router.post("/", authenticate, authorize("super_admin"), createPromotionController)
router.put("/:id", authenticate, authorize("super_admin"), updatePromotionController)
router.delete("/:id", authenticate, authorize("super_admin"), deletePromotionController)

export default router
