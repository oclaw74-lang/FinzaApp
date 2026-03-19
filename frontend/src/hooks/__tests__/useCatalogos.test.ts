import { renderHook, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'
import { useMonedas, usePaises, useBancos } from '@/hooks/useCatalogos'

vi.mock('@/lib/api', () => ({
  apiClient: {
    get: vi.fn(),
  },
}))

import { apiClient } from '@/lib/api'

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children)
}

const mockMonedas = [
  { codigo: 'DOP', nombre: 'Peso Dominicano', simbolo: 'RD$', decimales: 2, activa: true },
  { codigo: 'USD', nombre: 'Dolar Americano', simbolo: '$', decimales: 2, activa: true },
]

const mockPaises = [
  {
    codigo: 'DO',
    nombre: 'Republica Dominicana',
    nombre_en: 'Dominican Republic',
    moneda_codigo: 'DOP',
    bandera_emoji: '🇩🇴',
    activo: true,
  },
  {
    codigo: 'US',
    nombre: 'Estados Unidos',
    nombre_en: 'United States',
    moneda_codigo: 'USD',
    bandera_emoji: '🇺🇸',
    activo: true,
  },
]

const mockBancos = [
  { id: 'b-1', pais_codigo: 'DO', nombre: 'Banco Popular', nombre_corto: 'Popular', orden: 1, activo: true },
  { id: 'b-2', pais_codigo: 'DO', nombre: 'BHD Leon', nombre_corto: 'BHD', orden: 2, activo: true },
]

describe('useCatalogos', () => {
  beforeEach(() => vi.clearAllMocks())

  describe('useMonedas', () => {
    it('fetches monedas correctly and returns data', async () => {
      vi.mocked(apiClient.get).mockResolvedValueOnce({ data: mockMonedas })

      const { result } = renderHook(() => useMonedas(), { wrapper: createWrapper() })

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      expect(result.current.data).toHaveLength(2)
      expect(result.current.data?.[0].codigo).toBe('DOP')
    })

    it('is in loading state initially', () => {
      vi.mocked(apiClient.get).mockImplementationOnce(() => new Promise(() => {}))

      const { result } = renderHook(() => useMonedas(), { wrapper: createWrapper() })

      expect(result.current.isLoading).toBe(true)
    })

    it('handles fetch error correctly', async () => {
      vi.mocked(apiClient.get).mockRejectedValueOnce(new Error('Network error'))

      const { result } = renderHook(() => useMonedas(), { wrapper: createWrapper() })

      await waitFor(() => expect(result.current.isError).toBe(true))
    })

    it('uses staleTime Infinity (data does not refetch on re-mount)', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({ data: mockMonedas })

      const wrapper = createWrapper()
      const { result: r1 } = renderHook(() => useMonedas(), { wrapper })
      await waitFor(() => expect(r1.current.isSuccess).toBe(true))

      const { result: r2 } = renderHook(() => useMonedas(), { wrapper })
      await waitFor(() => expect(r2.current.data).toBeDefined())

      // Should only have been called once due to staleTime: Infinity
      expect(apiClient.get).toHaveBeenCalledTimes(1)
    })
  })

  describe('usePaises', () => {
    it('fetches paises correctly and returns data', async () => {
      vi.mocked(apiClient.get).mockResolvedValueOnce({ data: mockPaises })

      const { result } = renderHook(() => usePaises(), { wrapper: createWrapper() })

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      expect(result.current.data).toHaveLength(2)
      expect(result.current.data?.[0].codigo).toBe('DO')
      expect(result.current.data?.[0].bandera_emoji).toBe('🇩🇴')
    })

    it('is in loading state initially', () => {
      vi.mocked(apiClient.get).mockImplementationOnce(() => new Promise(() => {}))

      const { result } = renderHook(() => usePaises(), { wrapper: createWrapper() })

      expect(result.current.isLoading).toBe(true)
    })

    it('handles fetch error correctly', async () => {
      vi.mocked(apiClient.get).mockRejectedValueOnce(new Error('Server error'))

      const { result } = renderHook(() => usePaises(), { wrapper: createWrapper() })

      await waitFor(() => expect(result.current.isError).toBe(true))
    })
  })

  describe('useBancos', () => {
    it('is disabled when paisCodigo is null', () => {
      const { result } = renderHook(() => useBancos(null), { wrapper: createWrapper() })

      expect(result.current.fetchStatus).toBe('idle')
      expect(result.current.data).toBeUndefined()
      expect(apiClient.get).not.toHaveBeenCalled()
    })

    it('fetches bancos when paisCodigo is provided', async () => {
      vi.mocked(apiClient.get).mockResolvedValueOnce({ data: mockBancos })

      const { result } = renderHook(() => useBancos('DO'), { wrapper: createWrapper() })

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      expect(result.current.data).toHaveLength(2)
      expect(result.current.data?.[0].nombre_corto).toBe('Popular')
    })

    it('calls the correct endpoint with pais_codigo', async () => {
      vi.mocked(apiClient.get).mockResolvedValueOnce({ data: mockBancos })

      const { result } = renderHook(() => useBancos('DO'), { wrapper: createWrapper() })

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      expect(apiClient.get).toHaveBeenCalledWith('/catalogos/paises/DO/bancos')
    })

    it('is in loading state when paisCodigo is set and data is pending', () => {
      vi.mocked(apiClient.get).mockImplementationOnce(() => new Promise(() => {}))

      const { result } = renderHook(() => useBancos('DO'), { wrapper: createWrapper() })

      expect(result.current.isLoading).toBe(true)
    })

    it('handles fetch error correctly', async () => {
      vi.mocked(apiClient.get).mockRejectedValueOnce(new Error('Not found'))

      const { result } = renderHook(() => useBancos('XX'), { wrapper: createWrapper() })

      await waitFor(() => expect(result.current.isError).toBe(true))
    })
  })
})
