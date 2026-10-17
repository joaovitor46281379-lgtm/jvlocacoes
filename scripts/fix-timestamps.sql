-- ============================================
-- MIGRATION: fix-timestamps.sql
-- Garantir DEFAULT NOW() em todas as tabelas críticas
-- e criar/verificar a função calcular_disponibilidade
-- ============================================
-- Execute no Supabase SQL Editor:
-- Dashboard > SQL Editor > New Query > Cole e Execute

-- ============================================
-- 1. DEFAULT NOW() para created_at e updated_at
-- ============================================

-- Kits
ALTER TABLE kits
  ALTER COLUMN created_at SET DEFAULT NOW(),
  ALTER COLUMN updated_at SET DEFAULT NOW();

-- Vilas
ALTER TABLE vilas
  ALTER COLUMN created_at SET DEFAULT NOW(),
  ALTER COLUMN updated_at SET DEFAULT NOW();

-- Avaliacoes
ALTER TABLE avaliacoes
  ALTER COLUMN created_at SET DEFAULT NOW(),
  ALTER COLUMN updated_at SET DEFAULT NOW();

-- Pedidos
ALTER TABLE pedidos
  ALTER COLUMN created_at SET DEFAULT NOW(),
  ALTER COLUMN updated_at SET DEFAULT NOW();

-- Pagamentos
ALTER TABLE pagamentos
  ALTER COLUMN created_at SET DEFAULT NOW(),
  ALTER COLUMN updated_at SET DEFAULT NOW();

-- ============================================
-- 2. TRIGGER para atualizar updated_at automaticamente no UPDATE
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Kits
DROP TRIGGER IF EXISTS update_kits_updated_at ON kits;
CREATE TRIGGER update_kits_updated_at
  BEFORE UPDATE ON kits
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Vilas
DROP TRIGGER IF EXISTS update_vilas_updated_at ON vilas;
CREATE TRIGGER update_vilas_updated_at
  BEFORE UPDATE ON vilas
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Avaliacoes
DROP TRIGGER IF EXISTS update_avaliacoes_updated_at ON avaliacoes;
CREATE TRIGGER update_avaliacoes_updated_at
  BEFORE UPDATE ON avaliacoes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Pedidos
DROP TRIGGER IF EXISTS update_pedidos_updated_at ON pedidos;
CREATE TRIGGER update_pedidos_updated_at
  BEFORE UPDATE ON pedidos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Pagamentos
DROP TRIGGER IF EXISTS update_pagamentos_updated_at ON pagamentos;
CREATE TRIGGER update_pagamentos_updated_at
  BEFORE UPDATE ON pagamentos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 3. RPC calcular_disponibilidade
--    Retorna quantos kits estão disponíveis para um período
--    (necessário para o dashboard e fluxo de pedidos)
-- ============================================

CREATE OR REPLACE FUNCTION calcular_disponibilidade(
  p_data_inicio TIMESTAMPTZ,
  p_data_fim TIMESTAMPTZ
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_kits_reservados INTEGER;
  v_total_kits INTEGER := 50; -- Altere conforme o total real do seu estoque
BEGIN
  SELECT COALESCE(SUM(quantidade), 0)
  INTO v_kits_reservados
  FROM pedidos
  WHERE status IN ('AGUARDANDO_ENTREGA', 'AGUARDANDO_RETIRADA')
    AND data_inicio <= p_data_fim
    AND data_fim >= p_data_inicio;

  RETURN GREATEST(0, v_total_kits - v_kits_reservados);
END;
$$;

-- ============================================
-- 4. RLS: garantir que admin pode SELECT em avaliacoes
-- ============================================

-- Verificar se a função is_admin existe (necessária para as policies)
-- Se não existir, crie manualmente no Supabase Auth > Policies

-- Policy de SELECT para admin em avaliacoes (idempotente)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'avaliacoes'
      AND policyname = 'Admin pode visualizar todas as avaliacoes'
  ) THEN
    CREATE POLICY "Admin pode visualizar todas as avaliacoes"
      ON avaliacoes FOR SELECT
      USING (is_admin());
  END IF;
END $$;

-- ============================================
-- 5. VERIFICAÇÃO: confirmar defaults configurados
-- ============================================

SELECT
  table_name,
  column_name,
  column_default,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN ('kits', 'vilas', 'avaliacoes', 'pedidos', 'pagamentos')
  AND column_name IN ('created_at', 'updated_at')
ORDER BY table_name, column_name;
