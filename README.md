# ray. — Meu financeiro

Controle financeiro pessoal em formato de aplicativo web, com interface mobile-first para Safari e iPhone.

## Funcionalidades

- Resumo do mês com saldo, entradas, saídas e cinco movimentações recentes.
- Extrato com busca, filtro por mês e tipo, edição e exclusão.
- Limite mensal e gastos agrupados por categoria.
- Metas financeiras com edição e atualização de valores guardados.
- Exportação do extrato em CSV.
- Backup completo e restauração em JSON.
- Quatro abas, ação rápida de lançamento e formulários em bottom sheet.
- Manifesto PWA e áreas seguras para iOS.

## Dados existentes

A aplicação mantém a chave de armazenamento \`ray-financeiro-data-v1\` e o formato de dados das versões anteriores. Registros, limites e metas existentes permanecem no \`localStorage\` do mesmo navegador e aparelho.

Os dados não são enviados para o GitHub ou para um servidor. Use o menu de configurações para exportar um backup JSON antes de trocar de aparelho, navegador ou limpar os dados do Safari. O arquivo CSV contém as movimentações do mês selecionado.

## Instalar no iPhone

1. Abra o endereço no Safari.
2. Toque em Compartilhar.
3. Escolha Adicionar à Tela de Início.
4. Abra o Ray pelo novo ícone.

O projeto usa \`manifest.json\` com modo standalone. A instalação cria uma experiência em janela própria do iOS, mas não é um aplicativo nativo e não sincroniza dados entre dispositivos. Mantenha backups JSON atualizados.

## Publicação

Projeto estático para GitHub Pages, sem etapa de build, Node.js, banco de dados ou servidor.

1. Em **Settings → Pages**, escolha **Deploy from a branch**.
2. Selecione a branch \`main\` e a pasta \`/(root)\`.
3. Salve.

Endereço: https://nickebel.github.io/ray-financeiro/

## Arquivos

- \`index.html\`
- \`manifest.json\`
- \`assets/css/styles.css\`
- \`assets/js/main.js\`
- \`assets/img/favicon.svg\`

Ray é um organizador pessoal, não um banco, carteira digital ou consultoria de investimentos.
