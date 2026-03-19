import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api'
import type { IngresoResponse, PaginatedResponse } from '@/types/transacciones'

const DASHBOARD_KEYS = [
  ['dashboard-v2'],
  ['score'],
  ['prediccion-mes'],
  ['comparativa'],
] as const

interface IngresosFilters {
  fecha_desde?: string
  fecha_hasta?: string
  categoria_id?: string
  moneda?: string
  page?: number
  page_size?: number
}

export function useIngresos(filters: IngresosFilters = {}) {
  return useQuery({
    queryKey: ['ingresos', filters],
    queryFn: async (): Promise<PaginatedResponse<IngresoResponse>> => {
      const params = new URLSearchParams()
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== '') params.set(key, String(value))
      })
      const { data } = await apiClient.get<PaginatedResponse<IngresoResponse>>(
        `/ingresos?${params.toString()}`
      )
      return data
    },
  })
}

export function useCreateIngreso() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payload: object) => {
      const { data } = await apiClient.post<IngresoResponse>('/ingresos', payload)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ingresos'] })
      DASHBOARD_KEYS.forEach(key => queryClient.invalidateQueries({ queryKey: key }))
    },
  })
}

export function useUpdateIngreso() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...payload }: { id: string } & object) => {
      const { data } = await apiClient.put<IngresoResponse>(`/ingresos/${id}`, payload)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ingresos'] })
      DASHBOARD_KEYS.forEach(key => queryClient.invalidateQueries({ queryKey: key }))
    },
  })
}

export function useDeleteIngreso() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/ingresos/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ingresos'] })
      DASHBOARD_KEYS.forEach(key => queryClient.invalidateQueries({ queryKey: key }))
    },
  })
}
