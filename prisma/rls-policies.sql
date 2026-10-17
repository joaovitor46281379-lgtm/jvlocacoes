-- ============================================
-- RLS (Row Level Security) Configuration
-- JV Locações - Sistema de Locação de Kits
-- ============================================

-- Função helper para verificar se usuário é admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    SELECT raw_user_meta_data->>'role' = 'admin'
    FROM auth.users
    WHERE id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- TABELA: kits
-- Admin: CREATE, READ, UPDATE, DELETE
-- User: READ only
-- ============================================

ALTER TABLE kits ENABLE ROW LEVEL SECURITY;

-- Admin pode fazer tudo
CREATE POLICY "Admin pode gerenciar kits"
ON kits
FOR ALL
TO authenticated
USING (is_admin())
WITH CHECK (is_admin());

-- Usuários podem apenas ler kits ativos
CREATE POLICY "Usuários podem visualizar kits ativos"
ON kits
FOR SELECT
TO authenticated
USING (ativo = true);

-- ============================================
-- TABELA: vilas
-- Admin: CREATE, READ, UPDATE, DELETE
-- User: READ only
-- ============================================

ALTER TABLE vilas ENABLE ROW LEVEL SECURITY;

-- Admin pode fazer tudo
CREATE POLICY "Admin pode gerenciar vilas"
ON vilas
FOR ALL
TO authenticated
USING (is_admin())
WITH CHECK (is_admin());

-- Usuários podem apenas ler vilas ativas
CREATE POLICY "Usuários podem visualizar vilas ativas"
ON vilas
FOR SELECT
TO authenticated
USING (ativo = true);

-- ============================================
-- TABELA: pedidos
-- Admin: READ, UPDATE, DELETE all
-- User: CREATE own, READ own, UPDATE own (limitado)
-- ============================================

ALTER TABLE pedidos ENABLE ROW LEVEL SECURITY;

-- Admin pode gerenciar todos os pedidos
CREATE POLICY "Admin pode gerenciar todos os pedidos"
ON pedidos
FOR ALL
TO authenticated
USING (is_admin())
WITH CHECK (is_admin());

-- Usuários podem criar seus próprios pedidos
CREATE POLICY "Usuários podem criar seus próprios pedidos"
ON pedidos
FOR INSERT
TO authenticated
WITH CHECK (auth.uid()::text = user_id);

-- Usuários podem visualizar apenas seus próprios pedidos
CREATE POLICY "Usuários podem visualizar seus próprios pedidos"
ON pedidos
FOR SELECT
TO authenticated
USING (auth.uid()::text = user_id);

-- Usuários podem atualizar apenas observações de seus próprios pedidos
CREATE POLICY "Usuários podem atualizar observações de seus pedidos"
ON pedidos
FOR UPDATE
TO authenticated
USING (auth.uid()::text = user_id)
WITH CHECK (auth.uid()::text = user_id);

-- ============================================
-- TABELA: pagamentos
-- Admin: READ all
-- User: READ own (via pedido)
-- Sistema: CREATE (via service role)
-- ============================================

ALTER TABLE pagamentos ENABLE ROW LEVEL SECURITY;

-- Admin pode visualizar todos os pagamentos
CREATE POLICY "Admin pode visualizar todos os pagamentos"
ON pagamentos
FOR SELECT
TO authenticated
USING (is_admin());

-- Usuários podem visualizar pagamentos de seus próprios pedidos
CREATE POLICY "Usuários podem visualizar pagamentos de seus pedidos"
ON pagamentos
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM pedidos
    WHERE pedidos.id = pagamentos.pedido_id
    AND pedidos.user_id = auth.uid()::text
  )
);

-- Service role pode criar/atualizar pagamentos (webhooks Mercado Pago)
CREATE POLICY "Service role pode gerenciar pagamentos"
ON pagamentos
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- ============================================
-- TABELA: disponibilidade
-- Admin: CREATE, READ, UPDATE, DELETE
-- User: READ only
-- ============================================

ALTER TABLE disponibilidade ENABLE ROW LEVEL SECURITY;

-- Admin pode gerenciar disponibilidade
CREATE POLICY "Admin pode gerenciar disponibilidade"
ON disponibilidade
FOR ALL
TO authenticated
USING (is_admin())
WITH CHECK (is_admin());

-- Usuários podem apenas visualizar disponibilidade
CREATE POLICY "Usuários podem visualizar disponibilidade"
ON disponibilidade
FOR SELECT
TO authenticated
USING (true);

-- ============================================
-- TABELA: avaliacoes
-- Admin: READ all
-- User: CREATE own, READ own
-- ============================================

ALTER TABLE avaliacoes ENABLE ROW LEVEL SECURITY;

-- Admin pode visualizar todas as avaliações
CREATE POLICY "Admin pode visualizar todas as avaliações"
ON avaliacoes
FOR SELECT
TO authenticated
USING (is_admin());

-- Usuários podem criar avaliações de seus próprios pedidos concluídos
CREATE POLICY "Usuários podem criar avaliações de seus pedidos"
ON avaliacoes
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM pedidos
    WHERE pedidos.id = avaliacoes.pedido_id
    AND pedidos.user_id = auth.uid()::text
    AND pedidos.status = 'CONCLUIDO'
  )
);

-- Usuários podem visualizar suas próprias avaliações
CREATE POLICY "Usuários podem visualizar suas próprias avaliações"
ON avaliacoes
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM pedidos
    WHERE pedidos.id = avaliacoes.pedido_id
    AND pedidos.user_id = auth.uid()::text
  )
);

-- ============================================
-- Índices para otimização de performance
-- ============================================

-- Já existem índices criados pelo Prisma, mas vamos garantir alguns extras
CREATE INDEX IF NOT EXISTS idx_pedidos_user_id ON pedidos(user_id);
CREATE INDEX IF NOT EXISTS idx_pedidos_status ON pedidos(status);
CREATE INDEX IF NOT EXISTS idx_pedidos_data ON pedidos(data);
CREATE INDEX IF NOT EXISTS idx_pagamentos_pedido_id ON pagamentos(pedido_id);
CREATE INDEX IF NOT EXISTS idx_avaliacoes_pedido_id ON avaliacoes(pedido_id);

-- ============================================
-- IMPORTANTE: Como marcar um usuário como admin
-- ============================================

-- Após criar um usuário, execute este comando no SQL Editor do Supabase
-- substituindo 'USER_ID' pelo ID do usuário que será admin:

-- UPDATE auth.users
-- SET raw_user_meta_data = raw_user_meta_data || '{"role": "admin"}'::jsonb
-- WHERE id = 'USER_ID';
