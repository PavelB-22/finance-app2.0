/* ================= СПРАВОЧНИК ГРУПП ================= */
const INCOME_GROUPS = {
  salary:        { icon:'💼', name:'Зарплата',            color:'#10b981' },
  advance:       { icon:'💵', name:'Аванс',               color:'#34d399' },
  bonus:         { icon:'🎁', name:'Премия / бонус',      color:'#22d3ee' },
  freelance:     { icon:'💻', name:'Фриланс / подработка',color:'#0ea5e9' },
  business:      { icon:'🏢', name:'Бизнес',              color:'#3b82f6' },
  investment:    { icon:'📊', name:'Инвестиции',          color:'#8b5cf6' },
  rent:          { icon:'🏠', name:'Сдача жилья',         color:'#a855f7' },
  cashback:      { icon:'💳', name:'Кэшбэк',              color:'#d946ef' },
  sale:          { icon:'📦', name:'Продажа вещей',       color:'#ec4899' },
  debt:          { icon:'🤝', name:'Возврат долга',       color:'#f472b6' },
  gift:          { icon:'🎉', name:'Подарок',             color:'#fbbf24' },
  'other-income':{ icon:'💰', name:'Другое',              color:'#14b8a6' }
};

const EXPENSE_GROUPS = {
  /* Ежедневное */
  food:          { icon:'🍕', name:'Продукты',            color:'#f43f5e' },
  cafe:          { icon:'☕️', name:'Кафе и доставка',     color:'#fb7185' },
  transport:     { icon:'🚗', name:'Транспорт / бензин',  color:'#f97316' },
  taxi:          { icon:'🚕', name:'Такси',               color:'#fb923c' },
  /* Обязательное */
  housing:       { icon:'🏠', name:'Жильё / аренда',      color:'#8b5cf6' },
  utilities:     { icon:'💡', name:'Коммуналка',          color:'#a78bfa' },
  credit:        { icon:'💳', name:'Кредиты и ипотека',   color:'#dc2626' },
  cards:         { icon:'🔁', name:'Платежи по картам',   color:'#ef4444' },
  phone:         { icon:'📱', name:'Связь и интернет',    color:'#06b6d4' },
  insurance:     { icon:'🛡', name:'Страховка',           color:'#0891b2' },
  taxes:         { icon:'🧾', name:'Налоги и сборы',      color:'#0e7490' },
  kids:          { icon:'👶', name:'Дети / садик',        color:'#f59e0b' },
  /* Здоровье и развитие */
  health:        { icon:'💊', name:'Здоровье / аптека',   color:'#22c55e' },
  doctors:       { icon:'🩺', name:'Врачи и анализы',     color:'#16a34a' },
  sport:         { icon:'⚽️', name:'Спорт и зал',         color:'#84cc16' },
  education:     { icon:'📚', name:'Образование',         color:'#6366f1' },
  books:         { icon:'📖', name:'Книги и курсы',       color:'#818cf8' },
  /* Жизнь и радость */
  shopping:      { icon:'🛍', name:'Одежда и покупки',    color:'#f472b6' },
  beauty:        { icon:'💄', name:'Красота и уход',      color:'#e879f9' },
  entertainment: { icon:'🎮', name:'Развлечения',         color:'#c084fc' },
  travel:        { icon:'✈️', name:'Отпуск и поездки',    color:'#38bdf8' },
  pets:          { icon:'🐾', name:'Питомцы',             color:'#a3e635' },
  gifts:         { icon:'🎁', name:'Подарки',             color:'#fda4af' },
  charity:       { icon:'❤️', name:'Помощь и донаты',     color:'#fb7185' },
  /* Прочее */
  savings:       { icon:'🏦', name:'Накопления',          color:'#14b8a6' },
  other:         { icon:'📦', name:'Другое',              color:'#64748b' }
};

const ALL_GROUPS = Object.assign({}, INCOME_GROUPS, EXPENSE_GROUPS);

/* ================= СОСТОЯНИЕ ================= */
let transactions = [];
let expenseChart = null;
let trendChart = null;
let period = 'all';

const $  = (id) => document.getElementById(id);
const STORE_KEY = 'finance-app-v1';

/* ================= УТИЛИТЫ ================= */
const fmt = (n) => new Intl.NumberFormat('ru-RU',{
  style:'currency', currency:'RUB',
  minimumFractionDigits:0, maximumFractionDigits:0
}).format(n || 0);

