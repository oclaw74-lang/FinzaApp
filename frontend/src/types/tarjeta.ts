export type TipoTarjeta = 'credito' | 'debito'
export type RedTarjeta = 'visa' | 'mastercard' | 'amex' | 'discover' | 'otro'
export type TipoMovimiento = 'compra' | 'pago' | 'deposito'

export interface MovimientoTarjeta {
  id: string
  tarjeta_id: string
  tipo: TipoMovimiento
  monto: number
  descripcion: string | null
  fecha: string
  egreso_id: string | null
  ingreso_id: string | null
  notas: string | null
  created_at: string
}

export interface MovimientoTarjetaCreate {
  tipo: TipoMovimiento
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
  moneda: string
  saldo_secundario: number
  limite_secundario: number
  fecha_corte: number | null
  fecha_pago: number | null
  color: string | null
  activa: boolean
  bloqueada: boolean
  created_at: string
  updated_at: string
}

/** Credit card with an upcoming payment due (returned by /tarjetas/pagos-pendientes). */
export interface TarjetaPagoPendiente extends Tarjeta {
  dias_para_pago: number
  fecha_pago_proxima: string
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
  moneda?: string
  saldo_secundario?: number
  limite_secundario?: number
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
  moneda?: string
  saldo_secundario?: number | null
  limite_secundario?: number | null
  limite_credito?: number | null
  fecha_corte?: number | null
  fecha_pago?: number | null
  color?: string | null
  activa?: boolean
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
