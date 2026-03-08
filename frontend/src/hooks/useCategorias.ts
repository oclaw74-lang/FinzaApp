import { useQuery } from '@tanstack/react-query'
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
