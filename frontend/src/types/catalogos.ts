export interface Moneda {
  codigo: string
  nombre: string
  simbolo: string
  decimales: number
  activa: boolean
}

export interface Pais {
  codigo: string
  nombre: string
  nombre_en: string
  moneda_codigo: string
  bandera_emoji?: string
  activo: boolean
}

export interface Banco {
  id: string
  pais_codigo: string
  nombre: string
  nombre_corto?: string
  logo_url?: string
  orden: number
  activo: boolean
}
