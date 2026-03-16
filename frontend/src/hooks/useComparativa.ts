import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api'
import type { ComparativaData } from '@/types/comparativa'

export function useComparativa() {
  return useQuery<ComparativaData>({
    queryKey: ['comparativa'],
    queryFn: async () => {
      const { data } = await apiClient.get('/dashboard/comparativa-deuda-ahorro')
      return data
    },
    staleTime: 5 * 60 * 1000,
  })
}
