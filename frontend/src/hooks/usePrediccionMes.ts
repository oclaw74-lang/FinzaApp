import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api'

export interface CategoriaImpacto {
  nombre: string
  monto: number
  porcentaje_del_total: number
}

export interface PrediccionMesData {
  saldo_proyectado: number
  saldo_si_presupuesto: number | null
  es_negativa: boolean
  categoria_mayor_impacto: CategoriaImpacto | null
  sugerencia: string
  dias_restantes: number
  gasto_diario_promedio: number
}

export function usePrediccionMes() {
  return useQuery({
    queryKey: ['prediccion-mes'],
    queryFn: async (): Promise<PrediccionMesData> => {
      const { data } = await apiClient.get<PrediccionMesData>('/prediccion/mes')
      return data
    },
    staleTime: 2 * 60 * 1000, // 2 min
  })
}
