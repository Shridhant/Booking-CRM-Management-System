import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { loginApi } from "../../api/auth.api"
import { useAuthStore } from "../../store/auth.store"

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
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">

        {/* Logo / Brand */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">BookingApp</h1>
          <p className="text-gray-500 mt-1 text-sm">Admin Panel</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            Sign in to your account
          </h2>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                className={`w-full px-3 py-2.5 rounded-lg border text-sm outline-none transition
                  focus:ring-2 focus:ring-indigo-500 focus:border-transparent
                  ${errors.email ? "border-red-400 bg-red-50" : "border-gray-300 bg-white"}`}
                {...register("email")}
              />
              {errors.email && (
                <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                className={`w-full px-3 py-2.5 rounded-lg border text-sm outline-none transition
                  focus:ring-2 focus:ring-indigo-500 focus:border-transparent
                  ${errors.password ? "border-red-400 bg-red-50" : "border-gray-300 bg-white"}`}
                {...register("password")}
              />
              {errors.password && (
                <p className="text-xs text-red-500 mt-1">{errors.password.message}</p>
              )}
            </div>

            {/* API error */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60
                         text-white font-medium py-2.5 px-4 rounded-lg text-sm
                         transition-colors duration-150 mt-2"
            >
              {isSubmitting ? "Signing in..." : "Sign in"}
            </button>

          </form>
        </div>

      </div>
    </div>
  )
}
