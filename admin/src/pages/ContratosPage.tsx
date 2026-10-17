import { useState, useRef } from 'react'
import { usePedidos } from '@shared/hooks/use-pedidos'
import { usePerdasQuebrasPorPedido } from '@shared/hooks/use-perdas-quebras'
import { useConfiguracoes } from '@shared/hooks/use-configuracoes'
import { Button } from '@/components/ui/button'
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
import { FileText, Download, Eye, Printer, FileDown, Loader2 } from 'lucide-react'
import { baixarPdfDeElemento } from '@/lib/gerar-pdf'
import { formatarData, formatarValor, VALOR_REPOSICAO_MESA, VALOR_REPOSICAO_CADEIRA } from '@shared/lib/validations'
import { ContratoA4 } from '@/components/ContratoA4'
import { ContratoTermico } from '@/components/ContratoTermico'
import { DocumentoInput, type TipoDocumento } from '@/components/DocumentoInput'

type ModoImpressao = 'a4' | 'termico'

export function ContratosPage() {
  const [selectedPedidoId, setSelectedPedidoId] = useState('')
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const [cpfLocatario, setCpfLocatario] = useState('')
  const [tipoDocLocatario, setTipoDocLocatario] = useState<TipoDocumento>('CPF')
  const [printMode, setPrintMode] = useState<ModoImpressao | null>(null)
  const printRef = useRef<HTMLDivElement>(null)
  const pdfRef = useRef<HTMLDivElement>(null)
  const [gerandoPdf, setGerandoPdf] = useState(false)

  // Pedidos mais recentes primeiro (por data de criação). Inclui PENDENTE, que é o status
  // dos pedidos com entrega fora da semana atual; só os cancelados ficam de fora.
  const { data: pedidosData, isLoading } = usePedidos(
    { status: ['PENDENTE', 'AGUARDANDO_ENTREGA', 'AGUARDANDO_RETIRADA', 'CONCLUIDO'] },
    { limit: 300, sortBy: 'created_at', sortOrder: 'desc' }
  )
  const { data: perdas } = usePerdasQuebrasPorPedido(selectedPedidoId)
  const { data: configuracoes } = useConfiguracoes()

  const pedidos = pedidosData?.data || []
  const selectedPedido: any = pedidos.find((p: any) => p.id === selectedPedidoId)
  const perdasLista = perdas || []

  // Dados do locador vindos das configurações (se existirem)
  const cpfLocador = (configuracoes as any)?.cpf_locador || ''
  const nomeLocador = (configuracoes as any)?.nome_locador || 'JV Locações'

  const gerarConteudoContrato = () => {
    if (!selectedPedido) return ''

    const totalPrejuizo = perdasLista.reduce((acc: number, p: any) => acc + (p.valorPrejuizo || 0), 0)

    return `
CONTRATO DE LOCAÇÃO DE MESAS E CADEIRAS
JV LOCAÇÕES

===========================================

DADOS DO PEDIDO
Número: #${selectedPedido.id.substring(0, 8)}
Data do Pedido: ${formatarData(new Date(selectedPedido.created_at))}

LOCATÁRIO
Nome: ${selectedPedido.nome_solicitante}
WhatsApp: ${selectedPedido.whatsapp}
Endereço: ${selectedPedido.endereco}
${cpfLocatario ? `${tipoDocLocatario}: ${cpfLocatario}` : ''}

PERÍODO DA LOCAÇÃO
Entrega: ${formatarData(new Date(selectedPedido.data_inicio))}
Devolução: ${formatarData(new Date(selectedPedido.data_fim))}

ITENS LOCADOS
Kit: ${selectedPedido.kit?.descricao || 'N/A'}
Quantidade: ${selectedPedido.quantidade} kits
Valor Total: ${formatarValor(selectedPedido.total)}

${perdasLista.length > 0 ? `
===========================================
REGISTRO DE DANOS/PERDAS

${perdasLista.map((p: any) => `- ${p.tipo}: ${p.quantidade} ${p.item}(s) ${p.descricao ? `(${p.descricao})` : ''} - ${p.valorPrejuizo ? formatarValor(p.valorPrejuizo) : 'A definir'}`).join('\n')}

TOTAL DE PREJUÍZO: ${formatarValor(totalPrejuizo)}
` : ''}
===========================================

TERMOS E CONDIÇÕES

1. O LOCATÁRIO se compromete a devolver os itens nas mesmas condições em que foram entregues.

2. Em caso de perda ou dano aos itens locados, o LOCATÁRIO se responsabiliza pelo pagamento do valor correspondente.

3. Valores para reposição:
   - Mesa: ${formatarValor(VALOR_REPOSICAO_MESA)}
   - Cadeira: ${formatarValor(VALOR_REPOSICAO_CADEIRA)}

4. O não pagamento dos valores devidos pode resultar em medidas legais cabíveis.

===========================================

ASSINATURAS

_______________________________
LOCATÁRIO: ${selectedPedido.nome_solicitante}
Data: ___/___/______


_______________________________
JV LOCAÇÕES
Data: ___/___/______

===========================================
Documento gerado em: ${formatarData(new Date())}
    `.trim()
  }

  const handleDownloadTxt = () => {
    if (!selectedPedido) return
    const conteudo = gerarConteudoContrato()
    const blob = new Blob([conteudo], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `contrato-${selectedPedido.id.substring(0, 8)}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleBaixarPdf = async () => {
    if (!selectedPedido) return
    setGerandoPdf(true)
    try {
      // Aguarda o contrato (renderizado fora da tela) montar antes de capturar
      await new Promise((r) => setTimeout(r, 300))
      if (!pdfRef.current) throw new Error('Contrato não renderizado')
      const nomeCliente = String(selectedPedido.nome_solicitante || 'cliente')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-zA-Z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
        .toLowerCase()
      await baixarPdfDeElemento(
        pdfRef.current,
        `contrato-${selectedPedido.id.substring(0, 8)}-${nomeCliente}.pdf`
      )
    } catch (err) {
      console.error('Erro ao gerar PDF do contrato:', err)
      window.alert('Não foi possível gerar o PDF. Tente novamente.')
    } finally {
      setGerandoPdf(false)
    }
  }

  const handleImprimir = (modo: ModoImpressao) => {
    setPrintMode(modo)
    // Aguarda o componente renderizar antes de imprimir
    setTimeout(() => {
      window.print()
      setPrintMode(null)
    }, 300)
  }

  const pedidoMapeado = selectedPedido
    ? {
        ...selectedPedido,
        nomeSolicitante: selectedPedido.nome_solicitante,
        dataInicio: selectedPedido.data_inicio,
        dataFim: selectedPedido.data_fim,
        valorKit: selectedPedido.valor_kit,
        valorFrete: selectedPedido.valor_frete,
        valorAvulsos: selectedPedido.valor_avulsos || 0,
        mesasAvulsas: selectedPedido.mesas_avulsas || 0,
        cadeirasAvulsas: selectedPedido.cadeiras_avulsas || 0,
      }
    : null

  return (
    <div className="p-4 lg:p-8">
      <h1 className="text-2xl lg:text-3xl font-bold mb-6">Gerar Contratos</h1>

      {/* Seletor de pedido */}
      <div className="bg-white rounded-lg shadow p-4 lg:p-6 mb-6">
        <h2 className="text-base lg:text-lg font-semibold mb-4">Selecione um Pedido</h2>

        {isLoading ? (
          <div>Carregando pedidos...</div>
        ) : (
          <Select value={selectedPedidoId} onValueChange={setSelectedPedidoId}>
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

      {/* Campo CPF do locatário */}
      {selectedPedido && (
        <div className="bg-white rounded-lg shadow p-4 lg:p-6 mb-6">
          <h2 className="text-base lg:text-lg font-semibold mb-4">Dados Adicionais</h2>
          <div className="max-w-xs">
            <DocumentoInput
              tipo={tipoDocLocatario}
              valor={cpfLocatario}
              onTipoChange={setTipoDocLocatario}
              onValorChange={setCpfLocatario}
              label={`${tipoDocLocatario} do Locatário (opcional)`}
            />
          </div>
        </div>
      )}

      {/* Preview do pedido selecionado */}
      {selectedPedido && (
        <div className="bg-white rounded-lg shadow p-4 lg:p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
            <h2 className="text-base lg:text-lg font-semibold">
              Pedido #{selectedPedido.id.substring(0, 8)}
            </h2>
            <div className="flex flex-wrap gap-2 w-full sm:w-auto">
              <Button variant="outline" onClick={() => setIsPreviewOpen(true)} className="flex-1 sm:flex-none">
                <Eye className="h-4 w-4 mr-2" />
                Visualizar
              </Button>
              <Button variant="outline" onClick={handleDownloadTxt} className="flex-1 sm:flex-none">
                <Download className="h-4 w-4 mr-2" />
                Baixar .txt
              </Button>
              <Button variant="outline" onClick={handleBaixarPdf} disabled={gerandoPdf} className="flex-1 sm:flex-none">
                {gerandoPdf ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <FileDown className="h-4 w-4 mr-2" />}
                {gerandoPdf ? 'Gerando...' : 'Baixar PDF'}
              </Button>
              <Button variant="outline" onClick={() => handleImprimir('a4')} className="flex-1 sm:flex-none">
                <Printer className="h-4 w-4 mr-2" />
                Imprimir A4
              </Button>
              <Button onClick={() => handleImprimir('termico')} className="flex-1 sm:flex-none">
                <Printer className="h-4 w-4 mr-2" />
                Imprimir Térmico
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-slate-500">Cliente:</span>
              <div className="font-medium">{selectedPedido.nome_solicitante}</div>
            </div>
            <div>
              <span className="text-slate-500">WhatsApp:</span>
              <div className="font-medium">{selectedPedido.whatsapp}</div>
            </div>
            <div>
              <span className="text-slate-500">Período:</span>
              <div className="font-medium">
                {formatarData(new Date(selectedPedido.data_inicio))} até{' '}
                {formatarData(new Date(selectedPedido.data_fim))}
              </div>
            </div>
            <div>
              <span className="text-slate-500">Kit:</span>
              <div className="font-medium">
                {selectedPedido.kit?.descricao || 'N/A'}
              </div>
            </div>
            <div>
              <span className="text-slate-500">Quantidade:</span>
              <div className="font-medium">{selectedPedido.quantidade} kits</div>
            </div>
            <div>
              <span className="text-slate-500">Valor Total:</span>
              <div className="font-medium text-green-600">
                {formatarValor(selectedPedido.total)}
              </div>
            </div>
          </div>

          {/* Perdas/Quebras associadas */}
          {perdasLista.length > 0 && (
            <div className="mt-6 pt-6 border-t">
              <h3 className="font-semibold text-red-600 mb-3">
                Danos/Perdas Registrados
              </h3>
              <div className="space-y-2">
                {perdasLista.map((perda: any) => (
                  <div
                    key={perda.id}
                    className="flex justify-between items-center bg-red-50 p-3 rounded-lg"
                  >
                    <div>
                      <span className="font-medium">{perda.tipo}</span>:{' '}
                      {perda.quantidade} {perda.item}(s)
                      {perda.descricao && (
                        <span className="text-slate-500"> - {perda.descricao}</span>
                      )}
                    </div>
                    <div className="font-semibold text-red-600">
                      {perda.valorPrejuizo
                        ? formatarValor(perda.valorPrejuizo)
                        : 'A definir'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Componentes de impressão — ficam ocultos na tela, visíveis só no print */}
      {pedidoMapeado && printMode === 'a4' && (
        <div ref={printRef} className="hidden print:block">
          <ContratoA4
            pedido={pedidoMapeado as any}
            perdas={perdasLista as any}
            cpfLocatario={cpfLocatario || undefined}
            tipoDocLocatario={tipoDocLocatario}
            cpfLocador={cpfLocador || undefined}
            nomeLocador={nomeLocador || undefined}
          />
        </div>
      )}
      {pedidoMapeado && printMode === 'termico' && (
        <div ref={printRef} className="hidden print:block">
          <ContratoTermico
            pedido={pedidoMapeado as any}
            perdas={perdasLista as any}
            cpfLocatario={cpfLocatario || undefined}
            tipoDocLocatario={tipoDocLocatario}
            cpfLocador={cpfLocador || undefined}
            nomeLocador={nomeLocador || undefined}
          />
        </div>
      )}

      {/* Contrato A4 renderizado fora da tela, usado apenas para gerar o PDF */}
      {pedidoMapeado && gerandoPdf && (
        <div style={{ position: 'fixed', left: -10000, top: 0, width: 794, background: '#fff' }} aria-hidden="true">
          <div ref={pdfRef} style={{ width: 794, background: '#fff' }}>
            <ContratoA4
              pedido={pedidoMapeado as any}
              perdas={perdasLista as any}
              cpfLocatario={cpfLocatario || undefined}
              tipoDocLocatario={tipoDocLocatario}
              cpfLocador={cpfLocador || undefined}
              nomeLocador={nomeLocador || undefined}
            />
          </div>
        </div>
      )}

      {/* Modal de preview (texto) */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Preview do Contrato
            </DialogTitle>
          </DialogHeader>

          <pre className="bg-slate-50 p-4 rounded-lg text-sm whitespace-pre-wrap font-mono">
            {gerarConteudoContrato()}
          </pre>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsPreviewOpen(false)}>
              Fechar
            </Button>
            <Button variant="outline" onClick={handleDownloadTxt}>
              <Download className="h-4 w-4 mr-2" />
              Baixar .txt
            </Button>
            <Button onClick={handleBaixarPdf} disabled={gerandoPdf}>
              <FileDown className="h-4 w-4 mr-2" />
              {gerandoPdf ? 'Gerando...' : 'Baixar PDF'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
