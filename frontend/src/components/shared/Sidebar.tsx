import { useEffect } from 'react'
import { NavLink, useNavigate, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  TrendingUp,
  TrendingDown,
  PieChart,
  Banknote,
  CreditCard,
  Target,
  RefreshCw,
  Shield,
  Bell,
  Settings,
  Trophy,
  BookOpen,
  X,
  ChevronLeft,
  LogOut,
  Sun,
  Moon,
  Monitor,
  Languages,
  MessageSquare,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useUiStore } from '@/store/uiStore'
import { useAuthStore } from '@/store/authStore'
import { useThemeStore } from '@/store/themeStore'
import { useTranslation } from 'react-i18next'
import { Avatar } from '@/components/ui/avatar'
import { ToggleGroup } from '@/components/ui/toggle-group'
import { useQuery } from '@tanstack/react-query'
import { apiClient as api } from '@/lib/api'

interface NavItemDef {
  to: string
  icon: React.ElementType
  labelKey: string
}

interface NavGroup {
  sectionKey: string
  label: string
  items: NavItemDef[]
}

const navGroups: NavGroup[] = [
  {
    sectionKey: 'principal',
    label: 'PRINCIPAL',
    items: [
      { to: '/dashboard', icon: LayoutDashboard, labelKey: 'nav.dashboard' },
      { to: '/ingresos', icon: TrendingUp, labelKey: 'nav.ingresos' },
      { to: '/egresos', icon: TrendingDown, labelKey: 'nav.egresos' },
      { to: '/presupuestos', icon: PieChart, labelKey: 'nav.presupuestos' },
    ],
  },
  {
    sectionKey: 'compromisos',
    label: 'COMPROMISOS',
    items: [
      { to: '/prestamos', icon: Banknote, labelKey: 'nav.prestamos' },
      { to: '/tarjetas', icon: CreditCard, labelKey: 'nav.tarjetas' },
      { to: '/metas', icon: Target, labelKey: 'nav.metas' },
      { to: '/recurrentes', icon: RefreshCw, labelKey: 'nav.recurrentes' },
      { to: '/fondo-emergencia', icon: Shield, labelKey: 'nav.fondoEmergencia' },
    ],
  },
  {
    sectionKey: 'analisis',
    label: 'ANALISIS',
    items: [
      { to: '/notificaciones', icon: Bell, labelKey: 'nav.notificaciones' },
      { to: '/retos', icon: Trophy, labelKey: 'nav.retos' },
      { to: '/educacion', icon: BookOpen, labelKey: 'nav.educacion' },
      { to: '/configuracion', icon: Settings, labelKey: 'nav.configuracion' },
      { to: '/survey', icon: MessageSquare, labelKey: 'nav.survey' },
    ],
  },
]

function NavItem({
  to,
  icon: Icon,
  labelKey,
  collapsed,
}: {
  to: string
  icon: React.ElementType
  labelKey: string
  collapsed: boolean
}): JSX.Element {
  const { t } = useTranslation()

  return (
    <NavLink
      to={to}
      end={to === '/'}
      title={collapsed ? t(labelKey) : undefined}
      className={({ isActive }) =>
        cn(
          'group relative flex items-center gap-3 rounded-xl mb-0.5 text-sm font-medium transition-all duration-150',
          collapsed ? 'justify-center w-11 h-11 mx-auto' : 'px-3 py-2.5',
          isActive
            ? 'text-[var(--accent)] sidebar-item-active'
            : [
                'text-slate-500 hover:text-slate-700 hover:bg-slate-100',
                'dark:text-[#657a9e] dark:hover:text-[#e8f0ff] dark:hover:bg-white/[0.05]',
              ].join(' ')
        )
      }
      style={({ isActive }) =>
        isActive
          ? {
              background: 'linear-gradient(90deg, rgba(54,96,146,0.35) 0%, rgba(91,155,213,0.12) 100%)',
              boxShadow: 'inset 0 0 0 1px rgba(91,155,213,0.15)',
            }
          : {}
      }
    >
      {({ isActive }) => (
        <>
          <span
            className={cn(
              'transition-all duration-150 rounded-lg',
              !isActive && !collapsed && 'bg-slate-100 dark:bg-white/[0.04] p-1 -m-1'
            )}
            style={
              isActive
                ? { color: '#5B9BD5', filter: 'drop-shadow(0 0 6px rgba(91,155,213,0.5))' }
                : {}
            }
          >
            <Icon size={17} strokeWidth={isActive ? 2.2 : 1.8} className="shrink-0" />
          </span>
          {!collapsed && <span className="truncate">{t(labelKey)}</span>}
          {/* Hover glow */}
          {!isActive && (
            <span
              className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-150 bg-slate-900/[0.03] dark:bg-white/[0.04]"
            />
          )}
        </>
      )}
    </NavLink>
  )
}

