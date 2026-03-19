import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api'
import type {
  RecurrenteResponse,
  ProximoVencimientoResponse,
  RecurrenteCreate,
  RecurrenteUpdate,
} from '@/types/recurrente'

export function useRecurrentes(activo?: boolean) {
  return useQuery<RecurrenteResponse[]>({
    queryKey: ['recurrentes'],
    queryFn: async () => {
      const params = activo !== undefined ? { activo } : {}
      const { data } = await apiClient.get('/recurrentes', { params })
      return data
    },
    staleTime: 2 * 60 * 1000,
  })
}

export function useProximosVencimientos(mes: number, year: number) {
  return useQuery<ProximoVencimientoResponse[]>({
    queryKey: ['recurrentes', 'proximos', mes, year],
    queryFn: async () => {
      const { data } = await apiClient.get('/recurrentes/proximos', { params: { mes, year } })
      return data
    },
    staleTime: 2 * 60 * 1000,
  })
}

export function useCreateRecurrente() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payload: RecurrenteCreate) => {
      const { data } = await apiClient.post('/recurrentes', payload)
      return data as RecurrenteResponse
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['recurrentes'] }),
  })
}

export function useUpdateRecurrente() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...payload }: RecurrenteUpdate & { id: string }) => {
      const { data } = await apiClient.put(`/recurrentes/${id}`, payload)
      return data as RecurrenteResponse
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['recurrentes'] }),
  })
}

export function useDeleteRecurrente() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/recurrentes/${id}`)
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['recurrentes'] }),
  })
}
