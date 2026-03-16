import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api'

export interface ScoreBreakdown {
  ahorro: number
  presupuesto: number
  deuda: number
  emergencia: number
}

export interface ScoreData {
  score: number
  estado: 'critico' | 'en_riesgo' | 'bueno' | 'excelente'
  breakdown: ScoreBreakdown
}

export function useScore() {
  return useQuery({
    queryKey: ['score'],
    queryFn: async (): Promise<ScoreData> => {
      const { data } = await apiClient.get<ScoreData>('/score')
      return data
    },
    staleTime: 5 * 60 * 1000, // 5 min
  })
}
