export const APP_NAME = 'Finza'
export const APP_TAGLINE = 'Fluye hacia tu libertad financiera'

export const CURRENCIES = [
  { value: 'DOP', label: 'Peso Dominicano (RD$)' },
  { value: 'USD', label: 'Dólar Americano ($)' },
] as const

export const TRANSACTION_TYPES = {
  INGRESO: 'ingreso',
  EGRESO: 'egreso',
} as const
