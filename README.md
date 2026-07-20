# HomeDex

Gerenciador de boxes de Pokémon no estilo Fire Red, para quem joga em emulador/HackRom e não tem acesso ao Pokémon Home. Guarde, organize e consulte seus Pokémon em boxes de PC, com acesso por código único — sem login.

## Stack

| Camada   | Tecnologias                                                          |
| -------- | -------------------------------------------------------------------- |
| Frontend | React, TypeScript, Vite, CSS Modules, React Query, Zod, dnd-kit      |
| Backend  | Go, chi, pgx, PokéAPI (com cache)                                    |
| Banco    | PostgreSQL                                                           |
| Hospedagem | Render (Static Site + Web Service + Postgres gerenciado)           |

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

| Comando                     | Descrição            |
| --------------------------- | -------------------- |
| `go run ./cmd/server`       | executa o servidor   |
| `go build ./...`            | compila o módulo     |
| `go test ./...`             | roda os testes       |
| `golangci-lint run ./...`   | linters              |
| `golangci-lint fmt`         | formatação (gofmt + goimports) |
