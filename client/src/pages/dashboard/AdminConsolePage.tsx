import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { motion, AnimatePresence } from "motion/react"
import {
  Shield,
  Building,
  Users,
  CheckCircle,
  XCircle,
  Search,
  Edit2,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Sparkles,
  Scissors,
  Smile,
  Copy,
  Check,
  X,
  Loader2,
  ArrowRight,
  Globe,
  UserCheck,
  UserMinus,
  Upload,
  Camera
} from "lucide-react"

import {
  listAdminBusinessesApi,
  updateAdminBusinessApi,
  toggleAdminBusinessVerificationApi,
  listAdminUsersApi,
  deactivateAdminUserApi,
  reactivateAdminUserApi
} from "../../api/admin.api"
import type { AdminUser } from "../../api/admin.api"
import { onboardBusinessApi } from "../../api/auth.api"
import { uploadMediaApi } from "../../api/media.api"
import type { Business } from "../../types"
import ThreeDotsLoader from "../../components/common/ThreeDotsLoader"


// Onboarding Validation Schema
const onboardSchema = z.object({
  business_name: z.string().min(2, "Business name must be at least 2 characters"),
  business_type: z.enum(["salon", "spa", "nail_studio", "barber", "makeup_studio", "professional"], {
    message: "Please select a business type"
  }),
  city: z.string().min(2, "City name must be at least 2 characters"),
  address: z.string().optional(),
  business_email: z.string().email("Invalid business email").optional().or(z.literal("")),
  business_phone: z.string().optional(),
  admin_name: z.string().min(2, "Admin name must be at least 2 characters"),
  admin_email: z.string().email("Invalid admin email"),
  admin_password: z.string().min(8, "Password must be at least 8 characters"),
  admin_phone: z.string().optional()
})

type OnboardForm = z.infer<typeof onboardSchema>

// Business Edit Validation Schema
const editBusinessSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  description: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  email: z.string().email("Invalid email").optional().or(z.literal("")).nullable(),
  address: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  booking_type: z.enum(["free_booking", "pay_online_required", "partial_advance"]),
  allow_employee_selection: z.boolean(),
  auto_assign_strategy: z.enum(["manual", "least_busy", "round_robin", "random"])
})

type EditBusinessForm = z.infer<typeof editBusinessSchema>

