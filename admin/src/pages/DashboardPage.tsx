import { useState } from 'react'
import { useDashboardStats } from '@shared/hooks/use-dashboard'
import { useDashboardFiltrado } from '@shared/hooks/use-dashboard'
import { useDisponibilidadePeriodo } from '@shared/hooks/use-disponibilidade'
import { useInventario } from '@shared/hooks/use-inventario'
import { Package, ClipboardList, Star, TrendingUp, TrendingDown, DollarSign, MapPin, BarChart2 } from 'lucide-react'
import { formatarValor } from '@shared/lib/validations'

const MESES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']

export function DashboardPage() {
  const hoje = new Date()
  const [mesFiltro, setMesFiltro] = useState(0) // 0 = ano inteiro
  const [anoFiltro, setAnoFiltro] = useState(hoje.getFullYear())

  const { data: stats, isLoading } = useDashboardStats()
  const { data: filtrado, isLoading: loadingFiltrado } = useDashboardFiltrado(mesFiltro, anoFiltro)

  const periodoLabel = mesFiltro === 0 ? 'do Ano' : `de ${MESES[mesFiltro - 1]}`

  const hojeZero = new Date()
  hojeZero.setHours(0, 0, 0, 0)
  const { data: kitsDisponiveisHoje } = useDisponibilidadePeriodo(hojeZero, hojeZero)
  const { data: inventario } = useInventario()
  const mesasTotal = Array.isArray(inventario) ? (inventario.find((i: any) => i.item === 'MESA')?.quantidade ?? 0) : 0
  const cadeirasTotal = Array.isArray(inventario) ? (inventario.find((i: any) => i.item === 'CADEIRA')?.quantidade ?? 0) : 0

  // Anos disponíveis para seleção (3 anos atrás até atual)
  const anoAtual = hoje.getFullYear()
  const anos = Array.from({ length: 4 }, (_, i) => anoAtual - i)

  const maxReceita = filtrado?.receitaPorMes
    ? Math.max(...filtrado.receitaPorMes.map((m) => m.receita), 1)
    : 1

  if (isLoading) {
    return (
      <div className="p-4 lg:p-8">
        <h1 className="text-2xl lg:text-3xl font-bold mb-6">Dashboard</h1>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-lg shadow p-6 animate-pulse">
              <div className="h-4 bg-slate-200 rounded w-1/2 mb-4"></div>
              <div className="h-8 bg-slate-200 rounded w-3/4"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 lg:p-8 space-y-6">
      <h1 className="text-2xl lg:text-3xl font-bold">Dashboard</h1>

      {/* ── Cards fixos (totais gerais) ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
        {[
          { title: 'Pendentes', value: stats?.pedidosNovos || 0, icon: ClipboardList, color: 'bg-yellow-500' },
          { title: 'Ativos', value: stats?.pedidosAtivos || 0, icon: Package, color: 'bg-blue-500' },
          { title: 'Concluídos', value: stats?.pedidosFinalizados || 0, icon: TrendingUp, color: 'bg-green-500' },
          { title: 'Avaliação Média', value: stats?.avaliacaoMedia?.toFixed(1) || '0.0', icon: Star, color: 'bg-purple-500', suffix: '/5' },
        ].map((card) => (
          <div key={card.title} className="bg-white rounded-lg shadow p-4 lg:p-6">
            <div className="flex items-center justify-between mb-2 lg:mb-4">
              <span className="text-xs lg:text-sm text-slate-500">{card.title}</span>
              <div className={`${card.color} p-1.5 lg:p-2 rounded-lg`}>
                <card.icon className="h-4 w-4 lg:h-5 lg:w-5 text-white" />
              </div>
            </div>
            <div className="text-xl lg:text-3xl font-bold">
              {card.value}
              {card.suffix && <span className="text-sm lg:text-lg text-slate-400">{card.suffix}</span>}
            </div>
          </div>
        ))}
      </div>

      {/* Kits disponíveis hoje */}
      {kitsDisponiveisHoje !== undefined && (
        <div className={`rounded-lg shadow p-4 lg:p-6 ${kitsDisponiveisHoje === 0 ? 'bg-red-50 border border-red-200' : 'bg-white'}`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-slate-500">Kits Disponíveis Hoje</span>
            <div className={`p-1.5 lg:p-2 rounded-lg ${kitsDisponiveisHoje === 0 ? 'bg-red-500' : kitsDisponiveisHoje < 5 ? 'bg-orange-500' : 'bg-teal-500'}`}>
              <Package className="h-4 w-4 lg:h-5 lg:w-5 text-white" />
            </div>
          </div>
          <div className={`text-2xl lg:text-3xl font-bold ${kitsDisponiveisHoje === 0 ? 'text-red-600' : kitsDisponiveisHoje < 5 ? 'text-orange-600' : 'text-slate-900'}`}>
            {kitsDisponiveisHoje} kits
          </div>
          {kitsDisponiveisHoje > 0 && (mesasTotal > 0 || cadeirasTotal > 0) && (
            <div className="mt-1 text-sm text-slate-500">{mesasTotal} mesas · {cadeirasTotal} cadeiras</div>
          )}
          {kitsDisponiveisHoje === 0 && (
            <div className="mt-1 text-sm text-red-500 font-medium">Sem kits disponíveis hoje</div>
          )}
        </div>
      )}

      {/* ── Filtro ano/mês ── */}
      <div className="flex items-center gap-3 flex-wrap">
        <span className="text-sm font-medium text-slate-600">Filtrar por:</span>
        <select
          value={anoFiltro}
          onChange={(e) => setAnoFiltro(Number(e.target.value))}
          className="border border-slate-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
        >
          {anos.map((a) => (
            <option key={a} value={a}>{a}</option>
          ))}
        </select>
        <select
          value={mesFiltro}
          onChange={(e) => setMesFiltro(Number(e.target.value))}
          className="border border-slate-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
        >
          <option value={0}>Ano inteiro</option>
          {MESES.map((m, i) => (
            <option key={i + 1} value={i + 1}>{m}</option>
          ))}
        </select>
      </div>

      {loadingFiltrado ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-lg shadow p-6 animate-pulse h-28">
              <div className="h-4 bg-slate-200 rounded w-1/2 mb-4"></div>
              <div className="h-8 bg-slate-200 rounded w-3/4"></div>
            </div>
          ))}
        </div>
      ) : (
        <>
          {/* ── Cards de lucro ── */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 lg:gap-4">
            <div className="bg-white rounded-lg shadow p-4 lg:p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-slate-500">Receita {periodoLabel}</span>
                <div className="bg-green-500 p-1.5 rounded-lg">
                  <DollarSign className="h-4 w-4 text-white" />
                </div>
              </div>
              <div className="text-2xl font-bold text-green-600">{formatarValor(filtrado?.receitaTotal || 0)}</div>
              <div className="text-xs text-slate-400 mt-1 space-y-0.5">
                <div>Concluído: {formatarValor(filtrado?.receitaConcluido || 0)}</div>
                <div>Confirmado: {formatarValor(filtrado?.receitaConfirmado || 0)}</div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-4 lg:p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-slate-500">Custos {periodoLabel}</span>
                <div className="bg-red-500 p-1.5 rounded-lg">
                  <TrendingDown className="h-4 w-4 text-white" />
                </div>
              </div>
              <div className="text-2xl font-bold text-red-600">{formatarValor(filtrado?.custoTotal || 0)}</div>
              <div className="text-xs text-slate-400 mt-1">{filtrado?.topCustos?.length || 0} categori{(filtrado?.topCustos?.length || 0) !== 1 ? 'as' : 'a'}</div>
            </div>

            <div className={`rounded-lg shadow p-4 lg:p-6 ${(filtrado?.lucro || 0) >= 0 ? 'bg-white' : 'bg-red-50 border border-red-200'}`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-slate-500">Lucro {periodoLabel}</span>
                <div className={`p-1.5 rounded-lg ${(filtrado?.lucro || 0) >= 0 ? 'bg-emerald-500' : 'bg-red-500'}`}>
                  <TrendingUp className="h-4 w-4 text-white" />
                </div>
              </div>
              <div className={`text-2xl font-bold ${(filtrado?.lucro || 0) >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                {formatarValor(filtrado?.lucro || 0)}
              </div>
              <div className="text-xs text-slate-400 mt-1">{filtrado?.totalPedidos || 0} pedido{(filtrado?.totalPedidos || 0) !== 1 ? 's' : ''} {mesFiltro === 0 ? 'no ano' : 'no mês'}</div>
            </div>
          </div>

          {/* ── Top Custos e Top Bairros ── */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Top Custos */}
            <div className="bg-white rounded-lg shadow p-4 lg:p-6">
              <h2 className="text-base font-semibold mb-4 flex items-center gap-2">
                <TrendingDown className="h-4 w-4 text-red-500" />
                Principais Custos
              </h2>
              {(filtrado?.topCustos?.length || 0) === 0 ? (
                <p className="text-sm text-slate-400 text-center py-4">Nenhum custo registrado.</p>
              ) : (
                <div className="space-y-3">
                  {filtrado?.topCustos?.map((c, i) => {
                    const pct = filtrado.custoTotal > 0 ? (c.valor / filtrado.custoTotal) * 100 : 0
                    return (
                      <div key={c.categoria}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-slate-700 truncate max-w-[60%]">
                            <span className="text-slate-400 mr-1">{i + 1}.</span> {c.categoria}
                          </span>
                          <span className="font-medium text-red-600">{formatarValor(c.valor)}</span>
                        </div>
                        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-red-400 rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Top Bairros */}
            <div className="bg-white rounded-lg shadow p-4 lg:p-6">
              <h2 className="text-base font-semibold mb-4 flex items-center gap-2">
                <MapPin className="h-4 w-4 text-blue-500" />
                Bairros com Mais Pedidos
              </h2>
              {(filtrado?.topBairros?.length || 0) === 0 ? (
                <p className="text-sm text-slate-400 text-center py-4">Nenhum pedido registrado.</p>
              ) : (
                <div className="space-y-3">
                  {filtrado?.topBairros?.map((b, i) => {
                    const maxPedidos = filtrado.topBairros[0]?.totalPedidos || 1
                    const pct = (b.totalPedidos / maxPedidos) * 100
                    return (
                      <div key={b.nome}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-slate-700 truncate max-w-[60%]">
                            <span className="text-slate-400 mr-1">{i + 1}.</span> {b.nome}
                          </span>
                          <span className="font-medium text-blue-600">{b.totalPedidos} pedido{b.totalPedidos !== 1 ? 's' : ''}</span>
                        </div>
                        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-blue-400 rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          {/* ── Gráfico de barras anual ── */}
          <div className="bg-white rounded-lg shadow p-4 lg:p-6">
            <h2 className="text-base font-semibold mb-4 flex items-center gap-2">
              <BarChart2 className="h-4 w-4 text-emerald-500" />
              Receita Mensal — {anoFiltro}
            </h2>
            <div className="flex items-end gap-1 lg:gap-2 h-40">
              {filtrado?.receitaPorMes?.map((m) => {
                const altura = maxReceita > 0 ? Math.max((m.receita / maxReceita) * 100, m.receita > 0 ? 4 : 0) : 0
                const isAtual = mesFiltro !== 0 && m.mes === mesFiltro
                return (
                  <div key={m.mes} className="flex-1 flex flex-col items-center gap-1 group relative" title={`${m.label}: ${formatarValor(m.receita)}`}>
                    <div className="w-full flex items-end justify-center" style={{ height: 120 }}>
                      <div
                        className={`w-full rounded-t transition-all ${isAtual ? 'bg-emerald-500' : 'bg-emerald-200 group-hover:bg-emerald-400'}`}
                        style={{ height: `${altura}%`, minHeight: m.receita > 0 ? 4 : 0 }}
                      />
                    </div>
                    <span className={`text-xs ${isAtual ? 'font-bold text-emerald-700' : 'text-slate-400'}`}>{m.label}</span>
                  </div>
                )
              })}
            </div>
            {/* Legenda de valores */}
            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
              {filtrado?.receitaPorMes?.filter((m) => m.receita > 0).map((m) => (
                <span key={m.mes}><span className="font-medium text-slate-700">{m.label}:</span> {formatarValor(m.receita)}</span>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
