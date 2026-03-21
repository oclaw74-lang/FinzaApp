import { useAuthStore } from '@/store/authStore'

/**
 * Returns the user's preferred currency code.
 * Reads from auth.user_metadata.currency (set during onboarding/settings).
 * Falls back to 'DOP' if not set.
 */
export function useUserCurrency(): string {
  const { user } = useAuthStore()
  return (user?.user_metadata?.currency as string | undefined) ?? 'DOP'
}
