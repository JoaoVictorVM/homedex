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
  cli/        # CLI Go (módulo próprio)
```

Frontend e backend são aplicações independentes que se comunicam apenas por HTTP.

### Workspace Go

O `go.work` na raiz declara `./backend` e `./cli` como módulos do mesmo workspace. Com isso, código Go compartilhado entre os dois é resolvido direto do fonte nos comandos locais — editar um pacote do backend usado pela CLI vale na hora, sem publicar nem tagear versão, e sem precisar de um `require` no `go.mod` da CLI.

`go.work` e `go.work.sum` são versionados, então todo clone tem a mesma resolução local sem rodar `go work init`.

O workspace é uma conveniência **só de desenvolvimento local**. Os builds de produção não passam por ele: a imagem Docker do backend e o Blueprint do Render usam `backend/` como contexto, e a CLI é compilada pelo GoReleaser a partir de `cli/` — em nenhum dos casos o `go.work` está presente. Cada módulo continua compilando isolado (`GOWORK=off go build ./...`).

## Pré-requisitos

- Node.js 20+ e [pnpm](https://pnpm.io/)
- Go 1.26+
- [golangci-lint](https://golangci-lint.run/) v2
- PostgreSQL (necessário a partir da fase de banco de dados)

## Setup do repositório

Na raiz, uma vez por clone:

```sh
pnpm install
```

Isso instala o [lefthook](https://lefthook.dev) e o [commitlint](https://commitlint.js.org) e registra o hook `commit-msg`, que valida a mensagem de cada commit no formato Conventional Commits (`tipo(escopo): descrição`, com escopo opcional limitado a `frontend`, `backend` e `cli`). Mensagem fora do padrão é rejeitada antes de o commit existir, apontando qual regra falhou.

Se os hooks não estiverem ativos (clone antigo, `.git/hooks` limpo), rode `pnpm exec lefthook install`.

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

## CLI

Companheiro de terminal do HomeDex, distribuído como módulo Go próprio:

```sh
go install github.com/JoaoVictorVM/homedex/cli/cmd/homedex@latest
```

Ou baixe o binário pronto na [última release](https://github.com/JoaoVictorVM/homedex/releases) — sem precisar de Go instalado.

| Comando          | Descrição |
| ---------------- | --------- |
| `homedex roll`   | Sorteia um Pokémon aleatório entre os 151 de Kanto |
| `homedex config` | Mostra a URL base da API em uso |
| `homedex help`   | Mostra o texto de uso |

O sorteio em si é totalmente local: os 151 da Pokédex de Kanto (número, nome, sexo possível) estão compilados dentro do binário, então ele não faz nenhuma chamada de rede e leva dezenas de nanossegundos. Sexo é 50/50 nas espécies que têm os dois, respeitando as exclusivas (Tauros sempre macho, Chansey sempre fêmea) e as sem sexo (Voltorb, Ditto, os lendários). Shiny sai 1 em 20.

Depois do sorteio, a CLI busca a sprite no backend e a converte em arte ASCII monocromática, usando a rampa ` .:-=+*#%@` e cabendo em 80 colunas. A sprite shiny é usada quando o roll é shiny. **A CLI nunca chama a PokéAPI direto** — ela pede os bytes ao endpoint `GET /sprite/image` do backend, que faz o proxy e mantém o cache.

Essa etapa nunca bloqueia o roll: se o backend estiver fora, lento (timeout de 3s) ou sem a sprite, a arte é pulada com uma mensagem e os detalhes continuam aparecendo normalmente. O indicador de carregamento só aparece em terminal interativo, então redirecionar a saída para arquivo produz texto limpo.

O resultado é exibido em duas colunas (arte à esquerda, painel à direita) em terminais de **100 colunas ou mais**, e empilhado (arte acima do painel) em terminais mais estreitos. A largura é lida do terminal em tempo de execução; quando não dá para detectar — saída redirecionada, por exemplo — o padrão é 80 colunas. Em seguida a CLI pergunta se você quer adicionar o Pokémon à coleção, aceitando `s`/`sim`/`y`/`yes` e `n`/`nao`/`no` em qualquer caixa, e repergunta em resposta inválida.

A saída da CLI é toda em português — o motivo está no [ADR 0002](docs/adr/0002-idioma-da-interface-da-cli.md).

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

### CLI

| Variável          | Obrigatória | Padrão                                | Descrição |
| ----------------- | ----------- | ------------------------------------- | --------- |
| `HOMEDEX_API_URL` | não         | `https://homedex-server.onrender.com` | URL base da API. Aponte para `http://localhost:8080` para testar contra o backend local. |

## Deploy

A aplicação usa dois serviços no Render e um banco no Neon, todos no plano gratuito:

| Serviço          | Onde   | Tipo                  | Origem |
| ---------------- | ------ | --------------------- | ------ |
| `homedex-db`     | Neon   | PostgreSQL gerenciado | — |
| `homedex-server` | Render | Web Service (Docker)  | `backend/Dockerfile` |
| `homedex-web`    | Render | Static Site           | `frontend/` |

O banco fica no Neon porque o PostgreSQL gratuito do Render expira após 90 dias — veja [ADR 0001](docs/adr/0001-banco-de-dados-no-neon.md).

