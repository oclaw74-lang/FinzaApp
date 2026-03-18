interface BudgetProgressBarProps {
  porcentaje: number
  'aria-label'?: string
}

function getBudgetGradient(porcentaje: number): string {
  if (porcentaje >= 100) {
    return 'linear-gradient(90deg, #cc0000, #ff4444)'
  }
  if (porcentaje >= 80) {
    return 'linear-gradient(90deg, #FFC000, #ffaa00)'
  }
  return 'linear-gradient(90deg, #366092, #5B9BD5)'
}

export function BudgetProgressBar({
  porcentaje,
  'aria-label': ariaLabel,
}: BudgetProgressBarProps): JSX.Element {
  const pct = Math.min(100, Math.max(0, porcentaje))

  return (
    <div className="w-full bg-white/[0.06] dark:bg-white/[0.06] rounded-full h-2 overflow-hidden">
      <div
        className="h-2 rounded-full transition-all duration-300"
        style={{ width: `${pct}%`, background: getBudgetGradient(porcentaje) }}
        role="progressbar"
        aria-valuenow={Math.round(porcentaje)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={ariaLabel ?? `${Math.round(porcentaje)}% usado`}
      />
    </div>
  )
}