const shortFmt = (n) => {
  const abs = Math.abs(n);
  if (abs >= 1e6) return (n/1e6).toFixed(1).replace('.0','') + ' млн ₽';
  if (abs >= 1e3) return (n/1e3).toFixed(0) + ' тыс ₽';
  return fmt(n);
};

const todayISO = () => {
  const d = new Date();
  return new Date(d.getTime() - d.getTimezoneOffset()*60000).toISOString().split('T')[0];
};

const dateLabel = (iso) => {
  const d = new Date(iso + 'T00:00:00');
  const t = new Date(todayISO() + 'T00:00:00');
  const diff = Math.round((t - d) / 86400000);
  if (diff === 0) return 'Сегодня';
  if (diff === 1) return 'Вчера';
  return d.toLocaleDateString('ru-RU',{ day:'numeric', month:'long' });
};

/* ================= ХРАНЕНИЕ ================= */
function load(){
  try{
    const raw = localStorage.getItem(STORE_KEY);
    transactions = raw ? JSON.parse(raw) : [];
    if(!Array.isArray(transactions)) transactions = [];
  }catch(e){ transactions = []; }
}
function save(){
  try{ localStorage.setItem(STORE_KEY, JSON.stringify(transactions)); }
  catch(e){ toast('Не удалось сохранить'); }
}

/* ================= ДОБАВЛЕНИЕ ================= */
function addTransaction(type, category, amount, description, date){
  transactions.push({
    id: Date.now() + Math.random(),
    type, category,
    amount: Math.round(parseFloat(amount) * 100) / 100,
    description: (description || '').trim(),
    date: date || todayISO()
  });
  save();
}

function removeTransaction(id){
  const el = document.querySelector(`[data-tx="${id}"]`);
  if(el) el.classList.add('removing');
  transactions = transactions.filter(t => String(t.id) !== String(id));
  save();
  setTimeout(() => { render(); toast('Операция удалена'); }, 260);
}

/* ================= ФИЛЬТР ПЕРИОДА ================= */
function inPeriod(t){
  if(period === 'all') return true;
  const d = new Date(t.date + 'T00:00:00');
  const now = new Date();
  if(period === 'month') return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  const days = parseInt(period,10);
  const from = new Date(now.getTime() - days*86400000);
  return d >= from;
}

const filtered = () => transactions.filter(inPeriod);
const sum = (arr, type) => arr.filter(t => t.type === type).reduce((s,t) => s + t.amount, 0);

/* ================= РЕНДЕР ================= */
function render(){
  renderHero();
  renderStats();
  renderCharts();
  renderGroupList();
  renderBars();
  renderTransactions();
  renderFilterStats();
}

function renderHero(){
  const income = sum(transactions,'income');
  const expense = sum(transactions,'expense');
  const balance = income - expense;

  const balEl = $('balance');
  balEl.textContent = fmt(balance);
  balEl.classList.toggle('negative', balance < 0);

  const ratio = income > 0 ? Math.min(100, Math.round(expense / income * 100)) : (expense > 0 ? 100 : 0);
  $('balanceBar').style.width = ratio + '%';
  $('ratioText').textContent = income > 0
    ? `Расходы — ${ratio}% от доходов`
    : 'Нет данных о доходах';
}

function renderStats(){
  $('total-income').textContent  = fmt(sum(transactions,'income'));
  $('total-expenses').textContent = fmt(sum(transactions,'expense'));
}

function renderCharts(){
  renderDonut();
  renderTrend();
}

