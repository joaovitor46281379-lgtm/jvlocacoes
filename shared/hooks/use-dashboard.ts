import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@shared/lib/api-client'

// ============================================
// QUERY KEYS
// ============================================

export const dashboardKeys = {
  all: ['dashboard'] as const,
  stats: () => [...dashboardKeys.all, 'stats'] as const,
  filtrado: (mes: number, ano: number) => [...dashboardKeys.all, 'filtrado', mes, ano] as const,
}

// ============================================
// QUERIES
// ============================================

export function useDashboardStats() {
  return useQuery({
    queryKey: dashboardKeys.stats(),
    queryFn: async () => {
      const response = await apiClient.getDashboardStats()
      if (!response.success) throw new Error(response.error)
      return response.data
    },
    // Atualiza a cada 30 segundos
    refetchInterval: 30000,
    // Mantém dados antigos enquanto busca novos
    placeholderData: (previousData) => previousData
  })
}

export function useDashboardFiltrado(mes: number, ano: number) {
  return useQuery({
    queryKey: dashboardKeys.filtrado(mes, ano),
    queryFn: async () => {
      const response = await apiClient.getDashboardFiltrado(mes, ano)
      if (!response.success) throw new Error(response.error)
      return response.data
    },
    placeholderData: (previousData) => previousData
  })
}
