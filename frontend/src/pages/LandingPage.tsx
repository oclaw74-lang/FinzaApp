import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  TrendingUp,
  Target,
  Bell,
  BookOpen,
  CreditCard,
  PiggyBank,
  ArrowRight,
  CheckCircle,
  Star,
  Shield,
  Zap,
  BarChart3,
  Menu,
  X,
} from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

interface FeatureCardProps {
  icon: React.ReactNode
  title: string
  description: string
  accent: string
}

interface StatItemProps {
  value: string
  label: string
}

interface HighlightSectionProps {
  reverse?: boolean
  badge: string
  title: string
  description: string
  bullets: string[]
  visual: React.ReactNode
  accentColor: string
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function FeatureCard({ icon, title, description, accent }: FeatureCardProps) {
  return (
    <div className="group relative rounded-2xl border border-white/[0.06] bg-white/[0.03] p-6 transition-all duration-300 hover:border-white/[0.12] hover:bg-white/[0.06] hover:-translate-y-1">
      <div
        className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl"
        style={{ background: `${accent}20` }}
      >
        <span style={{ color: accent }}>{icon}</span>
      </div>
      <h3 className="mb-2 text-base font-semibold text-white">{title}</h3>
      <p className="text-sm leading-relaxed text-white/50">{description}</p>
    </div>
  )
}

function StatItem({ value, label }: StatItemProps) {
  return (
    <div className="text-center">
      <div className="text-3xl font-bold text-white sm:text-4xl">{value}</div>
      <div className="mt-1 text-sm text-white/50">{label}</div>
    </div>
  )
}

function ScoreVisual() {
  const score = 78
  const radius = 54
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (score / 100) * circumference

  return (
    <div className="relative mx-auto w-full max-w-sm rounded-2xl border border-white/[0.08] bg-[#080f1e] p-6 shadow-xl">
      {/* Header */}
      <div className="mb-5 flex items-center justify-between">
        <span className="text-sm font-medium text-white/70">Score financiero</span>
        <span className="rounded-full bg-finza-green/10 px-2.5 py-0.5 text-xs font-medium text-finza-green">
          Marzo 2026
        </span>
      </div>

      {/* Circle score */}
      <div className="flex justify-center">
        <div className="relative">
          <svg width="140" height="140" viewBox="0 0 140 140">
            <circle cx="70" cy="70" r={radius} fill="none" stroke="#ffffff08" strokeWidth="10" />
            <circle
              cx="70"
              cy="70"
              r={radius}
              fill="none"
              stroke="#3d8ef8"
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              transform="rotate(-90 70 70)"
              style={{ filter: 'drop-shadow(0 0 8px #3d8ef888)' }}
            />
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
        ].map((cat) => (
          <div key={cat.label} className="flex items-center gap-3">
            <span className="w-24 text-right text-xs text-white/50">{cat.label}</span>
            <div className="flex-1 overflow-hidden rounded-full bg-white/5">
              <div
                className="h-1.5 rounded-full transition-all"
                style={{ width: `${cat.pct}%`, background: cat.color }}
              />
            </div>
            <span className="w-8 text-xs text-white/40">{cat.pct}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function NotificationsVisual() {
  const notifications = [
    {
      icon: '⚠️',
      title: 'Presupuesto de comida al 90%',
      time: 'hace 2 min',
      color: '#ffb340',
    },
    {
      icon: '🎯',
      title: 'Meta "Vacaciones" — contribuye esta semana',
      time: 'hace 1h',
      color: '#9768ff',
    },
    {
      icon: '💳',
      title: 'Préstamo de RD$15,000 vence en 3 días',
      time: 'hace 3h',
      color: '#ff4060',
    },
    {
      icon: '✅',
      title: 'Balance positivo este mes. ¡Buen trabajo!',
      time: 'ayer',
      color: '#00dfa2',
    },
  ]

  return (
    <div className="relative mx-auto w-full max-w-sm space-y-2.5">
      {notifications.map((n, i) => (
        <div
          key={i}
          className="flex items-start gap-3 rounded-xl border border-white/[0.06] bg-[#080f1e] p-3.5 transition-all hover:border-white/[0.12]"
          style={{ animationDelay: `${i * 0.1}s` }}
        >
          <div
            className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg text-sm"
            style={{ background: `${n.color}15` }}
          >
            {n.icon}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium leading-snug text-white/80">{n.title}</p>
            <p className="mt-0.5 text-[11px] text-white/30">{n.time}</p>
          </div>
        </div>
      ))}
      <div className="rounded-xl border border-white/[0.04] bg-white/[0.02] p-3 text-center text-xs text-white/30">
        + 11 tipos de alertas más
      </div>
    </div>
  )
}

function HighlightSection({
  reverse = false,
  badge,
  title,
  description,
  bullets,
  visual,
  accentColor,
}: HighlightSectionProps) {
  return (
    <div
      className={`flex flex-col gap-10 lg:flex-row lg:items-center lg:gap-16 ${
        reverse ? 'lg:flex-row-reverse' : ''
      }`}
    >
      {/* Text side */}
      <div className="flex-1">
        <div
          className="mb-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium"
          style={{ background: `${accentColor}15`, color: accentColor }}
        >
          {badge}
        </div>
        <h2 className="mb-4 text-3xl font-bold text-white sm:text-4xl">{title}</h2>
        <p className="mb-6 text-base leading-relaxed text-white/50">{description}</p>
        <ul className="space-y-3">
          {bullets.map((b, i) => (
            <li key={i} className="flex items-start gap-2.5">
              <CheckCircle
                className="mt-0.5 h-4 w-4 flex-shrink-0"
                style={{ color: accentColor }}
              />
              <span className="text-sm text-white/70">{b}</span>
            </li>
          ))}
        </ul>
      </div>
      {/* Visual side */}
      <div className="flex-1">{visual}</div>
    </div>
  )
}

// ─── Main Component ────────────────────────────────────────────────────────────

export function LandingPage(): JSX.Element {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const heroRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const features: FeatureCardProps[] = [
    {
      icon: <BarChart3 className="h-5 w-5" />,
      title: 'Score Financiero',
      description:
        'Tu salud financiera en un número del 0 al 100. Desglose en 5 categorías: ahorro, deudas, presupuesto, emergencias e inversiones.',
      accent: '#3d8ef8',
    },
    {
      icon: <Target className="h-5 w-5" />,
      title: 'Presupuestos Inteligentes',
      description:
        'Define límites por categoría, detecta gastos impulsivos y recibe alertas antes de que te pases del presupuesto.',
      accent: '#9768ff',
    },
    {
      icon: <PiggyBank className="h-5 w-5" />,
      title: 'Metas de Ahorro',
      description:
        'Crea metas con fecha objetivo, visualiza el progreso y registra contribuciones. El sistema calcula cuánto falta.',
      accent: '#00dfa2',
    },
    {
      icon: <CreditCard className="h-5 w-5" />,
      title: 'Préstamos y Deudas',
      description:
        'Gestiona préstamos que das o recibes. Amortización automática con desglose de capital e interés por cuota.',
      accent: '#ffb340',
    },
    {
      icon: <Bell className="h-5 w-5" />,
      title: 'Alertas Inteligentes',
      description:
        '15 tipos de notificaciones: presupuesto al límite, préstamos vencidos, balance negativo, metas sin contribución y más.',
      accent: '#ff4060',
    },
    {
      icon: <BookOpen className="h-5 w-5" />,
      title: 'Educación Financiera',
      description:
        'Lecciones interactivas y retos semanales diseñados para el contexto dominicano. Aprende mientras gestionas.',
      accent: '#00dfff',
    },
  ]

  return (
    <div className="min-h-screen bg-[#04080f] font-sans antialiased">
      {/* ── Navbar ───────────────────────────────────────────────────────────── */}
      <nav
        className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
          scrolled
            ? 'border-b border-white/[0.06] bg-[#04080f]/90 backdrop-blur-lg'
            : 'bg-transparent'
        }`}
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3.5 sm:px-6">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <img src="/logo-icon-dark.png" alt="Finza" className="h-8 w-8" />
            <span className="text-lg font-bold tracking-tight text-white">Finza</span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden items-center gap-2 sm:flex">
            <Link
              to="/login"
              className="rounded-lg px-4 py-2 text-sm font-medium text-white/70 transition-colors hover:text-white"
            >
              Iniciar sesion
            </Link>
            <Link
              to="/register"
              className="rounded-lg bg-finza-blue px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-finza-blue/90 hover:shadow-lg hover:shadow-finza-blue/25"
            >
              Comenzar gratis
            </Link>
          </div>

          {/* Mobile menu button */}
          <button
            className="flex items-center justify-center rounded-lg p-2 text-white/70 sm:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Abrir menu"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="border-t border-white/[0.06] bg-[#04080f]/95 px-4 pb-4 pt-2 sm:hidden">
            <Link
              to="/login"
              className="block rounded-lg px-4 py-2.5 text-sm text-white/70"
              onClick={() => setMobileMenuOpen(false)}
            >
              Iniciar sesion
            </Link>
            <Link
              to="/register"
              className="mt-1 block rounded-lg bg-finza-blue px-4 py-2.5 text-center text-sm font-semibold text-white"
              onClick={() => setMobileMenuOpen(false)}
            >
              Comenzar gratis
            </Link>
          </div>
        )}
      </nav>

      {/* ── Hero ─────────────────────────────────────────────────────────────── */}
      <section
        ref={heroRef}
        className="relative overflow-hidden px-4 pb-24 pt-32 sm:px-6 sm:pt-40"
      >
        {/* Background blobs */}
        <div
          className="pointer-events-none absolute -top-40 left-1/2 h-[600px] w-[600px] -translate-x-1/2 rounded-full opacity-20 blur-3xl"
          style={{ background: 'radial-gradient(circle, #3d8ef8 0%, transparent 70%)' }}
        />
        <div
          className="pointer-events-none absolute right-0 top-1/4 h-[400px] w-[400px] rounded-full opacity-10 blur-3xl"
          style={{ background: 'radial-gradient(circle, #9768ff 0%, transparent 70%)' }}
        />
        <div
          className="pointer-events-none absolute bottom-0 left-0 h-[300px] w-[300px] rounded-full opacity-10 blur-3xl"
          style={{ background: 'radial-gradient(circle, #00dfa2 0%, transparent 70%)' }}
        />

        <div className="relative mx-auto max-w-6xl">
          {/* Badge */}
          <div className="mb-6 flex justify-center">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-finza-blue/20 bg-finza-blue/10 px-3 py-1 text-xs font-medium text-finza-blue">
              <Star className="h-3 w-3" />
              App de finanzas personales para Latinoamerica
            </span>
          </div>

          {/* Headline */}
          <h1 className="mx-auto mb-6 max-w-3xl text-center text-4xl font-extrabold leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl">
            Tus finanzas,{' '}
            <span
              className="bg-clip-text text-transparent"
              style={{
                backgroundImage: 'linear-gradient(135deg, #3d8ef8 0%, #9768ff 100%)',
              }}
            >
              bajo control
            </span>
          </h1>

          {/* Subheadline */}
          <p className="mx-auto mb-10 max-w-2xl text-center text-base leading-relaxed text-white/50 sm:text-lg">
            Finza es la plataforma financiera que te da un score de salud, gestiona tus
            presupuestos, metas, prestamos y notificaciones — todo en un solo lugar, en pesos
            dominicanos.
          </p>

          {/* CTAs */}
          <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              to="/register"
              className="group flex w-full items-center justify-center gap-2 rounded-xl bg-finza-blue px-8 py-3.5 text-sm font-semibold text-white shadow-lg shadow-finza-blue/25 transition-all hover:bg-finza-blue/90 hover:shadow-finza-blue/40 sm:w-auto"
            >
              Comenzar gratis
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <Link
              to="/login"
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/[0.1] bg-white/[0.04] px-8 py-3.5 text-sm font-medium text-white/80 transition-all hover:bg-white/[0.08] hover:text-white sm:w-auto"
            >
              Iniciar sesion
            </Link>
          </div>

          {/* Trust badges */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-5 text-xs text-white/30">
            <span className="flex items-center gap-1.5">
              <Shield className="h-3.5 w-3.5" /> Autenticacion segura con Supabase
            </span>
            <span className="flex items-center gap-1.5">
              <Zap className="h-3.5 w-3.5" /> Datos en tiempo real
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle className="h-3.5 w-3.5" /> Sin tarjeta de credito
            </span>
          </div>

          {/* App preview */}
          <div className="mt-16 flex justify-center">
            <div className="relative w-full max-w-4xl">
              {/* Glow under card */}
              <div
                className="pointer-events-none absolute inset-x-8 -bottom-4 h-20 blur-2xl opacity-30"
                style={{ background: 'linear-gradient(to right, #3d8ef8, #9768ff)' }}
              />
              {/* Mock dashboard card */}
              <div className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-[#080f1e] shadow-2xl">
                {/* Fake topbar */}
                <div className="flex items-center gap-3 border-b border-white/[0.06] bg-[#060d1a] px-5 py-3">
                  <div className="flex gap-1.5">
                    <div className="h-3 w-3 rounded-full bg-[#ff4060]/60" />
                    <div className="h-3 w-3 rounded-full bg-[#ffb340]/60" />
                    <div className="h-3 w-3 rounded-full bg-[#00dfa2]/60" />
                  </div>
                  <div className="mx-auto flex items-center gap-1.5 rounded-md bg-white/[0.04] px-3 py-1 text-xs text-white/30">
                    <span>finza.app/dashboard</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-3">
                  {/* Score card */}
                  <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 sm:col-span-1">
                    <p className="mb-1 text-xs text-white/40">Score financiero</p>
                    <div className="flex items-end gap-2">
                      <span className="text-4xl font-bold text-white">78</span>
                      <span className="mb-1 text-sm text-finza-green">+4 este mes</span>
                    </div>
                    <div className="mt-3 overflow-hidden rounded-full bg-white/5">
                      <div
                        className="h-1.5 rounded-full"
                        style={{
                          width: '78%',
                          background: 'linear-gradient(to right, #3d8ef8, #9768ff)',
                        }}
                      />
                    </div>
                  </div>

                  {/* Balance card */}
                  <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
                    <p className="mb-1 text-xs text-white/40">Balance del mes</p>
                    <p className="text-2xl font-bold text-finza-green">+RD$12,450</p>
                    <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <p className="text-white/40">Ingresos</p>
                        <p className="font-semibold text-white">RD$45,000</p>
                      </div>
                      <div>
                        <p className="text-white/40">Egresos</p>
                        <p className="font-semibold text-finza-red">RD$32,550</p>
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
                        style={{ width: '65%', background: '#00dfa2' }}
                      />
                    </div>
                    <p className="mt-2 text-xs text-white/30">RD$65,000 / RD$100,000</p>
                  </div>
                </div>

                {/* Bottom row */}
                <div className="grid grid-cols-2 gap-4 px-5 pb-5 sm:grid-cols-4">
                  {[
                    { label: 'Prestamos activos', value: '2', color: '#ffb340' },
                    { label: 'Presupuestos', value: '5/6 OK', color: '#9768ff' },
                    { label: 'Alertas', value: '3 nuevas', color: '#ff4060' },
                    { label: 'Recurrentes', value: 'RD$8,200', color: '#00dfff' },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className="rounded-lg border border-white/[0.04] bg-white/[0.02] p-3"
                    >
                      <p className="text-xs text-white/40">{item.label}</p>
                      <p className="mt-0.5 text-sm font-semibold" style={{ color: item.color }}>
                        {item.value}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Features Grid ────────────────────────────────────────────────────── */}
      <section className="px-4 py-24 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <div className="mb-14 text-center">
            <h2 className="mb-4 text-3xl font-bold text-white sm:text-4xl">
              Todo lo que necesitas para tus finanzas
            </h2>
            <p className="mx-auto max-w-xl text-base text-white/50">
              Diseñado para el contexto dominicano, con pesos dominicanos y las situaciones
              financieras que enfrentas todos los dias.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <FeatureCard key={f.title} {...f} />
            ))}
          </div>
        </div>
      </section>

      {/* ── Stats / Social Proof ─────────────────────────────────────────────── */}
      <section className="relative px-4 py-20 sm:px-6">
        <div
          className="pointer-events-none absolute inset-0 opacity-5"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.03) 1px, transparent 1px)',
            backgroundSize: '32px 32px',
          }}
        />
        <div className="relative mx-auto max-w-6xl">
          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] px-8 py-12 text-center">
            <div className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-finza-green/20 bg-finza-green/10 px-3 py-1 text-xs font-medium text-finza-green">
              <TrendingUp className="h-3 w-3" />
              Estadisticas de la plataforma
            </div>
            <h2 className="mb-12 mt-2 text-2xl font-bold text-white sm:text-3xl">
              Finanzas inteligentes para latinoamerica
            </h2>
            <div className="grid grid-cols-2 gap-y-10 sm:grid-cols-4">
              <StatItem value="15+" label="Tipos de alertas inteligentes" />
              <StatItem value="5" label="Categorias de score financiero" />
              <StatItem value="DOP" label="Peso dominicano nativo" />
              <StatItem value="100%" label="Seguro con Supabase Auth" />
            </div>
          </div>
        </div>
      </section>

      {/* ── Feature Highlight — Score ─────────────────────────────────────────── */}
      <section className="px-4 py-24 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <HighlightSection
            badge="Score Financiero"
            title="Conoce tu salud financiera de un vistazo"
            description="El score de Finza evalua 5 dimensiones clave de tus finanzas y las convierte en un numero del 0 al 100. Sabes exactamente en que estas fallando y que mejorar."
            bullets={[
              'Desglose en ahorro, deudas, presupuesto, emergencias e inversiones',
              'Actualizacion en tiempo real con cada transaccion registrada',
              'Historial mensual para ver tu progreso a lo largo del tiempo',
              'Recomendaciones personalizadas basadas en tu score',
            ]}
            visual={<ScoreVisual />}
            accentColor="#3d8ef8"
          />
        </div>
      </section>

      {/* ── Feature Highlight — Notificaciones ───────────────────────────────── */}
      <section className="px-4 py-24 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <HighlightSection
            reverse
            badge="Notificaciones Inteligentes"
            title="15 alertas para que nunca pierdas una fecha"
            description="Desde presupuestos al limite hasta prestamos vencidos, Finza te avisa antes de que los problemas se vuelvan crisis. Configura las que importan y silencia el ruido."
            bullets={[
              'Alerta de presupuesto al 80%, 90% y 100% de cada categoria',
              'Recordatorio de prestamos y cuotas proximas a vencer',
              'Notificacion cuando una meta no ha recibido contribuciones',
              'Alerta de balance negativo o tasa de ahorro baja',
              'Confirmacion de logros: meses con balance positivo',
            ]}
            visual={<NotificationsVisual />}
            accentColor="#ff4060"
          />
        </div>
      </section>

      {/* ── Additional features row ───────────────────────────────────────────── */}
      <section className="px-4 py-16 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                icon: '🌙',
                title: 'Modo oscuro / claro',
                desc: 'Cambia el tema en cualquier momento desde configuracion.',
              },
              {
                icon: '📊',
                title: 'Reportes visuales',
                desc: 'Grafico de flujo mensual y distribucion de egresos por categoria.',
              },
              {
                icon: '🔁',
                title: 'Pagos recurrentes',
                desc: 'Registra suscripciones y pagos automaticos. Sabe exactamente cuanto sale cada mes.',
              },
              {
                icon: '💡',
                title: 'Retos financieros',
                desc: 'Desafios semanales y mensuales para mejorar tus habitos con gamificacion.',
              },
            ].map((item, i) => (
              <div
                key={i}
                className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5 transition-all hover:border-white/[0.1] hover:bg-white/[0.04]"
              >
                <div className="mb-3 text-2xl">{item.icon}</div>
                <h3 className="mb-1.5 text-sm font-semibold text-white">{item.title}</h3>
                <p className="text-xs leading-relaxed text-white/40">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden px-4 py-28 sm:px-6">
        {/* Background gradient */}
        <div
          className="pointer-events-none absolute inset-0 opacity-30"
          style={{
            background:
              'radial-gradient(ellipse 80% 60% at 50% 50%, #3d8ef820 0%, transparent 70%)',
          }}
        />
        <div className="relative mx-auto max-w-2xl text-center">
          <div className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-finza-green/20 bg-finza-green/10 px-3 py-1 text-xs font-medium text-finza-green">
            Empieza hoy
          </div>
          <h2 className="mb-5 text-3xl font-extrabold text-white sm:text-5xl">
            Controla tu dinero,{' '}
            <span
              className="bg-clip-text text-transparent"
              style={{
                backgroundImage: 'linear-gradient(135deg, #00dfa2 0%, #3d8ef8 100%)',
              }}
            >
              transforma tu vida
            </span>
          </h2>
          <p className="mb-8 text-base text-white/50">
            Crea tu cuenta gratis en menos de un minuto. Sin tarjeta de credito, sin compromisos.
          </p>
          <Link
            to="/register"
            className="group inline-flex items-center gap-2 rounded-xl bg-finza-blue px-10 py-4 text-base font-bold text-white shadow-xl shadow-finza-blue/30 transition-all hover:bg-finza-blue/90 hover:shadow-finza-blue/50"
          >
            Crear cuenta gratis
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
          <p className="mt-4 text-xs text-white/30">
            Ya tienes cuenta?{' '}
            <Link to="/login" className="text-finza-blue hover:underline">
              Inicia sesion aqui
            </Link>
          </p>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────────────────── */}
      <footer className="border-t border-white/[0.05] px-4 py-8 sm:px-6">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="flex items-center gap-2">
            <img src="/logo-icon-dark.png" alt="Finza" className="h-6 w-6" />
            <span className="text-sm font-semibold text-white/60">Finza</span>
          </div>
          <p className="text-xs text-white/25">
            &copy; {new Date().getFullYear()} Finza. Todos los derechos reservados.
          </p>
          <div className="flex items-center gap-5 text-xs text-white/40">
            <Link to="/login" className="hover:text-white/70 transition-colors">
              Iniciar sesion
            </Link>
            <Link to="/register" className="hover:text-white/70 transition-colors">
              Registrarse
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
