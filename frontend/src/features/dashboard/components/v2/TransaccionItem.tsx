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
    <div className="flex items-center justify-between py-3 border-b border-border last:border-0">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div
          className={cn(
            'w-2 h-2 rounded-full flex-shrink-0',
            isIngreso ? 'bg-prosperity-green' : 'bg-alert-red'
          )}
          aria-hidden="true"
        />
        <div className="min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">
            {descripcion}
          </p>
          <p className="text-xs text-gray-400 flex items-center gap-1">
            <span
              className={cn(
                'inline-block px-1.5 py-0.5 rounded text-[10px] font-medium',
                isIngreso
                  ? 'bg-prosperity-green/10 text-prosperity-green'
                  : 'bg-alert-red/10 text-alert-red'
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
            'text-sm font-semibold font-mono',
            isIngreso ? 'text-prosperity-green' : 'text-alert-red'
          )}
        >
          {isIngreso ? '+' : '-'}{formatMoney(Math.abs(monto))}
        </span>
      </div>
    </div>
  )
}
