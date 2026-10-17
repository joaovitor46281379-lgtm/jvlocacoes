import { z } from 'zod'

// ============================================
// CONSTANTES
// ============================================

export const TOTAL_KITS_DISPONIVEIS = 50
export const QUANTIDADE_MINIMA_KITS = 3

// Valores cobrados em caso de perda ou quebra (usados nos contratos)
export const VALOR_REPOSICAO_MESA = 85
export const VALOR_REPOSICAO_CADEIRA = 45

// ============================================
// VALIDAÇÕES COMPARTILHADAS
// ============================================

// Helper: validação de telefone brasileiro
const telefoneRegex = /^(\+55\s?)?(\(?\d{2}\)?\s?)?\d{4,5}-?\d{4}$/


// ============================================
// PEDIDO
// ============================================

export const pedidoSchema = z.object({
  nomeSolicitante: z
    .string()
    .min(3, 'Nome deve ter no mínimo 3 caracteres')
    .max(100, 'Nome muito longo'),

  whatsapp: z
    .string()
    .regex(telefoneRegex, 'WhatsApp inválido. Ex: (11) 99999-9999'),

  dataInicio: z.date().refine(
    (date: Date) => date >= new Date(new Date().setHours(0, 0, 0, 0)),
    'Data de início não pode ser no passado'
  ),

  dataFim: z.date(),

  endereco: z
    .string()
    .min(10, 'Endereço deve ter no mínimo 10 caracteres')
    .max(200, 'Endereço muito longo'),

  vilaId: z
    .string()
    .uuid('Vila inválida'),

  kitId: z
    .string()
    .uuid('Kit inválido'),

  quantidade: z
    .number()
    .int('Quantidade deve ser um número inteiro')
    .min(3, 'Quantidade mínima é 3 kits')
    .max(50, 'Quantidade máxima é 50'),

  formaPagamento: z.enum(['PIX', 'DINHEIRO', 'CARTAO'], {
    message: 'Forma de pagamento inválida'
  }),

  observacoes: z
    .string()
    .max(500, 'Observações muito longas')
    .optional()
}).refine(
  (data: { dataInicio: Date; dataFim: Date }) => data.dataFim > data.dataInicio,
  {
    message: 'Data final deve ser posterior à data inicial',
    path: ['dataFim']
  }
)

export type PedidoFormData = z.infer<typeof pedidoSchema>

// ============================================
// KIT
// ============================================

export const kitSchema = z.object({
  descricao: z
    .string()
    .min(3, 'Descrição deve ter no mínimo 3 caracteres')
    .max(100, 'Descrição muito longa'),

  mesas: z
    .number()
    .int('Quantidade de mesas deve ser um número inteiro')
    .min(0, 'Quantidade de mesas não pode ser negativa')
    .max(100, 'Quantidade de mesas muito alta'),

  cadeiras: z
    .number()
    .int('Quantidade de cadeiras deve ser um número inteiro')
    .min(0, 'Quantidade de cadeiras não pode ser negativa')
    .max(500, 'Quantidade de cadeiras muito alta'),

  valor: z
    .number()
    .min(0, 'Valor não pode ser negativo')
    .max(99999.99, 'Valor muito alto'),

  ativo: z.boolean().default(true),

  imagem: z
    .instanceof(File)
    .refine((file: File) => file.size <= 2 * 1024 * 1024, 'Imagem deve ter no máximo 2MB')
    .refine(
      (file: File) => ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(file.type),
      'Apenas imagens JPG, PNG ou WebP são permitidas'
    )
    .optional()
})

export type KitFormData = z.infer<typeof kitSchema>

// ============================================
// VILA
// ============================================

export const vilaSchema = z.object({
  nome: z
    .string()
    .min(3, 'Nome deve ter no mínimo 3 caracteres')
    .max(100, 'Nome muito longo'),

  valorFrete: z
    .number()
    .min(0, 'Valor do frete não pode ser negativo')
    .max(9999.99, 'Valor do frete muito alto'),

  ativo: z.boolean().default(true)
})

export type VilaFormData = z.infer<typeof vilaSchema>

// ============================================
// AVALIAÇÃO
// ============================================

