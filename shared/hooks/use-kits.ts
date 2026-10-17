import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@shared/lib/api-client'
import type { KitFormData } from '@shared/types'

// ============================================
// QUERY KEYS
// ============================================

export const kitKeys = {
  all: ['kits'] as const,
  lists: () => [...kitKeys.all, 'list'] as const,
  list: (apenasAtivos?: boolean) => [...kitKeys.lists(), { apenasAtivos }] as const,
  details: () => [...kitKeys.all, 'detail'] as const,
  detail: (id: string) => [...kitKeys.details(), id] as const,
}

// ============================================
// QUERIES
// ============================================

export function useKits(apenasAtivos = true) {
  return useQuery({
    queryKey: kitKeys.list(apenasAtivos),
    queryFn: async () => {
      const response = await apiClient.getKits(apenasAtivos)
      if (!response.success) throw new Error(response.error)
      return response.data
    }
  })
}

export function useKit(id: string) {
  return useQuery({
    queryKey: kitKeys.detail(id),
    queryFn: async () => {
      const response = await apiClient.getKit(id)
      if (!response.success) throw new Error(response.error)
      return response.data
    },
    enabled: !!id
  })
}

// ============================================
// MUTATIONS
// ============================================

export function useCreateKit() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: KitFormData) => {
      const response = await apiClient.createKit(data)
      if (!response.success) throw new Error(response.error)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: kitKeys.lists() })
    }
  })
}

export function useUpdateKit() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<KitFormData> }) => {
      const response = await apiClient.updateKit(id, data)
      if (!response.success) throw new Error(response.error)
      return response.data
    },
    onSuccess: (_: unknown, variables: { id: string; data: Partial<KitFormData> }) => {
      queryClient.invalidateQueries({ queryKey: kitKeys.lists() })
      queryClient.invalidateQueries({ queryKey: kitKeys.detail(variables.id) })
    }
  })
}

export function useDeleteKit() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await apiClient.deleteKit(id)
      if (!response.success) throw new Error(response.error)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: kitKeys.lists() })
    }
  })
}
