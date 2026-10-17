-- ============================================
-- MIGRATION: Configurar defaults automáticos no Supabase
-- ============================================
-- Execute este SQL no Supabase SQL Editor
-- Dashboard > SQL Editor > New Query > Cole e Execute

-- ============================================
-- 1. CONFIGURAR UUID AUTOMÁTICO PARA TODAS AS TABELAS
-- ============================================

-- Habilitar extensão uuid-ossp se não estiver habilitada
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Configurar default UUID para kits
ALTER TABLE kits
  ALTER COLUMN id SET DEFAULT uuid_generate_v4();

-- Configurar default UUID para vilas
ALTER TABLE vilas
  ALTER COLUMN id SET DEFAULT uuid_generate_v4();

-- Configurar default UUID para pedidos
ALTER TABLE pedidos
  ALTER COLUMN id SET DEFAULT uuid_generate_v4();

-- Configurar default UUID para disponibilidade
ALTER TABLE disponibilidade
  ALTER COLUMN id SET DEFAULT uuid_generate_v4();

-- Configurar default UUID para avaliacoes
ALTER TABLE avaliacoes
  ALTER COLUMN id SET DEFAULT uuid_generate_v4();

-- Configurar default UUID para pagamentos
ALTER TABLE pagamentos
  ALTER COLUMN id SET DEFAULT uuid_generate_v4();

-- ============================================
-- 2. CONFIGURAR TIMESTAMPS AUTOMÁTICOS
-- ============================================

-- Criar função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger em kits
DROP TRIGGER IF EXISTS update_kits_updated_at ON kits;
CREATE TRIGGER update_kits_updated_at
  BEFORE UPDATE ON kits
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Aplicar trigger em vilas
DROP TRIGGER IF EXISTS update_vilas_updated_at ON vilas;
CREATE TRIGGER update_vilas_updated_at
  BEFORE UPDATE ON vilas
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Aplicar trigger em pedidos
DROP TRIGGER IF EXISTS update_pedidos_updated_at ON pedidos;
CREATE TRIGGER update_pedidos_updated_at
  BEFORE UPDATE ON pedidos
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Aplicar trigger em disponibilidade
DROP TRIGGER IF EXISTS update_disponibilidade_updated_at ON disponibilidade;
CREATE TRIGGER update_disponibilidade_updated_at
  BEFORE UPDATE ON disponibilidade
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Aplicar trigger em avaliacoes
DROP TRIGGER IF EXISTS update_avaliacoes_updated_at ON avaliacoes;
CREATE TRIGGER update_avaliacoes_updated_at
  BEFORE UPDATE ON avaliacoes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Aplicar trigger em pagamentos
DROP TRIGGER IF EXISTS update_pagamentos_updated_at ON pagamentos;
CREATE TRIGGER update_pagamentos_updated_at
  BEFORE UPDATE ON pagamentos
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 3. CONFIGURAR DEFAULTS PARA created_at E updated_at
-- ============================================

-- Kits
ALTER TABLE kits
  ALTER COLUMN created_at SET DEFAULT NOW(),
  ALTER COLUMN updated_at SET DEFAULT NOW();

-- Vilas
ALTER TABLE vilas
  ALTER COLUMN created_at SET DEFAULT NOW(),
  ALTER COLUMN updated_at SET DEFAULT NOW();

-- Pedidos
ALTER TABLE pedidos
  ALTER COLUMN created_at SET DEFAULT NOW(),
  ALTER COLUMN updated_at SET DEFAULT NOW();

-- Disponibilidade
ALTER TABLE disponibilidade
  ALTER COLUMN created_at SET DEFAULT NOW(),
  ALTER COLUMN updated_at SET DEFAULT NOW();

-- Avaliacoes
ALTER TABLE avaliacoes
  ALTER COLUMN created_at SET DEFAULT NOW(),
  ALTER COLUMN updated_at SET DEFAULT NOW();

-- Pagamentos
ALTER TABLE pagamentos
  ALTER COLUMN created_at SET DEFAULT NOW(),
  ALTER COLUMN updated_at SET DEFAULT NOW();

-- ============================================
-- 4. VERIFICAÇÃO
-- ============================================

-- Listar todas as tabelas com seus defaults configurados
SELECT
  table_name,
  column_name,
  column_default,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN ('kits', 'vilas', 'pedidos', 'disponibilidade', 'avaliacoes', 'pagamentos')
  AND column_name IN ('id', 'created_at', 'updated_at')
ORDER BY table_name, column_name;
