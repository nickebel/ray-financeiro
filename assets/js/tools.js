(() => {
  "use strict";
  const money = value => new Intl.NumberFormat("pt-BR", {style:"currency",currency:"BRL"}).format(value);
  const number = (form, name) => {
    const value = Number(new FormData(form).get(name));
    return Number.isFinite(value) ? Math.max(0, value) : 0;
  };
  const show = (id, html) => {
    const target = document.getElementById(id);
    if (target) target.innerHTML = html;
  };
  const safe = value => Math.max(0, Number.isFinite(value) ? value : 0);

  const budget = document.getElementById("budget-form");
  if (budget) budget.addEventListener("submit", event => {
    event.preventDefault();
    if (!budget.reportValidity()) return;
    const income = number(budget,"income");
    const fixed = number(budget,"fixed");
    const variable = number(budget,"variable");
    const debts = number(budget,"debts");
    const expenses = fixed + variable + debts;
    const balance = income - expenses;
    const percent = income > 0 ? Math.min(100, expenses / income * 100) : 0;
    const tone = balance >= 0 ? "positive" : "negative";
    const title = balance >= 0 ? "Este é seu saldo estimado no mês." : "Suas despesas superam a renda informada.";
    show("budget-result", `
      <span class="micro-label">RESUMO DO ORÇAMENTO</span>
      <h3 class="${tone}">${money(balance)}</h3><p>${title}</p>
      <div class="result-lines"><div><span>Renda</span><b>${money(income)}</b></div><div><span>Despesas totais</span><b>${money(expenses)}</b></div><div><span>Comprometimento da renda</span><b>${income > 0 ? percent.toFixed(1).replace(".",",") + "%" : "—"}</b></div></div>
      <div class="meter"><i style="width:${percent}%"></i></div>
      <small>${income === 0 ? "Informe uma renda maior que zero para calcular o percentual." : (percent > 100 ? "Atenção: os gastos informados ultrapassam a renda." : "Use este resultado como ponto de partida para revisar suas prioridades.")}</small>`);
  });

  const reserve = document.getElementById("reserve-form");
  if (reserve) reserve.addEventListener("submit", event => {
    event.preventDefault();
    if (!reserve.reportValidity()) return;
    const essentials = number(reserve,"essentials");
    const months = number(reserve,"months");
    const saved = number(reserve,"saved");
    const monthly = number(reserve,"monthly");
    const target = essentials * months;
    const remaining = Math.max(0, target - saved);
    const progress = target > 0 ? Math.min(100, saved / target * 100) : 0;
    const time = remaining === 0 ? 0 : monthly > 0 ? Math.ceil(remaining / monthly) : null;
    show("reserve-result", `
      <span class="micro-label">SUA META ESTIMADA</span>
      <h3>${money(target)}</h3><p>Referência equivalente a ${months} meses dos gastos essenciais informados.</p>
      <div class="result-lines"><div><span>Valor já guardado</span><b>${money(saved)}</b></div><div><span>Falta acumular</span><b>${money(remaining)}</b></div><div><span>Progresso atual</span><b>${progress.toFixed(1).replace(".",",")}%</b></div></div>
      <div class="meter"><i style="width:${progress}%"></i></div>
      <small>${remaining === 0 ? "A meta informada já foi alcançada. Revise periodicamente se ela continua adequada." : time === null ? "Informe um aporte mensal maior que zero para estimar o prazo." : "Com o aporte informado, o prazo matemático estimado é de " + time + " meses."}</small>`);
  });

  const compound = document.getElementById("compound-form");
  if (compound) compound.addEventListener("submit", event => {
    event.preventDefault();
    if (!compound.reportValidity()) return;
    const initial = number(compound,"initial");
    const contribution = number(compound,"contribution");
    const rate = number(compound,"rate") / 100;
    const months = Math.floor(number(compound,"period"));
    if (months < 1 || months > 600) return;
    let balance = initial;
    for (let month = 0; month < months; month++) {
      balance = balance * (1 + rate) + contribution;
    }
    const invested = initial + contribution * months;
    const interest = balance - invested;
    show("compound-result", `
      <span class="micro-label">RESULTADO MATEMÁTICO ESTIMADO</span>
      <h3>${money(balance)}</h3><p>Montante ao final de ${months} meses, com a taxa hipotética informada e aportes ao fim de cada mês.</p>
      <div class="result-lines"><div><span>Total colocado</span><b>${money(invested)}</b></div><div><span>Variação matemática</span><b class="${interest >= 0 ? "positive" : "negative"}">${money(interest)}</b></div><div><span>Taxa mensal usada</span><b>${(rate * 100).toFixed(2).replace(".",",")}%</b></div></div>
      <small>Simulação hipotética. Não representa produto, oferta, rentabilidade esperada ou garantia de retorno. Não considera tributos, taxas ou inflação.</small>`);
  });
})();