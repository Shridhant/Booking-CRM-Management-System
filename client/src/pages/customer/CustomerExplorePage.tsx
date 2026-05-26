import { useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { ArrowRight, BadgeCheck, Loader2, MapPin, Search, SlidersHorizontal, Star } from "lucide-react"
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
    <div className="space-y-8">
      <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-end">
        <div>
          <p className="mono-label mb-3">discover and book</p>
          <h1 className="max-w-3xl text-4xl font-semibold leading-tight text-neutral-950 sm:text-5xl">
            Find your next salon, spa, nail, or grooming appointment.
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-neutral-600">
            Browse verified businesses, compare services and branches, then book an available slot with your customer account.
          </p>
        </div>

        <div className="app-card p-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-neutral-950">
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
                className="w-full rounded-md border border-[#d4d4d4] bg-white py-2.5 pl-9 pr-3 text-sm outline-none focus:border-transparent focus:ring-2 focus:ring-neutral-950"
              />
            </div>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
              <input
                value={city}
                onChange={(event) => setCity(event.target.value)}
                placeholder="City"
                className="w-full rounded-md border border-[#d4d4d4] bg-white py-2.5 pl-9 pr-3 text-sm outline-none focus:border-transparent focus:ring-2 focus:ring-neutral-950"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              {businessTypes.map((item) => (
                <button
                  key={item.value || "all"}
                  onClick={() => setType(item.value)}
                  className={`rounded-md border px-3 py-2 text-sm font-medium transition ${
                    type === item.value
                      ? "border-neutral-950 bg-neutral-950 text-white"
                      : "border-[#ebebeb] bg-white text-neutral-600 hover:bg-neutral-100 hover:text-neutral-950"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="mono-label">results</p>
            <h2 className="text-lg font-semibold text-neutral-950">
              {data ? `${data.total} businesses found` : "Available businesses"}
            </h2>
          </div>
          {isLoading && <Loader2 className="h-5 w-5 animate-spin text-neutral-500" />}
        </div>

        {error ? (
          <div className="app-card p-6 text-sm text-red-600">Could not load businesses.</div>
        ) : businesses.length === 0 && !isLoading ? (
          <div className="app-card p-8 text-center">
            <p className="text-base font-semibold text-neutral-950">No businesses match those filters.</p>
            <p className="mt-1 text-sm text-neutral-500">Try removing a city, type, or keyword.</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {businesses.map((business) => (
              <Link
                key={business.id}
                to={`/customer/businesses/${business.slug || business.id}`}
                className="app-card group overflow-hidden transition hover:-translate-y-0.5 hover:shadow-vercel-md"
              >
                <div className="aspect-[16/9] bg-neutral-100">
                  {business.cover_url || business.logo_url ? (
                    <img
                      src={business.cover_url || business.logo_url || ""}
                      alt={business.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center mesh-gradient opacity-70" />
                  )}
                </div>
                <div className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="truncate text-base font-semibold text-neutral-950">{business.name}</h3>
                        {business.is_verified && <BadgeCheck className="h-4 w-4 shrink-0 text-emerald-600" />}
                      </div>
                      <p className="mt-1 text-sm capitalize text-neutral-500">
                        {business.business_type.replace("_", " ")}
                        {business.city ? ` in ${business.city}` : ""}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-1 rounded-full bg-neutral-100 px-2 py-1 text-xs font-semibold text-neutral-700">
                      <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                      {Number(business.average_rating || 0).toFixed(1)}
                    </div>
                  </div>
                  <p className="mt-3 line-clamp-2 min-h-10 text-sm leading-5 text-neutral-600">
                    {business.description || business.address || "View services, branches, open slots, and customer reviews."}
                  </p>
                  <div className="mt-4 flex items-center justify-between text-sm">
                    <span className="text-neutral-500">{business.review_count} reviews</span>
                    <span className="inline-flex items-center gap-1 font-medium text-neutral-950">
                      Book now
                      <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
