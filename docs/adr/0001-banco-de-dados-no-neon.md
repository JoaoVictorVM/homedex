# ADR 0001 — Banco de dados no Neon em vez do PostgreSQL do Render

## Status

Aceito

## Contexto

O HomeDex é hospedado inteiramente em planos gratuitos. A intenção original era usar os três serviços do Render — Static Site (frontend), Web Service (backend) e PostgreSQL gerenciado — mantendo tudo em um único provedor.

O problema é o ciclo de vida do PostgreSQL gratuito do Render: **a instância expira após 90 dias** e é removida. Para um projeto que precisa ficar no ar indefinidamente como vitrine, isso significaria recriar o banco e reconfigurar a `DATABASE_URL` a cada trimestre, com perda de dados a cada ciclo se o export manual não fosse feito na janela certa. Coleções são acessadas por código único e sem login — não há como um usuário recuperar a coleção dele depois de uma expiração.

O frontend e o backend no Render não têm esse problema: o Web Service gratuito apenas hiberna por inatividade, ele não expira.

## Decisão

Manter frontend e backend no Render e mover **apenas o banco** para o [Neon](https://neon.com), no plano gratuito.

A decisão traz três restrições técnicas que fazem parte dela e não são opcionais:

**1. Mesma região do Web Service.** O projeto Neon é criado na região equivalente à do Render (Oregon → `aws-us-west-2`, Frankfurt → `aws-eu-central-1`). Cruzar regiões adiciona dezenas de milissegundos por consulta, o que conflita diretamente com o requisito de performance do produto.

**2. Connection string direta, não a do pooler.** O endpoint com `-pooler` no host roda PgBouncer em modo transação com `max_prepared_statements=0`, incompatível com o cache de prepared statements do pgx. Produção usa a string direta.

**3. Pool e health adaptados ao scale-to-zero.** O compute do Neon suspende após 5 minutos sem atividade e religa em milissegundos na consulta seguinte. Para que isso seja transparente:

- `backend/internal/database/database.go` configura `MinConns=0` e `MaxConnIdleTime=3min`, abaixo da janela de 5 minutos — o pool descarta conexões ociosas antes de o Neon suspender, evitando que o pool devolva conexões mortas.
- `MaxConns=5` e `MaxConnLifetime=30min` mantêm o consumo dentro do orçamento do plano gratuito.
- O timeout de boot em `backend/cmd/server/main.go` subiu de 10s para 30s, dando folga para a primeira conexão religar o compute frio antes das migrations.
- `/health` virou uma checagem rasa de liveness que **não** toca no banco; a checagem de banco foi separada em `/health/db`. Assim um monitor externo pode manter o Web Service do Render acordado sem impedir o Neon de suspender.

## Alternativas consideradas

| Alternativa | Por que não |
| ----------- | ----------- |
| Manter o PostgreSQL do Render e recriar a cada 90 dias | Trabalho manual recorrente e perda garantida de dados dos usuários a cada ciclo. Inviável para um serviço sem login, onde o usuário não tem como restaurar a coleção. |
| Migrar tudo (front + back + banco) para outro provedor | O Render atende bem os dois serviços de aplicação e o `render.yaml` já descreve a infra. Trocar tudo seria custo alto para resolver um problema restrito ao banco. |
| Supabase | Também oferece Postgres gratuito, mas o plano gratuito pausa o projeto inteiro após uma semana de inatividade e exige reativação manual — o oposto do que se quer aqui. O Neon suspende só o compute e religa sozinho. |
| SQLite em disco no Render | O disco persistente do Render é pago, e o Web Service gratuito não tem armazenamento durável. |

## Consequências

**Positivas**

- O banco não expira por inatividade; o serviço fica no ar sem manutenção agendada.
- O scale-to-zero do Neon é transparente para o usuário — o religamento acontece em milissegundos, muito mais rápido que a saída de hibernação do Web Service do Render.
- Separar liveness de checagem de banco deixou o endpoint de health mais correto de qualquer forma: `/health` responde sobre o processo, `/health/db` sobre a dependência.

**Negativas**

- A infraestrutura passa a estar em dois provedores. O `render.yaml` (Blueprint) descreve apenas os dois serviços de aplicação — o banco fica fora do infra-as-code e é provisionado manualmente no Neon.
- O plano gratuito do Neon dá 0,5 GB de armazenamento e 100 CU-hours/mês (~400 h a 0,25 CU, contra ~730 h de mês corrido). Monitoramento contínuo apontado para `/health/db` estouraria esse orçamento — por isso a separação do passo 3 é obrigatória, não cosmética.
- Há armadilhas de configuração não óbvias (região, endpoint sem pooler) que precisam estar documentadas no README para quem for reproduzir o deploy.
