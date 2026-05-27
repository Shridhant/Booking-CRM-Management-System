import { useState, useEffect } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useAppStore } from "../../store/app.store"
import {
  listBookingsApi,
  createBookingApi,
  updateBookingStatusApi,
  assignEmployeeToBookingApi,
  getSlotsApi,
  checkoutBookingApi
} from "../../api/bookings.api"
import { listCustomersApi, createCustomerApi } from "../../api/customers.api"
import { listCategoriesApi, listServicesApi } from "../../api/services.api"
import { listEmployeesApi } from "../../api/employees.api"
import { today, formatDate, formatTime } from "../../lib/date"
import {
  Calendar,
  Plus,
  Search,
  Scissors,
  Clock,
  CreditCard,
  ChevronRight,
  ChevronLeft,
  X,
  Check,
  AlertCircle,
  Coins,
  Loader2,
  CheckSquare,
  Square,
  Sparkles,
  Info,
  Receipt,
  Trash2
} from "lucide-react"
import { motion, AnimatePresence } from "motion/react"
import type { Customer, SlotResult, ServiceCategory, Service } from "../../types"

export default function BookingsPage() {
  const queryClient = useQueryClient()
  const { selectedBusiness, selectedBranch } = useAppStore()
  const businessId = selectedBusiness?.id
  const branchId = selectedBranch?.id

  // ── States ──────────────────────────────────────────────────
  const [bookingDate, setBookingDate] = useState(today())
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)

  // Drawer Form States
  const [activeStep, setActiveStep] = useState<"customer" | "services" | "schedule" | "finalize">("customer")

  // 1. Customer Select / Create
  const [customerSearch, setCustomerSearch] = useState("")
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [createNewCustomer, setCreateNewCustomer] = useState(false)
  const [newCustName, setNewCustName] = useState("")
  const [newCustPhone, setNewCustPhone] = useState("")
  const [newCustEmail, setNewCustEmail] = useState("")
  const [newCustNotes, setNewCustNotes] = useState("")
  const [customerError, setCustomerError] = useState<string | null>(null)

  // 2. Services Selection
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([])

  // 3. Scheduling Slots
  const [slotDate, setSlotDate] = useState(today())
  const [slotEmployeeId, setSlotEmployeeId] = useState<string>("")
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string | null>(null)
  const [assignedEmployeeId, setAssignedEmployeeId] = useState<string | null>(null)

  // 4. Final Details
  const [paymentType, setPaymentType] = useState<"pay_at_salon" | "pay_online">("pay_at_salon")
  const [bookingNotes, setBookingNotes] = useState("")
  const [bookingError, setBookingError] = useState<string | null>(null)

  // Accordion categories in Service Checklist
  const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>({})

  // ── Checkout & Invoice States ────────────────────────────────
  const [checkoutBooking, setCheckoutBooking] = useState<any | null>(null)
  const [checkoutServices, setCheckoutServices] = useState<{
    service_id: string
    service_name: string
    employee_id: string | null
    price: number
    duration_minutes: number
  }[]>([])
  const [checkoutPaymentType, setCheckoutPaymentType] = useState<"pay_at_salon" | "pay_online">("pay_at_salon")
  const [checkoutPaymentMethod, setCheckoutPaymentMethod] = useState<"cash" | "card" | "upi" | "other">("cash")
  const [checkoutNotes, setCheckoutNotes] = useState("")
  const [checkoutError, setCheckoutError] = useState<string | null>(null)
  const [showInvoice, setShowInvoice] = useState<any | null>(null)

  // ── Sync Slot Date with Dashboard Date on Open ───────────────
  useEffect(() => {
    if (isDrawerOpen) {
      setSlotDate(bookingDate)
    }
  }, [isDrawerOpen, bookingDate])

  // ── React Query: List bookings for selected Date & Branch ────
  const { data: bookings = [], isLoading: bookingsLoading } = useQuery({
    queryKey: ["bookings", businessId, branchId, bookingDate],
    queryFn: () =>
      businessId && branchId
        ? listBookingsApi(businessId, { date: bookingDate, branch_id: branchId })
        : Promise.resolve([]),
    enabled: !!businessId && !!branchId
  })

  // ── React Query: List branch employees ───────────────────────
  const { data: employees = [] } = useQuery({
    queryKey: ["employees", businessId, branchId],
    queryFn: () =>
      businessId && branchId
        ? listEmployeesApi(businessId, branchId)
        : Promise.resolve([]),
    enabled: !!businessId && !!branchId
  })

  // ── React Query: List services grouped in categories ─────────
  const { data: categories = [] } = useQuery({
    queryKey: ["categories-with-services", businessId],
    queryFn: () =>
      businessId ? listCategoriesApi(businessId, true) : Promise.resolve([]),
    enabled: !!businessId && (isDrawerOpen || !!checkoutBooking)
  })

  // ── React Query: List all flat services ──────────────────────
  const { data: allServices = [] } = useQuery({
    queryKey: ["all-services", businessId],
    queryFn: () =>
      businessId ? listServicesApi(businessId) : Promise.resolve([]),
    enabled: !!businessId && (isDrawerOpen || !!checkoutBooking)
  })

  // ── React Query: Customer Search query ───────────────────────
  const { data: customers = [], isLoading: customersSearching } = useQuery({
    queryKey: ["customers-lookup", businessId, customerSearch],
    queryFn: () =>
      businessId ? listCustomersApi(businessId, customerSearch) : Promise.resolve([]),
    enabled: !!businessId && isDrawerOpen && !createNewCustomer && customerSearch.length >= 1
  })

  // ── React Query: Available Slots Checker ─────────────────────
  const { data: slotResults = [], isLoading: slotsLoading } = useQuery({
    queryKey: ["slots", businessId, branchId, slotDate, selectedServiceIds, slotEmployeeId],
    queryFn: () => {
      if (!businessId || !branchId || selectedServiceIds.length === 0) return Promise.resolve([])
      const params: any = {
        date: slotDate,
        branch_id: branchId,
        service_ids: selectedServiceIds
      }
      if (slotEmployeeId) params.employee_id = slotEmployeeId
      return getSlotsApi(businessId, params)
    },
    enabled: !!businessId && !!branchId && isDrawerOpen && selectedServiceIds.length > 0 && activeStep === "schedule"
  })

  // ── Mutations ───────────────────────────────────────────────
  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => {
      if (!businessId) throw new Error("Missing Business ID")
      return updateBookingStatusApi(businessId, id, status)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bookings", businessId, branchId, bookingDate] })
    }
  })

  const assignEmployeeMutation = useMutation({
    mutationFn: ({ bookingId, employeeId }: { bookingId: string; employeeId: string }) => {
      if (!businessId) throw new Error("Missing Business ID")
      return assignEmployeeToBookingApi(businessId, bookingId, employeeId)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bookings", businessId, branchId, bookingDate] })
    }
  })

  const createCustomerMutation = useMutation({
    mutationFn: (data: { name: string; phone?: string; email?: string; notes?: string }) => {
      if (!businessId) throw new Error("Missing Business ID")
      return createCustomerApi(businessId, data)
    },
    onError: (err: any) => {
      setCustomerError(err || "Failed to create customer")
    }
  })

  const createBookingMutation = useMutation({
    mutationFn: (data: {
      customer_id: string
      branch_id: string
      employee_id?: string
      service_ids: string[]
      booking_date: string
      start_time: string
      payment_type: string
      notes?: string
    }) => {
      if (!businessId) throw new Error("Missing Business ID")
      return createBookingApi(businessId, data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bookings", businessId, branchId, bookingDate] })
      setIsDrawerOpen(false)
      resetDrawer()
    },
    onError: (err: any) => {
      setBookingError(err || "Failed to book slot")
    }
  })

  const checkoutBookingMutation = useMutation({
    mutationFn: (data: {
      bookingId: string
      payment_type: "pay_online" | "pay_at_salon"
      payment_method: "cash" | "card" | "upi" | "other"
      notes?: string
      services: {
        service_id: string
        employee_id: string | null
        price: number
        duration_minutes: number
      }[]
    }) => {
      if (!businessId) throw new Error("Missing Business ID")
      const { bookingId, ...payload } = data
      return checkoutBookingApi(businessId, bookingId, payload)
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["bookings", businessId, branchId, bookingDate] })
      setShowInvoice(data)
      setCheckoutBooking(null)
    },
    onError: (err: any) => {
      setCheckoutError(err || "Checkout failed")
    }
  })

  // ── Computed Service Lists & Stats ──────────────────────────
  const flatServices = allServices

  const selectedServicesObjects = flatServices.filter((s) => selectedServiceIds.includes(s.id))
  const totalDuration = selectedServicesObjects.reduce((acc, s) => acc + s.duration_minutes, 0)
  const totalPrice = selectedServicesObjects.reduce((acc, s) => acc + Number(s.min_price || 0), 0)

  // Uncategorized services
  const uncategorizedServices = flatServices.filter((s) => !s.category_id)

  // ── Calculate Stats ─────────────────────────────────────────
  const activeBookings = bookings.filter((b) => b.booking_status !== "cancelled")
  const totalCount = bookings.length
  const confirmedCount = bookings.filter((b) => b.booking_status === "confirmed").length
  const completedCount = bookings.filter((b) => b.booking_status === "completed").length
  const dailyValue = activeBookings.reduce((sum, b) => sum + Number(b.total_amount || 0), 0)

  // ── Aggregate Slots ──────────────────────────────────────────
  // Unique times slots from SlotResult list
  const uniqueTimes = Array.from(
    new Set(
      slotResults.flatMap((sr: SlotResult) => sr.slots.map((s) => s.start_time))
    )
  ).sort()

  // ── Navigation Functions ────────────────────────────────────
  const handlePrevDay = () => {
    const d = new Date(bookingDate)
    d.setDate(d.getDate() - 1)
    setBookingDate(d.toISOString().split("T")[0])
  }

  const handleNextDay = () => {
    const d = new Date(bookingDate)
    d.setDate(d.getDate() + 1)
    setBookingDate(d.toISOString().split("T")[0])
  }

  const handleToday = () => {
    setBookingDate(today())
  }

  // Toggle Service
  const handleToggleService = (serviceId: string) => {
    setSelectedTimeSlot(null) // invalidate previous slot choice
    if (selectedServiceIds.includes(serviceId)) {
      setSelectedServiceIds(selectedServiceIds.filter((id) => id !== serviceId))
    } else {
      setSelectedServiceIds([...selectedServiceIds, serviceId])
    }
  }

  const toggleCategory = (catId: string) => {
    setCollapsedCategories((prev) => ({
      ...prev,
      [catId]: !prev[catId]
    }))
  }

  // ── Reset drawer state ───────────────────────────────────────
  const resetDrawer = () => {
    setActiveStep("customer")
    setCustomerSearch("")
    setSelectedCustomer(null)
    setCreateNewCustomer(false)
    setNewCustName("")
    setNewCustPhone("")
    setNewCustEmail("")
    setNewCustNotes("")
    setCustomerError(null)
    setSelectedServiceIds([])
    setSlotEmployeeId("")
    setSelectedTimeSlot(null)
    setAssignedEmployeeId(null)
    setPaymentType("pay_at_salon")
    setBookingNotes("")
    setBookingError(null)
  }

  // ── Save New Appointment ─────────────────────────────────────
  const handleSaveAppointment = async () => {
    setBookingError(null)

    let customerId = selectedCustomer?.id

    // 1. Create customer inline if checked
    if (createNewCustomer) {
      if (!newCustName.trim()) {
        setBookingError("Customer Name is required")
        setActiveStep("customer")
        return
      }
      try {
        const newCust = await createCustomerMutation.mutateAsync({
          name: newCustName,
          phone: newCustPhone || undefined,
          email: newCustEmail || undefined,
          notes: newCustNotes || undefined
        })
        customerId = newCust.id
      } catch (err) {
        // Error already handled
        return
      }
    }

    if (!customerId) {
      setBookingError("Please select or register a customer")
      setActiveStep("customer")
      return
    }

    if (selectedServiceIds.length === 0) {
      setBookingError("Please select at least one service")
      setActiveStep("services")
      return
    }

    if (!selectedTimeSlot) {
      setBookingError("Please select an available timing slot")
      setActiveStep("schedule")
      return
    }

    // Determine employee assignment:
    // If user chose a specific employee in slot picker, or we auto-deduced it from the slots:
    let empId = assignedEmployeeId
    if (!empId) {
      // Find which employee has this slot in the results
      const srWithSlot = slotResults.find((sr) =>
        sr.slots.some((s) => s.start_time === selectedTimeSlot)
      )
      empId = srWithSlot?.employee_id || null
    }

    createBookingMutation.mutate({
      customer_id: customerId,
      branch_id: branchId!,
      employee_id: empId || undefined,
      service_ids: selectedServiceIds,
      booking_date: slotDate,
      start_time: selectedTimeSlot,
      payment_type: paymentType,
      notes: bookingNotes || undefined
    })
  }

  const handleOpenCheckout = (booking: any) => {
    setCheckoutBooking(booking)
    setCheckoutServices(
      booking.services?.map((s: any) => ({
        service_id: s.service_id,
        service_name: s.service_name,
        employee_id: s.employee_id || booking.employee_id || null,
        price: Number(s.price || 0),
        duration_minutes: Number(s.duration_minutes || 0)
      })) || []
    )
    setCheckoutPaymentType(booking.payment_type || "pay_at_salon")
    setCheckoutPaymentMethod("cash")
    setCheckoutNotes(booking.notes || "")
    setCheckoutError(null)
  }

  return (
    <div className="relative">
      {/* ── Top Navigation Toolbar ──────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrevDay}
            className="p-2 rounded-md border border-gray-200 bg-white hover:bg-gray-50 text-gray-600 shadow-vercel-sm transition duration-150"
          >
            <ChevronLeft className="h-4.5 w-4.5" />
          </button>

          <button
            onClick={handleToday}
            className="px-4 py-2 rounded-md border border-gray-200 bg-white hover:bg-gray-50 text-sm font-semibold text-gray-700 shadow-vercel-sm transition duration-150"
          >
            Today
          </button>

          <button
            onClick={handleNextDay}
            className="p-2 rounded-md border border-gray-200 bg-white hover:bg-gray-50 text-gray-600 shadow-vercel-sm transition duration-150"
          >
            <ChevronRight className="h-4.5 w-4.5" />
          </button>

          <div className="relative ml-2">
            <input
              type="date"
              value={bookingDate}
              onChange={(e) => setBookingDate(e.target.value)}
              className="px-4 py-2 rounded-md border border-gray-200 bg-white text-sm font-medium text-gray-700 shadow-vercel-sm focus:ring-2 focus:ring-neutral-950 focus:border-neutral-950 outline-hidden transition duration-150"
            />
          </div>
        </div>

        <button
          onClick={() => {
            resetDrawer()
            setIsDrawerOpen(true)
          }}
          disabled={!branchId}
          className="flex items-center justify-center gap-2 px-5 py-2.5 bg-neutral-950 hover:bg-neutral-900 text-white rounded-md text-sm font-semibold shadow-vercel-md hover:shadow-vercel-lg disabled:bg-gray-300 disabled:shadow-none transition duration-150"
        >
          <Plus className="h-4.5 w-4.5" />
          Book Appointment
        </button>
      </div>

      {/* ── Statistics Panel ────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Total Bookings", value: totalCount, icon: Calendar, color: "text-neutral-950", bg: "bg-neutral-100/70" },
          { label: "Confirmed Slots", value: confirmedCount, icon: Sparkles, color: "text-emerald-600", bg: "bg-emerald-50/50" },
          { label: "Completed Slots", value: completedCount, icon: Check, color: "text-blue-600", bg: "bg-blue-50/50" },
          { label: "Expected Value", value: `₹${dailyValue.toLocaleString("en-IN")}`, icon: Coins, color: "text-amber-600", bg: "bg-amber-50/50" }
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
              <p className={`text-2xl font-semibold mt-1 text-gray-800`}>{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Active Header Glassmorphic Status ───────────────────── */}
      <div className="bg-white rounded-lg border border-gray-100 shadow-vercel-sm overflow-hidden mb-8">
        <div className="px-6 py-5 border-b border-gray-100 bg-gray-50/40 flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-gray-800">
              Schedule Timeline for {formatDate(bookingDate)}
            </h2>
            <p className="text-xs text-gray-500 mt-1">
              Active Branch: <span className="font-semibold text-neutral-950">{selectedBranch?.name || "None"}</span>
            </p>
          </div>
          <span className="text-xs font-medium text-gray-400 bg-gray-100 px-3 py-1 rounded-full">
            {activeBookings.length} Active Booking{activeBookings.length === 1 ? "" : "s"}
          </span>
        </div>

        {/* ── Bookings Grid / Timeline List ─────────────────────── */}
        <div className="p-6">
          {!branchId ? (
            <div className="py-12 text-center">
              <BuildingIcon className="mx-auto h-12 w-12 text-gray-300" />
              <h3 className="mt-4 text-sm font-semibold text-gray-700">No Branch Selected</h3>
              <p className="mt-2 text-xs text-gray-400 max-w-xs mx-auto">
                Please select an active branch in the header dropdown to view schedules.
              </p>
            </div>
          ) : bookingsLoading ? (
            <div className="py-20 flex flex-col items-center justify-center">
              <Loader2 className="h-8 w-8 text-neutral-950 animate-spin" />
              <p className="text-xs text-gray-400 mt-3 font-medium">Loading schedule...</p>
            </div>
          ) : bookings.length === 0 ? (
            <div className="py-16 text-center">
              <Calendar className="mx-auto h-12 w-12 text-gray-300" />
              <h3 className="mt-4 text-sm font-semibold text-gray-700">No Bookings Yet</h3>
              <p className="mt-2 text-xs text-gray-400 max-w-sm mx-auto">
                There are no client bookings registered for this date. Click the button above to schedule a client.
              </p>
              <button
                onClick={() => {
                  resetDrawer()
                  setIsDrawerOpen(true)
                }}
                className="mt-5 inline-flex items-center gap-1.5 px-4 py-2 border border-neutral-300 text-xs font-semibold text-neutral-950 rounded-md bg-neutral-100/70 hover:bg-neutral-100 transition"
              >
                <Plus className="h-4 w-4" /> Book First Customer
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {bookings
                .slice()
                .sort((a, b) => a.start_time.localeCompare(b.start_time))
                .map((booking) => {
                  const statusColors = {
                    pending: "bg-amber-50 text-amber-700 border-amber-200/60",
                    confirmed: "bg-neutral-100 text-neutral-800 border-neutral-300/60",
                    completed: "bg-emerald-50 text-emerald-700 border-emerald-200/60",
                    cancelled: "bg-rose-50 text-rose-700 border-rose-200/60",
                    no_show: "bg-slate-50 text-slate-700 border-slate-200/60"
                  }

                  return (
                    <motion.div
                      layout
                      key={booking.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-5 rounded-lg border border-gray-100 bg-white hover:border-neutral-200 hover:shadow-vercel-sm transition duration-150 flex flex-col md:flex-row md:items-center justify-between gap-4"
                    >
                      {/* Left: Timing Column */}
                      <div className="flex items-start gap-4 min-w-[160px]">
                        <div className="p-3 bg-neutral-100 rounded-md text-neutral-950 text-center shrink-0">
                          <Clock className="h-5 w-5 mx-auto" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-800">
                            {formatTime(booking.start_time)}
                          </p>
                          <p className="text-[11px] font-semibold text-gray-400 mt-0.5 ">
                            to {formatTime(booking.end_time)}
                          </p>
                        </div>
                      </div>

                      {/* Center: Customer & Services */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-semibold text-gray-800 truncate">
                            {booking.customer_name || "Walk-in Customer"}
                          </h4>
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${statusColors[booking.booking_status]}`}>
                            {booking.booking_status.replace("_", " ")}
                          </span>
                        </div>

                        {booking.customer_phone && (
                          <p className="text-xs text-gray-500 mt-0.5">{booking.customer_phone}</p>
                        )}

                        <div className="flex flex-wrap gap-1.5 mt-2.5">
                          {booking.services?.map((srv) => (
                            <span
                              key={srv.id}
                              className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 bg-gray-100 text-gray-700 rounded-lg"
                            >
                              <Scissors className="h-3 w-3 text-neutral-700" />
                              {srv.service_name} ({srv.duration_minutes}m)
                            </span>
                          ))}
                        </div>

                        {booking.notes && (
                          <div className="mt-2 text-xs text-gray-400 bg-gray-50 p-2 rounded-lg border border-gray-100 flex items-start gap-1">
                            <Info className="h-3.5 w-3.5 text-gray-400 shrink-0 mt-0.5" />
                            <span className="italic">"{booking.notes}"</span>
                          </div>
                        )}
                      </div>

                      {/* Right: Actions, Staff, Payment */}
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-end gap-4 md:w-auto shrink-0 border-t md:border-t-0 pt-4 md:pt-0 border-gray-100">
                        {/* Staff Assignment */}
                        <div className="w-full sm:w-auto">
                          <label className="block text-[10px] font-semibold text-gray-400  mb-1">
                            Assigned Staff
                          </label>
                          <select
                            value={booking.employee_id || ""}
                            onChange={(e) =>
                              assignEmployeeMutation.mutate({
                                bookingId: booking.id,
                                employeeId: e.target.value
                              })
                            }
                            disabled={assignEmployeeMutation.isPending}
                            className="w-full px-3 py-1.5 bg-white border border-gray-200 text-xs font-semibold text-gray-700 rounded-md focus:outline-hidden focus:ring-2 focus:ring-neutral-950"
                          >
                            <option value="">Unassigned</option>
                            {employees.map((emp) => (
                              <option key={emp.id} value={emp.id}>
                                {emp.name}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Price Details */}
                        <div className="min-w-[80px]">
                          <p className="text-xs text-gray-400">Total Price</p>
                          <p className="text-base font-semibold text-gray-800">
                            ₹{Number(booking.total_amount || 0).toLocaleString("en-IN")}
                          </p>
                          <p className="text-[10px] text-gray-400 mt-0.5 font-medium capitalize">
                            {booking.payment_type.replace("_", " ")}
                          </p>
                        </div>

                        {/* Quick Status Buttons */}
                        <div className="flex gap-1.5">
                          {booking.booking_status === "pending" && (
                            <>
                              <button
                                onClick={() =>
                                  updateStatusMutation.mutate({ id: booking.id, status: "confirmed" })
                                }
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-neutral-950 hover:bg-neutral-800 text-white text-xs font-semibold rounded-md shadow-vercel-sm transition"
                                title="Confirm Booking"
                              >
                                <Check className="h-3.5 w-3.5" /> Confirm
                              </button>
                              <button
                                onClick={() =>
                                  updateStatusMutation.mutate({ id: booking.id, status: "cancelled" })
                                }
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-semibold rounded-md border border-rose-100/50 shadow-vercel-sm transition"
                                title="Decline Booking"
                              >
                                <X className="h-3.5 w-3.5" /> Decline
                              </button>
                            </>
                          )}

                          {booking.booking_status === "confirmed" && (
                            <>
                              <button
                                onClick={() => handleOpenCheckout(booking)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-md shadow-vercel-sm transition"
                                title="Complete Session & Checkout"
                              >
                                <Check className="h-3.5 w-3.5" /> Complete Session
                              </button>
                              <button
                                onClick={() =>
                                  updateStatusMutation.mutate({ id: booking.id, status: "cancelled" })
                                }
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-semibold rounded-md border border-rose-100/50 shadow-vercel-sm transition"
                                title="Cancel Booking"
                              >
                                <X className="h-3.5 w-3.5" /> Cancel
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )
                })}
            </div>
          )}
        </div>
      </div>

      {/* ── "Book Appointment" Framer Slide Drawer ────────────────── */}
      <AnimatePresence>
        {isDrawerOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsDrawerOpen(false)}
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
              <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-neutral-950 text-white">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-neutral-800 rounded-md text-white">
                    <Calendar className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold">New Booking</h3>
                    <p className="text-[10px] text-neutral-400 font-semibold tracking-wider uppercase">
                      Branch: {selectedBranch?.name}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsDrawerOpen(false)}
                  className="p-1.5 rounded-md bg-neutral-900/60 text-neutral-300 hover:text-white hover:bg-neutral-800 transition"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Progress Steps Indicators */}
              <div className="px-6 py-3 border-b border-gray-50 bg-gray-50/50 grid grid-cols-4 gap-2 text-center text-[10px] font-semibold text-gray-400">
                {[
                  { step: "customer", label: "Client" },
                  { step: "services", label: "Services" },
                  { step: "schedule", label: "Schedule" },
                  { step: "finalize", label: "Finalize" }
                ].map((item, idx) => {
                  const isActive = activeStep === item.step
                  // Determine completed
                  const steps = ["customer", "services", "schedule", "finalize"]
                  const activeIdx = steps.indexOf(activeStep)
                  const currentIdx = steps.indexOf(item.step)
                  const isCompleted = currentIdx < activeIdx

                  return (
                    <button
                      key={idx}
                      disabled={
                        // prevent navigation forward without completing criteria
                        (item.step === "services" && !selectedCustomer && !createNewCustomer) ||
                        (item.step === "schedule" && selectedServiceIds.length === 0) ||
                        (item.step === "finalize" && !selectedTimeSlot)
                      }
                      onClick={() => setActiveStep(item.step as any)}
                      className={`pb-1.5 border-b-2 transition duration-150 cursor-pointer disabled:cursor-not-allowed
                        ${isActive
                          ? "border-neutral-950 text-neutral-950"
                          : isCompleted
                            ? "border-emerald-500 text-emerald-600"
                            : "border-gray-200 text-gray-400 hover:text-gray-600"
                        }`}
                    >
                      {idx + 1}. {item.label}
                    </button>
                  )
                })}
              </div>

              {/* Drawer Scrollable Body Content */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* ── STEP 1: CUSTOMER VIEW ───────────────────────────────── */}
                {activeStep === "customer" && (
                  <div className="space-y-5">
                    <div>
                      <h4 className="text-sm font-semibold text-gray-800 mb-2">Customer Assignment</h4>
                      <p className="text-xs text-gray-400">
                        Search and choose an existing customer or register a new one to immediately add them to the database directory.
                      </p>
                    </div>

                    {/* Customer Selection Option */}
                    <div className="flex items-center gap-2.5 p-3 rounded-md border border-gray-100 bg-gray-50/50">
                      <input
                        type="checkbox"
                        id="new_cust_check"
                        checked={createNewCustomer}
                        onChange={(e) => {
                          setCreateNewCustomer(e.target.checked)
                          setSelectedCustomer(null)
                        }}
                        className="rounded border-gray-300 text-neutral-950 focus:ring-neutral-950"
                      />
                      <label htmlFor="new_cust_check" className="text-xs font-semibold text-gray-700 cursor-pointer">
                        Register a new customer on the fly
                      </label>
                    </div>

                    {!createNewCustomer ? (
                      <div className="space-y-4">
                        {/* Search existing */}
                        <div className="relative">
                          <Search className="absolute left-3 top-2.5 h-4.5 w-4.5 text-gray-400" />
                          <input
                            type="text"
                            value={customerSearch}
                            onChange={(e) => setCustomerSearch(e.target.value)}
                            placeholder="Type client's name or phone..."
                            className="w-full pl-10 pr-4 py-2.5 rounded-md border border-gray-200 focus:ring-2 focus:ring-neutral-950 focus:border-neutral-950 outline-hidden text-sm"
                          />
                        </div>

                        {/* Customer Search result display */}
                        {customersSearching ? (
                          <div className="py-4 text-center text-xs text-gray-400">Searching records...</div>
                        ) : customerSearch.length < 1 ? (
                          <div className="py-8 text-center text-xs text-gray-400 border border-dashed border-gray-200 rounded-lg">
                            Type a search keyword (e.g. name or phone) to look up customer records.
                          </div>
                        ) : customers.length === 0 ? (
                          <div className="py-6 text-center text-xs text-amber-600 border border-amber-100 rounded-lg bg-amber-50/30">
                            No records found. Consider checking "Register a new customer" checkbox.
                          </div>
                        ) : (
                          <div className="border border-gray-100 rounded-lg divide-y divide-gray-50 overflow-hidden bg-white max-h-60 overflow-y-auto">
                            {customers.map((c) => (
                              <button
                                key={c.id}
                                onClick={() => setSelectedCustomer(c)}
                                className={`w-full text-left px-4 py-3 text-xs flex items-center justify-between transition hover:bg-neutral-100/60
                                  ${selectedCustomer?.id === c.id
                                    ? "bg-neutral-100 text-neutral-800 font-semibold"
                                    : "text-gray-700"
                                  }`}
                              >
                                <div>
                                  <p className="font-semibold text-gray-800">{c.name}</p>
                                  <p className="text-[10px] text-gray-400 mt-0.5">{c.phone || c.email || "No contact info"}</p>
                                </div>
                                {selectedCustomer?.id === c.id && (
                                  <Check className="h-4 w-4 text-neutral-950 shrink-0" />
                                )}
                              </button>
                            ))}
                          </div>
                        )}

                        {selectedCustomer && (
                          <div className="p-4 bg-emerald-50/60 border border-emerald-100 rounded-lg flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-emerald-600 text-white flex items-center justify-center font-semibold text-sm uppercase">
                              {selectedCustomer.name.substring(0, 2)}
                            </div>
                            <div>
                              <p className="text-xs font-semibold text-gray-800">Assigned Client</p>
                              <p className="text-xs text-emerald-800 font-medium">{selectedCustomer.name} ({selectedCustomer.phone || "No Phone"})</p>
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      /* Create new client inline form */
                      <div className="space-y-3.5 p-4 border border-neutral-100 bg-neutral-100/50 rounded-lg">
                        <div>
                          <label className="block text-[10px] font-semibold text-gray-500  mb-1">
                            Client Name <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={newCustName}
                            onChange={(e) => setNewCustName(e.target.value)}
                            placeholder="Riya Mehta"
                            className="w-full px-3 py-2 text-xs rounded-md border border-gray-200 focus:ring-1 focus:ring-neutral-950 outline-hidden bg-white"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-semibold text-gray-500  mb-1">
                            Phone Number
                          </label>
                          <input
                            type="text"
                            value={newCustPhone}
                            onChange={(e) => setNewCustPhone(e.target.value)}
                            placeholder="+91 98765 43210"
                            className="w-full px-3 py-2 text-xs rounded-md border border-gray-200 focus:ring-1 focus:ring-neutral-950 outline-hidden bg-white"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-semibold text-gray-500  mb-1">
                            Email address
                          </label>
                          <input
                            type="email"
                            value={newCustEmail}
                            onChange={(e) => setNewCustEmail(e.target.value)}
                            placeholder="riya@example.com"
                            className="w-full px-3 py-2 text-xs rounded-md border border-gray-200 focus:ring-1 focus:ring-neutral-950 outline-hidden bg-white"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-semibold text-gray-500  mb-1">
                            Staff Notes / Comments
                          </label>
                          <textarea
                            value={newCustNotes}
                            onChange={(e) => setNewCustNotes(e.target.value)}
                            placeholder="VIP client, prefers herbal products..."
                            rows={2}
                            className="w-full px-3 py-2 text-xs rounded-md border border-gray-200 focus:ring-1 focus:ring-neutral-950 outline-hidden bg-white resize-none"
                          />
                        </div>

                        {customerError && (
                          <div className="p-3 bg-red-50 text-red-600 rounded-md text-xs flex items-center gap-2">
                            <AlertCircle className="h-4 w-4 shrink-0" />
                            <span>{customerError}</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Step Navigation */}
                    <div className="pt-4 flex justify-end">
                      <button
                        onClick={() => setActiveStep("services")}
                        disabled={!selectedCustomer && !createNewCustomer}
                        className="px-5 py-2.5 bg-neutral-950 hover:bg-neutral-900 text-white rounded-md text-xs font-semibold flex items-center gap-1 shadow-vercel-sm disabled:bg-gray-200 transition"
                      >
                        Next Step
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                )}

                {/* ── STEP 2: SERVICES SELECTION VIEW ───────────────────────── */}
                {activeStep === "services" && (
                  <div className="space-y-5">
                    <div>
                      <h4 className="text-sm font-semibold text-gray-800 mb-2">Service Menu Checklist</h4>
                      <p className="text-xs text-gray-400">
                        Check off the services the client is booking. You can select multiple items. They will be aggregated dynamically.
                      </p>
                    </div>

                    <div className="space-y-4 max-h-[380px] overflow-y-auto pr-1">
                      {categories.map((cat: ServiceCategory) => {
                        const servicesList = cat.services || []
                        if (servicesList.length === 0) return null
                        const isCollapsed = collapsedCategories[cat.id]

                        return (
                          <div key={cat.id} className="border border-gray-100 rounded-lg bg-white overflow-hidden shadow-vercel-sm">
                            <button
                              type="button"
                              onClick={() => toggleCategory(cat.id)}
                              className="w-full px-4 py-3 bg-gray-50/70 border-b border-gray-100/50 flex items-center justify-between text-xs font-semibold text-gray-700"
                            >
                              <span>{cat.name}</span>
                              <span className="text-[10px] text-gray-400 bg-white px-2 py-0.5 rounded-full border border-gray-100">
                                {servicesList.length} items
                              </span>
                            </button>

                            {!isCollapsed && (
                              <div className="divide-y divide-gray-50">
                                {servicesList.map((srv: Service) => {
                                  const isChecked = selectedServiceIds.includes(srv.id)

                                  return (
                                    <div
                                      key={srv.id}
                                      onClick={() => handleToggleService(srv.id)}
                                      className={`px-4 py-3 flex items-center justify-between cursor-pointer hover:bg-neutral-100/50 transition
                                        ${isChecked ? "bg-neutral-100/80" : ""}`}
                                    >
                                      <div className="flex items-start gap-2.5">
                                        <div className="mt-0.5 text-neutral-950 shrink-0">
                                          {isChecked ? (
                                            <CheckSquare className="h-4.5 w-4.5" />
                                          ) : (
                                            <Square className="h-4.5 w-4.5 text-gray-300" />
                                          )}
                                        </div>
                                        <div>
                                          <p className="text-xs font-semibold text-gray-800">{srv.name}</p>
                                          {srv.description && (
                                            <p className="text-[10px] text-gray-400 mt-0.5 truncate max-w-[280px]">{srv.description}</p>
                                          )}
                                        </div>
                                      </div>
                                      <div className="text-right shrink-0">
                                        <p className="text-xs font-semibold text-gray-800">₹{Number(srv.min_price).toLocaleString("en-IN")}</p>
                                        <p className="text-[10px] text-gray-400 mt-0.5">{srv.duration_minutes} mins</p>
                                      </div>
                                    </div>
                                  )
                                })}
                              </div>
                            )}
                          </div>
                        )
                      })}

                      {/* Uncategorized services */}
                      {uncategorizedServices.length > 0 && (
                        <div className="border border-gray-100 rounded-lg bg-white overflow-hidden shadow-vercel-sm">
                          <button
                            type="button"
                            onClick={() => toggleCategory("uncategorized")}
                            className="w-full px-4 py-3 bg-gray-50/70 border-b border-gray-100/50 flex items-center justify-between text-xs font-semibold text-gray-700"
                          >
                            <span>Uncategorized Services</span>
                            <span className="text-[10px] text-gray-400 bg-white px-2 py-0.5 rounded-full border border-gray-100">
                              {uncategorizedServices.length} items
                            </span>
                          </button>

                          {!collapsedCategories["uncategorized"] && (
                            <div className="divide-y divide-gray-50">
                              {uncategorizedServices.map((srv: Service) => {
                                const isChecked = selectedServiceIds.includes(srv.id)

                                return (
                                  <div
                                    key={srv.id}
                                    onClick={() => handleToggleService(srv.id)}
                                    className={`px-4 py-3 flex items-center justify-between cursor-pointer hover:bg-neutral-100/50 transition
                                      ${isChecked ? "bg-neutral-100/80" : ""}`}
                                  >
                                    <div className="flex items-start gap-2.5">
                                      <div className="mt-0.5 text-neutral-950 shrink-0">
                                        {isChecked ? (
                                          <CheckSquare className="h-4.5 w-4.5" />
                                        ) : (
                                          <Square className="h-4.5 w-4.5 text-gray-300" />
                                        )}
                                      </div>
                                      <div>
                                        <p className="text-xs font-semibold text-gray-800">{srv.name}</p>
                                        {srv.description && (
                                          <p className="text-[10px] text-gray-400 mt-0.5 truncate max-w-[280px]">{srv.description}</p>
                                        )}
                                      </div>
                                    </div>
                                    <div className="text-right shrink-0">
                                      <p className="text-xs font-semibold text-gray-800">₹{Number(srv.min_price).toLocaleString("en-IN")}</p>
                                      <p className="text-[10px] text-gray-400 mt-0.5">{srv.duration_minutes} mins</p>
                                    </div>
                                  </div>
                                )
                              })}
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Aggregate running summary bar */}
                    {selectedServiceIds.length > 0 && (
                      <div className="p-4 bg-neutral-100 border border-neutral-200 rounded-lg flex justify-between items-center">
                        <div>
                          <p className="text-[10px] font-semibold text-neutral-500 ">Running Checklist Summary</p>
                          <p className="text-xs text-neutral-800 font-semibold mt-0.5">
                            {selectedServiceIds.length} Service{selectedServiceIds.length === 1 ? "" : "s"} Chosen
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold text-neutral-950">₹{totalPrice.toLocaleString("en-IN")}</p>
                          <p className="text-[10px] text-neutral-950 font-semibold mt-0.5">{totalDuration} minutes total</p>
                        </div>
                      </div>
                    )}

                    {/* Step Navigation */}
                    <div className="pt-4 flex justify-between">
                      <button
                        onClick={() => setActiveStep("customer")}
                        className="px-4 py-2 border border-gray-200 text-gray-600 rounded-md text-xs font-semibold flex items-center gap-1 hover:bg-gray-50 transition"
                      >
                        <ChevronLeft className="h-4 w-4" />
                        Back
                      </button>

                      <button
                        onClick={() => setActiveStep("schedule")}
                        disabled={selectedServiceIds.length === 0}
                        className="px-5 py-2.5 bg-neutral-950 hover:bg-neutral-900 text-white rounded-md text-xs font-semibold flex items-center gap-1 shadow-vercel-sm disabled:bg-gray-200 transition"
                      >
                        Next: Slots Picker
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                )}

                {/* ── STEP 3: SCHEDULE & SLOTS PICKER VIEW ─────────────────── */}
                {activeStep === "schedule" && (
                  <div className="space-y-5">
                    <div>
                      <h4 className="text-sm font-semibold text-gray-800 mb-2">Available Slots Calculator</h4>
                      <p className="text-xs text-gray-400">
                        The CRM automatically queries employee calendars and branch constraints for free timings. Choose a slot timing card.
                      </p>
                    </div>

                    {/* Inputs */}
                    <div className="grid grid-cols-2 gap-3.5">
                      <div>
                        <label className="block text-[10px] font-semibold text-gray-400  mb-1">
                          Date
                        </label>
                        <input
                          type="date"
                          value={slotDate}
                          onChange={(e) => {
                            setSlotDate(e.target.value)
                            setSelectedTimeSlot(null)
                          }}
                          className="w-full px-3 py-2 text-xs rounded-md border border-gray-200 focus:ring-1 focus:ring-neutral-950 outline-hidden"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-semibold text-gray-400  mb-1">
                          Preferred Staff
                        </label>
                        <select
                          value={slotEmployeeId}
                          onChange={(e) => {
                            setSlotEmployeeId(e.target.value)
                            setSelectedTimeSlot(null)
                          }}
                          className="w-full px-3 py-2 text-xs rounded-md border border-gray-200 focus:ring-1 focus:ring-neutral-950 outline-hidden bg-white"
                        >
                          <option value="">Any Staff Practitioner</option>
                          {employees.map((emp) => (
                            <option key={emp.id} value={emp.id}>
                              {emp.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Slots pills render */}
                    <div>
                      <label className="block text-[10px] font-semibold text-gray-400  mb-2">
                        Available slots ({uniqueTimes.length})
                      </label>

                      {slotsLoading ? (
                        <div className="py-12 flex flex-col items-center justify-center border border-dashed border-gray-200 rounded-lg bg-gray-50/50">
                          <Loader2 className="h-6 w-6 text-neutral-950 animate-spin" />
                          <p className="text-[10px] text-gray-400 mt-2 font-medium">Calculating available slots...</p>
                        </div>
                      ) : uniqueTimes.length === 0 ? (
                        <div className="py-10 text-center border border-dashed border-rose-100 rounded-lg bg-rose-50/20 text-rose-700">
                          <AlertCircle className="h-6 w-6 text-rose-500 mx-auto mb-2" />
                          <p className="text-xs font-semibold">No Slots Available</p>
                          <p className="text-[10px] text-rose-600 mt-1 max-w-[260px] mx-auto">
                            The selected staff member may be fully booked or off duty. Try choosing a different date or staff choice.
                          </p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-4 gap-2.5 max-h-[220px] overflow-y-auto pr-1">
                          {uniqueTimes.map((time) => {
                            const isSelected = selectedTimeSlot === time

                            return (
                              <button
                                key={time}
                                type="button"
                                onClick={() => {
                                  setSelectedTimeSlot(time)
                                  // Look up first employee ID associated with this slot if a specific was not chosen
                                  if (!slotEmployeeId) {
                                    const matchingResult = slotResults.find((sr) =>
                                      sr.slots.some((s) => s.start_time === time)
                                    )
                                    setAssignedEmployeeId(matchingResult?.employee_id || null)
                                  } else {
                                    setAssignedEmployeeId(slotEmployeeId)
                                  }
                                }}
                                className={`px-2 py-2 rounded-md text-xs font-semibold border transition duration-150 text-center
                                  ${isSelected
                                    ? "bg-neutral-950 text-white border-neutral-950 shadow-vercel-sm"
                                    : "bg-white hover:bg-neutral-100/80 text-gray-700 border-gray-200"
                                  }`}
                              >
                                {formatTime(time)}
                              </button>
                            )
                          })}
                        </div>
                      )}
                    </div>

                    {/* Step Navigation */}
                    <div className="pt-4 flex justify-between">
                      <button
                        onClick={() => setActiveStep("services")}
                        className="px-4 py-2 border border-gray-200 text-gray-600 rounded-md text-xs font-semibold flex items-center gap-1 hover:bg-gray-50 transition"
                      >
                        <ChevronLeft className="h-4 w-4" />
                        Back
                      </button>

                      <button
                        onClick={() => setActiveStep("finalize")}
                        disabled={!selectedTimeSlot}
                        className="px-5 py-2.5 bg-neutral-950 hover:bg-neutral-900 text-white rounded-md text-xs font-semibold flex items-center gap-1 shadow-vercel-sm disabled:bg-gray-200 transition"
                      >
                        Next: Finalize
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                )}

                {/* ── STEP 4: NOTES AND PAYMENT VIEW ───────────────────────── */}
                {activeStep === "finalize" && (
                  <div className="space-y-5">
                    <div>
                      <h4 className="text-sm font-semibold text-gray-800 mb-2">Finalize Appointment Settings</h4>
                      <p className="text-xs text-gray-400">
                        Confirm preferred payment channels and register additional practitioner guidelines.
                      </p>
                    </div>

                    {/* Payment choice */}
                    <div>
                      <label className="block text-[10px] font-semibold text-gray-400  mb-2">
                        Payment Type
                      </label>
                      <div className="grid grid-cols-2 gap-3">
                        {[
                          { value: "pay_at_salon", label: "Pay At Salon", desc: "Settle bill on premise" },
                          { value: "pay_online", label: "Pay Online", desc: "Integrate online link" }
                        ].map((pay) => {
                          const isSelected = paymentType === pay.value

                          return (
                            <button
                              key={pay.value}
                              type="button"
                              onClick={() => setPaymentType(pay.value as any)}
                              className={`p-3.5 rounded-lg border text-left transition duration-150
                                ${isSelected
                                  ? "border-neutral-950 bg-neutral-100/60 ring-1 ring-neutral-950"
                                  : "border-gray-200 bg-white hover:bg-gray-50"
                                }`}
                            >
                              <div className="flex items-center gap-2">
                                <CreditCard className={`h-4 w-4 ${isSelected ? "text-neutral-950" : "text-gray-400"}`} />
                                <span className="text-xs font-semibold text-gray-800">{pay.label}</span>
                              </div>
                              <p className="text-[10px] text-gray-400 mt-1">{pay.desc}</p>
                            </button>
                          )
                        })}
                      </div>
                    </div>

                    {/* Additional Notes */}
                    <div>
                      <label className="block text-[10px] font-semibold text-gray-400  mb-1">
                        Special Instructions / Notes
                      </label>
                      <textarea
                        value={bookingNotes}
                        onChange={(e) => setBookingNotes(e.target.value)}
                        placeholder="Add specific styling request, tea/coffee service preference..."
                        rows={3}
                        className="w-full px-3 py-2 text-xs rounded-md border border-gray-200 focus:ring-1 focus:ring-neutral-950 outline-hidden resize-none bg-white"
                      />
                    </div>

                    {/* Booking error display */}
                    {bookingError && (
                      <div className="p-3 bg-red-50 text-red-600 rounded-md text-xs flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 shrink-0" />
                        <span>{bookingError}</span>
                      </div>
                    )}

                    {/* Summary Overview */}
                    <div className="border border-dashed border-gray-200 rounded-lg p-4 bg-gray-50/50 space-y-2.5">
                      <h5 className="text-[10px] font-semibold text-gray-400 ">Appointment Overview</h5>
                      <div className="grid grid-cols-2 gap-y-2 text-xs">
                        <span className="text-gray-400">Date</span>
                        <span className="font-semibold text-gray-800 text-right">{formatDate(slotDate)}</span>

                        <span className="text-gray-400">Time</span>
                        <span className="font-semibold text-gray-800 text-right">{selectedTimeSlot ? formatTime(selectedTimeSlot) : "–"}</span>

                        <span className="text-gray-400">Services</span>
                        <span className="font-semibold text-gray-800 text-right truncate max-w-[160px] inline-block ml-auto">
                          {selectedServicesObjects.map((s) => s.name).join(", ")}
                        </span>

                        <span className="text-gray-400">Cost</span>
                        <span className="font-semibold text-neutral-950 text-right">₹{totalPrice.toLocaleString("en-IN")}</span>
                      </div>
                    </div>

                    {/* Step Navigation */}
                    <div className="pt-4 flex justify-between">
                      <button
                        onClick={() => setActiveStep("schedule")}
                        className="px-4 py-2 border border-gray-200 text-gray-600 rounded-md text-xs font-semibold flex items-center gap-1 hover:bg-gray-50 transition"
                      >
                        <ChevronLeft className="h-4 w-4" />
                        Back
                      </button>

                      <button
                        onClick={handleSaveAppointment}
                        disabled={createBookingMutation.isPending || createCustomerMutation.isPending}
                        className="px-6 py-2.5 bg-neutral-950 hover:bg-neutral-900 text-white rounded-md text-xs font-semibold flex items-center gap-1.5 shadow-vercel-md hover:shadow-vercel-lg disabled:bg-gray-300 transition"
                      >
                        {(createBookingMutation.isPending || createCustomerMutation.isPending) ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Booking appointment...
                          </>
                        ) : (
                          <>
                            <Check className="h-4 w-4" />
                            Save Appointment
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
      {/* ── Checkout Drawer AnimatePresence ─────────────────────── */}
      <AnimatePresence>
        {checkoutBooking && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setCheckoutBooking(null)}
              className="fixed inset-0 bg-gray-900/40 backdrop-blur-xs z-40"
            />

            {/* Slide Panel */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 220 }}
              className="fixed right-0 top-0 bottom-0 w-full max-w-lg bg-white border-l border-gray-100 shadow-vercel-lg z-50 flex flex-col text-left"
            >
              {/* Header */}
              <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-neutral-950 text-white shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-neutral-800 rounded-md text-white">
                    <Receipt className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold">Session Checkout</h3>
                    <p className="text-[10px] text-neutral-400 font-semibold uppercase">
                      Client: {checkoutBooking.customer_name || "Walk-in Guest"}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setCheckoutBooking(null)}
                  className="p-1.5 rounded-md bg-neutral-900/60 text-neutral-300 hover:text-white hover:bg-neutral-800 transition"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Scrollable Body */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {checkoutError && (
                  <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-md text-xs font-semibold">
                    {checkoutError}
                  </div>
                )}

                {/* 1. Itemized Services */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider">Services Performed</h4>
                    <span className="text-[10px] font-semibold text-neutral-955 bg-neutral-100 px-2 py-0.5 rounded-md">
                      {checkoutServices.length} Items
                    </span>
                  </div>

                  <div className="space-y-3.5">
                    {checkoutServices.map((s, idx) => (
                      <div
                        key={idx}
                        className="p-4 rounded-lg border border-gray-100 bg-gray-50/30 space-y-3 relative group"
                      >
                        {/* Remove item */}
                        <button
                          type="button"
                          onClick={() => setCheckoutServices(checkoutServices.filter((_, i) => i !== idx))}
                          className="absolute right-3 top-3.5 p-1 rounded-md text-gray-400 hover:text-red-600 hover:bg-red-50 transition opacity-0 group-hover:opacity-100 focus:opacity-100"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>

                        <div className="pr-8">
                          <p className="text-xs font-bold text-gray-800">{s.service_name}</p>
                        </div>

                        <div className="grid grid-cols-2 gap-3.5">
                          {/* Price input */}
                          <div>
                            <label className="block text-[9px] font-semibold text-gray-400 uppercase mb-1">Price (₹)</label>
                            <input
                              type="number"
                              min="0"
                              value={s.price}
                              onChange={(e) => {
                                const val = parseFloat(e.target.value) || 0
                                const updated = [...checkoutServices]
                                updated[idx].price = val
                                setCheckoutServices(updated)
                              }}
                              className="w-full px-2.5 py-1.5 border border-gray-200 rounded-md outline-none text-xs font-semibold text-gray-800 bg-white"
                            />
                          </div>

                          {/* Staff selection */}
                          <div>
                            <label className="block text-[9px] font-semibold text-gray-400 uppercase mb-1">Rendered By</label>
                            <select
                              value={s.employee_id || ""}
                              onChange={(e) => {
                                const updated = [...checkoutServices]
                                updated[idx].employee_id = e.target.value || null
                                setCheckoutServices(updated)
                              }}
                              className="w-full px-2 py-1.5 border border-gray-200 rounded-md outline-none text-xs font-semibold text-gray-800 bg-white"
                            >
                              <option value="">Unassigned</option>
                              {employees.map((emp) => (
                                <option key={emp.id} value={emp.id}>
                                  {emp.name}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Add extra service drop box */}
                  <div>
                    <select
                      value=""
                      onChange={(e) => {
                        const val = e.target.value
                        if (!val) return
                        const svc = flatServices.find((s) => s.id === val)
                        if (svc) {
                          setCheckoutServices([
                            ...checkoutServices,
                            {
                              service_id: svc.id,
                              service_name: svc.name,
                              employee_id: checkoutBooking.employee_id || null,
                              price: Number(svc.min_price || 0),
                              duration_minutes: Number(svc.duration_minutes || 0)
                            }
                          ])
                        }
                      }}
                      className="w-full px-3.5 py-2.5 rounded-lg border border-dashed border-gray-300 text-xs font-semibold text-gray-500 bg-white outline-none cursor-pointer text-center hover:bg-gray-50 hover:border-gray-400 transition"
                    >
                      <option value="" hidden>+ Add Unscheduled Extra Treatment</option>
                      {flatServices
                        .map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.name} — ₹{Number(s.min_price).toLocaleString("en-IN")}
                          </option>
                        ))}
                    </select>
                  </div>
                </div>

                {/* 2. Payment Terms & Types */}
                <div className="space-y-4 pt-5 border-t border-gray-100">
                  <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider">Payment Settings</h4>

                  {/* Payment Type Selection */}
                  <div className="grid grid-cols-2 gap-3.5">
                    {[
                      { id: "pay_at_salon", label: "In-Store Cashout" },
                      { id: "pay_online", label: "Paid Online" }
                    ].map((type) => {
                      const isSel = checkoutPaymentType === type.id
                      return (
                        <button
                          key={type.id}
                          type="button"
                          onClick={() => setCheckoutPaymentType(type.id as any)}
                          className={`px-3 py-2.5 rounded-md border text-xs font-semibold transition cursor-pointer text-center
                            ${isSel
                              ? "bg-neutral-955 border-neutral-950 text-black shadow-vercel-sm"
                              : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"}`}
                        >
                          {type.label}
                        </button>
                      )
                    })}
                  </div>

                  {/* Payment Method Styled Selection */}
                  <div className="space-y-1.5">
                    <label className="block text-[9px] font-semibold text-gray-400 uppercase mb-1">Receipt Settlement Method</label>
                    <div className="grid grid-cols-3 gap-2.5">
                      {[
                        { id: "cash", label: "Cash Payment", icon: Coins },
                        { id: "card", label: "Swipe Card", icon: CreditCard },
                        { id: "upi", label: "UPI / Scan QR", icon: Sparkles }
                      ].map((method) => {
                        const isSel = checkoutPaymentMethod === method.id
                        return (
                          <button
                            key={method.id}
                            type="button"
                            onClick={() => setCheckoutPaymentMethod(method.id as any)}
                            className={`flex flex-col items-center justify-center p-3 rounded-lg border text-center transition cursor-pointer select-none
                              ${isSel
                                ? "bg-neutral-100 border-neutral-950 text-neutral-955 font-semibold"
                                : "bg-white border-gray-200 text-gray-500 hover:bg-gray-50"}`}
                          >
                            <method.icon className="h-5 w-5 mb-1.5 shrink-0" />
                            <span className="text-[10px] leading-tight font-medium">{method.label}</span>
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {/* Checkout Notes */}
                  <div>
                    <label className="block text-[9px] font-semibold text-gray-400 uppercase mb-1.5">Checkout Comments (Optional)</label>
                    <input
                      type="text"
                      value={checkoutNotes}
                      onChange={(e) => setCheckoutNotes(e.target.value)}
                      placeholder="e.g. Applied holiday discount, complimentary tea..."
                      className="w-full px-3.5 py-2.5 rounded-md border border-gray-200 outline-none text-xs font-semibold text-gray-800 bg-white focus:border-neutral-950 transition"
                    />
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="p-6 border-t border-gray-100 bg-gray-50/50 flex items-center justify-between gap-3 shrink-0">
                <div className="text-left">
                  <span className="text-[9px] font-semibold text-gray-400 uppercase block">Grand Total</span>
                  <span className="text-base font-bold text-neutral-955">
                    ₹{checkoutServices.reduce((sum, s) => sum + s.price, 0).toLocaleString("en-IN")}
                  </span>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setCheckoutBooking(null)}
                    className="px-4 py-2.5 border border-gray-200 rounded-md bg-white hover:bg-gray-50 text-xs font-semibold text-gray-700 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={checkoutBookingMutation.isPending || checkoutServices.length === 0}
                    onClick={() =>
                      checkoutBookingMutation.mutate({
                        bookingId: checkoutBooking.id,
                        payment_type: checkoutPaymentType,
                        payment_method: checkoutPaymentMethod,
                        notes: checkoutNotes || undefined,
                        services: checkoutServices.map((s) => ({
                          service_id: s.service_id,
                          employee_id: s.employee_id,
                          price: s.price,
                          duration_minutes: s.duration_minutes
                        }))
                      })
                    }
                    className="flex items-center gap-2 px-5 py-2.5 bg-neutral-950 hover:bg-neutral-900 text-white rounded-md text-xs font-semibold shadow-vercel-md transition"
                  >
                    {checkoutBookingMutation.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Check className="h-4 w-4" />
                        Finalize Checkout
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Printable Digital Invoice Overlay ──────────────────────── */}
      <AnimatePresence>
        {showInvoice && (
          <>
            {/* Backdrop (Hidden on printing) */}
            <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 print:p-0 print:bg-white print:static print:z-auto">
              {/* Injected Invoice Printer CSS */}
              <style dangerouslySetInnerHTML={{
                __html: `
                @media print {
                  body * {
                    visibility: hidden;
                  }
                  .print-receipt-wrapper, .print-receipt-wrapper * {
                    visibility: visible;
                  }
                  .print-receipt-wrapper {
                    position: absolute;
                    left: 0;
                    top: 0;
                    width: 100%;
                    margin: 0;
                    padding: 0;
                    box-shadow: none !important;
                    border: none !important;
                  }
                }
              `}} />

              {/* Receipt card */}
              <div className="print-receipt-wrapper bg-white border border-gray-100 rounded-lg max-w-md w-full shadow-vercel-lg p-6 sm:p-8 flex flex-col text-left print:shadow-none print:border-none print:p-0 print:max-w-full">
                {/* Header branding */}
                <div className="text-center pb-6 border-b border-gray-100 space-y-1">
                  <div className="mx-auto h-12 w-12 bg-neutral-950 rounded-full flex items-center justify-center text-white mb-2 shadow-vercel-sm">
                    <Receipt className="h-6 w-6" />
                  </div>
                  <h2 className="text-base font-bold text-gray-900 tracking-tight uppercase">
                    {selectedBusiness?.name || "Partner Workspace"}
                  </h2>
                  <p className="text-[10px] text-gray-400 font-semibold tracking-wide">
                    Branch: {selectedBranch?.name}
                  </p>
                  <p className="text-[10px] text-gray-400 font-medium">
                    Date: {new Date(showInvoice.booking_date).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" })} — {formatTime(showInvoice.start_time)}
                  </p>
                </div>

                {/* Details grid */}
                <div className="py-5 border-b border-gray-100 space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-400 font-semibold">Invoice Number:</span>
                    <span className="font-bold text-gray-800">#INV-{showInvoice.id.substring(0, 8).toUpperCase()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400 font-semibold">Client Name:</span>
                    <span className="font-bold text-gray-800">{showInvoice.customer_name || "Walk-in Guest"}</span>
                  </div>
                  {showInvoice.customer_phone && (
                    <div className="flex justify-between">
                      <span className="text-gray-400 font-semibold">Client Contact:</span>
                      <span className="font-bold text-gray-800">{showInvoice.customer_phone}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-400 font-semibold">Settled Status:</span>
                    <span className="font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full uppercase text-[9px]">PAID</span>
                  </div>
                </div>

                {/* Itemized Table */}
                <div className="py-5 border-b border-gray-100 space-y-3">
                  <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Services Rendered</h4>
                  <div className="space-y-3">
                    {showInvoice.services?.map((s: any, i: number) => {
                      const empName = s.employee_name || employees.find((e) => e.id === s.employee_id)?.name || "Unassigned"
                      return (
                        <div key={i} className="flex justify-between items-start text-xs">
                          <div className="space-y-0.5 pr-4">
                            <p className="font-semibold text-gray-800">{s.service_name}</p>
                            <p className="text-[10px] text-gray-400 font-medium">Provided by: {empName}</p>
                          </div>
                          <span className="font-bold text-neutral-955 shrink-0">
                            ₹{Number(s.price).toLocaleString("en-IN")}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Totals */}
                <div className="py-5 space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-400 font-semibold">Subtotal:</span>
                    <span className="font-bold text-gray-800">
                      ₹{Number(showInvoice.total_amount || 0).toLocaleString("en-IN")}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400 font-semibold">Taxes & Fees (0%):</span>
                    <span className="font-bold text-gray-800">₹0.00</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-gray-100 items-baseline">
                    <span className="text-xs font-bold text-gray-800">Grand Total:</span>
                    <span className="text-lg font-bold text-neutral-955">
                      ₹{Number(showInvoice.total_amount || 0).toLocaleString("en-IN")}
                    </span>
                  </div>
                  <div className="flex justify-between text-[10px] text-gray-400 font-semibold pt-1 uppercase tracking-wide">
                    <span>Receipt Settlement:</span>
                    <span>{showInvoice.payment_type.replace("_", " ")}</span>
                  </div>
                </div>

                {/* Comments if any */}
                {showInvoice.notes && (
                  <div className="bg-gray-50 border border-gray-100 rounded-md p-3 text-[11px] text-gray-500 italic mt-1 leading-relaxed">
                    Comment: "{showInvoice.notes}"
                  </div>
                )}

                {/* Paid Seal */}
                <div className="py-4 flex justify-center">
                  <div className="border-[3px] border-emerald-500/35 border-double text-emerald-600/70 font-black text-xs px-5 py-1.5 rounded-md uppercase tracking-widest rotate-[-5deg] select-none">
                    INVOICE PAID IN FULL
                  </div>
                </div>

                {/* Printing action buttons (Hidden during printing) */}
                <div className="flex gap-2.5 mt-6 pt-4 border-t border-gray-50 print:hidden shrink-0">
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 border border-neutral-300 rounded-md bg-neutral-100 hover:bg-neutral-200 text-xs font-bold text-neutral-950 shadow-vercel-sm transition cursor-pointer"
                  >
                    <Receipt className="h-4 w-4" />
                    Print Receipt
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowInvoice(null)}
                    className="flex-1 px-4 py-2.5 rounded-md bg-neutral-950 hover:bg-neutral-900 text-xs font-bold text-white shadow-vercel-md transition cursor-pointer"
                  >
                    Done
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}

function BuildingIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      {...props}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3a.75.75 0 0 1 .75-.75h3a.75.75 0 0 1 .75.75v3m-6 0h6"
      />
    </svg>
  )
}
