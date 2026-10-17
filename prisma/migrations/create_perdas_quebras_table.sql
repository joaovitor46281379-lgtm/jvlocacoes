-- Criar tabela de perdas e quebras
-- Execute este SQL no Supabase Dashboard > SQL Editor

-- ATENÇÃO: A tabela pedidos usa id do tipo TEXT, não UUID

CREATE TABLE IF NOT EXISTS perdas_quebras (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  pedido_id TEXT NOT NULL REFERENCES pedidos(id) ON DELETE CASCADE,
  tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('PERDA', 'QUEBRA')),
  item VARCHAR(20) NOT NULL CHECK (item IN ('MESA', 'CADEIRA')),
  quantidade INTEGER NOT NULL DEFAULT 1,
  descricao TEXT,
  valor_prejuizo DECIMAL(10,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índices
CREATE INDEX IF NOT EXISTS idx_perdas_quebras_pedido_id ON perdas_quebras(pedido_id);
CREATE INDEX IF NOT EXISTS idx_perdas_quebras_created_at ON perdas_quebras(created_at DESC);

-- RLS (Row Level Security) - permitir acesso público por enquanto
ALTER TABLE perdas_quebras ENABLE ROW LEVEL SECURITY;

-- Política para permitir todas as operações (ajuste conforme necessário)
CREATE POLICY "Allow all operations on perdas_quebras" ON perdas_quebras
  FOR ALL USING (true) WITH CHECK (true);


-- TAMBÉM: Adicionar coluna vila_id na tabela addresses se não existir
-- Verifique o tipo do id da tabela vilas antes de executar
ALTER TABLE addresses ADD COLUMN IF NOT EXISTS vila_id TEXT REFERENCES vilas(id);
