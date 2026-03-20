export type TipoPrestamo = 'me_deben' | 'yo_debo'
export type EstadoPrestamo = 'activo' | 'pagado' | 'vencido'
export type AcreeedorTipo = 'persona' | 'banco'

export interface PagoPrestamo {
  id: string
  prestamo_id: string
  monto: number
  fecha: string
  notas?: string
  monto_capital?: number | null
  monto_interes?: number | null
  numero_cuota?: number | null
  created_at: string
}

export interface CuotaAmortizacion {
  numero: number
  fecha_estimada: string
  cuota: number
  capital: number
  interes: number
  saldo_restante: number
  pagado: boolean
  pago_real?: {
    monto: number
    capital: number
    interes: number
    fecha: string
  } | null
}

export interface TablaAmortizacionResponse {
  tabla: CuotaAmortizacion[]
  resumen: {
    monto_original: number
    monto_pendiente: number
    total_pagado_capital: number
    total_pagado_intereses: number
    total_intereses_proyectados: number
    cuotas_pagadas: number
    cuotas_totales: number
    sin_plazo?: boolean
  }
}

export interface Prestamo {
  id: string
  tipo: TipoPrestamo
  acreedor_tipo: AcreeedorTipo
  persona: string
  monto_original: number
  monto_pendiente: number
  monto_ya_pagado: number
  moneda: string
  fecha_prestamo: string
  fecha_vencimiento?: string
  descripcion?: string
  estado: EstadoPrestamo
  notas?: string
  pagos?: PagoPrestamo[]
  created_at: string
  tasa_interes?: number | null
  plazo_meses?: number | null
  cuota_mensual?: number | null
  total_intereses?: number | null
  proximo_pago?: string | null
}

export interface PrestamoCreate {
  tipo: TipoPrestamo
  acreedor_tipo?: AcreeedorTipo
  persona?: string
  monto_original: number
  moneda?: string
  fecha_prestamo: string
  fecha_vencimiento?: string
  descripcion?: string
  notas?: string
  tasa_interes?: number | null
  plazo_meses?: number | null
  monto_ya_pagado?: number
}

export interface PrestamoUpdate {
  acreedor_tipo?: AcreeedorTipo
  persona?: string
  monto_original?: number
  moneda?: string
  fecha_prestamo?: string
  fecha_vencimiento?: string
  descripcion?: string
  notas?: string
  estado?: EstadoPrestamo
  tasa_interes?: number | null
  plazo_meses?: number | null
}

export interface PagoPrestamoCreate {
  monto: number
  fecha: string
  notas?: string
}

export interface PrestamoResumen {
  total_me_deben: number
  total_yo_debo: number
  cantidad_activos: number
  cantidad_vencidos: number
}
