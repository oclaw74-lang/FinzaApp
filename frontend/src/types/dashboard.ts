export interface DashboardKpis {
  total_ingresos: number
  total_egresos: number
  balance: number
  ahorro_estimado: number
}

// Dashboard v2 types
export interface ResumenFinanciero {
  ingresos_mes: number
  egresos_mes: number
  balance_mes: number
  tasa_ahorro: number
  ingresos_mes_anterior: number
  egresos_mes_anterior: number
  variacion_ingresos_pct: number
  variacion_egresos_pct: number
}

export interface PresupuestoEstadoV2 {
  categoria: string
  monto_presupuestado: number
  gasto_actual: number
  porcentaje_usado: number
  alerta: boolean
}

export interface MetaActivaV2 {
  nombre: string
  monto_objetivo: number
  monto_actual: number
  porcentaje_completado: number
  fecha_limite: string | null
}

export interface PrestamosActivosV2 {
  total_deuda: number
  count: number
  proximo_vencimiento: string | null
}

export interface UltimaTransaccionV2 {
  tipo: 'ingreso' | 'egreso'
  descripcion: string
  monto: number
  fecha: string
  categoria: string | null
}

export interface EgresoCategoria {
  categoria: string
  total: number
  porcentaje: number
}

export interface MonedaConversionInfo {
  moneda_principal: string
  moneda_secundaria: string | null
  tasa_cambio: number | null
}

export interface DashboardV2Response {
  resumen_financiero: ResumenFinanciero
  presupuestos_estado: PresupuestoEstadoV2[]
  metas_activas: MetaActivaV2[]
  prestamos_activos: PrestamosActivosV2
  ultimas_transacciones: UltimaTransaccionV2[]
  egresos_por_categoria: EgresoCategoria[]
  moneda_conversion_info?: MonedaConversionInfo
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
