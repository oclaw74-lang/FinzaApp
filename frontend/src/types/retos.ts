export interface RetoData {
  id: string
  titulo: string
  descripcion: string
  tipo: 'semanal' | 'mensual'
  ahorro_estimado: number | null
  icono: string | null
}

export interface UserRetoData {
  id: string
  reto_id: string
  titulo: string
  descripcion: string
  tipo: 'semanal' | 'mensual'
  ahorro_estimado: number | null
  icono: string | null
  estado: 'activo' | 'completado' | 'abandonado'
  racha_dias: number
  ultimo_checkin: string | null
  iniciado_en: string
  puede_checkin_hoy: boolean
}
