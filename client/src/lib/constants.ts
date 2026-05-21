export const BOOKING_STATUS_COLORS: Record<string, string> = {
  pending:   "bg-yellow-100 text-yellow-800",
  confirmed: "bg-blue-100 text-blue-800",
  completed: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
  no_show:   "bg-gray-100 text-gray-800",
}

export const BOOKING_STATUS_LABELS: Record<string, string> = {
  pending:   "Pending",
  confirmed: "Confirmed",
  completed: "Completed",
  cancelled: "Cancelled",
  no_show:   "No Show",
}

export const PAYMENT_STATUS_COLORS: Record<string, string> = {
  pending:  "bg-yellow-100 text-yellow-800",
  paid:     "bg-green-100 text-green-800",
  failed:   "bg-red-100 text-red-800",
  refunded: "bg-purple-100 text-purple-800",
}

export const DAY_NAMES = [
  "Sunday", "Monday", "Tuesday", "Wednesday",
  "Thursday", "Friday", "Saturday",
]

export const BUSINESS_TYPES: Record<string, string> = {
  salon:         "Salon",
  spa:           "Spa",
  nail_studio:   "Nail Studio",
  barber:        "Barber",
  makeup_studio: "Makeup Studio",
  professional:  "Professional",
}
