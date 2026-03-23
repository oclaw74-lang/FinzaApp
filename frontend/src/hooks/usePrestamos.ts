import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api'

const DASHBOARD_KEYS = [
  ['dashboard-v2'],
  ['score'],
  ['prediccion-mes'],
  ['comparativa'],
] as const

const invalidateDashboard = (queryClient: ReturnType<typeof useQueryClient>) => {
  DASHBOARD_KEYS.forEach(key =>
    queryClient.invalidateQueries({ queryKey: key, refetchType: 'all' })
  )
}

import type {
  Prestamo,
  PrestamoCreate,
  PrestamoUpdate,
  PagoPrestamoCreate,
  PagoPrestamo,
  PrestamoResumen,
  TipoPrestamo,
  EstadoPrestamo,
  TablaAmortizacionResponse,
} from '@/types/prestamo'

interface PrestamosFilters {
  tipo?: TipoPrestamo
  estado?: EstadoPrestamo
}

export function usePrestamos(filters: PrestamosFilters = {}) {
  return useQuery({
    queryKey: ['prestamos', filters],
    queryFn: async (): Promise<Prestamo[]> => {
      const params = new URLSearchParams()
      if (filters.tipo) params.set('tipo', filters.tipo)
      if (filters.estado) params.set('estado', filters.estado)
      const { data } = await apiClient.get<Prestamo[]>(
        `/prestamos?${params.toString()}`
      )
      return data
    },
  })
}

export function usePrestamoDetalle(id: string | null) {
  return useQuery({
    queryKey: ['prestamos', id],
    queryFn: async (): Promise<Prestamo> => {
      const { data } = await apiClient.get<Prestamo>(`/prestamos/${id}`)
      return data
    },
    enabled: id !== null,
  })
}

export function usePrestamoResumen() {
  return useQuery({
    queryKey: ['prestamos', 'resumen'],
    queryFn: async (): Promise<PrestamoResumen> => {
      const { data } = await apiClient.get<PrestamoResumen>('/prestamos/resumen')
      return data
    },
  })
}

export function useCreatePrestamo() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payload: PrestamoCreate): Promise<Prestamo> => {
      const { data } = await apiClient.post<Prestamo>('/prestamos', payload)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prestamos'] })
      invalidateDashboard(queryClient)
    },
  })
}

export function useUpdatePrestamo() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...payload }: { id: string } & PrestamoUpdate): Promise<Prestamo> => {
      const { data } = await apiClient.put<Prestamo>(`/prestamos/${id}`, payload)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prestamos'] })
      invalidateDashboard(queryClient)
    },
  })
}

export function useDeletePrestamo() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      await apiClient.delete(`/prestamos/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prestamos'] })
      invalidateDashboard(queryClient)
    },
  })
}

export function useRegistrarPago(prestamoId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payload: PagoPrestamoCreate): Promise<PagoPrestamo> => {
      const { data } = await apiClient.post<PagoPrestamo>(
        `/prestamos/${prestamoId}/pagos`,
        payload
      )
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prestamos'] })
      queryClient.invalidateQueries({ queryKey: ['egresos'] })
      invalidateDashboard(queryClient)
    },
  })
}

export function useTablaAmortizacion(prestamoId: string | null) {
  return useQuery<TablaAmortizacionResponse>({
    queryKey: ['amortizacion', prestamoId],
    queryFn: async () => {
      const res = await apiClient.get<TablaAmortizacionResponse>(`/prestamos/${prestamoId}/amortizacion`)
      return res.data
    },
    enabled: !!prestamoId,
    staleTime: 30_000,
  })
}

export function useDeletePago(prestamoId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (pagoId: string): Promise<void> => {
      await apiClient.delete(`/prestamos/${prestamoId}/pagos/${pagoId}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prestamos'] })
      invalidateDashboard(queryClient)
    },
  })
}
