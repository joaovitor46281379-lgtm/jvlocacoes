-- ============================================
-- MIGRATION: migration-avulsas-config.sql
-- 1. Campos de avulsas em pedidos
-- 2. Tabela configuracoes (substitui hardcodes)
-- 3. RPC calcular_disponibilidade atualizada
-- ============================================
-- Execute no Supabase SQL Editor

-- ============================================
-- 1. Campos avulsas em pedidos
-- ============================================

ALTER TABLE pedidos
  ADD COLUMN IF NOT EXISTS mesas_avulsas INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS cadeiras_avulsas INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS valor_avulsos NUMERIC(10,2) NOT NULL DEFAULT 0;

-- ============================================
-- 2. Tabela configuracoes
-- ============================================

CREATE TABLE IF NOT EXISTS configuracoes (
  id TEXT PRIMARY KEY,
  valor TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Trigger updated_at
DROP TRIGGER IF EXISTS update_configuracoes_updated_at ON configuracoes;
CREATE TRIGGER update_configuracoes_updated_at
  BEFORE UPDATE ON configuracoes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Valores padrão
INSERT INTO configuracoes (id, valor) VALUES
  ('qtd_minima_pedido', '3'),
  ('preco_mesa_avulsa', '0'),
  ('preco_cadeira_avulsa', '0')
ON CONFLICT (id) DO NOTHING;

-- RLS: admin pode tudo, autenticados podem SELECT
ALTER TABLE configuracoes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Autenticados podem ver configuracoes" ON configuracoes;
CREATE POLICY "Autenticados podem ver configuracoes"
  ON configuracoes FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Admin pode editar configuracoes" ON configuracoes;
CREATE POLICY "Admin pode editar configuracoes"
  ON configuracoes FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ============================================
-- 3. RPC calcular_disponibilidade atualizada
--    Agora usa inventario (mesas/cadeiras) para
--    derivar o total de kits, em vez de hardcode 50
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
  v_total_mesas INTEGER;
  v_total_cadeiras INTEGER;
  v_total_kits INTEGER;
BEGIN
  -- Buscar estoque físico do inventário
  SELECT COALESCE(quantidade, 0) INTO v_total_mesas
  FROM inventario WHERE item = 'MESA';

  SELECT COALESCE(quantidade, 0) INTO v_total_cadeiras
  FROM inventario WHERE item = 'CADEIRA';

  -- 1 kit = 1 mesa + 4 cadeiras; total é o menor dos dois
  v_total_kits := LEAST(
    COALESCE(v_total_mesas, 0),
    FLOOR(COALESCE(v_total_cadeiras, 0) / 4)
  );

  -- Se inventário não configurado, fallback para 50
  IF v_total_kits = 0 THEN
    v_total_kits := 50;
  END IF;

  -- Kits reservados no período
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
-- 4. RLS em avaliacoes — cliente pode INSERT
-- ============================================

DROP POLICY IF EXISTS "Cliente pode criar avaliacao do proprio pedido" ON avaliacoes;
CREATE POLICY "Cliente pode criar avaliacao do proprio pedido"
  ON avaliacoes FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM pedidos
      WHERE pedidos.id = avaliacoes.pedido_id
        AND pedidos.user_id = auth.uid()::text
        AND pedidos.status = 'CONCLUIDO'
    )
  );

DROP POLICY IF EXISTS "Cliente pode ver proprias avaliacoes" ON avaliacoes;
CREATE POLICY "Cliente pode ver proprias avaliacoes"
  ON avaliacoes FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM pedidos
      WHERE pedidos.id = avaliacoes.pedido_id
        AND pedidos.user_id = auth.uid()::text
    )
  );