function renderDonut(){
  const ctx = $('expenseChart');
  const expenses = transactions.filter(t => t.type === 'expense');

  const byGroup = {};
  expenses.forEach(t => byGroup[t.category] = (byGroup[t.category] || 0) + t.amount);

  const entries = Object.entries(byGroup).sort((a,b) => b[1] - a[1]);
  const total = entries.reduce((s,[,v]) => s + v, 0);

  $('donutTotal').textContent = shortFmt(total);
  $('expenseCount').textContent = expenses.length + ' ' + plural(expenses.length,['операция','операции','операций']);

  if(expenseChart) expenseChart.destroy();

  if(!entries.length){
    expenseChart = null;
    ctx.style.display = 'none';
    return;
  }
  ctx.style.display = 'block';

  expenseChart = new Chart(ctx,{
    type:'doughnut',
    data:{
      labels: entries.map(([k]) => ALL_GROUPS[k]?.name || k),
      datasets:[{
        data: entries.map(([,v]) => v),
        backgroundColor: entries.map(([k]) => ALL_GROUPS[k]?.color || '#64748b'),
        borderColor:'#151b2b',
        borderWidth:3,
        hoverOffset:10
      }]
    },
    options:{
      responsive:true,
      maintainAspectRatio:false,
      cutout:'68%',
      animation:{ animateRotate:true, duration:900, easing:'easeOutQuart' },
      plugins:{
        legend:{ display:false },
        tooltip:{
          backgroundColor:'#1e2638',
          padding:12,
          cornerRadius:10,
          displayColors:false,
          callbacks:{ label:(c) => ' ' + fmt(c.parsed) + '  •  ' + Math.round(c.parsed/total*100) + '%' }
        }
      }
    }
  });
}

function renderTrend(){
  const ctx = $('trendChart');
  const days = 30;
  const labels = [], inc = [], exp = [];
  const now = new Date();

  for(let i = days - 1; i >= 0; i--){
    const d = new Date(now.getTime() - i*86400000);
    const iso = new Date(d.getTime() - d.getTimezoneOffset()*60000).toISOString().split('T')[0];
    labels.push(i % 3 === 0 ? d.toLocaleDateString('ru-RU',{ day:'numeric', month:'short' }) : '');
    inc.push(transactions.filter(t => t.type==='income'  && t.date===iso).reduce((s,t)=>s+t.amount,0));
    exp.push(transactions.filter(t => t.type==='expense' && t.date===iso).reduce((s,t)=>s+t.amount,0));
  }

  if(trendChart) trendChart.destroy();

  trendChart = new Chart(ctx,{
    type:'line',
    data:{
      labels,
      datasets:[
        {
          label:'Доходы', data:inc,
          borderColor:'#10b981', backgroundColor:'rgba(16,185,129,.12)',
          borderWidth:2.5, tension:.4, fill:true,
          pointRadius:0, pointHoverRadius:5, pointHoverBackgroundColor:'#10b981'
        },
        {
          label:'Расходы', data:exp,
          borderColor:'#f43f5e', backgroundColor:'rgba(244,63,94,.12)',
          borderWidth:2.5, tension:.4, fill:true,
          pointRadius:0, pointHoverRadius:5, pointHoverBackgroundColor:'#f43f5e'
        }
      ]
    },
    options:{
      responsive:true,
      maintainAspectRatio:false,
      animation:{ duration:900, easing:'easeOutQuart' },
      interaction:{ mode:'index', intersect:false },
      plugins:{
        legend:{ labels:{ color:'#94a3b8', boxWidth:8, boxHeight:8, usePointStyle:true, font:{ size:11 } } },
        tooltip:{
          backgroundColor:'#1e2638', padding:12, cornerRadius:10, displayColors:false,
          callbacks:{ label:(c) => c.dataset.label + ': ' + fmt(c.parsed.y) }
        }
      },
      scales:{
        y:{ beginAtZero:true, ticks:{ color:'#64748b', font:{size:10}, callback:(v)=> v>=1000 ? (v/1000)+'к' : v }, grid:{ color:'#232c40' } },
        x:{ ticks:{ color:'#64748b', font:{size:10} }, grid:{ display:false } }
      }
    }
  });
  ctx.parentElement.style.height = '200px';
}

function renderGroupList(){
  const box = $('groupList');
  const expenses = transactions.filter(t => t.type === 'expense');
  const byGroup = {};
  expenses.forEach(t => byGroup[t.category] = (byGroup[t.category] || 0) + t.amount);

  const entries = Object.entries(byGroup).sort((a,b) => b[1]-a[1]).slice(0,8);
  const total = expenses.reduce((s,t) => s + t.amount, 0);

  if(!entries.length){ box.innerHTML = ''; return; }

  box.innerHTML = entries.map(([k,v]) => {
    const g = ALL_GROUPS[k] || { name:k, color:'#64748b' };
    const pct = total ? Math.round(v/total*100) : 0;
    return `<div class="group-row">
      <span class="group-dot" style="background:${g.color}"></span>
      <span class="group-name">${g.name}</span>
      <span class="group-pct">${pct}%</span>
      <span class="group-amount">${fmt(v)}</span>
    </div>`;
  }).join('');
}

