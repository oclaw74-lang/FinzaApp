export type FrecuenciaPago = 'quincenal' | 'bisemanal' | 'mensual'

export interface ProfileData {
  user_id: string
  mostrar_horas_trabajo: boolean
  horas_por_peso: number | null
  onboarding_completed: boolean
  salario_bruto: number | null
  salario_neto: number | null
  descuentos_adicionales: number | null
  frecuencia_pago: FrecuenciaPago | null
  porcentaje_ahorro_metas: number | null
  porcentaje_ahorro_fondo: number | null
  asignacion_automatica_activa: boolean
}

export interface ProfileUpdate {
  mostrar_horas_trabajo?: boolean
  onboarding_completed?: boolean
  salario_bruto?: number | null
  salario_neto?: number | null
  descuentos_adicionales?: number | null
  frecuencia_pago?: FrecuenciaPago | null
  porcentaje_ahorro_metas?: number | null
  porcentaje_ahorro_fondo?: number | null
  asignacion_automatica_activa?: boolean
}
