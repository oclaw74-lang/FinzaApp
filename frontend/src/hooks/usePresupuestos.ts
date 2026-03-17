import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  fetchPresupuestosEstado,
  createPresupuesto,
  updatePresupuesto,
  deletePresupuesto,
} from '@/lib/api/presupuestos'
import type {
  PresupuestoCreate,
  PresupuestoUpdate,
  PresupuestoEstado,
  Presupuesto,
} from '@/types/presupuesto'

// ─── Dashboard invalidation keys ────────────────────────────────────────────

const DASHBOARD_KEYS = [
  ['dashboard-v2'],
  ['score'],
  ['prediccion-mes'],
  ['comparativa'],
] as const

// ─── Query key factory ──────────────────────────────────────────────────────

export const presupuestosKeys = {
  all: ['presupuestos'] as const,
  estado: (mes: number, year: number) =>
    ['presupuestos', mes, year] as const,
}

// ─── Queries ────────────────────────────────────────────────────────────────

export function usePresupuestosEstado(mes: number, year: number) {
  return useQuery({
    queryKey: presupuestosKeys.estado(mes, year),
    queryFn: (): Promise<PresupuestoEstado[]> =>
      fetchPresupuestosEstado(mes, year),
  })
}

// ─── Mutations ──────────────────────────────────────────────────────────────

export function useCreatePresupuesto(mes: number, year: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: PresupuestoCreate): Promise<Presupuesto> =>
      createPresupuesto(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: presupuestosKeys.estado(mes, year),
      })
      DASHBOARD_KEYS.forEach(key => queryClient.invalidateQueries({ queryKey: key }))
    },
  })
}

export function useUpdatePresupuesto(mes: number, year: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      id,
      ...payload
    }: { id: string } & PresupuestoUpdate): Promise<Presupuesto> =>
      updatePresupuesto(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: presupuestosKeys.estado(mes, year),
      })
      DASHBOARD_KEYS.forEach(key => queryClient.invalidateQueries({ queryKey: key }))
    },
  })
}

export function useDeletePresupuesto(mes: number, year: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string): Promise<void> => deletePresupuesto(id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: presupuestosKeys.estado(mes, year),
      })
      DASHBOARD_KEYS.forEach(key => queryClient.invalidateQueries({ queryKey: key }))
    },
  })
}
