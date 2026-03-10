import { create } from 'zustand'

interface UiStore {
  sidebarOpen: boolean
  sidebarCollapsed: boolean
  toggleSidebar: () => void
  setSidebarOpen: (open: boolean) => void
  setSidebarCollapsed: (v: boolean) => void
}

const savedCollapsed = localStorage.getItem('finza-sidebar-collapsed') === 'true'

export const useUiStore = create<UiStore>((set) => ({
  sidebarOpen: true,
  sidebarCollapsed: savedCollapsed,
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  setSidebarCollapsed: (v) => {
    localStorage.setItem('finza-sidebar-collapsed', String(v))
    set({ sidebarCollapsed: v })
  },
}))
