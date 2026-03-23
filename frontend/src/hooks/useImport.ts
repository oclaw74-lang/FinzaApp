import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api'

export interface TransaccionImport {
  tipo: 'egreso' | 'ingreso'
  fecha: string           // 'YYYY-MM-DD'
  monto: number
  moneda: string
  descripcion?: string
  categoria_nombre?: string
  notas?: string
}

export interface ImportError {
  fila: number
  campo: string
  mensaje: string
}

export interface ImportResponse {
  importados: number
  errores: ImportError[]
  duplicados_omitidos: number
}

export function useImportTransactions() {
  const qc = useQueryClient()
  return useMutation<ImportResponse, Error, TransaccionImport[]>({
    mutationFn: async (transacciones) => {
      const res = await apiClient.post<ImportResponse>('/import/transactions', { transacciones })
      return res.data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['egresos'] })
      qc.invalidateQueries({ queryKey: ['ingresos'] })
      qc.invalidateQueries({ queryKey: ['dashboard-v2'] })
    },
  })
}
