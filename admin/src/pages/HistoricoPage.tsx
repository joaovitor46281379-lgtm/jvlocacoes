import { useState, useMemo } from 'react'
import { usePedidos } from '@shared/hooks/use-pedidos'
import { formatarData, formatarValor } from '@shared/lib/validations'
import { History, TrendingUp, Package, DollarSign } from 'lucide-react'
import type { StatusPedido } from '@shared/types'

type Periodo = 'semana' | 'mes' | 'ano'

const statusColors: Record<StatusPedido, string> = {
  PENDENTE: 'bg-yellow-100 text-yellow-700',
  AGUARDANDO_ENTREGA: 'bg-blue-100 text-blue-700',
  AGUARDANDO_RETIRADA: 'bg-purple-100 text-purple-700',
  CONCLUIDO: 'bg-green-100 text-green-700',
  CANCELADO: 'bg-red-100 text-red-700',
}

const statusLabels: Record<StatusPedido, string> = {
  PENDENTE: 'Pendente',
  AGUARDANDO_ENTREGA: 'Ag. Entrega',
  AGUARDANDO_RETIRADA: 'Ag. Retirada',
  CONCLUIDO: 'Concluído',
  CANCELADO: 'Cancelado',
}

function getPeriodoDates(periodo: Periodo): { dataInicio: Date; dataFim: Date } {
  const now = new Date()
  const dataFim = new Date(now)
  dataFim.setHours(23, 59, 59, 999)

  const dataInicio = new Date(now)

  if (periodo === 'semana') {
    const diaSemana = now.getDay()
    dataInicio.setDate(now.getDate() - diaSemana)
  } else if (periodo === 'mes') {
    dataInicio.setDate(1)
  } else {
    dataInicio.setMonth(0, 1)
  }
  dataInicio.setHours(0, 0, 0, 0)

  return { dataInicio, dataFim }
}

export function HistoricoPage() {
  const [periodo, setPeriodo] = useState<Periodo>('mes')

  const { dataInicio, dataFim } = useMemo(() => getPeriodoDates(periodo), [periodo])

  const { data: pedidosData, isLoading } = usePedidos(
    { dataInicio, dataFim },
    { page: 1, limit: 200 }
  )

  const pedidos = pedidosData?.data || []

  const stats = useMemo(() => {
    const concluidos = pedidos.filter((p: any) => p.status === 'CONCLUIDO')
    const receita = concluidos.reduce((acc: number, p: any) => acc + Number(p.total || 0), 0)
    const ticketMedio = concluidos.length > 0 ? receita / concluidos.length : 0
    return {
      total: pedidos.length,
      concluidos: concluidos.length,
      receita,
      ticketMedio,
    }
  }, [pedidos])

  const periodoLabel = {
    semana: 'Esta Semana',
    mes: 'Este Mês',
    ano: 'Este Ano',
  }[periodo]

  return (
    <div className="p-4 lg:p-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div className="flex items-center gap-3">
          <History className="h-7 w-7 text-slate-600" />
          <h1 className="text-2xl lg:text-3xl font-bold">Histórico</h1>
        </div>

        {/* Filtros de período */}
        <div className="flex gap-2">
          {(['semana', 'mes', 'ano'] as Periodo[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriodo(p)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                periodo === p
                  ? 'bg-slate-900 text-white'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border'
              }`}
            >
              {p === 'semana' ? 'Semana' : p === 'mes' ? 'Mês' : 'Ano'}
            </button>
          ))}
        </div>
      </div>

      <p className="text-sm text-slate-500 mb-6">
        Período: {formatarData(dataInicio)} — {formatarData(dataFim)}
      </p>

      {/* Cards de resumo */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center gap-2 text-slate-500 text-sm mb-1">
            <Package className="h-4 w-4" />
            Total de Pedidos
          </div>
          <div className="text-2xl font-bold">{stats.total}</div>
          <div className="text-xs text-slate-400 mt-0.5">{periodoLabel}</div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center gap-2 text-slate-500 text-sm mb-1">
            <Package className="h-4 w-4 text-green-600" />
            Concluídos
          </div>
          <div className="text-2xl font-bold text-green-600">{stats.concluidos}</div>
          <div className="text-xs text-slate-400 mt-0.5">{periodoLabel}</div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center gap-2 text-slate-500 text-sm mb-1">
            <DollarSign className="h-4 w-4 text-blue-600" />
            Receita
          </div>
          <div className="text-2xl font-bold text-blue-600">{formatarValor(stats.receita)}</div>
          <div className="text-xs text-slate-400 mt-0.5">Pedidos concluídos</div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center gap-2 text-slate-500 text-sm mb-1">
            <TrendingUp className="h-4 w-4 text-purple-600" />
            Ticket Médio
          </div>
          <div className="text-2xl font-bold text-purple-600">{formatarValor(stats.ticketMedio)}</div>
          <div className="text-xs text-slate-400 mt-0.5">Por pedido concluído</div>
        </div>
      </div>

      {/* Lista de pedidos */}
      {isLoading ? (
        <div className="text-center py-8 text-slate-500">Carregando...</div>
      ) : pedidos.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center text-slate-500">
          Nenhum pedido encontrado para {periodoLabel.toLowerCase()}
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block bg-white rounded-lg shadow overflow-hidden">
            <table className="w-full">
              <thead className="bg-slate-50 border-b">
                <tr>
                  <th className="text-left p-4 font-semibold text-sm">Pedido</th>
                  <th className="text-left p-4 font-semibold text-sm">Cliente</th>
                  <th className="text-left p-4 font-semibold text-sm">Período</th>
                  <th className="text-center p-4 font-semibold text-sm">Qtd</th>
                  <th className="text-right p-4 font-semibold text-sm">Total</th>
                  <th className="text-center p-4 font-semibold text-sm">Status</th>
                </tr>
              </thead>
              <tbody>
                {pedidos.map((pedido: any) => (
                  <tr key={pedido.id} className="border-b hover:bg-slate-50">
                    <td className="p-4 text-sm font-mono text-slate-500">
                      #{pedido.id.substring(0, 8)}
                    </td>
                    <td className="p-4">
                      <div className="font-medium text-sm">{pedido.nome_solicitante}</div>
                      <div className="text-xs text-slate-500">{pedido.whatsapp}</div>
                    </td>
                    <td className="p-4 text-sm text-slate-600">
                      {formatarData(new Date(pedido.data_inicio))} — {formatarData(new Date(pedido.data_fim))}
                    </td>
                    <td className="p-4 text-center text-sm">{pedido.quantidade}</td>
                    <td className="p-4 text-right font-semibold">{formatarValor(pedido.total)}</td>
                    <td className="p-4 text-center">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[pedido.status as StatusPedido]}`}>
                        {statusLabels[pedido.status as StatusPedido]}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {pedidos.map((pedido: any) => (
              <div key={pedido.id} className="bg-white rounded-lg shadow p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="font-medium">{pedido.nome_solicitante}</div>
                    <div className="text-xs text-slate-500 font-mono">#{pedido.id.substring(0, 8)}</div>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[pedido.status as StatusPedido]}`}>
                    {statusLabels[pedido.status as StatusPedido]}
                  </span>
                </div>
                <div className="text-xs text-slate-500 mb-2">
                  {formatarData(new Date(pedido.data_inicio))} — {formatarData(new Date(pedido.data_fim))}
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-500">{pedido.quantidade} kits</span>
                  <span className="font-bold">{formatarValor(pedido.total)}</span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
