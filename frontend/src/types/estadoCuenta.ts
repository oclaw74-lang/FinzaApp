export interface EstadoCuenta {
  id: string
  user_id: string
  tarjeta_id: string | null
  nombre_archivo: string
  url_archivo: string
  fecha_estado: string | null
  monto_total: number | null
  created_at: string
}

export interface EstadoCuentaUploadPayload {
  file: File
  tarjeta_id?: string | null
  fecha_estado?: string | null
  monto_total?: number | null
}
