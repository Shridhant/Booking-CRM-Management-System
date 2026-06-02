import express from "express"
import cors from "cors"
import { errorMiddleware } from "./middleware/error.middleware"

import authRoutes from "./modules/auth/auth.routes"

import publicRoutes from "./modules/public/public.routes"

import userRoutes from "./modules/profile/profile.routes"

import businessRoutes from "./modules/businesses/businesses.routes"

import adminRoutes from "./modules/admin/admin.routes"

import branchRoutes from './modules/branches/branches.routes'

import employeeRoutes from './modules/employees/employees.routes'

import serviceRoutes from './modules/services/services.routes'

import crmCustomerRoutes from './modules/customer/customers.routes'

import customerRoutes from './modules/customer/customer.routes'

import bookingRoutes from './modules/bookings/bookings.routes'


import availabilityRoutes from './modules/availability/availability.routes'
import mediaRoutes from './modules/media/media.routes'
import promotionsRoutes from './modules/promotions/promotions.routes'

const app = express()

app.use(cors())
app.use(express.json())

app.use("/uploads", express.static("uploads"))

app.get("/health", (req, res) => {
  res.json({ status: "The booking webapp is running - It is ok" })
})

app.get("/api/health", (req, res) => {
  res.json({ status: "The booking webapp is running - It is ok" })
})

// Public
app.use("/api/auth", authRoutes)

app.use("/api/public", publicRoutes)

app.use("/api/promotions", promotionsRoutes)

// Media upload routes
app.use("/api/media", mediaRoutes)

// Super admin only
app.use("/api/admin", adminRoutes)

// Authenticated users
app.use("/api/users", userRoutes)

//Business routes
app.use("/api/businesses", businessRoutes)

// Nested under businesses
app.use("/api/businesses/:businessId/branches", branchRoutes)

//employee routes

app.use("/api/businesses/:businessId/employees", employeeRoutes)

//Service routes

app.use("/api/businesses/:businessId/services", serviceRoutes)

//availability routes

app.use("/api/businesses/:businessId/employees/:employeeId/availability", availabilityRoutes)

//Customer routes

app.use("/api/businesses/:businessId/customers", crmCustomerRoutes)

// Authenticated customer personal space

app.use("/api/customer", customerRoutes)

//booking routes

app.use("/api/businesses/:businessId/bookings", bookingRoutes)



// Global error handler 
app.use(errorMiddleware)

export default app
