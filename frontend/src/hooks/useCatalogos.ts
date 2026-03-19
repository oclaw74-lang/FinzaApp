import { useQuery } from '@tanstack/react-query'
import type { UseQueryResult } from '@tanstack/react-query'
import { apiClient } from '@/lib/api'
import type { Moneda, Pais, Banco } from '@/types/catalogos'

export function useMonedas(): UseQueryResult<Moneda[]> {
  return useQuery({
    queryKey: ['catalogos', 'monedas'],
    queryFn: async (): Promise<Moneda[]> => {
      const { data } = await apiClient.get<Moneda[]>('/catalogos/monedas')
      return data
    },
    staleTime: Infinity,
  })
}

export function usePaises(): UseQueryResult<Pais[]> {
  return useQuery({
    queryKey: ['catalogos', 'paises'],
    queryFn: async (): Promise<Pais[]> => {
      const { data } = await apiClient.get<Pais[]>('/catalogos/paises')
      return data
    },
    staleTime: Infinity,
  })
}

export function useBancos(paisCodigo: string | null): UseQueryResult<Banco[]> {
  return useQuery({
    queryKey: ['catalogos', 'bancos', paisCodigo],
    queryFn: async (): Promise<Banco[]> => {
      const { data } = await apiClient.get<Banco[]>(`/catalogos/paises/${paisCodigo}/bancos`)
      return data
    },
    enabled: paisCodigo !== null,
    staleTime: Infinity,
  })
}
