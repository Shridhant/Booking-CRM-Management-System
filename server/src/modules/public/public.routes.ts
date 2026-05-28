import { Router } from "express"
import {
  getBusinessController,
  getSlotsController,
  listBranchesController,
  listReviewsController,
  listServicesController,
  searchBusinessesController,
  getPublicBusinessGalleryController,
} from "./public.controller"

const router = Router()

// GET /api/public/businesses/search
router.get("/businesses/search", searchBusinessesController)

// GET /api/public/businesses/:businessIdOrSlug
router.get("/businesses/:businessIdOrSlug", getBusinessController)

// GET /api/public/businesses/:businessIdOrSlug/branches
router.get("/businesses/:businessIdOrSlug/branches", listBranchesController)

// GET /api/public/businesses/:businessIdOrSlug/services
router.get("/businesses/:businessIdOrSlug/services", listServicesController)

// GET /api/public/businesses/:businessIdOrSlug/slots
router.get("/businesses/:businessIdOrSlug/slots", getSlotsController)

// GET /api/public/businesses/:businessIdOrSlug/reviews
router.get("/businesses/:businessIdOrSlug/reviews", listReviewsController)

// GET /api/public/businesses/:businessIdOrSlug/gallery
router.get("/businesses/:businessIdOrSlug/gallery", getPublicBusinessGalleryController)

export default router
