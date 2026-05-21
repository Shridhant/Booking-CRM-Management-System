import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"

import ProtectedRoute from "./components/common/ProtectedRoute"
import DashboardLayout from "./layouts/DashboardLayout"
import LoginPage from "./pages/auth/LoginPage"
import OnboardPage from "./pages/auth/OnboardPage"
import UnauthorizedPage from "./pages/auth/UnauthorizedPage"
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
        <Route path="/onboard" element={<OnboardPage />} />
        <Route path="/unauthorized" element={<UnauthorizedPage />} />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />

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
        <Route path="*" element={<Navigate to="/dashboard" replace />} />

      </Routes>
    </BrowserRouter>
  )
}