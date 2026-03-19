import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api'

export interface NotificacionData {
  id: string
  tipo: 'urgente' | 'informativa' | 'logro' | 'advertencia'
  categoria: string
  titulo: string
  mensaje: string
  leida: boolean
  created_at: string
}

export function useNotificaciones(soloNoLeidas?: boolean) {
  return useQuery({
    queryKey: ['notificaciones', soloNoLeidas],
    queryFn: async (): Promise<NotificacionData[]> => {
      const params = soloNoLeidas === false ? '?leida=false' : ''
      const { data } = await apiClient.get<NotificacionData[]>(`/notificaciones${params}`)
      return data
    },
    staleTime: 60 * 1000, // 1 min
  })
}

export function useMarcarLeida() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string): Promise<NotificacionData> => {
      const { data } = await apiClient.patch<NotificacionData>(`/notificaciones/${id}/leer`)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notificaciones'] })
    },
  })
}

export function useMarcarTodasLeidas() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (): Promise<{ actualizadas: number }> => {
      const { data } = await apiClient.patch<{ actualizadas: number }>('/notificaciones/leer-todas')
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notificaciones'] })
    },
  })
}

export function useEliminarNotificacion() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      await apiClient.delete(`/notificaciones/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notificaciones'] })
    },
  })
}

export function useGenerarNotificaciones() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (): Promise<{ generadas: number; mensaje: string }> => {
      const { data } = await apiClient.post('/notificaciones/generar')
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notificaciones'] })
    },
  })
}
