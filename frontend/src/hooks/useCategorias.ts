import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api'
import type { CategoriaResponse } from '@/types/transacciones'

export function useCategorias(tipo?: 'ingreso' | 'egreso') {
  return useQuery({
    queryKey: ['categorias', tipo],
    queryFn: async (): Promise<CategoriaResponse[]> => {
      const params = tipo ? `?tipo=${tipo}` : ''
      const { data } = await apiClient.get<CategoriaResponse[]>(`/categorias${params}`)
      return data
    },
    staleTime: 10 * 60 * 1000, // 10 min — categorias no cambian seguido
  })
}

export function useCreateCategoria() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payload: { nombre: string; tipo: 'ingreso' | 'egreso' | 'ambos'; icono?: string }) => {
      const { data } = await apiClient.post('/categorias', payload)
      return data
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['categorias'] }),
  })
}

export function useUpdateCategoria() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...payload }: { id: string; nombre?: string; tipo?: string; icono?: string }) => {
      const { data } = await apiClient.put(`/categorias/${id}`, payload)
      return data
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['categorias'] }),
  })
}

export function useDeleteCategoria() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      await apiClient.delete(`/categorias/${id}`)
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['categorias'] }),
  })
}
