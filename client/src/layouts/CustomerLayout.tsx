import { useState } from "react"
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom"
import { CalendarCheck, LogIn, LogOut, Search, UserPlus } from "lucide-react"
import { useAuthStore } from "../store/auth.store"
import SettingsModal from "../components/common/SettingsModal"

export default function CustomerLayout() {
  const navigate = useNavigate()
  const { isAuthenticated, user, logout } = useAuthStore()
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)

  const handleLogout = () => {
    logout()
    navigate("/customer")
  }

  return (
    <div className="min-h-screen  text-neutral-950">
      <div className="mx-auto max-w-[1800px] px-3 py-4 sm:px-6 md:px-8 md:py-6">
        <header className="sticky top-3 z-30 rounded-[18px] border border-white/70 bg-[#f5e9ed]/90 p-3 backdrop-blur-xl shadow-[0px_8px_24px_-14px_rgba(25,18,24,0.28)] md:p-4">
          <div className="flex flex-wrap items-center gap-3">
            <Link to="/customer" className="group flex min-w-0 items-center gap-3">
              <div className="relative -my-1.5 flex h-12 w-12 md:h-14 md:w-14 items-center justify-center rounded-full bg-white p-1 shadow-[0_8px_20px_-4px_rgba(0,0,0,0.12),0_6px_12px_-5px_rgba(0,0,0,0.08)] border border-white transition-all duration-300 ease-out group-hover:scale-108 group-hover:shadow-[0_12px_24px_-4px_rgba(0,0,0,0.18)] group-active:scale-95">
                <img
                  src={`${import.meta.env.BASE_URL}logo.png`}
                  alt="Logo"
                  className="h-full w-full object-contain rounded-full"
                />
              </div>

            </Link>

            {/* <div className="hidden min-w-[350px] flex-1 items-center justify-center lg:flex">
              <div className="flex w-full max-w-[560px] items-center rounded-full border border-white/70 bg-white px-2 py-1 shadow-[inset_0_1px_0_#ffffff90]">

                <button className="ml-auto inline-flex h-9 w-9 items-center justify-center rounded-full bg-neutral-950 text-white">
                  <Search className="h-4 w-4" />
                </button>
              </div>
            </div> */}

            <nav className="ml-auto flex flex-wrap items-center gap-2">
              <NavLink
                to="/customer"
                end
                className={({ isActive }) =>
                  `inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-medium transition ${isActive
                    ? "bg-neutral-950 text-white"
                    : "border border-white/80 bg-white/70 text-neutral-600 hover:bg-white hover:text-neutral-950"
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
                      `inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-medium transition ${isActive
                        ? "bg-neutral-950 text-white"
                        : "border border-white/80 bg-white/70 text-neutral-600 hover:bg-white hover:text-neutral-950"
                      }`
                    }
                  >
                    <CalendarCheck className="h-4 w-4" />
                    <span className="hidden sm:inline">Bookings</span>
                  </NavLink>
                  <button
                    onClick={() => setIsSettingsOpen(true)}
                    className="inline-flex items-center gap-2 rounded-full border border-white/80 bg-white/70 px-2 py-1 text-sm font-medium text-neutral-600 hover:bg-white hover:text-neutral-950 transition cursor-pointer"
                  >
                    {user?.profile_photo_url ? (
                      <img 
                        src={user.profile_photo_url} 
                        alt="Profile" 
                        className="h-7 w-7 rounded-full object-cover border border-neutral-200/80 shadow-vercel-sm" 
                      />
                    ) : (
                      <div className="h-7 w-7 rounded-full bg-neutral-950 text-white flex items-center justify-center font-bold text-xs uppercase shadow-vercel-sm">
                        {user?.name ? user.name.substring(0,2) : "C"}
                      </div>
                    )}
                    <span className="hidden sm:inline pr-1">{user?.name || "Profile"}</span>
                  </button>
                  <button
                    onClick={handleLogout}
                    className="inline-flex items-center gap-2 rounded-full border border-white/80 bg-white/70 px-3 py-2 text-sm font-medium text-red-600 transition hover:bg-white"
                  >
                    <LogOut className="h-4 w-4" />
                    <span className="hidden sm:inline">Sign out</span>
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login?as=customer"
                    className="inline-flex items-center gap-2 rounded-full border border-white/80 bg-white/70 px-3 py-2 text-sm font-medium text-neutral-600 transition hover:bg-white hover:text-neutral-950"
                  >
                    <LogIn className="h-4 w-4" />
                    <span className="hidden sm:inline">Login</span>
                  </Link>
                  <Link
                    to="/register"
                    className="inline-flex items-center gap-2 rounded-full bg-neutral-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-neutral-900"
                  >
                    <UserPlus className="h-4 w-4" />
                    <span className="hidden sm:inline">Join</span>
                  </Link>
                </>
              )}
            </nav>
          </div>
        </header>

        <main className="pt-5 md:pt-7">
          <Outlet />
        </main>
      </div>

      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
      />
    </div>
  )
}
