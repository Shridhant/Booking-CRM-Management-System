import { useState } from "react"
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom"
import { CalendarCheck, LogIn, LogOut, Search, UserPlus, Menu, X, Settings } from "lucide-react"
import { motion, AnimatePresence } from "motion/react"
import { useQuery } from "@tanstack/react-query"
import { useAuthStore } from "../store/auth.store"
import { listCustomerBookingsApi } from "../api/customer.api"
import SettingsModal from "../components/common/SettingsModal"

export default function CustomerLayout() {
  const navigate = useNavigate()
  const { isAuthenticated, user, logout } = useAuthStore()
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const handleLogout = () => {
    logout()
    setMobileMenuOpen(false)
    navigate("/customer")
  }

  // Fetch real customer active bookings count for the header notification indicator
  const { data: bookings = [] } = useQuery({
    queryKey: ["customer-bookings", "active"],
    queryFn: () => listCustomerBookingsApi("active"),
    enabled: isAuthenticated && user?.role === "customer"
  })

  return (
    <div className="min-h-screen text-neutral-950 bg-gradient-to-br from-[#fffbfc] via-[#fbf8f9] to-[#f4f7fa]">
      <div className="mx-auto max-w-[1800px] px-4 py-4 sm:px-6 md:px-8 md:py-6">
        
        {/* ── 1. STICKY HEADER ── */}
        <header className="sticky top-4 z-40 rounded-[24px] border border-white/60 bg-[#f5e9ed]/80 p-3.5 backdrop-blur-xl shadow-[0_8px_32px_rgba(25,18,24,0.12)] md:p-4 transition duration-300">
          <div className="flex items-center justify-between gap-3">
            
            {/* Brand Logo & Name */}
            <Link to="/customer" className="group flex items-center gap-3 active:scale-97 transition">
              <div className="relative flex h-11 w-11 items-center justify-center rounded-full bg-white p-1 shadow-md border border-white/80 transition group-hover:scale-105">
                <img
                  src={`${import.meta.env.BASE_URL}logo.png`}
                  alt="Logo"
                  className="h-full w-full object-contain rounded-full"
                />
              </div>
              <span className="text-sm font-extrabold tracking-tight text-neutral-900 group-hover:text-neutral-700 transition">
                Bookify
              </span>
            </Link>

            {/* Desktop Navigation Links */}
            <nav className="hidden md:flex items-center gap-2.5">
              <NavLink
                to="/customer"
                end
                className={({ isActive }) =>
                  `inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-bold transition shadow-sm ${
                    isActive
                      ? "bg-neutral-950 text-white"
                      : "border border-white/80 bg-white/70 text-neutral-600 hover:bg-white hover:text-neutral-950"
                  }`
                }
              >
                <Search className="h-3.5 w-3.5" />
                <span>Explore</span>
              </NavLink>

              {isAuthenticated && user?.role === "customer" ? (
                <>
                  <NavLink
                    to="/customer/bookings"
                    className={({ isActive }) =>
                      `relative inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-bold transition shadow-sm ${
                        isActive
                          ? "bg-neutral-950 text-white animate-none"
                          : "border border-white/80 bg-white/70 text-neutral-600 hover:bg-white hover:text-neutral-950"
                      }`
                    }
                  >
                    <CalendarCheck className="h-3.5 w-3.5" />
                    <span>My Bookings</span>
                    
                    {/* Pulsing Alert Badge indicators */}
                    {bookings.length > 0 && (
                      <span className="bg-[#db2777] text-white text-[9px] font-extrabold h-4.5 min-w-[18px] px-1 rounded-full flex items-center justify-center shadow-inner ml-0.5">
                        {bookings.length}
                      </span>
                    )}
                    {bookings.length > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#db2777] opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-[#db2777]"></span>
                      </span>
                    )}
                  </NavLink>

                  <button
                    onClick={() => setIsSettingsOpen(true)}
                    className="inline-flex items-center gap-2 rounded-full border border-white/80 bg-white/70 px-3 py-1.5 text-xs font-bold text-neutral-600 hover:bg-white hover:text-neutral-950 transition shadow-sm cursor-pointer"
                  >
                    {user?.profile_photo_url ? (
                      <img 
                        src={user.profile_photo_url} 
                        alt="Profile" 
                        className="h-6 w-6 rounded-full object-cover border border-neutral-100" 
                      />
                    ) : (
                      <div className="h-6 w-6 rounded-full bg-neutral-950 text-white flex items-center justify-center font-bold text-[10px] uppercase shadow-sm">
                        {user?.name ? user.name.substring(0, 2) : "C"}
                      </div>
                    )}
                    <span>{user?.name || "Profile"}</span>
                  </button>

                  <button
                    onClick={handleLogout}
                    className="inline-flex items-center gap-2 rounded-full border border-white/80 bg-white/70 px-4 py-2 text-xs font-bold text-red-600 transition hover:bg-white shadow-sm"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    <span>Sign out</span>
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login?as=customer"
                    className="inline-flex items-center gap-2 rounded-full border border-white/80 bg-white/70 px-4 py-2 text-xs font-bold text-neutral-600 transition hover:bg-white shadow-sm"
                  >
                    <LogIn className="h-3.5 w-3.5" />
                    <span>Login</span>
                  </Link>
                  <Link
                    to="/register"
                    className="inline-flex items-center gap-2 rounded-full bg-neutral-950 px-5 py-2 text-xs font-bold text-white transition hover:bg-neutral-900 shadow-md"
                  >
                    <UserPlus className="h-3.5 w-3.5" />
                    <span>Join</span>
                  </Link>
                </>
              )}
            </nav>

            {/* Mobile Menu Burger Icon */}
            <div className="md:hidden flex items-center">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="h-10 w-10 flex items-center justify-center bg-white border border-white/80 rounded-full shadow-sm text-neutral-700 active:scale-90 transition cursor-pointer relative"
              >
                {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                {!mobileMenuOpen && bookings.length > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#db2777] opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#db2777]"></span>
                  </span>
                )}
              </button>
            </div>

          </div>

          {/* ── 2. COLLAPSIBLE MOBILE GRADUAL BLUR BACKDROP MENU ── */}
          <AnimatePresence>
            {mobileMenuOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0, marginTop: 0 }}
                animate={{ opacity: 1, height: "auto", marginTop: 12 }}
                exit={{ opacity: 0, height: 0, marginTop: 0 }}
                transition={{ duration: 0.25, ease: "easeInOut" }}
                className="md:hidden overflow-hidden rounded-2xl border border-white/50 bg-white/95 backdrop-blur-2xl p-4 shadow-xl space-y-3"
              >
                <NavLink
                  to="/customer"
                  end
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold transition ${
                      isActive ? "bg-neutral-900 text-white" : "hover:bg-neutral-100 text-neutral-700"
                    }`
                  }
                >
                  <Search className="h-4.5 w-4.5" />
                  <span>Explore Services</span>
                </NavLink>

                {isAuthenticated && user?.role === "customer" ? (
                  <>
                    <NavLink
                      to="/customer/bookings"
                      onClick={() => setMobileMenuOpen(false)}
                      className={({ isActive }) =>
                        `flex items-center justify-between rounded-xl px-4 py-3 text-sm font-bold transition ${
                          isActive ? "bg-neutral-900 text-white" : "hover:bg-neutral-100 text-neutral-700"
                        }`
                      }
                    >
                      <div className="flex items-center gap-3">
                        <CalendarCheck className="h-4.5 w-4.5" />
                        <span>My Bookings</span>
                      </div>
                      
                      {/* Active mobile alerts */}
                      {bookings.length > 0 && (
                        <div className="flex items-center gap-1.5">
                          <span className="bg-[#db2777] text-white text-[10px] font-extrabold h-5 min-w-[20px] px-1.5 rounded-full flex items-center justify-center shadow-sm">
                            {bookings.length}
                          </span>
                          <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#db2777] opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#db2777]"></span>
                          </span>
                        </div>
                      )}
                    </NavLink>

                    <button
                      onClick={() => {
                        setMobileMenuOpen(false)
                        setIsSettingsOpen(true)
                      }}
                      className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold text-neutral-700 hover:bg-neutral-100 text-left cursor-pointer"
                    >
                      <Settings className="h-4.5 w-4.5 text-neutral-500" />
                      <span>Account Settings</span>
                    </button>

                    <button
                      onClick={handleLogout}
                      className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold text-red-600 hover:bg-red-50 text-left cursor-pointer"
                    >
                      <LogOut className="h-4.5 w-4.5" />
                      <span>Sign Out</span>
                    </button>
                  </>
                ) : (
                  <div className="grid grid-cols-2 gap-2 pt-2">
                    <Link
                      to="/login?as=customer"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center justify-center gap-2 rounded-full border border-neutral-200 bg-white py-3 text-sm font-bold text-neutral-700 hover:bg-neutral-50 shadow-sm"
                    >
                      <LogIn className="h-4 w-4" />
                      <span>Login</span>
                    </Link>
                    <Link
                      to="/register"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center justify-center gap-2 rounded-full bg-neutral-950 py-3 text-sm font-bold text-white hover:bg-neutral-900 shadow-md"
                    >
                      <UserPlus className="h-4 w-4" />
                      <span>Join</span>
                    </Link>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

        </header>

        {/* ── 3. PAGE MAIN CONTENT PORTAL ── */}
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
