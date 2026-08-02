# ADR 0007 — Validação de mensagem de commit com lefthook e commitlint

## Status

Aceito

## Contexto

O versionamento do HomeDex é derivado do histórico: o release-please lê os Conventional Commits em `main` para decidir o próximo número de versão, montar o `CHANGELOG.md` e criar a tag que dispara a publicação dos binários da CLI ([ADR 0003](0003-token-do-release-please.md)).

Isso muda o peso de uma mensagem malformada. Não é uma questão de estética do histórico: um commit fora do formato é **ignorado** pela automação. Uma correção escrita como `arruma bug do resgate` não aparece no changelog e não conta para o bump de versão. Pior que o erro barulhento, é o erro silencioso — nada falha, a release sai, e a mudança simplesmente não está lá.

O mesmo vale para o escopo. `feat(front): ...` e `feat(frontend): ...` são dois escopos diferentes para a ferramenta, e o changelog sai fragmentado em seções que deveriam ser uma.

Como os commits são feitos manualmente pelo mantenedor (regra de processo do projeto), a validação precisa acontecer na máquina, no momento do commit — quando ainda dá para corrigir sem reescrever histórico.

## Decisão

Validar a mensagem no hook `commit-msg`, com [lefthook](https://lefthook.dev) orquestrando e [commitlint](https://commitlint.js.org) validando:

```yaml
commit-msg:
  jobs:
    - name: commitlint
      run: pnpm exec commitlint --edit {1}
```

A configuração estende `@commitlint/config-conventional` e acrescenta uma regra:

```js
'scope-enum': [2, 'always', ['frontend', 'backend', 'cli']]
```

O escopo continua **opcional** — `docs: ...` e `chore: ...` passam sem escopo, que é o certo para mudanças que não pertencem a um módulo. A regra só age quando há escopo, rejeitando qualquer um fora dos três módulos reais do monorepo. É isso que impede `feat(front)` e `feat(frontend)` de coexistirem.

A instalação é automática: `"prepare": "lefthook install"` no `package.json` da raiz registra o hook no `pnpm install`, então quem clona o repositório e instala as dependências já commita com a validação ativa.

## Alternativas consideradas

| Alternativa | Por que não |
| ----------- | ----------- |
| Husky | É o padrão de fato no ecossistema Node, mas escreve um script por hook em `.husky/` e assume Node no caminho de todo commit. O lefthook é um binário único com toda a configuração em um YAML, mais rápido e agnóstico de linguagem — melhor encaixe num repositório majoritariamente Go, onde o Node já entra só a contragosto. |
| Hook direto em `.git/hooks/commit-msg` | `.git/hooks` não é versionado. Cada clone precisaria instalar o hook à mão, e a regra deixaria de existir para quem esquecesse. |
| Validar as mensagens só no CI | Pega o erro depois do push, quando a mensagem já é histórico. Consertar exige `rebase` e force-push — caro para um problema que o hook resolve antes de existir. |
| Confiar na disciplina, sem validação | O modo de falha é silencioso e só aparece na release seguinte, quando falta uma entrada no changelog e a versão subiu errado. |
| Aceitar qualquer escopo (sem `scope-enum`) | Deixa passar erros de digitação que fragmentam o changelog sem nenhum aviso. |

## Consequências

**Positivas**

- Mensagem inválida trava antes de virar histórico, no único momento em que o conserto é gratuito.
- O changelog fica consistente por construção, e o bump de versão reflete o que realmente mudou.
- A regra vale igual para todo mundo, porque vem versionada e se instala sozinha no `pnpm install`.
- O `scope-enum` documenta, na prática, quais são os módulos do projeto.

**Negativas**

- Traz Node e um `package.json` para a raiz de um repositório cujo produto principal é Go. Quem for mexer só no backend ainda precisa de um `pnpm install` para ter os hooks.
- `git commit --no-verify` contorna a validação. O hook é um apoio, não uma garantia — e como nenhum workflow revalida as mensagens no CI, uma mensagem ruim empurrada por esse caminho passa direto.
- Amarra o formato do commit a uma configuração compartilhada: mudar a lista de escopos exige mexer no `commitlint.config.js`, não é decisão de commit isolado.
