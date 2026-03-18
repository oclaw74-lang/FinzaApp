import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  TrendingUp,
  Target,
  Bell,
  BookOpen,
  CreditCard,
  PiggyBank,
  ArrowRight,
  CheckCircle,
  Shield,
  Zap,
  BarChart3,
  Menu,
  X,
  Moon,
  BarChart2,
  RefreshCw,
  Lightbulb,
} from 'lucide-react'
import { useAuthStore } from '@/store/authStore'

// ─── Animation Keyframes (injected once) ──────────────────────────────────────

const KEYFRAMES = `
@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(30px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes fadeInLeft {
  from { opacity: 0; transform: translateX(-30px); }
  to   { opacity: 1; transform: translateX(0); }
}
@keyframes fadeInRight {
  from { opacity: 0; transform: translateX(30px); }
  to   { opacity: 1; transform: translateX(0); }
}
@keyframes float {
  0%, 100% { transform: translateY(0px); }
  50%       { transform: translateY(-16px); }
}
@keyframes pulseGlow {
  0%, 100% { opacity: 0.4; }
  50%       { opacity: 0.85; }
}
@keyframes shimmer {
  0%   { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}
@keyframes orbit {
  from { transform: rotate(0deg) translateX(80px) rotate(0deg); }
  to   { transform: rotate(360deg) translateX(80px) rotate(-360deg); }
}
@keyframes gradientShift {
  0%, 100% { background-position: 0% 50%; }
  50%       { background-position: 100% 50%; }
}
@keyframes blobFloat1 {
  0%, 100% { transform: translate(0, 0) scale(1); }
  33%       { transform: translate(30px, -20px) scale(1.05); }
  66%       { transform: translate(-20px, 15px) scale(0.95); }
}
@keyframes blobFloat2 {
  0%, 100% { transform: translate(0, 0) scale(1); }
  33%       { transform: translate(-25px, 20px) scale(1.08); }
  66%       { transform: translate(20px, -10px) scale(0.92); }
}
@keyframes blobFloat3 {
  0%, 100% { transform: translate(0, 0) scale(1); }
  50%       { transform: translate(15px, -25px) scale(1.04); }
}
@keyframes particle {
  0%, 100% { transform: translateY(0px) translateX(0px); opacity: 0.3; }
  50%       { transform: translateY(-20px) translateX(8px); opacity: 0.8; }
}
@keyframes scoreProgress {
  from { stroke-dashoffset: 339.292; }
  to   { stroke-dashoffset: 73.64; }
}
@keyframes barGrow {
  from { width: 0%; }
}
@keyframes notifSlide {
  from { opacity: 0; transform: translateX(-20px); }
  to   { opacity: 1; transform: translateX(0); }
}
@keyframes badgeShimmer {
  0%   { background-position: -200% center; }
  100% { background-position: 200% center; }
}
`

// ─── Custom Hooks ──────────────────────────────────────────────────────────────

function useScrollReveal(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true)
          observer.disconnect()
        }
      },
      { threshold }
    )
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [threshold])
  return { ref, visible }
}

function useCountUp(target: number, duration = 2000, trigger: boolean): number {
  const [count, setCount] = useState(0)
  useEffect(() => {
    if (!trigger) return
    const start = Date.now()
    const frame = () => {
      const elapsed = Date.now() - start
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setCount(Math.round(eased * target))
      if (progress < 1) requestAnimationFrame(frame)
    }
    requestAnimationFrame(frame)
  }, [target, duration, trigger])
  return count
}

// ─── Types ─────────────────────────────────────────────────────────────────────

interface FeatureCardProps {
  icon: React.ReactNode
  title: string
  description: string
  accent: string
  delay: number
  visible: boolean
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function FeatureCard({ icon, title, description, accent, delay, visible }: FeatureCardProps) {
  return (
    <div
      className="group relative rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 transition-all duration-500 hover:-translate-y-2 hover:border-white/[0.15] hover:bg-white/[0.05] cursor-default"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(28px)',
        transition: `opacity 0.6s ease ${delay}ms, transform 0.6s ease ${delay}ms, border-color 0.3s, background 0.3s, box-shadow 0.3s`,
        boxShadow: undefined,
      }}
    >
      {/* Hover glow */}
      <div
        className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{ boxShadow: `inset 0 0 30px ${accent}15` }}
      />
      {/* Icon */}
      <div
        className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110"
        style={{ background: `${accent}18`, boxShadow: `0 0 20px ${accent}20` }}
      >
        <span style={{ color: accent }}>{icon}</span>
      </div>
      <h3 className="mb-2 text-base font-semibold text-white">{title}</h3>
      <p className="text-sm leading-relaxed text-white/50">{description}</p>
      {/* Bottom accent line */}
      <div
        className="absolute bottom-0 left-6 right-6 h-px rounded-full opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{ background: `linear-gradient(to right, transparent, ${accent}60, transparent)` }}
      />
    </div>
  )
}

