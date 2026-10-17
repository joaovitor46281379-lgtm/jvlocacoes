import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@shared/lib/api-client'

export const perfilKeys = {
  all: ['perfil'] as const,
  list: () => [...perfilKeys.all, 'list'] as const,
  user: (userId: string) => [...perfilKeys.all, userId] as const,
}

export function usePerfis() {
  return useQuery({
    queryKey: perfilKeys.list(),
    queryFn: async () => {
      const response = await apiClient.getPerfis()
      if (!response.success) throw new Error(response.error)
      return response.data
    }
  })
}

export function usePerfil(userId: string) {
  return useQuery({
    queryKey: perfilKeys.user(userId),
    queryFn: async () => {
      const response = await apiClient.getPerfil(userId)
      if (!response.success) return null
      return response.data
    },
    enabled: !!userId
  })
}

export function useUpsertPerfil() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ userId, nome, whatsapp }: { userId: string; nome: string; whatsapp: string }) => {
      const response = await apiClient.upsertPerfil(userId, nome, whatsapp)
      if (!response.success) throw new Error(response.error)
      return response.data
    },
    onSuccess: (_: unknown, variables: { userId: string; nome: string; whatsapp: string }) => {
      queryClient.invalidateQueries({ queryKey: perfilKeys.user(variables.userId) })
    }
  })
}
