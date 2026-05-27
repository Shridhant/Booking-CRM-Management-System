import { useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { ArrowRight, BadgeCheck, Loader2, MapPin, Search, SlidersHorizontal, Star } from "lucide-react"
import { motion } from "motion/react"
import { searchPublicBusinessesApi } from "../../api/public.api"

const businessTypes = [
  { label: "All", value: "" },
  { label: "Salon", value: "salon" },
  { label: "Spa", value: "spa" },
  { label: "Nails", value: "nail_studio" },
  { label: "Barber", value: "barber" },
  { label: "Makeup", value: "makeup_studio" },
  { label: "Professional", value: "professional" }
]

export default function CustomerExplorePage() {
  const [query, setQuery] = useState("")
  const [city, setCity] = useState("")
  const [type, setType] = useState("")

  const searchParams = useMemo(
    () => ({
      query: query.trim() || undefined,
      city: city.trim() || undefined,
      type: type || undefined,
      limit: 24
    }),
    [city, query, type]
  )

  const { data, isLoading, error } = useQuery({
    queryKey: ["public-businesses", searchParams],
    queryFn: () => searchPublicBusinessesApi(searchParams)
  })

  const businesses = data?.items ?? []

  return (
    <div className="space-y-7">
      <motion.section
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="rounded-[28px] border border-white/60 bg-[#f5e9ed] p-5 shadow-[0px_10px_24px_-16px_rgba(20,16,18,0.26)] md:p-6"
      >
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px] xl:items-end">
          <div>
            <p className="mb-3 font-mono text-xs text-neutral-500">discover and book</p>
            <h1 className="max-w-3xl text-3xl font-semibold leading-tight tracking-[-1px] text-neutral-900 sm:text-5xl">
              Find your next beauty and wellness appointment.
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-neutral-600">
              Browse verified salons, compare specialists and services, then book a time that fits your day.
            </p>
          </div>

          <div className="rounded-[22px] border border-white/80 bg-white/85 p-4 shadow-[0px_10px_22px_-18px_rgba(24,16,20,0.34)]">
            <div className="flex items-center gap-2 text-sm font-semibold text-neutral-900">
              <SlidersHorizontal className="h-4 w-4" />
              Search filters
            </div>
            <div className="mt-4 space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Business, service, or keyword"
                  className="w-full rounded-full border border-[#eadde2] bg-white py-2.5 pl-9 pr-3 text-sm outline-none focus:border-transparent focus:ring-2 focus:ring-[#dca7b5]"
                />
              </div>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                <input
                  value={city}
                  onChange={(event) => setCity(event.target.value)}
                  placeholder="City"
                  className="w-full rounded-full border border-[#eadde2] bg-white py-2.5 pl-9 pr-3 text-sm outline-none focus:border-transparent focus:ring-2 focus:ring-[#dca7b5]"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                {businessTypes.map((item) => (
                  <button
                    key={item.value || "all"}
                    onClick={() => setType(item.value)}
                    className={`rounded-full border px-3 py-2 text-sm font-medium transition ${
                      type === item.value
                        ? "border-[#d79aab] bg-[#e8b9c5] text-neutral-950"
                        : "border-[#efe4e8] bg-white text-neutral-600 hover:bg-[#fff7fa] hover:text-neutral-900"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </motion.section>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="font-mono text-xs text-neutral-500">results</p>
            <h2 className="text-lg font-semibold text-neutral-900">
              {data ? `${data.total} businesses found` : "Available businesses"}
            </h2>
          </div>
          {isLoading && <Loader2 className="h-5 w-5 animate-spin text-neutral-500" />}
        </div>

        {error ? (
          <div className="rounded-[18px] border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-600">Could not load businesses.</div>
        ) : businesses.length === 0 && !isLoading ? (
          <div className="rounded-[20px] border border-white/70 bg-white/80 p-8 text-center">
            <p className="text-base font-semibold text-neutral-900">No businesses match those filters.</p>
            <p className="mt-1 text-sm text-neutral-500">Try removing a city, type, or keyword.</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {businesses.map((business, index) => (
              <motion.div
                key={business.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.04, duration: 0.28 }}
              >
                <Link
                  to={`/customer/businesses/${business.slug || business.id}`}
                  className="group block overflow-hidden rounded-[20px] border border-white/70 bg-white/90 shadow-[0px_10px_22px_-16px_rgba(28,16,24,0.3)] transition hover:-translate-y-0.5"
                >
                  <div className="aspect-[16/9] bg-[#f1e5e9]">
                    {business.cover_url || business.logo_url ? (
                      <img
                        src={business.cover_url || business.logo_url || ""}
                        alt={business.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center bg-gradient-to-br from-[#f5d3df] via-[#f4edf1] to-[#dce9f6]" />
                    )}
                  </div>
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="truncate text-base font-semibold text-neutral-900">{business.name}</h3>
                          {business.is_verified && <BadgeCheck className="h-4 w-4 shrink-0 text-emerald-600" />}
                        </div>
                        <p className="mt-1 text-sm capitalize text-neutral-500">
                          {business.business_type.replace("_", " ")}
                          {business.city ? ` in ${business.city}` : ""}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-1 rounded-full bg-[#fff1f5] px-2 py-1 text-xs font-semibold text-neutral-700">
                        <Star className="h-3.5 w-3.5 fill-[#e5a6bb] text-[#e5a6bb]" />
                        {Number(business.average_rating || 0).toFixed(1)}
                      </div>
                    </div>
                    <p className="mt-3 line-clamp-2 min-h-10 text-sm leading-5 text-neutral-600">
                      {business.description || business.address || "View services, branches, open slots, and customer reviews."}
                    </p>
                    <div className="mt-4 flex items-center justify-between text-sm">
                      <span className="text-neutral-500">{business.review_count} reviews</span>
                      <span className="inline-flex items-center gap-1 font-medium text-neutral-900">
                        Book now
                        <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
                      </span>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
