import { useMemo, useState } from "react"
import { Link, useLocation, useNavigate, useParams } from "react-router-dom"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  ArrowLeft,
  BadgeCheck,
  Calendar,
  Check,
  Clock,
  Loader2,
  MapPin,
  MessageSquare,
  Phone,
  Scissors,
  Star
} from "lucide-react"
import { createCustomerBookingApi } from "../../api/customer.api"
import {
  getPublicBusinessApi,
  getPublicSlotsApi,
  listPublicBranchesApi,
  listPublicReviewsApi,
  listPublicServicesApi
} from "../../api/public.api"
import { today, formatTime } from "../../lib/date"
import { useAuthStore } from "../../store/auth.store"
import type { PublicServiceCategory, Service, SlotResult } from "../../types"

type SlotChoice = {
  employee_id: string | null
  employee_name?: string
  start_time: string
  end_time: string
}

export default function CustomerBusinessPage() {
  const { businessIdOrSlug = "" } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { isAuthenticated, user } = useAuthStore()

  const [selectedBranchId, setSelectedBranchId] = useState("")
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([])
  const [bookingDate, setBookingDate] = useState(today())
  const [selectedSlot, setSelectedSlot] = useState<SlotChoice | null>(null)
  const [notes, setNotes] = useState("")
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const { data: business, isLoading: businessLoading } = useQuery({
    queryKey: ["public-business", businessIdOrSlug],
    queryFn: () => getPublicBusinessApi(businessIdOrSlug),
    enabled: Boolean(businessIdOrSlug)
  })

  const { data: categories = [], isLoading: servicesLoading } = useQuery({
    queryKey: ["public-services", businessIdOrSlug],
    queryFn: () => listPublicServicesApi(businessIdOrSlug),
    enabled: Boolean(businessIdOrSlug)
  })

  const { data: branches = [] } = useQuery({
    queryKey: ["public-branches", businessIdOrSlug],
    queryFn: () => listPublicBranchesApi(businessIdOrSlug),
    enabled: Boolean(businessIdOrSlug)
  })

  const { data: reviews } = useQuery({
    queryKey: ["public-reviews", businessIdOrSlug],
    queryFn: () => listPublicReviewsApi(businessIdOrSlug, { limit: 6 }),
    enabled: Boolean(businessIdOrSlug)
  })

  const activeBranchId = selectedBranchId || branches[0]?.id || ""

  const flatServices = useMemo(
    () => categories.flatMap((category: PublicServiceCategory) => category.services ?? []),
    [categories]
  )

  const selectedServices = flatServices.filter((service) => selectedServiceIds.includes(service.id))
  const totalDuration = selectedServices.reduce((sum, service) => sum + Number(service.duration_minutes || 0), 0)
  const totalPrice = selectedServices.reduce((sum, service) => sum + Number(service.min_price || 0), 0)

  const { data: slotResults = [], isLoading: slotsLoading } = useQuery({
    queryKey: ["public-slots", businessIdOrSlug, activeBranchId, bookingDate, selectedServiceIds],
    queryFn: () =>
      getPublicSlotsApi(businessIdOrSlug, {
        date: bookingDate,
        branch_id: activeBranchId,
        service_ids: selectedServiceIds
      }),
    enabled: Boolean(businessIdOrSlug && activeBranchId && selectedServiceIds.length > 0)
  })

  const slotChoices = useMemo(() => {
    const choices = slotResults.flatMap((result: SlotResult) =>
      result.slots.map((slot) => ({
        employee_id: result.employee_id,
        employee_name: result.employee_name,
        start_time: slot.start_time,
        end_time: slot.end_time
      }))
    )
    return choices.sort((a, b) => a.start_time.localeCompare(b.start_time))
  }, [slotResults])

  const bookingMutation = useMutation({
    mutationFn: () => {
      if (!business || !selectedSlot) {
        throw new Error("Select a slot before booking")
      }
      return createCustomerBookingApi({
        business_id: business.id,
        branch_id: activeBranchId,
        employee_id: selectedSlot.employee_id || undefined,
        service_ids: selectedServiceIds,
        booking_date: bookingDate,
        start_time: selectedSlot.start_time.slice(0, 5),
        notes: notes.trim() || undefined
      })
    },
    onSuccess: () => {
      setSuccessMessage("Booking confirmed. You can manage it from My bookings.")
      setSelectedServiceIds([])
      setSelectedSlot(null)
      setNotes("")
      queryClient.invalidateQueries({ queryKey: ["customer-bookings"] })
    }
  })

  const toggleService = (serviceId: string) => {
    setSuccessMessage(null)
    setSelectedSlot(null)
    setSelectedServiceIds((current) =>
      current.includes(serviceId)
        ? current.filter((id) => id !== serviceId)
        : [...current, serviceId]
    )
  }

  const handleBook = () => {
    if (!isAuthenticated) {
      navigate(`/login?as=customer&next=${encodeURIComponent(location.pathname)}`)
      return
    }

    if (user?.role !== "customer") {
      navigate("/unauthorized")
      return
    }

    bookingMutation.mutate()
  }

  if (businessLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-neutral-500" />
      </div>
    )
  }

  if (!business) {
    return (
      <div className="app-card p-8 text-center">
        <p className="text-base font-semibold text-neutral-950">Business not found.</p>
        <Link to="/customer" className="mt-3 inline-flex items-center gap-2 text-sm font-medium text-neutral-950 hover:underline">
          <ArrowLeft className="h-4 w-4" />
          Back to explore
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Link to="/customer" className="inline-flex items-center gap-2 text-sm font-medium text-neutral-600 hover:text-neutral-950">
        <ArrowLeft className="h-4 w-4" />
        Back to explore
      </Link>

      <section className="overflow-hidden rounded-lg border border-[#ebebeb] bg-white shadow-vercel-sm">
        <div className="relative h-64 bg-neutral-100 sm:h-80">
          {business.cover_url || business.logo_url ? (
            <img
              src={business.cover_url || business.logo_url || ""}
              alt={business.name}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="h-full w-full mesh-gradient opacity-80" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-8">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="mb-2 inline-flex rounded-full bg-white/90 px-3 py-1 text-xs font-semibold capitalize text-neutral-800">
                  {business.business_type.replace("_", " ")}
                </p>
                <div className="flex items-center gap-2">
                  <h1 className="text-3xl font-semibold text-white sm:text-5xl">{business.name}</h1>
                  {business.is_verified && <BadgeCheck className="h-6 w-6 text-emerald-300" />}
                </div>
                <div className="mt-3 flex flex-wrap gap-3 text-sm text-white/90">
                  {business.city && (
                    <span className="inline-flex items-center gap-1.5">
                      <MapPin className="h-4 w-4" />
                      {business.city}
                    </span>
                  )}
                  {business.phone && (
                    <span className="inline-flex items-center gap-1.5">
                      <Phone className="h-4 w-4" />
                      {business.phone}
                    </span>
                  )}
                </div>
              </div>
              <div className="rounded-lg bg-white/95 px-4 py-3 text-neutral-950 shadow-vercel-sm">
                <div className="flex items-center gap-1 text-lg font-semibold">
                  <Star className="h-5 w-5 fill-amber-400 text-amber-400" />
                  {Number(business.average_rating || 0).toFixed(1)}
                </div>
                <p className="text-xs text-neutral-500">{business.review_count} reviews</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="space-y-6">
          {business.description && (
            <section className="app-card p-5">
              <h2 className="text-base font-semibold text-neutral-950">About</h2>
              <p className="mt-2 text-sm leading-6 text-neutral-600">{business.description}</p>
            </section>
          )}

          <section className="app-card p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-semibold text-neutral-950">Services</h2>
              {servicesLoading && <Loader2 className="h-4 w-4 animate-spin text-neutral-500" />}
            </div>
            <div className="space-y-5">
              {categories.map((category) => (
                <div key={category.id || "uncategorized"}>
                  <h3 className="mb-2 text-sm font-semibold text-neutral-700">{category.name}</h3>
                  <div className="grid gap-2">
                    {category.services.map((service: Service) => {
                      const selected = selectedServiceIds.includes(service.id)
                      return (
                        <button
                          key={service.id}
                          onClick={() => toggleService(service.id)}
                          className={`flex items-start justify-between gap-3 rounded-md border p-3 text-left transition ${
                            selected
                              ? "border-neutral-950 bg-neutral-950 text-white"
                              : "border-[#ebebeb] bg-white text-neutral-950 hover:bg-neutral-50"
                          }`}
                        >
                          <span className="min-w-0">
                            <span className="block text-sm font-semibold">{service.name}</span>
                            {service.description && (
                              <span className={`mt-1 block text-xs leading-5 ${selected ? "text-white/70" : "text-neutral-500"}`}>
                                {service.description}
                              </span>
                            )}
                            <span className={`mt-2 inline-flex items-center gap-3 text-xs ${selected ? "text-white/80" : "text-neutral-500"}`}>
                              <span>{service.duration_minutes} min</span>
                              <span>Rs {Number(service.min_price || 0).toFixed(0)}</span>
                            </span>
                          </span>
                          <span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${selected ? "border-white bg-white text-neutral-950" : "border-neutral-300"}`}>
                            {selected && <Check className="h-3.5 w-3.5" />}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="app-card p-5">
            <h2 className="text-base font-semibold text-neutral-950">Reviews</h2>
            <div className="mt-4 grid gap-3">
              {(reviews?.items ?? []).length === 0 ? (
                <p className="text-sm text-neutral-500">No reviews yet.</p>
              ) : (
                reviews?.items.map((review) => (
                  <div key={review.id} className="rounded-md border border-[#ebebeb] bg-neutral-50 p-3">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold text-neutral-950">{review.customer_name || "Customer"}</p>
                      <span className="inline-flex items-center gap-1 text-sm font-semibold text-neutral-700">
                        <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                        {review.rating}
                      </span>
                    </div>
                    {review.comment && <p className="mt-2 text-sm leading-5 text-neutral-600">{review.comment}</p>}
                  </div>
                ))
              )}
            </div>
          </section>
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="app-card-elevated p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <p className="mono-label">appointment</p>
                <h2 className="text-lg font-semibold text-neutral-950">Book a slot</h2>
              </div>
              <Scissors className="h-5 w-5 text-neutral-500" />
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-neutral-700">Branch</label>
                <select
                  value={activeBranchId}
                  onChange={(event) => {
                    setSelectedBranchId(event.target.value)
                    setSelectedSlot(null)
                  }}
                  className="w-full rounded-md border border-[#d4d4d4] bg-white px-3 py-2.5 text-sm outline-none focus:border-transparent focus:ring-2 focus:ring-neutral-950"
                >
                  {branches.map((branch) => (
                    <option key={branch.id} value={branch.id}>
                      {branch.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-neutral-700">Date</label>
                <input
                  type="date"
                  min={today()}
                  value={bookingDate}
                  onChange={(event) => {
                    setBookingDate(event.target.value)
                    setSelectedSlot(null)
                  }}
                  className="w-full rounded-md border border-[#d4d4d4] bg-white px-3 py-2.5 text-sm outline-none focus:border-transparent focus:ring-2 focus:ring-neutral-950"
                />
              </div>

              <div className="rounded-md border border-[#ebebeb] bg-neutral-50 p-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-neutral-500">Selected services</span>
                  <span className="font-semibold text-neutral-950">{selectedServices.length}</span>
                </div>
                <div className="mt-2 flex items-center justify-between text-sm">
                  <span className="inline-flex items-center gap-1.5 text-neutral-500">
                    <Clock className="h-4 w-4" />
                    Duration
                  </span>
                  <span className="font-semibold text-neutral-950">{totalDuration || 0} min</span>
                </div>
                <div className="mt-2 flex items-center justify-between text-sm">
                  <span className="text-neutral-500">Estimated total</span>
                  <span className="font-semibold text-neutral-950">Rs {totalPrice.toFixed(0)}</span>
                </div>
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label className="block text-sm font-medium text-neutral-700">Available times</label>
                  {slotsLoading && <Loader2 className="h-4 w-4 animate-spin text-neutral-500" />}
                </div>
                {selectedServiceIds.length === 0 ? (
                  <p className="rounded-md border border-dashed border-[#d4d4d4] p-3 text-sm text-neutral-500">
                    Select at least one service to see slots.
                  </p>
                ) : slotChoices.length === 0 && !slotsLoading ? (
                  <p className="rounded-md border border-dashed border-[#d4d4d4] p-3 text-sm text-neutral-500">
                    No slots available for this date and branch.
                  </p>
                ) : (
                  <div className="grid max-h-64 grid-cols-2 gap-2 overflow-y-auto pr-1">
                    {slotChoices.map((slot) => {
                      const selected =
                        selectedSlot?.start_time === slot.start_time &&
                        selectedSlot?.employee_id === slot.employee_id
                      return (
                        <button
                          key={`${slot.employee_id}-${slot.start_time}`}
                          onClick={() => setSelectedSlot(slot)}
                          className={`rounded-md border px-3 py-2 text-left text-sm transition ${
                            selected
                              ? "border-neutral-950 bg-neutral-950 text-white"
                              : "border-[#ebebeb] bg-white text-neutral-700 hover:bg-neutral-50 hover:text-neutral-950"
                          }`}
                        >
                          <span className="block font-semibold">{formatTime(slot.start_time)}</span>
                          <span className={`block truncate text-xs ${selected ? "text-white/70" : "text-neutral-500"}`}>
                            {slot.employee_name || "Any specialist"}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-neutral-700">Notes</label>
                <textarea
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  rows={3}
                  placeholder="Any preference or detail for the business"
                  className="w-full resize-none rounded-md border border-[#d4d4d4] bg-white px-3 py-2.5 text-sm outline-none focus:border-transparent focus:ring-2 focus:ring-neutral-950"
                />
              </div>

              {bookingMutation.error && (
                <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-600">
                  {bookingMutation.error instanceof Error ? bookingMutation.error.message : "Could not create booking."}
                </div>
              )}
              {successMessage && (
                <div className="rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
                  {successMessage}
                </div>
              )}

              <button
                onClick={handleBook}
                disabled={!selectedSlot || selectedServiceIds.length === 0 || bookingMutation.isPending}
                className="flex w-full items-center justify-center gap-2 rounded-full bg-neutral-950 px-4 py-2.5 text-sm font-medium text-white shadow-vercel-sm transition hover:bg-neutral-900 disabled:opacity-60"
              >
                {bookingMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Booking
                  </>
                ) : (
                  <>
                    <Calendar className="h-4 w-4" />
                    {isAuthenticated ? "Confirm booking" : "Login to book"}
                  </>
                )}
              </button>

              <Link
                to="/customer/bookings"
                className="flex items-center justify-center gap-2 text-sm font-medium text-neutral-600 hover:text-neutral-950"
              >
                <MessageSquare className="h-4 w-4" />
                Manage existing bookings
              </Link>
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}
