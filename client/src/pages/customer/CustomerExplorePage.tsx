import { useMemo, useState, useEffect } from "react"
import { Link } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { BadgeCheck, MapPin, Search, Star, Heart, Sparkles } from "lucide-react"
import { motion, AnimatePresence } from "motion/react"
import { searchPublicBusinessesApi } from "../../api/public.api"
import { listActivePromotionsApi } from "../../api/promotions.api"
import ThreeDotsLoader from "../../components/common/ThreeDotsLoader"

// Premium category structure matching the mockup icons
const categoryItems = [
  { label: "Salon ", value: "salon", color: "bg-[#fff6e6] text-[#ff9900] border-[#ffe6b3]", icon: "✨" },
  { label: "Spa", value: "spa", color: "bg-[#e6f9f3] text-[#00b386] border-[#b3f0db]", icon: "🧼" },
  { label: "Professional", value: "professional", color: "bg-[#fffdeb] text-[#e6b800] border-[#fff799]", icon: "🛠️" },
  { label: "Nails", value: "nail_studio", color: "bg-[#ebf8ff] text-[#007acc] border-[#99d6ff]", icon: "💅" },
  { label: "Barber", value: "barber", color: "bg-[#f9ebff] text-[#ac33db] border-[#e6b3ff]", icon: "💈" }
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
          <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-neutral-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search for salon, cleaning, massage, handyman..."
            className="w-full rounded-full border border-neutral-200 bg-white py-3.5 pl-12 pr-4 text-sm text-neutral-900 outline-none shadow-sm focus:ring-2 focus:ring-[#db2777]/20 focus:border-[#db2777] transition-all"
          />
        </div>

        <div className="relative">
          <MapPin className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-neutral-400" />
          <input
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="Search by city (e.g. Delhi, Hawaii)"
            className="w-full rounded-full border border-neutral-200 bg-white py-3.5 pl-12 pr-4 text-sm text-neutral-900 outline-none shadow-sm focus:ring-2 focus:ring-[#db2777]/20 focus:border-[#db2777] transition-all"
          />
        </div>
      </div>

      {/* ── 3. Dynamic Banners Carousel or Static Fallback ── */}
      {promotionsLoading ? (
        <div className="w-full h-44 sm:h-56 bg-neutral-50 rounded-3xl flex items-center justify-center border border-neutral-100 shadow-inner">
          <ThreeDotsLoader color="bg-[#db2777]" size="w-2.5 h-2.5" />
        </div>
      ) : promotions.length > 0 ? (
        <div className="relative w-full overflow-hidden rounded-[24px] shadow-vercel-md bg-neutral-50 border border-neutral-100 flex items-center justify-center">
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
                    className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${idx === currentSlide ? "w-5 bg-white shadow-md" : "w-2 bg-white/60 hover:bg-white"
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
          className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#00bfff] via-[#33ccff] to-[#80e5ff] p-6 text-white shadow-xl flex items-center justify-between"
        >
          {/* Animated Abstract Glass Bubbles */}
          <div className="absolute right-0 top-0 h-40 w-40 rounded-full bg-white/10 blur-xl -translate-y-12 translate-x-12 pointer-events-none" />
          <div className="absolute left-1/3 bottom-0 h-28 w-28 rounded-full bg-cyan-300/30 blur-lg pointer-events-none" />

          <div className="relative z-10 max-w-lg space-y-2">
            <span className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase">
              Special Promo
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold leading-tight tracking-tight">
              Up to 50% Off!
            </h2>
            <p className="text-xs text-white/95 max-w-sm">
              Book home cleaning, premium salon styling, or wellness sessions now to avail the offer.
            </p>
            <button className="mt-3 bg-[#ffcc00] hover:bg-[#e6b800] text-neutral-900 px-4 py-2 rounded-full text-xs font-bold shadow-md hover:shadow-lg transition duration-200 active:scale-95">
              Grab the Offer Now
            </button>
          </div>

          {/* Right side floating graphics (Mock Illustration Container) */}
          <div className="relative hidden md:flex items-center justify-center w-40 h-32 pr-4 z-10">
            <div className="absolute text-5xl animate-bounce duration-1000">🧼🧴✨</div>
          </div>
        </motion.div>
      )}

      {/* ── 4. Circular Category Selectors Bar ── */}
      <div className="space-y-3">
        <h3 className="text-base font-bold text-neutral-800 flex items-center gap-1.5">
          <Sparkles className="h-4.5 w-4.5 text-[#db2777]" />
          Category
        </h3>
        <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-none snap-x">
          <button
            onClick={() => setType("")}
            className={`flex flex-col items-center gap-2 shrink-0 snap-start transition cursor-pointer select-none`}
          >
            <div className={`h-16 w-16  min-w-16 rounded-full flex items-center justify-center text-2xl shadow-md border transition duration-200 ${type === ""
              ? "bg-neutral-900 text-white border-neutral-950"
              : "bg-white text-neutral-600 border-neutral-100 hover:border-neutral-200"
              }`}>
              🌍
            </div>
            <span className="text-xs font-semibold text-neutral-700">All</span>
          </button>

          {categoryItems.map((cat) => {
            const isSelected = type === cat.value
            return (
              <button
                key={cat.label}
                onClick={() => setType(cat.value)}
                className="flex flex-col items-center gap-2 shrink-0 snap-start transition cursor-pointer select-none"
              >
                <div className={`h-16 w-16 rounded-full flex items-center justify-center text-2xl shadow-md border transition duration-200 ${isSelected
                  ? "bg-neutral-900 text-white border-neutral-950 scale-105"
                  : `${cat.color} hover:brightness-95`
                  }`}>
                  {cat.icon}
                </div>
                <span className="text-xs font-semibold text-neutral-700">{cat.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* ── 5. Popular Service Cards ── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-neutral-800">Popular Services</h3>
          <span className="text-xs font-semibold text-[#db2777] cursor-pointer hover:underline">See all</span>
        </div>

        {error ? (
          <div className="rounded-[18px] border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-600">
            Could not load popular services.
          </div>
        ) : isLoading ? (
          <div className="flex min-h-[220px] items-center justify-center">
            <ThreeDotsLoader color="bg-[#db2777]" size="w-3 h-3" />
          </div>
        ) : businesses.length === 0 ? (
          <div className="rounded-[20px] border border-neutral-200 bg-white p-8 text-center">
            <p className="text-sm font-semibold text-neutral-900">No popular services found in this category.</p>
            <p className="mt-1 text-xs text-neutral-500">Try modifying filters or switching search query.</p>
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
                    className="group block overflow-hidden rounded-3xl border border-neutral-100 bg-white shadow-[0_8px_30px_rgb(0,0,0,0.03)] hover:shadow-md transition duration-300"
                  >
                    {/* Header Image with Heart and Rating Overlay */}
                    <div className="relative aspect-[16/10] bg-neutral-100 overflow-hidden">
                      {business.cover_url || business.logo_url ? (
                        <img
                          src={business.cover_url || business.logo_url || ""}
                          alt={business.name}
                          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center bg-gradient-to-br from-[#db2777]/20 via-pink-100 to-cyan-100" />
                      )}

                      {/* Favorite Heart Button */}
                      <button
                        onClick={(e) => toggleFavorite(e, business.id)}
                        className="absolute right-3.5 top-3.5 z-10 h-8 w-8 rounded-full bg-white/90 backdrop-blur-md border border-neutral-100 flex items-center justify-center shadow-md active:scale-90 transition cursor-pointer"
                      >
                        <Heart className={`h-4 w-4 transition duration-200 ${isFav ? "fill-red-500 text-red-500" : "text-neutral-500 hover:text-red-500"}`} />
                      </button>

                      {/* Floating Star Rating Badge */}
                      <div className="absolute left-3.5 top-3.5 z-10 flex items-center gap-1 rounded-full bg-white/90 backdrop-blur-md px-2 py-1 text-[10px] font-bold text-neutral-800 shadow-md border border-neutral-100">
                        <Star className="h-3 w-3 fill-[#ffcc00] text-[#ffcc00]" />
                        <span>{Number(business.average_rating || 0).toFixed(1)}</span>
                      </div>
                    </div>

                    {/* Detailed Card Info */}
                    <div className="p-5 space-y-2">
                      <div className="flex items-center gap-1.5">
                        <h4 className="truncate text-base font-bold text-neutral-800 leading-tight">
                          {business.name}
                        </h4>
                        {business.is_verified && <BadgeCheck className="h-4.5 w-4.5 text-emerald-500 shrink-0" />}
                      </div>

                      <p className="text-xs text-neutral-400 capitalize font-medium">
                        {business.business_type.replace("_", " ")} &bull; {business.city || "Hawaii"}
                      </p>

                      <p className="text-xs text-neutral-500 line-clamp-2 leading-relaxed">
                        {business.description || "Browse and book local experts in premium quality clean beauty and home care services."}
                      </p>

                      {/* Pricing Row & Action Button */}
                      <div className="pt-3 border-t border-neutral-50 flex items-center justify-between">

                        <span className="bg-[#00bfff] hover:bg-[#0099cc] text-white px-4.5 py-2 rounded-full text-xs font-bold shadow-md transition duration-200">
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
