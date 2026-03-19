import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api'
import type { ProfileData, ProfileUpdate } from '@/types/profile'

export function useProfile() {
  return useQuery({
    queryKey: ['profile'],
    queryFn: async (): Promise<ProfileData> => {
      const { data } = await apiClient.get('/profiles/me')
      return data as ProfileData
    },
    staleTime: 5 * 60 * 1000,
  })
}

export function useUpdateProfile() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payload: ProfileUpdate): Promise<ProfileData> => {
      const { data } = await apiClient.patch('/profiles/me', payload)
      return data as ProfileData
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['profile'] }),
  })
}
