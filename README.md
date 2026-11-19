# Ray — Meu financeiro

Organizador financeiro pessoal, simples e privado, feito para o Ray.

## O que faz

- Registra entradas e saídas.
- Mostra saldo, receitas e despesas do mês.
- Organiza lançamentos por categoria.
- Permite definir um limite mensal de gastos.
- Acompanha metas de economia.
- Pesquisa e filtra lançamentos.
- Exporta lançamentos em CSV.
- Faz backup e restauração de todos os dados em JSON.

## Como usar

O projeto é estático, sem Node.js, build, Netlify, banco de dados ou cadastro.

### Publicar gratuitamente com GitHub Pages

1. Abra a aba **Settings** deste repositório.
2. Entre em **Pages** no menu lateral.
3. Em **Build and deployment**, escolha **Deploy from a branch**.
4. Selecione a branch **main** e a pasta **/(root)**.
5. Salve e aguarde a publicação do GitHub Pages.

Depois, o endereço esperado será:

`https://nickebel.github.io/ray-financeiro/`

O GitHub pode levar alguns minutos para publicar a primeira versão. O site não precisa de configuração de build.

### Testar sem publicar

Baixe o repositório e abra `index.html` no navegador. Também pode usar a extensão Live Server do VS Code.

## Privacidade: leia antes de usar

Os lançamentos, orçamentos e metas ficam salvos no `localStorage` do navegador utilizado. O site não envia essas informações ao GitHub, a uma API ou a um servidor.

Isso significa:

- Os dados ficam disponíveis somente naquele navegador e aparelho.
- Outro computador ou navegador começa com uma base separada.
- Limpar os dados do navegador pode apagar as informações.
- Exporte regularmente um backup em **Dados e ajustes**.
- Para transferir os dados, exporte o JSON no aparelho antigo e importe no novo.

O repositório e o código do site são públicos, mas os dados financeiros digitados pelo Ray não são gravados nos arquivos do GitHub.

## Estrutura

```
.
├── index.html
├── assets/
│   ├── css/styles.css
│   ├── img/favicon.svg
│   └── js/main.js
└── README.md
```

## Observação

Este projeto é um organizador pessoal, não um banco, carteira digital ou serviço de investimento. Os valores são inseridos e mantidos pelo próprio usuário.
