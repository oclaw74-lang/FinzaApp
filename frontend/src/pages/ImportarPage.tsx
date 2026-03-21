import { useState, useCallback, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { Upload, CheckCircle, AlertCircle, FileSpreadsheet, ChevronRight } from 'lucide-react'
import * as XLSX from 'xlsx'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useImportTransactions } from '@/hooks/useImport'
import type { TransaccionImport } from '@/hooks/useImport'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type TipoMode = 'egreso' | 'ingreso' | 'columna'

type FinzaField = 'fecha' | 'monto' | 'tipo' | 'descripcion' | 'categoria' | 'moneda' | 'notas'

interface ParsedRow {
  rowIndex: number
  tipo: 'egreso' | 'ingreso' | null
  fecha: string | null
  monto: number | null
  moneda: string
  descripcion: string
  categoria_nombre: string
  notas: string
  errors: string[]
  valid: boolean
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Convert a raw cell value to YYYY-MM-DD string or null */
function parseDate(val: unknown): string | null {
  if (val == null || val === '') return null
  // Date object (cellDates: true)
  if (val instanceof Date) {
    if (!isNaN(val.getTime())) return val.toISOString().split('T')[0]
    return null
  }
  // Excel serial number fallback
  if (typeof val === 'number') {
    // Excel epoch: Dec 31 1899 → subtract 25569 days from Unix epoch
    const ms = Math.round((val - 25569) * 86400 * 1000)
    const d = new Date(ms)
    if (!isNaN(d.getTime())) return d.toISOString().split('T')[0]
    return null
  }
  const str = String(val).trim()
  if (!str) return null
  // YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str
  // DD/MM/YYYY or MM/DD/YYYY
  const slashMatch = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
  if (slashMatch) {
    // Treat as DD/MM/YYYY (most common in LatAm)
    return `${slashMatch[3]}-${slashMatch[2].padStart(2, '0')}-${slashMatch[1].padStart(2, '0')}`
  }
  // Native Date parse
  const d = new Date(str)
  if (!isNaN(d.getTime())) return d.toISOString().split('T')[0]
  return null
}

function parseNumber(val: unknown): number | null {
  if (val == null || val === '') return null
  const n = typeof val === 'number' ? val : parseFloat(String(val).replace(/[,\s]/g, ''))
  return isNaN(n) ? null : n
}

function parseTipoStr(val: unknown): 'egreso' | 'ingreso' | null {
  const s = String(val ?? '').toLowerCase().trim()
  if (['egreso', 'gasto', 'expense', 'salida', 'débito', 'debito'].includes(s)) return 'egreso'
  if (['ingreso', 'income', 'entrada', 'crédito', 'credito'].includes(s)) return 'ingreso'
  return null
}

// ---------------------------------------------------------------------------
// Step indicator
// ---------------------------------------------------------------------------

interface StepIndicatorProps {
  current: number
  labels: string[]
}

function StepIndicator({ current, labels }: StepIndicatorProps): JSX.Element {
  return (
    <div className="flex items-center gap-0 mb-8 overflow-x-auto pb-1">
      {labels.map((label, i) => {
        const step = i + 1
        const done = step < current
        const active = step === current
        return (
          <div key={step} className="flex items-center min-w-0">
            <div className="flex flex-col items-center gap-1 min-w-[72px]">
              <div
                className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 transition-colors',
                  done
                    ? 'bg-green-500 text-white'
                    : active
                    ? 'bg-[var(--accent)] text-white'
                    : 'bg-[var(--surface-raised)] text-[var(--text-muted)]'
                )}
                aria-current={active ? 'step' : undefined}
              >
                {done ? <CheckCircle size={16} /> : step}
              </div>
              <span
                className={cn(
                  'text-[10px] font-medium text-center leading-tight',
                  active ? 'text-[var(--accent)]' : 'text-[var(--text-muted)]'
                )}
              >
                {label}
              </span>
            </div>
            {i < labels.length - 1 && (
              <div
                className={cn(
                  'flex-1 h-0.5 mx-1 mt-[-14px] min-w-[20px] transition-colors',
                  done ? 'bg-green-500' : 'bg-[var(--border)]'
                )}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Step 1: File Upload
// ---------------------------------------------------------------------------

interface Step1Props {
  onParsed: (headers: string[], preview: unknown[][], allRows: unknown[][]) => void
}

function Step1Upload({ onParsed }: Step1Props): JSX.Element {
  const { t } = useTranslation()
  const [dragging, setDragging] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const processFile = useCallback(
    (file: File) => {
      setError(null)
      const validExts = ['.xlsx', '.xls', '.csv']
      const ext = file.name.toLowerCase().slice(file.name.lastIndexOf('.'))
      if (!validExts.includes(ext)) {
        setError(t('importar.formatosAceptados'))
        return
      }
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target!.result as ArrayBuffer)
          const wb = XLSX.read(data, { type: 'array', cellDates: true })
          const ws = wb.Sheets[wb.SheetNames[0]]
          const rawRows = XLSX.utils.sheet_to_json<unknown[]>(ws, {
            header: 1,
            raw: true,
            defval: null,
          }) as unknown[][]
          if (!rawRows.length || !rawRows[0] || (rawRows[0] as unknown[]).length === 0) {
            setError('El archivo está vacío o no tiene encabezados.')
            return
          }
          const headers = (rawRows[0] as unknown[]).map((h) => String(h ?? '').trim())
          const dataRows = rawRows.slice(1).filter((r) =>
            (r as unknown[]).some((c) => c != null && c !== '')
          )
          const preview = dataRows.slice(0, 5)
          onParsed(headers, preview, dataRows)
        } catch {
          setError('Error al leer el archivo. Verifica que sea un archivo válido.')
        }
      }
      reader.readAsArrayBuffer(file)
    },
    [onParsed, t]
  )

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setDragging(false)
      const file = e.dataTransfer.files[0]
      if (file) processFile(file)
    },
    [processFile]
  )

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) processFile(file)
    },
    [processFile]
  )

  return (
    <div className="space-y-4">
      <div
        role="region"
        aria-label={t('importar.arrastrarArchivo')}
        className={cn(
          'border-2 border-dashed rounded-xl p-10 flex flex-col items-center gap-4 cursor-pointer transition-colors select-none',
          dragging
            ? 'border-[var(--accent)] bg-[var(--accent)]/5'
            : 'border-[var(--border)] hover:border-[var(--accent)]/60 hover:bg-[var(--surface-raised)]'
        )}
        onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => e.key === 'Enter' && inputRef.current?.click()}
        tabIndex={0}
      >
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center"
          style={{ background: 'var(--accent-muted, rgba(99,102,241,0.12))', color: 'var(--accent)' }}
        >
          <FileSpreadsheet size={32} />
        </div>
        <div className="text-center">
          <p className="font-semibold text-[var(--text-primary)] text-lg">
            {t('importar.arrastrarArchivo')}
          </p>
          <p className="text-sm text-[var(--text-muted)] mt-1">{t('importar.oClick')}</p>
          <p className="text-xs text-[var(--text-muted)] mt-2">{t('importar.formatosAceptados')}</p>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept=".xlsx,.xls,.csv"
          className="sr-only"
          onChange={handleChange}
          aria-label={t('importar.arrastrarArchivo')}
        />
      </div>

      {error && (
        <div
          role="alert"
          className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 text-red-500 text-sm"
        >
          <AlertCircle size={16} className="shrink-0" />
          {error}
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Step 2: Column Mapping
// ---------------------------------------------------------------------------

const FINZA_FIELDS: { key: FinzaField; required?: boolean }[] = [
  { key: 'fecha', required: true },
  { key: 'monto', required: true },
  { key: 'tipo' },
  { key: 'descripcion' },
  { key: 'categoria' },
  { key: 'moneda' },
  { key: 'notas' },
]

interface Step2Props {
  headers: string[]
  previewRows: unknown[][]
  mapping: Record<FinzaField, string>
  tipoMode: TipoMode
  onMappingChange: (field: FinzaField, col: string) => void
  onTipoModeChange: (mode: TipoMode) => void
  onNext: () => void
  onBack: () => void
}

function Step2Mapping({
  headers,
  previewRows,
  mapping,
  tipoMode,
  onMappingChange,
  onTipoModeChange,
  onNext,
  onBack,
}: Step2Props): JSX.Element {
  const { t } = useTranslation()

  const canProceed = mapping.fecha !== '' && mapping.monto !== ''

  // Preview table: show first 3 rows with current mapping
  const previewCols: FinzaField[] = ['fecha', 'monto', 'tipo', 'descripcion', 'categoria']

  function getCellValue(row: unknown[], field: FinzaField): string {
    const colName = mapping[field]
    if (!colName) return '—'
    const idx = headers.indexOf(colName)
    if (idx === -1) return '—'
    const val = (row as unknown[])[idx]
    return val != null ? String(val) : '—'
  }

  return (
    <div className="space-y-6">
      {/* Mapping table */}
      <div className="finza-card dark:bg-[rgba(8,15,30,0.6)] dark:border-white/[0.06] overflow-hidden p-0">
        <div className="p-4 border-b border-[var(--border)]">
          <h3 className="font-semibold text-[var(--text-primary)] text-sm">
            {t('importar.columna')} → {t('importar.mapeadaA')}
          </h3>
        </div>
        <div className="divide-y divide-[var(--border)]">
          {FINZA_FIELDS.map(({ key, required }) => (
            <div key={key} className="flex items-center gap-3 px-4 py-3">
              <div className="w-36 shrink-0">
                <span className="text-sm font-medium text-[var(--text-primary)]">
                  {t(`importar.campo${key.charAt(0).toUpperCase()}${key.slice(1)}`)}
                </span>
                {required && (
                  <span className="ml-1 text-red-500 text-xs font-bold" aria-label="requerido">*</span>
                )}
              </div>

              {key === 'tipo' ? (
                <div className="flex flex-wrap gap-2 items-center flex-1">
                  <select
                    className="finza-input text-sm w-auto"
                    value={tipoMode}
                    onChange={(e) => onTipoModeChange(e.target.value as TipoMode)}
                    aria-label={t('importar.tipoFijo')}
                  >
                    <option value="egreso">{t('importar.todasEgresos')}</option>
                    <option value="ingreso">{t('importar.todasIngresos')}</option>
                    <option value="columna">{t('importar.hayColumna')}</option>
                  </select>
                  {tipoMode === 'columna' && (
                    <select
                      className="finza-input text-sm flex-1 min-w-[120px]"
                      value={mapping.tipo}
                      onChange={(e) => onMappingChange('tipo', e.target.value)}
                      aria-label={t('importar.campoTipo')}
                    >
                      <option value="">{t('importar.noMapear')}</option>
                      {headers.map((h) => (
                        <option key={h} value={h}>{h}</option>
                      ))}
                    </select>
                  )}
                </div>
              ) : (
                <select
                  className="finza-input text-sm flex-1"
                  value={mapping[key]}
                  onChange={(e) => onMappingChange(key, e.target.value)}
                  aria-label={t(`importar.campo${key.charAt(0).toUpperCase()}${key.slice(1)}`)}
                >
                  <option value="">{t('importar.noMapear')}</option>
                  {headers.map((h) => (
                    <option key={h} value={h}>{h}</option>
                  ))}
                </select>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Mini preview */}
      {previewRows.length > 0 && canProceed && (
        <div className="finza-card dark:bg-[rgba(8,15,30,0.6)] dark:border-white/[0.06] overflow-hidden p-0">
          <div className="p-3 border-b border-[var(--border)]">
            <h3 className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">
              Preview ({Math.min(previewRows.length, 3)} filas)
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-[var(--border)] bg-[var(--surface-raised)]">
                  {previewCols.map((f) => (
                    <th key={f} className="text-left px-3 py-2 text-[var(--text-muted)] font-semibold uppercase tracking-wider">
                      {t(`importar.campo${f.charAt(0).toUpperCase()}${f.slice(1)}`)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {previewRows.slice(0, 3).map((row, i) => (
                  <tr key={i} className="border-b border-[var(--border)] last:border-0">
                    {previewCols.map((f) => (
                      <td key={f} className="px-3 py-2 text-[var(--text-primary)]">
                        {getCellValue(row, f)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="flex gap-3 justify-between">
        <Button variant="ghost" size="md" onClick={onBack}>
          ← Atrás
        </Button>
        <Button
          variant="default"
          size="md"
          onClick={onNext}
          disabled={!canProceed}
          title={!canProceed ? 'Mapea Fecha y Monto para continuar' : undefined}
        >
          {t('importar.siguientePreview')}
          <ChevronRight size={16} />
        </Button>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Step 3: Preview & Confirm
// ---------------------------------------------------------------------------

interface Step3Props {
  parsedRows: ParsedRow[]
  isImporting: boolean
  importResult: { importados: number; duplicados_omitidos: number; errores: number } | null
  onConfirm: (rows: TransaccionImport[]) => void
  onBack: () => void
  onReset: () => void
}

function Step3Confirm({
  parsedRows,
  isImporting,
  importResult,
  onConfirm,
  onBack,
  onReset,
}: Step3Props): JSX.Element {
  const { t } = useTranslation()

  const validRows = parsedRows.filter((r) => r.valid)
  const errorRows = parsedRows.filter((r) => !r.valid)

  const handleImport = () => {
    const toImport: TransaccionImport[] = validRows.map((r) => ({
      tipo: r.tipo!,
      fecha: r.fecha!,
      monto: r.monto!,
      moneda: r.moneda || 'DOP',
      ...(r.descripcion ? { descripcion: r.descripcion } : {}),
      ...(r.categoria_nombre ? { categoria_nombre: r.categoria_nombre } : {}),
      ...(r.notas ? { notas: r.notas } : {}),
    }))
    onConfirm(toImport)
  }

  if (importResult) {
    return (
      <div className="space-y-4">
        <div className="finza-card dark:bg-[rgba(8,15,30,0.6)] dark:border-white/[0.06] p-6 text-center">
          <CheckCircle size={48} className="mx-auto mb-4 text-green-500" />
          <h3 className="text-xl font-bold text-[var(--text-primary)] mb-2">
            {t('importar.resultadoImportado', { n: importResult.importados })}
          </h3>
          <div className="flex flex-wrap justify-center gap-4 mt-4 text-sm text-[var(--text-muted)]">
            {importResult.duplicados_omitidos > 0 && (
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-yellow-500" />
                {t('importar.resultadoDuplicados', { n: importResult.duplicados_omitidos })}
              </span>
            )}
            {importResult.errores > 0 && (
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-red-500" />
                {t('importar.resultadoErrores', { n: importResult.errores })}
              </span>
            )}
          </div>
          <Button variant="default" size="md" className="mt-6" onClick={onReset}>
            Importar otro archivo
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Summary chips */}
      <div className="flex flex-wrap gap-3">
        <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-green-500/10 text-green-600 dark:text-green-400 text-sm font-medium">
          <CheckCircle size={16} />
          {t('importar.filasValidas', { n: validRows.length })}
        </div>
        {errorRows.length > 0 && (
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500/10 text-red-500 text-sm font-medium">
            <AlertCircle size={16} />
            {t('importar.filasConError', { n: errorRows.length })}
          </div>
        )}
      </div>

      {/* Rows table */}
      <div className="finza-card dark:bg-[rgba(8,15,30,0.6)] dark:border-white/[0.06] overflow-hidden p-0">
        <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
          <table className="w-full text-xs">
            <thead className="sticky top-0 z-10 bg-[var(--surface-raised)]">
              <tr className="border-b border-[var(--border)]">
                <th className="text-left px-3 py-2 text-[var(--text-muted)] font-semibold">#</th>
                <th className="text-left px-3 py-2 text-[var(--text-muted)] font-semibold">{t('importar.campoFecha')}</th>
                <th className="text-left px-3 py-2 text-[var(--text-muted)] font-semibold">{t('importar.campoMonto')}</th>
                <th className="text-left px-3 py-2 text-[var(--text-muted)] font-semibold">{t('importar.campoTipo')}</th>
                <th className="text-left px-3 py-2 text-[var(--text-muted)] font-semibold">{t('importar.campoDescripcion')}</th>
                <th className="text-left px-3 py-2 text-[var(--text-muted)] font-semibold">Estado</th>
              </tr>
            </thead>
            <tbody>
              {parsedRows.map((row) => (
                <tr
                  key={row.rowIndex}
                  className={cn(
                    'border-b border-[var(--border)] last:border-0',
                    row.valid
                      ? 'bg-green-500/5 dark:bg-green-500/5'
                      : 'bg-red-500/5 dark:bg-red-500/5'
                  )}
                >
                  <td className="px-3 py-2 text-[var(--text-muted)]">{row.rowIndex + 1}</td>
                  <td className="px-3 py-2 text-[var(--text-primary)]">{row.fecha ?? '—'}</td>
                  <td className="px-3 py-2 text-[var(--text-primary)]">{row.monto ?? '—'}</td>
                  <td className="px-3 py-2 text-[var(--text-primary)]">{row.tipo ?? '—'}</td>
                  <td className="px-3 py-2 text-[var(--text-primary)] max-w-[160px] truncate">
                    {row.descripcion || '—'}
                  </td>
                  <td className="px-3 py-2">
                    {row.valid ? (
                      <span className="text-green-600 dark:text-green-400 font-medium">✓</span>
                    ) : (
                      <span
                        className="text-red-500 font-medium cursor-help"
                        title={row.errors.join(' | ')}
                        aria-label={row.errors.join(' | ')}
                      >
                        ✗ {row.errors[0]}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex gap-3 justify-between">
        <Button variant="ghost" size="md" onClick={onBack} disabled={isImporting}>
          ← Atrás
        </Button>
        <Button
          variant="default"
          size="md"
          onClick={handleImport}
          disabled={validRows.length === 0 || isImporting}
        >
          {isImporting
            ? t('importar.importandoEspera')
            : t('importar.importarN', { n: validRows.length })}
        </Button>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------

const DEFAULT_MAPPING: Record<FinzaField, string> = {
  fecha: '',
  monto: '',
  tipo: '',
  descripcion: '',
  categoria: '',
  moneda: '',
  notas: '',
}

/** Auto-detect mapping from column headers using common aliases */
function autoDetect(headers: string[]): Record<FinzaField, string> {
  const mapping: Record<FinzaField, string> = { ...DEFAULT_MAPPING }
  const aliases: Record<FinzaField, string[]> = {
    fecha: ['fecha', 'date', 'dia', 'day', 'fec'],
    monto: ['monto', 'amount', 'valor', 'value', 'importe', 'cantidad', 'total'],
    tipo: ['tipo', 'type', 'clase', 'class'],
    descripcion: ['descripcion', 'description', 'detalle', 'detail', 'concepto', 'concept'],
    categoria: ['categoria', 'category', 'cat', 'categoria_nombre'],
    moneda: ['moneda', 'currency', 'divisa'],
    notas: ['notas', 'notes', 'nota', 'note', 'observaciones', 'obs'],
  }
  headers.forEach((h) => {
    const lower = h.toLowerCase().trim()
    for (const [field, words] of Object.entries(aliases) as [FinzaField, string[]][]) {
      if (!mapping[field] && words.some((w) => lower.includes(w))) {
        mapping[field] = h
        break
      }
    }
  })
  return mapping
}

function buildParsedRows(
  allRows: unknown[][],
  headers: string[],
  mapping: Record<FinzaField, string>,
  tipoMode: TipoMode,
  errorMsgs: { fecha: string; monto: string; tipo: string }
): ParsedRow[] {
  const colIdx = (field: FinzaField): number => {
    const col = mapping[field]
    return col ? headers.indexOf(col) : -1
  }

  return allRows.map((row, i) => {
    const get = (field: FinzaField): unknown => {
      const idx = colIdx(field)
      return idx >= 0 ? (row as unknown[])[idx] : null
    }

    const errors: string[] = []

    // fecha
    const fechaRaw = get('fecha')
    const fecha = parseDate(fechaRaw)
    if (!fecha) errors.push(errorMsgs.fecha)

    // monto
    const montoRaw = get('monto')
    const monto = parseNumber(montoRaw)
    if (monto == null || monto <= 0) errors.push(errorMsgs.monto)

    // tipo
    let tipo: 'egreso' | 'ingreso' | null
    if (tipoMode === 'columna') {
      tipo = parseTipoStr(get('tipo'))
      if (!tipo) errors.push(errorMsgs.tipo)
    } else {
      tipo = tipoMode
    }

    // optional fields
    const moneda = String(get('moneda') ?? '').trim() || 'DOP'
    const descripcion = String(get('descripcion') ?? '').trim()
    const categoria_nombre = String(get('categoria') ?? '').trim()
    const notas = String(get('notas') ?? '').trim()

    return {
      rowIndex: i,
      tipo,
      fecha,
      monto,
      moneda,
      descripcion,
      categoria_nombre,
      notas,
      errors,
      valid: errors.length === 0,
    }
  })
}

export function ImportarPage(): JSX.Element {
  const { t } = useTranslation()
  const importMutation = useImportTransactions()

  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [headers, setHeaders] = useState<string[]>([])
  const [previewRows, setPreviewRows] = useState<unknown[][]>([])
  const [allRows, setAllRows] = useState<unknown[][]>([])
  const [mapping, setMapping] = useState<Record<FinzaField, string>>(DEFAULT_MAPPING)
  const [tipoMode, setTipoMode] = useState<TipoMode>('egreso')
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([])
  const [importResult, setImportResult] = useState<{
    importados: number
    duplicados_omitidos: number
    errores: number
  } | null>(null)

  const stepLabels = [t('importar.paso1'), t('importar.paso2'), t('importar.paso3')]

  const handleParsed = useCallback(
    (h: string[], preview: unknown[][], rows: unknown[][]) => {
      setHeaders(h)
      setPreviewRows(preview)
      setAllRows(rows)
      setMapping(autoDetect(h))
      setStep(2)
    },
    []
  )

  const handleMappingChange = useCallback((field: FinzaField, col: string) => {
    setMapping((prev) => ({ ...prev, [field]: col }))
  }, [])

  const handleTipoModeChange = useCallback((mode: TipoMode) => {
    setTipoMode(mode)
  }, [])

  const handleGoToStep3 = useCallback(() => {
    const errorMsgs = {
      fecha: t('importar.errorFechaInvalida'),
      monto: t('importar.errorMontoInvalido'),
      tipo: t('importar.errorTipoInvalido'),
    }
    const rows = buildParsedRows(allRows, headers, mapping, tipoMode, errorMsgs)
    setParsedRows(rows)
    setStep(3)
  }, [allRows, headers, mapping, tipoMode, t])

  const handleConfirmImport = useCallback(
    async (rows: TransaccionImport[]) => {
      try {
        const result = await importMutation.mutateAsync(rows)
        setImportResult({
          importados: result.importados,
          duplicados_omitidos: result.duplicados_omitidos,
          errores: result.errores.length,
        })
        toast.success(t('importar.resultadoImportado', { n: result.importados }))
      } catch {
        toast.error('Error al importar. Por favor intenta de nuevo.')
      }
    },
    [importMutation, t]
  )

  const handleReset = useCallback(() => {
    setStep(1)
    setHeaders([])
    setPreviewRows([])
    setAllRows([])
    setMapping(DEFAULT_MAPPING)
    setTipoMode('egreso')
    setParsedRows([])
    setImportResult(null)
    importMutation.reset()
  }, [importMutation])

  return (
    <div className="animate-fade-in p-4 md:p-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: 'var(--accent-muted, rgba(99,102,241,0.12))', color: 'var(--accent)' }}
          >
            <Upload size={18} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[var(--text-primary)]">{t('importar.titulo')}</h1>
            <p className="text-sm text-[var(--text-muted)]">{t('importar.subtitulo')}</p>
          </div>
        </div>
      </div>

      {/* Step indicator */}
      <StepIndicator current={step} labels={stepLabels} />

      {/* Step content */}
      {step === 1 && <Step1Upload onParsed={handleParsed} />}

      {step === 2 && (
        <Step2Mapping
          headers={headers}
          previewRows={previewRows}
          mapping={mapping}
          tipoMode={tipoMode}
          onMappingChange={handleMappingChange}
          onTipoModeChange={handleTipoModeChange}
          onNext={handleGoToStep3}
          onBack={() => setStep(1)}
        />
      )}

      {step === 3 && (
        <Step3Confirm
          parsedRows={parsedRows}
          isImporting={importMutation.isPending}
          importResult={importResult}
          onConfirm={handleConfirmImport}
          onBack={() => setStep(2)}
          onReset={handleReset}
        />
      )}
    </div>
  )
}
