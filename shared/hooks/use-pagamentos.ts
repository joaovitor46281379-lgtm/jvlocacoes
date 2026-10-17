import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@shared/lib/api-client'
import { pedidoKeys } from './use-pedidos'

export function useUpdatePagamento() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const response = await apiClient.updatePagamento(id, status)
      if (!response.success) throw new Error(response.error)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: pedidoKeys.lists() })
    }
  })
}
