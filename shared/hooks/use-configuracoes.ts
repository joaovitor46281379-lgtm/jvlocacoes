import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@shared/lib/api-client'

export const configuracoesKeys = {
  all: ['configuracoes'] as const,
}

export function useConfiguracoes() {
  return useQuery({
    queryKey: configuracoesKeys.all,
    queryFn: async () => {
      const response = await apiClient.getConfiguracoes()
      if (!response.success) throw new Error(response.error)
      return response.data
    }
  })
}

export function useUpsertConfiguracao() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, valor }: { id: string; valor: string }) => {
      const response = await apiClient.upsertConfiguracao(id, valor)
      if (!response.success) throw new Error(response.error)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: configuracoesKeys.all })
    }
  })
}
