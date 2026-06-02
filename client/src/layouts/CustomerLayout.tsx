import { useState } from "react"
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom"
import { CalendarCheck, LogOut, Search, X, Settings, User, ChevronDown, HelpCircle } from "lucide-react"
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

              {isAuthenticated ? (
                <div className="relative">
                  <button
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="flex items-center gap-2 rounded-full border border-white/80 bg-white/70 px-3 py-1.5 text-xs font-bold text-neutral-600 hover:bg-white hover:text-neutral-950 transition shadow-sm cursor-pointer"
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
                    <span>{user?.name || "Account"}</span>
                    <ChevronDown className="h-3.5 w-3.5 text-neutral-400" />
                  </button>

                  {/* Dropdown Menu */}
                  {isDropdownOpen && (
                    <>
                      {/* Click-away backdrop */}
                      <div className="fixed inset-0 z-40" onClick={() => setIsDropdownOpen(false)} />
                      <div className="absolute right-0 mt-2 w-64 rounded-2xl border border-white/60 bg-white/95 backdrop-blur-xl p-4 shadow-xl z-50 text-xs text-neutral-700 animate-in fade-in duration-100">
                        <div className="pb-3 border-b border-neutral-100">
                          <span className="block font-extrabold text-neutral-950 text-sm">My Account</span>
                          <span className="block text-neutral-400 font-mono mt-0.5 truncate">{user?.email || user?.phone || "User Details"}</span>
                        </div>
                        <div className="py-2 space-y-1">
                          <Link
                            to="/customer/bookings"
                            onClick={() => setIsDropdownOpen(false)}
                            className="flex items-center justify-between rounded-xl px-3 py-2.5 font-bold hover:bg-neutral-50 text-neutral-700 transition"
                          >
                            <div className="flex items-center gap-2.5">
                              <CalendarCheck className="h-4 w-4 text-neutral-500" />
                              <span>My Bookings</span>
                            </div>
                            {bookings.length > 0 && (
                              <span className="bg-[#db2777] text-white text-[9px] font-extrabold h-4.5 min-w-[18px] px-1 rounded-full flex items-center justify-center shadow-inner">
                                {bookings.length}
                              </span>
                            )}
                          </Link>
                          <button
                            onClick={() => {
                              setIsDropdownOpen(false)
                              setIsSettingsOpen(true)
                            }}
                            className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 font-bold hover:bg-neutral-50 text-neutral-700 transition text-left cursor-pointer"
                          >
                            <Settings className="h-4 w-4 text-neutral-500" />
                            <span>Account Settings</span>
                          </button>
                          <button
                            onClick={() => {
                              setIsDropdownOpen(false)
                              alert("For support, contact us at support@bookify.com or call 1-800-BOOKIFY")
                            }}
                            className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 font-bold hover:bg-neutral-50 text-neutral-700 transition text-left cursor-pointer"
                          >
                            <HelpCircle className="h-4 w-4 text-neutral-500" />
                            <span>FAQs & Support</span>
                          </button>
                        </div>
                        <div className="pt-2 border-t border-neutral-100">
                          <button
                            onClick={() => {
                              setIsDropdownOpen(false)
                              handleLogout()
                            }}
                            className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 font-bold hover:bg-red-50 text-red-600 transition text-left cursor-pointer"
                          >
                            <LogOut className="h-4 w-4" />
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
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-white/80 bg-white/70 text-neutral-600 hover:bg-white hover:text-neutral-950 transition shadow-sm cursor-pointer"
                  title="Login / Join"
                >
                  <User className="h-4.5 w-4.5" />
                </Link>
              )}
            </nav>

            {/* Mobile Account Button / Menu Trigger */}
            <div className="md:hidden flex items-center">
              {isAuthenticated ? (
                <button
                  onClick={() => setMobileMenuOpen(true)}
                  className="h-10 w-10 flex items-center justify-center bg-white border border-white/80 rounded-full shadow-sm text-neutral-700 active:scale-90 transition cursor-pointer relative"
                >
                  {user?.profile_photo_url ? (
                    <img 
                      src={user.profile_photo_url} 
                      alt="Profile" 
                      className="h-7 w-7 rounded-full object-cover border border-neutral-100" 
                    />
                  ) : (
                    <div className="h-7 w-7 rounded-full bg-neutral-950 text-white flex items-center justify-center font-bold text-xs uppercase shadow-sm">
                      {user?.name ? user.name.substring(0, 2) : "C"}
                    </div>
                  )}
                  {bookings.length > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#db2777] opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#db2777]"></span>
                    </span>
                  )}
                </button>
              ) : (
                <Link
                  to="/login?as=customer"
                  className="h-10 w-10 flex items-center justify-center bg-white border border-white/80 rounded-full shadow-sm text-neutral-600 active:scale-90 transition cursor-pointer"
                >
                  <User className="h-5 w-5" />
                </Link>
              )}
            </div>

          </div>

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
                  className="fixed inset-0 bg-neutral-950 z-40"
                />

                {/* Slide drawer container */}
                <motion.div
                  initial={{ x: "100%" }}
                  animate={{ x: 0 }}
                  exit={{ x: "100%" }}
                  transition={{ type: "spring", damping: 25, stiffness: 220 }}
                  className="fixed inset-y-0 right-0 w-full max-w-sm bg-white border-l border-[#ebebeb] z-50 shadow-2xl p-6 flex flex-col justify-between overflow-y-auto text-neutral-800"
                >
                  <div>
                    {/* Header with Close and Title */}
                    <div className="flex items-center gap-3 pb-6 border-b border-[#ebebeb] mb-6">
                      <button
                        onClick={() => setMobileMenuOpen(false)}
                        className="p-2 rounded-full hover:bg-neutral-100 transition text-neutral-600 active:scale-90"
                      >
                        <X className="h-5 w-5" />
                      </button>
                      <div className="min-w-0">
                        <h2 className="text-base font-bold tracking-[-0.3px] text-neutral-950">My Account</h2>
                        <span className="text-[11px] font-mono text-neutral-400 truncate block max-w-[200px]">
                          {user?.email || user?.phone}
                        </span>
                      </div>
                    </div>

                    {/* Section Label */}
                    <span className="block text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-3">
                      Your Information
                    </span>

                    {/* Options List */}
                    <div className="space-y-2 text-xs">
                      <NavLink
                        to="/customer/bookings"
                        onClick={() => setMobileMenuOpen(false)}
                        className={({ isActive }) =>
                          `flex items-center justify-between rounded-xl px-4 py-3 font-bold transition ${
                            isActive ? "bg-neutral-950 text-white" : "hover:bg-neutral-100 text-neutral-700"
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
                        className="flex w-full items-center gap-3 rounded-xl px-4 py-3 font-bold text-neutral-700 hover:bg-neutral-100 text-left cursor-pointer"
                      >
                        <Settings className="h-4.5 w-4.5 text-neutral-500" />
                        <span>Address Book</span>
                      </button>

                      <button
                        onClick={() => {
                          setMobileMenuOpen(false)
                          alert("For support, contact us at support@bookify.com or call 1-800-BOOKIFY")
                        }}
                        className="flex w-full items-center gap-3 rounded-xl px-4 py-3 font-bold text-neutral-700 hover:bg-neutral-100 text-left cursor-pointer"
                      >
                        <HelpCircle className="h-4.5 w-4.5 text-neutral-500" />
                        <span>FAQs & Support</span>
                      </button>
                    </div>
                  </div>

                  {/* Footer Sign out */}
                  <div className="pt-6 border-t border-[#ebebeb] mt-6">
                    <button
                      onClick={handleLogout}
                      className="flex w-full items-center gap-3 rounded-xl px-4 py-3.5 font-bold text-red-600 hover:bg-red-50 text-left cursor-pointer"
                    >
                      <LogOut className="h-4.5 w-4.5" />
                      <span>Logout</span>
                    </button>
                  </div>
                </motion.div>
              </>
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
