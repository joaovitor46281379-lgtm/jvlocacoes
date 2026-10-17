import { useState } from 'react'
import {
  usePerdasQuebras,
  useCreatePerdaQuebra,
  useDeletePerdaQuebra,
} from '@shared/hooks/use-perdas-quebras'
import { usePedidos } from '@shared/hooks/use-pedidos'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Plus, Trash2, AlertTriangle } from 'lucide-react'
import { formatarData, formatarValor } from '@shared/lib/validations'
import type { TipoPerdaQuebra, ItemPerdaQuebra } from '@shared/types'

export function PerdasPage() {
  const [isFormOpen, setIsFormOpen] = useState(false)

  const { data: perdas, isLoading } = usePerdasQuebras()
  const { data: pedidosData } = usePedidos(
    { status: ['AGUARDANDO_ENTREGA', 'AGUARDANDO_RETIRADA', 'CONCLUIDO'] },
    { limit: 100 }
  )
  const createPerda = useCreatePerdaQuebra()
  const deletePerda = useDeletePerdaQuebra()

  // Form state
  const [pedidoId, setPedidoId] = useState('')
  const [tipo, setTipo] = useState<TipoPerdaQuebra>('QUEBRA')
  const [item, setItem] = useState<ItemPerdaQuebra>('CADEIRA')
  const [quantidade, setQuantidade] = useState(1)
  const [descricao, setDescricao] = useState('')
  const [valorPrejuizo, setValorPrejuizo] = useState(0)

  const pedidos = pedidosData?.data || []

  const resetForm = () => {
    setPedidoId('')
    setTipo('QUEBRA')
    setItem('CADEIRA')
    setQuantidade(1)
    setDescricao('')
    setValorPrejuizo(0)
  }

  const handleClose = () => {
    setIsFormOpen(false)
    resetForm()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!pedidoId) {
      alert('Selecione um pedido')
      return
    }

    try {
      await createPerda.mutateAsync({
        pedidoId,
        tipo,
        item,
        quantidade,
        descricao: descricao || undefined,
        valorPrejuizo: valorPrejuizo || undefined,
      })
      handleClose()
    } catch (error) {
      console.error('Erro ao registrar:', error)
      alert('Erro ao registrar perda/quebra')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este registro?')) return

    try {
      await deletePerda.mutateAsync(id)
    } catch (error) {
      console.error('Erro ao excluir:', error)
      alert('Erro ao excluir registro')
    }
  }

  const tipoColors = {
    PERDA: 'bg-red-100 text-red-700',
    QUEBRA: 'bg-orange-100 text-orange-700',
  }

  const itemLabels = {
    MESA: 'Mesa(s)',
    CADEIRA: 'Cadeira(s)',
  }

  return (
    <div className="p-4 lg:p-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h1 className="text-2xl lg:text-3xl font-bold">Perdas e Quebras</h1>
        <Button onClick={() => setIsFormOpen(true)} className="w-full sm:w-auto">
          <Plus className="h-4 w-4 mr-2" />
          Registrar Ocorrência
        </Button>
      </div>

      {/* Lista */}
      {isLoading ? (
        <div className="text-center py-8">Carregando...</div>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden lg:block bg-white rounded-lg shadow overflow-hidden">
            <table className="w-full">
              <thead className="bg-slate-50 border-b">
                <tr>
                  <th className="text-left p-4 font-semibold">Pedido</th>
                  <th className="text-center p-4 font-semibold">Tipo</th>
                  <th className="text-center p-4 font-semibold">Item</th>
                  <th className="text-center p-4 font-semibold">Qtd</th>
                  <th className="text-right p-4 font-semibold">Prejuízo</th>
                  <th className="text-left p-4 font-semibold">Data</th>
                  <th className="text-right p-4 font-semibold">Ações</th>
                </tr>
              </thead>
              <tbody>
                {perdas?.map((perda) => (
                  <tr key={perda.id} className="border-b hover:bg-slate-50">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="bg-slate-100 p-2 rounded-lg">
                          <AlertTriangle className="h-5 w-5 text-orange-500" />
                        </div>
                        <div>
                          <div className="font-medium">
                            #{perda.pedidoId.substring(0, 8)}
                          </div>
                          <div className="text-sm text-slate-500">
                            {(perda.pedido as any)?.nome_solicitante || 'N/A'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${tipoColors[perda.tipo]}`}
                      >
                        {perda.tipo}
                      </span>
                    </td>
                    <td className="p-4 text-center">{itemLabels[perda.item]}</td>
                    <td className="p-4 text-center font-semibold">
                      {perda.quantidade}
                    </td>
                    <td className="p-4 text-right">
                      {perda.valorPrejuizo
                        ? formatarValor(perda.valorPrejuizo)
                        : '-'}
                    </td>
                    <td className="p-4 text-sm">
                      {formatarData(perda.createdAt)}
                    </td>
                    <td className="p-4 text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(perda.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
                {(!perdas || perdas.length === 0) && (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-500">
                      Nenhum registro encontrado
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="lg:hidden space-y-3">
            {perdas?.map((perda) => (
              <div key={perda.id} className="bg-white rounded-lg shadow p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="bg-slate-100 p-1.5 rounded-lg">
                      <AlertTriangle className="h-4 w-4 text-orange-500" />
                    </div>
                    <div>
                      <div className="font-medium text-sm">
                        #{perda.pedidoId.substring(0, 8)}
                      </div>
                      <div className="text-xs text-slate-500">
                        {(perda.pedido as any)?.nome_solicitante || 'N/A'}
                      </div>
                    </div>
                  </div>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${tipoColors[perda.tipo]}`}
                  >
                    {perda.tipo}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm mb-3">
                  <div>
                    <span className="text-slate-500">{itemLabels[perda.item]}:</span>{' '}
                    <span className="font-semibold">{perda.quantidade}</span>
                  </div>
                  <div className="font-semibold">
                    {perda.valorPrejuizo ? formatarValor(perda.valorPrejuizo) : '-'}
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500">
                    {formatarData(perda.createdAt)}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(perda.id)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
            {(!perdas || perdas.length === 0) && (
              <div className="bg-white rounded-lg shadow p-8 text-center text-slate-500">
                Nenhum registro encontrado
              </div>
            )}
          </div>
        </>
      )}

      {/* Modal de formulário */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar Perda/Quebra</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Pedido</Label>
              <Select value={pedidoId} onValueChange={setPedidoId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um pedido" />
                </SelectTrigger>
                <SelectContent>
                  {pedidos.map((pedido: any) => (
                    <SelectItem key={pedido.id} value={pedido.id}>
                      #{pedido.id.substring(0, 8)} - {pedido.nome_solicitante}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Tipo</Label>
                <Select
                  value={tipo}
                  onValueChange={(v: string) => setTipo(v as TipoPerdaQuebra)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="QUEBRA">Quebra</SelectItem>
                    <SelectItem value="PERDA">Perda</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Item</Label>
                <Select
                  value={item}
                  onValueChange={(v: string) => setItem(v as ItemPerdaQuebra)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CADEIRA">Cadeira</SelectItem>
                    <SelectItem value="MESA">Mesa</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Quantidade</Label>
                <Input
                  type="number"
                  min="1"
                  value={quantidade}
                  onChange={(e) => setQuantidade(Number(e.target.value))}
                  required
                />
              </div>
              <div>
                <Label>Valor do Prejuízo (R$)</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={valorPrejuizo}
                  onChange={(e) => setValorPrejuizo(Number(e.target.value))}
                />
              </div>
            </div>

            <div>
              <Label>Descrição (opcional)</Label>
              <Input
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                placeholder="Ex: Cadeira quebrou a perna"
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={handleClose}>
                Cancelar
              </Button>
              <Button type="submit" disabled={createPerda.isPending}>
                {createPerda.isPending ? 'Registrando...' : 'Registrar'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
