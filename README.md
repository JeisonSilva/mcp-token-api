# mcp-token-api

Provedor de **API Keys para MCPs e agentes de IA**, com autenticação de usuários via JWT.

## Conceito

MCPs e agentes de IA precisam de credenciais **estáticas e de longa duração** — o ciclo
de refresh token (credencial que expira periodicamente) quebra esse padrão porque o agente
não tem usuário humano para renovar o token interativamente.

Este serviço separa os dois mundos:

| Quem        | Como autentica         | Para quê                          |
|-------------|------------------------|-----------------------------------|
| **Humano**  | `POST /auth/login` → JWT (1h) | Gerenciar API keys via dashboard |
| **MCP/Agent** | `X-Api-Key: mcp_sk_...` | Consumir recursos protegidos      |

## Stack

- **Runtime**: Node.js + TypeScript
- **Framework**: Express 5
- **Banco**: SQLite via `better-sqlite3` (WAL mode)
- **Auth humano**: JWT HS256, expira em 1 h (stateless — sem refresh)
- **Auth agente**: API Key com 192 bits de entropia, hash SHA-256 no banco
- **Senha**: bcrypt (fator 12)
- **Validação**: Zod

## Roles de usuário

| Role       | Descrição                              |
|------------|----------------------------------------|
| `operator` | Role padrão no cadastro               |
| `admin`    | Gerencia usuários e roles             |

## Endpoints

### Autenticação (humano → JWT)

| Método | Rota             | Auth     | Descrição                          |
|--------|------------------|----------|------------------------------------|
| POST   | /auth/register   | —        | Cadastro (role padrão: `operator`) |
| POST   | /auth/login      | —        | Login, retorna JWT (1 h)           |
| POST   | /auth/logout     | Bearer   | 204 — cliente descarta o token     |
| GET    | /auth/me         | Bearer   | Dados do usuário autenticado       |

### API Keys (requer JWT)

| Método | Rota             | Descrição                                          |
|--------|------------------|----------------------------------------------------|
| POST   | /apikeys         | Cria chave — raw key retornada **uma única vez**   |
| GET    | /apikeys         | Lista chaves do usuário (sem expor o hash)         |
| DELETE | /apikeys/:id     | Revoga chave (soft-delete)                         |

### Usuários (admin only)

| Método | Rota               | Descrição       |
|--------|--------------------|-----------------|
| GET    | /users             | Lista usuários  |
| PATCH  | /users/:id/role    | Altera role     |

## Formato da API Key

```
mcp_sk_<48 hex chars>
```

- 24 bytes aleatórios = **192 bits de entropia**
- Armazenada no banco **apenas como hash SHA-256** — nunca em texto puro
- Se perdida, revogue e crie uma nova

### Usando a chave (duas formas)

```bash
# header dedicado
curl https://seu-recurso.com/api \
  -H "X-Api-Key: mcp_sk_a1b2c3..."

# bearer token
curl https://seu-recurso.com/api \
  -H "Authorization: Bearer mcp_sk_a1b2c3..."
```

## Variáveis de ambiente

```
PORT=3000
DATABASE_PATH=./data/app.db

JWT_ACCESS_SECRET=...          # mínimo 32 chars
JWT_ACCESS_EXPIRES_IN=1h       # só para sessões humanas
```

> `JWT_REFRESH_SECRET` não existe mais — não há refresh token.

## Configuração

```bash
cp .env.example .env
# edite JWT_ACCESS_SECRET
```

## Executar

### Local (desenvolvimento)

```bash
npm install
npm run dev       # hot-reload via nodemon
npm run build     # compila para dist/
npm start         # produção local
```

### Docker (duas instâncias + nginx)

```bash
cp .env.example .env
# edite JWT_ACCESS_SECRET

docker compose up -d --build
curl http://localhost/health
```

**Arquitetura Docker:**

```
         ┌─────────┐
:80  ──▶ │  nginx  │  (load balancer — least_conn)
         └────┬────┘
         ┌────┴────┐
    ┌────▼──┐  ┌───▼───┐
    │ api1  │  │ api2  │  (Node.js :3000)
    └────┬──┘  └───┬───┘
         └────┬────┘
         ┌────▼────┐
         │ SQLite  │  (volume Docker compartilhado, WAL mode)
         └─────────┘
```

> SQLite com WAL mode suporta múltiplos leitores e um escritor concorrente via
> file-locking POSIX — adequado para baixo/médio volume.
> Para alta escala, migre para PostgreSQL/MySQL.

## Exemplos de uso

### 1. Criar conta e obter JWT

```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"João","email":"joao@example.com","password":"senha1234"}'
```

### 2. Login

```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"joao@example.com","password":"senha1234"}'
# → { "access_token": "<jwt>" }
```

### 3. Criar API Key para um agente

```bash
curl -X POST http://localhost:3000/apikeys \
  -H "Authorization: Bearer <jwt>" \
  -H "Content-Type: application/json" \
  -d '{"name":"Meu agente Claude","scopes":"read,write"}'
# → { "key": "mcp_sk_a1b2c3...", "id": 1, ... }
#   ^ guarde esta chave — ela não será exibida novamente
```

### 4. Listar chaves

```bash
curl http://localhost:3000/apikeys \
  -H "Authorization: Bearer <jwt>"
# → [{ "id":1, "name":"Meu agente Claude", "key_prefix":"mcp_sk_a1b2c3...", ... }]
```

### 5. Revogar chave

```bash
curl -X DELETE http://localhost:3000/apikeys/1 \
  -H "Authorization: Bearer <jwt>"
```

## Segurança

- API keys armazenadas como **hash SHA-256** — banco vazado não expõe as chaves
- `last_used_at` atualizado a cada uso (auditoria)
- Revogação imediata via `DELETE /apikeys/:id` (soft-delete com `revoked_at`)
- Suporte a `expires_at` por chave (expiração opcional)
- Senhas com bcrypt fator 12
- JWT stateless de 1 h apenas para gerenciamento humano
