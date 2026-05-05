// ============================================================
//  PFM — Personal Finance Manager  |  main.js  (complet)
// ============================================================

const MONTHS = ['Janvier','Février','Mars','Avril','Mai','Juin',
                'Juillet','Août','Septembre','Octobre','Novembre','Décembre'];
let curYear  = 2026;
let curMonth = 3; // avril (0-indexé)

// ── Auth ──────────────────────────────────────────────────
const mockUser = { username: "Nomena", password: "garfilde" };
let isAuthenticated = false;

async function login() {
    const username = document.getElementById('loginUsername').value.trim();
    const password = document.getElementById('loginPassword').value.trim();
    const errorDiv = document.getElementById('loginError');
    errorDiv.style.display = 'none';
    await new Promise(r => setTimeout(r, 500));
    if (username === mockUser.username && password === mockUser.password) {
        isAuthenticated = true;
        document.getElementById('loginPage').style.display = 'none';
        document.getElementById('appContainer').style.display = 'block';
        renderMonth();
        loadDashboardData();
    } else {
        errorDiv.textContent = "Identifiants incorrects. (Nomena / garfilde)";
        errorDiv.style.display = 'block';
    }
}

function logout() {
    isAuthenticated = false;
    document.getElementById('loginPage').style.display = 'flex';
    document.getElementById('appContainer').style.display = 'none';
    document.getElementById('loginPassword').value = '';
}

// ── Navigation ────────────────────────────────────────────
function switchView(viewId, navEl) {
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    document.getElementById('view-' + viewId).classList.add('active');
    if (navEl) navEl.classList.add('active');

    // Charger la vue demandée
    if (viewId === 'budget')   renderBudget();
    if (viewId === 'upcoming') renderUpcoming();
    if (viewId === 'goals')    renderGoals();
    if (viewId === 'history')  renderHistory();
    if (viewId === 'settings') renderSettings();
}

// ── Utilitaires ───────────────────────────────────────────
function formatMoney(n) {
    return Number(n).toLocaleString('fr-FR') + ' Ar';
}
function escapeHtml(t) {
    if (!t) return '';
    const d = document.createElement('div');
    d.textContent = t;
    return d.innerHTML;
}
function monthKey(y, m) { return `${y}-${String(m).padStart(2,'0')}`; }
function todayStr() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

// ── Données localStorage ──────────────────────────────────
function getData(key, def) {
    try { return JSON.parse(localStorage.getItem('pfm_' + key)) ?? def; }
    catch { return def; }
}
function setData(key, val) {
    localStorage.setItem('pfm_' + key, JSON.stringify(val));
}

// Catégories par défaut
function getCategories() {
    return getData('categories', [
        { id: 'c1', name: 'Logement',    color: '#6366f1', icon: '🏠', type: 'expense' },
        { id: 'c2', name: 'Nourriture',  color: '#10b981', icon: '🍽️', type: 'expense' },
        { id: 'c3', name: 'Transport',   color: '#f59e0b', icon: '🚗', type: 'expense' },
        { id: 'c4', name: 'Santé',       color: '#06b6d4', icon: '💊', type: 'expense' },
        { id: 'c5', name: 'Loisirs',     color: '#ec4899', icon: '🎉', type: 'expense' },
        { id: 'c6', name: 'Éducation',   color: '#8b5cf6', icon: '📚', type: 'expense' },
        { id: 'c7', name: 'Autres',      color: '#a8a29e', icon: '📦', type: 'expense' },
        { id: 'c8', name: 'Salaire',     color: '#10b981', icon: '💼', type: 'income'  },
        { id: 'c9', name: 'Freelance',   color: '#06b6d4', icon: '💻', type: 'income'  },
        { id:'c10', name: 'Autre revenu',color: '#f59e0b', icon: '💰', type: 'income'  },
    ]);
}

// Transactions
function getTransactions() {
    return getData('transactions', [
        { id:'t1', date:'2026-04-01', label:'Salaire',        categoryId:'c8',  amount:650000,  type:'income'  },
        { id:'t2', date:'2026-04-01', label:'Freelance web',  categoryId:'c9',  amount:200000,  type:'income'  },
        { id:'t3', date:'2026-04-03', label:'Loyer Maison',   categoryId:'c1',  amount:250000,  type:'expense' },
        { id:'t4', date:'2026-04-05', label:'Courses Shoprite',categoryId:'c2', amount:48000,   type:'expense' },
        { id:'t5', date:'2026-04-07', label:'Taxi-be',        categoryId:'c3',  amount:15000,   type:'expense' },
        { id:'t6', date:'2026-04-10', label:'Médecin',        categoryId:'c4',  amount:30000,   type:'expense' },
        { id:'t7', date:'2026-04-12', label:'Courses marché', categoryId:'c2',  amount:50000,   type:'expense' },
        { id:'t8', date:'2026-04-15', label:'Cinéma',         categoryId:'c5',  amount:20000,   type:'expense' },
        { id:'t9', date:'2026-04-18', label:'Carburant',      categoryId:'c3',  amount:30000,   type:'expense' },
        { id:'t10',date:'2026-04-20', label:'Livres école',   categoryId:'c6',  amount:25000,   type:'expense' },
        { id:'t11',date:'2026-03-01', label:'Salaire Mars',   categoryId:'c8',  amount:650000,  type:'income'  },
        { id:'t12',date:'2026-03-04', label:'Loyer Mars',     categoryId:'c1',  amount:250000,  type:'expense' },
        { id:'t13',date:'2026-03-10', label:'Courses mars',   categoryId:'c2',  amount:90000,   type:'expense' },
    ]);
}
function saveTransactions(txs) { setData('transactions', txs); }

