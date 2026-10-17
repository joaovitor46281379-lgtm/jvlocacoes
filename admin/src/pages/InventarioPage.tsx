import { useState } from 'react'
import { useInventario, useUpsertInventario } from '@shared/hooks/use-inventario'
import { useConfiguracoes, useUpsertConfiguracao } from '@shared/hooks/use-configuracoes'
import { useDisponibilidadePeriodo } from '@shared/hooks/use-disponibilidade'
import { usePedidos } from '@shared/hooks/use-pedidos'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { formatarData } from '@shared/lib/validations'

export function InventarioPage() {
  const { data: inventario, isLoading } = useInventario()
  const { data: config, isLoading: configLoading } = useConfiguracoes()
  const upsert = useUpsertInventario()
  const upsertConfig = useUpsertConfiguracao()

  const mesaAtual = inventario?.find((i: any) => i.item === 'MESA')
  const cadeiraAtual = inventario?.find((i: any) => i.item === 'CADEIRA')

  const totalMesas = mesaAtual?.quantidade ?? 0
  const totalCadeiras = cadeiraAtual?.quantidade ?? 0

  // Cálculo: 1 kit = 1 mesa + 4 cadeiras
  const kitsCompletos = totalMesas > 0 || totalCadeiras > 0
    ? Math.min(totalMesas, Math.floor(totalCadeiras / 4))
    : 0
  const mesasAvulsas = totalMesas - kitsCompletos
  const cadeirasAvulsas = totalCadeiras - kitsCompletos * 4

  // Disponível agora (hoje)
  const hoje = new Date()
  hoje.setHours(0, 0, 0, 0)
  const { data: kitsDisponiveisHoje } = useDisponibilidadePeriodo(hoje, hoje)

  // Próximos pedidos confirmados (todos ativos, filtrar no front)
  const { data: proximosPedidosData } = usePedidos(
    { status: ['AGUARDANDO_ENTREGA', 'AGUARDANDO_RETIRADA'] },
    { limit: 50, sortBy: 'data_inicio', sortOrder: 'asc' }
  )
  const amanha = new Date(hoje)
  amanha.setDate(amanha.getDate() + 1)
  const proximosPedidos = (proximosPedidosData?.data || []).filter(
    (p: any) => new Date(p.data_inicio) >= amanha
  ).slice(0, 10)

  // Form fields
  const [mesaQtd, setMesaQtd] = useState('')
  const [cadeiraQtd, setCadeiraQtd] = useState('')
  const [qtdMinima, setQtdMinima] = useState('')
  const [precoKit, setPrecoKit] = useState('')
  const [precoMesa, setPrecoMesa] = useState('')
  const [precoCadeira, setPrecoCadeira] = useState('')

  const handleSalvarEstoque = async (item: string, quantidade: number) => {
    try {
      await upsert.mutateAsync({ item, quantidade })
    } catch {
      alert('Erro ao salvar inventário')
    }
  }

  const handleSalvarConfig = async (id: string, valor: string) => {
    try {
      await upsertConfig.mutateAsync({ id, valor })
    } catch {
      alert('Erro ao salvar configuração')
    }
  }

  if (isLoading || configLoading) {
    return (
      <div className="p-4 lg:p-8">
        <div className="text-center py-8">Carregando...</div>
      </div>
    )
  }

  return (
    <div className="p-4 lg:p-8 space-y-6">
      <h1 className="text-2xl lg:text-3xl font-bold">Inventário</h1>

      {/* ── Estoque Físico ── */}
      <section>
        <h2 className="text-lg font-semibold mb-3 text-slate-700">Estoque Físico</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Mesas */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-base font-semibold mb-1">Mesas</h3>
            <p className="text-sm text-slate-500 mb-3">Total no estoque</p>
            <div className="text-4xl font-bold text-blue-600 mb-4">{totalMesas}</div>
            <div className="flex gap-2 items-end">
              <div className="flex-1">
                <Label htmlFor="mesa-qty">Nova quantidade</Label>
                <Input
                  id="mesa-qty"
                  type="number"
                  min="0"
                  placeholder={String(totalMesas)}
                  value={mesaQtd}
                  onChange={(e) => setMesaQtd(e.target.value)}
                />
              </div>
              <Button
                onClick={() => { if (mesaQtd) { handleSalvarEstoque('MESA', Number(mesaQtd)); setMesaQtd('') } }}
                disabled={!mesaQtd || upsert.isPending}
              >
                Salvar
              </Button>
            </div>
          </div>

          {/* Cadeiras */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-base font-semibold mb-1">Cadeiras</h3>
            <p className="text-sm text-slate-500 mb-3">Total no estoque</p>
            <div className="text-4xl font-bold text-purple-600 mb-4">{totalCadeiras}</div>
            <div className="flex gap-2 items-end">
              <div className="flex-1">
                <Label htmlFor="cadeira-qty">Nova quantidade</Label>
                <Input
                  id="cadeira-qty"
                  type="number"
                  min="0"
                  placeholder={String(totalCadeiras)}
                  value={cadeiraQtd}
                  onChange={(e) => setCadeiraQtd(e.target.value)}
                />
              </div>
              <Button
                onClick={() => { if (cadeiraQtd) { handleSalvarEstoque('CADEIRA', Number(cadeiraQtd)); setCadeiraQtd('') } }}
                disabled={!cadeiraQtd || upsert.isPending}
              >
                Salvar
              </Button>
            </div>
          </div>
        </div>

        {/* Resumo do estoque */}
        <div className="mt-4 bg-slate-50 rounded-lg p-4 grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-slate-800">{kitsCompletos}</div>
            <div className="text-xs text-slate-500 mt-1">Kits completos<br/>(1 mesa + 4 cadeiras)</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-blue-600">{mesasAvulsas}</div>
            <div className="text-xs text-slate-500 mt-1">Mesas avulsas<br/>no estoque</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-purple-600">{cadeirasAvulsas}</div>
            <div className="text-xs text-slate-500 mt-1">Cadeiras avulsas<br/>no estoque</div>
          </div>
        </div>
      </section>

      {/* ── Disponível Agora ── */}
      <section>
        <h2 className="text-lg font-semibold mb-3 text-slate-700">Disponível Hoje</h2>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-slate-500 mb-4">Kits disponíveis para locação hoje, descontando pedidos ativos.</p>
          <div className="flex items-center gap-6">
            <div>
              <div className={`text-4xl font-bold ${kitsDisponiveisHoje === 0 ? 'text-red-600' : kitsDisponiveisHoje !== undefined && kitsDisponiveisHoje < 5 ? 'text-orange-500' : 'text-green-600'}`}>
                {kitsDisponiveisHoje ?? '—'}
              </div>
              <div className="text-xs text-slate-500 mt-1">kits disponíveis</div>
            </div>
            {kitsDisponiveisHoje !== undefined && kitsDisponiveisHoje > 0 && (
              <div className="text-sm text-slate-600">
                = {kitsDisponiveisHoje} mesa{kitsDisponiveisHoje !== 1 ? 's' : ''} + {kitsDisponiveisHoje * 4} cadeira{kitsDisponiveisHoje * 4 !== 1 ? 's' : ''}
              </div>
            )}
            {kitsDisponiveisHoje === 0 && (
              <div className="text-sm text-red-600 font-medium">Sem kits disponíveis hoje</div>
            )}
          </div>
        </div>
      </section>

      {/* ── Próximos Pedidos ── */}
      {proximosPedidos.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold mb-3 text-slate-700">Próximos Pedidos</h2>
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="divide-y">
              {proximosPedidos.map((pedido: any) => {
                const inicio = new Date(pedido.data_inicio)
                const fim = new Date(pedido.data_fim)
                const diasAte = Math.ceil((inicio.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24))
                return (
                  <div key={pedido.id} className="p-4 flex items-center justify-between">
                    <div>
                      <div className="font-medium text-sm">{pedido.nome_solicitante}</div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        {formatarData(inicio)}
                        {inicio.getTime() !== fim.getTime() && <> até {formatarData(fim)}</>}
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="font-bold text-slate-800">{pedido.quantidade} kits</div>
                        <div className="text-xs text-slate-400">
                          {diasAte === 1 ? 'amanhã' : `em ${diasAte} dias`}
                        </div>
                      </div>
                      <div className={`w-2 h-8 rounded-full ${diasAte <= 3 ? 'bg-orange-400' : 'bg-blue-400'}`} />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </section>
      )}

      {/* ── Configurações ── */}
      <section>
        <h2 className="text-lg font-semibold mb-3 text-slate-700">Configurações</h2>
        <div className="bg-white rounded-lg shadow p-6 space-y-5">

          {/* Quantidade mínima */}
          <div>
            <Label htmlFor="qtd-min">Quantidade mínima de kits por pedido</Label>
            <p className="text-xs text-slate-500 mb-2">O cliente não poderá pedir menos do que isso.</p>
            <div className="flex gap-2 items-end max-w-xs">
              <Input
                id="qtd-min"
                type="number"
                min="1"
                placeholder={String(config?.qtd_minima_pedido ?? 3)}
                value={qtdMinima}
                onChange={(e) => setQtdMinima(e.target.value)}
              />
              <Button
                onClick={() => { if (qtdMinima) { handleSalvarConfig('qtd_minima_pedido', qtdMinima); setQtdMinima('') } }}
                disabled={!qtdMinima || upsertConfig.isPending}
              >
                Salvar
              </Button>
            </div>
            <p className="text-xs text-slate-400 mt-1">Atual: <strong>{config?.qtd_minima_pedido ?? 3}</strong></p>
          </div>

          <div className="border-t pt-5">
            <Label htmlFor="preco-kit">Preço por kit (1 mesa + 4 cadeiras) (R$)</Label>
            <p className="text-xs text-slate-500 mb-2">Valor cobrado por kit locado.</p>
            <div className="flex gap-2 items-end max-w-xs mt-1">
              <Input
                id="preco-kit"
                type="number"
                min="0"
                step="0.01"
                placeholder={String(config?.preco_kit ?? 0)}
                value={precoKit}
                onChange={(e) => setPrecoKit(e.target.value)}
              />
              <Button
                onClick={() => { if (precoKit !== '') { handleSalvarConfig('preco_kit', precoKit); setPrecoKit('') } }}
                disabled={precoKit === '' || upsertConfig.isPending}
              >
                Salvar
              </Button>
            </div>
            <p className="text-xs text-slate-400 mt-1">Atual: <strong>R$ {(config?.preco_kit ?? 0).toFixed(2)}</strong></p>
          </div>

          <div className="border-t pt-5">
            <p className="text-sm font-medium text-slate-700 mb-4">Preços de itens avulsos</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Preço mesa avulsa */}
              <div>
                <Label htmlFor="preco-mesa">Preço por mesa avulsa (R$)</Label>
                <div className="flex gap-2 items-end mt-1">
                  <Input
                    id="preco-mesa"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder={String(config?.preco_mesa_avulsa ?? 0)}
                    value={precoMesa}
                    onChange={(e) => setPrecoMesa(e.target.value)}
                  />
                  <Button
                    onClick={() => { if (precoMesa !== '') { handleSalvarConfig('preco_mesa_avulsa', precoMesa); setPrecoMesa('') } }}
                    disabled={precoMesa === '' || upsertConfig.isPending}
                  >
                    Salvar
                  </Button>
                </div>
                <p className="text-xs text-slate-400 mt-1">Atual: <strong>R$ {(config?.preco_mesa_avulsa ?? 0).toFixed(2)}</strong></p>
              </div>

              {/* Preço cadeira avulsa */}
              <div>
                <Label htmlFor="preco-cadeira">Preço por cadeira avulsa (R$)</Label>
                <div className="flex gap-2 items-end mt-1">
                  <Input
                    id="preco-cadeira"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder={String(config?.preco_cadeira_avulsa ?? 0)}
                    value={precoCadeira}
                    onChange={(e) => setPrecoCadeira(e.target.value)}
                  />
                  <Button
                    onClick={() => { if (precoCadeira !== '') { handleSalvarConfig('preco_cadeira_avulsa', precoCadeira); setPrecoCadeira('') } }}
                    disabled={precoCadeira === '' || upsertConfig.isPending}
                  >
                    Salvar
                  </Button>
                </div>
                <p className="text-xs text-slate-400 mt-1">Atual: <strong>R$ {(config?.preco_cadeira_avulsa ?? 0).toFixed(2)}</strong></p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
