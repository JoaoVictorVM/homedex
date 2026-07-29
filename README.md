# HomeDex

Gerenciador de boxes de Pokémon no estilo Fire Red, para quem joga em emulador/HackRom e não tem acesso ao Pokémon Home. Guarde, organize e consulte seus Pokémon em boxes de PC, com acesso por código único — sem login.

## Stack

| Camada   | Tecnologias                                                          |
| -------- | -------------------------------------------------------------------- |
| Frontend | React, TypeScript, Vite, CSS Modules, React Query, Zod, dnd-kit      |
| Backend  | Go, chi, pgx, PokéAPI (com cache)                                    |
| Banco    | PostgreSQL (Neon)                                                    |
| Hospedagem | Render (Static Site + Web Service) + Neon (Postgres gerenciado)     |

## Estrutura

```
homedex/
  frontend/   # app React (Vite)
  backend/    # API Go
```

Frontend e backend são aplicações independentes que se comunicam apenas por HTTP.

## Pré-requisitos

- Node.js 20+ e [pnpm](https://pnpm.io/)
- Go 1.26+
- [golangci-lint](https://golangci-lint.run/) v2
- PostgreSQL (necessário a partir da fase de banco de dados)

## Frontend

```sh
cd frontend
pnpm install
pnpm dev
```

Servidor de desenvolvimento em `http://localhost:5173`.

| Comando            | Descrição                       |
| ------------------ | ------------------------------- |
| `pnpm dev`         | servidor de desenvolvimento     |
| `pnpm build`       | typecheck + build de produção   |
| `pnpm preview`     | serve o build de produção       |
| `pnpm test`        | roda os testes (Vitest)         |
| `pnpm test:watch`  | testes em modo watch            |
| `pnpm lint`        | ESLint                          |
| `pnpm format`      | formata com Prettier            |
| `pnpm format:check`| verifica formatação             |

## Backend

```sh
cd backend
go run ./cmd/server
```

O servidor exige `DATABASE_URL`. Em desenvolvimento (PowerShell):

```powershell
$env:DATABASE_URL = "postgres://postgres:postgres@localhost:5432/homedex"
go run ./cmd/server
```

As migrations são aplicadas automaticamente na subida do servidor.

| Comando                     | Descrição            |
| --------------------------- | -------------------- |
| `go run ./cmd/server`       | executa o servidor   |
| `go build ./...`            | compila o módulo     |
| `go test ./...`             | roda os testes       |
| `golangci-lint run ./...`   | linters              |
| `golangci-lint fmt`         | formatação (gofmt + goimports) |

## Variáveis de ambiente

### Backend

| Variável          | Obrigatória | Padrão                  | Descrição |
| ----------------- | ----------- | ----------------------- | --------- |
| `DATABASE_URL`    | sim         | —                       | String de conexão do PostgreSQL. Sem ela o servidor não sobe. Em produção, a connection string **direta** do Neon (sem `-pooler`). |
| `PORT`            | não         | `8080`                  | Porta HTTP. No Render é definida automaticamente. |
| `FRONTEND_ORIGIN` | não         | `http://localhost:5173` | Única origem liberada no CORS. Em produção, a URL do Static Site. |
| `TRUST_PROXY`     | não         | `false`                 | Com `true`, o rate limiting usa o último IP de `X-Forwarded-For` em vez do IP da conexão. Necessário atrás do proxy do Render. |

### Frontend

| Variável       | Obrigatória | Padrão                  | Descrição |
| -------------- | ----------- | ----------------------- | --------- |
| `VITE_API_URL` | não         | `http://localhost:8080` | URL base da API. Em produção, a URL do Web Service. |

O frontend lê variáveis de `frontend/.env` (veja `frontend/.env.example`). Variáveis do Vite são embutidas no bundle **em tempo de build** — não coloque segredo nelas.

## Deploy

A aplicação usa dois serviços no Render e um banco no Neon, todos no plano gratuito:

| Serviço          | Onde   | Tipo                  | Origem |
| ---------------- | ------ | --------------------- | ------ |
| `homedex-db`     | Neon   | PostgreSQL gerenciado | — |
| `homedex-api`    | Render | Web Service (Docker)  | `backend/Dockerfile` |
| `homedex-web`    | Render | Static Site           | `frontend/` |

O banco fica no Neon porque o PostgreSQL gratuito do Render expira após 90 dias — veja [ADR 0001](docs/adr/0001-banco-de-dados-no-neon.md).

### 1. Banco de dados (Neon)

Crie um projeto no [Neon](https://neon.com) **na mesma região do web service do Render** (Render Oregon → `aws-us-west-2`, Render Frankfurt → `aws-eu-central-1`). Região diferente adiciona dezenas de milissegundos por consulta.

Copie a connection string **direta** (a que *não* tem `-pooler` no host). O endpoint com pooler roda PgBouncer em modo transação com `max_prepared_statements=0`, incompatível com o cache de prepared statements do pgx.

As tabelas são criadas sozinhas: o backend roda as migrations ao subir.

### 2. Backend (Web Service)

- **Runtime**: Docker · **Root Directory**: `backend` · **Dockerfile Path**: `Dockerfile`
- **Health Check Path**: `/health`
- Variáveis de ambiente:

| Variável          | Valor |
| ----------------- | ----- |
| `DATABASE_URL`    | Connection string direta do Neon (passo 1) |
| `FRONTEND_ORIGIN` | URL do Static Site (ex: `https://homedex-web.onrender.com`) |
| `TRUST_PROXY`     | `true` |

`PORT` é injetada pelo Render — não defina manualmente.

### 3. Frontend (Static Site)

- **Root Directory**: `frontend`
- **Build Command**: `pnpm install --frozen-lockfile && pnpm build`
- **Publish Directory**: `dist`
- Variável de ambiente: `VITE_API_URL` = URL do Web Service (ex: `https://homedex-api.onrender.com`)

### Ordem e dependência circular

O backend precisa da URL do frontend (CORS) e o frontend precisa da URL do backend. Como as URLs do Render são previsíveis (`https://<nome-do-serviço>.onrender.com`), defina as duas já na criação usando os nomes escolhidos. Se preferir criar primeiro e ajustar depois, atualize `FRONTEND_ORIGIN` no backend e refaça o deploy do frontend com o `VITE_API_URL` correto — lembrando que essa variável é aplicada **no build**.

### Observações do plano gratuito

- O Web Service do Render **hiberna** após inatividade; a primeira requisição depois disso demora alguns segundos.
- O compute do Neon **suspende após 5 minutos** sem atividade e religa em milissegundos na consulta seguinte. O pool de conexões descarta conexões ociosas antes disso (`backend/internal/database/database.go`), então a suspensão é transparente.
- O plano gratuito do Neon dá 0,5 GB de armazenamento e **100 CU-hours/mês** (~400 h a 0,25 CU, contra ~730 h de mês corrido). Por isso `/health` é uma checagem rasa que **não** toca no banco: um monitor externo apontado para ela mantém o Render acordado sem impedir o Neon de suspender. Para verificar o banco use `/health/db`, sem monitoramento contínuo.
- O banco do Neon **não expira** por inatividade.
