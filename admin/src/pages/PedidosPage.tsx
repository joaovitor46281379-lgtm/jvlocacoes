import { useState, useEffect, useRef } from 'react'
import { usePedidos, useUpdatePedido, useConfirmarPedido, useDeletePedido, useUltimoPedidoDoCliente } from '@shared/hooks/use-pedidos'
import { useClientes, useGarantirCliente } from '@shared/hooks/use-clientes'
import { useUpdatePagamento } from '@shared/hooks/use-pagamentos'
import { useKits } from '@shared/hooks/use-kits'
import { useVilas } from '@shared/hooks/use-vilas'
import { useConfiguracoes } from '@shared/hooks/use-configuracoes'
import { usePerfis } from '@shared/hooks/use-perfil'
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
import {
  formatarData,
  formatarValor,
  dataInputParaDate,
  dateParaDataInput,
  telefonesIguais,
  normalizarTelefone,
} from '@shared/lib/validations'
import { ChevronDown, ChevronUp, Package, Plus, Trash2, Star, Pencil } from 'lucide-react'
import type { StatusPedido, FormaPagamento, StatusPagamento } from '@shared/types'

const pagamentoColors: Record<StatusPagamento, string> = {
  PENDENTE: 'bg-yellow-100 text-yellow-700',
  PAGO: 'bg-green-100 text-green-700',
  CANCELADO: 'bg-red-100 text-red-700',
  EXPIRADO: 'bg-gray-100 text-gray-600',
}

const pagamentoLabels: Record<StatusPagamento, string> = {
  PENDENTE: 'Pendente',
  PAGO: 'Pago',
  CANCELADO: 'Cancelado',
  EXPIRADO: 'Expirado',
}

const allPagamentoStatuses: StatusPagamento[] = ['PENDENTE', 'PAGO', 'CANCELADO', 'EXPIRADO']

const statusColors: Record<StatusPedido, string> = {
  PENDENTE: 'bg-yellow-100 text-yellow-700',
  AGUARDANDO_ENTREGA: 'bg-blue-100 text-blue-700',
  AGUARDANDO_RETIRADA: 'bg-purple-100 text-purple-700',
  CONCLUIDO: 'bg-green-100 text-green-700',
  CANCELADO: 'bg-red-100 text-red-700',
}

const statusLabels: Record<StatusPedido, string> = {
  PENDENTE: 'Pendente',
  AGUARDANDO_ENTREGA: 'Aguardando Entrega',
  AGUARDANDO_RETIRADA: 'Aguardando Retirada',
  CONCLUIDO: 'Concluído',
  CANCELADO: 'Cancelado',
}

const allStatuses: StatusPedido[] = [
  'PENDENTE',
  'AGUARDANDO_ENTREGA',
  'AGUARDANDO_RETIRADA',
  'CONCLUIDO',
  'CANCELADO',
]

const MESES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
]

const anoAtual = new Date().getFullYear()
const ANOS = Array.from({ length: 5 }, (_, i) => anoAtual - 2 + i) // 2 atrás até 2 à frente

