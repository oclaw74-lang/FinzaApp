import { Menu, Sun, Moon } from 'lucide-react'
import { NotificacionBadge } from '@/components/shared/NotificacionBadge'
import { useUiStore } from '@/store/uiStore'
import { useThemeStore } from '@/store/themeStore'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import { Avatar } from '@/components/ui/avatar'
import { useAuthStore } from '@/store/authStore'
import { useNavigate, useLocation } from 'react-router-dom'
import { useState } from 'react'
import i18n from '@/i18n'

const routeTitles: Record<string, string> = {
  '/': 'nav.dashboard',
  '/ingresos': 'nav.ingresos',
  '/egresos': 'nav.egresos',
  '/prestamos': 'nav.prestamos',
  '/metas': 'nav.metas',
  '/presupuestos': 'nav.presupuestos',
  '/reportes': 'nav.reportes',
  '/configuracion': 'nav.configuracion',
}

export function Header(): JSX.Element {
  const { setSidebarOpen } = useUiStore()
  const { theme, toggleTheme, language, setLanguage } = useThemeStore()
  const { user } = useAuthStore()
  const { t } = useTranslation()
  const location = useLocation()
  const navigate = useNavigate()
  const [userMenuOpen, setUserMenuOpen] = useState(false)

  const pageTitle = t(routeTitles[location.pathname] ?? 'nav.dashboard')
  const userName =
    user?.user_metadata?.full_name ?? user?.email?.split('@')[0] ?? 'Usuario'

  const handleLangToggle = () => {
    const newLang = language === 'es' ? 'en' : 'es'
    setLanguage(newLang)
    i18n.changeLanguage(newLang)
  }

  return (
    <header
      className={cn(
        'sticky top-0 z-10 h-16 bg-surface/80 backdrop-blur-md border-b border-border',
        'flex items-center px-4 gap-4'
      )}
    >
      {/* Mobile hamburger */}
      <button
        onClick={() => setSidebarOpen(true)}
        className="lg:hidden text-[var(--text-muted)] hover:text-[var(--text-primary)]"
        aria-label="Abrir menu"
      >
        <Menu size={22} />
      </button>

      {/* Page title */}
      <h1 className="text-lg font-semibold text-[var(--text-primary)] flex-1">{pageTitle}</h1>

      {/* Right controls */}
      <div className="flex items-center gap-1">
        {/* Notification bell */}
        <NotificacionBadge />

        {/* Language toggle */}
        <button
          onClick={handleLangToggle}
          className="w-9 h-9 rounded-lg flex items-center justify-center text-xs font-bold text-[var(--text-muted)] hover:bg-surface-raised hover:text-[var(--text-primary)] transition-colors"
          title={language === 'es' ? 'Switch to English' : 'Cambiar a Espanol'}
          aria-label="Cambiar idioma"
        >
          {language === 'es' ? 'EN' : 'ES'}
        </button>

        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="w-9 h-9 rounded-lg flex items-center justify-center text-[var(--text-muted)] hover:bg-surface-raised hover:text-[var(--text-primary)] transition-colors"
          title={theme === 'light' ? t('settings.darkMode') : t('settings.lightMode')}
          aria-label="Cambiar tema"
        >
          {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
        </button>

        {/* User avatar + menu */}
        <div className="relative ml-1">
          <button
            onClick={() => setUserMenuOpen((v) => !v)}
            className="flex items-center gap-2 rounded-lg px-2 py-1 hover:bg-surface-raised transition-colors"
            aria-label="Menu de usuario"
          >
            <Avatar name={userName} size="sm" />
          </button>

          {userMenuOpen && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setUserMenuOpen(false)}
              />
              <div className="absolute right-0 top-12 z-20 w-48 bg-surface border border-border rounded-xl shadow-glass py-1 animate-fade-in">
                <div className="px-3 py-2 border-b border-border mb-1">
                  <p className="text-sm font-medium text-[var(--text-primary)] truncate">
                    {userName}
                  </p>
                  <p className="text-xs text-[var(--text-muted)] truncate">{user?.email}</p>
                </div>
                <button
                  onClick={() => {
                    navigate('/configuracion')
                    setUserMenuOpen(false)
                  }}
                  className="w-full text-left px-3 py-2 text-sm text-[var(--text-primary)] hover:bg-surface-raised"
                >
                  {t('nav.configuracion')}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
