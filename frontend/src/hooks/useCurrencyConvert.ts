import { useDualMoneda } from './useDualMoneda'
import { formatMoney } from '@/lib/utils'

export interface DualAmount {
  /** Amount formatted in its original currency */
  original: string
  /** Amount formatted in the user's main currency (null if same currency) */
  converted: string | null
  /** Numeric value in main currency */
  valueInMain: number
}

/**
 * Provides currency conversion utilities relative to the user's configured
 * moneda_principal and moneda_secundaria.
 */
export function useCurrencyConvert() {
  const { data } = useDualMoneda()

  const monedaPrincipal = data?.moneda_principal ?? 'DOP'
  const monedaSecundaria = data?.moneda_secundaria ?? null
  const tasaCambio = data?.tasa_cambio ?? 1

  /**
   * Convert an amount to the user's main currency.
   * If moneda == monedaPrincipal → returns as-is.
   * If moneda == monedaSecundaria → multiplies by tasa_cambio.
   * Otherwise → returns as-is (unknown currency, no conversion).
   */
  const toMain = (amount: number, moneda: string): number => {
    if (!moneda || moneda === monedaPrincipal) return amount
    if (monedaSecundaria && moneda === monedaSecundaria && tasaCambio > 0) {
      return amount * tasaCambio
    }
    return amount
  }

  /**
   * Format an amount with its correct currency symbol.
   */
  const formatAmount = (amount: number, moneda: string): string => {
    return formatMoney(amount, moneda || monedaPrincipal)
  }

  /**
   * Returns original formatted amount + optional converted amount in main currency.
   * If the item is already in main currency, `converted` is null.
   */
  const showDual = (amount: number, moneda: string): DualAmount => {
    const original = formatAmount(amount, moneda)
    if (!moneda || moneda === monedaPrincipal) {
      return { original, converted: null, valueInMain: amount }
    }
    const valueInMain = toMain(amount, moneda)
    const converted = monedaSecundaria && moneda === monedaSecundaria
      ? `≈ ${formatMoney(valueInMain, monedaPrincipal)}`
      : null
    return { original, converted, valueInMain }
  }

  return {
    monedaPrincipal,
    monedaSecundaria,
    tasaCambio,
    toMain,
    formatAmount,
    showDual,
  }
}
