import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Iniciando seed do banco de dados...\n')

  // Limpar dados existentes (cuidado em produção!)
  console.log('🗑️  Limpando dados existentes...')
  await prisma.avaliacao.deleteMany()
  await prisma.pagamento.deleteMany()
  await prisma.pedido.deleteMany()
  await prisma.disponibilidade.deleteMany()
  await prisma.kit.deleteMany()
  await prisma.vila.deleteMany()

  // 1. Criar Kits
  console.log('📦 Criando kits...')
  const kits = await Promise.all([
    prisma.kit.create({
      data: {
        descricao: 'Kit Básico',
        mesas: 4,
        cadeiras: 16,
        valor: 120.00,
        ativo: true,
      },
    }),
    prisma.kit.create({
      data: {
        descricao: 'Kit Médio',
        mesas: 8,
        cadeiras: 32,
        valor: 220.00,
        ativo: true,
      },
    }),
    prisma.kit.create({
      data: {
        descricao: 'Kit Grande',
        mesas: 12,
        cadeiras: 48,
        valor: 320.00,
        ativo: true,
      },
    }),
    prisma.kit.create({
      data: {
        descricao: 'Kit Premium',
        mesas: 16,
        cadeiras: 64,
        valor: 450.00,
        ativo: true,
      },
    }),
    prisma.kit.create({
      data: {
        descricao: 'Kit Mini (Inativo)',
        mesas: 2,
        cadeiras: 8,
        valor: 80.00,
        ativo: false,
      },
    }),
  ])
  console.log(`✅ ${kits.length} kits criados`)

  // 2. Criar Vilas
  console.log('\n🏘️  Criando vilas...')
  const vilas = await Promise.all([
    prisma.vila.create({
      data: {
        nome: 'Vila Centro',
        valorFrete: 30.00,
        ativo: true,
      },
    }),
    prisma.vila.create({
      data: {
        nome: 'Vila Norte',
        valorFrete: 45.00,
        ativo: true,
      },
    }),
    prisma.vila.create({
      data: {
        nome: 'Vila Sul',
        valorFrete: 40.00,
        ativo: true,
      },
    }),
    prisma.vila.create({
      data: {
        nome: 'Vila Leste',
        valorFrete: 50.00,
        ativo: true,
      },
    }),
    prisma.vila.create({
      data: {
        nome: 'Vila Oeste',
        valorFrete: 55.00,
        ativo: true,
      },
    }),
    prisma.vila.create({
      data: {
        nome: 'Vila São João',
        valorFrete: 35.00,
        ativo: true,
      },
    }),
    prisma.vila.create({
      data: {
        nome: 'Vila Maria',
        valorFrete: 38.00,
        ativo: true,
      },
    }),
    prisma.vila.create({
      data: {
        nome: 'Vila Distante (Inativa)',
        valorFrete: 100.00,
        ativo: false,
      },
    }),
  ])
  console.log(`✅ ${vilas.length} vilas criadas`)

  // 3. Criar Disponibilidade (próximos 60 dias)
  console.log('\n📅 Criando disponibilidade...')
  const hoje = new Date()
  // Forçar UTC para evitar problemas de timezone
  const hojeUTC = new Date(Date.UTC(hoje.getFullYear(), hoje.getMonth(), hoje.getDate()))

  const disponibilidades = []
  for (let i = 0; i < 60; i++) {
    const data = new Date(hojeUTC)
    data.setUTCDate(hojeUTC.getUTCDate() + i)

    // Variar quantidade de kits disponíveis
    let kitsDisponiveis = 5

    // Finais de semana: mais kits disponíveis
    const diaSemana = data.getDay()
    if (diaSemana === 0 || diaSemana === 6) {
      kitsDisponiveis = 8
    }

    // Alguns dias específicos com menos disponibilidade
    if (i % 7 === 0) {
      kitsDisponiveis = 2
    }

    // Alguns dias indisponíveis
    if (i % 11 === 0) {
      kitsDisponiveis = 0
    }

    disponibilidades.push(
      prisma.disponibilidade.create({
        data: {
          data: data,
          kitsDisponiveis: kitsDisponiveis,
        },
      })
    )
  }

  await Promise.all(disponibilidades)
  console.log(`✅ ${disponibilidades.length} dias de disponibilidade criados`)

  // 4. Criar Pedidos de exemplo
  console.log('\n📝 Criando pedidos de exemplo...')

  // Pedido 1: Pendente
  const dataFutura10 = new Date(hojeUTC)
  dataFutura10.setUTCDate(hojeUTC.getUTCDate() + 10)

  const pedido1 = await prisma.pedido.create({
    data: {
      userId: 'temp-user-id',
      nomeSolicitante: 'João Silva',
      whatsapp: '(11) 98765-4321',
      data: dataFutura10, // +10 dias
      endereco: 'Rua das Flores, 123 - Centro',
      vilaId: vilas[0].id,
      kitId: kits[1].id,
      quantidade: 2,
      formaPagamento: 'PIX',
      status: 'PENDENTE',
      total: (kits[1].valor * 2) + vilas[0].valorFrete,
      observacoes: 'Preciso para festa de aniversário',
    },
  })

  // Pedido 2: Confirmado
  const dataFutura15 = new Date(hojeUTC)
  dataFutura15.setUTCDate(hojeUTC.getUTCDate() + 15)

  const pedido2 = await prisma.pedido.create({
    data: {
      userId: 'temp-user-id',
      nomeSolicitante: 'Maria Santos',
      whatsapp: '(11) 97654-3210',
      data: dataFutura15, // +15 dias
      endereco: 'Av. Principal, 456 - Vila Norte',
      vilaId: vilas[1].id,
      kitId: kits[2].id,
      quantidade: 1,
      formaPagamento: 'DINHEIRO',
      status: 'CONFIRMADO',
      total: kits[2].valor + vilas[1].valorFrete,
    },
  })

  // Pedido 3: Em Andamento
  const dataFutura2 = new Date(hojeUTC)
  dataFutura2.setUTCDate(hojeUTC.getUTCDate() + 2)

  const pedido3 = await prisma.pedido.create({
    data: {
      userId: 'temp-user-id',
      nomeSolicitante: 'Pedro Costa',
      whatsapp: '(11) 96543-2109',
      data: dataFutura2, // +2 dias
      endereco: 'Rua do Comércio, 789 - Vila Sul',
      vilaId: vilas[2].id,
      kitId: kits[0].id,
      quantidade: 3,
      formaPagamento: 'CARTAO',
      status: 'EM_ANDAMENTO',
      total: (kits[0].valor * 3) + vilas[2].valorFrete,
      observacoes: 'Entregar às 8h da manhã',
    },
  })

  // Pedido 4: Finalizado (com avaliação)
  const dataPassada5 = new Date(hojeUTC)
  dataPassada5.setUTCDate(hojeUTC.getUTCDate() - 5)

  const pedido4 = await prisma.pedido.create({
    data: {
      userId: 'temp-user-id',
      nomeSolicitante: 'Ana Paula',
      whatsapp: '(11) 95432-1098',
      data: dataPassada5, // -5 dias (passado)
      endereco: 'Rua da Paz, 321 - Vila Centro',
      vilaId: vilas[0].id,
      kitId: kits[3].id,
      quantidade: 1,
      formaPagamento: 'PIX',
      status: 'FINALIZADO',
      total: kits[3].valor + vilas[0].valorFrete,
    },
  })

  await prisma.avaliacao.create({
    data: {
      pedidoId: pedido4.id,
      estrelas: 5,
      comentario: 'Excelente serviço! Tudo chegou no horário e em perfeito estado.',
    },
  })

  // Pedido 5: Finalizado (sem avaliação)
  const dataPassada10 = new Date(hojeUTC)
  dataPassada10.setUTCDate(hojeUTC.getUTCDate() - 10)

  const pedido5 = await prisma.pedido.create({
    data: {
      userId: 'temp-user-id',
      nomeSolicitante: 'Carlos Mendes',
      whatsapp: '(11) 94321-0987',
      data: dataPassada10, // -10 dias
      endereco: 'Av. Brasil, 654 - Vila Leste',
      vilaId: vilas[3].id,
      kitId: kits[1].id,
      quantidade: 2,
      formaPagamento: 'DINHEIRO',
      status: 'FINALIZADO',
      total: (kits[1].valor * 2) + vilas[3].valorFrete,
    },
  })

  // Pedido 6: Cancelado
  const dataFutura20 = new Date(hojeUTC)
  dataFutura20.setUTCDate(hojeUTC.getUTCDate() + 20)

  const pedido6 = await prisma.pedido.create({
    data: {
      userId: 'temp-user-id',
      nomeSolicitante: 'Fernanda Lima',
      whatsapp: '(11) 93210-9876',
      data: dataFutura20, // +20 dias
      endereco: 'Rua Nova, 987 - Vila Oeste',
      vilaId: vilas[4].id,
      kitId: kits[0].id,
      quantidade: 1,
      formaPagamento: 'PIX',
      status: 'CANCELADO',
      total: kits[0].valor + vilas[4].valorFrete,
      observacoes: 'Cancelei pois mudei a data do evento',
    },
  })

  console.log(`✅ 6 pedidos criados (1 com avaliação)`)

  console.log('\n✨ Seed concluído com sucesso!\n')
  console.log('📊 Resumo:')
  console.log(`   - ${kits.length} kits`)
  console.log(`   - ${vilas.length} vilas`)
  console.log(`   - ${disponibilidades.length} dias de disponibilidade`)
  console.log(`   - 6 pedidos`)
  console.log(`   - 1 avaliação`)
}

main()
  .catch((e) => {
    console.error('❌ Erro ao executar seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
