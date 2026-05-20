# Beauty & Wellness Booking Platform Backend

## Project Overview

This project is a multi-vendor beauty & wellness booking platform backend built using:

- Node.js
- Express.js
- TypeScript
- PostgreSQL

The platform allows:

- Salons
- Nail studios
- Spas
- Makeup artists
- Independent professionals

to create profiles, manage services, employees, bookings, availability, and payments.

Customers can:
- browse businesses
- select services
- choose employees
- book appointments
- pay online later
- pay at salon
- review businesses

The architecture is designed for:
- web-first MVP
- future mobile apps
- scalable marketplace model
- multi-business support

---

# Current MVP Scope

## Included

- Authentication
- Businesses
- Employees
- Services
- Availability
- Booking System
- Manual Employee Assignment
- Pay at Salon Flow
- Reviews
- Local File Uploads
- Notifications Structure
- PostgreSQL Database

---

## Deferred For Later

- Redis
- Razorpay
- Stripe
- Cloudinary
- AWS S3
- Queue Workers
- WebSockets
- Push Notifications
- Docker
- Microservices

---

# Tech Stack

## Backend

- Express.js
- TypeScript
- PostgreSQL

---

## Authentication

- JWT Authentication
- Refresh Tokens

---

## File Uploads

Current:
- Local uploads using multer

Future:
- Cloudinary
- AWS S3

---

# Project Structure

```txt
src/
│
├── app.ts
├── server.ts
│
├── config/
│   ├── env.ts
│   ├── db.ts
│   └── logger.ts
│
├── database/
│   ├── schema.sql
│   └── migrations/
│
├── modules/
│   │
│   ├── auth/
│   │   ├── auth.controller.ts
│   │   ├── auth.routes.ts
│   │   ├── auth.service.ts
│   │   └── auth.validation.ts
│   │
│   ├── users/
│   │
│   ├── businesses/
│   │
│   ├── employees/
│   │
│   ├── services/
│   │
│   ├── availability/
│   │
│   ├── bookings/
│   │
│   ├── payments/
│   │
│   ├── media/
│   │
│   ├── reviews/
│   │
│   └── notifications/
│
├── middleware/
│   ├── auth.middleware.ts
│   ├── error.middleware.ts
│   ├── role.middleware.ts
│   ├── validate.middleware.ts
│   └── upload.middleware.ts
│
├── uploads/
│   ├── businesses/
│   ├── employees/
│   ├── services/
│   └── users/
│
├── utils/
│   ├── api-error.ts
│   ├── api-response.ts
│   ├── async-handler.ts
│   ├── jwt.ts
│   ├── pagination.ts
│   ├── date.ts
│   └── constants.ts
│
├── types/
│   ├── express.d.ts
│   └── common.types.ts
│
└── jobs/
    ├── reminder.job.ts
    └── cleanup.job.ts
```

---

# Architecture Overview

## Multi-Tenant System

The platform supports multiple businesses using the same backend.

Businesses can be:
- salons
- spas
- nail studios
- freelance professionals

---

# User Types

```txt
super_admin
business_admin
professional
employee
customer
```

---

# Main Entities

## Users
Authentication identities.

## Businesses
Service providers.

## Employees
Business staff members.

## Services
Services businesses offer.

## Availability
Working schedules.

## Bookings
Appointments.

## Payments
Payment tracking.

## Media
Uploaded images/files.

## Reviews
Customer reviews.

---

# Employee Selection Flow

Customers can:

## 1. Select Employee

OR

## 2. Choose "No Preference"

If no preference:
- booking is created
- employee remains NULL
- salon admin manually assigns employee later

---

# Booking Flow

## Customer Flow

```txt
Browse Businesses
→ Choose Service
→ Choose Employee / No Preference
→ Choose Time Slot
→ Create Booking
```

---

## Backend Flow

```txt
Validate Availability
→ Check Overlapping Bookings
→ Create Booking Transaction
→ Create Booking Services
→ Handle Payment Status
→ Send Notifications
```

---

## Salon Admin Flow

```txt
View Bookings
→ Assign Employee
→ Confirm Payment
→ Mark Booking Completed
```

---

# Booking Statuses

## Booking Status

```txt
pending
confirmed
completed
cancelled
no_show
```

---

## Assignment Status

```txt
pending_assignment
assigned
reassigned
```

---

## Payment Status

```txt
pending
paid
failed
refunded
```

---

# Database Setup

## Install PostgreSQL

Recommended:
- PostgreSQL 15+

---

# Create Database

```sql
CREATE DATABASE beauty_booking_db;
```

---

# Environment Variables

## .env

```env
PORT=5000

DATABASE_URL=postgresql://postgres:password@localhost:5432/beauty_booking_db

JWT_SECRET=your_jwt_secret
JWT_REFRESH_SECRET=your_refresh_secret

NODE_ENV=development
```

---

# Database Connection Setup

## src/config/db.ts

```ts
import pg from "pg"
import dotenv from "dotenv"

dotenv.config()

const { Pool } = pg

export const db = new Pool({
  connectionString: process.env.DATABASE_URL,
})

db.connect()
  .then(() => {
    console.log("Database connected")
  })
  .catch((err) => {
    console.error("Database connection error", err)
  })
```

---

# App Setup

## src/app.ts

```ts
import express from "express"
import cors from "cors"

const app = express()

app.use(cors())
app.use(express.json())

app.use("/uploads", express.static("uploads"))

export default app
```

---

## src/server.ts

```ts
import dotenv from "dotenv"
import app from "./app"

dotenv.config()

const PORT = process.env.PORT || 5000

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
```

---

# Recommended Packages

## Core Packages

```bash
npm install express cors dotenv pg bcrypt jsonwebtoken multer
```

---

## Dev Dependencies

```bash
npm install -D typescript tsx nodemon @types/node @types/express @types/cors @types/bcrypt @types/jsonwebtoken @types/multer
```

---

# File Upload Setup

## Local Upload Strategy

Files will be stored locally inside:

```txt
uploads/
```

---

# Upload Categories

```txt
uploads/businesses
uploads/employees
uploads/services
uploads/users
```

---

# Example Multer Setup

## src/middleware/upload.middleware.ts

```ts
import multer from "multer"
import path from "path"

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/")
  },

  filename: (req, file, cb) => {
    const uniqueName =
      Date.now() + "-" + Math.round(Math.random() * 1e9)

    cb(
      null,
      uniqueName + path.extname(file.originalname)
    )
  },
})

export const upload = multer({ storage })
```

---

# Important Production Notes

## Use Transactions

Booking creation MUST use database transactions.

Reason:
- prevents double booking
- ensures consistent booking state

---

## Never Trust Frontend Slot Availability

Always validate:
- employee availability
- overlapping bookings
- leave/time off
- service duration

on backend.

---

## Use UUIDs

All tables use UUID primary keys.

Benefits:
- scalability
- security
- cleaner distributed architecture

---

# Important Backend Complexity

The hardest part of the platform is NOT CRUD.

The most important systems are:

- slot generation
- overlapping booking validation
- employee assignment
- availability logic

The architecture should prioritize these systems.

---

# Future Scaling Plans

Future improvements can include:

- Redis caching
- Queue workers
- Razorpay integration
- Cloudinary uploads
- Push notifications
- WebSocket updates
- Mobile apps
- AI recommendations
- Calendar sync
- Subscription plans

---

# Current Backend Goal

Current goal is to build:

- stable MVP
- scalable structure
- clean booking architecture
- strong relational database
- mobile-app-ready backend

without overengineering early.