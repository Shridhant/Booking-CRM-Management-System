import { useEffect, useRef, useState } from "react"
import { Search, MapPin, Loader2, Navigation, Check, AlertTriangle } from "lucide-react"

declare global {
  interface Window {
    google?: any
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
  const autocompleteService = useRef<any>(null)
  const geocoderInstance = useRef<any>(null)
  
  // Script / Asset loading state
  const [googleLoaded, setGoogleLoaded] = useState(false)
  const [apiKeyMissing, setApiKeyMissing] = useState(false)

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

  // 1. Dynamic Script Ingestion for Google Maps API
  useEffect(() => {
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY
    if (!apiKey) {
      setApiKeyMissing(true)
      return
    }

    if (window.google?.maps) {
      setGoogleLoaded(true)
      return
    }

    // Check if script is already present in document
    const existingScript = document.getElementById("google-maps-js")
    if (existingScript) {
      setGoogleLoaded(true)
      return
    }

    // Inject script tag
    const script = document.createElement("script")
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`
    script.id = "google-maps-js"
    script.async = true
    script.defer = true
    script.onload = () => {
      setGoogleLoaded(true)
    }
    script.onerror = () => {
      console.error("Google Maps API script load failed.")
    }
    document.head.appendChild(script)
  }, [])

  // 2. Initialize Google Map & Services
  useEffect(() => {
    if (!googleLoaded || !mapRef.current) return

    const google = window.google

    // Default coordinates: Connaught Place, New Delhi if not set
    const defaultLat = selectedCoords?.lat ?? 28.6139
    const defaultLng = selectedCoords?.lng ?? 77.2090
    const zoomLevel = selectedCoords ? 16 : 13

    // Initialize Services
    autocompleteService.current = new google.maps.places.AutocompleteService()
    geocoderInstance.current = new google.maps.Geocoder()

    // Initialize Map
    const mapOptions = {
      center: { lat: defaultLat, lng: defaultLng },
      zoom: zoomLevel,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
      styles: [
        {
          featureType: "administrative",
          elementType: "geometry",
          stylers: [{ visibility: "on" }]
        },
        {
          featureType: "poi",
          stylers: [{ visibility: "off" }]
        },
        {
          featureType: "road",
          elementType: "labels.icon",
          stylers: [{ visibility: "off" }]
        },
        {
          featureType: "transit",
          stylers: [{ visibility: "off" }]
        }
      ]
    }

    mapInstance.current = new google.maps.Map(mapRef.current, mapOptions)

    // Initialize Draggable Marker
    markerInstance.current = new google.maps.Marker({
      position: { lat: defaultLat, lng: defaultLng },
      map: mapInstance.current,
      draggable: true,
      animation: google.maps.Animation.DROP
    })

    // Handle Marker dragend event
    markerInstance.current.addListener("dragend", () => {
      const position = markerInstance.current.getPosition()
      if (!position) return

      const newLat = Number(position.lat().toFixed(6))
      const newLng = Number(position.lng().toFixed(6))
      setSelectedCoords({ lat: newLat, lng: newLng })

      // Reverse geocode
      if (geocoderInstance.current) {
        geocoderInstance.current.geocode({ location: { lat: newLat, lng: newLng } }, (results: any, status: any) => {
          if (status === "OK" && results && results[0]) {
            const result = results[0]
            
            // Parse city from address_components
            let cityVal = "Delhi"
            for (const component of result.address_components) {
              const types = component.types
              if (types.includes("locality")) {
                cityVal = component.long_name
              } else if (types.includes("administrative_area_level_2") && cityVal === "Delhi") {
                cityVal = component.long_name
              }
            }

            const formattedAddress = result.formatted_address
            setSearchQuery(formattedAddress)
            onChange({
              address: formattedAddress,
              city: cityVal,
              latitude: newLat,
              longitude: newLng
            })
          } else {
            onChange({
              address: searchQuery || `Location near (${newLat}, ${newLng})`,
              city: initialCity || "Delhi",
              latitude: newLat,
              longitude: newLng
            })
          }
        })
      }
    })

    // Handle Map Click to place pin
    mapInstance.current.addListener("click", (e: any) => {
      if (!e.latLng) return

      const clickedLat = e.latLng.lat()
      const clickedLng = e.latLng.lng()
      
      markerInstance.current.setPosition({ lat: clickedLat, lng: clickedLng })
      
      const newLat = Number(clickedLat.toFixed(6))
      const newLng = Number(clickedLng.toFixed(6))
      setSelectedCoords({ lat: newLat, lng: newLng })

      // Reverse geocode
      if (geocoderInstance.current) {
        geocoderInstance.current.geocode({ location: { lat: newLat, lng: newLng } }, (results: any, status: any) => {
          if (status === "OK" && results && results[0]) {
            const result = results[0]
            
            // Parse city from address_components
            let cityVal = "Delhi"
            for (const component of result.address_components) {
              const types = component.types
              if (types.includes("locality")) {
                cityVal = component.long_name
              } else if (types.includes("administrative_area_level_2") && cityVal === "Delhi") {
                cityVal = component.long_name
              }
            }

            const formattedAddress = result.formatted_address
            setSearchQuery(formattedAddress)
            onChange({
              address: formattedAddress,
              city: cityVal,
              latitude: newLat,
              longitude: newLng
            })
          }
        })
      }
    })

    return () => {
      mapInstance.current = null
      markerInstance.current = null
    }
  }, [googleLoaded])

  // 3. Search Autocomplete via google.maps.places.AutocompleteService
  const performSearch = async (query: string) => {
    if (!query.trim() || query.length < 3) return
    if (!googleLoaded || !autocompleteService.current) return
    
    setSearching(true)
    
    autocompleteService.current.getPlacePredictions(
      { input: query },
      (predictions: any, status: any) => {
        setSearching(false)
        if (status === "OK" && predictions) {
          setSuggestions(predictions)
          setShowDropdown(true)
        } else {
          setSuggestions([])
          setShowDropdown(false)
        }
      }
    )
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

  // Select Suggested Address (resolve Place ID)
  const handleSelectSuggestion = (place: any) => {
    if (!geocoderInstance.current) return

    geocoderInstance.current.geocode({ placeId: place.place_id }, (results: any, status: any) => {
      if (status === "OK" && results && results[0]) {
        const result = results[0]
        const lat = Number(result.geometry.location.lat().toFixed(6))
        const lng = Number(result.geometry.location.lng().toFixed(6))

        // Parse city from address_components
        let cityVal = "Delhi"
        for (const component of result.address_components) {
          const types = component.types
          if (types.includes("locality")) {
            cityVal = component.long_name
          } else if (types.includes("administrative_area_level_2") && cityVal === "Delhi") {
            cityVal = component.long_name
          }
        }

        const formattedAddress = result.formatted_address

        setSearchQuery(formattedAddress)
        setSelectedCoords({ lat, lng })
        setShowDropdown(false)

        onChange({
          address: formattedAddress,
          city: cityVal,
          latitude: lat,
          longitude: lng
        })

        // Center map and move marker
        if (mapInstance.current && markerInstance.current) {
          mapInstance.current.setCenter({ lat, lng })
          mapInstance.current.setZoom(16)
          markerInstance.current.setPosition({ lat, lng })
        }
      }
    })
  }

  // Render Fallback if environment variables are missing
  if (apiKeyMissing) {
    return (
      <div className="space-y-4">
        <div className="p-4 rounded-lg bg-amber-50 border border-amber-200 flex gap-3 text-xs text-amber-800">
          <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600 mt-0.5" />
          <div>
            <p className="font-semibold mb-1">Google Maps API Configuration Needed</p>
            <p className="leading-relaxed mb-2">
              Please define your Google Maps API key in the environment configuration file:
            </p>
            <code className="block bg-amber-100 p-2 rounded-md font-mono select-all">
              VITE_GOOGLE_MAPS_API_KEY=AIzaSy...
            </code>
          </div>
        </div>

        {/* Fallback Form fields so application functionality is not blocked */}
        <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 space-y-3.5">
          <p className="text-xs font-semibold text-gray-700">Enter Location Manually</p>
          <div className="grid grid-cols-2 gap-3.5">
            <div>
              <label className="block text-[10px] text-gray-500 font-medium mb-1">Latitude</label>
              <input
                type="number"
                step="any"
                defaultValue={selectedCoords?.lat || ""}
                onChange={(e) => {
                  const lat = Number(e.target.value)
                  if (!isNaN(lat)) {
                    setSelectedCoords(prev => ({ lat, lng: prev?.lng ?? 77.2090 }))
                    onChange({
                      address: searchQuery,
                      city: initialCity || "Delhi",
                      latitude: lat,
                      longitude: selectedCoords?.lng ?? 77.2090
                    })
                  }
                }}
                placeholder="28.6139"
                className="w-full text-xs px-3 py-2 border rounded-md bg-white text-gray-900 focus:outline-none focus:ring-1 focus:ring-neutral-900"
              />
            </div>
            <div>
              <label className="block text-[10px] text-gray-500 font-medium mb-1">Longitude</label>
              <input
                type="number"
                step="any"
                defaultValue={selectedCoords?.lng || ""}
                onChange={(e) => {
                  const lng = Number(e.target.value)
                  if (!isNaN(lng)) {
                    setSelectedCoords(prev => ({ lat: prev?.lat ?? 28.6139, lng }))
                    onChange({
                      address: searchQuery,
                      city: initialCity || "Delhi",
                      latitude: selectedCoords?.lat ?? 28.6139,
                      longitude: lng
                    })
                  }
                }}
                placeholder="77.2090"
                className="w-full text-xs px-3 py-2 border rounded-md bg-white text-gray-900 focus:outline-none focus:ring-1 focus:ring-neutral-900"
              />
            </div>
          </div>
        </div>
      </div>
    )
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
                    {place.structured_formatting?.main_text || place.description.split(",")[0]}
                  </p>
                  <p className="text-[10px] text-gray-500 truncate mt-0.5">{place.description}</p>
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
        {!googleLoaded && (
          <div className="w-full h-[220px] rounded-lg bg-gray-50 border border-gray-150 flex flex-col items-center justify-center text-gray-400 gap-2.5">
            <Loader2 className="h-8 w-8 animate-spin text-neutral-900" />
            <p className="text-xs font-medium">Loading geographical maps engine...</p>
          </div>
        )}

        {googleLoaded && (
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

