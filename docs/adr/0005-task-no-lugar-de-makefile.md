# ADR 0005 — Task no lugar de Makefile como executor de comandos

## Status

Aceito

## Contexto

O HomeDex é um monorepo com três módulos e três ferramentas distintas: `frontend/` (pnpm + Vite), `backend/` (Go) e `cli/` (Go, módulo separado). Sem uma camada em cima, rodar os testes do projeto significa saber que o frontend usa `pnpm test` dentro de `frontend/`, que os dois módulos Go usam `go test ./...` cada um no seu diretório, e que o backend precisa de uma `DATABASE_URL` apontando para o Postgres local.

O ambiente principal de desenvolvimento é **Windows 11**, sem WSL. Isso elimina o candidato óbvio: `make` não vem no Windows, e as saídas para instalá-lo (Chocolatey, MSYS2, GnuWin32, WSL) todas trocam "uma dependência" por "um subsistema", cada uma com uma noção diferente de qual shell executa as receitas e de como caminhos com `\` se comportam.

Além do problema de plataforma, boa parte do que se precisa aqui é justamente o que um Makefile faz mal: entrar em um diretório por alvo, injetar variável de ambiente com valor padrão, e nomear o binário de saída de forma diferente por sistema operacional.

## Decisão

Usar o [Task](https://taskfile.dev) (`go-task`), com um `Taskfile.yml` único na raiz.

O que a escolha resolve, na prática, e que está de fato usado no arquivo:

- **`dir:` por tarefa** — cada tarefa declara em qual módulo roda, sem `cd x && ...` embutido no comando.
- **`env:` com valor padrão** — `DATABASE_URL: '{{.DATABASE_URL | default .LOCAL_DATABASE_URL}}'` faz `task dev`, `task migrate` e os testes de integração funcionarem contra o Postgres do Docker Compose sem nenhuma configuração, e contra outro banco apenas exportando a variável.
- **`dotenv: [".env"]`** — o `.env` da raiz é lido nativamente, sem um passo de carregamento manual.
- **Condicional por sistema operacional** — `CLI_BIN: '{{if eq OS "windows"}}homedex.exe{{else}}homedex{{end}}'`, para `task build:cli` gerar o nome certo dos dois lados.
- **`task --list` como tarefa padrão** — rodar `task` sem argumento mostra o catálogo com as descrições, o que faz o Taskfile ser a documentação de si mesmo.

A convenção de nomes é `ação:módulo` (`test:frontend`, `lint:cli`, `dev:backend`), com as tarefas agregadoras sem sufixo (`dev` sobe front e back via `deps`).

## Alternativas consideradas

| Alternativa | Por que não |
| ----------- | ----------- |
| Makefile | Exige instalar `make` no Windows por um caminho que arrasta um shell junto. Some-se a sintaxe sensível a tabulação, a ausência de tratamento nativo de diretório por alvo e a dependência de utilitários POSIX nas receitas — cada um deles um ponto de divergência entre a máquina do mantenedor e a de um contribuidor. |
| Scripts npm na raiz | O `package.json` da raiz existe só para os hooks de commit. Colocar o fluxo de trabalho de dois módulos Go atrás dele obrigaria quem mexe só em Go a instalar Node para rodar `go test`. |
| `just` | Multiplataforma e mais simples que o Make, mas as receitas continuam sendo blocos de shell — no Windows isso reintroduz a pergunta "qual shell?", que é exatamente o problema que se quer eliminar. O Task descreve os comandos em YAML e resolve variáveis, diretório e condicionais antes de chegar no shell. |
| Um script `.ps1` e um `.sh` equivalentes | Dobra a manutenção e garante que uma das duas versões vai ficar desatualizada. |
| Nada, só documentar os comandos no README | Documentação não roda. Comando esquecido vira comando errado — especialmente `test:backend:integration`, que precisa de variável de ambiente específica. |

## Consequências

**Positivas**

- Um único ponto de entrada para dev, teste, lint, migration e build, funcionando nativamente no Windows, no Linux e no macOS.
- Quem clona o projeto precisa saber um comando (`task`) para descobrir todos os outros.
- O CI e o desenvolvimento local podem convergir para os mesmos alvos, em vez de duplicarem a sequência de comandos.
- Detalhes chatos ficam encapsulados: ninguém precisa lembrar a connection string local nem a flag `-run Integracao -count=1`.

**Negativas**

- É mais uma ferramenta para instalar antes do primeiro comando (`go install github.com/go-task/task/v3/cmd/task@latest`, `winget` ou `scoop`) — embora, num projeto que já exige Go, seja uma instalação a mais no toolchain que já está lá.
- A sintaxe é YAML com templates Go: menos familiar que shell e mais verbosa para tarefas triviais.
- O `dotenv: [".env"]` cria uma dependência de um arquivo opcional; sem os valores padrão nas tarefas, a ausência do `.env` quebraria o fluxo de quem acabou de clonar.
