-- Seed inicial de bairros
-- Execute este SQL no Supabase SQL Editor para criar bairros de exemplo

INSERT INTO vilas (id, nome, valor_frete, ativo, created_at, updated_at) VALUES
  (gen_random_uuid(), 'Centro', 10.00, true, now(), now()),
  (gen_random_uuid(), 'Jardim Primavera', 15.00, true, now(), now()),
  (gen_random_uuid(), 'Vila Nova', 12.00, true, now(), now()),
  (gen_random_uuid(), 'Bairro Alto', 18.00, true, now(), now()),
  (gen_random_uuid(), 'Zona Norte', 20.00, true, now(), now())
ON CONFLICT (nome) DO NOTHING;
