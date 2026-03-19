import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api'
import type { SuscripcionData, SuscripcionResumen } from '@/types/suscripciones'

export function useSuscripcionesResumen() {
  return useQuery({
    queryKey: ['suscripciones-resumen'],
    queryFn: async () => {
      const { data } = await apiClient.get('/suscripciones/resumen')
      return data as SuscripcionResumen
    },
    staleTime: 5 * 60 * 1000,
  })
}

export function useCreateSuscripcion() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payload: {
      nombre: string
      monto: number
      frecuencia: string
      moneda?: string
      categoria_id?: string
      fecha_proximo_cobro?: string
      notas?: string
    }) => {
      const { data } = await apiClient.post('/suscripciones', payload)
      return data as SuscripcionData
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['suscripciones-resumen'] }),
  })
}

export function useUpdateSuscripcion() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...payload }: Partial<SuscripcionData> & { id: string }) => {
      const { data } = await apiClient.put(`/suscripciones/${id}`, payload)
      return data as SuscripcionData
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['suscripciones-resumen'] }),
  })
}

export function useDeleteSuscripcion() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/suscripciones/${id}`)
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['suscripciones-resumen'] }),
  })
}

export function useDetectarSuscripciones() {
  return useMutation({
    mutationFn: async () => {
      const { data } = await apiClient.post('/suscripciones/detectar')
      return data as SuscripcionData[]
    },
  })
}

export function useConfirmarDetectadas() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (candidatos: SuscripcionData[]) => {
      const { data } = await apiClient.post('/suscripciones/confirmar-detectadas', {
        candidatos: candidatos.map((c) => ({
          nombre: c.nombre,
          monto: c.monto,
          frecuencia: c.frecuencia,
          moneda: c.moneda,
          categoria_id: c.categoria_id ?? undefined,
        })),
      })
      return data as SuscripcionData[]
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['suscripciones-resumen'] }),
  })
}
