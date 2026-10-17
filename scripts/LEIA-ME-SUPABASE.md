# 🔧 Correção do Banco de Dados Supabase

## Problema

O Prisma define defaults (`@default(uuid())`, `@default(now())`, `@updatedAt`) no schema, mas o Supabase não aplica automaticamente esses defaults. Por isso, precisamos configurar manualmente no banco.

## Solução

Execute o SQL de migration para configurar defaults automáticos.

## 📋 Passo a Passo

### 1. Acesse o Supabase Dashboard

1. Vá para: https://app.supabase.com
2. Selecione seu projeto: `jzllmthkwkccbveqmvnw`
3. No menu lateral, clique em **"SQL Editor"**

### 2. Execute a Migration

1. Clique em **"New Query"** (botão verde)
2. Abra o arquivo: `scripts/fix-supabase-defaults.sql`
3. **Copie TODO o conteúdo** do arquivo SQL
4. **Cole** no editor SQL do Supabase
5. Clique em **"Run"** (ou pressione Ctrl+Enter)

### 3. Verifique o Resultado

Você deve ver uma mensagem de sucesso. A última query mostrará uma tabela com todos os defaults configurados:

```
table_name        | column_name | column_default           | is_nullable
------------------|-------------|--------------------------|------------
disponibilidade   | created_at  | now()                    | NO
disponibilidade   | id          | uuid_generate_v4()       | NO
disponibilidade   | updated_at  | now()                    | NO
...
```

### 4. Limpe o Código (Opcional)

Após aplicar a migration, você pode remover os campos `id`, `created_at` e `updated_at` dos métodos `create*` no arquivo `shared/lib/api-client.ts`, pois o banco agora gera automaticamente.

## ✅ O que esta migration faz?

1. **UUID Automático**: Todas as tabelas agora geram `id` automaticamente usando `uuid_generate_v4()`
2. **created_at Automático**: Define `NOW()` como default para `created_at`
3. **updated_at Automático**:
   - Define `NOW()` como default inicial
   - Cria triggers que atualizam `updated_at` automaticamente em todo UPDATE

## 🧪 Teste

Após aplicar a migration, teste criar um agendamento. Agora deve funcionar sem erros de "null value in column".

## 🚨 Se algo der errado

Se houver algum erro ao executar o SQL, copie a mensagem de erro e me avise. Posso ajustar a migration.
