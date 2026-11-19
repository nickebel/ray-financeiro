(() => {
  "use strict";

  // Keep this key unchanged to preserve data from every previous Ray version.
  const STORAGE_KEY = "ray-financeiro-data-v1";

  const CATEGORIES = {
    income: [
      { id: "salary", name: "Salário", icon: "briefcase" },
      { id: "extra", name: "Renda extra", icon: "trending" },
      { id: "sales", name: "Vendas", icon: "bag" },
      { id: "other-income", name: "Outras entradas", icon: "plus" }
    ],
    expense: [
      { id: "housing", name: "Moradia", icon: "home" },
      { id: "food", name: "Alimentação", icon: "food" },
      { id: "transport", name: "Transporte", icon: "car" },
      { id: "health", name: "Saúde", icon: "health" },
      { id: "leisure", name: "Lazer", icon: "ticket" },
      { id: "education", name: "Educação", icon: "book" },
      { id: "bills", name: "Contas", icon: "receipt" },
      { id: "shopping", name: "Compras", icon: "bag" },
      { id: "subscriptions", name: "Assinaturas", icon: "repeat" },
      { id: "other-expense", name: "Outros gastos", icon: "more" }
    ]
  };

  const ICON_PATHS = {
    briefcase: '<rect x="3" y="7" width="18" height="14" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 12h18M10 12v2h4v-2"/>',
    trending: '<path d="M3 17 9 11l4 4 8-9M15 6h6v6"/>',
    bag: '<path d="M5 8h14l1 13H4L5 8Z"/><path d="M9 9V6a3 3 0 0 1 6 0v3"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    home: '<path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z"/>',
    food: '<path d="M4 3v7a3 3 0 0 0 6 0V3M7 3v18M17 3v18M17 3c2 2 3 5 3 8h-3"/>',
    car: '<path d="m5 11 2-6h10l2 6M4 11h16l1 8H3l1-8ZM6 15h.01M18 15h.01M7 19v2M17 19v2"/>',
    health: '<path d="M12 21s-8-4.5-8-11a4.5 4.5 0 0 1 8-2.8A4.5 4.5 0 0 1 20 10c0 6.5-8 11-8 11Z"/><path d="M8 12h8M12 8v8"/>',
    ticket: '<path d="M4 6h16v4a2 2 0 0 0 0 4v4H4v-4a2 2 0 0 0 0-4V6Z"/><path d="M12 7v2m0 2v2m0 2v2"/>',
    book: '<path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v17H6.5A2.5 2.5 0 0 1 4 17.5zM4 5.5v12M8 7h8M8 11h8"/>',
    receipt: '<path d="M6 3h12v18l-3-2-3 2-3-2-3 2V3Z"/><path d="M9 8h6M9 12h6M9 16h3"/>',
    repeat: '<path d="m17 2 4 4-4 4M3 11V9a3 3 0 0 1 3-3h15M7 22l-4-4 4-4m14-1v2a3 3 0 0 1-3 3H3"/>',
    more: '<circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/>',
    goal: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>'
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

  function moneyHtml(value) {
    const parts = new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL"
    }).formatToParts(Number(value) || 0);

    let html = "";
    let cents = "";
    parts.forEach(part => {
      if (part.type === "currency") {
        html += '<span class="money-currency">' + escapeHtml(part.value) + '</span>&nbsp;';
      } else if (part.type === "decimal") {
        cents += part.value;
      } else if (part.type === "fraction") {
        cents += part.value;
      } else if (part.type === "integer" || part.type === "group") {
        html += '<span class="money-major">' + escapeHtml(part.value) + '</span>';
      } else if (part.type === "minusSign" || part.type === "plusSign") {
        html += escapeHtml(part.value);
      }
    });

    if (cents) html += '<span class="money-cents">' + escapeHtml(cents) + '</span>';
    return html;
  }

  const monthName = date => {
    const value = new Intl.DateTimeFormat("pt-BR", {
      month: "short",
      year: "numeric"
    }).format(date).replace(".", "");
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
    toastTimer = setTimeout(() => toast.classList.remove("show"), 2500);
  };

  function save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      return true;
    } catch (error) {
      say("Não foi possível salvar. Exporte um backup JSON.");
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
      icon: "more"
    };
  }

  function iconSvg(name, className) {
    const path = ICON_PATHS[name] || ICON_PATHS.more;
    return '<svg' + (className ? ' class="' + className + '"' : '') +
      ' viewBox="0 0 24 24" aria-hidden="true">' + path + '</svg>';
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
      return '<div class="budget-empty">Nenhum limite definido para este mês.</div>';
    }

    const percentage = spent / limit * 100;
    const remaining = limit - spent;
    const width = Math.min(100, Math.max(0, percentage));
    const over = remaining < 0;

    return '<div class="budget-value-row">' +
      '<strong class="money">' + moneyHtml(spent) + '</strong>' +
      '<span>de ' + moneyHtml(limit) + '</span>' +
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
    const wrapper = $("#balance-progress");
    const label = $("#budget-progress-label");
    const value = $("#budget-progress-value");
    const bar = $("#budget-progress-bar");
    const track = $("#budget-progress-track");

    if (!wrapper || !label || !value || !bar || !track) return;
    wrapper.hidden = !limit;

    if (!limit) return;

    const percentage = spent / limit * 100;
    const width = Math.min(100, Math.max(0, percentage));
    const over = percentage > 100;

    label.textContent = over ? "Limite ultrapassado" : "Limite utilizado";
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
      return '<div class="empty-state">Nenhum gasto por categoria neste mês.</div>';
    }

    const max = rows[0].total || 1;
    return rows.map(item => {
      const percentage = Math.max(2, item.total / max * 100);
      return '<div class="category-row">' +
        '<div class="category-info">' +
        '<strong>' + escapeHtml(item.name) + '</strong>' +
        '<div class="category-track"><i style="width:' + percentage + '%"></i></div>' +
        '</div>' +
        '<strong class="money">' + moneyHtml(item.total) + '</strong>' +
        '</div>';
    }).join("");
  }

  function renderSummary() {
    const list = monthTransactions(currentKey());
    const total = sums(list);
    const limit = budgetLimit();

    $("#summary-balance").innerHTML = moneyHtml(total.balance);
    $("#summary-income").innerHTML = moneyHtml(total.income);
    $("#summary-expenses").innerHTML = moneyHtml(total.expenses);
    renderBudgetProgress(total.expenses, limit);
    renderRecentTransactions(list);
  }

  function movementMarkup(transaction, actions) {
    const itemCategory = category(transaction.type, transaction.category);
    const isIncome = transaction.type === "income";
    const sign = isIncome ? "+" : "−";
    const meta = escapeHtml(itemCategory.name) + " / " + escapeHtml(dateLabel(transaction.date));
    const rowClass = "movement-row" + (actions ? " has-actions" : "");
    const value = '<strong class="movement-amount ' + (isIncome ? "income" : "expense") +
      '">' + sign + ' ' + moneyHtml(transaction.amount) + '</strong>';

    let main;
    if (actions) {
      main = '<button class="movement-row-main" type="button" data-toggle-record="' +
        escapeHtml(transaction.id) + '" aria-expanded="false">' +
        '<span class="movement-icon">' + iconSvg(itemCategory.icon) + '</span>' +
        '<span class="movement-copy"><strong>' + escapeHtml(transaction.description) +
        '</strong><small>' + meta + '</small></span>' + value + '</button>';
    } else {
      main = '<div class="movement-row-main">' +
        '<span class="movement-icon">' + iconSvg(itemCategory.icon) + '</span>' +
        '<span class="movement-copy"><strong>' + escapeHtml(transaction.description) +
        '</strong><small>' + meta + '</small></span>' + value + '</div>';
    }

    const actionMarkup = actions
      ? '<div class="movement-actions" hidden>' +
        '<button type="button" data-edit-transaction="' + escapeHtml(transaction.id) + '">Editar</button>' +
        '<button type="button" data-delete-transaction="' + escapeHtml(transaction.id) + '">Excluir</button>' +
        '</div>'
      : "";

    return '<article class="' + rowClass + '">' + main + actionMarkup + '</article>';
  }

  function renderRecentTransactions(list) {
    const target = $("#recent-transactions");
    const latest = list.slice(0, 5);

    target.innerHTML = latest.length
      ? latest.map(transaction => movementMarkup(transaction, false)).join("")
      : '<div class="empty-state">Nenhuma movimentação neste mês.</div>';
  }

  function renderTransactions() {
    const query = $("#transaction-search").value.trim().toLocaleLowerCase("pt-BR");
    const filter = $("#transaction-filter").value;

    const items = monthTransactions(currentKey()).filter(transaction => {
      const searchable = (transaction.description + " " +
        category(transaction.type, transaction.category).name).toLocaleLowerCase("pt-BR");

      return (filter === "all" || transaction.type === filter) &&
        (!query || searchable.includes(query));
    });

    $("#all-transactions").innerHTML = items.length
      ? items.map(transaction => movementMarkup(transaction, true)).join("")
      : '<div class="empty-state">Nenhuma movimentação encontrada.</div>';

    $("#transaction-count").textContent = items.length +
      (items.length === 1 ? " movimentação" : " movimentações");
  }

  function renderGoals() {
    const target = $("#goals-list");
    if (!state.goals.length) {
      target.innerHTML = '<div class="empty-state">Nenhuma meta criada ainda.</div>';
      return;
    }

    target.innerHTML = state.goals.map(goal => {
      const saved = Number(goal.saved) || 0;
      const goalTarget = Number(goal.target);
      const percentage = Math.min(100, goalTarget > 0 ? saved / goalTarget * 100 : 0);
      const remaining = Math.max(0, goalTarget - saved);

      return '<article class="goal-card">' +
        '<div class="goal-card-top">' +
        '<span class="goal-card-icon">' + iconSvg("goal") + '</span>' +
        '<div class="goal-actions">' +
        '<button type="button" data-edit-goal="' + escapeHtml(goal.id) + '">Editar</button>' +
        '<button type="button" data-delete-goal="' + escapeHtml(goal.id) + '">Excluir</button>' +
        '</div></div>' +
        '<h3>' + escapeHtml(goal.name) + '</h3>' +
        '<div class="goal-amounts"><strong class="money">' + moneyHtml(saved) +
        '</strong><span>de ' + moneyHtml(goalTarget) + '</span></div>' +
        '<div class="goal-track" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="' +
        Math.round(percentage) + '" aria-label="Progresso da meta">' +
        '<i style="width:' + percentage + '%"></i></div>' +
        '<div class="goal-card-foot"><small>' +
        percentage.toFixed(0).replace(".", ",") + '% concluído / faltam ' + money(remaining) +
        '</small><button class="goal-contribute" type="button" data-contribute-goal="' +
        escapeHtml(goal.id) + '">Adicionar valor</button></div>' +
        '</article>';
    }).join("");
  }

  function render() {
    renderMonthLabels();
    renderSummary();
    renderTransactions();
    renderGoals();
    renderBudgetCategories();
  }

  function renderBudgetCategories() {
    $("#planning-categories").innerHTML = categoryHtml(monthTransactions(currentKey()));
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

    const main = $("#app-main");
    if (main) main.scrollTop = 0;

    const menu = $("#backup-menu");
    if (menu) menu.open = false;
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

    requestAnimationFrame(() => {
      if (form.elements.description) form.elements.description.focus({ preventScroll: true });
    });
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
      goal.name + " / você já guardou " + money(goal.saved || 0) + ".";
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
    say("Backup exportado.");
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
    say("Extrato exportado.");
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
        say("Backup restaurado.");
      } catch (error) {
        say("Esse arquivo não parece ser um backup válido do Ray.");
      }
    };

    reader.onerror = () => say("Não foi possível ler o arquivo.");
    reader.readAsText(file);
  }

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

    const toggle = event.target.closest("[data-toggle-record]");
    if (toggle) {
      const row = toggle.closest(".movement-row");
      const actions = row && $(".movement-actions", row);
      if (row && actions) {
        const open = row.classList.toggle("is-open");
        actions.hidden = !open;
        toggle.setAttribute("aria-expanded", String(open));
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
      return;
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

    const menu = $("#backup-menu");
    if (menu && menu.open && !menu.contains(event.target)) menu.open = false;
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
    const transaction = {
      id,
      type,
      description: form.elements.description.value.trim(),
      amount,
      date: form.elements.date.value,
      category: form.elements.category.value,
      createdAt: Date.now()
    };

    if (!transaction.description || !transaction.date || amount <= 0) {
      say("Confira os dados da movimentação.");
      return;
    }

    const index = state.transactions.findIndex(item => item.id === id);
    if (index >= 0) {
      transaction.createdAt = state.transactions[index].createdAt || Date.now();
      state.transactions[index] = transaction;
    } else {
      state.transactions.push(transaction);
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
    dialog.addEventListener("close", () => {
      const active = document.activeElement;
      if (active && active.blur) active.blur();
    });
  });

  // Keep focused fields visible when the iOS virtual keyboard resizes the viewport.
  document.addEventListener("focusin", event => {
    const field = event.target.closest(".modal input, .modal select");
    if (!field) return;
    setTimeout(() => {
      field.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }, 220);
  });

  document.addEventListener("pointerdown", event => {
    const menu = $("#backup-menu");
    if (menu && menu.open && !menu.contains(event.target)) menu.open = false;
  });

  setActiveTab("resumo");
  render();
})();