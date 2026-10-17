-- ============================================
-- STORAGE POLICIES - Supabase Storage
-- JV Locações - Sistema de Locação de Kits
-- ============================================

-- Bucket: contratos
-- Documentos de contratos em caso de quebra/extravio
-- Admin: READ, WRITE, DELETE
-- User: READ own only

-- Policy: Admin pode fazer upload de contratos
CREATE POLICY "Admin pode fazer upload de contratos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'contratos'
  AND (
    SELECT raw_user_meta_data->>'role' = 'admin'
    FROM auth.users
    WHERE id = auth.uid()
  )
);

-- Policy: Admin pode atualizar contratos
CREATE POLICY "Admin pode atualizar contratos"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'contratos'
  AND (
    SELECT raw_user_meta_data->>'role' = 'admin'
    FROM auth.users
    WHERE id = auth.uid()
  )
);

-- Policy: Admin pode deletar contratos
CREATE POLICY "Admin pode deletar contratos"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'contratos'
  AND (
    SELECT raw_user_meta_data->>'role' = 'admin'
    FROM auth.users
    WHERE id = auth.uid()
  )
);

-- Policy: Usuários podem visualizar contratos de seus pedidos
CREATE POLICY "Usuários podem visualizar seus contratos"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'contratos'
  AND (
    -- Admin pode ver todos
    (
      SELECT raw_user_meta_data->>'role' = 'admin'
      FROM auth.users
      WHERE id = auth.uid()
    )
    OR
    -- Usuário pode ver apenas contratos que contém seu user_id no path
    -- Formato: contratos/{pedido_id}/{user_id}/contrato.pdf
    (storage.foldername(name))[2] = auth.uid()::text
  )
);

-- ============================================

-- Bucket: kit-imagens
-- Fotos dos kits de mesas e cadeiras
-- Admin: READ, WRITE, DELETE
-- User: READ only (público)

-- Policy: Admin pode fazer upload de imagens de kits
CREATE POLICY "Admin pode fazer upload de imagens de kits"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'kit-imagens'
  AND (
    SELECT raw_user_meta_data->>'role' = 'admin'
    FROM auth.users
    WHERE id = auth.uid()
  )
);

-- Policy: Admin pode atualizar imagens de kits
CREATE POLICY "Admin pode atualizar imagens de kits"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'kit-imagens'
  AND (
    SELECT raw_user_meta_data->>'role' = 'admin'
    FROM auth.users
    WHERE id = auth.uid()
  )
);

-- Policy: Admin pode deletar imagens de kits
CREATE POLICY "Admin pode deletar imagens de kits"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'kit-imagens'
  AND (
    SELECT raw_user_meta_data->>'role' = 'admin'
    FROM auth.users
    WHERE id = auth.uid()
  )
);

-- Policy: Todos podem visualizar imagens de kits (público)
CREATE POLICY "Todos podem visualizar imagens de kits"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'kit-imagens');
