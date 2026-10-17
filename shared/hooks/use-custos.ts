import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@shared/lib/api-client'

export const custosKeys = {
  all: ['custos'] as const,
  byMes: (mes: number, ano: number) => [...custosKeys.all, mes, ano] as const,
  categorias: ['categorias_custos'] as const,
}

export function useCategoriasCustos() {
  return useQuery({
    queryKey: custosKeys.categorias,
    queryFn: async () => {
      const response = await apiClient.getCategoriasCustos()
      if (!response.success) throw new Error(response.error)
      return response.data
    }
  })
}

export function useCreateCategoriaCusto() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (nome: string) => {
      const response = await apiClient.createCategoriaCusto(nome)
      if (!response.success) throw new Error(response.error)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: custosKeys.categorias })
    }
  })
}

export function useDeleteCategoriaCusto() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await apiClient.deleteCategoriaCusto(id)
      if (!response.success) throw new Error(response.error)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: custosKeys.categorias })
    }
  })
}

export function useCustos(mes: number, ano: number) {
  return useQuery({
    queryKey: custosKeys.byMes(mes, ano),
    queryFn: async () => {
      const response = await apiClient.getCustos(mes, ano)
      if (!response.success) throw new Error(response.error)
      return response.data
    }
  })
}

export function useCreateCusto() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: { categoriaId: string; valor: number; descricao?: string; mes: number; ano: number }) => {
      const response = await apiClient.createCusto(data)
      if (!response.success) throw new Error(response.error)
      return response.data
    },
    onSuccess: (_: unknown, variables: { categoriaId: string; valor: number; descricao?: string; mes: number; ano: number }) => {
      queryClient.invalidateQueries({ queryKey: custosKeys.byMes(variables.mes, variables.ano) })
    }
  })
}

export function useDeleteCusto() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id }: { id: string; mes: number; ano: number }) => {
      const response = await apiClient.deleteCusto(id)
      if (!response.success) throw new Error(response.error)
      return response.data
    },
    onSuccess: (_: unknown, variables: { id: string; mes: number; ano: number }) => {
      queryClient.invalidateQueries({ queryKey: custosKeys.byMes(variables.mes, variables.ano) })
    }
  })
}
