export interface LeccionData {
  id: string
  titulo: string
  descripcion_corta: string
  contenido_json: {
    hook: string
    concept: string
    action: string
    tip: string
  }
  nivel: 'fundamentos' | 'control' | 'crecimiento'
  duracion_minutos: number
  orden: number
  completada: boolean
}
