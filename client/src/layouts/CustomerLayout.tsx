import { Link, NavLink, Outlet, useNavigate } from "react-router-dom"
import { CalendarCheck, LogIn, LogOut, Search, UserPlus } from "lucide-react"
import { useAuthStore } from "../store/auth.store"

export default function CustomerLayout() {
  const navigate = useNavigate()
  const { isAuthenticated, user, logout } = useAuthStore()

  const handleLogout = () => {
    logout()
    navigate("/customer")
  }

  return (
    <div className="min-h-screen bg-[#fafafa] text-neutral-950">
      <header className="sticky top-0 z-30 border-b border-[#ebebeb] bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 md:px-8">
          <Link to="/customer" className="flex items-center gap-3 min-w-0">
            <img src="/logo.png" alt="BookingApp" className="h-9 w-9 rounded-md object-contain" />
            <div className="min-w-0">
              <p className="text-sm font-semibold tracking-[-0.28px] truncate">BookingApp</p>
              <p className="mono-label text-[10px]">customer booking</p>
            </div>
          </Link>

          <nav className="flex items-center gap-1 sm:gap-2">
            <NavLink
              to="/customer"
              end
              className={({ isActive }) =>
                `inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition ${
                  isActive ? "bg-neutral-950 text-white" : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-950"
                }`
              }
            >
              <Search className="h-4 w-4" />
              <span className="hidden sm:inline">Explore</span>
            </NavLink>

            {isAuthenticated && user?.role === "customer" ? (
              <>
                <NavLink
                  to="/customer/bookings"
                  className={({ isActive }) =>
                    `inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition ${
                      isActive ? "bg-neutral-950 text-white" : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-950"
                    }`
                  }
                >
                  <CalendarCheck className="h-4 w-4" />
                  <span className="hidden sm:inline">Bookings</span>
                </NavLink>
                <button
                  onClick={handleLogout}
                  className="inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 transition"
                >
                  <LogOut className="h-4 w-4" />
                  <span className="hidden sm:inline">Sign out</span>
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login?as=customer"
                  className="inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-100 hover:text-neutral-950 transition"
                >
                  <LogIn className="h-4 w-4" />
                  <span className="hidden sm:inline">Login</span>
                </Link>
                <Link
                  to="/register"
                  className="inline-flex items-center gap-2 rounded-full bg-neutral-950 px-3 py-2 text-sm font-medium text-white shadow-vercel-sm hover:bg-neutral-900 transition"
                >
                  <UserPlus className="h-4 w-4" />
                  <span className="hidden sm:inline">Join</span>
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 md:px-8 md:py-8">
        <Outlet />
      </main>
    </div>
  )
}
