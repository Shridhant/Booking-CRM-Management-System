import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"

import ProtectedRoute from "./components/common/ProtectedRoute"
import CustomerLayout from "./layouts/CustomerLayout"
import DashboardLayout from "./layouts/DashboardLayout"
import LoginPage from "./pages/auth/LoginPage"
import OnboardPage from "./pages/auth/OnboardPage"
import RegisterPage from "./pages/auth/RegisterPage"
import UnauthorizedPage from "./pages/auth/UnauthorizedPage"
import CustomerBookingsPage from "./pages/customer/CustomerBookingsPage"
import CustomerBusinessPage from "./pages/customer/CustomerBusinessPage"
import CustomerExplorePage from "./pages/customer/CustomerExplorePage"
import DashboardPage from "./pages/dashboard/DashboardPage"
import ServicesPage from "./pages/dashboard/ServicesPage"
import BranchesPage from "./pages/dashboard/BranchesPage"
import EmployeesPage from "./pages/dashboard/EmployeesPage"
import BookingsPage from "./pages/dashboard/BookingsPage"
import CustomersPage from "./pages/dashboard/CustomersPage"
import AdminConsolePage from "./pages/dashboard/AdminConsolePage"

export default function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* Public routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/onboard" element={<OnboardPage />} />
        <Route path="/unauthorized" element={<UnauthorizedPage />} />
        <Route path="/" element={<Navigate to="/customer" replace />} />

        {/* Public customer booking experience */}
        <Route element={<CustomerLayout />}>
          <Route path="/customer" element={<CustomerExplorePage />} />
          <Route path="/customer/businesses/:businessIdOrSlug" element={<CustomerBusinessPage />} />
        </Route>

        {/* Customer-only personal booking space */}
        <Route element={<ProtectedRoute allowedRoles={["customer"]} />}>
          <Route element={<CustomerLayout />}>
            <Route path="/customer/bookings" element={<CustomerBookingsPage />} />
          </Route>
        </Route>

        {/* Protected routes — business_admin + super_admin */}
        <Route element={<ProtectedRoute allowedRoles={["business_admin", "super_admin"]} />}>
          <Route element={<DashboardLayout />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/dashboard/services" element={<ServicesPage />} />
            <Route path="/dashboard/branches" element={<BranchesPage />} />
            <Route path="/dashboard/employees" element={<EmployeesPage />} />
            <Route path="/dashboard/bookings" element={<BookingsPage />} />
            <Route path="/dashboard/customers" element={<CustomersPage />} />
            <Route path="/dashboard/onboard" element={<OnboardPage />} />
          </Route>
        </Route>

        {/* Super Admin exclusive routes */}
        <Route element={<ProtectedRoute allowedRoles={["super_admin"]} />}>
          <Route element={<DashboardLayout />}>
            <Route path="/dashboard/admin" element={<AdminConsolePage />} />
          </Route>
        </Route>


        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/customer" replace />} />

      </Routes>
    </BrowserRouter>
  )
}
