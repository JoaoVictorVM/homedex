# Changelog

## 1.0.0 (2026-08-02)


### Funcionalidades

* **backend:** adiciona a coluna do ultimo resgate diario ([5186d31](https://github.com/JoaoVictorVM/homedex/commit/5186d317cdacb96ab45b26a073e75b09203032fe))
* **backend:** adiciona a coluna is_system na tabela de jogos ([dff42b8](https://github.com/JoaoVictorVM/homedex/commit/dff42b810cc4d865ab7eb76160454cc12a81f74c))
* **backend:** adiciona comando para aplicar migrations ([5bc2884](https://github.com/JoaoVictorVM/homedex/commit/5bc2884db6bb007009ece31c0564434974f75f82))
* **backend:** baixa os bytes da sprite com cache ([56016d9](https://github.com/JoaoVictorVM/homedex/commit/56016d98750f001e217307f4a25fe7541a1526c3))
* **backend:** cria o jogo homedex nas colecoes existentes ([6dfd644](https://github.com/JoaoVictorVM/homedex/commit/6dfd644519612ab0bdae21994110f30cc2caba0e))
* **backend:** expoe endpoint de imagem da sprite ([70e511c](https://github.com/JoaoVictorVM/homedex/commit/70e511c32db684a87264b0931b56f7d9a9004da7))
* **backend:** implementa o resgate diario atomico ([b118d34](https://github.com/JoaoVictorVM/homedex/commit/b118d34387653aa54143cf81d34ecead121debda))
* **backend:** protege e expoe o jogo do sistema na api de jogos ([02d858b](https://github.com/JoaoVictorVM/homedex/commit/02d858b7c0a7c93d6c6ed08a4403c8e1e606bf27))
* **backend:** semeia o jogo homedex em toda colecao nova ([cf935f3](https://github.com/JoaoVictorVM/homedex/commit/cf935f374cafb579765df7b656c636bfbeccb775))
* **cli:** adiciona cliente do resgate diario ([9b03391](https://github.com/JoaoVictorVM/homedex/commit/9b0339161b15554c4692d47cd131fc1c54ba5aa9))
* **cli:** adiciona dataset dos 151 pokemon de kanto ([3e9f627](https://github.com/JoaoVictorVM/homedex/commit/3e9f627c2b81593b1428f61bc9b240d4fd75abf0))
* **cli:** adiciona entry point com dispatch de subcomandos ([760e467](https://github.com/JoaoVictorVM/homedex/commit/760e4674e4f47b48dac8bd9a451e4e235bc3e86b))
* **cli:** adiciona o comando roll ([f5f37e3](https://github.com/JoaoVictorVM/homedex/commit/f5f37e3e39f3951ba2f35f8fee704cbc52b1d5ab))
* **cli:** busca a sprite no backend ([655538b](https://github.com/JoaoVictorVM/homedex/commit/655538b2e49c0e12764375b5aad1c02bf1502a2c))
* **cli:** compoe o layout do resultado do roll ([e7c9d05](https://github.com/JoaoVictorVM/homedex/commit/e7c9d057444ce5da6ef225357cb3bba4da53a068))
* **cli:** converte png em arte ascii monocromatica ([a71ea68](https://github.com/JoaoVictorVM/homedex/commit/a71ea684b4a3a588b1f25b88199ee47b6e10e2c5))
* **cli:** implementa o motor de roll de especie, sexo e shiny ([5b2207f](https://github.com/JoaoVictorVM/homedex/commit/5b2207f1d98fa9ca391320a43c87072cf529ffa3))
* **cli:** liga o fluxo de adicao ao comando roll ([629ba9c](https://github.com/JoaoVictorVM/homedex/commit/629ba9c32578500c84c4507a24e81bbe045c3d79))
* **cli:** pede o codigo e traduz o resultado do resgate ([2b98c77](https://github.com/JoaoVictorVM/homedex/commit/2b98c771c9b1bf5eb54a6a2dc7dcc4400acd9b5a))
* **cli:** pergunta se o pokemon deve ser adicionado ([5c4f4c5](https://github.com/JoaoVictorVM/homedex/commit/5c4f4c5c3c7d4e54238f45f7331b062e7e0bdf28))
* **cli:** renderiza a arte da sprite no comando roll ([8c519e9](https://github.com/JoaoVictorVM/homedex/commit/8c519e941aba3833e1f7a9691533ce81df79e05d))
* **cli:** resolve url base da api por variavel de ambiente ([62958aa](https://github.com/JoaoVictorVM/homedex/commit/62958aad05cd187ccbdb5acdb3cfd5a1e95204d0))
* **frontend:** esconde o jogo do sistema do dropdown e do modal ([5bbedf6](https://github.com/JoaoVictorVM/homedex/commit/5bbedf6da590ec65c9a8738d8e3139843ad36033))
* **frontend:** reconhece o jogo do sistema no schema ([d30f044](https://github.com/JoaoVictorVM/homedex/commit/d30f0440454373fc8f1d7b3f9991ae03c6b41734))


### Correções

* **cli:** traduz a saida da cli para portugues ([01622d7](https://github.com/JoaoVictorVM/homedex/commit/01622d72558c1fd97a15cc9cda5eeb8c458941bd))
* corrige versao do postgres ([fd14e16](https://github.com/JoaoVictorVM/homedex/commit/fd14e16890377730ad4297463d99f90b96147861))


### Documentação

* adiciona a licenca mit ([ff6579b](https://github.com/JoaoVictorVM/homedex/commit/ff6579bb7cebc19c10b085198d22dff966c9fd39))
* adiciona a politica de seguranca ([fe2df1e](https://github.com/JoaoVictorVM/homedex/commit/fe2df1e935a7b6e401401f6cc79341d27ed82171))
* adiciona changelog inicial ([a8818fa](https://github.com/JoaoVictorVM/homedex/commit/a8818faa4e05cf5d3ea0aff25c8789b01a63db8b))
* adiciona o codigo de conduta ([ae17631](https://github.com/JoaoVictorVM/homedex/commit/ae17631ca774e09e4b6c3b277c3f5f10be1e41b5))
* adiciona o guia de contribuicao ([70e81ed](https://github.com/JoaoVictorVM/homedex/commit/70e81ed82eb9b9498a9b4629d26aba843a338c9d))
* adiciona os adrs das decisoes tecnicas ja tomadas ([36e261f](https://github.com/JoaoVictorVM/homedex/commit/36e261fd39b8254bc991f4f9fb50865bed5078ee))
* adiciona os diagramas c4 de contexto e containers ([6304084](https://github.com/JoaoVictorVM/homedex/commit/630408446043be743da413e677f736cce4ade122))
* aponta a documentacao de arquitetura no readme ([05de203](https://github.com/JoaoVictorVM/homedex/commit/05de2039ca8264e8bf3078046222683ae0fa3e58))
* aponta contribuicao e licenca no readme ([f4853c9](https://github.com/JoaoVictorVM/homedex/commit/f4853c9b1ff5448fdab08d30bd0028eaf3c52a56))
* corrige o nome do web service do render no readme ([fa34bbf](https://github.com/JoaoVictorVM/homedex/commit/fa34bbffbb9686ce87ba325cadac34cc1b833b60))
* documenta a database_url usada pelo taskfile ([9ffc2e8](https://github.com/JoaoVictorVM/homedex/commit/9ffc2e88ada685b1e0217349d0a6dbebd5d4f98e))
* documenta a publicacao dos binarios da cli ([bb07608](https://github.com/JoaoVictorVM/homedex/commit/bb076085e44bd03133987e465237a04877e40677))
* documenta a renderizacao da sprite na cli ([99cf59d](https://github.com/JoaoVictorVM/homedex/commit/99cf59d1d15674a52ba1e0a090bb036a3290a8ed))
* documenta as variaveis do ambiente local ([7265486](https://github.com/JoaoVictorVM/homedex/commit/7265486b176a62a3a25b9ee8aba64524d6250c50))
* documenta o deploy via blueprint do render ([5e5a918](https://github.com/JoaoVictorVM/homedex/commit/5e5a918fc659abce00fcea04b137da7154de2a1c))
* documenta o fluxo de adicao a colecao na cli ([fe241f9](https://github.com/JoaoVictorVM/homedex/commit/fe241f9e592c6e8acf634995b6ece2d0bd719d76))
* documenta o fluxo de versionamento no readme ([b2efc4a](https://github.com/JoaoVictorVM/homedex/commit/b2efc4a4b558cbb9ba041bf5193045a8b5655916))
* documenta o layout e o prompt do roll ([8ccf3ac](https://github.com/JoaoVictorVM/homedex/commit/8ccf3acbda7572a7a6e9619ce92b5ef47e93d5a9))
* documenta o resgate diario e os testes de integracao ([551b99a](https://github.com/JoaoVictorVM/homedex/commit/551b99a4aeebcafb8873ee4c2ce3985ac01e0039))
* documenta o setup dos hooks no readme ([b6376fe](https://github.com/JoaoVictorVM/homedex/commit/b6376fe5a90dd5c759f379514cb5351498696f0d))
* documenta o workspace go no readme ([9e60329](https://github.com/JoaoVictorVM/homedex/commit/9e60329f401aaba618dbcd597de44a6e9aede60e))
* documenta os comandos da cli no readme ([f965c5b](https://github.com/JoaoVictorVM/homedex/commit/f965c5beaafd2530ea40d060092c2611b92e7b95))
* registra o adr da escolha do task ([b1c82de](https://github.com/JoaoVictorVM/homedex/commit/b1c82def246f0a622b7c1d8dafc2bf4c5096e563))
* registra o adr da infraestrutura em blueprint ([ef832d7](https://github.com/JoaoVictorVM/homedex/commit/ef832d7626357561c7d34409666b26f09b9cac8f))
* registra o adr da transacao do resgate diario ([acd6e24](https://github.com/JoaoVictorVM/homedex/commit/acd6e2439ca73e00ef874035c193ae4f5e96de57))
* registra o adr da validacao de commits ([cd5edfa](https://github.com/JoaoVictorVM/homedex/commit/cd5edfa9bbcc5645c53a5e9978a9c5593cc912dd))


### Testes

* **backend:** adiciona testes de integracao do resgate diario ([1be3914](https://github.com/JoaoVictorVM/homedex/commit/1be39148a047fd17de46636bc4bf021bba6476f2))


### Integração contínua

* adiciona configuracao do release-please ([aba0510](https://github.com/JoaoVictorVM/homedex/commit/aba051078b8198aeba053a64a77f92107654e0d6))
* adiciona workflow do release-please ([b0dd0c5](https://github.com/JoaoVictorVM/homedex/commit/b0dd0c54c293256348619b92f5af212f20bdb49f))
* declara a infraestrutura do render em blueprint ([5c7fc1f](https://github.com/JoaoVictorVM/homedex/commit/5c7fc1fea8dd9e5c15be3c00f957c61eb5bf7570))
* publica os binarios da cli ao criar tag ([7d99520](https://github.com/JoaoVictorVM/homedex/commit/7d99520fadc6acde81508b3eed8faaa8ec0f86a2))
* valida a cli em lint, testes e build multiplataforma ([61446d5](https://github.com/JoaoVictorVM/homedex/commit/61446d50e1897ad6361fd71be0bb1aff3d33dc69))
* valida o backend quando o go workspace muda ([142cace](https://github.com/JoaoVictorVM/homedex/commit/142cace5d335c8c2cfbb96ee33f07d329d010d31))


### Manutenção

* adiciona ambiente local com docker compose ([da9b8a6](https://github.com/JoaoVictorVM/homedex/commit/da9b8a6ee70a58ccbbe4344ac1219d65c512162e))
* adiciona editorconfig com as regras por tipo de arquivo ([cdc4572](https://github.com/JoaoVictorVM/homedex/commit/cdc45726384b61b682301cd355203c0a80567bb6))
* adiciona go workspace ligando backend e cli ([477ac9e](https://github.com/JoaoVictorVM/homedex/commit/477ac9e96767d455ae660a4ed73343b97be101ff))
* adiciona taskfile com os comandos dos tres modulos ([e1a567f](https://github.com/JoaoVictorVM/homedex/commit/e1a567fc4c04bcd50dddcade34f9cd6b04ac32b7))
* adiciona validacao de mensagem de commit com lefthook e commitlint ([baac32a](https://github.com/JoaoVictorVM/homedex/commit/baac32a40707c959953e6a7f488751792b48b4a5))
* **backend:** alinha versao do x/sys com o workspace ([01124c6](https://github.com/JoaoVictorVM/homedex/commit/01124c6e6ecd94534cc27402c9c70fdd564371b4))
* **cli:** adiciona configuracao do golangci-lint ([3b70a9d](https://github.com/JoaoVictorVM/homedex/commit/3b70a9d833a26ec3e0f6e8933a321df0b602ceb1))
* **cli:** adiciona configuracao do goreleaser ([1e9c488](https://github.com/JoaoVictorVM/homedex/commit/1e9c488b8bcc01821a4bd03d025a269d38728eb4))
* **cli:** adiciona dependencia do golang.org/x/term ([b68160a](https://github.com/JoaoVictorVM/homedex/commit/b68160a0d9074fe9d70a831dca1f7ce17c2a73cb))
* **cli:** inicializa modulo go da cli ([e6b8c6c](https://github.com/JoaoVictorVM/homedex/commit/e6b8c6ccfffc78dc5c111961267b65a00780dd65))
* fixa fim de linha lf no repositorio ([b12a358](https://github.com/JoaoVictorVM/homedex/commit/b12a358278ce484431c650f9b7c9267ee1cb43d3))
* ignora node_modules na raiz ([76b558a](https://github.com/JoaoVictorVM/homedex/commit/76b558ab52d6cc3558f10f4097ae92fbe7855d8f))
* ignora o binario da cli gerado pelo build ([c209214](https://github.com/JoaoVictorVM/homedex/commit/c209214efb549a0176988f32a09f50f0dce3f138))
* ignora o dist gerado pelo goreleaser ([9acbaa5](https://github.com/JoaoVictorVM/homedex/commit/9acbaa5ecf3bc5fc7461c616d7c31cef9fe2b144))

## Changelog
