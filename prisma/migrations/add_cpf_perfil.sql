-- Adiciona CPF ao perfil do cliente
ALTER TABLE perfis ADD COLUMN IF NOT EXISTS cpf TEXT;
