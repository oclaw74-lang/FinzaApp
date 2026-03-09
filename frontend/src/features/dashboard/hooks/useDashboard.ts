import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api'
import type { DashboardResponse } from '@/types/dashboard'

interface DashboardParams {
  mes: number
  year: number
}

export function useDashboard({ mes, year }: DashboardParams) {
  return useQuery({
    queryKey: ['dashboard', mes, year],
    queryFn: async (): Promise<DashboardResponse> => {
      const { data } = await apiClient.get<DashboardResponse>(
        `/dashboard?mes=${mes}&year=${year}`
      )
      return data
    },
  })
}
