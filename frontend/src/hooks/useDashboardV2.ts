import { useQuery } from '@tanstack/react-query'
import { getDashboardV2 } from '@/lib/api/dashboard'
import type { DashboardV2Response } from '@/types/dashboard'

interface DashboardV2Params {
  mes: number
  year: number
}

export function useDashboardV2({ mes, year }: DashboardV2Params) {
  return useQuery<DashboardV2Response, Error>({
    queryKey: ['dashboard-v2', mes, year],
    queryFn: () => getDashboardV2(mes, year),
    staleTime: 2 * 60 * 1000,
  })
}
