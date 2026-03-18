import { create } from 'zustand'

interface UiStore {
  sidebarOpen: boolean
  sidebarCollapsed: boolean
  toggleSidebar: () => void
  setSidebarOpen: (open: boolean) => void
  setSidebarCollapsed: (v: boolean) => void
}

const savedCollapsed = localStorage.getItem('finza-sidebar-collapsed') === 'true'
// On mobile (< 1024px) the sidebar starts closed so it doesn't block content
const isDesktop = typeof window !== 'undefined' && window.innerWidth >= 1024

export const useUiStore = create<UiStore>((set) => ({
  sidebarOpen: isDesktop,
  sidebarCollapsed: savedCollapsed,
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  setSidebarCollapsed: (v) => {
    localStorage.setItem('finza-sidebar-collapsed', String(v))
    set({ sidebarCollapsed: v })
  },
}))
