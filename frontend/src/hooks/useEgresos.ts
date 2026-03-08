import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api'
import type { EgresoResponse, PaginatedResponse } from '@/types/transacciones'

interface EgresosFilters {
  fecha_desde?: string
  fecha_hasta?: string
  categoria_id?: string
  moneda?: string
  page?: number
  page_size?: number
}

export function useEgresos(filters: EgresosFilters = {}) {
  return useQuery({
    queryKey: ['egresos', filters],
    queryFn: async (): Promise<PaginatedResponse<EgresoResponse>> => {
      const params = new URLSearchParams()
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== '') params.set(key, String(value))
      })
      const { data } = await apiClient.get<PaginatedResponse<EgresoResponse>>(
        `/egresos?${params.toString()}`
      )
      return data
    },
  })
}

export function useCreateEgreso() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payload: object) => {
      const { data } = await apiClient.post<EgresoResponse>('/egresos', payload)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['egresos'] })
    },
  })
}

export function useUpdateEgreso() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...payload }: { id: string } & object) => {
      const { data } = await apiClient.put<EgresoResponse>(`/egresos/${id}`, payload)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['egresos'] })
    },
  })
}

export function useDeleteEgreso() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/egresos/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['egresos'] })
    },
  })
}
