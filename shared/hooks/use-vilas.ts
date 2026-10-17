import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@shared/lib/api-client'
import type { VilaFormData } from '@shared/types'

// ============================================
// QUERY KEYS
// ============================================

export const vilaKeys = {
  all: ['vilas'] as const,
  lists: () => [...vilaKeys.all, 'list'] as const,
  list: (apenasAtivas?: boolean) => [...vilaKeys.lists(), { apenasAtivas }] as const,
  details: () => [...vilaKeys.all, 'detail'] as const,
  detail: (id: string) => [...vilaKeys.details(), id] as const,
}

// ============================================
// QUERIES
// ============================================

export function useVilas(apenasAtivas = true) {
  return useQuery({
    queryKey: vilaKeys.list(apenasAtivas),
    queryFn: async () => {
      const response = await apiClient.getVilas(apenasAtivas)
      if (!response.success) throw new Error(response.error)
      return response.data
    }
  })
}

export function useVila(id: string) {
  return useQuery({
    queryKey: vilaKeys.detail(id),
    queryFn: async () => {
      const response = await apiClient.getVila(id)
      if (!response.success) throw new Error(response.error)
      return response.data
    },
    enabled: !!id
  })
}

// ============================================
// MUTATIONS
// ============================================

export function useCreateVila() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: VilaFormData) => {
      const response = await apiClient.createVila(data)
      if (!response.success) throw new Error(response.error)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: vilaKeys.lists() })
    }
  })
}

export function useUpdateVila() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<VilaFormData> }) => {
      const response = await apiClient.updateVila(id, data)
      if (!response.success) throw new Error(response.error)
      return response.data
    },
    onSuccess: (_: unknown, variables: { id: string; data: Partial<VilaFormData> }) => {
      queryClient.invalidateQueries({ queryKey: vilaKeys.lists() })
      queryClient.invalidateQueries({ queryKey: vilaKeys.detail(variables.id) })
    }
  })
}

export function useDeleteVila() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await apiClient.deleteVila(id)
      if (!response.success) throw new Error(response.error)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: vilaKeys.lists() })
    }
  })
}
