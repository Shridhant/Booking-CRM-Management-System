import { create } from "zustand"
import { persist } from "zustand/middleware"

interface SelectedBranch {
  id: string
  name: string
}

interface SelectedBusiness {
  id: string
  name: string
}

interface AppState {
  selectedBusiness: SelectedBusiness | null
  selectedBranch: SelectedBranch | null
  setSelectedBusiness: (business: SelectedBusiness) => void
  setSelectedBranch: (branch: SelectedBranch) => void
  clearApp: () => void
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      selectedBusiness: null,
      selectedBranch: null,

      setSelectedBusiness: (business) =>
        set({ selectedBusiness: business, selectedBranch: null }),
        // Reset branch when business changes

      setSelectedBranch: (branch) =>
        set({ selectedBranch: branch }),

      clearApp: () =>
        set({ selectedBusiness: null, selectedBranch: null }),
    }),
    {
      name: "bookingapp-app", // localStorage key
    }
  )
)
