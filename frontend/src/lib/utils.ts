import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}

// Symbol lookup for currencies used in Latin America and beyond
const CURRENCY_SYMBOLS: Record<string, string> = {
  DOP: 'RD$',
  USD: 'US$',
  EUR: '€',
  MXN: 'MX$',
  COP: 'COL$',
  ARS: 'AR$',
  BRL: 'R$',
  GBP: '£',
  CAD: 'CA$',
  CLP: 'CLP$',
  PEN: 'S/',
}

export function getCurrencySymbol(currency: string): string {
  return CURRENCY_SYMBOLS[currency?.toUpperCase()] ?? currency
}

export function formatMoney(amount: number, currency = 'DOP'): string {
  const symbol = getCurrencySymbol(currency)
  const formatted = new Intl.NumberFormat('es-DO', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
  return `${symbol} ${formatted}`
}

export function formatCurrency(amount: number, currency = 'DOP'): string {
  return formatMoney(amount, currency)
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('es-DO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(date))
}

export const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
]
