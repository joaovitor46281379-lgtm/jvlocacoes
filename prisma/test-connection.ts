import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testConnection() {
  try {
    console.log('🔍 Testando conexão com o banco...');

    // Testa conexão
    await prisma.$connect();
    console.log('✅ Conexão estabelecida com sucesso!');

    // Lista todas as tabelas (conta registros)
    const [kits, vilas, pedidos, pagamentos, disponibilidades, avaliacoes] = await Promise.all([
      prisma.kit.count(),
      prisma.vila.count(),
      prisma.pedido.count(),
      prisma.pagamento.count(),
      prisma.disponibilidade.count(),
      prisma.avaliacao.count(),
    ]);

    console.log('\n📊 Tabelas criadas:');
    console.log(`   - Kits: ${kits} registros`);
    console.log(`   - Vilas: ${vilas} registros`);
    console.log(`   - Pedidos: ${pedidos} registros`);
    console.log(`   - Pagamentos: ${pagamentos} registros`);
    console.log(`   - Disponibilidades: ${disponibilidades} registros`);
    console.log(`   - Avaliações: ${avaliacoes} registros`);

    // Cria um kit de teste
    console.log('\n🧪 Criando kit de teste...');
    const kitTeste = await prisma.kit.create({
      data: {
        descricao: 'Kit Teste - 1 mesa + 4 cadeiras',
        mesas: 1,
        cadeiras: 4,
        valor: 150.00,
      },
    });
    console.log(`✅ Kit criado: ${kitTeste.descricao} (ID: ${kitTeste.id})`);

    // Deleta o kit de teste
    await prisma.kit.delete({ where: { id: kitTeste.id } });
    console.log('🗑️  Kit de teste removido');

    console.log('\n✨ Todos os testes passaram!');
  } catch (error) {
    console.error('❌ Erro:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();
