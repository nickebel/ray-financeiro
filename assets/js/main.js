(() => {
  "use strict";
  const STORAGE_KEY = "ray-financeiro-data-v1";
  const CATEGORIES = {
    income:[
      {id:"salary",name:"Salário",icon:"▣"},{id:"extra",name:"Renda extra",icon:"↗"},
      {id:"sales",name:"Vendas",icon:"◇"},{id:"other-income",name:"Outras entradas",icon:"＋"}
    ],
    expense:[
      {id:"housing",name:"Moradia",icon:"⌂"},{id:"food",name:"Alimentação",icon:"✳"},
      {id:"transport",name:"Transporte",icon:"↗"},{id:"health",name:"Saúde",icon:"＋"},
      {id:"leisure",name:"Lazer",icon:"☆"},{id:"education",name:"Educação",icon:"▧"},
      {id:"bills",name:"Contas",icon:"≋"},{id:"shopping",name:"Compras",icon:"◇"},
      {id:"subscriptions",name:"Assinaturas",icon:"◷"},{id:"other-expense",name:"Outros gastos",icon:"•••"}
    ]
  };
  const $ = (selector,root=document) => root.querySelector(selector);
  const $$ = (selector,root=document) => Array.from(root.querySelectorAll(selector));
  const todayISO = () => {const d=new Date();return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0");};
  const monthKey = date => date.getFullYear()+"-"+String(date.getMonth()+1).padStart(2,"0");
  const money = value => new Intl.NumberFormat("pt-BR",{style:"currency",currency:"BRL"}).format(Number(value)||0);
  const monthName = date => new Intl.DateTimeFormat("pt-BR",{month:"long",year:"numeric"}).format(date);
  const dateLabel = value => {const [y,m,d]=value.split("-").map(Number);return new Intl.DateTimeFormat("pt-BR",{day:"2-digit",month:"short"}).format(new Date(y,m-1,d));};
  const escapeHtml = value => String(value ?? "").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const validMoney = value => Number.isFinite(value)&&value>=0?Math.round(value*100)/100:0;
  const makeId = () => window.crypto?.randomUUID ? crypto.randomUUID() : String(Date.now())+Math.random().toString(16).slice(2);
  const initialState = () => ({version:1,transactions:[],budgets:{},goals:[]});
  function loadState(){
    try{
      const saved=JSON.parse(localStorage.getItem(STORAGE_KEY)||"null");
      if(!saved)return initialState();
      return {
        version:1,
        transactions:Array.isArray(saved.transactions)?saved.transactions.filter(t=>t&&typeof t.id==="string"&&(t.type==="income"||t.type==="expense")&&typeof t.date==="string"&&Number.isFinite(Number(t.amount))&&Number(t.amount)>0):[],
        budgets:saved.budgets&&typeof saved.budgets==="object"?saved.budgets:{},
        goals:Array.isArray(saved.goals)?saved.goals.filter(g=>g&&typeof g.id==="string"&&typeof g.name==="string"&&Number(g.target)>0):[]
      };
    }catch(error){console.warn("Não foi possível abrir os dados salvos.",error);return initialState();}
  }
  let state=loadState();
  let selectedMonth=new Date(new Date().getFullYear(),new Date().getMonth(),1);
  let toastTimer=null;
  const say=message=>{
    const toast=$("#toast");toast.textContent=message;toast.classList.add("show");
    clearTimeout(toastTimer);toastTimer=setTimeout(()=>toast.classList.remove("show"),2500);
  };
  function save(){
    try{localStorage.setItem(STORAGE_KEY,JSON.stringify(state));return true;}
    catch(error){say("Não foi possível guardar. Exporte um backup e libere espaço no navegador.");return false;}
  }
  const currentKey=()=>monthKey(selectedMonth);
  const monthTransactions=key=>state.transactions.filter(t=>t.date?.slice(0,7)===key).sort((a,b)=>b.date.localeCompare(a.date)||(b.createdAt||0)-(a.createdAt||0));
  function sums(list){
    const income=list.filter(t=>t.type==="income").reduce((s,t)=>s+Number(t.amount),0);
    const expenses=list.filter(t=>t.type==="expense").reduce((s,t)=>s+Number(t.amount),0);
    return {income,expenses,balance:income-expenses};
  }
  function category(type,id){return (CATEGORIES[type]||[]).find(c=>c.id===id)||{id:"other",name:"Outros",icon:"•"};}
  function budgetLimit(){return Number(state.budgets[currentKey()]||0);}
  function renderMonthLabels(){
    const name=monthName(selectedMonth);["month-label","records-month-label"].forEach(id=>{const el=$("#"+id);if(el)el.textContent=name.charAt(0).toUpperCase()+name.slice(1);});
  }
  function budgetMarkup(spent,limit){
    if(!limit)return '<div class="budget-empty">Você ainda não definiu um limite para este mês.<br>Escolha um valor que faça sentido para sua rotina.</div>';
    const pct=spent/limit*100,remaining=limit-spent,over=remaining<0;
    return '<div class="budget-value-row"><strong>'+money(spent)+'</strong><span>de '+money(limit)+'</span></div><div class="budget-track '+(over?'over':'')+'"><i style="width:'+Math.min(100,pct)+'%"></i></div><div class="budget-foot"><span>'+(over?'Passou '+money(Math.abs(remaining)):'Ainda pode usar '+money(remaining))+'</span><span>'+pct.toFixed(0).replace(".",",")+'%</span></div>';
  }
  function categorySums(list){
    const totals={};list.filter(t=>t.type==="expense").forEach(t=>totals[t.category]=(totals[t.category]||0)+Number(t.amount));
    return Object.keys(totals).map(id=>({id,total:totals[id],...category("expense",id)})).sort((a,b)=>b.total-a.total);
  }
  function categoryHtml(list){
    const rows=categorySums(list);if(!rows.length)return '<div class="empty-state"><b>Sem gastos por categoria ainda.</b>Quando você anotar suas saídas, elas aparecem aqui.</div>';
    const max=rows[0].total||1;
    return rows.slice(0,6).map(c=>'<div class="category-row"><span class="category-icon">'+c.icon+'</span><div class="category-info"><strong>'+escapeHtml(c.name)+'</strong><div class="category-track"><i style="width:'+Math.max(3,c.total/max*100)+'%"></i></div></div><strong>'+money(c.total)+'</strong></div>').join("");
  }
  function renderHero(list){
    const total=sums(list);
    $("#hero-balance").textContent=money(total.balance);
    $("#hero-income").textContent=money(total.income);
    $("#hero-expenses").textContent=money(total.expenses);
  }
  function renderSummary(){
    const list=monthTransactions(currentKey()),total=sums(list);
    $("#summary-balance").textContent=money(total.balance);
    $("#summary-income").textContent=money(total.income);
    $("#summary-expenses").textContent=money(total.expenses);
    renderHero(list);
    $("#category-breakdown").innerHTML=categoryHtml(list);
    $("#budget-summary").innerHTML=budgetMarkup(total.expenses,budgetLimit());
    $("#planning-categories").innerHTML=categoryHtml(list);
    renderMovementChart();
  }
  function renderMovementChart(){
    const target=$("#movement-chart");const months=[];
    for(let offset=5;offset>=0;offset--){
      const date=new Date(selectedMonth.getFullYear(),selectedMonth.getMonth()-offset,1);
      const total=sums(monthTransactions(monthKey(date)));
      months.push({label:new Intl.DateTimeFormat("pt-BR",{month:"short"}).format(date).replace(".",""),...total});
    }
    const max=Math.max(1,...months.map(m=>Math.max(m.income,m.expenses)));
    target.innerHTML=months.map(m=>'<div class="movement-month" title="Entradas '+money(m.income)+' · Saídas '+money(m.expenses)+'"><div class="movement-bars"><i class="bar-in" style="height:'+(m.income?Math.max(3,m.income/max*100):1)+'%"></i><i class="bar-out" style="height:'+(m.expenses?Math.max(3,m.expenses/max*100):1)+'%"></i></div><small>'+escapeHtml(m.label)+'</small></div>').join("");
  }
  function rowHtml(t,actions){
    const c=category(t.type,t.category),sign=t.type==="income"?"+":"−";
    if(actions)return '<div class="record-row"><div class="record-description"><span class="record-icon">'+c.icon+'</span><b>'+escapeHtml(t.description)+'</b></div><span class="record-category">'+escapeHtml(c.name)+'</span><span class="record-date">'+dateLabel(t.date)+'</span><strong class="record-amount '+t.type+'">'+sign+' '+money(t.amount)+'</strong><span class="record-actions"><button type="button" data-edit-transaction="'+escapeHtml(t.id)+'" aria-label="Editar registro">✎</button><button type="button" data-delete-transaction="'+escapeHtml(t.id)+'" aria-label="Apagar registro">×</button></span></div>';
    return '<div class="record-row"><div class="record-description"><span class="record-icon">'+c.icon+'</span><b>'+escapeHtml(t.description)+'</b></div><span class="record-category">'+escapeHtml(c.name)+'</span><span class="record-date">'+dateLabel(t.date)+'</span><strong class="record-amount '+t.type+'">'+sign+' '+money(t.amount)+'</strong><span></span></div>';
  }
  function renderTransactions(){
    const query=$("#transaction-search").value.trim().toLocaleLowerCase("pt-BR"),filter=$("#transaction-filter").value;
    const items=monthTransactions(currentKey()).filter(t=>(filter==="all"||t.type===filter)&&(!query||(t.description+" "+category(t.type,t.category).name).toLocaleLowerCase("pt-BR").includes(query)));
    $("#all-transactions").innerHTML=items.length?items.map(t=>rowHtml(t,true)).join(""):'<div class="empty-state"><b>Nenhuma anotação por aqui.</b>Adicione uma movimentação ou experimente outro filtro.</div>';
    $("#transaction-count").textContent=items.length+" registro(s) neste mês";
  }
  function renderGoals(){
    const target=$("#goals-list");
    if(!state.goals.length){target.innerHTML='<div class="empty-state empty-goals"><b>Ainda não tem nenhuma meta.</b>Escolha algo que gostaria de realizar e dê o primeiro passo.<br><br><button class="text-link" type="button" data-action="add-goal">Criar minha primeira meta ↗</button></div>';return;}
    const symbols=["✳","⌂","◇","☆"];
    target.innerHTML=state.goals.map((g,i)=>{
      const saved=Number(g.saved)||0,pct=Math.min(100,saved/Number(g.target)*100),remaining=Math.max(0,Number(g.target)-saved);
      return '<article class="goal-card"><div class="goal-card-top"><span class="goal-card-icon">'+symbols[i%symbols.length]+'</span><div class="goal-actions"><button type="button" data-edit-goal="'+escapeHtml(g.id)+'">Editar</button><button type="button" data-delete-goal="'+escapeHtml(g.id)+'" aria-label="Apagar meta">×</button></div></div><h3>'+escapeHtml(g.name)+'</h3><div class="goal-amounts"><strong>'+money(saved)+'</strong><span>de '+money(g.target)+'</span></div><div class="goal-track"><i style="width:'+pct+'%"></i></div><div class="goal-card-foot"><small>'+pct.toFixed(0).replace(".",",")+'% do caminho</small><button class="goal-contribute" type="button" data-contribute-goal="'+escapeHtml(g.id)+'">Adicionar valor +</button></div><div class="goal-card-foot"><small>Faltam '+money(remaining)+'</small></div></article>';
    }).join("");
  }
  function render(){
    renderMonthLabels();renderSummary();renderTransactions();renderGoals();
  }
  function setCategoryOptions(type,selected){
    const select=$("#transaction-category");
    select.innerHTML=(CATEGORIES[type]||CATEGORIES.expense).map(c=>'<option value="'+c.id+'">'+escapeHtml(c.name)+'</option>').join("");
    if(selected&&Array.from(select.options).some(o=>o.value===selected))select.value=selected;
  }
  function openTransaction(id){
    const form=$("#transaction-form");form.reset();
    const old=id?state.transactions.find(t=>t.id===id):null;
    form.elements.id.value=old?old.id:"";form.elements.description.value=old?old.description:"";form.elements.amount.value=old?old.amount:"";form.elements.date.value=old?old.date:todayISO();
    const type=old?old.type:"expense";form.querySelector('input[name="type"][value="'+type+'"]').checked=true;setCategoryOptions(type,old?old.category:null);
    $("#transaction-modal-title").textContent=old?"Editar anotação":"O que aconteceu?";
    $("#transaction-modal").showModal();
  }
  function openBudget(){
    const form=$("#budget-form");form.reset();form.elements.limit.value=budgetLimit()||"";$("#budget-modal").showModal();
  }
  function openGoal(id){
    const form=$("#goal-form");form.reset();const old=id?state.goals.find(g=>g.id===id):null;
    form.elements.id.value=old?old.id:"";form.elements.name.value=old?old.name:"";form.elements.target.value=old?old.target:"";form.elements.saved.value=old?old.saved:0;
    $("#goal-modal-title").textContent=old?"Ajustar esta meta":"O que você quer conquistar?";$("#goal-modal").showModal();
  }
  function openContribution(id){
    const goal=state.goals.find(g=>g.id===id);if(!goal)return;
    const form=$("#contribution-form");form.reset();form.elements.id.value=id;
    $("#contribution-goal-name").textContent=goal.name+" · você já guardou "+money(goal.saved||0)+".";
    $("#contribution-modal").showModal();
  }
  function changeMonth(step){selectedMonth=new Date(selectedMonth.getFullYear(),selectedMonth.getMonth()+step,1);render();}
  function download(blob,name){
    const url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
  }
  function exportBackup(){
    download(new Blob([JSON.stringify(state,null,2)],{type:"application/json"}),"ray-backup-"+todayISO()+".json");say("Backup baixado. Guarde o arquivo em um lugar seguro.");
  }
  function exportCsv(){
    const list=monthTransactions(currentKey());
    if(!list.length){say("Não há movimentações neste mês.");return;}
    const rows=[["Data","Tipo","Descrição","Categoria","Valor"]];
    list.slice().reverse().forEach(t=>rows.push([t.date,t.type==="income"?"Entrada":"Saída",t.description,category(t.type,t.category).name,Number(t.amount).toFixed(2).replace(".",",")]));
    const csv="\\uFEFF"+rows.map(row=>row.map(value=>'"'+String(value).replace(/"/g,'""')+'"').join(";")).join("\\r\\n");
    const blob=new Blob([csv],{type:"text/csv;charset=utf-8"});
    const url=URL.createObjectURL(blob),a=document.createElement("a");
    a.href=url;a.download="ray-movimentacoes-"+currentKey()+".csv";document.body.appendChild(a);a.click();a.remove();
    setTimeout(()=>URL.revokeObjectURL(url),1000);say("Planilha do mês baixada.");
  }
  function importBackup(file){
    if(!file)return;const reader=new FileReader();
    reader.onload=()=>{
      try{
        const data=JSON.parse(String(reader.result||""));
        if(!data||!Array.isArray(data.transactions)||!Array.isArray(data.goals)||!data.budgets||typeof data.budgets!=="object")throw new Error("invalid backup");
        const next={version:1,transactions:data.transactions.filter(t=>t&&typeof t.id==="string"&&(t.type==="income"||t.type==="expense")&&typeof t.date==="string"&&Number(t.amount)>0),budgets:data.budgets,goals:data.goals.filter(g=>g&&typeof g.id==="string"&&typeof g.name==="string"&&Number(g.target)>0)};
        if(!confirm("O backup vai substituir os dados deste navegador. Quer continuar?"))return;
        state=next;save();render();say("Backup restaurado.");
      }catch(error){say("Esse arquivo não parece ser um backup válido do Ray.");}
    };
    reader.onerror=()=>say("Não foi possível ler o arquivo.");reader.readAsText(file);
  }
  function exportCsv(){
    const items=monthTransactions(currentKey());if(!items.length){say("Não há registros neste mês.");return;}
    const rows=[["Data","Tipo","Descrição","Categoria","Valor"]];
    items.slice().reverse().forEach(t=>rows.push([t.date,t.type==="income"?"Entrada":"Saída",t.description,category(t.type,t.category).name,Number(t.amount).toFixed(2).replace(".",",")]));
    const csv="\uFEFF"+rows.map(r=>r.map(v=>'"'+String(v).replace(/"/g,'""')+'"').join(";")).join("\r\n");
    download(new Blob([csv],{type:"text/csv;charset=utf-8"}),"ray-registros-"+currentKey()+".csv");say("Arquivo CSV baixado.");
  }
  function closeMenu(){
    $("#desktop-nav").classList.remove("open");$("#mobile-nav-toggle").setAttribute("aria-expanded","false");
  }

  document.addEventListener("click",event=>{
    const nav=event.target.closest('.desktop-nav a[href^="#"]');
    if(nav){$$(".desktop-nav a").forEach(a=>a.classList.toggle("active",a===nav));closeMenu();return;}
    const action=event.target.closest("[data-action]");
    if(action){
      const a=action.dataset.action;
      if(a==="add-transaction")openTransaction();
      if(a==="set-budget")openBudget();
      if(a==="add-goal")openGoal();
      if(a==="previous-month")changeMonth(-1);
      if(a==="next-month")changeMonth(1);
      if(a==="current-month"){selectedMonth=new Date(new Date().getFullYear(),new Date().getMonth(),1);render();}
      if(a==="export-backup")exportBackup();
      if(a==="import-backup")$("#backup-file").click();
    }
    const close=event.target.closest("[data-close]");
    if(close)$("#"+close.dataset.close).close();
    const edit=event.target.closest("[data-edit-transaction]");
    if(edit){openTransaction(edit.dataset.editTransaction);return;}
    const del=event.target.closest("[data-delete-transaction]");
    if(del){
      const t=state.transactions.find(x=>x.id===del.dataset.deleteTransaction);
      if(t&&confirm('Apagar o registro "'+t.description+'"?')){state.transactions=state.transactions.filter(x=>x.id!==t.id);save();render();say("Registro apagado.");}
      return;
    }
    const ge=event.target.closest("[data-edit-goal]");
    if(ge){openGoal(ge.dataset.editGoal);return;}
    const gd=event.target.closest("[data-delete-goal]");
    if(gd){const goal=state.goals.find(x=>x.id===gd.dataset.deleteGoal);if(goal&&confirm('Apagar a meta "'+goal.name+'"?')){state.goals=state.goals.filter(x=>x.id!==goal.id);save();render();say("Meta apagada.");}return;}
    const gc=event.target.closest("[data-contribute-goal]");
    if(gc){openContribution(gc.dataset.contributeGoal);return;}
  });
  $("#transaction-form").addEventListener("change",event=>{if(event.target.name==="type")setCategoryOptions(event.target.value);});
  $("#transaction-form").addEventListener("submit",event=>{
    event.preventDefault();const form=event.currentTarget;if(!form.reportValidity())return;
    const id=form.elements.id.value||makeId(),type=form.elements.type.value,amount=validMoney(Number(form.elements.amount.value));
    const item={id,type,description:form.elements.description.value.trim(),amount,date:form.elements.date.value,category:form.elements.category.value,createdAt:Date.now()};
    if(!item.description||!item.date||amount<=0){say("Confira os dados do registro.");return;}
    const index=state.transactions.findIndex(t=>t.id===id);
    if(index>=0){item.createdAt=state.transactions[index].createdAt||Date.now();state.transactions[index]=item;}else state.transactions.push(item);
    save();form.closest("dialog").close();render();say(index>=0?"Registro atualizado.":"Registro guardado.");
  });
  $("#budget-form").addEventListener("submit",event=>{
    event.preventDefault();const form=event.currentTarget;if(!form.reportValidity())return;
    const limit=validMoney(Number(form.elements.limit.value));if(limit<=0){say("Digite um limite maior que zero.");return;}
    state.budgets[currentKey()]=limit;save();form.closest("dialog").close();render();say("Limite atualizado.");
  });
  $("#goal-form").addEventListener("submit",event=>{
    event.preventDefault();const form=event.currentTarget;if(!form.reportValidity())return;
    const id=form.elements.id.value||makeId(),goal={id,name:form.elements.name.value.trim(),target:validMoney(Number(form.elements.target.value)),saved:validMoney(Number(form.elements.saved.value))};
    if(!goal.name||goal.target<=0){say("Confira o nome e o valor da meta.");return;}
    const index=state.goals.findIndex(g=>g.id===id);if(index>=0)state.goals[index]=goal;else state.goals.push(goal);
    save();form.closest("dialog").close();render();say(index>=0?"Meta atualizada.":"Meta criada.");
  });
  $("#contribution-form").addEventListener("submit",event=>{
    event.preventDefault();const form=event.currentTarget;if(!form.reportValidity())return;
    const goal=state.goals.find(g=>g.id===form.elements.id.value),amount=validMoney(Number(form.elements.amount.value));
    if(!goal||amount<=0){say("Informe um valor válido.");return;}
    goal.saved=validMoney(Number(goal.saved||0)+amount);save();form.closest("dialog").close();render();say("Mais um passo na sua meta.");
  });
  $("#transaction-search").addEventListener("input",renderTransactions);
  $("#transaction-filter").addEventListener("change",renderTransactions);
  $("#backup-file").addEventListener("change",event=>{importBackup(event.target.files?.[0]);event.target.value="";});
  $("#mobile-nav-toggle").addEventListener("click",()=>{
    const nav=$("#desktop-nav"),open=nav.classList.toggle("open");
    $("#mobile-nav-toggle").setAttribute("aria-expanded",String(open));
  });
  $$(".desktop-nav a").forEach(a=>a.addEventListener("click",()=>{
    $$(".desktop-nav a").forEach(item=>item.classList.toggle("active",item===a));
  }));
  $$(".modal").forEach(dialog=>dialog.addEventListener("click",event=>{if(event.target===dialog)dialog.close();}));
  document.addEventListener("keydown",event=>{if(event.key==="Escape")closeMenu();});
  $("#current-year").textContent=new Date().getFullYear();
  render();
})();