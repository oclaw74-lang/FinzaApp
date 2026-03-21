import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api'
import type { EstadoCuenta, EstadoCuentaUploadPayload } from '@/types/estadoCuenta'

export function useEstadosCuenta(tarjetaId?: string | null) {
  return useQuery({
    queryKey: ['estados-cuenta', tarjetaId ?? null],
    queryFn: async (): Promise<EstadoCuenta[]> => {
      const params = tarjetaId ? { tarjeta_id: tarjetaId } : {}
      const { data } = await apiClient.get<EstadoCuenta[]>('/estados-cuenta/', { params })
      return data
    },
  })
}

export function useUploadEstadoCuenta() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payload: EstadoCuentaUploadPayload): Promise<EstadoCuenta> => {
      const form = new FormData()
      form.append('file', payload.file)
      if (payload.tarjeta_id) form.append('tarjeta_id', payload.tarjeta_id)
      if (payload.fecha_estado) form.append('fecha_estado', payload.fecha_estado)
      if (payload.monto_total != null) form.append('monto_total', String(payload.monto_total))

      const { data } = await apiClient.post<EstadoCuenta>('/estados-cuenta/upload', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['estados-cuenta'] })
    },
  })
}

export function useDeleteEstadoCuenta() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (estadoId: string): Promise<void> => {
      await apiClient.delete(`/estados-cuenta/${estadoId}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['estados-cuenta'] })
    },
  })
}
