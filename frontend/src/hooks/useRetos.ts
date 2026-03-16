import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import apiClient from '@/lib/api'
import type { RetoData, UserRetoData } from '@/types/retos'

export function useCatalogoRetos() {
  return useQuery<RetoData[]>({
    queryKey: ['retos', 'catalogo'],
    queryFn: async () => {
      const { data } = await apiClient.get('/retos/catalogo')
      return data
    },
    staleTime: 10 * 60 * 1000,
  })
}

export function useMisRetos() {
  return useQuery<UserRetoData[]>({
    queryKey: ['retos', 'mis-retos'],
    queryFn: async () => {
      const { data } = await apiClient.get('/retos/mis-retos')
      return data
    },
    staleTime: 2 * 60 * 1000,
  })
}

export function useAceptarReto() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (retoId: string) => {
      const { data } = await apiClient.post(`/retos/aceptar/${retoId}`)
      return data
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['retos'] }),
  })
}

export function useCheckinReto() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (userRetoId: string) => {
      const { data } = await apiClient.post(`/retos/checkin/${userRetoId}`)
      return data
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['retos'] }),
  })
}

export function useAbandonarReto() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (userRetoId: string) => {
      await apiClient.patch(`/retos/abandonar/${userRetoId}`)
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['retos'] }),
  })
}
