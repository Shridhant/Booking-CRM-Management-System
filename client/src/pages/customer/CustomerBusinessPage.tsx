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

type SectionTab = "about" | "services" | "hours" | "team" | "reviews"

const sectionTabs: { id: SectionTab; label: string }[] = [
  { id: "about", label: "About" },
  { id: "services", label: "Services" },
  { id: "hours", label: "Work hours & address" },
  { id: "team", label: "Meet the team" },
  { id: "reviews", label: "Reviews" }
]

const dayLabels = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]

export default function CustomerBusinessPage() {
  const { businessIdOrSlug = "" } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { isAuthenticated, user } = useAuthStore()

  const [activeTab, setActiveTab] = useState<SectionTab>("about")
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

  const jumpToSection = (id: SectionTab) => {
    setActiveTab(id)
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" })
  }

  if (businessLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <ThreeDotsLoader color="bg-[#e8b9c5]" size="w-3 h-3" />
      </div>
    )
  }

  if (!business) {
    return (
      <div className="rounded-[22px] border border-white/70 bg-white/80 p-8 text-center">
        <p className="text-base font-semibold text-neutral-900">Business not found.</p>
        <Link to="/customer" className="mt-3 inline-flex items-center gap-2 text-sm font-medium text-neutral-900 hover:underline">
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
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link to="/customer" className="inline-flex items-center gap-2 text-sm font-medium text-neutral-600 hover:text-neutral-950">
          <ArrowLeft className="h-4 w-4" />
          Back to explore
        </Link>
        <button className="inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/70 px-3 py-1.5 text-sm font-medium text-neutral-700 hover:bg-white">
          <Share2 className="h-4 w-4" />
          Share
        </button>
      </div>

      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="rounded-[28px] border border-white/70 bg-white/90 p-4 shadow-[0px_12px_26px_-16px_rgba(20,14,16,0.28)] sm:p-5"
      >
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[#f0e3e8] pb-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="truncate text-2xl font-semibold tracking-[-0.6px] text-neutral-900 sm:text-3xl">{business.name}</h1>
              {business.is_verified && <BadgeCheck className="h-5 w-5 text-emerald-600" />}
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-neutral-600">
              <span className="inline-flex items-center gap-1">
                <Star className="h-4 w-4 fill-[#e5a6bb] text-[#e5a6bb]" />
                {Number(business.average_rating || 0).toFixed(1)}
              </span>
              <span>{business.review_count} reviews</span>
              {business.city && (
                <span className="inline-flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  {business.city}
                </span>
              )}
            </div>
          </div>
          <button
            onClick={handleBook}
            disabled={!selectedSlot || selectedServiceIds.length === 0 || bookingMutation.isPending}
            className="inline-flex items-center gap-2 rounded-full bg-[#e8b9c5] px-5 py-2.5 text-sm font-medium text-neutral-900 transition hover:bg-[#e4acbc] disabled:opacity-60"
          >
            {bookingMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Calendar className="h-4 w-4" />}
            Book now
          </button>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {heroImages.map((image, index) => (
            <div key={`${image}-${index}`} className="aspect-[16/11] overflow-hidden rounded-[18px] bg-[#f2e6ea]">
              <img src={image || heroFallback} alt={business.name} className="h-full w-full object-cover" />
            </div>
          ))}
        </div>

        <div className="mt-5 overflow-x-auto">
          <div className="flex min-w-max items-center gap-2 border-b border-[#efe3e8] pb-1">
            {sectionTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => jumpToSection(tab.id)}
                className={`rounded-full px-4 py-2 text-sm font-medium transition ${activeTab === tab.id
                  ? "bg-neutral-900 text-white"
                  : "text-neutral-600 hover:bg-[#f7edf1] hover:text-neutral-900"
                  }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </motion.section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
        <div className="space-y-6">
          <section id="about" className="rounded-[22px] border border-white/70 bg-white/90 p-5 shadow-[0px_10px_22px_-18px_rgba(24,14,18,0.34)]">
            <div className="grid gap-4 md:grid-cols-[280px_minmax(0,1fr)]">
              <div className="rounded-[18px] border border-[#f0e3e8] bg-[#faf4f7] p-4">
                <h3 className="text-sm font-semibold text-neutral-900">Contact</h3>
                <div className="mt-3 space-y-2 text-sm text-neutral-600">
                  {business.phone && (
                    <p className="inline-flex items-center gap-2">
                      <Phone className="h-4 w-4 text-neutral-500" />
                      {business.phone}
                    </p>
                  )}
                  {business.email && <p>{business.email}</p>}
                  {activeBranch?.address && (
                    <p className="inline-flex items-start gap-2">
                      <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-neutral-500" />
                      {activeBranch.address}
                    </p>
                  )}
                </div>
              </div>
              <div>
                <h2 className="text-xl font-semibold tracking-[-0.4px] text-neutral-900">About</h2>
                <p className="mt-2 text-sm leading-6 text-neutral-600">
                  {business.description || "This salon offers curated services with trained specialists and a calm studio setup for repeatable results."}
                </p>
              </div>
            </div>

            {/* Showcase Gallery Portfolio */}
            {gallery && gallery.length > 0 && (
              <div className="mt-6 border-t border-[#f0e3e8] pt-5">
                <h3 className="text-base font-semibold tracking-[-0.28px] text-[#1c181a] mb-3">
                  Workspace Portfolio
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {gallery.map((photo) => (
                    <div
                      key={photo.id}
                      onClick={() => setLightboxUrl(photo.url)}
                      className="aspect-[4/3] rounded-xl overflow-hidden border border-[#f0e3e8] bg-[#fdfafb] cursor-pointer group relative shadow-[0_4px_12px_-6px_rgba(0,0,0,0.06)]"
                    >
                      <img
                        src={photo.url}
                        alt="Workspace showcase"
                        className="h-full w-full object-cover group-hover:scale-106 transition duration-500 ease-out"
                      />
                      <div className="absolute inset-0 bg-black/15 opacity-0 group-hover:opacity-100 transition duration-300 flex items-center justify-center">
                        <span className="text-[10px] text-white font-semibold bg-neutral-950/65 px-2.5 py-1 rounded-full backdrop-blur-xs">
                          Expand View
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>

          <section id="services" className="rounded-[22px] border border-white/70 bg-white/90 p-5 shadow-[0px_10px_22px_-18px_rgba(24,14,18,0.34)]">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold tracking-[-0.4px] text-neutral-900">Services</h2>
              {servicesLoading && <Loader2 className="h-4 w-4 animate-spin text-neutral-500" />}
            </div>
            <div className="space-y-5">
              {categories.map((category) => (
                <div key={category.id || "uncategorized"} className="space-y-2">
                  <h3 className="text-sm font-semibold text-neutral-700">{category.name}</h3>
                  {category.services.map((service: Service) => {
                    const selected = selectedServiceIds.includes(service.id)
                    return (
                      <button
                        key={service.id}
                        onClick={() => toggleService(service.id)}
                        className={`w-full rounded-[16px] border p-4 text-left transition ${selected
                          ? "border-[#dca6b7] bg-[#fff2f6]"
                          : "border-[#f0e3e8] bg-white hover:bg-[#fff9fb]"
                          }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-neutral-900">{service.name}</p>
                            <p className="mt-1 text-xs text-neutral-500">{service.duration_minutes} min</p>
                            {service.description && <p className="mt-2 text-sm leading-5 text-neutral-600">{service.description}</p>}
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-sm font-semibold text-neutral-900">Rs {Number(service.min_price || 0).toFixed(0)}</span>
                            <span
                              className={`flex h-5 w-5 items-center justify-center rounded-full border ${selected ? "border-[#c77f95] bg-[#e8b9c5] text-neutral-900" : "border-neutral-300"
                                }`}
                            >
                              {selected ? <Check className="h-3.5 w-3.5" /> : null}
                            </span>
                          </div>
                        </div>
                      </button>
                    )
                  })}
                </div>
              ))}
            </div>
          </section>

          <section id="hours" className="rounded-[22px] border border-white/70 bg-white/90 p-5 shadow-[0px_10px_22px_-18px_rgba(24,14,18,0.34)]">
            <h2 className="text-xl font-semibold tracking-[-0.4px] text-neutral-900">Work hours &amp; address</h2>
            <div className="mt-4 grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
              <div className="space-y-2">
                {dayLabels.map((day) => (
                  <div key={day} className="flex items-center justify-between rounded-md border border-[#f1e6ea] bg-[#faf5f7] px-3 py-2">
                    <span className="text-sm text-neutral-600">{day}</span>
                    <span className="text-sm font-medium text-neutral-900">
                      {activeBranch?.opening_time && activeBranch?.closing_time
                        ? `${formatTime(activeBranch.opening_time)} - ${formatTime(activeBranch.closing_time)}`
                        : "Hours not listed"}
                    </span>
                  </div>
                ))}
              </div>
              <div className="rounded-[16px] border border-[#f1e6ea] bg-gradient-to-br from-[#f6edf1] via-[#f2f4f8] to-[#eef3f8] p-4 flex flex-col justify-between">
                <div>
                  <p className="text-sm font-semibold text-neutral-900">{activeBranch?.name || "Main branch"}</p>
                  <p className="mt-2 text-sm text-neutral-600">{activeBranch?.address || business.address || "Address not available"}</p>
                </div>
                {activeBranch?.latitude !== null && activeBranch?.latitude !== undefined &&
                 activeBranch?.longitude !== null && activeBranch?.longitude !== undefined ? (
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${activeBranch.latitude},${activeBranch.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-4 inline-flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-xl bg-white border border-[#f1e6ea] shadow-sm hover:shadow-md transition text-xs font-bold text-neutral-800 hover:text-neutral-950"
                  >
                    <MapPin className="h-4 w-4 text-[#e8b9c5]" />
                    Open in Google Maps
                  </a>
                ) : (
                  <p className="mt-2 inline-flex items-center gap-2 text-sm text-neutral-600">
                    <Search className="h-4 w-4" />
                    Coordinates available on map view
                  </p>
                )}
              </div>
            </div>
          </section>
          <section id="reviews" className="rounded-[22px] border border-white/70 bg-white/90 p-5 shadow-[0px_10px_22px_-18px_rgba(24,14,18,0.34)]">
            <h2 className="text-xl font-semibold tracking-[-0.4px] text-neutral-900">Reviews</h2>
            <div className="mt-4 grid gap-4 md:grid-cols-[220px_minmax(0,1fr)] xl:grid-cols-1">
              <div className="rounded-[16px] border border-[#f1e5ea] bg-[#faf5f7] p-4">
                <p className="text-4xl font-semibold tracking-[-1px] text-neutral-900">{Number(business.average_rating || 0).toFixed(1)}</p>
                <p className="mt-1 text-xs text-neutral-500">{reviews?.total || 0} reviews</p>
                <div className="mt-4 space-y-2">
                  {ratingBreakdown.map((bucket) => (
                    <div key={bucket.rating} className="grid grid-cols-[18px_minmax(0,1fr)_20px] items-center gap-2 text-xs text-neutral-600">
                      <span>{bucket.rating}</span>
                      <div className="h-1.5 overflow-hidden rounded-full bg-[#f0e3e8]">
                        <div className="h-full bg-[#e3a9bb]" style={{ width: `${bucket.percentage}%` }} />
                      </div>
                      <span>{bucket.count}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                {(reviews?.items ?? []).slice(0, 5).map((review) => (
                  <div key={review.id} className="rounded-[14px] border border-[#f1e5ea] bg-white p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold text-neutral-900">{review.customer_name || "Customer"}</p>
                        <p className="text-xs text-neutral-500">{formatDate(review.created_at.slice(0, 10))}</p>
                      </div>
                      <span className="inline-flex items-center gap-1 rounded-full bg-[#fff2f6] px-2 py-1 text-xs font-semibold text-neutral-700">
                        <Star className="h-3.5 w-3.5 fill-[#e5a6bb] text-[#e5a6bb]" />
                        {review.rating}
                      </span>
                    </div>
                    {review.comment && <p className="mt-2 text-sm leading-5 text-neutral-600">{review.comment}</p>}
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>

        <aside className="space-y-6 xl:sticky xl:top-24 xl:self-start">
          <section className="rounded-[22px] border border-white/70 bg-white/90 p-5 shadow-[0px_10px_22px_-18px_rgba(24,14,18,0.34)]">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="font-mono text-xs text-neutral-500">appointment</p>
                <h2 className="text-xl font-semibold tracking-[-0.4px] text-neutral-900">Book a slot</h2>
              </div>
              {slotsLoading ? <Loader2 className="h-5 w-5 animate-spin text-neutral-500" /> : null}
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
                  className="w-full rounded-full border border-[#eadde2] bg-white px-3 py-2.5 text-sm outline-none focus:border-transparent focus:ring-2 focus:ring-[#dca7b5]"
                >
                  {branches.map((branch: Branch) => (
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
                  className="w-full rounded-full border border-[#eadde2] bg-white px-3 py-2.5 text-sm outline-none focus:border-transparent focus:ring-2 focus:ring-[#dca7b5]"
                />
              </div>

              <div className="rounded-[14px] border border-[#f1e5ea] bg-[#faf5f7] p-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-neutral-500">Selected services</span>
                  <span className="font-semibold text-neutral-900">{selectedServices.length}</span>
                </div>
                <div className="mt-2 flex items-center justify-between text-sm">
                  <span className="inline-flex items-center gap-1.5 text-neutral-500">
                    <Clock className="h-4 w-4" />
                    Duration
                  </span>
                  <span className="font-semibold text-neutral-900">{totalDuration || 0} min</span>
                </div>
                <div className="mt-2 flex items-center justify-between text-sm">
                  <span className="text-neutral-500">Estimated total</span>
                  <span className="font-semibold text-neutral-900">Rs {totalPrice.toFixed(0)}</span>
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-neutral-700">Available times</label>
                {selectedServiceIds.length === 0 ? (
                  <p className="rounded-[14px] border border-dashed border-[#e6d8dd] p-3 text-sm text-neutral-500">
                    Select at least one service to see slots.
                  </p>
                ) : uniqueStartTimes.length === 0 && !slotsLoading ? (
                  <p className="rounded-[14px] border border-dashed border-[#e6d8dd] p-3 text-sm text-neutral-500">
                    No slots available for this date and branch.
                  </p>
                ) : (
                  <div className="space-y-3">
                    <div className="grid max-h-56 grid-cols-3 gap-2 overflow-y-auto pr-1">
                      {uniqueStartTimes.map((timeInfo) => {
                        const selected = selectedSlot?.start_time === timeInfo.start_time
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
                            className={`rounded-full border px-3 py-2 text-center text-sm transition ${selected
                              ? "border-[#d79aab] bg-[#e8b9c5] text-neutral-900"
                              : "border-[#ece0e5] bg-white text-neutral-700 hover:bg-[#fff5f8]"
                              }`}
                          >
                            {formatTime(timeInfo.start_time)}
                          </button>
                        )
                      })}
                    </div>

                    {selectedSlot ? (
                      <div className="rounded-[14px] border border-[#ece0e5] bg-white p-3">
                        <label className="mb-2 block text-xs font-semibold text-neutral-600">Specialist preference</label>
                        <div className="space-y-1.5">
                          <button
                            type="button"
                            onClick={() =>
                              setSelectedSlot({
                                ...selectedSlot,
                                employee_id: null,
                                employee_name: "Any specialist"
                              })
                            }
                            className={`flex w-full items-center justify-between rounded-md border px-2.5 py-2 text-left text-xs transition ${selectedSlot.employee_id === null
                              ? "border-[#d79aab] bg-[#fff2f6] text-neutral-900"
                              : "border-[#ece0e5] text-neutral-600 hover:bg-[#fff8fa]"
                              }`}
                          >
                            No preference
                            {selectedSlot.employee_id === null ? <Check className="h-3.5 w-3.5" /> : null}
                          </button>

                          {uniqueStartTimes
                            .find((item) => item.start_time === selectedSlot.start_time)
                            ?.employees.map((employee) => {
                              const isChosen = selectedSlot.employee_id === employee.id
                              return (
                                <button
                                  key={`${employee.id ?? "any"}-${employee.name}`}
                                  type="button"
                                  onClick={() =>
                                    setSelectedSlot({
                                      ...selectedSlot,
                                      employee_id: employee.id,
                                      employee_name: employee.name
                                    })
                                  }
                                  className={`flex w-full items-center justify-between rounded-md border px-2.5 py-2 text-left text-xs transition ${isChosen
                                    ? "border-[#d79aab] bg-[#fff2f6] text-neutral-900"
                                    : "border-[#ece0e5] text-neutral-600 hover:bg-[#fff8fa]"
                                    }`}
                                >
                                  {employee.name}
                                  {isChosen ? <Check className="h-3.5 w-3.5" /> : null}
                                </button>
                              )
                            })}
                        </div>
                      </div>
                    ) : null}
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
                  className="w-full resize-none rounded-[14px] border border-[#eadde2] bg-white px-3 py-2.5 text-sm outline-none focus:border-transparent focus:ring-2 focus:ring-[#dca7b5]"
                />
              </div>

              {bookingMutation.error ? (
                <div className="rounded-[14px] border border-red-200 bg-red-50 p-3 text-sm text-red-600">
                  {bookingMutation.error instanceof Error ? bookingMutation.error.message : "Could not create booking."}
                </div>
              ) : null}

              {successMessage ? (
                <div className="rounded-[14px] border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
                  {successMessage}
                </div>
              ) : null}

              <button
                onClick={handleBook}
                disabled={!selectedSlot || selectedServiceIds.length === 0 || bookingMutation.isPending}
                className="flex w-full items-center justify-center gap-2 rounded-full bg-neutral-950 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-neutral-900 disabled:opacity-60"
              >
                {bookingMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Calendar className="h-4 w-4" />}
                {isAuthenticated ? "Confirm booking" : "Login to book"}
              </button>

              <Link
                to="/customer/bookings"
                className="flex items-center justify-center gap-2 text-sm font-medium text-neutral-600 hover:text-neutral-900"
              >
                <MessageSquare className="h-4 w-4" />
                Manage existing bookings
              </Link>
            </div>
          </section>
          <section id="team" className="rounded-[22px] border border-white/70 bg-white/90 p-5 shadow-[0px_10px_22px_-18px_rgba(24,14,18,0.34)]">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold tracking-[-0.4px] text-neutral-900">Meet the team</h2>
              <Users className="h-5 w-5 text-neutral-400" />
            </div>
            {teamMembers.length === 0 ? (
              <p className="text-sm text-neutral-500">Specialist profiles will appear here once services are assigned.</p>
            ) : (
              <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 xl:grid-cols-3">
                {teamMembers.map((member) => (
                  <div key={member.id} className="text-center">
                    {member.photo ? (
                      <img src={member.photo} alt={member.name} className="mx-auto h-14 w-14 rounded-full object-cover ring-2 ring-white" />
                    ) : (
                      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#f3d8e2] text-sm font-semibold text-neutral-800">
                        {initials(member.name)}
                      </div>
                    )}
                    <p className="mt-2 truncate text-xs font-semibold text-neutral-800">{member.name}</p>
                  </div>
                ))}
              </div>
            )}
          </section>



          <section className="rounded-[22px] border border-white/70 bg-white/90 p-5 shadow-[0px_10px_22px_-18px_rgba(24,14,18,0.34)]">
            <h2 className="text-xl font-semibold tracking-[-0.4px] text-neutral-900">Other salons nearby</h2>
            {nearbyBusinesses.length === 0 ? (
              <p className="mt-3 text-sm text-neutral-500">No nearby recommendations yet.</p>
            ) : (
              <div className="mt-4 grid gap-3">
                {nearbyBusinesses.map((item: PublicBusiness) => (
                  <Link
                    key={item.id}
                    to={`/customer/businesses/${item.slug || item.id}`}
                    className="flex items-center gap-3 rounded-[14px] border border-[#f1e5ea] bg-white p-3 transition hover:bg-[#fff7fa]"
                  >
                    <img
                      src={item.cover_url || item.logo_url || heroFallback}
                      alt={item.name}
                      className="h-16 w-20 rounded-[10px] object-cover"
                    />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-neutral-900">{item.name}</p>
                      <p className="truncate text-xs text-neutral-500">{item.address || item.city || "Address not listed"}</p>
                      <p className="mt-1 inline-flex items-center gap-1 text-xs text-neutral-600">
                        <Star className="h-3.5 w-3.5 fill-[#e5a6bb] text-[#e5a6bb]" />
                        {Number(item.average_rating || 0).toFixed(1)} • {item.review_count} reviews
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>


        </aside>
      </div>

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
