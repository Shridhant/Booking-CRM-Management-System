import { useNavigate } from "react-router-dom"
import { ShieldAlert, ArrowLeft } from "lucide-react"

export default function UnauthorizedPage() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-[#fafafa] flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-lg border border-[#ebebeb] p-8 text-center space-y-6 shadow-vercel-md">
        <div className="mx-auto h-12 w-12 bg-red-50 rounded-full flex items-center justify-center text-red-500">
          <ShieldAlert className="h-6 w-6" />
        </div>

        <div className="space-y-2">
          <h1 className="text-xl font-semibold tracking-[-0.5px] text-neutral-950">
            Access Denied
          </h1>
          <p className="text-sm text-neutral-500 leading-relaxed">
            You do not have the required permissions to access this console. If you believe this is an error, please contact your systems administrator.
          </p>
        </div>

        <button
          onClick={() => navigate("/dashboard")}
          className="w-full bg-neutral-950 hover:bg-neutral-900 text-white font-semibold py-2.5 px-4 rounded-md text-sm transition duration-150 shadow-vercel-sm flex items-center justify-center gap-2 cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </button>
      </div>
    </div>
  )
}
