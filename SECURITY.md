# Política de segurança

## Versões suportadas

Só a `main` e a última release publicada recebem correção. Não há backport para versões anteriores da CLI.

## Como reportar

**Não abra uma issue pública** para relatar uma vulnerabilidade.

Use o canal privado do GitHub: aba **Security** → **Report a vulnerability**. Se ele não estiver disponível para você, entre em contato pelo perfil [@JoaoVictorVM](https://github.com/JoaoVictorVM).

Ajuda bastante se o relato trouxer:

- o que é afetado (app web, API, CLI) e em qual versão;
- os passos para reproduzir, com requisições ou comandos quando fizer sentido;
- o impacto que você enxerga.

Este é um projeto pessoal, sem plantão nem prazo contratado: a resposta é por melhor esforço, normalmente em alguns dias. Peço apenas que a divulgação pública espere a correção sair ou, na falta dela, um retorno meu.

## O que mais interessa neste projeto

O HomeDex **não tem login**: o código de 8 caracteres da coleção é a própria credencial de acesso. Isso muda o que conta como falha grave aqui:

- qualquer forma de descobrir, enumerar ou adivinhar códigos de coleção em massa;
- acessar ou alterar dados de uma coleção a partir do código de outra;
- contornar o limite de um resgate diário por coleção;
- contornar o rate limiting ou a política de CORS da API;
- injeção de SQL, XSS ou qualquer execução de código não prevista;
- exposição de segredos (`DATABASE_URL`, tokens de CI) por logs, respostas da API ou artefatos de build.

**Fora de escopo**: relatórios automatizados de scanner sem impacto demonstrado, ausência de headers que não levem a uma exploração concreta, e engenharia social contra o mantenedor. Também não é vulnerabilidade o fato de quem tem o código de uma coleção conseguir editá-la: o código é a credencial, e compartilhá-lo é compartilhar o acesso.
