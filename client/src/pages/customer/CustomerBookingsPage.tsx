import { useState } from "react"
import { Link } from "react-router-dom"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { CalendarClock, Loader2, MapPin, MessageSquare, Star, XCircle } from "lucide-react"
import {
  cancelCustomerBookingApi,
  listCustomerBookingsApi,
  submitCustomerReviewApi
} from "../../api/customer.api"
import { formatDate, formatTime } from "../../lib/date"
import type { CustomerBooking } from "../../types"
import ThreeDotsLoader from "../../components/common/ThreeDotsLoader"


type Scope = "active" | "completed" | "cancelled" | "all"

const scopes: { label: string; value: Scope }[] = [
  { label: "Active", value: "active" },
  { label: "Completed", value: "completed" },
  { label: "Cancelled", value: "cancelled" },
  { label: "All", value: "all" }
]

export default function CustomerBookingsPage() {
  const queryClient = useQueryClient()
  const [scope, setScope] = useState<Scope>("active")
  const [reviewBookingId, setReviewBookingId] = useState<string | null>(null)
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState("")

  const { data: bookings = [], isLoading, error } = useQuery({
    queryKey: ["customer-bookings", scope],
    queryFn: () => listCustomerBookingsApi(scope)
  })

  const cancelMutation = useMutation({
    mutationFn: (bookingId: string) => cancelCustomerBookingApi(bookingId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customer-bookings"] })
    }
  })

  const reviewMutation = useMutation({
    mutationFn: (bookingId: string) =>
      submitCustomerReviewApi(bookingId, {
        rating,
        comment: comment.trim() || undefined
      }),
    onSuccess: () => {
      setReviewBookingId(null)
      setRating(5)
      setComment("")
      queryClient.invalidateQueries({ queryKey: ["customer-bookings"] })
    }
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mono-label mb-2">my appointments</p>
          <h1 className="text-3xl font-semibold text-neutral-950">Bookings</h1>
          <p className="mt-2 text-sm text-neutral-600">
            View your booking history, cancel eligible appointments, and review completed visits.
          </p>
        </div>
        <Link
          to="/customer"
          className="inline-flex items-center justify-center rounded-full bg-neutral-950 px-4 py-2.5 text-sm font-medium text-white shadow-vercel-sm hover:bg-neutral-900"
        >
          Book another service
        </Link>
      </div>

      <div className="flex flex-wrap gap-2">
        {scopes.map((item) => (
          <button
            key={item.value}
            onClick={() => setScope(item.value)}
            className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
              scope === item.value
                ? "border-neutral-950 bg-neutral-950 text-white"
                : "border-[#ebebeb] bg-white text-neutral-600 hover:bg-neutral-100 hover:text-neutral-950"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex min-h-[30vh] items-center justify-center">
          <ThreeDotsLoader color="bg-[#e8b9c5]" size="w-3 h-3" />
        </div>
      ) : error ? (
        <div className="app-card p-6 text-sm text-red-600">Could not load your bookings.</div>
      ) : bookings.length === 0 ? (
        <div className="app-card p-8 text-center">
          <CalendarClock className="mx-auto h-8 w-8 text-neutral-400" />
          <p className="mt-3 text-base font-semibold text-neutral-950">No bookings here yet.</p>
          <p className="mt-1 text-sm text-neutral-500">Explore businesses and book a slot when you are ready.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {bookings.map((booking) => (
            <BookingRow
              key={booking.id}
              booking={booking}
              isCancelling={cancelMutation.isPending}
              reviewBookingId={reviewBookingId}
              rating={rating}
              comment={comment}
              onCancel={() => cancelMutation.mutate(booking.id)}
              onStartReview={() => setReviewBookingId(booking.id)}
              onCloseReview={() => setReviewBookingId(null)}
              onRatingChange={setRating}
              onCommentChange={setComment}
              onSubmitReview={() => reviewMutation.mutate(booking.id)}
              isReviewing={reviewMutation.isPending}
            />
          ))}
        </div>
      )}

      {(cancelMutation.error || reviewMutation.error) && (
        <div className="app-card border-red-200 bg-red-50 p-4 text-sm text-red-600">
          {String(cancelMutation.error || reviewMutation.error)}
        </div>
      )}
    </div>
  )
}

function BookingRow({
  booking,
  isCancelling,
  reviewBookingId,
  rating,
  comment,
  onCancel,
  onStartReview,
  onCloseReview,
  onRatingChange,
  onCommentChange,
  onSubmitReview,
  isReviewing
}: {
  booking: CustomerBooking
  isCancelling: boolean
  reviewBookingId: string | null
  rating: number
  comment: string
  onCancel: () => void
  onStartReview: () => void
  onCloseReview: () => void
  onRatingChange: (rating: number) => void
  onCommentChange: (comment: string) => void
  onSubmitReview: () => void
  isReviewing: boolean
}) {
  const canCancel = ["pending", "confirmed"].includes(booking.booking_status)
  const canReview = booking.booking_status === "completed" && !booking.review_id
  const reviewOpen = reviewBookingId === booking.id

  return (
    <article className="app-card p-4 sm:p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-base font-semibold text-neutral-950">{booking.business_name}</h2>
            <StatusBadge status={booking.booking_status} />
          </div>
          <div className="mt-2 flex flex-wrap gap-3 text-sm text-neutral-600">
            <span className="inline-flex items-center gap-1.5">
              <CalendarClock className="h-4 w-4" />
              {formatDate(booking.booking_date)} at {formatTime(booking.start_time)}
            </span>
            {booking.branch_name && (
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="h-4 w-4" />
                {booking.branch_name}
              </span>
            )}
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {booking.services.map((service) => (
              <span key={service.service_id} className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-medium text-neutral-700">
                {service.service_name}
              </span>
            ))}
          </div>
          <p className="mt-3 text-sm font-semibold text-neutral-950">Rs {Number(booking.total_amount || 0).toFixed(0)}</p>
        </div>

        <div className="flex flex-wrap gap-2 lg:justify-end">
          {canCancel && (
            <button
              onClick={onCancel}
              disabled={isCancelling}
              className="inline-flex items-center gap-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-100 disabled:opacity-60"
            >
              {isCancelling ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
              Cancel
            </button>
          )}
          {canReview && (
            <button
              onClick={onStartReview}
              className="inline-flex items-center gap-2 rounded-md border border-[#ebebeb] bg-white px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-100 hover:text-neutral-950"
            >
              <MessageSquare className="h-4 w-4" />
              Review
            </button>
          )}
          {booking.review_rating && (
            <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-700">
              <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
              {booking.review_rating}
            </span>
          )}
        </div>
      </div>

      {reviewOpen && (
        <div className="mt-4 rounded-md border border-[#ebebeb] bg-neutral-50 p-4">
          <div className="flex flex-wrap items-center gap-2">
            {[1, 2, 3, 4, 5].map((value) => (
              <button
                key={value}
                onClick={() => onRatingChange(value)}
                className="rounded-md p-1 text-amber-400 hover:bg-white"
                aria-label={`Rate ${value}`}
              >
                <Star className={`h-6 w-6 ${value <= rating ? "fill-amber-400" : "fill-transparent"}`} />
              </button>
            ))}
          </div>
          <textarea
            value={comment}
            onChange={(event) => onCommentChange(event.target.value)}
            rows={3}
            placeholder="Share how the service went"
            className="mt-3 w-full resize-none rounded-md border border-[#d4d4d4] bg-white px-3 py-2.5 text-sm outline-none focus:border-transparent focus:ring-2 focus:ring-neutral-950"
          />
          <div className="mt-3 flex flex-wrap justify-end gap-2">
            <button onClick={onCloseReview} className="rounded-md px-3 py-2 text-sm font-medium text-neutral-600 hover:bg-white">
              Close
            </button>
            <button
              onClick={onSubmitReview}
              disabled={isReviewing}
              className="inline-flex items-center gap-2 rounded-full bg-neutral-950 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-900 disabled:opacity-60"
            >
              {isReviewing && <Loader2 className="h-4 w-4 animate-spin" />}
              Submit review
            </button>
          </div>
        </div>
      )}
    </article>
  )
}

function StatusBadge({ status }: { status: string }) {
  const classes =
    status === "cancelled"
      ? "bg-red-50 text-red-700"
      : status === "completed"
        ? "bg-emerald-50 text-emerald-700"
        : status === "pending"
          ? "bg-amber-50 text-amber-700 border border-amber-200"
          : "bg-sky-50 text-sky-700 border border-sky-200"

  return (
    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${classes}`}>
      {status.replace("_", " ")}
    </span>
  )
}
