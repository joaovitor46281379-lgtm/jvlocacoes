import { useState, useRef } from 'react'
import { usePedidos } from '@shared/hooks/use-pedidos'
import { useConfiguracoes } from '@shared/hooks/use-configuracoes'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Printer, Receipt, FileDown, Loader2 } from 'lucide-react'
import { baixarPdfDeElemento } from '@/lib/gerar-pdf'
import { formatarData, formatarValor } from '@shared/lib/validations'
import { ReciboTermico } from '@/components/ReciboTermico'
import { DocumentoInput, type TipoDocumento } from '@/components/DocumentoInput'

type ModoImpressao = 'a4' | 'termico'

// ─── Conversão de valor por extenso ───────────────────────────────────────────

const unidades = ['', 'um', 'dois', 'três', 'quatro', 'cinco', 'seis', 'sete', 'oito', 'nove',
  'dez', 'onze', 'doze', 'treze', 'quatorze', 'quinze', 'dezesseis', 'dezessete', 'dezoito', 'dezenove']
const dezenas = ['', '', 'vinte', 'trinta', 'quarenta', 'cinquenta', 'sessenta', 'setenta', 'oitenta', 'noventa']
const centenas = ['', 'cento', 'duzentos', 'trezentos', 'quatrocentos', 'quinhentos',
  'seiscentos', 'setecentos', 'oitocentos', 'novecentos']

function centenasPorExtenso(n: number): string {
  if (n === 0) return ''
  if (n === 100) return 'cem'
  const c = Math.floor(n / 100)
  const resto = n % 100
  const partes: string[] = []
  if (c > 0) partes.push(centenas[c])
  if (resto < 20) {
    if (unidades[resto]) partes.push(unidades[resto])
  } else {
    const d = Math.floor(resto / 10)
    const u = resto % 10
    if (dezenas[d]) partes.push(dezenas[d])
    if (unidades[u]) partes.push(unidades[u])
  }
  return partes.join(' e ')
}

function valorPorExtenso(valor: number): string {
  if (!valor || valor <= 0) return 'zero reais'
  const inteiro = Math.floor(valor)
  const centavosRaw = Math.round((valor - inteiro) * 100)
  const partes: string[] = []

  const milhar = Math.floor(inteiro / 1000)
  const resto = inteiro % 1000

  if (milhar > 0) {
    const ext = centenasPorExtenso(milhar)
    partes.push(milhar === 1 ? 'mil' : `${ext} mil`)
  }
  if (resto > 0) {
    partes.push(centenasPorExtenso(resto))
  }
  if (inteiro === 0) partes.push('zero')

  const realStr = inteiro === 1 ? 'real' : 'reais'
  let resultado = partes.filter(Boolean).join(' e ') + ` ${realStr}`

  if (centavosRaw > 0) {
    const centExt = centavosRaw < 20
      ? unidades[centavosRaw]
      : dezenas[Math.floor(centavosRaw / 10)] + (centavosRaw % 10 ? ' e ' + unidades[centavosRaw % 10] : '')
    const centStr = centavosRaw === 1 ? 'centavo' : 'centavos'
    resultado += ` e ${centExt} ${centStr}`
  }

  return resultado
}

// ─────────────────────────────────────────────────────────────────────────────

const meses = [
  'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
  'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'
]

