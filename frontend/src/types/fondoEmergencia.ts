export interface FondoEmergenciaData {
  id: string
  user_id: string
  monto_actual: number
  meta_meses: 1 | 3 | 6
  meta_calculada: number | null
  porcentaje: number
  notas: string | null
}
