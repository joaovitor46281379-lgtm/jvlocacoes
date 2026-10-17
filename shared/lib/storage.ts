import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Debug: verificar se as variáveis estão sendo carregadas
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Variáveis de ambiente não configuradas!')
  console.error('VITE_SUPABASE_URL:', supabaseUrl)
  console.error('VITE_SUPABASE_ANON_KEY:', supabaseAnonKey ? 'definida' : 'undefined')
} else {
  console.log('✅ Supabase configurado:', supabaseUrl)
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// ============================================
// TIPOS
// ============================================

export interface UploadResult {
  success: boolean
  url?: string
  path?: string
  error?: string
}

export interface UploadOptions {
  bucket: 'contratos' | 'kit-imagens'
  file: File
  path: string // Caminho dentro do bucket
  contentType?: string
}

// ============================================
// FUNÇÕES DE UPLOAD
// ============================================

/**
 * Faz upload de um arquivo para o Supabase Storage
 */
export async function uploadFile(options: UploadOptions): Promise<UploadResult> {
  try {
    const { bucket, file, path, contentType } = options

    // Validação de tipo de arquivo
    if (!validateFileType(file, bucket)) {
      return {
        success: false,
        error: 'Tipo de arquivo não permitido'
      }
    }

    // Validação de tamanho (5MB para contratos, 2MB para imagens)
    const maxSize = bucket === 'contratos' ? 5 * 1024 * 1024 : 2 * 1024 * 1024
    if (file.size > maxSize) {
      return {
        success: false,
        error: `Arquivo muito grande. Tamanho máximo: ${maxSize / 1024 / 1024}MB`
      }
    }

    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, file, {
        contentType: contentType || file.type,
        upsert: false
      })

    if (error) {
      console.error('Erro no upload:', error)
      return {
        success: false,
        error: error.message
      }
    }

    // Gera URL pública (apenas para kit-imagens, pois é público)
    let publicUrl: string | undefined

    if (bucket === 'kit-imagens') {
      const { data: urlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(data.path)
      publicUrl = urlData.publicUrl
    }

    return {
      success: true,
      path: data.path,
      url: publicUrl
    }
  } catch (err) {
    console.error('Erro no upload:', err)
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Erro desconhecido'
    }
  }
}

/**
 * Faz upload de imagem de kit
 */
export async function uploadKitImage(file: File, kitId: string): Promise<UploadResult> {
  const fileName = `${kitId}-${Date.now()}.${getFileExtension(file.name)}`
  const path = `kits/${fileName}`

  return uploadFile({
    bucket: 'kit-imagens',
    file,
    path
  })
}

/**
 * Faz upload de contrato
 */
export async function uploadContrato(
  file: File,
  pedidoId: string,
  userId: string
): Promise<UploadResult> {
  const fileName = `contrato-${Date.now()}.pdf`
  const path = `${pedidoId}/${userId}/${fileName}`

  return uploadFile({
    bucket: 'contratos',
    file,
    path,
    contentType: 'application/pdf'
  })
}

/**
 * Deleta um arquivo do storage
 */
export async function deleteFile(bucket: 'contratos' | 'kit-imagens', path: string): Promise<boolean> {
  try {
    const { error } = await supabase.storage
      .from(bucket)
      .remove([path])

    if (error) {
      console.error('Erro ao deletar arquivo:', error)
      return false
    }

    return true
  } catch (err) {
    console.error('Erro ao deletar arquivo:', err)
    return false
  }
}

/**
 * Deleta múltiplos arquivos
 */
export async function deleteFiles(bucket: 'contratos' | 'kit-imagens', paths: string[]): Promise<boolean> {
  try {
    const { error } = await supabase.storage
      .from(bucket)
      .remove(paths)

    if (error) {
      console.error('Erro ao deletar arquivos:', error)
      return false
    }

    return true
  } catch (err) {
    console.error('Erro ao deletar arquivos:', err)
    return false
  }
}

/**
 * Gera URL assinada temporária para arquivo privado (contratos)
 */
export async function getSignedUrl(path: string, expiresIn = 3600): Promise<string | null> {
  try {
    const { data, error } = await supabase.storage
      .from('contratos')
      .createSignedUrl(path, expiresIn)

    if (error || !data) {
      console.error('Erro ao gerar URL assinada:', error)
      return null
    }

    return data.signedUrl
  } catch (err) {
    console.error('Erro ao gerar URL assinada:', err)
    return null
  }
}

/**
 * Lista arquivos de um pedido
 */
export async function listPedidoFiles(pedidoId: string): Promise<string[]> {
  try {
    const { data, error } = await supabase.storage
      .from('contratos')
      .list(pedidoId, {
        sortBy: { column: 'created_at', order: 'desc' }
      })

    if (error || !data) {
      console.error('Erro ao listar arquivos:', error)
      return []
    }

    return data.map((file: { name: string }) => `${pedidoId}/${file.name}`)
  } catch (err) {
    console.error('Erro ao listar arquivos:', err)
    return []
  }
}

// ============================================
// HELPERS
// ============================================

function validateFileType(file: File, bucket: 'contratos' | 'kit-imagens'): boolean {
  if (bucket === 'contratos') {
    // Apenas PDFs para contratos
    return file.type === 'application/pdf'
  }

  if (bucket === 'kit-imagens') {
    // Apenas imagens
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    return allowedTypes.includes(file.type)
  }

  return false
}

function getFileExtension(filename: string): string {
  return filename.slice((filename.lastIndexOf('.') - 1 >>> 0) + 2)
}
