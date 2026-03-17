import { useEffect, useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Header } from './Header'
import { useUiStore } from '@/store/uiStore'
import { useProfile } from '@/hooks/useProfile'
import { OnboardingWizard } from '@/components/onboarding/OnboardingWizard'
import { cn } from '@/lib/utils'

export function Layout(): JSX.Element {
  const { sidebarCollapsed } = useUiStore()
  const { data: profile } = useProfile()
  const [showOnboarding, setShowOnboarding] = useState(false)

  useEffect(() => {
    if (profile && profile.onboarding_completed === false) {
      setShowOnboarding(true)
    }
  }, [profile])

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <div
        className={cn(
          'flex flex-col min-h-screen transition-all duration-300',
          sidebarCollapsed ? 'lg:ml-[72px]' : 'lg:ml-64'
        )}
      >
        <Header />
        <main className="flex-1 p-6 animate-fade-in">
          <Outlet />
        </main>
      </div>
      {showOnboarding && (
        <OnboardingWizard onComplete={() => setShowOnboarding(false)} />
      )}
    </div>
  )
}
