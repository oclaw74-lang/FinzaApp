import { cn } from '@/lib/utils'
import { formatDate, formatMoney } from '@/lib/utils'
import type { UltimaTransaccionV2 } from '@/types/dashboard'

interface TransaccionItemProps {
  transaccion: UltimaTransaccionV2
}

export function TransaccionItem({ transaccion }: TransaccionItemProps): JSX.Element {
  const { tipo, descripcion, monto, fecha, categoria } = transaccion
  const isIngreso = tipo === 'ingreso'

  return (
    <div className="flex items-center justify-between py-3 border-b border-[var(--border)] last:border-0 row-hover px-2 -mx-2 rounded-lg">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div
          className={cn(
            'w-2 h-2 rounded-full flex-shrink-0 ring-2',
            isIngreso
              ? 'bg-prosperity-green ring-prosperity-green/20'
              : 'bg-alert-red ring-alert-red/20'
          )}
          aria-hidden="true"
        />
        <div className="min-w-0">
          <p className="text-sm font-medium text-[var(--text-primary)] truncate">
            {descripcion}
          </p>
          <p className="text-xs text-[var(--text-muted)] flex items-center gap-1">
            <span
              className={cn(
                'inline-block px-1.5 py-0.5 rounded-full text-[10px] font-medium',
                isIngreso
                  ? 'bg-prosperity-green/10 text-prosperity-green border border-prosperity-green/20'
                  : 'bg-alert-red/10 text-alert-red border border-alert-red/20'
              )}
            >
              {isIngreso ? 'INGRESO' : 'EGRESO'}
            </span>
            {categoria && (
              <span>{categoria} &middot; </span>
            )}
            <span>{formatDate(fecha)}</span>
          </p>
        </div>
      </div>
      <div className="ml-4 flex-shrink-0">
        <span
          className={cn(
            'text-sm font-semibold font-mono tabular-nums',
            isIngreso ? 'text-prosperity-green' : 'text-alert-red'
          )}
        >
          {isIngreso ? '+' : '-'}{formatMoney(Math.abs(monto))}
        </span>
      </div>
    </div>
  )
}
