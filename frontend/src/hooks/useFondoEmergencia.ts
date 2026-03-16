import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api'
import type { FondoEmergenciaData } from '@/types/fondoEmergencia'

export function useFondoEmergencia() {
  return useQuery({
    queryKey: ['fondo-emergencia'],
    queryFn: async () => {
      try {
        const { data } = await apiClient.get('/fondo-emergencia')
        return data as FondoEmergenciaData
      } catch (err: unknown) {
        const e = err as { response?: { status?: number } }
        if (e?.response?.status === 404) return null
        throw err
      }
    },
    staleTime: 5 * 60 * 1000,
  })
}

export function useCreateFondoEmergencia() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payload: { monto_actual?: number; meta_meses?: number; notas?: string }) => {
      const { data } = await apiClient.post('/fondo-emergencia', payload)
      return data as FondoEmergenciaData
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['fondo-emergencia'] }),
  })
}

export function useUpdateFondoEmergencia() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payload: { monto_actual?: number; meta_meses?: number; notas?: string }) => {
      const { data } = await apiClient.patch('/fondo-emergencia', payload)
      return data as FondoEmergenciaData
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['fondo-emergencia'] }),
  })
}

export function useDepositarFondo() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (monto: number) => {
      const { data } = await apiClient.post('/fondo-emergencia/depositar', { monto })
      return data as FondoEmergenciaData
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['fondo-emergencia'] }),
  })
}

export function useRetirarFondo() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (monto: number) => {
      const { data } = await apiClient.post('/fondo-emergencia/retirar', { monto })
      return data as FondoEmergenciaData
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['fondo-emergencia'] }),
  })
}
