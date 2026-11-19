# Ray Financeiro

Site institucional e ferramentas gratuitas de educação e organização financeira.

**Assinatura:** Seu dinheiro, com mais direção.

## Prévia local

O projeto é estático e não precisa de Node.js ou build:

1. Baixe ou clone o repositório.
2. Abra `index.html` no navegador ou use a extensão Live Server no VS Code.
3. Navegue pelas páginas e teste os simuladores.

## Publicação

A hospedagem deve permitir uso comercial. A recomendação inicial é conectar este repositório à Netlify e publicar a partir da branch `main`, com diretório de publicação na raiz do projeto. Consulte os termos e limites vigentes do plano escolhido antes de publicar.

Também é possível usar outro provedor de hospedagem estática com suporte a domínio próprio e HTTPS. O GitHub Pages não deve ser usado como hospedagem gratuita para administrar um negócio online ou facilitar transações comerciais.

## Personalização obrigatória antes do lançamento

Edite `assets/js/config.js`:

- `whatsapp`: número no formato internacional, apenas dígitos. Exemplo de formato: `55 + DDD + número`.
- `email`: e-mail comercial real.
- `instagram`: URL real do perfil.

Sem esses dados, os CTAs levam à página de contato, mas o formulário não encaminha mensagens. Essa configuração evita inventar canais de atendimento.

## Conteúdo que precisa ser confirmado pelo Ray

- Formação, experiência e certificações reais.
- Escopo efetivo de cada produto/serviço.
- Preços, meios de pagamento, condições e política de cancelamento.
- Disponibilidade e capacidade de atendimento.
- Dados do responsável e política de privacidade completa.
- Canais de atendimento e prazo de resposta.

Os preços atuais são referências de planejamento, não uma confirmação comercial.

## Funcionalidades

- Páginas: Início, Sobre, Soluções, Ferramentas, Conteúdos, Contato, Privacidade e Termos.
- Calculadora de orçamento mensal.
- Simulador de reserva de emergência.
- Simulador matemático de juros compostos.
- Layout responsivo, navegação mobile e foco visível.
- Calculadoras processadas localmente no navegador.

## Estrutura

```
.
├── index.html
├── sobre.html
├── solucoes.html
├── ferramentas.html
├── conteudos.html
├── contato.html
├── privacidade.html
├── termos.html
├── assets/
│   ├── css/styles.css
│   ├── img/favicon.svg
│   └── js/
│       ├── config.js
│       ├── main.js
│       └── tools.js
└── docs/PLANO-ESTRATEGICO.md
```

## Nota de responsabilidade

O site é estruturado para conteúdo educativo e organização financeira pessoal. Não oferece recomendação individualizada de investimentos, promessa de rentabilidade ou garantia de resultados. Atividades reguladas exigem análise dos requisitos e autorizações aplicáveis.

A Política de Privacidade e os Termos são modelos iniciais e devem ser revisados para refletir o tratamento real de dados e os serviços efetivamente prestados.
