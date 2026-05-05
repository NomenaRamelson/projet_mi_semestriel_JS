const MONTHS = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
let curYear = 2026;
let curMonth = 3;

const mockUser = {
    username: "Nomena",
    password: "garfilde"
};

let isAuthenticated = false;

async function login() {
    const username = document.getElementById('loginUsername').value.trim();
    const password = document.getElementById('loginPassword').value.trim();
    const errorDiv = document.getElementById('loginError');

    errorDiv.style.display = 'none';

    await new Promise(r => setTimeout(r, 600));

    if (username === mockUser.username && password === mockUser.password) {
        isAuthenticated = true;
        document.getElementById('loginPage').style.display = 'none';
        document.getElementById('appContainer').style.display = 'block';
        
        renderMonth();
        loadDashboardData();
    } else {
        errorDiv.textContent = "Identifiants incorrects";
        errorDiv.style.display = 'block';
    }
}

function logout() {
    isAuthenticated = false;
    document.getElementById('loginPage').style.display = 'flex';
    document.getElementById('appContainer').style.display = 'none';
    document.getElementById('loginPassword').value = '';
}

function switchView(viewId, navEl) {
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    
    document.getElementById('view-' + viewId).classList.add('active');
    if (navEl) navEl.classList.add('active');
}

function formatMoney(amount) {
    return amount.toLocaleString('fr-FR') + ' Ar';
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

async function loadDashboardData() {
    await new Promise(r => setTimeout(r, 400));

    document.getElementById('kpi-balance').textContent = formatMoney(1245000);
    document.getElementById('kpi-income').textContent = formatMoney(850000);
    document.getElementById('kpi-expense').textContent = formatMoney(456000);
    document.getElementById('kpi-savings').textContent = formatMoney(289000);

    await loadRecentTransactions();
    await loadExpenseCategories();
    await loadGoals();
    await loadUpcomingExpenses();
}

// Transactions récentes
async function loadRecentTransactions() {
    const txList = document.getElementById('tx-list');
    txList.innerHTML = `
        <li class="tx-item">
            <div class="tx-icon tx-icon--expense"><svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M12 19V5M5 12l7-7 7 7" stroke="currentColor" stroke-width="2"/></svg></div>
            <div class="tx-info">
                <span class="tx-label">Loyer Maison</span>
                <span class="tx-cat">Logement</span>
            </div>
            <div class="tx-right">
                <span class="tx-amount tx-amount--expense">- 250000 Ar</span>
                <span class="tx-date">03 Avr</span>
            </div>
        </li>
        <li class="tx-item">
            <div class="tx-icon tx-icon--income"><svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12l7 7 7-7" stroke="currentColor" stroke-width="2"/></svg></div>
            <div class="tx-info">
                <span class="tx-label">Salaire</span>
                <span class="tx-cat">Revenus</span>
            </div>
            <div class="tx-right">
                <span class="tx-amount tx-amount--income">+ 650000 Ar</span>
                <span class="tx-date">01 Avr</span>
            </div>
        </li>
    `;
}

// Graphique Donut
async function loadExpenseCategories() {
    const categories = [
        {name: "Logement", amount: 250000, color: "#6366f1", percentage: 55},
        {name: "Nourriture", amount: 98000, color: "#10b981", percentage: 21},
        {name: "Transport", amount: 45000, color: "#f59e0b", percentage: 10},
        {name: "Autres", amount: 63000, color: "#ec4899", percentage: 14}
    ];

    const legendContainer = document.getElementById('chart-legend');
    legendContainer.innerHTML = categories.map(cat => `
        <div class="legend-item">
            <span class="legend-dot" style="background:${cat.color}"></span>
            <span class="legend-name">${cat.name}</span>
            <span class="legend-pct">${cat.percentage}%</span>
        </div>
    `).join('');

    document.getElementById('total-expenses').textContent = formatMoney(456000);
    document.getElementById('expense-month').textContent = MONTHS[curMonth] + ' ' + curYear;

    drawDonutChart(categories);
}

function drawDonutChart(categories) {
    const canvas = document.getElementById('donut-chart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const cx = 80, cy = 80, outerR = 72, innerR = 50;
    let start = -Math.PI / 2;
    const total = categories.reduce((sum, cat) => sum + cat.amount, 0);

    ctx.clearRect(0, 0, 160, 160);

    categories.forEach(cat => {
        const sweep = (cat.amount / total) * 2 * Math.PI;
        ctx.beginPath();
        ctx.arc(cx, cy, outerR, start, start + sweep);
        ctx.arc(cx, cy, innerR, start + sweep, start, true);
        ctx.closePath();
        ctx.fillStyle = cat.color;
        ctx.fill();
        start += sweep;
    });
}

async function loadGoals() {
    const goalsContainer = document.getElementById('goals-list');
    goalsContainer.innerHTML = `
        <div>
            <div class="goal-header"><span class="goal-name">Voyage à Nosy Be</span><span class="goal-pct">68%</span></div>
            <div class="goal-bar-track"><div class="goal-bar-fill" style="width:68%;background:#6366f1"></div></div>
            <div class="goal-amounts"><span>1 360 000 Ar</span><span class="goal-target">/ 2 000 000 Ar</span></div>
        </div>
        <div>
            <div class="goal-header"><span class="goal-name">Nouvelle Moto</span><span class="goal-pct">42%</span></div>
            <div class="goal-bar-track"><div class="goal-bar-fill" style="width:42%;background:#6366f1"></div></div>
            <div class="goal-amounts"><span>840 000 Ar</span><span class="goal-target">/ 2 000 000 Ar</span></div>
        </div>
    `;
}

async function loadUpcomingExpenses() {
    const upcomingList = document.getElementById('upcoming-list');
    upcomingList.innerHTML = `
        <li class="upcoming-item">
            <div class="upcoming-icon ico--utility"><svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" stroke="currentColor" stroke-width="2"/></svg></div>
            <div class="upcoming-info">
                <span class="upcoming-name">JIRAMA - Electricité</span>
                <span class="upcoming-date">Dans 6 jours</span>
            </div>
            <span class="upcoming-amount">- 45 000 Ar</span>
        </li>
    `;
}

function renderMonth() {
    document.getElementById('dash-month').textContent = MONTHS[curMonth] + ' ' + curYear;
    document.getElementById('sidebar-month').textContent = MONTHS[curMonth].slice(0, 3) + ' ' + curYear;
}

function changeMonth(delta) {
    curMonth += delta;
    if (curMonth > 11) { curMonth = 0; curYear++; }
    if (curMonth < 0) { curMonth = 11; curYear--; }
    renderMonth();
    loadDashboardData();
}

window.addEventListener('load', () => {
    // Vérification simple (pas de vrai backend)
    console.log("%c✅ Application PFM chargée avec succès (mode Mock)", "color: #10b981; font-weight: bold");
});