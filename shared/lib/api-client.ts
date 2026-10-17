import { supabase } from './storage'
import { generateUUID } from '@shared/utils/uuid'
import { telefonesIguais, formatarTelefone } from './validations'
import type {
  Kit,
  Vila,
  Pedido,
  Avaliacao,
  Address,
  PedidoFormData,
  KitFormData,
  VilaFormData,
  AvaliacaoFormData,
  AddressFormData,
  ApiResponse,
  PaginatedResponse,
  PedidoFilters,
  PaginationParams,
  DashboardStats,
  PerdaQuebra,
  PerdaQuebraFormData,
  Configuracoes
} from '@shared/types'

// ============================================
// BASE CLIENT
// ============================================

function isDataNaSemanaAtual(data: Date): boolean {
  const hoje = new Date()
  const diaSemana = hoje.getDay()
  const diffParaSeg = diaSemana === 0 ? -6 : 1 - diaSemana
  const seg = new Date(hoje)
  seg.setDate(hoje.getDate() + diffParaSeg)
  seg.setHours(0, 0, 0, 0)
  const dom = new Date(seg)
  dom.setDate(seg.getDate() + 6)
  dom.setHours(23, 59, 59, 999)
  return data >= seg && data <= dom
}

class ApiClient {
  private async handleResponse<T>(response: any): Promise<ApiResponse<T>> {
    if (response.error) {
      return {
        success: false,
        error: response.error.message
      }
    }

    return {
      success: true,
      data: response.data
    }
  }

  // Mapear vila de snake_case para camelCase
  private mapVila(vila: any): Vila {
    return {
      id: vila.id,
      nome: vila.nome,
      valorFrete: Number(vila.valor_frete),
      ativo: vila.ativo,
      createdAt: new Date(vila.created_at),
      updatedAt: new Date(vila.updated_at)
    }
  }

  // Mapear endereço de snake_case para camelCase
  private mapAddress(address: any): Address {
    return {
      id: address.id,
      userId: address.user_id,
      street: address.street,
      number: address.number,
      complement: address.complement,
      neighborhood: address.neighborhood,
      vilaId: address.vila_id,
      city: address.city,
      state: address.state,
      zipCode: address.zip_code,
      reference: address.reference,
      isDefault: address.is_default,
      createdAt: new Date(address.created_at),
      updatedAt: new Date(address.updated_at),
      vila: address.vila ? this.mapVila(address.vila) : undefined
    }
  }

  // ============================================
  // KITS
  // ============================================

  async getKits(apenasAtivos = true): Promise<ApiResponse<Kit[]>> {
    const query = supabase
      .from('kits')
      .select('*')
      .order('created_at', { ascending: false })

    if (apenasAtivos) {
      query.eq('ativo', true)
    }

    return this.handleResponse(await query)
  }

  async getKit(id: string): Promise<ApiResponse<Kit>> {
    const response = await supabase
      .from('kits')
      .select('*')
      .eq('id', id)
      .single()

    return this.handleResponse(response)
  }

  async createKit(data: KitFormData): Promise<ApiResponse<Kit>> {
    const kitId = generateUUID()
    const now = new Date().toISOString()
    const response = await supabase
      .from('kits')
      .insert({
        id: kitId,
        descricao: data.descricao,
        mesas: data.mesas,
        cadeiras: data.cadeiras,
        valor: data.valor,
        ativo: data.ativo,
        created_at: now,
        updated_at: now
      })
      .select()
      .single()

    return this.handleResponse(response)
  }

  async updateKit(id: string, data: Partial<KitFormData>): Promise<ApiResponse<Kit>> {
    const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() }
    if (data.descricao !== undefined) updateData.descricao = data.descricao
    if (data.mesas !== undefined) updateData.mesas = data.mesas
    if (data.cadeiras !== undefined) updateData.cadeiras = data.cadeiras
    if (data.valor !== undefined) updateData.valor = data.valor
    if (data.ativo !== undefined) updateData.ativo = data.ativo

