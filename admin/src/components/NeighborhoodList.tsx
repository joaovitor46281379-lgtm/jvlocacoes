import { useState } from 'react'
import { useVilas, useDeleteVila, useUpdateVila } from '@shared/hooks/use-vilas'
import { Button } from '@/components/ui/button'
import { Trash2, Edit, CheckCircle, XCircle } from 'lucide-react'

interface NeighborhoodListProps {
  onEdit: (id: string) => void
}

export function NeighborhoodList({ onEdit }: NeighborhoodListProps) {
  const { data: neighborhoods, isLoading } = useVilas(false)
  const deleteVila = useDeleteVila()
  const updateVila = useUpdateVila()
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const handleDelete = async (id: string, nome: string) => {
    setDeleteError(null)
    if (!confirm(`Deletar bairro "${nome}"? Esta ação não pode ser desfeita.`)) return
    try {
      await deleteVila.mutateAsync(id)
    } catch (error: any) {
      const msg = error?.message || ''
      if (msg.includes('foreign key') || msg.includes('violates') || msg.includes('constraint')) {
        setDeleteError(`Não é possível excluir o bairro "${nome}" pois existem pedidos vinculados a ele.`)
      } else {
        setDeleteError(msg || 'Erro ao excluir bairro. Tente novamente.')
      }
    }
  }

  const handleToggleActive = async (id: string, ativo: boolean) => {
    await updateVila.mutateAsync({ id, data: { ativo: !ativo } })
  }

  if (isLoading) {
    return <div className="text-center py-8">Carregando...</div>
  }

  if (!neighborhoods || neighborhoods.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Nenhum bairro cadastrado ainda.
      </div>
    )
  }

  return (
    <>
      {deleteError && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {deleteError}
        </div>
      )}

      {/* Desktop Table */}
      <div className="hidden md:block overflow-x-auto border rounded-lg">
        <table className="w-full">
          <thead className="bg-muted">
            <tr>
              <th className="p-3 text-left font-medium">Nome</th>
              <th className="p-3 text-left font-medium">Valor Frete</th>
              <th className="p-3 text-left font-medium">Status</th>
              <th className="p-3 text-right font-medium">Ações</th>
            </tr>
          </thead>
          <tbody>
            {neighborhoods.map((neighborhood) => (
              <tr key={neighborhood.id} className="border-t hover:bg-muted/50">
                <td className="p-3">{neighborhood.nome}</td>
                <td className="p-3">R$ {Number(neighborhood.valorFrete).toFixed(2)}</td>
                <td className="p-3">
                  {neighborhood.ativo ? (
                    <span className="text-green-600 flex items-center gap-1">
                      <CheckCircle className="h-4 w-4" /> Ativo
                    </span>
                  ) : (
                    <span className="text-red-600 flex items-center gap-1">
                      <XCircle className="h-4 w-4" /> Inativo
                    </span>
                  )}
                </td>
                <td className="p-3 text-right space-x-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleToggleActive(neighborhood.id, neighborhood.ativo)}
                  >
                    {neighborhood.ativo ? 'Desativar' : 'Ativar'}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onEdit(neighborhood.id)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleDelete(neighborhood.id, neighborhood.nome)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-3">
        {neighborhoods.map((neighborhood) => (
          <div key={neighborhood.id} className="bg-white border rounded-lg p-4 shadow-sm">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="font-semibold">{neighborhood.nome}</h3>
                <p className="text-sm text-slate-500">
                  Frete: R$ {Number(neighborhood.valorFrete).toFixed(2)}
                </p>
              </div>
              {neighborhood.ativo ? (
                <span className="text-green-600 flex items-center gap-1 text-sm">
                  <CheckCircle className="h-4 w-4" /> Ativo
                </span>
              ) : (
                <span className="text-red-600 flex items-center gap-1 text-sm">
                  <XCircle className="h-4 w-4" /> Inativo
                </span>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                className="flex-1"
                onClick={() => handleToggleActive(neighborhood.id, neighborhood.ativo)}
              >
                {neighborhood.ativo ? 'Desativar' : 'Ativar'}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onEdit(neighborhood.id)}
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => handleDelete(neighborhood.id, neighborhood.nome)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </>
  )
}
