export interface Presupuesto {
  id: string
  user_id: string
  categoria_id: string
  mes: number
  year: number
  monto_limite: number
  created_at: string
  updated_at: string
}

export interface PresupuestoCreate {
  categoria_id: string
  mes: number
  year: number
  monto_limite: number
  aplicar_todos_los_meses?: boolean
}

export interface PresupuestoUpdate {
  monto_limite: number
}

export interface PresupuestoEstado {
  id: string
  categoria_id: string
  categoria_nombre: string
  mes: number
  year: number
  monto_limite: number
  gasto_actual: number
  porcentaje_usado: number
  alerta: boolean
}

export interface PresupuestoSugerido {
  categoria_id: string
  categoria_nombre: string
  promedio_mensual: number
  sugerido: number
  mes: number
  year: number
}
