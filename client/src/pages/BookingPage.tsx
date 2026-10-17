import { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ArrowLeft, Package, MapPin, CreditCard, Check, MessageCircle, Edit2, Calendar } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useKits, useVilas, useConfirmarPedido } from '@shared/hooks'
import { usePerfil, useUpsertPerfil } from '@shared/hooks/use-perfil'
import { formatarData, formatarValor } from '@shared/lib/validations'

// Schema de validação para o formulário
const bookingSchema = z.object({
  nomeSolicitante: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres'),
  whatsapp: z.string().regex(/^\(\d{2}\)\s\d{4,5}-\d{4}$/, 'Formato inválido. Use (XX) XXXXX-XXXX'),
  endereco: z.string().min(10, 'Endereço deve ter no mínimo 10 caracteres'),
  vilaId: z.string().uuid('Selecione uma vila'),
  kitId: z.string().uuid('Selecione um kit'),
  quantidade: z.number().min(3, 'Mínimo 3').max(50, 'Máximo 50'),
  formaPagamento: z.enum(['PIX', 'DINHEIRO', 'CARTAO'] as const),
  dataInicio: z.string().min(1, 'Selecione a data de início'),
  dataFim: z.string().min(1, 'Selecione a data de devolução'),
  observacoes: z.string().max(500, 'Máximo 500 caracteres').optional(),
}).refine((data) => new Date(data.dataFim) > new Date(data.dataInicio), {
  message: 'Data de devolução deve ser após a data de início',
  path: ['dataFim'],
})

type BookingFormData = z.infer<typeof bookingSchema>

