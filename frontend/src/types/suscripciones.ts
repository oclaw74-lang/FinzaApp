export interface SuscripcionData {
  id: string
  nombre: string
  monto: number
  monto_mensual: number
  frecuencia: 'mensual' | 'anual' | 'semanal' | 'trimestral'
  moneda: string
  activa: boolean
  auto_detectada: boolean
  fecha_proximo_cobro: string | null
  notas: string | null
  categoria_id?: string | null
}

export interface SuscripcionResumen {
  total_mensual: number
  total_anual: number
  cantidad_activas: number
  suscripciones: SuscripcionData[]
}
