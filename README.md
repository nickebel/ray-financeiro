# Ray — Meu financeiro

Um organizador financeiro pessoal, simples e dinâmico, criado para o Ray.

## O que tem

- Resumo mensal com saldo, entradas e saídas.
- Gráfico dos últimos seis meses.
- Registro, edição e exclusão de movimentações.
- Categorias para receitas e despesas.
- Busca e filtro do histórico.
- Limite de gastos por mês.
- Metas pessoais com atualização de valores guardados.
- Exportação dos lançamentos em CSV.
- Backup e restauração de todos os dados em JSON.
- Layout responsivo para computador e celular.

## Visual e navegação

O site usa uma identidade editorial leve, com referências visuais tropicais: Fraunces e DM Sans, verde, creme, coral e amarelo. As seções funcionam em uma única página, com navegação por âncoras e formulários interativos.

## Publicação no GitHub Pages

Não usa Netlify, Node.js, build, banco de dados nem servidor.

1. Abra **Settings** neste repositório.
2. Entre em **Pages**.
3. Em Build and deployment, selecione **Deploy from a branch**.
4. Escolha a branch **main** e a pasta **/(root)**.
5. Salve.

O endereço esperado é:

https://nickebel.github.io/ray-financeiro/

## Como os dados são guardados

Os registros ficam no armazenamento local (localStorage) do navegador. O site não envia transações para o GitHub nem para um servidor.

Isso significa que:
- Os dados ficam no navegador e aparelho usados pelo Ray.
- Em outro navegador ou aparelho, será necessário importar um backup.
- Limpar os dados do navegador pode apagar os registros.
- Use **Baixar backup** para guardar uma cópia JSON.
- Use **Restaurar backup** para recuperar ou transferir os dados.
- O CSV pode ser aberto no Excel ou Google Planilhas.

O código do site é público, mas as movimentações que Ray digita não são adicionadas ao repositório.

## Estrutura

```
.
├── index.html
├── README.md
└── assets/
    ├── css/styles.css
    ├── img/favicon.svg
    └── js/main.js
```

## Escopo

Este projeto é um organizador pessoal. Não é banco, carteira digital ou consultoria de investimentos.


## Uso no iPhone

A interface é responsiva e foi ajustada para o iPhone 14 (largura CSS de referência de 390 px), com navegação inferior, botões maiores, campos que evitam o zoom automático do Safari e respeito às áreas seguras do aparelho.

No Safari, o Ray pode ser adicionado à Tela de Início pelo menu de compartilhamento para abrir como atalho.
