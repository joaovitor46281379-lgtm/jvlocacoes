import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Kit } from '@/types/kit'

export function useKits() {
  return useQuery({
    queryKey: ['kits'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('kits')
        .select('*')
        .eq('ativo', true)
        .order('valor', { ascending: true })

      if (error) {
        throw error
      }

      return data as Kit[]
    },
  })
}