export default function BookingPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuth()

  // Dados vindos da HomePage
  const dataInicio = location.state?.dataInicio || new Date()
  const dataFim = location.state?.dataFim || new Date()
  const quantidadeInicial = location.state?.quantidade || 3
  const kitIdInicial = location.state?.kitId || ''
  const enderecoInicial = location.state?.endereco || ''
  const vilaIdInicial = location.state?.vilaId || ''

  // Se não há dados da HomePage, redirecionar
  const hasStateData = location.state?.dataInicio && location.state?.kitId

  const [showPreview, setShowPreview] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [createdPedido, setCreatedPedido] = useState<any>(null)
  const [previewData, setPreviewData] = useState<BookingFormData | null>(null)
  const [previewTotal, setPreviewTotal] = useState<number>(0)

  // Buscar kits e vilas
  const { data: kits, isLoading: loadingKits } = useKits(true)
  const { data: vilas, isLoading: loadingVilas } = useVilas(true)

  const kitsArray = Array.isArray(kits) ? kits : []
  const vilasArray = Array.isArray(vilas) ? vilas : []

  const confirmarPedidoMutation = useConfirmarPedido()
  const { data: perfil } = usePerfil(user?.id || '')
  const upsertPerfil = useUpsertPerfil()

  const form = useForm<BookingFormData>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      nomeSolicitante: '',
      whatsapp: '',
      endereco: enderecoInicial,
      vilaId: vilaIdInicial,
      kitId: kitIdInicial,
      quantidade: quantidadeInicial,
      formaPagamento: 'PIX',
      dataInicio: dataInicio instanceof Date ? dataInicio.toISOString().split('T')[0] : new Date(dataInicio).toISOString().split('T')[0],
      dataFim: dataFim instanceof Date ? dataFim.toISOString().split('T')[0] : new Date(dataFim).toISOString().split('T')[0],
      observacoes: '',
    },
  })

  // Pré-preencher nome e whatsapp do perfil quando disponível
  useEffect(() => {
    if (perfil) {
      form.setValue('nomeSolicitante', perfil.nome)
      form.setValue('whatsapp', perfil.whatsapp)
    }
  }, [perfil, form])

  // Observar mudanças nos campos para calcular total
  const kitId = form.watch('kitId')
  const vilaId = form.watch('vilaId')
  const quantidade = form.watch('quantidade') || 1

  const selectedKit = kitsArray.find(k => k.id === kitId)
  const selectedVila = vilasArray.find(v => v.id === vilaId)

  // O Supabase retorna valor_frete (snake_case)
  const vilaFreteAtual = selectedVila ? ((selectedVila as any).valor_frete ?? selectedVila.valorFrete ?? 0) : 0

  const valorKit = selectedKit ? Number(selectedKit.valor) * quantidade : 0
  const valorFrete = Number(vilaFreteAtual)
  const valorTotal = valorKit + valorFrete

  // Formatar WhatsApp automaticamente
  const formatWhatsApp = (value: string) => {
    const numbers = value.replace(/\D/g, '')
    if (numbers.length <= 11) {
      return numbers
        .replace(/(\d{2})(\d)/, '($1) $2')
        .replace(/(\d{4,5})(\d{4})$/, '$1-$2')
    }
    return value
  }

  const onSubmit = (data: BookingFormData) => {
    // Recalcular o total com os dados do formulário
    const kit = kitsArray.find(k => k.id === data.kitId)
    const vila = vilasArray.find(v => v.id === data.vilaId)

    console.log('Vila encontrada:', vila)

    // O Supabase retorna valor_frete (snake_case) ao invés de valorFrete
    const vilaFrete = (vila as any)?.valor_frete ?? vila?.valorFrete ?? 0

    const valorKit = kit ? Number(kit.valor) * data.quantidade : 0
    const valorFrete = Number(vilaFrete)
    const total = valorKit + valorFrete

    console.log('Calculando total:', { kit, vila, valorKit, valorFrete, total })

    setPreviewData(data)
    setPreviewTotal(total)
    setShowPreview(true)
  }

  const handleConfirmarAgendamento = async () => {
    if (!previewData) return

    const kit = kitsArray.find(k => k.id === previewData.kitId)
    const vila = vilasArray.find(v => v.id === previewData.vilaId)
    const valorKitCalc = kit ? Number(kit.valor) * previewData.quantidade : 0
    const valorFreteCalc = vila ? Number((vila as any).valor_frete ?? vila.valorFrete ?? 0) : 0

    const pedidoData = {
      ...previewData,
      dataInicio: new Date(previewData.dataInicio),
      dataFim: new Date(previewData.dataFim),
      valorKit: valorKitCalc,
      valorFrete: valorFreteCalc,
      total: previewTotal,
      userId: user?.id || '',
    }

    console.log('Dados do pedido:', pedidoData)
    console.log('Total:', previewTotal, typeof previewTotal)

    const result = await confirmarPedidoMutation.mutateAsync(pedidoData)

    // Salvar/atualizar perfil do cliente
    if (user?.id) {
      upsertPerfil.mutateAsync({ userId: user.id, nome: previewData.nomeSolicitante, whatsapp: previewData.whatsapp })
    }

    setCreatedPedido({ ...pedidoData, ...result, kit: selectedKit, vila: selectedVila })
    setShowPreview(false)
    setShowSuccess(true)
  }

  const handleEditarDados = () => {
    setShowPreview(false)
  }

  const handleWhatsAppShare = () => {
    if (!createdPedido) return

    const message = `
*Novo Pedido - JV Locações*

📅 *Entrega:* ${formatarData(new Date(createdPedido.dataInicio))}
📅 *Devolução:* ${formatarData(new Date(createdPedido.dataFim))}
👤 *Nome:* ${createdPedido.nomeSolicitante}
📍 *Endereço:* ${createdPedido.endereco}
🏘️ *Vila:* ${createdPedido.vila?.nome || 'N/A'}
📦 *Kit:* ${createdPedido.kit?.descricao || 'N/A'}
🔢 *Quantidade:* ${createdPedido.quantidade}
💳 *Forma de pagamento:* ${createdPedido.formaPagamento}
💰 *Valor total:* ${formatarValor(createdPedido.total)}

${createdPedido.observacoes ? `📝 *Observações:* ${createdPedido.observacoes}` : ''}
    `.trim()

    // Número da empresa (você pode substituir pelo número real)
    const phoneNumber = '5541992699132' // TODO: Substituir pelo número real
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`

    window.open(whatsappUrl, '_blank')
  }

  // Se não tem dados da HomePage, mostrar mensagem e redirecionar
  if (!hasStateData) {
    return (
      <div className="flex min-h-svh items-center justify-center px-4">
        <div className="w-full max-w-md text-center">
          <h2 className="mb-2 text-xl font-bold">Selecione as datas primeiro</h2>
          <p className="mb-6 text-sm text-muted-foreground">
            Para fazer um agendamento, primeiro selecione as datas e quantidade na página inicial.
          </p>
          <Button onClick={() => navigate('/')} className="w-full">
            Ir para o calendário
          </Button>
        </div>
      </div>
    )
  }

  if (showSuccess) {
    return (
      <div className="flex min-h-svh items-center justify-center px-4">
        <div className="w-full max-w-md text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <Check className="h-8 w-8 text-green-600" />
          </div>
          <h2 className="mb-2 text-xl font-bold">Agendamento confirmado!</h2>
          <p className="mb-6 text-sm text-muted-foreground">
            Seu agendamento foi confirmado com sucesso. A disponibilidade do calendário foi atualizada.
          </p>

          <div className="space-y-3">
            <Button
              onClick={handleWhatsAppShare}
              className="w-full gap-2 bg-green-600 hover:bg-green-700"
            >
              <MessageCircle className="h-5 w-5" />
              Enviar pelo WhatsApp
            </Button>

            <Button
              onClick={() => navigate('/')}
              variant="outline"
              className="w-full"
            >
              Voltar para o início
            </Button>
          </div>
        </div>
      </div>
    )
  }

  if (showPreview && previewData) {
    const previewKit = kitsArray.find(k => k.id === previewData.kitId)
    const previewVila = vilasArray.find(v => v.id === previewData.vilaId)
    const previewValorKit = previewKit ? Number(previewKit.valor) * previewData.quantidade : 0
    const previewVilaFrete = previewVila ? ((previewVila as any).valor_frete ?? previewVila.valorFrete ?? 0) : 0
    const previewValorFrete = Number(previewVilaFrete)

    return (
      <div className="mx-auto min-h-svh max-w-2xl px-4 py-6">
        <header className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">
            Confirmar Agendamento
          </h1>
          <p className="text-sm text-muted-foreground">
            Revise os dados antes de confirmar
          </p>
        </header>

        <div className="space-y-4">
          {/* Período do evento */}
          <div className="rounded-lg border bg-card p-4 shadow-sm">
            <h3 className="mb-3 font-semibold">Período do evento</h3>
            <div className="space-y-1 text-sm">
              <div>
                <span className="text-muted-foreground">Entrega: </span>
                <span className="font-medium">{formatarData(new Date(previewData.dataInicio))}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Devolução: </span>
                <span className="font-medium">{formatarData(new Date(previewData.dataFim))}</span>
              </div>
            </div>
          </div>

          {/* Dados pessoais */}
          <div className="rounded-lg border bg-card p-4 shadow-sm">
            <h3 className="mb-3 font-semibold">Dados pessoais</h3>
            <div className="space-y-2 text-sm">
              <div>
                <span className="text-muted-foreground">Nome: </span>
                <span className="font-medium">{previewData.nomeSolicitante}</span>
              </div>
              <div>
                <span className="text-muted-foreground">WhatsApp: </span>
                <span className="font-medium">{previewData.whatsapp}</span>
              </div>
            </div>
          </div>

          {/* Local do evento */}
          <div className="rounded-lg border bg-card p-4 shadow-sm">
            <h3 className="mb-3 font-semibold">Local do evento</h3>
            <div className="space-y-2 text-sm">
              <div>
                <span className="text-muted-foreground">Endereço: </span>
                <span className="font-medium">{previewData.endereco}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Vila: </span>
                <span className="font-medium">{previewVila?.nome || 'N/A'}</span>
              </div>
            </div>
          </div>

          {/* Detalhes do pedido */}
          <div className="rounded-lg border bg-card p-4 shadow-sm">
            <h3 className="mb-3 font-semibold">Detalhes do pedido</h3>
            <div className="space-y-2 text-sm">
              <div>
                <span className="text-muted-foreground">Kit: </span>
                <span className="font-medium">
                  {previewKit?.descricao} ({previewKit?.mesas} mesas + {previewKit?.cadeiras} cadeiras)
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">Quantidade: </span>
                <span className="font-medium">{previewData.quantidade} kits</span>
              </div>
              <div>
                <span className="text-muted-foreground">Forma de pagamento: </span>
                <span className="font-medium">{previewData.formaPagamento}</span>
              </div>
              {previewData.observacoes && (
                <div>
                  <span className="text-muted-foreground">Observações: </span>
                  <span className="font-medium">{previewData.observacoes}</span>
                </div>
              )}
            </div>
          </div>

          {/* Resumo financeiro */}
          <div className="rounded-lg border bg-card p-4 shadow-sm">
            <h3 className="mb-3 font-semibold">Resumo financeiro</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Kit ({previewData.quantidade}x)</span>
                <span>{formatarValor(previewValorKit)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Frete</span>
                <span>{formatarValor(previewValorFrete)}</span>
              </div>
              <div className="border-t pt-2">
                <div className="flex justify-between text-base font-semibold">
                  <span>Total</span>
                  <span className="text-primary">{formatarValor(previewTotal)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Botões de ação */}
          <div className="flex gap-3">
            <Button
              onClick={handleEditarDados}
              variant="outline"
              className="flex-1 gap-2"
              disabled={confirmarPedidoMutation.isPending}
            >
              <Edit2 className="h-4 w-4" />
              Editar Dados
            </Button>
            <Button
              onClick={handleConfirmarAgendamento}
              className="flex-1 gap-2"
              disabled={confirmarPedidoMutation.isPending}
            >
              <Check className="h-4 w-4" />
              {confirmarPedidoMutation.isPending ? 'Confirmando...' : 'Confirmar Agendamento'}
            </Button>
          </div>

          {confirmarPedidoMutation.isError && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4">
              <p className="font-semibold text-red-600 mb-1">Erro ao confirmar agendamento</p>
              <p className="text-sm text-red-600">
                {confirmarPedidoMutation.error?.message || 'Ocorreu um erro desconhecido. Tente novamente.'}
              </p>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto min-h-svh max-w-2xl px-4 py-6">
      {/* Header */}
      <header className="mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/')}
          className="mb-4 -ml-2"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>
        <h1 className="text-2xl font-bold text-foreground">
          Fazer Agendamento
        </h1>
        <p className="text-sm text-muted-foreground">
          Período: {formatarData(dataInicio instanceof Date ? dataInicio : new Date(dataInicio))} até {formatarData(dataFim instanceof Date ? dataFim : new Date(dataFim))}
        </p>
      </header>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Período do evento */}
          <div className="rounded-lg border bg-card p-4 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              <h3 className="font-semibold">Período do evento</h3>
            </div>

            <div className="space-y-4">
              <FormField
                control={form.control}
                name="dataInicio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data de início (entrega)</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="dataFim"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data de devolução</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          {/* Dados pessoais */}
          <div className="rounded-lg border bg-card p-4 shadow-sm">
            <h3 className="mb-4 font-semibold">Dados pessoais</h3>

            <div className="space-y-4">
              <FormField
                control={form.control}
                name="nomeSolicitante"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome completo</FormLabel>
                    <FormControl>
                      <Input placeholder="Seu nome completo" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="whatsapp"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>WhatsApp</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="(XX) XXXXX-XXXX"
                        {...field}
                        onChange={(e) => {
                          const formatted = formatWhatsApp(e.target.value)
                          field.onChange(formatted)
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          {/* Endereço e localização */}
          <div className="rounded-lg border bg-card p-4 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary" />
              <h3 className="font-semibold">Local do evento</h3>
            </div>

            <div className="space-y-4">
              <FormField
                control={form.control}
                name="endereco"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Endereço completo</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Rua, número, bairro, complemento..."
                        className="min-h-[80px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="vilaId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Vila / Região</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      disabled={loadingVilas}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a vila" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {vilasArray.map((vila) => (
                          <SelectItem key={vila.id} value={vila.id}>
                            {vila.nome} - {formatarValor(vila.valorFrete)} frete
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          {/* Detalhes do pedido */}
          <div className="rounded-lg border bg-card p-4 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <Package className="h-5 w-5 text-primary" />
              <h3 className="font-semibold">Detalhes do pedido</h3>
            </div>

            <div className="space-y-4">
              <FormField
                control={form.control}
                name="kitId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Kit</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      disabled={loadingKits}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um kit" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {kitsArray.map((kit) => (
                          <SelectItem key={kit.id} value={kit.id}>
                            {kit.descricao} - {kit.mesas} mesas + {kit.cadeiras} cadeiras -{' '}
                            {formatarValor(kit.valor)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="quantidade"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quantidade de kits (mínimo 3)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="3"
                        max="50"
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="observacoes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Observações (opcional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Alguma informação adicional..."
                        className="min-h-[80px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          {/* Pagamento */}
          <div className="rounded-lg border bg-card p-4 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-primary" />
              <h3 className="font-semibold">Forma de pagamento</h3>
            </div>

            <FormField
              control={form.control}
              name="formaPagamento"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Como deseja pagar?</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="PIX">PIX</SelectItem>
                      <SelectItem value="DINHEIRO">Dinheiro</SelectItem>
                      <SelectItem value="CARTAO">Cartão</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Resumo do valor */}
          {valorTotal > 0 && (
            <div className="rounded-lg border bg-card p-4 shadow-sm">
              <h3 className="mb-3 font-semibold">Resumo do pedido</h3>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    Kit ({quantidade}x)
                  </span>
                  <span>{formatarValor(valorKit)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Frete</span>
                  <span>{formatarValor(valorFrete)}</span>
                </div>
                <div className="border-t pt-2">
                  <div className="flex justify-between text-base font-semibold">
                    <span>Total</span>
                    <span className="text-primary">{formatarValor(valorTotal)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Botão de submissão */}
          <Button
            type="submit"
            className="w-full"
          >
            Revisar Dados
          </Button>
        </form>
      </Form>
    </div>
  )
}
