export type EstadoMeta = 'activa' | 'completada' | 'cancelada'
export type TipoContribucion = 'deposito' | 'retiro'

export interface MetaAhorro {
  id: string
  user_id: string
  nombre: string
  descripcion: string | null
  monto_objetivo: number
  monto_actual: number
  moneda?: string
  fecha_inicio: string
  fecha_objetivo: string | null
  estado: EstadoMeta
  color: string | null
  icono: string | null
  created_at: string
  updated_at: string
}

export interface MetaAhorroCreate {
  nombre: string
  descripcion?: string
  monto_objetivo: number
  moneda?: string
  fecha_inicio: string
  fecha_objetivo?: string
  color?: string
  icono?: string
}

export interface MetaAhorroUpdate {
  nombre?: string
  descripcion?: string
  monto_objetivo?: number
  moneda?: string
  fecha_inicio?: string
  fecha_objetivo?: string
  color?: string
  icono?: string
  estado?: EstadoMeta
}

export interface ContribucionMeta {
  id: string
  meta_id: string
  monto: number
  tipo: TipoContribucion
  fecha: string
  notas: string | null
  created_at: string
}

export interface ContribucionMetaCreate {
  monto: number
  tipo: TipoContribucion
  fecha: string
  notas?: string
}

export interface MetasResumen {
  total_ahorrado: number
  metas_activas: number
  metas_completadas: number
  porcentaje_promedio_cumplimiento: number
}
