import { apiClient } from '@/lib/api'
import type { DashboardV2Response } from '@/types/dashboard'

export async function getDashboardV2(
  mes: number,
  year: number
): Promise<DashboardV2Response> {
  const { data } = await apiClient.get<DashboardV2Response>(
    `/dashboard/v2?mes=${mes}&year=${year}`
  )
  return data
}
