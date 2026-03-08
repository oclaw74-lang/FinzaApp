import { create } from 'zustand'
import type { Session, User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

interface AuthStore {
  session: Session | null
  user: User | null
  isLoading: boolean
  setSession: (session: Session | null) => void
  signOut: () => Promise<void>
  initialize: () => Promise<() => void>
}

export const useAuthStore = create<AuthStore>((set) => ({
  session: null,
  user: null,
  isLoading: true,
  setSession: (session) =>
    set({ session, user: session?.user ?? null, isLoading: false }),
  signOut: async () => {
    await supabase.auth.signOut()
    set({ session: null, user: null, isLoading: false })
  },
  initialize: async () => {
    const { data: { session } } = await supabase.auth.getSession()
    set({ session, user: session?.user ?? null, isLoading: false })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        set({ session, user: session?.user ?? null, isLoading: false })
      }
    )

    return () => subscription.unsubscribe()
  },
}))
