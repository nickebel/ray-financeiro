(() => {
  "use strict";

  // Não altere esta chave: ela mantém compatibilidade com os dados já salvos.
  const STORAGE_KEY = "ray-financeiro-data-v1";
  const INSTALL_TIP_KEY = "ray-financeiro-install-tip-v1";

  const CATEGORIES = {
    income: [
      { id: "salary", name: "Salário", icon: "▣" },
      { id: "extra", name: "Renda extra", icon: "↗" },
      { id: "sales", name: "Vendas", icon: "◇" },
      { id: "other-income", name: "Outras entradas", icon: "＋" }
    ],
    expense: [
      { id: "housing", name: "Moradia", icon: "⌂" },
      { id: "food", name: "Alimentação", icon: "✳" },
      { id: "transport", name: "Transporte", icon: "↗" },
      { id: "health", name: "Saúde", icon: "＋" },
      { id: "leisure", name: "Lazer", icon: "☆" },
      { id: "education", name: "Educação", icon: "▧" },
      { id: "bills", name: "Contas", icon: "≋" },
      { id: "shopping", name: "Compras", icon: "◇" },
      { id: "subscriptions", name: "Assinaturas", icon: "◷" },
      { id: "other-expense", name: "Outros gastos", icon: "•••" }
    ]
  };

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

  const todayISO = () => {
    const date = new Date();
    return date.getFullYear() + "-" +
      String(date.getMonth() + 1).padStart(2, "0") + "-" +
      String(date.getDate()).padStart(2, "0");
  };

  const monthKey = date => date.getFullYear() + "-" + String(date.getMonth() + 1).padStart(2, "0");
  const money = value => new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL"
  }).format(Number(value) || 0);

  const monthName = date => {
    const value = new Intl.DateTimeFormat("pt-BR", {
      month: "long",
      year: "numeric"
    }).format(date);
    return value.charAt(0).toLocaleUpperCase("pt-BR") + value.slice(1);
  };

  const dateLabel = value => {
    const parts = String(value).split("-").map(Number);
    if (parts.length !== 3 || parts.some(number => !Number.isFinite(number))) return value;
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "short"
    }).format(new Date(parts[0], parts[1] - 1, parts[2])).replace(".", "");
  };

  const escapeHtml = value => String(value ?? "").replace(/[&<>"']/g, character => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  }[character]));

  const validMoney = value => Number.isFinite(value) && value >= 0
    ? Math.round(value * 100) / 100
    : 0;

  const makeId = () => window.crypto && window.crypto.randomUUID
    ? window.crypto.randomUUID()
    : String(Date.now()) + Math.random().toString(16).slice(2);

  const initialState = () => ({
    version: 1,
    transactions: [],
    budgets: {},
    goals: []
  });

  function loadState() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
      if (!saved) return initialState();

      return {
        version: 1,
        transactions: Array.isArray(saved.transactions)
          ? saved.transactions.filter(transaction =>
            transaction &&
            typeof transaction.id === "string" &&
            (transaction.type === "income" || transaction.type === "expense") &&
            typeof transaction.date === "string" &&
            Number.isFinite(Number(transaction.amount)) &&
            Number(transaction.amount) > 0
          )
          : [],
        budgets: saved.budgets && typeof saved.budgets === "object" ? saved.budgets : {},
        goals: Array.isArray(saved.goals)
          ? saved.goals.filter(goal =>
            goal &&
            typeof goal.id === "string" &&
            typeof goal.name === "string" &&
            Number(goal.target) > 0
          )
          : []
      };
    } catch (error) {
      console.warn("Não foi possível abrir os dados salvos.", error);
      return initialState();
    }
  }

  let state = loadState();
  let selectedMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  let toastTimer = null;

  const say = message => {
    const toast = $("#toast");
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("show"), 2600);
  };

  function save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      return true;
    } catch (error) {
      say("Não foi possível salvar. Exporte um backup e libere espaço no navegador.");
      return false;
    }
  }

  const currentKey = () => monthKey(selectedMonth);
  const monthTransactions = key => state.transactions
    .filter(transaction => transaction.date && transaction.date.slice(0, 7) === key)
    .sort((a, b) => b.date.localeCompare(a.date) || (b.createdAt || 0) - (a.createdAt || 0));

  function sums(list) {
    const income = list
      .filter(transaction => transaction.type === "income")
      .reduce((total, transaction) => total + Number(transaction.amount), 0);
    const expenses = list
      .filter(transaction => transaction.type === "expense")
      .reduce((total, transaction) => total + Number(transaction.amount), 0);

    return { income, expenses, balance: income - expenses };
  }

  function category(type, id) {
    return (CATEGORIES[type] || []).find(item => item.id === id) || {
      id: "other",
      name: "Outros",
      icon: "•"
    };
  }

  function budgetLimit() {
    return Number(state.budgets[currentKey()] || 0);
  }

  function renderMonthLabels() {
    const label = monthName(selectedMonth);
    ["month-label", "records-month-label", "budget-month-label"].forEach(id => {
      const element = $("#" + id);
      if (element) element.textContent = label;
    });
  }

  function budgetMarkup(spent, limit) {
    if (!limit) {
      return '<div class="budget-empty">' +
        'Você ainda não definiu um limite para este mês.' +
        '<br><button type="button" data-action="set-budget">Definir limite mensal ↗</button>' +
        '</div>';
    }

    const percentage = spent / limit * 100;
    const remaining = limit - spent;
    const over = remaining < 0;
    const width = Math.min(100, Math.max(0, percentage));

    return '<div class="budget-value-row">' +
      '<strong class="money">' + money(spent) + '</strong>' +
      '<span>de ' + money(limit) + '</span>' +
      '</div>' +
      '<div class="budget-track' + (over ? " over" : "") + '">' +
      '<i style="width:' + width + '%"></i>' +
      '</div>' +
      '<div class="budget-foot">' +
      '<span>' + (over ? "Acima em " + money(Math.abs(remaining)) : "Restam " + money(remaining)) + '</span>' +
      '<strong class="tabular">' + percentage.toFixed(0).replace(".", ",") + '%</strong>' +
      '</div>';
  }

  function renderBudgetProgress(spent, limit) {
    const label = $("#budget-progress-label");
    const value = $("#budget-progress-value");
    const bar = $("#budget-progress-bar");
    const track = $("#budget-progress-track");
    if (!label || !value || !bar || !track) return;

    if (!limit) {
      label.textContent = "Defina um limite para acompanhar seus gastos";
      value.textContent = "—";
      bar.style.width = "0%";
      track.setAttribute("aria-valuenow", "0");
      track.classList.remove("over");
      return;
    }

    const percentage = spent / limit * 100;
    const width = Math.min(100, Math.max(0, percentage));
    const over = percentage > 100;
    label.textContent = over ? "Você ultrapassou o limite mensal" : "do limite mensal utilizado";
    value.textContent = percentage.toFixed(0).replace(".", ",") + "%";
    bar.style.width = width + "%";
    track.setAttribute("aria-valuenow", String(Math.round(width)));
    track.classList.toggle("over", over);
  }

  function categorySums(list) {
    const totals = {};
    list.filter(transaction => transaction.type === "expense").forEach(transaction => {
      totals[transaction.category] = (totals[transaction.category] || 0) + Number(transaction.amount);
    });

    return Object.keys(totals)
      .map(id => ({
        id,
        total: totals[id],
        ...category("expense", id)
      }))
      .sort((a, b) => b.total - a.total);
  }

  function categoryHtml(list) {
    const rows = categorySums(list);
    if (!rows.length) {
      return '<div class="empty-state"><b>Nenhum gasto por categoria.</b>Seus gastos aparecerão aqui quando você registrar uma saída.</div>';
    }

    const max = rows[0].total || 1;
    return rows.slice(0, 7).map(item => {
      const percentage = Math.max(3, item.total / max * 100);
      return '<div class="category-row">' +
        '<span class="category-icon" aria-hidden="true">' + escapeHtml(item.icon) + '</span>' +
        '<div class="category-info">' +
        '<strong>' + escapeHtml(item.name) + '</strong>' +
        '<div class="category-track"><i style="width:' + percentage + '%"></i></div>' +
        '</div>' +
        '<strong class="money">' + money(item.total) + '</strong>' +
        '</div>';
    }).join("");
  }

  function renderSummary() {
    const list = monthTransactions(currentKey());
    const total = sums(list);
    const limit = budgetLimit();

    $("#summary-balance").textContent = money(total.balance);
    $("#summary-income").textContent = money(total.income);
    $("#summary-expenses").textContent = money(total.expenses);

    $("#category-breakdown").innerHTML = categoryHtml(list);
    $("#planning-categories").innerHTML = categoryHtml(list);
    $("#budget-summary").innerHTML = budgetMarkup(total.expenses, limit);
    renderBudgetProgress(total.expenses, limit);
    renderMovementChart();
  }

  function renderMovementChart() {
    const target = $("#movement-chart");
    const months = [];

    for (let offset = 5; offset >= 0; offset--) {
      const date = new Date(
        selectedMonth.getFullYear(),
        selectedMonth.getMonth() - offset,
        1
      );
      const total = sums(monthTransactions(monthKey(date)));
      months.push({
        label: new Intl.DateTimeFormat("pt-BR", { month: "short" })
          .format(date).replace(".", ""),
        income: total.income,
        expenses: total.expenses
      });
    }

    const max = Math.max(1, ...months.map(item => Math.max(item.income, item.expenses)));
    target.innerHTML = months.map(item => {
      const incomeHeight = item.income ? Math.max(3, item.income / max * 100) : 1;
      const expenseHeight = item.expenses ? Math.max(3, item.expenses / max * 100) : 1;
      return '<div class="movement-month" title="Entradas ' + money(item.income) +
        ' · Saídas ' + money(item.expenses) + '">' +
        '<div class="movement-bars">' +
        '<i class="bar-in" style="height:' + incomeHeight + '%"></i>' +
        '<i class="bar-out" style="height:' + expenseHeight + '%"></i>' +
        '</div><small>' + escapeHtml(item.label) + '</small></div>';
    }).join("");
  }

  function rowHtml(transaction) {
    const itemCategory = category(transaction.type, transaction.category);
    const isIncome = transaction.type === "income";
    const sign = isIncome ? "+" : "−";
    const meta = escapeHtml(itemCategory.name) + " <span aria-hidden=\"true\">·</span> " +
      '<time class="record-date" datetime="' + escapeHtml(transaction.date) + '">' +
      escapeHtml(dateLabel(transaction.date)) + '</time>';

    return '<article class="record-row">' +
      '<button class="record-main" type="button" data-toggle-record="' + escapeHtml(transaction.id) +
      '" aria-expanded="false">' +
      '<span class="record-icon" aria-hidden="true">' + escapeHtml(itemCategory.icon) + '</span>' +
      '<span class="record-description">' +
      '<b>' + escapeHtml(transaction.description) + '</b>' +
      '<small class="record-meta">' + meta + '</small>' +
      '</span>' +
      '<strong class="record-amount ' + (isIncome ? "income" : "expense") + '">' +
      sign + ' ' + money(transaction.amount) +
      '</strong>' +
      '</button>' +
      '<div class="record-actions" hidden>' +
      '<button type="button" data-edit-transaction="' + escapeHtml(transaction.id) + '">Editar</button>' +
      '<button type="button" data-delete-transaction="' + escapeHtml(transaction.id) + '">Excluir</button>' +
      '</div>' +
      '</article>';
  }

  function renderTransactions() {
    const query = $("#transaction-search").value.trim().toLocaleLowerCase("pt-BR");
    const filter = $("#transaction-filter").value;
    const items = monthTransactions(currentKey()).filter(transaction => {
      const description = (transaction.description + " " + category(transaction.type, transaction.category).name)
        .toLocaleLowerCase("pt-BR");
      return (filter === "all" || transaction.type === filter) &&
        (!query || description.includes(query));
    });

    $("#all-transactions").innerHTML = items.length
      ? items.map(rowHtml).join("")
      : '<div class="empty-state"><b>Nenhuma movimentação encontrada.</b>Adicione um registro ou ajuste os filtros.</div>';

    $("#transaction-count").textContent = items.length +
      (items.length === 1 ? " movimentação neste mês" : " movimentações neste mês");
  }

  function renderGoals() {
    const target = $("#goals-list");
    if (!state.goals.length) {
      target.innerHTML = '<div class="empty-state empty-goals">' +
        '<b>Você ainda não criou uma meta.</b>Defina um objetivo e acompanhe seu progresso.' +
        '</div>';
      return;
    }

    const symbols = ["◎", "✈", "⌂", "☆"];
    target.innerHTML = state.goals.map((goal, index) => {
      const saved = Number(goal.saved) || 0;
      const goalTarget = Number(goal.target);
      const percentage = Math.min(100, goalTarget > 0 ? saved / goalTarget * 100 : 0);
      const remaining = Math.max(0, goalTarget - saved);
      const symbol = symbols[index % symbols.length];

      return '<article class="goal-card">' +
        '<div class="goal-card-top">' +
        '<span class="goal-card-icon" aria-hidden="true">' + symbol + '</span>' +
        '<div class="goal-actions">' +
        '<button type="button" data-edit-goal="' + escapeHtml(goal.id) + '">Editar</button>' +
        '<button type="button" data-delete-goal="' + escapeHtml(goal.id) + '" aria-label="Excluir meta">×</button>' +
        '</div></div>' +
        '<h3>' + escapeHtml(goal.name) + '</h3>' +
        '<div class="goal-amounts">' +
        '<strong class="money">' + money(saved) + '</strong>' +
        '<span>de ' + money(goalTarget) + '</span>' +
        '</div>' +
        '<div class="goal-track" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="' +
        Math.round(percentage) + '" aria-label="Progresso da meta">' +
        '<i style="width:' + percentage + '%"></i></div>' +
        '<div class="goal-card-foot">' +
        '<small class="tabular">' + percentage.toFixed(0).replace(".", ",") + '% concluído · faltam ' +
        money(remaining) + '</small>' +
        '<button class="goal-contribute" type="button" data-contribute-goal="' +
        escapeHtml(goal.id) + '">Adicionar valor +</button>' +
        '</div></article>';
    }).join("");
  }

  function render() {
    renderMonthLabels();
    renderSummary();
    renderTransactions();
    renderGoals();
  }

  function setActiveTab(tab) {
    const allowed = ["resumo", "extrato", "limite", "metas"];
    const selected = allowed.includes(tab) ? tab : "resumo";

    $$("[data-screen]").forEach(screen => {
      const active = screen.id === selected;
      screen.hidden = !active;
      screen.classList.toggle("is-active", active);
    });

    $$(".tab-button[data-tab]").forEach(button => {
      const active = button.dataset.tab === selected;
      button.classList.toggle("active", active);
      if (active) button.setAttribute("aria-current", "page");
      else button.removeAttribute("aria-current");
    });

    const backupMenu = $("#backup-menu");
    if (backupMenu) backupMenu.open = false;
    window.scrollTo(0, 0);
  }

  function setCategoryOptions(type, selected) {
    const select = $("#transaction-category");
    select.innerHTML = (CATEGORIES[type] || CATEGORIES.expense).map(item =>
      '<option value="' + item.id + '">' + escapeHtml(item.name) + '</option>'
    ).join("");

    if (selected && Array.from(select.options).some(option => option.value === selected)) {
      select.value = selected;
    }
  }

  function openTransaction(id) {
    const form = $("#transaction-form");
    form.reset();

    const old = id ? state.transactions.find(item => item.id === id) : null;
    form.elements.id.value = old ? old.id : "";
    form.elements.description.value = old ? old.description : "";
    form.elements.amount.value = old ? old.amount : "";
    form.elements.date.value = old ? old.date : todayISO();

    const type = old ? old.type : "expense";
    form.querySelector('input[name="type"][value="' + type + '"]').checked = true;
    setCategoryOptions(type, old ? old.category : null);

    $("#transaction-modal-title").textContent = old ? "Editar movimentação" : "Nova movimentação";
    $("#transaction-modal").showModal();
  }

  function openBudget() {
    const form = $("#budget-form");
    form.reset();
    form.elements.limit.value = budgetLimit() || "";
    $("#budget-modal").showModal();
  }

  function openGoal(id) {
    const form = $("#goal-form");
    form.reset();

    const old = id ? state.goals.find(goal => goal.id === id) : null;
    form.elements.id.value = old ? old.id : "";
    form.elements.name.value = old ? old.name : "";
    form.elements.target.value = old ? old.target : "";
    form.elements.saved.value = old ? old.saved : 0;

    $("#goal-modal-title").textContent = old ? "Editar meta" : "Nova meta";
    $("#goal-modal").showModal();
  }

  function openContribution(id) {
    const goal = state.goals.find(item => item.id === id);
    if (!goal) return;

    const form = $("#contribution-form");
    form.reset();
    form.elements.id.value = id;
    $("#contribution-goal-name").textContent =
      goal.name + " · você já guardou " + money(goal.saved || 0) + ".";
    $("#contribution-modal").showModal();
  }

  function changeMonth(step) {
    selectedMonth = new Date(
      selectedMonth.getFullYear(),
      selectedMonth.getMonth() + step,
      1
    );
    render();
  }

  function download(blob, name) {
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = name;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function exportBackup() {
    const file = new Blob([JSON.stringify(state, null, 2)], {
      type: "application/json"
    });
    download(file, "ray-backup-" + todayISO() + ".json");
    say("Backup exportado. Guarde o arquivo em um local seguro.");
  }

  function exportCsv() {
    const items = monthTransactions(currentKey());
    if (!items.length) {
      say("Não há movimentações neste mês.");
      return;
    }

    const rows = [["Data", "Tipo", "Descrição", "Categoria", "Valor"]];
    items.slice().reverse().forEach(transaction => {
      rows.push([
        transaction.date,
        transaction.type === "income" ? "Entrada" : "Saída",
        transaction.description,
        category(transaction.type, transaction.category).name,
        Number(transaction.amount).toFixed(2).replace(".", ",")
      ]);
    });

    const csv = "\uFEFF" + rows.map(row =>
      row.map(value => '"' + String(value).replace(/"/g, '""') + '"').join(";")
    ).join("\r\n");

    download(
      new Blob([csv], { type: "text/csv;charset=utf-8" }),
      "ray-extrato-" + currentKey() + ".csv"
    );
    say("Extrato CSV exportado.");
  }

  function importBackup(file) {
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(String(reader.result || ""));
        if (
          !data ||
          !Array.isArray(data.transactions) ||
          !Array.isArray(data.goals) ||
          !data.budgets ||
          typeof data.budgets !== "object"
        ) {
          throw new Error("invalid backup");
        }

        const next = {
          version: 1,
          transactions: data.transactions.filter(transaction =>
            transaction &&
            typeof transaction.id === "string" &&
            (transaction.type === "income" || transaction.type === "expense") &&
            typeof transaction.date === "string" &&
            Number(transaction.amount) > 0
          ),
          budgets: data.budgets,
          goals: data.goals.filter(goal =>
            goal &&
            typeof goal.id === "string" &&
            typeof goal.name === "string" &&
            Number(goal.target) > 0
          )
        };

        if (!confirm("O backup vai substituir os dados deste navegador. Quer continuar?")) return;

        state = next;
        save();
        render();
        say("Backup restaurado com sucesso.");
      } catch (error) {
        say("Esse arquivo não parece ser um backup válido do Ray.");
      }
    };

    reader.onerror = () => say("Não foi possível ler o arquivo.");
    reader.readAsText(file);
  }

  function setupInstallTip() {
    const tip = $("#install-tip");
    if (!tip) return;

    const userAgent = navigator.userAgent || "";
    const isIOS = /iPhone|iPad|iPod/i.test(userAgent) ||
      (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    const isStandalone = navigator.standalone === true ||
      (window.matchMedia && window.matchMedia("(display-mode: standalone)").matches);

    if (!isIOS || isStandalone) return;

    try {
      if (localStorage.getItem(INSTALL_TIP_KEY) !== "1") {
        tip.hidden = false;
      }
    } catch (error) {
      tip.hidden = false;
    }
  }

  // Alternância entre as quatro telas do app e ações globais.
  document.addEventListener("click", event => {
    const tabLink = event.target.closest("[data-tab-link]");
    if (tabLink) {
      event.preventDefault();
      setActiveTab(tabLink.dataset.tabLink);
      return;
    }

    const tab = event.target.closest("[data-tab]");
    if (tab) {
      setActiveTab(tab.dataset.tab);
      return;
    }

    const recordToggle = event.target.closest("[data-toggle-record]");
    if (recordToggle) {
      const row = recordToggle.closest(".record-row");
      const actions = row && $(".record-actions", row);
      if (row && actions) {
        const isOpen = row.classList.toggle("is-open");
        actions.hidden = !isOpen;
        recordToggle.setAttribute("aria-expanded", String(isOpen));
      }
      return;
    }

    const action = event.target.closest("[data-action]");
    if (action) {
      const name = action.dataset.action;

      if (name === "add-transaction") openTransaction();
      if (name === "set-budget") openBudget();
      if (name === "add-goal") openGoal();
      if (name === "previous-month") changeMonth(-1);
      if (name === "next-month") changeMonth(1);
      if (name === "current-month") {
        selectedMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
        render();
      }
      if (name === "export-csv") exportCsv();
      if (name === "export-backup") {
        const menu = action.closest("details");
        if (menu) menu.open = false;
        exportBackup();
      }
      if (name === "import-backup") {
        const menu = action.closest("details");
        if (menu) menu.open = false;
        $("#backup-file").click();
      }
    }

    const close = event.target.closest("[data-close]");
    if (close) {
      const dialog = $("#" + close.dataset.close);
      if (dialog && dialog.open) dialog.close();
      return;
    }

    const editTransaction = event.target.closest("[data-edit-transaction]");
    if (editTransaction) {
      openTransaction(editTransaction.dataset.editTransaction);
      return;
    }

    const deleteTransaction = event.target.closest("[data-delete-transaction]");
    if (deleteTransaction) {
      const transaction = state.transactions.find(item => item.id === deleteTransaction.dataset.deleteTransaction);
      if (transaction && confirm('Excluir "' + transaction.description + '"?')) {
        state.transactions = state.transactions.filter(item => item.id !== transaction.id);
        save();
        render();
        say("Movimentação excluída.");
      }
      return;
    }

    const editGoal = event.target.closest("[data-edit-goal]");
    if (editGoal) {
      openGoal(editGoal.dataset.editGoal);
      return;
    }

    const deleteGoal = event.target.closest("[data-delete-goal]");
    if (deleteGoal) {
      const goal = state.goals.find(item => item.id === deleteGoal.dataset.deleteGoal);
      if (goal && confirm('Excluir a meta "' + goal.name + '"?')) {
        state.goals = state.goals.filter(item => item.id !== goal.id);
        save();
        render();
        say("Meta excluída.");
      }
      return;
    }

    const contributeGoal = event.target.closest("[data-contribute-goal]");
    if (contributeGoal) {
      openContribution(contributeGoal.dataset.contributeGoal);
      return;
    }

    const backupMenu = $("#backup-menu");
    if (backupMenu && backupMenu.open && !backupMenu.contains(event.target)) {
      backupMenu.open = false;
    }
  });

  $("#transaction-form").addEventListener("change", event => {
    if (event.target.name === "type") setCategoryOptions(event.target.value);
  });

  $("#transaction-form").addEventListener("submit", event => {
    event.preventDefault();
    const form = event.currentTarget;
    if (!form.reportValidity()) return;

    const id = form.elements.id.value || makeId();
    const type = form.elements.type.value;
    const amount = validMoney(Number(form.elements.amount.value));
    const item = {
      id,
      type,
      description: form.elements.description.value.trim(),
      amount,
      date: form.elements.date.value,
      category: form.elements.category.value,
      createdAt: Date.now()
    };

    if (!item.description || !item.date || amount <= 0) {
      say("Confira os dados da movimentação.");
      return;
    }

    const index = state.transactions.findIndex(transaction => transaction.id === id);
    if (index >= 0) {
      item.createdAt = state.transactions[index].createdAt || Date.now();
      state.transactions[index] = item;
    } else {
      state.transactions.push(item);
    }

    save();
    form.closest("dialog").close();
    render();
    say(index >= 0 ? "Movimentação atualizada." : "Movimentação salva.");
  });

  $("#budget-form").addEventListener("submit", event => {
    event.preventDefault();
    const form = event.currentTarget;
    if (!form.reportValidity()) return;

    const limit = validMoney(Number(form.elements.limit.value));
    if (limit <= 0) {
      say("Digite um limite maior que zero.");
      return;
    }

    state.budgets[currentKey()] = limit;
    save();
    form.closest("dialog").close();
    render();
    say("Limite atualizado.");
  });

  $("#goal-form").addEventListener("submit", event => {
    event.preventDefault();
    const form = event.currentTarget;
    if (!form.reportValidity()) return;

    const id = form.elements.id.value || makeId();
    const goal = {
      id,
      name: form.elements.name.value.trim(),
      target: validMoney(Number(form.elements.target.value)),
      saved: validMoney(Number(form.elements.saved.value))
    };

    if (!goal.name || goal.target <= 0) {
      say("Confira o nome e o valor da meta.");
      return;
    }

    const index = state.goals.findIndex(item => item.id === id);
    if (index >= 0) state.goals[index] = goal;
    else state.goals.push(goal);

    save();
    form.closest("dialog").close();
    render();
    say(index >= 0 ? "Meta atualizada." : "Meta criada.");
  });

  $("#contribution-form").addEventListener("submit", event => {
    event.preventDefault();
    const form = event.currentTarget;
    if (!form.reportValidity()) return;

    const goal = state.goals.find(item => item.id === form.elements.id.value);
    const amount = validMoney(Number(form.elements.amount.value));

    if (!goal || amount <= 0) {
      say("Informe um valor válido.");
      return;
    }

    goal.saved = validMoney(Number(goal.saved || 0) + amount);
    save();
    form.closest("dialog").close();
    render();
    say("Valor adicionado à meta.");
  });

  $("#transaction-search").addEventListener("input", renderTransactions);
  $("#transaction-filter").addEventListener("change", renderTransactions);
  $("#backup-file").addEventListener("change", event => {
    importBackup(event.target.files && event.target.files[0]);
    event.target.value = "";
  });

  $$(".modal").forEach(dialog => {
    dialog.addEventListener("click", event => {
      if (event.target === dialog) dialog.close();
    });
  });

  $("#dismiss-install-tip").addEventListener("click", () => {
    $("#install-tip").hidden = true;
    try {
      localStorage.setItem(INSTALL_TIP_KEY, "1");
    } catch (error) {
      // O aviso continua dispensado nesta sessão, mesmo sem poder gravar a preferência.
    }
  });

  // Fecha o menu de backup ao tocar fora dele.
  document.addEventListener("pointerdown", event => {
    const menu = $("#backup-menu");
    if (menu && menu.open && !menu.contains(event.target)) menu.open = false;
  });

  setupInstallTip();
  setActiveTab("resumo");
  render();
})();