export function RecibosPage() {
  const [selectedPedidoId, setSelectedPedidoId] = useState('')
  const [itensLocados, setItensLocados] = useState('')
  const [tipoDoc, setTipoDoc] = useState<TipoDocumento>('CPF')
  const [docPagador, setDocPagador] = useState('')
  const [printMode, setPrintMode] = useState<ModoImpressao | null>(null)
  const printRef = useRef<HTMLDivElement>(null)

  // Pedidos mais recentes primeiro (por data de criação). Inclui PENDENTE, que é o status
  // dos pedidos com entrega fora da semana atual; só os cancelados ficam de fora.
  const { data: pedidosData, isLoading } = usePedidos(
    { status: ['PENDENTE', 'AGUARDANDO_ENTREGA', 'AGUARDANDO_RETIRADA', 'CONCLUIDO'] },
    { limit: 300, sortBy: 'created_at', sortOrder: 'desc' }
  )
  const { data: configuracoes } = useConfiguracoes()

  const pedidos = pedidosData?.data || []
  const selectedPedido: any = pedidos.find((p: any) => p.id === selectedPedidoId)

  const cpfLocador = configuracoes?.cpf_locador || ''
  const nomeLocador = configuracoes?.nome_locador || 'JV Locações'

  const dataAtual = new Date()
  const dataExtenso = `Piraquara, ${dataAtual.getDate()} de ${meses[dataAtual.getMonth()]} de ${dataAtual.getFullYear()}`

  const handleImprimir = (modo: ModoImpressao) => {
    setPrintMode(modo)
    // Aguarda o componente renderizar antes de abrir a impressão
    setTimeout(() => {
      window.print()
      setPrintMode(null)
    }, 300)
  }

  const [gerandoPdf, setGerandoPdf] = useState(false)

  const handleBaixarPdf = async () => {
    if (!printRef.current || !selectedPedido) return
    setGerandoPdf(true)
    try {
      const nomeCliente = String(selectedPedido.nome_solicitante || 'cliente')
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .replace(/[^a-zA-Z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
        .toLowerCase()
      await baixarPdfDeElemento(
        printRef.current,
        `recibo-${selectedPedido.id.substring(0, 8)}-${nomeCliente}.pdf`
      )
    } catch (err) {
      console.error('Erro ao gerar PDF do recibo:', err)
      window.alert('Não foi possível gerar o PDF. Tente novamente.')
    } finally {
      setGerandoPdf(false)
    }
  }

  const valorTotal = selectedPedido?.total ? Number(selectedPedido.total) : 0

  function montarDescricaoItens(pedido: any): string {
    const qtdKits = Number(pedido.quantidade ?? 0)
    const qtdMesas = Number(pedido.mesas_avulsas ?? 0)
    const qtdCadeiras = Number(pedido.cadeiras_avulsas ?? 0)

    const temKits = qtdKits > 0

    const partes: string[] = []

    if (temKits) {
      partes.push(`${qtdKits} kit${qtdKits !== 1 ? 's' : ''} completo${qtdKits !== 1 ? 's' : ''}`)
    }

    if (qtdMesas > 0) {
      partes.push(`${qtdMesas} mesa${qtdMesas !== 1 ? 's' : ''} avulsa${qtdMesas !== 1 ? 's' : ''}`)
    }

    if (qtdCadeiras > 0) {
      partes.push(`${qtdCadeiras} cadeira${qtdCadeiras !== 1 ? 's' : ''} avulsa${qtdCadeiras !== 1 ? 's' : ''}`)
    }

    return partes.join(', ')
  }

  // Ao escolher um pedido, o campo de itens já vem com kits/mesas/cadeiras do pedido (editável)
  const handleSelecionarPedido = (id: string) => {
    setSelectedPedidoId(id)
    const pedido = pedidos.find((p: any) => p.id === id)
    setItensLocados(pedido ? montarDescricaoItens(pedido) : '')
  }

  const textoRecibo = selectedPedido
    ? `Recebemos de ${selectedPedido.nome_solicitante}${docPagador ? `, ${tipoDoc} ${docPagador}` : ''}, a quantia de ${formatarValor(valorTotal)} (${valorPorExtenso(valorTotal)}), referente à locação de ${itensLocados.trim() || 'itens locados'}.`
    : ''

  return (
    <div className="p-4 lg:p-8">
      <h1 className="text-2xl lg:text-3xl font-bold mb-6">Gerar Recibo</h1>

      {/* Seletor de pedido */}
      <div className="bg-white rounded-lg shadow p-4 lg:p-6 mb-6 no-print">
        <h2 className="text-base lg:text-lg font-semibold mb-4">Selecione um Pedido</h2>
        {isLoading ? (
          <div>Carregando pedidos...</div>
        ) : (
          <Select value={selectedPedidoId} onValueChange={handleSelecionarPedido}>
            <SelectTrigger className="w-full lg:w-96">
              <SelectValue placeholder="Selecione um pedido" />
            </SelectTrigger>
            <SelectContent>
              {pedidos.map((pedido: any) => (
                <SelectItem key={pedido.id} value={pedido.id}>
                  #{pedido.id.substring(0, 8)} - {pedido.nome_solicitante} -{' '}
                  {formatarData(new Date(pedido.data_inicio))}
                  {pedido.status === 'PENDENTE' ? ' (Pendente)' : ''}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Itens locados */}
      {selectedPedido && (
        <div className="bg-white rounded-lg shadow p-4 lg:p-6 mb-6 no-print">
          <h2 className="text-base lg:text-lg font-semibold mb-4">Itens locados</h2>
          <textarea
            value={itensLocados}
            onChange={(e) => setItensLocados(e.target.value)}
            rows={2}
            placeholder="Ex: 5 mesas, 20 cadeiras e 1 caixa de som"
            className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
          />
          <p className="text-xs text-slate-500 mt-1">
            Já vem preenchido com os kits, mesas e cadeiras do pedido. Edite ou escreva o que quiser;
            se ficar vazio, o recibo mostra apenas "itens locados".
          </p>
        </div>
      )}

      {/* CPF / CNPJ do cliente */}
      {selectedPedido && (
        <div className="bg-white rounded-lg shadow p-4 lg:p-6 mb-6 no-print">
          <h2 className="text-base lg:text-lg font-semibold mb-4">CPF / CNPJ do cliente</h2>
          <div className="max-w-sm">
            <DocumentoInput
              tipo={tipoDoc}
              valor={docPagador}
              onTipoChange={setTipoDoc}
              onValorChange={setDocPagador}
              label="Documento (opcional)"
            />
          </div>
        </div>
      )}

      {/* Botões de impressão */}
      {selectedPedido && (
        <div className="flex flex-wrap justify-end gap-2 mb-6 no-print">
          <Button variant="outline" onClick={handleBaixarPdf} disabled={gerandoPdf}>
            {gerandoPdf ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <FileDown className="h-4 w-4 mr-2" />
            )}
            {gerandoPdf ? 'Gerando...' : 'Baixar PDF'}
          </Button>
          <Button variant="outline" onClick={() => handleImprimir('a4')}>
            <Printer className="h-4 w-4 mr-2" />
            Imprimir A4
          </Button>
          <Button onClick={() => handleImprimir('termico')}>
            <Printer className="h-4 w-4 mr-2" />
            Imprimir Térmico
          </Button>
        </div>
      )}

      {/* ── RECIBO (visível na tela e no print) ── */}
      {selectedPedido && (
        <>
          {/* Estilo A4 só vale quando não estiver imprimindo no térmico (@page conflitaria) */}
          {printMode !== 'termico' && (
            <style>{`
              @media print {
                body * { visibility: hidden !important; }
                .recibo-doc, .recibo-doc * { visibility: visible !important; }
                .recibo-doc { position: fixed; top: 0; left: 0; width: 100%; padding: 20mm; }
                .no-print { display: none !important; }
              }
              @page { size: A4; margin: 20mm; }
            `}</style>
          )}

          {printMode === 'termico' && (
            <ReciboTermico
              numero={selectedPedido.id.substring(0, 8).toUpperCase()}
              texto={textoRecibo}
              dataEntrega={formatarData(new Date(selectedPedido.data_inicio))}
              dataDevolucao={formatarData(new Date(selectedPedido.data_fim))}
              endereco={selectedPedido.endereco}
              formaPagamento={selectedPedido.forma_pagamento || selectedPedido.formaPagamento}
              dataExtenso={dataExtenso}
              dataEmissao={formatarData(new Date())}
              nomeLocador={nomeLocador}
              cpfLocador={cpfLocador || undefined}
              tipoDocPagador={tipoDoc}
              docPagador={docPagador || undefined}
            />
          )}

          <div ref={printRef} className="recibo-doc bg-white rounded-lg shadow p-6 lg:p-10 max-w-2xl mx-auto" style={{ fontFamily: 'Times New Roman, serif' }}>
            {/* Cabeçalho */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
              <img src="/admin/logo.jpeg" alt="JV Locações" style={{ width: 64, height: 64, objectFit: 'contain', borderRadius: 8 }} />
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontWeight: 'bold', fontSize: 15 }}>{nomeLocador}</div>
                <div style={{ fontSize: 12, color: '#555' }}>Piraquara – PR</div>
              </div>
            </div>

            <hr style={{ borderTop: '2px solid #000', marginBottom: 16 }} />

            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 4 }}>
                <Receipt style={{ width: 18, height: 18 }} />
                <h2 style={{ fontSize: 16, fontWeight: 'bold', textTransform: 'uppercase', margin: 0 }}>Recibo de Pagamento</h2>
              </div>
              <div style={{ fontSize: 11, color: '#666' }}>Nº {selectedPedido.id.substring(0, 8).toUpperCase()}</div>
            </div>

            {/* Texto principal */}
            <div style={{ fontSize: 13, lineHeight: 1.8, marginBottom: 24, textAlign: 'justify', border: '1px solid #ddd', borderRadius: 6, padding: '16px 20px', background: '#fafafa' }}>
              {textoRecibo}
            </div>

            {/* Detalhes */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 24px', fontSize: 12, marginBottom: 24 }}>
              {docPagador && <div><span style={{ color: '#666' }}>{tipoDoc}:</span> <strong>{docPagador}</strong></div>}
              <div><span style={{ color: '#666' }}>Período de entrega:</span> <strong>{formatarData(new Date(selectedPedido.data_inicio))}</strong></div>
              <div><span style={{ color: '#666' }}>Devolução:</span> <strong>{formatarData(new Date(selectedPedido.data_fim))}</strong></div>
              <div><span style={{ color: '#666' }}>Endereço:</span> <strong>{selectedPedido.endereco}</strong></div>
              <div><span style={{ color: '#666' }}>Forma de pagamento:</span> <strong>{selectedPedido.forma_pagamento || selectedPedido.formaPagamento}</strong></div>
            </div>

            <hr style={{ borderTop: '1px solid #ccc', margin: '20px 0' }} />

            {/* Data e local */}
            <div style={{ textAlign: 'right', fontSize: 12, fontStyle: 'italic', marginBottom: 32 }}>
              {dataExtenso}
            </div>

            {/* Assinatura (somente do locador) */}
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: 8 }}>
              <div style={{ width: '60%', textAlign: 'center' }}>
                <div style={{ height: 40 }} />
                <div style={{ borderTop: '1px solid #000', paddingTop: 6, fontSize: 12 }}>
                  <div style={{ fontWeight: 'bold' }}>{nomeLocador}</div>
                  <div style={{ color: '#555' }}>Locador</div>
                  {cpfLocador && <div>CPF: {cpfLocador}</div>}
                </div>
              </div>
            </div>

            <hr style={{ borderTop: '1px solid #eee', marginTop: 24 }} />
            <div style={{ fontSize: 9, color: '#999', textAlign: 'center', marginTop: 6 }}>
              Documento gerado em {formatarData(new Date())} — JV Locações
            </div>
          </div>
        </>
      )}

      {!selectedPedido && !isLoading && (
        <div className="text-center py-16 text-slate-400">
          <Receipt className="h-12 w-12 mx-auto mb-3 opacity-20" />
          <p>Selecione um pedido para gerar o recibo.</p>
        </div>
      )}
    </div>
  )
}
