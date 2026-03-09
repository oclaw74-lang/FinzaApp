import { useEffect } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useAuthStore } from '@/store/authStore'
import { ProtectedRoute } from '@/components/shared/ProtectedRoute'
import { Layout } from '@/components/shared/Layout'
import { LoginPage } from '@/pages/LoginPage'
import { RegisterPage } from '@/pages/RegisterPage'
import { DashboardPage } from '@/pages/DashboardPage'
import { NotFoundPage } from '@/pages/NotFoundPage'
import { IngresosPage } from '@/pages/IngresosPage'
import { EgresosPage } from '@/pages/EgresosPage'
import { PrestamosPage } from '@/pages/PrestamosPage'
import { MetasPage } from '@/pages/MetasPage'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      retry: 1,
    },
  },
})

export function App(): JSX.Element {
  const { initialize } = useAuthStore()

  useEffect(() => {
    let cleanup: (() => void) | undefined
    initialize().then((fn) => { cleanup = fn })
    return () => { cleanup?.() }
  }, [initialize])

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route element={<ProtectedRoute />}>
            <Route element={<Layout />}>
              <Route path="/" element={<DashboardPage />} />
              <Route path="/ingresos" element={<IngresosPage />} />
              <Route path="/egresos" element={<EgresosPage />} />
              <Route path="/prestamos" element={<PrestamosPage />} />
              <Route path="/metas" element={<MetasPage />} />
              <Route path="/presupuestos" element={<div className="p-4">Presupuestos - Issue futuro</div>} />
              <Route path="/reportes" element={<div className="p-4">Reportes - Issue futuro</div>} />
              <Route path="/configuracion" element={<div className="p-4">Configuracion - Issue futuro</div>} />
            </Route>
          </Route>
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  )
}
