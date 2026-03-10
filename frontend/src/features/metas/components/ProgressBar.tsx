interface ProgressBarProps {
  porcentaje: number
  color?: string
  'aria-label'?: string
}

function getProgressGradient(porcentaje: number): string {
  if (porcentaje >= 100) {
    return 'linear-gradient(90deg, #00B050, #00d060)'
  }
  if (porcentaje >= 80) {
    return 'linear-gradient(90deg, #FFC000, #ffaa00)'
  }
  return 'linear-gradient(90deg, #366092, #5B9BD5)'
}

export function ProgressBar({
  porcentaje,
  'aria-label': ariaLabel,
}: ProgressBarProps): JSX.Element {
  const pct = Math.min(100, Math.max(0, Math.round(porcentaje)))

  return (
    <div
      className="w-full bg-gray-200 rounded-full h-2 overflow-hidden"
      role="progressbar"
      aria-valuenow={pct}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={ariaLabel ?? `${pct}% completado`}
    >
      <div
        className="h-2 rounded-full transition-all duration-300"
        style={{ width: `${pct}%`, background: getProgressGradient(porcentaje) }}
      />
    </div>
  )
}
