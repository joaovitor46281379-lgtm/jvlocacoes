import { useAvaliacoes } from '@shared/hooks/use-avaliacoes'
import { Star } from 'lucide-react'
import { formatarData } from '@shared/lib/validations'

export function AvaliacoesPage() {
  const { data: avaliacoes, isLoading } = useAvaliacoes()

  const renderStars = (count: number) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${
              star <= count
                ? 'text-yellow-400 fill-yellow-400'
                : 'text-slate-300'
            }`}
          />
        ))}
      </div>
    )
  }

  return (
    <div className="p-4 lg:p-8">
      <h1 className="text-2xl lg:text-3xl font-bold mb-6">Avaliações</h1>

      {isLoading ? (
        <div className="text-center py-8">Carregando...</div>
      ) : (
        <div className="space-y-3 lg:space-y-4">
          {avaliacoes?.map((avaliacao: any) => (
            <div
              key={avaliacao.id}
              className="bg-white rounded-lg shadow p-4 lg:p-6"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="font-semibold">
                    Pedido #{avaliacao.pedido_id?.substring(0, 8) || 'N/A'}
                  </div>
                  <div className="text-sm text-slate-500">
                    {avaliacao.pedido?.nome_solicitante || 'Cliente'}
                  </div>
                </div>
                <div className="text-right">
                  {renderStars(avaliacao.estrelas)}
                  <div className="text-sm text-slate-500 mt-1">
                    {formatarData(new Date(avaliacao.created_at))}
                  </div>
                </div>
              </div>

              {avaliacao.comentario && (
                <div className="bg-slate-50 rounded-lg p-4 text-sm">
                  "{avaliacao.comentario}"
                </div>
              )}
            </div>
          ))}

          {(!avaliacoes || avaliacoes.length === 0) && (
            <div className="bg-white rounded-lg shadow p-8 text-center text-slate-500">
              Nenhuma avaliação encontrada
            </div>
          )}
        </div>
      )}
    </div>
  )
}
