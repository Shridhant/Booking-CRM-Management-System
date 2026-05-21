import { useAppStore } from "../../store/app.store"
import { useAuthStore } from "../../store/auth.store"
import { today } from "../../lib/date"

export default function DashboardPage() {
  const { user } = useAuthStore()
  const { selectedBranch } = useAppStore()

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome back{user?.name ? `, ${user.name}` : ""}
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          {selectedBranch
            ? `Managing ${selectedBranch.name} · ${today()}`
            : "Select a branch to get started"}
        </p>
      </div>

      {/* Stat cards — will be wired to real data in next iteration */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Today's Bookings", value: "–", color: "text-indigo-600" },
          { label: "Pending Assignment", value: "–", color: "text-yellow-600" },
          { label: "Completed Today", value: "–", color: "text-green-600" },
          { label: "Cancelled Today", value: "–", color: "text-red-600" },
        ].map((stat) => (
          <div
            key={stat.label}
            className="bg-white rounded-xl border border-gray-100 shadow-sm p-5"
          >
            <p className="text-sm text-gray-500">{stat.label}</p>
            <p className={`text-3xl font-bold mt-1 ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Placeholder for today's bookings list */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <h2 className="text-base font-semibold text-gray-900 mb-4">
          Today's Schedule
        </h2>
        <p className="text-sm text-gray-400">
          Booking list will appear here once the bookings page is built.
        </p>
      </div>
    </div>
  )
}