Os dois serviços do Render são declarados em [`render.yaml`](render.yaml), um Blueprint versionado. **Configuração de infraestrutura se muda editando esse arquivo, não pelo painel do Render** — o painel é usado só para o valor de `DATABASE_URL`, que é segredo e por isso está declarado como `sync: false`.

### 1. Banco de dados (Neon)

O banco **não** entra no Blueprint: ele é um projeto do Neon, provisionado uma vez à mão.

Crie um projeto no [Neon](https://neon.com) **na mesma região do web service do Render** — o `render.yaml` fixa `region: oregon` no `homedex-server`, então use `aws-us-west-2`. Região diferente adiciona dezenas de milissegundos por consulta. (O Static Site não tem região: o Render serve por CDN global.)

Copie a connection string **direta** (a que *não* tem `-pooler` no host). O endpoint com pooler roda PgBouncer em modo transação com `max_prepared_statements=0`, incompatível com o cache de prepared statements do pgx.

As tabelas são criadas sozinhas: o backend roda as migrations ao subir.

### 2. Serviços do Render (Blueprint)

No painel do Render, crie um **Blueprint** apontando para este repositório. O Render lê o `render.yaml` e provisiona os dois serviços:

| Serviço | Configuração declarada |
| ------- | ---------------------- |
| `homedex-server` | Docker a partir de `backend/Dockerfile`, health check em `/health`, `FRONTEND_ORIGIN` e `TRUST_PROXY=true` |
| `homedex-web` | Static Site, build `pnpm install --frozen-lockfile && pnpm build`, publish `dist`, `VITE_API_URL` |

Na sincronização, o Render pede o valor de `DATABASE_URL` — cole a connection string direta do Neon (passo 1). É a única variável definida à mão.

`PORT` é injetada pelo Render — não aparece no Blueprint nem deve ser definida.

`FRONTEND_ORIGIN` e `VITE_API_URL` estão fixadas no `render.yaml` com as URLs previsíveis do Render (`https://<nome-do-serviço>.onrender.com`), o que resolve a dependência circular entre os dois serviços (o backend precisa da URL do front para o CORS, o front precisa da URL do back). Se os nomes dos serviços mudarem, as duas URLs mudam junto no mesmo arquivo — e o frontend precisa de um novo deploy, porque `VITE_API_URL` é aplicada **no build**.

### Observações do plano gratuito

- O Web Service do Render **hiberna** após inatividade; a primeira requisição depois disso demora alguns segundos.
- O compute do Neon **suspende após 5 minutos** sem atividade e religa em milissegundos na consulta seguinte. O pool de conexões descarta conexões ociosas antes disso (`backend/internal/database/database.go`), então a suspensão é transparente.
- O plano gratuito do Neon dá 0,5 GB de armazenamento e **100 CU-hours/mês** (~400 h a 0,25 CU, contra ~730 h de mês corrido). Por isso `/health` é uma checagem rasa que **não** toca no banco: um monitor externo apontado para ela mantém o Render acordado sem impedir o Neon de suspender. Para verificar o banco use `/health/db`, sem monitoramento contínuo.
- O banco do Neon **não expira** por inatividade.

## Versionamento e releases

A versão do projeto é calculada automaticamente pelo [release-please](https://github.com/googleapis/release-please) a partir das mensagens de commit em `main` — `feat` sobe a minor, `fix` sobe a patch, `feat!` ou `BREAKING CHANGE` sobem a major.

O fluxo é:

1. Commits em `main` disparam o workflow `.github/workflows/release-please.yml`.
2. O release-please abre (ou atualiza) um pull request de release com o `CHANGELOG.md` e a versão atualizados.
3. Ao mergear esse pull request, a tag `vX.Y.Z` é criada.
4. A tag dispara `.github/workflows/cli-release.yml`, que roda o [GoReleaser](https://goreleaser.com) e anexa os binários da CLI à release.

**Nunca edite `CHANGELOG.md`, `version.txt` ou `.release-please-manifest.json` à mão** — os três são gerados pela automação.

O workflow usa o segredo `RELEASE_PLEASE_TOKEN` (Personal Access Token com escrita em `contents` e `pull requests`), caindo no `GITHUB_TOKEN` padrão quando ele não existe. O motivo está no [ADR 0003](docs/adr/0003-token-do-release-please.md): tags criadas com o `GITHUB_TOKEN` não disparam outros workflows, o que impediria a publicação automática dos binários da CLI.

### Binários da CLI

O `cli/.goreleaser.yml` compila a CLI para `linux/amd64`, `darwin/amd64`, `darwin/arm64` e `windows/amd64`, empacota em `.tar.gz` (`.zip` no Windows) e publica os arquivos mais o `checksums.txt` como assets da release.

A publicação é tudo-ou-nada: as quatro plataformas são compiladas num único job, antes de qualquer upload. Se uma falhar, o workflow falha e **nenhum** binário é publicado.

Como o release-please já criou a release com o changelog, o GoReleaser roda com `mode: keep-existing` — ele anexa os binários sem sobrescrever as notas. O `replace_existing_artifacts` permite reempurrar a mesma tag para refazer os assets.

Para validar mudanças na configuração sem publicar nada:

```sh
cd cli
goreleaser check
goreleaser release --snapshot --clean
```

O snapshot gera tudo em `cli/dist/` (ignorado pelo git). O build roda com `GOWORK=off`, então a CLI é compilada exatamente como fora do workspace.
