import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  Target,
  Bell,
  BookOpen,
  CreditCard,
  PiggyBank,
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
  Star,
  ChevronDown,
  ArrowRight,
} from 'lucide-react'
import { useAuthStore } from '@/store/authStore'

// ─── CSS Keyframes & Custom Styles ────────────────────────────────────────────

const STYLES = `
  @keyframes fadeInUp {
    from { opacity: 0; transform: translateY(32px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes fadeInLeft {
    from { opacity: 0; transform: translateX(-32px); }
    to   { opacity: 1; transform: translateX(0); }
  }
  @keyframes fadeInRight {
    from { opacity: 0; transform: translateX(32px); }
    to   { opacity: 1; transform: translateX(0); }
  }
  @keyframes float {
    0%, 100% { transform: translateY(0px) rotate(0deg); }
    33%       { transform: translateY(-14px) rotate(1deg); }
    66%       { transform: translateY(-7px) rotate(-1deg); }
  }
  @keyframes floatPhone {
    0%, 100% { transform: translateY(0px) rotate(3deg); }
    50%       { transform: translateY(-10px) rotate(3deg); }
  }
  @keyframes pulseGlow {
    0%, 100% { opacity: 0.35; transform: scale(1); }
    50%       { opacity: 0.65; transform: scale(1.06); }
  }
  @keyframes pulseRing {
    0%, 100% { opacity: 0.6; }
    50%       { opacity: 1; }
  }
  @keyframes rotateDash {
    from { stroke-dashoffset: 220; }
    to   { stroke-dashoffset: 0; }
  }
  @keyframes shimmer {
    0%   { transform: translateX(-100%); }
    100% { transform: translateX(200%); }
  }
  @keyframes slideDown {
    from { opacity: 0; transform: translateY(-8px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes orbFloat1 {
    0%, 100% { transform: translate(0, 0) scale(1); }
    33%       { transform: translate(60px, -80px) scale(1.1); }
    66%       { transform: translate(-40px, 40px) scale(0.95); }
  }
  @keyframes orbFloat2 {
    0%, 100% { transform: translate(0, 0) scale(1); }
    40%       { transform: translate(-70px, 60px) scale(1.08); }
    70%       { transform: translate(50px, -50px) scale(0.92); }
  }
  @keyframes orbFloat3 {
    0%, 100% { transform: translate(0, 0) scale(1); }
    50%       { transform: translate(40px, 70px) scale(1.05); }
  }
  @keyframes starTwinkle {
    0%, 100% { opacity: 0.2; }
    50%       { opacity: 0.8; }
  }
  @keyframes scoreCount {
    from { opacity: 0; }
    to   { opacity: 1; }
  }

  /* Scroll reveal */
  .reveal {
    opacity: 0;
    transform: translateY(28px);
    transition: opacity 0.65s ease, transform 0.65s ease;
  }
  .reveal.visible {
    opacity: 1;
    transform: translateY(0);
  }
  .reveal-left {
    opacity: 0;
    transform: translateX(-28px);
    transition: opacity 0.65s ease, transform 0.65s ease;
  }
  .reveal-left.visible {
    opacity: 1;
    transform: translateX(0);
  }
  .reveal-right {
    opacity: 0;
    transform: translateX(28px);
    transition: opacity 0.65s ease, transform 0.65s ease;
  }
  .reveal-right.visible {
    opacity: 1;
    transform: translateX(0);
  }

  /* Glass */
  .glass {
    background: rgba(13, 24, 41, 0.6);
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    border: 1px solid rgba(255, 255, 255, 0.07);
  }
  .glass-light {
    background: rgba(255, 255, 255, 0.04);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border: 1px solid rgba(255, 255, 255, 0.06);
  }

  /* Navbar glass */
  .navbar-glass {
    background: rgba(4, 8, 15, 0.8);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  }

  /* Feature card */
  .feature-card {
    background: rgba(13, 24, 41, 0.5);
    border: 1px solid rgba(255, 255, 255, 0.07);
    border-radius: 16px;
    transition: transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease;
  }
  .feature-card:hover {
    transform: translateY(-6px);
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.4);
    border-color: rgba(61, 142, 248, 0.3);
  }

  /* Journey card */
  .journey-card {
    background: rgba(13, 24, 41, 0.5);
    border: 1px solid rgba(255, 255, 255, 0.07);
    border-radius: 16px;
    transition: transform 0.25s ease, border-color 0.25s ease;
  }
  .journey-card:hover {
    transform: translateY(-4px);
    border-color: rgba(61, 142, 248, 0.25);
  }

  /* Testimonial card */
  .testimonial-card {
    background: rgba(13, 24, 41, 0.55);
    border: 1px solid rgba(255, 255, 255, 0.07);
    border-radius: 16px;
    transition: transform 0.25s ease, border-color 0.25s ease;
  }
  .testimonial-card:hover {
    transform: translateY(-4px);
    border-color: rgba(61, 142, 248, 0.2);
  }

  /* FAQ card */
  .faq-card {
    background: rgba(13, 24, 41, 0.5);
    border: 1px solid rgba(255, 255, 255, 0.07);
    border-radius: 14px;
    transition: border-color 0.25s ease;
  }
  .faq-card:hover {
    border-color: rgba(61, 142, 248, 0.2);
  }

  /* Secondary feature card */
  .sec-card {
    background: rgba(13, 24, 41, 0.45);
    border: 1px solid rgba(255, 255, 255, 0.06);
    border-radius: 14px;
    transition: transform 0.2s ease, border-color 0.2s ease;
  }
  .sec-card:hover {
    transform: translateY(-3px);
    border-color: rgba(61, 142, 248, 0.2);
  }

  /* Alert card */
  .alert-item {
    background: rgba(13, 24, 41, 0.6);
    border: 1px solid rgba(255, 255, 255, 0.07);
    border-radius: 12px;
    transition: border-color 0.2s ease;
  }
  .alert-item:hover {
    border-color: rgba(61, 142, 248, 0.25);
  }

  /* Gradient text */
  .gradient-text {
    background: linear-gradient(135deg, #3d8ef8, #00dfa2);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }
  .gradient-text-gold {
    background: linear-gradient(135deg, #FFC000, #ff9a3c);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  /* CTA primary button */
  .btn-primary {
    background: linear-gradient(135deg, #3d8ef8, #5B9BD5);
    border: none;
    color: white;
    font-weight: 600;
    border-radius: 10px;
    transition: opacity 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease;
    box-shadow: 0 4px 20px rgba(61, 142, 248, 0.35);
  }
  .btn-primary:hover {
    opacity: 0.92;
    transform: translateY(-2px);
    box-shadow: 0 8px 32px rgba(61, 142, 248, 0.5);
  }

  /* CTA outline button */
  .btn-outline {
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.18);
    color: rgba(255, 255, 255, 0.85);
    font-weight: 500;
    border-radius: 10px;
    transition: background 0.2s ease, border-color 0.2s ease, transform 0.2s ease;
  }
  .btn-outline:hover {
    background: rgba(255, 255, 255, 0.09);
    border-color: rgba(255, 255, 255, 0.3);
    transform: translateY(-2px);
  }

  /* Score ring animation */
  .score-ring-circle {
    stroke-dasharray: 283;
    stroke-dashoffset: 283;
    animation: rotateDash 1.8s ease-out 0.3s forwards;
    transform-origin: center;
    transform: rotate(-90deg);
  }

  /* Shimmer effect on cards */
  .shimmer-overlay {
    position: absolute;
    top: 0; left: 0;
    width: 50%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.04), transparent);
    animation: shimmer 3s ease-in-out infinite;
  }

  /* Mobile menu */
  .mobile-menu {
    animation: slideDown 0.2s ease;
  }

  /* Background grid */
  .bg-grid {
    background-image:
      linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px),
      linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px);
    background-size: 60px 60px;
  }

  /* Star particles */
  .star {
    position: absolute;
    border-radius: 50%;
    background: white;
    animation: starTwinkle var(--dur, 3s) ease-in-out var(--delay, 0s) infinite;
  }

  /* Device frame */
  .device-tablet {
    background: rgba(13, 24, 41, 0.9);
    border: 2px solid rgba(255,255,255,0.12);
    border-radius: 20px;
    box-shadow:
      0 40px 100px rgba(0,0,0,0.6),
      0 0 0 1px rgba(255,255,255,0.05),
      inset 0 1px 0 rgba(255,255,255,0.1);
    animation: float 6s ease-in-out infinite;
  }
  .device-phone {
    background: rgba(8, 15, 30, 0.95);
    border: 2px solid rgba(255,255,255,0.1);
    border-radius: 28px;
    box-shadow:
      0 30px 80px rgba(0,0,0,0.5),
      0 0 0 1px rgba(255,255,255,0.04);
    animation: floatPhone 5s ease-in-out 1s infinite;
  }

  /* Responsive utilities */
  @media (max-width: 768px) {
    .hero-devices {
      display: none;
    }
    .split-reverse {
      flex-direction: column-reverse !important;
    }
  }
`

