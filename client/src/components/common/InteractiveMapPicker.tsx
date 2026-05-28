import { useEffect, useRef, useState } from "react"
import { Search, MapPin, Loader2, Navigation, Check } from "lucide-react"

declare global {
  interface Window {
    L?: any
  }
}

interface MapPickerProps {
  initialLatitude?: number | null
  initialLongitude?: number | null
  initialAddress?: string
  initialCity?: string
  onChange: (data: {
    address: string
    city: string
    latitude: number
    longitude: number
  }) => void
}

export default function InteractiveMapPicker({
  initialLatitude,
  initialLongitude,
  initialAddress = "",
  initialCity = "",
  onChange
}: MapPickerProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstance = useRef<any>(null)
  const markerInstance = useRef<any>(null)
  
  // Script / Asset loading state
  const [leafletLoaded, setLeafletLoaded] = useState(false)

  // Search & suggestions states
  const [searchQuery, setSearchQuery] = useState(initialAddress)
  const [suggestions, setSuggestions] = useState<any[]>([])
  const [searching, setSearching] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)

  // Selected state (for local map rendering)
  const [selectedCoords, setSelectedCoords] = useState<{ lat: number; lng: number } | null>(
    initialLatitude && initialLongitude
      ? { lat: Number(initialLatitude), lng: Number(initialLongitude) }
      : null
  )

  // 1. Dynamic CDN asset injection for Leaflet (zero packaging bloat)
  useEffect(() => {
    if (window.L) {
      setLeafletLoaded(true)
      return
    }

    // Inject stylesheet
    const link = document.createElement("link")
    link.rel = "stylesheet"
    link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
    link.id = "leaflet-css"
    document.head.appendChild(link)

    // Inject script
    const script = document.createElement("script")
    script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"
    script.id = "leaflet-js"
    script.onload = () => {
      setLeafletLoaded(true)
    }
    document.head.appendChild(script)

    return () => {
      // Keep Leaflet globally to avoid reload overhead on subsequent mounts
    }
  }, [])

  // 2. Initialize Leaflet Map
  useEffect(() => {
    if (!leafletLoaded || !mapRef.current) return

    const L = window.L

    // Default coordinates: Connaught Place, New Delhi if not set
    const defaultLat = selectedCoords?.lat ?? 28.6139
    const defaultLng = selectedCoords?.lng ?? 77.2090
    const zoomLevel = selectedCoords ? 16 : 13

    // Clean up previous map instance if it exists
    if (mapInstance.current) {
      mapInstance.current.remove()
      mapInstance.current = null
      markerInstance.current = null
    }

    // Initialize Map
    mapInstance.current = L.map(mapRef.current, {
      zoomControl: true
    }).setView([defaultLat, defaultLng], zoomLevel)

    // Set map tiles (premium clean OpenStreetMap style)
    L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: "abcd",
      maxZoom: 20
    }).addTo(mapInstance.current)

    // Setup custom icon (since Leaflet default markers fail under asset bundling)
    const customIcon = L.icon({
      iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
      shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34]
    })

    // Initialize Marker if coords exist or default
    markerInstance.current = L.marker([defaultLat, defaultLng], {
      icon: customIcon,
      draggable: true
    }).addTo(mapInstance.current)

    // Handle Marker dragging events
    markerInstance.current.on("dragend", async (e: any) => {
      const marker = e.target
      const position = marker.getLatLng()
      
      const newLat = Number(position.lat.toFixed(6))
      const newLng = Number(position.lng.toFixed(6))
      setSelectedCoords({ lat: newLat, lng: newLng })

      // Reverse geocode to update address & city automatically!
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?lat=${newLat}&lon=${newLng}&format=json&addressdetails=1`
        )
        const data = await res.json()
        if (data && data.address) {
          const road = data.address.road || data.address.suburb || ""
          const area = data.address.neighbourhood || data.address.residential || ""
          const addressText = data.address.shop || data.address.amenity || data.address.building 
            ? `${data.address.shop || data.address.amenity || data.address.building}, ${road || area}`.replace(/(^[,\s]+)|([,\s]+$)/g, "")
            : data.display_name.split(",").slice(0, 3).join(",").trim()

          const cityText = data.address.city || data.address.town || data.address.suburb || data.address.state || "Delhi"
          
          setSearchQuery(addressText)
          onChange({
            address: addressText,
            city: cityText,
            latitude: newLat,
            longitude: newLng
          })
        } else {
          // If reverse geocoding is empty, keep old address text but send new coords
          onChange({
            address: searchQuery || `Location near (${newLat}, ${newLng})`,
            city: initialCity || "Delhi",
            latitude: newLat,
            longitude: newLng
          })
        }
      } catch (err) {
        console.error("Reverse geocoding failed", err)
        onChange({
          address: searchQuery || `Location at (${newLat}, ${newLng})`,
          city: initialCity || "Delhi",
          latitude: newLat,
          longitude: newLng
        })
      }
    })

    // Also support clicking map to position pin
    mapInstance.current.on("click", (e: any) => {
      const newLat = Number(e.latlng.lat.toFixed(6))
      const newLng = Number(e.latlng.lng.toFixed(6))
      
      markerInstance.current.setLatLng([newLat, newLng])
      setSelectedCoords({ lat: newLat, lng: newLng })
      
      // Trigger a dragend-like update programmatically
      markerInstance.current.fire("dragend")
    })

    // Cleanup on unmount
    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove()
        mapInstance.current = null
        markerInstance.current = null
      }
    }
  }, [leafletLoaded])

  // 3. Search Autocomplete Logic (Nominatim Query)
  const performSearch = async (query: string) => {
    if (!query.trim() || query.length < 3) return
    setSearching(true)
    
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&addressdetails=1&limit=5`
      )
      const data = await res.json()
      setSuggestions(data || [])
      setShowDropdown(true)
    } catch (err) {
      console.error("Address search failed", err)
    } finally {
      setSearching(false)
    }
  }

  // Handle Search Input Change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setSearchQuery(val)
    if (val.length < 3) {
      setSuggestions([])
      setShowDropdown(false)
    }
  }

  // Handle Enter Key Search
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault()
      performSearch(searchQuery)
    }
  }

  // Select Suggested Address
  const handleSelectSuggestion = (place: any) => {
    const lat = Number(parseFloat(place.lat).toFixed(6))
    const lng = Number(parseFloat(place.lon).toFixed(6))
    
    // Extract a clear address title
    const road = place.address.road || place.address.suburb || ""
    const suburb = place.address.suburb || ""
    const displayName = place.display_name.split(",").slice(0, 3).join(",").trim()
    const addressVal = place.address.shop || place.address.amenity || place.address.building 
      ? `${place.address.shop || place.address.amenity || place.address.building}, ${road || suburb || ""}`
      : displayName
      
    // Extract city
    const cityVal = place.address.city || place.address.town || place.address.suburb || place.address.state || "Delhi"

    setSearchQuery(addressVal)
    setSelectedCoords({ lat, lng })
    setShowDropdown(false)

    // Update parent states
    onChange({
      address: addressVal,
      city: cityVal,
      latitude: lat,
      longitude: lng
    })

    // Move map and marker pin
    if (mapInstance.current && markerInstance.current) {
      mapInstance.current.setView([lat, lng], 16)
      markerInstance.current.setLatLng([lat, lng])
    }
  }

  return (
    <div className="space-y-4">
      {/* ── Search Bar Input with suggestions dropdown ── */}
      <div className="relative">
        <label className="block text-sm font-semibold text-gray-700 mb-1.5 flex items-center justify-between">
          <span>Search Address & Pin on Map</span>
          <span className="text-[10px] text-gray-400 font-normal">Press Enter to Search</span>
        </label>
        
        <div className="relative flex items-center bg-white border border-gray-300 rounded-md overflow-hidden focus-within:ring-2 focus-within:ring-neutral-950 focus-within:border-transparent transition">
          <Search className="absolute left-3.5 h-4.5 w-4.5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Search address (e.g. Select Citywalk, Saket)"
            className="w-full pl-10 pr-20 py-2.5 outline-none text-sm bg-transparent text-gray-900 placeholder-gray-400"
          />
          
          {/* Action button */}
          <button
            type="button"
            onClick={() => performSearch(searchQuery)}
            disabled={searching || searchQuery.length < 3}
            className="absolute right-1.5 px-3 py-1 bg-neutral-950 hover:bg-neutral-900 disabled:bg-gray-100 text-white disabled:text-gray-400 text-xs font-semibold rounded-md transition cursor-pointer flex items-center gap-1"
          >
            {searching ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Navigation className="h-3 w-3" />
            )}
            Search
          </button>
        </div>

        {/* Search Suggestions Dropdown overlay */}
        {showDropdown && suggestions.length > 0 && (
          <div className="absolute left-0 right-0 z-30 mt-1 bg-white border border-gray-200 rounded-md shadow-vercel-lg divide-y divide-gray-150 overflow-hidden max-h-56 overflow-y-auto">
            {suggestions.map((place) => (
              <button
                key={place.place_id}
                type="button"
                onClick={() => handleSelectSuggestion(place)}
                className="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-start gap-2.5 transition text-xs text-gray-700 cursor-pointer"
              >
                <MapPin className="h-4.5 w-4.5 text-gray-400 mt-0.5 shrink-0" />
                <div className="min-w-0">
                  <p className="font-semibold text-gray-900 truncate">
                    {place.address.shop || place.address.amenity || place.address.building || place.display_name.split(",")[0]}
                  </p>
                  <p className="text-[10px] text-gray-500 truncate mt-0.5">{place.display_name}</p>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Dropdown backdrop click listener */}
        {showDropdown && (
          <div
            className="fixed inset-0 z-20"
            onClick={() => setShowDropdown(false)}
          />
        )}
      </div>

      {/* ── Interactive Map Box Canvas ── */}
      <div className="relative">
        {!leafletLoaded && (
          <div className="w-full h-[220px] rounded-lg bg-gray-50 border border-gray-150 flex flex-col items-center justify-center text-gray-400 gap-2.5">
            <Loader2 className="h-8 w-8 animate-spin text-neutral-900" />
            <p className="text-xs font-medium">Loading geographical maps engine...</p>
          </div>
        )}

        {leafletLoaded && (
          <div className="relative w-full h-[220px] rounded-lg overflow-hidden border border-gray-200 shadow-inner group">
            {/* Map Div */}
            <div ref={mapRef} className="w-full h-full z-10" />

            {/* Instruction tooltip */}
            <div className="absolute bottom-2 left-2 z-20 bg-neutral-950/80 backdrop-blur-xs text-white text-[10px] px-2 py-1 rounded-md font-medium pointer-events-none transition opacity-80 group-hover:opacity-100 flex items-center gap-1.5">
              <Check className="h-3.5 w-3.5 text-emerald-400" />
              <span>Drag the pin marker or click any location to fine-tune.</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
