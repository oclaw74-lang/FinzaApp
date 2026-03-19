export interface ItemComparativa {
  nombre: string
  tipo: 'deuda' | 'ahorro'
  monto: number
  tasa_anual: number | null
  costo_o_rendimiento_mensual: number
}

export interface ComparativaData {
  deudas: ItemComparativa[]
  ahorros: ItemComparativa[]
  total_costo_deuda: number
  total_rendimiento_ahorro: number
  diferencia: number
  recomendacion: string
}