export default function AdminConsolePage() {
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState<"businesses" | "users" | "onboard">("businesses")
  
  // Search state
  const [businessSearch, setBusinessSearch] = useState("")
  const [userSearch, setUserSearch] = useState("")

  // Edit Drawer state
  const [isEditDrawerOpen, setIsEditDrawerOpen] = useState(false)
  const [editingBusiness, setEditingBusiness] = useState<any | null>(null)
  
  // Logo & Cover upload states
  const [logoMediaId, setLogoMediaId] = useState<string | null>(null)
  const [logoUrl, setLogoUrl] = useState<string | null>(null)
  const [uploadingLogo, setUploadingLogo] = useState(false)

  const [coverMediaId, setCoverMediaId] = useState<string | null>(null)
  const [coverUrl, setCoverUrl] = useState<string | null>(null)
  const [uploadingCover, setUploadingCover] = useState(false)
  
  // Onboard Success state
  const [onboardSuccessData, setOnboardSuccessData] = useState<any | null>(null)
  const [copiedText, setCopiedText] = useState(false)

  // ── Queries ──────────────────────────────────────────────────
  const { data: businesses = [], isLoading: businessesLoading } = useQuery({
    queryKey: ["admin", "businesses"],
    queryFn: listAdminBusinessesApi,
    enabled: activeTab === "businesses"
  })

  const { data: users = [], isLoading: usersLoading } = useQuery({
    queryKey: ["admin", "users"],
    queryFn: listAdminUsersApi,
    enabled: activeTab === "users"
  })

  // ── Mutations ────────────────────────────────────────────────
  const toggleVerifyMutation = useMutation({
    mutationFn: toggleAdminBusinessVerificationApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "businesses"] })
    }
  })

  const updateBusinessMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Business> }) =>
      updateAdminBusinessApi(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "businesses"] })
      setIsEditDrawerOpen(false)
      setEditingBusiness(null)
    }
  })

  const deactivateUserMutation = useMutation({
    mutationFn: deactivateAdminUserApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] })
    }
  })

  const reactivateUserMutation = useMutation({
    mutationFn: reactivateAdminUserApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] })
    }
  })

  // ── Onboarding Form Hook ─────────────────────────────────────
  const {
    register: registerOnboard,
    handleSubmit: handleOnboardSubmit,
    control: onboardControl,
    reset: resetOnboard,
    formState: { errors: onboardErrors, isSubmitting: onboardingSubmitting }
  } = useForm<OnboardForm>({
    resolver: zodResolver(onboardSchema),
    defaultValues: {
      business_name: "",
      city: "",
      address: "",
      business_email: "",
      business_phone: "",
      admin_name: "",
      admin_email: "",
      admin_password: "",
      admin_phone: ""
    }
  })

  const onOnboardSubmit = async (data: OnboardForm) => {
    try {
      // Format data properly for the backend
      const payload = {
        ...data,
        business_email: data.business_email || undefined,
        business_phone: data.business_phone || undefined,
        admin_phone: data.admin_phone || undefined
      }
      const response = await onboardBusinessApi(payload)
      setOnboardSuccessData({
        ...response.data,
        plain_password: data.admin_password // Keep to show credentials
      })
      resetOnboard()
    } catch (err: any) {
      console.error(err)
      alert(err || "Onboarding failed.")
    }
  }

  // ── Edit Form Hook ───────────────────────────────────────────
  const {
    register: registerEdit,
    handleSubmit: handleEditSubmit,
    setValue: setEditValue,
    formState: { errors: editErrors, isSubmitting: editSubmitting }
  } = useForm<EditBusinessForm>({
    resolver: zodResolver(editBusinessSchema)
  })

  const openEditDrawer = (business: any) => {
    setEditingBusiness(business)
    setEditValue("name", business.name)
    setEditValue("description", business.description || "")
    setEditValue("phone", business.phone || "")
    setEditValue("email", business.email || "")
    setEditValue("address", business.address || "")
    setEditValue("city", business.city || "")
    setEditValue("booking_type", business.booking_type || "free_booking")
    setEditValue("allow_employee_selection", business.allow_employee_selection !== false)
    setEditValue("auto_assign_strategy", business.auto_assign_strategy || "manual")
    setLogoMediaId(business.logo_media_id || null)
    setLogoUrl(business.logo_url || null)
    setCoverMediaId(business.cover_media_id || null)
    setCoverUrl(business.cover_url || null)
    setUploadingLogo(false)
    setUploadingCover(false)
    setIsEditDrawerOpen(true)
  }

  const onEditSubmit = (data: EditBusinessForm) => {
    if (!editingBusiness) return
    
    const sanitized = {
      ...data,
      description: data.description || null,
      phone: data.phone || null,
      email: data.email || null,
      address: data.address || null,
      city: data.city || null,
    }

    updateBusinessMutation.mutate({
      id: editingBusiness.id,
      data: {
        ...sanitized,
        logo_media_id: logoMediaId,
        cover_media_id: coverMediaId
      }
    })
  }

  // ── Clipboard Utility ───────────────────────────────────────
  const copyCredentials = () => {
    if (!onboardSuccessData) return
    const text = `BUSINESS CREDENTIALS:
Business Name: ${onboardSuccessData.business.name}
Slug: ${onboardSuccessData.business.slug}
Admin Email: ${onboardSuccessData.user.email}
Admin Password: ${onboardSuccessData.plain_password}`

    navigator.clipboard.writeText(text)
    setCopiedText(true)
    setTimeout(() => setCopiedText(false), 2000)
  }

  // ── Filters ─────────────────────────────────────────────────
  const filteredBusinesses = businesses.filter((b: any) => {
    const s = businessSearch.toLowerCase()
    return (
      b.name.toLowerCase().includes(s) ||
      b.city?.toLowerCase().includes(s) ||
      b.owner_name?.toLowerCase().includes(s) ||
      b.owner_email?.toLowerCase().includes(s)
    )
  })

  const filteredUsers = users.filter((u: AdminUser) => {
    const s = userSearch.toLowerCase()
    return (
      u.name.toLowerCase().includes(s) ||
      u.email.toLowerCase().includes(s) ||
      u.role.toLowerCase().includes(s)
    )
  })

  // Business type options for onboarding selector
  const businessTypes = [
    { id: "salon", label: "Salon", icon: Scissors, desc: "Hair & styling studios" },
    { id: "spa", label: "Spa", icon: Sparkles, desc: "Therapy & wellness" },
    { id: "nail_studio", label: "Nail Studio", icon: Smile, desc: "Nails & extensions" },
    { id: "barber", label: "Barber", icon: Scissors, desc: "Men's grooming" },
    { id: "professional", label: "Professional", icon: Users, desc: "Solo practitioners" }
  ]

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header Panel */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-[#ebebeb] gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-[-0.6px] text-neutral-950 flex items-center gap-2">
            <Shield className="h-6 w-6 text-neutral-950" />
            Super Admin Console
          </h1>
          <p className="text-neutral-500 text-sm mt-1">
            Monitor registered salons, manage system-wide user credentials, and launch new partner spaces.
          </p>
        </div>

        {/* Tab Controls */}
        <div className="flex bg-neutral-100 p-0.5 rounded-lg self-start">
          <button
            onClick={() => setActiveTab("businesses")}
            className={`px-4 py-1.5 rounded-md text-xs font-semibold transition cursor-pointer select-none ${
              activeTab === "businesses"
                ? "bg-white text-neutral-950 shadow-vercel-sm"
                : "text-neutral-500 hover:text-neutral-950"
            }`}
          >
            Salons
          </button>
          <button
            onClick={() => setActiveTab("users")}
            className={`px-4 py-1.5 rounded-md text-xs font-semibold transition cursor-pointer select-none ${
              activeTab === "users"
                ? "bg-white text-neutral-950 shadow-vercel-sm"
                : "text-neutral-500 hover:text-neutral-950"
            }`}
          >
            Platform Users
          </button>
          <button
            onClick={() => {
              setActiveTab("onboard")
              setOnboardSuccessData(null)
            }}
            className={`px-4 py-1.5 rounded-md text-xs font-semibold transition cursor-pointer select-none ${
              activeTab === "onboard"
                ? "bg-white text-neutral-950 shadow-vercel-sm"
                : "text-neutral-500 hover:text-neutral-950"
            }`}
          >
            Onboard Partner
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <AnimatePresence mode="wait">
        {/* ── TAB 1: BUSINESSES ── */}
        {activeTab === "businesses" && (
          <motion.div
            key="businesses-tab"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.2 }}
            className="space-y-6"
          >
            {/* Search filter toolbar */}
            <div className="flex items-center gap-3 w-full md:max-w-md bg-white border border-[#ebebeb] px-3.5 py-2.5 rounded-md shadow-vercel-sm">
              <Search className="h-4 w-4 text-neutral-400 shrink-0" />
              <input
                type="text"
                placeholder="Search salons by name, city, owner..."
                value={businessSearch}
                onChange={(e) => setBusinessSearch(e.target.value)}
                className="w-full text-sm outline-none text-neutral-950 placeholder-neutral-400 bg-transparent"
              />
            </div>

            {businessesLoading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3">
                <ThreeDotsLoader color="bg-neutral-900" size="w-3 h-3" className="py-2" />
                <span className="text-sm font-medium text-neutral-500">Loading partner salons...</span>
              </div>
            ) : filteredBusinesses.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-lg border border-[#ebebeb] shadow-vercel-sm">
                <Building className="h-10 w-10 text-neutral-300 mx-auto mb-3" />
                <h3 className="text-sm font-semibold text-neutral-800">No Salons Found</h3>
                <p className="text-neutral-500 text-xs mt-1">Try resetting your search query or onboard a new salon.</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredBusinesses.map((b: any) => (
                  <div
                    key={b.id}
                    className="bg-white rounded-lg border border-[#ebebeb] hover:border-neutral-300 p-5 shadow-vercel-sm hover:shadow-vercel-md transition duration-200 flex flex-col justify-between"
                  >
                    <div>
                      {/* Badge / Type */}
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wider bg-neutral-100 px-2 py-0.5 rounded-full capitalize">
                          {b.business_type?.replace("_", " ") || "salon"}
                        </span>
                        
                        {/* Interactive Verification badge */}
                        <button
                          disabled={toggleVerifyMutation.isPending}
                          onClick={(e) => {
                            e.stopPropagation()
                            toggleVerifyMutation.mutate(b.id)
                          }}
                          className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold select-none cursor-pointer transition active:scale-95 duration-100 ${
                            b.is_verified
                              ? "bg-emerald-50 hover:bg-emerald-100 text-emerald-700"
                              : "bg-neutral-100 hover:bg-neutral-200 text-neutral-600"
                          }`}
                        >
                          {toggleVerifyMutation.isPending &&
                          toggleVerifyMutation.variables === b.id ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : b.is_verified ? (
                            <CheckCircle className="h-3.5 w-3.5" />
                          ) : (
                            <XCircle className="h-3.5 w-3.5" />
                          )}
                          {b.is_verified ? "Verified" : "Pending"}
                        </button>
                      </div>

                      {/* Title & Slug */}
                      <div className="space-y-1 mb-4">
                        <h3 className="font-semibold text-neutral-950 text-base leading-tight truncate">
                          {b.name}
                        </h3>
                        <div className="flex items-center gap-1 text-[11px] text-neutral-500">
                          <Globe className="h-3 w-3" />
                          <span className="font-mono">/{b.slug}</span>
                        </div>
                      </div>

                      {/* Location & Details */}
                      <div className="border-t border-[#ebebeb] pt-4 mt-2 space-y-2 text-xs">
                        <div className="flex items-center justify-between text-neutral-600">
                          <span className="text-neutral-400">Location:</span>
                          <span className="font-medium text-neutral-800 flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {b.city || "Not set"}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-neutral-600">
                          <span className="text-neutral-400">Created:</span>
                          <span className="font-medium text-neutral-800 flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(b.created_at).toLocaleDateString(undefined, {
                              year: "numeric",
                              month: "short",
                              day: "numeric"
                            })}
                          </span>
                        </div>
                      </div>

                      {/* Owner Section */}
                      <div className="border-t border-[#ebebeb] pt-4 mt-4 bg-[#fafafa]/50 p-2.5 rounded-md space-y-1.5 text-xs">
                        <div className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wide">
                          Workspace Admin
                        </div>
                        <div className="font-semibold text-neutral-800 truncate">
                          {b.owner_name}
                        </div>
                        <div className="text-neutral-500 truncate flex items-center gap-1.5">
                          <Mail className="h-3 w-3 shrink-0" />
                          {b.owner_email}
                        </div>
                        {b.owner_phone && (
                          <div className="text-neutral-500 flex items-center gap-1.5">
                            <Phone className="h-3 w-3 shrink-0" />
                            {b.owner_phone}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="mt-5 pt-3 border-t border-[#ebebeb] flex justify-end">
                      <button
                        onClick={() => openEditDrawer(b)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-[#ebebeb] bg-white text-neutral-700 hover:text-neutral-950 hover:bg-neutral-50 text-xs font-semibold transition"
                      >
                        <Edit2 className="h-3 w-3" />
                        Edit Settings
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* ── TAB 2: PLATFORM USERS ── */}
        {activeTab === "users" && (
          <motion.div
            key="users-tab"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.2 }}
            className="space-y-6"
          >
            {/* Search toolbar */}
            <div className="flex items-center gap-3 w-full md:max-w-md bg-white border border-[#ebebeb] px-3.5 py-2.5 rounded-md shadow-vercel-sm">
              <Search className="h-4 w-4 text-neutral-400 shrink-0" />
              <input
                type="text"
                placeholder="Search user email, names, roles..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                className="w-full text-sm outline-none text-neutral-950 placeholder-neutral-400 bg-transparent"
              />
            </div>

            {usersLoading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3">
                <ThreeDotsLoader color="bg-neutral-900" size="w-3 h-3" className="py-2" />
                <span className="text-sm font-medium text-neutral-500">Loading directory users...</span>
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-lg border border-[#ebebeb] shadow-vercel-sm">
                <Users className="h-10 w-10 text-neutral-300 mx-auto mb-3" />
                <h3 className="text-sm font-semibold text-neutral-800">No Users Found</h3>
                <p className="text-neutral-500 text-xs mt-1">Adjust search filter or check connection.</p>
              </div>
            ) : (
              <div className="bg-white rounded-lg border border-[#ebebeb] shadow-vercel-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-neutral-50/75 border-b border-[#ebebeb] text-xs font-semibold text-neutral-500">
                        <th className="px-6 py-3.5">User Identity</th>
                        <th className="px-6 py-3.5">System Role</th>
                        <th className="px-6 py-3.5">Registration</th>
                        <th className="px-6 py-3.5">Status</th>
                        <th className="px-6 py-3.5 text-right">Access Controls</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#ebebeb] text-xs">
                      {filteredUsers.map((u: AdminUser) => {
                        const isMutating =
                          deactivateUserMutation.isPending && deactivateUserMutation.variables === u.id ||
                          reactivateUserMutation.isPending && reactivateUserMutation.variables === u.id

                        return (
                          <tr key={u.id} className="hover:bg-neutral-50/45 transition">
                            <td className="px-6 py-4.5">
                              <div className="font-semibold text-neutral-950">{u.name || "N/A"}</div>
                              <div className="text-neutral-500 font-mono mt-0.5">{u.email}</div>
                              {u.phone && <div className="text-neutral-400 mt-0.5">{u.phone}</div>}
                            </td>
                            <td className="px-6 py-4.5">
                              <span
                                className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                  u.role === "super_admin"
                                    ? "bg-violet-50 text-violet-700 border border-violet-100"
                                    : u.role === "business_admin"
                                    ? "bg-sky-50 text-sky-700 border border-sky-100"
                                    : u.role === "employee"
                                    ? "bg-amber-50 text-amber-700 border border-amber-100"
                                    : "bg-neutral-100 text-neutral-700"
                                }`}
                              >
                                {u.role.replace("_", " ")}
                              </span>
                            </td>
                            <td className="px-6 py-4.5 text-neutral-500 font-medium">
                              {new Date(u.created_at).toLocaleDateString(undefined, {
                                year: "numeric",
                                month: "short",
                                day: "numeric"
                              })}
                            </td>
                            <td className="px-6 py-4.5">
                              <span
                                className={`inline-flex items-center gap-1.5 font-semibold ${
                                  u.is_active ? "text-emerald-700" : "text-red-600"
                                }`}
                              >
                                <span
                                  className={`h-1.5 w-1.5 rounded-full ${
                                    u.is_active ? "bg-emerald-500" : "bg-red-500"
                                  }`}
                                />
                                {u.is_active ? "Active" : "Suspended"}
                              </span>
                            </td>
                            <td className="px-6 py-4.5 text-right">
                              {u.role === "super_admin" ? (
                                <span className="text-neutral-400 text-[10px] italic">Self-Protected</span>
                              ) : (
                                <button
                                  disabled={isMutating}
                                  onClick={() => {
                                    if (u.is_active) {
                                      deactivateUserMutation.mutate(u.id)
                                    } else {
                                      reactivateUserMutation.mutate(u.id)
                                    }
                                  }}
                                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition active:scale-95 duration-100 cursor-pointer ${
                                    u.is_active
                                      ? "bg-red-50 text-red-600 hover:bg-red-100"
                                      : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                                  }`}
                                >
                                  {isMutating ? (
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                  ) : u.is_active ? (
                                    <UserMinus className="h-3.5 w-3.5" />
                                  ) : (
                                    <UserCheck className="h-3.5 w-3.5" />
                                  )}
                                  {u.is_active ? "Deactivate" : "Activate"}
                                </button>
                              )}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* ── TAB 3: ONBOARD ── */}
        {activeTab === "onboard" && (
          <motion.div
            key="onboard-tab"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.2 }}
            className="w-full max-w-4xl mx-auto"
          >
            <AnimatePresence mode="wait">
              {!onboardSuccessData ? (
                /* Onboard Form */
                <motion.div
                  key="onboard-form"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  className="bg-white border border-[#ebebeb] rounded-lg p-6 sm:p-8 shadow-vercel-sm space-y-8"
                >
                  <div>
                    <h2 className="text-lg font-semibold tracking-[-0.3px] text-neutral-950">
                      Launch a Partner Salon Workspace
                    </h2>
                    <p className="text-neutral-500 text-xs mt-1">
                      Register a business profile and simultaneously instantiate the credentials for its workspace administrator.
                    </p>
                  </div>

                  <form onSubmit={handleOnboardSubmit(onOnboardSubmit)} className="space-y-8">
                    {/* Salon business specifications */}
                    <div className="space-y-4">
                      <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
                        1. Partner Salon Details
                      </h3>

                      <div className="grid sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-neutral-700 mb-1.5 uppercase">
                            Business Name *
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. Blush Styling Bar"
                            className={`w-full px-3.5 py-2 rounded-md border text-sm outline-none transition focus:ring-2 focus:ring-neutral-950 focus:border-transparent ${
                              onboardErrors.business_name ? "border-red-400 bg-red-50/20" : "border-gray-200"
                            }`}
                            {...registerOnboard("business_name")}
                          />
                          {onboardErrors.business_name && (
                            <p className="text-xs text-red-500 mt-1">{onboardErrors.business_name.message}</p>
                          )}
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-neutral-700 mb-1.5 uppercase">
                            City *
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. New Delhi"
                            className={`w-full px-3.5 py-2 rounded-md border text-sm outline-none transition focus:ring-2 focus:ring-neutral-950 focus:border-transparent ${
                              onboardErrors.city ? "border-red-400 bg-red-50/20" : "border-gray-200"
                            }`}
                            {...registerOnboard("city")}
                          />
                          {onboardErrors.city && (
                            <p className="text-xs text-red-500 mt-1">{onboardErrors.city.message}</p>
                          )}
                        </div>
                      </div>

                      <div className="grid sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-neutral-700 mb-1.5 uppercase">
                            Salon Address
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. Main Avenue Block 4"
                            className="w-full px-3.5 py-2 rounded-md border border-gray-200 text-sm outline-none transition focus:ring-2 focus:ring-neutral-950 focus:border-transparent"
                            {...registerOnboard("address")}
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-neutral-700 mb-1.5 uppercase">
                            Salon Contact Phone
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. +91 9999999999"
                            className="w-full px-3.5 py-2 rounded-md border border-gray-200 text-sm outline-none transition focus:ring-2 focus:ring-neutral-950 focus:border-transparent"
                            {...registerOnboard("business_phone")}
                          />
                        </div>
                      </div>

                      {/* Interactive type grids */}
                      <div>
                        <label className="block text-xs font-bold text-neutral-700 mb-2.5 uppercase">
                          Business Segment Type *
                        </label>
                        <Controller
                          name="business_type"
                          control={onboardControl}
                          render={({ field }) => (
                            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                              {businessTypes.map((type) => {
                                const isSelected = field.value === type.id
                                return (
                                  <button
                                    key={type.id}
                                    type="button"
                                    onClick={() => field.onChange(type.id)}
                                    className={`flex flex-col items-center justify-center p-3 rounded-lg border text-center transition cursor-pointer select-none ${
                                      isSelected
                                        ? "bg-neutral-100 border-neutral-950 text-neutral-950 shadow-vercel-sm font-semibold"
                                        : "border-gray-200 bg-white hover:bg-gray-50 text-gray-600"
                                    }`}
                                  >
                                    <type.icon className="h-5 w-5 mb-1.5 shrink-0" />
                                    <span className="text-[10px] leading-tight font-medium">
                                      {type.label}
                                    </span>
                                  </button>
                                )
                              })}
                            </div>
                          )}
                        />
                        {onboardErrors.business_type && (
                          <p className="text-xs text-red-500 mt-1.5">{onboardErrors.business_type.message}</p>
                        )}
                      </div>
                    </div>

                    {/* Admin Account Credentials */}
                    <div className="space-y-4 pt-6 border-t border-[#ebebeb]">
                      <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
                        2. Creator Admin Account
                      </h3>

                      <div className="grid sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-neutral-700 mb-1.5 uppercase">
                            Administrator Name *
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. Rahul Sharma"
                            className={`w-full px-3.5 py-2 rounded-md border text-sm outline-none transition focus:ring-2 focus:ring-neutral-950 focus:border-transparent ${
                              onboardErrors.admin_name ? "border-red-400 bg-red-50/20" : "border-gray-200"
                            }`}
                            {...registerOnboard("admin_name")}
                          />
                          {onboardErrors.admin_name && (
                            <p className="text-xs text-red-500 mt-1">{onboardErrors.admin_name.message}</p>
                          )}
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-neutral-700 mb-1.5 uppercase">
                            Admin Account Email *
                          </label>
                          <input
                            type="email"
                            placeholder="e.g. admin@blush.com"
                            className={`w-full px-3.5 py-2 rounded-md border text-sm outline-none transition focus:ring-2 focus:ring-neutral-950 focus:border-transparent ${
                              onboardErrors.admin_email ? "border-red-400 bg-red-50/20" : "border-gray-200"
                            }`}
                            {...registerOnboard("admin_email")}
                          />
                          {onboardErrors.admin_email && (
                            <p className="text-xs text-red-500 mt-1">{onboardErrors.admin_email.message}</p>
                          )}
                        </div>
                      </div>

                      <div className="grid sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-neutral-700 mb-1.5 uppercase">
                            Workspace Password *
                          </label>
                          <input
                            type="password"
                            placeholder="Min. 8 characters"
                            className={`w-full px-3.5 py-2 rounded-md border text-sm outline-none transition focus:ring-2 focus:ring-neutral-950 focus:border-transparent ${
                              onboardErrors.admin_password ? "border-red-400 bg-red-50/20" : "border-gray-200"
                            }`}
                            {...registerOnboard("admin_password")}
                          />
                          {onboardErrors.admin_password && (
                            <p className="text-xs text-red-500 mt-1">{onboardErrors.admin_password.message}</p>
                          )}
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-neutral-700 mb-1.5 uppercase">
                            Admin Cellphone
                          </label>
                          <input
                            type="text"
                            placeholder="Optional"
                            className="w-full px-3.5 py-2 rounded-md border border-gray-200 text-sm outline-none transition focus:ring-2 focus:ring-neutral-950 focus:border-transparent"
                            {...registerOnboard("admin_phone")}
                          />
                        </div>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={onboardingSubmitting}
                      className="w-full bg-neutral-950 hover:bg-neutral-900 disabled:opacity-60 text-white font-semibold py-3 px-4 rounded-md text-sm transition duration-150 shadow-vercel-md hover:shadow-vercel-lg flex items-center justify-center gap-2 cursor-pointer"
                    >
                      {onboardingSubmitting ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Launching Workspace...
                        </>
                      ) : (
                        <>
                          Instantiate Partner Salon
                          <ArrowRight className="h-4.5 w-4.5" />
                        </>
                      )}
                    </button>
                  </form>
                </motion.div>
              ) : (
                /* Onboard Success */
                <motion.div
                  key="onboard-success"
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  className="bg-white border border-[#ebebeb] rounded-lg p-8 shadow-vercel-lg text-center space-y-6 max-w-lg mx-auto"
                >
                  <div className="mx-auto h-16 w-16 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-500">
                    <CheckCircle className="h-10 w-10" />
                  </div>

                  <div className="space-y-2">
                    <h2 className="text-xl font-bold tracking-[-0.4px] text-neutral-950">
                      Partner Salon Launched!
                    </h2>
                    <p className="text-neutral-500 text-xs px-2 leading-relaxed">
                      The space has been created successfully. Hand over these administrative dashboard credentials to the workspace owner.
                    </p>
                  </div>

                  {/* Credentials Receipt Box */}
                  <div className="bg-neutral-50 rounded-lg p-5 text-left border border-[#ebebeb] space-y-3.5 text-xs">
                    <div>
                      <span className="text-[10px] font-semibold text-neutral-400 block uppercase">
                        Business Workspace Name
                      </span>
                      <span className="text-sm font-semibold text-neutral-950">
                        {onboardSuccessData.business.name}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-[10px] font-semibold text-neutral-400 block uppercase">
                          Workspace segment
                        </span>
                        <span className="font-semibold text-neutral-950 capitalize">
                          {onboardSuccessData.business.business_type}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] font-semibold text-neutral-400 block uppercase">
                          Slug / URL Path
                        </span>
                        <span className="font-mono font-semibold text-neutral-950">
                          /{onboardSuccessData.business.slug}
                        </span>
                      </div>
                    </div>

                    <div className="border-t border-[#ebebeb] pt-3 space-y-2">
                      <div>
                        <span className="text-[10px] font-semibold text-neutral-400 block uppercase">
                          Login Admin Email
                        </span>
                        <span className="font-mono font-semibold text-neutral-950">
                          {onboardSuccessData.user.email}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] font-semibold text-neutral-400 block uppercase">
                          Workspace Password
                        </span>
                        <span className="font-mono font-semibold text-neutral-950">
                          {onboardSuccessData.plain_password}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="flex flex-col sm:flex-row gap-3">
                    <button
                      onClick={copyCredentials}
                      className="flex-1 bg-white hover:bg-neutral-50 text-neutral-800 border border-gray-200 font-semibold py-2.5 px-4 rounded-md text-xs transition flex items-center justify-center gap-2 cursor-pointer"
                    >
                      {copiedText ? (
                        <>
                          <Check className="h-4 w-4 text-emerald-500" />
                          Copied to Clipboard!
                        </>
                      ) : (
                        <>
                          <Copy className="h-4 w-4 text-neutral-500" />
                          Copy Credentials Info
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => setOnboardSuccessData(null)}
                      className="flex-1 bg-neutral-950 hover:bg-neutral-900 text-white font-semibold py-2.5 px-4 rounded-md text-xs transition shadow-vercel-sm flex items-center justify-center gap-2 cursor-pointer"
                    >
                      Onboard Another
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── EDIT PARTNER BUSINESS SLIDE DRAWER ── */}
      <AnimatePresence>
        {isEditDrawerOpen && editingBusiness && (
          <>
            {/* Backdrop click-away */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setIsEditDrawerOpen(false)
                setEditingBusiness(null)
              }}
              className="fixed inset-0 bg-neutral-950 z-40"
            />

            {/* Slide drawer container */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 220 }}
              className="fixed inset-y-0 right-0 w-full max-w-lg bg-white border-l border-[#ebebeb] z-50 shadow-2xl p-6 sm:p-8 flex flex-col justify-between overflow-y-auto"
            >
              <div>
                {/* Header */}
                <div className="flex items-center justify-between pb-6 border-b border-[#ebebeb] mb-6">
                  <div>
                    <h2 className="text-base font-bold tracking-[-0.3px] text-neutral-950">
                      Edit Salon Settings
                    </h2>
                    <p className="text-neutral-500 text-xs mt-1 font-mono">
                      ID: {editingBusiness.id}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setIsEditDrawerOpen(false)
                      setEditingBusiness(null)
                    }}
                    className="p-1 rounded-md text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700 transition"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {/* Edit Form */}
                <form onSubmit={handleEditSubmit(onEditSubmit)} className="space-y-5 text-xs">
                  {/* Business Branding (Logo & Cover) */}
                  <div className="space-y-4 bg-gray-50/50 p-4 rounded-lg border border-gray-100 mb-4">
                    <span className="block text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-2">
                      Workspace Branding
                    </span>

                    <div className="grid grid-cols-2 gap-4">
                      {/* Logo Upload (1:1) */}
                      <div className="flex flex-col items-center">
                        <span className="block text-[9px] font-semibold text-neutral-500 mb-2 uppercase">Logo Avatar</span>
                        <div className="relative group">
                          {logoUrl ? (
                            <img src={logoUrl} alt="Logo" className="h-16 w-16 rounded-full object-cover border border-gray-200 shadow-vercel-sm" />
                          ) : (
                            <div className="h-16 w-16 rounded-full bg-neutral-900 text-white font-bold flex items-center justify-center uppercase text-sm">
                              {editingBusiness.name ? editingBusiness.name.substring(0,2) : <Building className="h-5 w-5" />}
                            </div>
                          )}
                          <div className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition duration-200 flex items-center justify-center cursor-pointer">
                            <label className="cursor-pointer text-white text-[9px] font-semibold flex flex-col items-center gap-0.5 w-full h-full justify-center">
                              <Upload className="h-3 w-3" />
                              <span>Upload</span>
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={async (e) => {
                                  const file = e.target.files?.[0]
                                  if (!file) return
                                  try {
                                    setUploadingLogo(true)
                                    const media = await uploadMediaApi(file, "business_logos")
                                    setLogoMediaId(media.id)
                                    setLogoUrl(media.url)
                                  } catch (err: any) {
                                    console.error(err)
                                    alert("Logo upload failed.")
                                  } finally {
                                    setUploadingLogo(false)
                                  }
                                }}
                              />
                            </label>
                          </div>
                        </div>
                        {uploadingLogo && <span className="text-[9px] text-neutral-400 mt-1 animate-pulse">Uploading...</span>}
                      </div>

                      {/* Cover Upload (16:9) */}
                      <div className="flex flex-col items-center">
                        <span className="block text-[9px] font-semibold text-neutral-500 mb-2 uppercase">Cover Banner</span>
                        <div className="relative group">
                          {coverUrl ? (
                            <img src={coverUrl} alt="Cover" className="h-16 w-28 rounded-md object-cover border border-gray-200 shadow-vercel-sm" />
                          ) : (
                            <div className="h-16 w-28 rounded-md bg-neutral-900 text-white font-bold flex items-center justify-center uppercase text-xs">
                              <Camera className="h-4 w-4 text-neutral-400" />
                            </div>
                          )}
                          <div className="absolute inset-0 bg-black/40 rounded-md opacity-0 group-hover:opacity-100 transition duration-200 flex items-center justify-center cursor-pointer">
                            <label className="cursor-pointer text-white text-[9px] font-semibold flex flex-col items-center gap-0.5 w-full h-full justify-center">
                              <Upload className="h-3 w-3" />
                              <span>Upload</span>
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={async (e) => {
                                  const file = e.target.files?.[0]
                                  if (!file) return
                                  try {
                                    setUploadingCover(true)
                                    const media = await uploadMediaApi(file, "business_covers")
                                    setCoverMediaId(media.id)
                                    setCoverUrl(media.url)
                                  } catch (err: any) {
                                    console.error(err)
                                    alert("Cover upload failed.")
                                  } finally {
                                    setUploadingCover(false)
                                  }
                                }}
                              />
                            </label>
                          </div>
                        </div>
                        {uploadingCover && <span className="text-[9px] text-neutral-400 mt-1 animate-pulse">Uploading...</span>}
                      </div>
                    </div>
                  </div>

                  {/* Name */}
                  <div>
                    <label className="block text-[10px] font-bold text-neutral-700 mb-1.5 uppercase">
                      Business Name *
                    </label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 rounded-md border border-gray-200 text-sm outline-none transition focus:ring-2 focus:ring-neutral-950 focus:border-transparent"
                      {...registerEdit("name")}
                    />
                    {editErrors.name && (
                      <p className="text-[10px] text-red-500 mt-1">{editErrors.name.message}</p>
                    )}
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-[10px] font-bold text-neutral-700 mb-1.5 uppercase">
                      Workspace Description
                    </label>
                    <textarea
                      rows={3}
                      className="w-full px-3 py-2 rounded-md border border-gray-200 text-sm outline-none transition focus:ring-2 focus:ring-neutral-950 focus:border-transparent"
                      {...registerEdit("description")}
                    />
                  </div>

                  {/* Contact Fields */}
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-neutral-700 mb-1.5 uppercase">
                        Owner Cellphone
                      </label>
                      <input
                        type="text"
                        className="w-full px-3 py-2 rounded-md border border-gray-200 text-sm outline-none transition focus:ring-2 focus:ring-neutral-950 focus:border-transparent"
                        {...registerEdit("phone")}
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-neutral-700 mb-1.5 uppercase">
                        Owner Contact Email
                      </label>
                      <input
                        type="email"
                        className="w-full px-3 py-2 rounded-md border border-gray-200 text-sm outline-none transition focus:ring-2 focus:ring-neutral-950 focus:border-transparent"
                        {...registerEdit("email")}
                      />
                      {editErrors.email && (
                        <p className="text-[10px] text-red-500 mt-1">{editErrors.email.message}</p>
                      )}
                    </div>
                  </div>

                  {/* Location specs */}
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-neutral-700 mb-1.5 uppercase">
                        Address
                      </label>
                      <input
                        type="text"
                        className="w-full px-3 py-2 rounded-md border border-gray-200 text-sm outline-none transition focus:ring-2 focus:ring-neutral-950 focus:border-transparent"
                        {...registerEdit("address")}
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-neutral-700 mb-1.5 uppercase">
                        City
                      </label>
                      <input
                        type="text"
                        className="w-full px-3 py-2 rounded-md border border-gray-200 text-sm outline-none transition focus:ring-2 focus:ring-neutral-950 focus:border-transparent"
                        {...registerEdit("city")}
                      />
                    </div>
                  </div>

                  {/* Advanced Settings section */}
                  <div className="border-t border-[#ebebeb] pt-4 mt-4 space-y-4">
                    <h3 className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">
                      Advanced Scheduler Specifications
                    </h3>

                    {/* Booking type and Auto-assign strategy */}
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-bold text-neutral-700 mb-1.5 uppercase">
                          Booking Checkout Type
                        </label>
                        <select
                          className="w-full px-3 py-2 rounded-md border border-gray-200 text-sm outline-none bg-white transition focus:ring-2 focus:ring-neutral-950 focus:border-transparent"
                          {...registerEdit("booking_type")}
                        >
                          <option value="free_booking">Free Checkout (Pay at salon)</option>
                          <option value="pay_online_required">Online Pre-payment Required</option>
                          <option value="partial_advance">Partial Advance Deposit</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-neutral-700 mb-1.5 uppercase">
                          Auto-Assignment Strategy
                        </label>
                        <select
                          className="w-full px-3 py-2 rounded-md border border-gray-200 text-sm outline-none bg-white transition focus:ring-2 focus:ring-neutral-950 focus:border-transparent"
                          {...registerEdit("auto_assign_strategy")}
                        >
                          <option value="manual">Manual Select Only</option>
                          <option value="least_busy">Least Busy Employee</option>
                          <option value="round_robin">Round Robin Queue</option>
                          <option value="random">Random Assign</option>
                        </select>
                      </div>
                    </div>

                    {/* Allow employee selection checkbox */}
                    <div className="flex items-center gap-2.5 mt-2">
                      <input
                        type="checkbox"
                        id="allow_employee_selection"
                        className="h-4.5 w-4.5 rounded border-gray-300 text-neutral-950 focus:ring-neutral-950 cursor-pointer"
                        {...registerEdit("allow_employee_selection")}
                      />
                      <label
                        htmlFor="allow_employee_selection"
                        className="text-xs font-semibold text-neutral-700 cursor-pointer select-none"
                      >
                        Allow clients to explicitly choose staff employees during checkout
                      </label>
                    </div>
                  </div>

                  {/* Action buttons footer */}
                  <div className="flex gap-3 pt-6 border-t border-[#ebebeb] mt-8">
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditDrawerOpen(false)
                        setEditingBusiness(null)
                      }}
                      className="flex-1 bg-white hover:bg-neutral-50 text-neutral-700 border border-gray-200 font-semibold py-2.5 rounded-md text-xs transition cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={editSubmitting || updateBusinessMutation.isPending}
                      className="flex-1 bg-neutral-950 hover:bg-neutral-900 text-white font-semibold py-2.5 rounded-md text-xs transition shadow-vercel-sm flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      {(editSubmitting || updateBusinessMutation.isPending) ? (
                        <>
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          Saving changes...
                        </>
                      ) : (
                        "Save Configurations"
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
