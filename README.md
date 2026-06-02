# mcp-token-api

RESTful API de autenticação com JWT e SQLite.

## Stack

- **Runtime**: Node.js + TypeScript
- **Framework**: Express 5
- **Banco**: SQLite via `better-sqlite3`
- **Auth**: JWT (access token 15 min + refresh token 7 dias com rotação)
- **Senha**: bcrypt (12 rounds)
- **Validação**: Zod

## Roles

| Role       | Descrição                        |
|------------|----------------------------------|
| `operator` | Role padrão no cadastro          |
| `admin`    | Acesso total (gerencia usuários) |

## Endpoints

### Auth

| Método | Rota             | Auth     | Descrição                        |
|--------|------------------|----------|----------------------------------|
| POST   | /auth/register   | —        | Cadastro (role = operator)       |
| POST   | /auth/login      | —        | Login, retorna tokens            |
| POST   | /auth/refresh    | —        | Renova access token              |
| POST   | /auth/logout     | Bearer   | Invalida sessão                  |
| GET    | /auth/me         | Bearer   | Dados do usuário autenticado     |

### Usuários (admin only)

| Método | Rota               | Descrição          |
|--------|--------------------|--------------------|
| GET    | /users             | Lista usuários     |
| PATCH  | /users/:id/role    | Altera role        |

## Configuração

```bash
cp .env.example .env
# edite .env com seus segredos
```

### Variáveis de ambiente

```
PORT=3000
JWT_ACCESS_SECRET=...        # mínimo 32 chars
JWT_REFRESH_SECRET=...       # mínimo 32 chars
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
DATABASE_PATH=./data/app.db
```

## Executar

```bash
npm install
npm run dev       # desenvolvimento (hot-reload)
npm run build     # compila para dist/
npm start         # produção
```

## Exemplos

### Cadastro
```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"João","email":"joao@example.com","password":"senha1234"}'
```

### Login
```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"joao@example.com","password":"senha1234"}'
```

### Usar access token
```bash
curl http://localhost:3000/auth/me \
  -H "Authorization: Bearer <access_token>"
```

### Renovar token
```bash
curl -X POST http://localhost:3000/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{"refresh_token":"<refresh_token>"}'
```

## Segurança

- Refresh tokens são armazenados como hash SHA-256 no banco (nunca em texto puro)
- Rotação de refresh token: cada uso invalida o token anterior
- Sessões expiradas são limpas automaticamente no login
- Passwords com bcrypt, fator 12
