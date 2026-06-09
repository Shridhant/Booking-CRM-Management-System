import { useState } from "react"
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom"
import { CalendarCheck, LogOut, Search, X, Settings, ChevronDown, HelpCircle } from "lucide-react"
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
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)

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
    <div className="min-h-screen text-midnight-ink bg-white font-sans">
      <div className="mx-auto max-w-[1200px] px-4 py-4 sm:px-6 md:px-8 md:py-6">
        
        {/* ── 1. STICKY HEADER ── */}
        <header className="sticky top-4 z-40 rounded-[8px] border border-soft-mist bg-white/95 p-3.5 backdrop-blur-xl md:p-4 transition duration-300">
          <div className="flex items-center justify-between gap-3">
            
            {/* Brand Logo & Name */}
            <Link to="/customer" className="group flex items-center gap-3 active:scale-97 transition">
              <div className="relative flex h-10 w-10 items-center justify-center rounded-[8px] bg-white p-1 border border-soft-mist transition group-hover:scale-105">
                <img
                  src={`${import.meta.env.BASE_URL}logo.png`}
                  alt="Logo"
                  className="h-full w-full object-contain rounded-[8px]"
                />
              </div>
              <span className="text-sm font-semibold uppercase tracking-[0.045em] text-midnight-ink">
                Bookify
              </span>
            </Link>

            {/* Desktop Navigation Links */}
            <nav className="hidden md:flex items-center gap-2.5">
              <NavLink
                to="/customer"
                end
                className={({ isActive }) =>
                  `inline-flex items-center gap-2 rounded-[8px] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.045em] transition ${
                    isActive
                      ? "bg-midnight-ink text-white"
                      : "border border-soft-mist bg-white text-olive-stone hover:bg-soft-mist/30 hover:text-midnight-ink"
                  }`
                }
              >
                <Search className="h-3.5 w-3.5" />
                <span>Explore</span>
              </NavLink>

              {isAuthenticated ? (
                <div className="relative">
                  <button
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="flex items-center gap-2 rounded-[8px] border border-soft-mist bg-white px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.045em] text-midnight-ink hover:bg-soft-mist/30 transition cursor-pointer"
                  >
                    {user?.profile_photo_url ? (
                      <img 
                        src={user.profile_photo_url} 
                        alt="Profile" 
                        className="h-6 w-6 rounded-full object-cover border border-soft-mist" 
                      />
                    ) : (
                      <div className="h-6 w-6 rounded-full bg-midnight-ink text-white flex items-center justify-center font-bold text-[10px] uppercase">
                        {user?.name ? user.name.substring(0, 2) : "C"}
                      </div>
                    )}
                    <span>{user?.name || "Account"}</span>
                    <ChevronDown className="h-3.5 w-3.5 text-olive-stone" />
                  </button>

                  {/* Dropdown Menu */}
                  {isDropdownOpen && (
                    <>
                      {/* Click-away backdrop */}
                      <div className="fixed inset-0 z-40" onClick={() => setIsDropdownOpen(false)} />
                      <div className="absolute right-0 mt-2 w-64 rounded-[12px] border border-soft-mist bg-white p-4 z-50 text-[11px] font-semibold text-midnight-ink animate-fade-in-down">
                        <div className="pb-3 border-b border-soft-mist">
                          <span className="block font-bold text-[13px] uppercase tracking-[0.045em] text-midnight-ink">My Account</span>
                          <span className="block text-olive-stone font-mono mt-0.5 truncate">{user?.email || user?.phone || "User Details"}</span>
                        </div>
                        <div className="py-2 space-y-1">
                          <Link
                            to="/customer/bookings"
                            onClick={() => setIsDropdownOpen(false)}
                            className="flex items-center justify-between rounded-[8px] px-3 py-2.5 uppercase tracking-[0.045em] hover:bg-soft-mist/35 text-midnight-ink transition"
                          >
                            <div className="flex items-center gap-2.5">
                              <CalendarCheck className="h-4 w-4 text-olive-stone" />
                              <span>My Bookings</span>
                            </div>
                            {bookings.length > 0 && (
                              <span className="bg-midnight-ink text-white text-[9px] font-bold h-4.5 min-w-[18px] px-1 rounded-full flex items-center justify-center">
                                {bookings.length}
                              </span>
                            )}
                          </Link>
                          <button
                            onClick={() => {
                              setIsDropdownOpen(false)
                              setIsSettingsOpen(true)
                            }}
                            className="flex w-full items-center gap-2.5 rounded-[8px] px-3 py-2.5 uppercase tracking-[0.045em] hover:bg-soft-mist/35 text-midnight-ink transition text-left cursor-pointer"
                          >
                            <Settings className="h-4 w-4 text-olive-stone" />
                            <span>Account Settings</span>
                          </button>
                          <button
                            onClick={() => {
                              setIsDropdownOpen(false)
                              alert("For support, contact us at support@bookify.com or call 1-800-BOOKIFY")
                            }}
                            className="flex w-full items-center gap-2.5 rounded-[8px] px-3 py-2.5 uppercase tracking-[0.045em] hover:bg-soft-mist/35 text-midnight-ink transition text-left cursor-pointer"
                          >
                            <HelpCircle className="h-4 w-4 text-olive-stone" />
                            <span>FAQs & Support</span>
                          </button>
                        </div>
                        <div className="pt-2 border-t border-soft-mist">
                          <button
                            onClick={() => {
                              setIsDropdownOpen(false)
                              handleLogout()
                            }}
                            className="flex w-full items-center gap-2.5 rounded-[8px] px-3 py-2.5 uppercase tracking-[0.045em] hover:bg-red-50 text-red-600 transition text-left cursor-pointer"
                          >
                            <LogOut className="h-4 w-4 text-red-500" />
                            <span>Log Out</span>
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <Link
                  to="/login?as=customer"
                  className="btn-outline text-[11px] py-1.5 px-3.5"
                  title="Login / Join"
                >
                  Login
                </Link>
              )}
            </nav>

            {/* Mobile Account Button / Menu Trigger */}
            <div className="md:hidden flex items-center">
              {isAuthenticated ? (
                <button
                  onClick={() => setMobileMenuOpen(true)}
                  className="h-10 w-10 flex items-center justify-center bg-white border border-soft-mist rounded-[8px] text-midnight-ink active:scale-90 transition cursor-pointer relative"
                >
                  {user?.profile_photo_url ? (
                    <img 
                      src={user.profile_photo_url} 
                      alt="Profile" 
                      className="h-7 w-7 rounded-[8px] object-cover border border-soft-mist" 
                    />
                  ) : (
                    <div className="h-7 w-7 rounded-[8px] bg-midnight-ink text-white flex items-center justify-center font-bold text-xs uppercase">
                      {user?.name ? user.name.substring(0, 2) : "C"}
                    </div>
                  )}
                  {bookings.length > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-midnight-ink opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-midnight-ink"></span>
                    </span>
                  )}
                </button>
              ) : (
                <Link
                  to="/login?as=customer"
                  className="btn-outline text-[11px] py-1.5 px-3"
                >
                  Login
                </Link>
              )}
            </div>

          </div>
        </header>

        {/* ── 2. COLLAPSIBLE MOBILE ACCOUNT SLIDE OVER DRAWER ── */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <>
              {/* Backdrop click-away */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.4 }}
                exit={{ opacity: 0 }}
                onClick={() => setMobileMenuOpen(false)}
                className="fixed inset-0 bg-midnight-ink z-40"
              />

              {/* Slide drawer container */}
              <motion.div
                initial={{ x: "100%" }}
                animate={{ x: 0 }}
                exit={{ x: "100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 220 }}
                className="fixed inset-y-0 right-0 w-full max-w-sm bg-white border-l border-soft-mist z-50 p-6 flex flex-col justify-between overflow-y-auto text-midnight-ink"
              >
                <div>
                  {/* Header with Close and Title */}
                  <div className="flex items-center gap-3 pb-6 border-b border-soft-mist mb-6">
                    <button
                      onClick={() => setMobileMenuOpen(false)}
                      className="p-2 rounded-[8px] hover:bg-soft-mist/30 transition text-midnight-ink active:scale-90"
                    >
                      <X className="h-5 w-5" />
                    </button>
                    <div className="min-w-0">
                      <h2 className="text-base font-bold tracking-[-0.3px] text-midnight-ink">My Account</h2>
                      <span className="text-[11px] font-mono text-olive-stone truncate block max-w-[200px]">
                        {user?.email || user?.phone}
                      </span>
                    </div>
                  </div>

                  {/* Section Label */}
                  <span className="block text-[10px] font-bold text-olive-stone uppercase tracking-wider mb-3">
                    Your Information
                  </span>

                  {/* Options List */}
                  <div className="space-y-2 text-xs">
                    <NavLink
                      to="/customer/bookings"
                      onClick={() => setMobileMenuOpen(false)}
                      className={({ isActive }) =>
                        `flex items-center justify-between rounded-[8px] px-4 py-3 font-semibold uppercase tracking-[0.045em] text-[11px] transition ${
                          isActive ? "bg-midnight-ink text-white" : "hover:bg-soft-mist/30 text-midnight-ink"
                        }`
                      }
                    >
                      <div className="flex items-center gap-3">
                        <CalendarCheck className="h-4.5 w-4.5" />
                        <span>Order History</span>
                      </div>
                      
                      {/* Active mobile alerts */}
                      {bookings.length > 0 && (
                        <div className="flex items-center gap-1.5">
                          <span className="bg-midnight-ink text-white text-[10px] font-bold h-5 min-w-[20px] px-1.5 rounded-full flex items-center justify-center">
                            {bookings.length}
                          </span>
                        </div>
                      )}
                    </NavLink>

                    <button
                      onClick={() => {
                        setMobileMenuOpen(false)
                        setIsSettingsOpen(true)
                      }}
                      className="flex w-full items-center gap-3 rounded-[8px] px-4 py-3 font-semibold uppercase tracking-[0.045em] text-[11px] text-midnight-ink hover:bg-soft-mist/30 text-left cursor-pointer"
                    >
                      <Settings className="h-4.5 w-4.5 text-olive-stone" />
                      <span>Address Book</span>
                    </button>

                    <button
                      onClick={() => {
                        setMobileMenuOpen(false)
                        alert("For support, contact us at support@bookify.com or call 1-800-BOOKIFY")
                      }}
                      className="flex w-full items-center gap-3 rounded-[8px] px-4 py-3 font-semibold uppercase tracking-[0.045em] text-[11px] text-midnight-ink hover:bg-soft-mist/30 text-left cursor-pointer"
                    >
                      <HelpCircle className="h-4.5 w-4.5 text-olive-stone" />
                      <span>FAQs & Support</span>
                    </button>
                  </div>
                </div>

                {/* Footer Sign out */}
                <div className="pt-6 border-t border-soft-mist mt-6">
                  <button
                    onClick={handleLogout}
                    className="flex w-full items-center gap-3 rounded-[8px] px-4 py-3.5 font-semibold uppercase tracking-[0.045em] text-[11px] text-red-600 hover:bg-red-50 text-left cursor-pointer"
                  >
                    <LogOut className="h-4.5 w-4.5 text-red-500" />
                    <span>Logout</span>
                  </button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

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
