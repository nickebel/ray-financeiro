(() => {
  "use strict";

  const STORAGE_KEY = "ray-financeiro-data-v1";
  const CATEGORY_DATA = {
    income: [
      {id:"salary",name:"Salário",icon:"▣"},{id:"extra",name:"Renda extra",icon:"↗"},
      {id:"sales",name:"Vendas",icon:"◇"},{id:"other-income",name:"Outras entradas",icon:"＋"}
    ],
    expense: [
      {id:"housing",name:"Moradia",icon:"⌂"},{id:"food",name:"Alimentação",icon:"▤"},
      {id:"transport",name:"Transporte",icon:"↗"},{id:"health",name:"Saúde",icon:"＋"},
      {id:"leisure",name:"Lazer",icon:"☆"},{id:"education",name:"Educação",icon:"▧"},
      {id:"bills",name:"Contas",icon:"≋"},{id:"shopping",name:"Compras",icon:"◇"},
      {id:"subscriptions",name:"Assinaturas",icon:"◷"},{id:"other-expense",name:"Outros gastos",icon:"•••"}
    ]
  };

  const $ = (selector, root) => (root || document).querySelector(selector);
  const $$ = (selector, root) => Array.from((root || document).querySelectorAll(selector));
  const todayISO = () => {
    const d = new Date();
    return d.getFullYear() + "-" + String(d.getMonth()+1).padStart(2,"0") + "-" + String(d.getDate()).padStart(2,"0");
  };
  const monthKey = date => date.getFullYear() + "-" + String(date.getMonth()+1).padStart(2,"0");
  const dateFromKey = key => {
    const parts = key.split("-").map(Number);
    return new Date(parts[0], parts[1]-1, 1);
  };
  const money = value => new Intl.NumberFormat("pt-BR",{style:"currency",currency:"BRL"}).format(Number(value)||0);
  const shortMoney = value => {
    const n = Number(value)||0;
    if (n >= 1000000) return "R$ " + (n/1000000).toFixed(1).replace(".",",") + " mi";
    if (n >= 10000) return "R$ " + (n/1000).toFixed(1).replace(".",",") + " mil";
    return money(n);
  };
  const monthName = date => new Intl.DateTimeFormat("pt-BR",{month:"long",year:"numeric"}).format(date);
  const dateLabel = value => {
    const parts = value.split("-").map(Number);
    return new Intl.DateTimeFormat("pt-BR",{day:"2-digit",month:"short"}).format(new Date(parts[0],parts[1]-1,parts[2]));
  };
  const escapeHtml = value => String(value ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const validMoney = n => Number.isFinite(n) && n >= 0 ? Math.round(n*100)/100 : 0;

  function emptyState() {
    return {version:1,transactions:[],budgets:{},goals:[]};
  }
  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return emptyState();
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== "object") return emptyState();
      return {
        version:1,
        transactions:Array.isArray(parsed.transactions) ? parsed.transactions.filter(t => t && typeof t.id==="string" && (t.type==="income" || t.type==="expense") && typeof t.date==="string" && Number.isFinite(Number(t.amount)) && Number(t.amount)>=0) : [],
        budgets:parsed.budgets && typeof parsed.budgets==="object" ? parsed.budgets : {},
        goals:Array.isArray(parsed.goals) ? parsed.goals.filter(g=>g && typeof g.id==="string" && typeof g.name==="string" && Number.isFinite(Number(g.target)) && Number(g.target)>0) : []
      };
    } catch (error) {
      console.error("Não foi possível ler os dados locais.", error);
      return emptyState();
    }
  }

  let state = loadState();
  let selectedMonth = new Date(new Date().getFullYear(),new Date().getMonth(),1);
  let currentView = "dashboard";
  let toastTimer = null;

  function saveState() {
    try {
      localStorage.setItem(STORAGE_KEY,JSON.stringify(state));
      return true;
    } catch (error) {
      console.error("Não foi possível salvar os dados locais.",error);
      showToast("Não foi possível salvar. Verifique o espaço disponível no navegador.");
      return false;
    }
  }

  function showToast(message) {
    const toast = $("#toast");
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(()=>toast.classList.remove("show"),2600);
  }

  function getMonthTransactions(key) {
    return state.transactions.filter(t => t.date && t.date.slice(0,7)===key).sort((a,b)=>b.date.localeCompare(a.date) || (b.createdAt||0)-(a.createdAt||0));
  }
  function totals(items) {
    const income = items.filter(t=>t.type==="income").reduce((s,t)=>s+Number(t.amount),0);
    const expenses = items.filter(t=>t.type==="expense").reduce((s,t)=>s+Number(t.amount),0);
    return {income,expenses,balance:income-expenses};
  }
  function categoryFor(type,id) {
    return (CATEGORY_DATA[type]||[]).find(c=>c.id===id) || {id:"other",name:"Outros",icon:"•"};
  }
  function setView(view) {
    currentView = view;
    $$(".view").forEach(el=>el.classList.toggle("active",el.id==="view-"+view));
    $$(".nav-item[data-view]").forEach(el=>el.classList.toggle("active",el.dataset.view===view));
    const titles = {dashboard:"Visão geral",transactions:"Lançamentos",planning:"Orçamento",goals:"Metas","settings":"Dados e ajustes"};
    $("#topbar-title").textContent = titles[view] || "Meu financeiro";
    closeMobileMenu();
    render();
    window.scrollTo({top:0,behavior:"smooth"});
  }
  function updateGreeting() {
    const now = new Date();
    const hour = now.getHours();
    const greeting = hour < 12 ? "Bom dia" : hour < 18 ? "Boa tarde" : "Boa noite";
    $("#greeting-date").textContent = greeting + " · " + new Intl.DateTimeFormat("pt-BR",{weekday:"long",day:"numeric",month:"long"}).format(now);
  }
  function renderMonthLabels() {
    const label = monthName(selectedMonth);
    ["dashboard-month","transactions-month","planning-month"].forEach(id=>{
      const el = document.getElementById(id);
      if (el) el.textContent = label.charAt(0).toUpperCase()+label.slice(1);
    });
  }
  function budgetForMonth() {
    return Number(state.budgets[monthKey(selectedMonth)] || 0);
  }
  function budgetMarkup(spent,limit) {
    if (!limit) return '<div class="budget-empty">Defina um limite mensal para acompanhar quanto do seu orçamento já foi utilizado.</div>';
    const percent = spent/limit*100;
    const width = Math.min(100,percent);
    const remaining = limit-spent;
    const over = remaining < 0;
    return '<div class="budget-value-row"><strong>'+money(spent)+'</strong><span>de '+money(limit)+'</span></div>'+
      '<div class="budget-track '+(over?'over':'')+'"><i style="width:'+width+'%"></i></div>'+
      '<div class="budget-foot"><span>'+ (over ? 'Acima do limite em '+money(Math.abs(remaining)) : 'Restam '+money(remaining)) +'</span><span>'+percent.toFixed(0).replace(".",",")+'%</span></div>';
  }
  function categoryTotals(items) {
    const map = {};
    items.filter(t=>t.type==="expense").forEach(t=>{
      map[t.category] = (map[t.category]||0)+Number(t.amount);
    });
    return Object.keys(map).map(id=>({id,total:map[id],...categoryFor("expense",id)})).sort((a,b)=>b.total-a.total);
  }
  function categoryMarkup(items) {
    const list = categoryTotals(items);
    if (!list.length) return '<div class="empty-state"><strong>Nenhum gasto por aqui ainda.</strong>Quando você registrar saídas, elas aparecerão por categoria.</div>';
    const max = list[0].total || 1;
    return list.slice(0,6).map(c=>'<div class="category-row"><span class="category-dot">'+c.icon+'</span><div class="category-info"><strong>'+escapeHtml(c.name)+'</strong><div class="category-track"><i style="width:'+Math.max(3,c.total/max*100)+'%"></i></div></div><strong>'+money(c.total)+'</strong></div>').join("");
  }
  function transactionRow(t,withActions) {
    const c = categoryFor(t.type,t.category);
    const sign = t.type==="income" ? "+" : "−";
    const amountClass = t.type;
    if (withActions) {
      return '<div class="table-row"><div class="table-description"><span class="transaction-icon">'+c.icon+'</span><strong>'+escapeHtml(t.description)+'</strong></div><span class="table-category">'+escapeHtml(c.name)+'</span><span class="table-date">'+dateLabel(t.date)+'</span><strong class="table-amount '+amountClass+'">'+sign+' '+money(t.amount)+'</strong><span class="row-actions"><button class="icon-action" type="button" data-edit-transaction="'+escapeHtml(t.id)+'" aria-label="Editar lançamento">✎</button><button class="icon-action" type="button" data-delete-transaction="'+escapeHtml(t.id)+'" aria-label="Excluir lançamento">×</button></span></div>';
    }
    return '<div class="transaction-item"><span class="transaction-icon">'+c.icon+'</span><div class="transaction-meta"><strong>'+escapeHtml(t.description)+'</strong><small>'+escapeHtml(c.name)+' · '+dateLabel(t.date)+'</small></div><strong class="transaction-amount '+amountClass+'">'+sign+' '+money(t.amount)+'</strong></div>';
  }
  function renderFlowChart() {
    const target = $("#flow-chart");
    if (!target) return;
    const months = [];
    for (let offset=5; offset>=0; offset--) {
      const d = new Date(selectedMonth.getFullYear(),selectedMonth.getMonth()-offset,1);
      const key = monthKey(d);
      const total = totals(getMonthTransactions(key));
      months.push({label:new Intl.DateTimeFormat("pt-BR",{month:"short"}).format(d).replace(".",""),...total});
    }
    const max = Math.max(1,...months.map(m=>Math.max(m.income,m.expenses)));
    target.innerHTML = months.map(m=>{
      const ih = m.income ? Math.max(3,m.income/max*100) : 1;
      const eh = m.expenses ? Math.max(3,m.expenses/max*100) : 1;
      return '<div class="flow-month" title="Entradas: '+money(m.income)+' · Saídas: '+money(m.expenses)+'"><div class="flow-bars"><i class="bar-income" style="height:'+ih+'%"></i><i class="bar-expense" style="height:'+eh+'%"></i></div><small>'+escapeHtml(m.label)+'</small></div>';
    }).join("");
  }
  function renderDashboard() {
    const items = getMonthTransactions(monthKey(selectedMonth));
    const t = totals(items);
    $("#summary-balance").textContent = money(t.balance);
    $("#summary-income").textContent = money(t.income);
    $("#summary-expenses").textContent = money(t.expenses);
    $("#summary-balance-caption").textContent = items.length ? (t.balance>=0 ? "Você está com saldo positivo neste mês" : "As saídas superaram as entradas") : "Adicione seu primeiro lançamento";
    $("#budget-summary").innerHTML = budgetMarkup(t.expenses,budgetForMonth());
    $("#category-breakdown").innerHTML = categoryMarkup(items);
    const recent = $("#recent-transactions");
    recent.innerHTML = items.length ? items.slice(0,5).map(t=>transactionRow(t,false)).join("") : '<div class="empty-state"><strong>Seu mês começa por aqui.</strong>Adicione uma entrada ou saída para acompanhar seu dinheiro.</div>';
    renderFlowChart();
  }
  function renderTransactions() {
    const key = monthKey(selectedMonth);
    const query = ($("#transaction-search")?.value || "").trim().toLocaleLowerCase("pt-BR");
    const filter = $("#transaction-filter")?.value || "all";
    const items = getMonthTransactions(key).filter(t=>{
      const matchesType = filter==="all" || t.type===filter;
      const matchesText = !query || (t.description+" "+categoryFor(t.type,t.category).name).toLocaleLowerCase("pt-BR").includes(query);
      return matchesType && matchesText;
    });
    $("#all-transactions").innerHTML = items.length ? items.map(t=>transactionRow(t,true)).join("") : '<div class="empty-state"><strong>Nenhum lançamento encontrado.</strong>Adicione um lançamento ou ajuste os filtros.</div>';
    $("#transaction-count").textContent = items.length+" lançamento(s) exibido(s)";
  }
  function renderPlanning() {
    const items = getMonthTransactions(monthKey(selectedMonth));
    const expenses = totals(items).expenses;
    const limit = budgetForMonth();
    $("#planning-budget").innerHTML = budgetMarkup(expenses,limit);
    $("#planning-categories").innerHTML = categoryMarkup(items);
  }
  function renderGoals() {
    const target = $("#goals-list");
    if (!state.goals.length) {
      target.innerHTML = '<div class="panel empty-goals"><div class="empty-state"><strong>Suas metas começam com uma ideia.</strong>Crie uma meta para acompanhar um objetivo, como montar uma reserva, planejar uma viagem ou comprar algo importante.</div><button class="btn btn-primary" type="button" data-action="add-goal">＋ Criar primeira meta</button></div>';
      return;
    }
    target.innerHTML = state.goals.map((g,index)=>{
      const saved = Number(g.saved)||0;
      const percent = Math.min(100,saved/Number(g.target)*100);
      const icons = ["◎","✳","◇","⌂"];
      return '<article class="goal-card"><div class="goal-card-top"><span class="goal-card-icon">'+icons[index%icons.length]+'</span><div class="goal-actions"><button type="button" data-edit-goal="'+escapeHtml(g.id)+'">Editar</button><button type="button" data-delete-goal="'+escapeHtml(g.id)+'" aria-label="Excluir meta">×</button></div></div><h3>'+escapeHtml(g.name)+'</h3><div class="goal-amounts"><strong>'+money(saved)+'</strong><span>de '+money(g.target)+'</span></div><div class="goal-track"><i style="width:'+percent+'%"></i></div><div class="goal-card-foot"><small>'+percent.toFixed(0).replace(".",",")+'% concluído</small><small>Faltam '+money(Math.max(0,Number(g.target)-saved))+'</small></div></article>';
    }).join("");
  }
  function render() {
    renderMonthLabels();
    if (currentView==="dashboard") renderDashboard();
    if (currentView==="transactions") renderTransactions();
    if (currentView==="planning") renderPlanning();
    if (currentView==="goals") renderGoals();
  }

  function setCategoryOptions(type,selected) {
    const select = $("#transaction-category");
    select.innerHTML = (CATEGORY_DATA[type]||CATEGORY_DATA.expense).map(c=>'<option value="'+c.id+'">'+escapeHtml(c.name)+'</option>').join("");
    if (selected && Array.from(select.options).some(o=>o.value===selected)) select.value=selected;
  }
  function openTransaction(id) {
    const form = $("#transaction-form");
    form.reset();
    const existing = id ? state.transactions.find(t=>t.id===id) : null;
    form.elements.id.value = existing ? existing.id : "";
    form.elements.description.value = existing ? existing.description : "";
    form.elements.amount.value = existing ? existing.amount : "";
    form.elements.date.value = existing ? existing.date : todayISO();
    const type = existing ? existing.type : "expense";
    form.querySelector('input[name="type"][value="'+type+'"]').checked = true;
    setCategoryOptions(type,existing ? existing.category : null);
    $("#transaction-modal-title").textContent = existing ? "Editar lançamento" : "Novo lançamento";
    $("#transaction-modal").showModal();
  }
  function openBudget() {
    const form = $("#budget-form");
    form.reset();
    form.elements.limit.value = budgetForMonth() || "";
    $("#budget-modal").showModal();
  }
  function openGoal(id) {
    const form = $("#goal-form");
    form.reset();
    const existing = id ? state.goals.find(g=>g.id===id) : null;
    form.elements.id.value = existing ? existing.id : "";
    form.elements.name.value = existing ? existing.name : "";
    form.elements.target.value = existing ? existing.target : "";
    form.elements.saved.value = existing ? existing.saved : "0";
    $("#goal-modal-title").textContent = existing ? "Editar meta" : "Nova meta";
    $("#goal-modal").showModal();
  }
  function changeMonth(delta) {
    selectedMonth = new Date(selectedMonth.getFullYear(),selectedMonth.getMonth()+delta,1);
    render();
  }
  function closeMobileMenu() {
    $("#sidebar").classList.remove("open");
    $("#mobile-backdrop").classList.remove("show");
    $("#mobile-menu").setAttribute("aria-expanded","false");
  }
  function exportBackup() {
    const blob = new Blob([JSON.stringify(state,null,2)],{type:"application/json"});
    downloadBlob(blob,"ray-financeiro-backup-"+todayISO()+".json");
    showToast("Backup exportado. Guarde o arquivo em um lugar seguro.");
  }
  function downloadBlob(blob,filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href=url;a.download=filename;document.body.appendChild(a);a.click();a.remove();
    setTimeout(()=>URL.revokeObjectURL(url),1000);
  }
  function exportCsv() {
    const items = getMonthTransactions(monthKey(selectedMonth));
    if (!items.length) {showToast("Não há lançamentos neste mês para exportar.");return;}
    const rows = [["Data","Tipo","Descrição","Categoria","Valor"]];
    items.slice().sort((a,b)=>a.date.localeCompare(b.date)).forEach(t=>rows.push([t.date,t.type==="income"?"Entrada":"Saída",t.description,categoryFor(t.type,t.category).name,Number(t.amount).toFixed(2).replace(".",",")]));
    const csv = "\uFEFF"+rows.map(row=>row.map(v=>'"'+String(v).replace(/"/g,'""')+'"').join(";")).join("\r\n");
    downloadBlob(new Blob([csv],{type:"text/csv;charset=utf-8"}),"ray-lancamentos-"+monthKey(selectedMonth)+".csv");
    showToast("Arquivo CSV preparado.");
  }
  function importBackup(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(String(reader.result||""));
        if (!data || !Array.isArray(data.transactions) || !Array.isArray(data.goals) || !data.budgets || typeof data.budgets!=="object") throw new Error("Formato inválido");
        const next = {
          version:1,
          transactions:data.transactions.filter(t=>t && typeof t.id==="string" && (t.type==="income"||t.type==="expense") && typeof t.date==="string" && Number.isFinite(Number(t.amount)) && Number(t.amount)>=0),
          budgets:data.budgets,
          goals:data.goals.filter(g=>g && typeof g.id==="string" && typeof g.name==="string" && Number(g.target)>0)
        };
        if (!confirm("Importar este backup vai substituir os dados atuais deste navegador. Deseja continuar?")) return;
        state=next;
        saveState();render();showToast("Backup restaurado com sucesso.");
      } catch (error) {
        showToast("Não foi possível importar. Confira se o arquivo é um backup do Ray.");
      }
    };
    reader.onerror=()=>showToast("Falha ao ler o arquivo.");
    reader.readAsText(file);
  }

  document.addEventListener("click",event=>{
    const nav=event.target.closest("[data-view]");
    if(nav){setView(nav.dataset.view);return;}
    const action=event.target.closest("[data-action]");
    if(action){
      const type=action.dataset.action;
      if(type==="add-transaction")openTransaction();
      if(type==="set-budget")openBudget();
      if(type==="add-goal")openGoal();
      if(type==="previous-month")changeMonth(-1);
      if(type==="next-month")changeMonth(1);
      if(type==="current-month"){selectedMonth=new Date(new Date().getFullYear(),new Date().getMonth(),1);render();}
      if(type==="export-backup")exportBackup();
      if(type==="export-csv")exportCsv();
      if(type==="import-backup")$("#backup-file").click();
      if(type==="clear-data"){
        if(confirm("Isso apagará todos os lançamentos, limites e metas salvos neste navegador. Faça um backup antes, se precisar. Deseja apagar tudo?")){
          state=emptyState();saveState();render();showToast("Seus dados locais foram apagados.");
        }
      }
    }
    const close=event.target.closest("[data-close]");
    if(close){const dlg=document.getElementById(close.dataset.close);if(dlg)dlg.close();}
    const edit=event.target.closest("[data-edit-transaction]");
    if(edit){openTransaction(edit.dataset.editTransaction);return;}
    const del=event.target.closest("[data-delete-transaction]");
    if(del){
      const item=state.transactions.find(t=>t.id===del.dataset.deleteTransaction);
      if(item && confirm('Excluir o lançamento "'+item.description+'"?')){
        state.transactions=state.transactions.filter(t=>t.id!==item.id);saveState();render();showToast("Lançamento excluído.");
      }
      return;
    }
    const goalEdit=event.target.closest("[data-edit-goal]");
    if(goalEdit){openGoal(goalEdit.dataset.editGoal);return;}
    const goalDel=event.target.closest("[data-delete-goal]");
    if(goalDel && confirm("Excluir esta meta?")){
      state.goals=state.goals.filter(g=>g.id!==goalDel.dataset.deleteGoal);saveState();render();showToast("Meta excluída.");
    }
  });

  $("#transaction-form").addEventListener("change",event=>{
    if(event.target.name==="type")setCategoryOptions(event.target.value);
  });
  $("#transaction-form").addEventListener("submit",event=>{
    event.preventDefault();
    const form=event.currentTarget;
    if(!form.reportValidity())return;
    const id=form.elements.id.value || (window.crypto && crypto.randomUUID ? crypto.randomUUID() : String(Date.now())+Math.random());
    const type=form.elements.type.value;
    const item={
      id,type,description:form.elements.description.value.trim(),
      amount:validMoney(Number(form.elements.amount.value)),
      date:form.elements.date.value,category:form.elements.category.value,createdAt:Date.now()
    };
    if(!item.description || !item.date || item.amount<=0){showToast("Confira a descrição, a data e o valor.");return;}
    const existingIndex=state.transactions.findIndex(t=>t.id===id);
    if(existingIndex>=0){item.createdAt=state.transactions[existingIndex].createdAt||Date.now();state.transactions[existingIndex]=item;}
    else state.transactions.push(item);
    saveState();form.closest("dialog").close();render();showToast(existingIndex>=0?"Lançamento atualizado.":"Lançamento salvo.");
  });
  $("#budget-form").addEventListener("submit",event=>{
    event.preventDefault();
    const form=event.currentTarget;
    if(!form.reportValidity())return;
    const limit=validMoney(Number(form.elements.limit.value));
    if(limit<=0){showToast("Informe um limite maior que zero.");return;}
    state.budgets[monthKey(selectedMonth)]=limit;
    saveState();form.closest("dialog").close();render();showToast("Limite mensal atualizado.");
  });
  $("#goal-form").addEventListener("submit",event=>{
    event.preventDefault();
    const form=event.currentTarget;
    if(!form.reportValidity())return;
    const id=form.elements.id.value || (window.crypto && crypto.randomUUID ? crypto.randomUUID() : String(Date.now())+Math.random());
    const goal={id,name:form.elements.name.value.trim(),target:validMoney(Number(form.elements.target.value)),saved:validMoney(Number(form.elements.saved.value))};
    if(!goal.name || goal.target<=0){showToast("Confira o nome e o valor da meta.");return;}
    const index=state.goals.findIndex(g=>g.id===id);
    if(index>=0)state.goals[index]=goal;else state.goals.push(goal);
    saveState();form.closest("dialog").close();render();showToast(index>=0?"Meta atualizada.":"Meta criada.");
  });
  $("#transaction-search").addEventListener("input",renderTransactions);
  $("#transaction-filter").addEventListener("change",renderTransactions);
  $("#backup-file").addEventListener("change",event=>{
    importBackup(event.target.files && event.target.files[0]);event.target.value="";
  });
  $("#mobile-menu").addEventListener("click",()=>{
    const open=$("#sidebar").classList.toggle("open");
    $("#mobile-backdrop").classList.toggle("show",open);
    $("#mobile-menu").setAttribute("aria-expanded",String(open));
  });
  $("#mobile-backdrop").addEventListener("click",closeMobileMenu);
  $$(".modal").forEach(dialog=>dialog.addEventListener("click",event=>{
    if(event.target===dialog)dialog.close();
  }));

  updateGreeting();
  render();
})();