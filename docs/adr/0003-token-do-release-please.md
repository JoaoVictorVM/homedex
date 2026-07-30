# ADR 0003 — Token do release-please e o disparo da release da CLI

## Status

Aceito

## Contexto

O versionamento do HomeDex é automático (F11): o release-please lê os Conventional Commits em `main`, abre um pull request de release com `CHANGELOG.md` e versão atualizados e, ao merge desse PR, cria a tag `vX.Y.Z`. A publicação dos binários da CLI (F10) é disparada por essa tag.

O GitHub tem uma regra que quebra exatamente esse encadeamento: **eventos criados com o `GITHUB_TOKEN` padrão não disparam outros workflows.** É uma proteção contra recursão infinita de automações. Na prática, se o release-please criar a tag usando o `GITHUB_TOKEN`, o workflow do GoReleaser — que escuta `push` de tags — nunca roda, e o release sai sem binário nenhum.

O sintoma é traiçoeiro: tudo aparenta ter funcionado (PR aberto, merge feito, tag criada, release publicada no GitHub) e só a etapa final, silenciosamente, não acontece.

## Decisão

O workflow do release-please usa um **Personal Access Token** guardado no segredo `RELEASE_PLEASE_TOKEN`, com fallback para o token padrão:

```yaml
token: ${{ secrets.RELEASE_PLEASE_TOKEN || secrets.GITHUB_TOKEN }}
```

O token precisa de permissão de escrita em `contents` (criar tag e release) e em `pull requests` (abrir e atualizar o PR de release). Um fine-grained token restrito ao repositório `JoaoVictorVM/homedex` é suficiente.

O fallback é intencional: sem o segredo configurado, o versionamento e o changelog continuam funcionando normalmente — só a publicação automática dos binários da CLI deixa de disparar, e a tag pode ser reempurrada à mão para destravar. Isso evita que um repositório recém-clonado ou um fork tenham o workflow quebrado por falta de um segredo.

## Alternativas consideradas

| Alternativa | Por que não |
| ----------- | ----------- |
| Rodar o GoReleaser dentro do próprio workflow do release-please, condicionado à saída `release_created` | Funciona sem PAT, mas amarra F10 ao workflow de F11 e contraria o contrato descrito no PRD, onde o gatilho de F10 é a tag em si. Também impede reempurrar uma tag para refazer um release. |
| GitHub App com token de instalação | Mais seguro que um PAT (permissões estreitas, token de vida curta), mas exige criar e manter um App para um repositório de um mantenedor só. |
| Criar as tags manualmente | Devolve ao processo justamente o passo manual que a automação existe para eliminar. |
| Aceitar o disparo manual do workflow de release (`workflow_dispatch`) | Deixa o release publicado incompleto por padrão, dependendo de alguém lembrar de rodar a segunda etapa. |

## Consequências

**Positivas**

- A cadeia commit → PR de release → tag → binários publicados fecha sem intervenção manual.
- O contrato do PRD ("a tag produzida por F11 é a que dispara F10") se mantém, então F10 pode ser acionada por qualquer tag válida, inclusive uma reempurrada à mão.
- Sem o segredo, nada explode: o comportamento degrada de forma previsível e documentada.

**Negativas**

- Existe um PAT para manter: ele expira, precisa ser rotacionado, e está atrelado a uma conta pessoal em vez do repositório.
- O PAT contorna a proteção anti-recursão do GitHub. Como os workflows deste repositório não criam commits que disparariam a si mesmos, o risco é baixo, mas a proteção deixa de valer para o que esse token fizer.
- Quem clonar o projeto e não souber do segredo pode achar que a publicação de binários está quebrada. Por isso o comportamento está documentado aqui e no README.
