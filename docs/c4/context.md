# C4 nível 1 — Contexto do sistema

Quem usa o HomeDex e de que sistemas externos ele depende. O detalhe interno fica no [diagrama de containers](container.md).

```mermaid
graph TD
    colecionador["👤 Colecionador<br/><i>navegador</i><br/>Organiza os Pokémon nas boxes"]
    treinador["👤 Colecionador<br/><i>terminal</i><br/>Sorteia o Pokémon do dia"]

    homedex["<b>HomeDex</b><br/><i>Sistema</i><br/>Gerenciador de boxes no estilo Fire Red.<br/>Coleções acessadas por código único, sem login."]

    pokeapi["<b>PokéAPI</b><br/><i>Sistema externo</i><br/>Dados e sprites dos Pokémon"]
    render["<b>Render</b><br/><i>Sistema externo</i><br/>Hospeda o app web e a API"]
    neon["<b>Neon</b><br/><i>Sistema externo</i><br/>PostgreSQL gerenciado"]
    releases["<b>GitHub Releases</b><br/><i>Sistema externo</i><br/>Distribui os binários da CLI"]

    colecionador -->|"Cria e organiza coleções<br/>HTTPS"| homedex
    treinador -->|"Sorteia e resgata o Pokémon diário<br/>HTTPS"| homedex

    homedex -->|"Consulta espécies, formas e sprites<br/>HTTPS, com cache"| pokeapi
    homedex -->|"É hospedado em"| render
    homedex -->|"Persiste coleções, jogos e Pokémon<br/>TCP/PostgreSQL"| neon
    treinador -->|"Baixa o binário<br/>HTTPS"| releases

    classDef pessoa fill:#08427b,stroke:#052e56,color:#fff
    classDef sistema fill:#1168bd,stroke:#0b4884,color:#fff
    classDef externo fill:#999999,stroke:#6b6b6b,color:#fff

    class colecionador,treinador pessoa
    class homedex sistema
    class pokeapi,render,neon,releases externo
```

## Atores

| Ator | Descrição |
| ---- | --------- |
| Colecionador (navegador) | Cria uma coleção ou recupera a dela pelo código de 8 caracteres, adiciona e organiza Pokémon nas boxes, gerencia jogos e HackRoms. Não existe cadastro nem login: o código **é** a credencial. |
| Colecionador (terminal) | Usa a CLI `homedex` para sortear um Pokémon aleatório de Kanto e, se quiser, resgatá-lo para a coleção — um por dia UTC. É a mesma pessoa do ator acima, por outra porta de entrada. |

## Sistemas externos

| Sistema | Papel | Observações |
| ------- | ----- | ----------- |
| PokéAPI | Fonte de dados de espécies, formas e sprites | Chamada **apenas** pelo backend, nunca pelo frontend ou pela CLI. As respostas são cacheadas em memória para não repetir a ida à rede a cada visualização. |
| Render | Hospedagem do app web (Static Site) e da API (Web Service) | Declarado em `render.yaml` — [ADR 0006](../adr/0006-infraestrutura-declarada-em-render-yaml.md). |
| Neon | PostgreSQL gerenciado | Fora do Render por causa da expiração de 90 dias do banco gratuito de lá — [ADR 0001](../adr/0001-banco-de-dados-no-neon.md). |
| GitHub Releases | Distribuição dos binários da CLI | Publicados pelo GoReleaser quando a tag de release é criada — [ADR 0003](../adr/0003-token-do-release-please.md). |
