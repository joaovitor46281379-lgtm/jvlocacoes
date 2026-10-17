import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@shared/lib/api-client'

// ============================================
// QUERY KEYS
// ============================================

export const disponibilidadeKeys = {
  all: ['disponibilidade'] as const,
  periodo: (dataInicio: Date, dataFim: Date) =>
    [...disponibilidadeKeys.all, 'periodo', { dataInicio: dataInicio.toISOString(), dataFim: dataFim.toISOString() }] as const,
  multiplas: (dataInicio: Date, dataFim: Date) =>
    [...disponibilidadeKeys.all, 'multiplas', { dataInicio: dataInicio.toISOString(), dataFim: dataFim.toISOString() }] as const,
}

// ============================================
// QUERIES
// ============================================

/**
 * Hook para calcular disponibilidade de kits em um período específico
 * Retorna quantos kits estão disponíveis considerando todas as reservas confirmadas
 */
export function useDisponibilidadePeriodo(dataInicio: Date, dataFim: Date) {
  return useQuery({
    queryKey: disponibilidadeKeys.periodo(dataInicio, dataFim),
    queryFn: async () => {
      const response = await apiClient.getDisponibilidadePeriodo(dataInicio, dataFim)
      if (!response.success) throw new Error(response.error)
      return response.data
    },
    enabled: !!dataInicio && !!dataFim
  })
}

/**
 * Hook para calcular disponibilidade de múltiplas datas (para calendário)
 * Retorna um objeto com datas como chave e kits disponíveis como valor
 */
export function useDisponibilidadeMultiplasDatas(dataInicio: Date, dataFim: Date) {
  return useQuery({
    queryKey: disponibilidadeKeys.multiplas(dataInicio, dataFim),
    queryFn: async () => {
      const response = await apiClient.getDisponibilidadeMultiplasDatas(dataInicio, dataFim)
      if (!response.success) throw new Error(response.error)
      return response.data
    },
    enabled: !!dataInicio && !!dataFim
  })
}
