import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { BarChart3, TrendingUp, TrendingDown, Target, Plus, X, HandCoins, PiggyBank, CreditCard } from 'lucide-react'
import { cn } from '@/lib/utils'

interface QuickAction {
  id: string
  labelKey: string
  icon: JSX.Element
  path: string
  color: string
}

const QUICK_ACTIONS: QuickAction[] = [
  {
    id: 'ingresos',
    labelKey: 'ingresos.newIngreso',
    icon: <TrendingUp size={18} />,
    path: '/ingresos',
    color: 'bg-emerald-500',
  },
  {
    id: 'egresos',
    labelKey: 'egresos.newEgreso',
    icon: <TrendingDown size={18} />,
    path: '/egresos',
    color: 'bg-red-500',
  },
  {
    id: 'prestamos',
    labelKey: 'prestamos.newPrestamo',
    icon: <HandCoins size={18} />,
    path: '/prestamos',
    color: 'bg-amber-500',
  },
  {
    id: 'metas',
    labelKey: 'nav.metas',
    icon: <PiggyBank size={18} />,
    path: '/metas',
    color: 'bg-purple-500',
  },
  {
    id: 'tarjetas',
    labelKey: 'nav.tarjetas',
    icon: <CreditCard size={18} />,
    path: '/tarjetas',
    color: 'bg-indigo-500',
  },
]

const NAV_ITEMS = [
  { to: '/dashboard', icon: <BarChart3 size={22} />, labelKey: 'nav.dashboard', end: true },
  { to: '/ingresos', icon: <TrendingUp size={22} />, labelKey: 'nav.ingresos', end: false },
  { to: '/egresos', icon: <TrendingDown size={22} />, labelKey: 'nav.egresos', end: false },
  { to: '/presupuestos', icon: <Target size={22} />, labelKey: 'nav.presupuestos', end: false },
]

function QuickActionSheet({
  isOpen,
  onClose,
}: {
  isOpen: boolean
  onClose: () => void
}): JSX.Element | null {
  const { t } = useTranslation()
  const navigate = useNavigate()
  if (!isOpen) return null

  const handleAction = (path: string) => {
    navigate(path)
    onClose()
  }

  return (
    <>
      <div
        className="fixed inset-0 z-40"
        style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        className={cn(
          'fixed bottom-20 left-1/2 -translate-x-1/2 z-50',
          'bg-[var(--surface)] border border-[var(--border)] rounded-2xl',
          'p-4 w-72 shadow-2xl animate-slide-up'
        )}
        role="dialog"
        aria-label={t('bottomNav.quickActions')}
      >
        <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide mb-3">
          {t('bottomNav.quickActions')}
        </p>
        <div className="grid grid-cols-2 gap-2">
          {QUICK_ACTIONS.map((action, i) => (
            <button
              key={action.id}
              onClick={() => handleAction(action.path)}
              className={cn(
                'flex items-center gap-2 px-3 py-2.5 rounded-xl text-white text-sm font-medium',
                'transition-all duration-150 active:scale-95',
                action.color,
                i === QUICK_ACTIONS.length - 1 && QUICK_ACTIONS.length % 2 !== 0 && 'col-span-2'
              )}
            >
              {action.icon}
              <span>{t(action.labelKey)}</span>
            </button>
          ))}
        </div>
      </div>
    </>
  )
}

export function BottomNav(): JSX.Element {
  const { t } = useTranslation()
  const [sheetOpen, setSheetOpen] = useState(false)

  return (
    <>
      <QuickActionSheet isOpen={sheetOpen} onClose={() => setSheetOpen(false)} />

      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-30 h-16 flex items-center justify-around px-2"
        style={{
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          background: 'rgba(255,255,255,0.95)',
          borderTop: '1px solid rgba(0,0,0,0.08)',
        }}
        aria-label="Navegacion principal"
      >
        {/* First two items */}
        {NAV_ITEMS.slice(0, 2).map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            aria-label={t(item.labelKey)}
            className={({ isActive }) =>
              cn(
                'flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-all duration-150',
                isActive ? 'text-[var(--accent)]' : 'text-[var(--text-muted)]'
              )
            }
          >
            {({ isActive }) => (
              <>
                <span className={cn('transition-transform duration-150', isActive ? 'scale-110' : '')}>
                  {item.icon}
                </span>
                <span className="text-[10px] font-medium leading-none">{t(item.labelKey)}</span>
              </>
            )}
          </NavLink>
        ))}

        {/* FAB center */}
        <button
          onClick={() => setSheetOpen((v) => !v)}
          className={cn(
            'relative flex items-center justify-center w-14 h-14 rounded-full shadow-lg',
            'transition-all duration-200 active:scale-90',
            '-mt-8'
          )}
          style={{
            background: 'linear-gradient(135deg, #366092, #818cf8)',
            boxShadow: '0 4px 20px rgba(54,96,146,0.45)',
          }}
          aria-label={sheetOpen ? t('bottomNav.closeActions') : t('bottomNav.openActions')}
          aria-expanded={sheetOpen}
        >
          <span
            className={cn(
              'transition-transform duration-200',
              sheetOpen ? 'rotate-45' : 'rotate-0'
            )}
          >
            {sheetOpen ? <X size={22} color="white" /> : <Plus size={22} color="white" />}
          </span>
        </button>

        {/* Last two items */}
        {NAV_ITEMS.slice(2).map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            aria-label={t(item.labelKey)}
            className={({ isActive }) =>
              cn(
                'flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-all duration-150',
                isActive ? 'text-[var(--accent)]' : 'text-[var(--text-muted)]'
              )
            }
          >
            {({ isActive }) => (
              <>
                <span className={cn('transition-transform duration-150', isActive ? 'scale-110' : '')}>
                  {item.icon}
                </span>
                <span className="text-[10px] font-medium leading-none">{t(item.labelKey)}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Dark mode bottom nav */}
      <style>{`
        @media (max-width: 767px) {
          .dark nav[aria-label="Navegacion principal"] {
            background: rgba(4,8,15,0.95) !important;
            border-top-color: rgba(255,255,255,0.06) !important;
          }
        }
      `}</style>
    </>
  )
}
