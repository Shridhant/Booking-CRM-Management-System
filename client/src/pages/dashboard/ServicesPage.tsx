import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useAppStore } from "../../store/app.store"
import {
  listCategoriesApi,
  createCategoryApi,
  updateCategoryApi,
  deleteCategoryApi,
  listServicesApi,
  createServiceApi,
  updateServiceApi,
  deleteServiceApi,
  assignEmployeesToServiceApi
} from "../../api/services.api"
import { uploadMediaApi } from "../../api/media.api"
import { listEmployeesApi } from "../../api/employees.api"
import {
  Scissors,
  Plus,
  ChevronDown,
  ChevronUp,
  Edit2,
  Trash2,
  FolderPlus,
  Loader2,
  X,
  User,
  Clock,
  DollarSign,
  Upload,
  Camera
} from "lucide-react"
import { motion, AnimatePresence } from "motion/react"
import type { Service, ServiceCategory } from "../../types"

export default function ServicesPage() {
  const queryClient = useQueryClient()
  const { selectedBusiness } = useAppStore()
  const businessId = selectedBusiness?.id

  // ── States ──────────────────────────────────────────────────
  const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>({})
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [drawerType, setDrawerType] = useState<
    "add_category" | "edit_category" | "add_service" | "edit_service"
  >("add_category")
  const [activeCategory, setActiveCategory] = useState<ServiceCategory | null>(null)
  const [activeService, setActiveService] = useState<Service | null>(null)

  // Form states
  const [categoryName, setCategoryName] = useState("")
  const [serviceName, setServiceName] = useState("")
  const [serviceDesc, setServiceDesc] = useState("")
  const [serviceDuration, setServiceDuration] = useState<number>(30)
  const [servicePrice, setServicePrice] = useState<number>(50)
  const [serviceMaxPrice, setServiceMaxPrice] = useState<number | "">("")
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("")
  const [assignedEmployeeIds, setAssignedEmployeeIds] = useState<string[]>([])
  const [serviceImageMediaId, setServiceImageMediaId] = useState<string | null>(null)
  const [serviceImageUrl, setServiceImageUrl] = useState<string | null>(null)
  const [uploadingServiceImage, setUploadingServiceImage] = useState(false)

  // Errors
  const [formError, setFormError] = useState<string | null>(null)

  // ── React Query ─────────────────────────────────────────────
  const { data: categories = [], isLoading: isLoadingCats } = useQuery({
    queryKey: ["categories", businessId],
    queryFn: () => (businessId ? listCategoriesApi(businessId, true) : Promise.resolve([])),
    enabled: !!businessId
  })

  const { data: services = [], isLoading: isLoadingServices } = useQuery({
    queryKey: ["services", businessId],
    queryFn: () => (businessId ? listServicesApi(businessId) : Promise.resolve([])),
    enabled: !!businessId
  })

  const { data: employees = [] } = useQuery({
    queryKey: ["employees", businessId],
    queryFn: () => (businessId ? listEmployeesApi(businessId) : Promise.resolve([])),
    enabled: !!businessId
  })

  // ── Mutations ───────────────────────────────────────────────
  const addCategoryMutation = useMutation({
    mutationFn: (name: string) => {
      if (!businessId) throw new Error("No business ID")
      return createCategoryApi(businessId, { name })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories", businessId] })
      setDrawerOpen(false)
      resetForms()
    },
    onError: (err: any) => setFormError(err || "Failed to create category")
  })

  const editCategoryMutation = useMutation({
    mutationFn: (data: { id: string; name: string }) => {
      if (!businessId) throw new Error("No business ID")
      return updateCategoryApi(businessId, data.id, { name: data.name })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories", businessId] })
      setDrawerOpen(false)
      resetForms()
    },
    onError: (err: any) => setFormError(err || "Failed to update category")
  })

  const deleteCategoryMutation = useMutation({
    mutationFn: (id: string) => {
      if (!businessId) throw new Error("No business ID")
      return deleteCategoryApi(businessId, id)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories", businessId] })
      queryClient.invalidateQueries({ queryKey: ["services", businessId] })
      setDrawerOpen(false)
      resetForms()
    },
    onError: (err: any) => setFormError(err || "Failed to delete category")
  })

  const addServiceMutation = useMutation({
    mutationFn: async (data: {
      name: string
      description?: string
      duration_minutes: number
      min_price: number
      max_price?: number
      category_id?: string
      image_media_id?: string | null
      employee_ids: string[]
    }) => {
      if (!businessId) throw new Error("No business ID")
      const svc = await createServiceApi(businessId, {
        name: data.name,
        description: data.description,
        duration_minutes: data.duration_minutes,
        min_price: data.min_price,
        max_price: data.max_price,
        category_id: data.category_id || undefined,
        image_media_id: data.image_media_id,
        employee_ids: data.employee_ids
      })
      return svc
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["services", businessId] })
      queryClient.invalidateQueries({ queryKey: ["categories", businessId] })
      setDrawerOpen(false)
      resetForms()
    },
    onError: (err: any) => setFormError(err || "Failed to create service")
  })

  const editServiceMutation = useMutation({
    mutationFn: async (data: {
      id: string
      name: string
      description?: string
      duration_minutes: number
      min_price: number
      max_price?: number
      category_id?: string | null
      image_media_id?: string | null
      employee_ids: string[]
    }) => {
      if (!businessId) throw new Error("No business ID")
      // Update core service
      await updateServiceApi(businessId, data.id, {
        name: data.name,
        description: data.description,
        duration_minutes: data.duration_minutes,
        min_price: data.min_price,
        max_price: data.max_price || null,
        category_id: data.category_id || null,
        image_media_id: data.image_media_id
      })
      // Update assigned employees specifically
      await assignEmployeesToServiceApi(businessId, data.id, data.employee_ids)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["services", businessId] })
      queryClient.invalidateQueries({ queryKey: ["categories", businessId] })
      setDrawerOpen(false)
      resetForms()
    },
    onError: (err: any) => setFormError(err || "Failed to update service")
  })

  const deleteServiceMutation = useMutation({
    mutationFn: (id: string) => {
      if (!businessId) throw new Error("No business ID")
      return deleteServiceApi(businessId, id)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["services", businessId] })
      queryClient.invalidateQueries({ queryKey: ["categories", businessId] })
      setDrawerOpen(false)
      resetForms()
    },
    onError: (err: any) => setFormError(err || "Failed to delete service")
  })

  // ── Functions ───────────────────────────────────────────────
  const resetForms = () => {
    setCategoryName("")
    setServiceName("")
    setServiceDesc("")
    setServiceDuration(30)
    setServicePrice(50)
    setServiceMaxPrice("")
    setSelectedCategoryId("")
    setAssignedEmployeeIds([])
    setServiceImageMediaId(null)
    setServiceImageUrl(null)
    setUploadingServiceImage(false)
    setFormError(null)
    setActiveCategory(null)
    setActiveService(null)
  }

  const toggleCategory = (catId: string) => {
    setCollapsedCategories((prev) => ({
      ...prev,
      [catId]: !prev[catId]
    }))
  }

  const openAddCategory = () => {
    resetForms()
    setDrawerType("add_category")
    setDrawerOpen(true)
  }

  const openEditCategory = (cat: ServiceCategory, e: React.MouseEvent) => {
    e.stopPropagation() // Prevent toggling accordion
    resetForms()
    setActiveCategory(cat)
    setCategoryName(cat.name)
    setDrawerType("edit_category")
    setDrawerOpen(true)
  }

  const openAddService = (catId?: string) => {
    resetForms()
    setSelectedCategoryId(catId || "uncategorized")
    setDrawerType("add_service")
    setDrawerOpen(true)
  }

  const openEditService = (service: Service) => {
    resetForms()
    setActiveService(service)
    setServiceName(service.name)
    setServiceDesc(service.description || "")
    setServiceDuration(Number(service.duration_minutes))
    setServicePrice(Number(service.min_price))
    setServiceMaxPrice(service.max_price ? Number(service.max_price) : "")
    setSelectedCategoryId(service.category_id || "uncategorized")
    setAssignedEmployeeIds(service.employees?.map((e) => e.employee_id) || [])
    setServiceImageMediaId(service.image_media_id || null)
    setServiceImageUrl(service.image_url || null)
    setDrawerType("edit_service")
    setDrawerOpen(true)
  }

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)

    if (drawerType === "add_category") {
      if (!categoryName.trim()) return setFormError("Category name is required")
      addCategoryMutation.mutate(categoryName)
    } else if (drawerType === "edit_category") {
      if (!activeCategory) return
      if (!categoryName.trim()) return setFormError("Category name is required")
      editCategoryMutation.mutate({ id: activeCategory.id, name: categoryName })
    } else if (drawerType === "add_service") {
      if (!serviceName.trim()) return setFormError("Service name is required")
      const minPriceVal = Number(servicePrice)
      const durationVal = Number(serviceDuration)
      if (isNaN(minPriceVal) || minPriceVal < 0) return setFormError("Price cannot be negative")
      if (isNaN(durationVal) || durationVal <= 0) return setFormError("Duration must be positive")
      
      addServiceMutation.mutate({
        name: serviceName,
        description: serviceDesc || undefined,
        duration_minutes: durationVal,
        min_price: minPriceVal,
        max_price: serviceMaxPrice !== "" ? Number(serviceMaxPrice) : undefined,
        category_id: selectedCategoryId !== "uncategorized" ? selectedCategoryId : undefined,
        image_media_id: serviceImageMediaId,
        employee_ids: assignedEmployeeIds
      })
    } else if (drawerType === "edit_service") {
      if (!activeService) return
      if (!serviceName.trim()) return setFormError("Service name is required")
      const minPriceVal = Number(servicePrice)
      const durationVal = Number(serviceDuration)
      if (isNaN(minPriceVal) || minPriceVal < 0) return setFormError("Price cannot be negative")
      if (isNaN(durationVal) || durationVal <= 0) return setFormError("Duration must be positive")
      
      editServiceMutation.mutate({
        id: activeService.id,
        name: serviceName,
        description: serviceDesc || undefined,
        duration_minutes: durationVal,
        min_price: minPriceVal,
        max_price: serviceMaxPrice !== "" ? Number(serviceMaxPrice) : undefined,
        category_id: selectedCategoryId !== "uncategorized" ? selectedCategoryId : null,
        image_media_id: serviceImageMediaId,
        employee_ids: assignedEmployeeIds
      })
    }
  }

  const handleEmployeeToggle = (empId: string) => {
    setAssignedEmployeeIds((prev) =>
      prev.includes(empId) ? prev.filter((id) => id !== empId) : [...prev, empId]
    )
  }

  // ── dynamic list grouping ───────────────────────────────────
  // Uncategorized services
  const uncategorizedServices = services.filter((s) => !s.category_id)

  const isSubmitting =
    addCategoryMutation.isPending ||
    editCategoryMutation.isPending ||
    deleteCategoryMutation.isPending ||
    addServiceMutation.isPending ||
    editServiceMutation.isPending ||
    deleteServiceMutation.isPending

  if (!businessId) {
    return (
      <div className="flex flex-col items-center justify-center h-96 text-gray-500">
        <FolderPlus className="h-12 w-12 text-gray-300 mb-3" />
        <p className="font-medium text-sm">Please switch or select a business to start.</p>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto pb-12">
      {/* ── Top Actions Header ────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <p className="text-gray-500 text-sm">
            Structure your business menu to let customers book specific treatments.
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={openAddCategory}
            className="flex items-center gap-2 px-4 py-2.5 rounded-md border border-gray-200 bg-white hover:bg-gray-50 text-sm font-semibold text-gray-700 shadow-vercel-sm transition duration-150"
          >
            <FolderPlus className="h-4.5 w-4.5 text-neutral-700" />
            Add Category
          </button>
          <button
            onClick={() => openAddService()}
            className="flex items-center gap-2 px-4 py-2.5 rounded-md bg-neutral-950 hover:bg-neutral-900 text-sm font-semibold text-white shadow-vercel-md hover:shadow-vercel-lg transition duration-150"
          >
            <Plus className="h-4.5 w-4.5" />
            Add Service
          </button>
        </div>
      </div>

      {isLoadingCats || isLoadingServices ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-500 gap-3">
          <Loader2 className="h-8 w-8 text-neutral-950 animate-spin" />
          <p className="text-sm font-medium">Fetching service menu...</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* ── Categories Accordions ──────────────────────────── */}
          {categories.map((category) => {
            const isCollapsed = collapsedCategories[category.id]
            const catServices = services.filter((s) => s.category_id === category.id)
            const totalMins = catServices.reduce((sum, s) => sum + s.duration_minutes, 0)

            return (
              <div
                key={category.id}
                className="bg-white rounded-lg border border-gray-100 shadow-vercel-sm overflow-hidden transition-all duration-200 hover:border-gray-200"
              >
                {/* Header section */}
                <div
                  onClick={() => toggleCategory(category.id)}
                  className="flex items-center justify-between p-5 cursor-pointer bg-white select-none hover:bg-gray-50/50"
                >
                  <div className="flex items-center gap-3">
                    <span className="p-2 rounded-lg bg-neutral-100 text-neutral-950">
                      <Scissors className="h-4 w-4" />
                    </span>
                    <div>
                      <h3 className="font-semibold text-gray-900 text-base">{category.name}</h3>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {catServices.length} {catServices.length === 1 ? "service" : "services"}{" "}
                        {catServices.length > 0 && `· ${totalMins} mins total`}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={(e) => openEditCategory(category, e)}
                      className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition"
                      title="Edit Category Name"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => openAddService(category.id)}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-neutral-950 hover:bg-neutral-100 transition"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Add Service
                    </button>
                    <span className="text-gray-300">|</span>
                    <button
                      onClick={() => toggleCategory(category.id)}
                      className="p-1 text-gray-400 hover:text-gray-700 transition"
                    >
                      {isCollapsed ? (
                        <ChevronDown className="h-5 w-5" />
                      ) : (
                        <ChevronUp className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Services lists inside category */}
                <AnimatePresence initial={false}>
                  {!isCollapsed && (
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: "auto" }}
                      exit={{ height: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden bg-gray-50/20 border-t border-gray-50"
                    >
                      <div className="p-5 space-y-3">
                        {catServices.length === 0 ? (
                          <div className="py-8 text-center text-gray-400 text-sm">
                            No services inside this category yet. Click "Add Service" to add one!
                          </div>
                        ) : (
                          <div className="grid md:grid-cols-2 gap-4">
                            {catServices.map((service) => (
                              <div
                                key={service.id}
                                onClick={() => openEditService(service)}
                                className="bg-white p-4.5 rounded-md border border-gray-100 shadow-vercel-sm hover:shadow-vercel-sm transition duration-150 flex items-start gap-4 cursor-pointer group hover:border-neutral-200"
                              >
                                {service.image_url && (
                                  <img
                                    src={service.image_url}
                                    alt={service.name}
                                    className="h-14 w-14 rounded-md object-cover border border-gray-100 shrink-0 shadow-vercel-sm"
                                  />
                                )}
                                <div className="space-y-1.5 flex-1 pr-4">
                                  <div className="flex items-center gap-2">
                                    <h4 className="font-semibold text-gray-800 text-sm group-hover:text-neutral-950 transition">
                                      {service.name}
                                    </h4>
                                    {!service.is_active && (
                                      <span className="text-[10px] bg-gray-100 text-gray-500 font-semibold px-2 py-0.5 rounded-full">
                                        Inactive
                                      </span>
                                    )}
                                  </div>
                                  {service.description && (
                                    <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">
                                      {service.description}
                                    </p>
                                  )}
                                  <div className="flex items-center gap-4 text-xs text-gray-400 pt-1">
                                    <span className="flex items-center gap-1">
                                      <Clock className="h-3.5 w-3.5 text-gray-300" />
                                      {service.duration_minutes} mins
                                    </span>
                                    <span className="flex items-center gap-0.5">
                                      <DollarSign className="h-3.5 w-3.5 text-gray-300" />
                                      {service.min_price}
                                      {service.max_price ? ` - ${service.max_price}` : ""}
                                    </span>
                                    {service.employees?.length > 0 && (
                                      <span className="flex items-center gap-1">
                                        <User className="h-3.5 w-3.5 text-gray-300" />
                                        {service.employees.length} staff
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <button className="p-1 rounded-md text-gray-300 hover:text-neutral-950 opacity-0 group-hover:opacity-100 transition duration-150 shrink-0 self-center">
                                  <Edit2 className="h-4 w-4" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )
          })}

          {/* ── Uncategorized Services at the bottom ───────────── */}
          <div className="bg-white rounded-lg border border-gray-100 shadow-vercel-sm overflow-hidden">
            <div className="p-5 flex items-center justify-between border-b border-gray-50 bg-gray-50/10">
              <div className="flex items-center gap-3">
                <span className="p-2 rounded-lg bg-gray-100 text-gray-500">
                  <Scissors className="h-4 w-4" />
                </span>
                <div>
                  <h3 className="font-semibold text-gray-900 text-base">Uncategorized Services</h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {uncategorizedServices.length} services not assigned to any category
                  </p>
                </div>
              </div>
              {uncategorizedServices.length > 0 && (
                <button
                  onClick={() => openAddService("uncategorized")}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-neutral-950 hover:bg-neutral-100 transition animate-fade-in"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add Service
                </button>
              )}
            </div>

            <div className="p-5">
              {uncategorizedServices.length === 0 ? (
                <div className="py-6 text-center text-gray-400 text-sm">
                  No uncategorized services found. All your services are perfectly organized!
                </div>
              ) : (
                <div className="grid md:grid-cols-2 gap-4">
                  {uncategorizedServices.map((service) => (
                    <div
                      key={service.id}
                      onClick={() => openEditService(service)}
                      className="bg-white p-4.5 rounded-md border border-gray-100 shadow-vercel-sm hover:shadow-vercel-sm hover:border-neutral-200 cursor-pointer group flex items-start gap-4 transition"
                    >
                      {service.image_url && (
                        <img
                          src={service.image_url}
                          alt={service.name}
                          className="h-14 w-14 rounded-md object-cover border border-gray-100 shrink-0 shadow-vercel-sm"
                        />
                      )}
                      <div className="space-y-1.5 flex-1 pr-4">
                        <h4 className="font-semibold text-gray-800 text-sm group-hover:text-neutral-950 transition">
                          {service.name}
                        </h4>
                        {service.description && (
                          <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">
                            {service.description}
                          </p>
                        )}
                        <div className="flex items-center gap-4 text-xs text-gray-400 pt-1">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5 text-gray-300" />
                            {service.duration_minutes} mins
                          </span>
                          <span className="flex items-center gap-0.5">
                            <DollarSign className="h-3.5 w-3.5 text-gray-300" />
                            {service.min_price}
                            {service.max_price ? ` - ${service.max_price}` : ""}
                          </span>
                          {service.employees?.length > 0 && (
                            <span className="flex items-center gap-1">
                              <User className="h-3.5 w-3.5 text-gray-300" />
                              {service.employees.length} staff
                            </span>
                          )}
                        </div>
                      </div>
                      <button className="p-1 rounded-md text-gray-300 hover:text-neutral-950 opacity-0 group-hover:opacity-100 transition shrink-0 self-center">
                        <Edit2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Slide-out Side Drawer ──────────────────────────────── */}
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
              <div className="h-16 border-b border-gray-100 flex items-center justify-between px-6 bg-gray-50/50">
                <h3 className="font-semibold text-gray-900 text-base">
                  {drawerType === "add_category" && "Add New Category"}
                  {drawerType === "edit_category" && "Edit Category"}
                  {drawerType === "add_service" && "Create New Service"}
                  {drawerType === "edit_service" && "Edit Service details"}
                </h3>
                <button
                  onClick={() => setDrawerOpen(false)}
                  className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Form body */}
              <form onSubmit={handleFormSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
                {formError && (
                  <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
                    {formError}
                  </div>
                )}

                {/* ── Category Fields ──────────────────────────────── */}
                {(drawerType === "add_category" || drawerType === "edit_category") && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                        Category Name
                      </label>
                      <input
                        type="text"
                        value={categoryName}
                        onChange={(e) => setCategoryName(e.target.value)}
                        placeholder="e.g. Haircuts, Nails, Facials"
                        className="w-full px-3.5 py-2.5 rounded-md border border-gray-300 outline-none transition focus:ring-2 focus:ring-neutral-950 focus:border-transparent text-sm bg-white text-gray-900"
                        disabled={isSubmitting}
                      />
                    </div>
                  </div>
                )}

                {/* ── Service Fields ───────────────────────────────── */}
                {(drawerType === "add_service" || drawerType === "edit_service") && (
                  <div className="space-y-5">
                    {/* Service Image Upload */}
                    <div className="flex flex-col items-center justify-center border border-dashed border-gray-200 rounded-lg p-5 bg-gray-50/50 mb-3">
                      <label className="block text-sm font-semibold text-gray-700 mb-3 text-center w-full">
                        Service Cover Image
                      </label>
                      <div className="relative group">
                        {serviceImageUrl ? (
                          <img
                            src={serviceImageUrl}
                            alt="Preview"
                            className="h-32 w-48 rounded-lg object-cover shadow-vercel-md border border-gray-200"
                          />
                        ) : (
                          <div className="h-32 w-48 rounded-lg bg-neutral-900 flex items-center justify-center text-white font-bold text-xl uppercase tracking-wider">
                            <Camera className="h-8 w-8 text-neutral-400" />
                          </div>
                        )}

                        {/* Image hover action overlay */}
                        <div className="absolute inset-0 bg-black/40 rounded-lg opacity-0 group-hover:opacity-100 transition duration-200 flex items-center justify-center cursor-pointer">
                          <label className="cursor-pointer text-white text-xs font-semibold flex flex-col items-center gap-1 w-full h-full justify-center">
                            <Upload className="h-4.5 w-4.5" />
                            <span>Change Cover</span>
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={async (e) => {
                                const file = e.target.files?.[0]
                                if (!file) return
                                try {
                                  setUploadingServiceImage(true)
                                  setFormError(null)
                                  const media = await uploadMediaApi(file, "services")
                                  setServiceImageMediaId(media.id)
                                  setServiceImageUrl(media.url)
                                } catch (err: any) {
                                  console.error("Failed to upload image", err)
                                  setFormError(err.message || "Failed to upload image. Please try again.")
                                } finally {
                                  setUploadingServiceImage(false)
                                }
                              }}
                            />
                          </label>
                        </div>
                      </div>
                      {uploadingServiceImage && (
                        <div className="flex items-center gap-2 text-xs font-medium text-neutral-500 mt-3 animate-pulse">
                          <Loader2 className="h-3 w-3 animate-spin text-neutral-900" />
                          Uploading to Cloudinary...
                        </div>
                      )}
                      {!uploadingServiceImage && !serviceImageUrl && (
                        <p className="text-[10px] text-gray-400 mt-2 text-center">
                          Recommend landscape (16:10 or 16:9), Max 10MB
                        </p>
                      )}
                    </div>

                    {/* Name */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                        Service Name
                      </label>
                      <input
                        type="text"
                        value={serviceName}
                        onChange={(e) => setServiceName(e.target.value)}
                        placeholder="e.g. Classic Manicure"
                        className="w-full px-3.5 py-2.5 rounded-md border border-gray-300 outline-none transition focus:ring-2 focus:ring-neutral-950 focus:border-transparent text-sm bg-white text-gray-900"
                        disabled={isSubmitting}
                      />
                    </div>

                    {/* Category Selection */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                        Category mapping
                      </label>
                      <select
                        value={selectedCategoryId}
                        onChange={(e) => setSelectedCategoryId(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-md border border-gray-300 outline-none transition focus:ring-2 focus:ring-neutral-950 focus:border-transparent text-sm bg-white text-gray-900"
                        disabled={isSubmitting}
                      >
                        <option value="uncategorized">No category (Uncategorized)</option>
                        {categories.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Description */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                        Description
                      </label>
                      <textarea
                        value={serviceDesc}
                        onChange={(e) => setServiceDesc(e.target.value)}
                        placeholder="Provide details about the service treatment..."
                        rows={3}
                        className="w-full px-3.5 py-2.5 rounded-md border border-gray-300 outline-none transition focus:ring-2 focus:ring-neutral-950 focus:border-transparent text-sm bg-white text-gray-900"
                        disabled={isSubmitting}
                      />
                    </div>

                    {/* Duration & Price Grid */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                          Duration (mins)
                        </label>
                        <input
                          type="number"
                          value={serviceDuration}
                          onChange={(e) => setServiceDuration(Number(e.target.value))}
                          min={1}
                          className="w-full px-3.5 py-2.5 rounded-md border border-gray-300 outline-none transition focus:ring-2 focus:ring-neutral-950 focus:border-transparent text-sm bg-white text-gray-900"
                          disabled={isSubmitting}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                          Base Price ($)
                        </label>
                        <input
                          type="number"
                          value={servicePrice}
                          onChange={(e) => setServicePrice(Number(e.target.value))}
                          min={0}
                          className="w-full px-3.5 py-2.5 rounded-md border border-gray-300 outline-none transition focus:ring-2 focus:ring-neutral-950 focus:border-transparent text-sm bg-white text-gray-900"
                          disabled={isSubmitting}
                        />
                      </div>
                    </div>

                    {/* Optional Max Price */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5 flex items-center justify-between">
                        <span>Max Price ($)</span>
                        <span className="text-[10px] text-gray-400 font-normal">Optional</span>
                      </label>
                      <input
                        type="number"
                        value={serviceMaxPrice}
                        onChange={(e) =>
                          setServiceMaxPrice(e.target.value === "" ? "" : Number(e.target.value))
                        }
                        placeholder="e.g. 120"
                        min={0}
                        className="w-full px-3.5 py-2.5 rounded-md border border-gray-300 outline-none transition focus:ring-2 focus:ring-neutral-950 focus:border-transparent text-sm bg-white text-gray-900"
                        disabled={isSubmitting}
                      />
                    </div>

                    {/* Staff Assignments */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Assigned Staff Members
                      </label>
                      {employees.length === 0 ? (
                        <p className="text-xs text-gray-400 italic">
                          No staff found. Build team roster to assign them to services.
                        </p>
                      ) : (
                        <div className="border border-gray-100 rounded-md divide-y divide-gray-50 max-h-48 overflow-y-auto bg-gray-50/50 p-2.5 space-y-1.5">
                          {employees.map((emp) => {
                            const isAssigned = assignedEmployeeIds.includes(emp.id)
                            return (
                              <div
                                key={emp.id}
                                onClick={() => handleEmployeeToggle(emp.id)}
                                className={`flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer transition select-none
                                  ${
                                    isAssigned
                                      ? "bg-white border border-neutral-200 text-neutral-800 shadow-vercel-sm font-semibold"
                                      : "hover:bg-white text-gray-700 border border-transparent"
                                  }`}
                              >
                                <span className="text-sm">{emp.name}</span>
                                <input
                                  type="checkbox"
                                  checked={isAssigned}
                                  onChange={() => {}} // Controlled by wrapper div click
                                  className="h-4 w-4 rounded border-gray-300 text-neutral-950 focus:ring-neutral-950 cursor-pointer"
                                />
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </form>

              {/* Drawer footer */}
              <div className="p-6 border-t border-gray-100 bg-gray-50/50 flex items-center justify-between gap-3 shrink-0">
                {/* Delete button (Edit states only) */}
                {drawerType === "edit_category" && activeCategory ? (
                  <button
                    type="button"
                    onClick={() => {
                      if (
                        confirm(
                          "Are you sure you want to delete this category? The category mapping of any services inside will be cleared."
                        )
                      ) {
                        deleteCategoryMutation.mutate(activeCategory.id)
                      }
                    }}
                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-md border border-red-200 text-red-600 bg-white hover:bg-red-50 text-sm font-semibold transition"
                    disabled={isSubmitting}
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </button>
                ) : drawerType === "edit_service" && activeService ? (
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm("Are you sure you want to delete this service?")) {
                        deleteServiceMutation.mutate(activeService.id)
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
                    onClick={handleFormSubmit}
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
