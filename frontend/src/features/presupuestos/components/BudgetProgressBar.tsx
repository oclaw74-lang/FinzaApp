interface BudgetProgressBarProps {
  porcentaje: number
  'aria-label'?: string
}

export function BudgetProgressBar({
  porcentaje,
  'aria-label': ariaLabel,
}: BudgetProgressBarProps): JSX.Element {
  const pct = Math.min(100, Math.max(0, porcentaje))
  const colorClass =
    porcentaje >= 100
      ? 'bg-alert-red'
      : porcentaje >= 80
        ? 'bg-golden-flow'
        : 'bg-prosperity-green'

  return (
    <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
      <div
        className={`${colorClass} h-2.5 rounded-full transition-all duration-300`}
        style={{ width: `${pct}%` }}
        role="progressbar"
        aria-valuenow={Math.round(porcentaje)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={ariaLabel ?? `${Math.round(porcentaje)}% usado`}
      />
    </div>
  )
}
