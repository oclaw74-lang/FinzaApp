import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api'
import type { Tarjeta, TarjetaCreate, TarjetaUpdate, TarjetaPagoPendiente } from '@/types/tarjeta'

const DASHBOARD_KEYS = [
  ['dashboard-v2'],
  ['score'],
] as const

export function useTarjetas() {
  return useQuery({
    queryKey: ['tarjetas'],
    queryFn: async (): Promise<Tarjeta[]> => {
      const { data } = await apiClient.get<Tarjeta[]>('/tarjetas')
      return data
    },
  })
}

export function useTarjetaDetalle(id: string | null) {
  return useQuery({
    queryKey: ['tarjetas', id],
    queryFn: async (): Promise<Tarjeta> => {
      const { data } = await apiClient.get<Tarjeta>(`/tarjetas/${id}`)
      return data
    },
    enabled: id !== null,
  })
}

export function useCreateTarjeta() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payload: TarjetaCreate): Promise<Tarjeta> => {
      const { data } = await apiClient.post<Tarjeta>('/tarjetas', payload)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tarjetas'] })
      DASHBOARD_KEYS.forEach(key => queryClient.invalidateQueries({ queryKey: key }))
    },
  })
}

export function useUpdateTarjeta() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...payload }: { id: string } & TarjetaUpdate): Promise<Tarjeta> => {
      const { data } = await apiClient.put<Tarjeta>(`/tarjetas/${id}`, payload)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tarjetas'] })
      DASHBOARD_KEYS.forEach(key => queryClient.invalidateQueries({ queryKey: key }))
    },
  })
}

export function useDeleteTarjeta() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      await apiClient.delete(`/tarjetas/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tarjetas'] })
      DASHBOARD_KEYS.forEach(key => queryClient.invalidateQueries({ queryKey: key }))
    },
  })
}

export function useBloquearTarjeta() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string): Promise<Tarjeta> => {
      const { data } = await apiClient.patch<Tarjeta>(`/tarjetas/${id}/bloquear`)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tarjetas'] })
      DASHBOARD_KEYS.forEach(key => queryClient.invalidateQueries({ queryKey: key }))
    },
  })
}

export function useTarjetasPagoPendiente() {
  return useQuery({
    queryKey: ['tarjetas-pagos-pendientes'],
    queryFn: async (): Promise<TarjetaPagoPendiente[]> => {
      const { data } = await apiClient.get<TarjetaPagoPendiente[]>('/tarjetas/pagos-pendientes')
      return data
    },
    staleTime: 5 * 60 * 1000, // 5 min — no need to refetch on every render
  })
}
