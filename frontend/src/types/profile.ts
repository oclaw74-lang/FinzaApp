export interface ProfileData {
  user_id: string
  salario_mensual_neto: number | null
  mostrar_horas_trabajo: boolean
  horas_por_peso: number | null
  onboarding_completed: boolean
}

export interface ProfileUpdate {
  salario_mensual_neto?: number | null
  mostrar_horas_trabajo?: boolean
  onboarding_completed?: boolean
}
