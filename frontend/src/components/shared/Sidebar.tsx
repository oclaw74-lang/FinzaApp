import { NavLink, useNavigate } from 'react-router-dom'
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Settings,
  Target,
  FileText,
  X,
  HandCoins,
  PiggyBank,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Tag,
  ShieldCheck,
  CreditCard,
  Trophy,
  BookOpen,
  Bell,
  RefreshCw,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useUiStore } from '@/store/uiStore'
import { useAuthStore } from '@/store/authStore'
import { useTranslation } from 'react-i18next'
import { Avatar } from '@/components/ui/avatar'
import { ScoreWidget } from '@/components/shared/ScoreWidget'

const navItems = [
  { to: '/', icon: BarChart3, labelKey: 'nav.dashboard' },
  { to: '/ingresos', icon: TrendingUp, labelKey: 'nav.ingresos' },
  { to: '/egresos', icon: TrendingDown, labelKey: 'nav.egresos' },
  { to: '/recurrentes', icon: RefreshCw, labelKey: 'nav.recurrentes' },
  { to: '/prestamos', icon: HandCoins, labelKey: 'nav.prestamos' },
  { to: '/metas', icon: PiggyBank, labelKey: 'nav.metas' },
  { to: '/presupuestos', icon: Target, labelKey: 'nav.presupuestos' },
  { to: '/categorias', icon: Tag, labelKey: 'nav.categorias' },
  { to: '/fondo-emergencia', icon: ShieldCheck, labelKey: 'nav.fondoEmergencia' },
  { to: '/suscripciones', icon: CreditCard, labelKey: 'nav.suscripciones' },
  { to: '/notificaciones', icon: Bell, labelKey: 'nav.notificaciones' },
  { to: '/retos', icon: Trophy, labelKey: 'nav.retos' },
  { to: '/educacion', icon: BookOpen, labelKey: 'nav.educacion' },
  { to: '/reportes', icon: FileText, labelKey: 'nav.reportes' },
  { to: '/configuracion', icon: Settings, labelKey: 'nav.configuracion' },
]

export function Sidebar(): JSX.Element {
  const { sidebarOpen, setSidebarOpen, sidebarCollapsed, setSidebarCollapsed } = useUiStore()
  const { user, signOut } = useAuthStore()
  const { t } = useTranslation()
  const navigate = useNavigate()

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
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
        style={{
          background: 'linear-gradient(180deg, #0F1923 0%, #121e2d 60%, #0f1923 100%)',
          borderRight: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        {/* Logo area */}
        <div
          className="flex items-center h-16 px-3 justify-between"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
        >
          {/* Logo — clickeable para expandir cuando colapsado */}
          <button
            type="button"
            onClick={() => sidebarCollapsed && setSidebarCollapsed(false)}
            className={cn(
              'flex items-center gap-2.5 min-w-0',
              sidebarCollapsed ? 'cursor-pointer' : 'cursor-default pointer-events-none'
            )}
            aria-label={sidebarCollapsed ? 'Expandir sidebar' : undefined}
            tabIndex={sidebarCollapsed ? 0 : -1}
          >
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 shadow-lg"
              style={{
                background: 'linear-gradient(135deg, #5B9BD5, #366092)',
                boxShadow: sidebarCollapsed
                  ? '0 0 16px rgba(91,155,213,0.35)'
                  : '0 0 16px rgba(91,155,213,0.4)',
              }}
            >
              <span className="font-bold text-white text-sm">F</span>
            </div>
            {!sidebarCollapsed && (
              <span
                className="font-bold text-lg tracking-tight truncate"
                style={{
                  background: 'linear-gradient(135deg, #ffffff, #a0b4cc)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                Finza
              </span>
            )}
          </button>

          {/* Right side: mobile close OR desktop toggle */}
          <div className="flex items-center gap-1 shrink-0">
            {/* Mobile close */}
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden text-white/50 hover:text-white transition-colors p-1"
              aria-label="Cerrar menu"
            >
              <X size={18} />
            </button>

            {/* Desktop collapse/expand toggle — always visible on desktop */}
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="hidden lg:flex items-center justify-center text-white/30 hover:text-white/80 transition-all duration-150 hover:bg-white/10 rounded-[7px]"
              style={{ width: 26, height: 26 }}
              aria-label={sidebarCollapsed ? 'Expandir sidebar' : 'Colapsar sidebar'}
              title={sidebarCollapsed ? 'Expandir sidebar' : 'Colapsar sidebar'}
            >
              {sidebarCollapsed ? (
                <ChevronRight size={15} />
              ) : (
                <ChevronLeft size={15} />
              )}
            </button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-2 py-3 overflow-y-auto overflow-x-hidden">
          {navItems.map(({ to, icon: Icon, labelKey }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              title={sidebarCollapsed ? t(labelKey) : undefined}
              className={({ isActive }) =>
                cn(
                  'group relative flex items-center gap-3 rounded-xl mb-0.5 text-sm font-medium transition-all duration-150',
                  sidebarCollapsed ? 'justify-center w-11 h-11 mx-auto' : 'px-3 py-2.5',
                  isActive
                    ? 'text-white sidebar-item-active'
                    : 'text-white/45 hover:text-white/90'
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
                    className="transition-all duration-150"
                    style={isActive ? { color: '#5B9BD5', filter: 'drop-shadow(0 0 6px rgba(91,155,213,0.5))' } : {}}
                  >
                    <Icon size={17} strokeWidth={isActive ? 2.2 : 1.8} className="shrink-0" />
                  </span>
                  {!sidebarCollapsed && (
                    <span className="truncate">{t(labelKey)}</span>
                  )}
                  {/* Hover glow */}
                  {!isActive && (
                    <span
                      className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-150"
                      style={{ background: 'rgba(255,255,255,0.04)' }}
                    />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Score widget */}
        <ScoreWidget collapsed={sidebarCollapsed} />

        {/* User section */}
        <div
          className={cn(
            'p-3',
            sidebarCollapsed ? 'flex flex-col items-center gap-2' : ''
          )}
          style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
        >
          {!sidebarCollapsed ? (
            <div className="flex items-center gap-3">
              <Avatar name={userName} size="sm" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white/90 truncate">{userName}</p>
                <p className="text-xs text-white/40 truncate">{user?.email}</p>
              </div>
              <button
                onClick={handleSignOut}
                className="text-white/30 hover:text-red-400 transition-colors p-1.5 rounded-lg hover:bg-red-500/10"
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
                className="text-white/30 hover:text-red-400 transition-colors p-1.5 rounded-lg hover:bg-red-500/10"
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
