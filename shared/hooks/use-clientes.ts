import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@shared/lib/api-client'

export const clientesKeys = {
  all: ['clientes'] as const,
}

export function useClientes() {
  return useQuery({
    queryKey: clientesKeys.all,
    queryFn: async () => {
      const response = await apiClient.getClientes()
      if (!response.success) throw new Error(response.error)
      return response.data || []
    }
  })
}

export function useCreateClienteManual() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: { nome: string; whatsapp: string; cpf?: string }) => {
      const response = await apiClient.createClienteManual(data)
      if (!response.success) throw new Error(response.error)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: clientesKeys.all })
    }
  })
}

/**
 * Procura o cliente pelo WhatsApp e cadastra automaticamente se não existir.
 */
export function useGarantirCliente() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: { nome: string; whatsapp: string; userId?: string }): Promise<{ cliente: any; criado: boolean }> => {
      const response = await apiClient.garantirClientePorWhatsapp(data)
      if (!response.success || !response.data) throw new Error(response.error || 'Erro ao cadastrar cliente')
      return response.data
    },
    onSuccess: (resultado) => {
      if (resultado.criado) {
        queryClient.invalidateQueries({ queryKey: clientesKeys.all })
      }
    }
  })
}

export function useUpdateCliente() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string; nome: string; whatsapp: string; cpf?: string }) => {
      const response = await apiClient.updateCliente(id, data)
      if (!response.success) throw new Error(response.error)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: clientesKeys.all })
    }
  })
}

export function useDeleteCliente() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await apiClient.deleteCliente(id)
      if (!response.success) throw new Error(response.error)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: clientesKeys.all })
    }
  })
}
