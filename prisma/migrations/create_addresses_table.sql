-- Criar tabela de endereços dos usuários
CREATE TABLE IF NOT EXISTS addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  street TEXT NOT NULL,
  number TEXT NOT NULL,
  complement TEXT,
  neighborhood TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  zip_code TEXT NOT NULL,
  reference TEXT,
  is_default BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Criar índices
CREATE INDEX IF NOT EXISTS idx_addresses_user_id ON addresses(user_id);
CREATE INDEX IF NOT EXISTS idx_addresses_is_default ON addresses(is_default);

-- Comentários para documentação
COMMENT ON TABLE addresses IS 'Endereços de entrega dos usuários';
COMMENT ON COLUMN addresses.user_id IS 'ID do usuário (pode ser temporário ou do sistema de autenticação)';
COMMENT ON COLUMN addresses.is_default IS 'Indica se é o endereço padrão do usuário';
COMMENT ON COLUMN addresses.reference IS 'Ponto de referência para facilitar a entrega';