function ScoreVisual({ animate }: { animate: boolean }) {
  const score = 78
  const radius = 54
  const circumference = 2 * Math.PI * radius
  const targetOffset = circumference - (score / 100) * circumference

  return (
    <div className="relative mx-auto w-full max-w-sm rounded-2xl border border-white/[0.08] bg-[#080f1e] p-6 shadow-2xl"
      style={{ boxShadow: '0 0 60px #1a6fd420, 0 0 120px #4fc8d808' }}>
      {/* Header */}
      <div className="mb-5 flex items-center justify-between">
        <span className="text-sm font-medium text-white/70">Score financiero</span>
        <span className="rounded-full bg-[#00B050]/10 px-2.5 py-0.5 text-xs font-medium text-[#00B050]">
          Marzo 2026
        </span>
      </div>
      {/* Circle score */}
      <div className="flex justify-center">
        <div className="relative">
          <svg width="140" height="140" viewBox="0 0 140 140">
            <circle cx="70" cy="70" r={radius} fill="none" stroke="#ffffff06" strokeWidth="10" />
            {/* Track glow */}
            <circle cx="70" cy="70" r={radius} fill="none" stroke="#1a6fd415" strokeWidth="14" />
            <circle
              cx="70"
              cy="70"
              r={radius}
              fill="none"
              stroke="url(#scoreGrad)"
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={animate ? targetOffset : circumference}
              transform="rotate(-90 70 70)"
              style={{
                transition: animate ? 'stroke-dashoffset 1.6s cubic-bezier(0.34, 1.56, 0.64, 1)' : 'none',
                filter: 'drop-shadow(0 0 10px #3d8ef8aa)',
              }}
            />
            <defs>
              <linearGradient id="scoreGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#1a6fd4" />
                <stop offset="100%" stopColor="#4fc8d8" />
              </linearGradient>
            </defs>
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-4xl font-bold text-white">{score}</span>
            <span className="text-xs text-white/40">/ 100</span>
          </div>
        </div>
      </div>
      {/* Category bars */}
      <div className="mt-5 space-y-2.5">
        {[
          { label: 'Ahorro', pct: 85, color: '#00dfa2' },
          { label: 'Deudas', pct: 62, color: '#3d8ef8' },
          { label: 'Presupuesto', pct: 90, color: '#9768ff' },
          { label: 'Emergencias', pct: 55, color: '#ffb340' },
          { label: 'Inversiones', pct: 40, color: '#ff4060' },
        ].map((cat, i) => (
          <div key={cat.label} className="flex items-center gap-3">
            <span className="w-24 text-right text-xs text-white/50">{cat.label}</span>
            <div className="flex-1 overflow-hidden rounded-full bg-white/5">
              <div
                className="h-1.5 rounded-full"
                style={{
                  width: animate ? `${cat.pct}%` : '0%',
                  background: cat.color,
                  boxShadow: `0 0 8px ${cat.color}80`,
                  transition: animate
                    ? `width 0.8s cubic-bezier(0.34,1.56,0.64,1) ${300 + i * 120}ms`
                    : 'none',
                }}
              />
            </div>
            <span className="w-8 text-xs text-white/40">{cat.pct}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function NotificationsVisual({ animate }: { animate: boolean }) {
  const notifications = [
    { icon: '⚠️', title: 'Presupuesto de comida al 90%', time: 'hace 2 min', color: '#ffb340' },
    { icon: '🎯', title: 'Meta "Vacaciones" — contribuye esta semana', time: 'hace 1h', color: '#9768ff' },
    { icon: '💳', title: 'Prestamo de RD$15,000 vence en 3 dias', time: 'hace 3h', color: '#ff4060' },
    { icon: '✅', title: 'Balance positivo este mes. Buen trabajo!', time: 'ayer', color: '#00dfa2' },
  ]

  return (
    <div className="relative mx-auto w-full max-w-sm space-y-2.5">
      {notifications.map((n, i) => (
        <div
          key={i}
          className="flex items-start gap-3 rounded-xl border border-white/[0.06] bg-[#080f1e] p-3.5 transition-all duration-300 hover:border-white/[0.12] hover:-translate-y-0.5"
          style={{
            opacity: animate ? 1 : 0,
            transform: animate ? 'translateX(0)' : 'translateX(-24px)',
            transition: animate
              ? `opacity 0.5s ease ${i * 120}ms, transform 0.5s ease ${i * 120}ms, border-color 0.3s, box-shadow 0.3s`
              : 'none',
            boxShadow: `0 4px 20px ${n.color}08`,
          }}
        >
          <div
            className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg text-sm"
            style={{ background: `${n.color}15`, boxShadow: `0 0 12px ${n.color}20` }}
          >
            {n.icon}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium leading-snug text-white/80">{n.title}</p>
            <p className="mt-0.5 text-[11px] text-white/30">{n.time}</p>
          </div>
          <div className="h-1.5 w-1.5 flex-shrink-0 rounded-full mt-1" style={{ background: n.color }} />
        </div>
      ))}
      <div
        className="rounded-xl border border-white/[0.04] bg-white/[0.02] p-3 text-center text-xs text-white/30"
        style={{
          opacity: animate ? 1 : 0,
          transition: animate ? 'opacity 0.5s ease 600ms' : 'none',
        }}
      >
        + 11 tipos de alertas mas
      </div>
    </div>
  )
}

function DashboardPreview() {
  return (
    <div
      className="relative w-full max-w-4xl mx-auto"
      style={{ animation: 'float 6s ease-in-out infinite' }}
    >
      {/* Glow layers */}
      <div
        className="pointer-events-none absolute inset-x-16 -bottom-6 h-24 blur-3xl"
        style={{
          background: 'linear-gradient(to right, #1a6fd440, #4fc8d830)',
          animation: 'pulseGlow 3s ease-in-out infinite',
        }}
      />
      <div
        className="pointer-events-none absolute inset-x-32 -bottom-2 h-12 blur-xl opacity-60"
        style={{ background: 'linear-gradient(to right, #3d8ef850, #9768ff30)' }}
      />

      {/* Card */}
      <div
        className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-[#080f1e] shadow-2xl"
        style={{ boxShadow: '0 40px 80px #00000060, 0 0 0 1px #ffffff08' }}
      >
        {/* Browser chrome */}
        <div className="flex items-center gap-3 border-b border-white/[0.06] bg-[#060d1a] px-5 py-3">
          <div className="flex gap-1.5">
            <div className="h-3 w-3 rounded-full bg-[#ff4060]/60" />
            <div className="h-3 w-3 rounded-full bg-[#ffb340]/60" />
            <div className="h-3 w-3 rounded-full bg-[#00dfa2]/60" />
          </div>
          <div className="mx-auto flex items-center gap-1.5 rounded-md bg-white/[0.04] px-3 py-1 text-xs text-white/30">
            <div className="h-1.5 w-1.5 rounded-full bg-[#00B050]/60" />
            <span>finza.app/dashboard</span>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-3">
          {/* Score card */}
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
            <p className="mb-1 text-xs text-white/40">Score financiero</p>
            <div className="flex items-end gap-2">
              <span className="text-4xl font-bold text-white">78</span>
              <span className="mb-1 text-sm text-[#00B050]">+4 este mes</span>
            </div>
            <div className="mt-3 overflow-hidden rounded-full bg-white/5">
              <div
                className="h-1.5 rounded-full"
                style={{
                  width: '78%',
                  background: 'linear-gradient(to right, #1a6fd4, #4fc8d8)',
                  boxShadow: '0 0 10px #3d8ef860',
                }}
              />
            </div>
          </div>
          {/* Balance card */}
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
            <p className="mb-1 text-xs text-white/40">Balance del mes</p>
            <p className="text-2xl font-bold text-[#00B050]">+RD$12,450</p>
            <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
              <div>
                <p className="text-white/40">Ingresos</p>
                <p className="font-semibold text-white">RD$45,000</p>
              </div>
              <div>
                <p className="text-white/40">Egresos</p>
                <p className="font-semibold text-[#FF0000]">RD$32,550</p>
              </div>
            </div>
          </div>
          {/* Meta card */}
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
            <p className="mb-1 text-xs text-white/40">Meta: Fondo emergencia</p>
            <p className="text-2xl font-bold text-white">65%</p>
            <div className="mt-3 overflow-hidden rounded-full bg-white/5">
              <div
                className="h-1.5 rounded-full"
                style={{ width: '65%', background: '#00dfa2', boxShadow: '0 0 8px #00dfa260' }}
              />
            </div>
            <p className="mt-2 text-xs text-white/30">RD$65,000 / RD$100,000</p>
          </div>
        </div>

        {/* Bottom stats row */}
        <div className="grid grid-cols-2 gap-4 px-5 pb-5 sm:grid-cols-4">
          {[
            { label: 'Prestamos activos', value: '2', color: '#ffb340' },
            { label: 'Presupuestos', value: '5/6 OK', color: '#9768ff' },
            { label: 'Alertas', value: '3 nuevas', color: '#ff4060' },
            { label: 'Recurrentes', value: 'RD$8,200', color: '#4fc8d8' },
          ].map((item) => (
            <div key={item.label} className="rounded-lg border border-white/[0.04] bg-white/[0.02] p-3">
              <p className="text-xs text-white/40">{item.label}</p>
              <p className="mt-0.5 text-sm font-semibold" style={{ color: item.color }}>
                {item.value}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Main Component ─────────────────────────────────────────────────────────────

export function LandingPage(): JSX.Element {
  const { t } = useTranslation()
  const { session } = useAuthStore()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  // Scroll listener for navbar glassmorphism
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Scroll reveal hooks for each section
  const statsReveal = useScrollReveal(0.2)
  const featuresReveal = useScrollReveal(0.1)
  const scoreReveal = useScrollReveal(0.2)
  const notifsReveal = useScrollReveal(0.2)
  const extrasReveal = useScrollReveal(0.15)
  const ctaReveal = useScrollReveal(0.2)

  // Count-up values (numeric portions only)
  const count15 = useCountUp(15, 1800, statsReveal.visible)

  // Particles (20 floating dots)
  const particles = Array.from({ length: 20 }, (_, i) => ({
    id: i,
    size: 2 + Math.random() * 4,
    left: Math.random() * 100,
    top: 10 + Math.random() * 80,
    delay: Math.random() * 4,
    duration: 3 + Math.random() * 4,
    opacity: 0.15 + Math.random() * 0.4,
    color: i % 3 === 0 ? '#4fc8d8' : i % 3 === 1 ? '#3d8ef8' : '#1a6fd4',
  }))

  const features = [
    {
      icon: <BarChart3 className="h-5 w-5" />,
      title: t('landing.feature1Title'),
      description: t('landing.feature1Desc'),
      accent: '#3d8ef8',
    },
    {
      icon: <Target className="h-5 w-5" />,
      title: t('landing.feature2Title'),
      description: t('landing.feature2Desc'),
      accent: '#9768ff',
    },
    {
      icon: <PiggyBank className="h-5 w-5" />,
      title: t('landing.feature3Title'),
      description: t('landing.feature3Desc'),
      accent: '#00dfa2',
    },
    {
      icon: <CreditCard className="h-5 w-5" />,
      title: t('landing.feature4Title'),
      description: t('landing.feature4Desc'),
      accent: '#ffb340',
    },
    {
      icon: <Bell className="h-5 w-5" />,
      title: t('landing.feature5Title'),
      description: t('landing.feature5Desc'),
      accent: '#ff4060',
    },
    {
      icon: <BookOpen className="h-5 w-5" />,
      title: t('landing.feature6Title'),
      description: t('landing.feature6Desc'),
      accent: '#4fc8d8',
    },
  ]

  const extraFeatures = [
    { icon: <Moon className="h-5 w-5" />, title: t('landing.extra1Title'), desc: t('landing.extra1Desc'), color: '#9768ff' },
    { icon: <BarChart2 className="h-5 w-5" />, title: t('landing.extra2Title'), desc: t('landing.extra2Desc'), color: '#3d8ef8' },
    { icon: <RefreshCw className="h-5 w-5" />, title: t('landing.extra3Title'), desc: t('landing.extra3Desc'), color: '#4fc8d8' },
    { icon: <Lightbulb className="h-5 w-5" />, title: t('landing.extra4Title'), desc: t('landing.extra4Desc'), color: '#ffb340' },
  ]

  return (
    <div className="min-h-screen bg-[#04080f] font-sans antialiased overflow-x-hidden">
      {/* Inject keyframes */}
      <style>{KEYFRAMES}</style>

      {/* ── Navbar ─────────────────────────────────────────────────────────── */}
      <nav
        className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ${
          scrolled
            ? 'border-b border-white/[0.05] bg-[#04080f]/80 backdrop-blur-xl'
            : 'bg-transparent'
        }`}
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3.5 sm:px-6">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <img
              src="/logo.svg"
              alt="Finza"
              className="h-8 w-8 transition-transform duration-300 group-hover:scale-110"
            />
            <span className="text-lg font-bold tracking-tight text-white">Finza</span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden items-center gap-2 sm:flex">
            {session ? (
              <Link
                to="/dashboard"
                className="relative overflow-hidden rounded-lg bg-[#1a6fd4] px-5 py-2 text-sm font-semibold text-white transition-all hover:bg-[#3d8ef8] hover:shadow-lg hover:shadow-[#3d8ef840]"
              >
                <span className="relative z-10 flex items-center gap-1.5">
                  {t('landing.ctaDashboard')}
                  <ArrowRight className="h-3.5 w-3.5" />
                </span>
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="rounded-lg px-4 py-2 text-sm font-medium text-white/60 transition-colors hover:text-white"
                >
                  {t('landing.ctaLogin')}
                </Link>
                <Link
                  to="/register"
                  className="relative overflow-hidden rounded-lg bg-[#1a6fd4] px-5 py-2 text-sm font-semibold text-white transition-all hover:bg-[#3d8ef8] hover:shadow-lg hover:shadow-[#3d8ef840]"
                >
                  <span className="relative z-10">{t('landing.ctaStart')}</span>
                  {/* Shimmer */}
                  <span
                    className="pointer-events-none absolute inset-0 -translate-x-full skew-x-12 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                    style={{ animation: 'shimmer 2.5s infinite 1s' }}
                  />
                </Link>
              </>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            className="flex items-center justify-center rounded-lg p-2 text-white/60 transition-colors hover:text-white sm:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Abrir menu"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {/* Mobile menu */}
        <div
          className={`overflow-hidden border-t border-white/[0.05] bg-[#04080f]/95 backdrop-blur-xl transition-all duration-300 sm:hidden ${
            mobileMenuOpen ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'
          }`}
        >
          <div className="px-4 pb-4 pt-2 space-y-1">
            {session ? (
              <Link
                to="/dashboard"
                className="flex items-center justify-center gap-1.5 rounded-lg bg-[#1a6fd4] px-4 py-2.5 text-sm font-semibold text-white"
                onClick={() => setMobileMenuOpen(false)}
              >
                {t('landing.ctaDashboard')} <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="block rounded-lg px-4 py-2.5 text-sm text-white/60 hover:text-white"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {t('landing.ctaLogin')}
                </Link>
                <Link
                  to="/register"
                  className="block rounded-lg bg-[#1a6fd4] px-4 py-2.5 text-center text-sm font-semibold text-white"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {t('landing.ctaStart')}
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* ── Hero ───────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden px-4 pb-28 pt-32 sm:px-6 sm:pt-44">
        {/* Animated background blobs */}
        <div
          className="pointer-events-none absolute -top-32 left-1/4 h-[700px] w-[700px] rounded-full opacity-[0.12] blur-3xl"
          style={{
            background: 'radial-gradient(circle, #1a6fd4 0%, transparent 70%)',
            animation: 'blobFloat1 14s ease-in-out infinite',
          }}
        />
        <div
          className="pointer-events-none absolute right-0 top-1/3 h-[500px] w-[500px] rounded-full opacity-[0.08] blur-3xl"
          style={{
            background: 'radial-gradient(circle, #4fc8d8 0%, transparent 70%)',
            animation: 'blobFloat2 18s ease-in-out infinite',
          }}
        />
        <div
          className="pointer-events-none absolute bottom-0 left-0 h-[350px] w-[350px] rounded-full opacity-[0.07] blur-3xl"
          style={{
            background: 'radial-gradient(circle, #3d8ef8 0%, transparent 70%)',
            animation: 'blobFloat3 12s ease-in-out infinite',
          }}
        />

        {/* Floating particles */}
        {particles.map((p) => (
          <div
            key={p.id}
            className="pointer-events-none absolute rounded-full"
            style={{
              width: p.size,
              height: p.size,
              left: `${p.left}%`,
              top: `${p.top}%`,
              background: p.color,
              opacity: p.opacity,
              boxShadow: `0 0 ${p.size * 2}px ${p.color}`,
              animation: `particle ${p.duration}s ease-in-out infinite ${p.delay}s`,
            }}
          />
        ))}

        <div className="relative mx-auto max-w-6xl">
          {/* Badge */}
          <div
            className="mb-8 flex justify-center"
            style={{ animation: 'fadeInUp 0.7s ease both' }}
          >
            <span
              className="relative inline-flex items-center gap-2 overflow-hidden rounded-full border border-[#3d8ef8]/25 bg-[#3d8ef8]/[0.08] px-4 py-1.5 text-xs font-medium text-[#7ed8e8]"
            >
              <span
                className="pointer-events-none absolute inset-0 -translate-x-full skew-x-12 bg-gradient-to-r from-transparent via-white/10 to-transparent"
                style={{ animation: 'shimmer 3s infinite 2s' }}
              />
              <span>✨</span>
              {t('landing.badge')}
            </span>
          </div>

          {/* Headline */}
          <h1
            className="mx-auto mb-6 max-w-4xl text-center text-5xl font-extrabold leading-tight tracking-tight text-white sm:text-6xl lg:text-7xl"
            style={{ animation: 'fadeInUp 0.7s ease 0.1s both' }}
          >
            {t('landing.headline1')}{' '}
            <span
              className="bg-clip-text text-transparent"
              style={{
                backgroundImage: 'linear-gradient(135deg, #1a6fd4 0%, #4fc8d8 40%, #3d8ef8 70%, #7ed8e8 100%)',
                backgroundSize: '300% 300%',
                animation: 'gradientShift 4s ease infinite',
                WebkitBackgroundClip: 'text',
              }}
            >
              {t('landing.headline2')}
            </span>
          </h1>

          {/* Subheadline */}
          <p
            className="mx-auto mb-10 max-w-2xl text-center text-base leading-relaxed text-white/50 sm:text-lg"
            style={{ animation: 'fadeInUp 0.7s ease 0.2s both' }}
          >
            {t('landing.subheadline')}
          </p>

          {/* CTAs */}
          <div
            className="flex flex-col items-center justify-center gap-3 sm:flex-row"
            style={{ animation: 'fadeInUp 0.7s ease 0.3s both' }}
          >
            {session ? (
              <Link
                to="/dashboard"
                className="group relative overflow-hidden flex w-full items-center justify-center gap-2 rounded-xl bg-[#1a6fd4] px-9 py-4 text-base font-bold text-white shadow-xl shadow-[#1a6fd430] transition-all hover:bg-[#3d8ef8] hover:shadow-[#3d8ef840] sm:w-auto"
              >
                <span className="relative z-10 flex items-center gap-2">
                  {t('landing.ctaDashboard')}
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </span>
                <span
                  className="pointer-events-none absolute inset-0 -translate-x-full skew-x-12 bg-gradient-to-r from-transparent via-white/15 to-transparent"
                  style={{ animation: 'shimmer 2.5s infinite 0.5s' }}
                />
              </Link>
            ) : (
              <>
                <Link
                  to="/register"
                  className="group relative overflow-hidden flex w-full items-center justify-center gap-2 rounded-xl bg-[#1a6fd4] px-9 py-4 text-base font-bold text-white shadow-xl shadow-[#1a6fd430] transition-all hover:bg-[#3d8ef8] hover:shadow-[#3d8ef840] sm:w-auto"
                >
                  <span className="relative z-10 flex items-center gap-2">
                    {t('landing.ctaStart')}
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </span>
                  <span
                    className="pointer-events-none absolute inset-0 -translate-x-full skew-x-12 bg-gradient-to-r from-transparent via-white/15 to-transparent"
                    style={{ animation: 'shimmer 2.5s infinite 0.5s' }}
                  />
                </Link>
                <Link
                  to="/login"
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/[0.1] bg-white/[0.04] px-9 py-4 text-base font-medium text-white/70 transition-all hover:bg-white/[0.08] hover:text-white sm:w-auto"
                >
                  {t('landing.ctaLogin')}
                </Link>
              </>
            )}
          </div>

          {/* Trust badges */}
          <div
            className="mt-8 flex flex-wrap items-center justify-center gap-5 text-xs text-white/30"
            style={{ animation: 'fadeInUp 0.7s ease 0.4s both' }}
          >
            <span className="flex items-center gap-1.5 transition-colors hover:text-white/50">
              <Shield className="h-3.5 w-3.5 text-[#4fc8d8]" /> {t('landing.trust1')}
            </span>
            <span className="flex items-center gap-1.5 transition-colors hover:text-white/50">
              <Zap className="h-3.5 w-3.5 text-[#ffb340]" /> {t('landing.trust2')}
            </span>
            <span className="flex items-center gap-1.5 transition-colors hover:text-white/50">
              <CheckCircle className="h-3.5 w-3.5 text-[#00dfa2]" /> {t('landing.trust3')}
            </span>
          </div>

          {/* Dashboard preview */}
          <div
            className="mt-16 px-4 sm:px-0"
            style={{ animation: 'fadeInUp 0.9s ease 0.5s both' }}
          >
            <DashboardPreview />
          </div>
        </div>
      </section>

      {/* ── Stats Section ─────────────────────────────────────────────────── */}
      <section className="relative px-4 py-24 sm:px-6">
        {/* Grid texture */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.05) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />
        <div ref={statsReveal.ref} className="relative mx-auto max-w-6xl">
          {/* Section heading */}
          <div
            className="mb-12 text-center"
            style={{
              opacity: statsReveal.visible ? 1 : 0,
              transform: statsReveal.visible ? 'translateY(0)' : 'translateY(24px)',
              transition: 'opacity 0.6s ease, transform 0.6s ease',
            }}
          >
            <div className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-[#00B050]/20 bg-[#00B050]/10 px-3 py-1 text-xs font-medium text-[#00B050]">
              <TrendingUp className="h-3 w-3" />
              Estadisticas de la plataforma
            </div>
            <h2 className="mt-2 text-2xl font-bold text-white sm:text-3xl">{t('landing.statsTitle')}</h2>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
            {[
              { value: `${count15}+`, label: t('landing.stat1Label'), color: '#3d8ef8', delay: 0 },
              { value: t('landing.stat2Value'), label: t('landing.stat2Label'), color: '#9768ff', delay: 100 },
              { value: t('landing.stat3Value'), label: t('landing.stat3Label'), color: '#00dfa2', delay: 200 },
              { value: t('landing.stat4Value'), label: t('landing.stat4Label'), color: '#ffb340', delay: 300 },
            ].map((stat, i) => (
              <div
                key={i}
                className="group relative overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 text-center transition-all duration-300 hover:border-white/[0.12] hover:bg-white/[0.04] hover:-translate-y-1"
                style={{
                  opacity: statsReveal.visible ? 1 : 0,
                  transform: statsReveal.visible ? 'translateY(0)' : 'translateY(28px)',
                  transition: `opacity 0.6s ease ${stat.delay}ms, transform 0.6s ease ${stat.delay}ms, border-color 0.3s, background 0.3s`,
                }}
              >
                {/* Gradient border top */}
                <div
                  className="absolute inset-x-0 top-0 h-px"
                  style={{ background: `linear-gradient(to right, transparent, ${stat.color}60, transparent)` }}
                />
                {/* Glow */}
                <div
                  className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                  style={{ boxShadow: `inset 0 0 40px ${stat.color}12` }}
                />
                <div
                  className="mb-1 text-4xl font-black sm:text-5xl"
                  style={{
                    background: `linear-gradient(135deg, ${stat.color}, #ffffff)`,
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                  }}
                >
                  {stat.value}
                </div>
                <div className="text-sm text-white/50">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features Grid ─────────────────────────────────────────────────── */}
      <section className="px-4 py-24 sm:px-6">
        <div ref={featuresReveal.ref} className="mx-auto max-w-6xl">
          {/* Heading */}
          <div
            className="mb-14 text-center"
            style={{
              opacity: featuresReveal.visible ? 1 : 0,
              transform: featuresReveal.visible ? 'translateY(0)' : 'translateY(24px)',
              transition: 'opacity 0.6s ease, transform 0.6s ease',
            }}
          >
            <h2 className="mb-4 text-3xl font-bold text-white sm:text-4xl">
              {t('landing.featuresTitle')}
            </h2>
            <p className="mx-auto max-w-xl text-base text-white/50">{t('landing.featuresSub')}</p>
          </div>

          {/* Feature cards with stagger */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f, i) => (
              <FeatureCard
                key={f.title}
                icon={f.icon}
                title={f.title}
                description={f.description}
                accent={f.accent}
                delay={i * 80}
                visible={featuresReveal.visible}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ── Highlight: Score Financiero ───────────────────────────────────── */}
      <section className="px-4 py-24 sm:px-6">
        <div ref={scoreReveal.ref} className="mx-auto max-w-6xl">
          <div className="flex flex-col gap-12 lg:flex-row lg:items-center lg:gap-20">
            {/* Text side */}
            <div
              className="flex-1"
              style={{
                opacity: scoreReveal.visible ? 1 : 0,
                transform: scoreReveal.visible ? 'translateX(0)' : 'translateX(-30px)',
                transition: 'opacity 0.7s ease, transform 0.7s ease',
              }}
            >
              <div className="mb-4 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium"
                style={{ background: '#3d8ef818', color: '#3d8ef8' }}>
                Score Financiero
              </div>
              <h2 className="mb-5 text-3xl font-bold text-white sm:text-4xl leading-tight">
                {t('landing.scoreTitle')}
              </h2>
              <p className="mb-6 text-base leading-relaxed text-white/50">{t('landing.scoreDesc')}</p>
              <ul className="space-y-3.5">
                {[
                  t('landing.scoreBullet1'),
                  t('landing.scoreBullet2'),
                  t('landing.scoreBullet3'),
                  t('landing.scoreBullet4'),
                ].map((b, i) => (
                  <li key={i} className="flex items-start gap-2.5">
                    <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#3d8ef8]" />
                    <span className="text-sm text-white/70">{b}</span>
                  </li>
                ))}
              </ul>
            </div>
            {/* Visual side */}
            <div
              className="flex-1"
              style={{
                opacity: scoreReveal.visible ? 1 : 0,
                transform: scoreReveal.visible ? 'translateX(0)' : 'translateX(30px)',
                transition: 'opacity 0.7s ease 0.15s, transform 0.7s ease 0.15s',
              }}
            >
              <ScoreVisual animate={scoreReveal.visible} />
            </div>
          </div>
        </div>
      </section>

      {/* ── Highlight: Notificaciones ─────────────────────────────────────── */}
      <section className="px-4 py-24 sm:px-6">
        <div ref={notifsReveal.ref} className="mx-auto max-w-6xl">
          <div className="flex flex-col gap-12 lg:flex-row-reverse lg:items-center lg:gap-20">
            {/* Text side */}
            <div
              className="flex-1"
              style={{
                opacity: notifsReveal.visible ? 1 : 0,
                transform: notifsReveal.visible ? 'translateX(0)' : 'translateX(30px)',
                transition: 'opacity 0.7s ease, transform 0.7s ease',
              }}
            >
              <div className="mb-4 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium"
                style={{ background: '#ff406018', color: '#ff4060' }}>
                Notificaciones Inteligentes
              </div>
              <h2 className="mb-5 text-3xl font-bold text-white sm:text-4xl leading-tight">
                {t('landing.notifsTitle')}
              </h2>
              <p className="mb-6 text-base leading-relaxed text-white/50">{t('landing.notifsDesc')}</p>
              <ul className="space-y-3.5">
                {[
                  t('landing.notifsBullet1'),
                  t('landing.notifsBullet2'),
                  t('landing.notifsBullet3'),
                  t('landing.notifsBullet4'),
                  t('landing.notifsBullet5'),
                ].map((b, i) => (
                  <li key={i} className="flex items-start gap-2.5">
                    <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#ff4060]" />
                    <span className="text-sm text-white/70">{b}</span>
                  </li>
                ))}
              </ul>
            </div>
            {/* Visual side */}
            <div
              className="flex-1"
              style={{
                opacity: notifsReveal.visible ? 1 : 0,
                transform: notifsReveal.visible ? 'translateX(0)' : 'translateX(-30px)',
                transition: 'opacity 0.7s ease 0.15s, transform 0.7s ease 0.15s',
              }}
            >
              <NotificationsVisual animate={notifsReveal.visible} />
            </div>
          </div>
        </div>
      </section>

      {/* ── Additional Features Row ───────────────────────────────────────── */}
      <section className="px-4 py-16 sm:px-6">
        <div ref={extrasReveal.ref} className="mx-auto max-w-6xl">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {extraFeatures.map((item, i) => (
              <div
                key={i}
                className="group relative overflow-hidden rounded-xl border border-white/[0.06] bg-white/[0.02] p-5 transition-all duration-300 hover:border-white/[0.1] hover:bg-white/[0.04] hover:-translate-y-1"
                style={{
                  opacity: extrasReveal.visible ? 1 : 0,
                  transform: extrasReveal.visible ? 'translateY(0)' : 'translateY(24px)',
                  transition: `opacity 0.6s ease ${i * 80}ms, transform 0.6s ease ${i * 80}ms, border-color 0.3s, background 0.3s`,
                }}
              >
                <div
                  className="pointer-events-none absolute inset-0 rounded-xl opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                  style={{ boxShadow: `inset 0 0 24px ${item.color}10` }}
                />
                <div
                  className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-lg transition-transform duration-300 group-hover:scale-110"
                  style={{ background: `${item.color}15`, color: item.color }}
                >
                  {item.icon}
                </div>
                <h3 className="mb-1.5 text-sm font-semibold text-white">{item.title}</h3>
                <p className="text-xs leading-relaxed text-white/40">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ─────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden px-4 py-32 sm:px-6">
        {/* Radial glow background */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse 70% 60% at 50% 50%, #1a6fd415 0%, transparent 70%)',
            animation: 'pulseGlow 5s ease-in-out infinite',
          }}
        />
        {/* Grid */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.06) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />

        <div ref={ctaReveal.ref} className="relative mx-auto max-w-2xl text-center">
          <div
            style={{
              opacity: ctaReveal.visible ? 1 : 0,
              transform: ctaReveal.visible ? 'translateY(0)' : 'translateY(24px)',
              transition: 'opacity 0.7s ease, transform 0.7s ease',
            }}
          >
            <div className="mb-5 inline-flex items-center gap-1.5 rounded-full border border-[#00B050]/20 bg-[#00B050]/10 px-3 py-1 text-xs font-medium text-[#00B050]">
              {t('landing.ctaFinalBadge')}
            </div>
            <h2 className="mb-5 text-4xl font-extrabold text-white sm:text-5xl lg:text-6xl leading-tight">
              {t('landing.ctaFinalTitle1')}{' '}
              <span
                className="bg-clip-text text-transparent"
                style={{
                  backgroundImage: 'linear-gradient(135deg, #00dfa2 0%, #4fc8d8 50%, #3d8ef8 100%)',
                  backgroundSize: '300% 300%',
                  animation: 'gradientShift 4s ease infinite',
                  WebkitBackgroundClip: 'text',
                }}
              >
                {t('landing.ctaFinalTitle2')}
              </span>
            </h2>
            <p className="mb-10 text-base text-white/50 sm:text-lg">{t('landing.ctaFinalSub')}</p>

            {session ? (
              <Link
                to="/dashboard"
                className="group relative inline-flex overflow-hidden items-center gap-2 rounded-2xl bg-[#1a6fd4] px-12 py-5 text-base font-bold text-white shadow-2xl shadow-[#1a6fd435] transition-all hover:bg-[#3d8ef8] hover:shadow-[#3d8ef845]"
              >
                <span className="relative z-10 flex items-center gap-2">
                  {t('landing.ctaDashboard')}
                  <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                </span>
                <span
                  className="pointer-events-none absolute inset-0 -translate-x-full skew-x-12 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                  style={{ animation: 'shimmer 2.5s infinite 1s' }}
                />
              </Link>
            ) : (
              <Link
                to="/register"
                className="group relative inline-flex overflow-hidden items-center gap-2 rounded-2xl bg-[#1a6fd4] px-12 py-5 text-base font-bold text-white shadow-2xl shadow-[#1a6fd435] transition-all hover:bg-[#3d8ef8] hover:shadow-[#3d8ef845]"
              >
                <span className="relative z-10 flex items-center gap-2">
                  {t('landing.ctaFinalBtn')}
                  <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                </span>
                <span
                  className="pointer-events-none absolute inset-0 -translate-x-full skew-x-12 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                  style={{ animation: 'shimmer 2.5s infinite 1s' }}
                />
              </Link>
            )}

            {!session && (
              <p className="mt-5 text-sm text-white/30">
                {t('landing.ctaFinalHaveAccount')}{' '}
                <Link to="/login" className="text-[#4fc8d8] transition-colors hover:text-[#7ed8e8]">
                  {t('landing.ctaFinalSignIn')}
                </Link>
              </p>
            )}
          </div>
        </div>
      </section>

      {/* ── Footer ────────────────────────────────────────────────────────── */}
      <footer className="border-t border-white/[0.05] px-4 py-8 sm:px-6">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 sm:flex-row">
          <Link to="/" className="flex items-center gap-2 group">
            <img src="/logo.svg" alt="Finza" className="h-6 w-6 transition-transform duration-300 group-hover:scale-110" />
            <span className="text-sm font-semibold text-white/50 transition-colors group-hover:text-white/70">Finza</span>
          </Link>
          <p className="text-xs text-white/20">
            &copy; {new Date().getFullYear()} Finza. {t('landing.copyright')}
          </p>
          <div className="flex items-center gap-5 text-xs text-white/35">
            {session ? (
              <Link to="/dashboard" className="transition-colors hover:text-white/60">
                {t('landing.ctaDashboard')}
              </Link>
            ) : (
              <>
                <Link to="/login" className="transition-colors hover:text-white/60">
                  {t('landing.ctaLogin')}
                </Link>
                <Link to="/register" className="transition-colors hover:text-white/60">
                  {t('landing.ctaStart')}
                </Link>
              </>
            )}
          </div>
        </div>
      </footer>
    </div>
  )
}
