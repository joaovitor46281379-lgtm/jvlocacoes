// ============================================
// TIPOS DO BANCO DE DADOS
// Baseado no schema Prisma
// ============================================

export interface Kit {
  id: string
  descricao: string
  mesas: number
  cadeiras: number
  valor: number
  ativo: boolean
  createdAt: Date
  updatedAt: Date
  imagemUrl?: string // URL da imagem no storage
}

export interface Address {
  id: string
  userId: string
  street: string
  number: string
  complement?: string
  neighborhood: string
  vilaId?: string
  city: string
  state: string
  zipCode: string
  reference?: string
  isDefault: boolean
  createdAt: Date
  updatedAt: Date
  // Relação
  vila?: Vila
}

export interface Vila {
  id: string
  nome: string
  valorFrete: number
  ativo: boolean
  createdAt: Date
  updatedAt: Date
}

export type StatusPedido =
  | 'PENDENTE'
  | 'AGUARDANDO_ENTREGA'
  | 'AGUARDANDO_RETIRADA'
  | 'CONCLUIDO'
  | 'CANCELADO'

export type FormaPagamento =
  | 'PIX'
  | 'DINHEIRO'
  | 'CARTAO'

export interface Pedido {
  id: string
  userId: string
  nomeSolicitante: string
  whatsapp: string
  dataInicio: Date
  dataFim: Date
  endereco: string
  vilaId: string
  kitId: string
  quantidade: number
  mesasAvulsas: number
  cadeirasAvulsas: number
  valorAvulsos: number
  formaPagamento: FormaPagamento
  status: StatusPedido
  valorKit: number
  valorFrete: number
  total: number
  observacoes?: string
  createdAt: Date
  updatedAt: Date
  // Relações
  vila?: Vila
  kit?: Kit
  pagamentos?: Pagamento[]
  avaliacao?: Avaliacao
}

export type StatusPagamento =
  | 'PENDENTE'
  | 'PAGO'
  | 'CANCELADO'
  | 'EXPIRADO'

export interface Pagamento {
  id: string
  pedidoId: string
  mpPaymentId?: string
  qrCode?: string
  qrCodeBase64?: string
  status: StatusPagamento
  valor: number
  createdAt: Date
  updatedAt: Date
  // Relações
  pedido?: Pedido
}

export interface DisponibilidadePeriodo {
  dataInicio: Date
  dataFim: Date
  kitsDisponiveis: number
  kitsReservados: number
}

export interface Avaliacao {
  id: string
  pedidoId: string
  estrelas: number // 1 a 5
  comentario?: string
  createdAt: Date
  updatedAt: Date
  // Relações
  pedido?: Pedido
}

// ============================================
// TIPOS PARA FORMULÁRIOS
// ============================================

export interface PedidoFormData {
  nomeSolicitante: string
  whatsapp: string
  dataInicio: Date
  dataFim: Date
  endereco: string
  vilaId: string
  kitId: string
  quantidade: number
  mesasAvulsas?: number
  cadeirasAvulsas?: number
  valorAvulsos?: number
  formaPagamento: FormaPagamento
  observacoes?: string
}

export interface Configuracoes {
  qtd_minima_pedido: number
  preco_kit: number
  preco_mesa_avulsa: number
  preco_cadeira_avulsa: number
  nome_locador?: string
  cpf_locador?: string
  endereco_empresa?: string
}

export interface KitFormData {
  descricao: string
  mesas: number
  cadeiras: number
  valor: number
  ativo: boolean
  imagem?: File
}

export interface VilaFormData {
  nome: string
  valorFrete: number
  ativo: boolean
}

export interface AvaliacaoFormData {
  pedidoId: string
  estrelas: number
  comentario?: string
}

export interface AddressFormData {
  street: string
  number: string
  complement?: string
  neighborhood: string
  vilaId?: string
  city: string
  state: string
  zipCode: string
  reference?: string
  isDefault?: boolean
}

// ============================================
// TIPOS PARA RESPOSTAS DA API
// ============================================

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

// ============================================
// TIPOS PARA FILTROS E QUERIES
// ============================================

export interface PedidoFilters {
  status?: StatusPedido[]
  dataInicio?: Date
  dataFim?: Date
  userId?: string
  vilaId?: string
  kitId?: string
}

export interface PaginationParams {
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

// ============================================
// TIPOS PARA DASHBOARD ADMIN
// ============================================

export interface DashboardStats {
  pedidosNovos: number
  pedidosAtivos: number
  pedidosFinalizados: number
  receitaTotal: number
  receitaMes: number
  avaliacaoMedia: number
  kitsDisponiveis: number
}

export interface PedidoPorStatus {
  status: StatusPedido
  count: number
}

export interface ReceitaPorMes {
  mes: string
  receita: number
}

// ============================================
// TIPOS PARA PERDAS E QUEBRAS
// ============================================

// ============================================
// TIPOS PARA INVENTÁRIO
// ============================================

// ============================================
// TIPOS PARA CUSTOS
// ============================================

export interface CategoriaCusto {
  id: string
  nome: string
  ativo: boolean
  createdAt: Date
  updatedAt: Date
}

export interface Custo {
  id: string
  categoriaId: string
  valor: number
  descricao?: string
  mes: number
  ano: number
  createdAt: Date
  updatedAt: Date
  categoria?: CategoriaCusto
}

// ============================================
// TIPOS PARA PERFIL DO CLIENTE
// ============================================

export interface Perfil {
  id: string
  userId: string
  nome: string
  whatsapp: string
  cpf?: string
  createdAt: Date
  updatedAt: Date
}

export interface Cliente {
  id: string
  userId: string
  nome: string
  whatsapp: string
  cpf?: string
  totalPedidos: number
  createdAt: Date
  updatedAt: Date
}

export type ItemInventario = 'MESA' | 'CADEIRA'

export interface Inventario {
  id: string
  item: ItemInventario
  quantidade: number
  createdAt: Date
  updatedAt: Date
}

export type TipoPerdaQuebra = 'PERDA' | 'QUEBRA'
export type ItemPerdaQuebra = 'MESA' | 'CADEIRA'

export interface PerdaQuebra {
  id: string
  pedidoId: string
  tipo: TipoPerdaQuebra
  item: ItemPerdaQuebra
  quantidade: number
  descricao?: string
  valorPrejuizo?: number
  createdAt: Date
  updatedAt: Date
  // Relações
  pedido?: Pedido
}

export interface PerdaQuebraFormData {
  pedidoId: string
  tipo: TipoPerdaQuebra
  item: ItemPerdaQuebra
  quantidade: number
  descricao?: string
  valorPrejuizo?: number
}
