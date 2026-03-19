export type TipoRecurrente = 'ingreso' | 'egreso'
export type FrecuenciaRecurrente = 'diaria' | 'semanal' | 'quincenal' | 'mensual'

export interface RecurrenteResponse {
  id: string
  user_id: string
  tipo: TipoRecurrente
  descripcion: string
  monto: number
  categoria_id: string | null
  frecuencia: FrecuenciaRecurrente
  dia_del_mes: number | null
  fecha_inicio: string
  fecha_fin: string | null
  activo: boolean
  created_at: string
  updated_at: string
}

export interface ProximoVencimientoResponse {
  recurrente: RecurrenteResponse
  fecha_estimada: string
}

export interface RecurrenteCreate {
  tipo: TipoRecurrente
  descripcion: string
  monto: number
  categoria_id?: string | null
  frecuencia: FrecuenciaRecurrente
  dia_del_mes?: number | null
  fecha_inicio: string
  fecha_fin?: string | null
  activo?: boolean
}

export type RecurrenteUpdate = Partial<RecurrenteCreate>
