import { useMemo, useState } from "react"
import { Link, useLocation, useNavigate, useParams } from "react-router-dom"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  ArrowLeft,
  BadgeCheck,
  Calendar,
  Check,
  Loader2,
  MapPin,
  Phone,
  Search,
  Share2,
  Star,
  Users,
  X
} from "lucide-react"
import { motion } from "motion/react"
import heroFallback from "../../assets/hero.png"
import { createCustomerBookingApi } from "../../api/customer.api"
import { getPublicGalleryApi } from "../../api/gallery.api"
import ThreeDotsLoader from "../../components/common/ThreeDotsLoader"
import {
  getPublicBusinessApi,
  getPublicSlotsApi,
  listPublicBranchesApi,
  listPublicReviewsApi,
  listPublicServicesApi,
  searchPublicBusinessesApi
} from "../../api/public.api"
import { formatDate, formatTime, today } from "../../lib/date"
import { useAuthStore } from "../../store/auth.store"
import type {
  Branch,
  PublicBusiness,
  PublicServiceCategory,
  Service,
  SlotResult
} from "../../types"

type SlotChoice = {
  employee_id: string | null
  employee_name?: string
  start_time: string
  end_time: string
}

const dayLabels = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]

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
    queryFn: () => listPublicReviewsApi(businessIdOrSlug, { limit: 32 }),
    enabled: Boolean(businessIdOrSlug)
  })

  const { data: gallery = [] } = useQuery({
    queryKey: ["public-gallery", businessIdOrSlug],
    queryFn: () => getPublicGalleryApi(businessIdOrSlug),
    enabled: Boolean(businessIdOrSlug)
  })

  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null)

  const { data: nearbyBusinessesData } = useQuery({
    queryKey: ["public-nearby", business?.id, business?.city, business?.business_type],
    queryFn: () =>
      searchPublicBusinessesApi({
        city: business?.city || undefined,
        type: business?.business_type || undefined,
        limit: 8
      }),
    enabled: Boolean(business?.city)
  })

  const activeBranchId = selectedBranchId || branches[0]?.id || ""
  const activeBranch = useMemo(
    () => branches.find((branch) => branch.id === activeBranchId) || branches[0],
    [activeBranchId, branches]
  )

  const flatServices = useMemo(
    () => categories.flatMap((category: PublicServiceCategory) => category.services ?? []),
    [categories]
  )

  const selectedServices = flatServices.filter((service) => selectedServiceIds.includes(service.id))
  const totalDuration = selectedServices.reduce((sum, service) => sum + Number(service.duration_minutes || 0), 0)
  const totalPrice = selectedServices.reduce((sum, service) => sum + Number(service.min_price || 0), 0)

  const teamMembers = useMemo(() => {
    const map = new Map<string, { id: string; name: string; photo: string | null }>()

    flatServices.forEach((service) => {
      service.employees.forEach((employee) => {
        if (!map.has(employee.employee_id)) {
          map.set(employee.employee_id, {
            id: employee.employee_id,
            name: employee.employee_name,
            photo: employee.profile_photo_url
          })
        }
      })
    })

    return Array.from(map.values()).slice(0, 10)
  }, [flatServices])

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

  const uniqueStartTimes = useMemo(() => {
    const timesMap = new Map<
      string,
      { start_time: string; end_time: string; employees: { id: string | null; name: string }[] }
    >()

    slotResults.forEach((result: SlotResult) => {
      result.slots.forEach((slot) => {
        const existing = timesMap.get(slot.start_time)
        if (existing) {
          existing.employees.push({
            id: result.employee_id,
            name: result.employee_name || "Specialist"
          })
          return
        }

        timesMap.set(slot.start_time, {
          start_time: slot.start_time,
          end_time: slot.end_time,
          employees: [
            {
              id: result.employee_id,
              name: result.employee_name || "Specialist"
            }
          ]
        })
      })
    })

    return Array.from(timesMap.values()).sort((a, b) => a.start_time.localeCompare(b.start_time))
  }, [slotResults])

  const ratingBreakdown = useMemo(() => {
    const buckets: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
    const items = reviews?.items ?? []

    items.forEach((review) => {
      const rating = Number(review.rating)
      if (rating >= 1 && rating <= 5) {
        buckets[rating] += 1
      }
    })

    const total = items.length
    return [5, 4, 3, 2, 1].map((rating) => {
      const count = buckets[rating]
      return {
        rating,
        count,
        percentage: total > 0 ? Math.round((count / total) * 100) : 0
      }
    })
  }, [reviews?.items])

  const nearbyBusinesses = useMemo(() => {
    const items = nearbyBusinessesData?.items ?? []
    return items.filter((item) => item.id !== business?.id).slice(0, 4)
  }, [nearbyBusinessesData?.items, business?.id])

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
      setSuccessMessage("Booking confirmed! You can manage it from My bookings.")
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

  // Conversion-optimizing Dynamic CTA State Builder
  const getCtaState = () => {
    if (selectedServiceIds.length === 0) {
      return {
        text: "Select Service First",
        action: () => {
          document.getElementById("services")?.scrollIntoView({ behavior: "smooth", block: "center" })
        },
        className: "border-midnight-ink bg-white text-midnight-ink hover:bg-midnight-ink hover:text-white"
      }
    }
    if (!selectedSlot) {
      return {
        text: "Choose Time Slot",
        action: () => {
          document.getElementById("available-times")?.scrollIntoView({ behavior: "smooth", block: "center" })
        },
        className: "border-midnight-ink bg-white text-midnight-ink hover:bg-midnight-ink hover:text-white"
      }
    }
    return {
      text: isAuthenticated ? "Confirm Booking" : "Login to Book",
      action: handleBook,
      className: "bg-midnight-ink border-midnight-ink text-white hover:bg-white hover:text-midnight-ink"
    }
  }

  const ctaState = getCtaState()

  if (businessLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <ThreeDotsLoader color="bg-midnight-ink" size="w-3 h-3" />
      </div>
    )
  }

  if (!business) {
    return (
      <div className="rounded-[12px] border border-soft-mist bg-white p-8 text-center animate-fade-in-down">
        <p className="text-base font-semibold text-midnight-ink">Business not found.</p>
        <Link to="/customer" className="mt-3 inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.045em] text-midnight-ink hover:underline">
          <ArrowLeft className="h-4 w-4" />
          Back to explore
        </Link>
      </div>
    )
  }

  const heroImages = [
    business.cover_url || heroFallback,
    teamMembers[0]?.photo || business.logo_url || heroFallback,
    teamMembers[1]?.photo || business.cover_url || heroFallback
  ]

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-16">
      {/* Back button */}
      <div className="flex items-center justify-between">
        <Link to="/customer" className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.045em] text-olive-stone hover:text-midnight-ink">
          <ArrowLeft className="h-4 w-4" />
          Back to explore
        </Link>
        <button className="btn-outline text-[11px] py-1.5 px-3.5">
          <Share2 className="h-3.5 w-3.5 mr-1" />
          Share
        </button>
      </div>

      {/* ── 1. HERO SECTION ── */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="rounded-[12px] border border-soft-mist bg-white p-5 space-y-5"
      >
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-soft-mist pb-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="truncate text-2xl font-bold tracking-tight text-midnight-ink sm:text-3xl">{business.name}</h1>
              {business.is_verified && <BadgeCheck className="h-5 w-5 text-emerald-600" />}
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-3 text-xs font-semibold uppercase tracking-[0.045em] text-olive-stone">
              <span className="inline-flex items-center gap-1 border border-soft-mist bg-white px-2.5 py-1 text-midnight-ink rounded-[8px]">
                <Star className="h-3.5 w-3.5 fill-midnight-ink text-midnight-ink" />
                {Number(business.average_rating || 0).toFixed(1)}
              </span>
              <span>{business.review_count} reviews</span>
              {business.city && (
                <span className="inline-flex items-center gap-1 normal-case">
                  <MapPin className="h-3.5 w-3.5 text-olive-stone" />
                  {business.city}
                </span>
              )}
            </div>
          </div>

          {/* Quick sticky primary Dynamic CTA Button */}
          <button
            onClick={ctaState.action}
            disabled={bookingMutation.isPending}
            className={`inline-flex items-center gap-2 rounded-[8px] px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.045em] border transition duration-150 active:scale-95 cursor-pointer ${ctaState.className}`}
          >
            {bookingMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Calendar className="h-4 w-4" />}
            {ctaState.text}
          </button>
        </div>

        {/* Gallery grid images */}
        <div className="grid gap-3 grid-cols-3">
          {heroImages.map((image, index) => (
            <div key={`${image}-${index}`} className="aspect-[16/11] overflow-hidden rounded-[12px] bg-white border border-soft-mist">
              <img src={image || heroFallback} alt={business.name} className="h-full w-full object-cover transition hover:scale-103 duration-300" />
            </div>
          ))}
        </div>
      </motion.section>

      {/* ── 2. BOOK APPOINTMENT CARD (Pushed to absolute top flow) ── */}
      <section className="rounded-[12px] border border-soft-mist bg-white p-5 space-y-5">
        <div className="flex items-center justify-between border-b border-soft-mist pb-3">
          <div>
            <p className="text-[10px] text-olive-stone uppercase tracking-widest font-bold">Appointment</p>
            <h2 className="text-lg font-bold text-midnight-ink">Book Appointment</h2>
          </div>
          {slotsLoading && <Loader2 className="h-4 w-4 animate-spin text-olive-stone" />}
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="mb-1.5 block text-xs font-bold text-olive-stone uppercase tracking-wider">Select Branch</label>
            <select
              value={activeBranchId}
              onChange={(e) => {
                setSelectedBranchId(e.target.value)
                setSelectedSlot(null)
              }}
              className="w-full rounded-[8px] border border-soft-mist bg-white px-4 py-2.5 text-xs outline-none focus:border-midnight-ink transition-all font-semibold"
            >
              {branches.map((branch: Branch) => (
                <option key={branch.id} value={branch.id}>
                  {branch.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-bold text-olive-stone uppercase tracking-wider">Select Date</label>
            <input
              type="date"
              min={today()}
              value={bookingDate}
              onChange={(e) => {
                setBookingDate(e.target.value)
                setSelectedSlot(null)
              }}
              className="w-full rounded-[8px] border border-soft-mist bg-white px-4 py-2.5 text-xs outline-none focus:border-midnight-ink transition-all font-semibold"
            />
          </div>
        </div>

        {/* Selected Summary Details */}
        <div className="rounded-[12px] bg-white border border-soft-mist p-4 space-y-2.5">
          <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-[0.045em]">
            <span className="text-olive-stone">Selected Services</span>
            <span className="text-midnight-ink bg-white px-2.5 py-1 rounded-[8px] border border-soft-mist">
              {selectedServices.length} Selected
            </span>
          </div>
          <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-[0.045em]">
            <span className="text-olive-stone">Total Duration</span>
            <span className="text-midnight-ink">{totalDuration || 0} min</span>
          </div>
          <div className="flex items-center justify-between text-xs font-semibold pt-2.5 border-t border-soft-mist">
            <span className="text-olive-stone font-bold uppercase tracking-[0.045em]">Estimated Cost</span>
            <span className="text-sm font-bold text-midnight-ink">Rs {totalPrice.toFixed(0)}</span>
          </div>
        </div>

        {/* Dynamic CTA Box button */}
        <div className="space-y-3">
          <button
            onClick={ctaState.action}
            disabled={bookingMutation.isPending}
            className={`w-full py-3.5 rounded-[8px] text-xs font-semibold uppercase tracking-[0.045em] border transition duration-200 flex items-center justify-center gap-2 active:scale-97 cursor-pointer ${ctaState.className}`}
          >
            {bookingMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Calendar className="h-4 w-4" />}
            {ctaState.text}
          </button>

          {bookingMutation.error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-[8px] text-xs font-medium">
              {bookingMutation.error instanceof Error ? bookingMutation.error.message : "Could not create booking."}
            </div>
          )}

          {successMessage && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-[8px] text-xs font-bold">
              {successMessage}
            </div>
          )}
        </div>
      </section>

      {/* ── 3. SERVICES SECTION ── */}
      <section id="services" className="rounded-[12px] border border-soft-mist bg-white p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-soft-mist pb-3">
          <div>
            <p className="text-[10px] text-olive-stone uppercase tracking-widest font-bold">Service Menu</p>
            <h2 className="text-lg font-bold text-midnight-ink">Services Checklist</h2>
          </div>
          {servicesLoading && <Loader2 className="h-4.5 w-4.5 animate-spin text-olive-stone" />}
        </div>

        <div className="space-y-6">
          {categories.map((category) => (
            <div key={category.id || "uncategorized"} className="space-y-2.5">
              <h3 className="text-xs font-extrabold text-olive-stone uppercase tracking-wider">{category.name}</h3>
              <div className="grid gap-3">
                {category.services.map((service: Service) => {
                  const isChecked = selectedServiceIds.includes(service.id)
                  return (
                    <button
                      key={service.id}
                      onClick={() => toggleService(service.id)}
                      className={`w-full rounded-[12px] border p-4 text-left transition duration-200 cursor-pointer ${isChecked
                          ? "border-midnight-ink bg-soft-mist/20"
                          : "border-soft-mist bg-white hover:bg-soft-mist/10"
                        }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-midnight-ink">{service.name}</p>
                          <p className="mt-0.5 text-[10px] font-semibold text-olive-stone uppercase tracking-[0.045em]">{service.duration_minutes} min</p>
                          {service.description && (
                            <p className="mt-2 text-xs leading-relaxed text-olive-stone">{service.description}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-bold text-midnight-ink">Rs {Number(service.min_price || 0).toFixed(0)}</span>
                          <span className={`h-5 w-5 rounded-[8px] border flex items-center justify-center transition-all ${isChecked ? "bg-midnight-ink border-midnight-ink text-white" : "border-soft-mist"
                            }`}>
                            {isChecked && <Check className="h-3 w-3" />}
                          </span>
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── 4. AVAILABLE TIMES SLOTS SECTION ── */}
      <section id="available-times" className="rounded-[12px] border border-soft-mist bg-white p-5 space-y-4">
        <div>
          <p className="text-[10px] text-olive-stone uppercase tracking-widest font-bold">Timing Selection</p>
          <h2 className="text-lg font-bold text-midnight-ink">Available Times</h2>
        </div>

        {selectedServiceIds.length === 0 ? (
          <p className="rounded-[12px] border border-dashed border-soft-mist p-4 text-xs font-semibold text-olive-stone text-center bg-white">
            Please check / select at least one service above to unlock slot timings.
          </p>
        ) : uniqueStartTimes.length === 0 && !slotsLoading ? (
          <p className="rounded-[12px] border border-dashed border-soft-mist p-4 text-xs font-semibold text-olive-stone text-center bg-white">
            No slot times available for selected services on this date.
          </p>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {uniqueStartTimes.map((timeInfo) => {
                const isSelected = selectedSlot?.start_time === timeInfo.start_time
                return (
                  <button
                    key={timeInfo.start_time}
                    onClick={() => {
                      setSelectedSlot({
                        employee_id: null,
                        employee_name: "Any specialist",
                        start_time: timeInfo.start_time,
                        end_time: timeInfo.end_time
                      })
                    }}
                    className={`rounded-[8px] border py-2.5 text-center text-[11px] font-semibold uppercase tracking-[0.045em] transition duration-200 cursor-pointer ${isSelected
                        ? "bg-midnight-ink border-midnight-ink text-white"
                        : "bg-white border-soft-mist text-olive-stone hover:border-midnight-ink hover:text-midnight-ink"
                      }`}
                  >
                    {formatTime(timeInfo.start_time)}
                  </button>
                )
              })}
            </div>

            {/* Specialist Preference dropdown inside timing context */}
            {selectedSlot && (
              <div className="rounded-[12px] bg-white p-4 border border-soft-mist space-y-2">
                <label className="block text-[10px] font-bold text-olive-stone uppercase tracking-wider">
                  Specialist Preference
                </label>
                <div className="grid sm:grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedSlot({ ...selectedSlot, employee_id: null, employee_name: "Any specialist" })}
                    className={`flex items-center justify-between rounded-[8px] border px-4 py-2.5 text-xs font-semibold transition cursor-pointer ${selectedSlot.employee_id === null
                        ? "bg-midnight-ink border-midnight-ink text-white"
                        : "bg-white border-soft-mist text-olive-stone hover:border-midnight-ink"
                      }`}
                  >
                    <span>Any Specialist</span>
                    {selectedSlot.employee_id === null && <Check className="h-3.5 w-3.5" />}
                  </button>

                  {uniqueStartTimes
                    .find((item) => item.start_time === selectedSlot.start_time)
                    ?.employees.map((employee) => {
                      const isChosen = selectedSlot.employee_id === employee.id
                      return (
                        <button
                          key={employee.id || "any"}
                          type="button"
                          onClick={() => setSelectedSlot({ ...selectedSlot, employee_id: employee.id, employee_name: employee.name })}
                          className={`flex items-center justify-between rounded-[8px] border px-4 py-2.5 text-xs font-semibold transition cursor-pointer ${isChosen
                              ? "bg-midnight-ink border-midnight-ink text-white"
                              : "bg-white border-soft-mist text-olive-stone hover:border-midnight-ink"
                            }`}
                        >
                          <span>{employee.name}</span>
                          {isChosen && <Check className="h-3.5 w-3.5" />}
                        </button>
                      )
                    })}
                </div>
              </div>
            )}

            {/* Notes input */}
            <div className="space-y-1.5 pt-2">
              <label className="block text-xs font-bold text-olive-stone uppercase tracking-wider">Booking Notes (Optional)</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder="Any specific instructions or preferences for your booking..."
                className="w-full resize-none rounded-[8px] border border-soft-mist bg-white px-4 py-3 text-xs outline-none focus:border-midnight-ink transition-all font-medium text-midnight-ink"
              />
            </div>
          </div>
        )}
      </section>

      {/* ── 5. REVIEWS SECTION ── */}
      <section id="reviews" className="rounded-[12px] border border-soft-mist bg-white p-5 space-y-4">
        <div>
          <p className="text-[10px] text-olive-stone uppercase tracking-widest font-bold">Feedback</p>
          <h2 className="text-lg font-bold text-midnight-ink">Reviews &amp; Ratings</h2>
        </div>

        <div className="grid gap-5 md:grid-cols-[220px_1fr]">
          <div className="rounded-[12px] border border-soft-mist bg-white p-4 flex flex-col items-center justify-center text-center">
            <p className="text-4xl font-extrabold text-midnight-ink tracking-tight">
              {Number(business.average_rating || 0).toFixed(1)}
            </p>
            <p className="mt-1 text-[10px] font-bold text-olive-stone uppercase tracking-[0.045em]">{reviews?.total || 0} Reviews</p>
            <div className="mt-4 space-y-1.5 w-full">
              {ratingBreakdown.map((bucket) => (
                <div key={bucket.rating} className="grid grid-cols-[12px_1fr_12px] items-center gap-2 text-[10px] font-bold text-olive-stone uppercase tracking-[0.045em]">
                  <span>{bucket.rating}</span>
                  <div className="h-1.5 overflow-hidden rounded-[8px] bg-soft-mist/40">
                    <div className="h-full bg-midnight-ink" style={{ width: `${bucket.percentage}%` }} />
                  </div>
                  <span>{bucket.count}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
            {(reviews?.items ?? []).slice(0, 8).map((review) => (
              <div key={review.id} className="rounded-[12px] border border-soft-mist p-4 space-y-1 bg-white">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-xs font-bold text-midnight-ink">{review.customer_name || "Verified Customer"}</p>
                    <p className="text-[10px] text-olive-stone font-medium">{formatDate(review.created_at.slice(0, 10))}</p>
                  </div>
                  <span className="inline-flex items-center gap-1 border border-soft-mist bg-white px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.045em] text-midnight-ink rounded-[8px]">
                    <Star className="h-3 w-3 fill-midnight-ink text-midnight-ink" />
                    {review.rating}
                  </span>
                </div>
                {review.comment && <p className="text-xs text-olive-stone leading-relaxed pt-1">{review.comment}</p>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 6. WORKSPACE PORTFOLIO GALLERY ── */}
      {gallery && gallery.length > 0 && (
        <section className="rounded-[12px] border border-soft-mist bg-white p-5 space-y-3">
          <div>
            <p className="text-[10px] text-olive-stone uppercase tracking-widest font-bold">Showcase</p>
            <h2 className="text-lg font-bold text-midnight-ink">Workspace Portfolio</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {gallery.map((photo) => (
              <div
                key={photo.id}
                onClick={() => setLightboxUrl(photo.url)}
                className="aspect-[4/3] rounded-[12px] overflow-hidden border border-soft-mist cursor-pointer group relative"
              >
                <img
                  src={photo.url}
                  alt="Portfolio showcase"
                  className="h-full w-full object-cover group-hover:scale-105 transition duration-300"
                />
                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition duration-200 flex items-center justify-center">
                  <span className="text-[9px] text-white font-semibold bg-midnight-ink px-2.5 py-1 rounded-[8px] uppercase tracking-[0.045em]">
                    Zoom
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── 7. ABOUT SECTION ── */}
      <section id="about" className="rounded-[12px] border border-soft-mist bg-white p-5 space-y-4">
        <div>
          <p className="text-[10px] text-olive-stone uppercase tracking-widest font-bold">Contact &amp; Bio</p>
          <h2 className="text-lg font-bold text-midnight-ink">About the Business</h2>
        </div>
        <div className="grid md:grid-cols-[280px_1fr] gap-4">
          <div className="rounded-[12px] border border-soft-mist bg-white p-4 space-y-3">
            <h3 className="text-xs font-bold text-midnight-ink border-b border-soft-mist pb-1.5 uppercase tracking-[0.045em]">Direct Contacts</h3>
            <div className="space-y-2 text-xs font-semibold text-olive-stone">
              {business.phone && (
                <p className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-olive-stone" />
                  {business.phone}
                </p>
              )}
              {business.email && <p className="truncate">{business.email}</p>}
              {activeBranch?.address && (
                <p className="flex items-start gap-2">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-olive-stone" />
                  {activeBranch.address}
                </p>
              )}
            </div>
          </div>
          <div className="flex flex-col justify-center">
            <p className="text-xs leading-relaxed text-olive-stone">
              {business.description || "This curated studio offers top-tier specialists, high quality raw products, and a calm, quiet atmosphere designed to yield premium appointment results."}
            </p>
          </div>
        </div>
      </section>

      {/* ── 8. HOURS & ADDRESS MAP ── */}
      <section id="hours" className="rounded-[12px] border border-soft-mist bg-white p-5 space-y-4">
        <div>
          <p className="text-[10px] text-olive-stone uppercase tracking-widest font-bold">Operations</p>
          <h2 className="text-lg font-bold text-midnight-ink">Working Hours &amp; Location</h2>
        </div>
        <div className="grid md:grid-cols-[1fr_320px] gap-5">
          <div className="grid sm:grid-cols-2 gap-2">
            {dayLabels.map((day) => (
              <div key={day} className="flex items-center justify-between rounded-[8px] border border-soft-mist bg-white px-3.5 py-2.5">
                <span className="text-xs font-bold text-olive-stone uppercase tracking-[0.045em]">{day}</span>
                <span className="text-xs font-bold text-midnight-ink">
                  {activeBranch?.opening_time && activeBranch?.closing_time
                    ? `${formatTime(activeBranch.opening_time)} - ${formatTime(activeBranch.closing_time)}`
                    : "Closed"}
                </span>
              </div>
            ))}
          </div>

          <div className="rounded-[12px] border border-soft-mist bg-white p-4 flex flex-col justify-between space-y-4">
            <div>
              <p className="text-xs font-bold text-midnight-ink">{activeBranch?.name || "Main branch"}</p>
              <p className="mt-1 text-xs text-olive-stone">{activeBranch?.address || business.address || "Location coordinate mapping not available"}</p>
            </div>
            {activeBranch?.latitude !== null && activeBranch?.latitude !== undefined &&
              activeBranch?.longitude !== null && activeBranch?.longitude !== undefined ? (
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${activeBranch.latitude},${activeBranch.longitude}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-outline text-[11px] w-full py-2.5 px-4"
              >
                <MapPin className="h-4 w-4 text-midnight-ink mr-1" />
                Open Google Maps Map
              </a>
            ) : (
              <p className="text-xs text-olive-stone font-semibold flex items-center gap-1.5">
                <Search className="h-3.5 w-3.5" />
                Coords listed on checkout picker
              </p>
            )}
          </div>
        </div>
      </section>

      {/* ── 9. MEET THE TEAM SECTION ── */}
      <section id="team" className="rounded-[12px] border border-soft-mist bg-white p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-soft-mist pb-3">
          <div>
            <p className="text-[10px] text-olive-stone uppercase tracking-widest font-bold">Specialists</p>
            <h2 className="text-lg font-bold text-midnight-ink">Meet the Team</h2>
          </div>
          <Users className="h-4.5 w-4.5 text-olive-stone" />
        </div>
        {teamMembers.length === 0 ? (
          <p className="text-xs text-olive-stone font-semibold text-center py-4">
            Team specialist profiles will appear here once service schedules are configured.
          </p>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-4">
            {teamMembers.map((member) => (
              <div key={member.id} className="text-center space-y-2">
                {member.photo ? (
                  <img src={member.photo} alt={member.name} className="mx-auto h-16 w-16 rounded-full object-cover border-2 border-white shadow-sm" />
                ) : (
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-soft-mist/40 text-xs font-bold text-midnight-ink">
                    {initials(member.name)}
                  </div>
                )}
                <p className="truncate text-[10px] font-bold text-midnight-ink uppercase tracking-[0.045em]">{member.name}</p>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── 10. OTHER SALONS NEARBY (Moved safely to the very bottom to avoid losing customer conversion) ── */}
      <section className="rounded-[12px] border border-soft-mist bg-white p-5 space-y-4">
        <div>
          <p className="text-[10px] text-olive-stone uppercase tracking-widest font-bold">Recommendations</p>
          <h2 className="text-lg font-bold text-midnight-ink">Other Salons Nearby</h2>
        </div>
        {nearbyBusinesses.length === 0 ? (
          <p className="text-xs text-olive-stone font-semibold text-center">No nearby recommendations yet.</p>
        ) : (
          <div className="grid sm:grid-cols-2 gap-4">
            {nearbyBusinesses.map((item: PublicBusiness) => (
              <Link
                key={item.id}
                to={`/customer/businesses/${item.slug || item.id}`}
                className="flex items-center gap-3.5 rounded-[12px] border border-soft-mist bg-white p-3.5 transition hover:bg-soft-mist/10"
              >
                <img
                  src={item.cover_url || item.logo_url || heroFallback}
                  alt={item.name}
                  className="h-16 w-20 rounded-xl object-cover shrink-0"
                />
                <div className="min-w-0">
                  <p className="truncate text-xs font-bold text-midnight-ink">{item.name}</p>
                  <p className="truncate text-[10px] text-olive-stone font-semibold">{item.address || item.city || "Address not listed"}</p>
                  <p className="mt-1 inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-[0.045em] text-midnight-ink border border-soft-mist px-2 py-0.5 rounded-[8px]">
                    <Star className="h-3 w-3 fill-midnight-ink text-midnight-ink" />
                    {Number(item.average_rating || 0).toFixed(1)} &bull; {item.review_count} reviews
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Fullscreen Lightbox Preview Overlay */}
      {lightboxUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 transition duration-300 animate-fade-in"
          onClick={() => setLightboxUrl(null)}
        >
          <button
            type="button"
            className="absolute top-6 right-6 text-white hover:text-gray-300 p-2 cursor-pointer bg-white/10 hover:bg-white/20 rounded-full transition"
            onClick={() => setLightboxUrl(null)}
          >
            <X className="h-5 w-5" />
          </button>
          <img
            src={lightboxUrl}
            alt="Workspace Portfolio Showcase Preview"
            className="max-w-full max-h-[95vh] object-contain rounded-xl shadow-2xl transition duration-500 scale-98 sm:scale-100"
          />
        </div>
      )}
    </div>
  )
}

function initials(name: string) {
  const chunks = name.trim().split(/\s+/).filter(Boolean)
  if (chunks.length === 0) return "NA"
  if (chunks.length === 1) return chunks[0].slice(0, 2).toUpperCase()
  return `${chunks[0][0] ?? ""}${chunks[1][0] ?? ""}`.toUpperCase()
}
