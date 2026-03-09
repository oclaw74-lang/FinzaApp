import { ChevronLeft, ChevronRight } from 'lucide-react'

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
]

interface MonthlySummaryProps {
  mes: number
  year: number
  onPrev: () => void
  onNext: () => void
}

export function MonthlySummary({
  mes,
  year,
  onPrev,
  onNext,
}: MonthlySummaryProps): JSX.Element {
  const now = new Date()
  const isCurrentMonth = mes === now.getMonth() + 1 && year === now.getFullYear()

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={onPrev}
        className="w-8 h-8 flex items-center justify-center rounded-lg border border-border text-gray-500 hover:bg-flow-light hover:text-finza-blue transition-colors"
        aria-label="Mes anterior"
        type="button"
      >
        <ChevronLeft size={16} />
      </button>

      <span className="text-base font-semibold text-gray-900 min-w-[140px] text-center">
        {MONTH_NAMES[mes - 1]} {year}
      </span>

      <button
        onClick={onNext}
        disabled={isCurrentMonth}
        className="w-8 h-8 flex items-center justify-center rounded-lg border border-border text-gray-500 hover:bg-flow-light hover:text-finza-blue transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        aria-label="Mes siguiente"
        type="button"
      >
        <ChevronRight size={16} />
      </button>
    </div>
  )
}
