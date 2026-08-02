# ADR 0006 — Infraestrutura do Render declarada em Blueprint

## Status

Aceito

## Contexto

O HomeDex publica dois serviços no Render: o frontend como Static Site e o backend como Web Service. Ambos podem ser criados e configurados pelo painel, em alguns cliques — e é aí que mora o problema.

A configuração dos dois não é trivial nem óbvia. O backend precisa de `FRONTEND_ORIGIN` (é a origem que o CORS libera), de `TRUST_PROXY` (o Render termina o TLS num proxy, então o rate limiting precisa ler `X-Forwarded-For` em vez do IP da conexão) e de um health check apontado para o endpoint certo. O frontend precisa de `VITE_API_URL` **em tempo de build**, porque Vite injeta a variável no bundle — configurá-la depois não tem efeito nenhum.

Nada disso é dedutível do código. Configurado só pelo painel, esse conhecimento não está em lugar nenhum que um `git log` alcance: não há revisão, não há histórico de quem mudou o quê, e um serviço recriado do zero volta com o comportamento sutilmente diferente — CORS bloqueando o front, ou rate limiting contando todos os usuários como um IP só.

## Decisão

Declarar os dois serviços em um `render.yaml` (Blueprint) versionado na raiz do repositório. Mudança de infraestrutura passa a ser edição de arquivo com revisão, não clique no painel.

O arquivo fixa o que importa: `runtime: docker` com `rootDir: backend` para o backend (o `Dockerfile` do módulo é o contrato de build), `runtime: static` com `buildCommand` e `staticPublishPath: ./dist` para o frontend, `region: oregon`, `plan: free` e `healthCheckPath: /health` — o endpoint raso, que **não** toca no banco, pelos motivos do [ADR 0001](0001-banco-de-dados-no-neon.md).

Duas ausências são deliberadas:

**O banco não entra no Blueprint.** Ele fica no Neon, fora do Render (ADR 0001). O Blueprint descreve os dois serviços de aplicação e só.

**A `DATABASE_URL` é declarada com `sync: false`.** O nome da variável fica versionado, o valor não — a connection string do Neon é segredo e é preenchida uma vez no painel. Sem essa declaração, a variável seria invisível para quem lê o repositório; com o valor junto, o segredo vazaria no histórico do Git.

## Alternativas consideradas

| Alternativa | Por que não |
| ----------- | ----------- |
| Configurar tudo pelo painel do Render | É o cenário que motivou o ADR: configuração sem revisão, sem histórico e impossível de reproduzir a partir do repositório. |
| Terraform (ou outro IaC genérico) | Traz estado remoto, providers e um ciclo de `plan/apply` para gerenciar dois serviços em um único provedor que já tem um formato declarativo nativo. Custo de operação desproporcional ao problema. |
| Declarar também o banco no Blueprint (`databases:`) | O Postgres gratuito do Render expira em 90 dias e foi descartado no ADR 0001; o banco do Neon não é um recurso que o Render saiba criar. |
| Documentar a configuração no README e aplicar à mão | Documentação e realidade divergem em silêncio. O Blueprint é aplicado pelo Render, então descrição e estado convergem por construção. |
| Deploy por script/CLI a cada mudança | Reintroduz o passo manual que a automação existe para remover, e não descreve o estado desejado — só a transição. |

## Consequências

**Positivas**

- A infraestrutura é revisável em pull request e reconstruível a partir do repositório: um fork sobe os dois serviços apontando o Blueprint.
- As variáveis que decidem comportamento de segurança (`FRONTEND_ORIGIN` no CORS, `TRUST_PROXY` no rate limiting) ficam visíveis ao lado do código que as lê.
- A relação entre os serviços fica explícita — dá para ver que `VITE_API_URL` do front aponta para o host do back sem abrir dois painéis.

**Negativas**

- Segredos continuam fora do arquivo (`sync: false`): a `DATABASE_URL` é um passo manual obrigatório em qualquer ambiente novo, e o Blueprint sozinho não deixa o serviço de pé.
- O retrato é parcial. O banco está no Neon, então "a infraestrutura versionada" descreve dois terços do sistema — quem for reproduzir o deploy precisa ler o ADR 0001 junto.
- O Blueprint não impede alteração pelo painel. Se alguém editar uma variável por lá, o arquivo e a realidade divergem até a próxima sincronização.
- Os hostnames de produção estão fixos no arquivo (`homedex-server.onrender.com`, `homedex-web.onrender.com`); um fork precisa trocá-los, ou os dois serviços apontam para os originais.
