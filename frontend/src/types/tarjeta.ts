export type TipoTarjeta = 'credito' | 'debito'
export type RedTarjeta = 'visa' | 'mastercard' | 'amex' | 'discover' | 'otro'

export interface MovimientoTarjeta {
  id: string
  tarjeta_id: string
  tipo: 'compra' | 'pago'
  monto: number
  descripcion: string | null
  fecha: string
  egreso_id: string | null
  notas: string | null
  created_at: string
}

export interface MovimientoTarjetaCreate {
  tipo: 'compra' | 'pago'
  monto: number
  descripcion?: string
  fecha: string
  categoria_id?: string
  notas?: string
}

export interface Tarjeta {
  id: string
  user_id: string
  banco: string
  banco_id?: string | null
  banco_custom?: string | null
  titular: string | null
  tipo: TipoTarjeta
  red: RedTarjeta
  ultimos_digitos: string
  saldo_actual: number
  limite_credito: number | null
  disponible: number | null
  fecha_corte: number | null
  fecha_pago: number | null
  color: string | null
  activa: boolean
  bloqueada: boolean
  created_at: string
  updated_at: string
}

export interface TarjetaCreate {
  banco: string
  banco_id?: string | null
  banco_custom?: string | null
  titular?: string | null
  tipo: TipoTarjeta
  red: RedTarjeta
  ultimos_digitos: string
  saldo_actual: number
  limite_credito?: number | null
  fecha_corte?: number | null
  fecha_pago?: number | null
  color?: string | null
  activa?: boolean
}

export interface TarjetaUpdate {
  banco?: string
  banco_id?: string | null
  banco_custom?: string | null
  titular?: string | null
  tipo?: TipoTarjeta
  red?: RedTarjeta
  ultimos_digitos?: string
  saldo_actual?: number
  limite_credito?: number | null
  fecha_corte?: number | null
  fecha_pago?: number | null
  color?: string | null
  activa?: boolean
}
