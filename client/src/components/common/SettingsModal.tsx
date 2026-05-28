import { useState, useEffect } from "react"
import { useAuthStore } from "../../store/auth.store"
import { useAppStore } from "../../store/app.store"
import { updateMyProfileApi, getMyProfileApi } from "../../api/profile.api"
import { getMyBusinessApi, updateBusinessApi } from "../../api/businesses.api"
import { uploadMediaApi } from "../../api/media.api"
import {
  getBusinessGalleryApi,
  addGalleryPhotoApi,
  deleteGalleryPhotoApi
} from "../../api/gallery.api"
import {
  X,
  User,
  Building,
  Upload,
  Camera,
  Save,
  CheckCircle,
  Loader2,
  Phone,
  Mail,
  MapPin,
  FileText,
  Image,
  Trash2
} from "lucide-react"

interface SettingsModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const { user, setUser } = useAuthStore()
  const { setSelectedBusiness } = useAppStore()

  const [activeTab, setActiveTab] = useState<"account" | "business" | "gallery">("account")
  
  // Profile state
  const [profileName, setProfileName] = useState("")
  const [profilePhone, setProfilePhone] = useState("")
  const [profileMediaId, setProfileMediaId] = useState<string | null>(null)
  const [profilePhotoUrl, setProfilePhotoUrl] = useState<string | null>(null)
  const [uploadingProfile, setUploadingProfile] = useState(false)

  // Business state
  const [businessId, setBusinessId] = useState<string | null>(null)
  const [businessName, setBusinessName] = useState("")
  const [businessDesc, setBusinessDesc] = useState("")
  const [businessPhone, setBusinessPhone] = useState("")
  const [businessEmail, setBusinessEmail] = useState("")
  const [businessAddress, setBusinessAddress] = useState("")
  const [businessCity, setBusinessCity] = useState("")
  const [businessLogoMediaId, setBusinessLogoMediaId] = useState<string | null>(null)
  const [businessLogoUrl, setBusinessLogoUrl] = useState<string | null>(null)
  const [businessCoverMediaId, setBusinessCoverMediaId] = useState<string | null>(null)
  const [businessCoverUrl, setBusinessCoverUrl] = useState<string | null>(null)
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [uploadingCover, setUploadingCover] = useState(false)

  // Gallery state
  const [gallery, setGallery] = useState<any[]>([])
  const [uploadingGallery, setUploadingGallery] = useState(false)

  // Global UI status
  const [isSaving, setIsSaving] = useState(false)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  // Fetch data on open
  useEffect(() => {
    if (!isOpen) return

    async function loadData() {
      try {
        setErrorMsg(null)
        setSuccessMsg(null)
        
        // Fetch user profile
        const userProfile = await getMyProfileApi()
        setProfileName(userProfile.name || "")
        setProfilePhone(userProfile.phone || "")
        setProfileMediaId(userProfile.profile_media_id || null)
        setProfilePhotoUrl(userProfile.profile_photo_url || null)

        // If business admin, fetch business profile
        if (user?.role === "business_admin" || user?.role === "super_admin") {
          try {
            const biz = await getMyBusinessApi()
            setBusinessId(biz.id)
            setBusinessName(biz.name || "")
            setBusinessDesc(biz.description || "")
            setBusinessPhone(biz.phone || "")
            setBusinessEmail(biz.email || "")
            setBusinessAddress(biz.address || "")
            setBusinessCity(biz.city || "")
            setBusinessLogoMediaId(biz.logo_media_id || null)
            setBusinessLogoUrl(biz.logo_url || null)
            setBusinessCoverMediaId(biz.cover_media_id || null)
            setBusinessCoverUrl(biz.cover_url || null)
            
            // Fetch business gallery photos
            if (biz.id) {
              const photos = await getBusinessGalleryApi(biz.id)
              setGallery(photos)
            }
          } catch (bizErr) {
            console.error("No active business found for this profile", bizErr)
          }
        }
      } catch (err: any) {
        console.error(err)
        setErrorMsg("Failed to load settings data.")
      }
    }

    loadData()
  }, [isOpen, user?.role])

  if (!isOpen) return null

  // User Profile Picture upload handler
  const handleProfilePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      setUploadingProfile(true)
      setErrorMsg(null)
      const media = await uploadMediaApi(file, "user_profiles")
      setProfileMediaId(media.id)
      setProfilePhotoUrl(media.url)
    } catch (err: any) {
      console.error(err)
      setErrorMsg("Failed to upload avatar photo.")
    } finally {
      setUploadingProfile(false)
    }
  }

  // Business Logo upload handler
  const handleBusinessLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      setUploadingLogo(true)
      setErrorMsg(null)
      const media = await uploadMediaApi(file, "business_logos")
      setBusinessLogoMediaId(media.id)
      setBusinessLogoUrl(media.url)
    } catch (err: any) {
      console.error(err)
      setErrorMsg("Failed to upload business logo.")
    } finally {
      setUploadingLogo(false)
    }
  }

  // Business Cover upload handler
  const handleBusinessCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      setUploadingCover(true)
      setErrorMsg(null)
      const media = await uploadMediaApi(file, "business_covers")
      setBusinessCoverMediaId(media.id)
      setBusinessCoverUrl(media.url)
    } catch (err: any) {
      console.error(err)
      setErrorMsg("Failed to upload cover banner.")
    } finally {
      setUploadingCover(false)
    }
  }

  // Business Gallery Upload handler
  const handleGalleryPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !businessId) return

    try {
      setUploadingGallery(true)
      setErrorMsg(null)
      const media = await uploadMediaApi(file, "business_gallery")
      const newItem = await addGalleryPhotoApi(businessId, media.id, gallery.length)
      setGallery((prev) => [newItem, ...prev])
      setSuccessMsg("Showcase photo added successfully!")
    } catch (err: any) {
      console.error(err)
      setErrorMsg("Failed to add image to showcase gallery.")
    } finally {
      setUploadingGallery(false)
    }
  }

  // Business Gallery Delete handler
  const handleDeleteGalleryPhoto = async (galleryId: string) => {
    if (!businessId) return
    try {
      setErrorMsg(null)
      await deleteGalleryPhotoApi(businessId, galleryId)
      setGallery((prev) => prev.filter((item) => item.id !== galleryId))
      setSuccessMsg("Showcase photo removed successfully!")
    } catch (err: any) {
      console.error(err)
      setErrorMsg("Failed to delete gallery photo.")
    }
  }

  // General Save Action
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    setErrorMsg(null)
    setSuccessMsg(null)

    try {
      if (activeTab === "account") {
        const updatedUser = await updateMyProfileApi({
          name: profileName,
          phone: profilePhone || null,
          profile_media_id: profileMediaId
        })
        
        // Sync Zustand store
        setUser(updatedUser)
        setSuccessMsg("Account profile updated successfully!")
      } else if (activeTab === "business" && businessId) {
        const updatedBiz = await updateBusinessApi(businessId, {
          name: businessName,
          description: businessDesc || null,
          phone: businessPhone || null,
          email: businessEmail || null,
          address: businessAddress || null,
          city: businessCity || null,
          logo_media_id: businessLogoMediaId,
          cover_media_id: businessCoverMediaId
        })

        // Sync business settings in Zustand store/shell
        setSelectedBusiness({ id: updatedBiz.id, name: updatedBiz.name })
        setSuccessMsg("Business profile updated successfully!")
      }
      
      setTimeout(() => setSuccessMsg(null), 3000)
    } catch (err: any) {
      console.error(err)
      setErrorMsg(err.response?.data?.message || "Failed to save updates. Please try again.")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 backdrop-blur-sm p-4 animate-fade-in">
      <div 
        className="fixed inset-0" 
        onClick={onClose} 
      />

      <div className="relative bg-white rounded-2xl w-full max-w-lg shadow-vercel-2xl overflow-hidden flex flex-col border border-neutral-100 z-10 max-h-[90vh] animate-scale-up">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#ebebeb] flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-neutral-900 tracking-[-0.28px]">Settings Console</h2>
            <p className="text-xs text-neutral-500">Manage your avatar, profiles and credentials</p>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-neutral-100 text-neutral-400 hover:text-neutral-600 transition"
          >
            <X className="h-4.5 w-4.5" />
          </button>
        </div>

        {/* Tab Selection */}
        {(user?.role === "business_admin" || user?.role === "super_admin") && businessId && (
          <div className="flex border-b border-[#ebebeb] bg-[#fafafa] px-3">
            <button
              type="button"
              onClick={() => { setActiveTab("account"); setErrorMsg(null); setSuccessMsg(null); }}
              className={`flex items-center gap-2 px-4 py-3 text-xs font-semibold border-b-2 transition cursor-pointer
                ${activeTab === "account" 
                  ? "border-neutral-950 text-neutral-950" 
                  : "border-transparent text-neutral-500 hover:text-neutral-950"}`}
            >
              <User className="h-4 w-4" />
              My Profile
            </button>
            <button
              type="button"
              onClick={() => { setActiveTab("business"); setErrorMsg(null); setSuccessMsg(null); }}
              className={`flex items-center gap-2 px-4 py-3 text-xs font-semibold border-b-2 transition cursor-pointer
                ${activeTab === "business" 
                  ? "border-neutral-950 text-neutral-950" 
                  : "border-transparent text-neutral-500 hover:text-neutral-950"}`}
            >
              <Building className="h-4 w-4" />
              Business Settings
            </button>
            <button
              type="button"
              onClick={() => { setActiveTab("gallery"); setErrorMsg(null); setSuccessMsg(null); }}
              className={`flex items-center gap-2 px-4 py-3 text-xs font-semibold border-b-2 transition cursor-pointer
                ${activeTab === "gallery" 
                  ? "border-neutral-950 text-neutral-950" 
                  : "border-transparent text-neutral-500 hover:text-neutral-950"}`}
            >
              <Image className="h-4 w-4" />
              Photo Gallery
            </button>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-5">
          {errorMsg && (
            <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-lg text-xs font-medium">
              {errorMsg}
            </div>
          )}

          {successMsg && (
            <div className="bg-emerald-50 border border-emerald-100 text-emerald-700 px-4 py-3 rounded-lg text-xs font-semibold flex items-center gap-2 animate-bounce-short">
              <CheckCircle className="h-4 w-4 shrink-0 text-emerald-600" />
              {successMsg}
            </div>
          )}

          {activeTab === "account" && (
            /* ──────────────── MY PROFILE TAB ──────────────── */
            <div className="space-y-6">
              {/* Circular Avatar Upload */}
              <div className="flex flex-col items-center justify-center pt-2">
                <span className="block text-[10px] font-bold text-neutral-500 uppercase mb-3">Avatar Profile Image</span>
                
                <div className="relative group">
                  <div className="h-24 w-24 rounded-full overflow-hidden border border-neutral-200 shadow-vercel-sm bg-neutral-100 flex items-center justify-center transition group-hover:border-neutral-300">
                    {profilePhotoUrl ? (
                      <img 
                        src={profilePhotoUrl} 
                        alt="Avatar" 
                        className="h-full w-full object-cover" 
                      />
                    ) : (
                      <div className="h-full w-full bg-neutral-950 flex items-center justify-center text-white font-bold text-2xl uppercase">
                        {profileName ? profileName.substring(0, 2) : <User className="h-8 w-8 text-neutral-400" />}
                      </div>
                    )}
                  </div>

                  {/* Upload overlay */}
                  <label className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition duration-200 flex flex-col items-center justify-center cursor-pointer text-white text-[10px] font-semibold">
                    <Camera className="h-4 w-4 mb-0.5" />
                    <span>Upload</span>
                    <input 
                      type="file" 
                      accept="image/*" 
                      className="hidden" 
                      onChange={handleProfilePhotoUpload}
                      disabled={uploadingProfile}
                    />
                  </label>

                  {/* Loading Spinner */}
                  {uploadingProfile && (
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-xs rounded-full flex items-center justify-center text-white">
                      <Loader2 className="h-6 w-6 animate-spin text-white" />
                    </div>
                  )}
                </div>
              </div>

              {/* Account Inputs */}
              <div className="space-y-4 pt-2">
                <div>
                  <label className="block text-[10px] font-bold text-neutral-700 mb-1.5 uppercase">Full Name</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-400">
                      <User className="h-4 w-4" />
                    </div>
                    <input
                      type="text"
                      required
                      className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-200 text-sm outline-none transition focus:ring-2 focus:ring-neutral-950 focus:border-transparent font-medium"
                      value={profileName}
                      onChange={(e) => setProfileName(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-neutral-700 mb-1.5 uppercase">Phone Number</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-400">
                      <Phone className="h-4 w-4" />
                    </div>
                    <input
                      type="tel"
                      className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-200 text-sm outline-none transition focus:ring-2 focus:ring-neutral-950 focus:border-transparent font-medium"
                      value={profilePhone}
                      onChange={(e) => setProfilePhone(e.target.value)}
                      placeholder="e.g. +919876543210"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "business" && (
            /* ──────────────── BUSINESS PROFILE TAB ──────────────── */
            <div className="space-y-6">
              {/* Media Rows */}
              <div className="grid grid-cols-2 gap-4 pb-2">
                {/* Logo Upload */}
                <div className="flex flex-col items-center">
                  <span className="block text-[10px] font-bold text-neutral-500 uppercase mb-2">Logo (1:1)</span>
                  <div className="relative group">
                    <div className="h-16 w-16 rounded-full overflow-hidden border border-neutral-200 shadow-vercel-sm bg-neutral-100 flex items-center justify-center">
                      {businessLogoUrl ? (
                        <img src={businessLogoUrl} alt="Logo" className="h-full w-full object-cover" />
                      ) : (
                        <div className="h-full w-full bg-neutral-950 flex items-center justify-center text-white font-bold text-sm uppercase">
                          {businessName ? businessName.substring(0, 2) : <Building className="h-5 w-5 text-neutral-400" />}
                        </div>
                      )}
                    </div>

                    <label className="absolute inset-0 bg-black/45 rounded-full opacity-0 group-hover:opacity-100 transition duration-200 flex flex-col items-center justify-center cursor-pointer text-white text-[9px] font-semibold">
                      <Upload className="h-3 w-3" />
                      <span>Upload</span>
                      <input 
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        onChange={handleBusinessLogoUpload}
                        disabled={uploadingLogo}
                      />
                    </label>

                    {uploadingLogo && (
                      <div className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center text-white">
                        <Loader2 className="h-4 w-4 animate-spin text-white" />
                      </div>
                    )}
                  </div>
                </div>

                {/* Cover Upload */}
                <div className="flex flex-col items-center">
                  <span className="block text-[10px] font-bold text-neutral-500 uppercase mb-2">Cover Banner (16:9)</span>
                  <div className="relative group">
                    <div className="h-16 w-28 rounded-lg overflow-hidden border border-neutral-200 shadow-vercel-sm bg-neutral-100 flex items-center justify-center">
                      {businessCoverUrl ? (
                        <img src={businessCoverUrl} alt="Cover" className="h-full w-full object-cover" />
                      ) : (
                        <div className="h-full w-full bg-neutral-950 flex items-center justify-center text-white">
                          <Camera className="h-4 w-4 text-neutral-400" />
                        </div>
                      )}
                    </div>

                    <label className="absolute inset-0 bg-black/45 rounded-lg opacity-0 group-hover:opacity-100 transition duration-200 flex flex-col items-center justify-center cursor-pointer text-white text-[9px] font-semibold">
                      <Upload className="h-3 w-3" />
                      <span>Upload</span>
                      <input 
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        onChange={handleBusinessCoverUpload}
                        disabled={uploadingCover}
                      />
                    </label>

                    {uploadingCover && (
                      <div className="absolute inset-0 bg-black/60 rounded-lg flex items-center justify-center text-white">
                        <Loader2 className="h-4 w-4 animate-spin text-white" />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Form inputs */}
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-neutral-700 mb-1.5 uppercase">Business Name</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-400">
                      <Building className="h-4 w-4" />
                    </div>
                    <input
                      type="text"
                      required
                      className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-200 text-sm outline-none transition focus:ring-2 focus:ring-neutral-950 focus:border-transparent font-medium"
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-neutral-700 mb-1.5 uppercase">Description</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 pt-2.5 flex items-start pointer-events-none text-neutral-400">
                      <FileText className="h-4 w-4" />
                    </div>
                    <textarea
                      rows={3}
                      className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-200 text-sm outline-none transition focus:ring-2 focus:ring-neutral-950 focus:border-transparent font-medium"
                      value={businessDesc}
                      onChange={(e) => setBusinessDesc(e.target.value)}
                      placeholder="Tell customers about your workspace..."
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-neutral-700 mb-1.5 uppercase">Workspace Email</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-400">
                        <Mail className="h-4 w-4" />
                      </div>
                      <input
                        type="email"
                        className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-200 text-sm outline-none transition focus:ring-2 focus:ring-neutral-950 focus:border-transparent font-medium"
                        value={businessEmail}
                        onChange={(e) => setBusinessEmail(e.target.value)}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-neutral-700 mb-1.5 uppercase">Workspace Phone</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-400">
                        <Phone className="h-4 w-4" />
                      </div>
                      <input
                        type="tel"
                        className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-200 text-sm outline-none transition focus:ring-2 focus:ring-neutral-950 focus:border-transparent font-medium"
                        value={businessPhone}
                        onChange={(e) => setBusinessPhone(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-2">
                    <label className="block text-[10px] font-bold text-neutral-700 mb-1.5 uppercase">Address</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-400">
                        <MapPin className="h-4 w-4" />
                      </div>
                      <input
                        type="text"
                        className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-200 text-sm outline-none transition focus:ring-2 focus:ring-neutral-950 focus:border-transparent font-medium"
                        value={businessAddress}
                        onChange={(e) => setBusinessAddress(e.target.value)}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-neutral-700 mb-1.5 uppercase">City</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm outline-none transition focus:ring-2 focus:ring-neutral-950 focus:border-transparent font-medium"
                      value={businessCity}
                      onChange={(e) => setBusinessCity(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "gallery" && (
            /* ──────────────── PHOTO GALLERY TAB ──────────────── */
            <div className="space-y-6 animate-fade-in">
              {/* Upload zone */}
              <div className="flex flex-col items-center justify-center">
                <label className="w-full flex flex-col items-center justify-center border-2 border-dashed border-neutral-200 hover:border-neutral-900 rounded-xl p-6 cursor-pointer bg-[#fafafa] hover:bg-white transition duration-200 group relative">
                  <Image className="h-6 w-6 text-neutral-400 group-hover:text-neutral-900 mb-2 transition" />
                  <span className="text-xs font-semibold text-neutral-700 group-hover:text-neutral-900 transition">
                    Upload new showcase photo
                  </span>
                  <span className="text-[10px] text-neutral-400 mt-1">Supports PNG, JPG, GIF up to 10MB</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleGalleryPhotoUpload}
                    disabled={uploadingGallery}
                  />
                  {uploadingGallery && (
                    <div className="absolute inset-0 bg-white/80 rounded-xl flex items-center justify-center">
                      <Loader2 className="h-6 w-6 animate-spin text-neutral-900" />
                    </div>
                  )}
                </label>
              </div>

              {/* Photos Grid */}
              <div className="space-y-3">
                <span className="block text-[10px] font-bold text-neutral-500 uppercase">Current Photos Showcase ({gallery.length})</span>
                
                {gallery.length === 0 ? (
                  <div className="border border-neutral-100 rounded-xl py-12 flex flex-col items-center justify-center bg-[#fafafa] text-neutral-400">
                    <Image className="h-8 w-8 text-neutral-300 mb-2" />
                    <p className="text-xs font-medium">Your business gallery is empty.</p>
                    <p className="text-[10px] text-neutral-400 mt-0.5">Upload photos above to showcase your workspace!</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-3">
                    {gallery.map((photo) => (
                      <div 
                        key={photo.id} 
                        className="aspect-[4/3] rounded-lg overflow-hidden border border-neutral-100 relative group bg-neutral-50"
                      >
                        <img 
                          src={photo.url} 
                          alt="Showcase" 
                          className="h-full w-full object-cover group-hover:scale-105 transition duration-300"
                        />
                        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition duration-150 flex items-center justify-center">
                          <button
                            type="button"
                            onClick={() => handleDeleteGalleryPhoto(photo.id)}
                            className="bg-red-600 hover:bg-red-700 text-white rounded-full p-2 cursor-pointer shadow-vercel-lg transform scale-90 group-hover:scale-100 transition duration-200"
                            title="Delete Photo"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </form>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[#ebebeb] bg-[#fafafa] flex items-center justify-end gap-3 shrink-0">
          {activeTab === "gallery" ? (
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 rounded-lg text-xs font-semibold bg-neutral-950 text-white shadow-vercel-sm hover:bg-neutral-900 transition cursor-pointer"
            >
              Done
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-lg text-xs font-semibold text-neutral-600 hover:bg-neutral-100 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={isSaving || uploadingProfile || uploadingLogo || uploadingCover}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-neutral-950 text-white shadow-vercel-sm hover:bg-neutral-900 transition disabled:opacity-50 cursor-pointer"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Save className="h-3.5 w-3.5" />
                    <span>Save Changes</span>
                  </>
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
