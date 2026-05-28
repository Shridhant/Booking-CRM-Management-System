import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useAppStore } from "../../store/app.store"
import {
  listBranchesApi,
  createBranchApi,
  updateBranchApi,
  deleteBranchApi
} from "../../api/branches.api"
import {
  Building,
  Plus,
  MapPin,
  Clock,
  Phone,
  Edit2,
  Trash2,
  X,
  Loader2,
  Check
} from "lucide-react"
import { motion, AnimatePresence } from "motion/react"
import { formatTime } from "../../lib/date"
import type { Branch } from "../../types"
import ThreeDotsLoader from "../../components/common/ThreeDotsLoader"


export default function BranchesPage() {
  const queryClient = useQueryClient()
  const { selectedBusiness, selectedBranch, setSelectedBranch } = useAppStore()
  const businessId = selectedBusiness?.id

  // ── States ──────────────────────────────────────────────────
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [drawerType, setDrawerType] = useState<"add" | "edit">("add")
  const [activeBranch, setActiveBranch] = useState<Branch | null>(null)

  // Form states
  const [name, setName] = useState("")
  const [address, setAddress] = useState("")
  const [city, setCity] = useState("")
  const [phone, setPhone] = useState("")
  const [openingTime, setOpeningTime] = useState("10:00")
  const [closingTime, setClosingTime] = useState("18:00")

  // Errors
  const [formError, setFormError] = useState<string | null>(null)

  // ── React Query ─────────────────────────────────────────────
  const { data: branches = [], isLoading } = useQuery({
    queryKey: ["branches", businessId],
    queryFn: () => (businessId ? listBranchesApi(businessId) : Promise.resolve([])),
    enabled: !!businessId
  })

  // ── Mutations ───────────────────────────────────────────────
  const addBranchMutation = useMutation({
    mutationFn: (data: Partial<Branch>) => {
      if (!businessId) throw new Error("No business ID")
      return createBranchApi(businessId, data)
    },
    onSuccess: (newBranch) => {
      queryClient.invalidateQueries({ queryKey: ["branches", businessId] })
      // Auto-select if first branch
      if (branches.length === 0) {
        setSelectedBranch({ id: newBranch.id, name: newBranch.name })
      }
      setDrawerOpen(false)
      resetForms()
    },
    onError: (err: any) => setFormError(err || "Failed to create branch")
  })

  const editBranchMutation = useMutation({
    mutationFn: (data: { id: string; payload: Partial<Branch> }) => {
      if (!businessId) throw new Error("No business ID")
      return updateBranchApi(businessId, data.id, data.payload)
    },
    onSuccess: (updatedBranch) => {
      queryClient.invalidateQueries({ queryKey: ["branches", businessId] })
      // Update global active branch if we edited the active one
      if (selectedBranch?.id === updatedBranch.id) {
        setSelectedBranch({ id: updatedBranch.id, name: updatedBranch.name })
      }
      setDrawerOpen(false)
      resetForms()
    },
    onError: (err: any) => setFormError(err || "Failed to update branch")
  })

  const deleteBranchMutation = useMutation({
    mutationFn: (id: string) => {
      if (!businessId) throw new Error("No business ID")
      return deleteBranchApi(businessId, id)
    },
    onSuccess: (_, deletedId) => {
      queryClient.invalidateQueries({ queryKey: ["branches", businessId] })
      // Clear active branch if we deleted it
      if (selectedBranch?.id === deletedId) {
        const remaining = branches.filter((b) => b.id !== deletedId)
        if (remaining.length > 0) {
          setSelectedBranch({ id: remaining[0].id, name: remaining[0].name })
        } else {
          // No branches left
          queryClient.setQueryData(["branches", businessId], [])
        }
      }
      setDrawerOpen(false)
      resetForms()
    },
    onError: (err: any) => setFormError(err || "Failed to delete branch")
  })

  // ── Functions ───────────────────────────────────────────────
  const resetForms = () => {
    setName("")
    setAddress("")
    setCity("")
    setPhone("")
    setOpeningTime("10:00")
    setClosingTime("18:00")
    setFormError(null)
    setActiveBranch(null)
  }

  const openAddDrawer = () => {
    resetForms()
    setDrawerType("add")
    setDrawerOpen(true)
  }

  const openEditDrawer = (b: Branch) => {
    resetForms()
    setActiveBranch(b)
    setName(b.name)
    setAddress(b.address || "")
    setCity(b.city || "")
    setPhone(b.phone || "")
    setOpeningTime(b.opening_time?.substring(0, 5) || "10:00")
    setClosingTime(b.closing_time?.substring(0, 5) || "18:00")
    setDrawerType("edit")
    setDrawerOpen(true)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)

    if (!name.trim()) return setFormError("Branch name is required")

    const payload = {
      name,
      address: address.trim() || null,
      city: city.trim() || null,
      phone: phone.trim() || null,
      opening_time: openingTime || null,
      closing_time: closingTime || null
    }

    if (drawerType === "add") {
      addBranchMutation.mutate(payload)
    } else if (drawerType === "edit" && activeBranch) {
      editBranchMutation.mutate({ id: activeBranch.id, payload })
    }
  }

  const isSubmitting =
    addBranchMutation.isPending || editBranchMutation.isPending || deleteBranchMutation.isPending

  if (!businessId) {
    return (
      <div className="flex flex-col items-center justify-center h-96 text-gray-500">
        <Building className="h-12 w-12 text-gray-300 mb-3" />
        <p className="font-medium text-sm">Please switch or select a business to start.</p>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto pb-12">
      {/* ── Top Header ────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <p className="text-gray-500 text-sm">
            Manage your retail locations, coordinate operation hours, and view contacts.
          </p>
        </div>
        <button
          onClick={openAddDrawer}
          className="flex items-center gap-2 px-4 py-2.5 rounded-md bg-neutral-950 hover:bg-neutral-900 text-sm font-semibold text-white shadow-vercel-md hover:shadow-vercel-lg transition duration-150 shrink-0 self-start sm:self-center"
        >
          <Plus className="h-4.5 w-4.5" />
          Add Branch
        </button>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-500 gap-3">
          <ThreeDotsLoader color="bg-neutral-900" size="w-3 h-3" className="py-2" />
          <p className="text-sm font-medium">Fetching locations...</p>
        </div>
      ) : branches.length === 0 ? (
        <div className="bg-white rounded-lg border border-dashed border-gray-200 p-12 text-center max-w-md mx-auto">
          <div className="mx-auto h-12 w-12 text-gray-400 bg-gray-50 rounded-full flex items-center justify-center mb-4">
            <Building className="h-6 w-6" />
          </div>
          <h3 className="font-semibold text-gray-900 text-base mb-1">No Branches Found</h3>
          <p className="text-xs text-gray-500 mb-6">
            Get started by adding your first location like " Saket" or "Chhattarpur".
          </p>
          <button
            onClick={openAddDrawer}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-md bg-neutral-950 hover:bg-neutral-900 text-sm font-semibold text-white transition"
          >
            <Plus className="h-4.5 w-4.5" />
            Add First Branch
          </button>
        </div>
      ) : (
        /* ── Branches Grid ───────────────────────────────────── */
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {branches.map((b) => {
            const isActiveView = selectedBranch?.id === b.id

            return (
              <div
                key={b.id}
                className={`bg-white rounded-lg border transition duration-200 p-6 flex flex-col justify-between shadow-vercel-sm group relative hover:shadow-vercel-sm
                  ${
                    isActiveView
                      ? "border-neutral-950 ring-2 ring-neutral-100"
                      : "border-gray-100 hover:border-gray-200"
                  }`}
              >
                {/* Active Indicator Tag */}
                {isActiveView && (
                  <span className="absolute top-4 right-4 bg-neutral-100 text-neutral-950 text-[10px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-vercel-sm animate-fade-in">
                    <Check className="h-3 w-3" />
                    Managing
                  </span>
                )}

                {/* Card Top */}
                <div className="space-y-4">
                  {/* Icon & Title */}
                  <div className="flex items-start gap-3 pr-20">
                    <div className="p-2.5 rounded-md bg-neutral-100 text-neutral-950 shrink-0">
                      <Building className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-semibold text-gray-900 text-sm truncate">{b.name}</h4>
                      <p className="text-xs text-gray-500 truncate mt-0.5">{b.city || "Delhi"}</p>
                    </div>
                  </div>

                  {/* Attributes */}
                  <div className="space-y-2.5 pt-2 text-xs text-gray-600">
                    {/* Address */}
                    {b.address && (
                      <div className="flex items-start gap-2.5">
                        <MapPin className="h-4 w-4 text-gray-400 shrink-0 mt-0.5" />
                        <span className="leading-relaxed">{b.address}</span>
                      </div>
                    )}

                    {/* Hours */}
                    <div className="flex items-center gap-2.5">
                      <Clock className="h-4 w-4 text-gray-400 shrink-0" />
                      <span>
                        {b.opening_time ? formatTime(b.opening_time) : "10:00 AM"} -{" "}
                        {b.closing_time ? formatTime(b.closing_time) : "6:00 PM"}
                      </span>
                    </div>

                    {/* Phone */}
                    {b.phone && (
                      <div className="flex items-center gap-2.5">
                        <Phone className="h-4 w-4 text-gray-400 shrink-0" />
                        <span>{b.phone}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Actions */}
                <div className="flex items-center justify-between border-t border-gray-100 mt-6 pt-4.5">
                  {!isActiveView ? (
                    <button
                      onClick={() => setSelectedBranch({ id: b.id, name: b.name })}
                      className="text-xs font-semibold text-neutral-950 hover:text-neutral-800 transition"
                    >
                      Switch to Workspace
                    </button>
                  ) : (
                    <span className="text-xs font-semibold text-gray-400">Current View</span>
                  )}

                  <button
                    onClick={() => openEditDrawer(b)}
                    className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-50 hover:text-gray-600 opacity-0 group-hover:opacity-100 transition duration-150"
                    title="Edit Location Attributes"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ── Slide Drawer ──────────────────────────────────────── */}
      <AnimatePresence>
        {drawerOpen && (
          <div className="fixed inset-0 z-50 flex justify-end">
            {/* Backdrop blur overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDrawerOpen(false)}
              className="absolute inset-0 bg-gray-900/30 backdrop-blur-xs transition-opacity"
            />

            {/* Form Drawer container */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 220 }}
              className="relative w-full max-w-md bg-white h-full shadow-vercel-lg flex flex-col overflow-hidden"
            >
              {/* Drawer Header */}
              <div className="h-16 border-b border-gray-100 flex items-center justify-between px-6 bg-gray-50/50 shrink-0">
                <h3 className="font-semibold text-gray-900 text-base">
                  {drawerType === "add" ? "Create New Branch" : "Edit Branch Attributes"}
                </h3>
                <button
                  onClick={() => setDrawerOpen(false)}
                  className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Form body */}
              <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
                {formError && (
                  <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
                    {formError}
                  </div>
                )}

                {/* Name */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Branch Name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Blush Nail Studio - Saket"
                    className="w-full px-3.5 py-2.5 rounded-md border border-gray-300 outline-none transition focus:ring-2 focus:ring-neutral-950 focus:border-transparent text-sm bg-white text-gray-900"
                    disabled={isSubmitting}
                  />
                </div>

                {/* Address */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Address</label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="e.g. 12A Connaught Place"
                    className="w-full px-3.5 py-2.5 rounded-md border border-gray-300 outline-none transition focus:ring-2 focus:ring-neutral-950 focus:border-transparent text-sm bg-white text-gray-900"
                    disabled={isSubmitting}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* City */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">City</label>
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="e.g. New Delhi"
                      className="w-full px-3.5 py-2.5 rounded-md border border-gray-300 outline-none transition focus:ring-2 focus:ring-neutral-950 focus:border-transparent text-sm bg-white text-gray-900"
                      disabled={isSubmitting}
                    />
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                      Phone Number
                    </label>
                    <input
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="e.g. +91 9810000000"
                      className="w-full px-3.5 py-2.5 rounded-md border border-gray-300 outline-none transition focus:ring-2 focus:ring-neutral-950 focus:border-transparent text-sm bg-white text-gray-900"
                      disabled={isSubmitting}
                    />
                  </div>
                </div>

                {/* Operation Hours */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                      Opening Time
                    </label>
                    <input
                      type="time"
                      value={openingTime}
                      onChange={(e) => setOpeningTime(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-md border border-gray-300 outline-none transition focus:ring-2 focus:ring-neutral-950 focus:border-transparent text-sm bg-white text-gray-900"
                      disabled={isSubmitting}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                      Closing Time
                    </label>
                    <input
                      type="time"
                      value={closingTime}
                      onChange={(e) => setClosingTime(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-md border border-gray-300 outline-none transition focus:ring-2 focus:ring-neutral-950 focus:border-transparent text-sm bg-white text-gray-900"
                      disabled={isSubmitting}
                    />
                  </div>
                </div>
              </form>

              {/* Drawer footer */}
              <div className="p-6 border-t border-gray-100 bg-gray-50/50 flex items-center justify-between gap-3 shrink-0">
                {/* Delete button (Edit states only) */}
                {drawerType === "edit" && activeBranch ? (
                  <button
                    type="button"
                    onClick={() => {
                      if (
                        confirm(
                          `Are you sure you want to delete this branch (${activeBranch.name})? All appointments and bookings bound to this location will be affected.`
                        )
                      ) {
                        deleteBranchMutation.mutate(activeBranch.id)
                      }
                    }}
                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-md border border-red-200 text-red-600 bg-white hover:bg-red-50 text-sm font-semibold transition"
                    disabled={isSubmitting}
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </button>
                ) : (
                  <div /> // Filler spacing
                )}

                {/* Cancel & Save */}
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setDrawerOpen(false)}
                    className="px-4 py-2.5 rounded-md border border-gray-200 bg-white hover:bg-gray-50 text-sm font-semibold text-gray-700 transition"
                    disabled={isSubmitting}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmit}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-md bg-neutral-950 hover:bg-neutral-900 text-sm font-semibold text-white shadow-vercel-md hover:shadow-vercel-lg transition"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      "Save changes"
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