export const avaliacaoSchema = z.object({
  pedidoId: z
    .string()
    .uuid('Pedido inválido'),

  estrelas: z
    .number()
    .int('Estrelas deve ser um número inteiro')
    .min(1, 'Mínimo de 1 estrela')
    .max(5, 'Máximo de 5 estrelas'),

  comentario: z
    .string()
    .max(500, 'Comentário muito longo')
    .optional()
})

export type AvaliacaoFormData = z.infer<typeof avaliacaoSchema>

// ============================================
// LOGIN
// ============================================

export const loginSchema = z.object({
  email: z
    .string()
    .email('E-mail inválido'),

  password: z
    .string()
    .min(6, 'Senha deve ter no mínimo 6 caracteres')
})

export type LoginFormData = z.infer<typeof loginSchema>

// ============================================
// HELPERS DE VALIDAÇÃO
// ============================================

/**
 * Formata número de telefone para padrão brasileiro
 */
export function formatarTelefone(telefone: string): string {
  const numbers = telefone.replace(/\D/g, '')

  if (numbers.length === 11) {
    return numbers.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3')
  }

  if (numbers.length === 10) {
    return numbers.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3')
  }

  return telefone
}

/**
 * Formata valor monetário para BRL
 */
export function formatarValor(valor: number | undefined | null): string {
  if (valor === undefined || valor === null || isNaN(valor)) {
    return 'R$ 0,00'
  }
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(valor)
}

/**
 * Formata data para padrão brasileiro
 */
export function formatarData(data: Date): string {
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeZone: 'America/Sao_Paulo'
  }).format(data)
}

/**
 * Formata data e hora para padrão brasileiro
 */
export function formatarDataHora(data: Date): string {
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
    timeZone: 'America/Sao_Paulo'
  }).format(data)
}

/**
 * Calcula número de dias entre duas datas
 */
export function calcularDias(dataInicio: Date, dataFim: Date): number {
  const umDia = 24 * 60 * 60 * 1000
  return Math.round(Math.abs((dataFim.getTime() - dataInicio.getTime()) / umDia))
}

/**
 * Formata período de datas
 */
export function formatarPeriodo(dataInicio: Date, dataFim: Date): string {
  const dias = calcularDias(dataInicio, dataFim)
  const dataInicioStr = formatarData(dataInicio)
  const dataFimStr = formatarData(dataFim)

  if (dias === 1) {
    return `${dataInicioStr} (1 dia)`
  }

  return `${dataInicioStr} até ${dataFimStr} (${dias} dias)`
}

/**
 * Converte o valor de um <input type="date"> (yyyy-MM-dd) em Date à meia-noite
 * de Brasília. Evita o deslocamento de um dia que acontece com new Date('yyyy-MM-dd'),
 * que é interpretado como meia-noite UTC.
 */
export function dataInputParaDate(valor: string): Date {
  return new Date(`${valor}T00:00:00-03:00`)
}

/**
 * Converte um Date (ou string ISO) em yyyy-MM-dd no fuso de Brasília,
 * para preencher um <input type="date"> com o mesmo dia mostrado por formatarData.
 */
export function dateParaDataInput(valor: Date | string | null | undefined): string {
  if (!valor) return ''
  const data = valor instanceof Date ? valor : new Date(valor)
  if (isNaN(data.getTime())) return ''
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(data)
}

/**
 * Normaliza um telefone brasileiro para comparação: só dígitos, sem o 55 do país
 * e sem o 9 extra de celular (assim "(41) 99999-8888" e "41 9999-8888" são iguais).
 */
export function normalizarTelefone(telefone: string | null | undefined): string {
  let numeros = (telefone || '').replace(/\D/g, '')
  if (numeros.length >= 12 && numeros.startsWith('55')) numeros = numeros.slice(2)
  if (numeros.length === 11 && numeros[2] === '9') numeros = numeros.slice(0, 2) + numeros.slice(3)
  return numeros
}

/**
 * Compara dois telefones ignorando formatação. Exige ao menos 8 dígitos
 * para não casar números incompletos.
 */
export function telefonesIguais(a: string | null | undefined, b: string | null | undefined): boolean {
  const na = normalizarTelefone(a)
  const nb = normalizarTelefone(b)
  return na.length >= 8 && na === nb
}