// ─── useScrollReveal Hook ─────────────────────────────────────────────────────

function useScrollReveal() {
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible')
          }
        })
      },
      { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
    )
    const elements = document.querySelectorAll('.reveal, .reveal-left, .reveal-right')
    elements.forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [])
}

// ─── useCountUp Hook ──────────────────────────────────────────────────────────

function useCountUp(target: number, duration = 1800, start = false) {
  const [count, setCount] = useState(0)
  useEffect(() => {
    if (!start) return
    let startTime: number | null = null
    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp
      const progress = Math.min((timestamp - startTime) / duration, 1)
      setCount(Math.floor(progress * target))
      if (progress < 1) requestAnimationFrame(step)
    }
    requestAnimationFrame(step)
  }, [start, target, duration])
  return count
}

// ─── StarParticles ────────────────────────────────────────────────────────────

function StarParticles() {
  const stars = Array.from({ length: 60 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 2 + 0.5,
    dur: (Math.random() * 4 + 2).toFixed(1),
    delay: (Math.random() * 4).toFixed(1),
  }))
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
      {stars.map((s) => (
        <div
          key={s.id}
          className="star"
          style={{
            left: `${s.x}%`,
            top: `${s.y}%`,
            width: s.size,
            height: s.size,
            // @ts-expect-error css custom props
            '--dur': `${s.dur}s`,
            '--delay': `${s.delay}s`,
          }}
        />
      ))}
    </div>
  )
}

// ─── ScoreRing ────────────────────────────────────────────────────────────────

