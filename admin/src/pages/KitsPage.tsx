import { useState } from 'react'
import { useKits, useCreateKit, useUpdateKit, useDeleteKit } from '@shared/hooks/use-kits'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Plus, Pencil, Trash2, Package } from 'lucide-react'
import type { Kit } from '@shared/types'

export function KitsPage() {
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingKit, setEditingKit] = useState<Kit | null>(null)
  const [showInactive, setShowInactive] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const { data: kits, isLoading } = useKits(!showInactive)
  const createKit = useCreateKit()
  const updateKit = useUpdateKit()
  const deleteKit = useDeleteKit()

  // Form state
  const [descricao, setDescricao] = useState('')
  const [mesas, setMesas] = useState('')
  const [cadeiras, setCadeiras] = useState('')
  const [valor, setValor] = useState('')
  const [ativo, setAtivo] = useState(true)

  const resetForm = () => {
    setDescricao('')
    setMesas('')
    setCadeiras('')
    setValor('')
    setAtivo(true)
    setEditingKit(null)
    setFormError(null)
  }

  const handleOpenNew = () => {
    resetForm()
    setIsFormOpen(true)
  }

  const handleOpenEdit = (kit: Kit) => {
    setEditingKit(kit)
    setDescricao(kit.descricao)
    setMesas(String(kit.mesas))
    setCadeiras(String(kit.cadeiras))
    setValor(String(kit.valor))
    setAtivo(kit.ativo)
    setIsFormOpen(true)
  }

  const handleClose = () => {
    setIsFormOpen(false)
    resetForm()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)

    if (!descricao.trim()) {
      setFormError('A descrição é obrigatória.')
      return
    }
    const mesasNum = Number(mesas)
    const cadeirasNum = Number(cadeiras)
    const valorNum = Number(valor)
    if (isNaN(mesasNum) || mesasNum < 0) {
      setFormError('Mesas não podem ser negativas.')
      return
    }
    if (isNaN(cadeirasNum) || cadeirasNum < 0) {
      setFormError('Cadeiras não podem ser negativas.')
      return
    }
    if (isNaN(valorNum) || valorNum <= 0) {
      setFormError('O valor deve ser maior que zero.')
      return
    }

    const data = {
      descricao,
      mesas: mesasNum,
      cadeiras: cadeirasNum,
      valor: valorNum,
      ativo,
    }

    try {
      if (editingKit) {
        await updateKit.mutateAsync({ id: editingKit.id, data })
      } else {
        await createKit.mutateAsync(data)
      }
      handleClose()
    } catch (error: any) {
      console.error('Erro ao salvar kit:', error)
      setFormError(error?.message || 'Erro ao salvar kit. Tente novamente.')
    }
  }

  const handleDelete = async (kit: Kit) => {
    if (!confirm('ATENÇÃO: Esta ação é irreversível. Deseja excluir permanentemente este kit?')) return

    try {
      await deleteKit.mutateAsync(kit.id)
    } catch (error) {
      console.error('Erro ao excluir kit:', error)
      alert('Erro ao excluir kit')
    }
  }

  const handleToggleAtivo = async (kit: Kit) => {
    try {
      await updateKit.mutateAsync({
        id: kit.id,
        data: { ativo: !kit.ativo },
      })
    } catch (error) {
      console.error('Erro ao atualizar kit:', error)
    }
  }

  return (
    <div className="p-4 lg:p-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h1 className="text-2xl lg:text-3xl font-bold">Gerenciar Kits</h1>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 w-full sm:w-auto">
          <label className="flex items-center gap-2 text-sm">
            <Switch
              checked={showInactive}
              onCheckedChange={setShowInactive}
            />
            Mostrar inativos
          </label>
          <Button onClick={handleOpenNew} className="w-full sm:w-auto">
            <Plus className="h-4 w-4 mr-2" />
            Novo Kit
          </Button>
        </div>
      </div>

      {/* Lista de Kits */}
      {isLoading ? (
        <div className="text-center py-8">Carregando...</div>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden md:block bg-white rounded-lg shadow overflow-hidden">
            <table className="w-full">
              <thead className="bg-slate-50 border-b">
                <tr>
                  <th className="text-left p-4 font-semibold">Kit</th>
                  <th className="text-center p-4 font-semibold">Mesas</th>
                  <th className="text-center p-4 font-semibold">Cadeiras</th>
                  <th className="text-right p-4 font-semibold">Valor</th>
                  <th className="text-center p-4 font-semibold">Status</th>
                  <th className="text-right p-4 font-semibold">Ações</th>
                </tr>
              </thead>
              <tbody>
                {kits?.map((kit) => (
                  <tr key={kit.id} className="border-b hover:bg-slate-50">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="bg-slate-100 p-2 rounded-lg">
                          <Package className="h-5 w-5 text-slate-600" />
                        </div>
                        <span className="font-medium">{kit.descricao}</span>
                      </div>
                    </td>
                    <td className="p-4 text-center">{kit.mesas}</td>
                    <td className="p-4 text-center">{kit.cadeiras}</td>
                    <td className="p-4 text-right font-semibold">
                      R$ {Number(kit.valor).toFixed(2)}
                    </td>
                    <td className="p-4 text-center">
                      <button
                        onClick={() => handleToggleAtivo(kit)}
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          kit.ativo
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {kit.ativo ? 'Ativo' : 'Inativo'}
                      </button>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenEdit(kit)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(kit)}
                          className={kit.ativo ? "text-red-600 hover:text-red-700 hover:bg-red-50" : "text-green-600 hover:text-green-700 hover:bg-green-50"}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {(!kits || kits.length === 0) && (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-500">
                      Nenhum kit encontrado
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden space-y-3">
            {kits?.map((kit) => (
              <div key={kit.id} className="bg-white rounded-lg shadow p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="bg-slate-100 p-2 rounded-lg">
                      <Package className="h-5 w-5 text-slate-600" />
                    </div>
                    <div>
                      <span className="font-medium">{kit.descricao}</span>
                      <div className="text-sm text-slate-500">
                        {kit.mesas} mesa(s) + {kit.cadeiras} cadeira(s)
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleToggleAtivo(kit)}
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      kit.ativo
                        ? 'bg-green-100 text-green-700'
                        : 'bg-red-100 text-red-700'
                    }`}
                  >
                    {kit.ativo ? 'Ativo' : 'Inativo'}
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-lg">
                    R$ {Number(kit.valor).toFixed(2)}
                  </span>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenEdit(kit)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(kit)}
                      className={kit.ativo ? "text-red-600 hover:text-red-700 hover:bg-red-50" : "text-green-600 hover:text-green-700 hover:bg-green-50"}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
            {(!kits || kits.length === 0) && (
              <div className="bg-white rounded-lg shadow p-8 text-center text-slate-500">
                Nenhum kit encontrado
              </div>
            )}
          </div>
        </>
      )}

      {/* Modal de formulário */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingKit ? 'Editar Kit' : 'Novo Kit'}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Aviso ao editar preço */}
            {editingKit && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                <strong>Atenção:</strong> Alterar o valor afeta apenas novos pedidos. Pedidos existentes mantêm o valor original.
              </div>
            )}

            {/* Erro inline */}
            {formError && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {formError}
              </div>
            )}

            <div>
              <Label htmlFor="descricao">Descrição</Label>
              <Input
                id="descricao"
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                placeholder="Ex: Kit Básico (1 mesa + 4 cadeiras)"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="mesas">Mesas</Label>
                <Input
                  id="mesas"
                  type="number"
                  min="0"
                  placeholder="Ex: 1"
                  value={mesas}
                  onChange={(e) => setMesas(e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="cadeiras">Cadeiras</Label>
                <Input
                  id="cadeiras"
                  type="number"
                  min="0"
                  placeholder="Ex: 4"
                  value={cadeiras}
                  onChange={(e) => setCadeiras(e.target.value)}
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="valor">Valor (R$)</Label>
              <Input
                id="valor"
                type="number"
                min="0"
                step="0.01"
                placeholder="Ex: 15.00"
                value={valor}
                onChange={(e) => setValor(e.target.value)}
                required
              />
            </div>

            <div className="flex items-center gap-2">
              <Switch
                id="ativo"
                checked={ativo}
                onCheckedChange={setAtivo}
              />
              <Label htmlFor="ativo">Kit ativo</Label>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={handleClose}>
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={createKit.isPending || updateKit.isPending}
              >
                {createKit.isPending || updateKit.isPending
                  ? 'Salvando...'
                  : 'Salvar'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
