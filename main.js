// Constantes globales
const MONTHS = ['Janvier', 'Fevrier', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Aout', 'Septembre', 'Octobre', 'Novembre', 'Decembre'];
let curYear = 2026;
let curMonth = 3;
let currentChart = null;

// Fonction de connexion
async function login() {
    const username = document.getElementById('loginUsername').value;
    const password = document.getElementById('loginPassword').value;
    const errorDiv = document.getElementById('loginError');
    
    errorDiv.style.display = 'none';
    
    try {
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        
        const data = await response.json();
        
        if (data.success) {
            document.getElementById('loginPage').style.display = 'none';
            document.getElementById('appContainer').style.display = 'block';
            renderMonth();
            loadDashboardData();
        } else {
            errorDiv.textContent = data.message || 'Identifiants incorrects';
            errorDiv.style.display = 'block';
        }
    } catch (error) {
        errorDiv.textContent = 'Erreur de connexion au serveur';
        errorDiv.style.display = 'block';
    }
}

// Fonction de déconnexion
async function logout() {
    await fetch('/api/logout', { method: 'POST' });
    document.getElementById('loginPage').style.display = 'flex';
    document.getElementById('appContainer').style.display = 'none';
}

// Navigation
function switchView(viewId, navEl) {
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    document.getElementById('view-' + viewId).classList.add('active');
    if (navEl) navEl.classList.add('active');
}

// Formatage monétaire
function formatMoney(amount) {
    return amount.toLocaleString('fr-FR') + ' Ar';
}

// Charger les données du dashboard
async function loadDashboardData() {
    try {
        const response = await fetch(`/api/dashboard?year=${curYear}&month=${curMonth + 1}`);
        const data = await response.json();
        
        document.getElementById('kpi-balance').innerHTML = formatMoney(data.netBalance);
        document.getElementById('kpi-income').innerHTML = formatMoney(data.totalIncome);
        document.getElementById('kpi-expense').innerHTML = formatMoney(data.totalExpense);
        document.getElementById('kpi-savings').innerHTML = formatMoney(data.totalSavings);
        
        await loadRecentTransactions();
        await loadExpenseCategories();
        await loadGoals();
        await loadUpcomingExpenses();
    } catch (error) {
        console.error('Erreur chargement dashboard:', error);
    }
}

// Charger les transactions récentes
async function loadRecentTransactions() {
    try {
        const response = await fetch('/api/transactions/recent');
        const transactions = await response.json();
        
        const txList = document.getElementById('tx-list');
        
        if (transactions.length === 0) {
            txList.innerHTML = '<li class="tx-item">Aucune transaction récente</li>';
            return;
        }
        
        txList.innerHTML = transactions.slice(0, 4).map(t => {
            const isIncome = t.type === 'income';
            const amount = Math.abs(t.amount);
            const date = new Date(t.transaction_date);
            const day = date.getDate();
            const month = MONTHS[date.getMonth()].slice(0, 3);
            
            return `
                <li class="tx-item">
                    <div class="tx-icon ${isIncome ? 'tx-icon--income' : 'tx-icon--expense'}">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                            <path d="${isIncome ? 'M12 5v14M5 12l7 7 7-7' : 'M12 19V5M5 12l7-7 7 7'}" stroke="currentColor" stroke-width="2"/>
                        </svg>
                    </div>
                    <div class="tx-info">
                        <span class="tx-label">${escapeHtml(t.description)}</span>
                        <span class="tx-cat">${t.category_name || (isIncome ? 'Revenus' : 'Depenses')}</span>
                    </div>
                    <div class="tx-right">
                        <span class="tx-amount ${isIncome ? 'tx-amount--income' : 'tx-amount--expense'}">
                            ${isIncome ? '+' : '-'} ${formatMoney(amount)}
                        </span>
                        <span class="tx-date">${day} ${month}</span>
                    </div>
                </li>
            `;
        }).join('');
    } catch (error) {
        console.error('Erreur chargement transactions:', error);
        document.getElementById('tx-list').innerHTML = '<li class="tx-item">Erreur de chargement</li>';
    }
}

// Charger les dépenses par catégorie
async function loadExpenseCategories() {
    try {
        const response = await fetch(`/api/expenses/by-category?year=${curYear}&month=${curMonth + 1}`);
        const categories = await response.json();
        
        const legendContainer = document.getElementById('chart-legend');
        
        if (categories.length === 0) {
            legendContainer.innerHTML = '<div class="legend-item">Aucune donnee</div>';
            return;
        }
        
        legendContainer.innerHTML = categories.map(cat => `
            <div class="legend-item">
                <span class="legend-dot" style="background:${cat.color}"></span>
                <span class="legend-name">${cat.name}</span>
                <span class="legend-pct">${cat.percentage}%</span>
            </div>
        `).join('');
        
        const totalExpenses = categories.reduce((sum, cat) => sum + cat.amount, 0);
        document.getElementById('total-expenses').innerHTML = formatMoney(totalExpenses);
        document.getElementById('expense-month').innerHTML = MONTHS[curMonth] + ' ' + curYear;
        
        drawDonutChart(categories);
    } catch (error) {
        console.error('Erreur chargement categories:', error);
    }
}

// Dessiner le graphique en donut
function drawDonutChart(categories) {
    const canvas = document.getElementById('donut-chart');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const cx = 80, cy = 80, outerR = 72, innerR = 50;
    let start = -Math.PI / 2;
    
    ctx.clearRect(0, 0, 160, 160);
    
    const total = categories.reduce((sum, cat) => sum + cat.amount, 0);
    if (total === 0) return;
    
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

// Charger les objectifs d'épargne
async function loadGoals() {
    try {
        const response = await fetch('/api/goals');
        const goals = await response.json();
        
        const goalsContainer = document.getElementById('goals-list');
        
        if (goals.length === 0) {
            goalsContainer.innerHTML = '<div>Aucun objectif</div>';
            return;
        }
        
        goalsContainer.innerHTML = goals.map(goal => {
            const percentage = (goal.current_amount / goal.target_amount * 100).toFixed(1);
            
            return `
                <div>
                    <div class="goal-header">
                        <span class="goal-name">${escapeHtml(goal.name)}</span>
                        <span class="goal-pct">${percentage}%</span>
                    </div>
                    <div class="goal-bar-track">
                        <div class="goal-bar-fill" style="width:${percentage}%;background:#6366f1"></div>
                    </div>
                    <div class="goal-amounts">
                        <span>${formatMoney(goal.current_amount)}</span>
                        <span class="goal-target">/ ${formatMoney(goal.target_amount)}</span>
                    </div>
                </div>
            `;
        }).join('');
    } catch (error) {
        console.error('Erreur chargement objectifs:', error);
    }
}

// Charger les dépenses à venir
async function loadUpcomingExpenses() {
    try {
        const response = await fetch('/api/upcoming');
        const expenses = await response.json();
        
        const upcomingList = document.getElementById('upcoming-list');
        
        if (expenses.length === 0) {
            upcomingList.innerHTML = '<li>Aucune charge a venir</li>';
            return;
        }
        
        upcomingList.innerHTML = expenses.slice(0, 3).map(exp => {
            let iconClass = 'ico--housing';
            if (exp.name.includes('Canal')) iconClass = 'ico--sub';
            if (exp.name.includes('Electricite') || exp.name.includes('JIRAMA')) iconClass = 'ico--utility';
            
            return `
                <li class="upcoming-item">
                    <div class="upcoming-icon ${iconClass}">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                            <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" stroke="currentColor" stroke-width="2"/>
                        </svg>
                    </div>
                    <div class="upcoming-info">
                        <span class="upcoming-name">${escapeHtml(exp.name)}</span>
                        <span class="upcoming-date">Dans ${exp.daysUntil} jour${exp.daysUntil > 1 ? 's' : ''}</span>
                    </div>
                    <span class="upcoming-amount">- ${formatMoney(exp.amount)}</span>
                </li>
            `;
        }).join('');
    } catch (error) {
        console.error('Erreur chargement depenses a venir:', error);
    }
}

// Fonction pour échapper le HTML
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Afficher le mois
function renderMonth() {
    document.getElementById('dash-month').textContent = MONTHS[curMonth] + ' ' + curYear;
    document.getElementById('sidebar-month').textContent = MONTHS[curMonth].slice(0, 3) + ' ' + curYear;
}

// Changer de mois
function changeMonth(delta) {
    curMonth += delta;
    if (curMonth > 11) {
        curMonth = 0;
        curYear++;
    }
    if (curMonth < 0) {
        curMonth = 11;
        curYear--;
    }
    renderMonth();
    loadDashboardData();
}

// Vérifier si l'utilisateur est déjà connecté
async function checkAuth() {
    try {
        const response = await fetch('/api/check-auth');
        const data = await response.json();
        
        if (data.authenticated) {
            document.getElementById('loginPage').style.display = 'none';
            document.getElementById('appContainer').style.display = 'block';
            renderMonth();
            loadDashboardData();
        }
    } catch (error) {
        console.error('Erreur vérification auth:', error);
    }
}

// Initialisation
window.addEventListener('load', () => {
    checkAuth();
});