# mcp-token-api

Provedor de **API Keys para MCPs e agentes de IA**, com dashboard web e autenticação de usuários via JWT.

## Como funciona

MCPs e agentes precisam de credenciais estáticas de longa duração — tokens JWT que expiram não servem para esse padrão. Este serviço separa os dois mundos:

| Quem | Como autentica | Para quê |
|------|----------------|----------|
| **Humano** | `POST /auth/login` → JWT (15 min) | Gerenciar API keys via dashboard |
| **MCP / Agente** | `X-Api-Key: mcp_sk_...` | Consumir recursos protegidos |

## Stack

- **API**: Node.js + TypeScript + Express 5
- **Frontend**: Angular 21 + Angular Material
- **Banco**: SQLite (`better-sqlite3`, WAL mode)
- **Auth humano**: JWT HS256, stateless, sem refresh
- **Auth agente**: API Key com 192 bits de entropia, hash SHA-256 no banco
- **Infra**: nginx (load balancer + serve do frontend) + 2 instâncias da API

---

## Início rápido (Docker)

### 1. Configurar variáveis de ambiente

```bash
cp .env.example .env
# edite .env com seus valores
```

O `JWT_ACCESS_SECRET` é necessário para o Docker Compose mas não está no `.env.example` — defina-o como variável de ambiente ou adicione ao `.env`:

```bash
# .env
JWT_ACCESS_SECRET=uma_string_aleatoria_com_minimo_32_caracteres
```

### 2. Subir os serviços

```bash
docker compose up -d --build
```

Isso constrói e sobe:
- `nginx` na porta `80` — serve o frontend e faz proxy da API
- `api1` e `api2` — duas instâncias do backend (load balance automático)

### 3. Verificar

```bash
curl http://localhost/health
# → {"status":"ok"}
```

Abra `http://localhost` no navegador para acessar o dashboard.

---

## Desenvolvimento local

```bash
npm install
npm run dev          # API com hot-reload (nodemon)
```

Em outro terminal:

```bash
cd frontend
npm install
npm start            # Angular dev server em http://localhost:4200
```

A variável `API_BASE_URL` no `.env` define para onde o MCP server aponta.

---

## Como usar

### 1. Criar conta

```bash
curl -X POST http://localhost/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Seu Nome","email":"email@exemplo.com","password":"senha1234"}'
```

### 2. Fazer login

```bash
curl -X POST http://localhost/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"email@exemplo.com","password":"senha1234"}'
# → { "access_token": "<jwt>", "user": { ... } }
```

### 3. Criar uma API Key para um agente

```bash
curl -X POST http://localhost/apikeys \
  -H "Authorization: Bearer <jwt>" \
  -H "Content-Type: application/json" \
  -d '{"name":"Meu agente Claude","scopes":"read,write"}'
# → { "key": "mcp_sk_a1b2c3...", "id": 1, ... }
#   ^ guarde esta chave — ela não será exibida novamente
```

### 4. Usar a chave no agente

```bash
# via header dedicado
curl http://localhost/validate \
  -H "X-Api-Key: mcp_sk_a1b2c3..."

# via Bearer token
curl http://localhost/validate \
  -H "Authorization: Bearer mcp_sk_a1b2c3..."
```

### 5. Revogar a chave

```bash
curl -X DELETE http://localhost/apikeys/1 \
  -H "Authorization: Bearer <jwt>"
```

---

## Endpoints

### Autenticação

| Método | Rota | Auth | Descrição |
|--------|------|------|-----------|
| POST | `/auth/register` | — | Cadastro (role padrão: `operator`) |
| POST | `/auth/login` | — | Login, retorna JWT |
| POST | `/auth/logout` | Bearer | Logout (JWT stateless — cliente descarta) |
| GET | `/auth/me` | Bearer | Dados do usuário autenticado |

### API Keys

| Método | Rota | Auth | Descrição |
|--------|------|------|-----------|
| POST | `/apikeys` | Bearer | Cria chave — raw key retornada **uma única vez** |
| GET | `/apikeys` | Bearer | Lista chaves do usuário |
| DELETE | `/apikeys/:id` | Bearer | Revoga chave |

### Validação (para uso pelo agente)

| Método | Rota | Auth | Descrição |
|--------|------|------|-----------|
| GET | `/validate` | X-Api-Key | Valida a chave e retorna os scopes |

### Administração (admin only)

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/users` | Lista usuários |
| PATCH | `/users/:id/role` | Altera role |

---

## Variáveis de ambiente

| Variável | Obrigatório | Descrição |
|----------|-------------|-----------|
| `JWT_ACCESS_SECRET` | Sim (Docker) | Secret para assinar JWTs — mínimo 32 chars |
| `JWT_ACCESS_EXPIRES_IN` | Não | Expiração do JWT (padrão: `15m`) |
| `PORT` | Não | Porta da API (padrão: `3000`) |
| `DATABASE_PATH` | Não | Caminho do SQLite (padrão: `./data/app.db`) |
| `OPENROUTER_API_KEY` | MCP server | Chave do OpenRouter para o pipeline LangGraph |
| `MCP_API_KEY` | MCP server | API Key gerada por este serviço para o agente |

---

## Arquitetura Docker

```
         ┌─────────────┐
:80  ──▶ │    nginx    │  frontend Angular + proxy API
         └──────┬──────┘
           ┌────┴────┐
      ┌────▼───┐ ┌───▼────┐
      │  api1  │ │  api2  │  Node.js :3000 (least_conn)
      └────┬───┘ └───┬────┘
           └────┬────┘
           ┌────▼────┐
           │ SQLite  │  volume Docker compartilhado (WAL mode)
           └─────────┘
```

## Segurança

- API keys armazenadas apenas como **hash SHA-256** — banco vazado não expõe as chaves
- `last_used_at` atualizado a cada uso para auditoria
- Revogação imediata via `DELETE /apikeys/:id`
- Suporte a `expires_at` por chave (expiração opcional)
- Senhas com bcrypt fator 12
- JWT stateless de curta duração apenas para sessões humanas
