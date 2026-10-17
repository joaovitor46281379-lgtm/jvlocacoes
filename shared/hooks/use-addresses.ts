import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@shared/lib/api-client'
import type { AddressFormData } from '@shared/types'

// Hook para buscar todos os endereços do usuário
export function useAddresses(userId: string) {
  return useQuery({
    queryKey: ['addresses', userId],
    queryFn: async () => {
      const response = await apiClient.getAddresses(userId)
      if (!response.success) {
        throw new Error(response.error || 'Erro ao buscar endereços')
      }
      return response.data || []
    },
    enabled: !!userId,
  })
}

// Hook para buscar o endereço padrão do usuário
export function useDefaultAddress(userId: string) {
  return useQuery({
    queryKey: ['addresses', userId, 'default'],
    queryFn: async () => {
      const response = await apiClient.getDefaultAddress(userId)
      if (!response.success) {
        return null
      }
      return response.data || null
    },
    enabled: !!userId,
  })
}

// Hook para buscar um endereço específico
export function useAddress(addressId: string) {
  return useQuery({
    queryKey: ['addresses', addressId],
    queryFn: async () => {
      const response = await apiClient.getAddress(addressId)
      if (!response.success) {
        throw new Error(response.error || 'Erro ao buscar endereço')
      }
      return response.data
    },
    enabled: !!addressId,
  })
}

// Hook para criar um novo endereço
export function useCreateAddress() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ userId, data }: { userId: string; data: AddressFormData }) => {
      const response = await apiClient.createAddress(userId, data)
      if (!response.success) {
        throw new Error(response.error || 'Erro ao criar endereço')
      }
      return response.data
    },
    onSuccess: (_, variables) => {
      // Invalidar a lista de endereços do usuário
      queryClient.invalidateQueries({ queryKey: ['addresses', variables.userId] })
      queryClient.invalidateQueries({ queryKey: ['addresses', variables.userId, 'default'] })
    },
  })
}

// Hook para atualizar um endereço
export function useUpdateAddress() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<AddressFormData> }) => {
      const response = await apiClient.updateAddress(id, data)
      if (!response.success) {
        throw new Error(response.error || 'Erro ao atualizar endereço')
      }
      return response.data
    },
    onSuccess: (data) => {
      // Invalidar o endereço específico e a lista
      queryClient.invalidateQueries({ queryKey: ['addresses', data?.id] })
      if (data?.userId) {
        queryClient.invalidateQueries({ queryKey: ['addresses', data.userId] })
        queryClient.invalidateQueries({ queryKey: ['addresses', data.userId, 'default'] })
      }
    },
  })
}

// Hook para definir um endereço como padrão
export function useSetDefaultAddress() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ userId, addressId }: { userId: string; addressId: string }) => {
      const response = await apiClient.setDefaultAddress(userId, addressId)
      if (!response.success) {
        throw new Error(response.error || 'Erro ao definir endereço padrão')
      }
      return response.data
    },
    onSuccess: (_, variables) => {
      // Invalidar a lista de endereços e o endereço padrão
      queryClient.invalidateQueries({ queryKey: ['addresses', variables.userId] })
      queryClient.invalidateQueries({ queryKey: ['addresses', variables.userId, 'default'] })
    },
  })
}

// Hook para deletar um endereço
export function useDeleteAddress() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id }: { id: string; userId: string }) => {
      const response = await apiClient.deleteAddress(id)
      if (!response.success) {
        throw new Error(response.error || 'Erro ao deletar endereço')
      }
      return response.data
    },
    onSuccess: (_, variables) => {
      // Invalidar a lista de endereços
      queryClient.invalidateQueries({ queryKey: ['addresses', variables.userId] })
      queryClient.invalidateQueries({ queryKey: ['addresses', variables.userId, 'default'] })
    },
  })
}