function ScoreRing({ score = 74 }: { score?: number }) {
  const r = 45
  const circumference = 2 * Math.PI * r
  const offset = circumference - (score / 100) * circumference

  const color =
    score >= 80 ? '#00dfa2' : score >= 60 ? '#3d8ef8' : score >= 40 ? '#FFC000' : '#ff4060'

  return (
    <div className="relative flex items-center justify-center" style={{ width: 140, height: 140 }}>
      <svg width="140" height="140" viewBox="0 0 100 100" className="absolute inset-0" aria-hidden="true">
        <circle cx="50" cy="50" r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="8" />
        <circle
          cx="50"
          cy="50"
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="score-ring-circle"
          style={{ filter: `drop-shadow(0 0 8px ${color}80)` }}
        />
      </svg>
      <div className="text-center z-10">
        <div className="font-bold text-3xl text-white leading-none">{score}</div>
        <div className="text-xs mt-0.5" style={{ color }}>Bueno</div>
      </div>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function LandingPage(): JSX.Element {
  const { t } = useTranslation()
  const { user } = useAuthStore()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [statsVisible, setStatsVisible] = useState(false)
  const statsRef = useRef<HTMLDivElement>(null)

  useScrollReveal()

  // Trigger countup when stats band enters viewport
  useEffect(() => {
    if (!statsRef.current) return
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setStatsVisible(true) },
      { threshold: 0.3 }
    )
    obs.observe(statsRef.current)
    return () => obs.disconnect()
  }, [])

  const scoreCount = useCountUp(74, 1600, statsVisible)

  const ctaHref = user ? '/dashboard' : '/register'
  const ctaLabel = user ? t('landing.ctaDashboard') : t('landing.ctaStart')

  // ── Feature data ──────────────────────────────────────────────────────────
  const features = [
    {
      icon: <BarChart3 size={22} />,
      title: t('landing.feature1Title'),
      desc: t('landing.feature1Desc'),
      color: '#3d8ef8',
      bg: 'rgba(61,142,248,0.12)',
    },
    {
      icon: <PiggyBank size={22} />,
      title: t('landing.feature2Title'),
      desc: t('landing.feature2Desc'),
      color: '#00dfa2',
      bg: 'rgba(0,223,162,0.12)',
    },
    {
      icon: <Target size={22} />,
      title: t('landing.feature3Title'),
      desc: t('landing.feature3Desc'),
      color: '#9768ff',
      bg: 'rgba(151,104,255,0.12)',
    },
    {
      icon: <CreditCard size={22} />,
      title: t('landing.feature4Title'),
      desc: t('landing.feature4Desc'),
      color: '#FFC000',
      bg: 'rgba(255,192,0,0.12)',
    },
    {
      icon: <Bell size={22} />,
      title: t('landing.feature5Title'),
      desc: t('landing.feature5Desc'),
      color: '#ff4060',
      bg: 'rgba(255,64,96,0.12)',
    },
    {
      icon: <BookOpen size={22} />,
      title: t('landing.feature6Title'),
      desc: t('landing.feature6Desc'),
      color: '#5B9BD5',
      bg: 'rgba(91,155,213,0.12)',
    },
  ]

  // ── Secondary features ────────────────────────────────────────────────────
  const extras = [
    { icon: <Moon size={20} />, title: t('landing.extra1Title'), desc: t('landing.extra1Desc'), color: '#9768ff' },
    { icon: <BarChart2 size={20} />, title: t('landing.extra2Title'), desc: t('landing.extra2Desc'), color: '#00dfa2' },
    { icon: <RefreshCw size={20} />, title: t('landing.extra3Title'), desc: t('landing.extra3Desc'), color: '#3d8ef8' },
    { icon: <Lightbulb size={20} />, title: t('landing.extra4Title'), desc: t('landing.extra4Desc'), color: '#FFC000' },
  ]

  // ── Alert samples ─────────────────────────────────────────────────────────
  const alertSamples = [
    {
      icon: '⚠️', color: '#FFC000', bg: 'rgba(255,192,0,0.12)',
      title: t('landing.alertSample1Title'),
      body: t('landing.alertSample1Body'),
      time: t('landing.alertSample1Time'),
    },
    {
      icon: '🎯', color: '#9768ff', bg: 'rgba(151,104,255,0.12)',
      title: t('landing.alertSample2Title'),
      body: t('landing.alertSample2Body'),
      time: t('landing.alertSample2Time'),
    },
    {
      icon: '🔔', color: '#ff4060', bg: 'rgba(255,64,96,0.12)',
      title: t('landing.alertSample3Title'),
      body: t('landing.alertSample3Body'),
      time: t('landing.alertSample3Time'),
    },
    {
      icon: '✅', color: '#00dfa2', bg: 'rgba(0,223,162,0.12)',
      title: t('landing.alertSample4Title'),
      body: t('landing.alertSample4Body'),
      time: t('landing.alertSample4Time'),
    },
  ]

  // ── Testimonials ──────────────────────────────────────────────────────────
  const testimonials = [
    {
      name: t('landing.t1Name'),
      location: t('landing.t1Location'),
      quote: t('landing.t1Quote'),
      initials: 'LM',
      color: '#3d8ef8',
    },
    {
      name: t('landing.t2Name'),
      location: t('landing.t2Location'),
      quote: t('landing.t2Quote'),
      initials: 'CR',
      color: '#00dfa2',
    },
    {
      name: t('landing.t3Name'),
      location: t('landing.t3Location'),
      quote: t('landing.t3Quote'),
      initials: 'AP',
      color: '#9768ff',
    },
  ]

  // ── FAQ ───────────────────────────────────────────────────────────────────
  const faqs = [
    { q: t('landing.faq1Q'), a: t('landing.faq1A') },
    { q: t('landing.faq2Q'), a: t('landing.faq2A') },
    { q: t('landing.faq3Q'), a: t('landing.faq3A') },
    { q: t('landing.faq4Q'), a: t('landing.faq4A') },
  ]

  return (
    <>
      {/* Inject styles once */}
      <style dangerouslySetInnerHTML={{ __html: STYLES }} />

      <div
        style={{
          background: '#04080f',
          color: 'rgba(255,255,255,0.87)',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          overflowX: 'hidden',
          minHeight: '100vh',
        }}
      >
        {/* ── NAVBAR ─────────────────────────────────────────────────────── */}
        <header
          className="navbar-glass sticky top-0 z-50"
          role="banner"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2.5" aria-label="Finza inicio">
              <img src="/logo.svg" alt="Finza" className="w-8 h-8" />
              <span className="font-bold text-lg text-white tracking-tight">Finza</span>
            </Link>

            {/* Desktop nav */}
            <nav className="hidden md:flex items-center gap-7" aria-label="Navegacion principal">
              {[
                { label: t('landing.navFeatures'), href: '#features' },
                { label: t('landing.navScore'), href: '#score' },
                { label: t('landing.navAlerts'), href: '#alerts' },
                { label: t('landing.navFaq'), href: '#faq' },
              ].map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  className="text-sm font-medium transition-colors"
                  style={{ color: 'rgba(255,255,255,0.6)' }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.95)')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.6)')}
                >
                  {item.label}
                </a>
              ))}
            </nav>

            {/* Desktop CTAs */}
            <div className="hidden md:flex items-center gap-3">
              {user ? (
                <Link to="/dashboard" className="btn-primary text-sm px-5 py-2">
                  {t('landing.ctaDashboard')}
                </Link>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="text-sm font-medium transition-colors"
                    style={{ color: 'rgba(255,255,255,0.65)' }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = 'white')}
                    onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.65)')}
                  >
                    {t('landing.navLogin')}
                  </Link>
                  <Link to="/register" className="btn-primary text-sm px-5 py-2">
                    {t('landing.navCta')}
                  </Link>
                </>
              )}
            </div>

            {/* Mobile hamburger */}
            <button
              className="md:hidden p-2 rounded-lg transition-colors"
              style={{ color: 'rgba(255,255,255,0.7)' }}
              onClick={() => setMobileOpen((v) => !v)}
              aria-label={mobileOpen ? 'Cerrar menu' : 'Abrir menu'}
              aria-expanded={mobileOpen}
            >
              {mobileOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>

          {/* Mobile menu */}
          {mobileOpen && (
            <div
              className="mobile-menu md:hidden glass-light border-t"
              style={{ borderColor: 'rgba(255,255,255,0.06)' }}
            >
              <nav className="max-w-7xl mx-auto px-4 py-4 flex flex-col gap-3">
                {[
                  { label: t('landing.navFeatures'), href: '#features' },
                  { label: t('landing.navScore'), href: '#score' },
                  { label: t('landing.navAlerts'), href: '#alerts' },
                  { label: t('landing.navFaq'), href: '#faq' },
                ].map((item) => (
                  <a
                    key={item.href}
                    href={item.href}
                    className="text-sm font-medium py-2"
                    style={{ color: 'rgba(255,255,255,0.7)' }}
                    onClick={() => setMobileOpen(false)}
                  >
                    {item.label}
                  </a>
                ))}
                <div className="flex flex-col gap-2 pt-2 border-t" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
                  {!user && (
                    <Link to="/login" className="btn-outline text-sm text-center py-2.5 px-4">
                      {t('landing.navLogin')}
                    </Link>
                  )}
                  <Link
                    to={ctaHref}
                    className="btn-primary text-sm text-center py-2.5 px-4"
                    onClick={() => setMobileOpen(false)}
                  >
                    {ctaLabel}
                  </Link>
                </div>
              </nav>
            </div>
          )}
        </header>

        {/* ── HERO ───────────────────────────────────────────────────────── */}
        <section
          className="relative overflow-hidden"
          style={{
            background: 'radial-gradient(ellipse 80% 50% at 20% 40%, rgba(61,142,248,0.12) 0%, transparent 60%), radial-gradient(ellipse 60% 40% at 80% 60%, rgba(0,223,162,0.07) 0%, transparent 50%), #04080f',
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <StarParticles />

          {/* Background grid */}
          <div className="absolute inset-0 bg-grid opacity-40 pointer-events-none" aria-hidden="true" />

          {/* Orbs */}
          <div
            className="absolute rounded-full pointer-events-none"
            style={{
              width: 600,
              height: 600,
              top: '-10%',
              left: '-15%',
              background: 'radial-gradient(circle, rgba(61,142,248,0.18) 0%, transparent 70%)',
              animation: 'orbFloat1 18s ease-in-out infinite',
            }}
            aria-hidden="true"
          />
          <div
            className="absolute rounded-full pointer-events-none"
            style={{
              width: 500,
              height: 500,
              bottom: '-5%',
              right: '-10%',
              background: 'radial-gradient(circle, rgba(0,223,162,0.12) 0%, transparent 70%)',
              animation: 'orbFloat2 22s ease-in-out infinite',
            }}
            aria-hidden="true"
          />

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 w-full py-24 lg:py-0" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center' }}>
            <div className="flex flex-col lg:flex-row items-center gap-16 w-full">
              {/* Left: copy */}
              <div className="flex-1 max-w-xl">
                {/* Badge */}
                <div
                  className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium mb-8"
                  style={{
                    background: 'rgba(61,142,248,0.12)',
                    border: '1px solid rgba(61,142,248,0.25)',
                    color: '#5B9BD5',
                    animation: 'fadeInUp 0.6s ease both',
                  }}
                >
                  <span aria-hidden="true">✨</span>
                  {t('landing.badge')}
                </div>

                {/* Headline */}
                <h1
                  className="font-bold leading-tight mb-6"
                  style={{
                    fontSize: 'clamp(2.5rem, 5vw, 4rem)',
                    animation: 'fadeInUp 0.6s ease 0.1s both',
                  }}
                >
                  <span className="text-white">{t('landing.headline1')}</span>
                  <br />
                  <span className="gradient-text">{t('landing.headline2')}</span>
                </h1>

                {/* Subheadline */}
                <p
                  className="text-base leading-relaxed mb-8"
                  style={{
                    color: 'rgba(255,255,255,0.55)',
                    animation: 'fadeInUp 0.6s ease 0.2s both',
                  }}
                >
                  {t('landing.subheadline')}
                </p>

                {/* CTAs */}
                <div
                  className="flex flex-wrap gap-3 mb-10"
                  style={{ animation: 'fadeInUp 0.6s ease 0.3s both' }}
                >
                  <Link
                    to={ctaHref}
                    className="btn-primary flex items-center gap-2 px-6 py-3 text-sm"
                  >
                    {ctaLabel}
                    <ArrowRight size={16} aria-hidden="true" />
                  </Link>
                  <a
                    href="#features"
                    className="btn-outline flex items-center gap-2 px-6 py-3 text-sm"
                  >
                    {t('landing.ctaExplore')}
                    <ChevronDown size={16} aria-hidden="true" />
                  </a>
                </div>

                {/* Trust bullets */}
                <div
                  className="flex flex-wrap gap-x-5 gap-y-2"
                  style={{ animation: 'fadeInUp 0.6s ease 0.4s both' }}
                >
                  {[
                    t('landing.trust1'),
                    t('landing.trust2'),
                    t('landing.trust3'),
                  ].map((item) => (
                    <div
                      key={item}
                      className="flex items-center gap-1.5 text-xs"
                      style={{ color: 'rgba(255,255,255,0.5)' }}
                    >
                      <CheckCircle size={13} style={{ color: '#00dfa2' }} aria-hidden="true" />
                      {item}
                    </div>
                  ))}
                </div>
              </div>

              {/* Right: device mockup */}
              <div
                className="hero-devices flex-shrink-0 relative"
                style={{
                  width: 420,
                  height: 400,
                  animation: 'fadeInRight 0.8s ease 0.3s both',
                }}
                aria-hidden="true"
              >
                {/* Tablet */}
                <div
                  className="device-tablet absolute"
                  style={{
                    width: 300,
                    height: 220,
                    top: 30,
                    left: 0,
                    padding: 16,
                    transform: 'rotate(-4deg)',
                  }}
                >
                  {/* Mini dashboard UI */}
                  <div className="flex items-center gap-2 mb-3">
                    <img src="/logo.svg" alt="" className="w-5 h-5" />
                    <span className="text-xs font-bold text-white">Finza</span>
                    <div className="ml-auto flex gap-1">
                      {[0,1,2].map(i => (
                        <div key={i} className="w-1.5 h-1.5 rounded-full" style={{ background: i===0?'#ff4060':i===1?'#FFC000':'#00dfa2', opacity: 0.7 }} />
                      ))}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    {[
                      { label: 'Balance', val: 'DOP 24,500', color: '#00dfa2' },
                      { label: 'Egresos', val: 'DOP 8,200', color: '#ff4060' },
                    ].map((c) => (
                      <div key={c.label} className="rounded-lg p-2" style={{ background: 'rgba(255,255,255,0.05)' }}>
                        <div className="text-xs mb-1" style={{ color: 'rgba(255,255,255,0.45)' }}>{c.label}</div>
                        <div className="text-sm font-bold" style={{ color: c.color }}>{c.val}</div>
                      </div>
                    ))}
                  </div>
                  {/* Mini bar chart */}
                  <div className="flex items-end gap-1.5" style={{ height: 48 }}>
                    {[35, 60, 45, 80, 55, 70, 90].map((h, i) => (
                      <div
                        key={i}
                        className="flex-1 rounded-sm"
                        style={{
                          height: `${h}%`,
                          background: i === 6
                            ? 'linear-gradient(to top, #3d8ef8, #00dfa2)'
                            : 'rgba(61,142,248,0.35)',
                        }}
                      />
                    ))}
                  </div>
                </div>

                {/* Phone */}
                <div
                  className="device-phone absolute"
                  style={{
                    width: 160,
                    height: 260,
                    top: 60,
                    right: 0,
                    padding: 14,
                    transform: 'rotate(3deg)',
                  }}
                >
                  {/* Score ring on phone */}
                  <div className="flex justify-center mb-3">
                    <ScoreRing score={scoreCount || 74} />
                  </div>
                  {/* Score bars */}
                  {[
                    { label: 'Ahorro', pct: 72, color: '#00dfa2' },
                    { label: 'Deudas', pct: 58, color: '#3d8ef8' },
                    { label: 'Presup.', pct: 85, color: '#9768ff' },
                  ].map((b) => (
                    <div key={b.label} className="mb-1.5">
                      <div className="flex justify-between text-xs mb-0.5" style={{ color: 'rgba(255,255,255,0.5)' }}>
                        <span>{b.label}</span>
                        <span>{b.pct}</span>
                      </div>
                      <div className="rounded-full" style={{ height: 4, background: 'rgba(255,255,255,0.08)' }}>
                        <div
                          className="rounded-full h-full"
                          style={{ width: `${b.pct}%`, background: b.color }}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Glow behind devices */}
                <div
                  className="absolute rounded-full pointer-events-none"
                  style={{
                    width: 300,
                    height: 300,
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    background: 'radial-gradient(circle, rgba(61,142,248,0.2) 0%, transparent 70%)',
                    animation: 'pulseGlow 4s ease-in-out infinite',
                  }}
                  aria-hidden="true"
                />
              </div>
            </div>
          </div>

          {/* Scroll indicator */}
          <div
            className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1"
            style={{ color: 'rgba(255,255,255,0.3)', animation: 'float 2.5s ease-in-out infinite' }}
            aria-hidden="true"
          >
            <ChevronDown size={18} />
          </div>
        </section>

        {/* ── STATS BAND ─────────────────────────────────────────────────── */}
        <section
          ref={statsRef}
          className="relative py-12"
          style={{ background: 'rgba(8,15,30,0.8)' }}
          aria-label="Estadisticas"
        >
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ borderTop: '1px solid rgba(255,255,255,0.06)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}
            aria-hidden="true"
          />
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {[
                { value: t('landing.stat1Value'), label: t('landing.stat1Label'), color: '#3d8ef8' },
                { value: t('landing.stat2Value'), label: t('landing.stat2Label'), color: '#00dfa2' },
                { value: t('landing.stat3Value'), label: t('landing.stat3Label'), color: '#9768ff' },
                { value: t('landing.stat4Value'), label: t('landing.stat4Label'), color: '#FFC000' },
              ].map((stat, i) => (
                <div
                  key={i}
                  className="glass rounded-2xl p-6 text-center reveal"
                  style={{ transitionDelay: `${i * 0.1}s` }}
                >
                  <div
                    className="text-3xl font-bold mb-1"
                    style={{ color: stat.color, textShadow: `0 0 20px ${stat.color}60` }}
                  >
                    {stat.value}
                  </div>
                  <div className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── FEATURES ───────────────────────────────────────────────────── */}
        <section
          id="features"
          className="py-24 relative"
          style={{ background: '#04080f' }}
          aria-labelledby="features-heading"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            {/* Section header */}
            <div className="text-center mb-16 reveal">
              <div
                className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-medium mb-5"
                style={{ background: 'rgba(61,142,248,0.1)', border: '1px solid rgba(61,142,248,0.2)', color: '#5B9BD5' }}
              >
                <Zap size={12} aria-hidden="true" />
                Funciones
              </div>
              <h2
                id="features-heading"
                className="font-bold mb-4 text-white"
                style={{ fontSize: 'clamp(1.75rem, 3vw, 2.5rem)' }}
              >
                {t('landing.featuresTitle')}
              </h2>
              <p className="max-w-xl mx-auto text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.5)' }}>
                {t('landing.featuresSub')}
              </p>
            </div>

            {/* Feature grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {features.map((f, i) => (
                <div
                  key={i}
                  className="feature-card p-6 relative overflow-hidden reveal"
                  style={{ transitionDelay: `${i * 0.08}s` }}
                >
                  <div className="shimmer-overlay" aria-hidden="true" />
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center mb-4"
                    style={{ background: f.bg, color: f.color }}
                    aria-hidden="true"
                  >
                    {f.icon}
                  </div>
                  <h3 className="font-semibold text-base text-white mb-2">{f.title}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.5)' }}>
                    {f.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── SCORE SHOWCASE ─────────────────────────────────────────────── */}
        <section
          id="score"
          className="py-24 relative overflow-hidden"
          style={{
            background: 'radial-gradient(ellipse 70% 60% at 80% 50%, rgba(61,142,248,0.08) 0%, transparent 60%), #080f1e',
          }}
          aria-labelledby="score-heading"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="flex flex-col lg:flex-row items-center gap-16">
              {/* Left: copy */}
              <div className="flex-1 reveal-left">
                <div
                  className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-medium mb-6"
                  style={{ background: 'rgba(61,142,248,0.1)', border: '1px solid rgba(61,142,248,0.2)', color: '#5B9BD5' }}
                >
                  <BarChart3 size={12} aria-hidden="true" />
                  Score Financiero
                </div>
                <h2
                  id="score-heading"
                  className="font-bold text-white mb-4"
                  style={{ fontSize: 'clamp(1.75rem, 3vw, 2.5rem)' }}
                >
                  {t('landing.scoreTitle')}
                </h2>
                <p className="text-sm leading-relaxed mb-8" style={{ color: 'rgba(255,255,255,0.5)' }}>
                  {t('landing.scoreDesc')}
                </p>
                <ul className="space-y-3">
                  {[
                    t('landing.scoreBullet1'),
                    t('landing.scoreBullet2'),
                    t('landing.scoreBullet3'),
                    t('landing.scoreBullet4'),
                  ].map((b) => (
                    <li key={b} className="flex items-start gap-3 text-sm" style={{ color: 'rgba(255,255,255,0.7)' }}>
                      <CheckCircle size={16} className="mt-0.5 flex-shrink-0" style={{ color: '#00dfa2' }} aria-hidden="true" />
                      {b}
                    </li>
                  ))}
                </ul>
                <Link
                  to={ctaHref}
                  className="btn-primary inline-flex items-center gap-2 px-6 py-3 text-sm mt-8"
                >
                  {ctaLabel}
                  <ArrowRight size={15} aria-hidden="true" />
                </Link>
              </div>

              {/* Right: score card */}
              <div className="flex-shrink-0 reveal-right">
                <div
                  className="glass rounded-2xl p-8 relative overflow-hidden"
                  style={{ width: 320 }}
                >
                  <div className="shimmer-overlay" aria-hidden="true" />
                  {/* Header */}
                  <div className="flex items-center gap-2 mb-6">
                    <img src="/logo.svg" alt="" className="w-6 h-6" aria-hidden="true" />
                    <span className="text-sm font-semibold text-white">Score Financiero</span>
                  </div>

                  {/* Ring */}
                  <div className="flex justify-center mb-6">
                    <ScoreRing score={74} />
                  </div>

                  {/* Dimension bars */}
                  <div className="space-y-3">
                    {[
                      { label: 'Ahorro', score: 72, color: '#00dfa2' },
                      { label: 'Deudas', score: 58, color: '#3d8ef8' },
                      { label: 'Presupuesto', score: 85, color: '#9768ff' },
                      { label: 'Emergencias', score: 45, color: '#FFC000' },
                    ].map((d) => (
                      <div key={d.label}>
                        <div className="flex justify-between text-xs mb-1.5" style={{ color: 'rgba(255,255,255,0.55)' }}>
                          <span>{d.label}</span>
                          <span style={{ color: d.color }}>{d.score}</span>
                        </div>
                        <div className="rounded-full" style={{ height: 6, background: 'rgba(255,255,255,0.07)' }}>
                          <div
                            className="rounded-full h-full"
                            style={{
                              width: `${d.score}%`,
                              background: `linear-gradient(90deg, ${d.color}80, ${d.color})`,
                              boxShadow: `0 0 8px ${d.color}50`,
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── ALERTS SHOWCASE ────────────────────────────────────────────── */}
        <section
          id="alerts"
          className="py-24 relative overflow-hidden"
          style={{
            background: 'radial-gradient(ellipse 60% 50% at 20% 50%, rgba(0,223,162,0.07) 0%, transparent 60%), #04080f',
          }}
          aria-labelledby="alerts-heading"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="flex flex-col lg:flex-row items-center gap-16">
              {/* Left: alert list */}
              <div className="flex-shrink-0 w-full lg:w-auto reveal-left order-2 lg:order-1">
                <div className="space-y-3" style={{ maxWidth: 360 }}>
                  {alertSamples.map((a, i) => (
                    <div
                      key={i}
                      className="alert-item flex items-start gap-3 p-4"
                      style={{ transitionDelay: `${i * 0.08}s` }}
                    >
                      <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-base"
                        style={{ background: a.bg }}
                        aria-hidden="true"
                      >
                        {a.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <span className="text-sm font-medium text-white">{a.title}</span>
                          <span className="text-xs flex-shrink-0" style={{ color: 'rgba(255,255,255,0.35)' }}>{a.time}</span>
                        </div>
                        <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.5)' }}>{a.body}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right: copy */}
              <div className="flex-1 reveal-right order-1 lg:order-2">
                <div
                  className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-medium mb-6"
                  style={{ background: 'rgba(0,223,162,0.1)', border: '1px solid rgba(0,223,162,0.2)', color: '#00dfa2' }}
                >
                  <Bell size={12} aria-hidden="true" />
                  Alertas Inteligentes
                </div>
                <h2
                  id="alerts-heading"
                  className="font-bold text-white mb-4"
                  style={{ fontSize: 'clamp(1.75rem, 3vw, 2.5rem)' }}
                >
                  {t('landing.alertsTitle')}
                </h2>
                <p className="text-sm leading-relaxed mb-8" style={{ color: 'rgba(255,255,255,0.5)' }}>
                  {t('landing.alertsDesc')}
                </p>
                <ul className="space-y-3">
                  {[
                    t('landing.alertsBullet1'),
                    t('landing.alertsBullet2'),
                    t('landing.alertsBullet3'),
                    t('landing.alertsBullet4'),
                  ].map((b) => (
                    <li key={b} className="flex items-start gap-3 text-sm" style={{ color: 'rgba(255,255,255,0.7)' }}>
                      <CheckCircle size={16} className="mt-0.5 flex-shrink-0" style={{ color: '#00dfa2' }} aria-hidden="true" />
                      {b}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* ── SECONDARY FEATURES ─────────────────────────────────────────── */}
        <section
          className="py-20 relative"
          style={{ background: '#080f1e' }}
          aria-label="Funciones adicionales"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="text-center mb-12 reveal">
              <h2
                className="font-bold text-white mb-3"
                style={{ fontSize: 'clamp(1.5rem, 2.5vw, 2rem)' }}
              >
                Y mucho mas...
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {extras.map((e, i) => (
                <div
                  key={i}
                  className="sec-card p-5 reveal"
                  style={{ transitionDelay: `${i * 0.08}s` }}
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
                    style={{ background: `${e.color}18`, color: e.color }}
                    aria-hidden="true"
                  >
                    {e.icon}
                  </div>
                  <h3 className="font-semibold text-sm text-white mb-1.5">{e.title}</h3>
                  <p className="text-xs leading-relaxed" style={{ color: 'rgba(255,255,255,0.48)' }}>
                    {e.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── JOURNEY ────────────────────────────────────────────────────── */}
        <section
          className="py-24 relative"
          style={{ background: '#04080f' }}
          aria-labelledby="journey-heading"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="text-center mb-16 reveal">
              <h2
                id="journey-heading"
                className="font-bold text-white mb-3"
                style={{ fontSize: 'clamp(1.75rem, 3vw, 2.5rem)' }}
              >
                {t('landing.journeyTitle')}
              </h2>
              <p className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>
                {t('landing.journeySub')}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
              {/* Connecting line */}
              <div
                className="hidden md:block absolute top-12 left-1/6 right-1/6 h-px pointer-events-none"
                style={{ background: 'linear-gradient(90deg, transparent, rgba(61,142,248,0.3), rgba(61,142,248,0.3), transparent)' }}
                aria-hidden="true"
              />

              {[
                { step: t('landing.journey1Step'), title: t('landing.journey1Title'), desc: t('landing.journey1Desc'), color: '#3d8ef8' },
                { step: t('landing.journey2Step'), title: t('landing.journey2Title'), desc: t('landing.journey2Desc'), color: '#00dfa2' },
                { step: t('landing.journey3Step'), title: t('landing.journey3Title'), desc: t('landing.journey3Desc'), color: '#9768ff' },
              ].map((j, i) => (
                <div
                  key={i}
                  className="journey-card p-7 text-center reveal"
                  style={{ transitionDelay: `${i * 0.12}s` }}
                >
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-lg mx-auto mb-5"
                    style={{ background: `${j.color}18`, color: j.color, border: `1px solid ${j.color}35` }}
                    aria-hidden="true"
                  >
                    {j.step}
                  </div>
                  <h3 className="font-semibold text-base text-white mb-2">{j.title}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.5)' }}>
                    {j.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── TESTIMONIALS ───────────────────────────────────────────────── */}
        <section
          className="py-24 relative"
          style={{ background: '#080f1e' }}
          aria-labelledby="testimonials-heading"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="text-center mb-16 reveal">
              <h2
                id="testimonials-heading"
                className="font-bold text-white mb-3"
                style={{ fontSize: 'clamp(1.75rem, 3vw, 2.5rem)' }}
              >
                {t('landing.testimonialsTitle')}
              </h2>
              <p className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>
                {t('landing.testimonialsSub')}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {testimonials.map((tm, i) => (
                <div
                  key={i}
                  className="testimonial-card p-6 flex flex-col reveal"
                  style={{ transitionDelay: `${i * 0.1}s` }}
                >
                  {/* Stars */}
                  <div className="flex gap-1 mb-4" aria-label="5 estrellas">
                    {Array.from({ length: 5 }).map((_, s) => (
                      <Star key={s} size={14} fill="#FFC000" stroke="none" aria-hidden="true" />
                    ))}
                  </div>

                  {/* Quote */}
                  <blockquote
                    className="text-sm leading-relaxed flex-1 mb-6"
                    style={{ color: 'rgba(255,255,255,0.65)' }}
                  >
                    &ldquo;{tm.quote}&rdquo;
                  </blockquote>

                  {/* Author */}
                  <div className="flex items-center gap-3">
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                      style={{ background: `${tm.color}25`, color: tm.color }}
                      aria-hidden="true"
                    >
                      {tm.initials}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-white">{tm.name}</div>
                      <div className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
                        {tm.location}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── FAQ ────────────────────────────────────────────────────────── */}
        <section
          id="faq"
          className="py-24 relative"
          style={{ background: '#04080f' }}
          aria-labelledby="faq-heading"
        >
          <div className="max-w-4xl mx-auto px-4 sm:px-6">
            <div className="text-center mb-16 reveal">
              <h2
                id="faq-heading"
                className="font-bold text-white mb-3"
                style={{ fontSize: 'clamp(1.75rem, 3vw, 2.5rem)' }}
              >
                {t('landing.faqTitle')}
              </h2>
              <p className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>
                {t('landing.faqSub')}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {faqs.map((faq, i) => (
                <div
                  key={i}
                  className="faq-card p-6 reveal"
                  style={{ transitionDelay: `${i * 0.08}s` }}
                >
                  <h3 className="font-semibold text-sm text-white mb-2 flex items-start gap-2">
                    <span
                      className="w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 text-xs font-bold mt-0.5"
                      style={{ background: 'rgba(61,142,248,0.15)', color: '#3d8ef8' }}
                      aria-hidden="true"
                    >
                      ?
                    </span>
                    {faq.q}
                  </h3>
                  <p className="text-sm leading-relaxed pl-7" style={{ color: 'rgba(255,255,255,0.5)' }}>
                    {faq.a}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── CTA FINAL ──────────────────────────────────────────────────── */}
        <section
          className="py-24 relative overflow-hidden"
          style={{ background: '#080f1e' }}
          aria-label="Llamada a la accion"
        >
          {/* Background orbs */}
          <div
            className="absolute rounded-full pointer-events-none"
            style={{
              width: 500,
              height: 500,
              top: '50%',
              left: '25%',
              transform: 'translate(-50%, -50%)',
              background: 'radial-gradient(circle, rgba(61,142,248,0.12) 0%, transparent 70%)',
              animation: 'pulseGlow 5s ease-in-out infinite',
            }}
            aria-hidden="true"
          />
          <div
            className="absolute rounded-full pointer-events-none"
            style={{
              width: 400,
              height: 400,
              top: '50%',
              right: '10%',
              transform: 'translateY(-50%)',
              background: 'radial-gradient(circle, rgba(0,223,162,0.08) 0%, transparent 70%)',
              animation: 'pulseGlow 6s ease-in-out 1s infinite',
            }}
            aria-hidden="true"
          />

          <div className="max-w-7xl mx-auto px-4 sm:px-6 relative">
            <div className="flex flex-col lg:flex-row items-center gap-16">
              {/* Left: main CTA copy */}
              <div className="flex-1 reveal-left">
                <div
                  className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-medium mb-6"
                  style={{ background: 'rgba(61,142,248,0.1)', border: '1px solid rgba(61,142,248,0.2)', color: '#5B9BD5' }}
                >
                  <Zap size={12} aria-hidden="true" />
                  {t('landing.ctaFinalBadge')}
                </div>
                <h2
                  className="font-bold text-white mb-4"
                  style={{ fontSize: 'clamp(1.75rem, 3.5vw, 3rem)' }}
                >
                  {t('landing.ctaFinalTitle1')}
                  <br />
                  <span className="gradient-text">{t('landing.ctaFinalTitle2')}</span>
                </h2>
                <p className="text-sm leading-relaxed mb-8" style={{ color: 'rgba(255,255,255,0.5)' }}>
                  {t('landing.ctaFinalSub')}
                </p>
                <Link
                  to={ctaHref}
                  className="btn-primary inline-flex items-center gap-2 px-8 py-3.5 text-base font-semibold"
                >
                  {t('landing.ctaFinalBtn')}
                  <ArrowRight size={18} aria-hidden="true" />
                </Link>
                {!user && (
                  <div className="mt-4 text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>
                    {t('landing.ctaFinalHaveAccount')}{' '}
                    <Link
                      to="/login"
                      className="transition-colors"
                      style={{ color: '#3d8ef8' }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = '#5B9BD5')}
                      onMouseLeave={(e) => (e.currentTarget.style.color = '#3d8ef8')}
                    >
                      {t('landing.ctaFinalSignIn')}
                    </Link>
                  </div>
                )}
              </div>

              {/* Right: proof panel */}
              <div className="flex-shrink-0 reveal-right">
                <div
                  className="glass rounded-2xl p-8 relative overflow-hidden"
                  style={{ width: 300 }}
                >
                  <div className="shimmer-overlay" aria-hidden="true" />
                  <div className="text-center mb-6">
                    <img src="/logo.svg" alt="Finza" className="w-12 h-12 mx-auto mb-3" />
                    <div className="font-bold text-lg text-white">Finza</div>
                    <div className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.45)' }}>
                      App de finanzas personales
                    </div>
                  </div>
                  <div className="space-y-3">
                    {[
                      { icon: <CheckCircle size={14} />, label: t('landing.ctaProof1'), color: '#00dfa2' },
                      { icon: <CheckCircle size={14} />, label: t('landing.ctaProof2'), color: '#00dfa2' },
                      { icon: <CheckCircle size={14} />, label: t('landing.ctaProof3'), color: '#00dfa2' },
                      { icon: <Shield size={14} />, label: 'Datos protegidos con RLS', color: '#3d8ef8' },
                    ].map((p, i) => (
                      <div key={i} className="flex items-center gap-3 text-sm" style={{ color: 'rgba(255,255,255,0.65)' }}>
                        <span style={{ color: p.color }} aria-hidden="true">{p.icon}</span>
                        {p.label}
                      </div>
                    ))}
                  </div>
                  <div
                    className="mt-6 pt-5 text-center text-xs"
                    style={{ borderTop: '1px solid rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.3)' }}
                  >
                    Republica Dominicana · LatAm
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── FOOTER ─────────────────────────────────────────────────────── */}
        <footer
          className="relative"
          style={{
            background: '#04080f',
            borderTop: '1px solid rgba(255,255,255,0.06)',
          }}
          role="contentinfo"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              {/* Brand */}
              <div className="flex items-center gap-2.5">
                <img src="/logo.svg" alt="Finza" className="w-7 h-7" />
                <div>
                  <div className="font-bold text-base text-white">Finza</div>
                  <div className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>
                    {t('landing.footerTagline')}
                  </div>
                </div>
              </div>

              {/* Links */}
              <nav className="flex items-center gap-6" aria-label="Footer">
                {[
                  { label: t('landing.footerPrivacy'), href: '#' },
                  { label: t('landing.footerTerms'), href: '#' },
                  { label: t('landing.footerContact'), href: '#' },
                ].map((link) => (
                  <a
                    key={link.label}
                    href={link.href}
                    className="text-sm transition-colors"
                    style={{ color: 'rgba(255,255,255,0.4)' }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.7)')}
                    onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.4)')}
                  >
                    {link.label}
                  </a>
                ))}
              </nav>

              {/* Copyright */}
              <div className="text-xs" style={{ color: 'rgba(255,255,255,0.28)' }}>
                &copy; {new Date().getFullYear()} Finza. {t('landing.copyright')}
              </div>
            </div>
          </div>
        </footer>
      </div>
    </>
  )
}
