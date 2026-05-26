import { useState, useMemo, useEffect } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useAppStore } from "../../store/app.store"
import {
  listEmployeesApi,
  createEmployeeApi,
  updateEmployeeApi,
  assignEmployeeBranchesApi,
  removeEmployeeBranchApi,
  deactivateEmployeeApi
} from "../../api/employees.api"
import { listBranchesApi } from "../../api/branches.api"
import { listBookingsApi } from "../../api/bookings.api"
import {
  getAvailabilityApi,
  setAvailabilityApi,
  listTimeOffApi,
  createTimeOffApi,
  deleteTimeOffApi
} from "../../api/availability.api"
import {
  Users,
  UserCheck,
  Award,
  Plus,
  Search,
  Building,
  Check,
  Loader2,
  Trash2,
  X,
  Briefcase,
  Clock,
  Calendar,
  CalendarOff,

  CalendarCheck
} from "lucide-react"
import { motion, AnimatePresence } from "motion/react"
import type { Employee } from "../../types"

export default function EmployeesPage() {
  const queryClient = useQueryClient()
  const { selectedBusiness, selectedBranch } = useAppStore()
  const businessId = selectedBusiness?.id

  // ── States ──────────────────────────────────────────────────
  const [searchQuery, setSearchQuery] = useState("")
  const [branchFilter, setBranchFilter] = useState<string>("all") // "all" or specific branchId

  // Drawer states
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [drawerType, setDrawerType] = useState<"add" | "edit">("add")
  const [activeEmployee, setActiveEmployee] = useState<Employee | null>(null)

  // Form states
  const [name, setName] = useState("")
  const [bio, setBio] = useState("")
  const [experienceYears, setExperienceYears] = useState("0")
  const [selectedBranches, setSelectedBranches] = useState<string[]>([]) // Checked branch IDs
  const [formError, setFormError] = useState<string | null>(null)

  // Tab state for edit drawer
  const [activeTab, setActiveTab] = useState<"profile" | "schedule" | "timeoff" | "bookings">("profile")

  // Weekly Schedule states
  const [localSchedule, setLocalSchedule] = useState<{
    day_of_week: number
    is_off: boolean
    start_time: string
    end_time: string
  }[]>([])
  const [scheduleSaveError, setScheduleSaveError] = useState<string | null>(null)
  const [scheduleSuccessMessage, setScheduleSuccessMessage] = useState<string | null>(null)

  // Time off states
  const [timeOffStart, setTimeOffStart] = useState("")
  const [timeOffEnd, setTimeOffEnd] = useState("")
  const [timeOffReason, setTimeOffReason] = useState("")
  const [timeOffError, setTimeOffError] = useState<string | null>(null)

  // Monday to Sunday order & labels
  const DAYS_ORDER = [1, 2, 3, 4, 5, 6, 0]
  const DAY_LABELS: Record<number, string> = {
    1: "Monday",
    2: "Tuesday",
    3: "Wednesday",
    4: "Thursday",
    5: "Friday",
    6: "Saturday",
    0: "Sunday"
  }

  // ── Queries ─────────────────────────────────────────────────
  // Fetch branches for filter and checklist
  const { data: branches = [] } = useQuery({
    queryKey: ["branches", businessId],
    queryFn: () => (businessId ? listBranchesApi(businessId) : Promise.resolve([])),
    enabled: !!businessId
  })

  // Fetch employees
  const { data: employees = [], isLoading } = useQuery({
    queryKey: ["employees", businessId],
    queryFn: () => (businessId ? listEmployeesApi(businessId) : Promise.resolve([])),
    enabled: !!businessId
  })

  // Fetch availability for edit mode
  const { data: scheduleData, isLoading: isScheduleLoading } = useQuery({
    queryKey: ["availability", businessId, activeEmployee?.id],
    queryFn: () =>
      businessId && activeEmployee?.id
        ? getAvailabilityApi(businessId, activeEmployee.id)
        : Promise.resolve([]),
    enabled: drawerOpen && drawerType === "edit" && activeTab === "schedule" && !!activeEmployee?.id
  })

  // Fetch time-off intervals
  const { data: timeOffList = [], isLoading: isTimeOffLoading } = useQuery({
    queryKey: ["timeoff", businessId, activeEmployee?.id],
    queryFn: () =>
      businessId && activeEmployee?.id
        ? listTimeOffApi(businessId, activeEmployee.id)
        : Promise.resolve([]),
    enabled: drawerOpen && drawerType === "edit" && activeTab === "timeoff" && !!activeEmployee?.id
  })

  // Fetch booking history for employee
  const { data: employeeBookings = [], isLoading: isBookingsLoading } = useQuery({
    queryKey: ["employeeBookings", businessId, activeEmployee?.id],
    queryFn: () =>
      businessId && activeEmployee?.id
        ? listBookingsApi(businessId, { employee_id: activeEmployee.id })
        : Promise.resolve([]),
    enabled: drawerOpen && drawerType === "edit" && activeTab === "bookings" && !!activeEmployee?.id
  })

  // ── Work History Statistics ─────────────────────────────────
  const stats = useMemo(() => {
    if (!employeeBookings || employeeBookings.length === 0) {
      return { total: 0, completed: 0, active: 0, cancelled: 0, revenue: 0 }
    }
    let completed = 0
    let active = 0
    let cancelled = 0
    let revenue = 0

    employeeBookings.forEach((b) => {
      if (b.booking_status === "completed") {
        completed++
        revenue += parseFloat(b.total_amount || "0")
      } else if (b.booking_status === "confirmed" || b.booking_status === "pending") {
        active++
      } else if (b.booking_status === "cancelled" || b.booking_status === "no_show") {
        cancelled++
      }
    })

    return {
      total: employeeBookings.length,
      completed,
      active,
      cancelled,
      revenue
    }
  }, [employeeBookings])

  // Synchronize localSchedule state with fetched database scheduleData
  useEffect(() => {
    if (!scheduleData) return

    if (scheduleData.length > 0) {
      const initialized = DAYS_ORDER.map((dayNum) => {
        const found = scheduleData.find((s) => s.day_of_week === dayNum)
        return {
          day_of_week: dayNum,
          is_off: found ? found.is_off : true,
          start_time: found?.start_time ? found.start_time.substring(0, 5) : "09:00",
          end_time: found?.end_time ? found.end_time.substring(0, 5) : "18:00"
        }
      })
      setLocalSchedule(initialized)
    } else {
      const defaults = DAYS_ORDER.map((dayNum) => ({
        day_of_week: dayNum,
        is_off: true,
        start_time: "09:00",
        end_time: "18:00"
      }))
      setLocalSchedule(defaults)
    }
  }, [scheduleData])

  // ── Mutations ───────────────────────────────────────────────
  const addEmployeeMutation = useMutation({
    mutationFn: async (data: {
      name: string
      bio?: string
      experience_years: number
      branch_ids: string[]
    }) => {
      if (!businessId) throw new Error("No business selected")
      return createEmployeeApi(businessId, data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees", businessId] })
      setDrawerOpen(false)
      resetForms()
    },
    onError: (err: any) => setFormError(err || "Failed to create employee profile")
  })

  const editEmployeeMutation = useMutation({
    mutationFn: async (data: {
      id: string
      name: string
      bio?: string
      experience_years: number
      nextBranchIds: string[]
      currentBranches: { branch_id: string }[]
    }) => {
      if (!businessId) throw new Error("No business selected")

      // 1. Update basic info
      await updateEmployeeApi(businessId, data.id, {
        name: data.name,
        bio: data.bio || null,
        experience_years: data.experience_years
      })

      const currentIds = data.currentBranches.map((cb) => cb.branch_id)
      const toAssign = data.nextBranchIds.filter((id) => !currentIds.includes(id))
      const toRemove = currentIds.filter((id) => !data.nextBranchIds.includes(id))

      // 2. Process branch additions
      if (toAssign.length > 0) {
        await assignEmployeeBranchesApi(businessId, data.id, toAssign)
      }

      // 3. Process branch removals
      if (toRemove.length > 0) {
        await Promise.all(
          toRemove.map((rid) => removeEmployeeBranchApi(businessId!, data.id, rid))
        )
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees", businessId] })
      queryClient.invalidateQueries({ queryKey: ["services", businessId] }) // Invalidate services since employees are linked
      setDrawerOpen(false)
      resetForms()
    },
    onError: (err: any) => setFormError(err || "Failed to update employee details")
  })

  const deactivateEmployeeMutation = useMutation({
    mutationFn: (id: string) => {
      if (!businessId) throw new Error("No business selected")
      return deactivateEmployeeApi(businessId, id)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees", businessId] })
      queryClient.invalidateQueries({ queryKey: ["services", businessId] })
      setDrawerOpen(false)
      resetForms()
    },
    onError: (err: any) => setFormError(err || "Failed to deactivate employee profile")
  })

  const saveScheduleMutation = useMutation({
    mutationFn: async (schedule: {
      day_of_week: number
      is_off: boolean
      start_time?: string
      end_time?: string
    }[]) => {
      if (!businessId || !activeEmployee) throw new Error("No active employee selected")
      return setAvailabilityApi(businessId, activeEmployee.id, schedule)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["availability", businessId, activeEmployee?.id] })
      setScheduleSuccessMessage("Weekly schedule updated successfully!")
      setTimeout(() => setScheduleSuccessMessage(null), 3000)
    },
    onError: (err: any) => {
      setScheduleSaveError(err || "Failed to update weekly schedule")
    }
  })

  const createTimeOffMutation = useMutation({
    mutationFn: async (data: { start_datetime: string; end_datetime: string; reason?: string }) => {
      if (!businessId || !activeEmployee) throw new Error("No active employee selected")
      return createTimeOffApi(businessId, activeEmployee.id, data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["timeoff", businessId, activeEmployee?.id] })
      setTimeOffStart("")
      setTimeOffEnd("")
      setTimeOffReason("")
      setTimeOffError(null)
    },
    onError: (err: any) => setTimeOffError(err || "Failed to log time off interval")
  })

  const deleteTimeOffMutation = useMutation({
    mutationFn: async (timeOffId: string) => {
      if (!businessId || !activeEmployee) throw new Error("No active employee selected")
      return deleteTimeOffApi(businessId, activeEmployee.id, timeOffId)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["timeoff", businessId, activeEmployee?.id] })
    },
    onError: (err: any) => setTimeOffError(err || "Failed to remove time off record")
  })

  // ── Handlers ────────────────────────────────────────────────
  const resetForms = () => {
    setName("")
    setBio("")
    setExperienceYears("0")
    setSelectedBranches([])
    setFormError(null)
    setActiveEmployee(null)
    setActiveTab("profile")
    setScheduleSaveError(null)
    setScheduleSuccessMessage(null)
    setTimeOffStart("")
    setTimeOffEnd("")
    setTimeOffReason("")
    setTimeOffError(null)
  }

  const openAddDrawer = () => {
    resetForms()
    setDrawerType("add")
    // Pre-select current active branch from header if it exists
    if (selectedBranch?.id) {
      setSelectedBranches([selectedBranch.id])
    }
    setDrawerOpen(true)
  }

  const openEditDrawer = (emp: Employee) => {
    resetForms()
    setActiveEmployee(emp)
    setName(emp.name)
    setBio(emp.bio || "")
    setExperienceYears(emp.experience_years.toString())
    setSelectedBranches(emp.branches.map((b) => b.branch_id))
    setDrawerType("edit")
    setDrawerOpen(true)
  }

  const handleBranchCheckboxChange = (branchId: string) => {
    setSelectedBranches((prev) =>
      prev.includes(branchId) ? prev.filter((id) => id !== branchId) : [...prev, branchId]
    )
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)

    if (!name.trim()) return setFormError("Employee name is required")
    if (selectedBranches.length === 0) {
      return setFormError("Assign at least one branch location to the employee")
    }

    const expVal = parseInt(experienceYears)
    if (isNaN(expVal) || expVal < 0) {
      return setFormError("Years of experience must be a non-negative number")
    }

    const payload = {
      name: name.trim(),
      bio: bio.trim() || undefined,
      experience_years: expVal,
      branch_ids: selectedBranches
    }

    if (drawerType === "add") {
      addEmployeeMutation.mutate(payload)
    } else if (drawerType === "edit" && activeEmployee) {
      editEmployeeMutation.mutate({
        id: activeEmployee.id,
        name: payload.name,
        bio: payload.bio,
        experience_years: payload.experience_years,
        nextBranchIds: selectedBranches,
        currentBranches: activeEmployee.branches
      })
    }
  }

  // ── Mapped Data / Filters ──────────────────────────────────
  const filteredEmployees = useMemo(() => {
    return employees.filter((emp) => {
      // Search filter
      const matchesSearch = emp.name.toLowerCase().includes(searchQuery.toLowerCase())

      // Branch filter
      const matchesBranch =
        branchFilter === "all" || emp.branches.some((b) => b.branch_id === branchFilter)

      return matchesSearch && matchesBranch
    })
  }, [employees, searchQuery, branchFilter])

  // ── Metrics ─────────────────────────────────────────────────
  const metrics = useMemo(() => {
    const total = employees.length
    const active = employees.filter((e) => e.is_active).length
    const totalExp = employees.reduce((acc, curr) => acc + curr.experience_years, 0)
    const avgExp = total > 0 ? Math.round((totalExp / total) * 10) / 10 : 0
    return { total, active, avgExp }
  }, [employees])

  const isSubmitting =
    addEmployeeMutation.isPending ||
    editEmployeeMutation.isPending ||
    deactivateEmployeeMutation.isPending

  if (!businessId) {
    return (
      <div className="flex flex-col items-center justify-center h-96 text-gray-500">
        <Users className="h-12 w-12 text-gray-300 mb-3 animate-pulse" />
        <p className="font-medium text-sm">Please select a business to manage staff.</p>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto pb-12">
      {/* ── Metric Panel Cards ────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
        {/* Total Staff */}
        <div className="bg-white p-5 rounded-lg border border-gray-100 shadow-vercel-sm flex items-center gap-4">
          <div className="p-3 bg-neutral-100 text-neutral-950 rounded-md">
            <Users className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-400 ">
              Total Team
            </p>
            <h3 className="text-2xl font-semibold text-gray-800 mt-0.5">{metrics.total}</h3>
          </div>
        </div>

        {/* Active Practitioners */}
        <div className="bg-white p-5 rounded-lg border border-gray-100 shadow-vercel-sm flex items-center gap-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-md">
            <UserCheck className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-400 ">
              Active Status
            </p>
            <h3 className="text-2xl font-semibold text-gray-800 mt-0.5">{metrics.active}</h3>
          </div>
        </div>

        {/* Average Experience */}
        <div className="bg-white p-5 rounded-lg border border-gray-100 shadow-vercel-sm flex items-center gap-4">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-md">
            <Award className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-400 ">
              Avg Experience
            </p>
            <h3 className="text-2xl font-semibold text-gray-800 mt-0.5">
              {metrics.avgExp} {metrics.avgExp === 1 ? "Year" : "Years"}
            </h3>
          </div>
        </div>
      </div>

      {/* ── Toolbar & Filters ─────────────────────────────────── */}
      <div className="bg-white p-4.5 rounded-lg border border-gray-100 shadow-vercel-sm flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        {/* Search & Branch filter */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 flex-1 max-w-2xl">
          {/* Search bar */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-gray-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search employee by name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-md border border-gray-200 outline-none text-sm transition focus:border-neutral-950 bg-gray-50/30 text-gray-900"
            />
          </div>

          {/* Branch filter dropdown */}
          <div className="relative min-w-[200px]">
            <Building className="absolute left-3.5 top-3.5 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
            <select
              value={branchFilter}
              onChange={(e) => setBranchFilter(e.target.value)}
              className="w-full pl-9 pr-8 py-2.5 rounded-md border border-gray-200 outline-none text-sm bg-white text-gray-700 transition focus:border-neutral-950 appearance-none cursor-pointer"
            >
              <option value="all">All Branch Locations</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-3.5 flex items-center pointer-events-none text-gray-400">
              <Plus className="h-3 w-3 rotate-45" />
            </div>
          </div>
        </div>

        {/* Add Staff Button */}
        <button
          onClick={openAddDrawer}
          className="flex items-center justify-center gap-2 px-4.5 py-2.5 rounded-md bg-neutral-950 hover:bg-neutral-900 text-sm font-semibold text-white shadow-vercel-md hover:shadow-vercel-lg transition shrink-0"
        >
          <Plus className="h-4.5 w-4.5" />
          Add Staff Member
        </button>
      </div>

      {/* ── Staff Catalog Grid ───────────────────────────────── */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-500 gap-3">
          <Loader2 className="h-8 w-8 text-neutral-950 animate-spin" />
          <p className="text-sm font-medium">Loading staff directory...</p>
        </div>
      ) : filteredEmployees.length === 0 ? (
        <div className="bg-white rounded-lg border border-dashed border-gray-200 p-12 text-center max-w-md mx-auto mt-6">
          <div className="mx-auto h-12 w-12 text-gray-400 bg-gray-50 rounded-full flex items-center justify-center mb-4">
            <Users className="h-6 w-6" />
          </div>
          <h3 className="font-semibold text-gray-900 text-base mb-1">No Team Members Found</h3>
          <p className="text-xs text-gray-500 mb-6 leading-relaxed">
            {searchQuery || branchFilter !== "all"
              ? "We couldn't find any team members matching your search or filters. Try adjusting them."
              : "Register your first practitioner or stylist to assign bookings and configure services."}
          </p>
          {!searchQuery && branchFilter === "all" && (
            <button
              onClick={openAddDrawer}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-md bg-neutral-950 hover:bg-neutral-900 text-sm font-semibold text-white transition"
            >
              <Plus className="h-4.5 w-4.5" />
              Add First Staff
            </button>
          )}
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEmployees.map((emp) => {
            // Stylized profile photo initial placeholder
            const initials = emp.name
              .split(" ")
              .map((n) => n[0])
              .join("")
              .substring(0, 2)
              .toUpperCase()

            return (
              <div
                key={emp.id}
                className={`bg-white rounded-lg border transition duration-200 p-6 flex flex-col justify-between shadow-vercel-sm group relative hover:shadow-vercel-sm
                  ${emp.is_active ? "border-gray-100 hover:border-gray-200" : "border-red-100 bg-red-50/5"}`}
              >
                {/* Top Block */}
                <div>
                  {/* Photo & Profile info */}
                  <div className="flex items-start gap-4">
                    <div className="h-12 w-12 rounded-md bg-gradient-to-br from-neutral-950 to-neutral-700 flex items-center justify-center text-white font-semibold text-sm shadow-vercel-md shrink-0 uppercase">
                      {initials}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold text-gray-900 text-sm truncate">{emp.name}</h4>
                        {/* Active Badge */}
                        <span
                          className={`text-[9px] font-semibold px-2 py-0.5 rounded-full uppercase
                            ${emp.is_active
                              ? "bg-emerald-50 text-emerald-600"
                              : "bg-red-50 text-red-600"
                            }`}
                        >
                          {emp.is_active ? "Active" : "Inactive"}
                        </span>
                      </div>
                      <p className="flex items-center gap-1.5 text-xs text-neutral-950 font-semibold mt-1">
                        <Award className="h-3.5 w-3.5 shrink-0" />
                        {emp.experience_years}{" "}
                        {emp.experience_years === 1 ? "year experience" : "years experience"}
                      </p>
                    </div>
                  </div>

                  {/* Bio Description */}
                  {emp.bio && (
                    <p className="text-xs text-gray-500 mt-4 leading-relaxed line-clamp-3">
                      {emp.bio}
                    </p>
                  )}

                  {/* Branches Assigned List */}
                  <div className="mt-5 space-y-2">
                    <span className="text-[10px] font-semibold text-gray-400  flex items-center gap-1">
                      <Building className="h-3 w-3 text-gray-400" />
                      Assigned Locations
                    </span>
                    <div className="flex flex-wrap gap-1.5 pt-0.5">
                      {emp.branches.map((b) => (
                        <span
                          key={b.branch_id}
                          className="bg-gray-50 hover:bg-gray-100 text-gray-600 text-[10px] font-semibold px-2 py-1 rounded-lg border border-gray-200/50 transition cursor-default"
                        >
                          {b.branch_name}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Edit Action Button */}
                <div className="border-t border-gray-100 mt-6 pt-4.5 flex items-center justify-between">
                  <span className="text-[10px] text-gray-400 font-medium">
                    Added on {new Date(emp.created_at).toLocaleDateString()}
                  </span>
                  <button
                    onClick={() => openEditDrawer(emp)}
                    className="text-xs font-semibold text-neutral-950 hover:text-neutral-800 transition"
                  >
                    Edit Profile
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
            {/* Backdrop Blur */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDrawerOpen(false)}
              className="absolute inset-0 bg-gray-900/30 backdrop-blur-xs transition-opacity"
            />

            {/* Form Drawer */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 220 }}
              className={`relative w-full bg-white h-full shadow-vercel-lg flex flex-col overflow-hidden transition-all duration-300 ${activeTab === "profile" ? "max-w-md" : "max-w-xl"
                }`}
            >
              {/* Drawer Header */}
              <div className="h-16 border-b border-gray-100 flex items-center justify-between px-6 bg-gray-50/50 shrink-0">
                <div>
                  <h3 className="font-semibold text-gray-900 text-base">
                    {drawerType === "add" ? "Register Team Member" : "Edit Staff Profile"}
                  </h3>
                  {drawerType === "edit" && activeEmployee && (
                    <p className="text-[10px] font-semibold text-gray-400 mt-0.5">
                      Configuring details for {activeEmployee.name}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => setDrawerOpen(false)}
                  className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Top Tab Navigation for Edit mode */}
              {drawerType === "edit" && (
                <div className="flex border-b border-gray-100 bg-gray-50/30 px-6 gap-6 text-sm shrink-0">
                  <button
                    type="button"
                    onClick={() => setActiveTab("profile")}
                    className={`py-3.5 font-semibold relative transition ${activeTab === "profile"
                      ? "text-neutral-950"
                      : "text-gray-400 hover:text-gray-600"
                      }`}
                  >
                    Profile Details
                    {activeTab === "profile" && (
                      <motion.div
                        layoutId="activeTabUnderline"
                        className="absolute bottom-0 left-0 right-0 h-0.5 bg-neutral-950"
                      />
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab("schedule")}
                    className={`py-3.5 font-semibold relative transition ${activeTab === "schedule"
                      ? "text-neutral-950"
                      : "text-gray-400 hover:text-gray-600"
                      }`}
                  >
                    Weekly Schedule
                    {activeTab === "schedule" && (
                      <motion.div
                        layoutId="activeTabUnderline"
                        className="absolute bottom-0 left-0 right-0 h-0.5 bg-neutral-950"
                      />
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab("timeoff")}
                    className={`py-3.5 font-semibold relative transition ${activeTab === "timeoff"
                      ? "text-neutral-950"
                      : "text-gray-400 hover:text-gray-600"
                      }`}
                  >
                    Time Off / Leave
                    {activeTab === "timeoff" && (
                      <motion.div
                        layoutId="activeTabUnderline"
                        className="absolute bottom-0 left-0 right-0 h-0.5 bg-neutral-950"
                      />
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab("bookings")}
                    className={`py-3.5 font-semibold relative transition ${activeTab === "bookings"
                      ? "text-neutral-950"
                      : "text-gray-400 hover:text-gray-600"
                      }`}
                  >
                    Work History
                    {activeTab === "bookings" && (
                      <motion.div
                        layoutId="activeTabUnderline"
                        className="absolute bottom-0 left-0 right-0 h-0.5 bg-neutral-950"
                      />
                    )}
                  </button>
                </div>
              )}

              {/* Drawer Body content depends on activeTab */}
              {activeTab === "profile" ? (
                <>
                  {/* Form Body for Profile Details */}
                  <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
                    {formError && (
                      <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm">
                        {formError}
                      </div>
                    )}

                    {/* Name */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                        Practitioner Name
                      </label>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g. Virat Kohli"
                        className="w-full px-3.5 py-2.5 rounded-md border border-gray-300 outline-none transition focus:ring-2 focus:ring-neutral-950 focus:border-transparent text-sm bg-white text-gray-900"
                        disabled={isSubmitting}
                      />
                    </div>

                    {/* Experience Years */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                        Years of Experience
                      </label>
                      <div className="relative">
                        <Briefcase className="absolute left-3.5 top-3.5 h-4 w-4 text-gray-400" />
                        <input
                          type="number"
                          min="0"
                          value={experienceYears}
                          onChange={(e) => setExperienceYears(e.target.value)}
                          placeholder="e.g. 3"
                          className="w-full pl-10 pr-3.5 py-2.5 rounded-md border border-gray-300 outline-none transition focus:ring-2 focus:ring-neutral-950 focus:border-transparent text-sm bg-white text-gray-900"
                          disabled={isSubmitting}
                        />
                      </div>
                    </div>

                    {/* Biography */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                        Professional Biography
                      </label>
                      <textarea
                        value={bio}
                        onChange={(e) => setBio(e.target.value)}
                        placeholder="e.g. Senior stylist specialized in modern haircuts, bridal designs, and luxury treatments with over 5 years of retail experience..."
                        rows={4}
                        className="w-full px-3.5 py-2.5 rounded-md border border-gray-300 outline-none transition focus:ring-2 focus:ring-neutral-950 focus:border-transparent text-sm bg-white text-gray-900 resize-none leading-relaxed"
                        disabled={isSubmitting}
                      />
                    </div>

                    {/* Branch Assignments */}
                    <div className="space-y-2.5">
                      <label className="block text-sm font-semibold text-gray-700">
                        Assign Branch Locations
                      </label>
                      {branches.length === 0 ? (
                        <p className="text-xs text-amber-500">
                          No branches found. Please add a branch location before adding staff.
                        </p>
                      ) : (
                        <div className="border border-gray-200 rounded-md overflow-hidden divide-y divide-gray-100 bg-gray-50/30">
                          {branches.map((b) => {
                            const isChecked = selectedBranches.includes(b.id)
                            return (
                              <label
                                key={b.id}
                                className="flex items-center justify-between p-3.5 cursor-pointer hover:bg-gray-50/80 transition select-none"
                              >
                                <div className="flex items-center gap-3">
                                  <Building className="h-4 w-4 text-neutral-700" />
                                  <div className="text-left">
                                    <span className="block text-xs font-semibold text-gray-800">
                                      {b.name}
                                    </span>
                                    <span className="block text-[10px] text-gray-400 mt-0.5">
                                      {b.city || "Delhi"}
                                    </span>
                                  </div>
                                </div>
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => handleBranchCheckboxChange(b.id)}
                                  className="hidden"
                                  disabled={isSubmitting}
                                />
                                <div
                                  className={`h-5 w-5 rounded-md border flex items-center justify-center transition
                                    ${isChecked
                                      ? "bg-neutral-950 border-neutral-950 text-white shadow-vercel-sm"
                                      : "border-gray-300 bg-white"
                                    }`}
                                >
                                  {isChecked && <Check className="h-3.5 w-3.5 stroke-[3px]" />}
                                </div>
                              </label>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  </form>

                  {/* Drawer Footer for Profile Info */}
                  <div className="p-6 border-t border-gray-100 bg-gray-50/50 flex items-center justify-between gap-3 shrink-0">
                    {/* Deactivate/Delete staff button */}
                    {drawerType === "edit" && activeEmployee ? (
                      <button
                        type="button"
                        onClick={() => {
                          if (
                            confirm(
                              `Are you absolutely sure you want to deactivate ${activeEmployee.name}? This will remove them from all future booking assignments.`
                            )
                          ) {
                            deactivateEmployeeMutation.mutate(activeEmployee.id)
                          }
                        }}
                        className="flex items-center gap-1.5 px-4 py-2.5 rounded-md border border-red-200 text-red-600 bg-white hover:bg-red-50 text-sm font-semibold transition"
                        disabled={isSubmitting}
                      >
                        <Trash2 className="h-4 w-4" />
                        Deactivate
                      </button>
                    ) : (
                      <div /> // Filler space
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
                          "Save Profile"
                        )}
                      </button>
                    </div>
                  </div>
                </>
              ) : activeTab === "schedule" ? (
                <>
                  {/* Weekly Schedule Planner */}
                  <div className="flex-1 overflow-y-auto p-6 space-y-5">
                    {scheduleSaveError && (
                      <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm">
                        {scheduleSaveError}
                      </div>
                    )}
                    {scheduleSuccessMessage && (
                      <div className="bg-emerald-50 border border-emerald-200 text-emerald-600 px-4 py-3 rounded-md text-sm font-semibold flex items-center gap-2 animate-pulse">
                        <Check className="h-4 w-4 stroke-[3px]" />
                        {scheduleSuccessMessage}
                      </div>
                    )}

                    <div className="bg-neutral-100/70 rounded-md p-4 border border-neutral-200 flex items-center gap-3">
                      <Clock className="h-5 w-5 text-neutral-950 shrink-0" />
                      <div className="text-left">
                        <h5 className="text-xs font-semibold text-neutral-950">Configure Working Hours</h5>
                        <p className="text-[10px] text-neutral-800/80 mt-0.5 leading-relaxed">
                          Define weekly hours of availability. Days marked as Day Off won't receive online booking slots.
                        </p>
                      </div>
                    </div>

                    {isScheduleLoading ? (
                      <div className="flex flex-col items-center justify-center py-20 text-gray-400 gap-2">
                        <Loader2 className="h-8 w-8 text-neutral-950 animate-spin" />
                        <span className="text-xs font-semibold">Fetching availability grid...</span>
                      </div>
                    ) : (
                      <div className="divide-y divide-gray-100 border border-gray-100 rounded-md bg-white overflow-hidden shadow-vercel-sm">
                        {localSchedule.map((slot, index) => {
                          const dayLabel = DAY_LABELS[slot.day_of_week]
                          return (
                            <div
                              key={slot.day_of_week}
                              className="p-4 flex items-center justify-between gap-4 transition hover:bg-gray-50/30"
                            >
                              {/* Day & Toggle switch */}
                              <div className="flex items-center gap-3.5 min-w-[130px]">
                                <button
                                  type="button"
                                  onClick={() => {
                                    const updated = [...localSchedule]
                                    updated[index].is_off = !updated[index].is_off
                                    setLocalSchedule(updated)
                                  }}
                                  className={`w-10 h-6 rounded-full p-0.5 transition duration-200 focus:outline-none shrink-0 ${!slot.is_off ? "bg-neutral-950" : "bg-gray-200"
                                    }`}
                                >
                                  <div
                                    className={`bg-white w-5 h-5 rounded-full shadow-vercel-md transform transition duration-200 ${!slot.is_off ? "translate-x-4" : "translate-x-0"
                                      }`}
                                  />
                                </button>
                                <span className="text-xs font-semibold text-gray-800 ">
                                  {dayLabel}
                                </span>
                              </div>

                              {/* Working indicator / Hours pickers */}
                              {slot.is_off ? (
                                <span className="text-[10px] font-semibold text-gray-400  bg-gray-50 px-3 py-1 rounded-lg border border-gray-200/50">
                                  Day Off
                                </span>
                              ) : (
                                <div className="flex items-center gap-2">
                                  <input
                                    type="time"
                                    value={slot.start_time}
                                    onChange={(e) => {
                                      const updated = [...localSchedule]
                                      updated[index].start_time = e.target.value
                                      setLocalSchedule(updated)
                                    }}
                                    className="px-2.5 py-1.5 rounded-lg border border-gray-200 outline-none text-xs font-semibold text-gray-800 transition focus:border-neutral-950 bg-white"
                                  />
                                  <span className="text-[10px] text-gray-400 font-semibold uppercase">to</span>
                                  <input
                                    type="time"
                                    value={slot.end_time}
                                    onChange={(e) => {
                                      const updated = [...localSchedule]
                                      updated[index].end_time = e.target.value
                                      setLocalSchedule(updated)
                                    }}
                                    className="px-2.5 py-1.5 rounded-lg border border-gray-200 outline-none text-xs font-semibold text-gray-800 transition focus:border-neutral-950 bg-white"
                                  />
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>

                  {/* Drawer Footer for Weekly Schedule */}
                  <div className="p-6 border-t border-gray-100 bg-gray-50/50 flex items-center justify-between gap-3 shrink-0">
                    <button
                      type="button"
                      onClick={() => setDrawerOpen(false)}
                      className="px-4 py-2.5 rounded-md border border-gray-200 bg-white hover:bg-gray-50 text-sm font-semibold text-gray-700 transition"
                      disabled={saveScheduleMutation.isPending}
                    >
                      Close
                    </button>
                    <button
                      type="button"
                      onClick={() => saveScheduleMutation.mutate(localSchedule)}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-md bg-neutral-950 hover:bg-neutral-900 text-sm font-semibold text-white shadow-vercel-md hover:shadow-vercel-lg transition"
                      disabled={saveScheduleMutation.isPending || isScheduleLoading}
                    >
                      {saveScheduleMutation.isPending ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        "Save Weekly Schedule"
                      )}
                    </button>
                  </div>
                </>
              ) : activeTab === "timeoff" ? (
                <>
                  {/* Time Off & Leaves Component */}
                  <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {/* Time Off Info Header */}
                    <div className="bg-amber-50/50 rounded-md p-4 border border-amber-100 flex items-center gap-3">
                      <CalendarOff className="h-5 w-5 text-amber-600 shrink-0" />
                      <div className="text-left">
                        <h5 className="text-xs font-semibold text-amber-950">Log Time Off / Leave</h5>
                        <p className="text-[10px] text-amber-700/80 mt-0.5 leading-relaxed">
                          Blocks calendar slots. Customers cannot book appointments with this practitioner during these intervals.
                        </p>
                      </div>
                    </div>

                    {/* Time Off Input Form */}
                    <form
                      onSubmit={(e) => {
                        e.preventDefault()
                        setTimeOffError(null)
                        if (!timeOffStart || !timeOffEnd) {
                          return setTimeOffError("Both start and end dates/times are required")
                        }
                        const start = new Date(timeOffStart)
                        const end = new Date(timeOffEnd)
                        if (start >= end) {
                          return setTimeOffError("Start date/time must be strictly before end date/time")
                        }
                        createTimeOffMutation.mutate({
                          start_datetime: start.toISOString(),
                          end_datetime: end.toISOString(),
                          reason: timeOffReason.trim() || undefined
                        })
                      }}
                      className="bg-gray-50/50 border border-gray-100 rounded-lg p-4.5 space-y-4 shadow-vercel-sm"
                    >
                      <h4 className="text-xs font-semibold text-gray-800 ">Log Leave Interval</h4>
                      {timeOffError && (
                        <div className="bg-red-50 border border-red-200 text-red-600 px-3 py-2 rounded-md text-xs">
                          {timeOffError}
                        </div>
                      )}
                      <div className="grid grid-cols-2 gap-3.5">
                        <div>
                          <label className="block text-[10px] font-semibold text-gray-400  mb-1.5">
                            Starts At
                          </label>
                          <input
                            type="datetime-local"
                            value={timeOffStart}
                            onChange={(e) => setTimeOffStart(e.target.value)}
                            className="w-full px-3 py-2 rounded-md border border-gray-200 outline-none text-xs font-semibold text-gray-800 transition focus:border-neutral-950 bg-white"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-semibold text-gray-400  mb-1.5">
                            Ends At
                          </label>
                          <input
                            type="datetime-local"
                            value={timeOffEnd}
                            onChange={(e) => setTimeOffEnd(e.target.value)}
                            className="w-full px-3 py-2 rounded-md border border-gray-200 outline-none text-xs font-semibold text-gray-800 transition focus:border-neutral-950 bg-white"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-[10px] font-semibold text-gray-400  mb-1.5">
                          Reason / Description (Optional)
                        </label>
                        <input
                          type="text"
                          value={timeOffReason}
                          onChange={(e) => setTimeOffReason(e.target.value)}
                          placeholder="e.g. Sick Leave, Vacation, Training"
                          className="w-full px-3.5 py-2.5 rounded-md border border-gray-200 outline-none text-xs font-semibold text-gray-800 transition focus:border-neutral-950 bg-white"
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={createTimeOffMutation.isPending}
                        className="w-full flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-md bg-neutral-950 hover:bg-neutral-900 text-xs font-semibold text-white shadow-vercel-sm transition"
                      >
                        {createTimeOffMutation.isPending ? (
                          <>
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            Logging Leave...
                          </>
                        ) : (
                          <>
                            <Plus className="h-3.5 w-3.5" />
                            Log Leave Interval
                          </>
                        )}
                      </button>
                    </form>

                    {/* Registered Leaves List */}
                    <div className="space-y-3.5">
                      <h4 className="text-xs font-semibold text-gray-800  flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-neutral-700" />
                        Logged Leaves Registry ({timeOffList.length})
                      </h4>
                      {isTimeOffLoading ? (
                        <div className="flex items-center justify-center py-10 text-gray-400 gap-2">
                          <Loader2 className="h-4 w-4 animate-spin text-neutral-700" />
                          <span className="text-xs">Loading registry logs...</span>
                        </div>
                      ) : timeOffList.length === 0 ? (
                        <div className="text-center py-10 bg-gray-50/20 border border-dashed border-gray-200 rounded-lg">
                          <p className="text-xs text-gray-400">No leaves logged for this employee.</p>
                        </div>
                      ) : (
                        <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                          {timeOffList.map((to) => {
                            const startStr = new Date(to.start_datetime).toLocaleString([], {
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit"
                            })
                            const endStr = new Date(to.end_datetime).toLocaleString([], {
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit"
                            })
                            return (
                              <div
                                key={to.id}
                                className="flex items-center justify-between p-3.5 rounded-md border border-gray-100 bg-white hover:border-gray-200 shadow-vercel-sm transition"
                              >
                                <div className="text-left">
                                  <span className="inline-block text-[9px] font-semibold text-neutral-950 bg-neutral-100 px-2 py-0.5 rounded-md  mb-1">
                                    {to.reason || "Vacation"}
                                  </span>
                                  <p className="text-xs font-semibold text-gray-800">
                                    {startStr} — {endStr}
                                  </p>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (confirm("Are you absolutely sure you want to delete this time-off interval?")) {
                                      deleteTimeOffMutation.mutate(to.id)
                                    }
                                  }}
                                  className="p-1.5 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-600 transition"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Drawer Footer for Time Off */}
                  <div className="p-6 border-t border-gray-100 bg-gray-50/50 flex items-center justify-end gap-3 shrink-0">
                    <button
                      type="button"
                      onClick={() => setDrawerOpen(false)}
                      className="px-5 py-2.5 rounded-md bg-gray-900 hover:bg-gray-800 text-sm font-semibold text-white transition shadow-vercel-sm"
                    >
                      Close
                    </button>
                  </div>
                </>
              ) : (
                <>
                  {/* Work History & Booking logs */}
                  <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {/* Header */}
                    <div className="bg-neutral-100/70 rounded-md p-4 border border-neutral-200 flex items-center gap-3">
                      <CalendarCheck className="h-5 w-5 text-neutral-950 shrink-0" />
                      <div className="text-left">
                        <h5 className="text-xs font-semibold text-neutral-950">Employee Performance & Work Logs</h5>
                        <p className="text-[10px] text-neutral-800/80 mt-0.5 leading-relaxed">
                          Review overall historical bookings, completed sessions, and total revenue generated by this practitioner.
                        </p>
                      </div>
                    </div>

                    {isBookingsLoading ? (
                      <div className="flex flex-col items-center justify-center py-20 text-gray-400 gap-2">
                        <Loader2 className="h-8 w-8 text-neutral-950 animate-spin" />
                        <span className="text-xs font-semibold">Loading work logs...</span>
                      </div>
                    ) : (
                      <>
                        {/* Statistics Grid */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                          <div className="bg-white border border-gray-100 rounded-lg p-3.5 shadow-vercel-sm text-left">
                            <span className="text-[9px] font-semibold text-gray-400 block uppercase">Total Jobs</span>
                            <span className="text-xl font-bold text-gray-900 mt-1 block">{stats.total}</span>
                          </div>
                          <div className="bg-white border border-gray-100 rounded-lg p-3.5 shadow-vercel-sm text-left">
                            <span className="text-[9px] font-semibold text-gray-400 block uppercase">Completed</span>
                            <span className="text-xl font-bold text-emerald-600 mt-1 block">{stats.completed}</span>
                          </div>
                          <div className="bg-white border border-gray-100 rounded-lg p-3.5 shadow-vercel-sm text-left">
                            <span className="text-[9px] font-semibold text-gray-400 block uppercase">Revenue</span>
                            <span className="text-xl font-bold text-neutral-950 mt-1 block">${stats.revenue.toFixed(2)}</span>
                          </div>
                          <div className="bg-white border border-gray-100 rounded-lg p-3.5 shadow-vercel-sm text-left">
                            <span className="text-[9px] font-semibold text-gray-400 block uppercase">Active Slots</span>
                            <span className="text-xl font-bold text-blue-600 mt-1 block">{stats.active}</span>
                          </div>
                        </div>

                        {/* Booking list */}
                        <div className="space-y-3.5">
                          <h4 className="text-xs font-semibold text-gray-800 flex items-center gap-2">
                            <Briefcase className="h-4 w-4 text-neutral-700" />
                            Booking Log Registry ({employeeBookings.length})
                          </h4>

                          {employeeBookings.length === 0 ? (
                            <div className="text-center py-16 bg-gray-50/20 border border-dashed border-gray-200 rounded-lg">
                              <p className="text-xs text-gray-400">No bookings associated with this employee yet.</p>
                            </div>
                          ) : (
                            <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                              {employeeBookings.map((b: any) => {
                                const bookingDateStr = new Date(b.booking_date).toLocaleDateString([], {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric"
                                })
                                const startStr = b.start_time.substring(0, 5)
                                const endStr = b.end_time.substring(0, 5)
                                const serviceNames = b.services?.map((s: any) => s.service_name).join(", ") || "No services specified"

                                // Status Badge styling
                                let statusClasses = "bg-gray-100 text-gray-700 border-gray-200/50"
                                if (b.booking_status === "completed") {
                                  statusClasses = "bg-emerald-50 text-emerald-700 border-emerald-200/50"
                                } else if (b.booking_status === "confirmed") {
                                  statusClasses = "bg-blue-50 text-blue-700 border-blue-200/50"
                                } else if (b.booking_status === "cancelled") {
                                  statusClasses = "bg-red-50 text-red-700 border-red-200/50"
                                } else if (b.booking_status === "no_show") {
                                  statusClasses = "bg-amber-50 text-amber-700 border-amber-200/50"
                                }

                                return (
                                  <div
                                    key={b.id}
                                    className="p-4 rounded-lg border border-gray-100 bg-white hover:border-gray-200 shadow-vercel-sm transition text-left flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
                                  >
                                    <div className="space-y-1">
                                      <div className="flex items-center gap-2">
                                        <span className="text-xs font-bold text-gray-800">
                                          {b.customer_name || "Walk-in Guest"}
                                        </span>
                                        {b.customer_phone && (
                                          <span className="text-[10px] font-semibold text-gray-400">
                                            ({b.customer_phone})
                                          </span>
                                        )}
                                      </div>
                                      <p className="text-[11px] text-gray-500 font-semibold leading-relaxed">
                                        Services: <span className="text-gray-700">{serviceNames}</span>
                                      </p>
                                      <div className="flex items-center gap-3.5 text-[10px] font-semibold text-gray-400 pt-0.5">
                                        <span className="flex items-center gap-1">
                                          <Calendar className="h-3.5 w-3.5 text-gray-400" />
                                          {bookingDateStr}
                                        </span>
                                        <span className="flex items-center gap-1">
                                          <Clock className="h-3.5 w-3.5 text-gray-400" />
                                          {startStr} — {endStr}
                                        </span>
                                        {b.branch_name && (
                                          <span className="flex items-center gap-1">
                                            <Building className="h-3.5 w-3.5 text-gray-400" />
                                            {b.branch_name}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                    <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2.5 shrink-0 border-t sm:border-t-0 border-gray-50 pt-2.5 sm:pt-0">
                                      <span className="text-sm font-bold text-neutral-950">
                                        ${parseFloat(b.total_amount || "0").toFixed(2)}
                                      </span>
                                      <span className={`text-[10px] font-bold border px-2 py-0.5 rounded-full capitalize ${statusClasses}`}>
                                        {b.booking_status.replace("_", " ")}
                                      </span>
                                    </div>
                                  </div>
                                )
                              })}
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>

                  {/* Drawer Footer for Work History */}
                  <div className="p-6 border-t border-gray-100 bg-gray-50/50 flex items-center justify-end gap-3 shrink-0">
                    <button
                      type="button"
                      onClick={() => setDrawerOpen(false)}
                      className="px-5 py-2.5 rounded-md bg-neutral-950 hover:bg-neutral-900 text-sm font-semibold text-white transition shadow-vercel-sm cursor-pointer"
                    >
                      Close
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
