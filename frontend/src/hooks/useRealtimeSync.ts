import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

const TABLE_KEYS: Record<string, string[][]> = {
  egresos: [['egresos'], ['dashboard-v2'], ['score'], ['comparativa'], ['prediccion-mes']],
  ingresos: [['ingresos'], ['dashboard-v2'], ['score'], ['comparativa'], ['prediccion-mes']],
  tarjetas: [['tarjetas']],
  movimientos_tarjeta: [['movimientos-tarjeta']],
  prestamos: [['prestamos'], ['dashboard-v2']],
  metas_ahorro: [['metas-ahorro'], ['dashboard-v2']],
  fondo_emergencia: [['fondo-emergencia'], ['dashboard-v2']],
  presupuestos: [['presupuestos']],
  recurrentes: [['recurrentes']],
  categorias: [['categorias']],
}

export function useRealtimeSync(): void {
  const qc = useQueryClient()

  useEffect(() => {
    const channel = supabase.channel('finza-realtime-sync')

    for (const [table, keys] of Object.entries(TABLE_KEYS)) {
      channel.on(
        'postgres_changes',
        { event: '*', schema: 'public', table },
        () => {
          keys.forEach(key => qc.invalidateQueries({ queryKey: key }))
        }
      )
    }

    channel.subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [qc])
}
