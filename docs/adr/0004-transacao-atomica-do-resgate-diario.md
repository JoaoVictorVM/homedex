# ADR 0004 — Resgate diário em uma única transação com trava na coleção

## Status

Aceito

## Contexto

O resgate diário dá a cada coleção **um** Pokémon por dia UTC, pela CLI. Do ponto de vista do banco, um resgate bem-sucedido são três fatos que precisam valer juntos:

1. a coleção ainda não resgatou hoje;
2. o Pokémon foi inserido no primeiro slot livre;
3. o dia foi marcado como consumido em `collections.last_roll_claimed_at`.

Feito de forma ingênua — ler o `last_roll_claimed_at`, decidir em Go, inserir, depois atualizar — há dois modos de falha, e os dois são visíveis para o usuário:

**Corrida.** Duas execuções simultâneas da CLI com o mesmo código leem "ainda não resgatou hoje" antes de qualquer uma gravar, e as duas inserem. A coleção ganha dois Pokémon no mesmo dia. O código da coleção é público por design (é o próprio meio de acesso), então isso não exige má-fé: dois terminais abertos bastam.

**Escrita parcial.** Se o processo morrer entre a inserção e o `UPDATE`, o Pokémon entra sem o dia ser consumido. Na ordem inversa — marcar o dia primeiro — a falha custa ao usuário o resgate do dia **sem** entregar nada, que é exatamente o cenário que o PRD proíbe.

Some-se a isso que o relógio de referência não pode ser o da máquina do usuário: a CLI é distribuída como binário e o limite tem que valer mesmo para quem reinstala, troca de computador ou mexe no relógio do sistema.

## Decisão

O resgate inteiro roda dentro de **uma transação** (`database.InTx`), e a primeira consulta trava a linha da coleção:

```sql
SELECT box_count,
       last_roll_claimed_at IS NOT NULL
         AND (last_roll_claimed_at AT TIME ZONE 'UTC')::date
             = (now() AT TIME ZONE 'UTC')::date,
       ((now() AT TIME ZONE 'UTC')::date + 1)::timestamp AT TIME ZONE 'UTC'
FROM collections
WHERE id = $1
FOR UPDATE
```

A partir daí, na mesma transação: procura do primeiro slot livre, inserção do Pokémon e `UPDATE` do `last_roll_claimed_at`. Qualquer erro no meio desfaz tudo.

Quatro detalhes fazem parte da decisão:

**A comparação de dia acontece no banco, em UTC.** `now()` é o relógio do servidor, não o do cliente. O horário do próximo resgate (`nextAvailableAt`, devolvido no `409`) sai da mesma consulta, então nem a mensagem de bloqueio depende do relógio de quem chamou.

**O `FOR UPDATE` vem antes da checagem.** Requisições concorrentes para o mesmo código serializam na linha da coleção: a segunda só lê `last_roll_claimed_at` depois que a primeira commitou, e aí vê o dia consumido. Coleções diferentes não se bloqueiam entre si.

**O slot livre é escolhido por consulta, não em memória.** Um `generate_series(1, box_count) × generate_series(0, 29)` contra os `pokemons` da coleção, ordenado por box e slot, com `LIMIT 1`. Sem linha nenhuma, a coleção está cheia e o dia **não** é consumido (`422`).

**O jogo não vem do cliente.** O `INSERT` pega o `game_id` de `games WHERE collection_id = $1 AND is_system` — o jogo reservado HomeDex. Não existe campo de jogo no corpo da requisição para ser forjado.

## Alternativas consideradas

| Alternativa | Por que não |
| ----------- | ----------- |
| Ler, decidir em Go e gravar, sem transação | É o cenário que motivou o ADR: corrida entre requisições simultâneas e escrita parcial em caso de falha no meio do caminho. |
| Tabela `daily_claims` com `UNIQUE (collection_id, claim_date)` | Resolve a corrida pelo banco, sem trava explícita, mas ainda exige transação para amarrar a inserção do Pokémon ao registro do resgate — e adiciona uma tabela inteira para guardar um fato que cabe em uma coluna. |
| Isolamento `SERIALIZABLE` na transação | Daria a mesma garantia, mas transforma concorrência em erro de serialização que a CLI teria que saber repetir. A disputa é sempre em uma linha só; travar essa linha é mais barato e mais previsível. |
| `pg_advisory_xact_lock` com o id da coleção | Funciona, mas cria um espaço de nomes de travas paralelo ao dado real. O `FOR UPDATE` na linha que está sendo alterada dá a mesma garantia sem essa indireção. |
| Mutex em memória no processo Go | Não sobrevive a mais de uma instância do backend nem a um restart do Render. Garantia de concorrência não pode morar no processo. |
| Limitar pelo lado da CLI (arquivo de estado local) | Reinstalar o binário, trocar de máquina ou apagar o arquivo devolveria o resgate. O limite é uma regra do produto, não uma cortesia do cliente. |

## Consequências

**Positivas**

- A garantia que o PRD pede se sustenta: não existe estado em que o dia foi consumido sem o Pokémon entrar, nem o contrário.
- O limite é do servidor. Reinstalar a CLI, mudar de computador ou adiantar o relógio não devolve o resgate.
- A serialização é por coleção. Duas pessoas com códigos diferentes resgatando ao mesmo tempo não se enxergam.
- Coleção cheia (`422`) não gasta o dia, porque a marcação só acontece depois da inserção bem-sucedida.

**Negativas**

- A trava da linha fica de pé durante a busca do slot e a inserção. Para o mesmo código, as requisições enfileiram — aceitável para uma ação individual e rara, mas é uma serialização real.
- A busca do slot varre até 32 × 30 = 960 combinações contra os Pokémon da coleção. É barato porque a constraint `pokemons_position_unique (collection_id, box_number, slot)` já mantém um índice sobre exatamente essas colunas — que, de quebra, é a última linha de defesa contra dois Pokémon no mesmo slot —, mas o custo cresce com o tamanho da coleção.
- Nada disso é testável com mock: a corrida e o rollback só aparecem contra um Postgres de verdade, o que exige os testes de integração (`task test:backend:integration`) e um banco local rodando.
- A lógica de "que dia é hoje" fica em SQL, não em Go — mais difícil de ler para quem procura a regra no código do domínio.
