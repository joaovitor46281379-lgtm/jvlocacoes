import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@shared/lib/api-client'

export const inventarioKeys = {
  all: ['inventario'] as const,
  lists: () => [...inventarioKeys.all, 'list'] as const,
  item: (item: string) => [...inventarioKeys.all, item] as const,
}

export function useInventario() {
  return useQuery({
    queryKey: inventarioKeys.lists(),
    queryFn: async () => {
      const response = await apiClient.getInventario()
      if (!response.success) throw new Error(response.error)
      return response.data
    }
  })
}

export function useUpsertInventario() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ item, quantidade }: { item: string; quantidade: number }) => {
      const response = await apiClient.upsertInventario(item, quantidade)
      if (!response.success) throw new Error(response.error)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: inventarioKeys.lists() })
    }
  })
}
