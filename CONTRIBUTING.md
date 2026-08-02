# Como contribuir

O HomeDex é um projeto pessoal, mantido por uma pessoa só. Issues, sugestões e correções são bem-vindas — só tenha em mente que o escopo do produto é decidido pelo mantenedor, então **abra uma issue antes de investir tempo em um pull request grande**. Correções pequenas (bug óbvio, typo, ajuste de documentação) podem vir direto em PR.

## Ambiente local

Pré-requisitos: [Go](https://go.dev) 1.26+, [Node](https://nodejs.org) 20+ com [pnpm](https://pnpm.io), [golangci-lint](https://golangci-lint.run) v2, [Task](https://taskfile.dev) e, opcionalmente, Docker para subir o Postgres local.

```sh
pnpm install          # instala os hooks de commit na raiz
cd frontend && pnpm install && cd ..
task docker:up        # sobe backend + Postgres (ou aponte DATABASE_URL para o seu banco)
task migrate          # aplica as migrations
task dev              # sobe frontend e backend
```

Rode `task` sem argumento para ver todas as tarefas disponíveis com descrição. O setup completo está no [README](README.md).

## Antes de abrir o PR

Rode o lint e os testes dos módulos que você tocou:

| Módulo | Testes | Lint |
| ------ | ------ | ---- |
| Frontend | `task test:frontend` | `task lint:frontend` |
| Backend | `task test:backend` | `task lint:backend` |
| CLI | `task test:cli` | `task lint:cli` |

Mexeu em migration, transação ou consulta? Rode também `task test:backend:integration`, que exige um Postgres de verdade — não use o banco de produção.

## Mensagens de commit

O projeto usa [Conventional Commits](https://www.conventionalcommits.org). O escopo é opcional, mas quando existir precisa ser `frontend`, `backend` ou `cli`:

```
feat(backend): implementa o resgate diario atomico
docs: documenta o fluxo de adicao a colecao na cli
```

Um hook de `commit-msg` (lefthook + commitlint) valida a mensagem antes do commit — ele é instalado pelo `pnpm install` da raiz. O motivo de a validação ser local está no [ADR 0007](docs/adr/0007-validacao-de-mensagem-de-commit.md).

A versão e o `CHANGELOG.md` são gerados automaticamente pelo release-please a partir dessas mensagens. **Não edite nenhum dos dois à mão.**

## Convenções de código

- **Estilo de arquivo**: o `.editorconfig` da raiz cuida de indentação, charset e fim de linha. Use um editor que o respeite.
- **Frontend**: componente `.tsx` cuida só do visual; a lógica vai em hooks (`useX`) e o acesso à API em serviços (`*.service.ts`) — nenhum componente faz `fetch` direto. Toda estilização usa variáveis de `frontend/src/styles/tokens.css`; valores hardcoded não passam na revisão.
- **Backend**: Go idiomático, um pacote por domínio dentro de `internal/`. A PokéAPI é chamada apenas pelo backend, nunca pelo frontend ou pela CLI.
- **Commits atômicos**: prefira vários commits pequenos, cada um deixando o projeto funcional, a um commit grande.

## Decisões técnicas

Mudança de arquitetura, nova dependência ou qualquer decisão que alguém vá questionar depois merecem um ADR em [`docs/adr/`](docs/adr/), no mesmo formato dos existentes: contexto, decisão, alternativas consideradas e consequências. A visão geral da arquitetura está em [`docs/c4/`](docs/c4/).

## Segurança

Encontrou uma vulnerabilidade? Não abra uma issue pública — siga o [SECURITY.md](SECURITY.md).
