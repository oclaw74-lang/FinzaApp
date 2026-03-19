import { create } from 'zustand'
import i18n from '../i18n'

type Theme = 'light' | 'dark'
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

// Apply theme on load
if (savedTheme === 'dark') {
  document.documentElement.classList.add('dark')
}

export const useThemeStore = create<ThemeStore>((set) => ({
  theme: savedTheme,
  language: savedLang,
  toggleTheme: () =>
    set((state) => {
      const newTheme: Theme = state.theme === 'light' ? 'dark' : 'light'
      localStorage.setItem('finza-theme', newTheme)
      document.documentElement.classList.toggle('dark', newTheme === 'dark')
      return { theme: newTheme }
    }),
  setTheme: (theme) => {
    localStorage.setItem('finza-theme', theme)
    document.documentElement.classList.toggle('dark', theme === 'dark')
    set({ theme })
  },
  setLanguage: (language) => {
    localStorage.setItem('finza-lang', language)
    i18n.changeLanguage(language)
    set({ language })
  },
}))
