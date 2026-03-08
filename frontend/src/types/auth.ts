import type { User, Session } from '@supabase/supabase-js'

export type { User, Session }

export interface AuthState {
  session: Session | null
  user: User | null
  isLoading: boolean
}
