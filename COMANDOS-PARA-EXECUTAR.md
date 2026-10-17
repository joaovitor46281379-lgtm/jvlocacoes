# 🚀 Comandos para Executar - Sistema de Reservas por Período

Siga estes passos **na ordem** para aplicar todas as alterações.

---

## 📋 PASSO 1: Aplicar Migration SQL no Supabase

1. Acesse: https://app.supabase.com
2. Selecione seu projeto
3. Vá em **SQL Editor** → **New Query**
4. Copie TODO o conteúdo do arquivo: `scripts/migrate-to-period-reservations.sql`
5. Cole no editor e clique em **Run** (Ctrl+Enter)
6. Aguarde a confirmação de sucesso

---

## 📋 PASSO 2: (OPCIONAL) Aplicar Defaults Automáticos

Se ainda não aplicou o arquivo de correção de defaults:

1. No mesmo **SQL Editor** do Supabase
2. Abra uma **New Query**
3. Copie TODO o conteúdo do arquivo: `scripts/fix-supabase-defaults.sql`
4. Cole e clique em **Run**

---

## 📋 PASSO 3: Instalar Dependências (se necessário)

```bash
# Na raiz do projeto
cd C:\Users\luiz.VP\desktop\dev2\jvlocacoes

# Instalar dependências do client (se houver alterações)
cd client
npm install

# Voltar para raiz
cd ..
```

---

## 📋 PASSO 4: Iniciar o Servidor de Desenvolvimento

```bash
# Na pasta client
cd client
npm run dev
```

---

## ✅ Verificação

Após executar os comandos:

1. ✅ Acesse http://localhost:5173
2. ✅ Veja o calendário carregando disponibilidade dinâmica
3. ✅ Datas com menos de 3 kits devem aparecer em vermelho e desabilitadas
4. ✅ Datas com 3-10 kits devem aparecer em amarelo
5. ✅ Datas com mais de 10 kits devem aparecer em verde

---

## 🔧 Próximos Passos (ainda não implementados)

Ainda falta implementar:

1. **BookingPage**: Seletor de período (data início e data fim)
2. **HomePage**: Passar período selecionado para BookingPage

Quer que eu continue implementando essas partes?

---

## ⚠️ Problemas?

Se algo der errado:

1. Verifique se a migration SQL foi executada com sucesso
2. Confirme que não há erros no console do navegador
3. Verifique se o Supabase está acessível
4. Me avise e eu te ajudo!
