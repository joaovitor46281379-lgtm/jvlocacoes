import { useState } from 'react'
import {
  useClientes,
  useCreateClienteManual,
  useUpdateCliente,
  useDeleteCliente,
} from '@shared/hooks/use-clientes'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Plus, Edit, Trash2, Users, Search } from 'lucide-react'

interface ClienteFormData {
  nome: string
  whatsapp: string
  cpf: string
}

const formVazio: ClienteFormData = { nome: '', whatsapp: '', cpf: '' }

export function ClientesPage() {
  const { data: clientes, isLoading } = useClientes()
  const createCliente = useCreateClienteManual()
  const updateCliente = useUpdateCliente()
  const deleteCliente = useDeleteCliente()

  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState<ClienteFormData>(formVazio)
  const [erro, setErro] = useState('')
  const [deleteErro, setDeleteErro] = useState('')
  const [busca, setBusca] = useState('')

  const clientesFiltrados = (clientes || []).filter((c: any) => {
    if (!busca) return true
    const q = busca.toLowerCase()
    return (
      c.nome?.toLowerCase().includes(q) ||
      c.whatsapp?.includes(q) ||
      c.cpf?.includes(q)
    )
  })

  const handleNovo = () => {
    setEditId(null)
    setForm(formVazio)
    setErro('')
    setIsFormOpen(true)
  }

  const handleEditar = (cliente: any) => {
    setEditId(cliente.id)
    setForm({ nome: cliente.nome, whatsapp: cliente.whatsapp, cpf: cliente.cpf || '' })
    setErro('')
    setIsFormOpen(true)
  }

  const handleFechar = () => {
    setIsFormOpen(false)
    setEditId(null)
    setForm(formVazio)
    setErro('')
  }

  const handleSalvar = async () => {
    setErro('')
    if (!form.nome.trim()) { setErro('Nome é obrigatório.'); return }
    if (!form.whatsapp.trim()) { setErro('WhatsApp é obrigatório.'); return }

    try {
      if (editId) {
        await updateCliente.mutateAsync({ id: editId, ...form })
      } else {
        await createCliente.mutateAsync(form)
      }
      handleFechar()
    } catch (e: any) {
      setErro(e?.message || 'Erro ao salvar cliente.')
    }
  }

  const handleDeletar = async (id: string, nome: string) => {
    setDeleteErro('')
    if (!confirm(`Excluir cliente "${nome}"? Esta ação não pode ser desfeita.`)) return
    try {
      await deleteCliente.mutateAsync(id)
    } catch (e: any) {
      setDeleteErro(e?.message || 'Erro ao excluir cliente.')
    }
  }

  const salvando = createCliente.isPending || updateCliente.isPending

  return (
    <div className="p-4 lg:p-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h1 className="text-2xl lg:text-3xl font-bold">Clientes</h1>
        <Button onClick={handleNovo} className="w-full sm:w-auto">
          <Plus className="h-4 w-4 mr-2" />
          Novo Cliente
        </Button>
      </div>

      {/* Barra de busca */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <input
          type="text"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar por nome, WhatsApp ou CPF..."
          className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
        />
      </div>

      {deleteErro && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {deleteErro}
        </div>
      )}

      {isLoading ? (
        <div className="text-center py-12 text-slate-500">Carregando clientes...</div>
      ) : clientesFiltrados.length === 0 ? (
        <div className="text-center py-12 text-slate-400">
          <Users className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p>{busca ? 'Nenhum cliente encontrado para essa busca.' : 'Nenhum cliente cadastrado ainda.'}</p>
        </div>
      ) : (
        <>
          {/* Tabela desktop */}
          <div className="hidden md:block overflow-x-auto border rounded-lg bg-white">
            <table className="w-full">
              <thead className="bg-slate-50">
                <tr>
                  <th className="p-3 text-left font-medium text-sm">Nome</th>
                  <th className="p-3 text-left font-medium text-sm">WhatsApp</th>
                  <th className="p-3 text-left font-medium text-sm">CPF</th>
                  <th className="p-3 text-left font-medium text-sm">Pedidos</th>
                  <th className="p-3 text-right font-medium text-sm">Ações</th>
                </tr>
              </thead>
              <tbody>
                {clientesFiltrados.map((cliente: any) => (
                  <tr key={cliente.id} className="border-t hover:bg-slate-50">
                    <td className="p-3 font-medium">{cliente.nome}</td>
                    <td className="p-3 text-slate-600">{cliente.whatsapp}</td>
                    <td className="p-3 text-slate-600">{cliente.cpf || <span className="text-slate-300">—</span>}</td>
                    <td className="p-3">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
                        {cliente.totalPedidos} pedido{cliente.totalPedidos !== 1 ? 's' : ''}
                      </span>
                    </td>
                    <td className="p-3 text-right space-x-2">
                      <Button size="sm" variant="outline" onClick={() => handleEditar(cliente)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDeletar(cliente.id, cliente.nome)}
                        disabled={cliente.totalPedidos > 0}
                        title={cliente.totalPedidos > 0 ? 'Cliente com pedidos não pode ser excluído' : 'Excluir'}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Cards mobile */}
          <div className="md:hidden space-y-3">
            {clientesFiltrados.map((cliente: any) => (
              <div key={cliente.id} className="bg-white border rounded-lg p-4 shadow-sm">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-semibold">{cliente.nome}</h3>
                    <p className="text-sm text-slate-500">{cliente.whatsapp}</p>
                    {cliente.cpf && <p className="text-sm text-slate-500">CPF: {cliente.cpf}</p>}
                  </div>
                  <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-full">
                    {cliente.totalPedidos} pedido{cliente.totalPedidos !== 1 ? 's' : ''}
                  </span>
                </div>
                <div className="flex gap-2 mt-3">
                  <Button size="sm" variant="outline" className="flex-1" onClick={() => handleEditar(cliente)}>
                    <Edit className="h-4 w-4 mr-1" /> Editar
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleDeletar(cliente.id, cliente.nome)}
                    disabled={cliente.totalPedidos > 0}
                    title={cliente.totalPedidos > 0 ? 'Cliente com pedidos não pode ser excluído' : 'Excluir'}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Modal de formulário */}
      <Dialog open={isFormOpen} onOpenChange={(v) => { if (!v) handleFechar() }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editId ? 'Editar Cliente' : 'Novo Cliente'}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 mt-2">
            <div>
              <label className="block text-sm font-medium mb-1">Nome <span className="text-red-500">*</span></label>
              <input
                type="text"
                value={form.nome}
                onChange={(e) => setForm({ ...form, nome: e.target.value })}
                placeholder="Nome completo"
                className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">WhatsApp <span className="text-red-500">*</span></label>
              <input
                type="text"
                value={form.whatsapp}
                onChange={(e) => setForm({ ...form, whatsapp: e.target.value })}
                placeholder="(41) 99999-9999"
                className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">CPF <span className="text-slate-400 font-normal">(opcional)</span></label>
              <input
                type="text"
                value={form.cpf}
                onChange={(e) => setForm({ ...form, cpf: e.target.value })}
                placeholder="000.000.000-00"
                className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
              />
            </div>

            {erro && (
              <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">
                {erro}
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <Button variant="outline" className="flex-1" onClick={handleFechar} disabled={salvando}>
                Cancelar
              </Button>
              <Button className="flex-1" onClick={handleSalvar} disabled={salvando}>
                {salvando ? 'Salvando...' : editId ? 'Salvar Alterações' : 'Cadastrar'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
