import { useAppStore } from "../../store/app.store"
import { useAuthStore } from "../../store/auth.store"
import { today } from "../../lib/date"
import { CalendarCheck, CheckCircle2, Clock3, XCircle } from "lucide-react"

export default function DashboardPage() {
  const { user } = useAuthStore()
  const { selectedBranch } = useAppStore()

  return (
    <div className="space-y-8">
      <div className="relative overflow-hidden rounded-lg border border-[#ebebeb] bg-white shadow-vercel-md">
        <div className="absolute inset-y-0 right-0 w-2/3 mesh-gradient opacity-70" />
        <div className="relative p-6 sm:p-8 max-w-2xl">
          <p className="mono-label mb-3">dashboard overview</p>
          <h1 className="text-[32px] leading-10 font-semibold tracking-[-1.28px] text-neutral-950">
            Welcome back{user?.name ? `, ${user.name}` : ""}.
          </h1>
          <p className="text-body text-sm sm:text-base mt-2">
            {selectedBranch
              ? `Managing ${selectedBranch.name} on ${today()}.`
              : "Select a branch to start managing schedules, services and customers."}
          </p>
        </div>
      </div>

      {/* Stat cards — will be wired to real data in next iteration */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Today's Bookings", value: "-", icon: CalendarCheck, color: "text-neutral-950", bg: "bg-neutral-100" },
          { label: "Pending Assignment", value: "-", icon: Clock3, color: "text-amber-700", bg: "bg-amber-50" },
          { label: "Completed Today", value: "-", icon: CheckCircle2, color: "text-emerald-700", bg: "bg-emerald-50" },
          { label: "Cancelled Today", value: "-", icon: XCircle, color: "text-red-700", bg: "bg-red-50" },
        ].map((stat) => (
          <div
            key={stat.label}
            className="bg-white rounded-lg border border-[#ebebeb] shadow-vercel-sm p-5 flex items-start justify-between"
          >
            <div>
              <p className="mono-label">{stat.label}</p>
              <p className={`text-[32px] leading-10 font-semibold tracking-[-1.28px] mt-2 ${stat.color}`}>
                {stat.value}
              </p>
            </div>
            <div className={`h-10 w-10 rounded-md ${stat.bg} ${stat.color} flex items-center justify-center`}>
              <stat.icon className="h-5 w-5" />
            </div>
          </div>
        ))}
      </div>

      {/* Placeholder for today's bookings list */}
      <div className="bg-white rounded-lg border border-[#ebebeb] shadow-vercel-sm p-6">
        <h2 className="text-base font-semibold tracking-[-0.28px] text-neutral-950 mb-4">
          Today's Schedule
        </h2>
        <p className="text-sm text-neutral-500">
          Booking activity for the selected branch will appear here.
        </p>
      </div>
    </div>
  )
}
