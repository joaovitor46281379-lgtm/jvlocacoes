### roadmap

Configuração Base

- ~~Setup /admin e /client - vite + tailwindcss~~
- ~~Configurar Git (repositório, .gitignore)~~
- ~~Setup Supabase (projeto, configuração de credenciais)~~
- ~~Configurar Prisma ORM e schema do banco~~
- ~~Setup shadcn/ui nos projetos~~

Backend/Database

- ~~Criar tabelas no PostgreSQL (kits, vilas, pedidos, pagamentos, disponibilidade, avaliacoes)~~
- ~~Configurar RLS (Row Level Security) no Supabase~~
- Setup Supabase Auth (Google + Telefone) // falta
- ~~Configurar Supabase Storage para uploads~~

Frontend Compartilhado

- ~~Setup React Hook Form + Zod~~
- ~~Setup Tanstack Query~~
- ~~Criar types compartilhados~~
- ~~Estruturar pasta shared/common~~

Client (Usuário)

- Tela de login (Google/Telefone)
- Calendário de disponibilidade (React Calendar)
- Formulário de agendamento de pedido
- Acompanhamento de status do pedido
- Avaliação de pedido finalizado
- Integração botão WhatsApp

Admin

- Tela de login admin
- CRUD de kits e preços
- CRUD de vilas e frete
- Dashboard de pedidos (novos/ativos/finalizados)
- Atualização de status de pedido
- Visualização de avaliações
- Controle de estoque
- Geração de contrato (quebra/extravio)

Integrações

- Mercado Pago SDK (PIX)
- Webhooks (Edge Functions)

Deploy

- Configurar Vercel (client + admin)
- Configurar domínios

### stack

frontend

- react + vite + typescript
- tailwindcss + shadcnui
- react hook form + zod
- tanstack query
- react calendar

backend/infra

- supabase — postgresql, auth, edge functions, storage
- prisma orm
- rls

integrações

- auth/cadastro/login — supabase auth (google, telefone)
- pagamento — mercado pago sdk (pix)
- whatsapp — link wa.me (sem api)
- upload — supabase storage

deploy

- frontend — vercel
- backend — supabase (edge functions para webhooks)

### features

usuário

- login google/telefone
- agendar pedido (data, endereço, quantidade, forma pagamento)
- visualizar calendário disponibilidade
- acompanhar status pedido
- avaliar pedido finalizado
- enviar pedido whatsapp

admin

- cadastrar vilas e frete
- gerenciar kits e preços
- visualizar estoque disponível
- dashboard pedidos (novos, ativos, finalizados)
- atualizar status pedido
- visualizar avaliações
- gerar contrato do pedido em caso de extravio/quebra e pedir para o cliente assinar
- registro de perda/quebra/controle de estoque de mesas e cadeiras

### estrutura de pastas & rotas

/app — usuários

/admin — admin

compartilhados — componentes, types, api

[jvlocacoes.com.br](http://jvlocacoes.com.br) — usuários

[admin.jvlocacoes.com.br](http://admin.jvlocacoes.com.br) — admin

### banco de dados

```
users (supabase auth)
kits (id, descricao, mesas, cadeiras, valor)
vilas (id, nome, valor_frete)
pedidos (id, user_id, nome_solicitante, whatsapp, data, endereco, vila_id, kit_id, quantidade, forma_pagamento, status, total)
pagamentos (id, pedido_id, mp_payment_id, qr_code, qr_code_base64, status, created_at)
disponibilidade (data, kits_disponiveis)
avaliacoes (pedido_id, estrelas, comentario)
```
