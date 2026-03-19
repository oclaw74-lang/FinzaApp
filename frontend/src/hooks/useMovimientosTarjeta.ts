import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api'
import type { MovimientoTarjeta, MovimientoTarjetaCreate } from '@/types/tarjeta'

export function useMovimientosTarjeta(tarjetaId: string, tipo?: 'compra' | 'pago') {
  return useQuery<MovimientoTarjeta[]>({
    queryKey: ['movimientos-tarjeta', tarjetaId, tipo],
    queryFn: async () => {
      const params = new URLSearchParams({ limit: '50' })
      if (tipo) params.append('tipo', tipo)
      const res = await apiClient.get<MovimientoTarjeta[]>(`/tarjetas/${tarjetaId}/movimientos?${params}`)
      return res.data
    },
    enabled: !!tarjetaId,
  })
}

export function useRegistrarMovimiento(tarjetaId: string) {
  const qc = useQueryClient()
  return useMutation<unknown, Error, MovimientoTarjetaCreate>({
    mutationFn: (data) =>
      apiClient.post(`/tarjetas/${tarjetaId}/movimientos`, data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['movimientos-tarjeta', tarjetaId] })
      qc.invalidateQueries({ queryKey: ['tarjetas'] })
    },
  })
}

export function useEliminarMovimiento(tarjetaId: string) {
  const qc = useQueryClient()
  return useMutation<unknown, Error, string>({
    mutationFn: (movimientoId) =>
      apiClient.delete(`/tarjetas/${tarjetaId}/movimientos/${movimientoId}`).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['movimientos-tarjeta', tarjetaId] })
      qc.invalidateQueries({ queryKey: ['tarjetas'] })
    },
  })
}
