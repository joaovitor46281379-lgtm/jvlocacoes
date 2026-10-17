import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@shared/lib/api-client'
import { pedidoKeys } from '@shared/hooks/use-pedidos'
import type { AvaliacaoFormData } from '@shared/types'

// ============================================
// QUERY KEYS
// ============================================

export const avaliacaoKeys = {
  all: ['avaliacoes'] as const,
  lists: () => [...avaliacaoKeys.all, 'list'] as const,
  byPedido: (pedidoId: string) => [...avaliacaoKeys.all, 'pedido', pedidoId] as const,
}

// ============================================
// QUERIES
// ============================================

export function useAvaliacoes() {
  return useQuery({
    queryKey: avaliacaoKeys.lists(),
    queryFn: async () => {
      const response = await apiClient.getAvaliacoes()
      if (!response.success) throw new Error(response.error)
      return response.data
    }
  })
}

export function useAvaliacaoPorPedido(pedidoId: string) {
  return useQuery({
    queryKey: avaliacaoKeys.byPedido(pedidoId),
    queryFn: async () => {
      const response = await apiClient.getAvaliacaoPorPedido(pedidoId)
      if (!response.success) throw new Error(response.error)
      return response.data ?? null
    },
    enabled: !!pedidoId
  })
}

// ============================================
// MUTATIONS
// ============================================

export function useCreateAvaliacao() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: AvaliacaoFormData) => {
      const response = await apiClient.createAvaliacao(data)
      if (!response.success) throw new Error(response.error)
      return response.data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: avaliacaoKeys.lists() })
      queryClient.invalidateQueries({ queryKey: avaliacaoKeys.byPedido(variables.pedidoId) })
      queryClient.invalidateQueries({ queryKey: pedidoKeys.lists() })
    }
  })
}
