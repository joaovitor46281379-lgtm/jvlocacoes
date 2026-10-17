import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@shared/lib/api-client'
import type { Pedido, PedidoFormData, PedidoFilters, PaginationParams } from '@shared/types'

// ============================================
// QUERY KEYS
// ============================================

export const pedidoKeys = {
  all: ['pedidos'] as const,
  lists: () => [...pedidoKeys.all, 'list'] as const,
  list: (filters?: PedidoFilters, pagination?: PaginationParams) =>
    [...pedidoKeys.lists(), { filters, pagination }] as const,
  details: () => [...pedidoKeys.all, 'detail'] as const,
  detail: (id: string) => [...pedidoKeys.details(), id] as const,
}

// ============================================
// QUERIES
// ============================================

export function usePedidos(filters?: PedidoFilters, pagination?: PaginationParams) {
  return useQuery({
    queryKey: pedidoKeys.list(filters, pagination),
    queryFn: async () => {
      const response = await apiClient.getPedidos(filters, pagination)
      if (!response.success) throw new Error(response.error)
      return response.data
    }
  })
}

export function usePedido(id: string) {
  return useQuery({
    queryKey: pedidoKeys.detail(id),
    queryFn: async () => {
      const response = await apiClient.getPedido(id)
      if (!response.success) throw new Error(response.error)
      return response.data
    },
    enabled: !!id
  })
}

/**
 * Último pedido do cliente (por WhatsApp / user_id), usado para pré-preencher
 * endereço e vila. Só consulta quando `params` é informado.
 */
export function useUltimoPedidoDoCliente(params: { userId?: string; whatsapp: string } | null) {
  return useQuery({
    queryKey: [...pedidoKeys.all, 'ultimo-do-cliente', params?.userId ?? '', params?.whatsapp ?? ''] as const,
    queryFn: async () => {
      const response = await apiClient.getUltimoPedidoDoCliente(params!)
      if (!response.success) return null
      return response.data ?? null
    },
    enabled: !!params,
    staleTime: 60_000
  })
}

// ============================================
// MUTATIONS
// ============================================

export function useCreatePedido() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: PedidoFormData & { userId: string; total: number; valorKit: number; valorFrete: number }) => {
      const response = await apiClient.createPedido(data)
      if (!response.success) throw new Error(response.error)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: pedidoKeys.lists() })
    }
  })
}

export function useConfirmarPedido() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: PedidoFormData & { userId: string; total: number; valorKit: number; valorFrete: number }) => {
      const response = await apiClient.confirmarPedido(data)
      if (!response.success) throw new Error(response.error)
      return response.data
    },
    onSuccess: () => {
      // Invalidar queries de pedidos e disponibilidade
      queryClient.invalidateQueries({ queryKey: pedidoKeys.lists() })
      queryClient.invalidateQueries({ queryKey: ['disponibilidade'] })
    }
  })
}

export function useUpdatePedido() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Pedido> }) => {
      const response = await apiClient.updatePedido(id, data)
      if (!response.success) throw new Error(response.error)
      return response.data
    },
    onSuccess: (_: unknown, variables: { id: string; data: Partial<Pedido> }) => {
      queryClient.invalidateQueries({ queryKey: pedidoKeys.lists() })
      queryClient.invalidateQueries({ queryKey: pedidoKeys.detail(variables.id) })
    }
  })
}

export function useCancelarPedido() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await apiClient.cancelarPedido(id)
      if (!response.success) throw new Error(response.error)
      return response.data
    },
    onSuccess: (_: unknown, id: string) => {
      queryClient.invalidateQueries({ queryKey: pedidoKeys.lists() })
      queryClient.invalidateQueries({ queryKey: pedidoKeys.detail(id) })
    }
  })
}

export function useDeletePedido() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await apiClient.deletePedido(id)
      if (!response.success) throw new Error(response.error)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: pedidoKeys.lists() })
    }
  })
}
