import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '@/store/authStore'
import { useProfile } from '@/hooks/useProfile'

export function ProtectedRoute(): JSX.Element {
  const { t } = useTranslation()
  const { session, isLoading } = useAuthStore()
  const location = useLocation()
  const { data: profile, isLoading: profileLoading } = useProfile()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <svg className="animate-spin h-8 w-8 text-finza-blue" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <p className="text-sm text-gray-500">{t('common.loading')}</p>
        </div>
      </div>
    )
  }

  if (!session) {
    return <Navigate to="/login" replace />
  }

  // Wait for profile data before deciding on redirect
  if (profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <svg className="animate-spin h-8 w-8 text-finza-blue" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <p className="text-sm text-gray-500">{t('common.loading')}</p>
        </div>
      </div>
    )
  }

  const isOnboardingRoute = location.pathname === '/onboarding'

  // Redirect to onboarding if not completed
  if (profile && !profile.onboarding_completed && !isOnboardingRoute) {
    return <Navigate to="/onboarding" replace />
  }

  // Prevent access to onboarding if already completed
  if (profile && profile.onboarding_completed && isOnboardingRoute) {
    return <Navigate to="/dashboard" replace />
  }

  return <Outlet />
}