// Objectifs d'épargne
function getGoals() {
    return getData('goals', [
        { id:'g1', name:'Voyage à Nosy Be', target:2000000, saved:1360000, color:'#6366f1', icon:'✈️', deadline:'2026-12-01' },
        { id:'g2', name:'Nouvelle Moto',    target:2000000, saved:840000,  color:'#10b981', icon:'🏍️', deadline:'2027-06-01' },
    ]);
}
function saveGoals(goals) { setData('goals', goals); }

// Dépenses récurrentes
function getUpcoming() {
    return getData('upcoming', [
        { id:'u1', name:'Loyer Maison',       amount:250000, day:3,  categoryId:'c1', icon:'🏠' },
        { id:'u2', name:'JIRAMA Électricité', amount:45000,  day:11, categoryId:'c1', icon:'⚡' },
        { id:'u3', name:'JIRAMA Eau',         amount:20000,  day:11, categoryId:'c1', icon:'💧' },
        { id:'u4', name:'Forfait téléphone',  amount:15000,  day:5,  categoryId:'c5', icon:'📱' },
        { id:'u5', name:'Internet fibre',     amount:35000,  day:15, categoryId:'c5', icon:'🌐' },
    ]);
}
function saveUpcoming(list) { setData('upcoming', list); }

// ── Rendu mois ────────────────────────────────────────────
function renderMonth() {
    document.getElementById('dash-month').textContent    = MONTHS[curMonth] + ' ' + curYear;
    document.getElementById('sidebar-month').textContent = MONTHS[curMonth].slice(0,3) + ' ' + curYear;
}
function changeMonth(delta) {
    curMonth += delta;
    if (curMonth > 11) { curMonth = 0; curYear++; }
    if (curMonth < 0)  { curMonth = 11; curYear--; }
    renderMonth();
    loadDashboardData();
}

// ── DASHBOARD ─────────────────────────────────────────────
async function loadDashboardData() {
    await new Promise(r => setTimeout(r, 200));

    // Recalcul propre du filtre mois
    const mStr = `${curYear}-${String(curMonth+1).padStart(2,'0')}`;
    const monthTxs = getTransactions().filter(t => t.date.startsWith(mStr));

    const income  = monthTxs.filter(t=>t.type==='income').reduce((s,t)=>s+t.amount,0);
    const expense = monthTxs.filter(t=>t.type==='expense').reduce((s,t)=>s+t.amount,0);
    const goals   = getGoals();
    const savings = goals.reduce((s,g)=>s+g.saved,0);

    document.getElementById('kpi-balance').textContent  = formatMoney(income - expense);
    document.getElementById('kpi-income').textContent   = formatMoney(income);
    document.getElementById('kpi-expense').textContent  = formatMoney(expense);
    document.getElementById('kpi-savings').textContent  = formatMoney(savings);

    document.getElementById('expense-month').textContent = MONTHS[curMonth] + ' ' + curYear;

    loadRecentTransactions(monthTxs);
    loadExpenseCategories(monthTxs, expense);
    loadGoalsDash(goals);
    loadUpcomingDash();
}

function loadRecentTransactions(monthTxs) {
    const txList = document.getElementById('tx-list');
    const cats   = getCategories();
    const recent = [...monthTxs].sort((a,b)=>b.date.localeCompare(a.date)).slice(0,5);
    if (!recent.length) { txList.innerHTML = '<li class="tx-empty">Aucune transaction ce mois</li>'; return; }
    txList.innerHTML = recent.map(tx => {
        const cat  = cats.find(c=>c.id===tx.categoryId) || {name:'Autre',icon:'📦'};
        const d = new Date(tx.date);
        const day = d.getDate() + '' + MONTHS[parseInt(tx.date.slice(5,7))-1].slice(0,3);
        const isInc= tx.type==='income';
        const arrow= isInc
            ? `<svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12l7 7 7-7" stroke="currentColor" stroke-width="2"/></svg>`
            : `<svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M12 19V5M5 12l7-7 7 7" stroke="currentColor" stroke-width="2"/></svg>`;
        return `<li class="tx-item">
            <div class="tx-icon ${isInc?'tx-icon--income':'tx-icon--expense'}">${arrow}</div>
            <div class="tx-info"><span class="tx-label">${escapeHtml(tx.label)}</span><span class="tx-cat">${escapeHtml(cat.name)}</span></div>
            <div class="tx-right">
                <span class="tx-amount ${isInc?'tx-amount--income':'tx-amount--expense'}">${isInc?'+':'-'} ${formatMoney(tx.amount)}</span>
                <span class="tx-date">${day}</span>
            </div>
        </li>`;
    }).join('');
}

