import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@shared/lib/api-client'
import type { PerdaQuebraFormData } from '@shared/types'

export function usePerdasQuebras() {
  return useQuery({
    queryKey: ['perdas-quebras'],
    queryFn: async () => {
      const response = await apiClient.getPerdasQuebras()
      if (!response.success) throw new Error(response.error)
      return response.data
    },
  })
}

export function usePerdasQuebrasPorPedido(pedidoId: string) {
  return useQuery({
    queryKey: ['perdas-quebras', 'pedido', pedidoId],
    queryFn: async () => {
      const response = await apiClient.getPerdasQuebrasPorPedido(pedidoId)
      if (!response.success) throw new Error(response.error)
      return response.data
    },
    enabled: !!pedidoId,
  })
}

export function useCreatePerdaQuebra() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: PerdaQuebraFormData) => {
      const response = await apiClient.createPerdaQuebra(data)
      if (!response.success) throw new Error(response.error)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['perdas-quebras'] })
    },
  })
}

export function useDeletePerdaQuebra() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await apiClient.deletePerdaQuebra(id)
      if (!response.success) throw new Error(response.error)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['perdas-quebras'] })
    },
  })
}
