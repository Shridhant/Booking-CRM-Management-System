import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { loginApi } from "../../api/auth.api"
import { useAuthStore } from "../../store/auth.store"
import { ArrowRight, Loader2 } from "lucide-react"

const loginSchema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(1, "Password is required"),
})

type LoginForm = z.infer<typeof loginSchema>

export default function LoginPage() {
  const navigate = useNavigate()
  const { login } = useAuthStore()
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginForm) => {
    setError(null)
    try {
      const tokens = await loginApi(data.email, data.password)
      login(tokens.accessToken, tokens.refreshToken)
      navigate("/dashboard")
    } catch (err: any) {
      setError(err || "Login failed. Please try again.")
    }
  }

  return (
    <div className="min-h-screen bg-[#fafafa] flex items-center justify-center px-4 py-10 relative overflow-hidden">
      <div className="absolute inset-x-0 top-0 h-80 mesh-gradient opacity-80 blur-3xl" />
      <div className="w-full max-w-md relative">

        {/* Logo / Brand */}
        <div className="text-center mb-8">
          <div className="mx-auto mb-4 h-12 w-12 rounded-lg overflow-hidden flex items-center justify-center shadow-vercel-sm bg-white border border-[#ebebeb]">
            <img src="/logo.png" alt="Logo" className="h-10 w-10 object-contain" />
          </div>
          <p className="mono-label mb-2">booking workspace</p>
          <h1 className="text-[32px] leading-10 font-semibold tracking-[-1.28px] text-neutral-950">
            Sign in to your account.
          </h1>
          <p className="text-body mt-2 text-sm">
            Manage bookings, clients, staff and branch operations from one focused console.
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-lg shadow-vercel-lg border border-[#ebebeb] p-6 sm:p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-base font-semibold tracking-[-0.28px] text-neutral-950">
              Admin login
            </h2>
            <span className="mono-label">secure</span>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Email
              </label>
              <input
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                className={`w-full px-3 py-2.5 rounded-md border text-sm outline-none transition shadow-[inset_0_0_0_1px_#00000005]
                  focus:ring-2 focus:ring-neutral-950 focus:border-transparent
                  ${errors.email ? "border-red-400 bg-red-50" : "border-[#d4d4d4] bg-white"}`}
                {...register("email")}
              />
              {errors.email && (
                <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Password
              </label>
              <input
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                className={`w-full px-3 py-2.5 rounded-md border text-sm outline-none transition shadow-[inset_0_0_0_1px_#00000005]
                  focus:ring-2 focus:ring-neutral-950 focus:border-transparent
                  ${errors.password ? "border-red-400 bg-red-50" : "border-[#d4d4d4] bg-white"}`}
                {...register("password")}
              />
              {errors.password && (
                <p className="text-xs text-red-500 mt-1">{errors.password.message}</p>
              )}
            </div>

            {/* API error */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md px-4 py-3">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-neutral-950 hover:bg-neutral-900 disabled:opacity-60
                         text-white font-medium py-2.5 px-4 rounded-full text-sm
                         transition-colors duration-150 mt-2 flex items-center justify-center gap-2 shadow-vercel-sm"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Signing in
                </>
              ) : (
                <>
                  Sign in
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>

          </form>
        </div>

      </div>
    </div>
  )
}
