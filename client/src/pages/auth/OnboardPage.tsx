import { useState } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { onboardBusinessApi } from "../../api/auth.api"
import {
  Scissors,
  Smile,
  Sparkles,
  Building,
  User,
  Mail,
  Lock,
  CheckCircle,
  ArrowRight,
  Loader2
} from "lucide-react"
import { motion, AnimatePresence } from "motion/react"

const onboardSchema = z.object({
  business_name: z.string().min(2, "Business name must be at least 2 characters"),
  business_type: z.enum(["salon", "spa", "nail_studio", "barber", "professional"], {
    message: "Please select a business type"
  }),
  city: z.string().min(2, "City name must be at least 2 characters"),
  admin_name: z.string().min(2, "Admin name must be at least 2 characters"),
  admin_email: z.string().email("Invalid email address"),
  admin_password: z.string().min(6, "Password must be at least 6 characters")
})

type OnboardForm = z.infer<typeof onboardSchema>

export default function OnboardPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [error, setError] = useState<string | null>(null)
  const [successData, setSuccessData] = useState<OnboardForm | null>(null)

  const isDashboard = location.pathname.startsWith("/dashboard")

  const containerClasses = isDashboard
    ? "w-full max-w-4xl mx-auto pb-12 animate-fade-in"
    : "min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 overflow-hidden"

  const formClasses = isDashboard
    ? "w-full bg-white rounded-lg border border-gray-100 p-6 sm:p-8"
    : "w-full max-w-2xl bg-white rounded-lg shadow-vercel-sm border border-gray-100 p-8 sm:p-10"

  const successClasses = isDashboard
    ? "w-full max-w-xl mx-auto bg-white rounded-lg border border-gray-100 p-6 sm:p-8 text-center space-y-6"
    : "w-full max-w-md bg-white rounded-lg shadow-vercel-sm border border-gray-100 p-8 sm:p-10 text-center space-y-6"

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting }
  } = useForm<OnboardForm>({
    resolver: zodResolver(onboardSchema),
    defaultValues: {
      business_name: "",
      city: "",
      admin_name: "",
      admin_email: "",
      admin_password: ""
    }
  })

  const onSubmit = async (data: OnboardForm) => {
    setError(null)
    try {
      await onboardBusinessApi(data)
      setSuccessData(data)
    } catch (err: any) {
      setError(err || "Onboarding failed. Please try again.")
    }
  }

  const businessTypes = [
    { id: "salon", label: "Salon", icon: Scissors, desc: "Hair & styling studios" },
    { id: "spa", label: "Spa", icon: Sparkles, desc: "Therapy & wellness" },
    { id: "nail_studio", label: "Nail Studio", icon: Smile, desc: "Nails & extensions" },
    { id: "barber", label: "Barber", icon: Scissors, desc: "Men's grooming" },
    { id: "professional", label: "Professional", icon: User, desc: "Solo practitioners" }
  ]

  return (
    <div className={containerClasses}>
      <AnimatePresence mode="wait">
        {!successData ? (
          /* ── ONBOARDING FORM ──────────────────────────────── */
          <motion.div
            key="onboard-form"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className={formClasses}
          >
            {/* Header */}
            <div className="text-center mb-8">
              <h1 className="text-3xl font-semibold text-gray-900 tracking-tight">
                Launch Your Partner Workspace
              </h1>
              <p className="text-gray-500 mt-2 text-sm max-w-md mx-auto">
                Onboard your service business in minutes to start accepting client bookings and
                scheduling staff.
              </p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm mb-6 animate-shake">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* SECTION: Business Info */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-gray-400 ">
                  1. Business Details
                </h3>

                <div className="grid sm:grid-cols-2 gap-4">
                  {/* Name */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase">
                      Business Name
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                        <Building className="h-4 w-4" />
                      </div>
                      <input
                        type="text"
                        placeholder="e.g. Blush Nail Studio"
                        className={`w-full pl-10 pr-3 py-2.5 rounded-md border text-sm outline-none transition
                          focus:ring-2 focus:ring-neutral-950 focus:border-transparent
                          ${errors.business_name ? "border-red-400 bg-red-50/35" : "border-gray-300"}`}
                        {...register("business_name")}
                      />
                    </div>
                    {errors.business_name && (
                      <p className="text-xs text-red-500 mt-1">{errors.business_name.message}</p>
                    )}
                  </div>

                  {/* City */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase">
                      City
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. New Delhi"
                      className={`w-full px-3.5 py-2.5 rounded-md border text-sm outline-none transition
                        focus:ring-2 focus:ring-neutral-950 focus:border-transparent
                        ${errors.city ? "border-red-400 bg-red-50/35" : "border-gray-300"}`}
                      {...register("city")}
                    />
                    {errors.city && (
                      <p className="text-xs text-red-500 mt-1">{errors.city.message}</p>
                    )}
                  </div>
                </div>

                {/* Business Type Stylized Selector */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-2 uppercase">
                    Business Type
                  </label>
                  <Controller
                    name="business_type"
                    control={control}
                    render={({ field }) => (
                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                        {businessTypes.map((type) => {
                          const isSelected = field.value === type.id
                          return (
                            <button
                              key={type.id}
                              type="button"
                              onClick={() => field.onChange(type.id)}
                              className={`flex flex-col items-center justify-center p-3 rounded-lg border text-center transition cursor-pointer select-none
                                ${
                                  isSelected
                                    ? "bg-neutral-100 border-neutral-950 text-neutral-950 shadow-vercel-sm font-semibold"
                                    : "border-gray-200 bg-white hover:bg-gray-50 text-gray-600"
                                }`}
                            >
                              <type.icon className="h-5 w-5 mb-1.5 shrink-0" />
                              <span className="text-[11px] leading-tight font-medium">
                                {type.label}
                              </span>
                            </button>
                          )
                        })}
                      </div>
                    )}
                  />
                  {errors.business_type && (
                    <p className="text-xs text-red-500 mt-1.5">{errors.business_type.message}</p>
                  )}
                </div>
              </div>

              {/* SECTION: Admin Info */}
              <div className="space-y-4 pt-4 border-t border-gray-100">
                <h3 className="text-sm font-semibold text-gray-400 ">
                  2. Administrator Account
                </h3>

                {/* Admin Name */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase">
                    Admin Name
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                      <User className="h-4 w-4" />
                    </div>
                    <input
                      type="text"
                      placeholder="Your full name"
                      className={`w-full pl-10 pr-3 py-2.5 rounded-md border text-sm outline-none transition
                        focus:ring-2 focus:ring-neutral-950 focus:border-transparent
                        ${errors.admin_name ? "border-red-400 bg-red-50/35" : "border-gray-300"}`}
                      {...register("admin_name")}
                    />
                  </div>
                  {errors.admin_name && (
                    <p className="text-xs text-red-500 mt-1">{errors.admin_name.message}</p>
                  )}
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  {/* Email */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase">
                      Admin Email Address
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                        <Mail className="h-4 w-4" />
                      </div>
                      <input
                        type="email"
                        placeholder="admin@business.com"
                        className={`w-full pl-10 pr-3 py-2.5 rounded-md border text-sm outline-none transition
                          focus:ring-2 focus:ring-neutral-950 focus:border-transparent
                          ${errors.admin_email ? "border-red-400 bg-red-50/35" : "border-gray-300"}`}
                        {...register("admin_email")}
                      />
                    </div>
                    {errors.admin_email && (
                      <p className="text-xs text-red-500 mt-1">{errors.admin_email.message}</p>
                    )}
                  </div>

                  {/* Password */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase">
                      Admin Password
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                        <Lock className="h-4 w-4" />
                      </div>
                      <input
                        type="password"
                        placeholder="••••••••"
                        className={`w-full pl-10 pr-3 py-2.5 rounded-md border text-sm outline-none transition
                          focus:ring-2 focus:ring-neutral-950 focus:border-transparent
                          ${errors.admin_password ? "border-red-400 bg-red-50/35" : "border-gray-300"}`}
                        {...register("admin_password")}
                      />
                    </div>
                    {errors.admin_password && (
                      <p className="text-xs text-red-500 mt-1">{errors.admin_password.message}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-neutral-950 hover:bg-neutral-900 disabled:opacity-60
                           text-white font-semibold py-3 px-4 rounded-md text-sm
                           transition duration-150 mt-6 shadow-vercel-md hover:shadow-vercel-lg flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Launching workspace...
                  </>
                ) : (
                  <>
                    Create Workspace
                    <ArrowRight className="h-4.5 w-4.5" />
                  </>
                )}
              </button>
            </form>
          </motion.div>
        ) : (
          /* ── ONBOARDING SUCCESS ───────────────────────────── */
          <motion.div
            key="onboard-success"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", damping: 20, stiffness: 200 }}
            className={successClasses}
          >
            <div className="mx-auto h-16 w-16 bg-green-50 rounded-full flex items-center justify-center text-green-500">
              <CheckCircle className="h-10 w-10" />
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-semibold text-gray-900">Workspace Launched!</h2>
              <p className="text-sm text-gray-500 leading-relaxed">
                Your business workspace has been successfully created. You can now log in using the
                administrator account.
              </p>
            </div>

            {/* Credential summary box */}
            <div className="bg-gray-50 rounded-lg p-5 text-left border border-gray-100 space-y-3.5">
              <div>
                <span className="text-[10px] font-semibold text-gray-400  block">
                  Business Name
                </span>
                <span className="text-sm font-semibold text-gray-800">
                  {successData.business_name}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-[10px] font-semibold text-gray-400  block">
                    City
                  </span>
                  <span className="text-sm font-semibold text-gray-800">{successData.city}</span>
                </div>
                <div>
                  <span className="text-[10px] font-semibold text-gray-400  block">
                    Type
                  </span>
                  <span className="text-sm font-semibold text-gray-800 capitalize">
                    {successData.business_type.replace("_", " ")}
                  </span>
                </div>
              </div>
              <div className="border-t border-gray-200/60 pt-3">
                <span className="text-[10px] font-semibold text-gray-400  block">
                  Admin Login Email
                </span>
                <span className="text-sm font-semibold text-neutral-950">
                  {successData.admin_email}
                </span>
              </div>
            </div>

            {isDashboard ? (
              <button
                onClick={() => setSuccessData(null)}
                className="w-full bg-neutral-950 hover:bg-neutral-900 text-white font-semibold py-3 px-4 rounded-md text-sm transition shadow-vercel-md hover:shadow-vercel-lg flex items-center justify-center gap-2 cursor-pointer"
              >
                Onboard Another Business
                <ArrowRight className="h-4.5 w-4.5" />
              </button>
            ) : (
              <button
                onClick={() => navigate("/login")}
                className="w-full bg-neutral-950 hover:bg-neutral-900 text-white font-semibold py-3 px-4 rounded-md text-sm transition shadow-vercel-md hover:shadow-vercel-lg flex items-center justify-center gap-2 cursor-pointer"
              >
                Proceed to Sign In
                <ArrowRight className="h-4.5 w-4.5" />
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