function renderBars(){
  const box = $('barsList');
  const data = filtered().filter(t => t.type === 'expense');
  const byGroup = {};
  data.forEach(t => byGroup[t.category] = (byGroup[t.category] || 0) + t.amount);

  const entries = Object.entries(byGroup).sort((a,b) => b[1]-a[1]);
  if(!entries.length){
    box.innerHTML = `<div class="empty"><div class="empty-icon">📊</div>За этот период расходов нет</div>`;
    return;
  }

  const max = entries[0][1];
  const total = entries.reduce((s,[,v]) => s + v, 0);

  box.innerHTML = entries.map(([k,v]) => {
    const g = ALL_GROUPS[k] || { name:k, color:'#64748b', icon:'📦' };
    const pct = Math.round(v/total*100);
    return `<div class="bar-row">
      <div class="bar-head">
        <span>${g.icon} ${g.name}</span>
        <b>${fmt(v)} · ${pct}%</b>
      </div>
      <div class="bar-track">
        <div class="bar-fill" data-w="${Math.max(3, v/max*100)}" style="background:linear-gradient(90deg,${g.color}99,${g.color})"></div>
      </div>
    </div>`;
  }).join('');

  requestAnimationFrame(() => {
    box.querySelectorAll('.bar-fill').forEach((el,i) => {
      setTimeout(() => el.style.width = el.dataset.w + '%', i*55);
    });
  });
}

function renderTransactions(){
  const inc = transactions.filter(t => t.type==='income').sort(byDate);
  const exp = transactions.filter(t => t.type==='expense').sort(byDate);
  const recent = [...transactions].sort(byDate).slice(0,8);

  $('income-list').innerHTML  = listHTML(inc,  '📊','Пока нет доходов. Добавь первый!');
  $('expense-list').innerHTML = listHTML(exp,  '💸','Пока нет расходов. Добавь первый!');
  $('recent-list').innerHTML  = listHTML(recent,'📝','Пока нет операций');
}

const byDate = (a,b) => (b.date > a.date ? 1 : b.date < a.date ? -1 : b.id - a.id);

function listHTML(arr, icon, emptyText){
  if(!arr.length){
    return `<div class="empty"><div class="empty-icon">${icon}</div>${emptyText}</div>`;
  }
  return arr.map(txHTML).join('');
}

function txHTML(t){
  const g = ALL_GROUPS[t.category] || { icon:'💰', name:t.category };
  return `<div class="tx" data-tx="${t.id}" onclick="this.classList.toggle('show-del')">
    <div class="tx-icon">${g.icon}</div>
    <div class="tx-body">
      <div class="tx-cat">${g.name}</div>
      ${t.description ? `<div class="tx-desc">${escapeHTML(t.description)}</div>` : ''}
      <div class="tx-date">${dateLabel(t.date)}</div>
    </div>
    <div class="tx-amount ${t.type}">${t.type==='income'?'+':'−'}${fmt(t.amount)}</div>
    <button class="tx-del" onclick="event.stopPropagation();removeTransaction('${t.id}')">🗑</button>
  </div>`;
}

function renderFilterStats(){
  const f = filtered();
  const i = sum(f,'income'), e = sum(f,'expense');
  $('filter-income').textContent  = fmt(i);
  $('filter-expense').textContent = fmt(e);
  const totalEl = $('filter-total');
  totalEl.textContent = fmt(i - e);
  totalEl.style.color = (i - e) >= 0 ? 'var(--income)' : 'var(--expense)';
}

/* ================= ВСПОМОГАТЕЛЬНОЕ ================= */
function escapeHTML(s){
  return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}
function plural(n, forms){
  const a = Math.abs(n) % 100, b = a % 10;
  if(a > 10 && a < 20) return forms[2];
  if(b > 1 && b < 5)   return forms[1];
  if(b === 1)          return forms[0];
  return forms[2];
}

let toastTimer;
function toast(msg){
  let el = document.querySelector('.toast');
  if(!el){ el = document.createElement('div'); el.className = 'toast'; document.body.appendChild(el); }
  el.textContent = msg;
  requestAnimationFrame(() => el.classList.add('show'));
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 1900);
}

