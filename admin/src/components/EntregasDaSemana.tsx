import { useEffect, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@shared/lib/api-client'
import { pedidoKeys } from '@shared/hooks/use-pedidos'
import { formatarData, formatarValor } from '@shared/lib/validations'
import { Truck, ChevronDown, ChevronUp, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { Pedido } from '@shared/types'

function getInicioFimSemana(): { inicio: Date; fim: Date } {
  const hoje = new Date()
  const diaSemana = hoje.getDay() // 0=dom, 1=seg, ..., 6=sab
  const diffParaSeg = diaSemana === 0 ? 1 : 1 - diaSemana
  const seg = new Date(hoje)
  seg.setDate(hoje.getDate() + diffParaSeg)
  seg.setHours(0, 0, 0, 0)
  const dom = new Date(seg)
  dom.setDate(seg.getDate() + 6)
  dom.setHours(23, 59, 59, 999)
  return { inicio: seg, fim: dom }
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

export function EntregasDaSemana() {
  const [pedidos, setPedidos] = useState<Pedido[]>([])
  const [loading, setLoading] = useState(true)
  const [atualizando, setAtualizando] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const [jaAtualizou, setJaAtualizou] = useState(false)
  const queryClient = useQueryClient()

  const { inicio, fim } = getInicioFimSemana()

  useEffect(() => {
    async function carregar() {
      setLoading(true)
      const res = await apiClient.getPedidosDaSemana(inicio, fim)
      if (res.success && res.data) {
        setPedidos(res.data as Pedido[])
      }
      setLoading(false)
    }
    carregar()
  }, [])

  useEffect(() => {
    if (!loading && isSegundaFeira() && !jaAtualizou) {
      const pendentes = pedidos.filter((p) => p.status === 'PENDENTE')
      if (pendentes.length > 0) {
        atualizarPendentes(pendentes.map((p) => p.id))
      }
    }
  }, [loading])

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

  if (loading) return null
  if (pedidos.length === 0) return null

  const pendentesCount = pedidos.filter((p) => p.status === 'PENDENTE').length

  return (
    <div className="mb-6 rounded-lg border border-blue-200 bg-blue-50 overflow-hidden">
      <div
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-blue-100 transition-colors"
        onClick={() => setCollapsed((c) => !c)}
      >
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 text-white p-2 rounded-lg">
            <Truck className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-semibold text-blue-900">
              Entregas da Semana ({formatarData(inicio)} — {formatarData(fim)})
            </h2>
            <p className="text-sm text-blue-700">
              {pedidos.length} pedido{pedidos.length !== 1 ? 's' : ''} programado{pedidos.length !== 1 ? 's' : ''}
              {pendentesCount > 0 && !jaAtualizou && isSegundaFeira() && (
                <span className="ml-2 text-yellow-700 font-medium">
                  · {pendentesCount} aguardando atualização automática
                </span>
              )}
              {atualizando && <span className="ml-2 text-blue-600 font-medium">· Atualizando status...</span>}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {pendentesCount > 0 && !isSegundaFeira() && (
            <Button
              size="sm"
              variant="outline"
              className="border-blue-300 text-blue-700 hover:bg-blue-100"
              onClick={(e) => {
                e.stopPropagation()
                atualizarPendentes(pedidos.filter((p) => p.status === 'PENDENTE').map((p) => p.id))
              }}
              disabled={atualizando}
            >
              {atualizando ? 'Atualizando...' : `Marcar ${pendentesCount} como Aguardando Entrega`}
            </Button>
          )}
          {collapsed ? <ChevronDown className="h-5 w-5 text-blue-600" /> : <ChevronUp className="h-5 w-5 text-blue-600" />}
        </div>
      </div>

      {!collapsed && (
        <div className="border-t border-blue-200">
          {isSegundaFeira() && jaAtualizou && (
            <div className="flex items-center gap-2 px-4 py-2 bg-green-50 border-b border-green-200 text-sm text-green-700">
              <AlertCircle className="h-4 w-4" />
              Status dos pedidos pendentes atualizados automaticamente para "Aguardando Entrega".
            </div>
          )}

          <div className="divide-y divide-blue-100">
            {pedidos.map((pedido) => (
              <div key={pedido.id} className="p-4 bg-white hover:bg-slate-50">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div>
                      <div className="font-medium text-sm">
                        #{pedido.id.substring(0, 8)} — {pedido.nomeSolicitante}
                      </div>
                      <div className="text-xs text-slate-500">
                        Entrega: {formatarData(new Date(pedido.dataInicio))} · Devolução: {formatarData(new Date(pedido.dataFim))}
                      </div>
                      <div className="text-xs text-slate-500">
                        {pedido.endereco}
                        {(pedido as any).vila?.nome ? ` · ${(pedido as any).vila.nome}` : ''}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <div className="text-right">
                      <div className="font-bold text-sm">{formatarValor(pedido.total)}</div>
                      <div className="text-xs text-slate-500">{pedido.quantidade} kit{pedido.quantidade !== 1 ? 's' : ''}</div>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${statusColors[pedido.status]}`}>
                      {statusLabels[pedido.status]}
                    </span>
                    {pedido.whatsapp && (
                      <Button
                        size="sm"
                        className="bg-green-600 hover:bg-green-700 text-xs h-7 px-2"
                        onClick={() => {
                          const msg = `Olá ${pedido.nomeSolicitante}! Sua entrega está confirmada para ${formatarData(new Date(pedido.dataInicio))}. JV Locações.`
                          const phone = pedido.whatsapp.replace(/\D/g, '')
                          window.open(`https://wa.me/55${phone}?text=${encodeURIComponent(msg)}`, '_blank')
                        }}
                      >
                        WhatsApp
                      </Button>
                    )}
                  </div>
                </div>
                {pedido.observacoes && (
                  <div className="mt-1 text-xs text-slate-500 italic">Obs: {pedido.observacoes}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
