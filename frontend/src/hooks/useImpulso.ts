import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api'

export interface ImpulsoResumen {
  cantidad_impulso: number
  total_impulso: number
  porcentaje_del_total: number
}

export function useEvaluarImpulsos(mes: number, year: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async () => {
      const { data } = await apiClient.post(`/egresos/evaluar-impulsos?mes=${mes}&year=${year}`)
      return data
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['egresos'] }),
  })
}

export function useClasificarImpulso() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ egresoId, esImpulso }: { egresoId: string; esImpulso: boolean }) => {
      const { data } = await apiClient.patch(`/egresos/${egresoId}/clasificar-impulso`, { es_impulso: esImpulso })
      return data
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['egresos'] }),
  })
}

export function useResumenImpulso(mes: number, year: number) {
  return useQuery({
    queryKey: ['resumen-impulso', mes, year],
    queryFn: async () => {
      const { data } = await apiClient.get(`/egresos/resumen-impulso?mes=${mes}&year=${year}`)
      return data as ImpulsoResumen
    },
    staleTime: 2 * 60 * 1000,
  })
}
