export interface CategoriaResponse {
  id: string
  nombre: string
  nombre_en?: string
  tipo: 'ingreso' | 'egreso' | 'ambos'
  icono: string | null
  color: string | null
  es_sistema: boolean
}

export interface IngresoResponse {
  id: string
  categoria_id: string
  subcategoria_id: string | null
  monto: string
  moneda: 'DOP' | 'USD'
  descripcion: string | null
  fuente: string | null
  fecha: string
  notas: string | null
}

export interface EgresoResponse {
  id: string
  categoria_id: string
  subcategoria_id: string | null
  monto: string
  moneda: 'DOP' | 'USD'
  descripcion: string | null
  metodo_pago: 'efectivo' | 'tarjeta' | 'transferencia' | 'otro'
  fecha: string
  notas: string | null
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  page_size: number
  has_next: boolean
}

export type MetodoPago = 'efectivo' | 'tarjeta' | 'transferencia' | 'otro'
