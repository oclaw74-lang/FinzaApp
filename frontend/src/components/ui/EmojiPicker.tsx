import { useState, useRef, useEffect } from 'react'
import { Smile } from 'lucide-react'
import { cn } from '@/lib/utils'

// ─── Tipos mínimos para @emoji-mart ────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type EmojiMartData = Record<string, unknown>

interface EmojiSelectPayload {
  native: string
}

interface PickerProps {
  data: EmojiMartData
  onEmojiSelect: (emoji: EmojiSelectPayload) => void
  theme?: string
  locale?: string
  previewPosition?: string
  searchPosition?: string
  maxFrequentRows?: number
  perLine?: number
  skinTonePosition?: string
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PickerComponent = React.ComponentType<PickerProps>

// ─── Props ─────────────────────────────────────────────────────────────────────
export interface EmojiPickerProps {
  /** Emoji actualmente seleccionado (carácter unicode, ej: "🏦") */
  value: string
  /** Callback que recibe el emoji seleccionado */
  onChange: (emoji: string) => void
  label?: string
  disabled?: boolean
}

/**
 * EmojiPicker — selector de emoji usando @emoji-mart/react.
 *
 * Carga las dependencias de forma lazy (dynamic import) para no impactar
 * el bundle inicial. El picker se muestra en un popover flotante sobre el botón.
 */
export function EmojiPicker({
  value,
  onChange,
  label,
  disabled = false,
}: EmojiPickerProps): JSX.Element {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const [PickerComp, setPickerComp] = useState<PickerComponent | null>(null)
  const [emojiData, setEmojiData] = useState<EmojiMartData | null>(null)

  // Lazy-load @emoji-mart/* cuando el popover se abre por primera vez
  useEffect(() => {
    if (!open || PickerComp) return

    void Promise.all([
      import('@emoji-mart/react'),
      import('@emoji-mart/data'),
    ]).then(([reactPkg, dataPkg]) => {
      setPickerComp(
        () => (reactPkg as { default: PickerComponent }).default
      )
      setEmojiData((dataPkg as { default: EmojiMartData }).default)
    })
  }, [open, PickerComp])

  // Cerrar al hacer clic fuera
  useEffect(() => {
    if (!open) return

    const handleOutside = (e: MouseEvent): void => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false)
      }
    }

    document.addEventListener('mousedown', handleOutside)
    return () => document.removeEventListener('mousedown', handleOutside)
  }, [open])

  const handleSelect = (emoji: EmojiSelectPayload): void => {
    onChange(emoji.native)
    setOpen(false)
  }

  return (
    <div className="flex flex-col gap-1.5" ref={containerRef}>
      {label && (
        <span className="text-sm font-medium text-[var(--text-primary)]">
          {label}
        </span>
      )}

      <div className="relative">
        {/* Trigger button */}
        <button
          type="button"
          onClick={() => !disabled && setOpen((v) => !v)}
          disabled={disabled}
          className={cn(
            'finza-input w-full flex items-center gap-2 text-left',
            disabled && 'opacity-50 cursor-not-allowed'
          )}
          aria-label={
            value
              ? `Emoji seleccionado: ${value}. Click para cambiar.`
              : 'Seleccionar emoji'
          }
          aria-expanded={open}
          aria-haspopup="dialog"
        >
          {value ? (
            <span className="text-xl leading-none" aria-hidden="true">
              {value}
            </span>
          ) : (
            <Smile size={18} className="text-[var(--text-muted)]" />
          )}
          <span className="text-sm text-[var(--text-muted)] flex-1">
            {value || 'Seleccionar emoji'}
          </span>
        </button>

        {/* Popover con el picker */}
        {open && (
          <div
            className="absolute bottom-full mb-2 left-0 z-50 shadow-2xl rounded-xl overflow-hidden"
            role="dialog"
            aria-modal="true"
            aria-label="Selector de emoji"
          >
            {PickerComp && emojiData ? (
              <PickerComp
                data={emojiData}
                onEmojiSelect={handleSelect}
                theme="auto"
                locale="es"
                previewPosition="none"
                searchPosition="sticky"
                maxFrequentRows={2}
                perLine={8}
                skinTonePosition="none"
              />
            ) : (
              <div className="p-6 bg-[var(--surface)] border border-[var(--border)] rounded-xl text-sm text-[var(--text-muted)] flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
                Cargando emojis…
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
