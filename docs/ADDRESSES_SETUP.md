# Sistema de Endereços - Guia de Configuração

Este documento explica como configurar e usar o sistema de endereços de usuários.

## 📋 O que foi implementado

### 1. Schema do Banco de Dados
- ✅ Modelo `Address` no Prisma (`prisma/schema.prisma`)
- ✅ Migration SQL para criar a tabela no Supabase (`prisma/migrations/create_addresses_table.sql`)

### 2. Tipos TypeScript
- ✅ Interface `Address` em `shared/types/database.ts`
- ✅ Interface `AddressFormData` para formulários

### 3. API Client
- ✅ Métodos CRUD completos em `shared/lib/api-client.ts`:
  - `getAddresses(userId)` - Buscar todos os endereços do usuário
  - `getDefaultAddress(userId)` - Buscar endereço padrão
  - `createAddress(userId, data)` - Criar novo endereço
  - `updateAddress(id, data)` - Atualizar endereço
  - `setDefaultAddress(userId, addressId)` - Definir endereço padrão
  - `deleteAddress(id)` - Deletar endereço

### 4. React Query Hooks
- ✅ Hooks personalizados em `shared/hooks/use-addresses.ts`:
  - `useAddresses(userId)` - Buscar endereços
  - `useDefaultAddress(userId)` - Buscar endereço padrão
  - `useCreateAddress()` - Criar endereço
  - `useUpdateAddress()` - Atualizar endereço
  - `useSetDefaultAddress()` - Definir como padrão
  - `useDeleteAddress()` - Deletar endereço

### 5. Integração no Frontend
- ✅ `HomePage.tsx` atualizada para usar endereços salvos
- ✅ `AddressFormDrawer.tsx` com campo de referência
- ✅ Salvar endereços no banco ao invés de apenas no estado local

## 🚀 Como Configurar

### Passo 1: Criar a tabela no Supabase

Execute a migration SQL no seu projeto Supabase:

```bash
# Opção 1: Via Prisma (recomendado)
npm run db:push

# Opção 2: Manualmente no Supabase Dashboard
# Copie e cole o conteúdo de prisma/migrations/create_addresses_table.sql
# no SQL Editor do Supabase
```

### Passo 2: Gerar o Prisma Client

```bash
npm run db:generate
```

### Passo 3: Configurar Autenticação (TODO)

Atualmente, o sistema usa um `userId` temporário (`"temp-user-id"`). Você precisa:

1. Implementar sistema de autenticação (Supabase Auth, Auth0, etc.)
2. Criar um contexto de usuário
3. Substituir o `userId` fixo pelo ID real do usuário autenticado

Exemplo de como integrar:

```typescript
// context/UserContext.tsx
import { createContext, useContext } from 'react';

interface UserContextType {
  userId: string;
  user: User | null;
  // ...
}

export const UserContext = createContext<UserContextType>(null!);

// Em HomePage.tsx
const { userId } = useContext(UserContext);
const { data: addresses } = useAddresses(userId);
```

## 📊 Estrutura da Tabela `addresses`

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| id | UUID | Sim | ID único do endereço |
| user_id | TEXT | Sim | ID do usuário |
| street | TEXT | Sim | Nome da rua |
| number | TEXT | Sim | Número (aceita "S/N") |
| complement | TEXT | Não | Complemento (apto, casa, etc.) |
| neighborhood | TEXT | Sim | Bairro |
| city | TEXT | Sim | Cidade |
| state | TEXT | Sim | Estado (UF) |
| zip_code | TEXT | Sim | CEP |
| reference | TEXT | Não | Ponto de referência |
| is_default | BOOLEAN | Sim | Se é o endereço padrão |
| created_at | TIMESTAMP | Sim | Data de criação |
| updated_at | TIMESTAMP | Sim | Data de atualização |

## 🎯 Como Usar

### Buscar endereços do usuário

```typescript
import { useAddresses } from '@shared/hooks';

function MyComponent() {
  const userId = "user-123";
  const { data: addresses, isLoading } = useAddresses(userId);

  return (
    <div>
      {addresses?.map(addr => (
        <div key={addr.id}>
          {addr.street}, {addr.number}
        </div>
      ))}
    </div>
  );
}
```

### Criar novo endereço

```typescript
import { useCreateAddress } from '@shared/hooks';

function AddAddressForm() {
  const createAddress = useCreateAddress();

  const handleSubmit = async (data) => {
    await createAddress.mutateAsync({
      userId: "user-123",
      data: {
        street: "Rua das Flores",
        number: "123",
        neighborhood: "Centro",
        city: "Curitiba",
        state: "PR",
        zipCode: "80000-000",
        isDefault: true,
      }
    });
  };

  return <form onSubmit={handleSubmit}>...</form>;
}
```

### Definir endereço como padrão

```typescript
import { useSetDefaultAddress } from '@shared/hooks';

function AddressList() {
  const setDefault = useSetDefaultAddress();

  const handleSetDefault = async (addressId: string) => {
    await setDefault.mutateAsync({
      userId: "user-123",
      addressId
    });
  };

  return ...;
}
```

## 🔧 Próximos Passos

1. **Implementar autenticação de usuários**
   - Configurar Supabase Auth ou outro provedor
   - Criar contexto de usuário
   - Substituir userId temporário

2. **Adicionar validação de dados**
   - Validar CEP (formato e existência)
   - Validar campos obrigatórios
   - Adicionar Zod schemas

3. **Melhorar UX**
   - Criar lista de endereços salvos
   - Permitir edição de endereços
   - Confirmação ao deletar

4. **Integrar com pedidos**
   - Ao criar pedido, usar endereço completo
   - Salvar referência ao ID do endereço no pedido

5. **Adicionar recursos extras**
   - Geolocalização (salvar lat/lng)
   - Sugestões de endereço baseadas em histórico
   - Endereços favoritos

## 🐛 Troubleshooting

### Erro: "relation 'addresses' does not exist"
- Execute a migration SQL no Supabase
- Verifique se está conectado ao banco correto

### Endereços não aparecem
- Verifique se o `userId` está correto
- Confira se a tabela foi criada
- Veja o console para erros de API

### Erro ao salvar endereço
- Verifique se todos os campos obrigatórios estão preenchidos
- Confira as permissões no Supabase (RLS)
- Veja os logs no console do navegador
