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
