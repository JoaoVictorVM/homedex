# ADR 0002 — Interface da CLI em português

## Status

Aceito

## Contexto

A CLI do HomeDex (`cli/`) é uma superfície de usuário nova, separada da web. As três superfícies existentes não seguem a mesma regra de idioma:

- A **web** é bilíngue (PT-BR e EN), com a escolha feita pelo usuário.
- O **backend** responde erros só em PT-BR (`"variável de ambiente DATABASE_URL não definida"`, `games.ParseName`, etc.).
- O **PRD da CLI** (`docs/dev/CLI-PRD.md`) e os specs derivados citam as mensagens da CLI em inglês — `"Add this Pokémon to your collection? (y/n)"`, `"Pikachu was added to Box 1, slot 4!"`, `"Could not load artwork, showing details only"`.

Como a F06 é a primeira feature da CLI a imprimir texto, a decisão precisa ser tomada agora: F02, F03 e F05 constroem em cima dela e replicariam a escolha em dezenas de strings.

Bilinguismo na CLI não é viável de graça: exigiria um mecanismo de seleção de idioma (flag, variável de ambiente ou detecção de locale) e uma tabela de mensagens — infraestrutura que o PRD não pede e que a seção "Out of Scope" empurra na direção oposta ao definir a CLI como "a simple, sequential text-based command-line tool".

## Decisão

Toda a saída de usuário da CLI é escrita em **português (PT-BR)**, com um único idioma, sem mecanismo de seleção.

As strings em inglês citadas no PRD e nos specs das features da CLI são tratadas como **ilustrativas do conteúdo da mensagem, não do idioma literal**. Ao implementar F02, F03 e F05, o texto é traduzido mantendo a informação especificada (espécie, box, slot, timestamp UTC, opções do prompt).

Fora do escopo desta decisão: identificadores de código, nomes de comandos e flags (`config`, `roll`, `HOMEDEX_API_URL`) continuam em inglês, como é convenção em ferramentas de linha de comando.

## Alternativas consideradas

| Alternativa | Por que não |
| ----------- | ----------- |
| Inglês, seguindo as strings literais do PRD | Deixaria a CLI falando um idioma e o backend — que ela consome e cujos erros pode repassar — outro, na mesma sessão de terminal. O público-alvo descrito no PRD é o mesmo da web, majoritariamente brasileiro. |
| Bilíngue como a web, via `HOMEDEX_LANG` ou locale do sistema | Custo desproporcional para uma ferramenta de poucas telas: catálogo de mensagens, resolução de idioma e testes em dobro, sem demanda declarada no PRD. |
| Inglês na CLI e PT-BR no backend, sem decisão registrada | É o estado que existiria por omissão. O problema não é a mistura em si, é ela acontecer por acidente e ser replicada em três features seguintes sem ninguém ter escolhido. |

## Consequências

**Positivas**

- Consistência com o backend, que já responde em PT-BR e cujas mensagens de erro chegam ao usuário através da CLI.
- Nenhuma dependência nem camada de i18n na CLI — o binário continua sendo `os.Getenv` + `fmt`.
- F02, F03 e F05 têm uma regra única para escrever suas mensagens, sem renegociar caso a caso.

**Negativas**

- A CLI fica menos acessível a quem não lê português, enquanto a web é bilíngue. Se isso virar um problema real, a saída é adicionar i18n depois — nenhuma das mensagens desta decisão é irreversível.
- O PRD e os specs seguem citando mensagens em inglês. Este ADR é a fonte da verdade sobre o idioma; a divergência textual é conhecida e aceita em vez de propagar edições por todos os documentos.
