import { apiClient } from '@/lib/api'
import type {
  Presupuesto,
  PresupuestoCreate,
  PresupuestoUpdate,
  PresupuestoEstado,
} from '@/types/presupuesto'

export async function fetchPresupuestosEstado(
  mes: number,
  year: number
): Promise<PresupuestoEstado[]> {
  const { data } = await apiClient.get<PresupuestoEstado[]>(
    `/presupuestos/estado?mes=${mes}&year=${year}`
  )
  return data
}

export async function fetchPresupuestos(
  mes: number,
  year: number
): Promise<Presupuesto[]> {
  const { data } = await apiClient.get<Presupuesto[]>(
    `/presupuestos?mes=${mes}&year=${year}`
  )
  return data
}

export async function fetchPresupuestoById(id: string): Promise<Presupuesto> {
  const { data } = await apiClient.get<Presupuesto>(`/presupuestos/${id}`)
  return data
}

export async function createPresupuesto(
  payload: PresupuestoCreate
): Promise<Presupuesto> {
  const { data } = await apiClient.post<Presupuesto>('/presupuestos', payload)
  return data
}

export async function updatePresupuesto(
  id: string,
  payload: PresupuestoUpdate
): Promise<Presupuesto> {
  const { data } = await apiClient.put<Presupuesto>(
    `/presupuestos/${id}`,
    payload
  )
  return data
}

export async function deletePresupuesto(id: string): Promise<void> {
  await apiClient.delete(`/presupuestos/${id}`)
}
