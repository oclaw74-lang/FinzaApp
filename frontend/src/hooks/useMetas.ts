import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api'
import type {
  MetaAhorro,
  MetaAhorroCreate,
  MetaAhorroUpdate,
  ContribucionMeta,
  ContribucionMetaCreate,
  MetasResumen,
} from '@/types/meta_ahorro'

// ─── Query keys ────────────────────────────────────────────────────────────────

const METAS_KEY = 'metas' as const

const DASHBOARD_KEYS = [
  ['dashboard-v2'],
  ['score'],
  ['prediccion-mes'],
  ['comparativa'],
] as const

// ─── Queries ───────────────────────────────────────────────────────────────────

export function useMetas() {
  return useQuery({
    queryKey: [METAS_KEY],
    queryFn: async (): Promise<MetaAhorro[]> => {
      const { data } = await apiClient.get<MetaAhorro[]>('/metas')
      return data
    },
  })
}

export function useMetaDetalle(id: string | null) {
  return useQuery({
    queryKey: [METAS_KEY, id],
    queryFn: async (): Promise<MetaAhorro> => {
      const { data } = await apiClient.get<MetaAhorro>(`/metas/${id}`)
      return data
    },
    enabled: id !== null,
  })
}

export function useMetasResumen() {
  return useQuery({
    queryKey: [METAS_KEY, 'resumen'],
    queryFn: async (): Promise<MetasResumen> => {
      const { data } = await apiClient.get<MetasResumen>('/metas/resumen')
      return data
    },
  })
}

export function useContribucionesMeta(metaId: string | null) {
  return useQuery({
    queryKey: [METAS_KEY, metaId, 'contribuciones'],
    queryFn: async (): Promise<ContribucionMeta[]> => {
      const { data } = await apiClient.get<ContribucionMeta[]>(
        `/metas/${metaId}/contribuciones`
      )
      return data
    },
    enabled: metaId !== null,
  })
}

// ─── Mutations ────────────────────────────────────────────────────────────────

export function useCreateMeta() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payload: MetaAhorroCreate): Promise<MetaAhorro> => {
      const { data } = await apiClient.post<MetaAhorro>('/metas', payload)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [METAS_KEY] })
      DASHBOARD_KEYS.forEach(key => queryClient.invalidateQueries({ queryKey: key }))
    },
  })
}

export function useUpdateMeta() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      id,
      ...payload
    }: { id: string } & MetaAhorroUpdate): Promise<MetaAhorro> => {
      const { data } = await apiClient.put<MetaAhorro>(`/metas/${id}`, payload)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [METAS_KEY] })
      DASHBOARD_KEYS.forEach(key => queryClient.invalidateQueries({ queryKey: key }))
    },
  })
}

export function useDeleteMeta() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      await apiClient.delete(`/metas/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [METAS_KEY] })
      DASHBOARD_KEYS.forEach(key => queryClient.invalidateQueries({ queryKey: key }))
    },
  })
}

export function useAgregarContribucion(metaId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (
      payload: ContribucionMetaCreate
    ): Promise<ContribucionMeta> => {
      const { data } = await apiClient.post<ContribucionMeta>(
        `/metas/${metaId}/contribuciones`,
        payload
      )
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [METAS_KEY] })
      DASHBOARD_KEYS.forEach(key => queryClient.invalidateQueries({ queryKey: key }))
    },
  })
}

export function useDeleteContribucion(metaId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (contribucionId: string): Promise<void> => {
      await apiClient.delete(
        `/metas/${metaId}/contribuciones/${contribucionId}`
      )
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [METAS_KEY] })
      DASHBOARD_KEYS.forEach(key => queryClient.invalidateQueries({ queryKey: key }))
    },
  })
}