function loadExpenseCategories(monthTxs, totalExpense) {
    const cats    = getCategories();
    const expTxs  = monthTxs.filter(t=>t.type==='expense');
    const bycat   = {};
    expTxs.forEach(t => { bycat[t.categoryId] = (bycat[t.categoryId]||0) + t.amount; });

    const data = Object.entries(bycat).map(([cid, amt]) => {
        const cat = cats.find(c=>c.id===cid) || {name:'Autre',color:'#a8a29e'};
        return { name: cat.name, amount: amt, color: cat.color,
                 percentage: totalExpense ? Math.round(amt/totalExpense*100) : 0 };
    }).sort((a,b)=>b.amount-a.amount);

    if (!data.length) {
        document.getElementById('chart-legend').innerHTML = '<div class="legend-item">Aucune dépense</div>';
        document.getElementById('total-expenses').textContent = formatMoney(0);
        const canvas = document.getElementById('donut-chart');
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0,0,160,160);
        ctx.beginPath(); ctx.arc(80,80,72,0,Math.PI*2);
        ctx.arc(80,80,50,Math.PI*2,0,true);
        ctx.fillStyle = '#e8e6e1'; ctx.fill();
        return;
    }

    document.getElementById('chart-legend').innerHTML = data.map(cat=>`
        <div class="legend-item">
            <span class="legend-dot" style="background:${cat.color}"></span>
            <span class="legend-name">${escapeHtml(cat.name)}</span>
            <span class="legend-pct">${cat.percentage}%</span>
        </div>`).join('');
    document.getElementById('total-expenses').textContent = formatMoney(totalExpense);
    drawDonutChart(data);
}

