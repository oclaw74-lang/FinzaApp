export type TipoPrestamo = 'me_deben' | 'yo_debo'
export type EstadoPrestamo = 'activo' | 'pagado' | 'vencido'

export interface PagoPrestamo {
  id: string
  prestamo_id: string
  monto: number
  fecha: string
  notas?: string
  created_at: string
}

export interface Prestamo {
  id: string
  tipo: TipoPrestamo
  persona: string
  monto_original: number
  monto_pendiente: number
  moneda: string
  fecha_prestamo: string
  fecha_vencimiento?: string
  descripcion?: string
  estado: EstadoPrestamo
  notas?: string
  pagos?: PagoPrestamo[]
  created_at: string
}

export interface PrestamoCreate {
  tipo: TipoPrestamo
  persona: string
  monto_original: number
  moneda?: string
  fecha_prestamo: string
  fecha_vencimiento?: string
  descripcion?: string
  notas?: string
}

export interface PrestamoUpdate {
  persona?: string
  monto_original?: number
  moneda?: string
  fecha_prestamo?: string
  fecha_vencimiento?: string
  descripcion?: string
  notas?: string
  estado?: EstadoPrestamo
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