/* ================= ЭКСПОРТ / ИМПОРТ ================= */
function exportCSV(){
  if(!transactions.length){ toast('Нечего экспортировать'); return; }
  const rows = [['Тип','Группа','Сумма','Описание','Дата']];
  [...transactions].sort(byDate).reverse().forEach(t => {
    rows.push([
      t.type === 'income' ? 'Доход' : 'Расход',
      (ALL_GROUPS[t.category]?.name || t.category),
      String(t.amount).replace('.',','),
      (t.description || '').replace(/[;\n]/g,' '),
      t.date
    ]);
  });
  const csv = '\uFEFF' + rows.map(r => r.join(';')).join('\n');
  const blob = new Blob([csv], { type:'text/csv;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'finance-' + todayISO() + '.csv';
  a.click();
  toast('Файл сохранён');
}

function importCSV(file){
  const reader = new FileReader();
  reader.onload = (e) => {
    try{
      const lines = String(e.target.result).replace(/^\uFEFF/,'').split(/\r?\n/).filter(Boolean);
      const nameToKey = {};
      Object.entries(ALL_GROUPS).forEach(([k,g]) => nameToKey[g.name] = k);

      let added = 0;
      lines.slice(1).forEach(line => {
        const p = line.split(';');
        if(p.length < 5) return;
        const type = p[0].trim() === 'Доход' ? 'income' : 'expense';
        const key = nameToKey[p[1].trim()];
        const amount = parseFloat(p[2].replace(',','.'));
        if(!key || !amount || !/^\d{4}-\d{2}-\d{2}$/.test(p[4].trim())) return;
        transactions.push({
          id: Date.now() + Math.random() + added,
          type, category: key, amount,
          description: p[3].trim(),
          date: p[4].trim()
        });
        added++;
      });
      save(); render();
      toast(added ? `Загружено ${added} операций` : 'Ничего не найдено');
    }catch(err){ toast('Не удалось прочитать файл'); }
  };
  reader.readAsText(file, 'utf-8');
}

/* ================= СОБЫТИЯ ================= */
function bind(){
  document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
      tab.classList.add('active');
      const target = $(tab.dataset.tab);
      if(target) target.classList.add('active');
      window.scrollTo({ top:0, behavior:'smooth' });
    });
  });

  $('income-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const f = new FormData(e.target);
    addTransaction('income', f.get('category'), f.get('amount'), f.get('description'), f.get('date'));
    e.target.reset();
    e.target.date.value = todayISO();
    render(); toast('Доход добавлен ✅');
  });

  $('expense-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const f = new FormData(e.target);
    addTransaction('expense', f.get('category'), f.get('amount'), f.get('description'), f.get('date'));
    e.target.reset();
    e.target.date.value = todayISO();
    render(); toast('Расход добавлен ✅');
  });

  $('periodChips').addEventListener('click', (e) => {
    const chip = e.target.closest('.chip');
    if(!chip) return;
    document.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
    chip.classList.add('active');
    period = chip.dataset.period;
    renderBars(); renderFilterStats();
  });

  /* FAB / шит */
  const sheet = $('sheet'), backdrop = $('sheetBackdrop');
  const closeSheet = () => { sheet.classList.remove('open'); backdrop.classList.remove('open'); };
  $('fab').addEventListener('click', () => { sheet.classList.add('open'); backdrop.classList.add('open'); });
  $('menuBtn').addEventListener('click', () => { sheet.classList.add('open'); backdrop.classList.add('open'); });
  backdrop.addEventListener('click', closeSheet);
  sheet.querySelectorAll('[data-quick]').forEach(b => {
    b.addEventListener('click', () => {
      document.querySelector(`[data-tab="${b.dataset.quick}"]`).click();
      closeSheet();
    });
  });

  $('exportBtn').addEventListener('click', exportCSV);
  $('importBtn').addEventListener('click', () => $('importFile').click());
  $('importFile').addEventListener('change', (e) => {
    if(e.target.files[0]) importCSV(e.target.files[0]);
    e.target.value = '';
  });
  $('clearBtn').addEventListener('click', () => {
    if(confirm('Удалить все операции? Это нельзя отменить.')){
      transactions = []; save(); render(); toast('Все данные удалены');
    }
  });
}

/* ================= СТАРТ ================= */
document.addEventListener('DOMContentLoaded', () => {
  load();
  bind();
  document.querySelectorAll('input[type="date"]').forEach(i => i.value = todayISO());
  render();
});

/* оффлайн-режим */
if('serviceWorker' in navigator){
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('service-worker.js').catch(() => {});
  });
}