export function PedidosPage() {
  const [filterStatus, setFilterStatus] = useState<StatusPedido | 'TODOS'>('TODOS')
  const [filterMes, setFilterMes] = useState<number>(new Date().getMonth()) // 0-indexed
  const [filterAno, setFilterAno] = useState<number>(anoAtual)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [page, setPage] = useState(1)

  // Modal novo pedido
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [selectedUserId, setSelectedUserId] = useState('')
  const [nomeSolicitante, setNomeSolicitante] = useState('')
  const [whatsapp, setWhatsapp] = useState('')
  const [endereco, setEndereco] = useState('')
  const [vilaId, setVilaId] = useState('')
  const [quantidade, setQuantidade] = useState('3')
  const [mesasAvulsasForm, setMesasAvulsasForm] = useState('0')
  const [cadeirasAvulsasForm, setCadeirasAvulsasForm] = useState('0')
  const [dataInicio, setDataInicio] = useState('')
  const [dataFim, setDataFim] = useState('')
  const [formaPagamento, setFormaPagamento] = useState<FormaPagamento>('PIX')
  const [observacoes, setObservacoes] = useState('')
  const [totalManual, setTotalManual] = useState('')

  // Modal editar pedido
  const [editingPedido, setEditingPedido] = useState<any | null>(null)
  const [editNome, setEditNome] = useState('')
  const [editWhatsapp, setEditWhatsapp] = useState('')
  const [editEndereco, setEditEndereco] = useState('')
  const [editVilaId, setEditVilaId] = useState('')
  const [editQuantidade, setEditQuantidade] = useState('')
  const [editMesasAvulsas, setEditMesasAvulsas] = useState('0')
  const [editCadeirasAvulsas, setEditCadeirasAvulsas] = useState('0')
  const [editFormaPagamento, setEditFormaPagamento] = useState<FormaPagamento>('PIX')
  const [editObservacoes, setEditObservacoes] = useState('')
  const [editTotal, setEditTotal] = useState('')
  const [editKitId, setEditKitId] = useState('')
  const [editStatus, setEditStatus] = useState<StatusPedido>('PENDENTE')
  const [editDataInicio, setEditDataInicio] = useState('')
  const [editDataFim, setEditDataFim] = useState('')
  const [editValorKit, setEditValorKit] = useState('0')
  const [editValorFrete, setEditValorFrete] = useState('0')
  const [editValorAvulsos, setEditValorAvulsos] = useState('0')

  const inicioMesFiltro = new Date(filterAno, filterMes, 1)
  const fimMesFiltro = new Date(filterAno, filterMes + 1, 0, 23, 59, 59, 999)

  const { data: pedidosData, isLoading } = usePedidos(
    {
      ...(filterStatus !== 'TODOS' ? { status: [filterStatus] } : {}),
      dataInicio: inicioMesFiltro,
      dataFim: fimMesFiltro,
    },
    { page, limit: 20 }
  )
  const { data: kits } = useKits(true)
  const { data: vilas } = useVilas(true)
  const { data: config } = useConfiguracoes()
  const { data: perfis } = usePerfis()
  const perfisArray = Array.isArray(perfis) ? perfis : []
  const { data: clientes } = useClientes()
  const clientesArray: any[] = Array.isArray(clientes) ? clientes : []
  const updatePedido = useUpdatePedido()
  const confirmarPedido = useConfirmarPedido()
  const garantirCliente = useGarantirCliente()
  const updatePagamento = useUpdatePagamento()
  const deletePedidoMutation = useDeletePedido()

  // Cliente já cadastrado com o telefone digitado no novo pedido (ignora formatação)
  const telefoneDigitado = normalizarTelefone(whatsapp)
  const clienteEncontrado: any | undefined =
    isFormOpen && telefoneDigitado.length >= 8
      ? clientesArray.find((c) => telefonesIguais(c.whatsapp, whatsapp))
      : undefined
  const telefoneCompleto = whatsapp.replace(/\D/g, '').length >= 10
  const { data: ultimoPedidoCliente } = useUltimoPedidoDoCliente(
    clienteEncontrado ? { userId: clienteEncontrado.userId, whatsapp } : null
  )

  const pedidos = pedidosData?.data || []
  const totalPages = pedidosData?.totalPages || 1
  const kitsArray = Array.isArray(kits) ? kits : []
  const vilasArray = Array.isArray(vilas) ? vilas : []
  const kitsParaEdicao: any[] =
    editingPedido?.kit && !kitsArray.some((k: any) => k.id === editingPedido.kit.id)
      ? [...kitsArray, editingPedido.kit]
      : kitsArray

  // Cálculos para novo pedido
  const kitFixo = kitsArray[0] ?? null
  const selectedVila = vilasArray.find(v => v.id === vilaId)
  const vilaFrete = selectedVila ? ((selectedVila as any).valor_frete ?? selectedVila.valorFrete ?? 0) : 0
  const quantidadeNum = Number(quantidade) || 0
  const mesasAvulsasNum = Number(mesasAvulsasForm) || 0
  const cadeirasAvulsasNum = Number(cadeirasAvulsasForm) || 0
  const precoKit = Number(config?.preco_kit ?? 0)
  const valorKit = precoKit * quantidadeNum
  const valorAvulsos = mesasAvulsasNum * Number(config?.preco_mesa_avulsa ?? 0) + cadeirasAvulsasNum * Number(config?.preco_cadeira_avulsa ?? 0)
  const valorTotalCalculado = valorKit + Number(vilaFrete) + valorAvulsos
  const valorTotal = totalManual !== '' ? Number(totalManual) : valorTotalCalculado

  const formatWhatsApp = (value: string) => {
    const numbers = value.replace(/\D/g, '')
    if (numbers.length <= 11) {
      return numbers
        .replace(/(\d{2})(\d)/, '($1) $2')
        .replace(/(\d{4,5})(\d{4})$/, '$1-$2')
    }
    return value
  }

  const minKits = config?.qtd_minima_pedido ?? 3

  // Sincronizar quantidade mínima quando config carregar e form estiver aberto
  useEffect(() => {
    if (isFormOpen && config?.qtd_minima_pedido) {
      setQuantidade((prev) => {
        const n = Number(prev)
        return n < config.qtd_minima_pedido ? String(config.qtd_minima_pedido) : prev
      })
    }
  }, [config?.qtd_minima_pedido, isFormOpen])

  // Ao reconhecer um cliente pelo telefone, preenche o nome (uma vez por cliente reconhecido).
  const clienteAplicadoRef = useRef<string | null>(null)
  const ultimoPedidoAplicadoRef = useRef<string | null>(null)

  useEffect(() => {
    if (!clienteEncontrado) {
      clienteAplicadoRef.current = null
      ultimoPedidoAplicadoRef.current = null
      return
    }
    if (clienteAplicadoRef.current === clienteEncontrado.id) return
    clienteAplicadoRef.current = clienteEncontrado.id
    ultimoPedidoAplicadoRef.current = null
    setNomeSolicitante(clienteEncontrado.nome || '')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clienteEncontrado?.id])

  // Com o último pedido do cliente em mãos, completa endereço e vila, sem sobrescrever o que já foi digitado.
  useEffect(() => {
    if (!clienteEncontrado || !ultimoPedidoCliente || vilasArray.length === 0) return
    if (ultimoPedidoAplicadoRef.current === clienteEncontrado.id) return
    ultimoPedidoAplicadoRef.current = clienteEncontrado.id
    setEndereco((atual) => atual || ultimoPedidoCliente.endereco || '')
    if (vilasArray.some((v) => v.id === ultimoPedidoCliente.vila_id)) {
      setVilaId((atual) => atual || ultimoPedidoCliente.vila_id)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clienteEncontrado?.id, ultimoPedidoCliente, vilasArray.length])

  const resetForm = () => {
    setSelectedUserId(''); setNomeSolicitante(''); setWhatsapp(''); setEndereco('')
    setVilaId(''); setQuantidade(String(minKits))
    setMesasAvulsasForm('0'); setCadeirasAvulsasForm('0')
    setDataInicio(''); setDataFim('')
    setFormaPagamento('PIX'); setObservacoes(''); setTotalManual('')
  }

  const handleCloseForm = () => { setIsFormOpen(false); resetForm() }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!nomeSolicitante || !whatsapp || !endereco || !vilaId || !dataInicio || !dataFim) {
      alert('Preencha todos os campos obrigatórios')
      return
    }
    if (!kitFixo) {
      alert('Nenhum kit cadastrado no sistema. Adicione um kit antes de criar pedidos.')
      return
    }
    if (quantidadeNum < minKits) {
      alert(`Quantidade mínima é ${minKits} kits`)
      return
    }
    try {
      // Procura o cliente pelo telefone; se não existir, cadastra na aba Clientes.
      // Um erro aqui não impede o pedido de ser criado.
      let userId = selectedUserId || 'admin-created'
      let clienteCriado = false
      let avisoCliente = ''
      try {
        const resultado = await garantirCliente.mutateAsync({
          nome: nomeSolicitante,
          whatsapp,
          userId: selectedUserId || undefined,
        })
        clienteCriado = resultado.criado
        if (!selectedUserId) userId = resultado.cliente.user_id
      } catch (err) {
        console.error('Erro ao cadastrar cliente automaticamente:', err)
        const motivo = err instanceof Error ? err.message : String(err)
        avisoCliente = `\n\nAtenção: não foi possível cadastrar o cliente automaticamente na aba Clientes.\nMotivo: ${motivo}`
      }

      await confirmarPedido.mutateAsync({
        nomeSolicitante, whatsapp, endereco, vilaId, kitId: kitFixo.id,
        quantidade: quantidadeNum,
        mesasAvulsas: mesasAvulsasNum,
        cadeirasAvulsas: cadeirasAvulsasNum,
        valorAvulsos,
        dataInicio: dataInputParaDate(dataInicio),
        dataFim: dataInputParaDate(dataFim),
        formaPagamento,
        observacoes: observacoes || undefined,
        userId,
        valorKit,
        valorFrete: Number(vilaFrete),
        total: valorTotal,
      })

      // Mostra na lista o mês do pedido recém-criado
      const [anoNovo, mesNovo] = dataInicio.split('-').map(Number)
      setFilterAno(anoNovo)
      setFilterMes(mesNovo - 1)
      setFilterStatus('TODOS')
      setPage(1)

      handleCloseForm()
      alert(
        'Pedido criado com sucesso!' +
          (clienteCriado ? '\nCliente cadastrado automaticamente na aba Clientes.' : '') +
          avisoCliente
      )
    } catch (error: any) {
      alert(error?.message || 'Erro ao criar pedido')
    }
  }

  const handleOpenEdit = (pedido: any) => {
    setEditingPedido(pedido)
    setEditNome(pedido.nome_solicitante || '')
    setEditWhatsapp(pedido.whatsapp || '')
    setEditEndereco(pedido.endereco || '')
    setEditVilaId(pedido.vila_id || '')
    setEditQuantidade(String(pedido.quantidade || ''))
    setEditMesasAvulsas(String(pedido.mesas_avulsas ?? 0))
    setEditCadeirasAvulsas(String(pedido.cadeiras_avulsas ?? 0))
    setEditFormaPagamento(pedido.forma_pagamento || 'PIX')
    setEditObservacoes(pedido.observacoes || '')
    setEditTotal(String(pedido.total ?? ''))
    setEditKitId(pedido.kit_id || '')
    setEditStatus(pedido.status || 'PENDENTE')
    setEditDataInicio(dateParaDataInput(pedido.data_inicio))
    setEditDataFim(dateParaDataInput(pedido.data_fim))
    setEditValorKit(String(pedido.valor_kit ?? 0))
    setEditValorFrete(String(pedido.valor_frete ?? 0))
    setEditValorAvulsos(String(pedido.valor_avulsos ?? 0))
  }

  const handleCloseEdit = () => { setEditingPedido(null) }

  // ── Recálculo de valores na edição ──────────────────────────────────────────
  // Mexer em quantidade, vila ou avulsos recalcula kit/frete/avulsos e o total.
  // Cada valor continua editável à mão depois; o total só é refeito quando algo muda.
  const arredondar = (n: number) => Math.round(n * 100) / 100

  const aplicarValoresEdicao = (kit: number, frete: number, avulsos: number) => {
    setEditValorKit(String(arredondar(kit)))
    setEditValorFrete(String(arredondar(frete)))
    setEditValorAvulsos(String(arredondar(avulsos)))
    setEditTotal(String(arredondar(kit + frete + avulsos)))
  }

  // Preço de cada kit neste pedido (mantém o preço da época em que foi lançado)
  const precoUnitarioKitEdicao = () => {
    const qtdOriginal = Number(editingPedido?.quantidade) || 0
    const valorOriginal = Number(editingPedido?.valor_kit) || 0
    return qtdOriginal > 0 && valorOriginal > 0 ? valorOriginal / qtdOriginal : Number(config?.preco_kit ?? 0)
  }

  const handleEditQuantidade = (valor: string) => {
    setEditQuantidade(valor)
    const qtd = Number(valor)
    if (valor === '' || isNaN(qtd) || qtd < 0) return
    aplicarValoresEdicao(precoUnitarioKitEdicao() * qtd, Number(editValorFrete) || 0, Number(editValorAvulsos) || 0)
  }

  const handleEditVila = (id: string) => {
    setEditVilaId(id)
    const vila: any = vilasArray.find((v) => v.id === id)
    const frete = Number(vila?.valor_frete ?? vila?.valorFrete ?? 0)
    aplicarValoresEdicao(Number(editValorKit) || 0, frete, Number(editValorAvulsos) || 0)
  }

  const handleEditAvulsos = (mesas: string, cadeiras: string) => {
    setEditMesasAvulsas(mesas)
    setEditCadeirasAvulsas(cadeiras)
    const valor =
      (Number(mesas) || 0) * Number(config?.preco_mesa_avulsa ?? 0) +
      (Number(cadeiras) || 0) * Number(config?.preco_cadeira_avulsa ?? 0)
    aplicarValoresEdicao(Number(editValorKit) || 0, Number(editValorFrete) || 0, valor)
  }

  const handleEditComponente = (campo: 'kit' | 'frete' | 'avulsos', valor: string) => {
    const kit = campo === 'kit' ? valor : editValorKit
    const frete = campo === 'frete' ? valor : editValorFrete
    const avulsos = campo === 'avulsos' ? valor : editValorAvulsos
    if (campo === 'kit') setEditValorKit(valor)
    if (campo === 'frete') setEditValorFrete(valor)
    if (campo === 'avulsos') setEditValorAvulsos(valor)
    setEditTotal(String(arredondar((Number(kit) || 0) + (Number(frete) || 0) + (Number(avulsos) || 0))))
  }

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingPedido) return

    if (editDataInicio && editDataFim && editDataFim < editDataInicio) {
      alert('A data de devolução não pode ser anterior à data de entrega.')
      return
    }

    const dados: Record<string, any> = {
      nome_solicitante: editNome,
      whatsapp: editWhatsapp,
      endereco: editEndereco,
      vila_id: editVilaId,
      quantidade: Number(editQuantidade),
      mesas_avulsas: Number(editMesasAvulsas) || 0,
      cadeiras_avulsas: Number(editCadeirasAvulsas) || 0,
      forma_pagamento: editFormaPagamento,
      observacoes: editObservacoes || null,
      status: editStatus,
      valor_kit: Number(editValorKit) || 0,
      valor_frete: Number(editValorFrete) || 0,
      valor_avulsos: Number(editValorAvulsos) || 0,
      total: Number(editTotal) || 0,
      updated_at: new Date().toISOString(),
    }
    if (editKitId) dados.kit_id = editKitId

    // As datas só são enviadas se foram alteradas, para não mexer nas que já estão salvas
    const dataInicioMudou = editDataInicio && editDataInicio !== dateParaDataInput(editingPedido.data_inicio)
    const dataFimMudou = editDataFim && editDataFim !== dateParaDataInput(editingPedido.data_fim)
    if (dataInicioMudou) dados.data_inicio = dataInputParaDate(editDataInicio).toISOString()
    if (dataFimMudou) dados.data_fim = dataInputParaDate(editDataFim).toISOString()

    try {
      await updatePedido.mutateAsync({ id: editingPedido.id, data: dados as any })

      // Se a entrega mudou de mês, mostra o mês novo para o pedido não "sumir" da lista
      if (dataInicioMudou) {
        const [ano, mes] = editDataInicio.split('-').map(Number)
        setFilterAno(ano)
        setFilterMes(mes - 1)
        setPage(1)
      }
      handleCloseEdit()
    } catch (error: any) {
      alert(error?.message || 'Erro ao editar pedido')
    }
  }

  const handleStatusChange = async (pedidoId: string, newStatus: StatusPedido) => {
    try {
      await updatePedido.mutateAsync({ id: pedidoId, data: { status: newStatus } as any })
    } catch {
      alert('Erro ao atualizar status do pedido')
    }
  }

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id)
  }

  const handleDeletePedido = async (pedidoId: string) => {
    if (!confirm('ATENÇÃO: Esta ação é irreversível. Deseja excluir permanentemente este pedido?')) return
    try {
      await deletePedidoMutation.mutateAsync(pedidoId)
      setExpandedId(null)
    } catch {
      alert('Erro ao excluir pedido')
    }
  }

  return (
    <div className="p-4 lg:p-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h1 className="text-2xl lg:text-3xl font-bold">Gerenciar Pedidos</h1>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-4 w-full sm:w-auto">
          <Select
            value={String(filterMes)}
            onValueChange={(value: string) => { setFilterMes(Number(value)); setPage(1) }}
          >
            <SelectTrigger className="w-full sm:w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MESES.map((nome, idx) => (
                <SelectItem key={idx} value={String(idx)}>{nome}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={String(filterAno)}
            onValueChange={(value: string) => { setFilterAno(Number(value)); setPage(1) }}
          >
            <SelectTrigger className="w-full sm:w-24">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ANOS.map((ano) => (
                <SelectItem key={ano} value={String(ano)}>{ano}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={filterStatus}
            onValueChange={(value: string) => { setFilterStatus(value as StatusPedido | 'TODOS'); setPage(1) }}
          >
            <SelectTrigger className="w-full sm:w-44">
              <SelectValue placeholder="Filtrar por status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="TODOS">Todos os status</SelectItem>
              {allStatuses.map((status) => (
                <SelectItem key={status} value={status}>{statusLabels[status]}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button onClick={() => setIsFormOpen(true)} className="w-full sm:w-auto">
            <Plus className="h-4 w-4 mr-2" />
            Novo Pedido
          </Button>
        </div>
      </div>

      {/* Lista de Pedidos */}
      {isLoading ? (
        <div className="text-center py-8">Carregando...</div>
      ) : (
        <div className="space-y-4">
          {pedidos.map((pedido: any) => (
            <div key={pedido.id} className="bg-white rounded-lg shadow overflow-hidden">
              {/* Header */}
              <div className="p-3 lg:p-4 cursor-pointer hover:bg-slate-50" onClick={() => toggleExpand(pedido.id)}>
                {/* Desktop */}
                <div className="hidden sm:flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="bg-slate-100 p-2 rounded-lg">
                      <Package className="h-5 w-5 text-slate-600" />
                    </div>
                    <div>
                      <div className="font-semibold">
                        #{pedido.id.substring(0, 8)} - {pedido.nome_solicitante}
                      </div>
                      <div className="text-sm text-slate-500">
                        {formatarData(new Date(pedido.data_inicio))} até {formatarData(new Date(pedido.data_fim))}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="font-bold text-lg">{formatarValor(pedido.total)}</div>
                      <div className="text-sm text-slate-500">{pedido.quantidade} kits</div>
                    </div>

                    <Select
                      value={pedido.status}
                      onValueChange={(value: string) => handleStatusChange(pedido.id, value as StatusPedido)}
                    >
                      <SelectTrigger
                        className={`w-48 justify-center ${statusColors[pedido.status as StatusPedido]}`}
                        onClick={(e: React.MouseEvent) => e.stopPropagation()}
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {allStatuses.map((status) => (
                          <SelectItem key={status} value={status}>{statusLabels[status]}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    {expandedId === pedido.id ? <ChevronUp className="h-5 w-5 text-slate-400" /> : <ChevronDown className="h-5 w-5 text-slate-400" />}
                  </div>
                </div>

                {/* Mobile */}
                <div className="sm:hidden space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <div className="bg-slate-100 p-1.5 rounded-lg">
                        <Package className="h-4 w-4 text-slate-600" />
                      </div>
                      <div>
                        <div className="font-semibold text-sm">#{pedido.id.substring(0, 8)}</div>
                        <div className="text-sm">{pedido.nome_solicitante}</div>
                      </div>
                    </div>
                    {expandedId === pedido.id ? <ChevronUp className="h-5 w-5 text-slate-400" /> : <ChevronDown className="h-5 w-5 text-slate-400" />}
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <div className="text-slate-500">
                      {formatarData(new Date(pedido.data_inicio))} - {formatarData(new Date(pedido.data_fim))}
                    </div>
                    <div className="font-bold">{formatarValor(pedido.total)}</div>
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-500">{pedido.quantidade} kits</span>
                    </div>
                    <Select
                      value={pedido.status}
                      onValueChange={(value: string) => handleStatusChange(pedido.id, value as StatusPedido)}
                    >
                      <SelectTrigger
                        className={`w-44 h-8 text-xs justify-center ${statusColors[pedido.status as StatusPedido]}`}
                        onClick={(e: React.MouseEvent) => e.stopPropagation()}
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {allStatuses.map((status) => (
                          <SelectItem key={status} value={status}>{statusLabels[status]}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Detalhes expandidos */}
              {expandedId === pedido.id && (
                <div className="p-3 lg:p-4 border-t bg-slate-50">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-4 text-sm">
                    <div>
                      <span className="text-slate-500">WhatsApp:</span>
                      <div className="font-medium">{pedido.whatsapp}</div>
                    </div>
                    <div>
                      <span className="text-slate-500">Endereço:</span>
                      <div className="font-medium">{pedido.endereco}</div>
                    </div>
                    <div>
                      <span className="text-slate-500">Vila/Região:</span>
                      <div className="font-medium">{pedido.vila?.nome || 'N/A'}</div>
                    </div>
                    <div>
                      <span className="text-slate-500">Kit:</span>
                      <div className="font-medium">{pedido.kit?.descricao || 'N/A'}</div>
                    </div>
                    <div>
                      <span className="text-slate-500">Qtd kits:</span>
                      <div className="font-medium">{pedido.quantidade}</div>
                    </div>
                    {(pedido.mesas_avulsas > 0 || pedido.cadeiras_avulsas > 0) && (
                      <div>
                        <span className="text-slate-500">Avulsos:</span>
                        <div className="font-medium">
                          {pedido.mesas_avulsas > 0 && <span>{pedido.mesas_avulsas} mesa{pedido.mesas_avulsas !== 1 ? 's' : ''}</span>}
                          {pedido.mesas_avulsas > 0 && pedido.cadeiras_avulsas > 0 && ' + '}
                          {pedido.cadeiras_avulsas > 0 && <span>{pedido.cadeiras_avulsas} cadeira{pedido.cadeiras_avulsas !== 1 ? 's' : ''}</span>}
                        </div>
                      </div>
                    )}
                    <div>
                      <span className="text-slate-500">Forma de Pagamento:</span>
                      <div className="font-medium">{pedido.forma_pagamento}</div>
                    </div>
                    <div>
                      <span className="text-slate-500">Status do Pagamento:</span>
                      <div className="mt-1">
                        {pedido.pagamentos && pedido.pagamentos.length > 0 ? (
                          <Select
                            value={pedido.pagamentos[0].status}
                            onValueChange={async (value: string) => {
                              try {
                                await updatePagamento.mutateAsync({ id: pedido.pagamentos[0].id, status: value })
                              } catch {
                                alert('Erro ao atualizar status do pagamento')
                              }
                            }}
                          >
                            <SelectTrigger
                              className={`w-40 ${pagamentoColors[pedido.pagamentos[0].status as StatusPagamento]}`}
                              onClick={(e: React.MouseEvent) => e.stopPropagation()}
                            >
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {allPagamentoStatuses.map((status) => (
                                <SelectItem key={status} value={status}>{pagamentoLabels[status]}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <span className="text-slate-400 text-sm">Sem pagamento registrado</span>
                        )}
                      </div>
                    </div>
                    <div>
                      <span className="text-slate-500">Criado em:</span>
                      <div className="font-medium">{formatarData(new Date(pedido.created_at))}</div>
                    </div>
                    {pedido.observacoes && (
                      <div className="col-span-full">
                        <span className="text-slate-500">Observações:</span>
                        <div className="font-medium">{pedido.observacoes}</div>
                      </div>
                    )}
                  </div>

                  {/* Avaliação do cliente */}
                  {pedido.avaliacao && pedido.avaliacao.length > 0 && (
                    <div className="mt-4 pt-4 border-t">
                      <span className="text-slate-500 text-sm font-medium">Avaliação do Cliente:</span>
                      <div className="mt-1 flex items-center gap-2">
                        <div className="flex items-center gap-0.5">
                          {[1, 2, 3, 4, 5].map((n) => (
                            <Star
                              key={n}
                              className={`h-4 w-4 ${n <= pedido.avaliacao[0].estrelas ? 'text-yellow-400 fill-yellow-400' : 'text-slate-300'}`}
                            />
                          ))}
                        </div>
                        <span className="text-sm font-medium">{pedido.avaliacao[0].estrelas}/5</span>
                      </div>
                      {pedido.avaliacao[0].comentario && (
                        <p className="mt-1 text-sm text-slate-600 italic">"{pedido.avaliacao[0].comentario}"</p>
                      )}
                    </div>
                  )}

                  {/* Ações */}
                  <div className="mt-4 pt-4 border-t flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => { e.stopPropagation(); handleOpenEdit(pedido) }}
                    >
                      <Pencil className="h-4 w-4 mr-1" />
                      Editar
                    </Button>
                    <Button
                      size="sm"
                      className="bg-green-600 hover:bg-green-700"
                      onClick={() => {
                        const message = `Olá ${pedido.nome_solicitante}! Tudo bem? Aqui é da JV Locações. Sobre seu pedido #${pedido.id.substring(0, 8)}...`
                        const phone = pedido.whatsapp.replace(/\D/g, '')
                        window.open(`https://wa.me/55${phone}?text=${encodeURIComponent(message)}`, '_blank')
                      }}
                    >
                      Enviar WhatsApp
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDeletePedido(pedido.id)}
                      disabled={deletePedidoMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Excluir permanentemente
                    </Button>
                    {pedido.status === 'AGUARDANDO_ENTREGA' && (
                      <Button
                        size="sm"
                        className="bg-blue-600 hover:bg-blue-700"
                        onClick={() => handleStatusChange(pedido.id, 'AGUARDANDO_RETIRADA')}
                        disabled={updatePedido.isPending}
                      >
                        Entregue
                      </Button>
                    )}
                    {pedido.status === 'AGUARDANDO_RETIRADA' && (
                      <Button
                        size="sm"
                        className="bg-purple-600 hover:bg-purple-700"
                        onClick={() => handleStatusChange(pedido.id, 'CONCLUIDO')}
                        disabled={updatePedido.isPending}
                      >
                        Retirado
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}

          {pedidos.length === 0 && (
            <div className="bg-white rounded-lg shadow p-8 text-center text-slate-500">
              Nenhum pedido encontrado
            </div>
          )}
        </div>
      )}

      {/* Paginação */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          <Button variant="outline" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>Anterior</Button>
          <span className="py-2 px-4">Página {page} de {totalPages}</span>
          <Button variant="outline" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}>Próxima</Button>
        </div>
      )}

      {/* Modal Novo Pedido */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-auto mx-4 sm:mx-auto">
          <DialogHeader>
            <DialogTitle>Criar Novo Pedido</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Selecionar cliente cadastrado */}
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
              <Label className="text-blue-800 font-semibold">Vincular a cliente cadastrado</Label>
              <p className="text-xs text-blue-600 mb-2 mt-0.5">Preenche nome e WhatsApp automaticamente.</p>
              <Select
                value={selectedUserId}
                onValueChange={(v) => {
                  setSelectedUserId(v)
                  const usuario = perfisArray.find((p: any) => p.id === v)
                  if (usuario) {
                    setNomeSolicitante(usuario.nome || usuario.nome_fallback || '')
                    if (usuario.whatsapp) setWhatsapp(usuario.whatsapp)
                  }
                }}
              >
                <SelectTrigger className="bg-white">
                  <SelectValue placeholder={perfisArray.length === 0 ? 'Nenhum usuário cadastrado' : 'Selecionar cliente...'} />
                </SelectTrigger>
                <SelectContent>
                  {perfisArray.map((usuario: any) => (
                    <SelectItem key={usuario.id} value={usuario.id}>
                      <span className="font-medium">{usuario.nome || usuario.nome_fallback || 'Sem nome'}</span>
                      <span className="text-slate-400 ml-2 text-xs">{usuario.email}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label>Nome do Cliente *</Label>
                <Input value={nomeSolicitante} onChange={(e) => setNomeSolicitante(e.target.value)} placeholder="Nome completo" required />
              </div>
              <div>
                <Label>WhatsApp *</Label>
                <Input value={whatsapp} onChange={(e) => setWhatsapp(formatWhatsApp(e.target.value))} placeholder="(41) 99999-9999" required />
                {clienteEncontrado ? (
                  <p className="text-xs text-green-700 mt-1">
                    ✓ Cliente cadastrado: <strong>{clienteEncontrado.nome}</strong>
                  </p>
                ) : telefoneCompleto ? (
                  <p className="text-xs text-blue-700 mt-1">
                    Cliente novo: será cadastrado na aba Clientes ao criar o pedido.
                  </p>
                ) : null}
              </div>
            </div>

            <div>
              <Label>Endereço Completo *</Label>
              <Input value={endereco} onChange={(e) => setEndereco(e.target.value)} placeholder="Rua, número, bairro..." required />
            </div>

            <div>
              <Label>Vila/Região *</Label>
              <Select value={vilaId} onValueChange={setVilaId}>
                <SelectTrigger><SelectValue placeholder="Selecione a vila" /></SelectTrigger>
                <SelectContent>
                  {vilasArray.map((vila) => (
                    <SelectItem key={vila.id} value={vila.id}>{vila.nome} - Frete: {formatarValor(vila.valorFrete)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Quantidade de kits *</Label>
              <Input type="number" min={minKits} placeholder={`Mín: ${minKits}`} value={quantidade} onChange={(e) => setQuantidade(e.target.value)} required />
              <p className="text-xs text-slate-500 mt-1">Mínimo: {minKits} kits · R$ {precoKit.toFixed(2)}/kit</p>
            </div>

            {/* Avulsos */}
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-medium text-slate-700 mb-3">Itens avulsos (opcional)</p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Mesas avulsas</Label>
                  <Input type="number" min="0" value={mesasAvulsasForm} onChange={(e) => setMesasAvulsasForm(e.target.value)} />
                  {config && config.preco_mesa_avulsa > 0 && (
                    <p className="text-xs text-slate-500 mt-1">{formatarValor(config.preco_mesa_avulsa)} cada</p>
                  )}
                </div>
                <div>
                  <Label>Cadeiras avulsas</Label>
                  <Input type="number" min="0" value={cadeirasAvulsasForm} onChange={(e) => setCadeirasAvulsasForm(e.target.value)} />
                  {config && config.preco_cadeira_avulsa > 0 && (
                    <p className="text-xs text-slate-500 mt-1">{formatarValor(config.preco_cadeira_avulsa)} cada</p>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label>Data de Entrega *</Label>
                <Input type="date" value={dataInicio} onChange={(e) => setDataInicio(e.target.value)} required />
              </div>
              <div>
                <Label>Data de Devolução *</Label>
                <Input type="date" value={dataFim} onChange={(e) => setDataFim(e.target.value)} required />
              </div>
            </div>

            <div>
              <Label>Forma de Pagamento *</Label>
              <Select value={formaPagamento} onValueChange={(v: string) => setFormaPagamento(v as FormaPagamento)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="PIX">PIX</SelectItem>
                  <SelectItem value="DINHEIRO">Dinheiro</SelectItem>
                  <SelectItem value="CARTAO">Cartão</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Observações</Label>
              <Input value={observacoes} onChange={(e) => setObservacoes(e.target.value)} placeholder="Alguma observação..." />
            </div>

            {valorTotalCalculado > 0 && (
              <div className="bg-slate-50 rounded-lg p-4">
                <h4 className="font-semibold mb-2">Resumo</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between"><span>Kit ({quantidadeNum}x)</span><span>{formatarValor(valorKit)}</span></div>
                  {valorAvulsos > 0 && <div className="flex justify-between"><span>Avulsos</span><span>{formatarValor(valorAvulsos)}</span></div>}
                  <div className="flex justify-between"><span>Frete</span><span>{formatarValor(Number(vilaFrete))}</span></div>
                  <div className="flex justify-between font-bold text-lg border-t pt-2 mt-2">
                    <span>Total calculado</span><span className="text-slate-600">{formatarValor(valorTotalCalculado)}</span>
                  </div>
                </div>
              </div>
            )}

            <div>
              <Label>Valor Total Manual (R$)</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={totalManual}
                onChange={(e) => setTotalManual(e.target.value)}
                placeholder={valorTotalCalculado > 0 ? String(valorTotalCalculado) : '0.00'}
              />
              <p className="text-xs text-slate-500 mt-1">
                {totalManual !== ''
                  ? `Valor manual: ${formatarValor(Number(totalManual))}`
                  : 'Deixe em branco para usar o valor calculado acima.'}
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={handleCloseForm}>Cancelar</Button>
              <Button type="submit" disabled={confirmarPedido.isPending}>
                {confirmarPedido.isPending ? 'Criando...' : 'Criar Pedido'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal Editar Pedido */}
      <Dialog open={!!editingPedido} onOpenChange={(open) => { if (!open) handleCloseEdit() }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-auto mx-4 sm:mx-auto">
          <DialogHeader>
            <DialogTitle>Editar Pedido #{editingPedido?.id?.substring(0, 8)}</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSaveEdit} className="space-y-4">
            {/* Vincular cliente */}
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
              <Label className="text-blue-800 font-semibold">Vincular a cliente cadastrado</Label>
              <p className="text-xs text-blue-600 mb-2 mt-0.5">Preenche nome e WhatsApp automaticamente.</p>
              <Select
                value=""
                onValueChange={(v) => {
                  const usuario = perfisArray.find((p: any) => p.id === v)
                  if (usuario) {
                    setEditNome(usuario.nome || usuario.nome_fallback || '')
                    if (usuario.whatsapp) setEditWhatsapp(usuario.whatsapp)
                  }
                }}
              >
                <SelectTrigger className="bg-white">
                  <SelectValue placeholder={perfisArray.length === 0 ? 'Nenhum usuário cadastrado' : 'Selecionar cliente...'} />
                </SelectTrigger>
                <SelectContent>
                  {perfisArray.map((usuario: any) => (
                    <SelectItem key={usuario.id} value={usuario.id}>
                      <span className="font-medium">{usuario.nome || usuario.nome_fallback || 'Sem nome'}</span>
                      <span className="text-slate-400 ml-2 text-xs">{usuario.email}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label>Nome do Cliente</Label>
                <Input value={editNome} onChange={(e) => setEditNome(e.target.value)} required />
              </div>
              <div>
                <Label>WhatsApp</Label>
                <Input value={editWhatsapp} onChange={(e) => setEditWhatsapp(formatWhatsApp(e.target.value))} required />
              </div>
            </div>

            <div>
              <Label>Endereço</Label>
              <Input value={editEndereco} onChange={(e) => setEditEndereco(e.target.value)} required />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label>Vila/Região</Label>
                <Select value={editVilaId} onValueChange={handleEditVila}>
                  <SelectTrigger><SelectValue placeholder="Selecione a vila" /></SelectTrigger>
                  <SelectContent>
                    {vilasArray.map((vila) => (
                      <SelectItem key={vila.id} value={vila.id}>{vila.nome} - Frete: {formatarValor(vila.valorFrete)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Kit</Label>
                <Select value={editKitId} onValueChange={setEditKitId}>
                  <SelectTrigger><SelectValue placeholder="Selecione o kit" /></SelectTrigger>
                  <SelectContent>
                    {kitsParaEdicao.map((kit: any) => (
                      <SelectItem key={kit.id} value={kit.id}>{kit.descricao}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label>Data de Entrega</Label>
                <Input type="date" value={editDataInicio} onChange={(e) => setEditDataInicio(e.target.value)} required />
              </div>
              <div>
                <Label>Data de Devolução</Label>
                <Input type="date" value={editDataFim} min={editDataInicio || undefined} onChange={(e) => setEditDataFim(e.target.value)} required />
              </div>
            </div>

            <div>
              <Label>Quantidade de kits</Label>
              <Input type="number" min="0" value={editQuantidade} onChange={(e) => handleEditQuantidade(e.target.value)} required />
              <p className="text-xs text-slate-500 mt-1">Mínimo para novos pedidos: {minKits} kits (na edição pode ser qualquer valor).</p>
            </div>

            {/* Avulsos edição */}
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-medium text-slate-700 mb-3">Itens avulsos</p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Mesas avulsas</Label>
                  <Input type="number" min="0" value={editMesasAvulsas} onChange={(e) => handleEditAvulsos(e.target.value, editCadeirasAvulsas)} />
                </div>
                <div>
                  <Label>Cadeiras avulsas</Label>
                  <Input type="number" min="0" value={editCadeirasAvulsas} onChange={(e) => handleEditAvulsos(editMesasAvulsas, e.target.value)} />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label>Forma de Pagamento</Label>
                <Select value={editFormaPagamento} onValueChange={(v: string) => setEditFormaPagamento(v as FormaPagamento)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PIX">PIX</SelectItem>
                    <SelectItem value="DINHEIRO">Dinheiro</SelectItem>
                    <SelectItem value="CARTAO">Cartão</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Status do Pedido</Label>
                <Select value={editStatus} onValueChange={(v: string) => setEditStatus(v as StatusPedido)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {allStatuses.map((status) => (
                      <SelectItem key={status} value={status}>{statusLabels[status]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>Observações</Label>
              <Input value={editObservacoes} onChange={(e) => setEditObservacoes(e.target.value)} placeholder="Alguma observação..." />
            </div>

            {/* Valores */}
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-medium text-slate-700 mb-1">Valores (R$)</p>
              <p className="text-xs text-slate-500 mb-3">
                Mudar quantidade, vila ou avulsos recalcula os valores. Todos podem ser ajustados à mão
                (ex: desconto combinado); o total é refeito quando kit, frete ou avulsos mudam.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <Label>Kits</Label>
                  <Input type="number" min="0" step="0.01" value={editValorKit} onChange={(e) => handleEditComponente('kit', e.target.value)} />
                </div>
                <div>
                  <Label>Frete</Label>
                  <Input type="number" min="0" step="0.01" value={editValorFrete} onChange={(e) => handleEditComponente('frete', e.target.value)} />
                </div>
                <div>
                  <Label>Avulsos</Label>
                  <Input type="number" min="0" step="0.01" value={editValorAvulsos} onChange={(e) => handleEditComponente('avulsos', e.target.value)} />
                </div>
              </div>
              <div className="mt-4">
                <Label>Valor Total (R$)</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={editTotal}
                  onChange={(e) => setEditTotal(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={handleCloseEdit}>Cancelar</Button>
              <Button type="submit" disabled={updatePedido.isPending}>
                {updatePedido.isPending ? 'Salvando...' : 'Salvar alterações'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
