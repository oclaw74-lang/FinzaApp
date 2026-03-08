export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  page_size: number
  has_next: boolean
}

export interface ApiError {
  detail: string
}

export type Currency = 'DOP' | 'USD'
export type TransactionType = 'ingreso' | 'egreso' | 'ambos'
