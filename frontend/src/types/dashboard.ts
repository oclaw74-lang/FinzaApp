export interface DashboardKpis {
  total_ingresos: number
  total_egresos: number
  balance: number
  ahorro_estimado: number
}

export interface CategoriaBreakdown {
  categoria_id: string
  nombre: string
  tipo: 'ingreso' | 'egreso'
  monto: number
  porcentaje: number
}

export interface MonthlyTrendItem {
  mes: number
  year: number
  label: string
  total_ingresos: number
  total_egresos: number
}

export interface RecentTransaction {
  id: string
  tipo: 'ingreso' | 'egreso'
  monto: number
  descripcion: string | null
  fecha: string
  categoria_nombre: string
}

export interface DashboardResponse {
  mes: number
  year: number
  kpis: DashboardKpis
  categoria_breakdown: CategoriaBreakdown[]
  monthly_trend: MonthlyTrendItem[]
  recent_transactions: RecentTransaction[]
}
