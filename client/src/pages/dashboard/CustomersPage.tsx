import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useAppStore } from "../../store/app.store"
import {
  listCustomersApi,
  createCustomerApi,
  updateCustomerApi,
  getCustomerBookingsApi
} from "../../api/customers.api"
import {
  Search,
  Plus,
  User,
  Phone,
  Mail,
  FileText,
  Calendar,
  Smile,
  Crown,
  UserPlus,
  X,
  Check,
  AlertCircle,
  Loader2,
  Scissors,
  Coins,
  Edit2
} from "lucide-react"
import { motion, AnimatePresence } from "motion/react"
import { formatDate, formatTime } from "../../lib/date"
import type { Customer, Booking } from "../../types"

export default function CustomersPage() {
  const queryClient = useQueryClient()
  const { selectedBusiness } = useAppStore()
  const businessId = selectedBusiness?.id

  // ── States ──────────────────────────────────────────────────
  const [searchQuery, setSearchQuery] = useState("")
  const [isAddDrawerOpen, setIsAddDrawerOpen] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [isEditMode, setIsEditMode] = useState(false)

  // Add Customer Form States
  const [addName, setAddName] = useState("")
  const [addPhone, setAddPhone] = useState("")
  const [addEmail, setAddEmail] = useState("")
  const [addNotes, setAddNotes] = useState("")
  const [addError, setAddError] = useState<string | null>(null)

  // Edit Customer Form States
  const [editName, setEditName] = useState("")
  const [editPhone, setEditPhone] = useState("")
  const [editEmail, setEditEmail] = useState("")
  const [editNotes, setEditNotes] = useState("")
  const [editError, setEditError] = useState<string | null>(null)

  // ── React Query: Customers List ──────────────────────────────
  const { data: customers = [], isLoading: listLoading } = useQuery({
    queryKey: ["customers", businessId, searchQuery],
    queryFn: () =>
      businessId ? listCustomersApi(businessId, searchQuery) : Promise.resolve([]),
    enabled: !!businessId
  })

  // ── React Query: Customer Booking History ────────────────────
  const { data: bookingHistory = [], isLoading: historyLoading } = useQuery({
    queryKey: ["customer-bookings", businessId, selectedCustomer?.id],
    queryFn: () =>
      businessId && selectedCustomer?.id
        ? getCustomerBookingsApi(businessId, selectedCustomer.id)
        : Promise.resolve([]),
    enabled: !!businessId && !!selectedCustomer?.id
  })

  // ── Mutations ───────────────────────────────────────────────
  const createCustomerMutation = useMutation({
    mutationFn: (data: { name: string; phone?: string; email?: string; notes?: string }) => {
      if (!businessId) throw new Error("Missing Business ID")
      return createCustomerApi(businessId, data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers", businessId] })
      setIsAddDrawerOpen(false)
      resetAddForm()
    },
    onError: (err: any) => {
      setAddError(err || "Failed to create customer")
    }
  })

  const updateCustomerMutation = useMutation({
    mutationFn: (data: Partial<Customer>) => {
      if (!businessId || !selectedCustomer?.id) throw new Error("Missing Business or Customer ID")
      return updateCustomerApi(businessId, selectedCustomer.id, data)
    },
    onSuccess: (updatedCustomer) => {
      queryClient.invalidateQueries({ queryKey: ["customers", businessId] })
      setSelectedCustomer(updatedCustomer)
      setIsEditMode(false)
    },
    onError: (err: any) => {
      setEditError(err || "Failed to update customer")
    }
  })

  // ── Computed Stats ──────────────────────────────────────────
  const totalCustomers = customers.length
  // VIPs defined as customers with >= 3 bookings
  const vipCustomersCount = customers.filter((c) => c.total_bookings >= 3).length
  // Total customer bookings sum
  const totalSpentHistory = bookingHistory
    .filter((b) => b.booking_status === "completed")
    .reduce((sum, b) => sum + Number(b.total_amount || 0), 0)

  // ── Form Actions ────────────────────────────────────────────
  const resetAddForm = () => {
    setAddName("")
    setAddPhone("")
    setAddEmail("")
    setAddNotes("")
    setAddError(null)
  }

  const handleAddCustomerSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setAddError(null)

    if (!addName.trim()) {
      setAddError("Customer Name is required")
      return
    }

    createCustomerMutation.mutate({
      name: addName,
      phone: addPhone || undefined,
      email: addEmail || undefined,
      notes: addNotes || undefined
    })
  }

  const handleEditCustomerSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setEditError(null)

    if (!editName.trim()) {
      setEditError("Customer Name is required")
      return
    }

    updateCustomerMutation.mutate({
      name: editName,
      phone: editPhone || null,
      email: editEmail || null,
      notes: editNotes || null
    })
  }

  const startEditing = (c: Customer) => {
    setEditName(c.name)
    setEditPhone(c.phone || "")
    setEditEmail(c.email || "")
    setEditNotes(c.notes || "")
    setEditError(null)
    setIsEditMode(true)
  }

  return (
    <div className="relative">
      {/* ── Search & Filter Controls ───────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-3 h-4.5 w-4.5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search CRM by name, phone or email..."
            className="w-full pl-11 pr-4 py-2.5 rounded-md border border-gray-200 bg-white text-sm focus:ring-2 focus:ring-neutral-950 focus:border-neutral-950 outline-hidden transition shadow-vercel-sm"
          />
        </div>

        <button
          onClick={() => {
            resetAddForm()
            setIsAddDrawerOpen(true)
          }}
          className="flex items-center justify-center gap-2 px-5 py-2.5 bg-neutral-950 hover:bg-neutral-900 text-white rounded-md text-sm font-semibold shadow-vercel-md hover:shadow-vercel-lg transition duration-150"
        >
          <UserPlus className="h-4.5 w-4.5" />
          Add Customer
        </button>
      </div>

      {/* ── Metrics Cards Panel ────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {[
          { label: "CRM Directory Size", value: totalCustomers, icon: Smile, color: "text-neutral-950", bg: "bg-neutral-100/70" },
          { label: "Active VIP Clients", value: vipCustomersCount, icon: Crown, color: "text-amber-500", bg: "bg-amber-50/50" },
          { label: "Debounced Searches", value: searchQuery ? "Active" : "Standard Filter", icon: Search, color: "text-emerald-600", bg: "bg-emerald-50/50" }
        ].map((stat, i) => (
          <div
            key={i}
            className="bg-white rounded-lg border border-gray-100 shadow-vercel-sm p-5 flex items-center gap-4 transition hover:shadow-vercel-md"
          >
            <div className={`p-3.5 rounded-md ${stat.bg} ${stat.color}`}>
              <stat.icon className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-400 ">{stat.label}</p>
              <p className="text-2xl font-semibold mt-1 text-gray-800">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Customers Registry Display Grid ────────────────────── */}
      {listLoading ? (
        <div className="py-24 flex flex-col items-center justify-center bg-white border border-gray-100 rounded-lg shadow-vercel-sm">
          <Loader2 className="h-8 w-8 text-neutral-950 animate-spin" />
          <p className="text-xs text-gray-400 mt-3 font-medium">Retrieving customer directory...</p>
        </div>
      ) : customers.length === 0 ? (
        <div className="py-20 text-center bg-white border border-gray-100 rounded-lg shadow-vercel-sm">
          <User className="mx-auto h-12 w-12 text-gray-300" />
          <h3 className="mt-4 text-sm font-semibold text-gray-700">No Customers Found</h3>
          <p className="mt-2 text-xs text-gray-400 max-w-sm mx-auto">
            {searchQuery
              ? "We couldn't find any results matching your search terms. Double check spelling or search parameters."
              : "No clients are recorded inside the CRM database directory yet. Click the button above to register one."}
          </p>
          {!searchQuery && (
            <button
              onClick={() => {
                resetAddForm()
                setIsAddDrawerOpen(true)
              }}
              className="mt-5 inline-flex items-center gap-1.5 px-4 py-2 border border-neutral-300 text-xs font-semibold text-neutral-950 rounded-md bg-neutral-100/70 hover:bg-neutral-100 transition"
            >
              <Plus className="h-4 w-4" /> Add First Customer
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {customers.map((c) => {
            const isVip = c.total_bookings >= 3
            return (
              <motion.div
                layout
                key={c.id}
                onClick={() => {
                  setSelectedCustomer(c)
                  setIsEditMode(false)
                  setEditError(null)
                }}
                className={`p-5 rounded-lg border transition duration-150 cursor-pointer flex flex-col justify-between bg-white text-left relative overflow-hidden group
                  ${
                    selectedCustomer?.id === c.id
                      ? "border-neutral-950 shadow-vercel-sm"
                      : "border-gray-100 hover:border-neutral-300 hover:shadow-vercel-sm"
                  }`}
              >
                {/* VIP badge icon */}
                {isVip && (
                  <span className="absolute top-0 right-0 bg-amber-500 text-white p-1 rounded-bl-xl shadow-vercel-sm" title="VIP Customer">
                    <Crown className="h-3.5 w-3.5" />
                  </span>
                )}

                <div>
                  <div className="flex items-center gap-3">
                    <div className={`h-11 w-11 rounded-md flex items-center justify-center font-semibold text-base uppercase shrink-0
                      ${isVip ? "bg-amber-50 text-amber-600" : "bg-neutral-100 text-neutral-950"}`}>
                      {c.name.substring(0, 2)}
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-sm font-semibold text-gray-800 truncate group-hover:text-neutral-950 transition">
                        {c.name}
                      </h4>
                      <p className="text-[10px] text-gray-400 mt-0.5  font-semibold">
                        Registered {formatDate(c.created_at).split(",")[1]}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4.5 space-y-2 text-xs text-gray-500">
                    {c.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                        <span className="truncate">{c.phone}</span>
                      </div>
                    )}
                    {c.email && (
                      <div className="flex items-center gap-2">
                        <Mail className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                        <span className="truncate">{c.email}</span>
                      </div>
                    )}
                    {c.notes && (
                      <div className="flex items-start gap-2 bg-gray-50 p-2 rounded-md border border-gray-100 mt-1">
                        <FileText className="h-3.5 w-3.5 text-gray-400 shrink-0 mt-0.5" />
                        <p className="line-clamp-2 italic text-[11px] text-gray-400 leading-tight">
                          "{c.notes}"
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer Metrics */}
                <div className="border-t border-gray-50 mt-5 pt-3.5 flex justify-between items-center text-xs">
                  <div>
                    <span className="text-gray-400">Total Bookings</span>
                    <p className="font-semibold text-gray-800 mt-0.5">{c.total_bookings} slots</p>
                  </div>
                  {c.last_booking_date ? (
                    <div className="text-right">
                      <span className="text-gray-400">Last Visited</span>
                      <p className="font-semibold text-gray-800 mt-0.5">{formatDate(c.last_booking_date).split(",")[1]}</p>
                    </div>
                  ) : (
                    <span className="text-[10px] text-gray-400 italic">No bookings recorded</span>
                  )}
                </div>
              </motion.div>
            )
          })}
        </div>
      )}

      {/* ── VIP CUSTOMER DETAIL DRAWER ─────────────────────────── */}
      <AnimatePresence>
        {selectedCustomer && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setSelectedCustomer(null)
                setIsEditMode(false)
              }}
              className="fixed inset-0 bg-gray-900/40 backdrop-blur-xs z-40"
            />

            {/* Slide Panel */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 220 }}
              className="fixed right-0 top-0 bottom-0 w-full max-w-lg bg-white border-l border-gray-100 shadow-vercel-lg z-50 flex flex-col"
            >
              {/* Header */}
              <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-neutral-950 text-white shrink-0">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-md bg-neutral-800 text-white flex items-center justify-center font-semibold text-sm uppercase">
                    {selectedCustomer.name.substring(0, 2)}
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold flex items-center gap-1.5">
                      {selectedCustomer.name}
                      {selectedCustomer.total_bookings >= 3 && (
                        <Crown className="h-4 w-4 text-amber-400 shrink-0" />
                      )}
                    </h3>
                    <p className="text-[10px] text-neutral-400 font-semibold">
                      VIP Client CRM profile
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {!isEditMode && (
                    <button
                      onClick={() => startEditing(selectedCustomer)}
                      className="p-1.5 rounded-md bg-neutral-900/60 text-neutral-300 hover:text-white hover:bg-neutral-800 transition"
                      title="Edit Customer"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setSelectedCustomer(null)
                      setIsEditMode(false)
                    }}
                    className="p-1.5 rounded-md bg-neutral-900/60 text-neutral-300 hover:text-white hover:bg-neutral-800 transition"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {/* Drawer Body content area */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* 1. PROFILE INFO OR EDIT FORM */}
                {isEditMode ? (
                  <form onSubmit={handleEditCustomerSubmit} className="space-y-4 p-4 border border-neutral-100 bg-neutral-100/50 rounded-lg">
                    <h4 className="text-xs font-semibold text-gray-700 ">Edit Profile Details</h4>
                    
                    <div>
                      <label className="block text-[10px] font-semibold text-gray-500  mb-1">
                        Client Name
                      </label>
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="w-full px-3 py-2 text-xs rounded-md border border-gray-200 focus:ring-1 focus:ring-neutral-950 outline-hidden bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-semibold text-gray-500  mb-1">
                        Phone Number
                      </label>
                      <input
                        type="text"
                        value={editPhone}
                        onChange={(e) => setEditPhone(e.target.value)}
                        className="w-full px-3 py-2 text-xs rounded-md border border-gray-200 focus:ring-1 focus:ring-neutral-950 outline-hidden bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-semibold text-gray-500  mb-1">
                        Email Address
                      </label>
                      <input
                        type="email"
                        value={editEmail}
                        onChange={(e) => setEditEmail(e.target.value)}
                        className="w-full px-3 py-2 text-xs rounded-md border border-gray-200 focus:ring-1 focus:ring-neutral-950 outline-hidden bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-semibold text-gray-500  mb-1">
                        Practitioner Notes
                      </label>
                      <textarea
                        value={editNotes}
                        onChange={(e) => setEditNotes(e.target.value)}
                        rows={3}
                        className="w-full px-3 py-2 text-xs rounded-md border border-gray-200 focus:ring-1 focus:ring-neutral-950 outline-hidden resize-none bg-white"
                      />
                    </div>

                    {editError && (
                      <div className="p-3 bg-red-50 text-red-600 rounded-md text-xs flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 shrink-0" />
                        <span>{editError}</span>
                      </div>
                    )}

                    <div className="flex gap-2.5 pt-2">
                      <button
                        type="button"
                        onClick={() => setIsEditMode(false)}
                        className="flex-1 px-4 py-2 border border-gray-200 text-gray-600 rounded-md text-xs font-semibold hover:bg-gray-50 transition"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={updateCustomerMutation.isPending}
                        className="flex-1 px-4 py-2 bg-neutral-950 hover:bg-neutral-900 text-white rounded-md text-xs font-semibold flex items-center justify-center gap-1 shadow-vercel-sm disabled:bg-gray-300 transition"
                      >
                        {updateCustomerMutation.isPending && (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        )}
                        Save Changes
                      </button>
                    </div>
                  </form>
                ) : (
                  /* Standard display details card */
                  <div className="p-5 rounded-lg border border-gray-100 bg-gray-50/30 grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <span className="text-gray-400 font-medium">Phone contact</span>
                      <p className="font-semibold text-gray-800 mt-1 flex items-center gap-1.5">
                        <Phone className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                        {selectedCustomer.phone || "No Phone"}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-400 font-medium">Email address</span>
                      <p className="font-semibold text-gray-800 mt-1 flex items-center gap-1.5 truncate">
                        <Mail className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                        {selectedCustomer.email || "No Email"}
                      </p>
                    </div>
                    <div className="col-span-2 border-t border-gray-100 pt-3">
                      <span className="text-gray-400 font-medium">Internal Notes</span>
                      <p className="text-gray-600 mt-1 bg-white p-2.5 rounded-md border border-gray-100/50 leading-relaxed">
                        {selectedCustomer.notes || "No notes registered yet."}
                      </p>
                    </div>
                  </div>
                )}

                {/* 2. TIMELINE HISTORY TRACKING PANEL */}
                <div className="space-y-4 border-t border-gray-100 pt-5">
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="text-xs font-semibold text-gray-700 ">Booking History timeline</h4>
                      <p className="text-[10px] text-gray-400">Logs of all past or scheduled visits.</p>
                    </div>
                    {bookingHistory.length > 0 && (
                      <span className="text-[11px] font-semibold text-neutral-950 bg-neutral-100 px-2.5 py-1 rounded-full border border-neutral-200 flex items-center gap-1">
                        <Coins className="h-3.5 w-3.5" />
                        Total Spent: ₹{totalSpentHistory.toLocaleString("en-IN")}
                      </span>
                    )}
                  </div>

                  {historyLoading ? (
                    <div className="py-12 flex flex-col items-center justify-center">
                      <Loader2 className="h-6 w-6 text-neutral-950 animate-spin" />
                      <p className="text-[10px] text-gray-400 mt-2 font-medium">Loading history logs...</p>
                    </div>
                  ) : bookingHistory.length === 0 ? (
                    <div className="py-12 text-center border border-dashed border-gray-200 rounded-lg">
                      <Calendar className="mx-auto h-9 w-9 text-gray-300" />
                      <p className="text-xs font-semibold text-gray-700 mt-3">No history logs</p>
                      <p className="text-[10px] text-gray-400 mt-1 max-w-[200px] mx-auto">
                        This client hasn't booked any slots inside the CRM CRM.
                      </p>
                    </div>
                  ) : (
                    <div className="relative border-l border-neutral-200 ml-3 pl-5 space-y-5">
                      {bookingHistory
                        .slice()
                        .sort((a, b) => b.booking_date.localeCompare(a.booking_date) || b.start_time.localeCompare(a.start_time))
                        .map((booking: Booking) => {
                          const statusColors = {
                            pending: "bg-amber-50 text-amber-700 border-amber-200/50",
                            confirmed: "bg-neutral-100 text-neutral-800 border-neutral-300/50",
                            completed: "bg-emerald-50 text-emerald-700 border-emerald-200/50",
                            cancelled: "bg-rose-50 text-rose-700 border-rose-200/50",
                            no_show: "bg-slate-50 text-slate-700 border-slate-200/50"
                          }

                          return (
                            <div key={booking.id} className="relative">
                              {/* Timeline indicator node */}
                              <span className="absolute -left-[27px] top-1 h-3.5 w-3.5 rounded-full border-2 border-neutral-950 bg-white ring-4 ring-white" />

                              <div className="p-4 bg-white border border-gray-100 rounded-lg flex flex-col sm:flex-row justify-between gap-3 text-xs shadow-vercel-sm hover:border-neutral-200 hover:shadow-vercel-sm transition duration-150">
                                <div>
                                  <div className="flex items-center gap-2">
                                    <p className="font-semibold text-gray-800">
                                      {formatDate(booking.booking_date).split(",")[1]}
                                    </p>
                                    <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full border ${statusColors[booking.booking_status]}`}>
                                      {booking.booking_status.replace("_", " ")}
                                    </span>
                                  </div>
                                  <p className="text-[10px] text-gray-400 mt-0.5 font-medium">
                                    Slot: {formatTime(booking.start_time)} (duration: {booking.end_time ? `${booking.start_time} - ${booking.end_time}` : ""})
                                  </p>
                                  
                                  <div className="flex flex-wrap gap-1 mt-2.5">
                                    {booking.services?.map((srv) => (
                                      <span
                                        key={srv.id}
                                        className="inline-flex items-center gap-0.5 text-[9px] font-medium px-1.5 py-0.5 bg-gray-50 border border-gray-100 text-gray-600 rounded-md"
                                      >
                                        <Scissors className="h-2.5 w-2.5 text-neutral-700" />
                                        {srv.service_name}
                                      </span>
                                    ))}
                                  </div>

                                  {booking.employee_name && (
                                    <p className="text-[10px] text-gray-400 mt-2 font-medium flex items-center gap-1">
                                      <User className="h-3 w-3 text-gray-400" />
                                      Stylist: <span className="font-semibold text-gray-600">{booking.employee_name}</span>
                                    </p>
                                  )}
                                </div>
                                
                                <div className="text-left sm:text-right min-w-[70px] border-t sm:border-t-0 pt-2 sm:pt-0 border-gray-100">
                                  <p className="text-[10px] text-gray-400">Total Spent</p>
                                  <p className="font-semibold text-gray-800 mt-0.5">
                                    ₹{Number(booking.total_amount || 0).toLocaleString("en-IN")}
                                  </p>
                                  <p className="text-[9px] text-gray-400 mt-0.5 capitalize">
                                    {booking.payment_type.replace("_", " ")}
                                  </p>
                                </div>
                              </div>
                            </div>
                          )
                        })}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── ADD NEW CUSTOMER DRAWER ────────────────────────────── */}
      <AnimatePresence>
        {isAddDrawerOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAddDrawerOpen(false)}
              className="fixed inset-0 bg-gray-900/40 backdrop-blur-xs z-40"
            />

            {/* Slide Panel */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 220 }}
              className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-white border-l border-gray-100 shadow-vercel-lg z-50 flex flex-col"
            >
              {/* Header */}
              <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-neutral-950 text-white shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-neutral-800 rounded-md text-white">
                    <UserPlus className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold">Register Client</h3>
                    <p className="text-[10px] text-neutral-400 font-semibold tracking-wider uppercase">
                      New Customer Registration
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsAddDrawerOpen(false)}
                  className="p-1.5 rounded-md bg-neutral-900/60 text-neutral-300 hover:text-white hover:bg-neutral-800 transition"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Form Content */}
              <form onSubmit={handleAddCustomerSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
                <div>
                  <h4 className="text-xs font-semibold text-gray-400  mb-2">Basic Profile Info</h4>
                  <p className="text-xs text-gray-400">
                    Register full name and contact information to keep track of bookings.
                  </p>
                </div>

                <div>
                  <label className="block text-[10px] font-semibold text-gray-500  mb-1">
                    Client Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={addName}
                    onChange={(e) => setAddName(e.target.value)}
                    placeholder="Riya Mehta"
                    className="w-full px-3.5 py-2.5 text-xs rounded-md border border-gray-200 focus:ring-2 focus:ring-neutral-950 focus:border-neutral-950 outline-hidden bg-white"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-semibold text-gray-500  mb-1">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    value={addPhone}
                    onChange={(e) => setAddPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full px-3.5 py-2.5 text-xs rounded-md border border-gray-200 focus:ring-2 focus:ring-neutral-950 focus:border-neutral-950 outline-hidden bg-white"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-semibold text-gray-500  mb-1">
                    Email address
                  </label>
                  <input
                    type="email"
                    value={addEmail}
                    onChange={(e) => setAddEmail(e.target.value)}
                    placeholder="riya@example.com"
                    className="w-full px-3.5 py-2.5 text-xs rounded-md border border-gray-200 focus:ring-2 focus:ring-neutral-950 focus:border-neutral-950 outline-hidden bg-white"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-semibold text-gray-500  mb-1">
                    Internal notes / Comments
                  </label>
                  <textarea
                    value={addNotes}
                    onChange={(e) => setAddNotes(e.target.value)}
                    placeholder="Special requests, hair styling notes, allergen sensitivities..."
                    rows={4}
                    className="w-full px-3.5 py-2.5 text-xs rounded-md border border-gray-200 focus:ring-2 focus:ring-neutral-950 focus:border-neutral-950 outline-hidden resize-none bg-white"
                  />
                </div>

                {addError && (
                  <div className="p-3.5 bg-red-50 text-red-600 rounded-md text-xs flex items-center gap-2">
                    <AlertCircle className="h-4.5 w-4.5 shrink-0" />
                    <span>{addError}</span>
                  </div>
                )}

                <div className="pt-4 flex gap-3 border-t border-gray-50">
                  <button
                    type="button"
                    onClick={() => setIsAddDrawerOpen(false)}
                    className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-600 rounded-md text-xs font-semibold hover:bg-gray-50 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={createCustomerMutation.isPending}
                    className="flex-1 px-4 py-2.5 bg-neutral-950 hover:bg-neutral-900 text-white rounded-md text-xs font-semibold flex items-center justify-center gap-1.5 shadow-vercel-md hover:shadow-vercel-lg disabled:bg-gray-300 transition"
                  >
                    {createCustomerMutation.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Check className="h-4 w-4" />
                        Save Customer
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
