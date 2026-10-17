-- ============================================
-- MIGRATION: Sistema de Reservas por Período
-- ============================================
-- Execute este SQL no Supabase SQL Editor

-- ============================================
-- 1. ADICIONAR CAMPOS DE PERÍODO NA TABELA PEDIDOS
-- ============================================

-- Adicionar coluna data_inicio (temporariamente nullable)
ALTER TABLE pedidos
  ADD COLUMN IF NOT EXISTS data_inicio TIMESTAMP WITH TIME ZONE;

-- Adicionar coluna data_fim (temporariamente nullable)
ALTER TABLE pedidos
  ADD COLUMN IF NOT EXISTS data_fim TIMESTAMP WITH TIME ZONE;

-- Copiar dados do campo 'data' para 'data_inicio' e 'data_fim'
-- (assume que o evento dura 1 dia)
UPDATE pedidos
SET
  data_inicio = data,
  data_fim = data + INTERVAL '1 day'
WHERE data_inicio IS NULL;

-- Tornar os campos obrigatórios agora que têm valores
ALTER TABLE pedidos
  ALTER COLUMN data_inicio SET NOT NULL,
  ALTER COLUMN data_fim SET NOT NULL;

-- ============================================
-- 2. REMOVER CAMPO ANTIGO 'data'
-- ============================================

-- Remover índice antigo
DROP INDEX IF EXISTS pedidos_data_idx;

-- Remover coluna 'data'
ALTER TABLE pedidos
  DROP COLUMN IF EXISTS data;

-- ============================================
-- 3. CRIAR ÍNDICES PARA PERFORMANCE
-- ============================================

-- Índice para data_inicio
CREATE INDEX IF NOT EXISTS pedidos_data_inicio_idx ON pedidos(data_inicio);

-- Índice para data_fim
CREATE INDEX IF NOT EXISTS pedidos_data_fim_idx ON pedidos(data_fim);

-- Índice composto para queries de sobreposição de período
CREATE INDEX IF NOT EXISTS pedidos_periodo_idx ON pedidos(data_inicio, data_fim);

-- ============================================
-- 4. DELETAR TABELA DE DISPONIBILIDADE (não é mais necessária)
-- ============================================

DROP TABLE IF EXISTS disponibilidade CASCADE;

-- ============================================
-- 5. CRIAR FUNÇÃO DE CÁLCULO DE DISPONIBILIDADE
-- ============================================

-- Função para calcular kits disponíveis em um período
CREATE OR REPLACE FUNCTION calcular_disponibilidade(
  p_data_inicio TIMESTAMP WITH TIME ZONE,
  p_data_fim TIMESTAMP WITH TIME ZONE
) RETURNS INTEGER AS $$
DECLARE
  v_kits_reservados INTEGER;
  v_kits_totais INTEGER := 50; -- Total de kits disponíveis
BEGIN
  -- Contar kits reservados em pedidos CONFIRMADOS que se sobrepõem ao período
  SELECT COALESCE(SUM(quantidade), 0)
  INTO v_kits_reservados
  FROM pedidos
  WHERE status = 'CONFIRMADO'
    AND data_inicio < p_data_fim
    AND data_fim > p_data_inicio;

  -- Retornar kits disponíveis
  RETURN v_kits_totais - v_kits_reservados;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 6. CRIAR VIEW PARA FACILITAR CONSULTAS
-- ============================================

CREATE OR REPLACE VIEW v_disponibilidade_periodo AS
SELECT
  p.data_inicio,
  p.data_fim,
  p.quantidade as kits_reservados,
  p.status,
  p.id as pedido_id
FROM pedidos p
WHERE p.status IN ('CONFIRMADO', 'EM_ANDAMENTO');

-- ============================================
-- 7. VERIFICAÇÃO
-- ============================================

-- Verificar estrutura da tabela pedidos
SELECT
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'pedidos'
  AND column_name IN ('data_inicio', 'data_fim')
ORDER BY column_name;

-- Testar função de disponibilidade (próximos 7 dias)
SELECT calcular_disponibilidade(
  NOW(),
  NOW() + INTERVAL '7 days'
) as kits_disponiveis;

-- Verificar que a tabela disponibilidade foi removida
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name = 'disponibilidade';
