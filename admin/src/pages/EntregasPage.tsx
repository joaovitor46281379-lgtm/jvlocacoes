import { useEffect, useState, useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@shared/lib/api-client'
import { pedidoKeys } from '@shared/hooks/use-pedidos'
import { useConfiguracoes } from '@shared/hooks/use-configuracoes'
import { formatarData, formatarValor } from '@shared/lib/validations'
import { Truck, Package, ChevronDown, ChevronUp, AlertCircle, Navigation, Route, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { Pedido } from '@shared/types'

type Modo = 'AGUARDANDO_ENTREGA' | 'AGUARDANDO_RETIRADA'

interface PedidoComOrdem extends Pedido {
  ordemRota?: number
}

function getInicioFimSemana(): { inicio: Date; fim: Date } {
  const hoje = new Date()
  const diaSemana = hoje.getDay()
  // Segunda = 1, Domingo = 0. Se domingo, a "próxima semana" começa amanhã.
  const diffParaSeg = diaSemana === 0 ? 1 : 1 - diaSemana
  const seg = new Date(hoje)
  seg.setDate(hoje.getDate() + diffParaSeg)
  seg.setHours(0, 0, 0, 0)
  const dom = new Date(seg)
  dom.setDate(seg.getDate() + 6)
  dom.setHours(23, 59, 59, 999)
  return { inicio: seg, fim: dom }
}

// Retorna os limites da semana ATUAL (seg-dom que contém hoje, inclusive se hoje é domingo)
function getSemanaAtual(): { inicio: Date; fim: Date } {
  const hoje = new Date()
  const diaSemana = hoje.getDay() // 0=dom, 1=seg...6=sab
  const diffParaSeg = diaSemana === 0 ? -6 : 1 - diaSemana
  const seg = new Date(hoje)
  seg.setDate(hoje.getDate() + diffParaSeg)
  seg.setHours(0, 0, 0, 0)
  const dom = new Date(seg)
  dom.setDate(seg.getDate() + 6)
  dom.setHours(23, 59, 59, 999)
  return { inicio: seg, fim: dom }
}

function isDomingo(): boolean {
  return new Date().getDay() === 0
}

function isSegundaFeira(): boolean {
  return new Date().getDay() === 1
}

const statusColors: Record<string, string> = {
  PENDENTE: 'bg-yellow-100 text-yellow-700',
  AGUARDANDO_ENTREGA: 'bg-blue-100 text-blue-700',
  AGUARDANDO_RETIRADA: 'bg-purple-100 text-purple-700',
  CONCLUIDO: 'bg-green-100 text-green-700',
  CANCELADO: 'bg-red-100 text-red-700',
}

const statusLabels: Record<string, string> = {
  PENDENTE: 'Pendente',
  AGUARDANDO_ENTREGA: 'Aguardando Entrega',
  AGUARDANDO_RETIRADA: 'Aguardando Retirada',
  CONCLUIDO: 'Concluído',
  CANCELADO: 'Cancelado',
}

const pagamentoColors: Record<string, string> = {
  PENDENTE: 'bg-yellow-100 text-yellow-700',
  PAGO: 'bg-green-100 text-green-700',
  CANCELADO: 'bg-red-100 text-red-700',
  EXPIRADO: 'bg-gray-100 text-gray-600',
}

const pagamentoLabels: Record<string, string> = {
  PENDENTE: 'Pag. Pendente',
  PAGO: 'Pago',
  CANCELADO: 'Pag. Cancelado',
  EXPIRADO: 'Expirado',
}

function limparEndereco(endereco: string): string {
  let s = endereco
  s = s.replace(/\([^)]*\)/g, '')
  s = s.replace(/[-–]?\s*CEP[:\s]*[\d.\-]+/gi, '')
  s = s.replace(/\bBloco\s+\S+/gi, '')
  s = s.replace(/\bAp(?:to)?\.?\s*\S+/gi, '')
  s = s.replace(/\//g, ' ')
  s = s.replace(/[-–,]\s*[-–,]/g, ',')
  s = s.replace(/,\s*,/g, ',')
  s = s.replace(/[-–,]\s*$/g, '')
  s = s.replace(/\s{2,}/g, ' ').trim()
  return s
}

async function geocodificar(endereco: string): Promise<{ lat: number; lon: number } | null> {
  const limpo = limparEndereco(endereco)
  // Adiciona ", Piraquara, PR" se não mencionar cidade/estado
  const query = /pira[qk]uara|curitiba|\bPR\b/i.test(limpo) ? limpo : `${limpo}, Piraquara, PR, Brasil`
  try {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1&countrycodes=br`
    const res = await fetch(url, { headers: { 'Accept-Language': 'pt-BR' } })
    const data = await res.json()
    if (data?.[0]) return { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) }
  } catch {
    // silencioso
  }
  return null
}

function distanciaKm(a: { lat: number; lon: number }, b: { lat: number; lon: number }): number {
  const R = 6371
  const dLat = ((b.lat - a.lat) * Math.PI) / 180
  const dLon = ((b.lon - a.lon) * Math.PI) / 180
  const x = Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLon / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x))
}

function nearestNeighbor<T extends { lat: number; lon: number }>(
  origem: { lat: number; lon: number },
  pontos: T[]
): T[] {
  const restantes = [...pontos]
  const rota: T[] = []
  let atual = origem
  while (restantes.length > 0) {
    let melhorIdx = 0
    let melhorDist = Infinity
    for (let i = 0; i < restantes.length; i++) {
      const d = distanciaKm(atual, restantes[i])
      if (d < melhorDist) { melhorDist = d; melhorIdx = i }
    }
    rota.push(restantes[melhorIdx])
    atual = restantes[melhorIdx]
    restantes.splice(melhorIdx, 1)
  }
  return rota
}

function gerarLinkRotaCompleta(enderecos: string[]): string {
  if (enderecos.length === 0) return ''
  const limpos = enderecos.map(limparEndereco)
  if (limpos.length === 1) {
    return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(limpos[0])}&travelmode=driving`
  }
  const destino = limpos[limpos.length - 1]
  const waypoints = limpos.slice(0, -1).join('|')
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destino)}&waypoints=${encodeURIComponent(waypoints)}&travelmode=driving`
}

export function EntregasPage() {
  const [modo, setModo] = useState<Modo>('AGUARDANDO_ENTREGA')
  const [pedidos, setPedidos] = useState<PedidoComOrdem[]>([])
  const [loading, setLoading] = useState(true)
  const [atualizando, setAtualizando] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const [jaAtualizou, setJaAtualizou] = useState(false)
  const [ordenandoRota, setOrdenandoRota] = useState(false)
  const [rotaOrdenada, setRotaOrdenada] = useState(false)
  const [erroRota, setErroRota] = useState('')
  const queryClient = useQueryClient()
  const { data: configuracoes } = useConfiguracoes()

  const { inicio, fim } = getInicioFimSemana()
  const semanaAtual = getSemanaAtual()

  useEffect(() => {
    setCollapsed(false)
    setJaAtualizou(false)
    setRotaOrdenada(false)
    setErroRota('')
    carregar()
  }, [modo])

  async function carregar() {
    setLoading(true)
    if (modo === 'AGUARDANDO_ENTREGA') {
      if (isDomingo()) {
        // No domingo, busca pedidos pendentes da SEMANA ATUAL (que começa hoje até sábado da próxima semana)
        const res = await apiClient.getPedidosDaSemana(semanaAtual.inicio, semanaAtual.fim)
        if (res.success && res.data)
          setPedidos((res.data as Pedido[]).filter((p) => p.status === 'AGUARDANDO_ENTREGA' || p.status === 'PENDENTE'))
      } else {
        const res = await apiClient.getPedidosDaSemana(inicio, fim)
        if (res.success && res.data)
          setPedidos((res.data as Pedido[]).filter((p) => p.status === 'AGUARDANDO_ENTREGA' || p.status === 'PENDENTE'))
      }
    } else {
      const res = await apiClient.getPedidosByStatus('AGUARDANDO_RETIRADA')
      if (res.success && res.data) setPedidos(res.data as Pedido[])
    }
    setLoading(false)
  }

  useEffect(() => {
    if (!loading && modo === 'AGUARDANDO_ENTREGA' && isSegundaFeira() && !jaAtualizou) {
      const pendentes = pedidos.filter((p) => p.status === 'PENDENTE')
      if (pendentes.length > 0) {
        atualizarPendentes(pendentes.map((p) => p.id))
      }
    }
  }, [loading])

  async function handleStatusChange(pedidoId: string, novoStatus: string) {
    const res = await apiClient.updatePedido(pedidoId, { status: novoStatus } as any)
    if (res.success) {
      setPedidos((prev) => prev.filter((p) => p.id !== pedidoId))
      queryClient.invalidateQueries({ queryKey: pedidoKeys.lists() })
    }
  }

  async function handleMarcarPago(pedido: Pedido) {
    const pagamento = (pedido as any).pagamentos?.[0]
    if (!pagamento) return
    const res = await apiClient.updatePagamento(pagamento.id, 'PAGO')
    if (res.success) {
      setPedidos((prev) =>
        prev.map((p) =>
          p.id === pedido.id
            ? { ...p, pagamentos: [{ ...pagamento, status: 'PAGO' }] } as any
            : p
        )
      )
      queryClient.invalidateQueries({ queryKey: pedidoKeys.lists() })
    }
  }

  async function atualizarPendentes(ids: string[]) {
    setAtualizando(true)
    const res = await apiClient.marcarPedidosAguardandoEntrega(ids)
    if (res.success) {
      setPedidos((prev) =>
        prev.map((p) => (ids.includes(p.id) ? { ...p, status: 'AGUARDANDO_ENTREGA' as any } : p))
      )
      queryClient.invalidateQueries({ queryKey: pedidoKeys.lists() })
      setJaAtualizou(true)
    }
    setAtualizando(false)
  }

  const handleOrdenarRota = useCallback(async () => {
    setOrdenandoRota(true)
    setErroRota('')
    setRotaOrdenada(false)

    const enderecoEmpresa = configuracoes?.endereco_empresa || 'Piraquara, PR, Brasil'

    // Geocodifica ponto de partida
    const origem = await geocodificar(enderecoEmpresa)
    if (!origem) {
      setErroRota('Não foi possível geocodificar o endereço de partida. Configure "endereco_empresa" nas configurações.')
      setOrdenandoRota(false)
      return
    }

    // Geocodifica cada pedido
    const pedidosComCoord: (PedidoComOrdem & { lat: number; lon: number })[] = []
    const semCoord: PedidoComOrdem[] = []

    for (const p of pedidos) {
      const coord = await geocodificar(p.endereco || '')
      if (coord) {
        pedidosComCoord.push({ ...p, ...coord })
      } else {
        semCoord.push(p)
      }
    }

    if (pedidosComCoord.length === 0) {
      setErroRota('Não foi possível geocodificar nenhum endereço. Verifique os endereços cadastrados.')
      setOrdenandoRota(false)
      return
    }

    // Aplica nearest-neighbor
    const ordenados = nearestNeighbor(origem, pedidosComCoord)

    // Remonta lista: ordenados + sem coordenada no final
    const novaLista: PedidoComOrdem[] = [
      ...ordenados.map((p, i) => ({ ...p, ordemRota: i + 1 })),
      ...semCoord.map((p) => ({ ...p, ordemRota: undefined })),
    ]

    setPedidos(novaLista)
    setRotaOrdenada(true)
    setOrdenandoRota(false)
  }, [pedidos, configuracoes])

  const handleAbrirRotaCompleta = () => {
    const enderecos = pedidos
      .filter((p) => p.status === 'AGUARDANDO_ENTREGA')
      .map((p) => p.endereco || '')
      .filter(Boolean)
    const link = gerarLinkRotaCompleta(enderecos)
    if (link) window.open(link, '_blank')
  }

  const isEntrega = modo === 'AGUARDANDO_ENTREGA'
  const pendentesCount = pedidos.filter((p) => p.status === 'PENDENTE').length
  const pedidosEntregaSemana = pedidos.filter((p) => p.status === 'AGUARDANDO_ENTREGA')
  const headerColor = isEntrega ? 'blue' : 'purple'

  const colorMap = {
    blue: {
      border: 'border-blue-200',
      bg: 'bg-blue-50',
      hover: 'hover:bg-blue-100',
      title: 'text-blue-900',
      subtitle: 'text-blue-700',
      iconBg: 'bg-blue-600',
      divider: 'divide-blue-100',
      chevron: 'text-blue-600',
      btnBorder: 'border-blue-300 text-blue-700 hover:bg-blue-100',
    },
    purple: {
      border: 'border-purple-200',
      bg: 'bg-purple-50',
      hover: 'hover:bg-purple-100',
      title: 'text-purple-900',
      subtitle: 'text-purple-700',
      iconBg: 'bg-purple-600',
      divider: 'divide-purple-100',
      chevron: 'text-purple-600',
      btnBorder: 'border-purple-300 text-purple-700 hover:bg-purple-100',
    },
  }

  const c = colorMap[headerColor]

  return (
    <div className="p-4 lg:p-6">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Entregas & Retiradas</h1>
          <p className="text-slate-500 text-sm mt-1">Acompanhe as entregas e retiradas de kits</p>
        </div>
        <Select value={modo} onValueChange={(v) => setModo(v as Modo)}>
          <SelectTrigger className="w-64">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="AGUARDANDO_ENTREGA">Aguardando Entrega (semana)</SelectItem>
            <SelectItem value="AGUARDANDO_RETIRADA">Aguardando Retirada</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* ── Banner de domingo ── */}
      {isEntrega && isDomingo() && (
        <div className="mb-4 rounded-lg border border-orange-200 bg-orange-50 p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-orange-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-medium text-orange-800">É domingo — prepare a semana!</p>
              <p className="text-sm text-orange-600 mt-0.5">
                Revise os pedidos pendentes abaixo e avance o status para "Aguardando Entrega".
              </p>
              {pendentesCount > 0 && (
                <Button
                  size="sm"
                  className="mt-3 bg-orange-500 hover:bg-orange-600 text-white"
                  onClick={() => atualizarPendentes(pedidos.filter((p) => p.status === 'PENDENTE').map((p) => p.id))}
                  disabled={atualizando}
                >
                  {atualizando ? (
                    <><Loader2 className="h-3 w-3 mr-1 animate-spin" /> Atualizando...</>
                  ) : (
                    `Avançar ${pendentesCount} pedido${pendentesCount !== 1 ? 's' : ''} para Aguardando Entrega`
                  )}
                </Button>
              )}
              {pendentesCount === 0 && (
                <p className="text-sm text-orange-500 mt-1 font-medium">Todos os pedidos já estão com status avançado.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12 text-slate-500">Carregando...</div>
      ) : pedidos.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-slate-400">
          {isEntrega ? <Truck className="h-10 w-10 mb-3" /> : <Package className="h-10 w-10 mb-3" />}
          <p className="text-base font-medium">
            {isEntrega
              ? 'Nenhuma entrega programada para esta semana'
              : 'Nenhum pedido aguardando retirada'}
          </p>
        </div>
      ) : (
        <div className={`rounded-lg border ${c.border} ${c.bg} overflow-hidden`}>
          <div
            className={`p-4 cursor-pointer ${c.hover} transition-colors`}
            onClick={() => setCollapsed((v) => !v)}
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-3 min-w-0">
                <div className={`${c.iconBg} text-white p-2 rounded-lg flex-shrink-0`}>
                  {isEntrega ? <Truck className="h-5 w-5" /> : <Package className="h-5 w-5" />}
                </div>
                <div className="min-w-0">
                  <h2 className={`font-semibold ${c.title} text-sm sm:text-base`}>
                    {isEntrega
                      ? <><span className="hidden sm:inline">Entregas da Semana ({formatarData(inicio)} — {formatarData(fim)})</span><span className="sm:hidden">Entregas da Semana</span></>
                      : 'Pedidos Aguardando Retirada'}
                  </h2>
                  <p className={`text-xs sm:text-sm ${c.subtitle}`}>
                    {pedidos.length} pedido{pedidos.length !== 1 ? 's' : ''}
                    {isEntrega && pendentesCount > 0 && !jaAtualizou && !isDomingo() && !isSegundaFeira() && (
                      <span className="ml-1 text-yellow-700 font-medium">· {pendentesCount} pendente{pendentesCount !== 1 ? 's' : ''}</span>
                    )}
                    {rotaOrdenada && <span className="ml-1 text-emerald-700 font-medium">· Rota otimizada</span>}
                    {atualizando && <span className="ml-1 font-medium">· Atualizando...</span>}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {collapsed ? (
                  <ChevronDown className={`h-5 w-5 ${c.chevron}`} />
                ) : (
                  <ChevronUp className={`h-5 w-5 ${c.chevron}`} />
                )}
              </div>
            </div>

            {/* Botões de ação no cabeçalho */}
            {isEntrega && !collapsed && (
              <div className="mt-3 flex flex-wrap gap-2" onClick={(e) => e.stopPropagation()}>
                {pendentesCount > 0 && !isDomingo() && (
                  <Button
                    size="sm"
                    variant="outline"
                    className={`${c.btnBorder}`}
                    onClick={(e) => {
                      e.stopPropagation()
                      atualizarPendentes(pedidos.filter((p) => p.status === 'PENDENTE').map((p) => p.id))
                    }}
                    disabled={atualizando}
                  >
                    {atualizando ? 'Atualizando...' : `Marcar ${pendentesCount} como Aguardando Entrega`}
                  </Button>
                )}
                {pedidosEntregaSemana.length > 1 && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                    onClick={(e) => { e.stopPropagation(); handleOrdenarRota() }}
                    disabled={ordenandoRota}
                  >
                    {ordenandoRota ? (
                      <><Loader2 className="h-3 w-3 mr-1 animate-spin" /> Calculando rota...</>
                    ) : (
                      <><Route className="h-3 w-3 mr-1" /> Ordenar por Rota</>
                    )}
                  </Button>
                )}
                {rotaOrdenada && pedidosEntregaSemana.length > 0 && (
                  <Button
                    size="sm"
                    className="bg-slate-700 hover:bg-slate-800 text-white"
                    onClick={(e) => { e.stopPropagation(); handleAbrirRotaCompleta() }}
                  >
                    <Navigation className="h-3 w-3 mr-1" />
                    Abrir Rota Completa
                  </Button>
                )}
              </div>
            )}

            {erroRota && (
              <div className="mt-2 text-xs text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">
                {erroRota}
              </div>
            )}
          </div>

          {!collapsed && (
            <div className={`border-t ${c.border}`}>
              {isEntrega && isSegundaFeira() && jaAtualizou && (
                <div className="flex items-center gap-2 px-4 py-2 bg-green-50 border-b border-green-200 text-sm text-green-700">
                  <AlertCircle className="h-4 w-4" />
                  Status dos pedidos pendentes atualizados automaticamente para "Aguardando Entrega".
                </div>
              )}

              <div className={`divide-y ${c.divider}`}>
                {pedidos.map((pedido) => (
                  <div key={pedido.id} className="p-4 bg-white hover:bg-slate-50">
                    {/* Info principal */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex items-start gap-2">
                        {/* Número da rota */}
                        {pedido.ordemRota !== undefined && (
                          <span className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-500 text-white text-xs font-bold flex items-center justify-center mt-0.5">
                            {pedido.ordemRota}
                          </span>
                        )}
                        <div className="min-w-0">
                          <div className="font-medium text-sm">
                            #{pedido.id.substring(0, 8)} — {(pedido as any).nome_solicitante ?? pedido.nomeSolicitante}
                          </div>
                          <div className="text-xs text-slate-500 mt-0.5">
                            Entrega: {formatarData(new Date((pedido as any).data_inicio ?? pedido.dataInicio))} · Dev.: {formatarData(new Date((pedido as any).data_fim ?? pedido.dataFim))}
                          </div>
                          <div className="text-xs text-slate-500 truncate">
                            {pedido.endereco}{(pedido as any).vila?.nome ? ` · ${(pedido as any).vila.nome}` : ''}
                          </div>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className="font-bold text-sm">{formatarValor(pedido.total)}</div>
                        <div className="text-xs text-slate-500">{pedido.quantidade} kit{pedido.quantidade !== 1 ? 's' : ''}</div>
                      </div>
                    </div>

                    {/* Badges + Ações */}
                    <div className="flex flex-wrap items-center gap-2 mt-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${statusColors[pedido.status]}`}>
                        {statusLabels[pedido.status]}
                      </span>
                      {pedido.pagamentos && pedido.pagamentos.length > 0 && (
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${pagamentoColors[pedido.pagamentos[0].status] ?? 'bg-gray-100 text-gray-600'}`}>
                          {pagamentoLabels[pedido.pagamentos[0].status] ?? pedido.pagamentos[0].status}
                        </span>
                      )}
                      <div className="flex gap-2 ml-auto">
                        {pedido.whatsapp && (
                          <Button
                            size="sm"
                            className="bg-green-600 hover:bg-green-700 text-xs h-7 px-2"
                            onClick={() => {
                              const nome = (pedido as any).nome_solicitante ?? pedido.nomeSolicitante
                              const msg = pedido.status === 'AGUARDANDO_ENTREGA'
                                ? `Olá ${nome}, tudo certo? Aqui é o João. Poderíamos combinar o horário da entrega do pedido de mesas e cadeiras?`
                                : `Olá ${nome}, tudo certo? Aqui é o João. Poderíamos combinar o horário da retirada do pedido de mesas e cadeiras?`
                              const phone = pedido.whatsapp.replace(/\D/g, '')
                              window.open(`https://wa.me/55${phone}?text=${encodeURIComponent(msg)}`, '_blank')
                            }}
                          >
                            WhatsApp
                          </Button>
                        )}
                        {(pedido as any).pagamentos?.[0]?.status === 'PENDENTE' && (
                          <Button
                            size="sm"
                            className="bg-emerald-600 hover:bg-emerald-700 text-xs h-7 px-2"
                            onClick={() => handleMarcarPago(pedido)}
                          >
                            Pago
                          </Button>
                        )}
                        {pedido.status === 'AGUARDANDO_ENTREGA' && (
                          <>
                            <Button
                              size="sm"
                              className="bg-slate-700 hover:bg-slate-800 text-xs h-7 px-2"
                              onClick={() => {
                                const limpo = limparEndereco(pedido.endereco ?? '')
                                const url = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(limpo)}&travelmode=driving`
                                window.open(url, '_blank')
                              }}
                            >
                              <Navigation className="h-3 w-3 mr-1" />
                              Rota
                            </Button>
                            <Button
                              size="sm"
                              className="bg-blue-600 hover:bg-blue-700 text-xs h-7 px-2"
                              onClick={() => handleStatusChange(pedido.id, 'AGUARDANDO_RETIRADA')}
                            >
                              Entregue
                            </Button>
                          </>
                        )}
                        {pedido.status === 'AGUARDANDO_RETIRADA' && (
                          <Button
                            size="sm"
                            className="bg-purple-600 hover:bg-purple-700 text-xs h-7 px-2"
                            onClick={() => handleStatusChange(pedido.id, 'CONCLUIDO')}
                          >
                            Retirado
                          </Button>
                        )}
                      </div>
                    </div>

                    {pedido.observacoes && (
                      <div className="mt-2 text-xs text-slate-500 italic">
                        Obs: {pedido.observacoes}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
