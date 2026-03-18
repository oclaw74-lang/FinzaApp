import { useCallback, useEffect, useRef, useState } from 'react'
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
  Twitter,
  Instagram,
  Linkedin,
  Youtube,
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
    0%, 100% { opacity: 0.3; transform: scale(1); }
    50%       { opacity: 0.6; transform: scale(1.08); }
  }
  @keyframes pulseGlowGreen {
    0%, 100% { box-shadow: 0 0 20px rgba(0,223,162,0.3), 0 0 60px rgba(0,223,162,0.1); }
    50%       { box-shadow: 0 0 40px rgba(0,223,162,0.6), 0 0 100px rgba(0,223,162,0.2); }
  }
  @keyframes pulseRing {
    0%, 100% { opacity: 0.6; }
    50%       { opacity: 1; }
  }
  @keyframes phonePulseAura {
    0%, 100% { opacity: 0.25; transform: translate(-50%, -50%) scale(1); }
    50%       { opacity: 0.55; transform: translate(-50%, -50%) scale(1.12); }
  }
  @keyframes shimmer {
    0%   { transform: translateX(-100%); }
    100% { transform: translateX(200%); }
  }
  @keyframes shimmerBtn {
    0%   { transform: translateX(-150%) skewX(-20deg); }
    100% { transform: translateX(350%) skewX(-20deg); }
  }
  @keyframes slideDown {
    from { opacity: 0; transform: translateY(-8px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes blobFloat1 {
    0%, 100% { transform: translate(0, 0) scale(1) rotate(0deg); border-radius: 60% 40% 70% 30% / 50% 60% 40% 70%; }
    25%       { transform: translate(80px, -60px) scale(1.1) rotate(5deg); border-radius: 40% 60% 30% 70% / 70% 40% 60% 50%; }
    50%       { transform: translate(-40px, 80px) scale(0.95) rotate(-3deg); border-radius: 70% 30% 60% 40% / 40% 70% 30% 60%; }
    75%       { transform: translate(60px, 40px) scale(1.05) rotate(8deg); border-radius: 50% 50% 40% 60% / 60% 50% 50% 40%; }
  }
  @keyframes blobFloat2 {
    0%, 100% { transform: translate(0, 0) scale(1) rotate(0deg); border-radius: 40% 60% 50% 50% / 60% 40% 60% 40%; }
    30%       { transform: translate(-90px, 50px) scale(1.08) rotate(-6deg); border-radius: 60% 40% 40% 60% / 40% 60% 40% 60%; }
    60%       { transform: translate(70px, -80px) scale(0.92) rotate(4deg); border-radius: 50% 50% 60% 40% / 50% 40% 60% 50%; }
  }
  @keyframes blobFloat3 {
    0%, 100% { transform: translate(0, 0) scale(1); border-radius: 55% 45% 50% 50% / 45% 55% 45% 55%; }
    40%       { transform: translate(50px, 90px) scale(1.06); border-radius: 45% 55% 60% 40% / 55% 45% 55% 45%; }
    80%       { transform: translate(-60px, -40px) scale(0.97); border-radius: 60% 40% 45% 55% / 40% 60% 40% 60%; }
  }
  @keyframes blobFloat4 {
    0%, 100% { transform: translate(0, 0) scale(1); border-radius: 50% 50% 40% 60% / 60% 40% 60% 40%; }
    50%       { transform: translate(-70px, -50px) scale(1.04); border-radius: 40% 60% 55% 45% / 50% 50% 50% 50%; }
  }
  @keyframes gradientShift {
    0%, 100% { background-position: 0% 50%; }
    50%       { background-position: 100% 50%; }
  }
  @keyframes gradientTextShimmer {
    0%, 100% { background-position: 0% center; }
    50%       { background-position: 200% center; }
  }
  @keyframes particleFloat {
    0%   { transform: translateY(0px) translateX(0px); opacity: 0.5; }
    25%  { transform: translateY(-8px) translateX(3px); opacity: 0.8; }
    50%  { transform: translateY(-14px) translateX(-2px); opacity: 0.3; }
    75%  { transform: translateY(-6px) translateX(4px); opacity: 0.7; }
    100% { transform: translateY(0px) translateX(0px); opacity: 0.5; }
  }
  @keyframes scoreReveal {
    from { stroke-dashoffset: var(--dash-full); }
    to   { stroke-dashoffset: var(--dash-offset); }
  }
  @keyframes dotPulse {
    0%, 100% { opacity: 1; transform: scale(1); }
    50%       { opacity: 0.4; transform: scale(0.7); }
  }
  @keyframes navIndicator {
    from { width: 0; opacity: 0; }
    to   { width: 100%; opacity: 1; }
  }
  @keyframes statsBorderRotate {
    from { background-position: 0% 50%; }
    to   { background-position: 200% 50%; }
  }

  /* Scroll reveal */
  .reveal {
    opacity: 0;
    transform: translateY(28px);
    transition: opacity 0.7s cubic-bezier(0.22,1,0.36,1), transform 0.7s cubic-bezier(0.22,1,0.36,1);
  }
  .reveal.visible {
    opacity: 1;
    transform: translateY(0);
  }
  .reveal-left {
    opacity: 0;
    transform: translateX(-28px);
    transition: opacity 0.7s cubic-bezier(0.22,1,0.36,1), transform 0.7s cubic-bezier(0.22,1,0.36,1);
  }
  .reveal-left.visible {
    opacity: 1;
    transform: translateX(0);
  }
  .reveal-right {
    opacity: 0;
    transform: translateX(28px);
    transition: opacity 0.7s cubic-bezier(0.22,1,0.36,1), transform 0.7s cubic-bezier(0.22,1,0.36,1);
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

  /* Navbar */
  .navbar-transparent {
    background: transparent;
    border-bottom: 1px solid transparent;
    transition: background 0.4s ease, border-color 0.4s ease, backdrop-filter 0.4s ease;
  }
  .navbar-scrolled {
    background: rgba(4, 8, 15, 0.88);
    backdrop-filter: blur(24px);
    -webkit-backdrop-filter: blur(24px);
    border-bottom: 1px solid rgba(255, 255, 255, 0.07);
    box-shadow: 0 4px 30px rgba(0,0,0,0.3);
  }

  /* Nav link active indicator */
  .nav-link {
    position: relative;
    padding-bottom: 2px;
  }
  .nav-link::after {
    content: '';
    position: absolute;
    bottom: -4px;
    left: 50%;
    transform: translateX(-50%);
    width: 4px;
    height: 4px;
    border-radius: 50%;
    background: #3d8ef8;
    opacity: 0;
    transition: opacity 0.2s ease, transform 0.2s ease;
  }
  .nav-link.active::after {
    opacity: 1;
  }
  .nav-link:hover::after {
    opacity: 0.5;
  }

  /* Feature card */
  .feature-card {
    background: rgba(13, 24, 41, 0.5);
    border: 1px solid rgba(255, 255, 255, 0.07);
    border-radius: 16px;
    transition: transform 0.3s cubic-bezier(0.22,1,0.36,1), box-shadow 0.3s ease, border-color 0.3s ease;
    position: relative;
  }
  .feature-card::before {
    content: '';
    position: absolute;
    inset: -1px;
    border-radius: 17px;
    padding: 1px;
    background: linear-gradient(135deg, transparent, transparent);
    -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
    -webkit-mask-composite: destination-out;
    mask-composite: exclude;
    opacity: 0;
    transition: opacity 0.3s ease, background 0.3s ease;
    pointer-events: none;
  }
  .feature-card:hover {
    transform: translateY(-8px);
    box-shadow: 0 24px 64px rgba(0, 0, 0, 0.45);
    border-color: transparent;
  }
  .feature-card:hover::before {
    opacity: 1;
    background: linear-gradient(135deg, var(--card-color, #3d8ef8), rgba(0,223,162,0.6));
  }
  .feature-card .icon-wrap {
    transition: box-shadow 0.3s ease, transform 0.3s ease;
  }
  .feature-card:hover .icon-wrap {
    box-shadow: 0 0 20px var(--card-color, #3d8ef8), 0 0 40px var(--card-color-dim, rgba(61,142,248,0.2));
    transform: scale(1.08);
  }

  /* Journey card */
  .journey-card {
    background: rgba(13, 24, 41, 0.5);
    border: 1px solid rgba(255, 255, 255, 0.07);
    border-radius: 16px;
    transition: transform 0.3s cubic-bezier(0.22,1,0.36,1), border-color 0.3s ease, box-shadow 0.3s ease;
  }
  .journey-card:hover {
    transform: translateY(-6px);
    border-color: rgba(61, 142, 248, 0.3);
    box-shadow: 0 16px 48px rgba(0,0,0,0.35);
  }

  /* Testimonial card */
  .testimonial-card {
    background: rgba(13, 24, 41, 0.55);
    border: 1px solid rgba(255, 255, 255, 0.07);
    border-radius: 16px;
    transition: transform 0.3s cubic-bezier(0.22,1,0.36,1), box-shadow 0.3s ease, border-color 0.3s ease;
    position: relative;
    overflow: hidden;
  }
  .testimonial-card:hover {
    transform: translateY(-6px);
    box-shadow: 0 20px 60px rgba(0,0,0,0.45);
    border-color: rgba(61,142,248,0.25);
  }
  .testimonial-card .quote-bg {
    position: absolute;
    top: -10px;
    left: 12px;
    font-size: 120px;
    line-height: 1;
    font-family: Georgia, serif;
    color: rgba(255,255,255,0.025);
    pointer-events: none;
    user-select: none;
    transition: color 0.3s ease;
  }
  .testimonial-card:hover .quote-bg {
    color: rgba(61,142,248,0.05);
  }

  /* FAQ card */
  .faq-card {
    background: rgba(13, 24, 41, 0.5);
    border: 1px solid rgba(255, 255, 255, 0.07);
    border-radius: 14px;
    transition: border-color 0.25s ease, box-shadow 0.25s ease;
  }
  .faq-card:hover {
    border-color: rgba(61, 142, 248, 0.25);
    box-shadow: 0 8px 32px rgba(0,0,0,0.2);
  }

  /* Secondary feature card */
  .sec-card {
    background: rgba(13, 24, 41, 0.45);
    border: 1px solid rgba(255, 255, 255, 0.06);
    border-radius: 14px;
    transition: transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;
  }
  .sec-card:hover {
    transform: translateY(-4px);
    border-color: rgba(61, 142, 248, 0.2);
    box-shadow: 0 12px 32px rgba(0,0,0,0.3);
  }

  /* Alert card */
  .alert-item {
    background: rgba(13, 24, 41, 0.6);
    border: 1px solid rgba(255, 255, 255, 0.07);
    border-radius: 12px;
    transition: border-color 0.2s ease, transform 0.2s ease;
  }
  .alert-item:hover {
    border-color: rgba(61, 142, 248, 0.25);
    transform: translateX(4px);
  }

  /* Gradient text static */
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

  /* Animated shimmer gradient text for hero */
  .gradient-text-animated {
    background: linear-gradient(135deg, #3d8ef8 0%, #00dfa2 25%, #5B9BD5 50%, #00dfa2 75%, #3d8ef8 100%);
    background-size: 200% auto;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    animation: gradientTextShimmer 4s linear infinite;
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
    position: relative;
    overflow: hidden;
  }
  .btn-primary::after {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 60%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.22), transparent);
    transform: skewX(-20deg);
    animation: shimmerBtn 3s ease-in-out 1s infinite;
  }
  .btn-primary:hover {
    opacity: 0.93;
    transform: translateY(-2px);
    box-shadow: 0 8px 32px rgba(61, 142, 248, 0.55);
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

  /* Score ring */
  .score-ring-animated {
    stroke-dasharray: var(--dash-full);
    stroke-dashoffset: var(--dash-full);
    animation: scoreReveal 1.6s cubic-bezier(0.34, 1.56, 0.64, 1) 0.4s forwards;
    transform-origin: center;
    transform: rotate(-90deg);
  }

  /* Shimmer overlay on glass cards */
  .shimmer-overlay {
    position: absolute;
    top: 0; left: 0;
    width: 50%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.03), transparent);
    animation: shimmer 4s ease-in-out infinite;
    pointer-events: none;
  }

  /* Mobile menu */
  .mobile-menu {
    animation: slideDown 0.25s cubic-bezier(0.22,1,0.36,1);
  }

  /* Background grid */
  .bg-grid {
    background-image:
      linear-gradient(rgba(255,255,255,0.035) 1px, transparent 1px),
      linear-gradient(90deg, rgba(255,255,255,0.035) 1px, transparent 1px);
    background-size: 60px 60px;
  }

  /* Floating particle */
  .particle {
    position: absolute;
    border-radius: 50%;
    background: rgba(255,255,255,0.6);
    animation: particleFloat var(--pdur, 5s) ease-in-out var(--pdelay, 0s) infinite;
  }

  /* Section label dot */
  .label-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    animation: dotPulse 2s ease-in-out infinite;
  }

  /* Stats band gradient border wrapper */
  .stats-band-border {
    position: relative;
    border-radius: 20px;
    padding: 1px;
    background: linear-gradient(90deg, rgba(61,142,248,0.4), rgba(0,223,162,0.4), rgba(151,104,255,0.4), rgba(255,192,0,0.4), rgba(61,142,248,0.4));
    background-size: 300% 100%;
    animation: statsBorderRotate 4s linear infinite;
  }
  .stats-band-inner {
    background: rgba(8,15,30,0.95);
    border-radius: 19px;
    padding: 2rem 1.5rem;
  }

  /* Phone glow aura */
  .phone-aura {
    position: absolute;
    width: 200px;
    height: 200px;
    top: 50%;
    left: 50%;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(61,142,248,0.45) 0%, transparent 70%);
    animation: phonePulseAura 3.5s ease-in-out infinite;
    pointer-events: none;
  }

  /* Score ring glow */
  .score-ring-glow {
    animation: pulseGlowGreen 2.5s ease-in-out infinite;
    border-radius: 50%;
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
    position: relative;
    overflow: visible;
  }

  /* CTA final animated gradient background */
  .cta-final-bg {
    background: linear-gradient(135deg, #080f1e 0%, #0a1628 30%, #061020 60%, #080f1e 100%);
    background-size: 400% 400%;
    animation: gradientShift 12s ease infinite;
  }

  /* Urgency badge fire effect */
  .urgency-badge {
    background: linear-gradient(135deg, rgba(255,64,96,0.15), rgba(255,192,0,0.15));
    border: 1px solid rgba(255,100,100,0.3);
    color: #ff8080;
    animation: pulseRing 2s ease-in-out infinite;
  }

  /* Footer separator gradient */
  .footer-separator {
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(61,142,248,0.4), rgba(0,223,162,0.3), rgba(61,142,248,0.4), transparent);
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
  @media (min-width: 1024px) {
    .hero-headline {
      font-size: clamp(3.5rem, 5.5vw, 5.5rem) !important;
    }
  }
`

// ─── Global background orbs (fixed depth effect) ──────────────────────────────

function GlobalOrbs() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden" aria-hidden="true" style={{ zIndex: 0 }}>
      <div
        className="absolute rounded-full"
        style={{
          width: 800,
          height: 800,
          top: '-15%',
          left: '-20%',
          background: 'radial-gradient(circle, rgba(61,142,248,0.09) 0%, transparent 65%)',
          animation: 'blobFloat1 70s ease-in-out infinite',
        }}
      />
      <div
        className="absolute rounded-full"
        style={{
          width: 700,
          height: 700,
          bottom: '10%',
          right: '-15%',
          background: 'radial-gradient(circle, rgba(0,223,162,0.07) 0%, transparent 65%)',
          animation: 'blobFloat2 80s ease-in-out infinite',
        }}
      />
      <div
        className="absolute rounded-full"
        style={{
          width: 500,
          height: 500,
          top: '40%',
          left: '40%',
          background: 'radial-gradient(circle, rgba(151,104,255,0.06) 0%, transparent 65%)',
          animation: 'blobFloat3 65s ease-in-out 5s infinite',
        }}
      />
      <div
        className="absolute rounded-full"
        style={{
          width: 400,
          height: 400,
          top: '60%',
          right: '30%',
          background: 'radial-gradient(circle, rgba(54,96,146,0.08) 0%, transparent 65%)',
          animation: 'blobFloat4 75s ease-in-out 10s infinite',
        }}
      />
    </div>
  )
}

// ─── FloatingParticles ────────────────────────────────────────────────────────

function FloatingParticles() {
  const particles = Array.from({ length: 28 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 2.5 + 0.8,
    dur: (Math.random() * 6 + 4).toFixed(1),
    delay: (Math.random() * 8).toFixed(1),
  }))
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
      {particles.map((p) => (
        <div
          key={p.id}
          className="particle"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
            // @ts-expect-error css custom props
            '--pdur': `${p.dur}s`,
            '--pdelay': `${p.delay}s`,
          }}
        />
      ))}
    </div>
  )
}

// ─── SectionLabel ─────────────────────────────────────────────────────────────

interface SectionLabelProps {
  icon: React.ReactNode
  label: string
  color?: string
  bg?: string
  border?: string
}

function SectionLabel({ icon, label, color = '#5B9BD5', bg = 'rgba(61,142,248,0.1)', border = 'rgba(61,142,248,0.2)' }: SectionLabelProps) {
  return (
    <div
      className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-medium mb-6"
      style={{ background: bg, border: `1px solid ${border}`, color }}
    >
      <div
        className="label-dot"
        style={{ background: color }}
        aria-hidden="true"
      />
      <span aria-hidden="true">{icon}</span>
      {label}
    </div>
  )
}

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
      { threshold: 0.08, rootMargin: '0px 0px -30px 0px' }
    )
    const elements = document.querySelectorAll('.reveal, .reveal-left, .reveal-right')
    elements.forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [])
}

// ─── useNavScroll Hook ────────────────────────────────────────────────────────

function useNavScroll() {
  const [scrolled, setScrolled] = useState(false)
  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 30)
    window.addEventListener('scroll', handler, { passive: true })
    return () => window.removeEventListener('scroll', handler)
  }, [])
  return scrolled
}

// ─── useActiveSection Hook ────────────────────────────────────────────────────

function useActiveSection(sections: string[]) {
  const [active, setActive] = useState('')
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActive(entry.target.id)
        })
      },
      { threshold: 0.4 }
    )
    sections.forEach((id) => {
      const el = document.getElementById(id)
      if (el) observer.observe(el)
    })
    return () => observer.disconnect()
  }, [sections])
  return active
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
      const ease = 1 - Math.pow(1 - progress, 3)
      setCount(Math.floor(ease * target))
      if (progress < 1) requestAnimationFrame(step)
    }
    requestAnimationFrame(step)
  }, [start, target, duration])
  return count
}

// ─── useScoreReveal Hook ──────────────────────────────────────────────────────

function useScoreReveal(ref: React.RefObject<HTMLElement | null>) {
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    if (!ref.current) return
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true) },
      { threshold: 0.3 }
    )
    obs.observe(ref.current)
    return () => obs.disconnect()
  }, [ref])
  return visible
}

// ─── ScoreRingAnimated ────────────────────────────────────────────────────────

interface ScoreRingProps {
  score: number
  animated?: boolean
  size?: number
}

function ScoreRingAnimated({ score, animated = false, size = 140 }: ScoreRingProps) {
  const r = 45
  const circumference = 2 * Math.PI * r
  const offset = circumference - (score / 100) * circumference

  const color =
    score >= 80 ? '#00dfa2' : score >= 60 ? '#3d8ef8' : score >= 40 ? '#FFC000' : '#ff4060'

  const label = score >= 80 ? 'Excelente' : score >= 60 ? 'Bueno' : score >= 40 ? 'En riesgo' : 'Critico'

  return (
    <div
      className="relative flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      {/* Pulsing glow ring behind the SVG */}
      {animated && (
        <div
          className="score-ring-glow absolute inset-0"
          style={{
            background: `radial-gradient(circle, ${color}20 0%, transparent 70%)`,
          }}
          aria-hidden="true"
        />
      )}
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        className="absolute inset-0"
        aria-hidden="true"
      >
        {/* Track */}
        <circle cx="50" cy="50" r={r} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="7" />
        {/* Track glow (static, subtle) */}
        <circle
          cx="50" cy="50" r={r}
          fill="none"
          stroke={color}
          strokeWidth="1"
          opacity="0.15"
          transform="rotate(-90 50 50)"
        />
        {/* Main arc */}
        <circle
          cx="50"
          cy="50"
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="7"
          strokeLinecap="round"
          className={animated ? 'score-ring-animated' : ''}
          style={
            animated
              ? {
                  // @ts-expect-error css custom props
                  '--dash-full': circumference,
                  '--dash-offset': offset,
                  filter: `drop-shadow(0 0 10px ${color}90)`,
                  transform: 'rotate(-90deg)',
                  transformOrigin: 'center',
                }
              : {
                  strokeDasharray: circumference,
                  strokeDashoffset: offset,
                  filter: `drop-shadow(0 0 8px ${color}80)`,
                  transform: 'rotate(-90deg)',
                  transformOrigin: 'center',
                }
          }
        />
      </svg>
      <div className="text-center z-10">
        <div className="font-bold leading-none text-white" style={{ fontSize: size * 0.22 }}>
          {score}
        </div>
        <div className="mt-0.5 font-medium" style={{ color, fontSize: size * 0.075 }}>{label}</div>
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
  const scoreCardRef = useRef<HTMLDivElement>(null)
  const navScrolled = useNavScroll()
  const activeSection = useActiveSection(['features', 'score', 'alerts', 'faq'])
  const scoreVisible = useScoreReveal(scoreCardRef)

  useScrollReveal()

  // Trigger countup when stats band enters viewport
  useEffect(() => {
    if (!statsRef.current) return
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setStatsVisible(true) },
      { threshold: 0.25 }
    )
    obs.observe(statsRef.current)
    return () => obs.disconnect()
  }, [])

  const stat1Count = useCountUp(15, 1400, statsVisible)
  const stat2Count = useCountUp(6, 1200, statsVisible)
  const scoreCount = useCountUp(74, 1600, statsVisible)

  const ctaHref = user ? '/dashboard' : '/register'
  const ctaLabel = user ? t('landing.ctaDashboard') : t('landing.ctaStart')

  const closeMobile = useCallback(() => setMobileOpen(false), [])

  // ── Feature data ──────────────────────────────────────────────────────────
  const features = [
    {
      icon: <BarChart3 size={22} />,
      title: t('landing.feature1Title'),
      desc: t('landing.feature1Desc'),
      color: '#3d8ef8',
      colorDim: 'rgba(61,142,248,0.2)',
      bg: 'rgba(61,142,248,0.12)',
    },
    {
      icon: <PiggyBank size={22} />,
      title: t('landing.feature2Title'),
      desc: t('landing.feature2Desc'),
      color: '#00dfa2',
      colorDim: 'rgba(0,223,162,0.2)',
      bg: 'rgba(0,223,162,0.12)',
    },
    {
      icon: <Target size={22} />,
      title: t('landing.feature3Title'),
      desc: t('landing.feature3Desc'),
      color: '#9768ff',
      colorDim: 'rgba(151,104,255,0.2)',
      bg: 'rgba(151,104,255,0.12)',
    },
    {
      icon: <CreditCard size={22} />,
      title: t('landing.feature4Title'),
      desc: t('landing.feature4Desc'),
      color: '#FFC000',
      colorDim: 'rgba(255,192,0,0.2)',
      bg: 'rgba(255,192,0,0.12)',
    },
    {
      icon: <Bell size={22} />,
      title: t('landing.feature5Title'),
      desc: t('landing.feature5Desc'),
      color: '#ff4060',
      colorDim: 'rgba(255,64,96,0.2)',
      bg: 'rgba(255,64,96,0.12)',
    },
    {
      icon: <BookOpen size={22} />,
      title: t('landing.feature6Title'),
      desc: t('landing.feature6Desc'),
      color: '#5B9BD5',
      colorDim: 'rgba(91,155,213,0.2)',
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
      gradient: 'linear-gradient(135deg, #3d8ef8, #5B9BD5)',
    },
    {
      name: t('landing.t2Name'),
      location: t('landing.t2Location'),
      quote: t('landing.t2Quote'),
      initials: 'CR',
      gradient: 'linear-gradient(135deg, #00dfa2, #00b87a)',
    },
    {
      name: t('landing.t3Name'),
      location: t('landing.t3Location'),
      quote: t('landing.t3Quote'),
      initials: 'AP',
      gradient: 'linear-gradient(135deg, #9768ff, #6a3fcf)',
    },
  ]

  // ── FAQ ───────────────────────────────────────────────────────────────────
  const faqs = [
    { q: t('landing.faq1Q'), a: t('landing.faq1A') },
    { q: t('landing.faq2Q'), a: t('landing.faq2A') },
    { q: t('landing.faq3Q'), a: t('landing.faq3A') },
    { q: t('landing.faq4Q'), a: t('landing.faq4A') },
  ]

  // ── Nav links ─────────────────────────────────────────────────────────────
  const navLinks = [
    { label: t('landing.navFeatures'), href: '#features', id: 'features' },
    { label: t('landing.navScore'), href: '#score', id: 'score' },
    { label: t('landing.navAlerts'), href: '#alerts', id: 'alerts' },
    { label: t('landing.navFaq'), href: '#faq', id: 'faq' },
  ]

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: STYLES }} />
      <GlobalOrbs />

      <div
        style={{
          background: '#04080f',
          color: 'rgba(255,255,255,0.87)',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          overflowX: 'hidden',
          minHeight: '100vh',
          position: 'relative',
          zIndex: 1,
        }}
      >
        {/* ── NAVBAR ─────────────────────────────────────────────────────── */}
        <header
          className={navScrolled ? 'navbar-scrolled sticky top-0 z-50' : 'navbar-transparent sticky top-0 z-50'}
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
              {navLinks.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  className={`nav-link text-sm font-medium transition-colors ${activeSection === item.id ? 'active' : ''}`}
                  style={{ color: activeSection === item.id ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.58)' }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.95)')}
                  onMouseLeave={(e) => {
                    if (activeSection !== item.id) e.currentTarget.style.color = 'rgba(255,255,255,0.58)'
                  }}
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
                {navLinks.map((item) => (
                  <a
                    key={item.href}
                    href={item.href}
                    className="text-sm font-medium py-2"
                    style={{ color: 'rgba(255,255,255,0.7)' }}
                    onClick={closeMobile}
                  >
                    {item.label}
                  </a>
                ))}
                <div className="flex flex-col gap-2 pt-2 border-t" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
                  {!user && (
                    <Link to="/login" className="btn-outline text-sm text-center py-2.5 px-4" onClick={closeMobile}>
                      {t('landing.navLogin')}
                    </Link>
                  )}
                  <Link
                    to={ctaHref}
                    className="btn-primary text-sm text-center py-2.5 px-4"
                    onClick={closeMobile}
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
            background: 'radial-gradient(ellipse 80% 50% at 20% 40%, rgba(61,142,248,0.11) 0%, transparent 55%), radial-gradient(ellipse 60% 40% at 80% 60%, rgba(0,223,162,0.06) 0%, transparent 50%), #04080f',
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <FloatingParticles />

          {/* Background grid */}
          <div className="absolute inset-0 bg-grid opacity-35 pointer-events-none" aria-hidden="true" />

          {/* Hero orbs with blob animation */}
          <div
            className="absolute pointer-events-none"
            style={{
              width: 650,
              height: 650,
              top: '-12%',
              left: '-18%',
              background: 'radial-gradient(circle, rgba(61,142,248,0.16) 0%, transparent 65%)',
              animation: 'blobFloat1 20s ease-in-out infinite',
            }}
            aria-hidden="true"
          />
          <div
            className="absolute pointer-events-none"
            style={{
              width: 550,
              height: 550,
              bottom: '-8%',
              right: '-12%',
              background: 'radial-gradient(circle, rgba(0,223,162,0.1) 0%, transparent 65%)',
              animation: 'blobFloat2 25s ease-in-out infinite',
            }}
            aria-hidden="true"
          />
          <div
            className="absolute pointer-events-none"
            style={{
              width: 350,
              height: 350,
              top: '30%',
              right: '15%',
              background: 'radial-gradient(circle, rgba(151,104,255,0.07) 0%, transparent 65%)',
              animation: 'blobFloat3 18s ease-in-out 3s infinite',
            }}
            aria-hidden="true"
          />

          <div
            className="relative max-w-7xl mx-auto px-4 sm:px-6 w-full py-24 lg:py-0"
            style={{ minHeight: '100vh', display: 'flex', alignItems: 'center' }}
          >
            <div className="flex flex-col lg:flex-row items-center gap-16 w-full">
              {/* Left: copy */}
              <div className="flex-1 max-w-xl">
                {/* Badge */}
                <div
                  className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium mb-8"
                  style={{
                    background: 'rgba(61,142,248,0.1)',
                    border: '1px solid rgba(61,142,248,0.22)',
                    color: '#5B9BD5',
                    animation: 'fadeInUp 0.6s ease both',
                  }}
                >
                  <span aria-hidden="true">✨</span>
                  {t('landing.badge')}
                </div>

                {/* Headline */}
                <h1
                  className="hero-headline font-bold leading-tight mb-6"
                  style={{
                    fontSize: 'clamp(2.8rem, 5.5vw, 4.5rem)',
                    animation: 'fadeInUp 0.6s ease 0.1s both',
                  }}
                >
                  <span className="text-white">{t('landing.headline1')}</span>
                  <br />
                  <span className="gradient-text-animated">{t('landing.headline2')}</span>
                </h1>

                {/* Subheadline */}
                <p
                  className="text-base leading-relaxed mb-8"
                  style={{
                    color: 'rgba(255,255,255,0.52)',
                    animation: 'fadeInUp 0.6s ease 0.2s both',
                    maxWidth: '480px',
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
                    className="btn-primary flex items-center gap-2 px-7 py-3 text-sm"
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
                  {[t('landing.trust1'), t('landing.trust2'), t('landing.trust3')].map((item) => (
                    <div
                      key={item}
                      className="flex items-center gap-1.5 text-xs"
                      style={{ color: 'rgba(255,255,255,0.45)' }}
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
                  width: 580,
                  height: 520,
                  animation: 'fadeInRight 0.9s ease 0.3s both',
                }}
                aria-hidden="true"
              >
                {/* Tablet */}
                <div
                  className="device-tablet absolute"
                  style={{ width: 390, height: 295, top: 30, left: 0, padding: 20, transform: 'rotate(-4deg)' }}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <img src="/logo.svg" alt="" className="w-5 h-5" />
                    <span className="text-xs font-bold text-white">Finza</span>
                    <div className="ml-auto flex gap-1">
                      {[0, 1, 2].map((i) => (
                        <div
                          key={i}
                          className="w-1.5 h-1.5 rounded-full"
                          style={{ background: i === 0 ? '#ff4060' : i === 1 ? '#FFC000' : '#00dfa2', opacity: 0.7 }}
                        />
                      ))}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    {[
                      { label: 'Balance', val: 'DOP 24,500', color: '#00dfa2' },
                      { label: 'Egresos', val: 'DOP 8,200', color: '#ff4060' },
                    ].map((c) => (
                      <div key={c.label} className="rounded-lg p-2" style={{ background: 'rgba(255,255,255,0.05)' }}>
                        <div className="text-xs mb-1" style={{ color: 'rgba(255,255,255,0.4)' }}>{c.label}</div>
                        <div className="text-sm font-bold" style={{ color: c.color }}>{c.val}</div>
                      </div>
                    ))}
                  </div>
                  {/* Mini bar chart */}
                  <div className="flex items-end gap-1.5" style={{ height: 68 }}>
                    {[35, 60, 45, 80, 55, 70, 90].map((h, i) => (
                      <div
                        key={i}
                        className="flex-1 rounded-sm"
                        style={{
                          height: `${h}%`,
                          background:
                            i === 6
                              ? 'linear-gradient(to top, #3d8ef8, #00dfa2)'
                              : `rgba(61,142,248,${0.2 + i * 0.04})`,
                        }}
                      />
                    ))}
                  </div>
                </div>

                {/* Phone with aura glow */}
                <div
                  className="device-phone absolute"
                  style={{ width: 210, height: 360, top: 80, right: 0, padding: 18, transform: 'rotate(3deg)' }}
                >
                  {/* Blue pulsing aura */}
                  <div className="phone-aura" />

                  {/* Score ring on phone */}
                  <div className="flex justify-center mb-3">
                    <ScoreRingAnimated score={statsVisible ? scoreCount || 74 : 74} size={148} />
                  </div>
                  {/* Score bars */}
                  {[
                    { label: 'Ahorro', pct: 72, color: '#00dfa2' },
                    { label: 'Deudas', pct: 58, color: '#3d8ef8' },
                    { label: 'Presup.', pct: 85, color: '#9768ff' },
                  ].map((b) => (
                    <div key={b.label} className="mb-1.5">
                      <div className="flex justify-between text-xs mb-0.5" style={{ color: 'rgba(255,255,255,0.45)' }}>
                        <span>{b.label}</span>
                        <span style={{ color: b.color }}>{b.pct}</span>
                      </div>
                      <div className="rounded-full" style={{ height: 4, background: 'rgba(255,255,255,0.07)' }}>
                        <div
                          className="rounded-full h-full"
                          style={{
                            width: `${b.pct}%`,
                            background: `linear-gradient(90deg, ${b.color}70, ${b.color})`,
                            boxShadow: `0 0 6px ${b.color}60`,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Ambient glow behind devices */}
                <div
                  className="absolute rounded-full pointer-events-none"
                  style={{
                    width: 480,
                    height: 480,
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    background: 'radial-gradient(circle, rgba(61,142,248,0.18) 0%, transparent 70%)',
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
            style={{ color: 'rgba(255,255,255,0.28)', animation: 'float 2.5s ease-in-out infinite' }}
            aria-hidden="true"
          >
            <ChevronDown size={18} />
          </div>
        </section>

        {/* ── STATS BAND ─────────────────────────────────────────────────── */}
        <section
          ref={statsRef}
          className="relative py-14"
          style={{ background: 'rgba(6,12,24,0.95)' }}
          aria-label="Estadisticas"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="stats-band-border">
              <div className="stats-band-inner">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  {[
                    {
                      value: `${stat1Count}+`,
                      label: t('landing.stat1Label'),
                      color: '#3d8ef8',
                      numericTarget: 15,
                    },
                    {
                      value: `${stat2Count}`,
                      label: t('landing.stat2Label'),
                      color: '#00dfa2',
                      numericTarget: 6,
                    },
                    {
                      value: '100%',
                      label: t('landing.stat3Label'),
                      color: '#9768ff',
                      numericTarget: null,
                    },
                    {
                      value: 'DOP',
                      label: t('landing.stat4Label'),
                      color: '#FFC000',
                      numericTarget: null,
                    },
                  ].map((stat, i) => (
                    <div
                      key={i}
                      className="text-center reveal"
                      style={{ transitionDelay: `${i * 0.09}s` }}
                    >
                      <div
                        className="text-4xl font-bold mb-1.5 tabular-nums"
                        style={{
                          color: stat.color,
                          textShadow: `0 0 30px ${stat.color}50`,
                        }}
                      >
                        {stat.value}
                      </div>
                      <div className="text-sm" style={{ color: 'rgba(255,255,255,0.48)' }}>
                        {stat.label}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── FEATURES ───────────────────────────────────────────────────── */}
        <section
          id="features"
          className="py-32 relative"
          style={{ background: '#04080f' }}
          aria-labelledby="features-heading"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            {/* Section header */}
            <div className="text-center mb-16 reveal">
              <SectionLabel
                icon={<Zap size={12} />}
                label={t('landing.sectionLabelFeatures')}
              />
              <h2
                id="features-heading"
                className="font-bold mb-4 text-white"
                style={{ fontSize: 'clamp(1.85rem, 3.2vw, 2.7rem)' }}
              >
                {t('landing.featuresTitle')}
              </h2>
              <p className="max-w-xl mx-auto text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.48)' }}>
                {t('landing.featuresSub')}
              </p>
            </div>

            {/* Feature grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {features.map((f, i) => (
                <div
                  key={i}
                  className="feature-card p-7 relative overflow-hidden reveal"
                  style={{
                    transitionDelay: `${i * 0.08}s`,
                    // @ts-expect-error css custom props
                    '--card-color': f.color,
                    '--card-color-dim': f.colorDim,
                  }}
                >
                  <div className="shimmer-overlay" aria-hidden="true" />
                  <div
                    className="icon-wrap w-11 h-11 rounded-xl flex items-center justify-center mb-5"
                    style={{ background: f.bg, color: f.color }}
                    aria-hidden="true"
                  >
                    {f.icon}
                  </div>
                  <h3 className="font-semibold text-base text-white mb-2">{f.title}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.48)' }}>
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
          className="py-32 relative overflow-hidden"
          style={{
            background: 'radial-gradient(ellipse 70% 60% at 80% 50%, rgba(61,142,248,0.07) 0%, transparent 60%), #080f1e',
          }}
          aria-labelledby="score-heading"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="flex flex-col lg:flex-row items-center gap-16">
              {/* Left: copy */}
              <div className="flex-1 reveal-left">
                <SectionLabel
                  icon={<BarChart3 size={12} />}
                  label={t('landing.sectionLabelScore')}
                />
                <h2
                  id="score-heading"
                  className="font-bold text-white mb-4"
                  style={{ fontSize: 'clamp(1.85rem, 3.2vw, 2.7rem)' }}
                >
                  {t('landing.scoreTitle')}
                </h2>
                <p className="text-sm leading-relaxed mb-8" style={{ color: 'rgba(255,255,255,0.48)' }}>
                  {t('landing.scoreDesc')}
                </p>
                <ul className="space-y-3">
                  {[
                    t('landing.scoreBullet1'),
                    t('landing.scoreBullet2'),
                    t('landing.scoreBullet3'),
                    t('landing.scoreBullet4'),
                  ].map((b) => (
                    <li key={b} className="flex items-start gap-3 text-sm" style={{ color: 'rgba(255,255,255,0.68)' }}>
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
              <div className="flex-shrink-0 reveal-right" ref={scoreCardRef as React.RefObject<HTMLDivElement>}>
                <div
                  className="glass rounded-2xl p-8 relative overflow-hidden"
                  style={{ width: 330 }}
                >
                  <div className="shimmer-overlay" aria-hidden="true" />
                  {/* Header */}
                  <div className="flex items-center gap-2 mb-6">
                    <img src="/logo.svg" alt="" className="w-6 h-6" aria-hidden="true" />
                    <span className="text-sm font-semibold text-white">Score Financiero</span>
                  </div>

                  {/* Ring with animated reveal on viewport entry */}
                  <div className="flex justify-center mb-7">
                    <ScoreRingAnimated score={74} animated={scoreVisible} size={160} />
                  </div>

                  {/* Dimension bars with count numbers */}
                  <div className="space-y-3.5">
                    {[
                      { label: 'Ahorro', score: 72, color: '#00dfa2' },
                      { label: 'Deudas', score: 58, color: '#3d8ef8' },
                      { label: 'Presupuesto', score: 85, color: '#9768ff' },
                      { label: 'Emergencias', score: 45, color: '#FFC000' },
                    ].map((d) => (
                      <div key={d.label}>
                        <div className="flex justify-between text-xs mb-1.5" style={{ color: 'rgba(255,255,255,0.52)' }}>
                          <span>{d.label}</span>
                          <span className="font-semibold" style={{ color: d.color }}>
                            {scoreVisible ? d.score : 0}
                          </span>
                        </div>
                        <div className="rounded-full overflow-hidden" style={{ height: 6, background: 'rgba(255,255,255,0.06)' }}>
                          <div
                            className="rounded-full h-full"
                            style={{
                              width: scoreVisible ? `${d.score}%` : '0%',
                              background: `linear-gradient(90deg, ${d.color}70, ${d.color})`,
                              boxShadow: `0 0 10px ${d.color}55`,
                              transition: 'width 1.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
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
          className="py-32 relative overflow-hidden"
          style={{
            background: 'radial-gradient(ellipse 60% 50% at 20% 50%, rgba(0,223,162,0.06) 0%, transparent 60%), #04080f',
          }}
          aria-labelledby="alerts-heading"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="flex flex-col lg:flex-row items-center gap-16">
              {/* Left: alert list */}
              <div className="flex-shrink-0 w-full lg:w-auto reveal-left order-2 lg:order-1">
                <div className="space-y-3" style={{ maxWidth: 370 }}>
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
                          <span className="text-xs flex-shrink-0" style={{ color: 'rgba(255,255,255,0.32)' }}>{a.time}</span>
                        </div>
                        <p className="text-xs mt-0.5 leading-relaxed" style={{ color: 'rgba(255,255,255,0.48)' }}>{a.body}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right: copy */}
              <div className="flex-1 reveal-right order-1 lg:order-2">
                <SectionLabel
                  icon={<Bell size={12} />}
                  label={t('landing.sectionLabelAlerts')}
                  color="#00dfa2"
                  bg="rgba(0,223,162,0.1)"
                  border="rgba(0,223,162,0.2)"
                />
                <h2
                  id="alerts-heading"
                  className="font-bold text-white mb-4"
                  style={{ fontSize: 'clamp(1.85rem, 3.2vw, 2.7rem)' }}
                >
                  {t('landing.alertsTitle')}
                </h2>
                <p className="text-sm leading-relaxed mb-8" style={{ color: 'rgba(255,255,255,0.48)' }}>
                  {t('landing.alertsDesc')}
                </p>
                <ul className="space-y-3">
                  {[
                    t('landing.alertsBullet1'),
                    t('landing.alertsBullet2'),
                    t('landing.alertsBullet3'),
                    t('landing.alertsBullet4'),
                  ].map((b) => (
                    <li key={b} className="flex items-start gap-3 text-sm" style={{ color: 'rgba(255,255,255,0.68)' }}>
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
          className="py-24 relative"
          style={{ background: '#080f1e' }}
          aria-label="Funciones adicionales"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="text-center mb-12 reveal">
              <h2
                className="font-bold text-white mb-3"
                style={{ fontSize: 'clamp(1.5rem, 2.6vw, 2.1rem)' }}
              >
                {t('landing.andMore')}
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
                    className="w-10 h-10 rounded-xl flex items-center justify-center mb-4 transition-all duration-300"
                    style={{ background: `${e.color}15`, color: e.color }}
                    aria-hidden="true"
                  >
                    {e.icon}
                  </div>
                  <h3 className="font-semibold text-sm text-white mb-1.5">{e.title}</h3>
                  <p className="text-xs leading-relaxed" style={{ color: 'rgba(255,255,255,0.46)' }}>
                    {e.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── JOURNEY ────────────────────────────────────────────────────── */}
        <section
          className="py-32 relative"
          style={{ background: '#04080f' }}
          aria-labelledby="journey-heading"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="text-center mb-16 reveal">
              <h2
                id="journey-heading"
                className="font-bold text-white mb-3"
                style={{ fontSize: 'clamp(1.85rem, 3.2vw, 2.7rem)' }}
              >
                {t('landing.journeyTitle')}
              </h2>
              <p className="text-sm" style={{ color: 'rgba(255,255,255,0.48)' }}>
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
                  className="journey-card p-8 text-center reveal"
                  style={{ transitionDelay: `${i * 0.12}s` }}
                >
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-lg mx-auto mb-6"
                    style={{ background: `${j.color}15`, color: j.color, border: `1px solid ${j.color}30` }}
                    aria-hidden="true"
                  >
                    {j.step}
                  </div>
                  <h3 className="font-semibold text-base text-white mb-2">{j.title}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.48)' }}>
                    {j.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── TESTIMONIALS ───────────────────────────────────────────────── */}
        <section
          className="py-32 relative"
          style={{ background: '#080f1e' }}
          aria-labelledby="testimonials-heading"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="text-center mb-16 reveal">
              <h2
                id="testimonials-heading"
                className="font-bold text-white mb-3"
                style={{ fontSize: 'clamp(1.85rem, 3.2vw, 2.7rem)' }}
              >
                {t('landing.testimonialsTitle')}
              </h2>
              <p className="text-sm" style={{ color: 'rgba(255,255,255,0.48)' }}>
                {t('landing.testimonialsSub')}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {testimonials.map((tm, i) => (
                <div
                  key={i}
                  className="testimonial-card p-7 flex flex-col reveal"
                  style={{ transitionDelay: `${i * 0.1}s` }}
                >
                  {/* Decorative large quote mark */}
                  <div className="quote-bg" aria-hidden="true">&ldquo;</div>

                  {/* Stars */}
                  <div className="flex gap-1 mb-5 relative" aria-label="5 estrellas">
                    {Array.from({ length: 5 }).map((_, s) => (
                      <Star key={s} size={14} fill="#FFC000" stroke="none" aria-hidden="true" />
                    ))}
                  </div>

                  {/* Quote */}
                  <blockquote
                    className="text-sm leading-relaxed flex-1 mb-7 relative"
                    style={{ color: 'rgba(255,255,255,0.62)' }}
                  >
                    &ldquo;{tm.quote}&rdquo;
                  </blockquote>

                  {/* Author */}
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 text-white"
                      style={{ background: tm.gradient }}
                      aria-hidden="true"
                    >
                      {tm.initials}
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-white">{tm.name}</div>
                      <div className="text-xs" style={{ color: 'rgba(255,255,255,0.38)' }}>
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
          className="py-32 relative"
          style={{ background: '#04080f' }}
          aria-labelledby="faq-heading"
        >
          <div className="max-w-4xl mx-auto px-4 sm:px-6">
            <div className="text-center mb-16 reveal">
              <h2
                id="faq-heading"
                className="font-bold text-white mb-3"
                style={{ fontSize: 'clamp(1.85rem, 3.2vw, 2.7rem)' }}
              >
                {t('landing.faqTitle')}
              </h2>
              <p className="text-sm" style={{ color: 'rgba(255,255,255,0.48)' }}>
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
                      style={{ background: 'rgba(61,142,248,0.14)', color: '#3d8ef8' }}
                      aria-hidden="true"
                    >
                      ?
                    </span>
                    {faq.q}
                  </h3>
                  <p className="text-sm leading-relaxed pl-7" style={{ color: 'rgba(255,255,255,0.48)' }}>
                    {faq.a}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── CTA FINAL ──────────────────────────────────────────────────── */}
        <section
          className="cta-final-bg py-32 relative overflow-hidden"
          aria-label="Llamada a la accion"
        >
          {/* Animated background orbs */}
          <div
            className="absolute rounded-full pointer-events-none"
            style={{
              width: 600,
              height: 600,
              top: '50%',
              left: '20%',
              transform: 'translate(-50%, -50%)',
              background: 'radial-gradient(circle, rgba(61,142,248,0.13) 0%, transparent 65%)',
              animation: 'pulseGlow 5s ease-in-out infinite',
            }}
            aria-hidden="true"
          />
          <div
            className="absolute rounded-full pointer-events-none"
            style={{
              width: 450,
              height: 450,
              top: '50%',
              right: '5%',
              transform: 'translateY(-50%)',
              background: 'radial-gradient(circle, rgba(0,223,162,0.09) 0%, transparent 65%)',
              animation: 'pulseGlow 6s ease-in-out 1.5s infinite',
            }}
            aria-hidden="true"
          />

          <div className="max-w-7xl mx-auto px-4 sm:px-6 relative">
            <div className="flex flex-col lg:flex-row items-center gap-16">
              {/* Left: main CTA copy */}
              <div className="flex-1 reveal-left">
                {/* Urgency badge */}
                <div
                  className="urgency-badge inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold mb-5"
                >
                  <span aria-hidden="true">🔥</span>
                  {t('landing.ctaFinalUrgency')}
                </div>

                <div
                  className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-medium mb-6 ml-2"
                  style={{ background: 'rgba(61,142,248,0.1)', border: '1px solid rgba(61,142,248,0.2)', color: '#5B9BD5' }}
                >
                  <Zap size={12} aria-hidden="true" />
                  {t('landing.ctaFinalBadge')}
                </div>

                <h2
                  className="font-bold text-white mb-4"
                  style={{ fontSize: 'clamp(1.85rem, 3.8vw, 3.2rem)' }}
                >
                  {t('landing.ctaFinalTitle1')}
                  <br />
                  <span className="gradient-text-animated">{t('landing.ctaFinalTitle2')}</span>
                </h2>
                <p className="text-sm leading-relaxed mb-8" style={{ color: 'rgba(255,255,255,0.48)' }}>
                  {t('landing.ctaFinalSub')}
                </p>
                <Link
                  to={ctaHref}
                  className="btn-primary inline-flex items-center gap-2 px-9 py-4 text-base font-semibold"
                >
                  {t('landing.ctaFinalBtn')}
                  <ArrowRight size={18} aria-hidden="true" />
                </Link>
                {!user && (
                  <div className="mt-5 text-sm" style={{ color: 'rgba(255,255,255,0.38)' }}>
                    {t('landing.ctaFinalHaveAccount')}{' '}
                    <Link
                      to="/login"
                      className="transition-colors underline underline-offset-2"
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
                  style={{ width: 310 }}
                >
                  <div className="shimmer-overlay" aria-hidden="true" />
                  <div className="text-center mb-6">
                    <img src="/logo.svg" alt="Finza" className="w-12 h-12 mx-auto mb-3" />
                    <div className="font-bold text-lg text-white">Finza</div>
                    <div className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.42)' }}>
                      App de finanzas personales
                    </div>
                  </div>
                  <div className="space-y-3.5">
                    {[
                      { icon: <CheckCircle size={14} />, label: t('landing.ctaProof1'), color: '#00dfa2' },
                      { icon: <CheckCircle size={14} />, label: t('landing.ctaProof2'), color: '#00dfa2' },
                      { icon: <CheckCircle size={14} />, label: t('landing.ctaProof3'), color: '#00dfa2' },
                      { icon: <Shield size={14} />, label: 'Datos protegidos con RLS', color: '#3d8ef8' },
                    ].map((p, i) => (
                      <div key={i} className="flex items-center gap-3 text-sm" style={{ color: 'rgba(255,255,255,0.62)' }}>
                        <span style={{ color: p.color }} aria-hidden="true">{p.icon}</span>
                        {p.label}
                      </div>
                    ))}
                  </div>
                  <div
                    className="mt-6 pt-5 text-center text-xs"
                    style={{ borderTop: '1px solid rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.28)' }}
                  >
                    Republica Dominicana &middot; LatAm
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── FOOTER ─────────────────────────────────────────────────────── */}
        <footer
          className="relative"
          style={{ background: '#03060d' }}
          role="contentinfo"
        >
          {/* Gradient separator */}
          <div className="footer-separator" aria-hidden="true" />

          <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-14 pb-8">
            {/* 4-column grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
              {/* Col 1: Brand + tagline */}
              <div className="lg:col-span-1">
                <Link to="/" className="inline-flex items-center gap-2.5 mb-4" aria-label="Finza">
                  <img src="/logo.svg" alt="Finza" className="w-8 h-8" />
                  <span className="font-bold text-lg text-white tracking-tight">Finza</span>
                </Link>
                <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.38)' }}>
                  {t('landing.footerTagline')}
                </p>
              </div>

              {/* Col 2: Producto */}
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: 'rgba(255,255,255,0.35)' }}>
                  {t('landing.footerProductTitle')}
                </h3>
                <ul className="space-y-3">
                  {[
                    { label: t('landing.footerProductDashboard'), href: '#' },
                    { label: t('landing.footerProductScore'), href: '#score' },
                    { label: t('landing.footerProductBudgets'), href: '#features' },
                    { label: t('landing.footerProductGoals'), href: '#features' },
                    { label: t('landing.footerProductLoans'), href: '#features' },
                  ].map((link) => (
                    <li key={link.label}>
                      <a
                        href={link.href}
                        className="text-sm transition-colors"
                        style={{ color: 'rgba(255,255,255,0.42)' }}
                        onMouseEnter={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.8)')}
                        onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.42)')}
                      >
                        {link.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Col 3: Empresa */}
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: 'rgba(255,255,255,0.35)' }}>
                  {t('landing.footerCompanyTitle')}
                </h3>
                <ul className="space-y-3">
                  {[
                    { label: t('landing.footerCompanyAbout'), href: '#' },
                    { label: t('landing.footerCompanyBlog'), href: '#' },
                    { label: t('landing.footerCompanyCareers'), href: '#' },
                    { label: t('landing.footerCompanyPress'), href: '#' },
                    { label: t('landing.footerPrivacy'), href: '#' },
                    { label: t('landing.footerTerms'), href: '#' },
                  ].map((link) => (
                    <li key={link.label}>
                      <a
                        href={link.href}
                        className="text-sm transition-colors"
                        style={{ color: 'rgba(255,255,255,0.42)' }}
                        onMouseEnter={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.8)')}
                        onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.42)')}
                      >
                        {link.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Col 4: Redes sociales */}
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: 'rgba(255,255,255,0.35)' }}>
                  {t('landing.footerFollowTitle')}
                </h3>
                <ul className="space-y-3">
                  {[
                    { label: t('landing.footerFollowTwitter'), icon: <Twitter size={15} />, href: '#', color: '#1d9bf0' },
                    { label: t('landing.footerFollowInstagram'), icon: <Instagram size={15} />, href: '#', color: '#e1306c' },
                    { label: t('landing.footerFollowLinkedIn'), icon: <Linkedin size={15} />, href: '#', color: '#0a66c2' },
                    { label: t('landing.footerFollowYoutube'), icon: <Youtube size={15} />, href: '#', color: '#ff0000' },
                  ].map((social) => (
                    <li key={social.label}>
                      <a
                        href={social.href}
                        className="inline-flex items-center gap-2 text-sm transition-colors group"
                        style={{ color: 'rgba(255,255,255,0.42)' }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.color = social.color
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.color = 'rgba(255,255,255,0.42)'
                        }}
                        aria-label={social.label}
                      >
                        <span aria-hidden="true">{social.icon}</span>
                        {social.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Bottom bar */}
            <div
              className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6"
              style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}
            >
              <div className="text-xs" style={{ color: 'rgba(255,255,255,0.25)' }}>
                &copy; {new Date().getFullYear()} Finza. {t('landing.copyright')}
              </div>
              <div className="flex items-center gap-5">
                {[
                  { label: t('landing.footerContact'), href: '#' },
                ].map((link) => (
                  <a
                    key={link.label}
                    href={link.href}
                    className="text-xs transition-colors"
                    style={{ color: 'rgba(255,255,255,0.3)' }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.6)')}
                    onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.3)')}
                  >
                    {link.label}
                  </a>
                ))}
              </div>
            </div>
          </div>
        </footer>
      </div>
    </>
  )
}
