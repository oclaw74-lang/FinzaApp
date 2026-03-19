import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api'
import type { LeccionData } from '@/types/educacion'

export function useLecciones() {
  return useQuery<LeccionData[]>({
    queryKey: ['educacion', 'lecciones'],
    queryFn: async () => {
      const { data } = await apiClient.get('/educacion/lecciones')
      return data
    },
    staleTime: 5 * 60 * 1000,
  })
}

export function useCompletarLeccion() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (leccionId: string) => {
      const { data } = await apiClient.post(`/educacion/lecciones/${leccionId}/completar`)
      return data
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['educacion'] }),
  })
}
