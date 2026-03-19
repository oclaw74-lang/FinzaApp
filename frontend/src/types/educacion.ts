export interface LeccionContenido {
  hook: string
  concept: string
  action: string
  tip: string
}

export interface LeccionData {
  id: string
  titulo: string
  titulo_en?: string
  descripcion_corta: string
  descripcion_corta_en?: string
  contenido_json: LeccionContenido
  contenido_json_en?: LeccionContenido
  nivel: 'fundamentos' | 'control' | 'crecimiento'
  duracion_minutos: number
  orden: number
  completada: boolean
}
