import { useState, useEffect } from "react"
import { Outlet, NavLink, useNavigate, useLocation } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { useAuthStore } from "../store/auth.store"
import { useAppStore } from "../store/app.store"
import { getMyBusinessApi } from "../api/businesses.api"
import { listBranchesApi } from "../api/branches.api"
import {
  LayoutDashboard,
  Scissors,
  Users,
  Calendar,
  Smile,
  LogOut,
  Menu,
  X,
  Building,
  ChevronDown,
  MapPin,
  Shield
} from "lucide-react"
import SettingsModal from "../components/common/SettingsModal"



export default function DashboardLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout } = useAuthStore()
  const {
    selectedBusiness,
    selectedBranch,
    setSelectedBusiness,
    setSelectedBranch,
    clearApp
  } = useAppStore()

  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)
  const [isBranchDropdownOpen, setIsBranchDropdownOpen] = useState(false)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)

  // Fetch business if not selected yet
  useEffect(() => {
    async function initBusiness() {
      try {
        if (!selectedBusiness?.id || !selectedBusiness?.name) {
          const business = await getMyBusinessApi()
          setSelectedBusiness({ id: business.id, name: business.name })
        }
      } catch (err) {
        console.error("Failed to initialize business settings", err)
      }
    }
    initBusiness()
  }, [selectedBusiness?.id, setSelectedBusiness])

  // Fetch branches via React Query (shares cache with BranchesPage)
  const { data: branches = [] } = useQuery({
    queryKey: ["branches", selectedBusiness?.id],
    queryFn: () => (selectedBusiness?.id ? listBranchesApi(selectedBusiness.id) : Promise.resolve([])),
    enabled: !!selectedBusiness?.id
  })

  // Auto-select or validate active branch when branches list loads
  useEffect(() => {
    if (branches.length > 0) {
      const hasValidSelection = branches.some((b) => b.id === selectedBranch?.id)
      if (!hasValidSelection) {
        setSelectedBranch({
          id: branches[0].id,
          name: branches[0].name
        })
      }
    }
  }, [branches, selectedBranch?.id, setSelectedBranch])

  const handleLogout = () => {
    logout()
    clearApp()
    navigate("/login")
  }

  // Determine active section title
  const getPageTitle = () => {
    const path = location.pathname
    if (path.includes("/services")) return "Services Catalog"
    if (path.includes("/branches")) return "Branch Locations"
    if (path.includes("/employees") || path.includes("/staff")) return "Team Directory"
    if (path.includes("/bookings")) return "Bookings & Schedule"
    if (path.includes("/customers")) return "Customer Records"
    if (path.includes("/onboard")) return "Onboard Client Business"
    if (path.includes("/admin")) return "Super Admin Console"
    return "Dashboard Overview"
  }

  const navItems = [
    { name: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
    ...(user?.role === "super_admin"
      ? [{ name: "Admin Console", path: "/dashboard/admin", icon: Shield }]
      : []),
    { name: "Services", path: "/dashboard/services", icon: Scissors },
    { name: "Branches", path: "/dashboard/branches", icon: MapPin },
    { name: "Bookings", path: "/dashboard/bookings", icon: Calendar },
    { name: "Staff", path: "/dashboard/employees", icon: Users },
    { name: "Customers", path: "/dashboard/customers", icon: Smile }
  ]


  return (
    <div className="min-h-screen bg-[#fafafa] text-neutral-950 flex overflow-hidden">
      {/* ── Desktop Sidebar ────────────────────────────────── */}
      <aside className="hidden md:flex md:flex-col md:w-64 bg-white/95 border-r border-[#ebebeb] shrink-0">
        {/* Brand / Logo */}
        <div className="h-16 flex items-center gap-3 px-6 border-b border-[#ebebeb] bg-white">
          <img src={`${import.meta.env.BASE_URL}logo.png`} alt="Logo" className="h-9 w-9 object-contain rounded-md" />
          <div>
            <h1 className="font-semibold text-sm leading-tight truncate w-40 tracking-[-0.28px] text-neutral-950">
              {selectedBusiness?.name || "BookingApp"}
            </h1>
            <p className="mono-label text-[10px]">admin workspace</p>
          </div>
        </div>

        {/* Navigation links */}
        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              end={item.path === "/dashboard"}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-all duration-150
                ${
                  isActive
                    ? "bg-neutral-950 text-white shadow-vercel-sm"
                    : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-950"
                }`
              }
            >
              <item.icon className="h-4.5 w-4.5" />
              {item.name}
            </NavLink>
          ))}
        </nav>

        {/* User Card & Logout */}
        <div className="p-4 border-t border-[#ebebeb] bg-[#fafafa]">
          <div 
            onClick={() => setIsSettingsOpen(true)}
            className="flex items-center gap-3 px-2 py-1.5 mb-2 hover:bg-neutral-200/50 rounded-lg cursor-pointer transition duration-150 group"
          >
            {user?.profile_photo_url ? (
              <img 
                src={user.profile_photo_url} 
                alt="Profile" 
                className="h-9 w-9 rounded-full object-cover shadow-vercel-sm border border-neutral-200/80 group-hover:border-neutral-400/80 transition"
              />
            ) : (
              <div className="h-9 w-9 rounded-full bg-neutral-950 flex items-center justify-center text-white font-semibold text-sm uppercase shadow-vercel-sm group-hover:bg-neutral-800 transition">
                {user?.name?.substring(0, 2) || user?.email?.substring(0, 2) || "AD"}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-gray-900 truncate group-hover:text-neutral-950 transition font-medium">
                {user?.name || "Administrator"}
              </p>
              <p className="text-xs text-gray-500 truncate capitalize">
                {user?.role?.replace("_", " ")}
              </p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium text-red-600 hover:bg-red-50 transition-colors duration-150"
          >
            <LogOut className="h-4.5 w-4.5" />
            Sign out
          </button>
        </div>
      </aside>

      {/* ── Mobile Sidebar Drawer ─────────────────────────── */}
      {isMobileSidebarOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-gray-900/40 backdrop-blur-xs transition-opacity duration-300"
            onClick={() => setIsMobileSidebarOpen(false)}
          />

          {/* Drawer content */}
          <div className="relative flex flex-col h-full w-72 max-w-xs bg-white border-r border-[#ebebeb] z-10 animate-slide-in">
            {/* Close button */}
            <div className="absolute top-4 right-4">
              <button
                onClick={() => setIsMobileSidebarOpen(false)}
                className="p-1 rounded-md text-gray-400 hover:bg-gray-100 hover:text-gray-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Brand Header */}
            <div className="h-16 flex items-center gap-3 px-6 border-b border-[#ebebeb] bg-white">
              <img src={`${import.meta.env.BASE_URL}logo.png`} alt="Logo" className="h-9 w-9 object-contain rounded-md" />
              <div>
                <h1 className="font-semibold text-sm truncate w-40 tracking-[-0.28px] text-neutral-950">
                  {selectedBusiness?.name || "BookingApp"}
                </h1>
                <p className="mono-label text-[10px]">admin workspace</p>
              </div>
            </div>

            {/* Navigation links */}
            <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
              {navItems.map((item) => (
                <NavLink
                  key={item.name}
                  to={item.path}
                  end={item.path === "/dashboard"}
                  onClick={() => setIsMobileSidebarOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-all duration-150
                    ${
                      isActive
                        ? "bg-neutral-950 text-white shadow-vercel-sm"
                        : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-950"
                    }`
                  }
                >
                  <item.icon className="h-4.5 w-4.5" />
                  {item.name}
                </NavLink>
              ))}
            </nav>

            {/* Footer user profile */}
            <div className="p-4 border-t border-[#ebebeb] bg-[#fafafa]">
              <div 
                onClick={() => {
                  setIsSettingsOpen(true)
                  setIsMobileSidebarOpen(false)
                }}
                className="flex items-center gap-3 px-2 py-1.5 mb-2 hover:bg-neutral-200/50 rounded-lg cursor-pointer transition duration-150 group"
              >
                {user?.profile_photo_url ? (
                  <img 
                    src={user.profile_photo_url} 
                    alt="Profile" 
                    className="h-9 w-9 rounded-full object-cover shadow-vercel-sm border border-neutral-200/80 group-hover:border-neutral-400/80 transition"
                  />
                ) : (
                  <div className="h-9 w-9 rounded-full bg-neutral-950 flex items-center justify-center text-white font-semibold text-sm uppercase shadow-vercel-sm group-hover:bg-neutral-800 transition">
                    {user?.name?.substring(0, 2) || "AD"}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-gray-900 truncate group-hover:text-neutral-950 transition font-medium">
                    {user?.name || "Admin User"}
                  </p>
                  <p className="text-xs text-gray-500 capitalize truncate">{user?.role?.replace("_", " ")}</p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium text-red-600 hover:bg-red-50 transition-colors duration-150"
              >
                <LogOut className="h-4.5 w-4.5" />
                Sign out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Main Viewport Wrapper ────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <header className="h-16 bg-white/90 backdrop-blur-xl border-b border-[#ebebeb] flex items-center justify-between px-4 md:px-8 z-10 shrink-0">
          {/* Mobile menu toggle & Title */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsMobileSidebarOpen(true)}
              className="p-2 rounded-md text-gray-500 hover:bg-gray-100 hover:text-gray-700 md:hidden transition-colors"
            >
              <Menu className="h-5 w-5" />
            </button>
            <h2 className="text-lg font-semibold tracking-[-0.45px] text-neutral-950 hidden sm:block">
              {getPageTitle()}
            </h2>
          </div>

          {/* Top Actions: Branch selector */}
          <div className="flex items-center gap-4">
            {branches.length > 0 && (
              <div className="relative">
                <button
                  onClick={() => setIsBranchDropdownOpen(!isBranchDropdownOpen)}
                  className="flex items-center gap-2.5 px-3 py-1.5 md:px-4 md:py-2 rounded-md border border-[#ebebeb] bg-white hover:bg-neutral-50 text-sm font-medium text-neutral-700 shadow-vercel-sm transition duration-150"
                >
                  <Building className="h-4 w-4 text-neutral-700" />
                  <span className="max-w-[120px] md:max-w-[180px] truncate">
                    {selectedBranch?.name || "Select Branch"}
                  </span>
                  <ChevronDown className="h-3.5 w-3.5 text-gray-400" />
                </button>

                {isBranchDropdownOpen && (
                  <>
                    {/* Backdrop to close click-away */}
                    <div
                      className="fixed inset-0 z-20"
                      onClick={() => setIsBranchDropdownOpen(false)}
                    />
                    <div className="absolute right-0 mt-1.5 w-56 rounded-md border border-[#ebebeb] bg-white shadow-vercel-lg py-1 z-30 animate-fade-in-down">
                      <div className="px-3 py-2 border-b border-[#ebebeb]">
                        <span className="mono-label">active branch</span>
                      </div>
                      <div className="max-h-60 overflow-y-auto py-1">
                        {branches.map((b) => (
                          <button
                            key={b.id}
                            onClick={() => {
                              setSelectedBranch({ id: b.id, name: b.name })
                              setIsBranchDropdownOpen(false)
                            }}
                            className={`w-full text-left px-4 py-2.5 text-sm transition duration-150 flex items-center justify-between
                              ${
                                selectedBranch?.id === b.id
                                  ? "bg-neutral-950 text-white font-semibold"
                                  : "text-neutral-700 hover:bg-neutral-100 hover:text-neutral-950"
                              }`}
                          >
                            <span className="truncate">{b.name}</span>
                            {selectedBranch?.id === b.id && (
                              <span className="h-1.5 w-1.5 rounded-full bg-white" />
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </header>

        {/* Page Main Content Area */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 bg-[#fafafa]">
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
