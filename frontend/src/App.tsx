import { useEffect } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { I18nextProvider } from 'react-i18next'
import { Toaster } from 'sonner'
import i18n from './i18n'
import { useAuthStore } from '@/store/authStore'
import { ProtectedRoute } from '@/components/shared/ProtectedRoute'
import { Layout } from '@/components/shared/Layout'
import { LandingPage } from '@/pages/LandingPage'
import { LoginPage } from '@/pages/LoginPage'
import { RegisterPage } from '@/pages/RegisterPage'
import { ForgotPasswordPage } from '@/pages/ForgotPasswordPage'
import { ResetPasswordPage } from '@/pages/ResetPasswordPage'
import { DashboardPage } from '@/pages/DashboardPage'
import { NotFoundPage } from '@/pages/NotFoundPage'
import { OnboardingPage } from '@/pages/OnboardingPage'
import { IngresosPage } from '@/pages/IngresosPage'
import { EgresosPage } from '@/pages/EgresosPage'
import { PrestamosPage } from '@/pages/PrestamosPage'
import { MetasPage } from '@/pages/MetasPage'
import { PresupuestosPage } from '@/pages/PresupuestosPage'
import { CategoriasPage } from '@/pages/CategoriasPage'
import { NotificacionesPage } from '@/pages/NotificacionesPage'
import { FondoEmergenciaPage } from '@/pages/FondoEmergenciaPage'
import { SuscripcionesPage } from '@/pages/SuscripcionesPage'
import { ConfiguracionPage } from '@/pages/ConfiguracionPage'
import { RetosPage } from '@/pages/RetosPage'
import { EducacionPage } from '@/pages/EducacionPage'
import { RecurrentesPage } from '@/pages/RecurrentesPage'
import { TarjetasPage } from '@/pages/TarjetasPage'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      retry: 1,
    },
  },
})

function RootRoute(): JSX.Element {
  const { isLoading } = useAuthStore()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#04080f]">
        <div className="flex flex-col items-center gap-4">
          <svg className="animate-spin h-8 w-8 text-finza-blue" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <p className="text-sm text-white/40">Cargando Finza...</p>
        </div>
      </div>
    )
  }

  return <LandingPage />
}

export function App(): JSX.Element {
  const { initialize } = useAuthStore()

  useEffect(() => {
    let cleanup: (() => void) | undefined
    let cancelled = false

    initialize().then((fn) => {
      if (cancelled) {
        fn()
      } else {
        cleanup = fn
      }
    })

    return () => {
      cancelled = true
      cleanup?.()
    }
  }, [initialize])

  return (
    <I18nextProvider i18n={i18n}>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<RootRoute />} />
            <Route path="/landing" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route element={<ProtectedRoute />}>
              <Route path="/onboarding" element={<OnboardingPage />} />
              <Route element={<Layout />}>
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/ingresos" element={<IngresosPage />} />
                <Route path="/egresos" element={<EgresosPage />} />
                <Route path="/prestamos" element={<PrestamosPage />} />
                <Route path="/metas" element={<MetasPage />} />
                <Route path="/presupuestos" element={<PresupuestosPage />} />
                <Route path="/categorias" element={<CategoriasPage />} />
                <Route path="/notificaciones" element={<NotificacionesPage />} />
                <Route path="/fondo-emergencia" element={<FondoEmergenciaPage />} />
                <Route path="/suscripciones" element={<SuscripcionesPage />} />
                <Route path="/reportes" element={<div className="p-4 text-[var(--text-primary)]">Reportes - Issue futuro</div>} />
                <Route path="/configuracion" element={<ConfiguracionPage />} />
                <Route path="/retos" element={<RetosPage />} />
                <Route path="/educacion" element={<EducacionPage />} />
                <Route path="/recurrentes" element={<RecurrentesPage />} />
                <Route path="/tarjetas" element={<TarjetasPage />} />
              </Route>
            </Route>
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </BrowserRouter>
        <Toaster position="top-right" richColors closeButton />
      </QueryClientProvider>
    </I18nextProvider>
  )
}
