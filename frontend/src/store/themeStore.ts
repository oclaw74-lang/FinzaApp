import { create } from 'zustand'
import i18n from '../i18n'

type Theme = 'light' | 'dark' | 'system'
type Language = 'es' | 'en'

interface ThemeStore {
  theme: Theme
  language: Language
  toggleTheme: () => void
  setTheme: (theme: Theme) => void
  setLanguage: (lang: Language) => void
}

const savedTheme = (localStorage.getItem('finza-theme') as Theme) ?? 'dark'
const savedLang = (localStorage.getItem('finza-lang') as Language) ?? 'es'

/** Aplica el tema al <html> element. 'system' sigue prefers-color-scheme. */
function applyTheme(theme: Theme): void {
  if (theme === 'system') {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    document.documentElement.classList.toggle('dark', prefersDark)
  } else {
    document.documentElement.classList.toggle('dark', theme === 'dark')
  }
}

// Apply theme on load
applyTheme(savedTheme)

export const useThemeStore = create<ThemeStore>((set) => ({
  theme: savedTheme,
  language: savedLang,
  toggleTheme: () =>
    set((state) => {
      const newTheme: Theme = state.theme === 'light' ? 'dark' : 'light'
      localStorage.setItem('finza-theme', newTheme)
      applyTheme(newTheme)
      return { theme: newTheme }
    }),
  setTheme: (theme) => {
    localStorage.setItem('finza-theme', theme)
    applyTheme(theme)
    set({ theme })
  },
  setLanguage: (language) => {
    localStorage.setItem('finza-lang', language)
    i18n.changeLanguage(language)
    set({ language })
  },
}))
