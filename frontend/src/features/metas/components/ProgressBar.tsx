interface ProgressBarProps {
  porcentaje: number
  color?: string
  'aria-label'?: string
}

export function ProgressBar({
  porcentaje,
  color = '#366092',
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
        style={{ width: `${pct}%`, backgroundColor: color }}
      />
    </div>
  )
}
