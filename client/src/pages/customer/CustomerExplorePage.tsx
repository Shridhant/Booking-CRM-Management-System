import { useMemo, useState, useEffect } from "react"
import { Link } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { BadgeCheck, MapPin, Search, Star, Heart } from "lucide-react"
import { motion, AnimatePresence } from "motion/react"
import { searchPublicBusinessesApi } from "../../api/public.api"
import { listActivePromotionsApi } from "../../api/promotions.api"
import ThreeDotsLoader from "../../components/common/ThreeDotsLoader"

// Premium category structure matching the mockup icons
const categoryItems = [
  { label: "Salon", value: "salon", color: "bg-peach-wash text-midnight-ink border-soft-mist", icon: "✨" },
  { label: "Spa", value: "spa", color: "bg-sky-wash text-midnight-ink border-soft-mist", icon: "🧼" },
  { label: "Professional", value: "professional", color: "bg-mint-wash text-midnight-ink border-soft-mist", icon: "🛠️" },
  { label: "Nails", value: "nail_studio", color: "bg-peach-wash text-midnight-ink border-soft-mist", icon: "💅" },
  { label: "Barber", value: "barber", color: "bg-sky-wash text-midnight-ink border-soft-mist", icon: "💈" }
]

export default function CustomerExplorePage() {
  const [query, setQuery] = useState("")
  const [city, setCity] = useState("")
  const [type, setType] = useState("")
  const [favorites, setFavorites] = useState<string[]>([])
  const [currentSlide, setCurrentSlide] = useState(0)

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

  // Fetch active promotions
  const { data: promotions = [], isLoading: promotionsLoading } = useQuery({
    queryKey: ["public-promotions"],
    queryFn: listActivePromotionsApi
  })

  const businesses = data?.items ?? []

  // Auto slide interval for multiple banner campaigns
  useEffect(() => {
    if (promotions.length <= 1) return
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % promotions.length)
    }, 6000)
    return () => clearInterval(interval)
  }, [promotions.length])

  const toggleFavorite = (e: React.MouseEvent, id: string) => {
    e.preventDefault()
    e.stopPropagation()
    setFavorites(prev =>
      prev.includes(id) ? prev.filter(fId => fId !== id) : [...prev, id]
    )
  }

  return (
    <div className="space-y-8 pb-16">

      {/* ── 2. Interactive Search & Filters ── */}
      <div className="grid gap-6 lg:grid-cols-[1fr_380px] items-start">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-olive-stone" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search for salon, cleaning, massage, handyman..."
            className="w-full rounded-[8px] border border-soft-mist bg-white py-3.5 pl-12 pr-4 text-sm text-midnight-ink outline-none focus:border-midnight-ink transition-all"
          />
        </div>

        <div className="relative">
          <MapPin className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-olive-stone" />
          <input
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="Search by city (e.g. Delhi, Hawaii)"
            className="w-full rounded-[8px] border border-soft-mist bg-white py-3.5 pl-12 pr-4 text-sm text-midnight-ink outline-none focus:border-midnight-ink transition-all"
          />
        </div>
      </div>

      {/* ── 3. Dynamic Banners Carousel or Static Fallback ── */}
      {promotionsLoading ? (
        <div className="w-full h-44 sm:h-56 bg-white rounded-[12px] flex items-center justify-center border border-soft-mist">
          <ThreeDotsLoader color="bg-midnight-ink" size="w-2.5 h-2.5" />
        </div>
      ) : promotions.length > 0 ? (
        <div className="relative w-full overflow-hidden rounded-[12px] bg-white border border-soft-mist flex items-center justify-center animate-fade-in-down">
          {/* Main responsive sliding container */}
          <div className="relative w-full aspect-[3/1] sm:max-h-[300px] md:max-h-[350px] overflow-hidden">
            <AnimatePresence mode="wait">
              {promotions.map((promo, idx) => {
                if (idx !== currentSlide) return null
                return (
                  <motion.div
                    key={promo.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="absolute inset-0 w-full h-full"
                  >
                    <Link
                      to={
                        promo.redirect_slug.startsWith("http") || promo.redirect_slug.startsWith("/")
                          ? promo.redirect_slug
                          : `/customer/businesses/${promo.redirect_slug}`
                      }
                      className="block w-full h-full focus:outline-none"
                    >
                      <picture className="w-full h-full">
                        {/* Mobile portrait crop image */}
                        <source media="(max-width: 640px)" srcSet={promo.mobile_url || promo.desktop_url} />
                        {/* Desktop landscape crop image */}
                        <img
                          src={promo.desktop_url}
                          alt={promo.title}
                          className="w-full h-full object-cover select-none"
                        />
                      </picture>
                    </Link>
                  </motion.div>
                )
              })}
            </AnimatePresence>

            {/* Slider Dots */}
            {promotions.length > 1 && (
              <div className="absolute bottom-4 left-0 right-0 flex items-center justify-center gap-1.5 z-10">
                {promotions.map((_, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setCurrentSlide(idx)}
                    className={`h-2 rounded-[8px] transition-all duration-300 cursor-pointer ${idx === currentSlide ? "w-5 bg-midnight-ink" : "w-2 bg-midnight-ink/40 hover:bg-midnight-ink"
                      }`}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="relative overflow-hidden rounded-[12px] bg-sky-wash p-6 text-midnight-ink border border-soft-mist flex items-center justify-between"
        >
          <div className="relative z-10 max-w-lg space-y-2">
            <span className="bg-white/40 border border-soft-mist px-3 py-1 rounded-[8px] text-[11px] font-semibold tracking-[0.045em] uppercase">
              Special Promo
            </span>
            <h2 className="text-2xl sm:text-3xl font-semibold tracking-[-0.99px] text-midnight-ink">
              Up to 50% Off!
            </h2>
            <p className="text-sm text-midnight-ink/80 max-w-sm">
              Book home cleaning, premium salon styling, or wellness sessions now to avail the offer.
            </p>
            <button className="mt-3 btn-filled text-xs">
              Grab the Offer Now
            </button>
          </div>

          {/* Right side floating graphics (Mock Illustration Container) */}
          <div className="relative hidden md:flex items-center justify-center w-40 h-32 pr-4 z-10">
            <div className="absolute text-5xl">🧼🧴✨</div>
          </div>
        </motion.div>
      )}

      {/* ── 4. Category Selectors Bar ── */}
      <div className="space-y-3">
        <h3 className="text-[13px] font-semibold uppercase tracking-[0.045em] text-midnight-ink">
          Category
        </h3>
        <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-none snap-x">
          <button
            onClick={() => setType("")}
            className="flex flex-col items-center gap-2 shrink-0 snap-start transition cursor-pointer select-none"
          >
            <div className={`h-16 w-16 min-w-16 rounded-[12px] flex items-center justify-center text-2xl border transition duration-200 ${type === ""
              ? "bg-midnight-ink text-white border-midnight-ink"
              : "bg-white text-midnight-ink border-soft-mist hover:border-midnight-ink"
              }`}>
              🌍
            </div>
            <span className="text-[11px] font-semibold uppercase tracking-[0.045em] text-olive-stone">All</span>
          </button>

          {categoryItems.map((cat) => {
            const isSelected = type === cat.value
            return (
              <button
                key={cat.label}
                onClick={() => setType(cat.value)}
                className="flex flex-col items-center gap-2 shrink-0 snap-start transition cursor-pointer select-none"
              >
                <div className={`h-16 w-16 rounded-[12px] flex items-center justify-center text-2xl border transition duration-200 ${isSelected
                  ? "bg-midnight-ink text-white border-midnight-ink scale-105"
                  : `${cat.color} hover:brightness-95`
                  }`}>
                  {cat.icon}
                </div>
                <span className="text-[11px] font-semibold uppercase tracking-[0.045em] text-olive-stone">{cat.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* ── 5. Popular Service Cards ── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-[19px] font-semibold tracking-[-0.44px] text-midnight-ink">Popular Services</h3>
          <span className="text-[11px] font-semibold uppercase tracking-[0.045em] text-midnight-ink cursor-pointer hover:underline">See all</span>
        </div>

        {error ? (
          <div className="rounded-[8px] border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-600">
            Could not load popular services.
          </div>
        ) : isLoading ? (
          <div className="flex min-h-[220px] items-center justify-center">
            <ThreeDotsLoader color="bg-midnight-ink" size="w-3 h-3" />
          </div>
        ) : businesses.length === 0 ? (
          <div className="rounded-[12px] border border-soft-mist bg-white p-8 text-center">
            <p className="text-sm font-semibold text-midnight-ink">No popular services found in this category.</p>
            <p className="mt-1 text-xs text-olive-stone">Try modifying filters or switching search query.</p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {businesses.map((business, index) => {
              const isFav = favorites.includes(business.id)
              return (
                <motion.div
                  key={business.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.04, duration: 0.28 }}
                >
                  <Link
                    to={`/customer/businesses/${business.slug || business.id}`}
                    className="group block overflow-hidden rounded-[12px] border border-soft-mist bg-white transition duration-300"
                  >
                    {/* Header Image with Heart and Rating Overlay */}
                    <div className="relative aspect-[16/10] bg-white overflow-hidden">
                      {business.cover_url || business.logo_url ? (
                        <img
                          src={business.cover_url || business.logo_url || ""}
                          alt={business.name}
                          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center bg-sky-wash" />
                      )}

                      {/* Favorite Heart Button */}
                      <button
                        onClick={(e) => toggleFavorite(e, business.id)}
                        className="absolute right-3.5 top-3.5 z-10 h-8 w-8 rounded-[8px] bg-white border border-soft-mist flex items-center justify-center active:scale-90 transition cursor-pointer"
                      >
                        <Heart className={`h-4 w-4 transition duration-200 ${isFav ? "fill-red-500 text-red-500" : "text-olive-stone hover:text-red-500"}`} />
                      </button>

                      {/* Floating Star Rating Badge */}
                      <div className="absolute left-3.5 top-3.5 z-10 flex items-center gap-1 rounded-[8px] bg-white/95 px-2 py-1 text-[11px] font-semibold tracking-[0.045em] text-midnight-ink border border-soft-mist">
                        <Star className="h-3 w-3 fill-midnight-ink text-midnight-ink" />
                        <span>{Number(business.average_rating || 0).toFixed(1)}</span>
                      </div>
                    </div>

                    {/* Detailed Card Info */}
                    <div className="p-5 space-y-2">
                      <div className="flex items-center gap-1.5">
                        <h4 className="truncate text-base font-semibold text-midnight-ink leading-tight">
                          {business.name}
                        </h4>
                        {business.is_verified && <BadgeCheck className="h-4.5 w-4.5 text-emerald-600 shrink-0" />}
                      </div>

                      <p className="text-[11px] uppercase tracking-[0.045em] text-olive-stone font-semibold">
                        {business.business_type.replace("_", " ")} &bull; {business.city || "Hawaii"}
                      </p>

                      <p className="text-sm text-olive-stone line-clamp-2 leading-relaxed">
                        {business.description || "Browse and book local experts in premium quality clean beauty and home care services."}
                      </p>

                      {/* Pricing Row & Action Button */}
                      <div className="pt-3 border-t border-soft-mist flex items-center justify-end">
                        <span className="btn-outline text-[11px] py-1.5 px-3.5 group-hover:bg-midnight-ink group-hover:text-white transition">
                          Book
                        </span>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