function drawDonutChart(cats) {
    const canvas = document.getElementById('donut-chart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const cx=80,cy=80,outerR=72,innerR=50;
    let start = -Math.PI/2;
    const total = cats.reduce((s,c)=>s+c.amount,0);
    ctx.clearRect(0,0,160,160);
    cats.forEach(cat => {
        const sweep = (cat.amount/total)*2*Math.PI;
        ctx.beginPath();
        ctx.arc(cx,cy,outerR,start,start+sweep);
        ctx.arc(cx,cy,innerR,start+sweep,start,true);
        ctx.closePath();
        ctx.fillStyle = cat.color;
        ctx.fill();
        start += sweep;
    });
}

function loadGoalsDash(goals) {
    const el = document.getElementById('goals-list');
    if (!goals.length) { el.innerHTML = '<div class="tx-empty">Aucun objectif</div>'; return; }
    el.innerHTML = goals.slice(0,3).map(g => {
        const pct = Math.min(100, Math.round(g.saved/g.target*100));
        return `<div>
            <div class="goal-header"><span class="goal-name">${escapeHtml(g.icon)} ${escapeHtml(g.name)}</span><span class="goal-pct">${pct}%</span></div>
            <div class="goal-bar-track"><div class="goal-bar-fill" style="width:${pct}%;background:${g.color}"></div></div>
            <div class="goal-amounts"><span>${formatMoney(g.saved)}</span><span class="goal-target">/ ${formatMoney(g.target)}</span></div>
        </div>`;
    }).join('');
}

function loadUpcomingDash() {
    const list = getUpcoming().sort((a,b)=>a.day-b.day).slice(0,3);
    const today= new Date().getDate();
    const el   = document.getElementById('upcoming-list');
    if (!list.length) { el.innerHTML = '<li class="tx-empty">Aucune charge à venir</li>'; return; }
    el.innerHTML = list.map(u => {
        const diff = u.day - today;
        const label = diff < 0 ? 'Passé ce mois' : diff === 0 ? "Aujourd'hui" : `Dans ${diff} jour${diff>1?'s':''}`;
        return `<li class="upcoming-item">
            <div class="upcoming-icon ico--utility">${u.icon}</div>
            <div class="upcoming-info">
                <span class="upcoming-name">${escapeHtml(u.name)}</span>
                <span class="upcoming-date">${label}</span>
            </div>
            <span class="upcoming-amount">- ${formatMoney(u.amount)}</span>
        </li>`;
    }).join('');
}

// ── VUE BUDGET ────────────────────────────────────────────
function renderBudget() {
    const mStr   = `${curYear}-${String(curMonth+1).padStart(2,'0')}`;
    const txs    = getTransactions().filter(t=>t.date.startsWith(mStr));
    const cats   = getCategories();
    const budgets= getData('budgets', {});
    const bKey   = mStr;

    const income  = txs.filter(t=>t.type==='income').reduce((s,t)=>s+t.amount,0);
    const expense = txs.filter(t=>t.type==='expense').reduce((s,t)=>s+t.amount,0);

    // Regrouper dépenses par catégorie
    const bycat = {};
    txs.filter(t=>t.type==='expense').forEach(t => {
        bycat[t.categoryId] = (bycat[t.categoryId]||0) + t.amount;
    });

    const budgetsMonth = budgets[bKey] || {};

    document.getElementById('view-budget').innerHTML = `
    <header class="view-header">
        <div><h1 class="view-title">Budget mensuel</h1><p class="view-subtitle">${MONTHS[curMonth]} ${curYear}</p></div>
        <button class="btn-primary" onclick="openAddTransaction()">+ Ajouter une transaction</button>
    </header>

    <div class="kpi-grid" style="margin-bottom:24px">
        <div class="kpi-card kpi-income">
            <div class="kpi-label">Revenus du mois</div>
            <div class="kpi-value">${formatMoney(income)}</div>
        </div>
        <div class="kpi-card kpi-expense">
            <div class="kpi-label">Dépenses du mois</div>
            <div class="kpi-value">${formatMoney(expense)}</div>
        </div>
        <div class="kpi-card kpi-balance">
            <div class="kpi-label">Solde net</div>
            <div class="kpi-value">${formatMoney(income-expense)}</div>
        </div>
    </div>

    <div class="dash-body">
        <div class="dash-left">
            <div class="card">
                <div class="card-header"><h2 class="card-title">Dépenses par catégorie</h2></div>
                ${cats.filter(c=>c.type==='expense').map(cat => {
                    const spent  = bycat[cat.id] || 0;
                    const budget = budgetsMonth[cat.id] || 0;
                    const pct    = budget ? Math.min(100,Math.round(spent/budget*100)) : 0;
                    const over   = budget && spent > budget;
                    return `<div class="budget-row">
                        <div class="budget-row-top">
                            <span class="budget-cat-name">${cat.icon} ${escapeHtml(cat.name)}</span>
                            <span class="budget-amounts">
                                <span style="color:${over?'var(--clr-red)':'var(--clr-text-1)'}">${formatMoney(spent)}</span>
                                ${budget ? `<span class="goal-target"> / ${formatMoney(budget)}</span>` : '<span class="goal-target"> (pas de budget)</span>'}
                            </span>
                        </div>
                        ${budget ? `<div class="goal-bar-track"><div class="goal-bar-fill" style="width:${pct}%;background:${over?'var(--clr-red)':cat.color}"></div></div>` : ''}
                        <div style="display:flex;gap:8px;margin-top:6px;align-items:center">
                            <input type="number" class="budget-input" placeholder="Définir budget" value="${budget||''}"
                                onchange="setBudget('${bKey}','${cat.id}',this.value)" style="font-family:var(--mono)">
                            ${over ? '<span class="badge-over">Dépassé</span>' : ''}
                        </div>
                    </div>`;
                }).join('')}
            </div>
        </div>

        <div class="dash-right">
            <div class="card">
                <div class="card-header"><h2 class="card-title">Transactions du mois</h2></div>
                <ul class="tx-list">
                    ${[...txs].sort((a,b)=>b.date.localeCompare(a.date)).map(tx => {
                        const cat = cats.find(c=>c.id===tx.categoryId)||{name:'Autre',icon:'📦'};
                        const isI = tx.type==='income';
                        const d = new Date(tx.date);
                        const dataLabel = d.getDate() + ' ' + MONTHS[d.getMonth()].slice(0,3);
                        return `<li class="tx-item">
                            <div class="tx-icon ${isI?'tx-icon--income':'tx-icon--expense'}">${cat.icon}</div>
                            <div class="tx-info">
                                <span class="tx-label">${escapeHtml(tx.label)}</span>
                                <span class="tx-cat">${dataLabel}</span>
                            </div>
                            <div class="tx-right">
                                <span class="tx-amount ${isI?'tx-amount--income':'tx-amount--expense'}">${isI?'+':'-'} ${formatMoney(tx.amount)}</span>
                                <button class="btn-del" onclick="deleteTransaction('${tx.id}')">✕</button>
                            </div>
                        </li>`;
                    }).join('') || '<li class="tx-empty">Aucune transaction</li>'}
                </ul>
            </div>
        </div>
    </div>

    <!-- MODAL ajout transaction -->
    <div id="modal-tx" class="modal-overlay" style="display:none" onclick="if(event.target===this)closeModal('modal-tx')">
        <div class="modal-box">
            <div class="modal-header"><h3>Nouvelle transaction</h3><button class="modal-close" onclick="closeModal('modal-tx')">✕</button></div>
            <div class="modal-body">
                <div class="input-group">
                    <label>Type</label>
                    <select id="tx-type" onchange="updateCatSelect()">
                        <option value="expense">Dépense</option>
                        <option value="income">Revenu</option>
                    </select>
                </div>
                <div class="input-group">
                    <label>Libellé</label>
                    <input type="text" id="tx-label" placeholder="Ex: Courses Shoprite">
                </div>
                <div class="input-group">
                    <label>Montant (Ar)</label>
                    <input type="number" id="tx-amount" placeholder="50000">
                </div>
                <div class="input-group">
                    <label>Catégorie</label>
                    <select id="tx-cat"></select>
                </div>
                <div class="input-group">
                    <label>Date</label>
                    <input type="date" id="tx-date" value="${todayStr()}">
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn-secondary" onclick="closeModal('modal-tx')">Annuler</button>
                <button class="btn-primary" onclick="saveTransaction()">Enregistrer</button>
            </div>
        </div>
    </div>`;
}

function setBudget(bKey, catId, val) {
    const budgets = getData('budgets', {});
    if (!budgets[bKey]) budgets[bKey] = {};
    budgets[bKey][catId] = parseInt(val) || 0;
    setData('budgets', budgets);
}

function openAddTransaction() {
    document.getElementById('modal-tx').style.display = 'flex';
    updateCatSelect();
    document.getElementById('tx-date').value = `${curYear}-${String(curMonth+1).padStart(2,'0')}-01`;
}

function updateCatSelect() {
    const type = document.getElementById('tx-type').value;
    const cats = getCategories().filter(c=>c.type===type);
    document.getElementById('tx-cat').innerHTML = cats.map(c=>`<option value="${c.id}">${c.icon} ${c.name}</option>`).join('');
}

function saveTransaction() {
    const label  = document.getElementById('tx-label').value.trim();
    const amount = parseInt(document.getElementById('tx-amount').value);
    const cat    = document.getElementById('tx-cat').value;
    const type   = document.getElementById('tx-type').value;
    const date   = document.getElementById('tx-date').value;
    if (!label || isNaN(amount) || !date) { alert('Veuillez remplir tous les champs.'); return; }
    const txs = getTransactions();
    txs.push({ id: 't' + Date.now(), label, amount, categoryId: cat, type, date });
    saveTransactions(txs);
    closeModal('modal-tx');
    renderBudget();
    loadDashboardData();
}

function deleteTransaction(id) {
    if (!confirm('Supprimer cette transaction ?')) return;
    saveTransactions(getTransactions().filter(t=>t.id!==id));
    renderBudget();
    loadDashboardData();
}

function closeModal(id) { document.getElementById(id).style.display = 'none'; }

// ── VUE DÉPENSES À VENIR ──────────────────────────────────
function renderUpcoming() {
    const list  = getUpcoming().sort((a,b)=>a.day-b.day);
    const today = new Date().getDate();
    const cats  = getCategories();

    document.getElementById('view-upcoming').innerHTML = `
    <header class="view-header">
        <div><h1 class="view-title">Dépenses à venir</h1><p class="view-subtitle">Charges récurrentes mensuelles</p></div>
        <button class="btn-primary" onclick="openAddUpcoming()">+ Ajouter une charge</button>
    </header>

    <div class="card" style="margin-bottom:20px">
        <div class="card-header">
            <h2 class="card-title">Total charges récurrentes</h2>
            <span class="card-badge" style="background:var(--clr-red-light);color:var(--clr-red)">
                ${formatMoney(list.reduce((s,u)=>s+u.amount,0))} / mois
            </span>
        </div>
        <ul class="upcoming-list">
            ${list.map(u => {
                const diff  = u.day - today;
                const label = diff < 0 ? 'Passé ce mois' : diff === 0 ? "Aujourd'hui !" : `Dans ${diff} jour${diff>1?'s':''}`;
                const urgent= diff >= 0 && diff <= 3;
                const cat   = cats.find(c=>c.id===u.categoryId)||{};
                return `<li class="upcoming-item" style="${urgent?'background:var(--clr-amber-light);border-radius:10px':''}">
                    <div class="upcoming-icon ico--utility" style="font-size:20px;background:transparent">${u.icon}</div>
                    <div class="upcoming-info">
                        <span class="upcoming-name">${escapeHtml(u.name)}</span>
                        <span class="upcoming-date" style="color:${diff===0?'var(--clr-red)':urgent?'var(--clr-amber)':''}">
                            Chaque mois le ${u.day} — <strong>${label}</strong>
                        </span>
                    </div>
                    <div style="display:flex;align-items:center;gap:12px">
                        <span class="upcoming-amount">- ${formatMoney(u.amount)}</span>
                        <button class="btn-del" onclick="deleteUpcoming('${u.id}')">✕</button>
                    </div>
                </li>`;
            }).join('') || '<li class="tx-empty">Aucune charge récurrente</li>'}
        </ul>
    </div>

    <!-- MODAL -->
    <div id="modal-upcoming" class="modal-overlay" style="display:none" onclick="if(event.target===this)closeModal('modal-upcoming')">
        <div class="modal-box">
            <div class="modal-header"><h3>Nouvelle charge récurrente</h3><button class="modal-close" onclick="closeModal('modal-upcoming')">✕</button></div>
            <div class="modal-body">
                <div class="input-group"><label>Nom</label><input type="text" id="up-name" placeholder="Ex: JIRAMA Électricité"></div>
                <div class="input-group"><label>Montant (Ar)</label><input type="number" id="up-amount" placeholder="45000"></div>
                <div class="input-group"><label>Jour du mois (1-31)</label><input type="number" id="up-day" min="1" max="31" placeholder="15"></div>
                <div class="input-group"><label>Icône (emoji)</label><input type="text" id="up-icon" placeholder="⚡" maxlength="4"></div>
                <div class="input-group"><label>Catégorie</label>
                    <select id="up-cat">
                        ${cats.filter(c=>c.type==='expense').map(c=>`<option value="${c.id}">${c.icon} ${c.name}</option>`).join('')}
                    </select>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn-secondary" onclick="closeModal('modal-upcoming')">Annuler</button>
                <button class="btn-primary" onclick="saveUpcomingItem()">Enregistrer</button>
            </div>
        </div>
    </div>`;
}

function openAddUpcoming() { document.getElementById('modal-upcoming').style.display='flex'; }

function saveUpcomingItem() {
    const name  = document.getElementById('up-name').value.trim();
    const amount= parseInt(document.getElementById('up-amount').value);
    const day   = parseInt(document.getElementById('up-day').value);
    const icon  = document.getElementById('up-icon').value.trim() || '💳';
    const cat   = document.getElementById('up-cat').value;
    if (!name || !amount || !day) { alert('Remplissez tous les champs.'); return; }
    const list = getUpcoming();
    list.push({ id: 'u' + Date.now(), name, amount, day, icon, categoryId: cat });
    saveUpcoming(list);
    closeModal('modal-upcoming');
    renderUpcoming();
}

function deleteUpcoming(id) {
    if (!confirm('Supprimer cette charge ?')) return;
    saveUpcoming(getUpcoming().filter(u=>u.id!==id));
    renderUpcoming();
}

// ── VUE OBJECTIFS ─────────────────────────────────────────
function renderGoals() {
    const goals = getGoals();
    document.getElementById('view-goals').innerHTML = `
    <header class="view-header">
        <div><h1 class="view-title">Objectifs d'épargne</h1><p class="view-subtitle">Suivez votre progression</p></div>
        <button class="btn-primary" onclick="openAddGoal()">+ Nouvel objectif</button>
    </header>

    <div class="goals-grid">
        ${goals.map(g => {
            const pct = Math.min(100, Math.round(g.saved/g.target*100));
            const remaining = g.target - g.saved;
            return `<div class="goal-card">
                <div class="goal-card-top">
                    <span class="goal-card-icon">${g.icon}</span>
                    <div style="flex:1">
                        <div class="goal-name" style="font-size:15px">${escapeHtml(g.name)}</div>
                        ${g.deadline ? `<div style="font-size:11px;color:var(--clr-text-3)">Échéance : ${g.deadline.slice(0,7).split('-').reverse().join('/')}</div>` : ''}
                    </div>
                    <button class="btn-del" onclick="deleteGoal('${g.id}')">✕</button>
                </div>
                <div class="goal-bar-track" style="margin:12px 0 6px"><div class="goal-bar-fill" style="width:${pct}%;background:${g.color};transition:width .5s"></div></div>
                <div class="goal-amounts" style="margin-bottom:12px">
                    <span style="font-weight:600">${formatMoney(g.saved)}</span>
                    <span class="goal-target"> / ${formatMoney(g.target)}</span>
                    <span class="goal-pct" style="margin-left:auto">${pct}%</span>
                </div>
                <div style="font-size:12px;color:var(--clr-text-3);margin-bottom:12px">
                    Il reste <strong>${formatMoney(remaining)}</strong> à épargner
                </div>
                <div style="display:flex;gap:8px">
                    <input type="number" class="budget-input" placeholder="Ajouter (Ar)" id="add-${g.id}" style="flex:1">
                    <button class="btn-primary" style="padding:6px 14px;font-size:13px" onclick="addToGoal('${g.id}')">+ Épargner</button>
                </div>
            </div>`;
        }).join('') || '<div class="tx-empty" style="padding:40px">Aucun objectif. Créez-en un !</div>'}
    </div>

    <!-- MODAL -->
    <div id="modal-goal" class="modal-overlay" style="display:none" onclick="if(event.target===this)closeModal('modal-goal')">
        <div class="modal-box">
            <div class="modal-header"><h3>Nouvel objectif</h3><button class="modal-close" onclick="closeModal('modal-goal')">✕</button></div>
            <div class="modal-body">
                <div class="input-group"><label>Nom</label><input type="text" id="g-name" placeholder="Ex: Voyage à Nosy Be"></div>
                <div class="input-group"><label>Objectif (Ar)</label><input type="number" id="g-target" placeholder="2000000"></div>
                <div class="input-group"><label>Épargne initiale (Ar)</label><input type="number" id="g-saved" placeholder="0"></div>
                <div class="input-group"><label>Icône</label><input type="text" id="g-icon" placeholder="✈️" maxlength="4"></div>
                <div class="input-group"><label>Couleur</label><input type="color" id="g-color" value="#6366f1"></div>
                <div class="input-group"><label>Échéance</label><input type="date" id="g-deadline"></div>
            </div>
            <div class="modal-footer">
                <button class="btn-secondary" onclick="closeModal('modal-goal')">Annuler</button>
                <button class="btn-primary" onclick="saveGoal()">Créer</button>
            </div>
        </div>
    </div>`;
}

function openAddGoal() { document.getElementById('modal-goal').style.display='flex'; }

function saveGoal() {
    const name    = document.getElementById('g-name').value.trim();
    const target  = parseInt(document.getElementById('g-target').value) || 0;
    const saved   = parseInt(document.getElementById('g-saved').value) || 0;
    const icon    = document.getElementById('g-icon').value.trim() || '🎯';
    const color   = document.getElementById('g-color').value;
    const deadline= document.getElementById('g-deadline').value;
    if (!name || !target) { alert('Remplissez au moins le nom et l\'objectif.'); return; }
    const goals = getGoals();
    goals.push({ id: 'g' + Date.now(), name, target, saved, icon, color, deadline });
    saveGoals(goals);
    closeModal('modal-goal');
    renderGoals();
    loadDashboardData();
}

function addToGoal(id) {
    const amount = parseInt(document.getElementById('add-' + id).value);
    if (!amount || amount <= 0) { alert('Entrez un montant valide.'); return; }
    const goals = getGoals();
    const g = goals.find(x=>x.id===id);
    if (!g) return;
    g.saved = Math.min(g.target, g.saved + amount);
    saveGoals(goals);
    renderGoals();
    loadDashboardData();
}

function deleteGoal(id) {
    if (!confirm('Supprimer cet objectif ?')) return;
    saveGoals(getGoals().filter(g=>g.id!==id));
    renderGoals();
    loadDashboardData();
}

// ── VUE HISTORIQUE ────────────────────────────────────────
let histFilter = { type: 'all', cat: 'all', search: '' };

function renderHistory() {
    const allTxs = getTransactions();
    const cats   = getCategories();

    // Appliquer filtres
    let filtered = allTxs.filter(t => {
        if (histFilter.type !== 'all' && t.type !== histFilter.type) return false;
        if (histFilter.cat !== 'all' && t.categoryId !== histFilter.cat) return false;
        if (histFilter.search) {
            const s = histFilter.search.toLowerCase();
            const cat = cats.find(c=>c.id===t.categoryId)||{name:''};
            if (!t.label.toLowerCase().includes(s) && !cat.name.toLowerCase().includes(s)) return false;
        }
        return true;
    }).sort((a,b)=>b.date.localeCompare(a.date));

    const totalInc = filtered.filter(t=>t.type==='income').reduce((s,t)=>s+t.amount,0);
    const totalExp = filtered.filter(t=>t.type==='expense').reduce((s,t)=>s+t.amount,0);

    document.getElementById('view-history').innerHTML = `
    <header class="view-header">
        <div><h1 class="view-title">Historique</h1><p class="view-subtitle">Toutes vos transactions (${filtered.length})</p></div>
        <button class="btn-primary" onclick="switchView('budget',document.querySelector('[data-view=budget]'))">+ Ajouter</button>
    </header>

    <div class="card" style="margin-bottom:20px">
        <div style="display:flex;gap:12px;flex-wrap:wrap;align-items:center">
            <input type="text" class="search-input" placeholder="🔍 Rechercher…" value="${escapeHtml(histFilter.search)}"
                oninput="histFilter.search=this.value;renderHistory()">
            <select class="filter-select" onchange="histFilter.type=this.value;renderHistory()">
                <option value="all" ${histFilter.type==='all'?'selected':''}>Tous types</option>
                <option value="income" ${histFilter.type==='income'?'selected':''}>Revenus</option>
                <option value="expense" ${histFilter.type==='expense'?'selected':''}>Dépenses</option>
            </select>
            <select class="filter-select" onchange="histFilter.cat=this.value;renderHistory()">
                <option value="all">Toutes catégories</option>
                ${cats.map(c=>`<option value="${c.id}" ${histFilter.cat===c.id?'selected':''}>${c.icon} ${c.name}</option>`).join('')}
            </select>
            <div style="margin-left:auto;display:flex;gap:16px;font-size:13px">
                <span style="color:var(--clr-green)">+${formatMoney(totalInc)}</span>
                <span style="color:var(--clr-red)">-${formatMoney(totalExp)}</span>
            </div>
        </div>
    </div>

    <div class="card">
        <ul class="tx-list">
            ${filtered.map(tx => {
                const cat = cats.find(c=>c.id===tx.categoryId)||{name:'Autre',icon:'📦'};
                const isI = tx.type==='income';
                const d   = tx.date;
                const dateLabel = `${d.slice(8,10)} ${MONTHS[parseInt(d.slice(5,7))-1]} ${d.slice(0,4)}`;
                return `<li class="tx-item">
                    <div class="tx-icon ${isI?'tx-icon--income':'tx-icon--expense'}" style="font-size:16px;background:${isI?'var(--clr-green-light)':'var(--clr-red-light)'}">${cat.icon}</div>
                    <div class="tx-info">
                        <span class="tx-label">${escapeHtml(tx.label)}</span>
                        <span class="tx-cat">${escapeHtml(cat.name)}</span>
                    </div>
                    <div class="tx-right">
                        <span class="tx-amount ${isI?'tx-amount--income':'tx-amount--expense'}">${isI?'+':'-'} ${formatMoney(tx.amount)}</span>
                        <span class="tx-date">${dateLabel}</span>
                    </div>
                    <button class="btn-del" style="margin-left:8px" onclick="deleteTransactionHistory('${tx.id}')">✕</button>
                </li>`;
            }).join('') || '<li class="tx-empty">Aucune transaction trouvée</li>'}
        </ul>
    </div>`;
}

function deleteTransactionHistory(id) {
    if (!confirm('Supprimer cette transaction ?')) return;
    saveTransactions(getTransactions().filter(t=>t.id!==id));
    renderHistory();
    loadDashboardData();
}

// ── VUE PARAMÈTRES ────────────────────────────────────────
function renderSettings() {
    const cats = getCategories();
    document.getElementById('view-settings').innerHTML = `
    <header class="view-header">
        <div><h1 class="view-title">Paramètres</h1><p class="view-subtitle">Catégories et préférences</p></div>
    </header>

    <div class="dash-body">
        <div class="dash-left">
            <div class="card">
                <div class="card-header"><h2 class="card-title">Catégories de dépenses</h2>
                    <button class="btn-primary" style="font-size:12px;padding:5px 12px" onclick="openAddCat('expense')">+ Ajouter</button>
                </div>
                ${cats.filter(c=>c.type==='expense').map(c=>`
                    <div class="cat-row">
                        <span style="font-size:20px">${c.icon}</span>
                        <span style="flex:1;font-weight:500">${escapeHtml(c.name)}</span>
                        <span class="legend-dot" style="background:${c.color};width:12px;height:12px"></span>
                        ${c.id.startsWith('c') && parseInt(c.id.slice(1)) <= 10 ? '<span style="font-size:11px;color:var(--clr-text-3)">Défaut</span>' :
                          `<button class="btn-del" onclick="deleteCat('${c.id}')">✕</button>`}
                    </div>`).join('')}
            </div>

            <div class="card">
                <div class="card-header"><h2 class="card-title">Catégories de revenus</h2>
                    <button class="btn-primary" style="font-size:12px;padding:5px 12px" onclick="openAddCat('income')">+ Ajouter</button>
                </div>
                ${cats.filter(c=>c.type==='income').map(c=>`
                    <div class="cat-row">
                        <span style="font-size:20px">${c.icon}</span>
                        <span style="flex:1;font-weight:500">${escapeHtml(c.name)}</span>
                        <span class="legend-dot" style="background:${c.color};width:12px;height:12px"></span>
                        ${c.id.startsWith('c') && parseInt(c.id.slice(1)) <= 10 ? '<span style="font-size:11px;color:var(--clr-text-3)">Défaut</span>' :
                          `<button class="btn-del" onclick="deleteCat('${c.id}')">✕</button>`}
                    </div>`).join('')}
            </div>
        </div>

        <div class="dash-right">
            <div class="card">
                <div class="card-header"><h2 class="card-title">Profil</h2></div>
                <div style="display:flex;flex-direction:column;gap:14px">
                    <div class="input-group"><label>Nom d'utilisateur</label><input type="text" value="Nomena" disabled style="background:var(--clr-bg)"></div>
                    <div class="input-group"><label>Email</label><input type="email" id="s-email" value="${getData('email','ramelsonnomena562@gmail.com')}"></div>
                    <div class="input-group"><label>Devise</label>
                        <select id="s-currency" disabled style="background:var(--clr-bg)"><option>Ariary (Ar)</option></select>
                    </div>
                    <button class="btn-primary" onclick="saveProfile()">Enregistrer</button>
                </div>
            </div>

            <div class="card">
                <div class="card-header"><h2 class="card-title">Données</h2></div>
                <div style="display:flex;flex-direction:column;gap:10px">
                    <button class="btn-secondary" onclick="exportData()">📥 Exporter les données (JSON)</button>
                    <button class="btn-secondary" style="color:var(--clr-red);border-color:var(--clr-red)" onclick="resetData()">🗑️ Réinitialiser toutes les données</button>
                </div>
            </div>
        </div>
    </div>

    <!-- MODAL catégorie -->
    <div id="modal-cat" class="modal-overlay" style="display:none" onclick="if(event.target===this)closeModal('modal-cat')">
        <div class="modal-box">
            <div class="modal-header"><h3>Nouvelle catégorie</h3><button class="modal-close" onclick="closeModal('modal-cat')">✕</button></div>
            <div class="modal-body">
                <input type="hidden" id="cat-type">
                <div class="input-group"><label>Nom</label><input type="text" id="cat-name" placeholder="Ex: Abonnements"></div>
                <div class="input-group"><label>Icône (emoji)</label><input type="text" id="cat-icon" placeholder="📺" maxlength="4"></div>
                <div class="input-group"><label>Couleur</label><input type="color" id="cat-color" value="#6366f1"></div>
            </div>
            <div class="modal-footer">
                <button class="btn-secondary" onclick="closeModal('modal-cat')">Annuler</button>
                <button class="btn-primary" onclick="saveCategory()">Créer</button>
            </div>
        </div>
    </div>`;
}

function openAddCat(type) {
    document.getElementById('cat-type').value = type;
    document.getElementById('modal-cat').style.display = 'flex';
}
function saveCategory() {
    const name  = document.getElementById('cat-name').value.trim();
    const icon  = document.getElementById('cat-icon').value.trim() || '📦';
    const color = document.getElementById('cat-color').value;
    const type  = document.getElementById('cat-type').value;
    if (!name) { alert('Entrez un nom.'); return; }
    const cats = getCategories();
    cats.push({ id: 'cc' + Date.now(), name, icon, color, type });
    setData('categories', cats);
    closeModal('modal-cat');
    renderSettings();
}
function deleteCat(id) {
    if (!confirm('Supprimer cette catégorie ?')) return;
    setData('categories', getCategories().filter(c=>c.id!==id));
    renderSettings();
}
function saveProfile() {
    setData('email', document.getElementById('s-email').value);
    alert('Profil enregistré ✓');
}
function exportData() {
    const data = {
        transactions: getTransactions(),
        goals: getGoals(),
        upcoming: getUpcoming(),
        categories: getCategories(),
        budgets: getData('budgets', {}),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], {type:'application/json'});
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `pfm-export-${todayStr()}.json`;
    a.click();
}
function resetData() {
    if (!confirm('ATTENTION : toutes les données seront effacées. Continuer ?')) return;
    ['transactions','goals','upcoming','categories','budgets','email'].forEach(k => localStorage.removeItem('pfm_'+k));
    loadDashboardData();
    renderHistory && (histFilter = { type:'all', cat:'all', search:'' });
    alert('Données réinitialisées. Rechargez la page.');
}

// ── Init ──────────────────────────────────────────────────
window.addEventListener('load', () => {
    console.log("%c✅ Application PFM chargée avec succès", "color:#10b981;font-weight:bold");
});