export function Sidebar(): JSX.Element {
  const { sidebarOpen, setSidebarOpen, sidebarCollapsed, setSidebarCollapsed } = useUiStore()
  const { user, signOut } = useAuthStore()
  const { theme, setTheme, language, setLanguage } = useThemeStore()
  const { t } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()

  const { data: surveyStatus } = useQuery({
    queryKey: ['survey-status'],
    queryFn: async () => {
      const res = await api.get<{ completed: boolean }>('/surveys/me')
      return res.data
    },
    staleTime: 1000 * 60 * 10, // 10 minutes
  })

  const filteredNavGroups = navGroups.map(group => ({
    ...group,
    items: group.items.filter(item => {
      if (item.to === '/survey' && surveyStatus?.completed === true) return false
      return true
    }),
  }))

  // Close sidebar on navigation on mobile (< 1024px)
  useEffect(() => {
    if (window.innerWidth < 1024) {
      setSidebarOpen(false)
    }
  }, [location.pathname, setSidebarOpen])

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  const userName =
    user?.user_metadata?.full_name ?? user?.email?.split('@')[0] ?? 'Usuario'

  return (
    <>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-20 lg:hidden modal-overlay"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={cn(
          'fixed top-0 left-0 h-full z-30 flex flex-col transition-all duration-300 ease-in-out',
          sidebarCollapsed ? 'w-[72px]' : 'w-64',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
          'bg-white dark:bg-gradient-to-b dark:from-[#0F1923] dark:via-[#121e2d] dark:to-[#0f1923]',
          'border-r border-slate-200 dark:border-white/[0.06]',
          'dark:backdrop-blur-2xl'
        )}
      >
        {/* Logo area */}
        <div
          className="flex items-center h-16 px-3 justify-between border-b border-slate-200 dark:border-white/[0.06]"
        >
          {/* Logo — clickeable para expandir cuando colapsado */}
          <button
            type="button"
            onClick={() => sidebarCollapsed && setSidebarCollapsed(false)}
            className={cn(
              'flex items-center gap-2.5 min-w-0',
              sidebarCollapsed ? 'cursor-pointer' : 'cursor-default pointer-events-none'
            )}
            aria-label={sidebarCollapsed ? t('nav.expandSidebar') : undefined}
            tabIndex={sidebarCollapsed ? 0 : -1}
          >
            <div className="w-9 h-9 shrink-0 flex items-center justify-center">
              <img
                src="/logo.svg"
                alt="Finza"
                className="w-full h-full"
              />
            </div>
            {!sidebarCollapsed && (
              <span className="font-bold text-lg tracking-tight truncate text-slate-800 dark:bg-gradient-to-br dark:from-white dark:to-[#a0b4cc] dark:bg-clip-text dark:text-transparent">
                Finza
              </span>
            )}
          </button>

          {/* Right side: mobile close OR desktop toggle */}
          <div className="flex items-center gap-1 shrink-0">
            {/* Mobile close */}
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden text-slate-500 dark:text-white/50 hover:text-slate-800 dark:hover:text-white transition-colors p-1"
              aria-label={t('nav.closeMenu')}
            >
              <X size={18} />
            </button>

            {/* Desktop collapse/expand toggle — only show when expanded */}
            {!sidebarCollapsed && (
              <button
                onClick={() => setSidebarCollapsed(true)}
                className={cn(
                  'hidden lg:flex items-center justify-center rounded-[7px]',
                  'transition-all duration-150',
                  'text-slate-400 hover:text-slate-700 hover:bg-slate-100',
                  'dark:text-white/30 dark:bg-white/[0.05] dark:border dark:border-white/[0.06]',
                  'dark:hover:bg-[#3d8ef8]/20 dark:hover:text-[#3d8ef8]'
                )}
                style={{ width: 26, height: 26 }}
                aria-label={t('nav.collapseSidebar')}
                title={t('nav.collapseSidebar')}
              >
                <ChevronLeft size={15} />
              </button>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-2 py-3 overflow-y-auto overflow-x-hidden">
          {filteredNavGroups.map((group) => (
            <div key={group.sectionKey}>
              {/* Section label — hidden when collapsed */}
              {!sidebarCollapsed && (
                <p
                  className="text-[10px] font-semibold tracking-widest text-slate-400 dark:text-white/30 px-3 mt-4 mb-1"
                  aria-label={`Seccion ${group.label}`}
                >
                  {group.label}
                </p>
              )}
              {group.items.map(({ to, icon, labelKey }) => (
                <NavItem
                  key={to}
                  to={to}
                  icon={icon}
                  labelKey={labelKey}
                  collapsed={sidebarCollapsed}
                />
              ))}
            </div>
          ))}
        </nav>

        {/* Quick settings */}
        <div className="mx-2 mb-2">
          {!sidebarCollapsed ? (
            <div className="space-y-1.5">
              {/* Theme ToggleGroup */}
              <ToggleGroup
                value={theme}
                onValueChange={(val) => setTheme(val as 'light' | 'dark' | 'system')}
                options={[
                  { value: 'light', label: t('settings.light'), icon: <Sun size={11} />, title: t('settings.lightMode') },
                  { value: 'dark', label: t('settings.dark'), icon: <Moon size={11} />, title: t('settings.darkMode') },
                  { value: 'system', label: 'Auto', icon: <Monitor size={11} />, title: t('settings.systemMode') },
                ]}
                className="w-full"
                size="sm"
              />
              {/* Language ToggleGroup */}
              <ToggleGroup
                value={language}
                onValueChange={(val) => setLanguage(val as 'es' | 'en')}
                options={[
                  { value: 'es', label: 'ES', title: 'Español' },
                  { value: 'en', label: 'EN', title: 'English' },
                ]}
                className="w-full"
                size="sm"
              />
            </div>
          ) : (
            /* Collapsed: icon-only buttons */
            <div className="flex flex-col gap-1 items-center">
              <button
                onClick={() => setTheme(theme === 'dark' ? 'light' : theme === 'light' ? 'system' : 'dark')}
                className="flex items-center justify-center w-11 h-8 rounded-lg text-slate-500 dark:text-white/50 hover:text-slate-800 dark:hover:text-white/80 hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors"
                title={theme === 'dark' ? t('settings.lightMode') : theme === 'light' ? t('settings.systemMode') : t('settings.darkMode')}
              >
                {theme === 'dark' ? <Sun size={13} /> : theme === 'system' ? <Monitor size={13} /> : <Moon size={13} />}
              </button>
              <button
                onClick={() => setLanguage(language === 'es' ? 'en' : 'es')}
                className="flex items-center justify-center w-11 h-8 rounded-lg text-slate-500 dark:text-white/50 hover:text-slate-800 dark:hover:text-white/80 hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors"
                title={t('settings.changeLanguage')}
              >
                <Languages size={13} />
              </button>
            </div>
          )}
        </div>

        {/* User section */}
        <div
          className={cn(
            'p-3 border-t border-slate-200 dark:border-white/[0.06]',
            sidebarCollapsed ? 'flex flex-col items-center gap-2' : ''
          )}
        >
          {!sidebarCollapsed ? (
            <div className="flex items-center gap-3">
              <Avatar name={userName} size="sm" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-800 dark:text-[#e8f0ff]/90 truncate">
                  {userName}
                </p>
                <p className="text-xs text-slate-500 dark:text-[#657a9e] truncate">{user?.email}</p>
              </div>
              <button
                onClick={handleSignOut}
                className="text-slate-400 dark:text-white/30 hover:text-red-500 dark:hover:text-[#ff4060] transition-colors p-1.5 rounded-lg hover:bg-red-500/10 dark:hover:bg-[#ff4060]/10"
                title={t('auth.logout')}
                aria-label={t('auth.logout')}
              >
                <LogOut size={15} />
              </button>
            </div>
          ) : (
            <>
              <Avatar name={userName} size="sm" />
              <button
                onClick={handleSignOut}
                className="text-slate-400 dark:text-white/30 hover:text-red-500 dark:hover:text-[#ff4060] transition-colors p-1.5 rounded-lg hover:bg-red-500/10 dark:hover:bg-[#ff4060]/10"
                title={t('auth.logout')}
                aria-label={t('auth.logout')}
              >
                <LogOut size={14} />
              </button>
            </>
          )}
        </div>
      </aside>
    </>
  )
}
