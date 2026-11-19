# ray. — Meu financeiro

Aplicativo web de controle financeiro pessoal, pensado primeiro para celular e otimizado para o Safari no iPhone.

## O que tem

- Painel mensal com saldo, entradas, saídas e progresso do limite.
- Seletor de mês para consultar períodos anteriores e futuros.
- Gráfico de fluxo financeiro dos últimos seis meses.
- Extrato com pesquisa, filtro por entrada/saída, edição e exclusão.
- Categorias para receitas e despesas.
- Limite de gastos individual por mês.
- Metas financeiras com edição e registro de aportes.
- Exportação do extrato em CSV.
- Backup completo e restauração em JSON.
- Navegação por quatro abas e ação rápida para novo lançamento.
- Formulários em bottom sheet no celular e suporte às áreas seguras do iOS.

## Publicação no GitHub Pages

O projeto é estático: não usa Node.js, build, banco de dados ou servidor.

1. Abra **Settings** neste repositório.
2. Entre em **Pages**.
3. Em Build and deployment, selecione **Deploy from a branch**.
4. Escolha a branch **main** e a pasta **/(root)**.
5. Salve.

Endereço: https://nickebel.github.io/ray-financeiro/

## Dados e privacidade

Os registros ficam no armazenamento local (localStorage) do navegador. O site não envia movimentações para o GitHub nem para um servidor.

- Os dados ficam vinculados ao navegador e ao aparelho em que foram registrados.
- Adicionar o site à Tela de Início do iPhone cria um acesso dedicado, mas não sincroniza dados entre navegadores ou aparelhos.
- Antes de trocar de aparelho, navegador ou limpar os dados do Safari, use **Backup → Exportar dados**.
- Para recuperar, abra **Backup → Importar dados** e selecione o arquivo JSON.
- O CSV exporta somente as movimentações do mês selecionado.

A chave de armazenamento atual é ray-financeiro-data-v1. Ela é preservada para manter os dados criados nas versões anteriores.

## Adicionar à Tela de Início no iPhone

No Safari, toque em **Compartilhar → Adicionar à Tela de Início**. O Ray poderá abrir pela tela inicial em uma janela própria do iOS. Isso não transforma o projeto em um aplicativo nativo nem substitui o backup.

## Estrutura

- index.html
- assets/css/styles.css
- assets/img/favicon.svg
- assets/js/main.js

O Ray é um organizador pessoal. Não é banco, carteira digital ou consultoria de investimentos.
