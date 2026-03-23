import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api'

export interface DualMonedaConfig {
  moneda_principal: string
  moneda_secundaria: string | null
  tasa_cambio: number | null
  tasa_cambio_actualizada_at: string | null
}

interface DualMonedaUpdate {
  moneda_secundaria?: string | null
  tasa_cambio?: number
}

export function useDualMoneda() {
  return useQuery<DualMonedaConfig>({
    queryKey: ['dual-moneda'],
    queryFn: async (): Promise<DualMonedaConfig> => {
      const { data } = await apiClient.get<DualMonedaConfig>('/config/dual-moneda')
      return data
    },
  })
}

export function useUpdateDualMoneda() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payload: DualMonedaUpdate): Promise<DualMonedaConfig> => {
      const { data } = await apiClient.put<DualMonedaConfig>('/config/dual-moneda', payload)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dual-moneda'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-v2'] })
    },
  })
}
