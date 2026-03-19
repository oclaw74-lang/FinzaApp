import { MoneyDisplay } from '@/components/shared/MoneyDisplay'
import { formatDate } from '@/lib/utils'
import type { RecentTransaction } from '@/types/dashboard'

interface RecentTransactionsProps {
  transactions: RecentTransaction[]
  isLoading: boolean
}

function TransactionSkeleton(): JSX.Element {
  return (
    <div className="flex items-center justify-between py-3 border-b border-border last:border-0">
      <div className="flex items-center gap-3 flex-1">
        <div className="w-2 h-2 rounded-full bg-flow-light flex-shrink-0" />
        <div className="space-y-1">
          <div className="h-4 w-32 bg-flow-light rounded animate-pulse" />
          <div className="h-3 w-20 bg-flow-light rounded animate-pulse" />
        </div>
      </div>
      <div className="h-4 w-20 bg-flow-light rounded animate-pulse" />
    </div>
  )
}

export function RecentTransactions({
  transactions,
  isLoading,
}: RecentTransactionsProps): JSX.Element {
  if (isLoading) {
    return (
      <div aria-label="Cargando transacciones recientes">
        {[...Array(5)].map((_, i) => (
          <TransactionSkeleton key={i} />
        ))}
      </div>
    )
  }

  if (transactions.length === 0) {
    return (
      <div className="text-center py-8 text-gray-400">
        <p className="text-sm">Sin transacciones recientes.</p>
      </div>
    )
  }

  return (
    <div>
      {transactions.map((tx) => (
        <div
          key={tx.id}
          className="flex items-center justify-between py-3 border-b border-border last:border-0"
        >
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div
              className={`w-2 h-2 rounded-full flex-shrink-0 ${
                tx.tipo === 'ingreso' ? 'bg-prosperity-green' : 'bg-alert-red'
              }`}
              aria-hidden="true"
            />
            <div className="min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {tx.descripcion ?? tx.categoria_nombre}
              </p>
              <p className="text-xs text-gray-400">
                <span
                  className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-medium mr-1 ${
                    tx.tipo === 'ingreso'
                      ? 'bg-prosperity-green/10 text-prosperity-green'
                      : 'bg-alert-red/10 text-alert-red'
                  }`}
                >
                  {tx.tipo === 'ingreso' ? 'Ingreso' : 'Egreso'}
                </span>
                {tx.categoria_nombre} &middot; {formatDate(tx.fecha)}
              </p>
            </div>
          </div>
          <div className="ml-4 flex-shrink-0">
            <MoneyDisplay
              amount={tx.monto}
              currency="DOP"
              type={tx.tipo}
              size="sm"
            />
          </div>
        </div>
      ))}
    </div>
  )
}