    const response = await supabase
      .from('kits')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    return this.handleResponse(response)
  }

  async deleteKit(id: string): Promise<ApiResponse<void>> {
    const response = await supabase
      .from('kits')
      .delete()
      .eq('id', id)

    return this.handleResponse(response)
  }

  // ============================================
  // VILAS
  // ============================================

  async getVilas(apenasAtivas = true): Promise<ApiResponse<Vila[]>> {
    const query = supabase
      .from('vilas')
      .select('*')
      .order('nome', { ascending: true })

    if (apenasAtivas) {
      query.eq('ativo', true)
    }

    const response = await query
    if (response.error) {
      return { success: false, error: response.error.message }
    }
    return {
      success: true,
      data: response.data?.map((v: Record<string, unknown>) => this.mapVila(v))
    }
  }

  async getVila(id: string): Promise<ApiResponse<Vila>> {
    const response = await supabase
      .from('vilas')
      .select('*')
      .eq('id', id)
      .single()

    if (response.error) {
      return { success: false, error: response.error.message }
    }
    return {
      success: true,
      data: this.mapVila(response.data)
    }
  }

  async createVila(data: VilaFormData): Promise<ApiResponse<Vila>> {
    const vilaId = generateUUID()
    const now = new Date().toISOString()
    const response = await supabase
      .from('vilas')
      .insert({
        id: vilaId,
        nome: data.nome,
        valor_frete: data.valorFrete,
        ativo: data.ativo,
        created_at: now,
        updated_at: now
      })
      .select()
      .single()

    if (response.error) {
      return { success: false, error: response.error.message }
    }
    return {
      success: true,
      data: this.mapVila(response.data)
    }
  }

  async updateVila(id: string, data: Partial<VilaFormData>): Promise<ApiResponse<Vila>> {
    const updateData: any = {}
    if (data.nome !== undefined) updateData.nome = data.nome
    if (data.valorFrete !== undefined) updateData.valor_frete = data.valorFrete
    if (data.ativo !== undefined) updateData.ativo = data.ativo

    const response = await supabase
      .from('vilas')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (response.error) {
      return { success: false, error: response.error.message }
    }
    return {
      success: true,
      data: this.mapVila(response.data)
    }
  }

  async deleteVila(id: string): Promise<ApiResponse<void>> {
    const response = await supabase
      .from('vilas')
      .delete()
      .eq('id', id)

    return this.handleResponse(response)
  }

  // ============================================
  // ADDRESSES (Endereços dos Usuários)
  // ============================================

  async getAddresses(userId: string): Promise<ApiResponse<Address[]>> {
    const response = await supabase
      .from('addresses')
      .select('*, vila:vilas(*)')
      .eq('user_id', userId)
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: false })

    if (response.error) {
      return {
        success: false,
        error: response.error.message
      }
    }

    return {
      success: true,
      data: response.data?.map((addr: Record<string, unknown>) => this.mapAddress(addr)) || []
    }
  }

  async getAddress(id: string): Promise<ApiResponse<Address>> {
    const response = await supabase
      .from('addresses')
      .select('*')
      .eq('id', id)
      .single()

    if (response.error) {
      return {
        success: false,
        error: response.error.message
      }
    }

    return {
      success: true,
      data: this.mapAddress(response.data)
    }
  }

  async getDefaultAddress(userId: string): Promise<ApiResponse<Address>> {
    const response = await supabase
      .from('addresses')
      .select('*')
      .eq('user_id', userId)
      .eq('is_default', true)
      .single()

    if (response.error) {
      return {
        success: false,
        error: response.error.message
      }
    }

    return {
      success: true,
      data: this.mapAddress(response.data)
    }
  }

  async createAddress(userId: string, data: AddressFormData): Promise<ApiResponse<Address>> {
    const addressId = generateUUID()
    const now = new Date().toISOString()

    // Se este endereço é marcado como padrão, desmarcar outros
    if (data.isDefault) {
      await supabase
        .from('addresses')
        .update({ is_default: false })
        .eq('user_id', userId)
    }

    const response = await supabase
      .from('addresses')
      .insert({
        id: addressId,
        user_id: userId,
        street: data.street,
        number: data.number,
        complement: data.complement,
        neighborhood: data.neighborhood,
        vila_id: data.vilaId,
        city: data.city,
        state: data.state,
        zip_code: data.zipCode,
        reference: data.reference,
        is_default: data.isDefault || false,
        created_at: now,
        updated_at: now
      })
      .select('*, vila:vilas(*)')
      .single()

    if (response.error) {
      return {
        success: false,
        error: response.error.message
      }
    }

    return {
      success: true,
      data: this.mapAddress(response.data)
    }
  }

  async updateAddress(id: string, data: Partial<AddressFormData>): Promise<ApiResponse<Address>> {
    // Montar objeto apenas com campos definidos
    const updateData: any = {
      updated_at: new Date().toISOString()
    }

    if (data.street !== undefined) updateData.street = data.street
    if (data.number !== undefined) updateData.number = data.number
    if (data.complement !== undefined) updateData.complement = data.complement
    if (data.neighborhood !== undefined) updateData.neighborhood = data.neighborhood
    if (data.vilaId !== undefined) updateData.vila_id = data.vilaId
    if (data.city !== undefined) updateData.city = data.city
    if (data.state !== undefined) updateData.state = data.state
    if (data.zipCode !== undefined) updateData.zip_code = data.zipCode
    if (data.reference !== undefined) updateData.reference = data.reference
    if (data.isDefault !== undefined) updateData.is_default = data.isDefault

    const response = await supabase
      .from('addresses')
      .update(updateData)
      .eq('id', id)
      .select('*, vila:vilas(*)')
      .single()

    if (response.error) {
      return {
        success: false,
        error: response.error.message
      }
    }

    return {
      success: true,
      data: this.mapAddress(response.data)
    }
  }

  async setDefaultAddress(userId: string, addressId: string): Promise<ApiResponse<Address>> {
    // Primeiro, desmarcar todos os outros endereços como padrão
    await supabase
      .from('addresses')
      .update({ is_default: false })
      .eq('user_id', userId)

    // Depois, marcar o endereço específico como padrão
    const response = await supabase
      .from('addresses')
      .update({ is_default: true })
      .eq('id', addressId)
      .select()
      .single()

    if (response.error) {
      return {
        success: false,
        error: response.error.message
      }
    }

    return {
      success: true,
      data: this.mapAddress(response.data)
    }
  }

  async deleteAddress(id: string): Promise<ApiResponse<void>> {
    const response = await supabase
      .from('addresses')
      .delete()
      .eq('id', id)

    return this.handleResponse(response)
  }

  // ============================================
  // PEDIDOS
  // ============================================

  async getPedidos(filters?: PedidoFilters, pagination?: PaginationParams): Promise<ApiResponse<PaginatedResponse<Pedido>>> {
    let query = supabase
      .from('pedidos')
      .select('*, kit:kits(*), vila:vilas(*), pagamentos(*), avaliacao:avaliacoes(*)', { count: 'exact' })

    // Filtros
    if (filters?.status && filters.status.length > 0) {
      query = query.in('status', filters.status)
    }
    if (filters?.dataInicio) {
      query = query.gte('data_inicio', filters.dataInicio.toISOString())
    }
    if (filters?.dataFim) {
      query = query.lte('data_inicio', filters.dataFim.toISOString())
    }
    if (filters?.userId) {
      query = query.eq('user_id', filters.userId)
    }
    if (filters?.vilaId) {
      query = query.eq('vila_id', filters.vilaId)
    }
    if (filters?.kitId) {
      query = query.eq('kit_id', filters.kitId)
    }

    // Paginação
    const page = pagination?.page || 1
    const limit = pagination?.limit || 10
    const from = (page - 1) * limit
    const to = from + limit - 1

    // Ordenação
    const sortBy = pagination?.sortBy || 'data_inicio'
    const sortOrder = pagination?.sortOrder || 'asc'
    query = query.order(sortBy, { ascending: sortOrder === 'asc', nullsFirst: false })

    query = query.range(from, to)

    const { data, error, count } = await query

    if (error) {
      return {
        success: false,
        error: error.message
      }
    }

    return {
      success: true,
      data: {
        data: data || [],
        total: count || 0,
        page,
        limit,
        totalPages: Math.ceil((count || 0) / limit)
      }
    }
  }

  async getPedido(id: string): Promise<ApiResponse<Pedido>> {
    const response = await supabase
      .from('pedidos')
      .select('*, kit:kits(*), vila:vilas(*), pagamentos(*), avaliacao:avaliacoes(*)')
      .eq('id', id)
      .single()

    return this.handleResponse(response)
  }

  /**
   * Último pedido (não cancelado) de um cliente, para pré-preencher endereço e vila
   * ao lançar um novo pedido. Procura pelo WhatsApp (nos formatos mais comuns de
   * gravação) e, se não achar, pelo user_id.
   */
  async getUltimoPedidoDoCliente(params: { userId?: string; whatsapp: string }): Promise<ApiResponse<any | null>> {
    const digitos = params.whatsapp.replace(/\D/g, '')
    const variantes = Array.from(new Set([params.whatsapp, digitos, formatarTelefone(params.whatsapp)])).filter(Boolean)

    const base = () =>
      supabase
        .from('pedidos')
        .select('nome_solicitante, endereco, vila_id, created_at')
        .neq('status', 'CANCELADO')

    const executar = async (consulta: any) => {
      const { data, error } = await consulta.order('created_at', { ascending: false }).limit(1)
      if (error || !data || data.length === 0) return null
      return data[0]
    }

    let pedido = await executar(base().in('whatsapp', variantes))
    if (!pedido && params.userId) {
      pedido = await executar(base().eq('user_id', params.userId))
    }

    return { success: true, data: pedido }
  }

  async createPedido(data: PedidoFormData & { userId: string; total: number; valorKit: number; valorFrete: number }): Promise<ApiResponse<Pedido>> {
    // Buscar quantidade mínima das configurações
    const { data: configMin } = await supabase
      .from('configuracoes')
      .select('valor')
      .eq('id', 'qtd_minima_pedido')
      .single()
    const qtdMinima = configMin ? Number(configMin.valor) : 3

    if (data.quantidade < qtdMinima) {
      return {
        success: false,
        error: `Quantidade mínima: ${qtdMinima} kits`
      }
    }

    const pedidoId = generateUUID()
    const now = new Date().toISOString()
    const response = await supabase
      .from('pedidos')
      .insert({
        id: pedidoId,
        user_id: data.userId,
        nome_solicitante: data.nomeSolicitante,
        whatsapp: data.whatsapp,
        data_inicio: data.dataInicio.toISOString(),
        data_fim: data.dataFim.toISOString(),
        endereco: data.endereco,
        vila_id: data.vilaId,
        kit_id: data.kitId,
        quantidade: data.quantidade,
        mesas_avulsas: data.mesasAvulsas ?? 0,
        cadeiras_avulsas: data.cadeirasAvulsas ?? 0,
        valor_avulsos: data.valorAvulsos ?? 0,
        forma_pagamento: data.formaPagamento,
        status: isDataNaSemanaAtual(data.dataInicio) ? 'AGUARDANDO_ENTREGA' : 'PENDENTE',
        valor_kit: data.valorKit,
        valor_frete: data.valorFrete,
        total: data.total,
        observacoes: data.observacoes,
        created_at: now,
        updated_at: now
      })
      .select()
      .single()

    return this.handleResponse(response)
  }

  async confirmarPedido(data: PedidoFormData & { userId: string; total: number; valorKit: number; valorFrete: number }): Promise<ApiResponse<Pedido>> {
    // 1. Verificar disponibilidade para o período solicitado
    const { data: kitsDisponiveis, error: dispError } = await supabase
      .rpc('calcular_disponibilidade', {
        p_data_inicio: data.dataInicio.toISOString(),
        p_data_fim: data.dataFim.toISOString()
      })

    if (dispError) {
      return {
        success: false,
        error: 'Erro ao verificar disponibilidade: ' + dispError.message
      }
    }

    // 2. Buscar quantidade mínima das configurações
    const { data: configMin } = await supabase
      .from('configuracoes')
      .select('valor')
      .eq('id', 'qtd_minima_pedido')
      .single()
    const qtdMinima = configMin ? Number(configMin.valor) : 3

    if (data.quantidade < qtdMinima) {
      return {
        success: false,
        error: `Quantidade mínima: ${qtdMinima} kits`
      }
    }

    // 3. Validar se há kits suficientes
    if (kitsDisponiveis < data.quantidade) {
      return {
        success: false,
        error: `Kits insuficientes para o período. Disponível: ${kitsDisponiveis}, Solicitado: ${data.quantidade}`
      }
    }

    // 4. Criar pedido com status AGUARDANDO_ENTREGA
    const pedidoId = generateUUID()
    const totalValido = typeof data.total === 'number' && !isNaN(data.total) ? data.total : 0
    const now = new Date().toISOString()

    const { data: pedidoCriado, error: pedidoError } = await supabase
      .from('pedidos')
      .insert({
        id: pedidoId,
        user_id: data.userId,
        nome_solicitante: data.nomeSolicitante,
        whatsapp: data.whatsapp,
        data_inicio: data.dataInicio.toISOString(),
        data_fim: data.dataFim.toISOString(),
        endereco: data.endereco,
        vila_id: data.vilaId,
        kit_id: data.kitId,
        quantidade: data.quantidade,
        mesas_avulsas: data.mesasAvulsas ?? 0,
        cadeiras_avulsas: data.cadeirasAvulsas ?? 0,
        valor_avulsos: data.valorAvulsos ?? 0,
        forma_pagamento: data.formaPagamento,
        status: isDataNaSemanaAtual(data.dataInicio) ? 'AGUARDANDO_ENTREGA' : 'PENDENTE',
        valor_kit: data.valorKit,
        valor_frete: data.valorFrete,
        total: totalValido,
        observacoes: data.observacoes,
        created_at: now,
        updated_at: now
      })
      .select()
      .single()

    if (pedidoError) {
      return {
        success: false,
        error: 'Erro ao criar pedido: ' + pedidoError.message
      }
    }

    // Criar pagamento inicial com status PENDENTE
    await this.createPagamento(pedidoId, totalValido)

    return {
      success: true,
      data: pedidoCriado
    }
  }

  async updatePedido(id: string, data: Partial<Pedido>): Promise<ApiResponse<Pedido>> {
    const response = await supabase
      .from('pedidos')
      .update(data)
      .eq('id', id)
      .select()
      .single()

    return this.handleResponse(response)
  }

  async cancelarPedido(id: string): Promise<ApiResponse<Pedido>> {
    return this.updatePedido(id, { status: 'CANCELADO' })
  }

  async getPedidosDaSemana(dataInicio: Date, dataFim: Date): Promise<ApiResponse<Pedido[]>> {
    const response = await supabase
      .from('pedidos')
      .select('*, kit:kits(*), vila:vilas(*), pagamentos(*)')
      .gte('data_inicio', dataInicio.toISOString())
      .lte('data_inicio', dataFim.toISOString())
      .not('status', 'in', '("CANCELADO","CONCLUIDO")')
      .order('data_inicio', { ascending: true })

    return this.handleResponse(response)
  }

  async marcarPedidosAguardandoEntrega(ids: string[]): Promise<ApiResponse<Pedido[]>> {
    const response = await supabase
      .from('pedidos')
      .update({ status: 'AGUARDANDO_ENTREGA', updated_at: new Date().toISOString() })
      .in('id', ids)
      .eq('status', 'PENDENTE')
      .select()

    return this.handleResponse(response)
  }

  async getPedidosByStatus(status: string): Promise<ApiResponse<Pedido[]>> {
    const response = await supabase
      .from('pedidos')
      .select('*, kit:kits(*), vila:vilas(*), pagamentos(*)')
      .eq('status', status)
      .order('data_fim', { ascending: true })

    return this.handleResponse(response)
  }

  async deletePedido(id: string): Promise<ApiResponse<void>> {
    const response = await supabase
      .from('pedidos')
      .delete()
      .eq('id', id)

    return this.handleResponse(response)
  }

  // ============================================
  // PAGAMENTOS
  // ============================================

  async createPagamento(pedidoId: string, valor: number): Promise<ApiResponse<any>> {
    const id = generateUUID()
    const now = new Date().toISOString()

    const response = await supabase
      .from('pagamentos')
      .insert({
        id,
        pedido_id: pedidoId,
        status: 'PENDENTE',
        valor,
        created_at: now,
        updated_at: now
      })
      .select()
      .single()

    return this.handleResponse(response)
  }

  async updatePagamento(id: string, status: string): Promise<ApiResponse<any>> {
    const response = await supabase
      .from('pagamentos')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    return this.handleResponse(response)
  }

  // ============================================
  // DISPONIBILIDADE (calculada dinamicamente)
  // ============================================

  async getDisponibilidadePeriodo(dataInicio: Date, dataFim: Date): Promise<ApiResponse<number>> {
    const { data, error } = await supabase
      .rpc('calcular_disponibilidade', {
        p_data_inicio: dataInicio.toISOString(),
        p_data_fim: dataFim.toISOString()
      })

    if (error) {
      return {
        success: false,
        error: error.message
      }
    }

    return {
      success: true,
      data: data as number
    }
  }

  // Calcular disponibilidade para múltiplas datas (ex: calendário)
  async getDisponibilidadeMultiplasDatas(
    dataInicio: Date,
    dataFim: Date
  ): Promise<ApiResponse<Record<string, number>>> {
    // Buscar estoque físico do inventário
    const { data: inventario } = await supabase
      .from('inventario')
      .select('item, quantidade')

    const totalMesas = inventario?.find((i: any) => i.item === 'MESA')?.quantidade ?? 0
    const totalCadeiras = inventario?.find((i: any) => i.item === 'CADEIRA')?.quantidade ?? 0
    const TOTAL_KITS = totalMesas > 0 || totalCadeiras > 0
      ? Math.min(totalMesas, Math.floor(totalCadeiras / 4))
      : 50

    // Buscar todos os pedidos confirmados que se sobrepõem ao período
    const { data: pedidos, error } = await supabase
      .from('pedidos')
      .select('data_inicio, data_fim, quantidade')
      .in('status', ['AGUARDANDO_ENTREGA', 'AGUARDANDO_RETIRADA'])
      .or(`data_inicio.lte.${dataFim.toISOString()},data_fim.gte.${dataInicio.toISOString()}`)

    if (error) {
      return {
        success: false,
        error: error.message
      }
    }

    // Calcular disponibilidade dia a dia
    const disponibilidadePorDia: Record<string, number> = {}

    let currentDate = new Date(dataInicio)
    while (currentDate <= dataFim) {
      const dateKey = currentDate.toISOString().split('T')[0]

      const kitsReservados = (pedidos || []).reduce((total: number, pedido: { data_inicio: string; data_fim: string; quantidade: number }) => {
        const inicio = new Date(pedido.data_inicio)
        inicio.setHours(0, 0, 0, 0)
        const fim = new Date(pedido.data_fim)
        fim.setHours(0, 0, 0, 0)

        if (currentDate >= inicio && currentDate <= fim) {
          return total + pedido.quantidade
        }
        return total
      }, 0)

      disponibilidadePorDia[dateKey] = Math.max(0, TOTAL_KITS - kitsReservados)
      currentDate.setDate(currentDate.getDate() + 1)
    }

    return {
      success: true,
      data: disponibilidadePorDia
    }
  }

  // ============================================
  // CONFIGURAÇÕES
  // ============================================

  async getConfiguracoes(): Promise<ApiResponse<Configuracoes>> {
    const { data, error } = await supabase
      .from('configuracoes')
      .select('id, valor')

    if (error) {
      return { success: false, error: error.message }
    }

    const map: Record<string, string> = {}
    ;(data || []).forEach((row: { id: string; valor: string }) => {
      map[row.id] = row.valor
    })

    return {
      success: true,
      data: {
        qtd_minima_pedido: Number(map['qtd_minima_pedido'] ?? 3),
        preco_kit: Number(map['preco_kit'] ?? 0),
        preco_mesa_avulsa: Number(map['preco_mesa_avulsa'] ?? 0),
        preco_cadeira_avulsa: Number(map['preco_cadeira_avulsa'] ?? 0),
        nome_locador: map['nome_locador'] || undefined,
        cpf_locador: map['cpf_locador'] || undefined,
        endereco_empresa: map['endereco_empresa'] || undefined,
      }
    }
  }

  async upsertConfiguracao(id: string, valor: string): Promise<ApiResponse<void>> {
    const { error } = await supabase
      .from('configuracoes')
      .upsert({ id, valor, updated_at: new Date().toISOString() }, { onConflict: 'id' })

    if (error) return { success: false, error: error.message }
    return { success: true }
  }

  // ============================================
  // AVALIAÇÕES
  // ============================================

  async getAvaliacoes(): Promise<ApiResponse<Avaliacao[]>> {
    const response = await supabase
      .from('avaliacoes')
      .select('*, pedido:pedidos(*)')
      .order('created_at', { ascending: false })

    return this.handleResponse(response)
  }

  async getAvaliacaoPorPedido(pedidoId: string): Promise<ApiResponse<Avaliacao | null>> {
    const response = await supabase
      .from('avaliacoes')
      .select('*')
      .eq('pedido_id', pedidoId)
      .maybeSingle()

    return this.handleResponse(response)
  }

  async createAvaliacao(data: AvaliacaoFormData): Promise<ApiResponse<Avaliacao>> {
    const avaliacaoId = generateUUID()
    const now = new Date().toISOString()
    const response = await supabase
      .from('avaliacoes')
      .insert({
        id: avaliacaoId,
        pedido_id: data.pedidoId,
        estrelas: data.estrelas,
        comentario: data.comentario,
        created_at: now,
        updated_at: now
      })
      .select()
      .single()

    return this.handleResponse(response)
  }

  // ============================================
  // DASHBOARD (Admin)
  // ============================================

  async getDashboardStats(): Promise<ApiResponse<DashboardStats>> {
    try {
      // Pedidos novos (PENDENTE)
      const { count: pedidosNovos } = await supabase
        .from('pedidos')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'PENDENTE')

      // Pedidos ativos (AGUARDANDO_ENTREGA, AGUARDANDO_RETIRADA)
      const { count: pedidosAtivos } = await supabase
        .from('pedidos')
        .select('*', { count: 'exact', head: true })
        .in('status', ['AGUARDANDO_ENTREGA', 'AGUARDANDO_RETIRADA'])

      // Pedidos concluídos
      const { count: pedidosFinalizados } = await supabase
        .from('pedidos')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'CONCLUIDO')

      // Receita total
      const { data: receitaTotalData } = await supabase
        .from('pedidos')
        .select('total')
        .eq('status', 'CONCLUIDO')

      const receitaTotal = receitaTotalData?.reduce((acc: number, p: { total: number }) => acc + Number(p.total), 0) || 0

      // Receita do mês atual
      const inicioMes = new Date()
      inicioMes.setDate(1)
      inicioMes.setHours(0, 0, 0, 0)

      const { data: receitaMesData } = await supabase
        .from('pedidos')
        .select('total')
        .eq('status', 'CONCLUIDO')
        .gte('created_at', inicioMes.toISOString())

      const receitaMes = receitaMesData?.reduce((acc: number, p: { total: number }) => acc + Number(p.total), 0) || 0

      // Avaliação média
      const { data: avaliacoesData } = await supabase
        .from('avaliacoes')
        .select('estrelas')

      const avaliacaoMedia = avaliacoesData && avaliacoesData.length > 0
        ? avaliacoesData.reduce((acc: number, a: { estrelas: number }) => acc + a.estrelas, 0) / avaliacoesData.length
        : 0

      // Kits disponíveis (hoje, calculado dinamicamente)
      const hoje = new Date()
      const amanha = new Date(hoje)
      amanha.setDate(amanha.getDate() + 1)

      const { data: kitsDisponiveis } = await supabase
        .rpc('calcular_disponibilidade', {
          p_data_inicio: hoje.toISOString(),
          p_data_fim: amanha.toISOString()
        })

      return {
        success: true,
        data: {
          pedidosNovos: pedidosNovos || 0,
          pedidosAtivos: pedidosAtivos || 0,
          pedidosFinalizados: pedidosFinalizados || 0,
          receitaTotal,
          receitaMes,
          avaliacaoMedia,
          kitsDisponiveis: kitsDisponiveis || 0
        }
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao buscar estatísticas'
      }
    }
  }

  async getDashboardFiltrado(mes: number, ano: number): Promise<ApiResponse<{
    receitaConcluido: number
    receitaConfirmado: number
    receitaTotal: number
    custoTotal: number
    lucro: number
    totalPedidos: number
    topCustos: { categoria: string; valor: number }[]
    topBairros: { nome: string; totalPedidos: number }[]
    receitaPorMes: { mes: number; label: string; receita: number }[]
  }>> {
    try {
      // mes = 0 significa ano inteiro
      const inicio = mes === 0 ? new Date(ano, 0, 1) : new Date(ano, mes - 1, 1)
      const fim = mes === 0 ? new Date(ano, 11, 31, 23, 59, 59, 999) : new Date(ano, mes, 0, 23, 59, 59, 999)

      // Pedidos CONCLUIDO no período
      const { data: pedidosConcluido } = await supabase
        .from('pedidos')
        .select('total, vila_id')
        .eq('status', 'CONCLUIDO')
        .gte('data_inicio', inicio.toISOString())
        .lte('data_inicio', fim.toISOString())

      // Pedidos AGUARDANDO_RETIRADA no período
      const { data: pedidosConfirmado } = await supabase
        .from('pedidos')
        .select('total, vila_id')
        .eq('status', 'AGUARDANDO_RETIRADA')
        .gte('data_inicio', inicio.toISOString())
        .lte('data_inicio', fim.toISOString())

      const receitaConcluido = (pedidosConcluido || []).reduce((acc: number, p: any) => acc + Number(p.total), 0)
      const receitaConfirmado = (pedidosConfirmado || []).reduce((acc: number, p: any) => acc + Number(p.total), 0)
      const receitaTotal = receitaConcluido + receitaConfirmado

      // Contagem total de pedidos no período (exceto CANCELADO)
      const { count: totalPedidos } = await supabase
        .from('pedidos')
        .select('id', { count: 'exact', head: true })
        .neq('status', 'CANCELADO')
        .gte('data_inicio', inicio.toISOString())
        .lte('data_inicio', fim.toISOString())

      // Custos do período por categoria
      let custosQuery = supabase
        .from('custos')
        .select('valor, categoria:categorias_custos(nome)')
        .eq('ano', ano)
      if (mes !== 0) custosQuery = custosQuery.eq('mes', mes)
      const { data: custosData } = await custosQuery

      const custoPorCategoria: Record<string, number> = {}
      let custoTotal = 0
      ;(custosData || []).forEach((c: any) => {
        const nome = c.categoria?.nome || 'Sem categoria'
        custoPorCategoria[nome] = (custoPorCategoria[nome] || 0) + Number(c.valor)
        custoTotal += Number(c.valor)
      })

      const topCustos = Object.entries(custoPorCategoria)
        .map(([categoria, valor]) => ({ categoria, valor }))
        .sort((a, b) => b.valor - a.valor)
        .slice(0, 5)

      const lucro = receitaTotal - custoTotal

      // Top bairros por nº de pedidos no mês
      const todosOsPedidosMes = [...(pedidosConcluido || []), ...(pedidosConfirmado || [])]
      const contagemBairro: Record<string, number> = {}
      todosOsPedidosMes.forEach((p: any) => {
        if (p.vila_id) contagemBairro[p.vila_id] = (contagemBairro[p.vila_id] || 0) + 1
      })

      // Busca pedidos PENDENTE e AGUARDANDO_ENTREGA do período também para bairros
      const { data: pedidosPendentesEntrega } = await supabase
        .from('pedidos')
        .select('vila_id')
        .in('status', ['PENDENTE', 'AGUARDANDO_ENTREGA'])
        .gte('data_inicio', inicio.toISOString())
        .lte('data_inicio', fim.toISOString())

      ;(pedidosPendentesEntrega || []).forEach((p: any) => {
        if (p.vila_id) contagemBairro[p.vila_id] = (contagemBairro[p.vila_id] || 0) + 1
      })

      // Busca nomes das vilas
      const vilaIds = Object.keys(contagemBairro)
      let topBairros: { nome: string; totalPedidos: number }[] = []
      if (vilaIds.length > 0) {
        const { data: vilasData } = await supabase
          .from('vilas')
          .select('id, nome')
          .in('id', vilaIds)

        topBairros = (vilasData || [])
          .map((v: any) => ({ nome: v.nome, totalPedidos: contagemBairro[v.id] || 0 }))
          .sort((a, b) => b.totalPedidos - a.totalPedidos)
          .slice(0, 5)
      }

      // Receita por mês (12 meses do ano selecionado)
      const nomesMeses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
      const receitaPorMes = await Promise.all(
        Array.from({ length: 12 }, async (_, i) => {
          const m = i + 1
          const ini = new Date(ano, i, 1)
          const fim = new Date(ano, i + 1, 0, 23, 59, 59)
          const { data: p1 } = await supabase
            .from('pedidos')
            .select('total')
            .eq('status', 'CONCLUIDO')
            .gte('data_inicio', ini.toISOString())
            .lte('data_inicio', fim.toISOString())
          const { data: p2 } = await supabase
            .from('pedidos')
            .select('total')
            .eq('status', 'AGUARDANDO_RETIRADA')
            .gte('data_inicio', ini.toISOString())
            .lte('data_inicio', fim.toISOString())
          const receita = [...(p1 || []), ...(p2 || [])].reduce((acc, p: any) => acc + Number(p.total), 0)
          return { mes: m, label: nomesMeses[i], receita }
        })
      )

      return {
        success: true,
        data: {
          receitaConcluido,
          receitaConfirmado,
          receitaTotal,
          custoTotal,
          lucro,
          totalPedidos: totalPedidos || 0,
          topCustos,
          topBairros,
          receitaPorMes,
        }
      }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Erro ao buscar dashboard' }
    }
  }

  // ============================================
  // CATEGORIAS DE CUSTOS
  // ============================================

  async getCategoriasCustos(): Promise<ApiResponse<any[]>> {
    const response = await supabase
      .from('categorias_custos')
      .select('*')
      .eq('ativo', true)
      .order('nome', { ascending: true })

    return this.handleResponse(response)
  }

  async createCategoriaCusto(nome: string): Promise<ApiResponse<any>> {
    const id = generateUUID()
    const now = new Date().toISOString()
    const response = await supabase
      .from('categorias_custos')
      .insert({ id, nome, ativo: true, created_at: now, updated_at: now })
      .select()
      .single()

    return this.handleResponse(response)
  }

  async deleteCategoriaCusto(id: string): Promise<ApiResponse<void>> {
    const response = await supabase
      .from('categorias_custos')
      .update({ ativo: false })
      .eq('id', id)

    return this.handleResponse(response)
  }

  // ============================================
  // CUSTOS
  // ============================================

  async getCustos(mes?: number, ano?: number): Promise<ApiResponse<any[]>> {
    let query = supabase
      .from('custos')
      .select('*, categoria:categorias_custos(*)')
      .order('created_at', { ascending: false })

    if (mes !== undefined && ano !== undefined) {
      query = query.eq('mes', mes).eq('ano', ano)
    }

    return this.handleResponse(await query)
  }

  async createCusto(data: { categoriaId: string; valor: number; descricao?: string; mes: number; ano: number }): Promise<ApiResponse<any>> {
    const id = generateUUID()
    const now = new Date().toISOString()
    const response = await supabase
      .from('custos')
      .insert({
        id,
        categoria_id: data.categoriaId,
        valor: data.valor,
        descricao: data.descricao || null,
        mes: data.mes,
        ano: data.ano,
        created_at: now,
        updated_at: now
      })
      .select('*, categoria:categorias_custos(*)')
      .single()

    return this.handleResponse(response)
  }

  async deleteCusto(id: string): Promise<ApiResponse<void>> {
    const response = await supabase
      .from('custos')
      .delete()
      .eq('id', id)

    return this.handleResponse(response)
  }

  // ============================================
  // PERFIL DO CLIENTE
  // ============================================

  async getPerfis(): Promise<ApiResponse<any[]>> {
    const [usuariosRes, perfisRes] = await Promise.all([
      supabase.rpc('get_usuarios_auth'),
      supabase.from('perfis').select('user_id, whatsapp')
    ])

    if (usuariosRes.error) return { success: false, error: usuariosRes.error.message }

    const perfisMap: Record<string, string> = {}
    ;(perfisRes.data || []).forEach((p: any) => { perfisMap[p.user_id] = p.whatsapp })

    const data = (usuariosRes.data || []).map((u: any) => ({
      ...u,
      whatsapp: perfisMap[u.id] || ''
    }))

    return { success: true, data }
  }

  async getPerfil(userId: string): Promise<ApiResponse<any>> {
    const response = await supabase
      .from('perfis')
      .select('*')
      .eq('user_id', userId)
      .single()

    return this.handleResponse(response)
  }

  async upsertPerfil(userId: string, nome: string, whatsapp: string): Promise<ApiResponse<any>> {
    const { data: existing } = await supabase
      .from('perfis')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (existing) {
      const response = await supabase
        .from('perfis')
        .update({ nome, whatsapp, updated_at: new Date().toISOString() })
        .eq('user_id', userId)
        .select()
        .single()
      return this.handleResponse(response)
    }

    const id = generateUUID()
    const now = new Date().toISOString()
    const response = await supabase
      .from('perfis')
      .insert({ id, user_id: userId, nome, whatsapp, created_at: now, updated_at: now })
      .select()
      .single()
    return this.handleResponse(response)
  }

  // ============================================
  // CLIENTES (administração)
  // ============================================

  async getClientes(): Promise<ApiResponse<any[]>> {
    const { data, error } = await supabase
      .from('perfis')
      .select('*')
      .order('nome', { ascending: true })

    if (error) return { success: false, error: error.message }

    // Para cada cliente, busca contagem de pedidos
    const ids = (data || []).map((p: any) => p.user_id)
    let contagemMap: Record<string, number> = {}
    if (ids.length > 0) {
      const { data: pedidosCount } = await supabase
        .from('pedidos')
        .select('user_id')
        .in('user_id', ids)
        .neq('status', 'CANCELADO')

      ;(pedidosCount || []).forEach((p: any) => {
        contagemMap[p.user_id] = (contagemMap[p.user_id] || 0) + 1
      })
    }

    return {
      success: true,
      data: (data || []).map((p: any) => ({
        id: p.id,
        userId: p.user_id,
        nome: p.nome,
        whatsapp: p.whatsapp,
        cpf: p.cpf || null,
        totalPedidos: contagemMap[p.user_id] || 0,
        createdAt: p.created_at,
        updatedAt: p.updated_at,
      }))
    }
  }

  async createClienteManual(data: { nome: string; whatsapp: string; cpf?: string }): Promise<ApiResponse<any>> {
    const id = generateUUID()
    const userId = `manual_${id}`
    const now = new Date().toISOString()

    const response = await supabase
      .from('perfis')
      .insert({
        id,
        user_id: userId,
        nome: data.nome,
        whatsapp: data.whatsapp,
        ...(data.cpf ? { cpf: data.cpf } : {}),
        created_at: now,
        updated_at: now,
      })
      .select()
      .single()

    return this.handleResponse(response)
  }

  /**
   * Procura um cliente pelo telefone (ignorando formatação). Se não existir,
   * cadastra automaticamente na tabela de clientes (perfis).
   * Se `userId` for informado (cliente com conta), o cadastro é feito com esse user_id.
   */
  async garantirClientePorWhatsapp(data: {
    nome: string
    whatsapp: string
    userId?: string
  }): Promise<ApiResponse<{ cliente: any; criado: boolean }>> {
    const { data: perfis, error } = await supabase
      .from('perfis')
      .select('*')

    if (error) return { success: false, error: `Erro ao buscar clientes: ${error.message}` }

    const lista = perfis || []
    const existente =
      lista.find((p: any) => telefonesIguais(p.whatsapp, data.whatsapp)) ||
      (data.userId ? lista.find((p: any) => p.user_id === data.userId) : undefined)

    if (existente) {
      return { success: true, data: { cliente: existente, criado: false } }
    }

    const id = generateUUID()
    const now = new Date().toISOString()
    const response = await supabase
      .from('perfis')
      .insert({
        id,
        user_id: data.userId || `manual_${id}`,
        nome: data.nome,
        whatsapp: data.whatsapp,
        created_at: now,
        updated_at: now,
      })
      .select()
      .single()

    if (response.error) return { success: false, error: `Erro ao cadastrar cliente: ${response.error.message}` }
    return { success: true, data: { cliente: response.data, criado: true } }
  }

  async updateCliente(id: string, data: { nome: string; whatsapp: string; cpf?: string }): Promise<ApiResponse<any>> {
    const response = await supabase
      .from('perfis')
      .update({ nome: data.nome, whatsapp: data.whatsapp, ...(data.cpf !== undefined && data.cpf !== '' ? { cpf: data.cpf } : {}), updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    return this.handleResponse(response)
  }

  async deleteCliente(id: string): Promise<ApiResponse<void>> {
    // Busca o user_id antes de deletar para checar pedidos
    const { data: perfil } = await supabase
      .from('perfis')
      .select('user_id')
      .eq('id', id)
      .single()

    if (!perfil) return { success: false, error: 'Cliente não encontrado' }

    const { count } = await supabase
      .from('pedidos')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', perfil.user_id)

    if (count && count > 0) {
      return { success: false, error: 'Não é possível excluir clientes com pedidos vinculados' }
    }

    const { error } = await supabase.from('perfis').delete().eq('id', id)
    if (error) return { success: false, error: error.message }
    return { success: true }
  }

  // ============================================
  // INVENTÁRIO
  // ============================================

  async getInventario(): Promise<ApiResponse<any[]>> {
    const response = await supabase
      .from('inventario')
      .select('*')
      .order('item', { ascending: true })

    return this.handleResponse(response)
  }

  async getInventarioByItem(item: string): Promise<ApiResponse<any>> {
    const response = await supabase
      .from('inventario')
      .select('*')
      .eq('item', item)
      .single()

    return this.handleResponse(response)
  }

  async upsertInventario(item: string, quantidade: number): Promise<ApiResponse<any>> {
    // Verificar se já existe
    const { data: existing } = await supabase
      .from('inventario')
      .select('*')
      .eq('item', item)
      .single()

    if (existing) {
      const response = await supabase
        .from('inventario')
        .update({ quantidade, updated_at: new Date().toISOString() })
        .eq('item', item)
        .select()
        .single()
      return this.handleResponse(response)
    }

    const id = generateUUID()
    const now = new Date().toISOString()
    const response = await supabase
      .from('inventario')
      .insert({ id, item, quantidade, created_at: now, updated_at: now })
      .select()
      .single()
    return this.handleResponse(response)
  }

  // ============================================
  // PERDAS E QUEBRAS
  // ============================================

  private mapPerdaQuebra(item: any): PerdaQuebra {
    return {
      id: item.id,
      pedidoId: item.pedido_id,
      tipo: item.tipo,
      item: item.item,
      quantidade: item.quantidade,
      descricao: item.descricao,
      valorPrejuizo: item.valor_prejuizo ? Number(item.valor_prejuizo) : undefined,
      createdAt: new Date(item.created_at),
      updatedAt: new Date(item.updated_at),
      pedido: item.pedido
    }
  }

  async getPerdasQuebras(): Promise<ApiResponse<PerdaQuebra[]>> {
    const response = await supabase
      .from('perdas_quebras')
      .select('*, pedido:pedidos(id, nome_solicitante, whatsapp)')
      .order('created_at', { ascending: false })

    if (response.error) {
      return { success: false, error: response.error.message }
    }

    return {
      success: true,
      data: response.data?.map((item: Record<string, unknown>) => this.mapPerdaQuebra(item)) || []
    }
  }

  async getPerdasQuebrasPorPedido(pedidoId: string): Promise<ApiResponse<PerdaQuebra[]>> {
    const response = await supabase
      .from('perdas_quebras')
      .select('*')
      .eq('pedido_id', pedidoId)
      .order('created_at', { ascending: false })

    if (response.error) {
      return { success: false, error: response.error.message }
    }

    return {
      success: true,
      data: response.data?.map((item: Record<string, unknown>) => this.mapPerdaQuebra(item)) || []
    }
  }

  async createPerdaQuebra(data: PerdaQuebraFormData): Promise<ApiResponse<PerdaQuebra>> {
    const id = generateUUID()
    const now = new Date().toISOString()

    const response = await supabase
      .from('perdas_quebras')
      .insert({
        id,
        pedido_id: data.pedidoId,
        tipo: data.tipo,
        item: data.item,
        quantidade: data.quantidade,
        descricao: data.descricao,
        valor_prejuizo: data.valorPrejuizo,
        created_at: now,
        updated_at: now
      })
      .select()
      .single()

    if (response.error) {
      return { success: false, error: response.error.message }
    }

    return {
      success: true,
      data: this.mapPerdaQuebra(response.data)
    }
  }

  async deletePerdaQuebra(id: string): Promise<ApiResponse<void>> {
    const response = await supabase
      .from('perdas_quebras')
      .delete()
      .eq('id', id)

    return this.handleResponse(response)
  }
}

export const apiClient = new ApiClient()
