import { useState } from "react"
import type { ReactNode } from "react"
import { Link, useNavigate, useSearchParams } from "react-router-dom"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { ArrowRight, Loader2 } from "lucide-react"
import { registerCustomerApi } from "../../api/auth.api"
import { useAuthStore } from "../../store/auth.store"

const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email"),
  phone: z.string().min(7, "Phone number is required").max(20, "Phone number is too long"),
  password: z.string().min(8, "Password must be at least 8 characters")
})

type RegisterForm = z.infer<typeof registerSchema>

export default function RegisterPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { login } = useAuthStore()
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema)
  })

  const onSubmit = async (data: RegisterForm) => {
    setError(null)
    try {
      const tokens = await registerCustomerApi(data)
      login(tokens.accessToken, tokens.refreshToken)
      navigate(searchParams.get("next") || "/customer/bookings", { replace: true })
    } catch (err: unknown) {
      setError(typeof err === "string" ? err : "Registration failed. Please try again.")
    }
  }

  return (
    <div className="min-h-screen bg-[#fafafa] flex items-center justify-center px-4 py-10 relative overflow-hidden">
      <div className="absolute inset-x-0 top-0 h-80 mesh-gradient opacity-80 blur-3xl" />
      <div className="w-full max-w-md relative">
        <div className="text-center mb-8">
          <Link
            to="/customer"
            className="mx-auto mb-4 h-12 w-12 rounded-lg overflow-hidden flex items-center justify-center shadow-vercel-sm bg-white border border-[#ebebeb]"
          >
            <img src="/logo.png" alt="Logo" className="h-10 w-10 object-contain" />
          </Link>
          <p className="mono-label mb-2">customer access</p>
          <h1 className="text-[32px] leading-10 font-semibold text-neutral-950">
            Create your booking account.
          </h1>
          <p className="text-sm text-neutral-500 mt-2">
            Book appointments, track visits, cancel eligible bookings, and review completed services.
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-vercel-lg border border-[#ebebeb] p-6 sm:p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Field label="Name" error={errors.name?.message}>
              <input
                type="text"
                autoComplete="name"
                placeholder="Jane Doe"
                className={inputClass(Boolean(errors.name))}
                {...register("name")}
              />
            </Field>

            <Field label="Email" error={errors.email?.message}>
              <input
                type="email"
                autoComplete="email"
                placeholder="jane@example.com"
                className={inputClass(Boolean(errors.email))}
                {...register("email")}
              />
            </Field>

            <Field label="Phone" error={errors.phone?.message}>
              <input
                type="tel"
                autoComplete="tel"
                placeholder="+15551234567"
                className={inputClass(Boolean(errors.phone))}
                {...register("phone")}
              />
            </Field>

            <Field label="Password" error={errors.password?.message}>
              <input
                type="password"
                autoComplete="new-password"
                placeholder="Password123!"
                className={inputClass(Boolean(errors.password))}
                {...register("password")}
              />
            </Field>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md px-4 py-3">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-neutral-950 hover:bg-neutral-900 disabled:opacity-60 text-white font-medium py-2.5 px-4 rounded-full text-sm transition-colors duration-150 mt-2 flex items-center justify-center gap-2 shadow-vercel-sm"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Creating account
                </>
              ) : (
                <>
                  Create account
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          <p className="mt-5 text-center text-sm text-neutral-500">
            Already registered?{" "}
            <Link to={`/login?as=customer${searchParams.get("next") ? `&next=${encodeURIComponent(searchParams.get("next") || "")}` : ""}`} className="font-medium text-neutral-950 hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

function Field({
  label,
  error,
  children
}: {
  label: string
  error?: string
  children: ReactNode
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-neutral-700 mb-1">{label}</label>
      {children}
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  )
}

const inputClass = (hasError: boolean) =>
  `w-full px-3 py-2.5 rounded-md border text-sm outline-none transition shadow-[inset_0_0_0_1px_#00000005] focus:ring-2 focus:ring-neutral-950 focus:border-transparent ${
    hasError ? "border-red-400 bg-red-50" : "border-[#d4d4d4] bg-white"
  }`
